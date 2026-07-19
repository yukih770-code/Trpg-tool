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
`actorBindingId` metadata. A player-controlled token must carry both exact
values for the approved binding and member. Supported player-character source
variants are `roomActorBinding`, `vaultActor`, `quickDraft`, `dndLiteActor`,
and `campaign_actor`; non-binding source ids must also match the submitted actor
id when one exists. `manual` / manual-summary, monster, NPC, object, unknown,
or malformed tokens remain host-controlled.

Old tokens and map events without exact member-plus-binding metadata remain
replayable but host-controlled. This is deliberately stricter than a best-effort
name or owner-id match: client-provided `ownerUserId` is never authority.

## Boundaries

Combat linkage projects HP and conditions only; it does not create token
ownership or automatic damage. LAN reachability and room codes are not
permissions. The map event stream remains HTTP append plus WebSocket broadcast;
there is no new client-to-server WebSocket map mutation message.

## Deferred

No full RBAC, persistent token-ownership database, asset upload, fog/LOS,
pathfinding, automatic damage, or combat automation is included.

## Player-facing map guidance

The map labels an admitted player's placed character as movable. Other Tokens
are described as host-controlled, and an admitted character without a placed
Token gets a wait-for-host message. The UI rolls back an optimistic move if the
server rejects it; it never treats the display hint as authority.

## Verification

- `npm run frontend:verify:token-ownership`
- `npm run frontend:verify:player-token-control`
- `npm run runtime:verify:token-ownership`
- `npm run runtime:verify:room-permissions`
- `npm run frontend:verify:room-permissions`

## Combat HUD map focus

The combat HUD may select and visually emphasize a linked token. This is not a
movement grant: token ownership and Room Runtime server verification remain the
only movement authority.

## Room combat projection

Room combat may link a combatant to a pre-existing map token for HP, condition,
and current-turn display. This optional link does not place a token, alter its
binding metadata, or permit a player to move any additional token.
