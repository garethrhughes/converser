import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Person } from './person.entity';
import { ConversationSection } from './conversation-section.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'person_id', nullable: true })
  personId?: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ name: 'source_type', length: 50, default: 'google_docs' })
  sourceType!: string;

  @Column({ name: 'source_id', length: 255, nullable: true })
  sourceId?: string;

  @Column({ name: 'source_url', type: 'text', nullable: true })
  sourceUrl?: string;

  @Column({ name: 'imported_at', type: 'timestamptz' })
  importedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Person, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'person_id' })
  person?: Person;

  @OneToMany(() => ConversationSection, (section) => section.conversation)
  sections!: ConversationSection[];
}
