import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { ImportConversationDto } from './dto/import-conversation.dto';

interface JwtRequest {
  user: { sub: string };
}

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  findAll(@Request() req: JwtRequest) {
    return this.conversationsService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.conversationsService.findOne(req.user.sub, id);
  }

  @Post('import')
  importFromGoogleDocs(
    @Request() req: JwtRequest,
    @Body() dto: ImportConversationDto,
  ) {
    return this.conversationsService.importFromGoogleDocs(req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Request() req: JwtRequest, @Param('id') id: string) {
    return this.conversationsService.remove(req.user.sub, id);
  }
}
