import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: '31yi2gea663ygabtxv6ibrw5cwxa' })
  id: string;

  @ApiProperty({ example: 'Carlos Veríssimo' })
  displayName: string;

  @ApiProperty({ 
    example: 'https://i.scdn.co/image/...', 
    description: 'The primary profile image' 
  })
  avatarUrl: string;
}