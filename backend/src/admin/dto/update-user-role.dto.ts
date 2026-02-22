import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';
import { Transform } from 'class-transformer';
import { toBoolean } from '../../utils/transformers/toBoolean.transform';

export class UpdateUserRoleDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value))
  @IsNotNullableOptional()
  isTrusted?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @Transform(({ value }) => toBoolean(value))
  @IsNotNullableOptional()
  isAdmin?: boolean;
}
