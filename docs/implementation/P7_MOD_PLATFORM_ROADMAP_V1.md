# Mod Platform Roadmap v1 (P7)

> Direction: players author their own content and rules, install them into a
> World Server / campaign, and play with them. Data + assets + scripted rules,
> file import first, Workshop second.

## 0. What already exists (surveyed, not assumed)

| Piece | State |
|---|---|
| `compendium_packs` / `compendium_pack_versions` / `compendium_entries` | Tables exist (migration 0009). `manifest_payload` JSONB is already the manifest slot. |
| `world_server_game_system_bindings.enabled_pack_version_ids` | **Column already exists** (migration 0007), `JSONB DEFAULT '[]'`. Documented as an opaque forward-compatible ref. Nothing reads or writes it. |
| `world_server_ruleset_versions` | Table exists with `ruleset_payload` / `compatibility_payload`. |
| `serverContentSet.ts` | Pure contract: select immutable pack versions, disable an entry, replace an entry with a private one, pin existing characters. No wiring. |
| `packageLibrary.ts` | Pure contract for how a user joined/imported/enabled a package. Header states: no subscription, backend, dependency resolution, or write behavior. |
| Personal / private compendium pack APIs | Create packs and publish versions. Working. |
| `personalCompendiumImport.ts` | `parsePersonalCompendiumImport(source: string)` — pasted JSON text. No file drop, no zip, no assets. |
| `personalContentReferences` on `CharacterData` | A character declares which packs it uses; `resolveOwnedPersonalContentReferences` shows the host a summary in the lobby. |
| Asset repository | `postgresAssetRepository`, migration 0004, `mediaAsset.ts` contract. |
| Workshop shell | `WorkshopShell` / `WorkshopItemDetail` / `FanPlazaShell` exist and honestly render an empty library. |

**The gap is the loader.** Nothing in a pack reaches gameplay. The builder reads
hardcoded `CLASS_DATA`, `races`, `spells`, `feats` from `src/data/`.

**Consequence: milestones M1–M4 need no migration.** The storage was designed
for this and left unwired.

## 1. Three constraints this architecture imposes

### 1.1 Replay must never execute a mod script

`replayCombatRuntimeEvents` and `mapRuntimeReplay` rebuild live state by
replaying the RuntimeLog. If a script ran *during* replay, any nondeterminism —
a clock read, an unseeded random, a changed pack version — would make two
clients diverge, and restart recovery would reconstruct a different session than
players saw.

**Rule: a script runs exactly once, server-side, at resolution time. Its outcome
is written into the event payload. Replay only ever applies recorded results.**

This keeps the entire existing replay and restart-recovery model intact, and it
means a pack can be updated or removed without rewriting history.

### 1.2 Authoritative scripts run only on the server

Dice, damage, conditions and resources are already server-authoritative (the d20
work, and T7's single write path). A client-run script would be a second write
authority — exactly what T7 removed. Client-side scripts are permitted only for
presentation (labels, layout, derived display values) and are never trusted.

### 1.3 Scripts may not manufacture rules outcomes

Two standing project rules survive intact: no invented D&D rules, and no
universal auto-success or auto-failure. A script may compute a modifier, a
formula, or a condition's effect. It may not declare a check succeeded, bypass
the dice authority, or write a RuntimeLog event directly.

## 2. Milestones

### M1 — Pack format + file import (no gameplay effect)
- `TrpgModManifest v1`: `modId`, semver `version`, `displayName`, `author`,
  `targetSystemId`, `schemaVersion`, `entries[]`, `assets[]`,
  `capabilities[]` (empty in M1), `scripts[]` (reserved; **rejected** in M1).
- Drag-and-drop `.json` → parse → validate → **preview before write**, reusing
  the existing import-envelope and safe-append patterns.
- Unknown or forbidden manifest fields are **refused, never silently ignored**.
- Writes to the existing pack/version/entry tables. No migration.

### M2 — The loader (the keystone)
- Read/write `enabled_pack_version_ids` on the game-system binding.
- `resolveContentCatalog(worldServer, system)` = bundled official data + enabled
  pack entries, honouring `serverContentSet`'s disable/replace semantics.
- **Refactor `src/data/*` into "the official pack"** so bundled and modded
  content travel one code path. This is the largest single refactor in the plan.
- The builder reads the resolved catalog instead of importing `CLASS_DATA`.
- Characters pin `ContentEntryRef`s, so an existing character never silently
  changes when a pack is updated — it keeps the version it was built against.

### M3 — Assets
- `.zip` pack bundles: manifest + entries + images.
- Content-addressed upload into the asset repository; strict type, dimension,
  count and total-size limits; images re-encoded, never served as uploaded.
- Entries reference assets by pack-local id; the loader maps them to asset ids.

### M4 — Modded content reaches the table
- Room/campaign actor projection resolves entry refs so a custom species,
  class or monster reaches play. Builds directly on T9/T10/T11a.
- The lobby already shows a character's pack dependencies; extend it to warn
  when a required pack is not enabled on that World Server.

### M5 — Scripted rules (the large one)
- **Not arbitrary JavaScript.** A deterministic, sandboxed evaluator with no
  network, DOM, store, filesystem, clock, or ambient randomness. Randomness is
  available only through the injected seeded RNG that already backs the dice.
- Declared capabilities in the manifest; the host approves them at install,
  reusing the character-clearance approval pattern.
- Hard budgets: instruction count, bounded loops, wall-clock timeout, output
  size. Exceeding a budget fails the script and is reported honestly — it never
  silently returns a partial result.
- Scripts are pure: `(inputs, seededRng) -> proposal`. The server validates the
  proposal against the same guards a host action passes today, then appends the
  event. A script never touches the RuntimeLog.

### M6 — Workshop
- Fill the empty shell: publish, browse, subscribe, install, update, rollback.
- Same loader, different source. Brings moderation, abuse handling and storage
  cost — which is why it comes last, not first.

## 3. Sequencing note

M1 and M2 are the whole difference between "a site with a content editor" and
"a moddable platform". M5 is where most of the risk and most of the calendar
time live. M1–M4 are worth shipping and playing on their own — and they are what
make M5 safe to attempt, because by then the pack format, the install scope and
the approval flow already exist.
