import { resolve } from 'node:path';

const postgresServiceName = 'postgres';
const repoRoot = resolve(import.meta.dir, '..');
const apiRoot = resolve(repoRoot, 'apps/api');
const dbPushCommand = ['bun', 'run', 'db:push'];
const appCommand = ['bun', 'run', 'dev:app'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCommand(command: string[], label: string, cwd = repoRoot): Promise<void> {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${exitCode}`);
  }
}

async function isPostgresReady(): Promise<boolean> {
  const proc = Bun.spawn(
    ['docker', 'compose', 'exec', '-T', postgresServiceName, 'pg_isready', '-U', 'healthai', '-d', 'healthai'],
    {
      cwd: repoRoot,
      stdout: 'ignore',
      stderr: 'ignore',
    }
  );

  return (await proc.exited) === 0;
}

async function waitForPostgres(): Promise<void> {
  for (let attempt = 1; attempt <= 30; attempt++) {
    if (await isPostgresReady()) {
      return;
    }

    if (attempt === 1) {
      console.log('Waiting for Postgres to accept connections...');
    }

    await sleep(1000);
  }

  throw new Error('Postgres did not become ready in time');
}

async function main(): Promise<void> {
  console.log('Starting Postgres...');
  await runCommand(['docker', 'compose', 'up', '-d', postgresServiceName], 'Starting Postgres');

  await waitForPostgres();

  console.log('Ensuring database schema is up to date...');
  await runCommand(dbPushCommand, 'Pushing database schema', apiRoot);

  console.log('Starting web and api dev servers...');
  const appProc = Bun.spawn(appCommand, {
    cwd: repoRoot,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  });

  const stopApp = () => {
    appProc.kill('SIGTERM');
  };

  process.on('SIGINT', stopApp);
  process.on('SIGTERM', stopApp);

  const exitCode = await appProc.exited;
  process.off('SIGINT', stopApp);
  process.off('SIGTERM', stopApp);
  process.exit(exitCode ?? 0);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
