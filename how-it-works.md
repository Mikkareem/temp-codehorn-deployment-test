
# Codehorn Deployment

### Tiers
  - FrontEnd (React / NextJs)
  - BackEnd (Microservices)
  - Databases (Database Per Service)

### Services
  - Application Services
    - Problems Service
    - Contest Service
    - Daily Challenge Service
    - CodeSubmission Service
    - CodeExecution Service (Stateless) -> Highly Scalable
      - Execution Services
        - CPP Execution Service
        - Java Execution Service
        - Python Execution Service
        - Javascript Execution Service
  - Helper Services
    - Gateway Service
    - Auth Server
    - Consul Service (Service Discovery)
    - Config Server
    - Docker Daemon 
      - Docker in Docker (DinD)
      - For Each Execution Service

## Deployment Methods
  - Docker Compose
  - Kubernetes

## Kubernetes Deployment
  - Helm Chart Templates
  - Argo CD Deployment
  - Grafana Monitoring (OpenTelemetry) - Alloy Setup
    - Traces - ....
    - Logs - Loki
  - Terraform
    - Cluster Management

## GCP Kubernetes Cluster (GKE)
  - 1+1 Node (Standard Cluster, No AutoPilot)
  - Node Specification: 4-8 Cores, Upto 16GB RAM


### Argo CD Deployment
  - Application
    - Source:
      - Github Repository: https://github.com/user/codehorn-app
      - Values File Path from Root: "/deployments/kubernetes/helm/values.yaml"
    - Destination:
      - Server: https://kubernetes.default.svc
      - Namespace: codehorn-app
    - SyncPolicy:
      - Automated:
        - prune: true
        - selfHeal: true
      - SyncOptions
        - CreateNamespace=true