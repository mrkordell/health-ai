# Health AI Project

## Runtime
This is a **Bun** project. Bun has built-in TypeScript support - do NOT manually configure `bun-types` or modify `tsconfig.json` for type checking. Bun handles this automatically.

## Tech Stack
- **Frontend**: Vite + React + TypeScript + Tailwind v4
- **Backend**: Bun + Fastify
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk
- **Monorepo**: Bun workspaces

## Scripts
- `bun run dev` - Start both web and api in development
- `bun run build:web` - Build frontend
- `bun --cwd apps/api db:push` - Push database schema
