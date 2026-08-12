# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Mobile Runtime Overlay Exclusivity v1
- Name: `MOBILE_RUNTIME_OVERLAY_EXCLUSIVITY_V1`
- Goal: Keep the mobile tabletop usable by ensuring supporting panels and the
  action dock never remain open as competing layers.
- Phase: P0 Runtime mobile usability
- Status: Done

## UI Contract

- Mobile allows at most one supporting panel: members, inspector, or log.
- Opening a valid action-dock panel programmatically closes supporting panels.
- Opening a supporting panel closes the action dock.
- Escape dismisses both supporting panels and any open action-dock surface.
- Desktop keeps its existing ability to show independent supporting panels.

## Allowed Files

- `src/components/platform/RuntimeFullscreenShell.tsx`
- `src/components/platform/RuntimeActionDock.tsx`
- `src/lib/platform/runtimeOverlayCoordination.ts`
- `src/lib/platform/runtimeOverlayCoordinationSmoke.ts`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Combat state, turn authority, RuntimeLog content, dice/action behavior
- Room roles/permissions, visibility projection, map controls, server/API
- Store, schema, migration, rule data, Campaign Runtime, desktop layout

## Completion Criteria

- Auxiliary panel state has focused, pure transition coverage.
- Valid programmatic action-panel opening closes mobile supporting panels.
- Escape closes both classes of Runtime overlay.
- Existing action-dock hierarchy and player-turn behavior stay unchanged.
- Lint, frontend build, focused smoke, regressions, and diff check pass.

## Verification

```powershell
npm run frontend:verify:runtime-overlay-coordination
npm run frontend:verify:runtime-action-dock
npm run frontend:verify:runtime-player-turn-callout
npm run lint
npm run build
git diff --check
```

## Result

- Mobile members, inspector, and log now use one pure, tested state transition
  model and continue to replace one another without changing desktop behavior.
- An accepted programmatic action-panel request emits a dedicated notification;
  compact Runtime closes supporting panels only after that acceptance.
- Escape dismisses both supporting panels and action-dock surfaces.
- Focused overlay, action-dock, own-turn, combat HUD, TypeScript, frontend build,
  and diff checks pass.
