import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireUser } from '../middleware/auth';
import { db, weightLogs, userProfiles } from '../db';
import { eq, and, gte, asc } from 'drizzle-orm';

const weightQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function weightRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/api/weight',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = requireUser(request);
      const userId = authUser.id;

      const parseResult = weightQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parseResult.error.issues[0].message,
        });
      }

      const { days } = parseResult.data;

      try {
        // Get user profile for target weight
        const profile = await db
          .select()
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1);

        const userProfile = profile[0];

        // Calculate start date
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Fetch weight entries
        const weights = await db
          .select()
          .from(weightLogs)
          .where(
            and(
              eq(weightLogs.userId, userId),
              gte(weightLogs.loggedAt, startDate)
            )
          )
          .orderBy(asc(weightLogs.loggedAt));

        // Format entries (lbs only)
        const entries = weights.map((w) => ({
          id: w.id,
          weightLbs: parseFloat(w.weightLbs),
          notes: w.notes,
          loggedAt: w.loggedAt.toISOString(),
        }));

        // Calculate trend
        let trend = {
          startWeightLbs: null as number | null,
          endWeightLbs: null as number | null,
          changeLbs: null as number | null,
        };

        if (entries.length >= 2) {
          const firstEntry = entries[0]!;
          const lastEntry = entries[entries.length - 1]!;
          const changeLbs = lastEntry.weightLbs - firstEntry.weightLbs;

          trend = {
            startWeightLbs: firstEntry.weightLbs,
            endWeightLbs: lastEntry.weightLbs,
            changeLbs: Math.round(changeLbs * 100) / 100,
          };
        } else if (entries.length === 1) {
          const entry = entries[0]!;
          trend = {
            startWeightLbs: entry.weightLbs,
            endWeightLbs: entry.weightLbs,
            changeLbs: 0,
          };
        }

        // Get current weight (most recent entry)
        const currentWeight = entries.length > 0
          ? { weightLbs: entries[entries.length - 1]!.weightLbs }
          : null;

        return reply.send({
          entries,
          trend,
          currentWeight,
          targetWeightLbs: userProfile?.targetWeightLbs
            ? parseFloat(userProfile.targetWeightLbs)
            : null,
        });
      } catch (error) {
        request.log.error({ error }, 'Failed to fetch weight data');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch weight data',
        });
      }
    }
  );
}
