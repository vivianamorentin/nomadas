# ElastiCache Redis Configuration
# Redis cluster for caching, session storage, and pub/sub

# Subnet Group for Redis
resource "aws_elasticache_subnet_group" "main" {
  count = var.environment != "dev" ? 1 : 0

  name        = "${var.project_name}-redis-subnet-group-${var.environment}"
  description = "Redis subnet group for ${var.project_name}"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-redis-subnet-group-${var.environment}"
  }
}

# Redis Parameter Group (optimized for Redis 7)
resource "aws_elasticache_parameter_group" "main" {
  count = var.environment != "dev" ? 1 : 0

  name   = "${var.project_name}-redis-pg-${var.environment}"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "60"
  }

  parameter {
    name  = "maxmemory-samples"
    value = "5"
  }

  tags = {
    Name = "${var.project_name}-redis-pg-${var.environment}"
  }
}

# Redis Replication Group (Cluster Mode Disabled)
resource "aws_elasticache_replication_group" "main" {
  count = var.environment != "dev" ? 1 : 0

  replication_group_id          = "${var.project_name}-redis-${var.environment}"
  replication_group_description = "Redis cluster for ${var.project_name} ${var.environment}"
  node_type                     = var.redis_node_type
  number_cache_clusters          = var.redis_num_cache_nodes
  engine                        = "redis"
  engine_version                = "7.0"
  port                          = 6379
  parameter_group_name          = aws_elasticache_parameter_group.main[0].name
  subnet_group_name             = aws_elasticache_subnet_group.main[0].name
  security_group_ids            = [aws_security_group.redis.id]

  automatic_failover_enabled    = var.redis_num_cache_nodes >= 3 ? true : false
  multi_az_enabled              = var.redis_num_cache_clusters >= 3 ? true : false

  at_rest_encryption_enabled    = var.environment == "production" ? true : false
  transit_encryption_enabled    = var.environment == "production" ? true : false
  auth_token                    = var.environment == "production" ? var.redis_auth_token : null

  snapshot_retention_limit      = var.environment == "production" ? 7 : 0
  snapshot_window              = "03:00-05:00"
  maintenance_window           = "mon:05:00-mon:06:00"

  auto_minor_version_upgrade   = true

  # CloudWatch monitoring
  cloud_watch_metrics_enabled   = var.environment == "production" ? true : false

  tags = {
    Name = "${var.project_name}-redis-${var.environment}"
  }

  lifecycle {
    ignore_changes = [auth_token]
  }
}

# Random password for Redis (production only)
resource "random_password" "redis" {
  count = var.environment == "production" ? 1 : 0

  length  = 64
  special = false
}

variable "redis_auth_token" {
  description = "Auth token for Redis (production only)"
  type        = string
  sensitive   = true
  default     = null
}
