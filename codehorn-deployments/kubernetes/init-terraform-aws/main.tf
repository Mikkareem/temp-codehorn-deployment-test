data "aws_caller_identity" "current" {}

resource "aws_iam_role" "deployer" {
  name = var.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "deployer_policy" {
  name = "codehorn-deployer-policy"
  role = aws_iam_role.deployer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DeployerPermissions"
        Effect = "Allow"
        Action = [
          "ec2:*",
          "eks:*",
          "rds:*",
          "iam:*",
          "s3:*"
        ]
        Resource = "*"
      }
    ]
  })
}
