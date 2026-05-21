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
import { PeopleService } from './people.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

interface JwtRequest {
  user: { sub: string };
}

@ApiTags('people')
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

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
}
