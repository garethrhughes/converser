import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from '../database/entities/report.entity';
import { Agent } from '../database/entities/agent.entity';
import { Context } from '../database/entities/context.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { Person } from '../database/entities/person.entity';
import { Memory } from '../database/entities/memory.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { BedrockService } from './bedrock.service';
import { PeopleModule } from '../people/people.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      Agent,
      Context,
      Conversation,
      ConversationSection,
      Person,
      Memory,
    ]),
    forwardRef(() => PeopleModule),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, BedrockService],
  exports: [ReportsService, BedrockService],
})
export class ReportsModule {}
