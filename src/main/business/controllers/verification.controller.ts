import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VerificationService } from '../services/verification.service';
import { SubmitVerificationDto, AdminVerificationDecisionDto } from '../dto';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { User } from '../../identity/decorators/user.decorator';

@ApiTags('Business Verification')
@Controller('business-profiles/:id/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit verification document',
    description: 'Uploads a verification document for business profile verification.',
  })
  @ApiResponse({
    status: 201,
    description: 'Verification document uploaded successfully',
    schema: {
      example: {
        message: 'Verification document uploaded successfully!',
        document: {
          id: 1,
          documentType: 'BUSINESS_LICENSE',
          fileName: '1735824000-abc123.pdf',
          uploadDate: '2026-01-20T10:00:00.000Z',
          verificationStatus: 'PENDING',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid file or already verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your business profile' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async submitDocument(
    @Param('id', ParseIntPipe) businessProfileId: number,
    @User() user: any,
    @Body() submitDto: SubmitVerificationDto,
  ) {
    // For file upload, we need the actual file buffer
    // This is a simplified version - in production, use multer or similar
    throw new Error('Use multipart/form-data endpoint for file upload');
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get verification status',
    description: 'Returns the verification status for a business profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification status retrieved successfully',
    schema: {
      example: {
        isVerified: false,
        documents: [
          {
            id: 1,
            documentType: 'BUSINESS_LICENSE',
            fileName: 'license.pdf',
            uploadDate: '2026-01-20T10:00:00.000Z',
            verificationStatus: 'PENDING',
            rejectionReason: null,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your business profile' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async getVerificationStatus(
    @Param('id', ParseIntPipe) businessProfileId: number,
    @User() user: any,
  ) {
    return this.verificationService.getVerificationStatus(businessProfileId, user.id);
  }

  @Delete(':documentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete verification document',
    description: 'Deletes a pending or rejected verification document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification document deleted successfully',
    schema: {
      example: {
        message: 'Verification document deleted successfully!',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Cannot delete approved document' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your document' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @Param('id', ParseIntPipe) businessProfileId: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @User() user: any,
  ) {
    return this.verificationService.deleteDocument(documentId, user.id);
  }
}

@ApiTags('Admin Verification')
@Controller('admin/business-profiles/:id/verification')
export class AdminVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all pending verifications (Admin)',
    description: 'Returns a list of all business profiles with pending verification documents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending verifications retrieved successfully',
    schema: {
      example: {
        pendingVerifications: [
          {
            id: 1,
            businessProfile: {
              id: 123,
              businessName: 'Sunset Beach Bar',
              businessType: 'BAR',
              locationCity: 'Barcelona',
              locationCountry: 'Spain',
            },
            documentType: 'BUSINESS_LICENSE',
            fileName: 'license.pdf',
            uploadDate: '2026-01-20T10:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getPendingVerifications(@User() user: any) {
    return this.verificationService.getPendingVerifications(user.id);
  }

  @Post(':documentId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve verification document (Admin)',
    description: 'Approves a verification document and marks the business profile as verified.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification approved successfully',
    schema: {
      example: {
        message: 'Verification approved successfully!',
        businessProfileId: 123,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Already approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async approveVerification(
    @Param('id', ParseIntPipe) businessProfileId: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @User() user: any,
  ) {
    return this.verificationService.approveVerification(documentId, user.id);
  }

  @Post(':documentId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject verification document (Admin)',
    description: 'Rejects a verification document with a reason.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification rejected successfully',
    schema: {
      example: {
        message: 'Verification rejected successfully!',
        businessProfileId: 123,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Rejection reason required' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async rejectVerification(
    @Param('id', ParseIntPipe) businessProfileId: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @User() user: any,
    @Body() rejectDto: { rejectionReason: string },
  ) {
    return this.verificationService.rejectVerification(
      documentId,
      rejectDto.rejectionReason,
      user.id,
    );
  }
}
