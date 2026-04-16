import { eq, and, gte, lte, ilike, desc } from 'drizzle-orm';
import { db, meals, userProfiles, getDateRange, getTodayRange } from '../../db';
import type { ToolHandler, SearchMealsArgs, SearchMealsResult } from '../types';

export const searchMealsHandler: ToolHandler<SearchMealsArgs, SearchMealsResult> = async (
  args,
  userId
) => {
  const { query, dateFrom, dateTo, mealType } = args;

  // Get user's timezone
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const timezone = profile?.timezone ?? 'America/New_York';

  // Build filter conditions
  const conditions = [eq(meals.userId, userId)];

  if (query) {
    conditions.push(ilike(meals.description, `%${query}%`));
  }

  if (mealType) {
    conditions.push(eq(meals.mealType, mealType));
  }

  if (dateFrom) {
    const range = getDateRange(dateFrom, timezone);
    conditions.push(gte(meals.loggedAt, range.start));
  }

  if (dateTo) {
    const range = getDateRange(dateTo, timezone);
    conditions.push(lte(meals.loggedAt, range.end));
  }

  // If no filters at all, default to last 30 days
  if (!query && !dateFrom && !dateTo && !mealType) {
    const { start } = getTodayRange(timezone);
    const thirtyDaysAgo = new Date(start);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    conditions.push(gte(meals.loggedAt, thirtyDaysAgo));
  }

  const results = await db
    .select()
    .from(meals)
    .where(and(...conditions))
    .orderBy(desc(meals.loggedAt))
    .limit(20);

  return {
    meals: results.map((m) => ({
      date: m.loggedAt.toISOString().split('T')[0] as string,
      mealType: m.mealType,
      description: m.description,
      calories: m.calories,
      proteinG: parseFloat(m.proteinG),
      carbsG: parseFloat(m.carbsG),
      fatG: parseFloat(m.fatG),
    })),
    totalFound: results.length,
  };
};
