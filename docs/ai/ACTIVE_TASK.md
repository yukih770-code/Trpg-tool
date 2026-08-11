# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Mobile Runtime Action Dock Hierarchy v1
- Name: `MOBILE_RUNTIME_ACTION_DOCK_HIERARCHY_V1`
- Goal: Keep immediate Runtime actions visible on compact screens while moving
  low-frequency tools into an explicit More menu without losing any panel.
- Phase: P0 Runtime mobile usability
- Status: Done

## UI Contract

- Page responsibility: `runtime`
- Primary action: the current role's immediate in-play action (DND action
  palette when available, otherwise dice)
- Secondary direct actions: role-relevant scene, actor, or public information
- Hidden actions: state records, Keeper notes, settings, and caller-added
  utilities remain available through mobile More; desktop keeps the full row

## Allowed Files

- `src/components/platform/RuntimeActionDock.tsx`
- `src/lib/platform/runtimeActionDockSmoke.ts`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Runtime panel business logic, dice resolution, RuntimeLog payloads
- Room permissions, role resolution, server APIs, stores, schemas, migrations
- Map, combat, actor, campaign, workshop, or rule data behavior
- Desktop removal of any existing Runtime action

## Completion Criteria

- Compact screens show at most three role-prioritized actions plus More.
- Overflow actions remain discoverable and open their existing mounted panels.
- Desktop continues to expose the complete action row.
- Auxiliary Runtime panels close both the active dock panel and More menu.
- Role-action split smoke, TypeScript, frontend build, and diff check pass.

## Verification

```powershell
npm run frontend:verify:runtime-action-dock
npm run lint
npm run build
git diff --check
```

## Result

- Compact Runtime now exposes at most three role-prioritized direct actions and
  one More entry; caller-added utilities default into More.
- DND action palettes lead for players when present, while hosts and spectators
  retain role-appropriate direct actions.
- Every original panel remains mounted and desktop retains the complete row.
- Focused smoke, TypeScript, frontend build, and diff check pass.
