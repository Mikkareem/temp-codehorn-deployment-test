output "connection_name" {
  value       = google_sql_database_instance.mysql_instance.connection_name
  description = "The connection name of the Cloud SQL instance"
}

output "proxy_service_dns" {
  value       = "cloudsql-proxy-service.sql-proxy.svc.cluster.local"
  description = "The internal DNS name of the Cloud SQL Auth Proxy service inside the cluster"
}
