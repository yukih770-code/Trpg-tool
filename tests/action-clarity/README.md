# Action clarity acceptance

Requires project dependencies, an installed Playwright package and Chrome. No new production dependency.

## Component integration

Run existing Vite on localhost3000. Set `PLAYWRIGHT_MODULE` to an installed Playwright package if necessary, and `BROWSER_EXECUTABLE` to Chrome. Then:

```powershell
node tests/action-clarity/run-browser.mjs
```

Reuses the existing deterministic live-play transport fixture. Writes only the new action-clarity evidence directory; no backend data.

## Real PostgreSQL and compiled backend

Requires the existing Windows PostgreSQL18 binaries. In a terminal kept open:

```powershell
npm run server:build
$env:ACCEPTANCE_HTTP_PORT='8798'
$env:ACCEPTANCE_POSTGRES_PORT='55460'
node tests/size-materialization/local-infrastructure.mjs
```

Provisions a new temporary cluster and assets with existing migrations. No configured database/.env change. Ports must be free. After readiness, type into the harness:

```text
seed-user clarity-player
seed-user clarity-spectator
```

In another terminal, with Vite on localhost3000 and Playwright configured:

```powershell
node tests/action-clarity/run-browser.mjs --live
```

The walkthrough creates a disposable campaign through production APIs, then uses the real lobby guard/runtime components. The development-only entry supplies separate localDev identities exclusively to localhost8798 and does not fabricate responses. It tests authored training actions, not full legal-character creation. The response-loss test sends a real request and discards its response before retrying.

Type `restart` into the harness for persistence verification. Read room/member/event IDs from `real-browser-results.json`, fetch that member's projected RuntimeLog after restart and compare event IDs/sequence. Type `stop` when finished. Temporary data is retained for inspection; no recursive cleanup is performed.

These are automated software checks, not the human pilot in `docs/development/FIRST_SESSION_PILOT_V1.md`.
