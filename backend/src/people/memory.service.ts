import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Memory } from '../database/entities/memory.entity';
import { Person } from '../database/entities/person.entity';
import { MemoryChanges } from '../database/entities/report.entity';
import { BedrockService } from '../reports/bedrock.service';
import { UpdateMemoryDto } from './dto/update-memory.dto';

const DEFAULT_EXTRACTION_PROMPT = `You are a memory extraction assistant. Given a report about a person, compare it against their existing memories and determine what should be added, updated, or removed.

Rules:
- Add new facts, decisions, action items, or themes not already captured
- Update existing memories if new information clarifies, corrects, or supersedes them (reference by ID)
- Remove memories that are no longer relevant (e.g. completed actions, outdated facts) (reference by ID)
- Consolidate related or redundant memories: if multiple items express the same fact or theme, merge them into one updated item and remove the redundant ones
- Each memory should be a single sentence or short phrase
- Focus on facts, decisions made, action items, and recurring themes
- Do not include opinions or speculation
- Keep the total memory list concise — prefer fewer well-written items over many overlapping ones`;

const JSON_FORMAT_SUFFIX = `

Return a JSON object with exactly three keys:
- "add": array of new memory strings to create
- "update": array of objects { "id": string, "content": string } for memories to modify
- "remove": array of memory ID strings to delete

If no changes are needed for a category, use an empty array.
IMPORTANT: Return ONLY a valid JSON object with these three keys, nothing else.`;

interface ExtractionDiff {
  add: string[];
  update: Array<{ id: string; content: string }>;
  remove: string[];
}

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
  ): Promise<MemoryChanges | null> {
    try {
      // Load existing memories
      const existingMemories = await this.memoryRepository.find({
        where: { userId, personId },
        order: { createdAt: 'ASC' },
      });

      // Build the prompt
      const basePrompt = customExtractionPrompt || DEFAULT_EXTRACTION_PROMPT;
      const memoriesContext = this.buildMemoriesContext(existingMemories);
      const systemPrompt = basePrompt + memoriesContext + JSON_FORMAT_SUFFIX;

      const response = await this.bedrockService.invoke({
        systemPrompt,
        userMessage: reportContent,
      });

      const diff = this.parseExtractionDiff(response);
      if (!diff) {
        return null;
      }

      // Apply the diff and build the changes record
      const changes = await this.applyDiff(
        userId,
        personId,
        reportId,
        diff,
        existingMemories,
      );

      // If no actual changes were applied (e.g. all IDs were invalid), return null
      if (changes.added.length === 0 && changes.updated.length === 0 && changes.removed.length === 0) {
        this.logger.log({
          msg: 'No memory changes applied after diff',
          userId,
          personId,
          reportId,
        });
        return null;
      }

      this.logger.log({
        msg: 'Memory evolution applied',
        userId,
        personId,
        reportId,
        added: changes.added.length,
        updated: changes.updated.length,
        removed: changes.removed.length,
      });

      return changes;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error({
        msg: 'Memory extraction failed',
        userId,
        personId,
        reportId,
        errorMessage: errMsg,
      });
      return null;
    }
  }

  private buildMemoriesContext(memories: Memory[]): string {
    if (memories.length === 0) {
      return '\n\nThis person has no existing memories yet.';
    }

    const items = memories
      .map((m) => `- [id:${m.id}] ${m.content}`)
      .join('\n');

    return `\n\nCurrent memories for this person (reference by ID to update or remove):\n${items}`;
  }

  private async applyDiff(
    userId: string,
    personId: string,
    reportId: string,
    diff: ExtractionDiff,
    existingMemories: Memory[],
  ): Promise<MemoryChanges> {
    const changes: MemoryChanges = {
      added: [],
      updated: [],
      removed: [],
    };

    // Process additions
    if (diff.add.length > 0) {
      const newMemories = diff.add.map((content) =>
        this.memoryRepository.create({ userId, personId, reportId, content }),
      );
      const saved = await this.memoryRepository.save(newMemories);
      changes.added = saved.map((m) => ({ id: m.id, content: m.content }));
    }

    // Process updates
    if (diff.update.length > 0) {
      const memoryMap = new Map(existingMemories.map((m) => [m.id, m]));

      for (const upd of diff.update) {
        const existing = memoryMap.get(upd.id);
        if (!existing) continue; // Skip if ID doesn't exist

        const previousContent = existing.content;
        existing.content = upd.content;
        await this.memoryRepository.save(existing);

        changes.updated.push({
          id: upd.id,
          previousContent,
          content: upd.content,
        });
      }
    }

    // Process removals
    if (diff.remove.length > 0) {
      const memoryMap = new Map(existingMemories.map((m) => [m.id, m]));
      const toRemove: Memory[] = [];

      for (const id of diff.remove) {
        const existing = memoryMap.get(id);
        if (!existing) continue; // Skip if ID doesn't exist

        changes.removed.push({ id, content: existing.content });
        toRemove.push(existing);
      }

      if (toRemove.length > 0) {
        await this.memoryRepository.remove(toRemove);
      }
    }

    return changes;
  }

  private parseExtractionDiff(response: string): ExtractionDiff | null {
    try {
      const cleaned = response
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```\s*$/m, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      // Validate structure
      if (typeof parsed !== 'object' || parsed === null) {
        this.logger.warn({ msg: 'Extraction response is not an object' });
        return null;
      }

      const diff: ExtractionDiff = {
        add: [],
        update: [],
        remove: [],
      };

      // Parse additions
      if (Array.isArray(parsed.add)) {
        diff.add = parsed.add.filter(
          (item: unknown): item is string =>
            typeof item === 'string' && item.trim().length > 0,
        );
      }

      // Parse updates
      if (Array.isArray(parsed.update)) {
        diff.update = parsed.update.filter(
          (item: unknown): item is { id: string; content: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { id?: unknown }).id === 'string' &&
            typeof (item as { content?: unknown }).content === 'string',
        );
      }

      // Parse removals
      if (Array.isArray(parsed.remove)) {
        diff.remove = parsed.remove.filter(
          (item: unknown): item is string => typeof item === 'string',
        );
      }

      // Check if anything changed
      if (diff.add.length === 0 && diff.update.length === 0 && diff.remove.length === 0) {
        this.logger.log({ msg: 'No memory changes in extraction response' });
        return null;
      }

      return diff;
    } catch {
      this.logger.warn({ msg: 'Failed to parse extraction response as JSON' });
      return null;
    }
  }
}
