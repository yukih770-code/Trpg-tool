/**
 * AI Context Pack Builder + Redaction + Audit — pure backend contract (P5.24).
 *
 * AI-LANDMARK: AI_CONTEXT_PACK_BUILDER_V1
 *
 * Final step of the P5.22-P5.24 retrieval-safety pipeline. Given normalized candidates
 * (or an existing P5.21 guard result), it runs the P5.21 AI Context Scope Guard,
 * packages ONLY allowed items into a model-safe context pack, keeps denied items in
 * REDACTED form (never their body/summary), and emits a source manifest + audit-ready
 * record that contains no denied content.
 *
 * Pure: NO DB, NO HTTP, NO React, NO AI/model, NO prompt construction, NO token-budget
 * algorithm, NO network. Only allowed items ever carry body/summary.
 */

import {
  filterAiContextCandidates,
  type AiContextActor,
  type AiContextRequestScope,
  type AiContextCandidate,
  type AiContextScopeGuardResult,
  type AiContextDeniedItem,
  type AiContextAllowedItem,
  type AiContextItemKind,
  type AiContextPurpose,
  type PermissionWorldServerContext,
  type VisibilityScope,
  type AiScope,
} from './aiContextScopeGuard.js';

export type AiContextPackStatus = 'ready' | 'empty' | 'all_denied' | 'partial';

export interface AiContextPackItem {
  contextItemId: string;
  itemKind: AiContextItemKind;
  contentKind: string;
  contentId: string;
  title?: string;
  body?: string;
  summary?: string;
  visibilityScope: VisibilityScope;
  aiScope: AiScope;
  sourceOrdinal: number;
  metadata?: Record<string, unknown>;
}

export interface AiContextSourceManifestEntry {
  contextItemId: string;
  itemKind: AiContextItemKind;
  contentKind: string;
  contentId: string;
  visibilityScope: VisibilityScope;
  aiScope: AiScope;
  included: boolean;
  decisionReason: string;
  redacted: boolean;
}

export interface AiContextAuditRecord {
  auditRecordKind: 'ai_context_preflight';
  purpose: AiContextPurpose;
  viewerUserId: string | null;
  worldServerId?: string | null;
  campaignId?: string | null;
  roomId?: string | null;
  totalCandidates: number;
  allowedCount: number;
  deniedCount: number;
  deniedBodiesRedacted: true;
  sourceManifest: AiContextSourceManifestEntry[];
  notes: string[];
}

export interface BuildAiContextPackInput {
  actor: AiContextActor;
  requestScope: AiContextRequestScope;
  worldServer?: PermissionWorldServerContext | null;
  candidates: AiContextCandidate[];
  maxItems?: number;
}

export interface AiContextPackResult {
  status: AiContextPackStatus;
  items: AiContextPackItem[];
  deniedItems: AiContextDeniedItem[];
  sourceManifest: AiContextSourceManifestEntry[];
  auditRecord: AiContextAuditRecord;
  totalCandidates: number;
  allowedCount: number;
  deniedCount: number;
}

const DEFAULT_MAX_ITEMS = 20;
const MAX_MAX_ITEMS = 50;

function clampMaxItems(value: number | undefined): number {
  if (value === undefined || !Number.isInteger(value)) return DEFAULT_MAX_ITEMS;
  return Math.max(1, Math.min(MAX_MAX_ITEMS, value));
}

function allowedToPackItem(item: AiContextAllowedItem, ordinal: number): AiContextPackItem {
  return {
    contextItemId: item.contextItemId,
    itemKind: item.itemKind,
    contentKind: item.contentKind,
    contentId: item.contentId,
    title: item.title,
    body: item.body,
    summary: item.summary,
    visibilityScope: item.visibilityScope,
    aiScope: item.aiScope,
    sourceOrdinal: ordinal,
    metadata: item.metadata,
  };
}

/** Manifest reflecting the guard result only (all allowed = included). No content leaks. */
export function buildAiContextSourceManifest(guardResult: AiContextScopeGuardResult): AiContextSourceManifestEntry[] {
  const entries: AiContextSourceManifestEntry[] = [];
  for (const item of guardResult.allowedItems) {
    entries.push({
      contextItemId: item.contextItemId,
      itemKind: item.itemKind,
      contentKind: item.contentKind,
      contentId: item.contentId,
      visibilityScope: item.visibilityScope,
      aiScope: item.aiScope,
      included: true,
      decisionReason: item.permissionReason,
      redacted: false,
    });
  }
  for (const item of guardResult.deniedItems) {
    entries.push({
      contextItemId: item.contextItemId,
      itemKind: item.itemKind,
      contentKind: item.contentKind,
      contentId: item.contentId,
      visibilityScope: item.visibilityScope,
      aiScope: item.aiScope,
      included: false,
      decisionReason: item.reason,
      redacted: true,
    });
  }
  return entries;
}

export function buildAiContextPackFromGuardResult(input: {
  actor: AiContextActor;
  requestScope: AiContextRequestScope;
  guardResult: AiContextScopeGuardResult;
  maxItems?: number;
}): AiContextPackResult {
  const { actor, requestScope, guardResult } = input;
  const maxItems = clampMaxItems(input.maxItems);

  const allowed = guardResult.allowedItems;
  const included = allowed.slice(0, maxItems);
  const truncated = allowed.length > maxItems;
  const items = included.map((item, i) => allowedToPackItem(item, i));

  // Manifest reflects truncation: allowed-but-dropped items are marked not-included.
  const manifest: AiContextSourceManifestEntry[] = allowed.map((item, i) => ({
    contextItemId: item.contextItemId,
    itemKind: item.itemKind,
    contentKind: item.contentKind,
    contentId: item.contentId,
    visibilityScope: item.visibilityScope,
    aiScope: item.aiScope,
    included: i < maxItems,
    decisionReason: i < maxItems ? item.permissionReason : 'truncated_max_items',
    redacted: false,
  }));
  for (const item of guardResult.deniedItems) {
    manifest.push({
      contextItemId: item.contextItemId,
      itemKind: item.itemKind,
      contentKind: item.contentKind,
      contentId: item.contentId,
      visibilityScope: item.visibilityScope,
      aiScope: item.aiScope,
      included: false,
      decisionReason: item.reason,
      redacted: true,
    });
  }

  const totalCandidates = guardResult.totalCandidates;
  const allowedCount = guardResult.allowedCount;
  const deniedCount = guardResult.deniedCount;

  let status: AiContextPackStatus;
  if (totalCandidates === 0) status = 'empty';
  else if (allowedCount === 0) status = 'all_denied';
  else if (deniedCount === 0 && !truncated) status = 'ready';
  else status = 'partial';

  const notes: string[] = [];
  if (truncated) notes.push(`Truncated to maxItems=${maxItems}; ${allowed.length - maxItems} allowed item(s) dropped.`);

  const auditRecord: AiContextAuditRecord = {
    auditRecordKind: 'ai_context_preflight',
    purpose: requestScope.purpose,
    viewerUserId: actor.viewerUserId,
    worldServerId: requestScope.worldServerId ?? null,
    campaignId: requestScope.campaignId ?? null,
    roomId: requestScope.roomId ?? null,
    totalCandidates,
    allowedCount,
    deniedCount,
    deniedBodiesRedacted: true,
    sourceManifest: manifest,
    notes,
  };

  return {
    status,
    items,
    deniedItems: guardResult.deniedItems,
    sourceManifest: manifest,
    auditRecord,
    totalCandidates,
    allowedCount,
    deniedCount,
  };
}

export function buildAiContextPack(input: BuildAiContextPackInput): AiContextPackResult {
  const guardResult = filterAiContextCandidates({
    actor: input.actor,
    requestScope: input.requestScope,
    worldServer: input.worldServer ?? null,
    candidates: input.candidates,
  });
  return buildAiContextPackFromGuardResult({
    actor: input.actor,
    requestScope: input.requestScope,
    guardResult,
    maxItems: input.maxItems,
  });
}
