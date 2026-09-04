import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { domainCanReceiveMail, domainOf } from '../../auth/utils/mail-domain';

/**
 * Pairs with @IsEmail(), which only checks the shape: carlos@gmial.con passes
 * that. This asks whether the domain can receive mail at all, so a typo is
 * caught at signup rather than becoming an account nobody can verify.
 */
export function IsDeliverableEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDeliverableEmail',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        async validate(value: unknown) {
          if (typeof value !== 'string') return false;
          const domain = domainOf(value);
          // A malformed address is @IsEmail()'s complaint to make, not ours.
          if (!domain) return true;
          return domainCanReceiveMail(domain);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} is at a domain that cannot receive mail — check it for a typo`;
        },
      },
    });
  };
}
