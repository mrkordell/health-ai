import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { db, meals, weightLogs, userProfiles, getLastNDaysRange } from '../../db';
import type { ToolHandler, GetWeeklyProgressArgs, GetWeeklyProgressResult } from '../types';

export const getWeeklyProgressHandler: ToolHandler<GetWeeklyProgressArgs, GetWeeklyProgressResult> = async (
  args,
  userId
) => {
  const _includeDetails = args.includeDetails ?? false;

  // Get user's timezone from profile
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const timezone = profile[0]?.timezone ?? 'America/New_York';

  console.log(`[get_weekly_progress] Fetching weekly progress for user ${userId} in timezone ${timezone}`);

  const { start, end } = getLastNDaysRange(7, timezone);

  // Query meals for the past 7 days
  const weekMeals = await db
    .select()
    .from(meals)
    .where(
      and(
        eq(meals.userId, userId),
        gte(meals.loggedAt, start),
        lte(meals.loggedAt, end)
      )
    );

  // Query weight logs for the past 7 days
  const weekWeights = await db
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

  // Group meals by date string (YYYY-MM-DD)
  const mealsByDay = new Map<string, typeof weekMeals>();
  for (const meal of weekMeals) {
    const dateKey = meal.loggedAt.toISOString().split('T')[0] as string;
    const existing = mealsByDay.get(dateKey) ?? [];
    existing.push(meal);
    mealsByDay.set(dateKey, existing);
  }

  // Build daily stats for each day that has meals logged
  const dailyStats: GetWeeklyProgressResult['dailyStats'] = [];

  for (const [date, dayMeals] of mealsByDay.entries()) {
    const totalCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);

    dailyStats.push({
      date,
      totalCalories,
      mealCount: dayMeals.length,
      mealsLogged: true,
    });
  }

  // Sort daily stats by date ascending
  dailyStats.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate averages across days that had meals
  const daysTracked = dailyStats.length;
  const totalMeals = weekMeals.length;
  const averageDailyCalories = daysTracked > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.totalCalories, 0) / daysTracked)
    : 0;

  // Calculate weight change from earliest to latest entry in the range
  let weightChange: GetWeeklyProgressResult['weightChange'] = null;

  if (weekWeights.length >= 2) {
    const startWeightLbs = parseFloat(weekWeights[0]!.weightLbs);
    const endWeightLbs = parseFloat(weekWeights[weekWeights.length - 1]!.weightLbs);
    const changeLbs = Math.round((endWeightLbs - startWeightLbs) * 100) / 100;

    weightChange = { startWeightLbs, endWeightLbs, changeLbs };
  } else if (weekWeights.length === 1) {
    const weightLbs = parseFloat(weekWeights[0]!.weightLbs);
    weightChange = { startWeightLbs: weightLbs, endWeightLbs: weightLbs, changeLbs: 0 };
  }

  return {
    startDate: start.toISOString().split('T')[0] as string,
    endDate: end.toISOString().split('T')[0] as string,
    dailyStats,
    averageDailyCalories,
    totalMeals,
    daysTracked,
    weightChange,
  };
};
