import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Search jobs with filters' })
  async searchJobs(@Query() searchParams: any) {
    return this.jobsService.search(searchParams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  async getJob(@Param('id') id: string) {
    return this.jobsService.findById(parseInt(id));
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create job posting' })
  async createJob(@Request() req, @Body() createDto: any) {
    return this.jobsService.create(req.user.userId, createDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update job posting' })
  async updateJob(@Param('id') id: string, @Body() updateDto: any) {
    return this.jobsService.update(parseInt(id), updateDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete job posting' })
  async deleteJob(@Param('id') id: string) {
    return this.jobsService.delete(parseInt(id));
  }

  @Post(':id/apply')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply for job' })
  async applyForJob(@Param('id') id: string, @Request() req) {
    return this.jobsService.apply(parseInt(id), req.user.userId);
  }
}
