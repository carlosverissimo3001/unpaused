import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { PRISMA_CLIENT_INTERNAL } from '@prisma/prisma.constants';
import type { PrismaClient } from '@prisma/client';
import { setBasePrismaClient } from './transaction.store';

/**
 * Sets the base Prisma client in the transaction store at module init so
 * the decorator and proxy can use it without injection.
 */
@Injectable()
export class TransactionBootstrap implements OnModuleInit {
  constructor(
    @Inject(PRISMA_CLIENT_INTERNAL)
    private readonly prisma: PrismaClient,
  ) {}

  onModuleInit(): void {
    setBasePrismaClient(this.prisma);
  }
}
