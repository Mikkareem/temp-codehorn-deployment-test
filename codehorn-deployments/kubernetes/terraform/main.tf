# Create VPC
resource "google_compute_network" "vpc" {
  name                    = "${var.cluster_name}-vpc"
  auto_create_subnetworks = false
}

# Create Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "${var.cluster_name}-subnet"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.10.0.0/24"

  secondary_ip_range {
    range_name    = "k8s-pod-range"
    ip_cidr_range = "10.20.0.0/16"
  }

  secondary_ip_range {
    range_name    = "k8s-service-range"
    ip_cidr_range = "10.30.0.0/16"
  }
}

# Create Standard GKE Cluster (No AutoPilot)
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.zone

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

  remove_default_node_pool = true
  initial_node_count       = 1

  # Disable deletion protection to allow Terraform destroy
  deletion_protection = false

  ip_allocation_policy {
    cluster_secondary_range_name  = "k8s-pod-range"
    services_secondary_range_name = "k8s-service-range"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }
}

# Create Custom Node Pool (1 Node, e2-standard-4)
resource "google_container_node_pool" "primary_nodes" {
  name       = "${var.cluster_name}-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    preemptible  = false
    machine_type = var.machine_type
    image_type   = "UBUNTU_CONTAINERD"
    disk_type    = "pd-standard"
    disk_size_gb = 40
    
    labels = {
      role = "general"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/service.management.readonly",
      "https://www.googleapis.com/auth/trace.append"
    ]
  }
}

# Create Secondary Node Pool (1 Node, e2-medium)
resource "google_container_node_pool" "secondary_nodes" {
  name       = "${var.cluster_name}-secondary-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = 1

  node_config {
    preemptible  = false
    machine_type = "e2-medium"
    image_type   = "UBUNTU_CONTAINERD"
    disk_type    = "pd-standard"
    disk_size_gb = 40

    labels = {
      role = "general"
    }

    oauth_scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/service.management.readonly",
      "https://www.googleapis.com/auth/trace.append"
    ]
  }
}

# Deploy ArgoCD namespace
resource "kubernetes_namespace" "argocd" {
  depends_on = [google_container_node_pool.primary_nodes]

  metadata {
    name = "argocd"
  }
}

# Install Argo CD using Helm
resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "6.7.18"
  namespace  = kubernetes_namespace.argocd.metadata[0].name

  wait = true

  #values = [
  #  yamlencode({
  #    global = {
  #      nodeSelector = {
  #        "nodeports-open" = "true"
  #      }
  #    }
  #  })
  #]
}

# Fetch the initial admin secret created by Argo CD installation
data "kubernetes_secret" "argocd_initial_admin_secret" {
  depends_on = [helm_release.argocd]

  metadata {
    name      = "argocd-initial-admin-secret"
    namespace = kubernetes_namespace.argocd.metadata[0].name
  }
}

# Fetch GKE cluster nodes to extract Node IP
data "kubernetes_nodes" "gke_nodes" {
  depends_on = [google_container_node_pool.primary_nodes]
}

# Deploy Argo CD Application via kubectl in local-exec to avoid plan-time REST client errors
resource "terraform_data" "argocd_application" {
  depends_on = [helm_release.argocd]

  input = filemd5("${path.module}/../argocd/application.yaml")

  provisioner "local-exec" {
    command = <<EOT
      kubectl --server="https://${google_container_cluster.primary.endpoint}" --token="${data.google_client_config.default.access_token}" --insecure-skip-tls-verify=true apply -f ${path.module}/../argocd/application.yaml
    EOT
  }
}

# Create Cloud Router for NAT
resource "google_compute_router" "router" {
  name    = "${var.cluster_name}-router"
  region  = var.region
  network = google_compute_network.vpc.name
}

# Create Cloud NAT to allow private nodes to reach the internet
resource "google_compute_router_nat" "nat" {
  name                               = "${var.cluster_name}-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

data "kubernetes_service" "kube_dns" {
  depends_on = [google_container_node_pool.primary_nodes]
  metadata {
    name      = "kube-dns"
    namespace = "kube-system"
  }
}

# Create nginx-gateway namespace
resource "kubernetes_namespace" "nginx_gateway" {
  depends_on = [google_container_node_pool.primary_nodes]

  metadata {
    name = "nginx-gateway"
  }
}

# Create Nginx ConfigMap for TCP Stream Proxy
resource "kubernetes_config_map" "nginx_config" {
  metadata {
    name      = "nginx-config"
    namespace = kubernetes_namespace.nginx_gateway.metadata[0].name
  }

  data = {
    "nginx.conf" = <<EOT
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

stream {
    log_format basic '$remote_addr [$time_local] '
                     '$protocol $status $bytes_sent $bytes_received '
                     '$session_time "$upstream_addr"';

    access_log /dev/stdout basic;

    resolver ${data.kubernetes_service.kube_dns.spec[0].cluster_ip} valid=10s;

    map $remote_addr $argocd_http {
        default argocd-server.argocd.svc.cluster.local:80;
    }
    map $remote_addr $argocd_https {
        default argocd-server.argocd.svc.cluster.local:443;
    }
    map $remote_addr $consul_backend {
        default codehorn-app-consul.codehorn-app.svc.cluster.local:8500;
    }

    server {
        listen 80;
        proxy_pass $argocd_http;
    }
    server {
        listen 443;
        proxy_pass $argocd_https;
    }
    server {
        listen 8500;
        proxy_pass $consul_backend;
    }
}
EOT
  }
}

# Create Nginx Deployment
resource "kubernetes_deployment" "nginx" {
  metadata {
    name      = "nginx-gateway"
    namespace = kubernetes_namespace.nginx_gateway.metadata[0].name
    labels = {
      app = "nginx-gateway"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "nginx-gateway"
      }
    }

    template {
      metadata {
        labels = {
          app = "nginx-gateway"
        }
      }

      spec {
        container {
          name  = "nginx"
          image = "nginx:alpine"

          port {
            name           = "http"
            container_port = 80
          }

          port {
            name           = "https"
            container_port = 443
          }

          port {
            name           = "consul"
            container_port = 8500
          }

          volume_mount {
            name       = "config-volume"
            mount_path = "/etc/nginx/nginx.conf"
            sub_path   = "nginx.conf"
          }
        }

        volume {
          name = "config-volume"
          config_map {
            name = kubernetes_config_map.nginx_config.metadata[0].name
          }
        }
      }
    }
  }
}

# Create Nginx LoadBalancer Service (without specifying nodePorts)
resource "kubernetes_service" "nginx" {
  metadata {
    name      = "nginx-gateway"
    namespace = kubernetes_namespace.nginx_gateway.metadata[0].name
  }

  spec {
    type = "LoadBalancer"

    selector = {
      app = "nginx-gateway"
    }

    port {
      name        = "http"
      port        = 80
      target_port = 80
    }

    port {
      name        = "https"
      port        = 443
      target_port = 443
    }

    port {
      name        = "consul"
      port        = 8500
      target_port = 8500
    }
  }
}

# Deploy Cloud SQL and Standalone Proxy Module
module "cloudsql" {
  source       = "./modules/cloudsql"
  count        = var.enable_cloudsql ? 1 : 0
  project_id   = var.project_id
  region       = var.region
  cluster_name = var.cluster_name
  
  # Ensure GKE node pool is active before provisioning K8s namespaces/resources in the module
  node_pool_dependency = google_container_node_pool.primary_nodes.id
}