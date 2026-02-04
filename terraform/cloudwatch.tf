# CloudWatch Logs and Monitoring
# Logging and monitoring configuration

# CloudWatch Log Group for Application
resource "aws_cloudwatch_log_group" "app" {
  count = var.environment != "dev" ? 1 : 0

  name              = "/aws/ecs/${var.project_name}-${var.environment}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-logs-${var.environment}"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  count = var.environment != "dev" ? 1 : 0

  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", aws_ecs_service.main[0].name, "ClusterName", aws_ecs_cluster.main[0].name],
            [".", "MemoryUtilization", ".", ".", ".", "."],
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main[0].arn_suffix],
            [".", "TargetResponseTime", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Application Metrics"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.main[0].id],
            [".", "DatabaseConnections", ".", "."],
            [".", "FreeStorageSpace", ".", "."],
            ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", aws_elasticache_replication_group.main[0].id]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Database and Cache Metrics"
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          logGroupName = aws_cloudwatch_log_group.app[0].name
          region       = var.aws_region
          title        = "Application Logs"
          view         = "table"
        }
      }
    ]
  })
}

# CloudWatch Alarm: High CPU
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count = var.environment != "dev" ? 1 : 0

  alarm_name          = "${var.project_name}-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts[0].arn] : null

  dimensions = {
    ServiceName = aws_ecs_service.main[0].name
    ClusterName = aws_ecs_cluster.main[0].name
  }

  tags = {
    Name = "${var.project_name}-high-cpu-${var.environment}"
  }
}

# CloudWatch Alarm: High Memory
resource "aws_cloudwatch_metric_alarm" "high_memory" {
  count = var.environment != "dev" ? 1 : 0

  alarm_name          = "${var.project_name}-high-memory-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors ECS memory utilization"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts[0].arn] : null

  dimensions = {
    ServiceName = aws_ecs_service.main[0].name
    ClusterName = aws_ecs_cluster.main[0].name
  }

  tags = {
    Name = "${var.project_name}-high-memory-${var.environment}"
  }
}

# CloudWatch Alarm: High Error Rate
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  count = var.environment != "dev" ? 1 : 0

  alarm_name          = "${var.project_name}-high-error-rate-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "This metric monitors ALB 5XX error rate"
  alarm_actions       = var.environment == "production" ? [aws_sns_topic.alerts[0].arn] : null

  dimensions = {
    LoadBalancer = aws_lb.main[0].arn_suffix
  }

  tags = {
    Name = "${var.project_name}-high-error-rate-${var.environment}"
  }
}
