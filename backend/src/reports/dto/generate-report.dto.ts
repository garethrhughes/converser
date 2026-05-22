import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsArray, IsOptional } from 'class-validator';

export class GenerateReportDto {
  @ApiProperty({ description: 'Person ID this report is about' })
  @IsUUID()
  personId!: string;

  @ApiProperty({ description: 'Conversation ID to analyse' })
  @IsUUID()
  conversationId!: string;

  @ApiProperty({
    description: 'Specific section ID (required if conversation has multiple sections)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({
    description: 'Array of context IDs to include as background',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  contextIds!: string[];

  @ApiProperty({ description: 'Agent ID whose instructions to use' })
  @IsUUID()
  agentId!: string;
}
