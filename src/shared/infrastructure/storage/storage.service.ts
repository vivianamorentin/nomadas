import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3 Storage Service
 * Handles file uploads, downloads, and presigned URLs
 */
@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly photosBucket: string;
  private readonly assetsBucket: string;
  private readonly backupsBucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.photosBucket = this.configService.get<string>('S3_BUCKET_PHOTOS');
    this.assetsBucket = this.configService.get<string>('S3_BUCKET_ASSETS');
    this.backupsBucket = this.configService.get<string>('S3_BUCKET_BACKUPS');
  }

  /**
   * Generate presigned URL for upload
   */
  async generateUploadUrl(
    key: string,
    contentType: string,
    bucket: 'photos' | 'assets' = 'photos',
  ): Promise<string> {
    const bucketName = bucket === 'photos' ? this.photosBucket : this.assetsBucket;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 900 }); // 15 minutes
  }

  /**
   * Generate presigned URL for download
   */
  async generateDownloadUrl(
    key: string,
    bucket: 'photos' | 'assets' = 'photos',
  ): Promise<string> {
    const bucketName = bucket === 'photos' ? this.photosBucket : this.assetsBucket;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hour
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    key: string,
    body: Buffer,
    contentType: string,
    bucket: 'photos' | 'assets' = 'photos',
  ): Promise<string> {
    const bucketName = bucket === 'photos' ? this.photosBucket : this.assetsBucket;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    const location = `https://${bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${key}`;
    this.logger.log(`File uploaded: ${location}`);

    return location;
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string, bucket: 'photos' | 'assets' = 'photos'): Promise<void> {
    const bucketName = bucket === 'photos' ? this.photosBucket : this.assetsBucket;

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await this.s3Client.send(command);

    this.logger.log(`File deleted: ${key}`);
  }

  /**
   * Get CloudFront URL for file
   */
  getCloudFrontUrl(key: string, bucket: 'photos' | 'assets' = 'photos'): string {
    const cloudfrontDomain = this.configService.get<string>('CLOUDFRONT_DOMAIN');
    return `https://${cloudfrontDomain}/${bucket}/${key}`;
  }

  /**
   * Generate unique key for upload
   */
  generateKey(userId: string, fileType: string, originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${userId}/${fileType}/${timestamp}-${random}.${extension}`;
  }

  /**
   * Validate image type
   */
  isValidImageType(contentType: string): boolean {
    const allowedTypes = this.configService
      .get<string>('ALLOWED_IMAGE_TYPES')
      .split(',');
    return allowedTypes.includes(contentType);
  }

  /**
   * Validate file size
   */
  isValidFileSize(size: number): boolean {
    const maxSize = parseInt(this.configService.get<string>('MAX_FILE_SIZE'));
    return size <= maxSize;
  }
}
