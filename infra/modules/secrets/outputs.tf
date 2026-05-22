output "parameter_arns" {
  description = "Map of parameter name to ARN"
  value       = { for k, v in aws_ssm_parameter.secrets : k => v.arn }
}

output "parameter_names" {
  description = "Map of parameter key to full SSM path"
  value       = { for k, v in aws_ssm_parameter.secrets : k => v.name }
}
