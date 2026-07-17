import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function main(): Promise<void> {
  const env = { ...process.env } as Record<string, string | undefined>;
  delete env.DATABASE_URL;
  delete env.ROOM_ALLOWED_ORIGINS;
  delete env.PRIVATE_ALPHA_INVITE_CODE;
  delete env.PRIVATE_ALPHA_SESSION_SECRET;
  env.SERVER_DEPLOYMENT_ENVIRONMENT = 'cloudPrivateAlpha';
  env.SERVER_RUNTIME_MODE = 'cloud';
  env.APP_PUBLIC_HTTP_URL = 'https://api.example.test';
  env.APP_PUBLIC_WS_URL = 'wss://api.example.test';
  env.POSTGRES_USER_DEV_API_ENABLED = 'false';
  try {
    await execFileAsync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server/room-server.ts'], { cwd: process.cwd(), env });
    console.log(JSON.stringify({ status: 'failed', reason: 'cloud server unexpectedly started' }));
    process.exitCode = 1;
  } catch (error) {
    const result = error as { stdout?: string; stderr?: string };
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const rejected = output.includes('startup configuration rejected') && output.includes('DATABASE_URL') && output.includes('ROOM_ALLOWED_ORIGINS') && output.includes('private alpha invite');
    console.log(JSON.stringify({ status: rejected ? 'passed' : 'failed', case: 'cloud startup rejects missing backend config' }));
    if (!rejected) process.exitCode = 1;
  }
}

void main();
