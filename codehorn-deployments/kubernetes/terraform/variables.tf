variable "project_id" {
  description = "The GCP project ID to deploy GKE into"
  type        = string
  default     = "codehorn-gcp-project"
}

variable "region" {
  description = "The region to deploy resources to"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The zone to deploy resources to"
  type        = string
  default     = "us-central1-a"
}

variable "cluster_name" {
  description = "The name of the GKE cluster"
  type        = string
  default     = "codehorn-gke-cluster"
}

variable "machine_type" {
  description = "The machine type for the cluster node (4-8 cores, 16GB RAM as per spec)"
  type        = string
  default     = "e2-standard-4" # 4 vCPUs, 16 GB memory
}

variable "enable_cloudsql" {
  description = "If true, provisions the GCP Cloud SQL Instance and GKE Auth Proxy"
  type        = bool
  default     = true
}