import {
  Controller,
  Get,
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
import { BusinessProfileService } from '../services/business-profile.service';
import { CreateBusinessProfileDto, UpdateBusinessProfileDto } from '../dto';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';
import { User } from '../../identity/decorators/user.decorator';

@ApiTags('Business Profiles')
@Controller('business-profiles')
export class BusinessProfileController {
  constructor(private readonly businessProfileService: BusinessProfileService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new business profile',
    description: 'Creates a new business profile for the authenticated user. Users can only have one business profile initially.',
  })
  @ApiResponse({
    status: 201,
    description: 'Business profile created successfully',
    schema: {
      example: {
        id: 1,
        message: 'Business profile created successfully!',
        profile: {
          businessName: 'Sunset Beach Bar',
          businessType: 'BAR',
          description: 'A vibrant beach bar...',
          locationAddress: '123 Passeig de Gràcia',
          locationCity: 'Barcelona',
          locationCountry: 'Spain',
          contactEmail: 'contact@sunsetbeachbar.com',
          contactPhone: '+34 931 23 45 67',
          status: 'ACTIVE',
          prestigeLevel: 'BRONZE',
          averageRating: 0.0,
          totalReviews: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - User already has a business profile or validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async create(@User() user: any, @Body() createDto: CreateBusinessProfileDto) {
    return this.businessProfileService.create(user.id, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all business profiles for authenticated user',
    description: 'Returns a list of all business profiles owned by the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of business profiles',
    type: [Object],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async findAll(@User() user: any) {
    return this.businessProfileService.findAllByUser(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a specific business profile',
    description: 'Returns a single business profile by ID. Users can only view their own profiles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business profile found',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your profile' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async findOne(@Param('id') id: string, @User() user: any) {
    return this.businessProfileService.findOne(+id, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a business profile',
    description: 'Updates an existing business profile. Users can only update their own profiles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business profile updated successfully',
    schema: {
      example: {
        message: 'Business profile updated successfully!',
        profile: {
          businessName: 'Sunset Beach Bar (Updated)',
          // ... other fields
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your profile' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async update(@Param('id') id: string, @User() user: any, @Body() updateDto: UpdateBusinessProfileDto) {
    return this.businessProfileService.update(+id, user.id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a business profile',
    description: 'Deletes a business profile. Only allowed if there are no active job postings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Business profile deleted successfully',
    schema: {
      example: {
        message: 'Business profile deleted successfully!',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Active job postings exist' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your profile' })
  @ApiResponse({ status: 404, description: 'Business profile not found' })
  async remove(@Param('id') id: string, @User() user: any) {
    return this.businessProfileService.remove(+id, user.id);
  }
}
