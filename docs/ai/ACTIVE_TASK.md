# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Local Runtime Auth Contract Doctor v1
- Name: `LOCAL_RUNTIME_AUTH_CONTRACT_DOCTOR_V1`
- Goal: Prevent local Doctor from reporting a healthy app when the running
  frontend/backend use stale or mismatched authentication modes.
- Phase: P0 Alpha closure
- Status: Done

## Runtime Contract

- Local Doctor expects `localDev`; auth Doctor expects `privateAlpha`.
- Backend `/health` reports its real authentication mode.
- Vite development reports its compiled frontend mode without secrets.
- Running frontend and backend must both match the requested mode.
- Start waits for both reports before opening the browser.
- Production builds do not expose the Vite-only diagnostic endpoint.

## Allowed Files

- `scripts/dev-local.ps1`
- `scripts/dev-local-doctor-contract-smoke.ps1`
- `vite.config.ts`
- `server/room-server.ts`
- `package.json`
- `docs/development/LOCAL_DEV_ONE_COMMAND.md`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Authentication protocol, cookies, invite/session secret handling
- World Server, Campaign, Room, Runtime, map, combat, rule data
- Store, schema, migration, deployment environment values
- Starting/stopping unknown running processes during verification

## Completion Criteria

- Expected/reported auth-mode comparison has focused smoke coverage.
- Doctor rejects legacy, mixed-mode, and half-started running instances.
- Start gates browser opening on matching backend and frontend modes.
- Documentation explains diagnosis and recovery without exposing secrets.
- TypeScript, server/frontend builds, smoke, Doctor conflict proof, and diff pass.

## Verification

```powershell
npm run dev:local:verify:doctor-contract
npm run dev:local:doctor
npm run lint
npm run server:build
npm run build
git diff --check
```

## Result

- Doctor no longer treats HTTP 200 and PostgreSQL readiness as sufficient proof
  that the currently running app matches the requested authentication mode.
- Backend and Vite development expose minimal non-secret mode diagnostics.
- Start verifies both services before it opens the browser.
