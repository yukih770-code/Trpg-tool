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
