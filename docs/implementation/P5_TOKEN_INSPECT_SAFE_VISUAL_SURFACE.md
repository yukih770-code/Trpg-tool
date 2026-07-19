# P5 Token Inspect Safe Visual Surface

## Purpose

This slice adds a server-side runtime visibility boundary before the first
Token context menu and inspect surface. A client hiding a received field is not
a privacy boundary.

## Delivery Boundary

Authoritative Room Map and RuntimeLog records remain internal. Before a Room
member receives HTTP or WebSocket data, the server resolves that member and
projects a view:

| Viewer | Token and combat view |
| --- | --- |
| Active host | Full currently available room data |
| Active owner | Exact values for their bound character |
| Active player | Own exact values; other player-character combat values are shared by default; host-opened NPC/monster combat values are shared |
| Active spectator | Public observed values only |
| Pending or non-member | No runtime map/log read access |

`GET /rooms/:roomId/runtime-log` requires `combat.view`. Map reads require
`map.view`. HTTP history, Room snapshots, RuntimeLog deltas, and map deltas are
projected per member before delivery.

## Redaction Policy

`RuntimeHpDisplay` is `exact`, `stage`, or `unknown`; `RuntimeAcDisplay` is
`exact` or `unknown`. Player-character Tokens default to a party combat view:
exact HP, AC, and visible conditions for active players in the same Room.
Spectators retain observation-level access by default. Enemy/NPC defaults are an
injury stage with unknown AC. A host can set a visible Token's
`informationVisibility` to `public`, which shares its combat display without
sharing notes, raw ids, or a full stat block.
Host-only notes, raw ownership metadata, controller ids, source ids, and other
members' clearance detail do not enter a non-host Token view. Hidden Tokens and
templates are removed from non-host event histories before they reach a browser.

Projection replays full authoritative history first, then applies an
incremental cursor. This keeps hidden transitions and redacted combat snapshots
coherent after refresh.

## Inspect Surface

`BasicMapBoard` has a lightweight right-click menu and double-click inspect
shortcut. It selects the Token and provides safe inspect/locate actions. The
inspect card is a small, closable Runtime overlay rather than a persistent side
panel. Future mutation items are disabled and still
need the existing server guards when implemented. `RuntimeTokenInspectPanel`
reads only the projected Token/Combatant view passed by the Room Runtime bridge.

The panel shows identity, relation, visible HP/AC, visible conditions, known
information, and a non-functional investigation placeholder. It never fetches
raw Actor, clearance, or monster data.

## Boundaries

- No investigation reveal event model or checks.
- No attack, spell, AI, inventory, or monster import automation.
- No database schema, WebSocket protocol, or Room permission grant change.
- Token movement remains subject to `roomTokenControlGuard`.
- RuntimeLog and map persistence retain their current boundaries.

## Verification

`runtime:verify:runtime-visibility-projection` covers room-member eligibility,
snapshot redaction, hidden map Tokens, own exact HP, and enemy redaction.
`frontend:verify:token-inspect-safe-visual-surface` covers safe display labels
and projected map/combat replay compatibility.
