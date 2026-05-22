import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from '../database/entities/report.entity';
import { Agent } from '../database/entities/agent.entity';
import { Context } from '../database/entities/context.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { Person } from '../database/entities/person.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { BedrockService } from './bedrock.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      Agent,
      Context,
      Conversation,
      ConversationSection,
      Person,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, BedrockService],
  exports: [ReportsService],
})
export class ReportsModule {}
