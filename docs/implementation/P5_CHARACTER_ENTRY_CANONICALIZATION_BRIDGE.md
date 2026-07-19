# P5 Character Entry Canonicalization Bridge

## Purpose

`EntryCharacterRef` is a small, display-safe normalization contract between
existing entry selections and map presence. It joins neither identity nor
permission systems and does not introduce another source of truth for a
character.

## Normalized sources

The bridge can describe a Character Vault selection, a local campaign entry
draft, a campaign actor, a DND Lite actor sheet, an approved room actor binding,
or a manual summary. It carries only source identity, display name, system,
optional owner/control hints, initials, actor kind, and lightweight HP/condition
summaries.

## Room Runtime rule

A local entry selection is only a local draft. It is not automatically submitted
to a Room Lobby and is not a map-placement candidate. Room Runtime accepts a
candidate only when the room actor binding is both host-approved and clearance-
approved. An explicit host-carried convenience entry may also be projected by a
local host flow, but it grants no room authority and is never treated as a
remote-player approval.

`RoomRuntimeEntryBridge` derives candidates from the live room snapshot.
`BasicMapBoard` then uses its existing permission inputs for placement. This
bridge never grants token movement, map editing, or Room Runtime entry.

## Map source metadata

The additive token source values `vaultActor`, `roomActorBinding`, and
`quickDraft` are replay- and scene-snapshot-compatible. They describe where a
display prototype came from; a map token remains a scene instance, and combat
remains the HP/condition authority.

Token display follows `P5_TOKEN_RENDERING_CLARITY_PATCH.md`: an entry summary
may contribute an existing image or initials, but never a second avatar, asset
gallery entry, or ownership signal.

## Current user wording

- A local campaign selection is **已选择角色** and has **尚未提交到联机大厅**.
- A Room Lobby player without a binding is **等待选择角色**.
- The Room Lobby form is **提交入场角色**.
- A cleared binding appears as **已准入角色** in the map placement list.

## Clearance Alpha relationship

`P5_CHARACTER_CLEARANCE_ALPHA.md` owns the Room Lobby sequence: submit, host
review, session admission, and ready. This bridge only normalizes the
display-safe summary after that process; it never turns a local selection into
a submitted binding by itself.

## Explicitly not implemented

No Character Clearance rule engine, snapshot hashing authority, token ownership,
player token movement, cross-device character sync, persistent Campaign Actor
Instance migration, database migration, auth change, or WebSocket protocol
change is part of this bridge.

## Verification

- `npm run frontend:verify:character-entry`
- `npm run frontend:verify:actor-presence`
- `npm run frontend:verify:room-permissions`
