import { and, eq } from 'drizzle-orm';
import { fromZonedTime } from 'date-fns-tz';
import { db, meals, userProfiles } from '../../db';
import type { ToolHandler, UpdateMealArgs, UpdateMealResult } from '../types';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const LOCAL_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/;

export const updateMealHandler: ToolHandler<UpdateMealArgs, UpdateMealResult> = async (args, userId) => {
  const { mealId, mealType, description, calories, proteinG, carbsG, fatG, notes, loggedAt } = args;

  if (!mealId || typeof mealId !== 'string') {
    throw new Error('Missing required parameter: mealId');
  }

  const patch: Partial<typeof meals.$inferInsert> = {};

  if (mealType !== undefined) {
    if (!VALID_MEAL_TYPES.includes(mealType)) {
      throw new Error(`Invalid meal type. Must be one of: ${VALID_MEAL_TYPES.join(', ')}`);
    }
    patch.mealType = mealType;
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || !description.trim()) {
      throw new Error('Invalid description: must be a non-empty string');
    }
    patch.description = description;
  }

  if (calories !== undefined) {
    if (typeof calories !== 'number' || calories < 0) {
      throw new Error('Invalid calories: must be a non-negative number');
    }
    patch.calories = Math.round(calories);
  }

  if (proteinG !== undefined) {
    if (typeof proteinG !== 'number' || proteinG < 0) {
      throw new Error('Invalid proteinG: must be a non-negative number');
    }
    patch.proteinG = String(Math.round(proteinG * 10) / 10);
  }

  if (carbsG !== undefined) {
    if (typeof carbsG !== 'number' || carbsG < 0) {
      throw new Error('Invalid carbsG: must be a non-negative number');
    }
    patch.carbsG = String(Math.round(carbsG * 10) / 10);
  }

  if (fatG !== undefined) {
    if (typeof fatG !== 'number' || fatG < 0) {
      throw new Error('Invalid fatG: must be a non-negative number');
    }
    patch.fatG = String(Math.round(fatG * 10) / 10);
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
    throw new Error('update_meal called with no fields to update');
  }

  console.log(`[update_meal] Updating meal ${mealId} for user ${userId}: ${Object.keys(patch).join(', ')}`);

  const [updated] = await db
    .update(meals)
    .set(patch)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error(`Meal not found: ${mealId}`);
  }

  return {
    success: true,
    mealId: updated.id,
    message: `Updated meal: ${updated.description} (${updated.calories} cal)`,
    updated: {
      mealType: updated.mealType,
      description: updated.description,
      calories: updated.calories,
      proteinG: parseFloat(updated.proteinG),
      carbsG: parseFloat(updated.carbsG),
      fatG: parseFloat(updated.fatG),
      notes: updated.notes ?? null,
      loggedAt: updated.loggedAt.toISOString(),
    },
  };
};
