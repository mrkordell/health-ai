import { db, meals } from '../../db';
import type { ToolHandler, LogMealArgs, LogMealResult } from '../types';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const logMealHandler: ToolHandler<LogMealArgs, LogMealResult> = async (args, userId) => {
  const { mealType, description, calories, proteinG, carbsG, fatG, notes } = args;

  // Validate required fields
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

  console.log(`[log_meal] Logging ${mealType}: "${description}" (${calories} cal) for user ${userId}`);

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
    })
    .returning();

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
