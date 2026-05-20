import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExchangeCodeDto {
  @ApiProperty({
    description: 'Single-use authorization code from OAuth callback',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @Length(64, 64)
  @Matches(/^[a-f0-9]+$/, {
    message: 'code must be a 64-character hex string',
  })
  code!: string;
}
