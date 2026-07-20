output "argocd_initial_admin_password" {
  value       = data.kubernetes_secret.argocd_initial_admin_secret.data["password"]
  sensitive   = true
  description = "The initial admin password for Argo CD"
}
