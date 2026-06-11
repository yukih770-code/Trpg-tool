# AI Workflow

## Purpose

This file is the single owner for AI collaboration workflow and documentation governance rules in this project. It defines how AI agents should read, write, summarize, archive, and navigate project documentation.

## Core Principles

- One fact has one owner document.
- Other documents may link to the owner, but must not duplicate the fact.
- Root docs contain current truth.
- AI working docs live under `docs/ai/`.
- One-off artifacts live under `docs/archive/`.
- Markdown must not store fixed line numbers.
- Use symbols, landmarks, and `rg -n` commands for navigation.
- Do not create `CODE_LANDMARKS.md`.

## Document Owner Table

| Fact Type | Owner |
|---|---|
| Current feature status | `PROJECT_STATUS.md` |
| Design decisions / permanent constraints | `PROJECT_STATUS.md` scope notes |
| Long-term roadmap / platform architecture | `PLATFORM_ARCHITECTURE.md` |
| AI workflow and documentation governance | `AI_WORKFLOW.md` |
| Test and acceptance criteria | `TEST_CHECKLIST.md` |
| Rule coverage level | `docs/rules/*_RULE_COVERAGE.md` |
| Symbol / function / panel location | `docs/ai/SYMBOL_MAP.md` |
| AI project structure map | `docs/ai/PROJECT_INDEX.md` |
| Current task scope card | `docs/ai/ACTIVE_TASK.md` |
| Task history index | `docs/ai/TASK_ARCHIVE.md` |
| One-off historical artifacts | `docs/archive/` |

## Documentation Classes

- A: Current Source of Truth.
- B: Ephemeral Current Task.
- C: Archived Historical Artifact.
- D: Delete Candidate.

Clarifications:

- `TASK_ARCHIVE.md` is A-class because it is a maintained long-term history index.
- `ACTIVE_TASK.md` is B-class and should be overwritten per task.
- `docs/archive/*` files are C-class and are not default reading material.

## Active Task Lifecycle

- Write / overwrite `docs/ai/ACTIVE_TASK.md` at the start of each task.
- Do not use it as a long prompt history.
- Include only task goal, allow / deny files, key symbols, relevant landmarks, locate commands, completion criteria, and verification.
- After completion, compress the result into one line in `docs/ai/TASK_ARCHIVE.md`.
- Then the next task may overwrite `ACTIVE_TASK.md`.

## Archive Policy

- Archive one-off audits, old prompts, replaced plans, and historical reports only when they have future trace value.
- If an artifact has no trace value, do not write it to disk.
- AI should not read `docs/archive/` unless explicitly listed in `docs/ai/ACTIVE_TASK.md`.

## Markdown Creation Rules

1. Default: do not create a new `.md`.
2. Put new facts into their owner document.
3. One-off artifacts go to `docs/archive/` only if they have trace value.
4. A new permanent `.md` requires a new long-lived Source of Truth category.
5. Markdown must not contain fixed line numbers.
6. Every P0-P6 phase closure should include a light documentation inventory check.

## Implementation Discipline

- Each code implementation round should target only one system's business code.
- Documentation-only tasks may span systems when explicitly scoped.
- Shared type tasks must be explicitly allowed as shared-types-only.
- Every task must define allowed files, forbidden files, and explicit non-goals.
- Store, schema, and migration changes should be isolated into their own narrowly reviewed rounds.
- Gameplay UI changes should not be mixed with rule-data or schema changes.
- Do not expand task scope to adjacent systems, visual polish, Host Console, AI Host, multiplayer, map, or full combat automation unless the prompt explicitly allows it.
- Code tasks should read `docs/ai/ACTIVE_TASK.md`, `docs/ai/PROJECT_INDEX.md`, `docs/ai/SYMBOL_MAP.md`, `PROJECT_STATUS.md`, and the relevant coverage document before editing.
- Use targeted search and symbol navigation; do not rely on stale chat context.
- Completion reports should list files read, files changed, extra files read and why, verification results, and unexpected changes.

## Git Safety

- Never use `git add .`.
- Never use `git add -A`.
- Stage exact files only.
- Do not auto commit.
