# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Private Alpha Two-Account Acceptance Gate v1
- Name: `PRIVATE_ALPHA_TWO_ACCOUNT_ACCEPTANCE_GATE_V1`
- Goal: Turn the strategic “real multiplayer Alpha smoke” item into an explicit,
  evidence-based release gate with a safe automated deployment preflight.
- Phase: P0 Alpha closure
- Status: Prepared; remote execution blocked by missing deployed HTTPS URL

## Acceptance Contract

- Automated preflight is read-only and never signs in or performs writes.
- Only a remote HTTPS single-origin target is accepted.
- Health must report cloud Private Alpha, database readiness, private auth, no dev
  auth, and secure WebSocket configuration.
- Two isolated browser identities must execute every P0 host/player row.
- UI hiding alone is not permission evidence; shared state must remain unchanged.
- Process-restart durability is recorded per surface, never inferred.

## Allowed Files

- `server/config/privateAlphaAcceptancePreflight.ts`
- `server/config/privateAlphaAcceptancePreflightSmoke.ts`
- `server/config/verifyPrivateAlphaAcceptancePreflight.ts`
- `docs/deployment/PRIVATE_ALPHA_TWO_ACCOUNT_ACCEPTANCE.md`
- `package.json`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Remote writes, login attempts, invite redemption, deployment changes
- Reading/logging access codes, session secrets, cookies, database URLs
- Auth protocol, API behavior, Room/Runtime authority, schema/migrations
- Marking manual acceptance rows passed without real evidence

## Completion Criteria

- Pure preflight covers ready remote, rejected local, and missing configuration.
- Operator command checks frontend, health, login gate, database, auth, and WSS.
- Manual gate covers identities, admission, Runtime, permissions, combat, refresh,
  reconnect, and process-restart boundaries.
- Current external blocker is recorded without pretending remote execution passed.
- TypeScript, server/frontend build, smoke, diff, and documentation checks pass.

## Verification

```powershell
npm run alpha:verify:acceptance-preflight-contract
npm run alpha:verify:acceptance-preflight
npm run cloud:verify:private-alpha
npm run lint
npm run server:build
npm run build
git diff --check
```

## Result

- Acceptance gate and safe remote preflight are implemented.
- Contract smoke passes; current environment is correctly blocked before network
  access because no deployed HTTPS target is configured.
- All two-account rows remain NOT RUN until an operator supplies the non-secret
  deployment origin and performs the isolated-browser run.
