type HealthPayload = { ok?: unknown; status?: unknown };

function readUrl(): string | undefined {
  const value = process.env.CLOUD_VERIFY_HEALTH_URL?.trim() || process.env.APP_PUBLIC_HTTP_URL?.trim();
  if (!value) return undefined;
  return value.replace(/\/+$/, '');
}

async function run(): Promise<void> {
  const baseUrl = readUrl();
  if (!baseUrl) {
    console.log(JSON.stringify({ status: 'skipped', reason: 'Set CLOUD_VERIFY_HEALTH_URL or APP_PUBLIC_HTTP_URL to run a remote health check.' }));
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const body = await response.json().catch(() => ({})) as HealthPayload;
    const healthy = response.ok && (body.ok === true || body.status === 'ok');
    console.log(JSON.stringify({ status: healthy ? 'healthy' : 'unhealthy', httpStatus: response.status }));
    if (!healthy) process.exitCode = 1;
  } catch {
    console.log(JSON.stringify({ status: 'unreachable' }));
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
  }
}

void run();
