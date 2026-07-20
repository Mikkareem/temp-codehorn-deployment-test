variable "node_pool_dependency" {
  description = "Dependency on EKS node group to ensure EKS is up before provisioning helm/k8s"
  type        = any
}

variable "kube_dns_ip" {
  description = "IP address of the Kubernetes DNS service (CoreDNS)"
  type        = string
}
