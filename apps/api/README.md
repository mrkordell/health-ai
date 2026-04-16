# Health AI API

Bun + Fastify backend for the Vita coaching app.

## Stack

- **Runtime:** Bun (built-in TypeScript, no separate compile step)
- **Framework:** Fastify
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Clerk
- **Deploy:** Railway (via `railpack.json` at repo root)

## Local development

From the repo root:

```sh
bun install
bun run dev
```

## Database migrations

**IMPORTANT:** Do **not** use `db:push` for any change you want to ship. `push` is for fast local iteration only — it diffs the schema and applies changes without creating a migration file, so the change won't land on Railway.

### Workflow

1. **Edit the schema** — `src/db/schema.ts`
2. **Generate a migration** — creates a timestamped SQL file and snapshot under `src/db/migrations/`:
   ```sh
   bun run db:generate
   ```
3. **Review the generated SQL** — open the new file in `src/db/migrations/` and sanity-check it. Drizzle's diff is usually right but occasionally needs a manual tweak (e.g. when renaming columns).
4. **Commit the migration file and the updated snapshot** — both `NNNN_*.sql` and `meta/NNNN_snapshot.json` must be committed. Drizzle tracks applied migrations via these files.
5. **Deploy to Railway** — on each deploy, `railpack.json` runs `bun run db:migrate` before starting the server. Drizzle's migrator tracks which migrations have run (in a `__drizzle_migrations` table), so each file runs exactly once per environment.

### Local migration testing

To apply pending migrations against your local DB:

```sh
bun run db:migrate
```

This uses the same code path as Railway, so whatever works locally will work in prod.

### Scripts reference

| Script | Purpose | When to use |
|---|---|---|
| `db:generate` | Diff schema vs snapshot, create migration SQL file | Every schema change, before commit |
| `db:migrate` | Apply pending migrations from `src/db/migrations/` | Local testing, Railway deploy |
| `db:push` | Direct schema sync, no migration file | **Dev-only.** Throwaway local experiments. |
| `db:studio` | Open Drizzle Studio for DB inspection | Local debugging |

### Troubleshooting

**"relation X does not exist" in prod after deploy**  
You likely shipped a schema change without generating a migration. Run `bun run db:generate`, commit the new file, and redeploy.

**`DATABASE_URL environment variable is required`**  
`db:migrate`, `db:push`, and `db:studio` need a real `DATABASE_URL`. `db:generate` does not — the config uses a placeholder when the env var is missing so you can generate migrations without touching a DB.
