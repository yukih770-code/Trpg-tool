import type { Combatant } from '../combat/combatRuntimeTypes';
import type { MapToken, MapTokenHpSummary, MapTokenKind, MapTokenSize, MapTokenSourceType } from './mapRuntimeTypes';
import type { RuntimeAcDisplay, RuntimeHpDisplay } from '../platform/roomRuntimeVisibility';

/** Lightweight display prototype, not a second Actor persistence model. */
export type MapTokenPresenceCandidate = {
  sourceType: MapTokenSourceType;
  sourceId: string;
  displayName: string;
  kind?: MapTokenKind;
  size?: MapTokenSize;
  imageUrl?: string;
  initials?: string;
  campaignActorId?: string;
  combatantId?: string;
  ownerUserId?: string;
  controlledByUserId?: string;
  roomMemberId?: string;
  actorBindingId?: string;
  hpSummary?: MapTokenHpSummary;
  hpDisplay?: RuntimeHpDisplay;
  acDisplay?: RuntimeAcDisplay;
  conditionSummary?: string[];
};

export function tokenInitials(displayName: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  return words.length ? words.slice(0, 2).map((word) => word.slice(0, 1).toUpperCase()).join('') : '?';
}

export function combatantTokenSummary(combatant: Combatant): Pick<MapTokenPresenceCandidate, 'hpSummary' | 'conditionSummary'> {
  return {
    hpSummary: combatant.hpCurrent === undefined && combatant.hpMax === undefined && combatant.temporaryHp === undefined
      ? undefined
      : { current: combatant.hpCurrent, max: combatant.hpMax, temporary: combatant.temporaryHp },
    conditionSummary: combatant.conditions.length ? [...combatant.conditions] : undefined,
  };
}

export function combatantPresenceCandidate(combatant: Combatant): MapTokenPresenceCandidate {
  return {
    sourceType: 'combatant', sourceId: combatant.id, combatantId: combatant.id,
    campaignActorId: combatant.sourceActorInstanceId, displayName: combatant.displayName,
    kind: combatant.kind === 'character' ? 'playerCharacter' : combatant.kind === 'npc' ? 'npc' : 'unknown',
    size: 'medium', controlledByUserId: combatant.controllerUserId, initials: tokenInitials(combatant.displayName),
    ...combatantTokenSummary(combatant),
  };
}

export function campaignActorPresenceCandidate(input: { campaignActorInstanceId: string; displayName: string; actorKind?: string; ownerId?: string }): MapTokenPresenceCandidate {
  const kind: MapTokenKind = input.actorKind === 'monster' ? 'monster' : input.actorKind === 'npc' ? 'npc' : input.actorKind === 'pc' ? 'playerCharacter' : 'unknown';
  return { sourceType: 'campaign_actor', sourceId: input.campaignActorInstanceId, campaignActorId: input.campaignActorInstanceId, displayName: input.displayName, kind, size: 'medium', ownerUserId: input.ownerId, initials: tokenInitials(input.displayName) };
}

export function toMapTokenPrototype(candidate: MapTokenPresenceCandidate, position: { x: number; y: number }): Omit<MapToken, 'id'> {
  return {
    name: candidate.displayName, displayName: candidate.displayName, x: position.x, y: position.y, size: candidate.size ?? 'medium',
    sourceType: candidate.sourceType, sourceId: candidate.sourceId, campaignActorId: candidate.campaignActorId, combatantId: candidate.combatantId,
    sourceActorInstanceId: candidate.campaignActorId, sourceCombatantId: candidate.combatantId,
    ownerUserId: candidate.ownerUserId, controlledByUserId: candidate.controlledByUserId, imageUrl: candidate.imageUrl,
    roomMemberId: candidate.roomMemberId, actorBindingId: candidate.actorBindingId,
    initials: candidate.initials ?? tokenInitials(candidate.displayName), kind: candidate.kind ?? 'unknown', hpSummary: candidate.hpSummary,
    hpDisplay: candidate.hpDisplay, acDisplay: candidate.acDisplay,
    conditionSummary: candidate.conditionSummary ? [...candidate.conditionSummary] : undefined, isHidden: false,
  };
}

export function linkedTokenForCandidate(tokens: readonly MapToken[], candidate: Pick<MapTokenPresenceCandidate, 'sourceType' | 'sourceId' | 'campaignActorId' | 'combatantId'>): MapToken | undefined {
  return tokens.find((token) => {
    if (candidate.combatantId && (token.combatantId === candidate.combatantId || token.sourceCombatantId === candidate.combatantId)) return true;
    if (candidate.campaignActorId && (token.campaignActorId === candidate.campaignActorId || token.sourceActorInstanceId === candidate.campaignActorId)) return true;
    return Boolean(candidate.sourceId && token.sourceType === candidate.sourceType && token.sourceId === candidate.sourceId);
  });
}

/** Combat remains authoritative. This is a visual projection only. */
export function tokenWithCombatProjection(token: MapToken, combatants: readonly Combatant[]): MapToken {
  const id = token.combatantId ?? token.sourceCombatantId;
  const combatant = id
    ? combatants.find((item) => item.id === id)
    : combatants.find((item) => item.mapTokenId === token.id);
  return combatant
    ? {
        ...token,
        ...combatantTokenSummary(combatant),
        hpDisplay: combatant.hpDisplay ?? token.hpDisplay,
        acDisplay: combatant.acDisplay ?? token.acDisplay,
        visibility: combatant.visibility ?? token.visibility,
        relation: combatant.relation ?? token.relation,
      }
    : token;
}
