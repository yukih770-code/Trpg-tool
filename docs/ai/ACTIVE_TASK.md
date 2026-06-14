# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Multi-Actor Store Architecture Review v1
- Name: MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1
- Goal: Architecture review and documentation for future multi-actor vault. No `src/` implementation. Covers: Actor unified concept, actorInstanceId, ActorMeta, source/creator, campaign binding, two data model options (A vs B), migration strategy, UI impact, risk boundaries.
- Phase: P1 platform IA
- Status: Done

## Result Summary

- New file: `docs/architecture/MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW.md` (landmark: MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1)
- `PROJECT_STATUS.md`: row added
- `TEST_CHECKLIST.md`: §7a added
- `docs/ai/SYMBOL_MAP.md`: Multi-Actor Store Architecture Review section added
- `docs/ai/TASK_ARCHIVE.md`: entry appended
- `src/`: **not touched**

## Scope

### Allowed Files (modified)

- `docs/architecture/MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW.md` (new)
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/SYMBOL_MAP.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`

### Forbidden Changes (all confirmed untouched)

- `src/` (all files)
- store schema / migration
- save format
- CharacterData / Investigator / CP RED data structures
- import/export logic
- runtime / dice / rule logic
- React Router / URL routing
- git add / commit

## Navigation

### Landmark

```
AI-LANDMARK: MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1
```

Located in: `docs/architecture/MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW.md`

### Locate Commands

```powershell
rg -n "MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1" docs/
```

### Key Decisions

- Recommended data model: **Option A** (per-system arrays) for V1 multi-actor
- `actorInstanceId` uses existing `id` field on each character type (lazy migration if empty)
- `ActorMeta` = universal fields + `SystemActorSummary` discriminated union
- Migration: additive — single object wraps to `characters[0]`; lazy in Zustand `migrate` callback
- Campaign binding: reserved fields only; no Campaign store in V1 multi-actor
- Highest risks: localStorage migration · active-actor pointer call sites · runtime actor reference
