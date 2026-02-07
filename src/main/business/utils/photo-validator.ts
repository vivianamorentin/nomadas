import { BadRequestException } from '@nestjs/common';

/**
 * Validate photo file type
 */
export function validatePhotoFileType(fileName: string): string {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  switch (fileExtension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WEBP are allowed.',
      );
  }
}

/**
 * Validate photo file size
 */
export function validatePhotoFileSize(fileSizeBytes: number): void {
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (fileSizeBytes > maxSize) {
    throw new BadRequestException('File size cannot exceed 5MB.');
  }

  if (fileSizeBytes === 0) {
    throw new BadRequestException('File is empty.');
  }
}

/**
 * Validate photo dimensions
 */
export function validatePhotoDimensions(width: number, height: number): void {
  const minDimension = 400;
  const maxDimension = 8000;

  if (width < minDimension || height < minDimension) {
    throw new BadRequestException(
      `Image dimensions must be at least ${minDimension}x${minDimension} pixels.`,
    );
  }

  if (width > maxDimension || height > maxDimension) {
    throw new BadRequestException(
      `Image dimensions cannot exceed ${maxDimension}x${maxDimension} pixels.`,
    );
  }
}

/**
 * Validate photo count
 */
export function validatePhotoCount(currentCount: number): void {
  const minPhotos = 1;
  const maxPhotos = 10;

  if (currentCount >= maxPhotos) {
    throw new BadRequestException(
      `Maximum limit of ${maxPhotos} photos reached. Please delete existing photos before uploading new ones.`,
    );
  }

  if (currentCount < minPhotos) {
    throw new BadRequestException(
      `Business profiles must have at least ${minPhotos} photo.`,
    );
  }
}

/**
 * Validate photo before deletion
 */
export function validatePhotoDeletion(currentCount: number, isPrimary: boolean): void {
  const minPhotos = 1;

  if (currentCount === minPhotos) {
    throw new BadRequestException(
      'Cannot delete the only photo. Business profiles must have at least 1 photo.',
    );
  }

  // Additional validation could be added here
  // For example, prevent deleting primary photo if there are other photos
}
