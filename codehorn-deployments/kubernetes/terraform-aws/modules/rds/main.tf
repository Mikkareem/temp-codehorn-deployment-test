# Create DB Subnet Group
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "${var.cluster_name}-rds-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${var.cluster_name}-rds-subnet-group"
  }
}

# Create RDS Security Group
resource "aws_security_group" "rds_sg" {
  name        = "${var.cluster_name}-rds-sg"
  description = "Allow inbound traffic from EKS node group to MySQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MySQL from EKS"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.eks_security_group_id]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${var.cluster_name}-rds-sg"
  }
}

# Create RDS Instance
resource "aws_db_instance" "mysql" {
  identifier             = "${var.cluster_name}-mysql-db"
  allocated_storage      = 20
  db_name                = "codehorn"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  username               = "dbadmin"
  password               = "codehornpass123" # Simple dummy pass for demonstration
  parameter_group_name   = "default.mysql8.0"
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
}

# Create Namespace for Database access representation (matching GCP naming)
resource "kubernetes_namespace" "sql_proxy" {
  depends_on = [var.node_pool_dependency]

  metadata {
    name = "sql-proxy"
  }
}

# Create Kubernetes ExternalName Service to map cloudsql-proxy-service to RDS DNS Name
resource "kubernetes_service" "rds_external" {
  metadata {
    name      = "cloudsql-proxy-service"
    namespace = kubernetes_namespace.sql_proxy.metadata[0].name
  }

  spec {
    type          = "ExternalName"
    external_name = aws_db_instance.mysql.address
  }
}
