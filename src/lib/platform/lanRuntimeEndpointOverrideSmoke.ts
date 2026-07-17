import {
  createLanJoinUrl,
  isLanOrLocalHostname,
  resolveLanRuntimeEndpointOverride,
} from './lanRuntimeEndpointOverride.ts';

type Result = { name: string; passed: boolean; reason?: string };
const results: Result[] = [];

function check(name: string, condition: boolean, reason?: string): void {
  results.push({ name, passed: condition, reason: condition ? undefined : reason });
}

const lanOverride = resolveLanRuntimeEndpointOverride({
  hostname: '192.168.1.25',
  search: '?apiBase=http%3A%2F%2F192.168.1.12%3A8787&wsBase=ws%3A%2F%2F192.168.1.12%3A8787',
});
check('private_lan_override_is_accepted', lanOverride.apiBaseUrl === 'http://192.168.1.12:8787');
check('cloud_page_ignores_query_override', Object.keys(resolveLanRuntimeEndpointOverride({ hostname: 'app.example.test', search: '?apiBase=http://192.168.1.12:8787' })).length === 0);
check('public_target_is_rejected', Object.keys(resolveLanRuntimeEndpointOverride({ hostname: '192.168.1.25', search: '?apiBase=https://example.test' })).length === 0);
check('loopback_and_private_hosts_are_allowed', isLanOrLocalHostname('localhost') && isLanOrLocalHostname('10.0.0.9') && !isLanOrLocalHostname('8.8.8.8'));
check('join_url_keeps_lan_api_override', createLanJoinUrl('http://192.168.1.12:3000', 'http://192.168.1.12:8787').includes('apiBase=http%3A%2F%2F192.168.1.12%3A8787'));

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, results }, null, 2));
if (failed.length > 0) process.exitCode = 1;
