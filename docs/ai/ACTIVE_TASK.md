# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Embedded DND Builder AI Guidance v1
- Name: `EMBEDDED_DND_BUILDER_AI_GUIDANCE_V1`
- Goal: Replace the modal DND character AI interaction with an inline, context-aware Builder guidance surface while preserving deterministic validation, explicit preview/confirm, stale protection, audit, and one-step undo.
- Phase: Internal AI foundation / embedded character creation assistance
- Status: Complete

## Layer Declaration

- IA: Existing DND Character Builder only, directly below the Builder header; no new page, modal, global AI entry, Character Sheet entry, Campaign entry, or Runtime control.
- Object: Current user-owned Actor draft; available class/background/feat catalog names are bounded read-only option context.
- State: UI State for expansion/status/input/preview; Flow State for an uncommitted suggestion; the existing explicit Actor commit/undo path is the only Persistent Domain State write.
- Excluded: Actor Vault, Character Sheet, Character Audit restructuring, Campaign, Room, Runtime, catalog browsing, rule effects, backend/schema/repository behavior, Collaborative State.

## Page Responsibility And Action Hierarchy

- Builder remains responsible for step-by-step character creation/editing and its existing live summary.
- Builder remains not responsible for Actor library management, the full Character Sheet, Campaign selection, Runtime, rules browsing, or source-status management.
- Primary CTA remains the existing Builder next/finish path.
- `智能辅助` is a collapsed secondary creation-flow surface; generate/cancel, discard, explicit confirm, audit, and undo remain inside that surface.
- Hidden actions: automatic Actor mutation, background generation, direct completion, campaign/runtime reads, navigation shortcuts, catalog expansion, and rules adjudication.

## Allowed Files

- `src/components/dnd/DndCharacterAssistantPanel.tsx`
- `src/components/dnd/DndCharacterAssistantDialog.tsx` (removal only)
- `src/pages/Creator.tsx`
- focused smoke/package script only if required
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/*`, architecture index

## Forbidden Changes

- Character store behavior, schema, migration, save format, rules data, rule calculation, backend/repository/API contract, Campaign, Room, Runtime, map, combat, multiplayer, Workshop, or Character Sheet
- Any modal/chat surface or automatic/background Actor write
- `output/`, `tools/`, `work/`

## Completion Criteria

- DND Builder exposes one inline collapsible intelligent-guidance surface with route status, context-aware starting direction, generation/cancel, deterministic preview, discard, explicit confirm, stale protection, audit, and safe one-step undo.
- Collapsing or switching Actor aborts in-flight generation and clears Actor-specific preview state.
- No `fixed inset-0`, `role="dialog"`, `aria-modal`, close cross, or parallel navigation entry remains for this feature.
- Suggestion generation performs no Actor write; only the existing explicit confirm/undo store methods mutate the Actor.
- Focused assistant and DND creation regressions, policy checks, navigation/modal audit, TypeScript, server/frontend builds, diff check, docs, cleanup, and one isolated commit pass.
