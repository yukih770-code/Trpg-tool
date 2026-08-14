# Active Task

> Ephemeral task scope card. Overwrite this file at the start of each task.

## Task

- ID: Embedded Runtime Session AI Drafts v1
- Name: `EMBEDDED_RUNTIME_SESSION_AI_DRAFTS_V1`
- Goal: Embed host-only Session AI into the RuntimeLog surface and add bounded post-session character-biography and quest-log draft workflows without exposing a chat/modal experience or mutating authoritative game state.
- Phase: Internal AI foundation / runtime assistance
- Status: Complete

## Layer Declaration

- IA: Existing Room RuntimeLog contextual panel; no new page, dialog, navigation entry, or global AI center.
- Object: server-projected Room RuntimeLog events and transient host-owned AI suggestion.
- State: UI State, Flow State, Server State, append-only RuntimeLog Persistent Domain State after explicit confirmation.
- Excluded: ActorVaultActor, CampaignActorInstance, RuntimeActor, character sheet, quest state, CampaignObject, GeneratedArtifact, AI Memory, Workshop/publication, background generation.

## UI And Action Declaration

- Page responsibility: read the room timeline and explicitly turn its current projection into a host-reviewed operational or post-session draft.
- Contextual secondary entry: `智能整理`; the workflow expands inline inside RuntimeLog and is not a modal or conversation UI.
- Tasks: preparation, in-session guidance, recap, character biography draft, and quest log draft.
- Character biography requires a host-supplied character focus. It remains prose in RuntimeLog and is never treated as a character-sheet write.
- Confirm is the only persistent action and appends one new RuntimeLog event; discard/collapse does not write.

## Authority, Visibility And Lifecycle

- Every status/generate/confirm request re-checks authenticated active Room host authority on the server.
- Model context is the existing bounded host projection only; room text and host focus remain untrusted input.
- Confirmation fails stale when RuntimeLog changed, is one-shot, and durably appends rather than rewriting history.
- Host chooses `hostOnly` or `public`; public copy is spoiler-conscious but still requires explicit review.

## Allowed Files

- `src/lib/ai/sessionAssistantTypes.ts`
- `server/api/roomSessionAssistantHandlers.ts`
- `server/api/roomSessionAssistantHandlersSmoke.ts`
- `server/ai/roomSessionAssistantSmoke.ts`
- `src/components/platform/RoomSessionAssistantDialog.tsx`
- `src/components/platform/RoomRuntimeLogPreviewPanel.tsx`
- focused client smoke/docs/package scripts only if required
- `PROJECT_STATUS.md`, `TEST_CHECKLIST.md`, `docs/ai/*`

## Forbidden Changes

- Schema/migrations, repository SQL, GeneratedArtifact/AI Memory persistence
- Actor, character sheet, campaign, membership, map, combat, permission, account, Workshop, or public-page writes
- Autonomous/background model calls, chat UI, modal UI, hidden auto-apply, ProposedCommand, rules adjudication
- `output/`, `tools/`, `work/`

## Completion Criteria

- Biography and quest-log tasks validate through shared types, model schema, gateway parsing, server prompt, and focused smokes.
- Biography generation fails closed without an explicit character focus.
- Host Session AI is embedded inline in RuntimeLog with no dialog/backdrop/chat metaphor.
- A draft can be generated, reviewed, discarded, or explicitly appended as host-only/public; stale and one-shot guards remain intact.
- UI copy states that post-session drafts do not update character sheets, quests, or campaign facts.
- Navigation keyword search, TypeScript, server/frontend builds, focused smokes, diff check, docs, and one isolated commit pass.
