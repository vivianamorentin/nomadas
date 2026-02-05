import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Geocoding E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /geocoding/forward', () => {
    it('should geocode an address successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: '123 Passeig de Gràcia, Barcelona, Spain',
        })
        .expect(201);

      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
      expect(response.body).toHaveProperty('city');
      expect(response.body).toHaveProperty('country');
      expect(response.body).toHaveProperty('formattedAddress');
      expect(typeof response.body.latitude).toBe('number');
      expect(typeof response.body.longitude).toBe('number');
    });

    it('should throw validation error for missing address', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({})
        .expect(400);
    });

    it('should throw validation error for empty address', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: '',
        })
        .expect(400);
    });

    it('should throw validation error for whitespace-only address', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: '   ',
        })
        .expect(400);
    });

    it('should throw 400 for invalid address', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: 'InvalidAddress123456789ThatDoesNotExist',
        })
        .expect(400);
    });

    it('should handle international addresses', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: 'Tokyo Tower, Minato City, Tokyo, Japan',
        })
        .expect(201);

      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
      expect(response.body.country).toBe('Japan');
    });

    it('should cache results for subsequent requests', async () => {
      const address = 'Eiffel Tower, Paris, France';

      // First request
      const response1 = await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({ address })
        .expect(201);

      // Second request (should hit cache)
      const response2 = await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({ address })
        .expect(201);

      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('POST /geocoding/reverse', () => {
    it('should reverse geocode coordinates successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({
          latitude: 41.3851,
          longitude: 2.1734,
        })
        .expect(201);

      expect(response.body).toHaveProperty('address');
      expect(response.body).toHaveProperty('city');
      expect(response.body).toHaveProperty('country');
      expect(response.body).toHaveProperty('formattedAddress');
      expect(response.body.city).toBe('Barcelona');
      expect(response.body.country).toBe('Spain');
    });

    it('should throw validation error for missing latitude', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({
          longitude: 2.1734,
        })
        .expect(400);
    });

    it('should throw validation error for missing longitude', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({
          latitude: 41.3851,
        })
        .expect(400);
    });

    it('should throw validation error for invalid latitude', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({
          latitude: 91, // Invalid (> 90)
          longitude: 2.1734,
        })
        .expect(400);
    });

    it('should throw validation error for invalid longitude', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({
          latitude: 41.3851,
          longitude: 181, // Invalid (> 180)
        })
        .expect(400);
    });

    it('should handle coordinates in ocean gracefully', async () => {
      // Coordinates in middle of Atlantic Ocean
      const response = await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({
          latitude: 30,
          longitude: -30,
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle southern hemisphere coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({
          latitude: -33.8688, // Sydney
          longitude: 151.2093,
        })
        .expect(201);

      expect(response.body).toHaveProperty('country');
      expect(response.body.country).toBe('Australia');
    });

    it('should cache reverse geocoding results', async () => {
      const latitude = 40.4168;
      const longitude = -3.7038;

      // First request
      const response1 = await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({ latitude, longitude })
        .expect(201);

      // Second request (should hit cache)
      const response2 = await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({ latitude, longitude })
        .expect(201);

      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('POST /geocoding/distance', () => {
    it('should calculate distance between two coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/distance')
        .send({
          latitude1: 41.3851, // Barcelona
          longitude1: 2.1734,
          latitude2: 40.4168, // Madrid
          longitude2: -3.7038,
        })
        .expect(201);

      expect(response.body).toHaveProperty('distance');
      expect(response.body).toHaveProperty('unit');
      expect(response.body.unit).toBe('km');
      expect(response.body.distance).toBeCloseTo(505, 0); // ~505km
    });

    it('should throw validation error for missing first coordinate', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/distance')
        .send({
          latitude2: 40.4168,
          longitude2: -3.7038,
        })
        .expect(400);
    });

    it('should throw validation error for missing second coordinate', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/distance')
        .send({
          latitude1: 41.3851,
          longitude1: 2.1734,
        })
        .expect(400);
    });

    it('should return 0 for same coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/distance')
        .send({
          latitude1: 41.3851,
          longitude1: 2.1734,
          latitude2: 41.3851,
          longitude2: 2.1734,
        })
        .expect(201);

      expect(response.body.distance).toBe(0);
    });

    it('should calculate distance between international locations', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/distance')
        .send({
          latitude1: 40.7128, // New York
          longitude1: -74.0060,
          latitude2: 51.5074, // London
          longitude2: -0.1278,
        })
        .expect(201);

      expect(response.body.distance).toBeCloseTo(5570, 0); // ~5570km
    });

    it('should handle negative coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/distance')
        .send({
          latitude1: -33.8688, // Sydney
          longitude1: 151.2093,
          latitude2: -37.8136, // Melbourne
          longitude2: 144.9631,
        })
        .expect(201);

      expect(response.body.distance).toBeGreaterThan(0);
      expect(response.body.distance).toBeCloseTo(713, 0); // ~713km
    });

    it('should validate coordinate ranges', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/distance')
        .send({
          latitude1: 91, // Invalid
          longitude1: 0,
          latitude2: 0,
          longitude2: 0,
        })
        .expect(400);
    });
  });

  describe('POST /geocoding/validate', () => {
    it('should validate valid coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/validate')
        .send({
          latitude: 41.3851,
          longitude: 2.1734,
        })
        .expect(201);

      expect(response.body).toHaveProperty('valid');
      expect(response.body.valid).toBe(true);
    });

    it('should invalidate coordinates out of range', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/validate')
        .send({
          latitude: 91, // Invalid latitude
          longitude: 2.1734,
        })
        .expect(201);

      expect(response.body).toHaveProperty('valid');
      expect(response.body.valid).toBe(false);
    });

    it('should invalidate longitude out of range', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/validate')
        .send({
          latitude: 41.3851,
          longitude: 181, // Invalid longitude
        })
        .expect(201);

      expect(response.body).toHaveProperty('valid');
      expect(response.body.valid).toBe(false);
    });

    it('should validate boundary coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/validate')
        .send({
          latitude: 90, // North Pole
          longitude: 180,
        })
        .expect(201);

      expect(response.body.valid).toBe(true);
    });

    it('should validate negative boundary coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/validate')
        .send({
          latitude: -90, // South Pole
          longitude: -180,
        })
        .expect(201);

      expect(response.body.valid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle Google Maps API errors gracefully', async () => {
      // This test assumes the API might be rate-limited or unavailable
      const response = await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: 'Some Invalid Address That Will Fail',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed requests', async () => {
      await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          invalidField: 'value',
        })
        .expect(400);
    });

    it('should handle extra fields in request body', async () => {
      // If forbidNonWhitelisted is enabled, this should fail
      const response = await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: 'Barcelona, Spain',
          extraField: 'should not be here',
        })
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple requests gracefully', async () => {
      const promises = [];

      // Send 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/geocoding/forward')
            .send({
              address: `Test Address ${i}, Barcelona, Spain`,
            })
        );
      }

      const responses = await Promise.all(promises);

      // All requests should complete (some may fail due to invalid addresses)
      expect(responses.length).toBe(10);
    });
  });

  describe('Data Format', () => {
    it('should return consistent response format for forward geocoding', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: 'Eiffel Tower, Paris, France',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        address: expect.any(String),
        city: expect.any(String),
        country: expect.any(String),
        latitude: expect.any(Number),
        longitude: expect.any(Number),
        formattedAddress: expect.any(String),
      });
    });

    it('should return consistent response format for reverse geocoding', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/reverse')
        .send({
          latitude: 48.8584, // Eiffel Tower
          longitude: 2.2945,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        address: expect.any(String),
        city: expect.any(String),
        country: expect.any(String),
        formattedAddress: expect.any(String),
      });
    });

    it('should include postal code when available', async () => {
      const response = await request(app.getHttpServer())
        .post('/geocoding/forward')
        .send({
          address: '123 Passeig de Gràcia, 08001 Barcelona, Spain',
        })
        .expect(201);

      expect(response.body).toHaveProperty('postalCode');
    });
  });
});
