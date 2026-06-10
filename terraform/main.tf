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
}

# Create Firewall Rule to allow NodePorts from outside
resource "google_compute_firewall" "allow_nodeport" {
  name    = "${var.cluster_name}-allow-nodeport"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["30080", "30443", "30500"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["gke-node-nodeport"]
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
      role             = "general"
      "nodeports-open" = "true"
    }

    tags = ["gke-node-nodeport"]

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

  set {
    name  = "server.service.type"
    value = "NodePort"
  }

  set {
    name  = "server.service.nodePort.http"
    value = "30080"
  }

  set {
    name  = "server.service.nodePort.https"
    value = "30443"
  }

  set {
    name  = "global.nodeSelector.nodeports-open"
    value = "true"
  }
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
      gcloud container clusters get-credentials ${google_container_cluster.primary.name} --zone ${google_container_cluster.primary.location} --project ${var.project_id}
      kubectl apply -f ${path.module}/../argocd/application.yaml
    EOT
  }
}