variable "project_id" {
  description = "The GCP project ID"
  type        = string
  default     = "codehorn-gcp-project"
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "service_account_id" {
  description = "The ID of the service account to create"
  type        = string
  default     = "codehorn-terraform-deployer"
}
