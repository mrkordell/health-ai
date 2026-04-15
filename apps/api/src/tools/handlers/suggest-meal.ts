import { eq, and, gte, lte } from 'drizzle-orm';
import { db, meals, userProfiles, getTodayRange } from '../../db';
import type { ToolHandler, SuggestMealArgs, SuggestMealResult } from '../types';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const suggestMealHandler: ToolHandler<SuggestMealArgs, SuggestMealResult> = async (
  args,
  userId
) => {
  const { mealType, maxCalories, availableIngredients, dietaryRestrictions } = args;

  if (!mealType || !VALID_MEAL_TYPES.includes(mealType)) {
    throw new Error(`Invalid meal type. Must be one of: ${VALID_MEAL_TYPES.join(', ')}`);
  }

  if (maxCalories !== undefined && (typeof maxCalories !== 'number' || maxCalories <= 0)) {
    throw new Error('Invalid maxCalories: must be a positive number');
  }

  console.log(`[suggest_meal] Generating suggestion for ${mealType} for user ${userId}`);

  // Get user's profile and today's summary to calculate remaining calories
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const userProfile = profile[0];
  const timezone = userProfile?.timezone ?? 'UTC';
  const { start, end } = getTodayRange(timezone);

  // Get today's meals to calculate remaining calories
  const todayMeals = await db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        gte(meals.loggedAt, start),
        lte(meals.loggedAt, end)
      )
    );

  const totalCaloriesToday = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const dailyTarget = userProfile?.dailyCalorieTarget ?? null;
  const remainingCalories = dailyTarget !== null ? dailyTarget - totalCaloriesToday : null;

  // Determine effective max calories for suggestion
  let effectiveMaxCalories = maxCalories ?? null;
  if (effectiveMaxCalories === null && remainingCalories !== null && remainingCalories > 0) {
    // Suggest based on remaining calories, leaving room for other meals
    const mealsRemaining = getMealsRemainingToday(mealType, todayMeals);
    if (mealsRemaining > 0) {
      effectiveMaxCalories = Math.round(remainingCalories / mealsRemaining);
    }
  }

  return {
    context: {
      mealType,
      maxCalories: effectiveMaxCalories,
      remainingCalories,
      availableIngredients: availableIngredients ?? [],
      dietaryRestrictions: dietaryRestrictions ?? [],
    },
    message: buildSuggestionPrompt(
      mealType,
      effectiveMaxCalories,
      remainingCalories,
      availableIngredients,
      dietaryRestrictions
    ),
  };
};

function getMealsRemainingToday(
  currentMealType: string,
  todayMeals: Array<{ mealType: string }>
): number {
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  const currentIndex = mealOrder.indexOf(currentMealType);

  // Count how many main meals are left (excluding snacks from count)
  const mainMeals = ['breakfast', 'lunch', 'dinner'];
  const loggedMainMeals = new Set(
    todayMeals
      .filter((m) => mainMeals.includes(m.mealType))
      .map((m) => m.mealType)
  );

  let remaining = 0;
  for (let i = currentIndex; i < mainMeals.length; i++) {
    if (!loggedMainMeals.has(mainMeals[i])) {
      remaining++;
    }
  }

  return Math.max(remaining, 1); // At least 1 to avoid division by zero
}

function buildSuggestionPrompt(
  mealType: string,
  maxCalories: number | null,
  remainingCalories: number | null,
  ingredients?: string[],
  restrictions?: string[]
): string {
  let prompt = `Suggest a ${mealType} option`;

  if (maxCalories !== null) {
    prompt += ` under ${maxCalories} calories`;
  }

  if (remainingCalories !== null) {
    prompt += `. User has ${remainingCalories} calories remaining for the day`;
  }

  if (ingredients && ingredients.length > 0) {
    prompt += `. Available ingredients: ${ingredients.join(', ')}`;
  }

  if (restrictions && restrictions.length > 0) {
    prompt += `. Dietary restrictions: ${restrictions.join(', ')}`;
  }

  prompt += '. Provide 2-3 options with estimated calories and macros for each.';

  return prompt;
}
