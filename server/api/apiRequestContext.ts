/**
 * API Request Scope resolver (P5.30) — server-only, DB-free.
 *
 * AI-LANDMARK: API_REQUEST_SCOPE_V1
 *
 * Extracts target scope (worldServerId / campaignId / roomId / content ref) from a
 * request's params/body/query/headers with deterministic precedence, and flags
 * conflicts when the same logical field appears with different values across sources.
 * Scope is NOT authorization — it only says what is being addressed. No DB, no
 * existence validation.
 */

export interface ApiRequestScopeInput {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
}

export interface ApiRequestScope {
  worldServerId: string | null;
  campaignId: string | null;
  roomId: string | null;
  resourceId: string | null;
  contentKind: string | null;
  contentId: string | null;
  notes: string[];
}

export type ApiRequestScopeConflict =
  | 'world_server_mismatch'
  | 'campaign_mismatch'
  | 'room_mismatch'
  | 'content_mismatch';

export interface ApiRequestScopeResult {
  scope: ApiRequestScope;
  conflicts: ApiRequestScopeConflict[];
  safe: boolean;
  notes: string[];
}

function normalizeValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' && first.trim() !== '' ? first.trim() : null;
  }
  return null;
}

/** First matching non-empty string across sources (precedence = source order), or null. */
export function getStringParam(
  sources: Array<Record<string, unknown> | undefined>,
  keys: string[],
): string | null {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const found = normalizeValue(source[key]);
      if (found !== null) return found;
    }
  }
  return null;
}

/** Distinct non-empty values across sources, in precedence order (first = chosen). */
function collectDistinctValues(
  sources: Array<Record<string, unknown> | undefined>,
  keys: string[],
): string[] {
  const ordered: string[] = [];
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const found = normalizeValue(source[key]);
      if (found !== null && !ordered.includes(found)) ordered.push(found);
    }
  }
  return ordered;
}

export function resolveApiRequestScope(input: ApiRequestScopeInput): ApiRequestScopeResult {
  // Precedence: params > body > query > headers.
  const sources: Array<Record<string, unknown> | undefined> = [
    input.params,
    input.body,
    input.query,
    input.headers as Record<string, unknown> | undefined,
  ];

  const worldValues = collectDistinctValues(sources, ['worldServerId', 'world_server_id', 'serverId', 'server_id']);
  const campaignValues = collectDistinctValues(sources, ['campaignId', 'campaign_id']);
  const roomValues = collectDistinctValues(sources, ['roomId', 'room_id']);
  const resourceValues = collectDistinctValues(sources, ['resourceId', 'resource_id']);
  const contentKindValues = collectDistinctValues(sources, ['contentKind', 'content_kind']);
  const contentIdValues = collectDistinctValues(sources, ['contentId', 'content_id']);

  const conflicts: ApiRequestScopeConflict[] = [];
  if (worldValues.length > 1) conflicts.push('world_server_mismatch');
  if (campaignValues.length > 1) conflicts.push('campaign_mismatch');
  if (roomValues.length > 1) conflicts.push('room_mismatch');
  if (contentKindValues.length > 1 || contentIdValues.length > 1) conflicts.push('content_mismatch');

  const notes: string[] = [];
  if (conflicts.length > 0) notes.push(`Conflicting scope fields across request sources: ${conflicts.join(', ')}.`);

  return {
    scope: {
      worldServerId: worldValues[0] ?? null,
      campaignId: campaignValues[0] ?? null,
      roomId: roomValues[0] ?? null,
      resourceId: resourceValues[0] ?? null,
      contentKind: contentKindValues[0] ?? null,
      contentId: contentIdValues[0] ?? null,
      notes: [],
    },
    conflicts,
    safe: conflicts.length === 0,
    notes,
  };
}
