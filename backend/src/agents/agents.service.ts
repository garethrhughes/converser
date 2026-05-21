import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../database/entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { defaultAgents } from './seeds/default-agents';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async findAll(userId: string): Promise<Agent[]> {
    return this.agentRepository.find({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id, userId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with id ${id} not found`);
    }

    return agent;
  }

  async create(userId: string, dto: CreateAgentDto): Promise<Agent> {
    const agent = this.agentRepository.create({
      ...dto,
      userId,
    });

    const saved = await this.agentRepository.save(agent);
    this.logger.log({ msg: 'Agent created', agentId: saved.id, userId });
    return saved;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAgentDto,
  ): Promise<Agent> {
    const agent = await this.findOne(userId, id);

    Object.assign(agent, dto);
    const saved = await this.agentRepository.save(agent);
    this.logger.log({ msg: 'Agent updated', agentId: saved.id, userId });
    return saved;
  }

  async remove(userId: string, id: string): Promise<void> {
    const agent = await this.findOne(userId, id);

    await this.agentRepository.remove(agent);
    this.logger.log({ msg: 'Agent removed', agentId: id, userId });
  }

  async seedDefaultAgents(userId: string): Promise<void> {
    const agents = defaultAgents.map((seed) =>
      this.agentRepository.create({
        ...seed,
        userId,
        isDefault: true,
      }),
    );

    await this.agentRepository.save(agents);
    this.logger.log({
      msg: 'Default agents seeded',
      userId,
      count: agents.length,
    });
  }
}
