variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-west-1"
}

variable "vpc_id" {
  description = "VPC ID for the deployment"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB and NAT Gateway"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks and RDS"
  type        = list(string)
}

variable "ecr_repository_url" {
  description = "Full ECR repository URI (e.g. 123456.dkr.ecr.eu-west-1.amazonaws.com/converser)"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "converser.ops.mypassglobal.com"
}

variable "hosted_zone_name" {
  description = "Route 53 hosted zone name"
  type        = string
  default     = "ops.mypassglobal.com"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
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

variable "bedrock_model_arn" {
  description = "ARN of the Bedrock model for IAM policy"
  type        = string
}

variable "db_password" {
  description = "Database password for RDS (set via TF_VAR_db_password or -var)"
  type        = string
  sensitive   = true
}
