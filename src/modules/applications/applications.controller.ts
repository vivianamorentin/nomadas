import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { SubmitApplicationDto, UpdateApplicationStatusDto } from './dto';

@ApiTags('applications')
@Controller('applications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  /**
   * Submit a new job application
   * REQ-APP-001: Job Application Submission
   */
  @Post()
  @ApiOperation({ summary: 'Submit a new job application' })
  @ApiResponse({ status: 201, description: 'Application submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Already applied to this job' })
  async submitApplication(
    @Request() req,
    @Body() submitApplicationDto: SubmitApplicationDto,
    @Body('jobId') jobId: number,
  ) {
    return this.applicationsService.submitApplication(
      req.user.userId,
      jobId,
      submitApplicationDto,
    );
  }

  /**
   * Get my applications (worker or business owner)
   */
  @Get()
  @ApiOperation({ summary: 'Get my applications' })
  @ApiResponse({ status: 200, description: 'Applications retrieved successfully' })
  async getMyApplications(@Request() req) {
    return this.applicationsService.findByUserId(req.user.userId);
  }

  /**
   * Get application by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({ status: 200, description: 'Application retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async getApplication(@Param('id') id: string) {
    return this.applicationsService.findById(parseInt(id));
  }

  /**
   * Accept an application
   * REQ-APP-004: Accept/Reject Workflow
   */
  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept an application' })
  @ApiResponse({ status: 200, description: 'Application accepted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async acceptApplication(
    @Param('id') id: string,
    @Request() req,
    @Body() updateStatusDto?: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.acceptApplication(
      parseInt(id),
      req.user.userId,
      updateStatusDto?.reason,
    );
  }

  /**
   * Reject an application
   * REQ-APP-004: Accept/Reject Workflow
   */
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject an application' })
  @ApiResponse({ status: 200, description: 'Application rejected' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async rejectApplication(
    @Param('id') id: string,
    @Request() req,
    @Body() updateStatusDto?: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.rejectApplication(
      parseInt(id),
      req.user.userId,
      updateStatusDto?.reason,
    );
  }

  /**
   * Withdraw an application
   */
  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Withdraw an application' })
  @ApiResponse({ status: 200, description: 'Application withdrawn' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async withdrawApplication(
    @Param('id') id: string,
    @Request() req,
    @Body('reason') reason?: string,
  ) {
    return this.applicationsService.withdrawApplication(
      parseInt(id),
      req.user.userId,
      reason,
    );
  }

  /**
   * Get applicant profile
   * REQ-APP-003: Applicant Profile Viewing
   */
  @Get(':id/applicant-profile')
  @ApiOperation({ summary: 'Get applicant profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getApplicantProfile(@Param('id') id: string, @Request() req) {
    return this.applicationsService.getApplicantProfile(
      parseInt(id),
      req.user.userId,
    );
  }

  /**
   * Get application status history
   */
  @Get(':id/history')
  @ApiOperation({ summary: 'Get application status history' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async getApplicationStatusHistory(@Param('id') id: string) {
    return this.applicationsService.getApplicationStatusHistory(parseInt(id));
  }
}
