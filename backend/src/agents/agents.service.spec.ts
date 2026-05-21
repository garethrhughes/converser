import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Agent } from '../database/entities/agent.entity';

describe('AgentsService', () => {
  let service: AgentsService;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  const userId = 'user-uuid-1';
  const agentId = 'agent-uuid-1';

  const mockAgent: Partial<Agent> = {
    id: agentId,
    userId,
    name: 'Test Agent',
    description: 'A test agent',
    instructions: 'Do the thing',
    isDefault: false,
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
        AgentsService,
        {
          provide: getRepositoryToken(Agent),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
  });

  describe('findAll', () => {
    it('returns all agents for the given user', async () => {
      const agents = [mockAgent];
      repository.find.mockResolvedValue(agents);

      const result = await service.findAll(userId);

      expect(result).toEqual(agents);
      expect(repository.find).toHaveBeenCalledWith({ where: { userId } });
    });

    it('returns empty array when user has no agents', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the agent when it belongs to the user', async () => {
      repository.findOne.mockResolvedValue(mockAgent);

      const result = await service.findOne(userId, agentId);

      expect(result).toEqual(mockAgent);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: agentId, userId },
      });
    });

    it('throws NotFoundException when agent does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when agent belongs to a different user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('other-user-id', agentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns a new agent for the user', async () => {
      const dto = { name: 'New Agent', instructions: 'Instructions here' };
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
    it('updates and returns the agent', async () => {
      const dto = { name: 'Updated Name' };
      repository.findOne.mockResolvedValue({ ...mockAgent });
      repository.save.mockResolvedValue({ ...mockAgent, ...dto });

      const result = await service.update(userId, agentId, dto);

      expect(result.name).toBe('Updated Name');
      expect(repository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when agent does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes the agent', async () => {
      repository.findOne.mockResolvedValue(mockAgent);
      repository.remove.mockResolvedValue(mockAgent);

      await service.remove(userId, agentId);

      expect(repository.remove).toHaveBeenCalledWith(mockAgent);
    });

    it('throws NotFoundException when agent does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('seedDefaultAgents', () => {
    it('creates default agents for the user with isDefault flag', async () => {
      repository.create.mockImplementation((data) => data);
      repository.save.mockResolvedValue([]);

      await service.seedDefaultAgents(userId);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          isDefault: true,
          name: '1-1 Feedback Evaluator',
        }),
      );
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
