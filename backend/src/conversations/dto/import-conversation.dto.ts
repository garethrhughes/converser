import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class ImportConversationDto {
  @ApiProperty({ description: 'Google Docs document ID' })
  @IsString()
  documentId!: string;

  @ApiProperty({
    description: 'Person ID to associate the conversation with',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  personId?: string;
}
