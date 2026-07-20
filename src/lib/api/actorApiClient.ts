import { createApiClient, type ApiClientOptions } from './apiClient';

/** Full actor payload stays visible only to its authenticated vault owner. */
export type ActorVaultRecord = {
  actorId: string;
  ownerId: string;
  systemId: string;
  localActorId: string;
  displayName: string;
  payload: Record<string, unknown>;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
};

export type CreateActorVaultInput = {
  systemId: string;
  localActorId: string;
  displayName: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
};

export type ActorVaultApiClient = {
  listActors(options?: { systemId?: string; includeArchived?: boolean; limit?: number }): Promise<ActorVaultRecord[]>;
  getActor(actorId: string): Promise<ActorVaultRecord>;
  createActor(input: CreateActorVaultInput): Promise<ActorVaultRecord>;
  updateActor(actorId: string, input: { displayName?: string; payload?: Record<string, unknown> }): Promise<ActorVaultRecord>;
  archiveActor(actorId: string): Promise<ActorVaultRecord | null>;
  restoreActor(actorId: string): Promise<ActorVaultRecord | null>;
};

export function createActorVaultApiClient(options: ApiClientOptions = {}): ActorVaultApiClient {
  const client = createApiClient(options);
  const request = client.request;
  const path = (actorId: string) => `/api/actors/${encodeURIComponent(actorId)}`;
  const json = <T>(method: string, url: string, body?: unknown) => request<T>(url, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

  return {
    listActors: (options = {}) => {
      const query = new URLSearchParams();
      if (options.systemId) query.set('systemId', options.systemId);
      if (options.includeArchived) query.set('includeArchived', 'true');
      if (options.limit) query.set('limit', String(options.limit));
      const suffix = query.size > 0 ? `?${query.toString()}` : '';
      return request(`/api/actors${suffix}`);
    },
    getActor: (actorId) => request(path(actorId)),
    createActor: (input) => json('POST', '/api/actors', input),
    updateActor: (actorId, input) => json('PATCH', path(actorId), input),
    archiveActor: (actorId) => json('POST', `${path(actorId)}/archive`),
    restoreActor: (actorId) => json('POST', `${path(actorId)}/restore`),
  };
}

export const actorVaultApiClient = createActorVaultApiClient();
