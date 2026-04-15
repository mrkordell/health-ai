import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'fs';
import { join } from 'path';
import { checkDatabaseConnection } from './db';
import { env } from './config/env';
import { authMiddleware, requireUser } from './middleware/auth';
import { chatRoutes } from './routes/chat';
import { mealsRoutes } from './routes/meals';
import { weightRoutes } from './routes/weight';
import { userRoutes } from './routes/user';

const server = Fastify({
  logger: true,
});

await server.register(cors, {
  origin: (origin, cb) => {
    // Allow requests from any origin in development
    // In production, this should be restricted to specific domains
    cb(null, true);
  },
  credentials: true,
});

// Serve static frontend files in production
const publicDir = join(import.meta.dir, '../public');
if (existsSync(publicDir)) {
  await server.register(fastifyStatic, {
    root: publicDir,
    prefix: '/',
  });
}

await server.register(authMiddleware);

server.get('/health', async () => {
  const dbConnected = await checkDatabaseConnection();
  return {
    status: dbConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
    },
  };
});

server.get('/api/me', {
  preHandler: server.authenticate,
}, async (request) => {
  const user = requireUser(request);
  return {
    userId: user.id,
    sessionId: user.sessionId,
  };
});

await server.register(chatRoutes);
await server.register(mealsRoutes);
await server.register(weightRoutes);
await server.register(userRoutes);

// SPA fallback: serve index.html for non-API routes (client-side routing)
if (existsSync(publicDir)) {
  server.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/')) {
      return reply.status(404).send({ error: 'Not found' });
    }
    return reply.sendFile('index.html');
  });
}

const start = async () => {
  try {
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`API server running at http://localhost:${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
