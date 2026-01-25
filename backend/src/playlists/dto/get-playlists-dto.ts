import { ApiPropertyOptional } from "@nestjs/swagger";
import { toBoolean } from "../../utils/transformers/toBoolean.transform";
import { Transform } from "class-transformer";
import { IsNotNullableOptional } from "../../utils/decorators/notNullableOptional.decorator";
import { IsBoolean, IsNumber } from "class-validator";

export class GetPlaylistsDto {
  @ApiPropertyOptional({ example: 20 })
  @IsNotNullableOptional()
  @IsNumber()
  limit?: number;
  
  @ApiPropertyOptional({ example: 0 })
  @IsNotNullableOptional()
  @IsNumber()
  offset?: number;
  
  @ApiPropertyOptional({ example: false, default: false })
  @IsNotNullableOptional()
  @IsBoolean()
  @Transform(({ obj }) => toBoolean(obj.includePrivate))
  includePrivate?: boolean = false;
  
  @ApiPropertyOptional({ example: false, default: false })
  @IsNotNullableOptional()
  @IsBoolean()
  @Transform(({ obj }) => toBoolean(obj.onlyUserOwned))
  onlyUserOwned?: boolean = true;
}