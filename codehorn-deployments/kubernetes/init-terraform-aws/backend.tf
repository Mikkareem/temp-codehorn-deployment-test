terraform {
  backend "s3" {
    bucket = "codehorn-terraform-state"
    key    = "init/state/terraform.tfstate"
    region = "us-east-1"
  }
}
