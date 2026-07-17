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
  const configured = readString(env.VITE_API_BASE_URL);
  if (configured) return configured.replace(/\/+$/, '');
  return isFrontendDevelopment(env) ? 'http://localhost:8787' : '';
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

export function isLocalDevAuthEnabled(env: FrontendApiEnv = frontendEnv()): boolean {
  return isFrontendDevelopment(env) && readString(env.VITE_LOCAL_DEV_AUTH_ENABLED) !== 'false';
}

export function isPrivateAlphaAuthEnabled(env: FrontendApiEnv = frontendEnv()): boolean {
  return readString(env.VITE_PRIVATE_ALPHA_AUTH_ENABLED) === 'true';
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
  return isLocalDevAuthEnabled(env) ? readString(env.VITE_DEV_VIEWER_USER_ID) : undefined;
}

export function resolveDevViewerUserId(env: FrontendApiEnv = frontendEnv()): string | undefined {
  // The configured fixture is the only known local dev user by default. A stale
  // browser selection must not silently replace the API identity with an unknown id.
  return isLocalDevAuthEnabled(env) ? resolveConfiguredDevViewerUserId(env) ?? storedDevViewerUserId() : undefined;
}

export type ApiServiceFailureKind =
  | 'frontend_misconfigured'
  | 'backend_unreachable'
  | 'invalid_dev_identity'
  | 'service_unavailable'
  | 'access_denied'
  | 'not_found'
  | 'request_failed';

export function classifyApiServiceFailure(error: ApiClientError | null): ApiServiceFailureKind | null {
  if (!error) return null;
  if (error.kind === 'configuration') return 'frontend_misconfigured';
  if (error.kind === 'network') return 'backend_unreachable';
  if (error.statusCode === 401 || error.apiErrorKind === 'unauthenticated') return 'invalid_dev_identity';
  if (error.statusCode === 503 || error.apiErrorKind === 'unavailable') return 'service_unavailable';
  if (error.statusCode === 403) return 'access_denied';
  if (error.statusCode === 404) return 'not_found';
  return 'request_failed';
}

function devViewerHeader(env: FrontendApiEnv, isDev: boolean): Record<string, string> {
  const viewerId = isDev && isLocalDevAuthEnabled(env) ? resolveDevViewerUserId(env) : undefined;
  return viewerId ? { 'x-dev-user-id': viewerId } : {};
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
    if (!baseUrl) {
      throw new ApiClientError('configuration', '未配置服务器地址。请设置 VITE_API_BASE_URL 后重新构建前端。');
    }
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    for (const [name, value] of Object.entries(devViewerHeader(env, isDev))) headers.set(name, value);

    let response: Response;
    try {
      response = await fetcher(`${baseUrl}${path}`, { ...init, headers, credentials: init.credentials ?? 'include' });
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
