import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { ConnectFirefliesDto } from './dto/connect-fireflies.dto';
import { ImportFirefliesDto } from './dto/import-fireflies.dto';

interface JwtRequest {
  user: { sub: string };
}

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('fireflies')
  @HttpCode(HttpStatus.CREATED)
  async connectFireflies(
    @Request() req: JwtRequest,
    @Body() dto: ConnectFirefliesDto,
  ) {
    await this.integrationsService.connectFireflies(req.user.sub, dto.apiKey);
    return { message: 'Fireflies connected successfully' };
  }

  @Delete('fireflies')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectFireflies(@Request() req: JwtRequest) {
    await this.integrationsService.disconnectFireflies(req.user.sub);
  }

  @Get('fireflies/status')
  getFirefliesStatus(@Request() req: JwtRequest) {
    return this.integrationsService.getFirefliesStatus(req.user.sub);
  }

  @Get('fireflies/meetings')
  listFirefliesMeetings(
    @Request() req: JwtRequest,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('fromDate') fromDate?: string,
  ) {
    return this.integrationsService.listFirefliesMeetings(req.user.sub, {
      limit,
      skip,
      fromDate,
    });
  }

  @Post('fireflies/import')
  @HttpCode(HttpStatus.CREATED)
  importFromFireflies(
    @Request() req: JwtRequest,
    @Body() dto: ImportFirefliesDto,
  ) {
    return this.integrationsService.importFromFireflies(req.user.sub, dto);
  }
}
