# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols, landmarks, and `rg -n`; do not write fixed line numbers.

## Task

- ID: Platform Local-Direct Launcher Clarity v1
- Name: PLATFORM_LOCAL_DIRECT_LAUNCHER_CLARITY_V1
- Goal: Make the auth-disabled launcher describe its real local/server-selection
  flow, keep private-alpha authentication on its existing separate gate, and
  remove narrow-screen headline overflow.
- Phase: P0 product truth / entry UX
- Status: Done

## Allowed Files

- `src/App.tsx`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`

## Forbidden Changes

- Authentication protocol, cookies, API handlers, server selection behavior
- Runtime, Room, map, WebSocket, store, schema, migrations, rule data
- DND / COC / CP RED workspace internals
- Router, URL, browser History, dependencies

## Completion Criteria

- Auth-disabled launcher does not claim that login or registration is involved.
- One primary action enters the existing server workspace.
- Supporting content explains the server-first product flow without developer
  scaffold language.
- The launcher has no horizontal overflow at a 390px viewport.
- Type check and production build pass.

## Verification

```powershell
npx tsc --noEmit
npm run build
git diff --check
```

## Result

- Replaced contradictory login/registration copy in the auth-disabled launcher
  with the real local/LAN server-workspace flow.
- Reduced the entry surface to one primary action and a three-step product guide.
- Preserved the existing private-alpha authentication gate and server selection
  behavior.
- Verified the rendered page at a true 390px CSS viewport:
  `innerWidth=390`, `documentElement.scrollWidth=390`, `body.scrollWidth=390`.
- `npx tsc --noEmit`, `npm run build`, and `git diff --check` pass.
