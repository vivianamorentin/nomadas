import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from './schema';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}