
## Bootstrap Service Account

Google Cloud Storage Bucket: codehorn-terraform-state

### Required Roles

    - **roles/iam.serviceAccountAdmin** (Create/manage service accounts)
    - **roles/resourcemanager.projectIamAdmin** (Grant and assign project-level IAM roles)
    - **roles/storage.objectAdmin** (Store state to GCS Bucket)
    

1) **Create the Bootstrap Service Account (eg: terraform-bootstrap)**

```
gcloud iam service-accounts create terraform-bootstrap --display-name="Terraform Bootstrap Account"
```

2) **Grant the Required Roles** to the bootstrap account

```
YOUR_PROJECT_ID=oiieurowieuroiweurwuytiuwyrewr

# Bind IAM SA Admin role
gcloud projects add-iam-policy-binding $YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-bootstrap@$YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountAdmin"

# Bind Project IAM Admin role
gcloud projects add-iam-policy-binding $YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-bootstrap@$YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/resourcemanager.projectIamAdmin"

# Bind GCS Object Admin role (for state storage)
gcloud projects add-iam-policy-binding $YOUR_PROJECT_ID \
    --member="serviceAccount:terraform-bootstrap@$YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```



## Github Secrets

    - BOOTSTRAP_TERRAFORM_SERVICE_ACCOUNT_JSON
    - MAIN_PROJECT_SERVICE_ACCOUNT_JSON

## Github Variables
    - GCP_PROJECT_ID