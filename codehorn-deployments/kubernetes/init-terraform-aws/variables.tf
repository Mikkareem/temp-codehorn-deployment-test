variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "role_name" {
  description = "Name of the deployer IAM role to create"
  type        = string
  default     = "codehorn-terraform-deployer"
}
