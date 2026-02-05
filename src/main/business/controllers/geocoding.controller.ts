import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GeocodingService } from '../services/geocoding.service';
import { ForwardGeocodingDto, ReverseGeocodingDto, DistanceCalculationDto } from '../dto';
import { JwtAuthGuard } from '../../identity/guards/jwt-auth.guard';

@ApiTags('Geocoding')
@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Post('forward')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert address to coordinates',
    description: 'Geocodes an address to latitude and longitude coordinates using Google Maps API with Redis caching.',
  })
  @ApiResponse({
    status: 200,
    description: 'Address geocoded successfully',
    schema: {
      example: {
        address: '123 Passeig de Gràcia, Barcelona, Spain',
        city: 'Barcelona',
        country: 'Spain',
        postalCode: '08007',
        latitude: 41.3851,
        longitude: 2.1734,
        formattedAddress: 'Pg. de Gràcia, 123, 08007 Barcelona, Spain',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid address or not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async forwardGeocode(@Body() forwardDto: ForwardGeocodingDto) {
    return this.geocodingService.geocode(forwardDto.address);
  }

  @Post('reverse')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert coordinates to address',
    description: 'Reverse geocodes latitude and longitude to an address using Google Maps API with Redis caching.',
  })
  @ApiResponse({
    status: 200,
    description: 'Coordinates reverse geocoded successfully',
    schema: {
      example: {
        address: '123 Passeig de Gràcia, Barcelona, Spain',
        city: 'Barcelona',
        country: 'Spain',
        postalCode: '08007',
        formattedAddress: 'Pg. de Gràcia, 123, 08007 Barcelona, Spain',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid coordinates or not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async reverseGeocode(@Body() reverseDto: ReverseGeocodingDto) {
    return this.geocodingService.reverseGeocode(
      reverseDto.latitude,
      reverseDto.longitude,
    );
  }

  @Post('distance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate distance between two coordinates',
    description: 'Calculates the distance in kilometers between two sets of coordinates using the Haversine formula.',
  })
  @ApiResponse({
    status: 200,
    description: 'Distance calculated successfully',
    schema: {
      example: {
        distanceKm: 2.45,
        distanceMiles: 1.52,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid coordinates' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async calculateDistance(@Body() distanceDto: DistanceCalculationDto) {
    const distanceKm = this.geocodingService.calculateDistance(
      distanceDto.latitude1,
      distanceDto.longitude1,
      distanceDto.latitude2,
      distanceDto.longitude2,
    );

    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      distanceMiles: Math.round(distanceKm * 0.621371 * 100) / 100,
    };
  }
}
