import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { runSeeds } from './index';

// Load environment variables
config();

function parseConnectionString(url: string) {
  const regex = /postgresql:\/\/([^:@]+)?(?::([^@]+))?@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  return {
    username: match[1] || 'postgres',
    password: match[2] || '',
    host: match[3] || 'localhost',
    port: parseInt(match[4] || '5432', 10),
    database: match[5] || 'keepswell_db',
  };
}

async function bootstrap() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const dbConfig = parseConnectionString(dbUrl);

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [join(__dirname, '../entities/*.entity{.ts,.js}')],
    synchronize: false,
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
