import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotNullableOptional } from "@/utils/decorators/notNullableOptional.decorator";
import { IsString } from "class-validator";

export class UpdateMessageDto {
    @ApiPropertyOptional({ example: "Message Title" })
    @IsNotNullableOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: "Message Note" })
    @IsNotNullableOptional()
    @IsString()
    note?: string;
}