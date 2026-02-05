import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import axios from 'axios';

interface GeocodeResult {
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface ReverseGeocodeResult {
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  formattedAddress: string;
}

@Injectable()
export class GeocodingService {
  private googleMapsApiKey: string;
  private redisClient: RedisClientType;
  private cacheTTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(private configService: ConfigService) {
    this.googleMapsApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY', '');

    // Initialize Redis client
    this.redisClient = createClient({
      url: this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
    }) as RedisClientType;

    this.redisClient.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }

  /**
   * Geocode an address to coordinates
   */
  async geocode(address: string): Promise<GeocodeResult> {
    if (!address || address.trim().length === 0) {
      throw new BadRequestException('Address cannot be empty');
    }

    // Check cache first
    const cacheKey = `geocode:${this.hashAddress(address)}`;
    const cachedResult = await this.redisClient.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    try {
      // Call Google Maps Geocoding API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address,
            key: this.googleMapsApiKey,
          },
        }
      );

      if (response.data.status === 'ZERO_RESULTS') {
        throw new BadRequestException('Unable to find this address. Please check the address and try again.');
      }

      if (response.data.status !== 'OK') {
        throw new BadRequestException(`Geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;

      // Extract address components
      const components = result.address_components;
      const city = this.getComponent(components, ['locality', 'administrative_area_level_3']);
      const country = this.getComponent(components, ['country']);
      const postalCode = this.getComponent(components, ['postal_code']);

      const geocodeResult: GeocodeResult = {
        address,
        city,
        country,
        postalCode,
        latitude: lat,
        longitude: lng,
        formattedAddress: result.formatted_address,
      };

      // Cache the result for 7 days
      await this.redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(geocodeResult));

      return geocodeResult;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Geocoding error:', error);
      throw new BadRequestException('Unable to validate this address. Please try again later or select the location on the map.');
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
    if (!latitude || !longitude) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    // Check cache first
    const cacheKey = `reverse_geocode:${latitude},${longitude}`;
    const cachedResult = await this.redisClient.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    try {
      // Call Google Maps Reverse Geocoding API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: this.googleMapsApiKey,
          },
        }
      );

      if (response.data.status === 'ZERO_RESULTS') {
        throw new BadRequestException('Unable to find address for these coordinates.');
      }

      if (response.data.status !== 'OK') {
        throw new BadRequestException(`Reverse geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];

      // Extract address components
      const components = result.address_components;
      const city = this.getComponent(components, ['locality', 'administrative_area_level_3']);
      const country = this.getComponent(components, ['country']);
      const postalCode = this.getComponent(components, ['postal_code']);

      const reverseGeocodeResult: ReverseGeocodeResult = {
        address: result.formatted_address,
        city,
        country,
        postalCode,
        formattedAddress: result.formatted_address,
      };

      // Cache the result for 7 days
      await this.redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(reverseGeocodeResult));

      return reverseGeocodeResult;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Reverse geocoding error:', error);
      throw new BadRequestException('Unable to retrieve address for these coordinates. Please try again later.');
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Validate if coordinates are on land (basic check)
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    // Basic validation: check if coordinates are within valid ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return false;
    }

    // Additional validation could include checking against a land mask polygon
    // For now, we'll do a basic ocean check using a simple heuristic
    // In production, use a proper geospatial library

    return true;
  }

  /**
   * Get address component by types
   */
  private getComponent(components: any[], types: string[]): string {
    for (const type of types) {
      const component = components.find((c) => c.types.includes(type));
      if (component) {
        return component.long_name;
      }
    }
    return '';
  }

  /**
   * Hash address for cache key
   */
  private hashAddress(address: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear cache for a specific address
   */
  async clearCache(address: string): Promise<void> {
    const cacheKey = `geocode:${this.hashAddress(address)}`;
    await this.redisClient.del(cacheKey);
  }

  /**
   * Clear all geocoding cache (admin function)
   */
  async clearAllCache(): Promise<void> {
    const keys = await this.redisClient.keys('geocode:*');
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  /**
   * On module destroy, close Redis connection
   */
  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
