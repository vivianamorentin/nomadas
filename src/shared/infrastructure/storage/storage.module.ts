import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Storage Module
 * Provides S3 file storage service globally
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
