import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

type Predicate = (object: Record<string, unknown>) => boolean;

const isGiven = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const isAbsent = (value: unknown): boolean =>
  value === undefined || value === null;

/**
 * A field one shape of the request needs and every other shape must not carry.
 *
 * Both directions live in one constraint on purpose. A property has a single
 * ValidateIf condition governing every validator on it, so a "required here"
 * rule and a "forbidden there" rule cannot be composed from two of them — the
 * second condition switches the first one off. That also means the shape check
 * belongs here rather than in a separate @IsString(), which would fire on the
 * absent-and-allowed case.
 */
export function RequiredWhen(
  predicate: Predicate,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'requiredWhen',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          return predicate(args.object as Record<string, unknown>)
            ? isGiven(value)
            : isAbsent(value);
        },
        defaultMessage(args: ValidationArguments) {
          return predicate(args.object as Record<string, unknown>)
            ? `${args.property} is required for this source`
            : `${args.property} does not belong on this source`;
        },
      },
    });
  };
}

/**
 * A field that is optional, but only on some shapes of the request. The
 * counterpart to RequiredWhen, for an id that narrows a request rather than
 * completing it.
 */
export function ForbiddenWhen(
  predicate: Predicate,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'forbiddenWhen',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (predicate(args.object as Record<string, unknown>)) {
            return isAbsent(value);
          }
          return isAbsent(value) || isGiven(value);
        },
        defaultMessage(args: ValidationArguments) {
          return predicate(args.object as Record<string, unknown>)
            ? `${args.property} does not belong on this source`
            : `${args.property} must be a non-empty string`;
        },
      },
    });
  };
}
