# Environment Setup Guide for SPEC-BIZ-001

**Specification:** SPEC-BIZ-001 - Business Profile Management
**Date:** 2026-02-05
**Status:** Environment Configuration Required

---

## Overview

This guide provides step-by-step instructions for configuring the environment variables and external services required for the Business Profile Management feature.

---

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- PostgreSQL 14+ database running
- Redis server running (for geocoding cache)
- AWS account with S3 access (or MinIO for development)
- Google Maps API key

---

## Environment Variables

Create a `.env` file in the `nomadas/` directory with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/nomadas"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="30d"

# Application Configuration
NODE_ENV=development
PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="eu-west-1"
AWS_S3_BUSINESS_PHOTOS_BUCKET="nomadshift-business-photos"
AWS_S3_VERIFICATION_DOCS_BUCKET="nomadshift-verification-docs"

# CDN Configuration
CDN_DOMAIN="https://d1a1a1a1.cloudfront.net"

# Google Maps Configuration
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_URL="redis://localhost:6379"

# Email Configuration (placeholder for future implementation)
EMAIL_SERVICE_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM=

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

---

## Service Configuration

### 1. PostgreSQL Database

#### Local Development

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb nomadas

# Run Prisma migrations
cd nomadas
npx prisma generate
npx prisma migrate deploy
```

#### Production

```bash
# Set DATABASE_URL to your production PostgreSQL instance
# Run migrations
npx prisma migrate deploy
```

---

### 2. Redis (Caching for Geocoding)

#### Local Development

```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Docker (Alternative)

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

#### Production

- Use AWS ElastiCache or Redis Cloud
- Update `REDIS_URL` with production endpoint

---

### 3. AWS S3 (File Storage)

#### Bucket 1: Business Photos (Public)

Create S3 bucket: `nomadshift-business-photos`

```bash
# Using AWS CLI
aws s3 mb s3://nomadshift-business-photos --region eu-west-1

# Enable public access via CDN only
aws s3api put-bucket-policy \
  --bucket nomadshift-business-photos \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {"Service": "cloudfront.amazonaws.com"},
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::nomadshift-business-photos/*"
      }
    ]
  }'

# Enable CORS
aws s3api put-bucket-cors \
  --bucket nomadshift-business-photos \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["PUT", "POST"],
        "AllowedOrigins": ["https://your-frontend-domain.com"],
        "ExposeHeaders": ["ETag"]
      }
    ]
  }'
```

#### Bucket 2: Verification Documents (Private)

Create S3 bucket: `nomadshift-verification-docs`

```bash
# Create bucket with encryption
aws s3 mb s3://nomadshift-verification-docs --region eu-west-1

# Enable default encryption
aws s3api put-bucket-encryption \
  --bucket nomadshift-verification-docs \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket nomadshift-verification-docs \
  --public-access-block-configuration '{
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
  }'
```

#### Development Alternative: MinIO

For local development, you can use MinIO instead of AWS S3:

```bash
# Using Docker
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Set environment variables
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT=http://localhost:9000
```

---

### 4. CloudFront CDN (Optional but Recommended)

Create CloudFront distribution for the business photos bucket:

```bash
# Using AWS CLI
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "nomadshift-business-photos-'$(date +%s)'",
    "Comment": "NomadShift Business Photos CDN",
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-nomadshift-business-photos",
      "ViewerProtocolPolicy": "redirect-to-https",
      "MinTTL": 86400,
      "ForwardedValues": {"QueryString": false}
    },
    "Origins": {
      "Items": [
        {
          "Id": "S3-nomadshift-business-photos",
          "DomainName": "nomadshift-business-photos.s3.eu-west-1.amazonaws.com",
          "S3OriginConfig": {}
        }
      ]
    },
    "Enabled": true
  }'
```

Update `CDN_DOMAIN` with your CloudFront domain: `https://d1a1a1a1.cloudfront.net`

---

### 5. Google Maps API

#### Get API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable "Maps JavaScript API" and "Geocoding API"
4. Create credentials → API Key
5. Restrict API key:
   - Application restrictions: HTTP referrer (your domain)
   - API restrictions: Maps JavaScript API, Geocoding API

#### Set Environment Variable

```bash
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

#### Free Tier Limits

- Geocoding API: 50,000 requests/day free
- Expected usage with Redis caching: ~200 requests/day (80%+ cache hit rate)

---

## Development Setup

### 1. Install Dependencies

```bash
cd nomadas
npm install
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Run Database Migrations

```bash
npx prisma migrate deploy
```

### 4. Start Development Server

```bash
npm run start:dev
```

### 5. Verify Services

```bash
# Check database connection
curl http://localhost:3000/health

# Check Redis connection
redis-cli ping

# Test S3 access
aws s3 ls s3://nomadshift-business-photos
```

---

## Production Deployment

### 1. Environment Variables

Set all environment variables in your production environment (AWS Elastic Beanstalk, Heroku, etc.).

### 2. Run Migrations

```bash
npx prisma migrate deploy
```

### 3. Build Application

```bash
npm run build
```

### 4. Start Production Server

```bash
npm run start:prod
```

---

## Troubleshooting

### Issue: Redis Connection Failed

**Solution:**
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` is correct
- Ensure Redis port (6379) is accessible

### Issue: S3 Presigned URL Failed

**Solution:**
- Verify AWS credentials are correct
- Check bucket exists in correct region
- Ensure bucket CORS configuration is correct
- Verify IAM user has `s3:PutObject` permission

### Issue: Google Maps API Quota Exceeded

**Solution:**
- Check usage in Google Cloud Console
- Implement Redis caching (already configured)
- Consider implementing rate limiting
- Upgrade to paid tier if necessary

### Issue: Prisma Migration Failed

**Solution:**
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database exists: `createdb nomadas`
- Reset database (dev only): `npx prisma migrate reset`

---

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Rotate secrets regularly** (JWT, AWS keys)
3. **Use IAM roles** in production instead of access keys
4. **Enable bucket logging** for S3
5. **Restrict API keys** by domain and IP
6. **Use HTTPS only** in production
7. **Enable CloudTrail** for AWS audit logging

---

## Monitoring and Maintenance

### 1. Monitor S3 Costs

```bash
# Using AWS CLI
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

### 2. Monitor Redis Performance

```bash
redis-cli info stats
redis-cli info memory
```

### 3. Monitor Google Maps Usage

Check Google Cloud Console → APIs & Services → Quotas

### 4. Database Backup

```bash
# Backup PostgreSQL
pg_dump nomadas > backup_$(date +%Y%m%d).sql

# Restore
psql nomadas < backup_20260105.sql
```

---

## Summary

Once all services are configured, you will have:

- ✅ PostgreSQL database with Prisma ORM
- ✅ Redis caching for geocoding (80%+ cache hit rate)
- ✅ AWS S3 for photo and document storage
- ✅ CloudFront CDN for fast photo delivery
- ✅ Google Maps API for address geocoding
- ✅ JWT authentication for API security

---

**Generated:** 2026-02-05
**Author:** DDD Implementation Agent
**Version:** 1.0
