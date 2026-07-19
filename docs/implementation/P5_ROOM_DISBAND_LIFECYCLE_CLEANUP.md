# P5 Room Disband Lifecycle Cleanup

## Purpose

Disbanding a Room is a non-destructive lifecycle action. It closes entry to an
active Room while preserving its existing RoomSnapshot, RuntimeLog events, Room
Map events, and any separately persisted scene history.

## Lifecycle vocabulary

- **Leave room**: one member leaves; it does not close the Room for everyone.
- **Disband room**: an active host closes the Room. New joins, Ready, character
  submission, Runtime entry, dice, RuntimeLog writes, and map mutations stop.
- **Archive room**: an existing historical lifecycle state; it is also excluded
  from active discovery.
- **Delete room**: destructive removal. It is deliberately not implemented.

## Active-list behavior

The Room Server `GET /rooms` default list and Join Campaign discovery both hide
`closed` and `archived` rooms. Campaign-room workspace lists defensively hide
records whose existing room status or `closedAt` already marks them inactive.
Existing direct history APIs and in-memory registries are not cleared.

## Live client behavior

The host action is **解散房间** and requires confirmation. It transitions the
existing Room lifecycle to `closed`, disables invitations, and broadcasts the
normal room snapshot envelope with a `roomDisbanded` reason. Existing members
remain eligible to receive that snapshot so an open Lobby or Runtime screen can
show **房间已解散** and offer a return path instead of presenting an empty table.

The existing WebSocket protocol is not otherwise rewritten. Existing
subscribers receive the closing snapshot; a new subscription to a closed Room
receives a `roomClosed` error instead. The member-only HTTP snapshot remains the
direct-return view's source for the product-facing closure explanation.

## Boundaries

This slice does not add permanent deletion, restore/reopen UI, a full history
browser, database migration, new identity model, or any clearance/combat rule.

## Verification

- `npm run frontend:verify:room-lifecycle`
- `npm run runtime:verify:room-lifecycle`
- Existing Lobby, player-flow, clearance, permission, and token-ownership
  smokes remain required.
