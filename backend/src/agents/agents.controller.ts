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
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

interface JwtRequest {
  user: { sub: string };
}

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  findAll(@Request() req: JwtRequest) {
    return this.agentsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.agentsService.findOne(req.user.sub, id);
  }

  @Post()
  create(@Request() req: JwtRequest, @Body() dto: CreateAgentDto) {
    return this.agentsService.create(req.user.sub, dto);
  }

  @Patch(':id')
  update(
    @Request() req: JwtRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agentsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.agentsService.remove(req.user.sub, id);
  }
}
