import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { FirefliesService } from './fireflies/fireflies.service';
import { PiiRedactionService } from '../pii/pii-redaction.service';
import { convertTranscriptToMarkdown } from './fireflies/fireflies-markdown.converter';
import { encrypt, decrypt } from '../common/crypto.util';
import type { ImportFirefliesDto } from './dto/import-fireflies.dto';
import type { ListMeetingsOptions, FirefliesMeeting } from './fireflies/fireflies.types';
import type { PiiCategory } from '../pii/pii.types';

export interface ImportResult {
  conversation: Conversation;
  piiDetected: boolean;
  redactionSummary?: {
    totalRedactions: number;
    categories: Record<PiiCategory, number>;
  };
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationSection)
    private readonly sectionRepository: Repository<ConversationSection>,
    private readonly firefliesService: FirefliesService,
    private readonly piiRedactionService: PiiRedactionService,
    private readonly configService: ConfigService,
  ) {}

  async connectFireflies(userId: string, apiKey: string): Promise<void> {
    const user = await this.findUserOrThrow(userId);

    const isValid = await this.firefliesService.validateApiKey(apiKey);
    if (!isValid) {
      throw new BadRequestException(
        'Invalid Fireflies API key. Please check your key and try again.',
      );
    }

    const encryptionKey = this.getEncryptionKey();
    user.firefliesApiKeyEnc = encrypt(apiKey, encryptionKey);
    await this.userRepository.save(user);

    this.logger.log({ msg: 'Fireflies connected', userId });
  }

  async disconnectFireflies(userId: string): Promise<void> {
    const user = await this.findUserOrThrow(userId);
    user.firefliesApiKeyEnc = null;
    await this.userRepository.save(user);

    this.logger.log({ msg: 'Fireflies disconnected', userId });
  }

  async getFirefliesStatus(
    userId: string,
  ): Promise<{ connected: boolean }> {
    const user = await this.findUserOrThrow(userId);
    return { connected: !!user.firefliesApiKeyEnc };
  }

  async listFirefliesMeetings(
    userId: string,
    options: ListMeetingsOptions,
  ): Promise<FirefliesMeeting[]> {
    const apiKey = await this.getDecryptedApiKey(userId);
    return this.firefliesService.listMeetings(apiKey, options);
  }

  async importFromFireflies(
    userId: string,
    dto: ImportFirefliesDto,
  ): Promise<ImportResult> {
    const apiKey = await this.getDecryptedApiKey(userId);

    // Check for duplicate import
    const existing = await this.conversationRepository.findOne({
      where: {
        userId,
        sourceType: 'fireflies',
        sourceId: dto.transcriptId,
      },
    });

    if (existing) {
      this.logger.log({
        msg: 'Fireflies transcript already imported, returning existing',
        userId,
        transcriptId: dto.transcriptId,
        conversationId: existing.id,
      });
      const conversation = await this.findConversationWithSections(
        userId,
        existing.id,
      );
      return { conversation, piiDetected: false };
    }

    const transcript = await this.firefliesService.getTranscript(
      apiKey,
      dto.transcriptId,
    );

    const { transcript: markdownContent, summary: summaryContent } =
      convertTranscriptToMarkdown(transcript);

    // Run PII redaction on content
    let totalRedactions = 0;
    const aggregatedCategories: Record<PiiCategory, number> = {
      email: 0,
      phone: 0,
      'credit-card': 0,
      ssn: 0,
      'national-id': 0,
      'date-of-birth': 0,
      address: 0,
    };

    const transcriptRedaction = this.piiRedactionService.redact(markdownContent);
    if (transcriptRedaction.redacted) {
      totalRedactions += transcriptRedaction.redactions.length;
      for (const [cat, count] of Object.entries(transcriptRedaction.summary)) {
        aggregatedCategories[cat as PiiCategory] += count;
      }
    }

    let redactedSummary: string | null = null;
    if (summaryContent) {
      const summaryRedaction = this.piiRedactionService.redact(summaryContent);
      redactedSummary = summaryRedaction.content;
      if (summaryRedaction.redacted) {
        totalRedactions += summaryRedaction.redactions.length;
        for (const [cat, count] of Object.entries(summaryRedaction.summary)) {
          aggregatedCategories[cat as PiiCategory] += count;
        }
      }
    }

    const piiDetected = totalRedactions > 0;

    if (piiDetected) {
      this.logger.log({
        msg: 'PII detected and redacted during Fireflies import',
        userId,
        transcriptId: dto.transcriptId,
        totalRedactions,
        categories: aggregatedCategories,
      });
    }

    const conversation = this.conversationRepository.create({
      userId,
      personId: dto.personId || undefined,
      title: transcript.title,
      sourceType: 'fireflies',
      sourceId: transcript.id,
      sourceUrl: transcript.transcriptUrl || undefined,
      importedAt: new Date(),
    });

    const savedConversation: Conversation =
      await this.conversationRepository.save(conversation);

    const sections = [
      this.sectionRepository.create({
        conversationId: savedConversation.id,
        title: 'Transcript',
        content: transcriptRedaction.content,
        order: 0,
      }),
    ];

    if (redactedSummary) {
      sections.push(
        this.sectionRepository.create({
          conversationId: savedConversation.id,
          title: 'Summary',
          content: redactedSummary,
          order: 1,
        }),
      );
    }

    await this.sectionRepository.save(sections);

    this.logger.log({
      msg: 'Conversation imported from Fireflies',
      conversationId: savedConversation.id,
      transcriptId: dto.transcriptId,
      userId,
      sectionCount: sections.length,
    });

    const fullConversation = await this.findConversationWithSections(
      userId,
      savedConversation.id,
    );

    return {
      conversation: fullConversation,
      piiDetected,
      ...(piiDetected && {
        redactionSummary: {
          totalRedactions,
          categories: aggregatedCategories,
        },
      }),
    };
  }

  private async findConversationWithSections(
    userId: string,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, userId },
      relations: { sections: true },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with id ${conversationId} not found`,
      );
    }

    conversation.sections.sort((a, b) => a.order - b.order);
    return conversation;
  }

  private async findUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async getDecryptedApiKey(userId: string): Promise<string> {
    const user = await this.findUserOrThrow(userId);

    if (!user.firefliesApiKeyEnc) {
      throw new BadRequestException(
        'Fireflies is not connected. Please connect your Fireflies account first.',
      );
    }

    const encryptionKey = this.getEncryptionKey();
    return decrypt(user.firefliesApiKeyEnc, encryptionKey);
  }

  private getEncryptionKey(): string {
    return this.configService.getOrThrow<string>('GOOGLE_TOKEN_ENCRYPTION_KEY');
  }
}
