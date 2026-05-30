# Runtime Log Architecture

Last updated: 2026-05-30  
Status: **Architecture Principle Document — No Code Implementation This Round**

---

## 1. Purpose / 目的

This document defines the cross-system runtime result and log architecture for this TTRPG character manager. It serves as a shared design contract for:

- **DND 5e / 2024** — Gameplay checks, action registry, spell casting, resource changes
- **Call of Cthulhu (COC)** — Skill checks, sanity rolls, push rolls, success levels
- **Cyberpunk RED** — Exploding d10 skill checks, stat checks, DV resolution
- **Future Host Console** — DM / KP / GM tools: hidden rolls, NPC actions, random tables
- **Future multiplayer sync** — Results visible to multiple players with permission control
- **Future result visibility / hidden roll / reveal** — gmOnly, playerOnly, revealed model

**Scope of this document:**  
Architecture principles and recommended shapes only.  
**No code is implemented in this round.** No store changes, no schema changes, no migration, no new types in `src/`.

---

## 2. Current State / 当前状态

### DND

- `Gameplay.tsx` uses a `RollConsole` component as the single result center.
- `latestResult` is local React UI state (`useState`) — not persisted to store or schema.
- `combatLog` is a local `string[]` — appended on each roll, trimmed to a recent window.
- `ChecksPanel` does not display the latest result (result lives only in RollConsole).
- `ActionsPanel` sends toast notifications on action use; does not display an independent result area.
- `GAMEPLAY_UI_CONTRACT.md` defines the Player Gameplay / Host Console boundary and the visibility principle.

### COC

- `CocGameplay.tsx` uses a local `string[]` `combatLog` and a local `lastRoll` UI state.
- Success level display uses `evaluateCocD100Check` from `coc-utils.ts`.
- No structured log entry. Results are formatted as plain strings.

### Cyberpunk RED

- `CpGameplay.tsx` uses a local `string[]` log and a local `RollDisplay` UI state.
- Exploding d10 results use `evaluateCpExplodingD10` / `evaluateCpSkillCheck` from `cp-utils.ts`.
- No structured log entry. Results are formatted as plain strings.

### Across all three systems

- No real Host Console exists.
- No real permission or visibility system exists.
- No multiplayer sync exists.
- The three systems have diverging log string formats with no shared envelope.

---

## 3. Core Concepts / 核心概念

### Result

A single output event from a check, action, roll, resource change, damage application, or system prompt.  
A Result has a **value**, a **kind**, a **context** (who did what), and a **visibility**.

### Log Entry

The recorded representation of a Result in the log. A Log Entry is what gets stored, displayed in the history scroll, and eventually filtered by visibility or exported.

### Latest Result

The most recently produced Result, displayed prominently as the primary read target for the player. Not plain log text. Contains the large display value, calculation details, check type, and special tags.

Per `GAMEPLAY_UI_CONTRACT.md`:  
> "Latest Result is not plain log text. Historical logs record events; Latest Result is the first thing players should read after an operation."

### History Log

The scrollable list of past Log Entries. Displayed below or alongside Latest Result. Currently a `string[]`; the target shape is `RuntimeLogEntry[]`.

### Visibility

Who is allowed to see a Result. Defined at the time the Result is produced. The four recommended levels are `public`, `gmOnly`, `playerOnly`, and `revealed`. See §4.

### Reveal

A host action that changes a Result's effective visibility from `gmOnly` to `revealed` (or from hidden to partially visible). The underlying Result data does not change; only what is shown changes.

### Player Gameplay

The per-character play console. Contains character state, actions, checks, and the player-visible Roll Console.  
Does not contain host tools, free-roll panels, or NPC controls.

### Host Console

The future DM / KP / GM console. Contains hidden roll controls, NPC / monster operations, random tables, reveal controls, free roll, scene / map tools, and the full session log including `gmOnly` entries.  
**Not implemented in the current phase.**

---

## 4. Visibility Model / 可见性模型

Per `GAMEPLAY_UI_CONTRACT.md` §9–§11, the recommended visibility types are:

| Value | Meaning |
|-------|---------|
| `public` | Visible to all players and the host. Default for player-initiated checks. |
| `gmOnly` | Visible only to the DM / KP / GM. Never shown in player Roll Console. |
| `playerOnly` | Visible only to the relevant player. Not visible to other players or host by default. |
| `revealed` | Originally `gmOnly`, later made visible by the host (in full, by outcome, or by narration only). |

### Key rules

- **Hidden rolls are not a separate dice type.** A hidden roll is a `gmOnly` result, produced by the same roll machinery as any other roll.
- **Player Roll Console** must show only: `public`, `revealed`, and `playerOnly` results that belong to the current player.
- **Host Console** (future) must show all: `public`, `gmOnly`, `playerOnly`, and `revealed`.
- **Free roll** (dice tray, random tables) should also carry a visibility. In the current phase, free roll in player Gameplay is omitted; when it appears in Host Console, it defaults to `gmOnly` unless the host chooses to reveal it.
- **Default visibility** for any player-initiated result is `public`.
- **Default visibility** for host-initiated results is `gmOnly` until the host reveals.

---

## 5. Reveal Mode / 公开模式

When a host reveals a `gmOnly` result, the reveal does not have to be complete. The recommended reveal modes are:

| Value | What the players see |
|-------|---------------------|
| `showFull` | Complete result: value, calculation, success level, dice details. |
| `showOutcome` | Success or failure only (or COC success level label). No dice values or numbers. |
| `showNarration` | A narration string composed by the host. No numbers, no outcome label. |
| `hidden` | Nothing. The result remains invisible to players. |

### Examples

| System | Scenario | Reveal mode |
|--------|----------|-------------|
| DND | Monster Perception vs. player Stealth | `showOutcome`: "你们的脚步声没有惊动它" |
| DND | Hidden trap detection | `showNarration`: "你没有发现任何异常" |
| COC | Psychology check on NPC | `showNarration`: "你觉得他说话有些紧张" |
| COC | Hidden clue awareness | `showOutcome`: "你注意到了某些东西" |
| CP RED | Netrunner counter-intrusion | `showNarration`: "系统出现了一阵异常响应" |
| CP RED | Hidden NPC Perception check | `showFull` (GM decides) |

The `revealMode` field lives on the Log Entry and can be updated by the host at reveal time without modifying the underlying Result data.

---

## 6. Recommended LogEntry Shape / 推荐日志结构

The following is the **recommended future shape** for a structured log entry shared across all three systems. **This is not implemented in the current round.** No types are added to `src/`.

```ts
// Future target — NOT implemented this round.

type RuntimeLogVisibility =
  | "public"
  | "gmOnly"
  | "playerOnly"
  | "revealed";

type RuntimeLogRevealMode =
  | "showFull"
  | "showOutcome"
  | "showNarration"
  | "hidden";

type RuntimeLogKind =
  | "check"       // Skill check, ability check, saving throw
  | "roll"        // Free dice roll
  | "action"      // Class feature / action registry use
  | "damage"      // Damage roll result
  | "resource"    // Resource gain / spend (HP, classResource, SAN, etc.)
  | "system"      // System prompt, initialization, level-up
  | "narration";  // Host-authored narration line

type RuntimeLogEntry = {
  id: string;                          // UUID
  timestamp: number;                   // Date.now()
  system: "dnd" | "coc" | "cpred";    // Which system produced this entry

  kind: RuntimeLogKind;

  // Display fields
  title: string;                       // Short label: "技能检定：宗教 / Religion"
  summary: string;                     // One-line human-readable: "掷出 17，等待 DM 判定"
  detail?: string;                     // Calculation detail: "d20=15 + 修正=+2"

  // Value fields
  displayValue?: number | string;      // The large number or label to show: 17, "成功", "大失败"
  calculation?: string;                // Formula string: "d20=15 + 修正=+2 = 17"
  outcome?: string;                    // Success level or result label if determinable

  // Visibility
  visibility: RuntimeLogVisibility;    // Default: "public"
  revealMode?: RuntimeLogRevealMode;   // Only meaningful for gmOnly / revealed entries

  // Actor context
  actorId?: string;                    // Character ID of the actor
  actorName?: string;                  // Display name
  ownerCharacterId?: string;           // Who "owns" this log entry (for playerOnly filtering)
  targetId?: string;                   // Target character / NPC ID (future)
  targetName?: string;                 // Target display name

  // Taxonomy
  tags?: string[];                     // ["nat20", "saving-throw", "dexterity"], etc.

  // System-specific data
  payload?: unknown;                   // Typed payload per system (see §7)
};
```

### Envelope / Payload principle

The fields above `payload` form a **cross-system envelope** — every system should produce log entries that conform to this shared shape.

The `payload` field carries **system-specific data** (see §7). It enables type-narrowing per system without polluting the shared envelope.

The `outcome` field should be populated only when the result can be determined from rules alone (COC success level, DV comparison, DC comparison). When no target exists, `outcome` should be `undefined` and the UI should show "等待 DM/KP/GM 判定".

---

## 7. System-specific Payload Direction / 系统 payload 方向

These are the **intended payload shapes** per system. Not implemented this round.

### DND

```ts
type DndCheckPayload = {
  checkType: "abilityCheck" | "savingThrow" | "skillCheck" | "initiative" | "attackRoll";
  ability?: string;     // "Dex", "Wis", etc.
  skill?: string;       // "察觉", "隐匿", etc.
  d20: number;
  modifier: number;
  total: number;
  dc?: number;
  nat20: boolean;
  nat1: boolean;
  proficient?: boolean;
};
```

### COC

```ts
type CocCheckPayload = {
  checkType: "skillCheck" | "sanityCheck" | "luckRoll" | "opposedRoll";
  skillName?: string;
  skillValue: number;
  d100: number;
  successLevel: "critical" | "extreme" | "hard" | "regular" | "failure" | "fumble";
  isPushed?: boolean;
  sanLoss?: number;
  luckSpent?: number;
};
```

### Cyberpunk RED

```ts
type CpredCheckPayload = {
  checkType: "skillCheck" | "statCheck" | "facedownRoll";
  stat?: string;        // "REF", "COOL", etc.
  skill?: string;       // "Handgun", "Stealth", etc.
  statValue?: number;
  skillLevel?: number;
  natural: number;
  extra?: number;
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
  total: number;
  dv?: number;
  modifiers?: number;
  // damage, armor, ammo: deferred to later rounds
};
```

---

## 8. Success Judgment Rules / 成功判定规则

Per `GAMEPLAY_UI_CONTRACT.md` §3–§6, the rules for determining and displaying success are:

### DND

- When **no DC / AC / target** is present: display the total, display the calculation, show `未设置 DC，等待 DM 判定`. Do not show success or failure.
- When a **DC is set**: `total >= DC` → success; `total < DC` → failure.
- **NAT 20 / NAT 1**: display the tag only. Do not automatically interpret as universal success or failure. Attack rolls, saving throws, and ability checks may use this tag differently in future modules.
- The `outcome` field should be `undefined` when no DC exists.

### COC

- Most skill checks can determine success level from the skill value alone, using the COC rule thresholds defined in `coc-utils.ts`.
- `evaluateCocD100Check(target, roll)` returns a `successLevel` that maps to the display label.
- The `outcome` field should always be populated for standard COC skill checks.
- Push rolls, luck spending, and opposed rolls require additional handling in future rounds.

### Cyberpunk RED

- When **no DV** is present: display the total, display the calculation, show `未设置 DV，等待 GM 判定`. Do not show success or failure.
- When a **DV is set**: `total >= DV` → success; `total < DV` → failure.
- **Exploding dice**: the full dice chain (`d10=[10] + 爆炸=[6]`) must always be displayed, regardless of whether a DV exists.
- `evaluateCpSkillCheck` returns `success?: boolean` only when `dv` is provided; the UI should respect this.

---

## 9. Player Gameplay vs Host Console Boundary / 玩家与主持人边界

Per `GAMEPLAY_UI_CONTRACT.md` §7 and §11:

### Player Gameplay is responsible for

- Character state (HP, resources, SAN, etc.)
- Character actions (Action Registry, spell casting, resource use)
- Character checks (ability, skill, saving throw, initiative)
- Player-visible Roll Console:
  - Latest Result
  - History Log
  - System prompts relevant to the player
- Results with visibility: `public`, `revealed`, self-owned `playerOnly`

### Player Gameplay must NOT contain

- Host-tool entry points (no "DM Tools" button)
- Free roll panel (belongs to Host Console)
- Hidden roll controls
- NPC / monster operations
- Random table UI
- Reveal controls
- Scene / map tools

### Host Console (future) is responsible for

- All `gmOnly` results
- Reveal controls (showFull / showOutcome / showNarration / hidden)
- Free roll, hidden roll
- NPC / monster character sheets and actions
- Random tables
- Module events
- Session master log (all entries, all visibility levels)
- Scene and map tools

**Current phase: Host Console does not exist. Do not stub it into player Gameplay.**

---

## 10. Current string[] Log Policy / 当前日志策略

The current `string[]` log model in all three systems (`combatLog` in DND / COC / CP RED) is **acceptable for the current local single-player phase**. It is not the long-term model.

The `string[]` should be migrated to `RuntimeLogEntry[]` when **any** of the following conditions is met:

1. Multiplayer support is introduced.
2. A real Host Console is implemented.
3. `gmOnly` or `reveal` visibility is needed in the UI.
4. COC or Cyberpunk RED adopts the unified log envelope.
5. Filtering by kind, actor, or timestamp becomes a product requirement.
6. The latest result needs to be reconstructed from log history (not just held in UI state).

Until then: keep `string[]` as local UI state. Do not persist it to store. Do not write it to `CharacterData` schema.

---

## 11. Migration / Store Policy / 迁移策略

### Current phase — do not change

- Do not modify `characterStore.ts`, `cocStore.ts`, or `cpStore.ts`.
- Do not change `CharacterData`, `CocCharacter`, or `CpCharacter` schema.
- Do not migrate `combatLog` or `lastRoll` / `latestResult`.
- Do not add log persistence to Zustand persist middleware.
- Do not add a `runtimeLog` field to any schema.

### When structured logging is introduced

1. Start as local `useState<RuntimeLogEntry[]>` inside the Gameplay component — same as current `combatLog`.
2. Pass the log array and a producer function (`addLogEntry`) down as props or via a local context within the Gameplay subtree.
3. Only move to store once the model is stable and there is a clear reason (session persistence, multiplayer sync, host review).
4. Do not introduce server-authoritative logging until multiplayer architecture is designed.
5. Schema migration (`schemaVersion` bump + `migrate*Character`) must be planned before any log data enters the persisted character schema.

---

## 12. Risks / 风险

| Risk | Category | Mitigation |
|------|----------|-----------|
| Three systems implement incompatible log formats | Architecture drift | Define this document first; each system adopts the shared envelope before implementing |
| Host Console is stubbed into player Gameplay prematurely | Scope creep | Enforce the Player / Host boundary in `GAMEPLAY_UI_CONTRACT.md` and this document |
| Hidden roll is implemented as a new dice type | Concept error | Hidden roll is `gmOnly` visibility — always use the same roll machinery |
| Success / failure is faked when no target exists | Rule violation | `outcome` must be `undefined` when no DC / DV / target is set |
| `combatLog` stays as `string[]` indefinitely, making future migration expensive | Technical debt | Track the migration trigger conditions in §10; act when any condition is met |
| Structured `RuntimeLogEntry` is added to schema too early, causing complex migrations | Over-engineering | Start with `useState`, not store, not schema |
| Action Registry and spell casting create duplicate resource consumption paths | Double deduction | Enforce that all resource changes go through the same store actions |
| Latest Result display and History Log duplicate each other in state | State redundancy | `latestResult` is derived from the head of the log; it is not a separate state container |
| COC / CP RED log strings diverge too far from the envelope before migration | Migration cost | Document COC/CP payload shapes now (§7); align when migrating |
| `revealMode` is applied at log production time instead of reveal time | Semantic error | `revealMode` is set at reveal time, not at roll time; the log entry's core data never changes |

---

## 13. Recommended Roadmap / 推荐路线

```
Phase 0 (now)          Document freeze — RUNTIME_LOG_ARCHITECTURE.md
                       No code changes. Review and agree on envelope shape.

Phase 1                DND Structured LogEntry v1
                       Replace DND string[] combatLog with RuntimeLogEntry[]
                       Keep as local useState — no store, no schema
                       Only default visibility = "public"
                       Unify all DND result producers (checks, actions, dice tray, resource use)
                       Reference implementation for COC and CP RED to follow

Phase 2                COC runtime state v2
                       COC adopts RuntimeLogEntry[] with shared envelope
                       COC-specific CocCheckPayload in the payload field
                       coc-utils still produces the raw check result; log wrapping is separate

Phase 3                Cyberpunk RED runtime state v2
                       CP RED adopts RuntimeLogEntry[] with shared envelope
                       CpredCheckPayload in the payload field

Phase 4                Visibility integration
                       Add visibility field to all new log entries (default "public")
                       Player Roll Console filters on visibility
                       No actual permission system yet — filtering is local

Phase 5                Host Console v1
                       Dedicated DM/KP/GM console page
                       Receives all log entries including gmOnly
                       Reveal controls (showFull / showOutcome / showNarration / hidden)
                       Hidden roll, free roll, NPC actions

Phase 6 (future)       Multiplayer + server-authoritative log
                       Evaluate store vs server log
                       Design permission sync
                       Schema migration planning
```

---

## 14. Open Questions / 待确认问题

These questions are not answered in the current architecture but should be resolved before Phase 1 begins:

1. **Should `latestResult` be derived from `log[0]` or maintained as a separate pointer?**  
   Recommendation: derive from `log[0]` to avoid redundant state.

2. **Should the log be bounded (last N entries) or unbounded?**  
   Recommendation: bounded in `useState` (e.g. 40 entries); unbounded only if server-backed.

3. **Should `RuntimeLogEntry` ids be UUIDs or sequential integers?**  
   Recommendation: `Date.now() + Math.random()` pseudo-id is sufficient for local single-player; upgrade to UUID when multiplayer is needed.

4. **Should the Action Registry `useRegistryAction` produce a `"resource"` kind entry, or a `"action"` kind entry?**  
   Recommendation: `"action"` kind with a secondary `"resource"` entry for the consumed resource. Avoids double-logging.

5. **Should COC push rolls create a new log entry or amend the existing one?**  
   Recommendation: new entry with a `tags: ["pushed"]` link to the original entry id.
