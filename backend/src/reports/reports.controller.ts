import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';

interface JwtRequest {
  user: { sub: string };
}

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(@Request() req: JwtRequest, @Body() dto: GenerateReportDto) {
    return this.reportsService.generate(req.user.sub, dto);
  }

  @Get()
  findAll(@Request() req: JwtRequest) {
    return this.reportsService.findAll(req.user.sub);
  }

  @Get('person/:personId')
  findByPerson(@Request() req: JwtRequest, @Param('personId') personId: string) {
    return this.reportsService.findByPerson(req.user.sub, personId);
  }

  @Get(':id')
  findOne(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.reportsService.findOne(req.user.sub, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.reportsService.remove(req.user.sub, id);
  }
}
