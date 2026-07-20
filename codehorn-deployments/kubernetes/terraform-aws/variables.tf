variable "region" {
  description = "The AWS region to deploy resources to"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "The name of the EKS cluster"
  type        = string
  default     = "codehorn-eks-cluster"
}

variable "primary_node_instance_type" {
  description = "Instance type for primary node group (2 vCPU, 8GB)"
  type        = string
  default     = "t3.large"
}

variable "enable_rds" {
  description = "If true, provisions the RDS Database"
  type        = bool
  default     = true
}
