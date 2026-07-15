export interface RuntimeSessionContext {
  worldServerId: string;
  campaignId: string;
  roomId: string;
  runtimeSessionId: string;
  notes: string[];
}

export type RuntimeSessionContextFailureReason =
  | 'missing_world_server'
  | 'missing_campaign'
  | 'missing_room'
  | 'missing_runtime_session';

export type RuntimeSessionContextResult =
  | { ok: true; context: RuntimeSessionContext }
  | { ok: false; reason: RuntimeSessionContextFailureReason; notes: string[] };

function required(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function resolveRuntimeSessionContext(input: {
  worldServerId?: string | null;
  campaignId?: string | null;
  roomId?: string | null;
  runtimeSessionId?: string | null;
}): RuntimeSessionContextResult {
  const worldServerId = required(input.worldServerId);
  if (!worldServerId) return { ok: false, reason: 'missing_world_server', notes: ['World server context is required.'] };
  const campaignId = required(input.campaignId);
  if (!campaignId) return { ok: false, reason: 'missing_campaign', notes: ['Campaign context is required.'] };
  const roomId = required(input.roomId);
  if (!roomId) return { ok: false, reason: 'missing_room', notes: ['Room context is required.'] };
  const runtimeSessionId = required(input.runtimeSessionId);
  if (!runtimeSessionId) return { ok: false, reason: 'missing_runtime_session', notes: ['Runtime session context is required.'] };
  return { ok: true, context: { worldServerId, campaignId, roomId, runtimeSessionId, notes: [] } };
}

