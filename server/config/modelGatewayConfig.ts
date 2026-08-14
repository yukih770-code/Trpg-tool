export type LocalModelGatewayConfig = {
  provider: 'ollama' | 'disabled';
  configured: boolean;
  baseUrl?: string;
  model?: string;
  timeoutMs: number;
  error?: 'missing-model' | 'invalid-base-url' | 'disabled';
};

type Env = Record<string, string | undefined>;

function text(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function timeout(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1_000 && parsed <= 120_000 ? parsed : 45_000;
}

function safeBaseUrl(value: string | undefined): string | undefined {
  try {
    const url = new URL(value ?? 'http://127.0.0.1:11434');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return undefined;
    return url.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

export function readLocalModelGatewayConfig(env: Env): LocalModelGatewayConfig {
  const requested = text(env.LOCAL_AI_PROVIDER);
  const model = text(env.LOCAL_AI_MODEL);
  const provider = requested === 'ollama' || (!requested && model) ? 'ollama' : 'disabled';
  if (provider === 'disabled') return { provider, configured: false, timeoutMs: timeout(env.LOCAL_AI_TIMEOUT_MS), error: 'disabled' };
  const baseUrl = safeBaseUrl(text(env.LOCAL_AI_BASE_URL) ?? text(env.OLLAMA_HOST));
  if (!baseUrl) return { provider, configured: false, model, timeoutMs: timeout(env.LOCAL_AI_TIMEOUT_MS), error: 'invalid-base-url' };
  if (!model) return { provider, configured: false, baseUrl, timeoutMs: timeout(env.LOCAL_AI_TIMEOUT_MS), error: 'missing-model' };
  return { provider, configured: true, baseUrl, model, timeoutMs: timeout(env.LOCAL_AI_TIMEOUT_MS) };
}
