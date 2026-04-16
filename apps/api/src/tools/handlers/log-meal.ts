import { eq } from 'drizzle-orm';
import { fromZonedTime } from 'date-fns-tz';
import { db, meals, userProfiles } from '../../db';
import type { ToolHandler, LogMealArgs, LogMealResult } from '../types';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const LOCAL_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;

export const logMealHandler: ToolHandler<LogMealArgs, LogMealResult> = async (args, userId) => {
  const { mealType, description, calories, proteinG, carbsG, fatG, notes, loggedAt } = args;

  if (!mealType || !VALID_MEAL_TYPES.includes(mealType)) {
    throw new Error(`Invalid meal type. Must be one of: ${VALID_MEAL_TYPES.join(', ')}`);
  }

  if (!description || typeof description !== 'string') {
    throw new Error('Missing required parameter: description');
  }

  if (typeof calories !== 'number' || calories < 0) {
    throw new Error('Invalid calories: must be a non-negative number');
  }

  if (typeof proteinG !== 'number' || proteinG < 0) {
    throw new Error('Invalid proteinG: must be a non-negative number');
  }

  if (typeof carbsG !== 'number' || carbsG < 0) {
    throw new Error('Invalid carbsG: must be a non-negative number');
  }

  if (typeof fatG !== 'number' || fatG < 0) {
    throw new Error('Invalid fatG: must be a non-negative number');
  }

  const loggedAtInstant = await resolveLoggedAt(userId, loggedAt);

  console.log(`[log_meal] Logging ${mealType}: "${description}" (${calories} cal) for user ${userId} at ${loggedAtInstant?.toISOString() ?? 'NOW()'}`);

  const [inserted] = await db
    .insert(meals)
    .values({
      userId,
      mealType,
      description,
      calories: Math.round(calories),
      proteinG: String(Math.round(proteinG * 10) / 10),
      carbsG: String(Math.round(carbsG * 10) / 10),
      fatG: String(Math.round(fatG * 10) / 10),
      notes: notes ?? null,
      dataSource: 'ai_estimate',
      ...(loggedAtInstant ? { loggedAt: loggedAtInstant } : {}),
    })
    .returning();

  if (!inserted) {
    throw new Error('Failed to insert meal');
  }

  return {
    success: true,
    mealId: inserted.id,
    message: `Logged ${mealType}: ${description} (${calories} cal, ${proteinG}g protein)`,
    logged: {
      mealType,
      description,
      calories: Math.round(calories),
      proteinG: Math.round(proteinG * 10) / 10,
      carbsG: Math.round(carbsG * 10) / 10,
      fatG: Math.round(fatG * 10) / 10,
    },
  };
};

/**
 * Convert an optional local-time `loggedAt` string from the LLM into a UTC
 * instant using the user's stored timezone. Returns null when absent so the
 * DB default (NOW()) applies.
 */
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
