import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Context } from '../database/entities/context.entity';
import { CreateContextDto } from './dto/create-context.dto';
import { UpdateContextDto } from './dto/update-context.dto';

@Injectable()
export class ContextsService {
  private readonly logger = new Logger(ContextsService.name);

  constructor(
    @InjectRepository(Context)
    private readonly contextRepository: Repository<Context>,
  ) {}

  async findAll(userId: string): Promise<Context[]> {
    return this.contextRepository.find({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<Context> {
    const context = await this.contextRepository.findOne({
      where: { id, userId },
    });

    if (!context) {
      throw new NotFoundException(`Context with id ${id} not found`);
    }

    return context;
  }

  async create(userId: string, dto: CreateContextDto): Promise<Context> {
    const context = this.contextRepository.create({
      ...dto,
      userId,
    });

    const saved = await this.contextRepository.save(context);
    this.logger.log({ msg: 'Context created', contextId: saved.id, userId });
    return saved;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateContextDto,
  ): Promise<Context> {
    const context = await this.findOne(userId, id);

    Object.assign(context, dto);
    const saved = await this.contextRepository.save(context);
    this.logger.log({ msg: 'Context updated', contextId: saved.id, userId });
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const context = await this.findOne(userId, id);

    await this.contextRepository.remove(context);
    this.logger.log({ msg: 'Context removed', contextId: id, userId });
  }
}
