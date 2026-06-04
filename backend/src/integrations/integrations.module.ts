import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { FirefliesModule } from './fireflies/fireflies.module';
import { PiiModule } from '../pii/pii.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Conversation, ConversationSection]),
    FirefliesModule,
    PiiModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
})
export class IntegrationsModule {}
