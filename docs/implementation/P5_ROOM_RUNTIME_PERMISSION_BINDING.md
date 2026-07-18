# P5 Room Runtime Permission Binding

## Purpose

Runtime Alpha map collaboration is bound to a verified user, that user's room
member record, and a small room-session grant. A room code or LAN reachability
is not a permission system.

## Active actions

The shared policy defines these actions: map view; temporary measurement and
preview; fixed-template create/edit/delete; grid/background/token changes;
combat view/edit; runtime-event append; and host management.

- Active hosts receive the current Runtime Alpha action set.
- Active players may view, measure, share temporary previews, and append the
  existing player Runtime events. A player may create a fixed range only after
  a host grants that exact capability.
- Active spectators may view and make local measurements only. They do not
  share previews or mutate Runtime state.
- A grant never permits editing or deleting an existing template, changing the
  grid/background, or moving/creating/deleting tokens.

## Enforcement

The Room Server resolves the browser session (or the explicitly gated local
development user), then verifies that the claimed `memberId` belongs to that
user. HTTP map writes, map reads, map-permission changes, RuntimeLog append,
dice append, and WebSocket subscriptions/previews use that binding. Client-side
controls are convenience only; the server makes the authority decision.

Pending members may subscribe for lobby status after their identity is matched,
but Runtime actions require an active room member. A WebSocket may publish a
temporary preview only for the member identity it successfully subscribed as.

## Character entry projection

An actor binding is not a token and a local campaign entry selection is not a
room submission. The frontend may project a binding into the map candidate list
only after `binding.status` and clearance status are both approved. The existing
Room Runtime permission guard still decides placement and every subsequent map
operation. No token ownership or player movement permission is inferred from
the binding metadata.

## Grant lifecycle and audit

`map.template.fix` is a narrow `roomSession` grant. It travels in the live room
snapshot with its grantor display name and time, and is removed on revocation.
Each grant/revoke also appends a host-only in-memory RuntimeLog audit record.
Neither form is durable: restarting the portable Room Server clears the grant
and its in-memory audit record. The UI states this limitation instead of
claiming persistent server permissions.

## Deliberately deferred

This does not add a database migration, a persistent permission table, a full
VTT ACL, target selection, spell automation, token ownership, or a WebSocket
protocol redesign. World-server owner/admin membership is not yet hydrated into
the legacy live Room Server registry, so those roles are a future integration
after one authoritative room-membership source exists.

## Verification

- `npm run runtime:verify:room-permissions`
- `npm run frontend:verify:room-permissions`
