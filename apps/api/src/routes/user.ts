import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { requireUser } from '../middleware/auth';
import { getOnboardingStatus } from '../lib/system-prompt';
import { db, userProfiles } from '../db';
import { getOrCreateUser } from '../services/user-service';

const timezoneSchema = z.object({
  timezone: z.string().min(1).max(50).refine(isValidIanaTimezone, {
    message: 'Invalid IANA timezone',
  }),
});

function isValidIanaTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/api/user/onboarding-status',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = requireUser(request);
      const userId = authUser.id;

      const status = await getOnboardingStatus(userId);

      return reply.send(status);
    }
  );

  fastify.patch(
    '/api/user/timezone',
    {
      preHandler: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = requireUser(request);
      const userId = authUser.id;

      const parsed = timezoneSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: parsed.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const { timezone } = parsed.data;

      // Ensure the userProfiles row exists before updating.
      await getOrCreateUser(userId);

      await db
        .update(userProfiles)
        .set({ timezone, updatedAt: new Date() })
        .where(eq(userProfiles.userId, userId));

      return reply.send({ success: true, timezone });
    }
  );
}
