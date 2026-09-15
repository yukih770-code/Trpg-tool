import type { Combatant } from '../../src/lib/combat/combatRuntimeTypes.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';
import type { MapBoardState, MapToken } from '../../src/lib/map/mapRuntimeTypes.js';
import type { RoomMapEvent } from '../../src/lib/platform/roomMapTypes.js';
import {
  evaluateDndSpatialAttackLegality,
  type DndSpatialAttackLegalityDecision,
} from '../../src/lib/dnd2024/gameplay/dndSpatialAttackLegality.js';
import type { DndWeaponAttackMode } from '../../src/lib/dnd2024/gameplay/dndWeaponAttackModes.js';

type LocatedToken = { board: MapBoardState; token: MapToken };

function boardsFromEvents(events: readonly RoomMapEvent[]): MapBoardState[] {
  return [...new Set(events.map((event) => event.mapId))]
    .map((mapId) => replayMapRuntimeEvents(events.filter((event) => event.mapId === mapId), mapId));
}

function locate(combatant: Combatant, boards: readonly MapBoardState[], role: 'attacker' | 'target'):
  | { status: 'located'; value: LocatedToken }
  | { status: 'unavailable'; decision: DndSpatialAttackLegalityDecision } {
  if (!combatant.mapTokenId) {
    return { status: 'unavailable', decision: { status: 'unavailable', reason: role === 'attacker' ? 'missing-attacker-token' : 'missing-target-token' } };
  }
  const matches = boards.flatMap((board) => board.tokens
    .filter((token) => token.id === combatant.mapTokenId)
    .map((token) => ({ board, token })));
  if (matches.length !== 1) {
    return { status: 'unavailable', decision: { status: 'unavailable', reason: role === 'attacker' ? 'ambiguous-attacker-token' : 'ambiguous-target-token' } };
  }
  return { status: 'located', value: matches[0] };
}

/** Resolves only server-replayed combatant links and map state. */
export function resolveAuthoritativeDndSpatialAttackLegality(input: {
  mapEvents: readonly RoomMapEvent[];
  actor: Combatant;
  target: Combatant;
  mode: DndWeaponAttackMode | undefined;
}): DndSpatialAttackLegalityDecision {
  if (!input.mode || input.mode.spatialEnforcement !== 'active-square-grid-footprint-v1') {
    return { status: 'unavailable', reason: 'unsupported-attack-mode' };
  }
  const boards = boardsFromEvents(input.mapEvents);
  const actor = locate(input.actor, boards, 'attacker');
  if (actor.status === 'unavailable') return actor.decision;
  const target = locate(input.target, boards, 'target');
  if (target.status === 'unavailable') return target.decision;
  if (actor.value.token.id === target.value.token.id) return { status: 'unavailable', reason: 'shared-token-link' };
  if (actor.value.board.mapId !== target.value.board.mapId) return { status: 'unavailable', reason: 'different-scenes' };
  return evaluateDndSpatialAttackLegality({
    mode: input.mode,
    spatial: actor.value.board.spatial,
    attackerToken: actor.value.token,
    targetToken: target.value.token,
  });
}
