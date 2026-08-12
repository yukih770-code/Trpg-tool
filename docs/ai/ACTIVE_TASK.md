# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Mobile Runtime Map Panel Coordination v1
- Name: `MOBILE_RUNTIME_MAP_PANEL_COORDINATION_V1`
- Goal: Include compact map utility panels in the existing one-surface-at-a-time
  Runtime overlay contract.
- Phase: P0 Runtime mobile usability
- Status: Done

## UI Contract

- Opening a compact map utility panel closes supporting sheets and the action dock.
- Opening a supporting sheet or any valid action-dock surface closes map utilities.
- Direct dock actions, More, More items, and programmatic opens share the contract.
- Escape closes compact map utility panels.
- Desktop keeps independent panels and existing map tool behavior.

## Allowed Files

- `src/components/platform/BasicMapBoard.tsx`
- `src/components/platform/RuntimeActionDock.tsx`
- `src/components/platform/RuntimeFullscreenShell.tsx`
- `src/lib/map/runtimeMapPanelCoordination.ts`
- `src/lib/map/runtimeMapPanelCoordinationSmoke.ts`
- `src/lib/platform/runtimeActionDockSmoke.ts`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Map tool callbacks, map events/authority, Token permissions
- Action panel content/behavior, Room roles/permissions, server/API
- Store, schema, migration, rule data, combat behavior, Campaign Runtime

## Completion Criteria

- Pure map-panel toggle policy covers open, replace, and close transitions.
- Accepted dock-open paths consistently notify competing compact surfaces.
- Map panel listens for auxiliary/dock opens and Escape; desktop is guarded.
- Focused smoke, overlay/action/map/permission regressions, lint, build, and diff
  check pass.

## Verification

```powershell
npm run frontend:verify:runtime-map-panel-coordination
npm run frontend:verify:runtime-action-dock
npm run frontend:verify:runtime-overlay-coordination
npm run frontend:verify:map-runtime
npm run lint
npm run build
git diff --check
```

## Result

- Compact Background, Grid, Area, and Token panels now close and are closed by
  the existing supporting-sheet and action-dock surface protocol.
- Direct valid actions, More, valid More items, programmatic opens, auxiliary
  sheets, map-panel replacements, and Escape follow explicit transition rules.
- Invalid action requests announce nothing, and compact guards preserve desktop
  panel independence and every existing map/action callback.
- Focused coordination, tool presentation, action-dock, overlay, map replay,
  Token ownership, TypeScript, frontend build, and diff checks pass.
