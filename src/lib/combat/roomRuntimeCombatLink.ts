import type { MapToken } from '../map/mapRuntimeTypes';
import type { Combatant } from './combatRuntimeTypes';

/** Resolve only from viewer-projected Runtime data. This helper does not fetch
 * an actor or grant control; room/map permission checks remain authoritative. */
export function findCombatantLinkedToMapToken(token: MapToken, combatants: readonly Combatant[]): Combatant | undefined {
  return combatants.find((combatant) =>
    combatant.mapTokenId === token.id
    || (!!token.combatantId && combatant.id === token.combatantId)
    || (!!token.sourceCombatantId && combatant.id === token.sourceCombatantId)
    || (!!token.sourceActorInstanceId && combatant.sourceActorInstanceId === token.sourceActorInstanceId),
  );
}

export function findCombatantForActorBinding(
  tokens: readonly MapToken[],
  combatants: readonly Combatant[],
  actorBindingId?: string,
): Combatant | undefined {
  if (!actorBindingId) return undefined;
  const token = tokens.find((candidate) => candidate.actorBindingId === actorBindingId);
  return token ? findCombatantLinkedToMapToken(token, combatants) : undefined;
}
