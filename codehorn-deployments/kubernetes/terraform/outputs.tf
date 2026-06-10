output "nginx_url" {
  value       = kubernetes_service.nginx.status[0].load_balancer[0].ingress[0].ip
  description = "The external IP of the Nginx TCP Gateway"
}

output "argocd_initial_admin_password" {
  value       = data.kubernetes_secret.argocd_initial_admin_secret.data["password"]
  description = "Decoded initial admin password for Argo CD UI"
  sensitive   = true
}
