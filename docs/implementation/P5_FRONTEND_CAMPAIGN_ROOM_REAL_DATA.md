# P5.FRONTEND-CAMPAIGN-REALDATA Campaign / Room / Runtime Frontend Integration

This slice connects the server-scoped frontend workspace to the existing
Campaign / Room / Runtime API. It does not replace the current launcher or
server-home IA and does not change live Room Server behavior.

## Data Layer

`src/lib/api/campaignRoomApiClient.ts` uses the existing API client and
`VITE_API_BASE_URL` boundary. It maps safe API errors, supports campaign
CRUD/lifecycle, campaign actor-instance summaries, room/lobby metadata,
runtime-session metadata, and runtime-event list/append calls.

The hooks in `src/lib/campaignRoom/` provide loading, error, empty, retry, and
partial-sync states without adding a global store:

- `useCampaigns` loads and creates campaigns in a selected World Server.
- `useCampaignDetail` loads campaign detail, actor summaries, and rooms.
- `useRoomDetail` loads room metadata, participant/slot records, and the
  optional runtime-session metadata.
- `useRuntimeEvents` loads ordered events and exposes append-only event notes.

## Server Workspace Integration

The selected server home now renders `ServerCampaignWorkspace` for API-backed
servers. It provides:

- campaign list, empty/error/retry state, and create form;
- campaign detail with status, lifecycle, system, actor count, and room count;
- room metadata list/detail with participant and lobby-slot summaries;
- runtime-session metadata summary;
- append-only runtime-event display and a simple public note action.

Demo server rows remain separate from API rows. The new workspace is not
rendered for demo rows, so local fixtures are never silently mixed with server
data.

## Boundaries

Room metadata is not the live Room Lobby. Runtime session metadata is not live
runtime authority. WebSocket messages, Room Server membership/ready state,
RuntimeLog live sync, and existing Runtime screens are unchanged.

Runtime events have no edit/delete UI. The frontend only lists ordered events
and optionally appends a simple public metadata note through the existing API.
The API remains authoritative for authorization and private-event filtering.

No database URL is read by the frontend. No full VTT board, character sheet,
AI recap, compendium parser, object upload, deployment configuration, or real
authentication provider is included.

## Verification

`npm run frontend:verify:campaign-room` runs 18 fake-fetch client contract
cases without Postgres or a live server. It covers endpoint paths, methods,
bodies, query parameters, safe error mapping, append-only client shape, and
the explicit development demo boundary.

## Next Phase

Future work may add a real-auth session, a deliberate live runtime event
bridge, deployment configuration, and an AI session recap only after their
respective boundaries are defined.
