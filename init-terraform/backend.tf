terraform {
  backend "gcs" {
    bucket = "codehorn-terraform-state"
    prefix = "init/state"
  }
}
