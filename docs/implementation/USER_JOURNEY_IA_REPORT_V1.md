# User journey and capability priority report V1

September 11, 2026 · D:/Download/dnd · Audit and safe implementation complete.

## 1. Executive journey verdict

The normal D&D room path now starts with selecting or creating a persistent character. Creation opens the existing system Creator, returns to the same lobby, and selects the saved character. Temporary admission remains available under More options. A GM can enter directly without a PC, or optionally use the ordinary player-character flow.

Campaign preparation now asks what the GM wants to do: add player characters, create an NPC, or add a monster. D&D NPCs and monster instances converge on the existing campaign sheet. Monster selection reuses the existing catalog; template administration and custom creation are disclosed separately.

All 128 browser assertions, 55 selected behavioral regression commands, and six presentation assertions pass. Frontend typecheck/build and server build pass. These are deterministic browser integration fixtures plus repository regressions; no real account/database E2E deployment was performed.

The full A–Q audit, broad capability inventory, full priority matrix and ten-journey walkthroughs are in [USER_JOURNEY_IA_AUDIT_V1.md](D:/Download/dnd/docs/implementation/USER_JOURNEY_IA_AUDIT_V1.md).

## 2. What the previous IA audit missed

The previous audit correctly consolidated persistent Actor editing, Token placement and document readers, and removed a second saved-sheet truth. It primarily answered whether a capability duplicated another implementation.

It did not sufficiently distinguish feature existence from priority. Temporary admission can be useful without deserving a primary button beside persistent character creation. A shared Actor model can support PC/NPC/monster records without requiring users to choose a backend type before expressing their task. The earlier canonical surfaces and live tabletop composition remain intact.

## 3. Top misplaced but valid capabilities

| Capability | Misplacement | Result |
|---|---|---|
| Temporary room draft | Competing with normal character creation | Explicit escape hatch; optional stats Advanced |
| GM-PC participation | Presented as a special host-character concept | Optional ordinary PC flow |
| Full character creation | Left room context; no selected return | Existing Creator in a thin contextual dialog |
| Manual campaign PC record | Looked like normal player character creation | Advanced planning placeholder, clearly distinct |
| Monster template management | Dominated the act of adding a monster | Selection first; management Advanced |
| AI preparation | Above cast preparation | Optional disclosure |
| Manual room-record creation | Beside primary lobby launch/resume | Advanced disclosure |
| Participant roster | Ahead of the player's required character choice | Below the current-user decision |

## 4. Capability priority matrix

The complete matrix in audit C/C.1 includes existence, owner, canonical UI, all access classes, prohibited contexts, and before/after priority for 30 capability groups.

| Current task | Primary | Secondary/contextual | Escape hatch | Advanced/diagnostic |
|---|---|---|---|---|
| Player room entry | Saved character; Create when empty | Replace current PC; spectator join | Temporary character | Temporary stats; technical details |
| Host entry | Enter as GM | I also play a character; pending approvals | Temporary participation if explicitly chosen | Connection details |
| Campaign return | Resume/open lobby | Cast preparation | Custom monster | Manual room record |
| Campaign cast | Add PCs / Create NPC / Add monster | Shared selected Actor sheet | Custom monster | PC planning placeholder; template administration |
| Live play | Table and active action | Role/selection-based sheet, combat and preparation | Unlinked marker/manual adjustment | Existing diagnostic payloads |
| Outer product | Relevant library, content, account or campaign job | Contextual links to canonical surfaces | Existing scoped recovery | Administrative policy/import/settings |

Each access class is contextual. No analytics were available to support precise frequency percentages. Recommendations follow observed task relevance and control competition.

## 5. Journey friction matrix

Audit D/D.1 records entry screen, decisions, conceptual load, primary/secondary/escape actions, exits, internal terminology and continuation for all ten required journeys.

| Journey | Before | After |
|---|---|---|
| New player | Four competing entrances, manual fallback, creator navigation loss | Existing or create → saved selection → submit/review/ready |
| Returning player | Repeated creation choices despite an existing PC | Current PC/readiness; replacement disclosed |
| New GM | Generic type/name CRUD plus room/AI choices | Lobby recruitment and named cast-preparation tasks |
| Returning GM | Resume already prominent | Resume preserved; record administration demoted |
| GM preparation | PC/NPC/monster differ only by dropdown | Distinct entrances, shared appropriate editing |
| Live improvisation | Generic creation inside campaign sheet | Catalog/NPC/custom task → same sheet → same table |
| Host-only | “Host character” suggests an obligation | Enter as GM; no character form required |
| GM-PC | Special host-character labels | Optional ordinary selection/creator/submission |
| Temporary player | Manual fields imply normal creation | Explicit temporary choice, scope, name, advanced values |
| Spectator | Risk of competing PC workflow | Existing spectator role → read-only entry without PC |

## 6. New Player before → after

Before: choose among saved, quick, full creation and spectator; full creation reset/navigated away from the lobby. No explicit automatic return or refreshed selection.

After: the empty D&D library emphasizes Create Character. The existing Creator runs over the existing CharacterData store. Completion uses the existing legal-character finalizer and commit, closes the dialog, refreshes the local Vault index and selects the returned ID. The user explicitly submits, then follows existing approval/readiness. No automatic admission was added.

## 7. Returning Player before → after

Before: alternative creation methods competed with selecting a saved PC. After: existing records emphasize selection; an approved binding stays available through the current-character disclosure while readiness is the relevant primary action.

Local-to-cloud synchronization still uses ensureLocalActorInCloud. Browser assertions verify that admission receives the cloud Actor identity, rather than treating a local ID as server identity. Switching from temporary input to a saved character clears leftover temporary stat inputs.

## 8. Host-only before → after

Before: “host character” and host-specific creation labels could imply a separate required entity. After: “Enter as host” is the primary action; the roster describes an unbound host as hosting only. The optional PC section starts closed.

Existing host entry eligibility is preserved. No HostCharacter, extra admission rule or role mutation was introduced.

## 9. Host+PC before → after

The optional section now says “I also play a character.” It uses the same saved-character picker, D&D Creator and ordinary submission as a player. The host remains the host member. Browser tests exercise host-only entry and ordinary PC submission from the host member.

## 10. Temporary Character before → after

The existing quickDraft transport capability is retained. Users select More joining options → Use temporary character; only the name is initially required by the existing UI. Optional summary/HP/max HP/AC are under Advanced.

The copy states that it is for this room, is not added to the Character Library, may remain in the room record after the session, and has no automatic conversion to a library character. The old manual Character ID field was removed: quickDraft submission did not use that value as an authoritative Actor identity.

No persistence expiry, conversion mechanism or legal-character defaults were invented.

## 11. Campaign Actor management before → after

The name/type/create form no longer dominates the cast block. The area groups player characters, NPCs and monsters, showing other existing kinds only when present. Raw “active / pending source” row language was replaced by relevant campaign/linked-character status.

The underlying create handler and campaign Actor API remain unchanged. The actual name form appears after a creation task has been chosen. AI preparation is now optional. Manual room-record creation is Advanced; normal opening/resuming remains visible.

## 12. PC / NPC / Monster creation model

| Intent | Entrance | Result and continuation |
|---|---|---|
| Player character | Invite player through lobby; owner selects/creates PC | Existing approval links campaign participation |
| NPC | Create NPC in campaign or authorized live preparation | Existing NPC record → canonical D&D campaign sheet |
| Monster | Add monster → existing private catalog | Existing template-derived campaign instance → selected sheet |
| Custom monster | Catalog alternative | Existing monster record → same sheet |
| Planning PC placeholder | Explicit Advanced choice | Campaign preparation record; no library PC or player assignment |
| Custom/non-D&D campaign record | Named task using existing record API | Record remains system-neutral; no D&D sheet falsely shown |

Monster source linkage remains private-monster:<template identity> as established by the existing handler. Selection does not itself place a Token or enlist a Combatant. Those remain separate, already-shared map/combat tasks.

## 13. Canonical Character Creator reuse

[Creator.tsx](D:/Download/dnd/src/pages/Creator.tsx) already exposes onComplete(actorId). Its existing finalizer and commitCompletedCharacter own completion. No character fields, point-buy rules, species/class choices, save schema or alternate store were copied into Room.

[DndCharacterCreationDialog.tsx](D:/Download/dnd/src/pages/dndWorkspace/DndCharacterCreationDialog.tsx) is the sole new production component: 30 lines that mount the existing Creator in the existing Dialog. It continues an unfinished draft and uses the existing reset operation only when starting from a completed character. Tests verify that the completed character remains in the Vault.

Other systems have different existing creator completion contracts. Their contextual completion wiring was not rewritten or disguised as complete.

## 14. Entry / return behavior

| Operation | Return behavior |
|---|---|
| D&D creator complete | Same mounted lobby, refreshed picker, newly saved PC selected |
| Creator cancel/Escape | Same lobby and trigger focus; unfinished draft preserved; no submission |
| Monster selected | Same campaign dialog switches to newly created instance's canonical sheet |
| Actor dialog close | Original campaign/live context; existing focus behavior retained |
| Live preparation close | Still-mounted table and encounter |
| Campaign player recruitment guidance | Close dialog and return toward room entry |
| Full browser refresh / non-D&D creator navigation | No new durable navigation state promised |

The continuation is component context, not a new persisted returnTo entity or routing framework. Existing browser navigation and room-close behavior remain responsible for actual page/room exits.

## 15. Features demoted from primary

Temporary character creation, manual temporary stats, host PC participation, template administration, generic PC placeholder creation, AI preparation and manual room records. The roster no longer delays the immediate character decision.

## 16. Features moved to secondary

GM-PC participation, AI preparation and optional personal-content attachment use disclosures. Spectator remains a first-class joining role but is a secondary alternative when already following the player-character path. Existing-character replacement remains available without competing with readiness.

## 17. Features moved to escape hatch

Temporary admission and custom-monster creation. Neither is removed. The manual PC planning record is Advanced and explicitly does not create a library character or assign it to a player.

## 18. Technical concepts removed from normal UI

Removed the temporary Character ID input and generic Actor-type selector from default creation. Replaced special host-character language and raw cast lifecycle status. Simplified user-facing Ready copy.

Necessary source review/acceptance warnings remain in the canonical selected sheet. Local/cloud library provenance and some legacy administrative labels remain; users do not type Actor IDs in the changed normal paths. This task does not claim every technical term across the entire application is gone.

## 19. Existing components reused

Creator; useCharacterStore; the existing Vault index and cloud synchronization; Dialog primitives; RoomLobbyShell and its current readiness/admission operations; DndMonsterTemplateLibraryPanel; DndLiteActorSheetPanel; existing campaign Actor API/handlers; HostedRoomLaunchPanel; shared map placement; existing document readers and live controls.

The prior save-race fix, canonical sheet state, Token linkage, document return flow and server-projected live state all remain covered by regressions.

## 20. New components introduced and why

One: DndCharacterCreationDialog, 30 lines. The wrapper provides modal lifecycle and invokes the existing completed-character reset when necessary. It is D&D-owned and contains no builder fields or room-specific rule implementation.

Across the eight changed/new production files, the measured net increase is 57 lines. Seven existing production files changed; one new component was added. Line counts are an inventory measure, not a complexity claim. [Source footprint](D:/Download/dnd/docs/implementation/user-journey-ia/source-changes.json).

## 21. Duplicate implementation avoided

No RoomDndCharacterCreator, full temporary builder, HostCharacter type, second campaign editor, second Vault, resolver registry or plugin framework. The obsolete DndWorkspaceShell callback that reset/navigated out of the lobby was removed. Two generic creation presentations continue to share one creation form/handler after intent selection.

This pass chiefly reorders and discloses existing UI. It does not claim deletion of a large pre-existing duplicate builder, because none was required for the fix.

## 22. Screenshots / workflows tested

The browser uses actual production React components and deterministic API/socket fixtures. No real user, cloud account or database writes occurred. The new-character workflow seeds a legal ready draft through the fixture, then clicks the actual Creator completion button; this is not an exhaustive manual walkthrough of every character rule option.

New screenshots: empty player library, canonical D&D Creator, saved-character return, host-only lobby, temporary admission, campaign entry/cast, cast groups, monster catalog and tablet player lobby. Prior suites add six canonical reuse screenshots and eleven live screenshots. All nine new screenshots were visually inspected, including the final reordered player screen.

| Suite | Assertions | Evidence |
|---|---:|---|
| New journey integration | 42 | [Results](D:/Download/dnd/docs/implementation/user-journey-ia/browser-results.json) |
| Prior reuse integration | 39 | [Results](D:/Download/dnd/docs/implementation/user-journey-ia/reuse-regression/browser-results.json) |
| Prior live integration | 47 | [Results](D:/Download/dnd/docs/implementation/user-journey-ia/live-regression/browser-results.json) |

Representative images: [Player entry](D:/Download/dnd/docs/implementation/user-journey-ia/new-player-empty.png), [Creator](D:/Download/dnd/docs/implementation/user-journey-ia/canonical-dnd-creator.png), [Saved selection](D:/Download/dnd/docs/implementation/user-journey-ia/created-character-return.png), [Host only](D:/Download/dnd/docs/implementation/user-journey-ia/host-only.png), [Monster selection](D:/Download/dnd/docs/implementation/user-journey-ia/monster-catalog.png).

New tests cover draft cancellation, focus restoration, completed-character preservation, explicit submission, cloud identity, approval-before-readiness, temporary scope/no Vault write, host-only, host-PC, spectator, cast tasks, catalog source linkage, live continuation, tablet bounds and custom-system exclusion from the D&D editor. Prior tests cover new-GM creation/opening, returning-GM resume, placement/enlistment, source save races and live controls.

## 23. Tests / builds

| Check | Result |
|---|---|
| node tests/user-journey/verify.mjs | 55/55 commands pass |
| New/reuse/live browser suites | 42 + 39 + 47 = 128 assertions pass; zero page exceptions |
| tests/live-play/presentationSmoke.tsx | Six assertions pass |
| npm run lint | Pass |
| npm run build | Pass; 2,213 modules; single-file output ~3,460 kB / ~824 kB gzip |
| npm run server:build | Pass |
| git diff --check -- src tests | Pass |
| Whole-worktree git diff --check | Existing unrelated scripts/dev-local.ps1 trailing blank line remains |

The 55-command selection includes canonical level-one finalization, cloud sync, room binding, source review/hash, campaign overrides, T12 resolver/kernel/intents/visibility/HTTP/boundaries, replay, map, ownership, permission, reconnect and durable recovery checks.

Initial validation issues were fixture plumbing, obsolete presentation selectors and modal-transition timing; they were corrected before the final runs. No old visibility or authorization expectation was rewritten. Prior browser tests retain their behavioral assertions and follow the renamed/repositioned controls.

[Regression output](D:/Download/dnd/docs/implementation/user-journey-ia/regression-results.json), [validation summary](D:/Download/dnd/docs/implementation/user-journey-ia/validation-summary.json), and [reproduction instructions](D:/Download/dnd/tests/user-journey/README.md).

## 24. Domain invariants preserved

No server/domain/migration files changed. CharacterData, CampaignActorInstance, room admission, Runtime Actor, Token and Combatant remain separate. Existing PC/NPC permissions, current visibility and exact publicShared projections remain authoritative.

T12 still uses server resolution, actorCombatantId intent, one resolved event, replay without rules/RNG, concurrent intent idempotency, fingerprint conflict behavior and durable log recovery. This pass changes no roller, resolver, projection or persistence code. T7 authority, T9 derivation, T10 projection and T11 acceptance remain unchanged.

## 25. Product-owner decisions still unresolved

No unresolved decision blocks the implemented changes. Deliberately not decided:

- Whether temporary room characters should expire, convert, or gain persistent ownership.
- Whether every system should expose a common contextual creator completion contract.
- Whether PCs should have additional GM-owned creation/claiming semantics.
- Whether standalone direct-join sessions should gain campaign-management authority.
- Whether local/cloud character identity should be unified more deeply.

These require separate product/domain work if pursued.

## 26. Remaining journey debt

D&D has automatic contextual creator return; CoC/Cyberpunk/custom contexts retain existing standalone paths and may require manual return. Custom campaign Actor records do not acquire a system sheet through this change. Monster catalog availability depends on existing private content and permissions; custom creation remains an explicit fallback.

Local/cloud provenance still appears in selection. Administrative system-ID fallback and some legacy “role instance”/source terms remain outside the simplified entry path. The existing D&D Creator has its own dense information hierarchy and is intentionally reused rather than redesigned here. No usage study established actual abandonment rates or completion times.

Standalone join retains the previous limit on campaign-management shortcuts. Live source projection continues to follow existing admission/visibility policy; creating a campaign NPC does not promise automatic authoritative live-stat synchronization beyond existing supported behavior.

Official research is documented in audit O. A useful counterexample is that Foundry supports a generic name/type Actor dialog; this confirms the feature can be valid in its own directory, while its placement here should follow the player's or GM's task. [Foundry Actors](https://foundryvtt.com/article/actors/). No vendor's ownership model was copied.

## 27. Exact files changed

Production:

| File | Change |
|---|---|
| src/components/platform/RoomLobbyShell.tsx | Character priority, creator continuation, temporary scope, host language, roster order |
| src/components/platform/ServerCampaignWorkspace.tsx | Cast tasks/groups, canonical catalog entry, contextual dialog, room-record disclosure |
| src/components/platform/DndMonsterTemplateLibraryPanel.tsx | Selection mode, advanced management, async add state |
| src/lib/platform/characterEntryCta.ts | Ordinary character/temporary/host-only labels |
| src/lib/platform/roomLobbyPresentationState.ts | Task-oriented status text |
| src/lib/platform/roomPlayerFlow.ts | Character/readiness copy |
| src/pages/dndWorkspace/DndWorkspaceShell.tsx | Remove obsolete reset-and-navigate lobby callback |
| src/pages/dndWorkspace/DndCharacterCreationDialog.tsx | New thin canonical Creator wrapper |

Tests: tests/live-play/browser.mjs, tests/live-play/preview.tsx, tests/product-ia/browser.mjs; new tests/user-journey/browser.mjs, fixtures.ts, run-browser.mjs, verify.mjs and README.md.

Documents: docs/implementation/USER_JOURNEY_IA_AUDIT_V1.md and this report. Generated evidence lives only under docs/implementation/user-journey-ia for this pass. The [exact evidence manifest](D:/Download/dnd/docs/implementation/user-journey-ia/evidence-manifest.json) lists every generated screenshot, baseline, result and worktree snapshot.

All listed paths are rooted at D:/Download/dnd. Unrelated scripts/dev-local.ps1 and the pre-existing untracked work/evidence directories were not edited, cleaned, reset or staged.

## 28. git diff --stat

The tracked working-tree diff at verification time is:

```text
 scripts/dev-local.ps1                              |  15 ++-
 .../platform/DndMonsterTemplateLibraryPanel.tsx    |  27 ++--
 src/components/platform/RoomLobbyShell.tsx         | 149 +++++++++++----------
 .../platform/ServerCampaignWorkspace.tsx           |  85 +++++++-----
 src/lib/platform/characterEntryCta.ts              |  12 +-
 src/lib/platform/roomLobbyPresentationState.ts     |  16 +--
 src/lib/platform/roomPlayerFlow.ts                 |   8 +-
 src/pages/dndWorkspace/DndWorkspaceShell.tsx       |   4 -
 tests/live-play/browser.mjs                        |   6 +-
 tests/live-play/preview.tsx                        |   5 +-
 tests/product-ia/browser.mjs                       |  10 +-
 11 files changed, 184 insertions(+), 153 deletions(-)
```

This includes the user's pre-existing script change (8 additions / 7 deletions) and excludes untracked files. This task's tracked changes are 10 files, 176 additions / 146 deletions. The new 30-line production wrapper, test files and documentation are untracked and therefore absent from git diff --stat. Production-only net growth, including the wrapper, is 57 lines. Reordering the roster contributes moved lines to the diff.

[Raw diff stat](D:/Download/dnd/docs/implementation/user-journey-ia/git-diff-stat.txt).

## 29. git status summary

Ten tracked files modified by this task; one tracked user script was already modified. One new production component, five new test/support files, two requested documents and a new evidence directory are untracked.

The existing .work/, .yuki-*, Claude outputs/, output/, outputs/, tools/, work/ and older generated evidence remain. Nothing was staged, committed or pushed. No cleaning/resetting was performed. The complete snapshot is [git-status.txt](D:/Download/dnd/docs/implementation/user-journey-ia/git-status.txt).

## Explicit final answers

**A. Is any uncommon feature still occupying primary workflow space?** The identified room/cast fallbacks no longer compete as primary actions. Some wider legacy creator/administrative surfaces still have hierarchy debt; this report does not claim a complete product-wide elimination.

**B. Is Room still implementing system-specific Character creation instead of reusing the Game System creator?** No new room builder exists. D&D opens the existing Creator. The minimal existing temporary admission summary remains an explicitly different room-scoped fallback.

**C. Can the same Create Character intent still lead to materially different experiences by entrance?** D&D room/library creation uses the same Creator and save rules, with contextual return differing. Other systems do not yet have equivalent automatic return. Campaign NPC/custom-monster creation is deliberately labeled as a different user intent.

**D. Must normal users understand Character ID, source binding, CampaignActorInstance or RuntimeActor?** The changed ordinary entry/preparation paths require no manual internal IDs or backend lifecycle knowledge. Meaningful source-review warnings, provenance labels and administrative diagnostics remain; technical terminology is not universally eliminated across the app.

**E. Are PC/NPC/Monster journeys understandable from user intent?** Yes in the implemented paths: player-owned selection/creation and admission; campaign NPC creation; catalog monster selection or explicit custom alternative. They converge on existing appropriate storage/editor paths without new domain types.

Stopped before spell consolidation, T13, T14, Mod and Workshop work. No commit or push.
