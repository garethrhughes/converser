import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Memory } from '../database/entities/memory.entity';
import { Person } from '../database/entities/person.entity';
import { BedrockService } from '../reports/bedrock.service';
import { UpdateMemoryDto } from './dto/update-memory.dto';

const DEFAULT_EXTRACTION_PROMPT = `You are a memory extraction assistant. Given a report about a person, extract the key facts, decisions, action items, and themes as a JSON array of short, factual statements.

Rules:
- Each item should be a single sentence or short phrase
- Focus on facts, decisions made, action items, and recurring themes
- Do not include opinions or speculation
- Return ONLY a valid JSON array of strings, nothing else

Example output: ["Prefers async communication", "Action: migrate to new API by Q2", "Recurring theme: deployment friction"]`;

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    @InjectRepository(Memory)
    private readonly memoryRepository: Repository<Memory>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly bedrockService: BedrockService,
  ) {}

  async findAllForPerson(userId: string, personId: string): Promise<Memory[]> {
    const person = await this.personRepository.findOne({
      where: { id: personId, userId },
    });
    if (!person) {
      throw new NotFoundException(`Person with id ${personId} not found`);
    }

    return this.memoryRepository.find({
      where: { userId, personId },
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    userId: string,
    personId: string,
    memoryId: string,
    dto: UpdateMemoryDto,
  ): Promise<Memory> {
    const memory = await this.memoryRepository.findOne({
      where: { id: memoryId, userId, personId },
    });

    if (!memory) {
      throw new NotFoundException(`Memory with id ${memoryId} not found`);
    }

    memory.content = dto.content;
    const saved = await this.memoryRepository.save(memory);
    this.logger.log({ msg: 'Memory updated', memoryId, userId, personId });
    return saved;
  }

  async remove(
    userId: string,
    personId: string,
    memoryId: string,
  ): Promise<void> {
    const memory = await this.memoryRepository.findOne({
      where: { id: memoryId, userId, personId },
    });

    if (!memory) {
      throw new NotFoundException(`Memory with id ${memoryId} not found`);
    }

    await this.memoryRepository.remove(memory);
    this.logger.log({ msg: 'Memory removed', memoryId, userId, personId });
  }

  async extractAndStore(
    userId: string,
    personId: string,
    reportId: string,
    reportContent: string,
    customExtractionPrompt?: string,
  ): Promise<void> {
    try {
      const JSON_SUFFIX = '\n\nIMPORTANT: Return ONLY a valid JSON array of strings, nothing else.';
      const basePrompt = customExtractionPrompt || DEFAULT_EXTRACTION_PROMPT;
      const systemPrompt = customExtractionPrompt
        ? basePrompt + JSON_SUFFIX
        : basePrompt;

      const response = await this.bedrockService.invoke({
        systemPrompt,
        userMessage: reportContent,
      });

      const items = this.parseExtractionResponse(response);

      if (items.length === 0) {
        this.logger.log({
          msg: 'No memory items extracted',
          userId,
          personId,
          reportId,
        });
        return;
      }

      const memories = items.map((content) =>
        this.memoryRepository.create({
          userId,
          personId,
          reportId,
          content,
        }),
      );

      await this.memoryRepository.save(memories);

      this.logger.log({
        msg: 'Memory items extracted and stored',
        userId,
        personId,
        reportId,
        count: memories.length,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({
        msg: 'Memory extraction failed',
        userId,
        personId,
        reportId,
        errorMessage: errMsg,
      });
      // Non-fatal — do not rethrow
    }
  }

  private parseExtractionResponse(response: string): string[] {
    try {
      // Strip any markdown code fences if present
      const cleaned = response
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```\s*$/m, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        this.logger.warn({
          msg: 'Extraction response is not an array',
        });
        return [];
      }

      return parsed.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      );
    } catch {
      this.logger.warn({
        msg: 'Failed to parse extraction response as JSON',
      });
      return [];
    }
  }
}
