# P5 Character Clearance Details and Token Control Fix

## Purpose

This slice fixes the runtime path where an approved player could still be
blocked from moving their own placed character Token, while keeping map movement
server-authoritative. It also gives hosts a compact, expandable character review
summary before approving a room binding.

## Trusted movement chain

The browser may show drag affordance only after it sees an approved binding.
The Room Server remains authoritative and verifies:

`authenticated viewer -> active room member -> approved clearance binding -> persisted Token metadata`

The Token must be a player character with exact `roomMemberId` and
`actorBindingId`. Supported source variants are `roomActorBinding`,
`vaultActor`, `quickDraft`, `dndLiteActor`, and `campaign_actor`; variants with
an actor id must match the binding actor id. Hosts retain full movement. Other
players, spectators, pending members, monsters, NPCs, manual Tokens, malformed
metadata, and owner-id spoofing are rejected. Old metadata-free tokens replay
normally and remain host-controlled.

## Clearance review details

`CharacterClearanceDetails` is an optional, normalized payload carried by
`RoomActorRefSummary`. It can include short labels for identity, combat,
equipment, traits, long-term effects, and review warnings. The normalizer caps
strings and lists, tolerates missing fields, and keeps old shallow summaries
compatible. The player sees a preview before submitting; the host sees the same
content behind an expandable review disclosure.

## Boundaries

No database migration, new WebSocket protocol, character-store write, full
legality validation, automatic rule enforcement, CampaignActorInstance,
cross-device character-sheet transfer, or copyrighted rule text is introduced.
The details are session review metadata only.

## Verification

- `npm run frontend:verify:player-token-control`
- `npm run runtime:verify:token-ownership`
- `npm run frontend:verify:character-clearance-details`
- Existing character-clearance, room-lobby, actor-presence, and map smokes.
