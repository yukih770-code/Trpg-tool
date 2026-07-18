import { canRoomRuntimeAction, resolveRoomRuntimePermissions } from './roomRuntimePermissions.js';

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const host = resolveRoomRuntimePermissions({ authenticated: true, roomMemberActive: true, roomRole: 'host' });
expect(host['map.grid.edit'] && host['map.template.delete'] && host['room.host.manage'], 'host should have full runtime control');

const player = resolveRoomRuntimePermissions({ authenticated: true, roomMemberActive: true, roomRole: 'player' });
expect(player['map.measure.temporary'] && player['map.preview.range.temporary'], 'player should have temporary measurement tools');
expect(!player['map.template.fix'] && !player['map.background.edit'], 'player should not receive fixed ranges or presentation control by default');

const granted = resolveRoomRuntimePermissions({
  authenticated: true,
  roomMemberActive: true,
  roomRole: 'player',
  grants: [{ action: 'map.template.fix', scope: 'roomSession' }],
});
expect(granted['map.template.fix'], 'an explicit range grant should allow fixed templates');
expect(!granted['map.template.edit'] && !granted['map.token.move'], 'a range grant must stay narrow');

const spectator = resolveRoomRuntimePermissions({ authenticated: true, roomMemberActive: true, roomRole: 'spectator' });
expect(spectator['map.view'] && spectator['map.measure.temporary'], 'spectator may view and measure locally');
expect(!spectator['map.preview.range.temporary'] && !spectator['runtime.event.append'], 'spectator must not mutate or share range previews');

expect(!canRoomRuntimeAction({ authenticated: false, roomMemberActive: true, roomRole: 'host', connectedViaLan: true }, 'map.grid.edit'), 'LAN reachability must not grant host permissions');

// eslint-disable-next-line no-console
console.log('Room runtime permission smoke passed: role defaults, narrow range grant, and LAN non-authority.');
