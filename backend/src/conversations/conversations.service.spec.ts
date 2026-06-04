import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { Conversation } from '../database/entities/conversation.entity';
import { ConversationSection } from '../database/entities/conversation-section.entity';
import { User } from '../database/entities/user.entity';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { PiiRedactionService } from '../pii/pii-redaction.service';

jest.mock('../common/google-token.helper', () => ({
  getValidGoogleAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
}));

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let sectionRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let userRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let googleDriveService: {
    fetchDocument: jest.Mock;
  };

  const userId = 'user-uuid-1';
  const conversationId = 'conversation-uuid-1';

  const mockUser: Partial<User> = {
    id: userId,
    email: 'test@example.com',
    googleId: 'google-123',
    name: 'Test User',
    googleAccessTokenEnc: 'encrypted-access',
    googleRefreshTokenEnc: 'encrypted-refresh',
  };

  const mockConversation: Partial<Conversation> = {
    id: conversationId,
    userId,
    title: 'Test Conversation',
    sourceType: 'google_docs',
    sourceId: 'doc-123',
    importedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    sections: [],
  };

  beforeEach(async () => {
    conversationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    sectionRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    googleDriveService = {
      fetchDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: conversationRepository,
        },
        {
          provide: getRepositoryToken(ConversationSection),
          useValue: sectionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: GoogleDriveService,
          useValue: googleDriveService,
        },
        {
          provide: PiiRedactionService,
          useValue: {
            redact: jest.fn().mockImplementation((text: string) => ({
              content: text,
              redacted: false,
              redactions: [],
              summary: {
                email: 0,
                phone: 0,
                'credit-card': 0,
                ssn: 0,
                'national-id': 0,
                'date-of-birth': 0,
                address: 0,
              },
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('mock-key'),
          },
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  describe('findAll', () => {
    it('returns all conversations for the user with person relation', async () => {
      const conversations = [mockConversation];
      conversationRepository.find.mockResolvedValue(conversations);

      const result = await service.findAll(userId);

      expect(result).toEqual(conversations);
      expect(conversationRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: { person: true },
        order: { createdAt: 'DESC' },
      });
    });

    it('returns empty array when user has no conversations', async () => {
      conversationRepository.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the conversation with sections ordered by order field', async () => {
      const sections = [
        { id: 's2', order: 1, title: 'Second', content: 'B' },
        { id: 's1', order: 0, title: 'First', content: 'A' },
      ];
      const conversation = { ...mockConversation, sections };
      conversationRepository.findOne.mockResolvedValue(conversation);

      const result = await service.findOne(userId, conversationId);

      expect(result.sections[0].title).toBe('First');
      expect(result.sections[1].title).toBe('Second');
    });

    it('throws NotFoundException when conversation does not exist', async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when conversation belongs to different user', async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('other-user', conversationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes the conversation', async () => {
      conversationRepository.findOne.mockResolvedValue(mockConversation);
      conversationRepository.remove.mockResolvedValue(mockConversation);

      await service.remove(userId, conversationId);

      expect(conversationRepository.remove).toHaveBeenCalledWith(
        mockConversation,
      );
    });

    it('throws NotFoundException when conversation does not exist', async () => {
      conversationRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('importFromGoogleDocs', () => {
    it('imports a document and creates conversation with sections', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      googleDriveService.fetchDocument.mockResolvedValue({
        title: 'Imported Doc',
        sections: [{ title: 'Main', content: 'Content here' }],
      });

      const createdConversation = {
        id: 'new-conv-id',
        userId,
        title: 'Imported Doc',
        sourceType: 'google_docs',
        sourceId: 'doc-456',
      };
      conversationRepository.create.mockReturnValue(createdConversation);
      conversationRepository.save.mockResolvedValue(createdConversation);
      sectionRepository.create.mockImplementation((data) => data);
      sectionRepository.save.mockResolvedValue([]);

      // findOne called after import
      conversationRepository.findOne.mockResolvedValue({
        ...createdConversation,
        sections: [
          { id: 'sec-1', title: 'Main', content: 'Content here', order: 0 },
        ],
      });

      const result = await service.importFromGoogleDocs(userId, {
        documentId: 'doc-456',
      });

      expect(googleDriveService.fetchDocument).toHaveBeenCalledWith(
        'mock-access-token',
        'doc-456',
      );
      expect(conversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          title: 'Imported Doc',
          sourceType: 'google_docs',
          sourceId: 'doc-456',
        }),
      );
      expect(result.conversation.sections).toHaveLength(1);
      expect(result.conversation.sections[0].title).toBe('Main');
    });

    it('throws NotFoundException when user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.importFromGoogleDocs(userId, { documentId: 'doc-123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('associates conversation with a person when personId is provided', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      googleDriveService.fetchDocument.mockResolvedValue({
        title: 'Doc With Person',
        sections: [{ title: 'Main', content: 'Test' }],
      });

      const personId = 'person-uuid-1';
      const createdConversation = {
        id: 'new-conv-id',
        userId,
        personId,
        title: 'Doc With Person',
      };
      conversationRepository.create.mockReturnValue(createdConversation);
      conversationRepository.save.mockResolvedValue(createdConversation);
      sectionRepository.create.mockImplementation((data) => data);
      sectionRepository.save.mockResolvedValue([]);
      conversationRepository.findOne.mockResolvedValue({
        ...createdConversation,
        sections: [{ id: 'sec-1', title: 'Main', content: 'Test', order: 0 }],
      });

      await service.importFromGoogleDocs(userId, {
        documentId: 'doc-789',
        personId,
      });

      expect(conversationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ personId }),
      );
    });
  });
});
