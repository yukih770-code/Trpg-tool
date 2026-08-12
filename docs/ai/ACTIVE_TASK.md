# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Mobile Runtime Map Tool Sheet v1
- Name: `MOBILE_RUNTIME_MAP_TOOL_SHEET_V1`
- Goal: Make compact map utilities true supporting sheets that prevent accidental
  tabletop interaction and provide tap-to-map dismissal.
- Phase: P0 Runtime mobile usability
- Status: Done

## UI Contract

- An open compact map utility places an interaction backdrop above the tabletop.
- Tapping the backdrop closes the panel and returns interaction to the map.
- The labeled tool rail remains available for direct map-panel replacement.
- Selecting a direct canvas tool closes the compact sheet and returns to the map.
- Desktop keeps its existing independent panel and map interaction behavior.

## Allowed Files

- `src/components/platform/BasicMapBoard.tsx`
- `src/lib/map/runtimeMapPanelCoordination.ts`
- `src/lib/map/runtimeMapPanelCoordinationSmoke.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Map tool callbacks, map events/authority, Token permissions
- Runtime overlay/action content, Room roles/permissions, server/API
- Store, schema, migration, rule data, combat behavior, Campaign Runtime

## Completion Criteria

- Open map-panel state mounts a compact-only tap-to-map interaction backdrop.
- Backdrop blocks map/HUD gestures while the labeled tool rail stays switchable.
- Desktop interaction is unaffected by the compact-only presentation layer.
- Focused smoke, map/overlay/action/permission regressions, lint, build, and diff pass.

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

- Compact Background, Grid, Area, and Token panels now block accidental tabletop
  gestures and support tapping the dimmed map to close.
- The labeled tool rail remains usable above the backdrop for direct replacement.
- Compact-only layering preserves desktop behavior and all map callbacks/authority.
