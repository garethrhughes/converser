import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Context } from '../database/entities/context.entity';
import { ContextsController } from './contexts.controller';
import { ContextsService } from './contexts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Context])],
  controllers: [ContextsController],
  providers: [ContextsService],
  exports: [ContextsService],
})
export class ContextsModule {}
