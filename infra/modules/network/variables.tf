variable "vpc_id" {
  description = "VPC ID for all network resources"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB and NAT Gateway"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for route table associations"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}
