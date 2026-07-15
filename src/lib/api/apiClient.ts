import { ApiClientError, type ApiResponse } from './apiTypes';

type ImportMetaWithEnv = ImportMeta & {
  readonly env?: Record<string, unknown>;
};

export type FrontendApiEnv = Record<string, unknown>;

export type ApiClientOptions = {
  baseUrl?: string;
  env?: FrontendApiEnv;
  isDev?: boolean;
  fetcher?: typeof fetch;
};

export const DEV_VIEWER_USER_ID_STORAGE_KEY = 'dnd.dev.viewerUserId';

function frontendEnv(): FrontendApiEnv {
  return (import.meta as ImportMetaWithEnv).env ?? {};
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function resolveApiBaseUrl(env: FrontendApiEnv = frontendEnv()): string {
  return (readString(env.VITE_API_BASE_URL) ?? 'http://localhost:8787').replace(/\/+$/, '');
}

export function isApiBaseUrlConfigured(env: FrontendApiEnv = frontendEnv()): boolean {
  return readString(env.VITE_API_BASE_URL) !== undefined;
}

export function isDevApiDemoFallbackEnabled(env: FrontendApiEnv = frontendEnv()): boolean {
  return env.DEV === true && readString(env.VITE_SERVER_WORKSPACE_DEMO) === 'true';
}

export function isFrontendDevelopment(env: FrontendApiEnv = frontendEnv()): boolean {
  return env.DEV === true;
}

function storedDevViewerUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return readString(window.localStorage.getItem(DEV_VIEWER_USER_ID_STORAGE_KEY));
  } catch {
    return undefined;
  }
}

export function setDevViewerUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DEV_VIEWER_USER_ID_STORAGE_KEY, userId);
  } catch {
    // Local persistence is optional for the dev-only identity seam.
  }
}

export function resolveConfiguredDevViewerUserId(env: FrontendApiEnv = frontendEnv()): string | undefined {
  return env.DEV === true ? readString(env.VITE_DEV_VIEWER_USER_ID) : undefined;
}

export function resolveDevViewerUserId(env: FrontendApiEnv = frontendEnv()): string | undefined {
  return env.DEV === true ? storedDevViewerUserId() ?? resolveConfiguredDevViewerUserId(env) : undefined;
}

function devViewerHeader(env: FrontendApiEnv, isDev: boolean): Record<string, string> {
  const viewerId = isDev ? resolveDevViewerUserId(env) : undefined;
  return isDev && viewerId ? { 'x-dev-user-id': viewerId } : {};
}

function safeMessage(statusCode: number): string {
  if (statusCode === 401) return '需要登录后才能访问服务器。';
  if (statusCode === 403) return '你没有权限访问这项服务器数据。';
  if (statusCode === 404) return '找不到这个服务器。';
  if (statusCode === 503) return '服务器服务暂时不可用。';
  return '服务器请求暂时失败。';
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim() === '') return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiClientError('non_json', '服务器返回了无法读取的响应。', {
      statusCode: response.status,
      retryable: response.status >= 500,
    });
  }
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return Boolean(value) && typeof value === 'object' && 'ok' in value && 'statusCode' in value;
}

export function createApiClient(options: ApiClientOptions = {}) {
  const env = options.env ?? frontendEnv();
  const baseUrl = (options.baseUrl ?? resolveApiBaseUrl(env)).replace(/\/+$/, '');
  const isDev = options.isDev ?? env.DEV === true;
  const fetcher = options.fetcher ?? fetch;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    for (const [name, value] of Object.entries(devViewerHeader(env, isDev))) headers.set(name, value);

    let response: Response;
    try {
      response = await fetcher(`${baseUrl}${path}`, { ...init, headers });
    } catch {
      throw new ApiClientError('network', '无法连接服务器服务。', { retryable: true });
    }

    let body: unknown;
    try {
      body = await parseJson(response);
    } catch (error) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError('non_json', '服务器返回了无法读取的响应。', { statusCode: response.status });
    }

    if (!isApiResponse(body)) {
      throw new ApiClientError('invalid_response', safeMessage(response.status), {
        statusCode: response.status,
        retryable: response.status >= 500,
      });
    }

    if (body.ok === false || !response.ok) {
      const error = body.ok === false ? body.error : undefined;
      throw new ApiClientError('api_error', error?.message ?? safeMessage(response.status), {
        statusCode: body.statusCode || response.status,
        apiErrorKind: error?.kind,
        retryable: error?.retryable ?? response.status >= 500,
      });
    }

    return body.value as T;
  }

  return { baseUrl, request };
}

export const frontendApiClient = createApiClient();
