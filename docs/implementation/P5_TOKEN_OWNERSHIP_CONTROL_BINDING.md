# P5 Token Ownership Control Binding

## Rule

Hosts may place, move, update, and remove any map token. An active player may
move only a `playerCharacter` token that the Room Server can trace to that
player's host-approved and clearance-approved Room Lobby binding. Pending
members and spectators cannot move tokens.

## Verification chain

The client may use the binding link only to show a draggable affordance. For a
live `map.token_moved` event, the server verifies: authenticated viewer ->
claimed active room member -> approved clearance binding -> persisted token
source link. `ownerUserId`, `controlledByUserId`, and a client-provided member
id are never sufficient authority by themselves.

Approved room-character placement carries additive `roomMemberId` and
`actorBindingId` metadata alongside the existing `roomActorBinding` source.
Old tokens and map events without those fields remain replayable and stay
host-controlled unless an existing binding link can be proven.

## Boundaries

Combat linkage projects HP and conditions only; it does not create token
ownership or automatic damage. LAN reachability and room codes are not
permissions. The map event stream remains HTTP append plus WebSocket broadcast;
there is no new client-to-server WebSocket map mutation message.

## Deferred

No full RBAC, persistent token-ownership database, asset upload, fog/LOS,
pathfinding, automatic damage, or combat automation is included.

## Verification

- `npm run frontend:verify:token-ownership`
- `npm run runtime:verify:token-ownership`
- `npm run runtime:verify:room-permissions`
- `npm run frontend:verify:room-permissions`
