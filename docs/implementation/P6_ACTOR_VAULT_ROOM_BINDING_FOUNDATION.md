# P6 Actor Vault and Room Binding Foundation

## Purpose

This slice makes the existing `actors` table usable through an authenticated API and establishes the first authoritative boundary between a saved character and a Room Lobby binding.

## What It Does

- `GET/POST/PATCH /api/actors` plus archive/restore routes operate only on the authenticated user's own Actor Vault records.
- Full `actor_payload` is returned only to that actor's owner.
- A Room Lobby submission that includes an `actorId` is resolved by the server. The record must exist, belong to the signed-in room participant, be unarchived, and use the room's system.
- The server replaces browser-provided display/summary fields with a minimal Vault projection before writing the Room Lobby snapshot.

## What It Deliberately Does Not Do

- It does not make Actor Vault payloads public to a room, host, or other players.
- It does not migrate per-system stores, add DND/COC rule logic, or change room/WS protocol.
- It does not yet connect mutable campaign actor state to the Room Runtime, player self-service writes, or rule automation.

## P6.2 Local-to-Cloud Actor Sync

- Selecting an existing DND, COC, or CP RED local vault actor in the room lobby creates or updates an owner-scoped cloud Actor Vault record before its binding is submitted.
- The room receives the returned cloud actor id instead of a browser-store id. Quick drafts remain provisional and do not invent persisted actor identities.
- The server derives the compact lobby review projection from the stored owner payload. Full actor payloads remain owner-only.

## P6.3 Campaign Actor Mutable-State Boundary

- Existing `campaign_actor_instances` now have a protected update path for `overridePayload`, separate from their immutable `snapshotPayload` baseline.
- Only campaign-management permission can use this API. It is deliberately not yet an in-room player write path.
- This is the future durable home for session-specific HP, SAN, conditions, and inventory deltas. No system-specific rules are inferred or automated here.

## P6.4 Approved Binding -> Durable Campaign Actor

When a live room explicitly carries both `worldServerId` and `campaignId`, host
approval of a persisted Vault actor now creates or reuses a
`campaign_actor_instances` record. The live RoomSnapshot receives only its opaque
`campaignActorInstanceId`; full Vault data remains out of the room projection.

The bridge requires an active owner/admin reviewer in the referenced World Server,
a valid World Server/campaign binding, and a source actor owned by the member being
approved. It is idempotent. Legacy rooms, local campaign rooms, quick drafts, and
incomplete context simply remain lobby-only. This is still not a Room Runtime
write path: HP/SAN/state commands remain deferred until the cloud room-launch
surface supplies this durable context end to end.

## P6.5 Cloud Campaign -> Live Room Launch

- The authenticated server workspace now exposes a campaign-level "Open live
  lobby" action for owners/admins. It creates the existing Room Server lobby
  with the real `worldServerId` and `campaignId`, then enters the existing host
  Lobby surface.
- This is intentionally separate from durable room-record metadata. P6.5 does
  not claim that the current in-memory live Room survives a Room Server restart,
  or that legacy metadata room records are automatically promoted into live
  rooms.
- The live Room carries only the campaign context required by P6.4. Approval can
  therefore create or reuse the durable campaign actor instance without sending
  the owner-only Vault payload through the Room snapshot.
- The Room API independently verifies that the caller owns or actively
  administers the referenced World Server and that the campaign is bound to it.
  The campaign-workspace button is convenience UI, not an authorization source.

## P6.6 Live Room Lifecycle Recovery

- A cloud-backed live room now creates or updates the existing durable
  `room_records` row with a versioned, server-internal lobby snapshot. This is
  not a second room model and it does not expose the snapshot through the
  Campaign/Room metadata API.
- Open live lobbies are restored into the Room Registry after a Room Server
  restart. The host can use the durable room card to re-enter without relying
  on a cached browser member id.
- This slice deliberately restores lobby membership/binding state only. Runtime
  Log, map stream, combat state, and WebSocket presence remain on their own
  persistence/replay paths and are not represented as a claim of full runtime
  recovery.

## Follow-up Order

1. Feed authorized override state into runtime map, combat, and action projections.
2. Add per-system validated mutation commands after player/host permission rules are explicit.
