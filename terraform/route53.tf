# Route 53 and SSL Configuration
# DNS management and SSL certificates

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  count = var.environment != "dev" && var.enable_dns ? 1 : 0

  name = var.domain_name

  tags = {
    Name = "${var.project_name}-hosted-zone-${var.environment}"
  }
}

# ACM Certificate
resource "aws_acm_certificate" "main" {
  count = var.environment != "dev" ? 1 : 0

  domain_name       = var.enable_dns ? var.domain_name : "${var.project_name}-${var.environment}.elb.${var.aws_region}.amazonaws.com"
  validation_method = var.enable_dns ? "DNS" : "EMAIL"

  subject_alternative_names = var.enable_dns ? [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "www.${var.domain_name}"
  ] : []

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-certificate-${var.environment}"
  }
}

# DNS Validation Records
resource "aws_route53_record" "cert_validation" {
  count = var.environment != "dev" && var.enable_dns ? length(aws_acm_certificate.main[0].domain_validation_options) : 0

  zone_id = aws_route53_zone.main[0].id
  name    = aws_acm_certificate.main[0].domain_validation_options[count.index].resource_record_name
  type    = aws_acm_certificate.main[0].domain_validation_options[count.index].resource_record_type
  records = [
    aws_acm_certificate.main[0].domain_validation_options[count.index].resource_record_value
  ]
  ttl     = 60
}

# ACM Certificate Validation
resource "aws_acm_certificate_validation" "main" {
  count = var.environment != "dev" && var.enable_dns ? 1 : 0

  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = aws_route53_record.cert_validation[*].fqdn
}

# A Record for API
resource "aws_route53_record" "api" {
  count = var.environment != "dev" && var.enable_dns ? 1 : 0

  zone_id = aws_route53_zone.main[0].id
  name    = "api"
  type    = "A"

  alias {
    name                   = aws_lb.main[0].dns_name
    zone_id                = aws_lb.main[0].zone_id
    evaluate_target_health = true
  }
}

# A Record for CloudFront
resource "aws_route53_record" "cdn" {
  count = var.environment != "dev" && var.enable_dns ? 1 : 0

  zone_id = aws_route53_zone.main[0].id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main[0].domain_name
    zone_id                = aws_cloudfront_distribution.main[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# Health Check
resource "aws_route53_health_check" "main" {
  count = var.environment != "dev" && var.enable_dns ? 1 : 0

  fqdn              = "api.${var.domain_name}"
  port              = 443
  type              = "HTTPS"
  resource_path     = var.app_health_check_path
  request_interval  = 30
  failure_threshold = 3

  tags = {
    Name = "${var.project_name}-health-check-${var.environment}"
  }
}

# CloudWatch Alarm for Health Check
resource "aws_cloudwatch_metric_alarm" "health_check" {
  count = var.environment != "dev" && var.enable_dns ? 1 : 0

  alarm_name          = "${var.project_name}-health-check-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "This metric monitors health check for ${var.project_name}"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts[0].arn] : null

  dimensions = {
    HealthCheckId = aws_route53_health_check.main[0].id
  }

  tags = {
    Name = "${var.project_name}-health-alarm-${var.environment}"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  count = var.environment == "production" ? 1 : 0

  name = "${var.project_name}-alerts-${var.environment}"

  tags = {
    Name = "${var.project_name}-alerts-${var.environment}"
  }
}

# SNS Topic Subscription (email)
resource "aws_sns_topic_subscription" "alerts_email" {
  count = var.environment == "production" ? 1 : 0

  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

variable "alert_email" {
  description = "Email address for alerts (production only)"
  type        = string
  default     = "alerts@nomadshift.eu"
}
