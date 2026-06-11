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
- Coverage doc: `DND_RULE_COVERAGE.md`

## COC

- Main gameplay page: `src/pages/CocGameplay.tsx`
- Gameplay panels: `src/pages/cocGameplay/*`
- Store: `src/store/cocStore.ts`
- SAN panel: `src/pages/cocGameplay/CocSanCheckPanel.tsx`
- SAN local utils: `src/pages/cocGameplay/cocSanUtils.ts`
- Shared gameplay helpers: `src/pages/cocGameplay/CocGameplayShared.tsx`
- Coverage / current status docs: `COC_RULE_COVERAGE.md`, `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`

## CP RED

- Market: `src/pages/CpMarket.tsx`
- Sheet: `src/pages/CpSheet.tsx`
- Gameplay: `src/pages/CpGameplay.tsx`
- Gameplay panels: `src/pages/cpGameplay/*`
- Store: `src/store/cpStore.ts`
- Types: `src/lib/cp-types.ts`
- Migration: `src/lib/cpMigration.ts`
- Utils: `src/lib/cp2024/cp-utils.ts`
- Coverage doc: `CPRED_RULE_COVERAGE.md`

## Docs

- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `PLATFORM_ARCHITECTURE.md`
- `CPRED_RULE_COVERAGE.md`
- `COC_RULE_COVERAGE.md`
- `DND_RULE_COVERAGE.md`
- `GAMEPLAY_UI_CONTRACT.md`
- `RUNTIME_LOG_ARCHITECTURE.md`
- `SYSTEM_PAGE_RESPONSIBILITY.md`
- `IMPLEMENTATION_ROADMAP.md`

## Reading Strategy

1. Read `PROJECT_INDEX.md` first.
2. Then read the relevant coverage / status document for the current system.
3. Read only allowed files and relevant files named by the task.
4. Prefer `rg` / targeted search over full-project file reads.
5. When reading extra files, report the reason.
