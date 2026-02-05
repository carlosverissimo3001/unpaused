import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Message Title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Message Note' })
  @IsNotEmpty()
  @IsString()
  note: string;
}
