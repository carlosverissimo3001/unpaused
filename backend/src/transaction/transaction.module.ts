import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { PrismaService } from '@prisma/prisma.service';
import { PRISMA_CLIENT_INTERNAL } from '@prisma/prisma.constants';
import { TransactionBootstrap } from './transaction.bootstrap';
import { TransactionService } from './transaction.service';
import { createPrismaProxy } from './prisma-proxy.factory';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    TransactionBootstrap,
    TransactionService,
    {
      provide: PrismaService,
      useFactory: createPrismaProxy,
      inject: [PRISMA_CLIENT_INTERNAL],
    },
  ],
  exports: [PrismaService, TransactionService],
})
export class TransactionModule {}
