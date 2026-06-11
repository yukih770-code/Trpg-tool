# Task Context Template

## Task Name

## Goal

## Phase

P0 / P1 / P2 / P3 / P4 / P5 / P6

## Must Read First

- `PROJECT_INDEX.md`
- `SYMBOL_MAP.md`
- `PROJECT_STATUS.md`
- relevant coverage doc

## Relevant Files

## Allowed Files

## Forbidden Files

## Do Not Do

## Reading Strategy

- Read index first.
- Read only relevant files.
- Prefer targeted search.
- Report extra files read and why.

## Task Lifecycle

- Use `docs/ai/ACTIVE_TASK.md` as the current task scope card.
- Overwrite it per task; do not accumulate old task prompts there.
- After completion, compress the result into `docs/ai/TASK_ARCHIVE.md`.
- Do not write fixed line numbers in markdown.
- Use symbols, landmarks, and `rg -n` locate commands.
- Do not create `CODE_LANDMARKS.md`.
- Code landmarks live only in source comments and are located by `rg -n "AI-LANDMARK"`.

## Documentation Governance

- Read `AI_WORKFLOW.md` for document owner rules when a task touches markdown.
- Use `docs/ai/ACTIVE_TASK.md` as the current task scope card.
- Overwrite `ACTIVE_TASK.md` at the start of each task.
- After completion, append one compressed line to `docs/ai/TASK_ARCHIVE.md`.
- Do not create new permanent `.md` files unless a new long-lived Source of Truth category is justified.
- Do not write fixed line numbers in markdown.
- Use symbol names, landmarks, and `rg -n` locate commands.
- Do not create `CODE_LANDMARKS.md`.

## Navigation Report

Each code task should report:

- changed files
- changed symbols
- added / updated landmarks
- recommended `rg -n` locate commands
- suggested `SYMBOL_MAP.md` updates

## Git Safety

- Do not use `git add .`.
- Do not use `git add -A`.
- Do not auto commit.
- Only human stages exact files after Sonnet audit.

## Verification Commands

```powershell
cd D:\Download\dnd
git status --short
npx tsc --noEmit
npm run build
```

## Report Format

1. Files changed
2. Files read
3. Extra files read and why
4. What changed
5. What did not change
6. Deferred items
7. git status
8. tsc result
9. build result
10. unexpected changes
