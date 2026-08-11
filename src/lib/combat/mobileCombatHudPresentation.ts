export type MobileCombatHudRole = 'host' | 'player' | 'spectator';

export function initialMobileCombatHudExpanded(role: MobileCombatHudRole, isMyTurn: boolean): boolean {
  return role === 'host' || (role === 'player' && isMyTurn);
}

export function resolveMobileCombatHudExpanded(input: {
  current: boolean;
  role: MobileCombatHudRole;
  isMyTurn: boolean;
  turnChanged: boolean;
  ownTurnBecameKnown: boolean;
}): boolean {
  if (input.role === 'host') return input.current;
  if (input.role === 'player' && input.ownTurnBecameKnown) return true;
  if (input.turnChanged) return input.role === 'player' && input.isMyTurn;
  return input.current;
}
