variable "node_pool_dependency" {
  description = "A dummy dependency to ensure GKE node pool is ready before K8s resources are provisioned"
  type        = string
}

variable "kube_dns_ip" {
  description = "The cluster IP of the kube-dns service used as resolver"
  type        = string
}
