import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Person } from './person.entity';
import { Conversation } from './conversation.entity';
import { ConversationSection } from './conversation-section.entity';
import { Agent } from './agent.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'person_id', nullable: true })
  personId?: string;

  @Column({ name: 'conversation_id', nullable: true })
  conversationId?: string;

  @Column({ name: 'conversation_section_id', nullable: true })
  conversationSectionId?: string;

  @Column({ name: 'agent_id', nullable: true })
  agentId?: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'model_id', length: 255 })
  modelId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Person, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'person_id' })
  person?: Person;

  @ManyToOne(() => Conversation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'conversation_id' })
  conversation?: Conversation;

  @ManyToOne(() => ConversationSection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'conversation_section_id' })
  conversationSection?: ConversationSection;

  @ManyToOne(() => Agent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'agent_id' })
  agent?: Agent;
}
