import { applyDecorators } from '@nestjs/common';
import { ValidateIf, IsDefined } from 'class-validator';

export function IsNotNullableOptional() {
  return applyDecorators(
    ValidateIf((_object, value) => value !== undefined),
    IsDefined({ message: '$property cannot be null' }),
  );
}
