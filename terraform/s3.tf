# S3 Buckets Configuration
# Storage for photos, assets, and backups

# S3 Bucket for User/Profile Photos
resource "aws_s3_bucket" "photos" {
  count = var.environment != "dev" ? 1 : 0

  bucket = "${var.project_name}-photos-${var.environment}"

  tags = {
    Name = "${var.project_name}-photos-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "photos" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.photos[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "photos" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.photos[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "photos" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.photos[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for photos (move old versions to Glacier)
resource "aws_s3_bucket_lifecycle_configuration" "photos" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.photos[0].id

  rule {
    id     = "photos-lifecycle"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket for Static Assets
resource "aws_s3_bucket" "assets" {
  count = var.environment != "dev" ? 1 : 0

  bucket = "${var.project_name}-assets-${var.environment}"

  tags = {
    Name = "${var.project_name}-assets-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.assets[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.assets[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.assets[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket for Backups
resource "aws_s3_bucket" "backups" {
  count = var.environment != "dev" ? 1 : 0

  bucket = "${var.project_name}-backups-${var.environment}"

  tags = {
    Name = "${var.project_name}-backups-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for backups (move to Glacier after 30 days)
resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.backups[0].id

  rule {
    id     = "backups-lifecycle"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    transition {
      days          = 90
      storage_class = "DEEP_ARCHIVE"
    }

    expiration {
      days = 365
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# S3 Bucket Policy for CloudFront access (photos)
resource "aws_s3_bucket_policy" "photos_cloudfront" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.photos[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.photos[0].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}

# S3 Bucket Policy for CloudFront access (assets)
resource "aws_s3_bucket_policy" "assets_cloudfront" {
  count = var.environment != "dev" ? 1 : 0

  bucket = aws_s3_bucket.assets[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontAccess"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.assets[0].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      }
    ]
  })
}
