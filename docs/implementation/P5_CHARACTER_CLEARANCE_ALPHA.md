# P5 Character Clearance Alpha

## Scope

This alpha makes room entry a session-level flow: choose a local character or
enter a quick draft, submit it to the room host, receive a binding and clearance
decision, then mark ready before entering as a player.

## Entry Semantics

- Joining a room does not itself make a member a player-ready participant.
- A player requires an approved binding, approved session admission, and ready
  state before the Room Runtime entry guard permits player entry.
- Hosts can mark ready and enter without binding a character.
- Spectators join through the spectator route and enter only the read-only
  spectator view; they do not submit a character or ready up.

## Character Sources

The Lobby can read active records from the local Actor Vault for the room's
matching system. That selection is read-only. A quick draft stores only a
display-safe session summary: name, optional short description, HP, and AC.
Neither source writes the character library or creates a CampaignActorInstance.

## Host Review

The host can approve or reject a submitted binding. Rejection can include an
optional note. Approval uses the existing in-memory admission seam and clears
the required ready gate only after approval.

## Persistence Boundary

Bindings, admissions, and ready states belong to the current Room Server
session. They are carried by RoomSnapshot for the lobby and Runtime entry
bridge, but are cleared if the in-memory Room Server restarts. This is not a
campaign membership or long-term character assignment.

## Map Presence

Only an approved, admitted binding becomes a candidate for the existing map
presence bridge. This does not grant token movement, ownership, or character
sheet write access.

Map display follows `P5_TOKEN_RENDERING_CLARITY_PATCH.md`: a cleared entry is
shown as one circular token with external status information, not a cluster of
avatars or a character-sheet projection. When a host places that approved room
binding, its room member and binding links allow the Room Server to verify that
only the same active player may move that token.

## Explicitly Deferred

- Full character builder and rule legality validation.
- Persistent campaign-character membership or runtime actor instances.
- Persistent token ownership, automated combat, and rules automation.
- Database persistence and account/auth changes.
