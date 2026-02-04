import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';

@ApiTags('applications')
@Controller('applications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my applications' })
  async getMyApplications(@Request() req) {
    return this.applicationsService.findByUserId(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID' })
  async getApplication(@Param('id') id: string) {
    return this.applicationsService.findById(parseInt(id));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update application status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.applicationsService.updateStatus(parseInt(id), status);
  }
}
