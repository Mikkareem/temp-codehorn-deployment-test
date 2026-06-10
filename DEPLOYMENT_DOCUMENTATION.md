# Codehorn Kubernetes Deployment Documentation

This document provides a comprehensive guide to the GKE infrastructure, deployment workflows, Nginx Gateway architecture, and service discovery integration for the Codehorn application.

---

## 1. Architecture Overview

The deployment utilizes a secure, production-grade topology on Google Cloud Platform (GCP) and Google Kubernetes Engine (GKE):

```mermaid
graph TD
    User([External User]) -->|Ports 80, 443, 8500| GCP_LB[GCP Network Load Balancer]
    GCP_LB -->|Dynamic NodePorts| Nginx[Nginx Gateway Pod]
    
    subgraph GKE Private Cluster (Private Subnet 10.10.0.0/24)
        Nginx -->|Port 80/443| ArgoCD[ArgoCD Server - ClusterIP]
        Nginx -->|Port 8500| Consul[Consul UI - ClusterIP]
        
        ArgoCD -->|Syncs Manifests| Services[Application Microservices]
        Services -->|Self-Register| Consul
    end
    
    subgraph VPC Networking
        NAT[Cloud NAT & Router] -->|Outbound Egress| Internet((Internet))
        Nodes[GKE Nodes] -->|Outbound traffic| NAT
    end
```

### Key Architectural Pillars:
* **Private Network Isolation**: GKE nodes have no public IP addresses (`enable_private_nodes = true`). They reside entirely within a private subnet (`10.10.0.0/24`).
* **Outbound Internet Egress**: A Cloud NAT Gateway and Router enable private nodes to fetch external dependencies (docker images, helm packages, etc.).
* **Nginx TCP Stream Proxy Gateway**: 
  * Avoids exposing node ports directly to the internet.
  * Runs inside GKE (`nginx-gateway` namespace) and is exposed via a single Kubernetes Service of type `LoadBalancer`.
  * TCP stream-level proxying allows raw TLS/HTTP traffic forwarding to ArgoCD and Consul without needing certificate management at the Nginx layer.
* **ClusterIP for Core Services**: ArgoCD and Consul are deployed with `ClusterIP` service types, making them unreachable directly from outside the cluster except through Nginx.

---

## 2. Directory Structure

All Kubernetes and infrastructure assets are organized under a centralized directory:

```
codehorn-deployments/kubernetes/
├── argocd/
│   └── application.yaml       # ArgoCD Application definition (syncs the Helm chart)
├── helm/
│   ├── Chart.yaml             # Main Helm Chart configuration
│   ├── values.yaml            # Configurable values for all app components & Consul
│   └── templates/             # Kubernetes Service & Deployment templates
├── init-terraform/
│   └── main.tf                # Provisions GCS bucket for Terraform remote state
└── terraform/
    ├── backend.tf             # Configures the GCS remote backend
    ├── main.tf                # Provisions VPC, Subnet, NAT, GKE, ArgoCD & Nginx Gateway
    ├── outputs.tf             # Outputs Nginx Gateway URL and ArgoCD credentials
    ├── providers.tf           # Configures Google, Kubernetes, and Helm providers
    └── variables.tf           # Configures cluster name, region, zone, etc.
```

---

## 3. Terraform Infrastructure Bootstrapping

Terraform handles GKE provisioning and bootstrap software deployment in a precise sequence:

1. **VPC & VPC-Native Subnetting**: Allocates pod and service secondary ranges for VPC-native routing.
2. **Private GKE Control Plane**: GKE Master has a public endpoint with authorized network access allowed, permitting administration from CI/CD runners (GitHub Actions) without requiring a bastion host.
3. **ArgoCD Installation**: Deployed in the `argocd` namespace via `helm_release`.
4. **Nginx Gateway Deployment**: Deployed natively via HCL-declared `kubernetes_*` resources:
   * Mounts the TCP stream configuration proxy pass map from a `kubernetes_config_map`.
   * Provisions a `LoadBalancer` service to trigger a public GCP Network Load Balancer.
5. **Bootstrap Sync**: Executes a `terraform_data` resource running a `local-exec` provisioner. It runs `kubectl apply` for `argocd/application.yaml` during the apply phase.
   * **Note**: Authenticates `kubectl` securely using the cluster endpoint and OAuth token directly, bypassing `gcloud container clusters get-credentials` to prevent permission errors (`container.clusters.get`).

### 3.1. Manual Bootstrap Service Account Setup

Before running the workflows, you must manually create a Bootstrap Service Account (`terraform-bootstrap`) and grant it the necessary administrative permissions to manage the deployment service accounts, keys, and remote state GCS bucket.

Run the following Google Cloud SDK (`gcloud`) commands:

```bash
# Set your active GCP Project ID
YOUR_PROJECT_ID="your-gcp-project-id"

# 1. Create the Bootstrap Service Account
gcloud iam service-accounts create terraform-bootstrap \
    --display-name="Terraform Bootstrap Account"

# 2. Bind IAM SA Admin role (to create/manage deployment service accounts)
gcloud projects add-iam-policy-binding $YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-bootstrap@$YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountAdmin"

# 3. Bind Project IAM Admin role (to assign roles to GKE deployer SAs)
gcloud projects add-iam-policy-binding $YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-bootstrap@$YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/resourcemanager.projectIamAdmin"

# 4. Bind GCS Object Admin role (to read/write state files in codehorn-terraform-state bucket)
gcloud projects add-iam-policy-binding $YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-bootstrap@$YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# 5. Bind IAM SA Key Admin role (to generate deployment SA keys during GHA runs)
gcloud projects add-iam-policy-binding $YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-bootstrap@$YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountKeyAdmin"
```

Once created, export this service account's private JSON key and save it to your GitHub Repository Secrets as `BOOTSTRAP_TERRAFORM_SERVICE_ACCOUNT_JSON`.

---

## 4. Spring Cloud Consul & Service Discovery

Application microservices are configured for Spring Cloud Consul Discovery:

* **Dynamic Injections**: Standard environment variables are injected into application deployment templates:
  * `SPRING_CLOUD_CONSUL_HOST` and `SPRING_CLOUD_CONSUL_PORT` configures service registration targets.
  * `SPRING_CLOUD_CONSUL_DISCOVERY_HOSTNAME` is set dynamically to the service name.
* **Component Toggles**: The Helm template wraps Consul injection inside a `.Values.consul.enabled` conditional check. If Consul is disabled:
  * Injects `SPRING_CLOUD_CONSUL_ENABLED: "false"` to prevent Spring Boot startup connection failures.
* **Readiness Probes (Language Execution Services)**: 
  * C++, Java, Python, and Javascript execution services include sidecar docker daemons (Dind).
  * A `readinessProbe` is configured to run `docker image inspect <runner-image>` verifying that the required compile/execute runner images are fully loaded on the Docker daemon before marking the pod as ready and allowing it to register with Consul.

---

## 5. CI/CD Pipelines (GitHub Actions)

Four workflows manage the infrastructure and deployment lifecycle:

1. **Bootstrap Terraform Apply (`bootstrap-terraform-apply.yml`)**:
   * Provisions the deployment Service Account (`codehorn-terraform-deployer`) and binds the necessary project-level GCP IAM roles for infrastructure management:
     * `roles/compute.networkAdmin`: To configure VPC, Subnets, Cloud Router, and Cloud NAT.
     * `roles/compute.securityAdmin`: To configure GKE-internal and external firewall policies.
     * `roles/container.admin`: For full GKE cluster provisioning and control.
     * `roles/iam.serviceAccountUser`: To assign runtime service accounts to GKE node pools.
     * `roles/storage.objectAdmin`: To store deployment states securely in the GCS bucket.
   * Executed once during the initial project setup.
2. **Bootstrap Terraform Destroy (`bootstrap-terraform-destroy.yml`)**:
   * Tears down the deployment Service Account and its IAM bindings.
3. **Terraform Apply (`terraform-apply.yml`)**:
   * Generates a temporary GKE Deployer key.
   * Runs `terraform init`, `terraform plan`, and `terraform apply` in the `codehorn-deployments/kubernetes/terraform` working directory.
   * Retrieves the `nginx_url` output from Terraform.
   * Validates access by executing a loop that pings `nginx_url` over HTTP (port 80) using `curl -s -f` until the ArgoCD UI is accessible.
4. **Terraform Destroy (`terraform-destroy.yml`)**:
   * Tears down GKE, VPC, Router, NAT, and Nginx Gateway resources.

### Required GitHub Secrets & Variables:
* **Secrets**:
  * `BOOTSTRAP_TERRAFORM_SERVICE_ACCOUNT_JSON`: Credentials for the Terraform bootstrap account.
* **Variables**:
  * `GCP_PROJECT_ID`: The target Google Cloud Project ID.

---

## 6. Verification and Operating Commands

### Accessing the Consoles:
* **ArgoCD UI**: Query the LoadBalancer IP from Terraform outputs:
  ```bash
  terraform output nginx_url
  ```
  Access it in your browser at `http://<load_balancer_ip>`.
* **ArgoCD Credentials**: Fetch the initial admin password:
  ```bash
  terraform output -raw argocd_initial_admin_password
  ```
* **Consul UI**: Accessible at `http://<load_balancer_ip>:8500`.

### Local Syntax Verification:
Always validate configurations locally before committing:
```bash
# Validate Terraform syntax
cd codehorn-deployments/kubernetes/terraform
terraform validate

# Lint Helm charts
cd ../helm
helm lint .
```
