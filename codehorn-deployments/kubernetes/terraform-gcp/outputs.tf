output "nginx_url" {
  value       = module.nginx_gateway.nginx_url
  description = "The external IP of the Nginx TCP Gateway"
}

output "argocd_initial_admin_password" {
  value       = module.argocd.argocd_initial_admin_password
  description = "Decoded initial admin password for Argo CD UI"
  sensitive   = true
}

output "cloudsql_connection_name" {
  value       = var.enable_cloudsql ? module.cloudsql[0].connection_name : null
  description = "The connection name of the Cloud SQL instance (if enabled)"
}

output "cloudsql_proxy_service_dns" {
  value       = var.enable_cloudsql ? module.cloudsql[0].proxy_service_dns : null
  description = "The internal DNS name of the Cloud SQL Auth Proxy service inside the cluster (if enabled)"
}