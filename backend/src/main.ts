import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AdminService } from './modules/admin';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

  // Enable CORS for frontend
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:5173',
      'https://keepswell-app.onrender.com',
      'https://keepswell.com',
      'https://www.keepswell.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
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

  // Global prefix for API
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  // Set up initial admin user
  const adminService = app.get(AdminService);
  try {
    const adminUser = await adminService.makeUserAdminByEmail('susan@pikesquare.co');
    if (adminUser) {
      logger.log(`Admin access granted to: susan@pikesquare.co`);
    }
  } catch (error) {
    logger.warn('Could not set up admin user (user may not exist yet)');
  }

  // One-shot data migration: collapse the legacy 'pro' subscription tier
  // value to canonical 'premium'. Idempotent — no-ops once every row is
  // already on the new value. Runs on every boot until we delete the call;
  // cost is one indexed UPDATE that affects 0 rows in steady state.
  try {
    await adminService.migrateLegacyProToPremium();
  } catch (error) {
    logger.error(
      `Migration migrateLegacyProToPremium failed: ${(error as Error).message}`,
    );
  }

  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`API available at http://localhost:${port}/api`);
}

bootstrap();
