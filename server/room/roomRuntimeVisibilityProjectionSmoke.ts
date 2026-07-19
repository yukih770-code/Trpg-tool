import { createInMemoryRoomRegistry } from '../room-registry.js';
import { createRoom } from '../services/createRoom.js';
import { joinRoom } from '../services/joinRoom.js';
import { approveMember } from '../services/approveMember.js';
import { resolveRoomRuntimePermission } from './roomRuntimePermissionGuard.js';
import { projectRoomMapEventsForViewer, projectRoomSnapshotForViewer, projectRuntimeLogEventsForViewer } from './roomRuntimeVisibilityProjection.js';
import type { CurrentViewerContext } from '../auth/currentViewerContext.js';
import type { RoomMapEvent, RoomRuntimeLogEvent } from '../protocol/room-protocol.js';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function viewer(userId: string | null): CurrentViewerContext {
  return { viewerUserId: userId, isAuthenticated: userId !== null, authTrustLevel: userId ? 'dev_header' : 'anonymous', isDevOnly: userId !== null, isServiceInternal: false, notes: [] };
}

const rooms = createInMemoryRoomRegistry();
const created = createRoom({ hostDisplayName: 'Host', hostUserId: 'user_host', systemId: 'dnd5e-2024' }).room;
rooms.create(created);
const host = created.members[0];
expect(host, 'room must have a host');

const joinedPlayer = joinRoom(rooms, { inviteCodeOrRoomCode: created.identity.roomCode, requestedDisplayName: 'Player', requestedRole: 'player', userId: 'user_player' });
const joinedAlly = joinRoom(rooms, { inviteCodeOrRoomCode: created.identity.roomCode, requestedDisplayName: 'Ally', requestedRole: 'player', userId: 'user_ally' });
const joinedSpectator = joinRoom(rooms, { inviteCodeOrRoomCode: created.identity.roomCode, requestedDisplayName: 'Spectator', requestedRole: 'spectator', userId: 'user_spectator' });
const joinedPending = joinRoom(rooms, { inviteCodeOrRoomCode: created.identity.roomCode, requestedDisplayName: 'Pending', requestedRole: 'player', userId: 'user_pending' });
expect(joinedPlayer.memberId && joinedAlly.memberId && joinedSpectator.memberId && joinedPending.memberId, 'joins must create members');
approveMember(rooms, { roomId: created.identity.roomId, memberId: joinedPlayer.memberId, decidedByMemberId: host.memberId });
approveMember(rooms, { roomId: created.identity.roomId, memberId: joinedAlly.memberId, decidedByMemberId: host.memberId });
approveMember(rooms, { roomId: created.identity.roomId, memberId: joinedSpectator.memberId, decidedByMemberId: host.memberId });
const room = rooms.get(created.identity.roomId);
expect(room, 'room must be available');

expect(!resolveRoomRuntimePermission({ room, viewer: viewer('user_other'), memberId: 'not-a-member', action: 'combat.view' }).allowed, 'non-member cannot view runtime');
expect(!resolveRoomRuntimePermission({ room, viewer: viewer('user_pending'), memberId: joinedPending.memberId, action: 'combat.view' }).allowed, 'pending member cannot view runtime');
expect(resolveRoomRuntimePermission({ room, viewer: viewer('user_player'), memberId: joinedPlayer.memberId, action: 'combat.view' }).allowed, 'approved player can view runtime');
expect(resolveRoomRuntimePermission({ room, viewer: viewer('user_spectator'), memberId: joinedSpectator.memberId, action: 'combat.view' }).allowed, 'active spectator can view public runtime');

const now = new Date().toISOString();
const mapEvents: RoomMapEvent[] = [
  { mapEventId: 'map-1', roomId: room.identity.roomId, mapId: 'map', seq: 1, createdAt: now, authorMemberId: host.memberId, eventKind: 'map.token_added', payload: { token: { id: 'hero', name: 'Hero', displayName: 'Hero', x: 20, y: 20, size: 'medium', sourceType: 'roomActorBinding', kind: 'playerCharacter', actorBindingId: 'binding-hero', roomMemberId: joinedPlayer.memberId, hpSummary: { current: 14, max: 20 }, conditionSummary: ['Blessed'] } } },
  { mapEventId: 'map-2', roomId: room.identity.roomId, mapId: 'map', seq: 2, createdAt: now, authorMemberId: host.memberId, eventKind: 'map.token_added', payload: { token: { id: 'goblin', name: 'Goblin', x: 60, y: 50, size: 'small', sourceType: 'manual', kind: 'monster', notes: 'AC 15, ambush trait', hpSummary: { current: 3, max: 7 }, conditionSummary: ['Poisoned'] } } },
  { mapEventId: 'map-3', roomId: room.identity.roomId, mapId: 'map', seq: 3, createdAt: now, authorMemberId: host.memberId, eventKind: 'map.token_added', payload: { token: { id: 'public-ogre', name: 'Ogre', x: 45, y: 70, size: 'large', sourceType: 'manual', kind: 'monster', informationVisibility: 'public', notes: 'secret tactics', hpSummary: { current: 40, max: 59 }, conditionSummary: ['Slowed'] } } },
  { mapEventId: 'map-4', roomId: room.identity.roomId, mapId: 'map', seq: 4, createdAt: now, authorMemberId: host.memberId, eventKind: 'map.token_added', payload: { token: { id: 'hidden', name: 'Hidden monster', x: 75, y: 50, size: 'medium', sourceType: 'manual', kind: 'monster', isHidden: true, notes: 'secret' } } },
];
const playerMap = projectRoomMapEventsForViewer(room, joinedPlayer.memberId, mapEvents);
const allyMap = projectRoomMapEventsForViewer(room, joinedAlly.memberId, mapEvents);
const spectatorMap = projectRoomMapEventsForViewer(room, joinedSpectator.memberId, mapEvents);
const hostMap = projectRoomMapEventsForViewer(room, host.memberId, mapEvents);
const playerHero = playerMap.find((event) => event.eventKind === 'map.token_added' && (event.payload.token as { id?: string } | undefined)?.id === 'hero')?.payload.token as { hpDisplay?: { kind?: string; current?: number }; acDisplay?: { kind?: string } } | undefined;
const playerGoblin = playerMap.find((event) => event.eventKind === 'map.token_added' && (event.payload.token as { id?: string } | undefined)?.id === 'goblin')?.payload.token as { hpSummary?: unknown; hpDisplay?: { kind?: string }; notes?: unknown; conditionSummary?: string[]; actorBindingId?: unknown } | undefined;
const allyHero = allyMap.find((event) => event.eventKind === 'map.token_added' && (event.payload.token as { id?: string } | undefined)?.id === 'hero')?.payload.token as { hpDisplay?: { kind?: string; current?: number }; conditionSummary?: string[] } | undefined;
const spectatorHero = spectatorMap.find((event) => event.eventKind === 'map.token_added' && (event.payload.token as { id?: string } | undefined)?.id === 'hero')?.payload.token as { hpDisplay?: { kind?: string; current?: number }; conditionSummary?: string[] } | undefined;
const publicOgre = playerMap.find((event) => event.eventKind === 'map.token_added' && (event.payload.token as { id?: string } | undefined)?.id === 'public-ogre')?.payload.token as { hpDisplay?: { kind?: string; current?: number }; conditionSummary?: string[]; notes?: unknown } | undefined;
expect(playerHero?.hpDisplay?.kind === 'exact' && playerHero.hpDisplay.current === 14, 'owner receives exact own HP');
expect(allyHero?.hpDisplay?.kind === 'exact' && allyHero.hpDisplay.current === 14 && allyHero.conditionSummary?.includes('Blessed'), 'other players receive default shared PC combat information');
expect(spectatorHero?.hpDisplay?.kind === 'exact' && spectatorHero.hpDisplay.current === 14 && spectatorHero.conditionSummary?.includes('Blessed'), 'spectator receives basic information for a visible player Token');
expect(playerGoblin?.hpDisplay?.kind === 'exact' && playerGoblin.hpSummary === undefined && playerGoblin.notes === undefined, 'visible enemy shares basic HP but not raw summary or notes');
expect(playerGoblin?.conditionSummary?.includes('Poisoned') && playerGoblin?.actorBindingId === undefined, 'visible enemy conditions are shared while bindings stay hidden');
expect(publicOgre?.hpDisplay?.kind === 'exact' && publicOgre.hpDisplay.current === 40 && publicOgre.conditionSummary?.includes('Slowed') && publicOgre.notes === undefined, 'visible monster shares basic combat information without host notes');
expect(!playerMap.some((event) => (event.payload.token as { id?: string } | undefined)?.id === 'hidden'), 'hidden token is absent from player map payload');
expect(hostMap.some((event) => (event.payload.token as { id?: string } | undefined)?.id === 'hidden'), 'host retains hidden token payload');

const combatants = [
  { id: 'hero-combat', displayName: 'Hero', sourceType: 'manual_pc', kind: 'character', mapTokenId: 'hero', initiative: 15, initiativeModifier: 2, hpCurrent: 14, hpMax: 20, armorClass: 16, conditions: ['Blessed'] },
  { id: 'goblin-combat', displayName: 'Goblin', sourceType: 'manual_npc', kind: 'npc', mapTokenId: 'goblin', initiative: 12, initiativeModifier: 2, hpCurrent: 3, hpMax: 7, armorClass: 15, conditions: ['Poisoned'], notes: 'legendary secret' },
  { id: 'ogre-combat', displayName: 'Ogre', sourceType: 'manual_npc', kind: 'npc', mapTokenId: 'public-ogre', initiative: 8, initiativeModifier: 0, hpCurrent: 40, hpMax: 59, armorClass: 11, conditions: ['Slowed'], notes: 'secret tactics' },
];
const logEvents: RoomRuntimeLogEvent[] = [{ eventId: 'runtime-1', roomId: room.identity.roomId, seq: 1, createdAt: now, authorMemberId: host.memberId, kind: 'combat.started', visibility: 'public', text: 'Combat started', payload: { combatants, roundNumber: 1, turnIndex: 0, activeCombatantId: 'hero-combat' } }];
const playerLog = projectRuntimeLogEventsForViewer(room, joinedPlayer.memberId, logEvents, mapEvents);
const hostLog = projectRuntimeLogEventsForViewer(room, host.memberId, logEvents, mapEvents);
const playerCombatants = (playerLog[0]?.payload as { combatants?: Array<{ id: string; hpCurrent?: number; hpMax?: number; armorClass?: number; notes?: unknown; hpDisplay?: { kind?: string }; acDisplay?: { kind?: string } }> }).combatants ?? [];
const playerEnemy = playerCombatants.find((combatant) => combatant.id === 'goblin-combat');
const playerPublicOgre = playerCombatants.find((combatant) => combatant.id === 'ogre-combat');
expect(playerEnemy?.hpDisplay?.kind === 'exact' && playerEnemy.hpCurrent === undefined && playerEnemy.hpMax === undefined && playerEnemy.armorClass === undefined && playerEnemy.notes === undefined, 'visible enemy combat projection shares exact display values without raw fields or notes');
expect(playerPublicOgre?.hpDisplay?.kind === 'exact' && playerPublicOgre.acDisplay?.kind === 'exact' && playerPublicOgre.hpCurrent === undefined && playerPublicOgre.armorClass === undefined, 'public monster combat display is exact without raw combat fields');
const hostEnemy = ((hostLog[0]?.payload as { combatants?: Array<{ id: string; hpCurrent?: number; armorClass?: number }> }).combatants ?? []).find((combatant) => combatant.id === 'goblin-combat');
expect(hostEnemy?.hpCurrent === 3 && hostEnemy.armorClass === 15, 'host receives full combat data');

const projectedSnapshot = projectRoomSnapshotForViewer(room, joinedPlayer.memberId);
expect(projectedSnapshot.members.every((member) => member.userId === undefined && member.reconnectTokenId === undefined), 'non-host snapshot strips account and reconnect ids');
expect(projectRoomSnapshotForViewer(room, host.memberId) === room, 'host snapshot remains authoritative view');

console.log('Runtime visibility projection smoke passed: member guard model, map redaction, combat projection, and snapshot redaction.');
