# NomadShift Platform - AWS Infrastructure

This Terraform configuration provisions the complete AWS infrastructure for the NomadShift platform.

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with billing enabled
- (Optional) Registered domain name for production

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Configure Variables

Copy the example variables file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 3. Plan Infrastructure

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

## Architecture Overview

### Network (VPC)
- **VPC**: 10.0.0.0/16 CIDR block
- **3 Availability Zones** in eu-central-1 (Frankfurt)
- **Public Subnets**: 10.0.1-3.0/24 (ALB, NAT Gateway)
- **Private Subnets**: 10.0.11-13.0/24 (ECS, Application)
- **Database Subnets**: 10.0.21-23.0/24 (RDS, isolated)

### Compute (ECS)
- **ECS Cluster**: Fargate-based
- **Auto-scaling**: 2-20 instances (CPU/Memory-based)
- **Task Definition**: 1 vCPU, 2GB RAM per task
- **ALB**: Application Load Balancer with HTTPS

### Database (RDS PostgreSQL)
- **Instance**: db.t3.medium (Multi-AZ)
- **Version**: PostgreSQL 14+
- **Storage**: 20GB auto-scaling to 100GB
- **Read Replicas**: 1 (optional up to 3)
- **Backups**: 7-day retention (dev), 30-day (production)

### Cache (ElastiCache Redis)
- **Instance**: cache.t3.medium
- **Version**: Redis 7+
- **Nodes**: 1 (dev), 3+ with Multi-AZ (production)
- **Encryption**: At rest and in transit (production)

### Storage (S3)
- **Photos Bucket**: User and profile photos
- **Assets Bucket**: Static assets
- **Backups Bucket**: Database backups and logs
- **CloudFront CDN**: Global content delivery

### Security
- **Security Groups**: Network isolation by tier
- **KMS Encryption**: Database encryption (production)
- **Secrets Manager**: Sensitive configuration
- **SSL/TLS**: ACM certificates via Route 53

## Cost Estimation (Monthly)

### Development Environment
- ECS (t3.medium x2): ~$50
- RDS (db.t3.medium): ~$100
- ElastiCache (cache.t3.medium): ~$30
- S3 + CloudFront: ~$20
- **Total: ~$200/month**

### Production Environment
- ECS (2-20 instances): ~$200-800
- RDS Multi-AZ: ~$300-500
- ElastiCache: ~$100-150
- S3 + CloudFront: ~$50-150
- ALB + Data Transfer: ~$100-200
- **Total: ~$750-1,800/month**

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `environment` | Environment name | `dev` |
| `aws_region` | AWS region | `eu-central-1` |
| `domain_name` | Domain name | `nomadshift.eu` |
| `db_instance_class` | RDS instance type | `db.t3.medium` |
| `redis_node_type` | ElastiCache instance type | `cache.t3.medium` |
| `ecs_min_instances` | Minimum ECS instances | `2` |
| `ecs_max_instances` | Maximum ECS instances | `20` |

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC ID
- `rds_endpoint`: Database endpoint
- `redis_endpoint`: Redis endpoint
- `s3_bucket_photos`: S3 bucket for photos
- `cloudfront_domain_name`: CloudFront distribution domain
- `alb_dns_name`: Load balancer DNS name

## State Management

Terraform state is stored in S3 with DynamoDB locking:

- **State Bucket**: `nomadas-terraform-state`
- **Lock Table**: `nomadas-terraform-locks`

## Maintenance

### Updating Infrastructure

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

### Destroying Infrastructure

**⚠️ WARNING**: This will destroy all resources!

```bash
terraform destroy
```

### Backup and Restore

Database backups are automated:
- Development: 7-day retention
- Production: 30-day retention

Manual snapshots can be created via AWS Console.

## Monitoring

CloudWatch Alarms configured:
- High CPU usage (>80%)
- High memory usage (>85%)
- High error rate (>5%)
- Health check failures

Alerts sent via SNS to configured email.

## Security Best Practices

1. **Never commit `terraform.tfvars`** to version control
2. **Use AWS Secrets Manager** for sensitive values
3. **Enable MFA** on AWS root account
4. **Rotate credentials** regularly
5. **Use separate AWS accounts** for dev/staging/production

## Troubleshooting

### Common Issues

**1. State Lock Timeout**
```bash
# Force unlock if absolutely necessary
terraform force-unlock <LOCK_ID>
```

**2. Credential Issues**
```bash
# Verify AWS credentials
aws sts get-caller-identity
```

**3. Resource Limits**
```bash
# Check service limits in AWS Console
# Request limit increase if needed
```

## Support

For issues or questions:
- GitHub Issues: [project-url]
- Email: devops@nomadshift.eu

## License

Copyright © 2026 NomadShift Platform. All rights reserved.
