import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreatePersonDto {
  @ApiProperty({ description: 'Person name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Person description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
