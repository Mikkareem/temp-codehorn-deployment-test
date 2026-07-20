variable "cluster_name" {
  type        = string
  description = "The cluster name prefix for resources"
}

variable "vpc_id" {
  type        = string
  description = "VPC ID"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Private Subnet IDs for RDS Subnet Group"
}

variable "node_pool_dependency" {
  type        = any
  description = "Dependency to ensure EKS Node Group is ready before applying Kubernetes manifests"
}

variable "eks_security_group_id" {
  type        = string
  description = "Security Group ID of the EKS node group / cluster"
}
