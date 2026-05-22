import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from '../database/entities/person.entity';
import { Memory } from '../database/entities/memory.entity';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { MemoryService } from './memory.service';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Person, Memory]),
    forwardRef(() => ReportsModule),
  ],
  controllers: [PeopleController],
  providers: [PeopleService, MemoryService],
  exports: [PeopleService, MemoryService],
})
export class PeopleModule {}
