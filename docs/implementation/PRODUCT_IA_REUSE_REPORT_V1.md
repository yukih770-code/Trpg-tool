# Product information architecture and reuse report V1

September 11, 2026 · D:/Download/dnd · Audit and high-confidence consolidation complete.

## 1. Executive verdict

The product already has useful shared foundations: system workspaces share the character library and lobby; live play consumes server projections; campaign combat definitions have a complete existing editor. Its main IA problems are misplaced entrances, unclear lifecycle language, repeated presentation and some independently implemented editing workflows.

This task removed a second saved Actor cache, consolidated map placement UI, and connected campaign, linked token, combatant and live preparation entrances to the same campaign combat sheet. Live improvisation reuses the campaign creation form without leaving the table. Own-token inspection and personal document cards open existing readers. Incompatible non-live tools are suppressed for recoverable live rooms.

The product is not fully deduplicated. DND spell management remains a material independent-editor problem. Direct room join lacks the campaign-management shortcut available through authorized campaign launch. Local/cloud and saved-scene/narrative ownership questions remain explicit. No whole-product UI rebuild was attempted.

Scope: navigation state, imports, stores, API clients, projections, creation/edit handlers and selected server guards across 462 source files, including 130 TSX component/page files. Static inventory is discovery evidence, not proof that every conditional branch ran in a browser. The earlier tabletop-first redesign remains intact.

## 2. Top unnecessary designs discovered

| Design | Problem | Disposition |
|---|---|---|
| Saved-sheet overlay above fetched actors | Could mask later server truth or resurrect an old override after clear | Removed; accepted response updates the canonical collection |
| Campaign editor buried under session tools | Persistent preparation appeared to require a room/session | Reused editor in a campaign-owned dialog |
| Two map placement form/candidate branches | Same write path, independently rendered controls | One shared implementation |
| Non-live tools beside recoverable live room | Suggested mutations that T7 rejects | Suppressed in that context; resume-live entry retained |
| Personal document summary dead end | Reader already existed elsewhere | Open canonical reader and return to hub |
| Solo mechanics with insufficient scope distinction | Local edits could be mistaken for room authority | Added local-character scope text |

No top-level feature was removed without evidence that its unique job was already covered.

## 3. Top duplicated capabilities

| Capability | Severity and result |
|---|---|
| Saved campaign sheet truth | Level 4 second saved truth; fixed |
| Token placement | Level 3 duplicated workflow UI over one handler; merged |
| Campaign Actor access | Missing contextual entrances; now Level 0/1 shortcuts |
| Live-owned legacy session tools | Level 5-looking reachable UI; suppressed for live ownership |
| DND spellbook management | Level 3 remains P1; source availability and preparation rules differ |
| Builder/ongoing-sheet fields | Level 2/3 overlap remains over the same owner stores |
| Personal/server pack forms | Level 2 overlap; separately owned records and APIs |

Level 0 = intentional entrance; 1 = contextual wrapper; 2 = repeated presentation; 3 = independent editor/workflow; 4 = second saved truth; 5 = obsolete/prototype UI exposed as current.

## 4. Canonical capability map

H = frequent live use; M = preparation/session; L = occasional configuration. Ownership below follows the repository.

| Capability | Domain/state and write authority | Role/context/frequency | Action |
|---|---|---|---|
| Server policy/membership/invitations | WorldServer, worldServerApiClient, policy guards | Administrator/server/L | KEEP |
| Cloud campaign | CampaignRecord, campaignRoomApiClient | Manager/prep/M | KEEP |
| Local campaign | LocalCampaign repository/store | Local owner/offline/M | CLARIFY separate scope |
| Character library | Vault adapters/cloud sync and DND/CoC/CP stores | Owner/prep/M | KEEP shared library |
| Character construction/use | Same system owner character, existing store operations | Owner/build/use/M | KEEP outer jobs; reuse fields later |
| Campaign combat definition | CampaignActorInstance.overridePayload, updateCampaignActor | Manager/prep+live/M | REUSE |
| Source derivation/acceptance | Frozen source, existing T9/T11 operations | Manager/prep/L | KEEP |
| Monster content | Server template; explicit campaign-instance creation | Manager/prep/M | KEEP template/instance distinction |
| Map placement | MapToken, board.addToken/map append | Host/prep+live/H | MERGE UI |
| Token adjustment | Placement name/size/notes/location, board controls | Host/permitted controller/live/H | KEEP |
| Combat participation | Combatant, authoritative RuntimeLog append | Host/live/H | KEEP |
| Attack | Campaign action plus actorCombatantId intent, T12 server | Authorized owner/host/live/H | KEEP |
| Own admitted sheet | Admitted summary and current projection, read-only | Player/live/H | MAP header/token |
| Dice | Existing local/non-live/shared mode authorities | Participant/use/H | KEEP explicit scope |
| Chat/activity/RuntimeLog | Viewer-projected room stream, existing append/recovery | Participant/live/H | KEEP |
| Narrative scene | Scene-focus host note, existing room append | Host/live/M | KEEP |
| Saved scene | Room-scoped SceneStateDocument, scene-state API | Manager/non-live prep/M | KEEP actual ownership |
| Snapshot interchange | Validated map/combat snapshot, existing import/export/apply | Manager/interchange/L | KEEP |
| Personal/server content | Separately scoped pack APIs | Owner/admin/prep/L | KEEP scopes; compose fields later |
| Documents/community | PlatformDataService local/mock read projections | Reader/owner/discovery/M | MAP reader entrances |
| Media | URL/binding/preview references | Owner/host/prep/M | No separate asset model added |
| Account/preferences/admin | Existing auth, profile, model and operations services | Owner/admin/L | KEEP unique jobs |

## 5. Canonical UI surface map

| Home | Existing canonical surface | Why retained |
|---|---|---|
| Character library | ActorVaultLibraryShell | Already shared by system adapters |
| Owner character | Creator/Sheet, CocCreator/CocSheet, CpCreator/CpSheet | Mature system-specific construction/use |
| Campaign combat definition | DndLiteActorSheetPanel | Full fields, validation, T9 fill, T11 review/accept |
| Campaign creation | ServerCampaignWorkspace creation form | Existing createCampaignActor handler |
| Map placement/adjustment | BasicMapBoard | Existing board hook, candidate linkage and operations |
| Token inspection | RuntimeTokenInspectPanel | Projected read and keyboard interaction |
| Live combat | RoomRuntimeCombatPanel | Existing authority-safe controls |
| Own runtime sheet | RuntimeCharacterSheetPanel | Existing admitted/projected read contract |
| Live actions | RuntimeDndActionPanel | Intent submission and retry behavior |
| Room lobby | RoomLobbyShell | Hosted/joined room convergence already exists |
| Live history | RoomRuntimeLogPreviewPanel | Shared projected stream, chat and recovery |
| Saved scene/interchange | SavedSceneLibraryPanel / SceneRuntimeSnapshotPanel | Complementary storage/interchange jobs |
| Document reading | BlockDocumentReader | Blocks, references and service projection |
| Content authoring | Existing personal/server pack editors | Preserve ownership-specific policy |

## 6. Entry-point convergence matrix

| Entrances | Same UI? | Same state/write? | Context |
|---|---|---|---|
| Campaign actor row / campaign selector | DndLiteActorSheetPanel | Accepted campaign actor collection / same update | Selected actor or selector |
| Linked token / combatant / live preparation | Same campaign sheet | Same actor ID, save, clear and validation | Explicit source=token/combat/runtime |
| Campaign preparation / live dialog create | Same form and handler | Same CampaignActorInstance | PC/NPC/monster |
| Workspace / live placement | Same placementControls | Same board.addToken/candidate linkage | Outer shell differs |
| Player header / own token | Same admitted sheet | Same projected read; no write | No source editing granted |
| My Content / document library | Same BlockDocumentReader | Same service/viewer projection | Return callback differs |
| DND/CoC/CP Vault library | Same shell | Typed system adapters | Rules/data intentionally differ |
| Hosted launch / direct join | Same room components | Same room operations | Campaign editing only when authorized parent supplies it |
| Creator / solo spell manager | No | Same spellbook store, differing rules/operations | Residual P1 inconsistency |

The Actor entry contract passes actorId and source=campaign/token/combat/runtime. The dialog remains above the mounted live table. No new Actor route, store or raw-data API was introduced.

## 7. Previously inconsistent entrances

There were not four independent campaign Actor editors. The real issue was one mature editor hidden under session tools while token/combat views lacked onward access. Workspace/live placement did render separate forms. Personal document cards stopped at summaries while the library opened the reader.

Builder and solo spell-management entrances still differ materially and are recorded as unresolved.

## 8. Features now unified

Campaign, linked-token, combatant and live-preparation Actor access; preparation/live campaign creation; workspace/live placement; header/own-token admitted sheet; personal-document/library reader.

## 9. Shadow implementations removed

Removed pendingDndActorSheets as a saved-state layer. Removed the second placement field/candidate implementation. Replaced the session-tools embedded campaign sheet with canonical dialog access. Suppressed incompatible legacy controls for live-owned rooms while retaining their non-live capability.

## 10. Implementations intentionally retained

| Repeated-looking surface | User-job justification |
|---|---|
| Owner sheet / campaign combat sheet | The owner maintains a long-lived source; the manager configures a distinct campaign instance. |
| Campaign sheet / live HP controls | One edits a persistent definition; the other adjusts the current encounter. |
| Token/combat/own-sheet HP views | Current permitted state is useful in several play contexts. |
| Quick room character draft | Admission information can be supplied without creating a Vault record. |
| Non-live CombatRuntimeTable | A non-live session still needs its existing preparation tools. |
| Local Gameplay / live table | Local character use remains available without joining a room. |
| Saved scene / JSON interchange | One stores room snapshots; the other transfers a validated snapshot. |
| Personal/server content | Personal packs and server-enabled private packs have different owners and policies. |
| Creator / ongoing sheet | Construction and ongoing use are different jobs; duplicated sub-editors still deserve consolidation. |

The remaining spell manager has no adequate reuse justification; it is debt, not an intentional exception.

## 11. Duplicate creation paths removed

Two independently rendered marker forms and placement lists now share one implementation. Live improvisation reuses the existing campaign creation form. Template import, approved-binding creation and manual campaign creation remain different inputs to the same campaign-instance lifecycle.

## 12. Duplicate editing paths removed

The saved override overlay was removed. Contextual Actor entrances delegate to the same editor and write callback. No token-local or combat-local persistent Actor editor was added. Token presentation editing and encounter adjustment remain because they edit different objects. DND spellbook duplication is still outstanding.

## 13. State-consistency findings

A successful save/clear replaces the matching actor in useCampaignDetail with the accepted server response. The hook invalidates older reads and checks campaign/server scope. An old refresh cannot overwrite a completed save; reopening after clear cannot expose the prior override. Explicit refresh fetches current server truth.

Rejected saves remain unsaved drafts. Campaign definition saves do not overwrite encounter HP or the player's source character. Accepted changes trigger the existing live action/projection reads, not a new projection policy.

Browser checks cover save, rejected save, delayed stale fetch, clear/reopen and changed-server-value refresh. They do not establish new transactional guarantees across arbitrary browser tabs.

## 14. Token lifecycle

MapToken is a scene/board placement. There is no reusable Token-definition entity here. Candidate placement preserves available campaign Actor, combatant or binding identity. Manual placement creates an unlinked marker useful for scenery/traps. Name, size, notes and location belong to placement.

Remove from map does not delete the Actor. Locate finds an existing linked placement. Existing template candidates can place a visual marker without creating a campaign Actor; the persistent monster path explicitly creates an Actor first.

## 15. Actor lifecycle

Vault source → admitted/frozen source and campaign instance → explicit source review/accept → explicit campaign-definition save → live projection/participation. These records have different lifecycle responsibilities.

Campaign creation supports PC/NPC/monster through the existing API. An authorized manager can create one from live preparation, configure it in the same sheet, close to the mounted table, place it and enlist it. No live-only monster record or equipment system was added.

## 16. Scene lifecycle

Current scene focus is narrative host-note data. BasicMapBoard owns map placement/background operations. SavedSceneLibraryPanel stores room-scoped SceneStateDocument snapshots. SceneRuntimeSnapshotPanel imports/exports validated map/combat state. These are not currently one global persistent Scene object.

Campaign-global scene ownership or equivalent saved-scene management from every live entrance requires a separate product/workflow decision. Existing scene API/snapshot regressions pass; this task did not run real-backend saved-scene authoring E2E.

## 17. Combatant/runtime lifecycle

A combatant is encounter participation, linked to an Actor and/or token. The existing placed-token enlist path retains sourceActorInstanceId and mapTokenId. Removing combat participation and map placement are different operations.

T12 remains server-authoritative. The UI submits actor/action/target intent and renders recorded outcomes. Campaign editing supplies definitions; it does not resolve attacks or directly edit live HP. Replay gained no RNG/rules path.

## 18. Preparation versus live play

Preparation owns persistent definitions and content selection. Live play consumes permitted projection and performs current-room actions. Opening the same definition editor during live play does not create another persistent editor.

Recoverable live rooms direct users to resume their lobby/table rather than incompatible non-live mutations. Local play remains a separately labeled scope.

## 19. Navigation changes

Campaign preparation gains sheet access independent of room/session creation. Actor rows preselect their actor. Linked tokens, combatants and live preparation gain contextual links. The table stays mounted; closing the dialog restores focus after the exit animation.

My Content gains a reader entrance. App state navigation and shared system workspaces remain; no new router was introduced.

## 20. Terminology changes

| Previous ambiguity | Current wording |
|---|---|
| Add character record | Create campaign actor |
| DND Lite character sheet title | Campaign combat sheet / 战役战斗卡 |
| Clear local draft despite persistent write | Clear campaign override / 清除战役覆写 |
| Add Token for manual record | Place unlinked marker / 放置独立标记 |
| Candidate Add | Place on map / 放到地图 |
| Remove token | Remove from map |
| Token character access | Open campaign combat sheet or Open admitted sheet according to permission/job |

Internal T9/DndLite types remain. This is not a claim that every historical Lite/Preview label was renamed.

## 21. Full panels converted to shortcuts

The session-tools campaign sheet now opens the same dialog as other entrances. Live-owned sessions direct users to resume the live room instead of incompatible legacy tools. Unique non-live map/combat/snapshot functionality remains.

## 22. Duplicate editors converted to canonical links

No pre-existing token Actor mini-editor was found, so none is claimed removed. Token/combat links now reach the existing campaign editor. Own-token links reach the existing admitted reader. Actual duplicated placement UI was merged; personal document cards map to the existing reader.

## 23. Existing components reused

DndLiteActorSheetPanel, existing Dialog primitives, BasicMapBoard controls, RuntimeCharacterSheetPanel, BlockDocumentReader, RoomLobbyShell, RoomRuntimeEntryBridge and the campaign creation form. Their existing data/validation/permission paths remain authoritative.

## 24. New shared primitives

No new production component, store, adapter, dependency or registry. Two JSX blocks are shared inside their existing components: placementControls and actorCreationForm. Optional props carry selected Actor, source context, authorized callbacks and a request to open the existing sheet panel.

## 25. Canonical winners and no-loss comparison

| Capability | Retained implementation |
|---|---|
| Identity, AC/HP, abilities, saves, skills, actions, resources, notes | Existing campaign sheet |
| Fill, source review, acceptance | Existing T9/T11 sections |
| Save and clear | Existing operations, accepted canonical record |
| Non-live dice/add-to-combat prefill | Retained for valid non-live sessions |
| Live attacks/enlistment | Existing authoritative controls |
| Placement name/size/notes/source/locate | Existing BasicMapBoard handlers |
| Document blocks/entities/media/visibility | Existing reader/service projection |

No working feature was rebuilt just to introduce a cleaner name.

## 26. Code and maintenance cost

Task-start baseline comparison: **13 production files, approximately 163 added lines and 86 removed, net +77**. Normalized line comparison counts moved JSX; long existing lines limit its usefulness as a maintenance metric. No production component file was added in this task.

This task does not claim net code deletion. The gain is one saved-state collection, placement implementation, creation form and complete campaign editor behind multiple entrances.

Production build: 3,449.60 kB single HTML; 821.61 kB gzip; 2,212 transformed modules. No controlled bundle benchmark was taken, so no size improvement is claimed. The full git diff includes earlier uncommitted work and cannot be attributed to this task.

## 27. Before → after workflows

| Workflow | Before | After |
|---|---|---|
| Actor preparation | Find room/session tools | Campaign → selected Actor → complete sheet |
| Live Actor access | Summary without editor route | Token/combat → same sheet → mounted table |
| Live improvisation | Return to campaign to create persistent Actor | Live preparation → same create/configure → place → enlist |
| Accepted Actor state | Overlay could outlive fetched truth | Accepted server record → same reopen/refresh truth |
| Placement | Separate workspace/live forms | One form |
| Own sheet | Header only | Header or own token |
| Personal document | Summary only | Canonical reader → original hub |
| Recoverable live session | Legacy tools looked actionable | Resume live room |

## 28. Mature-product principles

Foundry's Actor and token documentation distinguishes persistent Actor management and placed-token configuration. Borrowed linked access and explicit lifecycle language, not its prototype-token domain model. [Foundry Actors](https://foundryvtt.com/article/actors/), [Foundry Tokens](https://foundryvtt.com/article/tokens/).

Roll20's Journal connects character sheets and token linkage, supporting contextual access to a recognizable character surface. [Roll20 Journal](https://help.roll20.net/hc/en-us/articles/360039675133-Journal).

Owlbear documents scenes as containers for tabletop content; the repository's existing narrative/snapshot split was still preserved. [Owlbear Scenes](https://docs.owlbear.rodeo/docs/scenes/).

D&D Beyond Maps provides token-to-stat-block access and distinguishes encounter removal from map removal. [Maps encounters](https://dndbeyond-support.wizards.com/hc/en-us/articles/46385529638164-Combat-Encounters-on-Maps).

These are observed interaction principles, not assertions about those products' internal component code. Official material reviewed September 11, 2026.

## 29. Screenshots and browser workflows

Six new screenshots were captured with animations disabled and visually reviewed. Eleven existing live-workflow screenshots were regenerated under product-ia-reuse/live-regression. Browser: installed Microsoft Edge through Playwright, using local Vite fixtures.

| Screenshot | Evidence |
|---|---|
| campaign-canonical-editor-1440.png | Selected campaign Actor and accepted state |
| token-canonical-editor-1440.png | Same editor above mounted table |
| canonical-placement-combat-1440.png | Linked new monster placement and participation |
| own-token-canonical-sheet-1440.png | Existing admitted sheet/current projection |
| canonical-document-reader-1440.png | Existing complete reader |
| canonical-editor-1024.png | Selected Actor, tablet bounds, scrolling |

![Canonical Actor editor above live table](D:/Download/dnd/docs/implementation/product-ia-reuse/token-canonical-editor-1440.png)

![Canonical placement and combat participation](D:/Download/dnd/docs/implementation/product-ia-reuse/canonical-placement-combat-1440.png)

## 30. Entry-point tests

The **39 new browser checks** cover all four authorized Actor entrances; selected identity; same headings/state; save/reopen/rejection/clear/stale-read/refresh; source context; modal opacity/focus containment/return; live creation while mounted; configured HP seed and source linkage through placement/enlist; identical marker form; read-only controls; own-token sheet equality; other-player/spectator restrictions; document equality/return; new campaign→Actor→room→live; tablet bounds.

The **47 existing live checks** additionally cover attack actor/target/mode and exact intent fields, pending-target freeze, retry equivalence and single result, chat echo deduplication, projected HP, host/player/spectator controls, movement denial, keyboard inspection, panel coordination and responsive layouts. These are fixture-driven workflows, not deployed two-account E2E.

## 31. Regression/build results

| Verification | Result |
|---|---|
| npm run lint (TypeScript) | PASS |
| npm run build | PASS |
| npm run server:build | PASS |
| Existing regression runner | 42/42 commands PASS |
| Additional affected-domain runner | 12/12 commands PASS |
| Presentation smoke | 6 checks PASS |
| IA browser suite | 39/39; zero exceptions |
| Existing live browser suite | 47/47; zero exceptions |
| Scoped diff --check: src/docs/tests | PASS |
| Server diff / staged index | Empty / empty |

The 42 commands include T12 resolver/kernel/intents/visibility/HTTP/boundaries, replay, combat/map, permissions, reconnect, durability and T9/T10/T11 projection/source/seed. The 12 additional commands cover cloud Actor sync, campaign client, local lobby, scene/snapshot, overrides, campaign sheet, personal content, truthful catalog, binding/campaign linkage, launch authorization and source hash.

Raw results: regression-results.json, additional-regression-results.json, browser-results.json, live-regression/browser-results.json and validation-summary.json under product-ia-reuse. Reproduction: tests/product-ia/README.md.

No database migration, real-user cloud mutation or deployed restart run was performed. Existing visibility expectations were not rewritten.

## 32. Backend/domain invariants

Server diff is empty. T7 ownership, T9 derivation, T10 visibility, T11 source acceptance, T12 attacks, RuntimeLog recovery/replay, concurrent intent idempotency/fingerprints and crypto-backed rolling remain on their existing paths. Current publicShared HP/temporary HP/AC policy remains intact.

Live Actor editing is supplied by the already-authorized campaign manager parent. Room hosting alone does not imply campaign management. Own-token navigation grants no movement/source-edit permission. The inspector gained no raw Actor fetch.

## 33. Remaining justified repeated views

Token/combat/sheet vitals; persistent definition/current encounter adjustment; owner source/admitted read-only summary; quick admission/library record; local/cloud campaigns; narrative scene/snapshot; saved snapshot/interchange; personal/server content. These serve distinct user jobs or lifecycle objects. The inconsistent spell editors are excluded from this justified list.

## 34. Remaining product-owner decisions

1. Choose a shared spell availability/preparation contract before unifying Creator and Gameplay managers. Creator includes personal sources and newer availability mapping; Gameplay has separate class preparation limits/learning behavior. Neither safely substitutes for the other unchanged.
2. Decide whether local/cloud preparation should share a navigation or ownership model; automatic merging changes persistence.
3. Decide whether narrative focus and saved room snapshots become a campaign-level Scene workflow.
4. Define authorized campaign-management access after direct room join, without deriving permission from room host status.
5. Decide whether unbound campaign NPCs gain fuller T10 projection; existing projection covers approved room bindings.

These decisions were not silently made and did not block the completed safe consolidation.

## 35. Remaining IA debt

P1: independent DND spell managers. Compare supported rules/sources, choose the canonical contract, then reuse/extract a winning manager.

P3: direct room-join hosts lack the authorized campaign shortcut. Unbound NPC placement preserves Actor linkage and configured HP seed but does not automatically gain admitted-binding AC/initiative projection; existing host runtime adjustment remains the current-value path.

P4: read-only document/community/content previews and empty catalog categories add navigation weight. No whole section was proven to lack unique reading/discovery/import capability; removing one requires a concrete capability comparison.

P6: repeated builder/sheet fields, scoped content fields and historical terminology can be shared/clarified. App navigation remains state-driven rather than deep-linkable. No generic universal Actor/Scene editor was introduced.

## 36. Exact files changed

Production changes measured against this task's saved source baseline:

| File | Added | Removed |
|---|---:|---:|
| [src/components/platform/BasicMapBoard.tsx](D:/Download/dnd/src/components/platform/BasicMapBoard.tsx) | 22 | 18 |
| [src/components/platform/DndLiteActorSheetPanel.tsx](D:/Download/dnd/src/components/platform/DndLiteActorSheetPanel.tsx) | 9 | 7 |
| [src/components/platform/HostedRoomLaunchPanel.tsx](D:/Download/dnd/src/components/platform/HostedRoomLaunchPanel.tsx) | 10 | 0 |
| [src/components/platform/LivePlayShell.tsx](D:/Download/dnd/src/components/platform/LivePlayShell.tsx) | 8 | 1 |
| [src/components/platform/PersonalContentHub.tsx](D:/Download/dnd/src/components/platform/PersonalContentHub.tsx) | 5 | 0 |
| [src/components/platform/RoomRuntimeCombatPanel.tsx](D:/Download/dnd/src/components/platform/RoomRuntimeCombatPanel.tsx) | 3 | 1 |
| [src/components/platform/RoomRuntimeEntryBridge.tsx](D:/Download/dnd/src/components/platform/RoomRuntimeEntryBridge.tsx) | 18 | 5 |
| [src/components/platform/RuntimeTokenInspectPanel.tsx](D:/Download/dnd/src/components/platform/RuntimeTokenInspectPanel.tsx) | 4 | 1 |
| [src/components/platform/ServerCampaignWorkspace.tsx](D:/Download/dnd/src/components/platform/ServerCampaignWorkspace.tsx) | 50 | 38 |
| [src/i18n/locales/en.ts](D:/Download/dnd/src/i18n/locales/en.ts) | 7 | 7 |
| [src/i18n/locales/zh-CN.ts](D:/Download/dnd/src/i18n/locales/zh-CN.ts) | 6 | 6 |
| [src/lib/campaignRoom/useCampaignDetail.ts](D:/Download/dnd/src/lib/campaignRoom/useCampaignDetail.ts) | 19 | 2 |
| [src/pages/PlayWorkspace.tsx](D:/Download/dnd/src/pages/PlayWorkspace.tsx) | 2 | 0 |

Test changes: existing tests/live-play/preview.tsx gained optional IA fixtures/modes. Added tests/product-ia/browser.mjs, fixtures.ts, run-browser.mjs, verify.mjs and README.md. No production package/dependency change.

Documents: PRODUCT_IA_REUSE_AUDIT_V1.md and this report. Evidence in product-ia-reuse: baseline.json, component-inventory.json, component-inventory-after.json, source-changes.json, browser-results.json, regression-results.json, additional-regression-results.json, validation-summary.json, git-diff-stat.txt, git-status.txt; six screenshots listed above; live-regression/browser-results.json and its eleven live screenshots.

The existing live runner also refreshed docs/implementation/live-play-ux/regression-results.json; its output was copied into this task's evidence. Prior live redesign artifacts remain. LivePlayShell.tsx was already untracked at task start; only the measured increment below belongs to this task.

## 37. Git diff --stat

Full tracked worktree, including earlier live redesign and unrelated scripts/dev-local.ps1. Untracked files are excluded. Use section 26/source-changes.json for this task alone.

~~~text
 scripts/dev-local.ps1                              |  15 +-
 src/components/platform/BasicMapBoard.tsx          |  69 +++--
 src/components/platform/DndLiteActorSheetPanel.tsx |  16 +-
 src/components/platform/HostedRoomLaunchPanel.tsx  |  10 +
 src/components/platform/PersonalContentHub.tsx     |   5 +
 .../platform/RoomAttackResolutionDetails.tsx       |  20 ++
 .../platform/RoomAttackResolutionDetailsSmoke.tsx  |   7 +-
 src/components/platform/RoomLobbyShell.tsx         |   9 +-
 src/components/platform/RoomRuntimeCombatPanel.tsx |  69 ++---
 src/components/platform/RoomRuntimeEntryBridge.tsx | 298 +++++----------------
 .../platform/RoomRuntimeLogPreviewPanel.tsx        | 122 +++------
 .../platform/RuntimeCharacterSheetPanel.tsx        |  49 ++--
 src/components/platform/RuntimeDndActionPanel.tsx  | 217 ++++-----------
 src/components/platform/RuntimeMapStage.tsx        |   6 +-
 .../platform/RuntimeTokenInspectPanel.tsx          |  27 +-
 .../platform/ServerCampaignWorkspace.tsx           | 145 +++++-----
 src/i18n/locales/en.ts                             |  14 +-
 src/i18n/locales/zh-CN.ts                          |  12 +-
 src/lib/campaignRoom/useCampaignDetail.ts          |  21 +-
 src/pages/PlayWorkspace.tsx                        |   2 +
 20 files changed, 443 insertions(+), 690 deletions(-)

~~~

## 38. Git status and worktree safety

The combined worktree has 20 modified tracked files including the unrelated development script. Reports/evidence/tests and earlier live redesign artifacts remain untracked. Exact status: product-ia-reuse/git-status.txt. Index empty; no commit, push, staging, reset, clean or migration.

Preserved scripts/dev-local.ps1, .work/, all .yuki-* directories, Claude outputs/, output/, outputs/, tools/ and work/. Prior live plan/report/screenshots remain. Scoped whitespace checks pass; unrelated work was not cleaned to manufacture a clean status.

## Explicit answers A–E

**A. Are there still independent implementations of the same capability?** Yes. DND spell management in Creator and Gameplay is the clearest Level 3 example. Some builder/sheet fields and scoped content forms are also independent. The changed campaign Actor, placement and reader entrances reuse canonical implementations.

**B. Do entrances still produce materially different UI/behavior?** Yes for spell management and campaign-management availability after direct room join versus authorized launch. Direct join lacks the capability rather than opening another editor. The four authorized Actor entrances tested here share fields, state, save/clear and terminology. Owner source versus admitted summary remains an intentional lifecycle difference.

**C. Do standalone sections remain with no unique capability?** No whole reachable section was conclusively proven to have zero unique capability and left independent on that basis. Empty/preview categories and overlapping discovery entrances remain navigation debt, but read/discovery/import or ownership jobs prevent claiming that deleting the whole section loses nothing. Redundant session placement and incompatible live-owned tools were demoted as described.

**D. Do objects still have multiple authoritative editing paths?** Yes at UI/store-operation level: owner characters can be changed by builder, sheet and solo actions; the spellbook has divergent editors over one store. No new second backend authority was created. Campaign save/clear share one update path; T11 source acceptance is a separate lifecycle operation; live HP is a different aggregate. The second saved campaign overlay was removed.

**E. What else can be mapping/reuse?** Unify spell management after contract parity; share matching character-field sections and scoped content fields; provide campaign shortcuts after an authorized lookup on direct join; consolidate preview/catalog navigation where unique-job comparison supports it; reuse existing snapshot validation if future Scene navigation is unified. Do not introduce another Scene store.

Stopped before T13/T14/Mod/Workshop implementation. No commit or push.
