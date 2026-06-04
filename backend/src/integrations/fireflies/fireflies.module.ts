import { Module } from '@nestjs/common';
import { FirefliesService } from './fireflies.service';

@Module({
  providers: [FirefliesService],
  exports: [FirefliesService],
})
export class FirefliesModule {}
