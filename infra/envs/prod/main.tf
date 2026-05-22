data "aws_route53_zone" "main" {
  name         = var.hosted_zone_name
  private_zone = false
}

module "secrets" {
  source = "../../modules/secrets"

  environment = "prod"
}

module "dns" {
  source = "../../modules/dns"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name    = var.domain_name
  hosted_zone_id = data.aws_route53_zone.main.zone_id
  alb_dns_name   = module.network.alb_dns_name
  environment    = "prod"
}

module "network" {
  source = "../../modules/network"

  vpc_id             = var.vpc_id
  public_subnet_ids  = var.public_subnet_ids
  private_subnet_ids = var.private_subnet_ids
  certificate_arn    = module.dns.certificate_arn
  environment        = "prod"
}

module "data" {
  source = "../../modules/data"

  private_subnet_ids = var.private_subnet_ids
  rds_sg_id          = module.network.rds_sg_id
  db_instance_class  = var.db_instance_class
  db_password        = var.db_password
  environment        = "prod"
}

module "compute" {
  source = "../../modules/compute"

  ecs_sg_id          = module.network.ecs_sg_id
  private_subnet_ids = var.private_subnet_ids
  backend_tg_arn     = module.network.backend_tg_arn
  frontend_tg_arn    = module.network.frontend_tg_arn
  ecr_repository_url = var.ecr_repository_url
  backend_image_tag  = var.backend_image_tag
  frontend_image_tag = var.frontend_image_tag
  rds_endpoint       = module.data.rds_endpoint
  rds_port           = module.data.rds_port
  domain_name        = var.domain_name
  bedrock_model_arn  = var.bedrock_model_arn
  environment        = "prod"
}
