import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function check(name: string, verify: () => Promise<void>): Promise<SmokeCase> {
  try {
    await verify();
    return { name, passed: true };
  } catch (error) {
    return { name, passed: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

async function run(): Promise<void> {
  const root = process.cwd();
  const [serverSource, packageJson] = await Promise.all([
    readFile(resolve(root, 'server/room-server.ts'), 'utf8'),
    readFile(resolve(root, 'package.json'), 'utf8'),
  ]);

  const cases = await Promise.all([
    check('cloud_server_serves_frontend_build', async () => {
      assert(serverSource.includes('express.static(frontendBuildDirectory'), 'Cloud server does not register the frontend static build.');
      assert(serverSource.includes("resolve(serverEntryDirectory, '../../dist')"), 'Cloud server does not resolve the Vite build directory from its entry file.');
      assert(serverSource.includes('res.sendFile(frontendIndexFile'), 'Cloud server does not provide an SPA fallback.');
    }),
    check('api_and_room_routes_precede_spa_fallback', async () => {
      const fallbackIndex = serverSource.indexOf("app.get('*', (req, res, next) =>");
      const roomRouteIndex = serverSource.indexOf("app.post('/rooms/:roomId/runtime/dice-roll'");
      assert(fallbackIndex > roomRouteIndex, 'SPA fallback must be registered after Room Server routes.');
      assert(serverSource.includes("req.path.startsWith('/api/')") && serverSource.includes("req.path.startsWith('/rooms/')"), 'SPA fallback does not keep API and room paths out of client routing.');
    }),
    check('package_has_build_then_start_path', async () => {
      assert(packageJson.includes('"build": "vite build"'), 'Frontend build command is missing.');
      assert(packageJson.includes('"server:build": "tsc -p server/tsconfig.build.json && node scripts/copy-server-migrations.mjs"'), 'Server build must compile code and retain migration SQL.');
      assert(packageJson.includes('"server:start": "node dist-server/server/room-server.js"'), 'Server start command does not use built output.');
    }),
  ]);

  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

void run();
