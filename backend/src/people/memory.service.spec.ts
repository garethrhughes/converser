import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { Memory } from '../database/entities/memory.entity';
import { Person } from '../database/entities/person.entity';
import { BedrockService } from '../reports/bedrock.service';

describe('MemoryService', () => {
  let service: MemoryService;
  let memoryRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    update: jest.Mock;
  };
  let personRepository: { findOne: jest.Mock };
  let bedrockService: { invoke: jest.Mock };

  const userId = 'user-uuid-1';
  const personId = 'person-uuid-1';
  const memoryId = 'memory-uuid-1';
  const reportId = 'report-uuid-1';

  const mockPerson = { id: personId, userId, name: 'Alice' };
  const mockMemory = {
    id: memoryId,
    userId,
    personId,
    reportId,
    content: 'Prefers async communication',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    memoryRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
    };
    personRepository = { findOne: jest.fn() };
    bedrockService = { invoke: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        { provide: getRepositoryToken(Memory), useValue: memoryRepository },
        { provide: getRepositoryToken(Person), useValue: personRepository },
        { provide: BedrockService, useValue: bedrockService },
      ],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
  });

  describe('findAllForPerson', () => {
    it('returns all memories for a person owned by the user', async () => {
      personRepository.findOne.mockResolvedValue(mockPerson);
      memoryRepository.find.mockResolvedValue([mockMemory]);

      const result = await service.findAllForPerson(userId, personId);

      expect(result).toEqual([mockMemory]);
      expect(memoryRepository.find).toHaveBeenCalledWith({
        where: { userId, personId },
        order: { createdAt: 'ASC' },
      });
    });

    it('throws NotFoundException when person does not exist for user', async () => {
      personRepository.findOne.mockResolvedValue(null);

      await expect(service.findAllForPerson(userId, personId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates the content of a memory item', async () => {
      memoryRepository.findOne.mockResolvedValue({ ...mockMemory });
      memoryRepository.save.mockResolvedValue({
        ...mockMemory,
        content: 'Updated content',
      });

      const result = await service.update(userId, personId, memoryId, {
        content: 'Updated content',
      });

      expect(result.content).toBe('Updated content');
    });

    it('throws NotFoundException when memory does not exist', async () => {
      memoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, personId, 'non-existent', { content: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes the memory item', async () => {
      memoryRepository.findOne.mockResolvedValue(mockMemory);
      memoryRepository.remove.mockResolvedValue(mockMemory);

      await service.remove(userId, personId, memoryId);

      expect(memoryRepository.remove).toHaveBeenCalledWith(mockMemory);
    });

    it('throws NotFoundException when memory does not exist', async () => {
      memoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(userId, personId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('extractAndStore', () => {
    const existingMemories = [
      { id: 'mem-1', userId, personId, content: 'Prefers async communication', createdAt: new Date(), updatedAt: new Date() },
      { id: 'mem-2', userId, personId, content: 'Action: migrate API by Q2', createdAt: new Date(), updatedAt: new Date() },
    ];

    beforeEach(() => {
      memoryRepository.find.mockResolvedValue(existingMemories);
    });

    it('adds new memories, updates existing, and removes outdated', async () => {
      const diffResponse = JSON.stringify({
        add: ['New theme: prefers short meetings'],
        update: [{ id: 'mem-2', content: 'Action: API migration completed' }],
        remove: ['mem-1'],
      });

      bedrockService.invoke.mockResolvedValue(diffResponse);
      memoryRepository.create.mockImplementation((data) => ({ id: 'new-uuid', ...data }));
      memoryRepository.save.mockImplementation((items) =>
        Array.isArray(items) ? items : [items],
      );
      memoryRepository.remove.mockResolvedValue([]);

      const result = await service.extractAndStore(userId, personId, reportId, 'Report content');

      expect(result).not.toBeNull();
      expect(result!.added).toHaveLength(1);
      expect(result!.added[0].content).toBe('New theme: prefers short meetings');
      expect(result!.updated).toHaveLength(1);
      expect(result!.updated[0].id).toBe('mem-2');
      expect(result!.updated[0].previousContent).toBe('Action: migrate API by Q2');
      expect(result!.updated[0].content).toBe('Action: API migration completed');
      expect(result!.removed).toHaveLength(1);
      expect(result!.removed[0].id).toBe('mem-1');
      expect(result!.removed[0].content).toBe('Prefers async communication');
    });

    it('passes existing memories to the extraction prompt', async () => {
      const freshMemories = [
        { id: 'mem-1', userId, personId, content: 'Prefers async communication', createdAt: new Date(), updatedAt: new Date() },
        { id: 'mem-2', userId, personId, content: 'Action: migrate API by Q2', createdAt: new Date(), updatedAt: new Date() },
      ];
      memoryRepository.find.mockResolvedValue(freshMemories);
      bedrockService.invoke.mockResolvedValue('{"add":[],"update":[],"remove":[]}');

      await service.extractAndStore(userId, personId, reportId, 'Report content');

      const prompt = bedrockService.invoke.mock.calls[0][0].systemPrompt;
      expect(prompt).toContain('[id:mem-1] Prefers async communication');
      expect(prompt).toContain('[id:mem-2] Action: migrate API by Q2');
    });

    it('returns null when no changes are present', async () => {
      bedrockService.invoke.mockResolvedValue('{"add":[],"update":[],"remove":[]}');

      const result = await service.extractAndStore(userId, personId, reportId, 'Report content');

      expect(result).toBeNull();
    });

    it('handles invalid JSON response gracefully', async () => {
      bedrockService.invoke.mockResolvedValue('Not valid JSON at all');

      const result = await service.extractAndStore(userId, personId, reportId, 'Report content');

      expect(result).toBeNull();
    });

    it('handles Bedrock invocation failure gracefully', async () => {
      bedrockService.invoke.mockRejectedValue(new Error('Service unavailable'));

      const result = await service.extractAndStore(userId, personId, reportId, 'Report content');

      expect(result).toBeNull();
    });

    it('skips updates for non-existent memory IDs and returns null', async () => {
      const diffResponse = JSON.stringify({
        add: [],
        update: [{ id: 'non-existent-id', content: 'Should be skipped' }],
        remove: [],
      });

      bedrockService.invoke.mockResolvedValue(diffResponse);

      const result = await service.extractAndStore(userId, personId, reportId, 'Report content');

      expect(result).toBeNull();
    });

    it('works with add-only when no existing memories', async () => {
      memoryRepository.find.mockResolvedValue([]);
      bedrockService.invoke.mockResolvedValue(
        '{"add":["First memory item"],"update":[],"remove":[]}',
      );
      memoryRepository.create.mockImplementation((data) => ({ id: 'new-1', ...data }));
      memoryRepository.save.mockImplementation((items) =>
        Array.isArray(items) ? items : [items],
      );

      const result = await service.extractAndStore(userId, personId, reportId, 'Report content');

      expect(result).not.toBeNull();
      expect(result!.added).toHaveLength(1);
      expect(result!.updated).toHaveLength(0);
      expect(result!.removed).toHaveLength(0);
    });

    it('includes "no existing memories" in prompt when person has none', async () => {
      memoryRepository.find.mockResolvedValue([]);
      bedrockService.invoke.mockResolvedValue('{"add":[],"update":[],"remove":[]}');

      await service.extractAndStore(userId, personId, reportId, 'Report content');

      const prompt = bedrockService.invoke.mock.calls[0][0].systemPrompt;
      expect(prompt).toContain('no existing memories yet');
    });
  });
});
