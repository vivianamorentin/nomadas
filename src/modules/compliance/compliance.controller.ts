import { Controller, Get, Post, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('agreements')
  @ApiOperation({ summary: 'Get legal agreements' })
  async getAgreements() {
    return this.complianceService.getAgreements();
  }

  @Post('agreements/:agreementId/accept')
  @ApiOperation({ summary: 'Accept legal agreement' })
  async acceptAgreement(@Request() req, @Param('agreementId') agreementId: string) {
    return this.complianceService.acceptAgreement(req.user.userId, agreementId);
  }

  @Get('my-data')
  @ApiOperation({ summary: 'Export my data (GDPR)' })
  async exportMyData(@Request() req) {
    return this.complianceService.exportUserData(req.user.userId);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Request account deletion (GDPR)' })
  async requestDeletion(@Request() req) {
    return this.complianceService.requestAccountDeletion(req.user.userId);
  }
}
