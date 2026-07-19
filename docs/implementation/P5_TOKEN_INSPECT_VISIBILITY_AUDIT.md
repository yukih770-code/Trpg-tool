# P5 Token Inspect Visibility Audit

## Decision

Do not add a general Token inspect panel that reads existing Room Map or
RuntimeLog payloads for players yet. The current Room Runtime transports full
map-event payloads and all public RuntimeLog payloads to every subscribed
viewer. A React-only hide/show treatment would leave host-only data in the
browser.

The safe next slice is a context-menu and public-inspect shell backed only by a
new server-projected public token view. It must not read `MapToken.notes`, raw
ownership ids, full `hpSummary`, or combatant payloads as an authorization
substitute.

## Current Data Exposure

### Transport facts

- `GET /rooms/:roomId` and the Room Snapshot socket message require an
  authenticated room member, but the snapshot contains all members, lobby actor
  binding summaries, and optional clearance detail payloads. It is not
  viewer-projected.
- `GET /rooms/:roomId/map-events` requires `map.view`, which active host,
  player, and spectator roles receive. The returned/broadcast map event payload
  includes complete `MapToken` records. `isHidden` is only filtered by the
  browser after receipt.
- `GET /rooms/:roomId/runtime-log` currently does not run a room-member guard.
  It returns every `public` event for a known room id. Socket subscribers do
  require membership, but receive each public event unchanged.
- `hostOnly` RuntimeLog records are withheld from public list/broadcast, but
  there is no host-only projection/read channel yet. `actorPrivate` is rejected
  rather than pretending to provide privacy.
- Room Map, RuntimeLog, and their registries are memory-only. This audit does
  not change their persistence model.

### Field classification today

| Field | Current client exposure | Required future class |
| --- | --- | --- |
| Token name, image, size, position, visible conditions | all `map.view` clients when Token is not hidden | publicObserved |
| `isHidden` Token data | sent in full map payload, then hidden in React | currently unsafe |
| HP/current/max/temp, AC, conditions from combat projection | full public combat payload plus full MapToken summary to all viewers | policy-controlled |
| Token notes, raw `ownerUserId`, `controlledByUserId`, `roomMemberId`, `actorBindingId` | sent in map payload, usually not rendered | currently unsafe |
| Player binding `actorRef` name/summary/HP/AC/details | sent in the unprojected Room Snapshot to members | party/host policy required |
| Equipment, traits, feats, race/class, long-term effects in clearance details | may exist in `actorRef.details` inside Room Snapshot | host review only until projection exists |
| Monster/NPC stat block, legendary actions, resistances, weaknesses | no dedicated runtime schema or UI today | hostFull only |
| RuntimeLog public payload | delivered unchanged to public viewers | public-only schema required |
| RuntimeLog hostOnly payload | stored, not public-delivered | host-only read projection deferred |

### Viewer result

| Viewer | Current read behavior | Safe conclusion |
| --- | --- | --- |
| Host | gets full room/map/public-log data; hostOnly lacks a usable read API | host operations are incomplete but not player-safe source |
| Approved player | gets full visible map events and all public log/combat payloads | cannot safely inspect enemy combat data yet |
| Pending player | Runtime entry is blocked; Snapshot behavior remains lobby-level | must receive no Runtime inspect projection |
| Spectator | `map.view` permits map events and public log/combat payloads | read-only does not mean redacted today |

## Existing Interaction Surface

`BasicMapBoard` already has a low-risk hook point:

- token click selects a Token;
- a Token selection can select the linked combatant;
- combatant selection/current turn can locate and highlight a linked Token;
- hover uses the browser title, not an information card;
- there is no `onContextMenu`, double-click inspect action, or viewer-aware
  tooltip;
- the selected-token editor is host-only and edits raw map data.

A future context menu should attach to the Token button in `BasicMapBoard`,
capture the selected token id and pointer position, and ask a parent-provided
viewer-aware action resolver for allowed actions. It must not infer actions from
`canManage` alone or expose the original Token object to a player inspect card.

## Combat Display Audit

`CombatModeHud`, `CombatRuntimeTable`, and `RoomRuntimeCombatPanel` currently
work from the complete `Combatant` value. That value contains exact HP, max HP,
temporary HP, AC, conditions, notes, and source/controller links. The map
projects HP and conditions directly from it through `actorPresence`.

Therefore:

- exact HP bars and AC badges are technically easy but unsafe for enemies until
  projection exists;
- an apparent-injury indicator can be computed in the server projection without
  sending exact HP/max HP;
- player/ally/enemy policies can differ, but a new presentation adapter should
  own that policy rather than `BasicMapBoard` or a combat component;
- current actor cards must consume a projected combat view for non-host viewers,
  not the raw combatant.

## Proposed Visibility Contract

Use a server-produced `TokenInspectProjection`, keyed by `roomId`, `tokenId`,
and the authenticated viewer. Keep the raw map event and raw combatant separate
from the projection.

| Level | Intended data |
| --- | --- |
| `ownerFull` | own character sheet summary, exact own HP/AC/conditions, approved personal actions |
| `partyPublic` | ally name/avatar, configured HP policy, visible conditions, optional class/race labels |
| `publicObserved` | Token name/avatar/size/type when known, visible conditions, apparent injury only |
| `investigated` | facts explicitly revealed for this room/token/viewer or party |
| `hostFull` | full stat block, exact values, hidden notes, triggers, legendary actions |

Default redaction rules:

| Field | Default policy |
| --- | --- |
| Current/max/temp HP | ownerFull exact; party policy configurable; enemy/NPC apparent injury only |
| AC | ownerFull exact; party policy configurable; hostile targets hidden unless revealed |
| Conditions | only visible conditions in publicObserved; complete list hostFull |
| Traits, features, equipment, spells | ownerFull or hostFull; explicit reveal required otherwise |
| Resistances, weaknesses, reactions, legendary actions | hostFull; reveal records may expose a named subset |
| Hidden identity, notes, raw ids, ownership/binding ids | hostFull/internal only; never an inspect payload |

## Inspect and Investigation Flow

1. Right-click or keyboard action on a visible Token.
2. Request/render its current `publicObserved` projection.
3. Show `查看公开信息`; show `调查` only when the target and viewer policy allow.
4. A player check request is validated by a future host/rules workflow; it does
   not reveal client-selected fields.
5. Host approval or a resolved check appends a typed reveal event such as
   `token.info_revealed` / `token.info_hidden`.
6. The server stores/replays reveal scope, then projects future inspect reads.

Reveal payloads need only contain token id, reveal key, scope (`viewer`,
`party`, or `public`), source/check reference, and a redacted value. They must
not place a full monster stat block in a public RuntimeLog event.

## Context Menu Permission Matrix

The menu is an affordance only; each mutation stays server-authoritative.

| Action | Host | Approved owner | Approved non-owner | Spectator / pending |
| --- | --- | --- | --- | --- |
| 查看公开信息 / 定位 Token | allowed for visible target | allowed for visible target | allowed for visible target | read-only visible target only |
| 调查 | may reveal manually | request a check | request a check | no request by default |
| 攻击 shortcut | future host tool | future own-character target selection | future own-character target selection | no |
| 加入战斗 | host only | no | no | no |
| 调整 HP / AC / 状态 | host only | no automatic writeback | no | no |
| 编辑资料 / 删除 Token | host only | no | no | no |
| 揭示 / 隐藏信息 | host only | no | no | no |
| 触发传奇动作 | host only | no | no | no |

Target refinements: an owner receives `ownerFull` only for their approved linked
character; an ally receives at most `partyPublic`; enemy monster, NPC, object,
and manual Token default to `publicObserved`. A spectator never gains owner or
party authority merely by being in the Room.

## Security Boundary and Staged Plan

### Required before rich inspect (P1)

1. Require verified room participation for RuntimeLog list reads.
2. Add server-side viewer-aware projection for map list, map socket broadcast,
   RuntimeLog list, and RuntimeLog socket broadcast.
3. Stop sending hidden Token fields and raw combatant fields to player/spectator
   clients. React must receive a redacted DTO, not decide what is secret.
4. Separate host review `CharacterClearanceDetails` from ordinary member
   snapshots or project it by viewer role.

### Stage 1: safe interaction shell

Add a context-menu shell and a public inspect panel using only a deliberately
small public projection: display name, image/initials, visible size/type,
visible conditions, and apparent injury. Verify all roles see the same allowed
fields and no raw ids are retained in the component props.

### Stage 2: projection boundary

Introduce typed `ownerFull` / `partyPublic` / `publicObserved` / `hostFull`
server projections. Add HTTP and WebSocket projection tests for host, owner,
non-owner player, spectator, and pending member.

### Stage 3: investigation memory

Add append-only, viewer/party-scoped reveal records with replay tests. Keep
check resolution separate from any full rules engine.

### Stage 4: combat shortcuts

Add target selection, host legendary-action tools, and future attack shortcuts
only after the projection contract is proven. No automatic attack/damage or
spell resolution is implied.

## Explicitly Deferred

No context menu implementation, database migration, monster stat-block import,
automatic investigation rules, player HP editing, spell automation, AI turns,
fog/LOS, full RBAC, or real host-only read channel is included by this audit.

## Manual Smoke Checklist

Run this only after Stage 2 projection exists; it is intentionally not a claim
that the current build is safe for rich enemy inspection.

1. Enter the same Room as host, approved owner, non-owner player, spectator,
   and pending member.
2. Create a player Token, ally Token, visible monster Token, hidden monster
   Token, NPC Token, object Token, and manual Token with deliberately distinct
   HP/AC/notes/conditions.
3. Verify browser network payloads and WebSocket envelopes, not only rendered
   UI: each role must receive only its projected DTO.
4. Verify owner inspection shows only the owner's exact data; ally/enemy
   inspection follows configured party/public policy; spectators never gain
   owner data.
5. Verify a hidden Token and host-only monster details are absent from player
   HTTP responses and socket messages, including after refresh/reconnect.
6. Verify host reveal/hide and a simulated investigation reveal survive replay
   without sending an unrevealed value to another viewer.
7. Verify the context menu hides mutation actions for non-hosts, and direct HTTP
   attempts remain rejected server-side.

## Verification

Run the Room permission, Token ownership, clearance-details, lifecycle, combat
controls, TypeScript, build, and secret-leak checks listed in the task before
committing this documentation slice.
