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

# Deploy ArgoCD Module
module "argocd" {
  source               = "./modules/argocd"
  node_pool_dependency = google_container_node_pool.primary_nodes.id
  cluster_endpoint     = google_container_cluster.primary.endpoint
  access_token         = data.google_client_config.default.access_token
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

# Deploy GKE Nginx TCP Stream Gateway Module
module "nginx_gateway" {
  source               = "./modules/nginx-gateway"
  node_pool_dependency = google_container_node_pool.primary_nodes.id
  kube_dns_ip          = data.kubernetes_service.kube_dns.spec[0].cluster_ip
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