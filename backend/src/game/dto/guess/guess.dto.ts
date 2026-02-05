import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { IsNotNullableOptional } from "@utils/decorators/notNullableOptional.decorator";
import { toBoolean } from "@utils/transformers/toBoolean.transform";
import { Transform } from "class-transformer";

export class GuessDto {
    @ApiPropertyOptional({ description: "The ID of the track to guess", type: String })
    @IsNotNullableOptional()
    @IsString()
    trackId?: string;
  
    @ApiPropertyOptional({ description: "Whether the current guess is a skip", type: Boolean })
    @IsNotNullableOptional()
    @Transform(({ obj }) => toBoolean(obj.skip))
    skip?: boolean = false;

    @ApiPropertyOptional({ description: "Track name", type: String })
    @IsNotNullableOptional()
    @IsString()
    trackName?: string;

    @ApiPropertyOptional({ description: "Artist name", type: String })
    @IsNotNullableOptional()
    @IsString()
    artistName?: string;

    @ApiPropertyOptional({ description: "Album name", type: String })
    @IsNotNullableOptional()
    @IsString()
    albumName?: string;
  }
  