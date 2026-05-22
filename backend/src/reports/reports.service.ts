import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, In } from 'typeorm';
import { Report } from '../database/entities/report.entity';
import { Agent } from '../database/entities/agent.entity';
import { Context } from '../database/entities/context.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { Person } from '../database/entities/person.entity';
import { Memory } from '../database/entities/memory.entity';
import { BedrockService } from './bedrock.service';
import { MemoryService } from '../people/memory.service';
import { GenerateReportDto } from './dto/generate-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Context)
    private readonly contextRepository: Repository<Context>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationSection)
    private readonly sectionRepository: Repository<ConversationSection>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(Memory)
    private readonly memoryRepository: Repository<Memory>,
    private readonly bedrockService: BedrockService,
    @Inject(forwardRef(() => MemoryService))
    private readonly memoryService: MemoryService,
    private readonly configService: ConfigService,
  ) {}

  async generate(userId: string, dto: GenerateReportDto): Promise<Report> {
    // Validate person ownership
    const person = await this.personRepository.findOne({
      where: { id: dto.personId, userId },
    });
    if (!person) {
      throw new NotFoundException(
        `Person with id ${dto.personId} not found`,
      );
    }

    // Validate conversation ownership and load sections
    const conversation = await this.conversationRepository.findOne({
      where: { id: dto.conversationId, userId },
      relations: { sections: true },
    });
    if (!conversation) {
      throw new NotFoundException(
        `Conversation with id ${dto.conversationId} not found`,
      );
    }

    // Resolve the section to analyse
    let section: ConversationSection;
    if (dto.sectionId) {
      const found = await this.sectionRepository.findOne({
        where: { id: dto.sectionId, conversationId: conversation.id },
      });
      if (!found) {
        throw new NotFoundException(
          `Section with id ${dto.sectionId} not found in conversation`,
        );
      }
      section = found;
    } else if (conversation.sections.length === 1) {
      section = conversation.sections[0];
    } else {
      throw new BadRequestException(
        'Conversation has multiple sections — sectionId is required',
      );
    }

    // Validate agent ownership
    const agent = await this.agentRepository.findOne({
      where: { id: dto.agentId, userId },
    });
    if (!agent) {
      throw new NotFoundException(`Agent with id ${dto.agentId} not found`);
    }

    // Load contexts (if any)
    let contexts: Context[] = [];
    if (dto.contextIds.length > 0) {
      contexts = await this.contextRepository.find({
        where: { id: In(dto.contextIds), userId },
      });
      if (contexts.length !== dto.contextIds.length) {
        throw new NotFoundException(
          'One or more contexts not found or not owned by user',
        );
      }
    }

    // Load existing memory for this person
    const memories = await this.memoryRepository.find({
      where: { userId, personId: dto.personId },
      order: { createdAt: 'ASC' },
    });

    // Assemble the prompt
    const systemPrompt = this.assembleSystemPrompt(
      agent.instructions,
      contexts,
      memories,
      person.name,
    );
    const userMessage = section.content;

    // Invoke Bedrock
    this.logger.log({
      msg: 'Invoking Bedrock for report generation',
      userId,
      personId: dto.personId,
      conversationId: dto.conversationId,
      sectionId: section.id,
      agentId: dto.agentId,
      contextCount: contexts.length,
    });

    const content = await this.bedrockService.invoke({
      systemPrompt,
      userMessage,
    });

    // Store the report
    const modelId = this.configService.get<string>('AWS_BEDROCK_MODEL_ID')!;
    const title = `${agent.name} — ${conversation.title}`;

    const report = this.reportRepository.create({
      userId,
      personId: dto.personId,
      conversationId: dto.conversationId,
      conversationSectionId: section.id,
      agentId: dto.agentId,
      title,
      content,
      modelId,
    });

    const saved = await this.reportRepository.save(report);

    this.logger.log({
      msg: 'Report generated',
      reportId: saved.id,
      userId,
      modelId,
    });

    // Fire-and-forget memory extraction (non-blocking)
    setImmediate(() => {
      this.memoryService
        .extractAndStore(userId, dto.personId, saved.id, content)
        .catch(() => {
          // Already logged inside extractAndStore
        });
    });

    return saved;
  }

  async findAll(userId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { userId },
      relations: { person: true, conversation: true, agent: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByPerson(userId: string, personId: string): Promise<Report[]> {
    const person = await this.personRepository.findOne({
      where: { id: personId, userId },
    });
    if (!person) {
      throw new NotFoundException(`Person with id ${personId} not found`);
    }

    return this.reportRepository.find({
      where: { userId, personId },
      relations: { conversation: true, agent: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, userId },
      relations: { person: true, conversation: true, conversationSection: true, agent: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }

    return report;
  }

  async remove(userId: string, id: string): Promise<void> {
    const report = await this.reportRepository.findOne({
      where: { id, userId },
    });

    if (!report) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }

    await this.reportRepository.remove(report);
    this.logger.log({ msg: 'Report removed', reportId: id, userId });
  }

  private assembleSystemPrompt(
    instructions: string,
    contexts: Context[],
    memories: Memory[],
    personName: string,
  ): string {
    const parts: string[] = [instructions];

    if (contexts.length > 0) {
      const contextSection = contexts
        .map((ctx) => `## ${ctx.name}\n\n${ctx.content}`)
        .join('\n\n');
      parts.push(contextSection);
    }

    if (memories.length > 0) {
      const memorySection = `## Memory (prior knowledge about ${personName})\n\n${memories.map((m) => `- ${m.content}`).join('\n')}`;
      parts.push(memorySection);
    }

    return parts.join('\n\n---\n\n');
  }
}
