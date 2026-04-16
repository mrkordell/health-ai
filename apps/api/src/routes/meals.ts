import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireUser } from '../middleware/auth';
import { db, meals, userProfiles } from '../db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getDateRange } from '../db/helpers';

const mealsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
});

export async function mealsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/api/meals',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = requireUser(request);
      const userId = authUser.id;

      const parseResult = mealsQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parseResult.error.issues[0]?.message ?? 'Invalid query parameters',
        });
      }

      const { date } = parseResult.data;

      try {
        // Get user profile for targets
        const profile = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1);

        const userProfile = profile[0];
        const timezone = userProfile?.timezone ?? 'UTC';

        const { start: startOfDay, end: endOfDay } = getDateRange(date, timezone);

        const dayMeals = await db
          .select()
          .from(meals)
          .where(
            and(
              eq(meals.userId, userId),
              gte(meals.loggedAt, startOfDay),
              lte(meals.loggedAt, endOfDay)
            )
          );

        // Calculate totals
        const totalCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
        const totalProteinG = dayMeals.reduce((sum, m) => sum + parseFloat(m.proteinG), 0);
        const totalCarbsG = dayMeals.reduce((sum, m) => sum + parseFloat(m.carbsG), 0);
        const totalFatG = dayMeals.reduce((sum, m) => sum + parseFloat(m.fatG), 0);

        return reply.send({
          date,
          totalCalories,
          totalProteinG: Math.round(totalProteinG * 10) / 10,
          totalCarbsG: Math.round(totalCarbsG * 10) / 10,
          totalFatG: Math.round(totalFatG * 10) / 10,
          meals: dayMeals.map((m) => ({
            id: m.id,
            mealType: m.mealType,
            description: m.description,
            calories: m.calories,
            proteinG: parseFloat(m.proteinG),
            carbsG: parseFloat(m.carbsG),
            fatG: parseFloat(m.fatG),
            loggedAt: m.loggedAt.toISOString(),
          })),
          targets: {
            dailyCalorieTarget: userProfile?.dailyCalorieTarget ?? null,
            dailyProteinTargetG: userProfile?.dailyProteinTargetG ?? null,
            dailyCarbsTargetG: userProfile?.dailyCarbsTargetG ?? null,
            dailyFatTargetG: userProfile?.dailyFatTargetG ?? null,
          },
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch meals');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch meals',
        });
      }
    }
  );
}
