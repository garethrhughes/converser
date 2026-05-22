resource "aws_security_group" "alb" {
  name        = "converser-alb-${var.environment}"
  description = "Security group for ALB - allows inbound HTTP/HTTPS"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from internet (redirects to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "converser-alb-sg"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_security_group" "ecs" {
  name        = "converser-ecs-${var.environment}"
  description = "Security group for ECS tasks - allows inbound from ALB only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "converser-ecs-sg"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_security_group" "rds" {
  name        = "converser-rds-${var.environment}"
  description = "Security group for RDS - allows inbound from ECS only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from ECS tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "converser-rds-sg"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_lb" "main" {
  name               = "converser-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = {
    Name        = "converser-alb"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "converser-backend-${var.environment}"
  port        = 3001
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "converser-backend-tg"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "converser-frontend-${var.environment}"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name        = "converser-frontend-tg"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  tags = {
    Name        = "converser-https-listener"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name        = "converser-http-listener"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_lb_listener_rule" "backend_api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }

  tags = {
    Name        = "converser-api-rule"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "converser-nat-eip"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = var.public_subnet_ids[0]

  tags = {
    Name        = "converser-nat-gw"
    Environment = var.environment
    Project     = "converser"
  }

  depends_on = [aws_eip.nat]
}

resource "aws_route_table" "private" {
  vpc_id = var.vpc_id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "converser-private-rt"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_route_table_association" "private" {
  for_each = { for idx, subnet_id in var.private_subnet_ids : idx => subnet_id }

  subnet_id      = each.value
  route_table_id = aws_route_table.private.id
}
