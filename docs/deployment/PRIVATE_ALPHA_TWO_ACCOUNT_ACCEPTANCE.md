# Private Alpha Two-Account Acceptance Gate

Status: **REMOTE EXECUTION NOT STARTED** (no non-local deployment URL is
configured in the current operator process).

This is the single release gate for proving that the current platform supports
one real host and one real player through the Server → Campaign → Room → Runtime
path. Passing unit/smoke tests or receiving HTTP 200 is not sufficient.

## Evidence rules

- Use two isolated browser profiles: Host and Player. A private window is
  acceptable for Player; do not reuse cookies between roles.
- Record UTC timestamp, deployed revision, step result, and a short observation.
- Screenshots must not contain access codes, cookies, database URLs, session
  secrets, or provider environment values.
- Mark every row `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`. Never infer a pass from
  source code or an automated smoke.
- Any P0 failure stops the run. Fix it in a separate committed task, redeploy,
  and restart the acceptance run from preflight.

## Gate A — read-only deployment preflight

Set a non-secret operator variable for the deployed single-origin application:

```powershell
$env:PRIVATE_ALPHA_SMOKE_URL='https://your-private-alpha-origin.example'
npm run alpha:verify:acceptance-preflight
```

The command never logs the URL or secrets. It only reads the frontend,
`/health`, and `/api/auth/me`, and requires:

- remote HTTPS frontend;
- `cloudPrivateAlpha` + `cloud` backend modes;
- `privateAlpha` authentication with dev auth disabled;
- database and World Server schema readiness;
- an unauthenticated login gate before sign-in;
- a secure non-local `wss://` origin.

Current result (2026-08-12): `BLOCKED` — current `.env` contains localhost only;
`PRIVATE_ALPHA_SMOKE_URL` is not configured. No remote request was made.

## Gate A2 — local two-account protocol proof

This is automated backend evidence, not a replacement for the remote browser
run. It starts a Private Alpha backend on an isolated local port, uses two
independent cookie jars, and never prints credentials or response bodies:

```powershell
npm run alpha:verify:two-account-protocol:local
```

Current result (2026-08-12): `PASS` — the real local PostgreSQL-backed flow
proved all of the following in one run:

- Host and Player received distinct verified user IDs and isolated sessions.
- Host created a World Server and one-use personal invite; Player redeemed it
  and the resulting server membership was visible to the Player session.
- Host created a campaign-linked live room; Player joined as pending and could
  read only the narrow join-status endpoint until Host approval.
- Player could not claim Host's member ID or perform a host-only room action.
- Player submitted a quick-draft character, could not Ready before approval,
  then successfully reached approved + Ready after Host review.
- The live room was closed and database fixtures were archived by the Host
  session after the run.

The first run exposed and then regression-covered a P0 privacy defect: pending
applicants could read a full Room snapshot. The fixed contract now returns 403;
pending applicants use `/rooms/:roomId/join-status` only.

Still unproved by Gate A2: rendered UI behavior, existing Actor Vault selection,
WebSocket convergence, Token/map interaction, combat, refresh/reconnect, and
process-restart recovery. Those remain Gates B–E below and keep `NOT RUN` until
observed against the deployed revision in two browsers.

## Gate B — two independent identities

| ID | Priority | Host / Player action | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| B1 | P0 | Host signs in with the bootstrap/private code | Host receives a persistent authenticated session | NOT RUN | — |
| B2 | P0 | Host creates a World Server | Server appears after refresh | NOT RUN | — |
| B3 | P0 | Host creates one personal invite for Player | Invite is created without exposing other secrets | NOT RUN | — |
| B4 | P0 | Player signs in in an isolated profile using that invite | A different user is created/bound and joins the intended server | NOT RUN | — |
| B5 | P0 | Host creates a DND campaign and room | Room is associated with the campaign and has an invite/join path | NOT RUN | — |
| B6 | P0 | Player joins the room | Host sees a pending/active member according to the room flow | NOT RUN | — |

## Gate C — character admission and Runtime

| ID | Priority | Action | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| C1 | P0 | Player opens the existing-character entry | Cloud/local Actor Vault choices are available | NOT RUN | — |
| C2 | P0 | Player submits one character | Host sees the character clearance details | NOT RUN | — |
| C3 | P0 | Host approves; Player marks Ready | Both clients converge on approved/ready state | NOT RUN | — |
| C4 | P0 | Host and Player enter Runtime | Both connect to the same room `/ws` stream | NOT RUN | — |
| C5 | P0 | Host places the approved character Token | Both clients see the linked Token | NOT RUN | — |
| C6 | P0 | Host creates a standalone NPC/monster Token | No character admission is required | NOT RUN | — |
| C7 | P0 | Host grants own-Token movement; Player moves own Token | Move is accepted and visible to Host | NOT RUN | — |
| C8 | P0 | Player attempts to move host/manual Token | Move is rejected and authority remains unchanged | NOT RUN | — |
| C9 | P1 | Host hides a Token | Player cannot see the hidden Token or private metadata | NOT RUN | — |

## Gate D — combat, refresh, and reconnect

| ID | Priority | Action | Expected result | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| D1 | P0 | Host starts combat with linked Token(s) | Initiative and active turn appear on both clients | NOT RUN | — |
| D2 | P0 | Host advances to Player | Player sees “your turn” and can open existing action/dice surface | NOT RUN | — |
| D3 | P0 | Player rolls from the allowed surface | Public RuntimeLog event reaches both clients | NOT RUN | — |
| D4 | P0 | Refresh Player during Runtime | Session, room membership, map/log cursors, and current turn recover | NOT RUN | — |
| D5 | P0 | Briefly disconnect/reconnect Player network | Socket reconnects and catches up missing log/map suffixes | NOT RUN | — |
| D6 | P1 | Refresh Host | Host authority and current room state remain usable | NOT RUN | — |

## Gate E — process restart boundary

This is a deliberate durability audit, not an assumed pass. Record each surface
separately after restarting the deployed Node service:

| ID | Surface | Expected current contract | Status | Evidence |
| --- | --- | --- | --- | --- |
| E1 | Login session | Browser session remains valid if database/session secret are unchanged | NOT RUN | — |
| E2 | Server and campaign records | Persist | NOT RUN | — |
| E3 | Recoverable room lobby | Recover according to live-room lifecycle persistence | NOT RUN | — |
| E4 | RuntimeLog | Recover for campaign-linked cloud room | NOT RUN | — |
| E5 | Room map state | Known limitation: do not mark PASS unless observed; full durable recovery is not yet promised | NOT RUN | — |
| E6 | Combat state | Record actual behavior; do not infer from RuntimeLog persistence alone | NOT RUN | — |

## Exit criteria

- All P0 rows pass on one deployed revision.
- Every P1 row is either PASS or recorded as an accepted Alpha limitation.
- No step relies on a shared browser identity.
- No permission result is inferred only from UI hiding; rejected writes are
  confirmed by unchanged shared state.
- The final record names the tested revision and remaining durability limits.
