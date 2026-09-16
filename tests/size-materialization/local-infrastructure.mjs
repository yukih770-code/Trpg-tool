// Dedicated real PostgreSQL + compiled backend for size-materialization acceptance.
// Does not change .env, existing databases, or the operating-system service.
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { createConnection } from 'node:net';
import dotenv from 'dotenv';
const exec = promisify(execFile);
const root = process.cwd(), pgBin = 'C:/Program Files/PostgreSQL/18/bin';
const httpPort = process.env.ACCEPTANCE_HTTP_PORT || '8787';
const postgresPort = process.env.ACCEPTANCE_POSTGRES_PORT || '55459';
if (![httpPort, postgresPort].every(port => /^\d+$/.test(port) && Number(port) >= 1024 && Number(port) <= 65535)) throw new Error('Invalid acceptance port');
for (const port of [httpPort, postgresPort]) for (const host of ['127.0.0.1', '::1']) {
  const occupied = await new Promise(resolve => {
    const probe = createConnection({ port: Number(port), host });
    const finish = value => { probe.destroy(); resolve(value); };
    probe.once('connect', () => finish(true)); probe.once('error', () => finish(false));
    probe.setTimeout(500, () => finish(false));
  });
  if (occupied) throw new Error(`Acceptance port is already in use: ${port}`);
}
const dir = await mkdtemp(path.join(tmpdir(), 'dnd-size-pg-'));
const data = path.join(dir, 'data'), passwordFile = path.join(dir, 'password');
const password = randomBytes(24).toString('hex');
const env = { ...process.env, ...dotenv.parse(await readFile('.env')),
  DATABASE_URL: `postgresql://session_ready:${password}@127.0.0.1:${postgresPort}/postgres`,
  PORT: httpPort, ROOM_SERVER_ENV: 'localDev', SERVER_RUNTIME_MODE: 'local',
  APP_PUBLIC_HTTP_URL: `http://localhost:${httpPort}`, APP_PUBLIC_WS_URL: `ws://localhost:${httpPort}`,
  ROOM_ALLOWED_ORIGINS: 'http://localhost:3000,http://127.0.0.1:3000', PRIVATE_ALPHA_AUTH_ENABLED: 'false',
  POSTGRES_USER_DEV_API_ENABLED: 'true', ASSET_STORAGE_DIR: path.join(dir, 'assets'),
};
let backend, pgStarted = false;
const runPg = (name, args) => new Promise((resolve, reject) => {
  const child = spawn(path.join(pgBin, name+'.exe'), args, { windowsHide: true, stdio: 'ignore' });
  child.once('error', reject);
  child.once('exit', code => code === 0 ? resolve() : reject(new Error(name+' failed: '+code)));
});
async function stopBackend() {
  if (backend && backend.exitCode === null) { const child=backend; const ended=new Promise(r=>child.once('exit',r)); child.kill(); await ended; }
  backend = undefined;
}
async function startBackend() {
  backend = spawn(process.execPath, ['dist-server/server/room-server.js'], { cwd: root, env, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
  backend.stderr.on('data', data => { if (String(data).includes('startup recovery failed')) console.error('Backend recovery failed.'); });
  for (let i=0;i<100;i++) {
    try { const r=await fetch(`http://localhost:${httpPort}/health`); const h=await r.json(); if(h.ok){console.log(JSON.stringify({status:'ready', backendPid:backend.pid, database:'isolated PostgreSQL 18', durableDirectory:dir, schemaCount:h.readiness?.readySchemaCount}));return;} } catch {}
    if (backend.exitCode !== null) throw new Error('Backend exited during startup');
    await new Promise(r=>setTimeout(r,200));
  }
  throw new Error('Backend health timed out');
}
try {
  await writeFile(passwordFile,password,{mode:0o600});
  await runPg('initdb',['-D',data,'-U','session_ready','--pwfile='+passwordFile,'-A','scram-sha-256','--encoding=UTF8','--locale=C']);
  await unlink(passwordFile);
  await runPg('pg_ctl',['-D',data,'-l',path.join(dir,'postgres.log'),'-o',`-p ${postgresPort} -h 127.0.0.1`,'-w','start']); pgStarted=true;
  const migrated=await exec(process.execPath,['--import','tsx','server/db/applyPostgresMigrations.ts','--apply','--strict'],{cwd:root,env,windowsHide:true});
  const migration=JSON.parse(migrated.stdout);
  if(migration.status!=='applied') throw new Error('Existing migration setup failed: '+migration.status);
  console.log(JSON.stringify({status:'existing_migrations_applied',count:migration.appliedMigrations.length}));
  await exec(process.execPath,['--import','tsx','server/db/seedLocalDevViewer.ts','--strict'],{cwd:root,env,windowsHide:true});
  await startBackend();
  const lines=createInterface({input:process.stdin});
  for await(const line of lines) {
    if(line.trim()==='restart'){await stopBackend(); await startBackend();}
    const seed = /^seed-user ([a-zA-Z0-9_-]+)$/.exec(line.trim());
    if(seed){await exec(process.execPath,['--import','tsx','server/db/seedLocalDevViewer.ts','--strict'],{cwd:root,env:{...env,VITE_DEV_VIEWER_USER_ID:seed[1]},windowsHide:true});console.log(JSON.stringify({status:'test_user_seeded',userId:seed[1]}));}
    if(line.trim()==='stop'){lines.close();break;}
  }
} finally { await stopBackend(); if(pgStarted) await runPg('pg_ctl',['-D',data,'-m','fast','-w','stop']); }
