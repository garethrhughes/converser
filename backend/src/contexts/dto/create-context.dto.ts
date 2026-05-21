import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateContextDto {
  @ApiProperty({ description: 'Context name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Context description',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Context content' })
  @IsString()
  content!: string;
}
