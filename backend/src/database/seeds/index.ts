import { DataSource } from 'typeorm';
import { seedAllTemplates } from './all-templates.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('Running database seeds...');

  await seedAllTemplates(dataSource);

  console.log('Database seeds completed');
}

export { seedAllTemplates };
