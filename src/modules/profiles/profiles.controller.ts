import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@Controller('profiles')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  async getMyProfile(@Request() req) {
    return this.profilesService.findByUserId(req.user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  async updateMyProfile(@Request() req, @Body() updateDto: any) {
    return this.profilesService.updateByUserId(req.user.userId, updateDto);
  }

  @Post('worker')
  @ApiOperation({ summary: 'Create worker profile' })
  async createWorkerProfile(@Request() req, @Body() createDto: any) {
    return this.profilesService.createWorkerProfile(req.user.userId, createDto);
  }

  @Post('business')
  @ApiOperation({ summary: 'Create business profile' })
  async createBusinessProfile(@Request() req, @Body() createDto: any) {
    return this.profilesService.createBusinessProfile(req.user.userId, createDto);
  }

  @Get('workers/:id')
  @ApiOperation({ summary: 'Get worker profile by ID' })
  async getWorkerProfile(@Param('id') id: string) {
    return this.profilesService.findWorkerProfile(parseInt(id));
  }

  @Get('businesses/:id')
  @ApiOperation({ summary: 'Get business profile by ID' })
  async getBusinessProfile(@Param('id') id: string) {
    return this.profilesService.findBusinessProfile(parseInt(id));
  }
}
