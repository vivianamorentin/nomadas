# Outputs for NomadShift Infrastructure

output "vpc_id" {
  description = "ID of the VPC"
  value       = try(aws_vpc.main[0].id, null)
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = try(aws_vpc.main[0].cidr_block, null)
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = try(aws_subnet.public[*].id, null)
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = try(aws_subnet.private[*].id, null)
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = try(aws_subnet.database[*].id, null)
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = try(aws_db_instance.main.endpoint, null)
  sensitive   = true
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = try(aws_db_instance.main.id, null)
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = try(aws_elasticache_replication_group.main[0].primary_endpoint_address, null)
}

output "s3_bucket_photos" {
  description = "S3 bucket name for photos"
  value       = try(aws_s3_bucket.photos.id, null)
}

output "s3_bucket_assets" {
  description = "S3 bucket name for static assets"
  value       = try(aws_s3_bucket.assets.id, null)
}

output "s3_bucket_backups" {
  description = "S3 bucket name for backups"
  value       = try(aws_s3_bucket.backups.id, null)
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = try(aws_cloudfront_distribution.main.id, null)
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = try(aws_cloudfront_distribution.main.domain_name, null)
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = try(aws_lb.main.dns_name, null)
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = try(aws_lb.main.zone_id, null)
}

output "ecs_cluster_id" {
  description = "ECS Cluster ID"
  value       = try(aws_ecs_cluster.main.id, null)
}

output "ecs_cluster_name" {
  description = "ECS Cluster name"
  value       = try(aws_ecs_cluster.main.name, null)
}

output "acm_certificate_arn" {
  description = "ACM Certificate ARN"
  value       = try(aws_acm_certificate.main[0].arn, null)
}

output "route53_zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = try(aws_route53_zone.main[0].id, null)
}

output "security_group_app_id" {
  description = "Security Group ID for application"
  value       = try(aws_security_group.app.id, null)
}

output "security_group_db_id" {
  description = "Security Group ID for database"
  value       = try(aws_security_group.database.id, null)
}

output "security_group_redis_id" {
  description = "Security Group ID for Redis"
  value       = try(aws_security_group.redis.id, null)
}
