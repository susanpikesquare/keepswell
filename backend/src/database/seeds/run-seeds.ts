import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { runSeeds } from './index';

// Load environment variables
config();

async function bootstrap() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const dataSource = new DataSource({
    type: 'postgres',
    url: dbUrl,
    entities: [join(__dirname, '../entities/*.entity{.ts,.js}')],
    synchronize: false,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    // Run seeds
    await runSeeds(dataSource);

    await dataSource.destroy();
    console.log('Seeds completed successfully');
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  }
}

bootstrap();
