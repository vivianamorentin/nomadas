# Variables for NomadShift Infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "nomadas"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "nomadshift.eu"
}

variable "enable_dns" {
  description = "Enable Route 53 DNS configuration"
  type        = bool
  default     = false
}

# Database variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"

  validation {
    condition     = can(regex("^db.t[23]", var.db_instance_class))
    error_message = "DB instance class must be a valid t2 or t3 instance."
  }
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS in GB"
  type        = number
  default     = 20

  validation {
    condition     = var.db_allocated_storage >= 20 && var.db_allocated_storage <= 100
    error_message = "DB allocated storage must be between 20 and 100 GB."
  }
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

variable "db_read_replica_count" {
  description = "Number of read replicas for RDS"
  type        = number
  default     = 1

  validation {
    condition     = var.db_read_replica_count >= 0 && var.db_read_replica_count <= 3
    error_message = "Read replica count must be between 0 and 3."
  }
}

# Redis variables
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"

  validation {
    condition     = can(regex("^cache.t[23]", var.redis_node_type))
    error_message = "Redis node type must be a valid t2 or t3 cache instance."
  }
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes for Redis"
  type        = number
  default     = 1

  validation {
    condition     = var.redis_num_cache_nodes >= 1 && var.redis_num_cache_nodes <= 6
    error_message = "Redis cache node count must be between 1 and 6."
  }
}

# ECS variables
variable "ecs_instance_type" {
  description = "EC2 instance type for ECS"
  type        = string
  default     = "t3.medium"
}

variable "ecs_min_instances" {
  description = "Minimum number of ECS instances"
  type        = number
  default     = 2
}

variable "ecs_max_instances" {
  description = "Maximum number of ECS instances"
  type        = number
  default     = 20
}

# Application variables
variable "app_container_port" {
  description = "Container port for the application"
  type        = number
  default     = 3000
}

variable "app_health_check_path" {
  description = "Health check path for the application"
  type        = string
  default     = "/health"
}
