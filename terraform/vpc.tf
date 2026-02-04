# VPC and Networking Configuration
# Creates VPC with 3 Availability Zones, public/private/database subnets

# VPC
resource "aws_vpc" "main" {
  count = var.environment != "dev" ? 1 : 0

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc-${var.environment}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  count = var.environment != "dev" ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  tags = {
    Name = "${var.project_name}-igw-${var.environment}"
  }
}

# Public Subnets (3 AZs)
resource "aws_subnet" "public" {
  count = var.environment != "dev" ? 3 : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${var.environment}"
    Type = "public"
  }
}

# Private Subnets (3 AZs) for Application/ECS
resource "aws_subnet" "private" {
  count = var.environment != "dev" ? 3 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${var.environment}"
    Type = "private"
  }
}

# Database Subnets (3 AZs, isolated)
resource "aws_subnet" "database" {
  count = var.environment != "dev" ? 3 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.${count.index + 21}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-database-subnet-${count.index + 1}-${var.environment}"
    Type = "database"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count = var.environment != "dev" ? 1 : 0

  domain = "vpc"

  tags = {
    Name = "${var.project_name}-eip-nat-${var.environment}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (in first AZ)
resource "aws_nat_gateway" "main" {
  count = var.environment != "dev" ? 1 : 0

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${var.project_name}-nat-gateway-${var.environment}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  count = var.environment != "dev" ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = {
    Name = "${var.project_name}-public-rt-${var.environment}"
  }
}

# Private Route Table (via NAT)
resource "aws_route_table" "private" {
  count = var.environment != "dev" ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name = "${var.project_name}-private-rt-${var.environment}"
  }
}

# Database Route Table (isolated, no internet access)
resource "aws_route_table" "database" {
  count = var.environment != "dev" ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  tags = {
    Name = "${var.project_name}-database-rt-${var.environment}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = var.environment != "dev" ? 3 : 0

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table_association" "private" {
  count = var.environment != "dev" ? 3 : 0

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[0].id
}

resource "aws_route_table_association" "database" {
  count = var.environment != "dev" ? 3 : 0

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[0].id
}

# VPC Flow Logs (for security monitoring)
resource "aws_flow_log" "main" {
  count = var.environment != "dev" ? 1 : 0

  vpc_id          = aws_vpc.main[0].id
  traffic_type    = "ALL"
  log_destination = aws_cloudwatch_log_group.flow_logs[0].arn

  tags = {
    Name = "${var.project_name}-vpc-flow-logs-${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.environment != "dev" ? 1 : 0

  name              = "/aws/vpc/flow-logs/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "${var.project_name}-flow-logs-${var.environment}"
  }
}
