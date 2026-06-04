import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectFirefliesDto {
  @ApiProperty({ description: 'Fireflies.ai API key' })
  @IsString()
  @IsNotEmpty()
  apiKey!: string;
}
