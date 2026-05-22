import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateMemoryDto {
  @ApiProperty({ description: 'Updated memory content' })
  @IsString()
  @MinLength(1)
  content!: string;
}
