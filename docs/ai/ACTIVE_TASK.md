# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.
> Do not store long prompts or audit reports here.
> Use symbols and landmarks; do not write fixed line numbers.

## Task

- ID: Host Free Token + Persistent Actor Vault Entry v1
- Name: `HOST_FREE_TOKEN_PERSISTENT_ACTOR_VAULT_ENTRY_V1`
- Goal: Restore two core tabletop paths: hosts may create standalone Tokens
  without an admitted character, and active participants may always choose or
  replace their room character from the Actor Vault.
- Phase: P0 Runtime / lobby regression fix
- Status: Done

## Product Contract

- Host Runtime Unit panel presents standalone Token creation before linked units.
- A standalone Token requires only a name; size and optional private note remain.
- Standalone Tokens use the existing `manual` source and map event authority.
- Active host/player members retain character entry after submit/approve/Ready.
- Spectators and unapproved members do not gain character submission access.
- Re-submission continues through the existing server path, which returns the
  binding to review and clears stale Ready state.

## Allowed Files

- `src/components/platform/BasicMapBoard.tsx`
- `src/components/platform/RoomLobbyShell.tsx`
- `src/lib/platform/roomLobbyPresentationState.ts`
- `src/lib/platform/roomLobbyPresentationStateSmoke.ts`
- `PROJECT_STATUS.md`
- `TEST_CHECKLIST.md`
- `docs/ai/ACTIVE_TASK.md`
- `docs/ai/TASK_ARCHIVE.md`
- `docs/ai/SYMBOL_MAP.md`

## Forbidden Changes

- Map event payload/authority, Token movement permissions, server APIs
- Actor binding submission/approval/Ready services and room entry guard
- Store, schema, migration, rule data, combat behavior, Campaign Runtime

## Completion Criteria

- Host can create a manual Token directly from compact Runtime with no actor list.
- Linked character/combatant placement remains available and visually separate.
- Active host and player presentation states keep character entry available.
- Spectator, pending member, and closed room states keep it unavailable.
- Lobby presentation smoke, map/room authority regressions, lint, build, and diff
  check pass.

## Verification

```powershell
npm run frontend:verify:room-lobby-presentation
npm run frontend:verify:character-entry-cta
npm run frontend:verify:map-runtime
npm run frontend:verify:actor-presence
npm run lint
npm run build
git diff --check
```

## Result

- Host compact Runtime Unit panel now presents a standalone manual Token creator
  first and linked actor/combatant placement as a separate second section.
- Active hosts and every active player character-flow state retain the existing
  Actor Vault, quick-character, and full-sheet entry actions.
- Spectator, pending-member, closed-room, permissions, entry guard, and server
  submission authority remain unchanged.
- Lobby IA, character CTA, map replay, actor presence, client/server Token
  authority, TypeScript, frontend build, and diff checks pass.
