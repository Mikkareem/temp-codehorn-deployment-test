output "nginx_url" {
  value       = kubernetes_service.nginx.status[0].load_balancer[0].ingress[0].ip
  description = "The external IP of the Nginx TCP Gateway"
}
