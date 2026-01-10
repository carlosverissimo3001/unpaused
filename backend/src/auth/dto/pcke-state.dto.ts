import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class PkceStateDto {
    @ApiProperty({ example: "1234567890" })
    @IsString()
    codeVerifier: string;

    @ApiProperty({ example: 1715328000 })
    @IsNumber()
    createdAt: number;
}