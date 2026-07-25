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
  latestVersion?: { packVersionId: string; versionLabel: string };
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

/** Owner-only projection of one immutable personal-pack version. */
export type PersonalCompendiumPackVersionContent = {
  pack: Pick<PersonalCompendiumPack, 'packId' | 'displayName' | 'packKind' | 'visibilityScope' | 'lifecycleStatus' | 'metadata'>;
  version: { packVersionId: string; packId: string; versionLabel: string; manifest: Record<string, unknown>; schemaVersion: number };
  entries: Array<{
    compendiumEntryId: string;
    entryKind: string;
    displayName: string;
    content: Record<string, unknown>;
    metadata: Record<string, unknown>;
    schemaVersion: number;
  }>;
};

export type PersonalCompendiumPackApiClient = {
  list(): Promise<PersonalCompendiumPack[]>;
  getVersion(packId: string, packVersionId: string): Promise<PersonalCompendiumPackVersionContent>;
  publish(input: PublishPersonalCompendiumPackInput): Promise<PublishedPersonalCompendiumPack>;
  publishVersion(packId: string, input: Omit<PublishPersonalCompendiumPackInput, 'displayName'>): Promise<PublishedPersonalCompendiumPack>;
};

const ROOT = '/api/me/private-compendium-packs';

export function createPersonalCompendiumPackApiClient(options: ApiClientOptions = {}): PersonalCompendiumPackApiClient {
  const request = createApiClient(options).request;
  return {
    list: () => request(ROOT),
    getVersion: (packId, packVersionId) => request(`${ROOT}/${encodeURIComponent(packId)}/versions/${encodeURIComponent(packVersionId)}`),
    publish: (input) => request(ROOT, { method: 'POST', body: JSON.stringify(input) }),
    publishVersion: (packId, input) => request(`${ROOT}/${encodeURIComponent(packId)}/versions`, { method: 'POST', body: JSON.stringify(input) }),
  };
}

export const personalCompendiumPackApiClient = createPersonalCompendiumPackApiClient();
