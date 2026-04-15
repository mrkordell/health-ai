import { eq, and, gte, lte } from 'drizzle-orm';
import { db, meals, userProfiles, getTodayRange } from '../../db';
import type { ToolHandler, GetTodaySummaryArgs, GetTodaySummaryResult } from '../types';

export const getTodaySummaryHandler: ToolHandler<GetTodaySummaryArgs, GetTodaySummaryResult> = async (
  args,
  userId
) => {
  // Get user's timezone from profile, or use provided timezone, or default to UTC
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const timezone = args.timezone ?? profile[0]?.timezone ?? 'America/New_York';

  console.log(`[get_today_summary] Fetching summary for user ${userId} in timezone ${timezone}`);

  const { start, end } = getTodayRange(timezone);
  const today = new Date().toISOString().split('T')[0] as string;

  // Get today's meals
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

  // Calculate totals
  const totalCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const totalProteinG = todayMeals.reduce((sum, m) => sum + parseFloat(m.proteinG), 0);
  const totalCarbsG = todayMeals.reduce((sum, m) => sum + parseFloat(m.carbsG), 0);
  const totalFatG = todayMeals.reduce((sum, m) => sum + parseFloat(m.fatG), 0);

  // Get user targets
  const userProfile = profile[0];
  const targets = {
    dailyCalorieTarget: userProfile?.dailyCalorieTarget ?? null,
    dailyProteinTargetG: userProfile?.dailyProteinTargetG ?? null,
    dailyCarbsTargetG: userProfile?.dailyCarbsTargetG ?? null,
    dailyFatTargetG: userProfile?.dailyFatTargetG ?? null,
  };

  // Calculate remaining
  const remaining = {
    calories: targets.dailyCalorieTarget !== null
      ? targets.dailyCalorieTarget - totalCalories
      : null,
    proteinG: targets.dailyProteinTargetG !== null
      ? targets.dailyProteinTargetG - totalProteinG
      : null,
    carbsG: targets.dailyCarbsTargetG !== null
      ? targets.dailyCarbsTargetG - totalCarbsG
      : null,
    fatG: targets.dailyFatTargetG !== null
      ? targets.dailyFatTargetG - totalFatG
      : null,
  };

  return {
    date: today,
    totalCalories,
    totalProteinG: Math.round(totalProteinG * 10) / 10,
    totalCarbsG: Math.round(totalCarbsG * 10) / 10,
    totalFatG: Math.round(totalFatG * 10) / 10,
    mealCount: todayMeals.length,
    meals: todayMeals.map((m) => ({
      mealType: m.mealType,
      description: m.description,
      calories: m.calories,
    })),
    targets,
    remaining,
  };
};
