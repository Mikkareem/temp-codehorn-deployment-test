# Deploy ArgoCD namespace
resource "kubernetes_namespace" "argocd" {
  depends_on = [var.node_pool_dependency]

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
  depends_on = [var.node_pool_dependency]
}

# Deploy Argo CD Application via kubectl in local-exec to avoid plan-time REST client errors
resource "terraform_data" "argocd_application" {
  depends_on = [helm_release.argocd]

  input = filemd5("${path.module}/../../../argocd/application.yaml")

  provisioner "local-exec" {
    command = <<EOT
      kubectl --server="https://${var.cluster_endpoint}" --token="${var.access_token}" --insecure-skip-tls-verify=true apply -f ${path.module}/../../../argocd/application.yaml
    EOT
  }
}
