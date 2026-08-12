# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Mobile Runtime Map Tool Labels v1
- Name: `MOBILE_RUNTIME_MAP_TOOL_LABELS_V1`
- Goal: Make compact Runtime map tools discoverable on touch screens without
  relying on hover titles, especially the host standalone Token entry.
- Phase: P0 Runtime mobile usability
- Status: Done

## UI Contract

- Compact tool rail keeps icon and adds a short visible label.
- Host order is Select, Move, Measure, Background, Grid, Area, Token.
- Non-host viewers never receive host-only Background, Grid, or Token tools.
- Existing tool modes, callbacks, panels, permissions, and desktop workspace stay.
- Tool labels may be Chinese or English according to the active locale.

## Allowed Files

- `src/components/platform/BasicMapBoard.tsx`
- `src/lib/map/runtimeMapToolPresentation.ts`
- `src/lib/map/runtimeMapToolPresentationSmoke.ts`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Map tool callbacks, map event payload/authority, Token permissions
- Actor binding/Room roles, Runtime panel content, server/API
- Store, schema, migration, rule data, combat behavior, Campaign Runtime

## Completion Criteria

- Pure presentation model covers host/non-host order and localized short labels.
- Compact buttons render visible labels with their existing icons and aria labels.
- Host Token button clearly opens the existing standalone/linked Unit panel.
- Focused smoke, map/permission regressions, lint, build, and diff check pass.

## Verification

```powershell
npm run frontend:verify:runtime-map-tool-presentation
npm run frontend:verify:map-runtime
npm run frontend:verify:actor-presence
npm run frontend:verify:player-token-control
npm run lint
npm run build
git diff --check
```

## Result

- Compact Runtime map tools now combine existing icons with localized short
  labels, so touch users no longer depend on hover titles.
- Host order explicitly ends with Token; participant presentation omits host-only
  Background, Grid, and Token tools through a focused pure model.
- The rail scrolls within a bounded mobile height and compact panels clear its
  wider labeled footprint.
- Focused presentation, map replay, actor presence, Token ownership, TypeScript,
  frontend build, and diff checks pass.
