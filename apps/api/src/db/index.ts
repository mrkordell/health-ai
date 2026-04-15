/**
 * Database module entry point
 *
 * Re-exports:
 * - db instance (Drizzle connection)
 * - All schema tables and types
 * - Validation schemas
 * - Helper functions
 */

export { db, checkDatabaseConnection } from './client';
export * from './schema';
export * from './validation';
export * from './helpers';
