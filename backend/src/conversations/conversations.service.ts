import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { User } from '../database/entities/user.entity';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { ImportConversationDto } from './dto/import-conversation.dto';
import { getValidGoogleAccessToken } from '../common/google-token.helper';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationSection)
    private readonly sectionRepository: Repository<ConversationSection>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly googleDriveService: GoogleDriveService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(userId: string, personId?: string): Promise<Conversation[]> {
    const where: Record<string, string> = { userId };
    if (personId) {
      where.personId = personId;
    }

    return this.conversationRepository.find({
      where,
      relations: { person: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
      relations: { sections: true },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }

    conversation.sections.sort((a, b) => a.order - b.order);

    return conversation;
  }

  async remove(userId: string, id: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with id ${id} not found`);
    }

    await this.conversationRepository.remove(conversation);
    this.logger.log({
      msg: 'Conversation removed',
      conversationId: id,
      userId,
    });
  }

  async importFromGoogleDocs(
    userId: string,
    dto: ImportConversationDto,
  ): Promise<Conversation> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accessToken = await getValidGoogleAccessToken(
      user,
      this.configService,
      this.userRepository,
    );

    const parsedDoc = await this.googleDriveService.fetchDocument(
      accessToken,
      dto.documentId,
    );

    const conversation = this.conversationRepository.create({
      userId,
      personId: dto.personId || undefined,
      title: parsedDoc.title,
      sourceType: 'google_docs',
      sourceId: dto.documentId,
      sourceUrl: `https://docs.google.com/document/d/${dto.documentId}`,
      importedAt: new Date(),
    });

    const savedConversation =
      await this.conversationRepository.save(conversation);

    const sections = parsedDoc.sections.map((section, index) =>
      this.sectionRepository.create({
        conversationId: savedConversation.id,
        title: section.title,
        content: section.content,
        order: index,
      }),
    );

    await this.sectionRepository.save(sections);

    this.logger.log({
      msg: 'Conversation imported from Google Docs',
      conversationId: savedConversation.id,
      documentId: dto.documentId,
      userId,
      sectionCount: sections.length,
    });

    return this.findOne(userId, savedConversation.id);
  }
}
