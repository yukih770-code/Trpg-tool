# P5 Room Lobby IA Redesign

## Purpose

The Room Lobby is a multiplayer entry flow, not a diagnostics dashboard. Its
default view answers five questions: which room this is, the member's next
step, who is present, what the host needs to review, and whether table entry is
available.

## Presentation model

`roomLobbyPresentationState.ts` is a pure adapter from the existing room
snapshot and Runtime Entry eligibility into product-facing copy. It does not
approve joins, approve characters, set Ready, or grant Runtime access. The
existing server services and Runtime Entry guard remain authoritative.

The default screen uses one **My Next Step** card, a compact player roster, and
a host-only review queue. Character selection appears only after a player has
joined the Lobby; the submit action is the visual primary CTA once a character
is selected. Pending applicants remain on the separate join-confirmation view,
and spectators do not see character or Ready pressure.

## Host review and room controls

Hosts see one queue combining pending join requests and character submissions.
The queue reuses the existing approve/reject handlers and does not create a
second review path. Character submissions include a collapsed, display-safe
review summary; hosts expand it only when they need basic, combat, equipment,
trait, long-term-effect, or missing-information context. Ready and table entry
appear once in My Next Step; leaving the lobby remains the header action.

## Technical details

Server URL, connection status, raw room identifiers, event sequence, invite
details, errors, and RuntimeLog preview are under a collapsed **Technical
Details** disclosure. They remain available for local troubleshooting without
competing with normal play.

## Closed rooms

When the current snapshot is closed or archived, the same My Next Step card
switches to **房间已解散**. Character submission, Ready, host review, and Runtime
entry disappear; the member can return to the room list. Active hosts see a
confirmed **解散房间** action while the room is open. Disbanding preserves history
and is not a delete action.

## Boundaries

This slice adds no permission action, WebSocket message, database migration,
persistent clearance store, tutorial engine, Combat HUD change, or change to
character, Ready, Runtime-entry, token-ownership, or authentication rules.

## Verification

- `npm run frontend:verify:room-lobby-ia`
- `npm run frontend:verify:room-player-flow`
- `npm run frontend:verify:character-entry-cta`
- `npm run frontend:verify:character-clearance`
- `npm run frontend:verify:token-ownership`
- `npm run runtime:verify:token-ownership`
