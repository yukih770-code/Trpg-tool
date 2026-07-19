import type { RoomLifecycleStatus, RoomSnapshot } from './roomTypes.js';

/** Non-destructive room lifecycle helpers shared by room discovery and UI guards. */
export function isRoomClosedStatus(status: RoomLifecycleStatus | string | undefined): boolean {
  return status === 'closed' || status === 'archived';
}

/** Default discovery excludes rooms that are no longer open for new participation. */
export function isRoomVisibleInActiveList(status: RoomLifecycleStatus | string | undefined): boolean {
  return !isRoomClosedStatus(status);
}

export function isRoomClosed(room: Pick<RoomSnapshot, 'identity'> | undefined): boolean {
  return isRoomClosedStatus(room?.identity.lifecycleStatus);
}
