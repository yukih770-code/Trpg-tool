import { spawnSync } from 'node:child_process';
import { isPublicSecureOrigin } from '../server/config/serverRuntimeConfig.js';

const args = process.argv.slice(2);
const origin = args.length === 2 && args[0] === '--origin' ? args[1] : undefined;
if (!isPublicSecureOrigin(origin, 'https:')) {
  console.error('Usage: npm run build:pilot -- --origin https://YOUR_PILOT_HOST (origin only, no credentials)');
  process.exit(1);
}
const publicOrigin = new URL(origin!).origin;
// Explicit process variables override .env for these public routing/auth values.
// Leaves .env unchanged; backend secrets are not defined as client substitutions.
const result = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--mode', 'pilot'], {
  stdio: 'inherit', windowsHide: true,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    VITE_API_BASE_URL: publicOrigin,
    VITE_ROOM_SERVER_HTTP_URL: publicOrigin,
    VITE_ROOM_SERVER_WS_URL: publicOrigin.replace(/^https:/, 'wss:'),
    VITE_PRIVATE_ALPHA_AUTH_ENABLED: 'true',
    VITE_LOCAL_DEV_AUTH_ENABLED: 'false',
    VITE_DEV_VIEWER_USER_ID: '',
  },
});
process.exit(result.status ?? 1);
