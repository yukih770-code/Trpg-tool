# P5 Character Entry CTA Route Fix

## Purpose

The Room Lobby must never tell a member to choose a character without showing
an immediate next action. This slice exposes a small, session-scoped entry
surface over the existing Room binding and clearance contracts.

## Entry Actions

- Players can choose an active, compatible local Vault character, create a
  quick room-only draft, open the existing DND full character creator, or
  return to the join page and enter as a spectator.
- Hosts may optionally choose or draft a host-carried character, or skip the
  choice and continue hosting. A host is never blocked on character selection.
- A quick draft is an EntryCharacterRef candidate only. It does not write to
  the permanent character library.

## Pending Membership

Pending members may prepare a Vault selection or quick draft while waiting for
the host to approve their room membership. Submission remains disabled until
the member becomes active; the existing server-side binding review, admission,
and Ready gates still apply after that point.

## Full Character Creator

For DND, the visible full-creation action opens the existing Builder. The
current return route uses the workspace navigation stack: after completing the
Builder, return to the Room Lobby and select the resulting Vault character.
Automatic lobby return and automatic binding submission are intentionally not
implemented in this slice.

## Boundaries

This does not add a builder, persistent clearance storage, OAuth/public
accounts, CampaignActorInstance storage, token ownership changes, or a new
WebSocket protocol. Character approval and Runtime entry remain server-owned.

## Verification

- `npm run frontend:verify:character-entry-cta`
- Existing character entry, clearance, room player flow, permissions, and token
  ownership smokes remain required.

## Lobby placement

The Room Lobby IA keeps these actions directly below My Next Step only while a
member needs to choose or revise a character. Hosts are not pressured to bind a
character, pending members may prepare without submitting, and spectators do
not receive character-entry controls.
