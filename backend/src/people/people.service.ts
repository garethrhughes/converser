import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../database/entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async findAll(userId: string): Promise<Person[]> {
    return this.personRepository.find({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { id, userId },
    });

    if (!person) {
      throw new NotFoundException(`Person with id ${id} not found`);
    }

    return person;
  }

  async create(userId: string, dto: CreatePersonDto): Promise<Person> {
    const person = this.personRepository.create({
      ...dto,
      userId,
    });

    const saved = await this.personRepository.save(person);
    this.logger.log({ msg: 'Person created', personId: saved.id, userId });
    return saved;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePersonDto,
  ): Promise<Person> {
    const person = await this.findOne(userId, id);

    Object.assign(person, dto);
    const saved = await this.personRepository.save(person);
    this.logger.log({ msg: 'Person updated', personId: saved.id, userId });
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const person = await this.findOne(userId, id);

    await this.personRepository.remove(person);
    this.logger.log({ msg: 'Person removed', personId: id, userId });
  }
}
