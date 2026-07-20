variable "node_pool_dependency" {
  description = "Dependency to ensure nodes are ready before namespace creation"
  type        = any
}

variable "cluster_endpoint" {
  description = "GKE Cluster Endpoint"
  type        = string
}

variable "access_token" {
  description = "Access token for GKE authentication"
  type        = string
}
