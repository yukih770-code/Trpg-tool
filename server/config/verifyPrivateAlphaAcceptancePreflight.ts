import { evaluatePrivateAlphaAcceptancePreflight, resolvePrivateAlphaAcceptanceOrigin } from './privateAlphaAcceptancePreflight.js';

function configuredUrl(): string | undefined {
  return process.env.PRIVATE_ALPHA_SMOKE_URL?.trim()
    || process.env.CLOUD_VERIFY_HEALTH_URL?.trim()
    || process.env.APP_PUBLIC_HTTP_URL?.trim();
}

async function readJson(url: string): Promise<{ reachable: boolean; body?: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return { reachable: false };
    return { reachable: true, body: await response.json().catch(() => undefined) };
  } catch {
    return { reachable: false };
  } finally {
    clearTimeout(timeout);
  }
}

async function frontendReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    return response.ok && (response.headers.get('content-type') ?? '').includes('text/html');
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function run(): Promise<void> {
  const configuredTarget = configuredUrl();
  const target = resolvePrivateAlphaAcceptanceOrigin(configuredTarget);
  if (!target) {
    const result = evaluatePrivateAlphaAcceptancePreflight({ configuredUrl: configuredTarget });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = 1;
    return;
  }

  const [frontend, health, auth] = await Promise.all([
    frontendReachable(target),
    readJson(`${target}/health`),
    readJson(`${target}/api/auth/me`),
  ]);
  const result = evaluatePrivateAlphaAcceptancePreflight({
    configuredUrl: target,
    frontendReachable: frontend,
    healthReachable: health.reachable,
    health: health.body,
    authReachable: auth.reachable,
    auth: auth.body,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== 'ready') process.exitCode = 1;
}

void run();
