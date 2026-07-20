terraform {
  backend "s3" {
    bucket = "codehorn-terraform-state"
    key    = "eks/state/terraform.tfstate"
    region = "us-east-1"
  }
}
