# RDS PostgreSQL Configuration
# Multi-AZ deployment with read replicas for high availability

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  count = var.environment != "dev" ? 1 : 0

  name       = "${var.project_name}-db-subnet-group-${var.environment}"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group-${var.environment}"
  }
}

# Database Parameter Group (optimized for PostgreSQL 14+)
resource "aws_db_parameter_group" "main" {
  count = var.environment != "dev" ? 1 : 0

  name   = "${var.project_name}-db-pg-${var.environment}"
  family = "postgres14"

  parameter {
    name  = "shared_buffers"
    value = "{${DBInstanceClassMemory/32768}}"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{${DBInstanceClassMemory/2}}"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "{DBInstanceClassMemory/16384}"
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  parameter {
    name  = "wal_buffers"
    value = "16MB"
  }

  parameter {
    name  = "default_statistics_target"
    value = "100"
  }

  parameter {
    name  = "random_page_cost"
    value = "1.1"
  }

  parameter {
    name  = "effective_io_concurrency"
    value = "200"
  }

  parameter {
    name  = "work_mem"
    value = "{DBInstanceClassMemory/2621}"
  }

  parameter {
    name  = "min_wal_size"
    value = "1GB"
  }

  parameter {
    name  = "max_wal_size"
    value = "4GB"
  }

  parameter {
    name  = "max_worker_processes"
    value = "4"
  }

  parameter {
    name  = "max_parallel_workers_per_gather"
    value = "2"
  }

  parameter {
    name  = "max_parallel_workers"
    value = "4"
  }

  parameter {
    name  = "max_parallel_maintenance_workers"
    value = "2"
  }

  tags = {
    Name = "${var.project_name}-db-pg-${var.environment}"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  count = var.environment != "dev" ? 1 : 0

  identifier             = "${var.project_name}-db-${var.environment}"
  engine                 = "postgres"
  engine_version         = "14.11"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  max_allocated_storage  = var.db_max_allocated_storage
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id             = var.environment == "production" ? aws_kms_key.database[0].arn : null

  db_name  = "nomadas"
  username = "nomadas_admin"
  password = var.db_password

  port     = 5432

  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  vpc_security_group_ids = [aws_security_group.database.id]
  parameter_group_name   = aws_db_parameter_group.main[0].name

  multi_az               = var.db_multi_az
  availability_zone      = data.aws_availability_zones.available.names[0]

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  final_snapshot_identifier = "${var.project_name}-db-final-${var.environment}"
  skip_final_snapshot       = var.environment == "dev" ? true : false
  delete_automated_backups  = var.environment == "dev" ? true : false

  performance_insights_enabled = var.environment == "production" ? true : false
  monitoring_interval         = var.environment == "production" ? 60 : 0
  monitoring_role_arn         = var.environment == "production" ? aws_iam_role.rds_monitoring[0].arn : null

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  copy_tags_to_snapshot = true

  tags = {
    Name = "${var.project_name}-db-${var.environment}"
  }

  lifecycle {
    ignore_changes = [password]
  }
}

# Read Replicas
resource "aws_db_instance" "read_replica" {
  count = var.environment != "dev" && var.db_read_replica_count > 0 ? var.db_read_replica_count : 0

  identifier             = "${var.project_name}-db-replica-${count.index + 1}-${var.environment}"
  replicate_source_db    = aws_db_instance.main[0].identifier
  instance_class         = var.db_instance_class

  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  vpc_security_group_ids = [aws_security_group.database.id]
  parameter_group_name   = aws_db_parameter_group.main[0].name

  availability_zone      = data.aws_availability_zones.available.names[(count.index + 1) % 3]

  backup_retention_period = 0
  skip_final_snapshot     = true

  performance_insights_enabled = false
  monitoring_interval         = 0

  tags = {
    Name = "${var.project_name}-db-replica-${count.index + 1}-${var.environment}"
  }

  lifecycle {
    ignore_changes = [password]
  }
}

# KMS Key for database encryption (production only)
resource "aws_kms_key" "database" {
  count = var.environment == "production" ? 1 : 0

  description = "${var.project_name}-database-${var.environment}"
  key_usage  = "ENCRYPT_DECRYPT"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Access"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-db-kms-${var.environment}"
  }
}

# IAM Role for RDS monitoring (production only)
resource "aws_iam_role" "rds_monitoring" {
  count = var.environment == "production" ? 1 : 0

  name = "${var.project_name}-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-rds-monitoring-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.environment == "production" ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Random password for database (development only)
resource "random_password" "db" {
  count = var.environment == "dev" ? 1 : 0

  length  = 32
  special = true
}

variable "db_password" {
  description = "Master password for RDS instance (use SSM Parameter Store in production)"
  type        = string
  sensitive   = true
  default     = null
}
