import { createCombatant } from './combatRuntimeTypes';
import { findCombatantForActorBinding, findCombatantLinkedToMapToken } from './roomRuntimeCombatLink';
import type { MapToken } from '../map/mapRuntimeTypes';

const checks: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  checks.push(name);
}

const hero = createCombatant({ id: 'hero', displayName: 'Hero', kind: 'character', sourceType: 'campaign_actor', sourceActorInstanceId: 'actor-1', mapTokenId: 'token-hero', initiative: 18, initiativeModifier: 2, conditions: [] });
const other = createCombatant({ id: 'other', displayName: 'Other', kind: 'npc', sourceType: 'manual_npc', initiative: 12, initiativeModifier: 0, conditions: [] });
const ownToken: MapToken = { id: 'token-hero', name: 'Hero', x: 0, y: 0, size: 'medium', sourceType: 'roomActorBinding', actorBindingId: 'binding-self', sourceActorInstanceId: 'actor-1' };

check('map token id resolves the linked combatant', findCombatantLinkedToMapToken(ownToken, [hero, other])?.id === 'hero');
check('approved actor binding resolves only through its projected token', findCombatantForActorBinding([ownToken], [hero, other], 'binding-self')?.id === 'hero');
check('another actor binding cannot claim the combatant', findCombatantForActorBinding([ownToken], [hero, other], 'binding-other') === undefined);
check('missing actor binding does not infer ownership', findCombatantForActorBinding([ownToken], [hero, other]) === undefined);

const sourceLinkedToken: MapToken = { ...ownToken, id: 'different-token', actorBindingId: 'binding-source' };
check('source actor instance remains a safe existing linkage fallback', findCombatantForActorBinding([sourceLinkedToken], [hero], 'binding-source')?.id === 'hero');

const activeCombatantId = hero.id;
check('own turn callout requires the linked combatant to be active', findCombatantForActorBinding([ownToken], [hero, other], 'binding-self')?.id === activeCombatantId);
check('another active combatant does not produce an own-turn match', findCombatantForActorBinding([ownToken], [hero, other], 'binding-self')?.id !== other.id);

console.log(JSON.stringify({ total: checks.length, passed: checks.length, failed: 0, checks }, null, 2));
