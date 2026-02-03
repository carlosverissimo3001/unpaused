import { ApiProperty } from "@nestjs/swagger";

export class UserEntity {
    @ApiProperty({ example: "123" })
    id: string;

    @ApiProperty({ example: "spotify_user_123" })
    spotifyUserId: string;
    
    @ApiProperty({ example: "John Doe" })
    displayName: string;
    
    @ApiProperty({ example: false })
    isTrusted: boolean;

    @ApiProperty({ example: false })
    isAdmin: boolean;

    @ApiProperty({ example: "2021-01-01" })
    createdAt: Date;

    @ApiProperty({ example: "2021-01-01" })
    updatedAt: Date;
}