# Private Alpha Authentication Plan

Status: design note. It does not implement authentication.

## Current Boundary

`x-dev-user-id` and the local dev viewer fixture are valid only in `localDev`. They are not a login system, and cloud modes reject their enablement at startup. Browser state never grants server, campaign, room or content permissions.

## Options

| Option | Suitability | Notes |
| --- | --- | --- |
| Keep local dev identity only | Current local development | Safe only when bound to `localDev`; not a cloud alpha login. |
| Temporary admin invite code | Small private alpha | Requires server-side hashing, expiry, rate limits and audit rules before use. |
| Email/password | Later | Needs password hashing, reset flow, session management and abuse controls. |
| OAuth | Later | Still requires verified session and account linking. |
| Magic link | Later | Requires email delivery, expiry, replay protection and session management. |

## Recommended Next Slice

Before cloud private alpha permits user-specific writes, implement a minimal verified-session boundary backed by an operator-created invite. The backend must resolve a verified user identity server-side; the frontend may display login state but cannot assert it. Keep this separate from Room/WebSocket authority and gameplay features.

## Non-goals

No public registration, OAuth, password storage, payment or broad account system is implemented here.
