import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PeopleService } from './people.service';
import { Person } from '../database/entities/person.entity';

describe('PeopleService', () => {
  let service: PeopleService;
  let repository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  const userId = 'user-uuid-1';
  const personId = 'person-uuid-1';

  const mockPerson: Partial<Person> = {
    id: personId,
    userId,
    name: 'John Doe',
    description: 'A test person',
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
        PeopleService,
        {
          provide: getRepositoryToken(Person),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<PeopleService>(PeopleService);
  });

  describe('findAll', () => {
    it('returns all people for the given user', async () => {
      const people = [mockPerson];
      repository.find.mockResolvedValue(people);

      const result = await service.findAll(userId);

      expect(result).toEqual(people);
      expect(repository.find).toHaveBeenCalledWith({ where: { userId } });
    });

    it('returns empty array when user has no people', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns the person when it belongs to the user', async () => {
      repository.findOne.mockResolvedValue(mockPerson);

      const result = await service.findOne(userId, personId);

      expect(result).toEqual(mockPerson);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: personId, userId },
      });
    });

    it('throws NotFoundException when person does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when person belongs to a different user', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('other-user-id', personId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates and returns a new person for the user', async () => {
      const dto = { name: 'Jane Doe', description: 'New person' };
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
    it('updates and returns the person', async () => {
      const dto = { name: 'Updated Name' };
      repository.findOne.mockResolvedValue({ ...mockPerson });
      repository.save.mockResolvedValue({ ...mockPerson, ...dto });

      const result = await service.update(userId, personId, dto);

      expect(result.name).toBe('Updated Name');
      expect(repository.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when person does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes the person', async () => {
      repository.findOne.mockResolvedValue(mockPerson);
      repository.remove.mockResolvedValue(mockPerson);

      await service.remove(userId, personId);

      expect(repository.remove).toHaveBeenCalledWith(mockPerson);
    });

    it('throws NotFoundException when person does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
