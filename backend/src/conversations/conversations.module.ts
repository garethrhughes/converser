import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { User } from '../database/entities/user.entity';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { PeopleModule } from '../people/people.module';
import { PiiModule } from '../pii/pii.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationSection, User]),
    GoogleDriveModule,
    PeopleModule,
    PiiModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
