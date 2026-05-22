locals {
  parameters = {
    "db-password"                = "CHANGE_ME"
    "jwt-secret"                 = "CHANGE_ME"
    "google-client-id"           = "CHANGE_ME"
    "google-client-secret"       = "CHANGE_ME"
    "google-token-encryption-key" = "CHANGE_ME"
    "bedrock-api-key"            = "CHANGE_ME"
  }
}

resource "aws_ssm_parameter" "secrets" {
  for_each = local.parameters

  name  = "/converser/${var.environment}/${each.key}"
  type  = "SecureString"
  value = each.value

  tags = {
    Name        = "converser-${each.key}"
    Environment = var.environment
    Project     = "converser"
  }

  lifecycle {
    ignore_changes = [value]
  }
}
