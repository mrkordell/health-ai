import { eq } from 'drizzle-orm';
import { fromZonedTime } from 'date-fns-tz';
import { db, weightLogs, userProfiles } from '../../db';
import type { ToolHandler, LogWeightArgs, LogWeightResult } from '../types';

const LBS_TO_KG = 0.453592;
const LOCAL_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;

export const logWeightHandler: ToolHandler<LogWeightArgs, LogWeightResult> = async (
  args,
  userId
) => {
  const { weightLbs, notes, loggedAt } = args;

  if (typeof weightLbs !== 'number' || weightLbs <= 0) {
    throw new Error('Invalid weightLbs: must be a positive number');
  }

  const finalWeightLbs = Math.round(weightLbs * 100) / 100;
  const finalWeightKg = Math.round(weightLbs * LBS_TO_KG * 100) / 100;
  const loggedAtInstant = await resolveLoggedAt(userId, loggedAt);

  console.log(`[log_weight] Logging weight: ${finalWeightLbs} lbs for user ${userId} at ${loggedAtInstant?.toISOString() ?? 'NOW()'}`);

  const [inserted] = await db
    .insert(weightLogs)
    .values({
      userId,
      weightKg: String(finalWeightKg),
      weightLbs: String(finalWeightLbs),
      notes: notes ?? null,
      ...(loggedAtInstant ? { loggedAt: loggedAtInstant } : {}),
    })
    .returning();

  if (!inserted) {
    throw new Error('Failed to insert weight log');
  }

  return {
    success: true,
    weightLogId: inserted.id,
    message: `Logged weight: ${finalWeightLbs} lbs`,
    logged: {
      weightLbs: finalWeightLbs,
    },
  };
};

async function resolveLoggedAt(userId: string, loggedAt: string | undefined): Promise<Date | null> {
  if (!loggedAt) return null;

  if (!LOCAL_DATETIME_RE.test(loggedAt)) {
    throw new Error(
      `Invalid loggedAt: "${loggedAt}". Expected YYYY-MM-DDTHH:mm in the user's local timezone.`
    );
  }

  const [profile] = await db
    .select({ timezone: userProfiles.timezone })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const timezone = profile?.timezone ?? 'UTC';
  const instant = fromZonedTime(loggedAt, timezone);

  if (Number.isNaN(instant.getTime())) {
    throw new Error(`Invalid loggedAt: "${loggedAt}" could not be parsed in timezone ${timezone}.`);
  }

  return instant;
}
