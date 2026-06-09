terraform {
  backend "gcs" {
    bucket = "codehorn-terraform-state"
    prefix = "gke/state"
  }
}
