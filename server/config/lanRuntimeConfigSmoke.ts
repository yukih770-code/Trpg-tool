import {
  createLanRuntimeEndpoints,
  detectLanHostCandidates,
  isPrivateIpv4,
  readLanRuntimeConfig,
} from './lanRuntimeConfig.js';

type Result = { name: string; passed: boolean; reason?: string };
const results: Result[] = [];

function check(name: string, condition: boolean, reason?: string): void {
  results.push({ name, passed: condition, reason: condition ? undefined : reason });
}

const fakeInterfaces = {
  loopback: [{ address: '127.0.0.1', family: 'IPv4' as const, internal: true, netmask: '255.0.0.0', cidr: '127.0.0.1/8', mac: '00:00:00:00:00:00' }],
  ethernet: [{ address: '192.168.10.20', family: 'IPv4' as const, internal: false, netmask: '255.255.255.0', cidr: '192.168.10.20/24', mac: '00:00:00:00:00:01' }],
  vpn: [{ address: '100.64.0.5', family: 'IPv4' as const, internal: false, netmask: '255.192.0.0', cidr: '100.64.0.5/10', mac: '00:00:00:00:00:02' }],
};

const candidates = detectLanHostCandidates(fakeInterfaces);
check('private_ipv4_detection_ignores_loopback_and_vpn_ranges', candidates.length === 1 && candidates[0].host === '192.168.10.20');
check('private_ipv4_range_check', isPrivateIpv4('10.0.0.1') && isPrivateIpv4('172.20.0.1') && !isPrivateIpv4('172.32.0.1'));

const generated = readLanRuntimeConfig({ LAN_ALPHA_ENABLED: 'true' }, { backendPort: 8787, interfaces: fakeInterfaces });
check('enabled_lan_generates_exact_frontend_origin', generated.allowedOriginsSource === 'generated' && generated.allowedOrigins[0] === 'http://192.168.10.20:3000');
check('enabled_lan_generates_http_ws_endpoints', generated.endpoints[0]?.backendUrl === 'http://192.168.10.20:8787' && generated.endpoints[0]?.wsUrl === 'ws://192.168.10.20:8787/ws');

const overridden = readLanRuntimeConfig({
  LAN_ALPHA_ENABLED: 'true',
  LAN_PUBLIC_HOST: '10.10.0.8',
  LAN_ALLOWED_ORIGINS: 'http://10.10.0.8:3000',
  LAN_FRONTEND_PORT: '3001',
  LAN_BACKEND_PORT: '8899',
}, { backendPort: 8787, interfaces: fakeInterfaces });
check('manual_host_and_ports_are_respected', overridden.endpoints[0]?.frontendUrl === 'http://10.10.0.8:3001' && overridden.endpoints[0]?.backendUrl === 'http://10.10.0.8:8899');
check('explicit_origins_take_precedence', overridden.allowedOriginsSource === 'explicit' && overridden.allowedOrigins[0] === 'http://10.10.0.8:3000');
check('disabled_lan_has_no_public_endpoints', readLanRuntimeConfig({}, { backendPort: 8787, interfaces: fakeInterfaces }).endpoints.length === 0);
check('endpoint_factory_preserves_ports', createLanRuntimeEndpoints(['192.168.1.5'], 3000, 8787)[0]?.frontendUrl === 'http://192.168.1.5:3000');

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length > 0) process.exitCode = 1;
