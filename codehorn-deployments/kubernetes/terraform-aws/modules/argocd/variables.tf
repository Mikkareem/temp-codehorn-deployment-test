variable "node_pool_dependency" {
  description = "Dependency on EKS node group to ensure EKS is up before provisioning helm/k8s"
  type        = any
}

variable "cluster_endpoint" {
  description = "EKS cluster API server endpoint"
  type        = string
}

variable "access_token" {
  description = "EKS cluster authentication token"
  type        = string
}
