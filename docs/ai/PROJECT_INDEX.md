# Project Index

## Purpose

This file helps AI / Codex / Sonnet quickly locate project structure and task boundaries without scanning the full repository every round. Read it first when a task needs file discovery, then narrow the search to relevant system files.

## Root Structure

- `src/pages/` — top-level app pages for DND, COC, CP RED creators, sheets, gameplay, and market.
- `src/pages/gameplay/` — DND Gameplay panel components.
- `src/pages/cpGameplay/` — Cyberpunk RED Gameplay panel components.
- `src/pages/cocGameplay/` — COC Gameplay panel components.
- `src/store/` — Zustand stores for shared app state and per-system character state.
- `src/lib/` — shared and system-specific types, migrations, and rule helpers.
- `src/data/` — system data tables such as DND 2024 class progression.

## Shared Runtime Concepts

- Sheet = character display / role information / downtime maintenance.
- Gameplay = checks, rolls, resource changes, and runtime operation.
- `RuntimeLogEntry[]` + RollConsole = the result center for gameplay events.
- Do not move gameplay rolls back into Sheet pages.

## DND

- Main gameplay page: `src/pages/Gameplay.tsx`
- Gameplay panels: `src/pages/gameplay/*`
- Store: `src/store/characterStore.ts`
- DND types: `src/lib/dnd-types.ts`
- 2024 progression data: `src/data/dnd2024/classProgression.ts`
- Progression utils: `src/lib/dnd2024/progression-utils.ts`
- Resource utils: `src/lib/dnd2024/resource-utils.ts`
- Spell preparation model: `src/lib/dnd2024/spell-preparation-model.ts`
- Coverage doc: `docs/rules/DND_RULE_COVERAGE.md`

## COC

- Main gameplay page: `src/pages/CocGameplay.tsx`
- Gameplay panels: `src/pages/cocGameplay/*`
- Store: `src/store/cocStore.ts`
- SAN panel: `src/pages/cocGameplay/CocSanCheckPanel.tsx`
- SAN local utils: `src/pages/cocGameplay/cocSanUtils.ts`
- Shared gameplay helpers: `src/pages/cocGameplay/CocGameplayShared.tsx`
- Coverage / current status docs: `docs/rules/COC_RULE_COVERAGE.md`, `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`

## CP RED

- Market: `src/pages/CpMarket.tsx`
- Sheet: `src/pages/CpSheet.tsx`
- Gameplay: `src/pages/CpGameplay.tsx`
- Gameplay panels: `src/pages/cpGameplay/*`
- Store: `src/store/cpStore.ts`
- Types: `src/lib/cp-types.ts`
- Migration: `src/lib/cpMigration.ts`
- Utils: `src/lib/cp2024/cp-utils.ts`
- Coverage doc: `docs/rules/CPRED_RULE_COVERAGE.md`

## Docs

- `AI_WORKFLOW.md` — AI workflow and documentation governance owner.
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md` — current task scope card; overwritten per task.
- `docs/ai/TASK_ARCHIVE.md` — compressed one-line task history.
- `docs/archive/README.md` — archive read policy and firewall.
- `PLATFORM_ARCHITECTURE.md`
- `docs/rules/CPRED_RULE_COVERAGE.md`
- `docs/rules/COC_RULE_COVERAGE.md`
- `docs/rules/DND_RULE_COVERAGE.md`
- Gameplay UI contract, page responsibility, and RuntimeLogEntry architecture facts are consolidated into `PLATFORM_ARCHITECTURE.md`.
- Implementation discipline is owned by `AI_WORKFLOW.md`.
- Historical versions of replaced architecture docs are archived under `docs/archive/2026-06-11-*`.
- Do not read `docs/archive/` unless it is explicitly listed in `docs/ai/ACTIVE_TASK.md`.

AI workflow note:

- Do not create `CODE_LANDMARKS.md`.
- Code landmarks live only in source comments and can be listed with `rg -n "AI-LANDMARK"` when needed.
- AI should not read `docs/archive/` unless it is explicitly listed in `docs/ai/ACTIVE_TASK.md`.

## Reading Strategy

1. Read `docs/ai/PROJECT_INDEX.md` first.
2. Then read the relevant coverage / status document for the current system.
3. Read only allowed files and relevant files named by the task.
4. Prefer `rg` / targeted search over full-project file reads.
5. When reading extra files, report the reason.
