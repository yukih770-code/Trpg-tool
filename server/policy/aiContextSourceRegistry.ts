/**
 * AI Context Source Registry — pure backend contract (P5.22).
 *
 * AI-LANDMARK: AI_CONTEXT_SOURCE_REGISTRY_V1
 *
 * Declares which retrieval source families exist and what metadata/joins each needs
 * before its rows may be considered for an AI context window. This is step 1 of the
 * P5.22-P5.24 retrieval-safety pipeline: it does NOT fetch anything and does NOT decide
 * final allow/deny (that stays with the P5.21 guard). Deny-by-default: the `unknown`
 * source is body_never and requires everything.
 *
 * Pure: NO DB, NO HTTP, NO React, NO AI/model, NO network, NO filesystem.
 */

import type { AiContextItemKind, AiScope, VisibilityScope } from './aiContextScopeGuard.js';

export type AiRetrievalSourceKind =
  | 'actor_vault'
  | 'campaign'
  | 'runtime_event'
  | 'generated_artifact'
  | 'ai_memory'
  | 'ai_context_source'
  | 'asset_metadata'
  | 'world_server'
  | 'world_server_game_system'
  | 'visibility_record'
  | 'rights_policy'
  | 'compendium_entry'
  | 'chat_message'
  | 'map'
  | 'note'
  | 'unknown';

export type AiContextBodyFetchPolicy =
  | 'metadata_only'
  | 'summary_only'
  | 'body_allowed_after_guard'
  | 'body_requires_owner'
  | 'body_requires_server_scope'
  | 'body_requires_campaign_scope'
  | 'body_never';

export interface AiContextSourceRegistryEntry {
  sourceKind: AiRetrievalSourceKind;
  defaultItemKind: AiContextItemKind;
  description: string;

  requiresVisibilityRecord: boolean;
  requiresRightsPolicy: boolean;
  requiresWorldServerScope: boolean;
  requiresCampaignScope: boolean;
  allowsPublicFallback: boolean;

  defaultBodyFetchPolicy: AiContextBodyFetchPolicy;
  minimumAiScope: AiScope | 'any';
  defaultVisibilityScope: VisibilityScope;

  canContainPrivateData: boolean;
  canContainServerData: boolean;
  canContainCampaignData: boolean;
  canContainPublicData: boolean;

  mandatoryMetadataFields: string[];
  notes: string[];
}

const BASE_METADATA_FIELDS = ['contentKind', 'contentId', 'visibilityScope', 'aiScope'];

function entry(
  sourceKind: AiRetrievalSourceKind,
  defaultItemKind: AiContextItemKind,
  overrides: Partial<AiContextSourceRegistryEntry>,
): AiContextSourceRegistryEntry {
  return {
    sourceKind,
    defaultItemKind,
    description: '',
    requiresVisibilityRecord: true,
    requiresRightsPolicy: false,
    requiresWorldServerScope: false,
    requiresCampaignScope: false,
    allowsPublicFallback: false,
    defaultBodyFetchPolicy: 'metadata_only',
    minimumAiScope: 'any',
    defaultVisibilityScope: 'user_private',
    canContainPrivateData: false,
    canContainServerData: false,
    canContainCampaignData: false,
    canContainPublicData: false,
    mandatoryMetadataFields: [...BASE_METADATA_FIELDS],
    notes: [],
    ...overrides,
  };
}

export const AI_CONTEXT_SOURCE_REGISTRY: Record<AiRetrievalSourceKind, AiContextSourceRegistryEntry> = {
  actor_vault: entry('actor_vault', 'actor', {
    description: 'Long-term Character Vault records (owner-scoped).',
    requiresVisibilityRecord: true,
    defaultVisibilityScope: 'user_private',
    defaultBodyFetchPolicy: 'body_requires_owner',
    allowsPublicFallback: false,
    canContainPrivateData: true,
    notes: ['Character sheets are owner-private by default.'],
  }),
  campaign: entry('campaign', 'campaign', {
    description: 'Campaign assets bound to a server/campaign scope.',
    requiresVisibilityRecord: true,
    requiresCampaignScope: true,
    defaultVisibilityScope: 'campaign',
    defaultBodyFetchPolicy: 'body_requires_campaign_scope',
    canContainCampaignData: true,
    canContainServerData: true,
    canContainPrivateData: true,
  }),
  runtime_event: entry('runtime_event', 'runtime_event', {
    description: 'Append-only runtime session events.',
    requiresVisibilityRecord: true,
    requiresCampaignScope: true,
    defaultVisibilityScope: 'campaign',
    defaultBodyFetchPolicy: 'body_requires_campaign_scope',
    canContainCampaignData: true,
    canContainServerData: true,
    notes: ['Requires campaign/server scope metadata; runtime remains authority elsewhere.'],
  }),
  generated_artifact: entry('generated_artifact', 'generated_artifact', {
    description: 'AI-generated outputs (recaps, drafts, summaries).',
    requiresVisibilityRecord: true,
    requiresRightsPolicy: true,
    defaultVisibilityScope: 'user_private',
    defaultBodyFetchPolicy: 'body_allowed_after_guard',
    allowsPublicFallback: true,
    canContainPrivateData: true,
    canContainServerData: true,
    canContainCampaignData: true,
    canContainPublicData: true,
    notes: ['Public fallback only for approved public artifacts; rights join required when publishable.'],
  }),
  ai_memory: entry('ai_memory', 'ai_memory', {
    description: 'Curated AI memory entries — HIGH RISK.',
    requiresVisibilityRecord: true,
    defaultVisibilityScope: 'campaign',
    defaultBodyFetchPolicy: 'body_allowed_after_guard',
    canContainPrivateData: true,
    canContainServerData: true,
    canContainCampaignData: true,
    notes: ['High-risk source; future memory-scope guard required before cross-scope reads.'],
  }),
  ai_context_source: entry('ai_context_source', 'unknown', {
    description: 'Provenance/source-tracking rows — metadata only.',
    requiresVisibilityRecord: false,
    defaultVisibilityScope: 'user_private',
    defaultBodyFetchPolicy: 'metadata_only',
    notes: ['Not a direct body source; provenance metadata only.'],
  }),
  asset_metadata: entry('asset_metadata', 'asset_metadata', {
    description: 'Media/asset metadata (never blobs).',
    requiresVisibilityRecord: true,
    defaultVisibilityScope: 'user_private',
    defaultBodyFetchPolicy: 'summary_only',
    canContainPrivateData: true,
    canContainServerData: true,
    canContainCampaignData: true,
    canContainPublicData: true,
    notes: ['Blob fetch is out of scope; metadata/summary only.'],
  }),
  world_server: entry('world_server', 'world_server', {
    description: 'World-server profile/settings (server-scoped).',
    requiresVisibilityRecord: false,
    requiresWorldServerScope: true,
    defaultVisibilityScope: 'server',
    defaultBodyFetchPolicy: 'summary_only',
    canContainServerData: true,
  }),
  world_server_game_system: entry('world_server_game_system', 'world_server', {
    description: 'Server game-system bindings (server-scoped).',
    requiresVisibilityRecord: false,
    requiresWorldServerScope: true,
    defaultVisibilityScope: 'server',
    defaultBodyFetchPolicy: 'metadata_only',
    canContainServerData: true,
  }),
  visibility_record: entry('visibility_record', 'unknown', {
    description: 'Content visibility metadata — never a body source.',
    requiresVisibilityRecord: false,
    defaultVisibilityScope: 'user_private',
    defaultBodyFetchPolicy: 'body_never',
    notes: ['Metadata only; never contributes body text.'],
  }),
  rights_policy: entry('rights_policy', 'unknown', {
    description: 'Rights/license metadata — never a body source.',
    requiresVisibilityRecord: false,
    defaultVisibilityScope: 'user_private',
    defaultBodyFetchPolicy: 'body_never',
    notes: ['Metadata only; never contributes body text.'],
  }),
  compendium_entry: entry('compendium_entry', 'note', {
    description: 'Rule/compendium content entries.',
    requiresVisibilityRecord: true,
    requiresRightsPolicy: true,
    defaultVisibilityScope: 'server',
    defaultBodyFetchPolicy: 'body_allowed_after_guard',
    allowsPublicFallback: true,
    canContainPrivateData: true,
    canContainServerData: true,
    canContainCampaignData: true,
    canContainPublicData: true,
    notes: ['Licensed/importable content requires rights join.'],
  }),
  chat_message: entry('chat_message', 'chat_message', {
    description: 'Server/channel chat messages — HIGH RISK.',
    requiresVisibilityRecord: true,
    requiresWorldServerScope: true,
    defaultVisibilityScope: 'server',
    defaultBodyFetchPolicy: 'body_requires_server_scope',
    canContainServerData: true,
    canContainPrivateData: true,
    notes: ['High-risk; future channel-permission guard required.'],
  }),
  map: entry('map', 'map', {
    description: 'Map notes/metadata (scope-bound).',
    requiresVisibilityRecord: true,
    defaultVisibilityScope: 'campaign',
    defaultBodyFetchPolicy: 'body_requires_campaign_scope',
    canContainPrivateData: true,
    canContainServerData: true,
    canContainCampaignData: true,
  }),
  note: entry('note', 'note', {
    description: 'Freeform notes (scope-bound).',
    requiresVisibilityRecord: true,
    defaultVisibilityScope: 'user_private',
    defaultBodyFetchPolicy: 'body_requires_owner',
    canContainPrivateData: true,
    canContainServerData: true,
    canContainCampaignData: true,
  }),
  unknown: entry('unknown', 'unknown', {
    description: 'Unknown/unclassified source — denied by default.',
    requiresVisibilityRecord: true,
    requiresRightsPolicy: true,
    defaultVisibilityScope: 'user_private',
    defaultBodyFetchPolicy: 'body_never',
    minimumAiScope: 'disabled',
    notes: ['Deny by default; classify before use.'],
  }),
};

export function isKnownAiRetrievalSourceKind(value: string): value is AiRetrievalSourceKind {
  return Object.prototype.hasOwnProperty.call(AI_CONTEXT_SOURCE_REGISTRY, value);
}

export function getAiContextSourceRegistryEntry(sourceKind: AiRetrievalSourceKind | string): AiContextSourceRegistryEntry {
  return isKnownAiRetrievalSourceKind(sourceKind) ? AI_CONTEXT_SOURCE_REGISTRY[sourceKind] : AI_CONTEXT_SOURCE_REGISTRY.unknown;
}

export function listAiContextSourceRegistryEntries(): AiContextSourceRegistryEntry[] {
  return Object.values(AI_CONTEXT_SOURCE_REGISTRY);
}
