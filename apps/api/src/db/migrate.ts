import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run migrations');
}

const migrationClient = postgres(connectionString, { max: 1 });

try {
  await migrate(drizzle(migrationClient), {
    migrationsFolder: new URL('./migrations', import.meta.url).pathname,
  });
  console.log('Migrations applied');
} finally {
  await migrationClient.end();
}
