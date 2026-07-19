/**
 * Deterministic Room Runtime permission model.
 *
 * This is a small, platform-neutral policy helper. It does not authenticate a
 * caller, load memberships, or mutate room state. Server transport and HTTP
 * routes must provide trusted identity/membership facts before relying on it.
 */

import type { RoomMemberRole } from './roomTypes.js';

export const ROOM_RUNTIME_ACTIONS = [
  'map.view',
  'map.measure.temporary',
  'map.preview.range.temporary',
  'map.template.fix',
  'map.template.edit',
  'map.template.delete',
  'map.grid.edit',
  'map.background.edit',
  /** Legacy broad action retained for existing host-only integrations. */
  'map.token.move',
  'map.token.move.own',
  'map.token.move.any',
  'map.token.create',
  'map.token.create.own',
  'map.token.create.any',
  'map.token.update.own',
  'map.token.update.any',
  'map.token.delete',
  'map.token.delete.any',
  'map.token.assignOwner',
  'combat.view',
  'combat.edit',
  'runtime.event.append',
  'room.host.manage',
] as const;

export type RoomRuntimeAction = typeof ROOM_RUNTIME_ACTIONS[number];
export type RoomRuntimeGrantScope = 'roomSession';

export interface RoomRuntimeGrantSummary {
  action: Extract<RoomRuntimeAction, 'map.template.fix'>;
  scope: RoomRuntimeGrantScope;
  grantedByDisplayName?: string;
  grantedAt?: string;
}

export interface RoomRuntimePermissionFacts {
  /** This must be based on server-side session/auth handling on authoritative paths. */
  authenticated: boolean;
  roomRole?: RoomMemberRole;
  roomMemberActive?: boolean;
  isWorldServerOwner?: boolean;
  isWorldServerAdmin?: boolean;
  grants?: readonly RoomRuntimeGrantSummary[];
  /** Connectivity metadata is deliberately ignored by the policy. */
  connectedViaLan?: boolean;
}

export type RoomRuntimePermissionSet = Record<RoomRuntimeAction, boolean>;

function emptyPermissions(): RoomRuntimePermissionSet {
  return Object.fromEntries(ROOM_RUNTIME_ACTIONS.map((action) => [action, false])) as RoomRuntimePermissionSet;
}

/**
 * Resolves only the small Runtime Alpha action set. LAN reachability is never
 * used as an authority signal: an unauthenticated LAN client receives no grant.
 */
export function resolveRoomRuntimePermissions(facts: RoomRuntimePermissionFacts): RoomRuntimePermissionSet {
  const permissions = emptyPermissions();
  if (!facts.authenticated || !facts.roomMemberActive || !facts.roomRole) return permissions;

  const fullControl = facts.roomRole === 'host' || facts.isWorldServerOwner === true || facts.isWorldServerAdmin === true;
  if (fullControl) {
    for (const action of ROOM_RUNTIME_ACTIONS) permissions[action] = true;
    return permissions;
  }

  permissions['map.view'] = true;
  permissions['map.measure.temporary'] = true;
  permissions['combat.view'] = true;

  if (facts.roomRole === 'player') {
    permissions['map.preview.range.temporary'] = true;
    // Server-side token linkage validation remains required for every move.
    permissions['map.token.move.own'] = true;
    permissions['runtime.event.append'] = true;
    permissions['map.template.fix'] = facts.grants?.some((grant) => grant.action === 'map.template.fix') === true;
  }

  return permissions;
}

export function canRoomRuntimeAction(
  facts: RoomRuntimePermissionFacts,
  action: RoomRuntimeAction,
): boolean {
  return resolveRoomRuntimePermissions(facts)[action];
}
