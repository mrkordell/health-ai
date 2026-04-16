import { and, eq } from 'drizzle-orm';
import { db, meals } from '../../db';
import type { ToolHandler, DeleteMealArgs, DeleteMealResult } from '../types';

export const deleteMealHandler: ToolHandler<DeleteMealArgs, DeleteMealResult> = async (args, userId) => {
  const { mealId } = args;

  if (!mealId || typeof mealId !== 'string') {
    throw new Error('Missing required parameter: mealId');
  }

  console.log(`[delete_meal] Deleting meal ${mealId} for user ${userId}`);

  const [deleted] = await db
    .delete(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
    .returning();

  if (!deleted) {
    throw new Error(`Meal not found: ${mealId}`);
  }

  return {
    success: true,
    mealId: deleted.id,
    message: `Deleted ${deleted.mealType}: ${deleted.description}`,
  };
};
