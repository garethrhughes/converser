import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { FirefliesService } from './fireflies/fireflies.service';
import { User } from '../database/entities/user.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';

jest.mock('../common/crypto.util', () => ({
  encrypt: jest.fn().mockReturnValue('encrypted-api-key'),
  decrypt: jest.fn().mockReturnValue('decrypted-api-key'),
}));

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let firefliesService: jest.Mocked<FirefliesService>;
  let userRepository: Record<string, jest.Mock>;
  let conversationRepository: Record<string, jest.Mock>;
  let sectionRepository: Record<string, jest.Mock>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'test@example.com',
    firefliesApiKeyEnc: undefined,
  };

  const mockUserWithKey: Partial<User> = {
    ...mockUser,
    firefliesApiKeyEnc: 'encrypted-key-value',
  };

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    conversationRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    sectionRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: FirefliesService,
          useValue: {
            validateApiKey: jest.fn(),
            listMeetings: jest.fn(),
            getTranscript: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Conversation),
          useValue: conversationRepository,
        },
        {
          provide: getRepositoryToken(ConversationSection),
          useValue: sectionRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('a'.repeat(64)),
          },
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    firefliesService = module.get(FirefliesService) as jest.Mocked<FirefliesService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  describe('connectFireflies', () => {
    it('validates the key and stores the encrypted value on the user', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser });
      firefliesService.validateApiKey.mockResolvedValue(true);
      userRepository.save.mockResolvedValue({ ...mockUserWithKey });

      await service.connectFireflies('user-1', 'my-api-key');

      expect(firefliesService.validateApiKey).toHaveBeenCalledWith('my-api-key');
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          firefliesApiKeyEnc: expect.any(String),
        }),
      );
    });

    it('throws BadRequestException when the API key is invalid', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser });
      firefliesService.validateApiKey.mockResolvedValue(false);

      await expect(
        service.connectFireflies('user-1', 'invalid-key'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.connectFireflies('nonexistent', 'my-api-key'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('disconnectFireflies', () => {
    it('removes the stored API key from the user', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserWithKey });
      userRepository.save.mockResolvedValue({
        ...mockUserWithKey,
        firefliesApiKeyEnc: undefined,
      });

      await service.disconnectFireflies('user-1');

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          firefliesApiKeyEnc: null,
        }),
      );
    });
  });

  describe('getFirefliesStatus', () => {
    it('returns connected true when a key is stored', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserWithKey });

      const result = await service.getFirefliesStatus('user-1');

      expect(result).toEqual({ connected: true });
    });

    it('returns connected false when no key is stored', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser });

      const result = await service.getFirefliesStatus('user-1');

      expect(result).toEqual({ connected: false });
    });
  });

  describe('listFirefliesMeetings', () => {
    it('decrypts the key and calls the Fireflies service', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserWithKey });
      firefliesService.listMeetings.mockResolvedValue([
        {
          id: 'meeting-1',
          title: 'Test Meeting',
          date: '2026-06-01T10:00:00.000Z',
          duration: 1800,
          participants: ['alice@example.com'],
          hostEmail: 'alice@example.com',
          transcriptUrl: null,
        },
      ]);

      const result = await service.listFirefliesMeetings('user-1', {
        limit: 20,
        skip: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Meeting');
      expect(firefliesService.listMeetings).toHaveBeenCalledWith(
        expect.any(String), // decrypted key
        { limit: 20, skip: 0 },
      );
    });

    it('throws BadRequestException when no Fireflies key is configured', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser });

      await expect(
        service.listFirefliesMeetings('user-1', {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('importFromFireflies', () => {
    const mockTranscript = {
      id: 'transcript-1',
      title: 'Weekly 1-1',
      date: '2026-06-01T10:00:00.000Z',
      duration: 1800,
      speakers: [{ id: 's1', name: 'Alice' }],
      sentences: [
        {
          index: 0,
          speakerName: 'Alice',
          speakerId: 's1',
          text: 'Hello there.',
          rawText: 'Hello there.',
          startTime: 5.0,
          endTime: 8.0,
        },
      ],
      summary: {
        keywords: ['hello'],
        actionItems: [],
        overview: 'A greeting.',
        shortSummary: 'Short greeting.',
      },
      participants: ['Alice'],
      transcriptUrl: 'https://app.fireflies.ai/view/transcript-1',
    };

    it('fetches the transcript, converts to markdown, and creates a conversation', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUserWithKey });
      firefliesService.getTranscript.mockResolvedValue(mockTranscript);
      conversationRepository.findOne.mockResolvedValue(null); // no duplicate
      conversationRepository.create.mockReturnValue({
        id: 'conv-1',
        userId: 'user-1',
        title: 'Weekly 1-1',
        sourceType: 'fireflies',
        sourceId: 'transcript-1',
      });
      conversationRepository.save.mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        title: 'Weekly 1-1',
        sourceType: 'fireflies',
        sourceId: 'transcript-1',
      });
      sectionRepository.create.mockImplementation((data) => data);
      sectionRepository.save.mockResolvedValue([]);

      const result = await service.importFromFireflies('user-1', {
        transcriptId: 'transcript-1',
      });

      expect(result.sourceType).toBe('fireflies');
      expect(result.sourceId).toBe('transcript-1');
      expect(conversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          title: 'Weekly 1-1',
          sourceType: 'fireflies',
          sourceId: 'transcript-1',
          sourceUrl: 'https://app.fireflies.ai/view/transcript-1',
        }),
      );
      // Should create 2 sections: transcript + summary
      expect(sectionRepository.create).toHaveBeenCalledTimes(2);
    });

    it('returns existing conversation when transcript was already imported', async () => {
      const existingConversation = {
        id: 'existing-conv',
        userId: 'user-1',
        sourceType: 'fireflies',
        sourceId: 'transcript-1',
      };
      userRepository.findOne.mockResolvedValue({ ...mockUserWithKey });
      conversationRepository.findOne.mockResolvedValue(existingConversation);

      const result = await service.importFromFireflies('user-1', {
        transcriptId: 'transcript-1',
      });

      expect(result).toEqual(existingConversation);
      expect(firefliesService.getTranscript).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when no Fireflies key is configured', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser });

      await expect(
        service.importFromFireflies('user-1', { transcriptId: 'transcript-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates only one section when transcript has no summary', async () => {
      const transcriptNoSummary = { ...mockTranscript, summary: null };

      userRepository.findOne.mockResolvedValue({ ...mockUserWithKey });
      firefliesService.getTranscript.mockResolvedValue(transcriptNoSummary);
      conversationRepository.findOne.mockResolvedValue(null);
      conversationRepository.create.mockReturnValue({
        id: 'conv-1',
        userId: 'user-1',
        title: 'Weekly 1-1',
        sourceType: 'fireflies',
        sourceId: 'transcript-1',
      });
      conversationRepository.save.mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        title: 'Weekly 1-1',
        sourceType: 'fireflies',
        sourceId: 'transcript-1',
      });
      sectionRepository.create.mockImplementation((data) => data);
      sectionRepository.save.mockResolvedValue([]);

      await service.importFromFireflies('user-1', {
        transcriptId: 'transcript-1',
      });

      expect(sectionRepository.create).toHaveBeenCalledTimes(1);
    });
  });
});
