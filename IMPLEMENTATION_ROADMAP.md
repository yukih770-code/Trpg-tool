# Implementation Roadmap

Last updated: 2026-06-10

## 1. Purpose

This document defines the implementation path after the cross-system planning freeze. It exists to prevent scattered feature work, cross-system drift, and premature Host/AI/combat development.

It does not implement code. It defines the order, scope, forbidden areas, audit requirements, and exit criteria for future implementation rounds.

## 2. Freeze Status

- `COC_RULE_COVERAGE.md` has been created and reviewed.
- `CPRED_RULE_COVERAGE.md` has been created and reviewed.
- This file defines the next code phases after rule coverage materialization.
- Completing this roadmap does not mean all feature development resumes at once.
- Every implementation round must remain single-system, narrow, explicitly scoped, and auditable.

## 3. Global Implementation Rules

- Each implementation round may modify only one system's business code.
- Docs tasks may span multiple systems.
- Shared-types tasks must be explicitly allowed and scoped as shared-types-only.
- Each round must define explicit allowed and forbidden files.
- Store, schema, and migration changes must be separate rounds.
- Gameplay UI changes must not be mixed with rule-data changes.
- Host Console is not implemented in the current roadmap.
- AI Host / AI API / ProposedCommand runtime are not implemented in the current roadmap.
- Multiplayer is not implemented in the current roadmap.
- RollConsole remains the single result center.
- Sheet does not perform checks.
- Sheet does not perform runtime state changes.
- Player Gameplay must not contain Host Tools.

## 4. Current System Status Summary

### DND

- DND is the reference implementation for Player Gameplay, RollConsole, and `RuntimeLogEntry[]`.
- DND runtime resources, class resources, pact magic state, checks, optional DC, and structured local logs are in place.
- DND Gameplay is componentized under `src/pages/gameplay/`.
- Do not continue Action Registry expansion now.
- Do not implement attack / damage / target model now.
- Do not refactor spellSlot into Action Registry now.
- DND is temporarily frozen except for docs/audits or explicit maintenance.

### COC

- Runtime Foundation v2 is complete.
- Creator Skill Point Constraint v1 is complete.
- Sheet Responsibility Cleanup v1 is complete.
- CocGameplay runtime state panel, RollConsole, RuntimeLogEntry history, public skill checks, and componentization are complete.
- Do not implement full insanity automation, Keeper Console, combat/chase, or hidden-result filtering now.

### Cyberpunk RED

- CP RED has basic pages, store, types, and utilities.
- CP RED Creator / Sheet audit, Sheet cleanup, Runtime Foundation, RollConsole, Skill Check Wiring, and Gameplay componentization are complete.
- Do not jump directly into combat, armor ablation, ammo automation, netrunning, or vehicles.

### AI / Host

- AI Host architecture is documented.
- Do not implement AI API.
- Do not implement Host Console.
- Do not implement ProposedCommand runtime.

### Roadmap Execution Update

- The original first code phases have been executed through COC / CP RED Player Gameplay RuntimeLogEntry and componentization work.
- This roadmap still defines scope discipline and deferred work, but the next implementation prompt should be chosen from current audit findings, not from the original "First Code Phase Recommendation" alone.
- Any next code round must remain single-system and narrowly scoped.
- Do not implement permissions, multiplayer, or AI memory.

## 5. Recommended Phase Order

### Phase 1: CP RED Creator / Sheet Responsibility Audit

Goal: read-only audit of CpCreator / CpSheet / CpGameplay for responsibility drift.

Reason: CP RED has not yet received the Creator/Sheet responsibility cleanup that COC received.

Allowed: read-only inspection.

Forbidden: file modifications.

Audit: this phase is the audit.

Exit: report lists findings, severity, and recommended next CP RED cleanup scope.

### Phase 2: CP RED Sheet Responsibility Cleanup v1

Goal: remove CpSheet-side rolls and runtime HP/Humanity operations; make Sheet display plus downtime maintenance.

Allowed: `CpSheet` only.

Forbidden: `CpGameplay`, store, schema, migration, DND, COC.

Audit: requires Sonnet audit.

Exit: typecheck/build pass, report complete, Sonnet audit approved.

### Phase 3: CP RED Runtime State Foundation v2

Goal: establish CP RED runtime state and store actions.

Allowed: `cp-types`, `cp-utils`, `cpMigration`, `cpStore`.

Forbidden: UI, DND, COC.

Audit: requires Sonnet audit.

Exit: migration/idempotence verified, typecheck/build pass, Sonnet audit approved.

### Phase 4: COC Runtime State UI Panel v1

Goal: CocGameplay displays runtime HP/MP/SAN/Luck and flags, wired to `changeHp`, `changeMp`, `changeSan`, and `changeLuck`.

Allowed: `CocGameplay` or COC gameplay subcomponents.

Forbidden: store, schema, migration, CP RED, DND.

Audit: requires Sonnet audit.

Exit: runtime changes visible and bounded, typecheck/build pass, Sonnet audit approved.

### Phase 5: COC Gameplay RollConsole RuntimeLogEntry v1

Goal: CocGameplay adopts `RuntimeLogEntry[]` and a DND-style player RollConsole.

Allowed: `CocGameplay` / COC gameplay components.

Forbidden: store, schema, migration, CP RED, DND.

Audit: requires Sonnet audit.

Exit: one result center, Latest Result visible, history log structured, typecheck/build pass, Sonnet audit approved.

### Phase 6: COC Skill Check Wiring v1

Goal: wire d100 skill checks to `RuntimeLogEntry`.

Forbidden: SAN Check, Luck spending, Pushed Roll, Keeper Console, CP RED, DND.

Audit: requires Sonnet audit.

Exit: skill check results include d100, target, success level, and readable calculation.

### Phase 7: CP RED Gameplay RollConsole RuntimeLogEntry v1

Goal: CP RED Gameplay adopts `RuntimeLogEntry[]` and player RollConsole.

Forbidden: combat, damage, armor, ammo, netrunning.

Audit: requires Sonnet audit.

Exit: one result center, Latest Result visible, history log structured, typecheck/build pass, Sonnet audit approved.

### Phase 8: CP RED Skill Check Wiring v1

Goal: wire exploding d10 skill/stat checks with DV support and "waiting GM judgment" when DV is absent.

Forbidden: weapon attacks, damage, armor, ammo, netrunning.

Audit: requires Sonnet audit.

Exit: exploding d10 details and DV outcome render through RollConsole.

### Phase 9: COC SAN Check v1

Goal: wire SAN Check and SAN loss expressions, apply SAN loss, and prompt insanity risk.

Forbidden: full insanity automation, Keeper Console, hidden results, combat/chase.

Audit: requires Sonnet audit.

Exit: SAN success/failure loss works, risk prompts are explicit, no full madness tables.

### Phase 10: Ruleset Extension Architecture Doc

Goal: document architecture for extensions, homebrew, content packs, and ruleset profiles.

Allowed: docs only.

Forbidden: code.

Audit: docs audit recommended.

Exit: document defines extension boundaries without changing runtime code.

## 6. Deferred Work

- DND attack / damage / enemy target.
- DND spellSlot Action Registry refactor.
- COC full insanity automation.
- COC Keeper Console.
- COC hidden psychology / `gmOnly` filtering.
- CP RED armor ablation automation.
- CP RED ammo automation.
- CP RED full combat automation.
- CP RED netrunning.
- Host Console.
- AI API.
- ProposedCommand runtime.
- Multiplayer.
- Map / scene / module system.

## 7. Entry / Exit Criteria

Entry criteria for each code phase:

- Relevant coverage documents exist.
- Previous phase is committed.
- Working tree is clean, or only files for the current phase are modified.
- Prompt states explicit allowed and forbidden scopes.
- The phase does not modify multiple systems' business code.

Exit criteria for each code phase:

- `npx tsc --noEmit` passes.
- `npm run build` passes.
- Completion report is provided.
- Sonnet audit passes when required.
- Commit is completed after green checks and audit approval.

## 8. First Code Phase Recommendation

Recommended first resumed code phase:

### CP RED Creator / Sheet Responsibility Audit

Reasons:

- COC has already completed Creator / Sheet responsibility governance.
- CP RED has not yet received this layer of audit.
- A read-only audit is the lowest-risk way to resume after planning freeze.
- It determines the exact scope for later CP RED Sheet cleanup.

Do not immediately start:

- COC Gameplay.
- CP RED combat.
- AI Host.
- Host Console.

## 9. Alternative Path Considered

### Directly continue COC Gameplay

Not chosen because COC is already ahead of CP RED in Creator / Sheet / runtime governance. Continuing COC first would widen the cross-system gap.

### Directly do CP RED Runtime Foundation

Not chosen because CP RED Creator / Sheet responsibilities have not been audited. Runtime state could be built on the wrong page boundary.

### Directly do Ruleset Extension Architecture

Not chosen because it is important but does not block near-term code resumption. It can follow the CP RED responsibility audit.

### Directly do AI Host / Host Console

Not chosen because AI Host is only architectural right now, and the three systems are not yet aligned on RuntimeLogEntry and Player Gameplay responsibilities.

## 10. PROJECT_STATUS Update

`PROJECT_STATUS.md` should record:

- `IMPLEMENTATION_ROADMAP.md` added.
- Freeze planning phase now has a roadmap.
- Next recommended action: CP RED Creator / Sheet Responsibility Audit.
- No `src` changes.
