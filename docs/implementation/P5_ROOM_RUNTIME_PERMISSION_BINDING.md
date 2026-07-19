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
  grid/background, or moving/creating/deleting arbitrary tokens. Own-token
  movement is off by default and requires the host's narrow room-session
  `map.token.move.own` grant; every actual move still requires the verified
  binding chain described below.

## Enforcement

The Room Server resolves the browser session (or the explicitly gated local
development user), then verifies that the claimed `memberId` belongs to that
user. HTTP map writes, map reads, map-permission changes, RuntimeLog append,
dice append, and WebSocket subscriptions/previews use that binding. Client-side
controls are convenience only; the server makes the authority decision.

Pending members may subscribe for lobby status after their identity is matched,
but Runtime actions require an active room member. A WebSocket may publish a
temporary preview only for the member identity it successfully subscribed as.

## Character entry projection and owned token movement

An actor binding is not a token and a local campaign entry selection is not a
room submission. The frontend may project a binding into the map candidate list
only after `binding.status` and clearance status are both approved. The existing
Room Runtime permission guard still decides placement and every subsequent map
operation. A host-placed approved room-character token additionally carries a
room member and binding link. For `map.token_moved`, the server reconstructs
the persisted token and validates the authenticated viewer, active member,
approved clearance binding, and matching token link. Metadata alone is never a
permission grant. Hosts retain control of all tokens; spectators and pending
members have none.

## Grant lifecycle and audit

`map.template.fix` and `map.token.move.own` are narrow `roomSession` grants.
The latter is stored through the existing map-permission summary but remains
limited to a player's verified approved-character token. Both travel in the
live room snapshot with their grantor display name and time, and are removed on
revocation. Each grant/revoke also appends a host-only in-memory RuntimeLog
audit record. Neither form is durable: restarting the portable Room Server
clears the grant and its in-memory audit record. The UI states this limitation
instead of claiming persistent server permissions.

## Deliberately deferred

This does not add a database migration, a persistent permission table, a full
VTT ACL, target selection, spell automation, persistent token ownership, or a
WebSocket protocol redesign. World-server owner/admin membership is not yet hydrated into
the legacy live Room Server registry, so those roles are a future integration
after one authoritative room-membership source exists.

## Verification

- `npm run runtime:verify:room-permissions`
- `npm run frontend:verify:room-permissions`
- `npm run runtime:verify:token-ownership`
- `npm run frontend:verify:token-ownership`

## Player-flow presentation

Permission decisions remain server-side. The Lobby and Runtime present the
result in product language: the host may authorize a player to move only their
admitted character, the host controls all other Tokens, and spectators are
read-only. No WebSocket protocol change is introduced by this presentation
layer.

## Lobby IA boundary

The compact Lobby roster and host review queue are display and routing changes
only. They reuse existing server-validated actions and do not grant a member
map, token, Runtime, or review authority.
