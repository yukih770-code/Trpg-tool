import { chownSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';

try {
  const mount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  const assets = process.env.ASSET_STORAGE_DIR;
  if (!mount || !assets || !isAbsolute(mount) || !isAbsolute(assets) || !statSync(mount).isDirectory()) throw new Error();
  // Pilot volume is mounted directly at the object-store root. Do not create
  // missing paths: that could disguise an absent mount with ephemeral storage.
  if (realpathSync(mount) !== realpathSync(assets)) throw new Error();
  if (process.getuid?.() === 0) {
    chownSync(assets, 1000, 1000);
    process.setgroups([]);
    process.setgid(1000);
    process.setuid(1000);
  }
} catch {
  console.error('Railway asset volume is missing, outside the configured mount, or inaccessible.');
  process.exit(1);
}
const preflight = spawnSync(process.execPath, ['dist-server/server/config/verifyOnlinePilotDeployment.js'], { stdio: 'inherit' });
if (preflight.status !== 0) process.exit(preflight.status ?? 1);
await import('../dist-server/server/room-server.js');
