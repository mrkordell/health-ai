import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import {
  extractBearerToken,
  verifyJwt,
  TokenVerificationError,
} from '../lib/clerk';
import { getOrCreateUser, type UserWithProfile } from '../services/user-service';

export interface AuthUser {
  id: string;
  sessionId: string;
  dbUser?: UserWithProfile;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.user?.id ?? request.ip;
    },
  });

  fastify.decorateRequest('user', undefined);

  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const token = extractBearerToken(request.headers.authorization);
        const verified = await verifyJwt(token);

        const dbUser = await getOrCreateUser(verified.userId);

        request.user = {
          id: verified.userId,
          sessionId: verified.sessionId,
          dbUser,
        };
      } catch (error) {
        if (error instanceof TokenVerificationError) {
          const statusCode = error.code === 'MISSING_TOKEN' ? 401 : 401;
          const errorResponse = {
            error: 'Unauthorized',
            message: error.message,
            code: error.code,
          };

          request.log.warn({ code: error.code }, 'Authentication failed');
          return reply.status(statusCode).send(errorResponse);
        }

        request.log.error({ error }, 'Unexpected authentication error');
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Authentication service unavailable',
        });
      }
    }
  );
}

export const authMiddleware = fp(authPlugin, {
  name: 'auth-middleware',
});

export function requireUser(request: FastifyRequest): AuthUser {
  if (!request.user) {
    throw new Error('User not authenticated - ensure authenticate hook was called');
  }
  return request.user;
}
