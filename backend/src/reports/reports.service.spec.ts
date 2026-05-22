import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { BedrockService } from './bedrock.service';
import { MemoryService } from '../people/memory.service';
import { Report } from '../database/entities/report.entity';
import { Agent } from '../database/entities/agent.entity';
import { Context } from '../database/entities/context.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { Person } from '../database/entities/person.entity';
import { Memory } from '../database/entities/memory.entity';
import { ConfigService } from '@nestjs/config';

describe('ReportsService', () => {
  let service: ReportsService;
  let reportRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let agentRepository: { findOne: jest.Mock };
  let contextRepository: { find: jest.Mock };
  let conversationRepository: { findOne: jest.Mock };
  let sectionRepository: { findOne: jest.Mock; find: jest.Mock };
  let personRepository: { findOne: jest.Mock };
  let memoryRepository: { find: jest.Mock };
  let bedrockService: { invoke: jest.Mock };
  let memoryService: { extractAndStore: jest.Mock };
  let configService: { get: jest.Mock };

  const userId = 'user-uuid-1';
  const personId = 'person-uuid-1';
  const conversationId = 'conv-uuid-1';
  const sectionId = 'section-uuid-1';
  const agentId = 'agent-uuid-1';
  const contextId1 = 'context-uuid-1';
  const contextId2 = 'context-uuid-2';

  const mockPerson = { id: personId, userId, name: 'Alice' };
  const mockAgent = {
    id: agentId,
    userId,
    name: 'Test Agent',
    instructions: 'Analyse the conversation and provide feedback.',
  };
  const mockContext1 = {
    id: contextId1,
    userId,
    name: 'Team Goals',
    content: 'Our team goals are...',
  };
  const mockContext2 = {
    id: contextId2,
    userId,
    name: 'Review Criteria',
    content: 'We evaluate based on...',
  };
  const mockSection = {
    id: sectionId,
    conversationId,
    title: 'Tab 1',
    content: 'Meeting notes content here.',
    order: 0,
  };
  const mockConversation = {
    id: conversationId,
    userId,
    title: 'Weekly 1-1 with Alice',
    sections: [mockSection],
  };

  beforeEach(async () => {
    reportRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    agentRepository = { findOne: jest.fn() };
    contextRepository = { find: jest.fn() };
    conversationRepository = { findOne: jest.fn() };
    sectionRepository = { findOne: jest.fn(), find: jest.fn() };
    personRepository = { findOne: jest.fn() };
    memoryRepository = { find: jest.fn().mockResolvedValue([]) };
    bedrockService = { invoke: jest.fn() };
    memoryService = { extractAndStore: jest.fn().mockResolvedValue(undefined) };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'AWS_BEDROCK_MODEL_ID')
          return 'anthropic.claude-3-sonnet-20240229-v1:0';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useValue: reportRepository },
        { provide: getRepositoryToken(Agent), useValue: agentRepository },
        { provide: getRepositoryToken(Context), useValue: contextRepository },
        {
          provide: getRepositoryToken(Conversation),
          useValue: conversationRepository,
        },
        {
          provide: getRepositoryToken(ConversationSection),
          useValue: sectionRepository,
        },
        { provide: getRepositoryToken(Person), useValue: personRepository },
        { provide: getRepositoryToken(Memory), useValue: memoryRepository },
        { provide: BedrockService, useValue: bedrockService },
        { provide: MemoryService, useValue: memoryService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('generate', () => {
    const dto = {
      personId,
      conversationId,
      sectionId,
      contextIds: [contextId1, contextId2],
      agentId,
    };

    it('generates a report by invoking Bedrock with assembled prompt', async () => {
      personRepository.findOne.mockResolvedValue(mockPerson);
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      sectionRepository.findOne.mockResolvedValue(mockSection);
      agentRepository.findOne.mockResolvedValue(mockAgent);
      contextRepository.find.mockResolvedValue([mockContext1, mockContext2]);
      bedrockService.invoke.mockResolvedValue('# Report Output\n\nGreat feedback.');

      const savedReport = {
        id: 'report-uuid-1',
        userId,
        personId,
        conversationId,
        conversationSectionId: sectionId,
        agentId,
        title: 'Test Agent — Weekly 1-1 with Alice',
        content: '# Report Output\n\nGreat feedback.',
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        createdAt: new Date(),
      };
      reportRepository.create.mockReturnValue(savedReport);
      reportRepository.save.mockResolvedValue(savedReport);

      const result = await service.generate(userId, dto);

      expect(result.content).toBe('# Report Output\n\nGreat feedback.');
      expect(result.title).toBe('Test Agent — Weekly 1-1 with Alice');
      expect(bedrockService.invoke).toHaveBeenCalledWith({
        systemPrompt: expect.stringContaining(
          'Analyse the conversation and provide feedback.',
        ),
        userMessage: 'Meeting notes content here.',
      });
    });

    it('includes context content in the system prompt', async () => {
      personRepository.findOne.mockResolvedValue(mockPerson);
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      sectionRepository.findOne.mockResolvedValue(mockSection);
      agentRepository.findOne.mockResolvedValue(mockAgent);
      contextRepository.find.mockResolvedValue([mockContext1, mockContext2]);
      bedrockService.invoke.mockResolvedValue('Output');

      reportRepository.create.mockReturnValue({ id: 'r1' });
      reportRepository.save.mockResolvedValue({ id: 'r1' });

      await service.generate(userId, dto);

      const invokeCall = bedrockService.invoke.mock.calls[0][0];
      expect(invokeCall.systemPrompt).toContain('## Team Goals');
      expect(invokeCall.systemPrompt).toContain('Our team goals are...');
      expect(invokeCall.systemPrompt).toContain('## Review Criteria');
      expect(invokeCall.systemPrompt).toContain('We evaluate based on...');
    });

    it('throws ForbiddenException when person belongs to different user', async () => {
      personRepository.findOne.mockResolvedValue(null);

      await expect(service.generate(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when conversation does not exist', async () => {
      personRepository.findOne.mockResolvedValue(mockPerson);
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(service.generate(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when agent does not exist', async () => {
      personRepository.findOne.mockResolvedValue(mockPerson);
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      sectionRepository.findOne.mockResolvedValue(mockSection);
      agentRepository.findOne.mockResolvedValue(null);

      await expect(service.generate(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when conversation has multiple sections and no sectionId provided', async () => {
      const multiSectionConv = {
        ...mockConversation,
        sections: [
          mockSection,
          { ...mockSection, id: 'section-uuid-2', title: 'Tab 2', order: 1 },
        ],
      };
      personRepository.findOne.mockResolvedValue(mockPerson);
      conversationRepository.findOne.mockResolvedValue(multiSectionConv);

      const dtoWithoutSection = { ...dto, sectionId: undefined };

      await expect(
        service.generate(userId, dtoWithoutSection),
      ).rejects.toThrow(BadRequestException);
    });

    it('auto-selects section when conversation has only one section and no sectionId provided', async () => {
      personRepository.findOne.mockResolvedValue(mockPerson);
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      agentRepository.findOne.mockResolvedValue(mockAgent);
      contextRepository.find.mockResolvedValue([]);
      bedrockService.invoke.mockResolvedValue('Output');

      reportRepository.create.mockReturnValue({ id: 'r1' });
      reportRepository.save.mockResolvedValue({ id: 'r1' });

      const dtoWithoutSection = { ...dto, sectionId: undefined, contextIds: [] };
      await service.generate(userId, dtoWithoutSection);

      expect(bedrockService.invoke).toHaveBeenCalledWith({
        systemPrompt: expect.any(String),
        userMessage: 'Meeting notes content here.',
      });
    });

    it('works with empty contextIds array', async () => {
      personRepository.findOne.mockResolvedValue(mockPerson);
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      sectionRepository.findOne.mockResolvedValue(mockSection);
      agentRepository.findOne.mockResolvedValue(mockAgent);
      contextRepository.find.mockResolvedValue([]);
      bedrockService.invoke.mockResolvedValue('Output');

      reportRepository.create.mockReturnValue({ id: 'r1' });
      reportRepository.save.mockResolvedValue({ id: 'r1' });

      const dtoNoContexts = { ...dto, contextIds: [] };
      await service.generate(userId, dtoNoContexts);

      const invokeCall = bedrockService.invoke.mock.calls[0][0];
      expect(invokeCall.systemPrompt).not.toContain('---');
    });
  });

  describe('findAll', () => {
    it('returns all reports for the user ordered by creation date', async () => {
      const reports = [{ id: 'r1', userId }];
      reportRepository.find.mockResolvedValue(reports);

      const result = await service.findAll(userId);

      expect(result).toEqual(reports);
      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: { person: true, conversation: true, agent: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findByPerson', () => {
    it('returns reports for a specific person owned by the user', async () => {
      personRepository.findOne.mockResolvedValue(mockPerson);
      const reports = [{ id: 'r1', userId, personId }];
      reportRepository.find.mockResolvedValue(reports);

      const result = await service.findByPerson(userId, personId);

      expect(result).toEqual(reports);
      expect(reportRepository.find).toHaveBeenCalledWith({
        where: { userId, personId },
        relations: { conversation: true, agent: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('throws NotFoundException when person does not exist for user', async () => {
      personRepository.findOne.mockResolvedValue(null);

      await expect(service.findByPerson(userId, personId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns the report when it belongs to the user', async () => {
      const report = { id: 'r1', userId };
      reportRepository.findOne.mockResolvedValue(report);

      const result = await service.findOne(userId, 'r1');

      expect(result).toEqual(report);
    });

    it('throws NotFoundException when report does not exist', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('removes the report', async () => {
      const report = { id: 'r1', userId };
      reportRepository.findOne.mockResolvedValue(report);
      reportRepository.remove.mockResolvedValue(report);

      await service.remove(userId, 'r1');

      expect(reportRepository.remove).toHaveBeenCalledWith(report);
    });

    it('throws NotFoundException when report does not exist', async () => {
      reportRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
