# AWS EKS Kubernetes Deployment Guide (Cost-Optimized / Single Public IP Setup)

This document provides details on the architecture, setup requirements, and operations for deploying the **Codehorn** platform onto AWS EKS.

---

## 1. Architectural Overview

To minimize costs, this architecture uses a **public-only subnets topology** without an AWS NAT Gateway (saving ~$32.40/month) and exposes services directly on the EKS worker node using Kubernetes `HostPort` bindings. This restricts the entire footprint to **exactly one public IP address**.

### Key Components:
1. **Networking**: 1 VPC with 2 Public Subnets in different Availability Zones (required by AWS EKS and RDS).
2. **EKS Cluster**: EKS cluster control plane running inside the subnets.
3. **Worker Nodes**: 1 Managed Node Group consisting of a single `t3.medium` instance (2 vCPUs, 4GB RAM) running in the public subnets with a public IP.
4. **Ingress (Nginx Gateway)**: Binds to host ports `80` and `3500` directly on the worker node.
5. **Database (RDS)**: A MySQL 8.0 RDS instance running in the public subnets but with public access disabled. Accessible only internally via EKS security group mappings.
6. **ArgoCD**: Deployed via Helm to manage application synchronizations.

---

## 2. Directory Structure

All AWS Kubernetes and infrastructure assets are organized under:

```
codehorn-deployments/kubernetes/
├── argocd/
│   └── application.yaml       # ArgoCD Application definition (syncs the Helm chart)
├── init-terraform-aws/
│   └── main.tf                # Provisions the restricted deployer IAM Role
└── terraform-aws/
    ├── backend.tf             # Configures the S3 remote backend
    ├── main.tf                # Provisions VPC, Subnets, SG rules, EKS Cluster & RDS
    ├── outputs.tf             # Outputs the node public IP and ArgoCD credentials
    ├── providers.tf           # Configures AWS, Kubernetes, and Helm providers
    └── variables.tf           # Configures cluster name, region, and instance types
```

---

## 3. AWS Deployment Prerequisites & Setup

Configure the following prerequisites before running the deployment workflows:

### Step 1: Create an S3 Bucket for State
1. Create a bucket named `codehorn-terraform-state` in the `us-east-1` region (or your preferred region).
2. Ensure this bucket name matches the backend configs in `init-terraform-aws/backend.tf` and `terraform-aws/backend.tf`.

### Step 2: Create Bootstrap IAM User
1. Create an IAM User (e.g. `github-actions-bootstrap-user`).
2. Attach the following inline policy to grant the user permissions to create the deployer role and manage the S3 state bucket:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "StateBucketManagement",
               "Effect": "Allow",
               "Action": [
                   "s3:GetObject",
                   "s3:PutObject",
                   "s3:DeleteObject",
                   "s3:ListBucket"
               ],
               "Resource": [
                   "arn:aws:s3:::codehorn-terraform-state",
                   "arn:aws:s3:::codehorn-terraform-state/*"
               ]
           },
           {
               "Sid": "IAMRoleManagement",
               "Effect": "Allow",
               "Action": [
                   "iam:CreateRole",
                   "iam:DeleteRole",
                   "iam:GetRole",
                   "iam:PutRolePolicy",
                   "iam:DeleteRolePolicy",
                   "iam:GetRolePolicy",
                   "iam:UpdateRole",
                   "iam:TagRole",
                   "iam:UntagRole"
               ],
               "Resource": "arn:aws:iam::*:role/codehorn-terraform-deployer"
           }
       ]
   }
   ```
3. Generate CLI Access Keys for this user.

### Step 3: Configure GitHub Secrets
Add the following secrets to your GitHub Repository (**Settings -> Secrets and variables -> Actions**):
* `AWS_ACCESS_KEY_ID`: Access Key ID of the bootstrap IAM user.
* `AWS_SECRET_ACCESS_KEY`: Secret Access Key of the bootstrap IAM user.
* `AWS_ACCOUNT_ID`: Your 12-digit AWS Account ID (used to assume the deployment role).
* `AWS_REGION` (Optional Variable): Set to your target region (e.g. `us-east-1`). Defaults to `us-east-1` in workflows if not set.

---

## 4. CI/CD Pipelines (GitHub Actions)

Four workflows manage the AWS infrastructure lifecycle:

1. **AWS Bootstrap Terraform Apply (`aws-bootstrap-terraform-apply.yml`)**:
   * Uses bootstrap credentials to provision the restricted `codehorn-terraform-deployer` role.
2. **AWS Bootstrap Terraform Destroy (`aws-bootstrap-terraform-destroy.yml`)**:
   * Tears down the deployer IAM role.
3. **AWS Terraform Apply (`aws-terraform-apply.yml`)**:
   * Assumes the `codehorn-terraform-deployer` role.
   * Provisions EKS, VPC, Security Rules, Node Group, and RDS.
   * Deploys ArgoCD and the HostPort Nginx Gateway.
   * Outputs the worker node's Public IP (`nginx_url`).
4. **AWS Terraform Destroy (`aws-terraform-destroy.yml`)**:
   * Tears down EKS, VPC, and RDS resources.

---

## 5. Verification and Operating Commands

### Accessing the Consoles:
* **Application Gateway**: Query the public IP from Terraform outputs:
  ```bash
  terraform output nginx_url
  ```
  Access the app in your browser at `http://<nginx_url>`.
* **ArgoCD UI**: Accessible at `http://<nginx_url>:3500`.
* **ArgoCD Credentials**: Fetch the initial admin password:
  ```bash
  terraform output -raw argocd_initial_admin_password
  ```

### Local Syntax Verification:
Always validate configurations locally before committing:
```bash
cd codehorn-deployments/kubernetes/terraform-aws
terraform validate
```
