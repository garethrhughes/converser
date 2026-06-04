import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportFirefliesDto {
  @ApiProperty({ description: 'Fireflies transcript ID' })
  @IsString()
  @IsNotEmpty()
  transcriptId!: string;

  @ApiPropertyOptional({ description: 'Person ID to link the conversation to' })
  @IsUUID()
  @IsOptional()
  personId?: string;
}
