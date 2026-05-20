import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'google_id', unique: true })
  googleId!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ name: 'hashed_refresh_token', nullable: true })
  hashedRefreshToken?: string;

  @Column({ name: 'google_access_token_enc', type: 'text', nullable: true })
  googleAccessTokenEnc?: string;

  @Column({ name: 'google_refresh_token_enc', type: 'text', nullable: true })
  googleRefreshTokenEnc?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
