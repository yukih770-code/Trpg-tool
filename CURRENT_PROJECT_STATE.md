# TRPG Tool — Current Project State

Version: 1.0
Date: 2026-06-09
Status: Active baseline — read this before planning or implementing anything in this project.

---

## 1. Purpose

This is the current factual snapshot of the TRPG tool project (`D:\Download\dnd`).

**All AI tools must read this file before planning or implementing any task in this project.**

Do not rely on older chat context, architecture reviews from previous sessions, or inferred state from documentation that predates this file. If this file contradicts an older report, trust this file and verify against current source files before proceeding.

If this file is unavailable, report:
`CURRENT_PROJECT_STATE.md unavailable. State may be incomplete. Do not proceed without manual verification.`

---

## 2. Last Verified Status

Sources used to produce this snapshot:

- `PROJECT_STATUS.md` (last updated 2026-05-30)
- `IMPLEMENTATION_ROADMAP.md` (last updated 2026-05-31)
- Sonnet audits completed through v0.3 session (2026-06-09)
- Cross-AI Context Unification session (2026-06-09)

**Git status must be manually verified before implementation.**

The PROJECT_STATUS.md records build status as: `npx tsc --noEmit` ✅, `npm run build` ✅, Git committed ✅ — but this reflects the state at last commit. Verify the working tree is clean before starting any new phase.

---

## 3. DND Current State

DND 5e / 2024 is the **reference implementation** for Player Gameplay, RollConsole, and `RuntimeLogEntry[]`.

Completed:
- schemaVersion + migrateDndCharacter ✅
- 2024 progression foundation (XP / proficiency / ASI) ✅
- classResources container ✅
- pactMagicState container ✅
- DND Gameplay Interaction v0 ✅
- Action Registry v0 ✅
- DND Structured LogEntry v1 — local `combatLog` uses `RuntimeLogEntry[]` ✅

**DND is temporarily frozen.** Do not continue unless there is an explicit maintenance or docs task.

Do not:
- Continue Action Registry expansion
- Implement attack / damage / target model
- Refactor spellSlot into Action Registry
- Implement combat automation
- Implement full spell slot tracking

DND serves as the pattern reference for how COC and CP RED should implement their own RollConsole and RuntimeLogEntry layers.

---

## 4. COC Current State

COC is the **most advanced system** in the current build. All planned phases through Phase 6 are complete.

Completed:
- schemaVersion + migrateCocCharacter ✅
- coc-utils pure functions (HP / MP / SAN / d100 check) ✅
- COC Runtime Foundation v2 ✅
- COC Creator Skill Point Constraint v1 ✅
- COC Sheet Responsibility Cleanup v1 ✅
- COC Runtime State UI Panel v1 ✅
- COC Gameplay RollConsole RuntimeLogEntry v1 ✅
- COC Skill Check Wiring v1 ✅

COC currently has:
- Runtime State panel displaying HP, MP, SAN, Luck (runtime-first with legacy fallback)
- Local `RuntimeLogEntry[]` in CocGameplay
- `CocRollConsolePanel` with Latest Result and structured history
- Public skill checks via `evaluateCocD100Check`
- SAN quick roll using runtime-first SAN current value
- No store / schema / migration changes in Phases 5 or 6

**Not yet implemented in COC:**
- SAN Check workflow (loss expressions, insanity risk prompt)
- Luck spending
- Pushed Roll UI and workflow
- Growth resolution (skill improvement)
- Keeper Console
- `gmOnly` / `revealed` visibility filtering
- Full insanity automation
- Combat / Chase mechanics

Do not implement any of the above until explicitly scheduled as a named phase.

---

## 5. Cyberpunk RED Current State

CP RED has received its foundational governance work. Two phases are complete; Phase 7 is next.

Completed:
- schemaVersion + migrateCpCharacter ✅
- cp-utils pure functions (HP / SW / DB / Humanity / exploding-d10 / skill-check) ✅
- CP RED Creator / Sheet Responsibility Audit (Phase 1) ✅
- CP RED Sheet Responsibility Cleanup v1 (Phase 2) ✅
- CP RED Runtime State Foundation v2 (Phase 3) ✅

CP RED Runtime Foundation v2 scope:
- Adds optional `runtime` state for HP, Humanity, runtime EMP, armor SP shell, wound flags, and critical injury tracking
- Migrates old CP RED characters to schemaVersion 2 idempotently
- Adds runtime store actions for initialization, refresh, HP/Humanity deltas, runtime flags, and critical injury tracking

**Not yet implemented in CP RED:**
- CP RED Gameplay RollConsole RuntimeLogEntry v1 ← **NEXT PHASE**
- CP RED Skill Check Wiring v1
- Armor ablation automation
- Ammo tracking
- Critical injury automation
- Full damage pipeline
- No-DV path / Netrunning
- GM Console / AI Host integration

Do not implement armor / ammo / damage / netrunning / combat in Phase 7. Phase 7 scope is RollConsole + RuntimeLogEntry only.

**Current recommended next implementation phase:**
`CP RED Gameplay RollConsole RuntimeLogEntry v1` (IMPLEMENTATION_ROADMAP.md Phase 7)

---

## 6. Cross-System Architecture State

These architectural decisions are established and must not be reversed without an explicit architecture review:

| Layer | Responsibility |
|---|---|
| Creator | Creation-time character choices only |
| Sheet | Display and downtime maintenance only; no rolls, no runtime changes |
| Player Gameplay | Runtime operations, checks, resource adjustments |
| RollConsole | Single result center for all roll outputs |
| RuntimeLogEntry | Structured result envelope for all log entries |
| Host Console | Future separate surface — not implemented |
| AI Host | Future ProposedCommand pipeline — not implemented |
| visibility field | `public` / `gmOnly` / `playerOnly` / `revealed` — declared but not filtered |
| Hidden roll | A visibility concept, not a dice type |

These principles apply to all three systems. COC and CP RED must follow the DND pattern for RuntimeLogEntry and RollConsole.

---

## 7. Known Deferred Issues

The following issues are known and intentionally not addressed in the current phases:

- **Free Dice Tray** still exists in Player Gameplay in some systems. Future cleanup to move it to Host / Keeper ownership when that surface is built.
- **TEST_CHECKLIST.md** may contain stale sheet quick-roll lines from before Sheet Responsibility Cleanup phases.
- **COC_RULE_COVERAGE.md** and **IMPLEMENTATION_ROADMAP.md** may contain stale summary sections that predate completed phases (the roadmap describes Phases 1–6 as future work, but they are now done).
- **DND_RULE_COVERAGE.md** — confirm whether this exists; if missing, track in PROJECT_STATUS.md.
- **CP RED Gameplay** still uses old log / lastRoll pattern until Phase 7 is complete.
- `computeEmpFromHumanity` in `cpStore.ts` uses delta-based EMP (by design); differs from `getCpRuntimeEmp` absolute calculation.

---

## 8. Current Recommended Next Step

1. **Verify git status manually.** Confirm the working tree is clean before starting Phase 7.
2. If clean, proceed to **`CP RED Gameplay RollConsole RuntimeLogEntry v1`** (Phase 7).
3. Phase 7 allowed files: `CpGameplay.tsx` / CP RED gameplay subcomponents only.
4. Phase 7 forbidden: store, schema, migration, CP RED combat/armor/ammo, COC files, DND files.
5. After implementation, run:
   - `npx tsc --noEmit`
   - `npm run build`
6. Then run **Sonnet audit** before commit.
7. Commit only after Sonnet audit passes and both checks are green.

---

## 9. Do Not Do Yet

Do not implement any of the following without an explicit scheduled phase:

- AI Host, ProposedCommand runtime, AI API calls
- Multiplayer / permissions / sync
- Host Console / Keeper Console
- Full combat automation in any system
- CP RED armor ablation, ammo tracking, full damage pipeline, netrunning
- COC Luck spending, SAN Check workflow, Pushed Roll UI, Growth resolution
- Visibility filtering / `gmOnly` / `revealed` workflow
- DND attack / damage / target model / spell slot Action Registry refactor
- Any change that modifies store schema or migrations alongside UI changes

---

## 10. Required AI Behavior

All AI tools processing this project must:

1. **Read this file first** and state that it was read.
2. **State if git status was unavailable** — do not assume the tree is clean.
3. **Not contradict this file** unless presenting concrete evidence from current source files.
4. **Treat older architecture reviews as potentially stale** unless confirmed against current code.
5. **Prefer current code + this file** over session memory or previously generated reports.
6. **Not start Phase 7 or any implementation** until git status is confirmed clean.
7. **Not mix systems** in a single implementation round.
8. **State explicitly** what files were read when reporting findings.

---

*TRPG Tool CURRENT_PROJECT_STATE.md v1.0 — 2026-06-09*
