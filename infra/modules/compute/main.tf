data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  ssm_prefix = "arn:aws:ssm:${local.region}:${local.account_id}:parameter/converser/${var.environment}"
}

# -----------------------------------------------------------------------------
# ECS Cluster
# -----------------------------------------------------------------------------

resource "aws_ecs_cluster" "main" {
  name = "converser-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "converser-ecs-cluster"
    Environment = var.environment
    Project     = "converser"
  }
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/converser-backend"
  retention_in_days = 30

  tags = {
    Name        = "converser-backend-logs"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/converser-frontend"
  retention_in_days = 30

  tags = {
    Name        = "converser-frontend-logs"
    Environment = var.environment
    Project     = "converser"
  }
}

# -----------------------------------------------------------------------------
# IAM — Task Execution Role (shared)
# -----------------------------------------------------------------------------

resource "aws_iam_role" "task_execution" {
  name = "converser-task-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "converser-task-execution-role"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_iam_role_policy_attachment" "task_execution_managed" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "task_execution_ssm" {
  name = "converser-task-execution-ssm"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "${local.ssm_prefix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${local.region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# IAM — Backend Task Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "backend_task" {
  name = "converser-backend-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "converser-backend-task-role"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_iam_role_policy" "backend_task" {
  name = "converser-backend-task-policy"
  role = aws_iam_role.backend_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = var.bedrock_model_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "${local.ssm_prefix}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.backend.arn}:*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# IAM — Frontend Task Role
# -----------------------------------------------------------------------------

resource "aws_iam_role" "frontend_task" {
  name = "converser-frontend-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "converser-frontend-task-role"
    Environment = var.environment
    Project     = "converser"
  }
}

resource "aws_iam_role_policy" "frontend_task" {
  name = "converser-frontend-task-policy"
  role = aws_iam_role.frontend_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.frontend.arn}:*"
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# ECS Task Definition — Backend
# -----------------------------------------------------------------------------

resource "aws_ecs_task_definition" "backend" {
  family                   = "converser-backend-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.backend_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${var.ecr_repository_url}:${var.backend_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3001" },
        { name = "DB_HOST", value = split(":", var.rds_endpoint)[0] },
        { name = "DB_PORT", value = tostring(var.rds_port) },
        { name = "DB_NAME", value = "converser" },
        { name = "DOMAIN_NAME", value = var.domain_name }
      ]

      secrets = [
        { name = "DB_PASSWORD", valueFrom = "${local.ssm_prefix}/db-password" },
        { name = "DB_USERNAME", valueFrom = "${local.ssm_prefix}/db-username" },
        { name = "JWT_SECRET", valueFrom = "${local.ssm_prefix}/jwt-secret" },
        { name = "GOOGLE_CLIENT_ID", valueFrom = "${local.ssm_prefix}/google-client-id" },
        { name = "GOOGLE_CLIENT_SECRET", valueFrom = "${local.ssm_prefix}/google-client-secret" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = local.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "converser-backend-task-def"
    Environment = var.environment
    Project     = "converser"
  }
}

# -----------------------------------------------------------------------------
# ECS Task Definition — Frontend
# -----------------------------------------------------------------------------

resource "aws_ecs_task_definition" "frontend" {
  family                   = "converser-frontend-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.frontend_task.arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${var.ecr_repository_url}:${var.frontend_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "NEXT_PUBLIC_API_URL", value = "https://${var.domain_name}/api" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend.name
          "awslogs-region"        = local.region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name        = "converser-frontend-task-def"
    Environment = var.environment
    Project     = "converser"
  }
}

# -----------------------------------------------------------------------------
# ECS Service — Backend
# -----------------------------------------------------------------------------

resource "aws_ecs_service" "backend" {
  name            = "converser-backend-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.backend_tg_arn
    container_name   = "backend"
    container_port   = 3001
  }

  depends_on = [aws_iam_role_policy.backend_task]

  tags = {
    Name        = "converser-backend-service"
    Environment = var.environment
    Project     = "converser"
  }
}

# -----------------------------------------------------------------------------
# ECS Service — Frontend
# -----------------------------------------------------------------------------

resource "aws_ecs_service" "frontend" {
  name            = "converser-frontend-${var.environment}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_sg_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.frontend_tg_arn
    container_name   = "frontend"
    container_port   = 3000
  }

  depends_on = [aws_iam_role_policy.frontend_task]

  tags = {
    Name        = "converser-frontend-service"
    Environment = var.environment
    Project     = "converser"
  }
}
