# P5.API-CORE — World Server / Membership / Settings API Surface

This is the first real backend business API layer after the Postgres foundation.
It composes existing repositories and the P5.28-P5.31 auth, request-scope, and
permission boundaries without adding a frontend, auth provider, or runtime
authority path.

## Implemented families

- World server list, detail, create, profile update, archive, and restore.
- Member and role reads/writes, with owner/admin guard decisions.
- Invite metadata and join-request create/list/review flows.
- Current server settings plus settings-version and ruleset-version endpoints.
- Multiple game-system bindings per server; the default system remains a hint.

Server pack bindings are intentionally not exposed in this slice. The current
repositories can store pack metadata, but do not yet provide a clear
world-server pack-binding port. That should be added with its own narrow seam.

## Boundaries

Handlers resolve the viewer through `requestAuthSession` and
`CurrentViewerContext`, reject conflicting request scope, and call
`resolveApiPermissionGuard` before protected operations. Repositories provide
data only; they do not decide permissions. Public errors use the existing safe
API envelope and never return SQL, stack traces, database URLs, or internal
permission reasons. Private server existence is hidden with 404 where the
operation is a read.

The route module is registered in `server/room-server.ts` under
`/api/world-servers`. Registration performs no migration or readiness work.
Dev auth headers remain opt-in through the existing development gate; bearer,
cookie, and frontend login state are not treated as verified authentication.

## Verification

`server/api/worldServerApiHandlersSmoke.ts` uses fake repositories and covers 46
meaningful auth, scope, access, management, invite/join-request, settings,
ruleset, game-system, error-safety, and no-Postgres cases. The verifier is
`npm run api:verify:world -- --strict`.

## Not implemented

- Frontend server-workspace integration.
- Real auth provider, JWT, OAuth, or password login.
- WebSocket or Runtime behavior changes.
- Campaign/Room API and runtime event persistence bridge.
- Compendium import parser, object storage, upload/download, or public content import.
- AI calls, retrieval, or model integration.
- Rate limiting, provider-backed session verification, and production API hardening.

## Next phase

Integrate real server data into the frontend workspace, then add the Campaign /
Room API surface, runtime event persistence bridge, and a real auth provider
behind the existing boundaries.
