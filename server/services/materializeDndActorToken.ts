import { resolveDndActorSheetAuthority } from '../../src/lib/dnd/dndActorSheetAuthority.js';
import { initializeDndTokenFootprint } from '../../src/lib/dnd2024/gameplay/dndCreatureSize.js';
import type { MapBoardState } from '../../src/lib/map/mapRuntimeTypes.js';
import type { RoomRuntimeActorProjectionRepository } from './projectRoomRuntimeActorProjections.js';

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/** Creation-only server adaptation. Caller authorizes map creation first.
 * Inputs from clients supply linkage, never creature size or a computed default.
 * An explicit footprint (including null) remains an ordinary GM-authored choice.
 */
export async function materializeDndActorToken(input: {
  systemId?: string; campaignId?: string; payload: Record<string, unknown>;
  board: MapBoardState; repository: RoomRuntimeActorProjectionRepository;
}): Promise<Record<string, unknown>> {
  const token = record(input.payload?.token);
  if (input.systemId !== 'dnd5e-2024' || !input.campaignId || !token || !input.board.spatial
    || Object.prototype.hasOwnProperty.call(token, 'footprint')) return input.payload;
  const ids = [token.campaignActorId, token.sourceActorInstanceId].filter((id): id is string => typeof id === 'string' && !!id);
  const sourceId = ids[0];
  if (!sourceId || ids.some(id => id !== sourceId)) return input.payload;
  // Repeated add, including one whose footprint was cleared, is not creation.
  if (input.board.tokens.some(existing => existing.id === token.id
    || existing.campaignActorId === sourceId || existing.sourceActorInstanceId === sourceId)) return input.payload;
  const result = await input.repository.getCampaignActorInstanceById(sourceId);
  if (!result.ok) throw new Error('actor_size_unavailable');
  const actor = result.value;
  if (!actor || actor.archivedAt || actor.campaignId !== input.campaignId || actor.campaignActorInstanceId !== sourceId) return input.payload;
  const size = resolveDndActorSheetAuthority(actor).sheet?.creatureSize;
  if (typeof token.x !== 'number' || typeof token.y !== 'number') return input.payload;
  const initialized = initializeDndTokenFootprint({ ...token, x: token.x, y: token.y }, size, input.board.spatial);
  return { ...input.payload, token: initialized };
}
