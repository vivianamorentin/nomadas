import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerService } from './shared/infrastructure/logging/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get config service
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Use custom logger
  app.useLogger(logger);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Enable compression
  app.use(compression());

  // Cookie parser
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NomadShift API')
      .setDescription('NomadShift Platform API Documentation')
      .setVersion('1.0')
      .addTag('auth', 'Authentication and authorization')
      .addTag('users', 'User management')
      .addTag('profiles', 'User profiles (workers and businesses)')
      .addTag('jobs', 'Job postings and search')
      .addTag('applications', 'Job applications')
      .addTag('messaging', 'Real-time messaging')
      .addTag('reviews', 'Reviews and ratings')
      .addTag('notifications', 'Push and email notifications')
      .addTag('compliance', 'Legal agreements and GDPR')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    logger.log('Swagger documentation available at /api/docs');
  }

  // Start server
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${configService.get('NODE_ENV') || 'development'}`);
}

bootstrap();
