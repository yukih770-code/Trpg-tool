# D&D First-Session Action Clarity V1

2026-09-16. Starting checkpoint: `75686c9`. **Implemented and verified; new work is uncommitted.**

## Requested checkpoint

Created `75686c9` (`feat(dnd): materialize token footprints from accepted actor size`) from exactly the previous milestone's 63-file manifest. The staged whitespace check caught one extra trailing blank line in its acceptance harness; it was removed before committing. Unrelated work and the new roadmap were excluded. Nothing pushed.

## Resulting behavior

- Projected actor → action → target summary before submission. Self-target selection is explicit without inventing a prohibition.
- Pending display follows frozen intent IDs even when the host selects another actor elsewhere. Missing projected labels use neutral placeholders rather than borrowing the new actor's action name.
- Rejection and unconfirmed/network failure are distinguished; attack errors are separate from independent dice errors.
- Latest confirmed server result is labeled as history. Starting another attack or receiving a rejection collapses it; it remains inspectable. Historical content uses the existing structured server-projected renderer.
- Action retrieval has a loading state. Loading/errors prevent new submission; uncertain pending intents retain the existing explicit retry.
- Empty-action guidance explains supported equipment, source acceptance and campaign overrides. Hosts reuse the authorized campaign-sheet callback; players open the existing admitted-character panel or return to the lobby. No duplicate editor or automatic approval.
- Common action/actor/target/range failures have actionable Chinese messages; rejected requests offer action refresh.

## Verification

| Evidence | Result and scope |
| --- | --- |
| New browser integration | 19 checks passed: history/rejection, map selection, self-target notice, frozen selections, identical retry, guidance, keyboard, mobile bounds and spectator |
| Existing live-tabletop integration | 47 checks passed: panels/focus, map, chat/log dedupe, retry, GM controls, spectator and 390–1920px layouts |
| Real database/browser walkthrough | Eight checks passed: production lobby/entry guard/runtime components, separate host/player/spectator contexts, real compiled backend and PostgreSQL, public API seed data |
| Response loss | Real server processed attack; transport discarded response. Retry returned `replayed: true` with identical persisted event ID |
| Source-change rejection | Removing authored action through campaign API rejected stale selection as `unknown_action`; UI localized it and collapsed prior success |
| Real permissions | Player control of NPC received403; spectator had no attack controls |
| Restart | Same four event IDs and sequence4 recovered: combat start plus three deliberate attacks; no duplicate from retry |
| Existing focused tests | T12 frontend intents, rendering, HTTP/authority, visibility and server intent-index scripts passed |
| Builds | Frontend typecheck, backend build and frontend build passed; final frontend ~3,147KB / 776KB gzip |

See [evidence](action-clarity-evidence/) and [reproduction instructions](../../tests/action-clarity/README.md). `final-build-results.json` contains final build output; the earlier focused regression results were observed in command output during this task.

Real acceptance uses a seeded Vault record and explicit campaign-authored training attacks, not a full legal-character creation test or new weapon rules. A dedicated development entry mounts the existing lobby and runtime instead of recreating the entire outer campaign navigation. Separate identities use the existing localDev seam; this is not deployed-auth acceptance. HTTP/WebSocket responses are real, except deliberate response loss after a real request.

The isolated harness applied the existing 12 migrations to a fresh PostgreSQL18 cluster on55460 and served the compiled backend on8798. It now supports alternate ports, occupied-port preflight and `seed-user` commands. Both services were stopped after verification. Normal backend8787/frontend3000, configured database content and .env were untouched.

## Scope and boundaries

Production: `RuntimeDndActionPanel.tsx`, `RoomRuntimeEntryBridge.tsx`, `livePlay.css`. Rendering assertions changed only for intended copy/loading/summary behavior; visibility assertions remain intact. Tests add `tests/action-clarity/*` and extend the existing isolated infrastructure helper. The exact file manifest is `action-clarity-evidence/source-changes.json`.

No production server code, rules, migrations, visibility, source approval, movement, equipment derivation, T13/T14 mechanics or replay kernel changed.

Whole-worktree whitespace checking still reports a pre-existing trailing blank line in protected `scripts/dev-local.ps1`. This task's own files pass; the unrelated script was untouched.

## Next gate and remaining work

The source checkpoint and repeatable isolated acceptance setup are available. Build revision reporting in service health and a full database-plus-assets restore drill remain operational follow-ups; this is not a claim that deployment work is complete.

Next: [two human pilot sessions](../development/FIRST_SESSION_PILOT_V1.md). No independent human sessions or usability timings were measured here. Use observations to choose one next slice. Footprint-aware snapping, broader weapon modes, variable-species size and private-alpha expansion remain proposed future work.
