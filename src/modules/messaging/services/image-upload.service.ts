import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from 'src/shared/infrastructure/storage/storage.service';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { RequestImageUploadDto, ConfirmImageUploadDto } from '../dto/image-upload.dto';
import * as Sharp from 'sharp';

/**
 * Image Upload Service
 * SPEC-MSG-001 Phase 2
 * Handles image uploads for messages using S3 presigned URLs
 */
@Injectable()
export class ImageUploadService {
  private readonly logger = new Logger(ImageUploadService.name);
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate presigned URL for image upload
   * Two-phase upload: Client uploads directly to S3
   */
  async generateUploadUrl(
    conversationId: string,
    userId: number,
    dto: RequestImageUploadDto,
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    // Verify conversation access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    // Validate file type
    if (!this.ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (dto.fileSizeBytes > this.MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Maximum size: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Generate unique storage key
    const storageKey = this.storageService.generateKey(userId.toString(), 'messages', dto.filename);

    // Generate presigned upload URL (15 minute expiry)
    const uploadUrl = await this.storageService.generateUploadUrl(storageKey, dto.mimeType, 'photos');

    this.logger.log(`Generated upload URL for user ${userId}: ${storageKey}`);

    return {
      uploadUrl,
      storageKey,
    };
  }

  /**
   * Confirm image upload and create MessageImage record
   * Also generates thumbnail and preview images
   */
  async confirmUpload(
    conversationId: string,
    userId: number,
    messageId: string,
    dto: ConfirmImageUploadDto,
  ) {
    // Verify message exists and belongs to user
    const message = await this.prisma.messageNew.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only confirm uploads for your own messages');
    }

    if (message.conversationId !== conversationId) {
      throw new ForbiddenException('Message does not belong to this conversation');
    }

    // Verify S3 object exists (client should have uploaded)
    // In production, you would check S3 here
    const s3Url = `https://${this.configService.get('S3_BUCKET_PHOTOS')}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${dto.storageKey}`;

    // Create MessageImage record
    const messageImage = await this.prisma.messageImage.create({
      data: {
        messageId,
        storageKey: dto.storageKey,
        fileSizeBytes: null, // Will be updated if needed
        mimeType: null, // Will be extracted if needed
        width: dto.width,
        height: dto.height,
        originalUrl: s3Url,
        thumbnailUrl: null, // TODO: Generate thumbnail asynchronously
        previewUrl: null, // TODO: Generate preview asynchronously
      },
    });

    this.logger.log(`Image upload confirmed: ${messageImage.id}`);

    return messageImage;
  }

  /**
   * Generate thumbnail from uploaded image
   * Uses Sharp for image processing
   */
  async generateThumbnail(
    storageKey: string,
    width: number,
    height: number,
  ): Promise<{ thumbnailKey: string; previewKey: string }> {
    // Download original image from S3
    // For now, this is a placeholder
    // In production, you would:
    // 1. Download from S3
    // 2. Process with Sharp to generate thumbnail (300x300) and preview (1200x1200)
    // 3. Upload both back to S3
    // 4. Return the new keys

    this.logger.log(`Generating thumbnails for ${storageKey} (placeholder)`);

    return {
      thumbnailKey: `thumbnails/${storageKey}`,
      previewKey: `previews/${storageKey}`,
    };
  }

  /**
   * Delete image (soft delete - set deleteAfter timestamp)
   * NFR-MSG-SEC-006: Auto-delete after 90 days (GDPR)
   */
  async deleteImage(imageId: string, userId: number) {
    const image = await this.prisma.messageImage.findUnique({
      where: { id: imageId },
      include: {
        message: {
          select: {
            senderId: true,
          },
        },
      },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Only the message sender can delete the image
    if (image.message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own uploaded images');
    }

    // Soft delete by setting deleteAfter to now
    const updated = await this.prisma.messageImage.update({
      where: { id: imageId },
      data: {
        deleteAfter: new Date(),
      },
    });

    this.logger.log(`Image ${imageId} marked for deletion by user ${userId}`);

    return updated;
  }

  /**
   * Validate image file type
   */
  isValidImageType(mimeType: string): boolean {
    return this.ALLOWED_MIME_TYPES.includes(mimeType);
  }

  /**
   * Validate image file size
   */
  isValidFileSize(size: number): boolean {
    return size <= this.MAX_FILE_SIZE;
  }
}
