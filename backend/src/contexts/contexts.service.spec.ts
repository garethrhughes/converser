import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ContextsService } from './contexts.service';
import { Context } from '../database/entities/context.entity';

describe('ContextsService', () => {
  let service: ContextsService;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  const userId = 'user-uuid-1';
  const contextId = 'context-uuid-1';

  const mockContext: Partial<Context> = {
    id: contextId,
    userId,
    name: 'Test Context',
    description: 'A test context',
    content: 'Some content here',
    sourceType: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextsService,
        {
          provide: getRepositoryToken(Context),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ContextsService>(ContextsService);
  });

  describe('findAll', () => {
    it('returns all contexts for the given user', async () => {
      const contexts = [mockContext];
      repository.find.mockResolvedValue(contexts);

      const result = await service.findAll(userId);

      expect(result).toEqual(contexts);
      expect(repository.find).toHaveBeenCalledWith({ where: { userId } });
    });

    it('returns empty array when user has no contexts', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the context when it belongs to the user', async () => {
      repository.findOne.mockResolvedValue(mockContext);

      const result = await service.findOne(userId, contextId);

      expect(result).toEqual(mockContext);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: contextId, userId },
      });
    });

    it('throws NotFoundException when context does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when context belongs to a different user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('other-user-id', contextId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns a new context for the user', async () => {
      const dto = { name: 'New Context', content: 'Content here' };
      const created = { ...dto, userId, id: 'new-id' };
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue({ ...created, createdAt: new Date() });

      const result = await service.create(userId, dto);

      expect(repository.create).toHaveBeenCalledWith({ ...dto, userId });
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('updates and returns the context', async () => {
      const dto = { name: 'Updated Name' };
      repository.findOne.mockResolvedValue({ ...mockContext });
      repository.save.mockResolvedValue({ ...mockContext, ...dto });

      const result = await service.update(userId, contextId, dto);

      expect(result.name).toBe('Updated Name');
      expect(repository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when context does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes the context', async () => {
      repository.findOne.mockResolvedValue(mockContext);
      repository.remove.mockResolvedValue(mockContext);

      await service.remove(userId, contextId);

      expect(repository.remove).toHaveBeenCalledWith(mockContext);
    });

    it('throws NotFoundException when context does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
