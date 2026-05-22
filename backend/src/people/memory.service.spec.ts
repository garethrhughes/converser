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
        service.update(userId, personId, 'non-existent', {
          content: 'x',
        }),
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
    it('extracts memory items from report content and stores them', async () => {
      bedrockService.invoke.mockResolvedValue(
        '["Prefers async communication", "Action: migrate API by Q2", "Recurring theme: deployment friction"]',
      );
      memoryRepository.create.mockImplementation((data) => data);
      memoryRepository.save.mockResolvedValue([]);

      await service.extractAndStore(userId, personId, reportId, 'Report content here');

      expect(bedrockService.invoke).toHaveBeenCalledWith({
        systemPrompt: expect.stringContaining('memory extraction'),
        userMessage: 'Report content here',
      });
      expect(memoryRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId,
            personId,
            reportId,
            content: 'Prefers async communication',
          }),
        ]),
      );
    });

    it('handles invalid JSON response gracefully without throwing', async () => {
      bedrockService.invoke.mockResolvedValue('Not valid JSON');

      // Should not throw — extraction failures are non-fatal
      await expect(
        service.extractAndStore(userId, personId, reportId, 'Report content'),
      ).resolves.not.toThrow();
    });

    it('handles empty array response without storing anything', async () => {
      bedrockService.invoke.mockResolvedValue('[]');
      memoryRepository.create.mockImplementation((data) => data);

      await service.extractAndStore(userId, personId, reportId, 'Report content');

      expect(memoryRepository.save).not.toHaveBeenCalled();
    });

    it('handles Bedrock invocation failure gracefully', async () => {
      bedrockService.invoke.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        service.extractAndStore(userId, personId, reportId, 'Report content'),
      ).resolves.not.toThrow();
    });
  });
});
