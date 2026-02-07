import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PhotoUploadService } from '../services/photo-upload.service';
import { UploadPhotoDto, ConfirmUploadDto, ReorderPhotosDto } from '../dto';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { User } from '../../identity/decorators/user.decorator';

@ApiTags('Business Photos')
@Controller('business-profiles/:id/photos')
export class PhotoController {
  constructor(private readonly photoUploadService: PhotoUploadService) {}

  @Post('upload-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate presigned URL for photo upload',
    description: 'Generates an AWS S3 presigned URL for direct photo upload. Client uploads directly to S3, then confirms with the confirm endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully',
    schema: {
      example: {
        uploadUrl: 'https://bucket.s3.amazonaws.com/key?signature=...',
        fileKey: 'business-profiles/123/photos/1735824000-abc123.jpg',
        expiresIn: 900,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid file type or photo limit reached' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your business profile' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async generateUploadUrl(
    @Param('id') businessProfileId: string,
    @User() user: any,
    @Body() uploadDto: UploadPhotoDto,
  ) {
    return this.photoUploadService.generatePresignedUploadUrl(
      +businessProfileId,
      uploadDto.fileName,
      uploadDto.contentType,
      user.id,
    );
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Confirm photo upload and process image',
    description: 'Confirms that photo was uploaded to S3 and processes the image (generates thumbnail and standard size).',
  })
  @ApiResponse({
    status: 201,
    description: 'Photo uploaded and processed successfully',
    schema: {
      example: {
        message: 'Photo uploaded and processed successfully!',
        photo: {
          id: 1,
          fileUrl: 'https://cdn.example.com/photo_standard.jpg',
          thumbnailUrl: 'https://cdn.example.com/photo_thumb.jpg',
          width: 1920,
          height: 1080,
          isPrimary: true,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid image' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your business profile' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async confirmUpload(
    @Param('id') businessProfileId: string,
    @User() user: any,
    @Body() confirmDto: ConfirmUploadDto,
  ) {
    return this.photoUploadService.confirmPhotoUpload(
      +businessProfileId,
      confirmDto.fileKey,
      user.id,
    );
  }

  @Put('reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reorder photos',
    description: 'Changes the display order of photos by updating their uploadOrder field.',
  })
  @ApiResponse({
    status: 200,
    description: 'Photos reordered successfully',
    schema: {
      example: {
        message: 'Photos reordered successfully!',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid photo IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your business profile' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async reorderPhotos(
    @Param('id') businessProfileId: string,
    @User() user: any,
    @Body() reorderDto: ReorderPhotosDto,
  ) {
    return this.photoUploadService.reorderPhotos(
      +businessProfileId,
      reorderDto.photoIds,
      user.id,
    );
  }

  @Post(':photoId/set-primary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set primary photo',
    description: 'Sets a specific photo as the primary photo for the business profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'Primary photo set successfully',
    schema: {
      example: {
        message: 'Primary photo set successfully!',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your business profile' })
  @ApiResponse({ status: 404, description: 'Business profile or photo not found' })
  async setPrimaryPhoto(
    @Param('id') businessProfileId: string,
    @Param('photoId') photoId: string,
    @User() user: any,
  ) {
    return this.photoUploadService.setPrimaryPhoto(
      +businessProfileId,
      +photoId,
      user.id,
    );
  }

  @Delete(':photoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a photo',
    description: 'Deletes a photo from the business profile. Minimum 1 photo is required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Photo deleted successfully',
    schema: {
      example: {
        message: 'Photo deleted successfully!',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Cannot delete the only photo' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your business profile' })
  @ApiResponse({ status: 404, description: 'Business profile or photo not found' })
  async deletePhoto(
    @Param('id') businessProfileId: string,
    @Param('photoId') photoId: string,
    @User() user: any,
  ) {
    return this.photoUploadService.deletePhoto(
      +businessProfileId,
      +photoId,
      user.id,
    );
  }
}
