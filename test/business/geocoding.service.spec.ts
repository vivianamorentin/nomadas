import { Test, TestingModule } from '@nestjs/testing';
import { GeocodingService } from '../../src/main/business/services/geocoding.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { createClient } from 'redis';

// Mock axios
jest.mock('axios');
// Mock redis
jest.mock('redis');

describe('GeocodingService', () => {
  let service: GeocodingService;
  let configService: ConfigService;
  let redisClientMock: any;
  let axiosMock: any;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        GOOGLE_MAPS_API_KEY: 'test-google-maps-key',
        REDIS_URL: 'redis://localhost:6379',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockRedisClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    quit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock Redis client
    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

    // Mock axios
    axiosMock = axios as jest.Mocked<typeof axios>;
    axiosMock.get.mockResolvedValue({
      data: {
        status: 'OK',
        results: [
          {
            formatted_address: '123 Passeig de Gràcia, 08001 Barcelona, Spain',
            geometry: {
              location: {
                lat: 41.3851,
                lng: 2.1734,
              },
            },
            address_components: [
              {
                long_name: '123',
                types: ['street_number'],
              },
              {
                long_name: 'Passeig de Gràcia',
                types: ['route'],
              },
              {
                long_name: 'Barcelona',
                types: ['locality'],
              },
              {
                long_name: 'Barcelona',
                types: ['administrative_area_level_3'],
              },
              {
                long_name: '08001',
                types: ['postal_code'],
              },
              {
                long_name: 'Spain',
                types: ['country'],
              },
            ],
          },
        ],
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GeocodingService>(GeocodingService);
    configService = module.get<ConfigService>(ConfigService);
    redisClientMock = (service as any).redisClient;
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('geocode', () => {
    it('should geocode an address successfully', async () => {
      const address = '123 Passeig de Gràcia, Barcelona, Spain';

      mockRedisClient.get.mockResolvedValue(null); // Cache miss
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await service.geocode(address);

      expect(result).toHaveProperty('latitude');
      expect(result).toHaveProperty('longitude');
      expect(result).toHaveProperty('city');
      expect(result).toHaveProperty('country');
      expect(result).toHaveProperty('formattedAddress');
      expect(result.latitude).toBe(41.3851);
      expect(result.longitude).toBe(2.1734);
      expect(result.city).toBe('Barcelona');
      expect(result.country).toBe('Spain');
      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address,
            key: 'test-google-maps-key',
          },
        }
      );
      expect(mockRedisClient.setEx).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const address = '123 Passeig de Gràcia, Barcelona, Spain';
      const cachedResult = {
        address,
        city: 'Barcelona',
        country: 'Spain',
        postalCode: '08001',
        latitude: 41.3851,
        longitude: 2.1734,
        formattedAddress: '123 Passeig de Gràcia, 08001 Barcelona, Spain',
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await service.geocode(address);

      expect(result).toEqual(cachedResult);
      expect(axiosMock.get).not.toHaveBeenCalled(); // Should not call API if cached
    });

    it('should throw BadRequestException for empty address', async () => {
      await expect(service.geocode('')).rejects.toThrow(BadRequestException);
      await expect(service.geocode('')).rejects.toThrow('Address cannot be empty');
      await expect(service.geocode('   ')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for ZERO_RESULTS from Google Maps', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          status: 'ZERO_RESULTS',
          results: [],
        },
      });

      mockRedisClient.get.mockResolvedValue(null);

      await expect(service.geocode('Invalid Address 123')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.geocode('Invalid Address 123')).rejects.toThrow(
        'Unable to find this address'
      );
    });

    it('should throw BadRequestException for API error', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          status: 'REQUEST_DENIED',
          error_message: 'Invalid API key',
        },
      });

      mockRedisClient.get.mockResolvedValue(null);

      await expect(service.geocode('123 Test St')).rejects.toThrow(BadRequestException);
    });

    it('should handle network errors gracefully', async () => {
      axiosMock.get.mockRejectedValue(new Error('Network error'));

      mockRedisClient.get.mockResolvedValue(null);

      await expect(service.geocode('123 Test St')).rejects.toThrow(BadRequestException);
      await expect(service.geocode('123 Test St')).rejects.toThrow(
        'Unable to validate this address'
      );
    });

    it('should extract city from locality component', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          status: 'OK',
          results: [
            {
              formatted_address: 'Madrid, Spain',
              geometry: {
                location: { lat: 40.4168, lng: -3.7038 },
              },
              address_components: [
                {
                  long_name: 'Madrid',
                  types: ['locality'],
                },
                {
                  long_name: 'Spain',
                  types: ['country'],
                },
              ],
            },
          ],
        },
      });

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await service.geocode('Madrid, Spain');

      expect(result.city).toBe('Madrid');
    });

    it('should extract city from administrative_area_level_3 when locality is missing', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          status: 'OK',
          results: [
            {
              formatted_address: 'Test Area, Spain',
              geometry: {
                location: { lat: 40.0, lng: -3.0 },
              },
              address_components: [
                {
                  long_name: 'Test Area',
                  types: ['administrative_area_level_3'],
                },
                {
                  long_name: 'Spain',
                  types: ['country'],
                },
              ],
            },
          ],
        },
      });

      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await service.geocode('Test Area, Spain');

      expect(result.city).toBe('Test Area');
    });
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode coordinates successfully', async () => {
      const latitude = 41.3851;
      const longitude = 2.1734;

      mockRedisClient.get.mockResolvedValue(null); // Cache miss
      mockRedisClient.setEx.mockResolvedValue('OK');

      const result = await service.reverseGeocode(latitude, longitude);

      expect(result).toHaveProperty('address');
      expect(result).toHaveProperty('city');
      expect(result).toHaveProperty('country');
      expect(result.city).toBe('Barcelona');
      expect(result.country).toBe('Spain');
      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: 'test-google-maps-key',
          },
        }
      );
    });

    it('should return cached reverse geocode result', async () => {
      const cachedResult = {
        address: '123 Passeig de Gràcia, 08001 Barcelona, Spain',
        city: 'Barcelona',
        country: 'Spain',
        postalCode: '08001',
        formattedAddress: '123 Passeig de Gràcia, 08001 Barcelona, Spain',
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await service.reverseGeocode(41.3851, 2.1734);

      expect(result).toEqual(cachedResult);
      expect(axiosMock.get).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for missing coordinates', async () => {
      await expect(service.reverseGeocode(0, 0)).rejects.toThrow(BadRequestException);
      await expect(service.reverseGeocode(NaN, 2.1734)).rejects.toThrow(BadRequestException);
      await expect(service.reverseGeocode(41.3851, NaN)).rejects.toThrow(BadRequestException);
      await expect(service.reverseGeocode(null as any, 2.1734)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for ZERO_RESULTS in reverse geocoding', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          status: 'ZERO_RESULTS',
          results: [],
        },
      });

      mockRedisClient.get.mockResolvedValue(null);

      await expect(service.reverseGeocode(0, 0)).rejects.toThrow(BadRequestException);
      await expect(service.reverseGeocode(0, 0)).rejects.toThrow(
        'Unable to find address for these coordinates'
      );
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const distance = service.calculateDistance(41.3851, 2.1734, 40.4168, -3.7038);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1000); // Should be around 505km for Barcelona to Madrid
    });

    it('should return 0 for same coordinates', () => {
      const distance = service.calculateDistance(41.3851, 2.1734, 41.3851, 2.1734);

      expect(distance).toBe(0);
    });

    it('should calculate distance correctly for known locations', () => {
      // Distance from Barcelona to Madrid is approximately 505km
      const barcelonaLat = 41.3851;
      const barcelonaLng = 2.1734;
      const madridLat = 40.4168;
      const madridLng = -3.7038;

      const distance = service.calculateDistance(barcelonaLat, barcelonaLng, madridLat, madridLng);

      expect(distance).toBeCloseTo(505, 0); // Allow 1km tolerance
    });

    it('should handle negative coordinates', () => {
      const distance = service.calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);

      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('validateCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(service.validateCoordinates(41.3851, 2.1734)).toBe(true);
      expect(service.validateCoordinates(0, 0)).toBe(true);
      expect(service.validateCoordinates(-90, -180)).toBe(true);
      expect(service.validateCoordinates(90, 180)).toBe(true);
    });

    it('should return false for invalid latitude', () => {
      expect(service.validateCoordinates(91, 0)).toBe(false);
      expect(service.validateCoordinates(-91, 0)).toBe(false);
      expect(service.validateCoordinates(100, 0)).toBe(false);
    });

    it('should return false for invalid longitude', () => {
      expect(service.validateCoordinates(0, 181)).toBe(false);
      expect(service.validateCoordinates(0, -181)).toBe(false);
      expect(service.validateCoordinates(0, 200)).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific address', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await service.clearCache('123 Test St');

      expect(mockRedisClient.del).toHaveBeenCalled();
    });
  });

  describe('clearAllCache', () => {
    it('should clear all geocoding cache', async () => {
      mockRedisClient.keys.mockResolvedValue(['geocode:123', 'geocode:456', 'geocode:789']);
      mockRedisClient.del.mockResolvedValue(3);

      await service.clearAllCache();

      expect(mockRedisClient.keys).toHaveBeenCalledWith('geocode:*');
      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it('should handle empty cache gracefully', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      await expect(service.clearAllCache()).resolves.not.toThrow();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close Redis connection on module destroy', async () => {
      mockRedisClient.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });

  describe('hashAddress', () => {
    it('should generate consistent hash for same address', () => {
      const address = '123 Test St';

      const hash1 = (service as any).hashAddress(address);
      const hash2 = (service as any).hashAddress(address);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different addresses', () => {
      const hash1 = (service as any).hashAddress('123 Test St');
      const hash2 = (service as any).hashAddress('456 Test St');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('toRad', () => {
    it('should convert degrees to radians', () => {
      const result = (service as any).toRad(180);

      expect(result).toBeCloseTo(Math.PI, 5);
    });

    it('should convert 90 degrees to PI/2 radians', () => {
      const result = (service as any).toRad(90);

      expect(result).toBeCloseTo(Math.PI / 2, 5);
    });
  });
});
