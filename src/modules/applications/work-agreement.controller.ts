import {
  Controller,
  Get,
  Post,
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
import { WorkAgreementService } from './work-agreement.service';
import { ProposeAgreementDto, ConfirmAgreementDto } from './dto';

@ApiTags('work-agreements')
@Controller('work-agreements')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WorkAgreementController {
  constructor(private readonly workAgreementService: WorkAgreementService) {}

  /**
   * Propose a work agreement
   * REQ-APP-007: Either party can initiate
   */
  @Post()
  @ApiOperation({ summary: 'Propose a work agreement' })
  @ApiResponse({ status: 201, description: 'Agreement proposed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async proposeAgreement(
    @Request() req,
    @Body() proposeAgreementDto: ProposeAgreementDto,
    @Body('applicationId') applicationId: number,
  ) {
    return this.workAgreementService.proposeAgreement(
      applicationId,
      req.user.userId,
      proposeAgreementDto,
    );
  }

  /**
   * Get agreement by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get agreement by ID' })
  @ApiResponse({ status: 200, description: 'Agreement retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agreement not found' })
  async getAgreement(@Param('id') id: string) {
    return this.workAgreementService.findById(parseInt(id));
  }

  /**
   * Confirm work agreement
   * REQ-APP-008: Digital confirmation with IP and user agent
   */
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm work agreement' })
  @ApiResponse({ status: 200, description: 'Agreement confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid consent text' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async confirmAgreement(
    @Param('id') id: string,
    @Request() req,
    @Body() confirmAgreementDto: ConfirmAgreementDto,
  ) {
    return this.workAgreementService.confirmAgreement(
      parseInt(id),
      req.user.userId,
      confirmAgreementDto,
    );
  }

  /**
   * Get agreement versions (negotiation history)
   */
  @Get(':id/versions')
  @ApiOperation({ summary: 'Get agreement negotiation history' })
  @ApiResponse({ status: 200, description: 'Versions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Agreement not found' })
  async getAgreementVersions(@Param('id') id: string) {
    return this.workAgreementService.getAgreementVersions(parseInt(id));
  }
}
