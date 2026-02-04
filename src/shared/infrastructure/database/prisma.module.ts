import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma Database Module
 * Provides Prisma ORM service globally
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
