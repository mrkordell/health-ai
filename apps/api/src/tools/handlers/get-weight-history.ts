import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { db, weightLogs, userProfiles, getLastNDaysRange } from '../../db';
import type { ToolHandler, GetWeightHistoryArgs, GetWeightHistoryResult } from '../types';

const DEFAULT_DAYS = 30;

export const getWeightHistoryHandler: ToolHandler<GetWeightHistoryArgs, GetWeightHistoryResult> = async (
  args,
  userId
) => {
  const days = args.days ?? DEFAULT_DAYS;

  if (typeof days !== 'number' || days <= 0 || days > 365) {
    throw new Error('Invalid days parameter: must be between 1 and 365');
  }

  // Get user's timezone
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const timezone = profile[0]?.timezone ?? 'America/New_York';

  console.log(`[get_weight_history] Fetching ${days} days of weight history for user ${userId}`);

  const { start, end } = getLastNDaysRange(days, timezone);

  const weights = await db
    .select()
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        gte(weightLogs.loggedAt, start),
        lte(weightLogs.loggedAt, end)
      )
    )
    .orderBy(asc(weightLogs.loggedAt));

  const entries = weights.map((w) => ({
    date: w.loggedAt.toISOString().split('T')[0] as string,
    weightLbs: parseFloat(w.weightLbs),
    notes: w.notes ?? undefined,
  }));

  // Calculate trend
  let trend: GetWeightHistoryResult['trend'] = {
    startWeightLbs: null,
    endWeightLbs: null,
    changeLbs: null,
  };

  if (entries.length >= 2) {
    const startWeightLbs = entries[0]!.weightLbs;
    const endWeightLbs = entries[entries.length - 1]!.weightLbs;
    const changeLbs = Math.round((endWeightLbs - startWeightLbs) * 100) / 100;

    trend = {
      startWeightLbs,
      endWeightLbs,
      changeLbs,
    };
  } else if (entries.length === 1) {
    trend = {
      startWeightLbs: entries[0]!.weightLbs,
      endWeightLbs: entries[0]!.weightLbs,
      changeLbs: 0,
    };
  }

  return {
    entries,
    trend,
  };
};
