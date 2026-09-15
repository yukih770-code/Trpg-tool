/**
 * Server-side Room Runtime projection.
 *
 * The Room Server keeps authoritative map/log payloads internally. This module
 * creates per-member display payloads before HTTP or WebSocket delivery; it is
 * deliberately stricter than the current UI and never treats React omission as
 * a privacy boundary.
 */

import { replayCombatRuntimeEvents } from '../../src/lib/combat/combatRuntimeReplay.js';
import { projectDndResourceEvent } from './projectDndResourceEvent.js';
import { projectDndSavingThrowEvent } from './projectDndSavingThrowEvent.js';
import { projectAttackResolvedFacts } from './projectAttackResolvedFacts.js';
import type { Combatant } from '../../src/lib/combat/combatRuntimeTypes.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';
import type { MapAreaTemplate, MapToken } from '../../src/lib/map/mapRuntimeTypes.js';
import type { RuntimeAcDisplay, RuntimeHpDisplay, RuntimeInjuryStage, RuntimeTokenRelation, RuntimeVisibility } from '../../src/lib/platform/roomRuntimeVisibility.js';
import type { RoomMapEvent, RoomRuntimeLogEvent, RoomSnapshot } from '../protocol/room-protocol.js';

type ViewerScope = {
  memberId?: string;
  role?: 'host' | 'player' | 'spectator';
  active: boolean;
};

function viewerScope(room: RoomSnapshot, memberId?: string): ViewerScope {
  const member = room.members.find((candidate) => candidate.memberId === memberId);
  return {
    memberId,
    role: member?.role,
    active: member?.status === 'active',
  };
}

function relationForToken(scope: ViewerScope, token: Pick<MapToken, 'kind' | 'roomMemberId' | 'actorBindingId'>): RuntimeTokenRelation {
  if (scope.role === 'player' && token.roomMemberId === scope.memberId && token.actorBindingId) return 'self';
  if (token.kind === 'playerCharacter') return 'ally';
  if (token.kind === 'monster') return 'enemy';
  if (token.kind === 'npc' || token.kind === 'companion') return 'npc';
  if (token.kind === 'object') return 'object';
  return 'unknown';
}

function visibilityForToken(scope: ViewerScope, token: Pick<MapToken, 'kind' | 'roomMemberId' | 'actorBindingId' | 'informationVisibility'>): RuntimeVisibility {
  if (scope.role === 'host') return 'hostFull';
  if (!scope.active) return 'publicObserved';
  if (relationForToken(scope, token) === 'self') return 'ownerFull';
  // A Token visible on the shared map exposes its basic table information by
  // default. Narrative secrecy uses the existing hidden-Token path; host notes
  // and opaque member/binding identifiers remain outside this projection.
  return 'publicShared';
}

function injuryStage(current?: number, max?: number, defeated?: boolean): RuntimeInjuryStage | undefined {
  if (defeated || (current !== undefined && current <= 0)) return 'defeated';
  if (current === undefined || max === undefined || max <= 0) return undefined;
  const ratio = current / max;
  if (ratio >= 0.99) return 'uninjured';
  if (ratio > 0.5) return 'wounded';
  if (ratio > 0.2) return 'bloodied';
  return 'nearDeath';
}

function hpFor(visibility: RuntimeVisibility, current?: number, max?: number, temporary?: number, defeated?: boolean): RuntimeHpDisplay {
  if (visibility === 'hostFull' || visibility === 'ownerFull' || visibility === 'partyPublic' || visibility === 'publicShared') return { kind: 'exact', current, max, temporary };
  const stage = injuryStage(current, max, defeated);
  return stage ? { kind: 'stage', stage } : { kind: 'unknown' };
}

function acFor(visibility: RuntimeVisibility, armorClass?: number): RuntimeAcDisplay {
  return (visibility === 'hostFull' || visibility === 'ownerFull' || visibility === 'partyPublic' || visibility === 'publicShared') && armorClass !== undefined
    ? { kind: 'exact', value: armorClass }
    : { kind: 'unknown' };
}

function visibleConditions<T>(visibility: RuntimeVisibility, conditions: readonly T[] | undefined): T[] {
  // Existing conditions do not carry individual public/revealed metadata. Until
  // such metadata exists, only owner/host receive the complete set.
  return visibility === 'hostFull' || visibility === 'ownerFull' || visibility === 'partyPublic' || visibility === 'publicShared' ? [...(conditions ?? [])] : [];
}

function projectToken(scope: ViewerScope, token: MapToken): MapToken {
  if (scope.role === 'host') return { ...token, visibility: 'hostFull', relation: relationForToken(scope, token), hpDisplay: hpFor('hostFull', token.hpSummary?.current, token.hpSummary?.max, token.hpSummary?.temporary), acDisplay: { kind: 'unknown' } };
  const visibility = visibilityForToken(scope, token);
  const relation = relationForToken(scope, token);
  const own = visibility === 'ownerFull';
  return {
    id: token.id,
    name: token.displayName ?? token.name,
    displayName: token.displayName ?? token.name,
    x: token.x,
    y: token.y,
    size: token.size,
    width: token.width,
    height: token.height,
    footprint: token.footprint,
    sourceType: 'unknown',
    imageUrl: token.imageUrl,
    imageAssetId: token.imageAssetId,
    initials: token.initials,
    kind: token.kind,
    informationVisibility: undefined,
    hpSummary: own ? token.hpSummary : undefined,
    hpDisplay: hpFor(visibility, token.hpSummary?.current, token.hpSummary?.max, token.hpSummary?.temporary),
    acDisplay: { kind: 'unknown' },
    conditionSummary: visibleConditions(visibility, token.conditionSummary),
    visibility,
    relation,
    // The owning player needs this opaque link to recognize their admitted
    // character Token. Other viewers never receive binding/member ids.
    actorBindingId: own ? token.actorBindingId : undefined,
    roomMemberId: own ? token.roomMemberId : undefined,
    isHidden: false,
  };
}

function projectCombatant(scope: ViewerScope, combatant: Combatant, token?: MapToken): Combatant {
  if (scope.role === 'host') return {
    ...combatant,
    hpDisplay: hpFor('hostFull', combatant.hpCurrent, combatant.hpMax, combatant.temporaryHp, combatant.isDefeated),
    acDisplay: acFor('hostFull', combatant.armorClass),
    visibility: 'hostFull',
    relation: token ? relationForToken(scope, token) : 'unknown',
  };
  const marker: Pick<MapToken, 'kind' | 'roomMemberId' | 'actorBindingId' | 'informationVisibility'> = token ?? {
    kind: combatant.kind === 'character' ? 'playerCharacter' : combatant.kind === 'npc' ? 'npc' : 'unknown',
  };
  const visibility = visibilityForToken(scope, marker);
  const relation = relationForToken(scope, marker);
  const own = visibility === 'ownerFull';
  return {
    id: combatant.id,
    name: combatant.displayName,
    displayName: combatant.displayName,
    sourceType: 'unknown',
    kind: combatant.kind,
    mapTokenId: combatant.mapTokenId,
    initiative: combatant.initiative,
    initiativeModifier: 0,
    conditions: visibleConditions(visibility, combatant.conditions),
    conditionStates: visibleConditions(visibility, combatant.conditionStates).map(c => ({ systemId: c.systemId, conditionId: c.conditionId, ...(c.level !== undefined ? { level: c.level } : {}) })),
    isDefeated: combatant.isDefeated,
    status: combatant.status,
    hpCurrent: own ? combatant.hpCurrent : undefined,
    hpMax: own ? combatant.hpMax : undefined,
    temporaryHp: own ? combatant.temporaryHp : undefined,
    hitPoints: own ? combatant.hpCurrent : undefined,
    maxHitPoints: own ? combatant.hpMax : undefined,
    armorClass: own ? combatant.armorClass : undefined,
    hpDisplay: hpFor(visibility, combatant.hpCurrent, combatant.hpMax, combatant.temporaryHp, combatant.isDefeated),
    acDisplay: acFor(visibility, combatant.armorClass),
    visibility,
    relation,
  };
}

function projectTemplate(template: MapAreaTemplate): MapAreaTemplate {
  return { ...template, isHidden: false };
}

function eventWithPayload(event: RoomMapEvent, eventKind: RoomMapEvent['eventKind'], payload: Record<string, unknown>): RoomMapEvent {
  return { ...event, eventKind, payload };
}

/** Project a complete map history. Hidden Token/template transitions become
 * synthetic add/remove events so the client projection stays coherent. */
export function projectRoomMapEventsForViewer(room: RoomSnapshot, memberId: string | undefined, events: readonly RoomMapEvent[]): RoomMapEvent[] {
  const scope = viewerScope(room, memberId);
  if (!scope.active) return [];
  if (scope.role === 'host') return events.map((event) => ({ ...event, payload: { ...event.payload } }));
  const historyByMap = new Map<string, RoomMapEvent[]>();
  const projected: RoomMapEvent[] = [];
  for (const event of events) {
    const history = historyByMap.get(event.mapId) ?? [];
    const before = replayMapRuntimeEvents(history, event.mapId);
    history.push(event);
    historyByMap.set(event.mapId, history);
    const after = replayMapRuntimeEvents(history, event.mapId);
    if (event.eventKind.startsWith('map.token_')) {
      const tokenId = typeof event.payload.tokenId === 'string'
        ? event.payload.tokenId
        : typeof (event.payload.token as { id?: unknown } | undefined)?.id === 'string'
          ? (event.payload.token as { id: string }).id
          : undefined;
      const prior = tokenId ? before.tokens.find((token) => token.id === tokenId) : undefined;
      const next = tokenId ? after.tokens.find((token) => token.id === tokenId) : undefined;
      const priorVisible = !!prior && !prior.isHidden;
      const nextVisible = !!next && !next.isHidden;
      if (!priorVisible && nextVisible && next) projected.push(eventWithPayload(event, 'map.token_added', { token: projectToken(scope, next) }));
      else if (priorVisible && !nextVisible) projected.push(eventWithPayload(event, 'map.token_removed', { tokenId }));
      else if (nextVisible && next && event.eventKind === 'map.token_updated') projected.push(eventWithPayload(event, 'map.token_updated', { token: projectToken(scope, next) }));
      else if (nextVisible && event.eventKind === 'map.token_moved') projected.push(eventWithPayload(event, event.eventKind, { tokenId, x: next?.x, y: next?.y }));
      else if (nextVisible && next && event.eventKind === 'map.token_added') projected.push(eventWithPayload(event, event.eventKind, { token: projectToken(scope, next) }));
      else if (priorVisible && event.eventKind === 'map.token_removed') projected.push(eventWithPayload(event, event.eventKind, { tokenId }));
      continue;
    }
    if (event.eventKind.startsWith('map.template_')) {
      const templateId = typeof event.payload.templateId === 'string'
        ? event.payload.templateId
        : typeof (event.payload.template as { id?: unknown } | undefined)?.id === 'string'
          ? (event.payload.template as { id: string }).id
          : undefined;
      const prior = templateId ? (before.templates ?? []).find((template) => template.id === templateId) : undefined;
      const next = templateId ? (after.templates ?? []).find((template) => template.id === templateId) : undefined;
      const priorVisible = !!prior && !prior.isHidden;
      const nextVisible = !!next && !next.isHidden;
      if (!priorVisible && nextVisible && next) projected.push(eventWithPayload(event, 'map.template_added', { template: projectTemplate(next) }));
      else if (priorVisible && !nextVisible) projected.push(eventWithPayload(event, 'map.template_removed', { templateId }));
      else if (nextVisible && next && event.eventKind === 'map.template_updated') projected.push(eventWithPayload(event, 'map.template_updated', { template: projectTemplate(next) }));
      else if (nextVisible && next && event.eventKind === 'map.template_added') projected.push(eventWithPayload(event, event.eventKind, { template: projectTemplate(next) }));
      else if (priorVisible && event.eventKind === 'map.template_removed') projected.push(eventWithPayload(event, event.eventKind, { templateId }));
      continue;
    }
    projected.push({ ...event, payload: { ...event.payload } });
  }
  return projected;
}

function roomTokens(events: readonly RoomMapEvent[]): MapToken[] {
  const byMap = new Map<string, RoomMapEvent[]>();
  for (const event of events) {
    const mapEvents = byMap.get(event.mapId) ?? [];
    mapEvents.push(event);
    byMap.set(event.mapId, mapEvents);
  }
  return [...byMap.entries()].flatMap(([mapId, mapEvents]) => replayMapRuntimeEvents(mapEvents, mapId).tokens);
}

function projectCombatPayload(scope: ViewerScope, event: RoomRuntimeLogEvent, history: readonly RoomRuntimeLogEvent[], mapEvents: readonly RoomMapEvent[]): Record<string, unknown> {
  const state = replayCombatRuntimeEvents(history.map((item) => ({ eventKind: item.kind, payload: item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload) ? item.payload as Record<string, unknown> : {}, seq: item.seq, createdAt: item.createdAt })));
  const tokensById = new Map(roomTokens(mapEvents).map((token) => [token.id, token]));
  const combatants = state.combatants.map((combatant) => projectCombatant(scope, combatant, combatant.mapTokenId ? tokensById.get(combatant.mapTokenId) : undefined));
  const payload = event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload) ? event.payload as Record<string, unknown> : {};
  return {
    roundNumber: state.turn.roundNumber,
    turnIndex: state.turn.turnIndex,
    activeCombatantId: state.turn.activeCombatantId,
    combatantCount: combatants.length,
    combatants,
    targetCombatantId: typeof payload.targetCombatantId === 'string' ? payload.targetCombatantId : undefined,
    ...(event.kind === 'combat.attack_resolved'
      ? projectAttackResolvedFacts(payload, combatants.find((combatant) => combatant.id === payload.targetCombatantId)) : {}),
  };
}

/** Public notes retain their author-selected public content. Combat payloads are
 * rebuilt from authoritative history so raw HP/AC/notes never cross the boundary. */
export function projectRuntimeLogEventsForViewer(room: RoomSnapshot, memberId: string | undefined, events: readonly RoomRuntimeLogEvent[], allMapEvents: readonly RoomMapEvent[]): RoomRuntimeLogEvent[] {
  const scope = viewerScope(room, memberId);
  if (!scope.active) return [];
  const history: RoomRuntimeLogEvent[] = [];
  const output: RoomRuntimeLogEvent[] = [];
  for (const event of events) {
    history.push(event);
    if (event.visibility === 'actorPrivate') continue;
    if (event.visibility === 'hostOnly' && scope.role !== 'host') continue;
    if (event.kind === 'runtime.saving_throw_requested' || event.kind === 'runtime.saving_throw_resolved') {
      output.push({ ...event, payload: projectDndSavingThrowEvent(event) });
      continue;
    }
    if (event.kind === 'runtime.resource_changed') {
      output.push({ ...event, payload: projectDndResourceEvent(room, memberId, event) });
      continue;
    }
    if (event.kind.startsWith('combat.')) {
      output.push({ ...event, payload: projectCombatPayload(scope, event, history, allMapEvents) });
      continue;
    }
    output.push({ ...event, payload: event.payload });
  }
  return output;
}

function projectActorRefForViewer(scope: ViewerScope, binding: NonNullable<RoomSnapshot['lobby']>['actorBindings'][number]) {
  const own = binding.memberId === scope.memberId;
  if (scope.role === 'host' || own) return binding.actorRef;
  return {
    systemId: binding.actorRef.systemId,
    displayName: binding.actorRef.displayName,
    source: binding.actorRef.source,
  };
}

/** Snapshot projection deliberately keeps Lobby status usable while stripping
 * other members' submitted character details and account/reconnect identifiers. */
export function projectRoomSnapshotForViewer(room: RoomSnapshot, memberId: string | undefined): RoomSnapshot {
  const scope = viewerScope(room, memberId);
  if (scope.role === 'host') return room;
  const members = room.members.map(({ userId: _userId, reconnectTokenId: _reconnectTokenId, ...member }) => member);
  const lobby = room.lobby
    ? {
        ...room.lobby,
        actorBindings: room.lobby.actorBindings.map((binding) => ({
          ...binding,
          actorRef: projectActorRefForViewer(scope, binding),
          clearance: binding.memberId === scope.memberId ? binding.clearance : undefined,
          rejectionReason: binding.memberId === scope.memberId ? binding.rejectionReason : undefined,
        })),
      }
    : undefined;
  return {
    ...room,
    members,
    // This legacy binding shape requires actorId at the type level. Non-owners
    // receive no entries at all; the owner retains only their own binding.
    actorBindings: room.actorBindings.filter((binding) => binding.memberId === scope.memberId),
    permissions: room.permissions?.filter((permission) => permission.memberId === scope.memberId),
    mapPermissions: room.mapPermissions?.filter((permission) => permission.memberId === scope.memberId),
    notes: [],
    lobby,
  };
}
