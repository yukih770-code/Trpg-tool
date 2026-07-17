import { createApiClient, type ApiClientOptions } from './apiClient';

export type AuthenticatedApiUser = {
  userId: string;
  displayName: string;
};

export type AuthMe = {
  authenticated: boolean;
  user?: AuthenticatedApiUser;
  trustLevel?: string;
};

export type AuthApiClient = {
  me(): Promise<AuthMe>;
  loginPrivateAlpha(input: { displayName: string; accessCode: string }): Promise<{ user: AuthenticatedApiUser }>;
  logout(): Promise<{ loggedOut: true }>;
};

export function createAuthApiClient(options: ApiClientOptions = {}): AuthApiClient {
  const client = createApiClient(options);
  return {
    me: () => client.request<AuthMe>('/api/auth/me'),
    loginPrivateAlpha: (input) => client.request('/api/auth/private-alpha/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    logout: () => client.request('/api/auth/logout', { method: 'POST' }),
  };
}

export const authApiClient = createAuthApiClient();
