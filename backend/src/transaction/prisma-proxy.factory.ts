import { getTxClient } from "./transaction.store";
import type { PrismaClient } from "@prisma/client";

/**
 * Creates a proxy around the base Prisma client. The proxy's get trap uses
 * getTxClient(base) so that inside a @Transactional() boundary all model
 * access and raw queries ($queryRaw, $executeRaw, etc.) use the active tx.
 * No TransactionService or other injection required.
 */
export function createPrismaProxy(basePrisma: PrismaClient): PrismaClient {
  return new Proxy(basePrisma, {
    get(target, prop) {
      const client = getTxClient(target);
      const value = (client as unknown as Record<string | symbol, unknown>)[prop];
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  }) as unknown as PrismaClient;
}
