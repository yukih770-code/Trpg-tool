# P5.FRONTEND-REALDATA — Server Workspace Real Data Integration

This slice connects the existing frontend launcher and server workspace to the
P5.API-CORE World Server API. It keeps the current launcher → server select →
server home → platform home IA and replaces the inline server list/detail
source with typed HTTP data where the API is available.

## Frontend boundary

- `VITE_API_BASE_URL` selects the backend HTTP origin.
- Empty configuration falls back to `http://localhost:8787` for local development.
- The frontend only knows an API origin; it does not know a hosting vendor,
  database URL, SQL, or deployment provider.
- `VITE_DEV_VIEWER_USER_ID` is sent only when the Vite build is in dev mode.
  It is a local development seam, not production authentication.

## Integrated surfaces

- Server selection loads the authenticated user's World Server list.
- Server creation calls the existing API and opens the returned server detail.
- Server home loads detail, members, roles, settings, and enabled game systems.
- Settings keeps server-scoped data inside the existing Settings surface and
  shows synced server summaries where a full editor does not exist yet.
- Multiple game systems remain visible; the default system is only a hint.

Loading, empty, retry, API error, 401, 403, 404, 503, network failure, and
non-JSON responses have explicit safe UI/data-layer handling. Server
authorization remains server-side; frontend state is never treated as security.

## Demo fallback

The existing fixture rows are retained only behind the explicit dev-only
`VITE_SERVER_WORKSPACE_DEMO=true` flag. They are labeled as local demo data and
are never mixed with API rows. Without that flag, an unavailable API produces a
safe error/empty state instead of silently presenting fake server data.

## Not implemented

- Real authentication provider, OAuth, JWT, or password login.
- Full membership/role/invite management UI and invite redemption.
- Full server settings editor, pack binding editor, or advanced settings writes.
- Campaign/Room frontend API integration.
- WebSocket/runtime changes, deployment configuration, database writes, AI, or
  upload/download behavior.

## Verification

- `npm run frontend:verify:world` runs seven frontend client contract cases.
- Existing World Server API, guard, permission, and AI policy smokes remain the
  backend verification boundary.
