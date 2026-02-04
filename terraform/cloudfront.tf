# CloudFront CDN Configuration
# Global content delivery for photos and static assets

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  count = var.environment != "dev" ? 1 : 0

  name                              = "${var.project_name}-oac-${var.environment}"
  description                       = "OAC for ${var.project_name} ${var.environment}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "https-v4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  count = var.environment != "dev" ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} distribution"
  default_root_object = "index.html"

  # Origin for photos S3 bucket
  origin {
    domain_name              = aws_s3_bucket.photos[0].bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main[0].id
    origin_id                = "S3-${aws_s3_bucket.photos[0].id}"

    s3_origin_config {
      origin_access_identity = "" # Use OAC instead
    }
  }

  # Origin for assets S3 bucket
  origin {
    domain_name              = aws_s3_bucket.assets[0].bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main[0].id
    origin_id                = "S3-${aws_s3_bucket.assets[0].id}"

    s3_origin_config {
      origin_access_identity = "" # Use OAC instead
    }
  }

  # Origin for ALB (API)
  origin {
    domain_name = aws_lb.main[0].dns_name
    origin_id   = "ALB-${aws_lb.main[0].id}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2", "TLSv1.3"]
    }
  }

  # Default cache behavior (API - no caching)
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "ALB-${aws_lb.main[0].id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0

    # CloudWatch metrics
    metrics_elb_enabled = var.environment == "production" ? true : false
  }

  # Cache behavior for photos (cached for 24 hours)
  ordered_cache_behavior {
    path_pattern           = "/photos/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.photos[0].id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # Cache behavior for assets (cached for 24 hours)
  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.assets[0].id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400
    default_ttl = 86400
    max_ttl     = 31536000
  }

  # Custom error responses
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  # Price class (use only North America and Europe for cost savings)
  price_class = "PriceClass_100"

  # Restrictions (optional - for geo-blocking)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL Certificate
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main[0].arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Logging
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.backups[0].bucket_domain_name
    prefix          = "cloudfront-logs/"
  }

  tags = {
    Name = "${var.project_name}-cdn-${var.environment}"
  }
}
