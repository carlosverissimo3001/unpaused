import { transactionStorage, getBasePrismaClient } from "./transaction.store";

const TRANSACTIONAL_KEY = Symbol("transactional");

/**
 * Method decorator that runs the method body inside a Prisma transaction.
 * No injection required: uses the global base Prisma client and ALS for context.
 * The transaction client is stored in AsyncLocalStorage; any code using the
 * transaction-aware PrismaService (proxy) automatically participates.
 * If the method throws, the transaction is rolled back.
 */
export function Transactional(): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    if (typeof originalMethod !== "function") {
      throw new Error(
        `@Transactional() can only be applied to methods. Invalid target: ${String(propertyKey)}`,
      );
    }

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const prisma = getBasePrismaClient();
      return prisma.$transaction(async (tx) => {
        return transactionStorage.run({ tx }, () =>
          originalMethod.apply(this, args),
        );
      });
    };

    Reflect.defineMetadata(TRANSACTIONAL_KEY, true, descriptor.value);
    return descriptor;
  };
}
