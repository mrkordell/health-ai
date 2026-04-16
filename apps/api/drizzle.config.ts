import { defineConfig } from 'drizzle-kit';

// DATABASE_URL is only required for operations that connect to the DB
// (push, migrate, studio). `generate` just diffs the schema against the
// snapshot and doesn't need a connection. Using a placeholder lets CI and
// local `db:generate` work without env setup; the real URL is validated
// by drizzle-kit itself when an actual DB operation runs.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://placeholder',
  },
  verbose: true,
  strict: true,
});
