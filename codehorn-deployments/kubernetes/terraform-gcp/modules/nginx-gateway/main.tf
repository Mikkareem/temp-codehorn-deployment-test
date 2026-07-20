# Create nginx-gateway namespace
resource "kubernetes_namespace" "nginx_gateway" {
  depends_on = [var.node_pool_dependency]

  metadata {
    name = "nginx-gateway"
  }
}

# Create Nginx ConfigMap for TCP Stream Proxy
resource "kubernetes_config_map" "nginx_config" {
  metadata {
    name      = "nginx-config"
    namespace = kubernetes_namespace.nginx_gateway.metadata[0].name
  }

  data = {
    "nginx.conf" = <<EOT
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

stream {
    log_format basic '$remote_addr [$time_local] '
                     '$protocol $status $bytes_sent $bytes_received '
                     '$session_time "$upstream_addr"';

    access_log /dev/stdout basic;

    resolver ${var.kube_dns_ip} valid=10s;

    map $remote_addr $app_gateway {
        default codehorn-app-nginx.codehorn-app.svc.cluster.local:80;
    }
    map $remote_addr $argocd_http {
        default argocd-server.argocd.svc.cluster.local:80;
    }

    server {
        listen 80;
        proxy_pass $app_gateway;
    }
    server {
        listen 3500;
        proxy_pass $argocd_http;
    }
}
EOT
  }
}

# Create Nginx Deployment
resource "kubernetes_deployment" "nginx" {
  metadata {
    name      = "nginx-gateway"
    namespace = kubernetes_namespace.nginx_gateway.metadata[0].name
    labels = {
      app = "nginx-gateway"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "nginx-gateway"
      }
    }

    template {
      metadata {
        labels = {
          app = "nginx-gateway"
        }
      }

      spec {
        container {
          name  = "nginx"
          image = "nginx:alpine"

          port {
            name           = "app"
            container_port = 80
          }

          port {
            name           = "argocd"
            container_port = 3500
          }

          volume_mount {
            name       = "config-volume"
            mount_path = "/etc/nginx/nginx.conf"
            sub_path   = "nginx.conf"
          }
        }

        volume {
          name = "config-volume"
          config_map {
            name = kubernetes_config_map.nginx_config.metadata[0].name
          }
        }
      }
    }
  }
}

# Create Nginx LoadBalancer Service
resource "kubernetes_service" "nginx" {
  metadata {
    name      = "nginx-gateway"
    namespace = kubernetes_namespace.nginx_gateway.metadata[0].name
  }

  spec {
    type = "LoadBalancer"

    selector = {
      app = "nginx-gateway"
    }

    port {
      name        = "app"
      port        = 80
      target_port = 80
    }

    port {
      name        = "argocd"
      port        = 3500
      target_port = 3500
    }
  }
}
