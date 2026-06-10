output "gke_node_ips" {
  value = flatten([
    for node in data.kubernetes_nodes.gke_nodes.nodes : [
      for address in node.status[0].addresses : {
        type    = address.type
        address = address.address
      }
    ]
    if lookup(node.metadata[0].labels, "nodeports-open", "false") == "true"
  ])
  description = "IP addresses of the GKE Cluster Node with NodePorts open"
}

output "argocd_http_nodeport" {
  value       = 30080
  description = "The NodePort configured for HTTP access to Argo CD"
}

output "argocd_https_nodeport" {
  value       = 30443
  description = "The NodePort configured for HTTPS access to Argo CD"
}

output "argocd_initial_admin_password" {
  value       = data.kubernetes_secret.argocd_initial_admin_secret.data["password"]
  description = "Decoded initial admin password for Argo CD UI"
  sensitive   = true
}
