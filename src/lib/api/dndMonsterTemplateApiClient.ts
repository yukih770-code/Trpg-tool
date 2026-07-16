import { createApiClient, type ApiClientOptions } from './apiClient';
import type { DndPrivateMonsterTemplate } from '../dnd/dndMonsterTemplateTypes';

export type DndMonsterTemplateApiClient = {
  list(worldServerId: string, options?: { search?: string; creatureType?: string; challengeRating?: string; tag?: string }): Promise<DndPrivateMonsterTemplate[]>;
  get(worldServerId: string, monsterTemplateId: string): Promise<DndPrivateMonsterTemplate>;
  create(worldServerId: string, input: Partial<DndPrivateMonsterTemplate> & { name: string }): Promise<DndPrivateMonsterTemplate>;
  update(worldServerId: string, monsterTemplateId: string, input: Partial<DndPrivateMonsterTemplate>): Promise<DndPrivateMonsterTemplate>;
  archive(worldServerId: string, monsterTemplateId: string): Promise<DndPrivateMonsterTemplate>;
};

const segment = (value: string) => encodeURIComponent(value);
const query = (values: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value?.trim()) params.set(key, value.trim());
  return params.size ? `?${params}` : '';
};

export function createDndMonsterTemplateApiClient(options: ApiClientOptions = {}): DndMonsterTemplateApiClient {
  const request = createApiClient(options).request;
  const root = (worldServerId: string) => `/api/world-servers/${segment(worldServerId)}/dnd/monsters`;
  const json = <T>(method: string, path: string, body?: unknown) => request<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return {
    list: (worldServerId, options = {}) => request(`${root(worldServerId)}${query(options)}`),
    get: (worldServerId, monsterTemplateId) => request(`${root(worldServerId)}/${segment(monsterTemplateId)}`),
    create: (worldServerId, input) => json('POST', root(worldServerId), input),
    update: (worldServerId, monsterTemplateId, input) => json('PATCH', `${root(worldServerId)}/${segment(monsterTemplateId)}`, input),
    archive: (worldServerId, monsterTemplateId) => json('POST', `${root(worldServerId)}/${segment(monsterTemplateId)}/archive`),
  };
}

export const dndMonsterTemplateApiClient = createDndMonsterTemplateApiClient();
