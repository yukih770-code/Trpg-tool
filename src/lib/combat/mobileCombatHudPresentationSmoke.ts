import { initialMobileCombatHudExpanded, resolveMobileCombatHudExpanded } from './mobileCombatHudPresentation';

const checks: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  checks.push(name);
}

check('host starts expanded', initialMobileCombatHudExpanded('host', false));
check('player starts expanded on their turn', initialMobileCombatHudExpanded('player', true));
check('waiting player starts compact', !initialMobileCombatHudExpanded('player', false));
check('spectator starts compact', !initialMobileCombatHudExpanded('spectator', false));

check('new own turn expands a compact player HUD', resolveMobileCombatHudExpanded({ current: false, role: 'player', isMyTurn: true, turnChanged: true, ownTurnBecameKnown: true }));
check('late projected ownership still expands the current own turn', resolveMobileCombatHudExpanded({ current: false, role: 'player', isMyTurn: true, turnChanged: false, ownTurnBecameKnown: true }));
check('manual own-turn collapse survives ordinary rerenders', !resolveMobileCombatHudExpanded({ current: false, role: 'player', isMyTurn: true, turnChanged: false, ownTurnBecameKnown: false }));
check('next non-own turn returns a player HUD to compact', !resolveMobileCombatHudExpanded({ current: true, role: 'player', isMyTurn: false, turnChanged: true, ownTurnBecameKnown: false }));
check('host manual collapse survives turn changes', !resolveMobileCombatHudExpanded({ current: false, role: 'host', isMyTurn: false, turnChanged: true, ownTurnBecameKnown: false }));
check('spectator manual expansion survives ordinary rerenders', resolveMobileCombatHudExpanded({ current: true, role: 'spectator', isMyTurn: false, turnChanged: false, ownTurnBecameKnown: false }));

console.log(JSON.stringify({ total: checks.length, passed: checks.length, failed: 0, checks }, null, 2));
