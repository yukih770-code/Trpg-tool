import { createApiClient, type ApiClientOptions } from './apiClient';

export type PersonalCompendiumPack = {
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

export type PersonalCompendiumEntryInput = {
  entryKind: 'species' | 'speciesOption' | 'class' | 'subclass' | 'background' | 'feat' | 'spell' | 'item' | 'monster' | 'rule' | 'other';
  displayName: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type PublishPersonalCompendiumPackInput = {
  displayName: string;
  versionLabel?: string;
  metadata?: Record<string, unknown>;
  entries: PersonalCompendiumEntryInput[];
};

export type PublishedPersonalCompendiumPack = {
  pack: PersonalCompendiumPack;
  version: { packVersionId: string; versionLabel: string };
  entries: Array<{ compendiumEntryId: string; entryKind: string; displayName: string }>;
};

export type PersonalCompendiumPackApiClient = {
  list(): Promise<PersonalCompendiumPack[]>;
  publish(input: PublishPersonalCompendiumPackInput): Promise<PublishedPersonalCompendiumPack>;
};

const ROOT = '/api/me/private-compendium-packs';

export function createPersonalCompendiumPackApiClient(options: ApiClientOptions = {}): PersonalCompendiumPackApiClient {
  const request = createApiClient(options).request;
  return {
    list: () => request(ROOT),
    publish: (input) => request(ROOT, { method: 'POST', body: JSON.stringify(input) }),
  };
}

export const personalCompendiumPackApiClient = createPersonalCompendiumPackApiClient();
