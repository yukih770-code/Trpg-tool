# P5 Room Player Flow Polish

## Player flow

Room Lobby presents one current state and one next action:

1. Wait for room approval.
2. Choose a local character, make a quick character, or join as spectator.
3. Wait for host review.
4. Ready after the character is admitted.
5. Enter the Runtime table.

An active spectator needs no character and no Ready state. A spectator enters a
read-only table and may view the map and measure, but cannot move Tokens or
edit the map.

## Host flow

Hosts review pending room joins and entry-character submissions, with the
character source, short summary, HP/AC when provided, optional rejection note,
and compact counts for admitted, ready, and spectator members. Approval does
not write to a player's character library.

## Token explanation

An admitted player sees their own placed character as movable. Other player,
monster, NPC, and manual Tokens are explained as host-controlled. If the host
has not placed the admitted character yet, the map tells the player to wait.
These are client affordances only; the Room Server still validates every move.

## Boundaries

This is UI guidance over the existing Room Lobby, admission, ready, and token
control contracts. It does not add a tutorial system, persistent clearance,
public accounts/OAuth, Token ACL management, asset upload, automatic placement,
or combat automation.

## Verification

- `npm run frontend:verify:room-player-flow`
- `npm run frontend:verify:character-clearance`
- `npm run frontend:verify:token-ownership`
- `npm run runtime:verify:token-ownership`

## Combat controls

Combat status can be visible to all table participants, but this slice keeps
turn lifecycle buttons host-managed. It does not infer a player combatant from
display names or bypass the existing readiness and token-control boundaries.

## Character-entry CTA follow-up

`P5_CHARACTER_ENTRY_CTA_ROUTE_FIX.md` adds visible next actions to the
`waitingForCharacter` and pending-membership states. Players can prepare an
existing-character selection or quick draft while pending, then submit only
after membership approval. Spectator entry remains a join-page choice; hosts
may skip an optional host-carried character.

## Lobby presentation follow-up

`P5_ROOM_LOBBY_IA_REDESIGN.md` consolidates the player-flow copy into one My
Next Step card. It does not replace this state model or change approval, Ready,
or Runtime-entry rules; it only removes duplicate dashboards and moves
diagnostic state behind a collapsed disclosure.
