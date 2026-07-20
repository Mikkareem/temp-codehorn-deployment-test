output "nginx_url" {
  value       = data.aws_instances.eks_nodes.public_ips[0]
  description = "The Public IP of the EKS worker node hosting the Nginx Gateway"
}

output "argocd_initial_admin_password" {
  value       = module.argocd.argocd_initial_admin_password
  sensitive   = true
  description = "The initial admin password for Argo CD"
}
