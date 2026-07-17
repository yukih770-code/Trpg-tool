import { readServerRuntimeConfigFromEnv } from './serverRuntimeConfig.js';

const runtime = readServerRuntimeConfigFromEnv(process.env);
const lanAlpha = runtime.lanAlpha;

console.log(JSON.stringify({
  status: lanAlpha?.enabled ? 'ready' : 'disabled',
  environment: runtime.environment,
  runtimeMode: runtime.runtimeMode,
  bindHost: lanAlpha?.enabled ? lanAlpha.bindHost : undefined,
  frontendPort: lanAlpha?.frontendPort ?? 3000,
  backendPort: lanAlpha?.backendPort ?? runtime.httpPort,
  allowedOriginsSource: lanAlpha?.allowedOriginsSource ?? 'none',
  endpoints: lanAlpha?.enabled ? lanAlpha.endpoints : [],
  warnings: lanAlpha?.warnings ?? [],
  notes: [
    'Only private LAN endpoint metadata is shown.',
    'LAN reachability does not enable dev headers outside localDev or bypass private-alpha sessions.',
  ],
}, null, 2));
