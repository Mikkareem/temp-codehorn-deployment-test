resource "google_service_account" "deployer" {
  account_id   = var.service_account_id
  display_name = "Codehorn Terraform Deployment Service Account"
}

# Minimum GKE & Network provisioning roles
variable "deployer_roles" {
  type = list(string)
  default = [
    "roles/compute.networkAdmin",
    "roles/compute.securityAdmin",
    "roles/container.admin",
    "roles/iam.serviceAccountUser",
    "roles/storage.objectAdmin",
    "roles/cloudsql.admin",
    "roles/iam.serviceAccountAdmin"
  ]
}

resource "google_project_iam_member" "deployer_bindings" {
  for_each = toset(var.deployer_roles)
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.deployer.email}"
}
