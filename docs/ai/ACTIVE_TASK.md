# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Room Runtime Server-Authoritative d20 Check v1 (T1)
- Name: `ROOM_RUNTIME_SERVER_AUTHORITATIVE_D20_CHECK_V1`
- Goal: Let a player at a real multiplayer table roll a d20 check as normal,
  advantage or disadvantage against an optional DC, with the server — not the
  client — deciding the dice faces, the kept die, the total and the DC outcome,
  and with the initiating player seeing that authoritative result immediately.
- Phase: Core D&D tabletop comfort (precedes the CharacterData → Runtime slice)
- Status: Implemented; awaiting local dependency-backed validation

## Layer Declaration

- IA: Existing Room Runtime only — the dock 投骰 panel, the D&D 动作 panel and the
  existing log drawer. No new page, route, modal, dock action or navigation entry.
- Object: `LogEvent` only. The existing `dice.roll` RuntimeLog event is extended
  additively. No new event kind, no `CatalogObject`, `OwnedObject`,
  `CampaignObject` or `RuntimeObject` is created or mutated.
- State: `Server State` (authoritative roll resolution + append), `UI State`
  (selected roll mode, DC input, last-result echo). No `Persistent Domain State`
  beyond the existing RuntimeLog append, no `Collaborative State` change.
- Authority: request carries INTENT ONLY (`expression`, `label`, `mode`, `dc`).
  Randomness stays in `node:crypto.randomInt` behind the existing shared,
  RNG-injected pure roller. Resolved fields sent by a client are ignored.
- Rules boundary: naturals are metadata; `outcome` is derived solely from
  `total >= dc`. No universal auto-success / auto-failure is encoded.
- Excluded: attack vs AC, critical damage, damage application, HP mutation,
  spell/resource mechanics, CharacterData-derived bonuses, host tooling
  relocation, the dual runtime-event write path (T7), AI, Workshop, routing,
  multi-instance authority.

## Page Responsibility And Action Hierarchy

- The Room Runtime dock keeps one 投骰 tool; the semantic controls live inside
  the existing panel rather than adding a competing action.
- The D&D 动作 panel remains a roll launcher. It now shows the authoritative
  result of the roll it just submitted; it still resolves nothing itself.
- The RuntimeLog drawer remains the shared, durable session history.
- Hidden actions: rolling locally, editing a resolved result, applying damage
  from a roll, and any auto-hit / auto-miss inference.

## Allowed Files

- `src/lib/platform/sharedDiceTypes.ts`
- `src/lib/platform/sharedDiceExpression.ts`
- `src/lib/platform/sharedDiceExpressionSmoke.ts` (new)
- `src/lib/platform/roomServerHttpClient.ts`
- `src/components/platform/SharedDiceDock.tsx`
- `src/components/platform/RuntimeDndActionPanel.tsx`
- `src/components/platform/RoomRuntimeEntryBridge.tsx`
- `src/components/platform/RoomRuntimeLogPreviewPanel.tsx`
- `server/protocol/room-protocol.ts`
- `server/services/rollSharedDice.ts`
- `server/room-server.ts` (dice route only)
- `server/services/liveRoomRuntimeLogPersistenceSmoke.ts`
- `server/api/verifyPrivateAlphaTwoAccountProtocol.ts`
- `package.json` (one new verify script)
- `CURRENT_PLATFORM_STAGE.md`, `TEST_CHECKLIST.md`, `docs/ai/ACTIVE_TASK.md`

## Forbidden Changes

- `src/lib/dnd/dndDiceRoller.ts` and its smoke (kept as the regression guard)
- A new `RoomRuntimeLogEventKind`, or widening either kind whitelist
- Expression-grammar syntax for advantage (no `kh1` / `adv` inside the string)
- Dependencies, registry configuration, unrelated `package-lock.json` churn
- PostgreSQL schema / migrations, repository storage semantics
- Character store, Campaign, Room lifecycle, permissions, map, combat state
- `output/`, `tools/`, `work/`

## Completion Criteria

- Advantage / disadvantage / DC apply only to a single-d20 expression; `2d6+3`,
  `2d20` and `1d12+4` are rejected as semantic checks and still roll normally.
- `total` stays authoritative and `total = sum(terms) + modifier` holds in every
  mode; the kept die is the ordinary term and the discarded face lives only in
  `rawRolls`.
- A request with no `mode`/`dc` produces the exact v0 payload; old `dice.roll`
  events keep rendering through every existing consumer.
- Natural 20 / natural 1 are recorded and never resolve a check by themselves.
- A `dice.roll` carrying the new fields survives persist → restore verbatim,
  proving the recovery whitelist needs no widening.
- Fabricated resolved fields in a request are ignored; the server recomputes.
- Host and player projections converge on the same authoritative result.
- The initiating player sees the result without opening the log drawer.
- Dedicated shared-dice smoke, persistence round-trip, two-account protocol,
  TypeScript, frontend build, server build, diff check and docs all pass in one
  isolated commit.
