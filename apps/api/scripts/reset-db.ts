import { sql } from 'drizzle-orm';
import { db } from '../src/db';

async function resetDb() {
  console.log('Truncating all tables...');

  await db.execute(sql`TRUNCATE users, user_profiles, meals, weight_logs, conversation_history CASCADE`);

  console.log('Done!');
  process.exit(0);
}

resetDb().catch((err) => {
  console.error('Failed to reset database:', err);
  process.exit(1);
});
