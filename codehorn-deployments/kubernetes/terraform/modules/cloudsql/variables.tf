variable "project_id" {
  type        = string
  description = "The GCP project ID"
}

variable "region" {
  type        = string
  description = "The GCP region"
}

variable "cluster_name" {
  type        = string
  description = "The GKE cluster name"
}

variable "node_pool_dependency" {
  type        = any
  description = "Dependency to ensure nodes are ready before namespace and secrets creation"
  default     = null
}
