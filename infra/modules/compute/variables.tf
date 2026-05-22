variable "ecs_sg_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS services"
  type        = list(string)
}

variable "backend_tg_arn" {
  description = "ARN of the backend ALB target group"
  type        = string
}

variable "frontend_tg_arn" {
  description = "ARN of the frontend ALB target group"
  type        = string
}

variable "ecr_repository_url" {
  description = "Full ECR repository URL (e.g. 123456.dkr.ecr.eu-west-1.amazonaws.com/converser)"
  type        = string
}

variable "backend_image_tag" {
  description = "Docker image tag for the backend service"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Docker image tag for the frontend service"
  type        = string
  default     = "latest"
}

variable "rds_endpoint" {
  description = "RDS endpoint (host:port format)"
  type        = string
}

variable "rds_port" {
  description = "RDS port number"
  type        = number
}

variable "domain_name" {
  description = "Application domain name"
  type        = string
}

variable "bedrock_model_arn" {
  description = "ARN of the Bedrock model for IAM policy"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}
