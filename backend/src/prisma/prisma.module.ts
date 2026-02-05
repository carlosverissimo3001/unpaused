import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PRISMA_CLIENT_INTERNAL } from './prisma.constants';

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: PRISMA_CLIENT_INTERNAL, useExisting: PrismaService },
  ],
  exports: [PRISMA_CLIENT_INTERNAL],
})
export class PrismaModule {}
