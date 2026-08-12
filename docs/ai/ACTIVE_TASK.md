# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Mobile Runtime Supporting Sheet v1
- Name: `MOBILE_RUNTIME_SUPPORTING_SHEET_V1`
- Goal: Make mobile members, inspector, and log panels read and behave like
  lightweight tabletop sheets without trapping users away from the map.
- Phase: P0 Runtime mobile usability
- Status: Done

## UI Contract

- An open mobile supporting panel dims the map but keeps the panel switcher usable.
- Tapping the dimmed map returns to the tabletop without changing Runtime data.
- Panel triggers expose their controlled region and pressed state.
- Spectators see a spectator label rather than the player-only "My Info" label.
- Desktop layout and overlay behavior remain unchanged.

## Allowed Files

- `src/components/platform/RuntimeFullscreenShell.tsx`
- `src/lib/platform/runtimeOverlayCoordination.ts`
- `src/lib/platform/runtimeOverlayCoordinationSmoke.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Runtime panel content, combat state, turn authority, RuntimeLog, dice/actions
- Room roles/permissions, visibility projection, map controls, server/API
- Store, schema, migration, rule data, Campaign Runtime, desktop layout

## Completion Criteria

- Compact Runtime derives whether a supporting sheet is open from tested state.
- A lightweight backdrop returns directly to the map.
- Switcher remains above the backdrop and can replace the active panel.
- Mobile trigger labels and aria relationships match their actual panel.
- Focused overlay smoke, existing regressions, lint, build, and diff check pass.

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

- Mobile supporting panels now dim the tabletop and close through a dedicated
  accessible Return to Map backdrop.
- The switcher stays above that backdrop, so members, inspector, and log can
  still replace one another directly.
- Panel triggers and regions are linked through stable ids; spectator wording is
  distinct from player-only My Info wording.
- Focused overlay, action-dock, own-turn, combat HUD, TypeScript, frontend build,
  and diff checks pass.
