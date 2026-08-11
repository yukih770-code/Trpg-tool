# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Mobile Combat HUD Collapse v1
- Name: `MOBILE_COMBAT_HUD_COLLAPSE_V1`
- Goal: Preserve map space by giving the mobile combat HUD explicit compact and
  expanded modes while keeping essential turn identity visible.
- Phase: P0 Runtime mobile usability
- Status: Done

## UI Contract

- Page responsibility: `runtime`
- Compact responsibility: round, current combatant, initiative, next combatant
- Expanded responsibility: visible HP/AC/conditions plus role-safe controls
- Player own turn automatically expands on turn change; manual collapse remains
  respected until the active turn changes again

## Allowed Files

- `src/components/platform/RuntimeMobileCombatHud.tsx`
- `src/lib/combat/mobileCombatHudPresentation.ts`
- `src/lib/combat/mobileCombatHudPresentationSmoke.ts`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Combat state, turn authority, RuntimeLog, dice, damage, action-panel behavior
- Room roles/permissions, visibility projection, map controls, server/API
- Store, schema, migration, rule data, Campaign Runtime, desktop layout

## Completion Criteria

- Compact HUD remains useful at one short row and has an accessible expand CTA.
- Expanded HUD preserves current stats and all existing host/player controls.
- Host starts expanded; non-current players and spectators start compact.
- A player's newly active turn expands automatically; manual collapse is not
  immediately overridden by ordinary rerenders.
- Focused presentation smoke, existing HUD/turn/action smoke, TypeScript,
  frontend build, and diff check pass.

## Verification

```powershell
npm run frontend:verify:mobile-combat-hud-presentation
npm run frontend:verify:runtime-player-turn-callout
npm run frontend:verify:combat-mode-hud
npm run lint
npm run build
git diff --check
```

## Result

- Compact mode reduces the mobile HUD to one short row while retaining round,
  current combatant, initiative, and next combatant.
- Expanded mode preserves existing visible stats and role-safe controls.
- Host/waiting-player/spectator defaults and own-turn transitions follow the
  tested presentation resolver; manual collapse is not overwritten by ordinary
  rerenders.
- Focused presentation, own-turn, combat HUD, action dock, TypeScript, frontend
  build, and diff checks pass.
