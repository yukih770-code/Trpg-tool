# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Runtime Player Turn Callout v1
- Name: `RUNTIME_PLAYER_TURN_CALLOUT_V1`
- Goal: Let an admitted player recognize their own active combat turn and open
  the existing role-safe action/dice panel directly from the mobile combat HUD.
- Phase: P0 Runtime mobile usability
- Status: Done

## UI Contract

- Page responsibility: `runtime`
- Primary action: when the active combatant is the player's linked character,
  open the existing DND action palette or generic dice panel
- Hidden actions: no player turn advance/end controls and no automatic roll
- Host and spectator behavior remains unchanged

## Allowed Files

- `src/components/platform/RuntimeMobileCombatHud.tsx`
- `src/components/platform/RuntimeActionDock.tsx`
- `src/components/platform/RoomRuntimeEntryBridge.tsx`
- `src/components/platform/RoomRuntimeCombatPanel.tsx`
- `src/lib/combat/roomRuntimeCombatLink.ts`
- `src/lib/combat/runtimePlayerTurnCalloutSmoke.ts`
- `server/room/roomRuntimeVisibilityProjectionSmoke.ts`
- `server/room/roomRuntimeVisibilityProjectionSmoke.ts`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Combat turn authority, RuntimeLog events, dice resolution, hit/damage logic
- Room role/permission resolution, API, server, store, schema, migration
- Map token ownership or visibility projection rules
- Campaign Runtime and desktop Runtime layout

## Completion Criteria

- Shared helper resolves the player's combatant only through projected Token
  linkage and approved actor binding.
- Mobile HUD clearly marks the player's own active turn.
- Turn CTA opens an existing action/dice panel; it performs no gameplay action.
- Host controls and spectator read-only behavior remain unchanged.
- Focused smoke, existing action-dock/combat HUD smoke, TypeScript, build, and
  diff check pass.

## Verification

```powershell
npm run frontend:verify:runtime-player-turn-callout
npm run frontend:verify:runtime-action-dock
npm run frontend:verify:combat-mode-hud
npm run lint
npm run build
git diff --check
```

## Result

- Viewer-projected approved binding → Token → combatant linkage now has one
  shared read-only resolver used by both the combat panel and Runtime bridge.
- Mobile players receive a clear own-turn callout; its CTA opens the existing
  DND action palette or dice panel and performs no gameplay operation.
- The server visibility smoke confirms only the owner retains the opaque Token
  binding needed for recognition.
- Focused smoke, existing action/combat/visibility checks, TypeScript, frontend
  and server builds, and diff check pass.
