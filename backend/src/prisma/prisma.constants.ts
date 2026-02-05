/**
 * Injection token for the real Prisma client (used only by TransactionService to run $transaction).
 * Other code should inject PrismaService, which is the transaction-aware proxy when TransactionModule is loaded.
 */
export const PRISMA_CLIENT_INTERNAL = Symbol('PRISMA_CLIENT_INTERNAL');
