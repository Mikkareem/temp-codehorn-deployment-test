# Create Cloud SQL Instance (MySQL 8.0)
resource "google_sql_database_instance" "mysql_instance" {
  name             = "${var.cluster_name}-mysql-db"
  database_version = "MYSQL_8_0"
  region           = var.region

  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled = true
    }
  }

  deletion_protection = false
}

# Create Google Service Account for Cloud SQL Proxy
resource "google_service_account" "cloudsql_proxy" {
  account_id   = "${var.cluster_name}-sql-proxy"
  display_name = "Cloud SQL Proxy Service Account"
}

# Grant Cloud SQL Client role to SQL Proxy Service Account
resource "google_project_iam_member" "cloudsql_proxy_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloudsql_proxy.email}"
}

# Generate Service Account Key
resource "google_service_account_key" "cloudsql_proxy_key" {
  service_account_id = google_service_account.cloudsql_proxy.name
}

# Create a separate Kubernetes namespace for the SQL proxy
resource "kubernetes_namespace" "sql_proxy" {
  depends_on = [var.node_pool_dependency]

  metadata {
    name = "sql-proxy"
  }
}

# Save Service Account Key as a Kubernetes Secret
resource "kubernetes_secret" "cloudsql_proxy_credentials" {
  metadata {
    name      = "cloudsql-instance-credentials"
    namespace = kubernetes_namespace.sql_proxy.metadata[0].name
  }

  data = {
    "credentials.json" = base64decode(google_service_account_key.cloudsql_proxy_key.private_key)
  }

  type = "Opaque"
}

# Deploy Standalone Cloud SQL Auth Proxy
resource "kubernetes_deployment" "cloudsql_proxy" {
  metadata {
    name      = "cloudsql-proxy"
    namespace = kubernetes_namespace.sql_proxy.metadata[0].name
    labels = {
      app = "cloudsql-proxy"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "cloudsql-proxy"
      }
    }

    template {
      metadata {
        labels = {
          app = "cloudsql-proxy"
        }
      }

      spec {
        container {
          name  = "cloudsql-proxy"
          image = "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.11.0"
          
          command = [
            "/cloud-sql-proxy",
            "--address", "0.0.0.0",
            "--port", "3306",
            "--credentials-file", "/secrets/cloudsql/credentials.json",
            google_sql_database_instance.mysql_instance.connection_name
          ]

          port {
            name           = "mysql"
            container_port = 3306
          }

          volume_mount {
            name       = "credentials-volume"
            mount_path = "/secrets/cloudsql"
            read_only  = true
          }
        }

        volume {
          name = "credentials-volume"
          secret {
            secret_name = kubernetes_secret.cloudsql_proxy_credentials.metadata[0].name
          }
        }
      }
    }
  }
}

# Expose Standalone Proxy as a Service inside the cluster
resource "kubernetes_service" "cloudsql_proxy" {
  metadata {
    name      = "cloudsql-proxy-service"
    namespace = kubernetes_namespace.sql_proxy.metadata[0].name
  }

  spec {
    type = "ClusterIP"
    
    port {
      port        = 3306
      target_port = 3306
      protocol    = "TCP"
    }

    selector = {
      app = "cloudsql-proxy"
    }
  }
}
