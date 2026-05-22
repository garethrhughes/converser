import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ description: 'Agent name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Agent description',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Agent instructions in markdown' })
  @IsString()
  instructions!: string;

  @ApiProperty({
    description: 'Custom memory extraction instructions in markdown (uses default if not set)',
    required: false,
  })
  @IsString()
  @IsOptional()
  memoryInstructions?: string;
}
