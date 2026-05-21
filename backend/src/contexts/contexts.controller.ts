import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContextsService } from './contexts.service';
import { CreateContextDto } from './dto/create-context.dto';
import { UpdateContextDto } from './dto/update-context.dto';

interface JwtRequest {
  user: { sub: string };
}

@ApiTags('contexts')
@Controller('contexts')
export class ContextsController {
  constructor(private readonly contextsService: ContextsService) {}

  @Get()
  findAll(@Request() req: JwtRequest) {
    return this.contextsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.contextsService.findOne(req.user.sub, id);
  }

  @Post()
  create(@Request() req: JwtRequest, @Body() dto: CreateContextDto) {
    return this.contextsService.create(req.user.sub, dto);
  }

  @Patch(':id')
  update(
    @Request() req: JwtRequest,
    @Param('id') id: string,
    @Body() dto: UpdateContextDto,
  ) {
    return this.contextsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.contextsService.remove(req.user.sub, id);
  }
}
