import { and, eq } from 'drizzle-orm';
import { fromZonedTime } from 'date-fns-tz';
import { db, weightLogs, userProfiles } from '../../db';
import type { ToolHandler, UpdateWeightArgs, UpdateWeightResult } from '../types';

const LOCAL_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;
const LBS_TO_KG = 0.45359237;

export const updateWeightHandler: ToolHandler<UpdateWeightArgs, UpdateWeightResult> = async (args, userId) => {
  const { weightLogId, weightLbs, notes, loggedAt } = args;

  if (!weightLogId || typeof weightLogId !== 'string') {
    throw new Error('Missing required parameter: weightLogId');
  }

  const patch: Partial<typeof weightLogs.$inferInsert> = {};

  if (weightLbs !== undefined) {
    if (typeof weightLbs !== 'number' || weightLbs <= 0) {
      throw new Error('Invalid weightLbs: must be a positive number');
    }
    const rounded = Math.round(weightLbs * 10) / 10;
    patch.weightLbs = String(rounded);
    patch.weightKg = String(Math.round(rounded * LBS_TO_KG * 100) / 100);
  }

  if (notes !== undefined) {
    patch.notes = notes || null;
  }

  if (loggedAt !== undefined) {
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
    patch.loggedAt = instant;
  }

  if (Object.keys(patch).length === 0) {
    throw new Error('update_weight called with no fields to update');
  }

  console.log(`[update_weight] Updating weight log ${weightLogId} for user ${userId}: ${Object.keys(patch).join(', ')}`);

  const [updated] = await db
    .update(weightLogs)
    .set(patch)
    .where(and(eq(weightLogs.id, weightLogId), eq(weightLogs.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error(`Weight log not found: ${weightLogId}`);
  }

  return {
    success: true,
    weightLogId: updated.id,
    message: `Updated weight log (${updated.weightLbs} lbs)`,
    updated: {
      weightLbs: parseFloat(updated.weightLbs),
      notes: updated.notes ?? null,
      loggedAt: updated.loggedAt.toISOString(),
    },
  };
};
