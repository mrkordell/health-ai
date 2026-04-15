import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireUser } from '../middleware/auth';
import { getOnboardingStatus } from '../lib/system-prompt';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // Get user's onboarding status
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
}
