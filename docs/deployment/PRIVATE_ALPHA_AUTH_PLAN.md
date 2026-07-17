# Private Alpha Authentication Plan

Status: implemented minimal private-alpha session gate. This is not public registration or a production identity provider.

## Current Boundary

`x-dev-user-id` and the local dev viewer fixture are valid only in `localDev`. They are not a login system, and cloud modes reject their enablement at startup. Browser state never grants server, campaign, room or content permissions.

## Current Private Alpha Flow

In `cloudPrivateAlpha`, the backend requires `PRIVATE_ALPHA_AUTH_ENABLED=true`, an operator-held invite code, and a backend-only session secret. A user enters a display name and invite code; the backend creates or reuses a private-alpha identity, writes a short-lived `auth_sessions` record, and sets an HttpOnly, SameSite cookie. The API resolves the user identity from that signed cookie server-side.

The invite code and session secret are never built into the frontend. `x-dev-user-id` remains `localDev` only and is disabled in cloud modes. Logout revokes the current session record and clears the browser cookie.

## Options

| Option | Suitability | Notes |
| --- | --- | --- |
| Keep local dev identity only | Current local development | Safe only when bound to `localDev`; not a cloud alpha login. |
| Temporary invite code | Current private alpha | Server-side validation with signed, expiring sessions. Code rotation, rate limits and per-invite records remain later work. |
| Email/password | Later | Needs password hashing, reset flow, session management and abuse controls. |
| OAuth | Later | Still requires verified session and account linking. |
| Magic link | Later | Requires email delivery, expiry, replay protection and session management. |

## Next Auth Slice

Replace the shared invite code with operator-created, expiring invite records and rate limiting. Keep verified session resolution separate from Room/WebSocket authority and gameplay features.

## Non-goals

No public registration, OAuth, password storage, payment or broad account system is implemented here.
