# P5.LOCAL-PLAYABLE-LOBBY Local Playable Lobby

This slice makes the existing server workspace usable as a local table
organizer. It is a frontend integration over the existing World Server,
Campaign, Room, Runtime Session, and append-only Runtime Event APIs.

## Locally playable now

- Development-only viewer identity switching through the existing dev header.
- Server workspace campaign list, campaign creation, selection, and detail.
- Room creation, selection, metadata, participants, and lobby-slot summaries.
- Campaign character-record listing and safe creation where the existing API
  supports it. This is not a live room actor binding.
- Runtime session metadata creation and an append-only persisted event panel.
- Loading, empty, retry, partial-sync, and action-error states.

The UI never silently mixes API rows with demo rows. The explicit demo fallback
remains a separate development-only mode.

## Boundaries

The local identity switcher is not real login and is not security. It only
selects the dev viewer ID sent through `x-dev-user-id` in development builds.
The frontend never reads a database URL.

Room metadata and persisted lobby summaries are not the live Room Server
WebSocket authority. Runtime events are durable append-only records, not live
broadcasts. No event update/delete UI is provided.

Campaign character records are not `CampaignMembership`, `CampaignActorInstance`
runtime state, or `RuntimeActor` state. No full character sheet, automatic rule
calculation, or state write-back is included.

## Not implemented

- Real authentication, OAuth, JWT, or password login.
- Full live join/ready/approval mutation integration.
- WebSocket persistence or protocol changes.
- Full VTT, map/token board, or character-sheet editor.
- AI recap, deployment configuration, object storage, or compendium parsing.

## Verification

Run `npm run frontend:verify:local-playable-lobby` for the backend-free local
state smoke. Existing API handler, policy, frontend client, and persistence
bridge smokes remain the surrounding verification boundary.
