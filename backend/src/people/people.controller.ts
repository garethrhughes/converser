import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PeopleService } from './people.service';
import { MemoryService } from './memory.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdateMemoryDto } from './dto/update-memory.dto';

interface JwtRequest {
  user: { sub: string };
}

@ApiTags('people')
@Controller('people')
export class PeopleController {
  constructor(
    private readonly peopleService: PeopleService,
    private readonly memoryService: MemoryService,
  ) {}

  @Get()
  findAll(@Request() req: JwtRequest) {
    return this.peopleService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.peopleService.findOne(req.user.sub, id);
  }

  @Post()
  create(@Request() req: JwtRequest, @Body() dto: CreatePersonDto) {
    return this.peopleService.create(req.user.sub, dto);
  }

  @Patch(':id')
  update(
    @Request() req: JwtRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.peopleService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.peopleService.remove(req.user.sub, id);
  }

  // --- Memory sub-routes ---

  @Get(':personId/memories')
  findMemories(@Request() req: JwtRequest, @Param('personId') personId: string) {
    return this.memoryService.findAllForPerson(req.user.sub, personId);
  }

  @Patch(':personId/memories/:memoryId')
  updateMemory(
    @Request() req: JwtRequest,
    @Param('personId') personId: string,
    @Param('memoryId') memoryId: string,
    @Body() dto: UpdateMemoryDto,
  ) {
    return this.memoryService.update(req.user.sub, personId, memoryId, dto);
  }

  @Delete(':personId/memories/:memoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMemory(
    @Request() req: JwtRequest,
    @Param('personId') personId: string,
    @Param('memoryId') memoryId: string,
  ) {
    return this.memoryService.remove(req.user.sub, personId, memoryId);
  }
}
