import { createApiClient, type ApiClientOptions } from './apiClient';

export type PrivateCompendiumPack = {
  packId: string;
  ownerId?: string;
  worldServerId?: string;
  displayName: string;
  packKind: string;
  visibilityScope: string;
  lifecycleStatus: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type PrivateCompendiumEntryInput = {
  entryKind: 'species' | 'speciesOption' | 'class' | 'subclass' | 'background' | 'feat' | 'spell' | 'item' | 'monster' | 'rule' | 'other';
  displayName: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type PublishPrivateCompendiumPackInput = {
  displayName: string;
  versionLabel?: string;
  metadata?: Record<string, unknown>;
  entries: PrivateCompendiumEntryInput[];
};

export type PublishedPrivateCompendiumPack = {
  pack: PrivateCompendiumPack;
  version: { packVersionId: string; versionLabel: string };
  entries: Array<{ compendiumEntryId: string; entryKind: string; displayName: string }>;
  binding: { packBindingId: string; bindingStatus: string };
};

export type PrivateCompendiumPackApiClient = {
  list(worldServerId: string): Promise<PrivateCompendiumPack[]>;
  publish(worldServerId: string, input: PublishPrivateCompendiumPackInput): Promise<PublishedPrivateCompendiumPack>;
};

const segment = (value: string) => encodeURIComponent(value);

export function createPrivateCompendiumPackApiClient(options: ApiClientOptions = {}): PrivateCompendiumPackApiClient {
  const request = createApiClient(options).request;
  const root = (worldServerId: string) => `/api/world-servers/${segment(worldServerId)}/compendium-packs`;
  return {
    list: (worldServerId) => request(root(worldServerId)),
    publish: (worldServerId, input) => request(root(worldServerId), { method: 'POST', body: JSON.stringify(input) }),
  };
}

export const privateCompendiumPackApiClient = createPrivateCompendiumPackApiClient();
