import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { DeviceTokenService } from './services/device-token.service';
import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/**
 * Register Device Token DTO
 */
export class RegisterDeviceTokenDto {
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}

/**
 * Device Token Controller
 * Endpoints for managing push notification device tokens
 * SPEC-NOT-001 Phase 5
 */
@Controller('device-tokens')
@UseGuards(JwtAuthGuard)
export class DeviceTokenController {
  constructor(private readonly deviceTokenService: DeviceTokenService) {}

  /**
   * Register device token
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Request() req, @Body() dto: RegisterDeviceTokenDto) {
    const userId = req.user.userId;

    return this.deviceTokenService.registerToken({
      userId,
      ...dto,
    });
  }

  /**
   * Get all active tokens for current user
   */
  @Get()
  async findAll(@Request() req) {
    const userId = req.user.userId;

    return this.deviceTokenService.getActiveTokens(userId);
  }

  /**
   * Get token statistics
   */
  @Get('stats')
  async getStats(@Request() req) {
    const userId = req.user.userId;

    return this.deviceTokenService.getTokenStats(userId);
  }

  /**
   * Deactivate token
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string) {
    return this.deviceTokenService.deactivateToken(id);
  }

  /**
   * Deactivate all tokens (user logged out)
   */
  @Post('deactivate-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivateAll(@Request() req) {
    const userId = req.user.userId;

    return this.deviceTokenService.deactivateAllTokens(userId);
  }
}
