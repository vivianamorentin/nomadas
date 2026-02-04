# Secrets Manager Configuration
# Secure storage for sensitive configuration

# Database URL Secret
resource "aws_secretsmanager_secret" "database_url" {
  count = var.environment != "dev" ? 1 : 0

  name = "${var.project_name}/database-url-${var.environment}"

  description = "Database connection URL for ${var.project_name} ${var.environment}"

  tags = {
    Name = "${var.project_name}-database-url-${var.environment}"
  }
}

resource "aws_secretsmanager_secret_version" "database_url" {
  count = var.environment != "dev" ? 1 : 0

  secret_id = aws_secretsmanager_secret.database_url[0].id

  secret_string = jsonencode({
    engine   = "postgres"
    host     = aws_db_instance.main[0].endpoint
    port     = 5432
    username = "nomadas_admin"
    password = var.db_password
    dbname   = "nomadas"
    ssl      = true
  })
}

# Redis URL Secret
resource "aws_secretsmanager_secret" "redis_url" {
  count = var.environment != "dev" ? 1 : 0

  name = "${var.project_name}/redis-url-${var.environment}"

  description = "Redis connection URL for ${var.project_name} ${var.environment}"

  tags = {
    Name = "${var.project_name}-redis-url-${var.environment}"
  }
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  count = var.environment != "dev" ? 1 : 0

  secret_id = aws_secretsmanager_secret.redis_url[0].id

  secret_string = jsonencode({
    host     = aws_elasticache_replication_group.main[0].primary_endpoint_address
    port     = 6379
    password = var.environment == "production" ? var.redis_auth_token : ""
    tls      = var.environment == "production" ? true : false
  })
}

# JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  count = var.environment != "dev" ? 1 : 0

  name = "${var.project_name}/jwt-secret-${var.environment}"

  description = "JWT secret for ${var.project_name} ${var.environment}"

  tags = {
    Name = "${var.project_name}-jwt-secret-${var.environment}"
  }
}

resource "random_password" "jwt" {
  count = var.environment != "dev" ? 1 : 0

  length  = 64
  special = true
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  count = var.environment != "dev" ? 1 : 0

  secret_id = aws_secretsmanager_secret.jwt_secret[0].id

  secret_string = jsonencode({
    secret = random_password.jwt[0].result
  })
}

# S3 Presigned URL Secret
resource "aws_secretsmanager_secret" "s3_presigned" {
  count = var.environment != "dev" ? 1 : 0

  name = "${var.project_name}/s3-presigned-${var.environment}"

  description = "S3 access keys for presigned URLs"

  tags = {
    Name = "${var.project_name}-s3-presigned-${var.environment}"
  }
}

resource "aws_secretsmanager_secret_version" "s3_presigned" {
  count = var.environment != "dev" ? 1 : 0

  secret_id = aws_secretsmanager_secret.s3_presigned[0].id

  secret_string = jsonencode({
    access_key_id     = var.s3_access_key_id
    secret_access_key = var.s3_secret_access_key
    region            = var.aws_region
  })
}

variable "s3_access_key_id" {
  description = "AWS Access Key ID for S3 presigned URLs"
  type        = string
  sensitive   = true
  default     = null
}

variable "s3_secret_access_key" {
  description = "AWS Secret Access Key for S3 presigned URLs"
  type        = string
  sensitive   = true
  default     = null
}
