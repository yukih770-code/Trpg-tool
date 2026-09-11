# Product IA and reuse audit V1
Completed audit and high-confidence consolidation, September 11, 2026. Code is authoritative; earlier architecture
documents are historical context. Preserve the uncommitted live-play redesign.
No commit/push, migration, T13/T14, Mod or Workshop implementation.

## 1. Scope and current capability map
Traced App's state navigation and imported component graph across src/pages,
src/components, stores, API clients and selected server guards. There is no
client path router for Actor/Token/Scene: App + PlayWorkspace + system shell
view state supplies navigation. The import/write inventory and source baseline
are in product-ia-reuse/component-inventory.json and baseline.json. Imports
describe static reachability; conditional gates below distinguish actual access.

| Area | Reachable surface / entry | Unique job / canonical authority |
|---|---|---|
| Global | App, Home, SystemLibrary, PlayWorkspace | Choose server/system/workspace; navigation only |
| Account/settings | PrivateAlphaLoginPanel, UserProfileSpace, AiSettingsPanel | Auth account, local profile, model preferences are separate scopes |
| World Server | ServerContextBar, ServerProfileBoard, ServerInvitePanel | Membership, invitations, enabled systems/content; worldServerApiClient |
| Administration | PlatformOperationsWorkspace + App settings | Role-gated server operations; existing world policy |
| Cloud campaigns | ServerCampaignWorkspace | Server CampaignRecord/binding; campaignRoomApiClient |
| Local campaigns | CampaignLibraryShell (DND/CoC/CP wrappers) | LocalCampaign store/repository; local preparation and launch context |
| Character library | ActorVaultLibraryShell through all three system shells | Vault lifecycle/import/export; adapters to system stores/cloud sync |
| Character build | Creator, CocCreator, CpCreator | System-specific persistent character construction |
| Character sheet | Sheet, CocSheet, CpSheet | Same system stores as builders; sheet management/read |
| Solo play | Gameplay, CocGameplay, CpGameplay | Local character use/simulation; not live-room authority |
| Room | HostedRoomLaunchPanel, JoinCampaignPanel, RoomLobbyShell | Host/join/admit/ready; room transport/identity |
| Live table | RoomRuntimeEntryBridge → LivePlayShell | Projected RoomMap and RuntimeLog; live server operations |
| Local table | CampaignRuntimeShell → RuntimeFullscreenShell | Local campaign/session log; no equivalence to cloud live truth |
| Campaign combat sheet | DndLiteActorSheetPanel | CampaignActorInstance.overridePayload; T9/T11 derive/review/accept |
| Monster content | DndMonsterTemplateLibraryPanel | Read server templates, explicit create campaign actor |
| Combat | RoomRuntimeCombatPanel; legacy CombatRuntimeTable | Live server versus non-live session preparation; T7 guards partition them |
| Actions | RuntimeDndActionPanel; DndDiceCheckPanel; local Gameplay | T12 intent versus non-live dice/manual application versus local character use |
| Dice | SharedDiceDock; DndDiceCheckPanel; system solo trays | Shared room crypto rolls versus contextual/non-live system checks |
| Scene/map | BasicMapBoard, RuntimeSceneFocusPanel | Board placements versus narrative scene focus (host note) |
| Saved scene | SavedSceneLibraryPanel, SceneRuntimeSnapshotPanel | Room-scoped saved state versus portable JSON snapshot |
| Token | BasicMapBoard, RuntimeTokenInspectPanel | Scene placement/presentation, projected read; not a persistent Actor editor |
| Own runtime sheet | RuntimeCharacterSheetPanel | Read-only admitted/projected summary; not the player's editable Vault record |
| Chat/game log | RoomRuntimeLogPreviewPanel | Same projected RuntimeLog through tabs; diagnostics disclosed |
| Public info/notes | RuntimePublicInfoPanel, RuntimeKeeperNotesPanel, RuntimeManualStateLogPanel | Filtered same live stream; local counterparts use local log |
| Personal content | WorkshopShell → DndPersonalSpeciesPackPanel | Existing personal pack authoring/import; scoped personal API |
| Server content | DndPrivateSpeciesPackEditorPanel | Server-private pack and enablement policy; separate scoped API |
| Documents/community | DocumentLibraryShell, FanPlazaShell, PersonalContentHub | Read-only local/mock repository projections; not cloud asset editors |
| Assets/media | PreviewArt, actorMediaBinding, URL/background inputs | References/previews; no complete reachable asset library editor found |
| Rules/compendium | SystemRuleSourcesShell + system compendium/source views | Read published rules and source status; system-specific material |
| CP market | CpMarket | Existing CP inventory acquisition; not new T13 mechanics |
| Dev | LocalDevIdentitySwitcher, DndRuntimeCombatDevPanel | Dev identity is gated; combat preview gated false |

## 2–3. Canonical capability and UI surface decisions
Frequency: H = frequent live use; M = preparation/session; L = rare configuration.
Role abbreviations: P player/owner, H host, A server administrator.

| Capability | Canonical data / write | Canonical UI | Role/context/frequency | Action |
|---|---|---|---|---|
| Vault character | System store + actorVault bridge/API | Existing system builder + sheet, ActorVaultLibraryShell entry | P/prep/M | KEEP/CLARIFY construction vs use |
| Campaign actor combat definition | Campaign actor override / updateCampaignActor | DndLiteActorSheetPanel | Authorized manager/prep/M | REUSE from campaign and linked live entry |
| Source acceptance | T11 review/accept endpoints | Existing source section in that panel | Authorized manager/prep/L | KEEP |
| Map placement | Board event stream / existing board.addToken | BasicMapBoard placement form | H/prep+live/H | MERGE repeated JSX |
| Token adjustment | Board event stream / updateToken | BasicMapBoard selected-token controls | H/live/M | KEEP; distinguish from Actor edit |
| Token information | Projected token/combatant | RuntimeTokenInspectPanel | All/live/H | KEEP + contextual canonical links |
| Combat participation | RuntimeLog combat state / live append | RoomRuntimeCombatPanel | H/live/H | KEEP + Actor shortcut |
| Authoritative attack | Authored campaign action / declareRoomDndAttack | RuntimeDndActionPanel | Owner/H/live/H | KEEP |
| Own admitted sheet | Projected live facts + admitted summary | RuntimeCharacterSheetPanel | P/live/H | REUSE from header and own token |
| Scene state library | SceneStateDocument / scene-state API | SavedSceneLibraryPanel | H/non-live prep/M | KEEP |
| Scene portable interchange | Same snapshot validator | SceneRuntimeSnapshotPanel | H/non-live prep/L | COMPOSE, not a second scene editor |
| Scene narrative | host.note sceneFocus / appendRoomRuntimeLogEvent | RuntimeSceneFocusPanel | H/live/M | KEEP, different object from saved snapshot |
| Room lobby | RoomSnapshot / room server | RoomLobbyShell | All/session/M | KEEP shared host/join convergence |
| Dice | Existing mode-specific authority | SharedDiceDock / contextual DND checker | All/H | KEEP explicit scope |
| Live activity | Projected RuntimeLog | RoomRuntimeLogPreviewPanel | All/live/H | KEEP |
| Campaign metadata | Cloud or local repository, not interchangeable | ServerCampaignWorkspace / CampaignLibraryShell | H/prep/M | CLARIFY, no ownership migration |
| Personal/server packs | Personal vs world-scoped APIs | Existing respective editors | Owner/A/prep/L | KEEP scope; shared fields possible later |
| Documents | platformDataService block projection | BlockDocumentReader in DocumentLibraryShell | All/read/M | MAP personal-document shortcut |
| Settings | World/auth/model scope | Existing panels via App | Owner/A/L | KEEP |

## 4. Entry-point convergence matrix
| Capability | Entries | Same UI/state/write? | Intentional differences / decision |
|---|---|---|---|
| Vault library | DND, CoC, CP | Same ActorVaultLibraryShell; typed system adapters | Rules/data differ; retain shared library |
| Full character | Library selection, builder completion, character CTA | Same system Sheet/store | Creation wizard is a separate job |
| Campaign combat sheet | Session tools only; campaign list had no editor link | One editor, but misplaced | Hoist canonical dialog; campaign/token/combat/live shortcuts |
| Own admitted sheet | Live header; token had no onward link | Existing read-only canonical panel | Add own-token shortcut; never expose other players' full sources |
| Token placement | Workspace form and live units panel | Same board handler/state; duplicated field JSX and wording | One shared form, different outer shell |
| Room | Hosted launch, join | Same RoomLobbyShell and RoomRuntimeEntryBridge | Entry identity differs, operation semantics same |
| Scene snapshot | File interchange, stored scene | Same validator; different persistence/access | Legitimate complementary views |
| Chat/game history | Lobby preview, live activity | Same component/room feed | Disclosure/context differs |
| Personal documents | My Content cards, document library | Same repository projection, dead-end summary vs reader | Link to canonical reader with return context |
| Private species | Personal editor vs server editor | Different domain scopes/write policy | Not interchangeable despite repeated fields |

## 5. Object lifecycle model
Vault Character is a long-lived owner record; campaign admission freezes a
source snapshot and links a CampaignActorInstance. T11 source acceptance updates
that frozen source only. Explicit T9 fill/save updates the campaign combat
definition. Live projections seed combatants; current HP/conditions/initiative
then belong to live combat. These values do not silently write back to Vault.

A MapToken is a board placement. Candidate placement preserves available
campaignActorId/combatantId/binding identity. Manual placement creates a
scene-local unlinked marker. There is NO reusable Token-definition entity here.
Removing a token removes placement; removing a combatant removes participation.
A monster template can seed a new campaign actor; directly placing its visual
prototype is currently also supported but does not create an Actor.

Scene focus is narrative title/body/map URL carried by a host note. Saved
SceneStateDocument is room-scoped snapshot storage of map/combat, not a global
Scene entity. Changing this ownership would require a separate product decision.

## 6. Creation-path inventory
| Object | Paths found | Verdict |
|---|---|---|
| Character | Per-system new character, library import/copy, builder completion | Shared system stores/adapters; import is explicit lifecycle operation |
| Quick room character | Lobby draft name/summary | Admission-only job; not an editable Vault clone |
| Campaign actor | Name-only createCampaignActor; monster-template create; approved-binding service | Same campaign entity/API/service; different sources |
| NPC/monster | Private content editor/import; template → campaign actor; manual token | Content template, campaign instance, marker are distinct; label explicitly |
| Token | Manual form twice; candidate from campaign/combat/binding/template | One board.addToken; consolidate repeated form UI |
| Combatant | Live placed-token enlist; legacy prep direct/prefill | Different runtime authority scopes; do not merge writes |
| Scene/map | Set narrative focus; board background; save/import snapshot | Distinct state types, currently confusing vocabulary |
| Action | Campaign combat-sheet action form; local rules registry; personal content text | T12 authored actions vs system/content definitions; not silently substitutable |
| Room | Cloud record create; live launch/resume; LAN/local hosted launch; join | Record vs live activation vs membership; retain unique jobs |
| Asset | URL binding, avatar/background selection; repository metadata | No independent complete asset editor found; no new asset model |

## 7. Editing-path inventory
Campaign combat definitions have one complete editor. Builder and sheet both
write parts of the same owner character store: intentional construction versus
ongoing management, with duplicated field presentation but no second store.
Live HP adjustment differs intentionally from persistent initial HP editing.
Token name/size/notes edit placement, not Actor data. Source acceptance is not
sheet save. Scene rename edits stored document; live scene focus edits a note.
Personal/server species fields overlap but have separate ownership and policy.

## 8. Shadow-state inventory
| Finding | Severity | Disposition |
|---|---:|---|
| pendingDndActorSheets overlaid indefinitely on fetched actors | 4 | Remove second saved cache; update accepted server response in canonical hook state |
| Clearing a sheet can reveal stale fetched override | 4 | Fix with same canonical actor update path; test clear/reopen/refetch |
| Non-live CombatRuntimeTable + map/snapshot tools shown for live-owned session | 5/UX | Server T7 rejects writes; suppress incompatible editing and link live lobby |
| Local Gameplay log/runtime, local CampaignRuntimeShell vs live room | 2/4-looking | Distinct local scope; label explicitly, never merge into live |
| Token hpSummary and combatant facts | 2 | Derived display/seed; combat authority remains, no new editor |
| Room frozen summaries vs editable Vault | 2 | Intentional snapshot lifecycle; T11 only explicit source updates |
| JSON import preview vs saved snapshot | 1 | Draft until apply, no second persistent source |
| Personal/mock repository vs cloud services | 5-looking | Clearly identify preview/reference scope; do not migrate/delete data |

## 9–10. Shadow UI and legacy/prototype reachability
BasicMapBoard repeats manual token creation and candidate placement JSX between
runtime/workspace branches (level 3 UI workflow over one handler). Consolidate.
DndLiteActorSheetPanel is the mature campaign editor, not a redundant replacement
for the full owner sheet: it edits a different aggregate and contains T9/T11.
RoomRuntimeCombatPanel and CombatRuntimeTable have overlapping controls but
different live/non-live responsibilities. Keep legacy non-live preparation
capabilities; do not expose that editor for an active/recoverable live session.

DndRuntimeCombatDevPanel is statically imported but gated false in
CampaignRuntimeShell. Do not report it as ordinarily reachable. Gameplay and
CoC/CP solo panels are reachable and provide unique local mechanics. Preserve,
label local scope. Workshop has existing personal pack capability; its empty
public catalog is not grounds to delete the whole entry. Document/community
surfaces use local read-only content; do not pretend they are cloud authoring.

## 11. Deep Token/Actor/Scene findings
No full token Actor editor was found. The main duplication is placement UI and
missing contextual access to the existing campaign combat editor. Prefer a
callback from the already-authorized campaign owner surface through hosted-room
composition, rather than fetching raw campaign records under mere room-host
identity. Only the existing manager entry can supply this capability.
Player's own token may open the same admitted sheet as the header; this must
not grant editing of another player's Vault source. Preserve all visibility.

## 12–13. Preparation/live and navigation
Move campaign combat-sheet access out of the room/session-tools dependency.
Keep one canonical editor instance and selected Actor context. Mount it above
the live table when invoked through a callback, preserving the room connection,
attack pending state and return focus. Live changes do not overwrite combat HP.
Non-live session tools remain for archived/offline record workflows. Contextual
shortcuts do not create alternate editor routes or inferred authorization.

Local/cloud campaigns remain different storage/lifecycle capabilities. A route
merge or automatic copy would exceed this frontend audit. All three system
workspaces already reuse the same library and lobby shells; preserve this win.

## 14. Vocabulary
Create character / Create campaign actor = persistent record.
Place on map = board placement; Place unlinked marker = no Actor created.
Edit campaign combat sheet = persistent campaign definition.
Adjust HP = current encounter; Remove from map = placement only.
Remove from combat = encounter membership only.
Open admitted sheet = read-only runtime summary, not full owner-source edit.
Saved scene = room-scoped snapshot; Current scene = live narrative focus.

## 15–16. Reuse priorities and high-risk writes
1. Fix saved-override cache/clear inconsistency using the existing campaign hook.
2. Reuse DndLiteActorSheetPanel with selected-entry context and optional local-use callbacks.
3. Reuse its manager-owned dialog for campaign, token, combat and host quick access.
4. Suppress legacy session mutations for live rooms; retain actor preparation independently.
5. Merge token placement forms; retain manual marker speed and candidate linkage.
6. Map own-token sheet and personal documents to existing readers.
7. Label solo gameplay scope and review remaining duplicates.
No server registry, resolver, persistence or permission rewrite is needed.

## 17–20. Keep, shortcut, merge, disappear
Keep multiple read-only HP displays, per-system sheets, quick admission drafts,
public/private content scopes, local/offline tools and snapshot interchange.
Token/Combatant → Actor and own-token → admitted sheet become shortcuts.
Personal document summaries become links to the canonical reader.
Merge the two manual placement forms and candidate lists within BasicMapBoard.
Remove the independent saved override cache and the misplaced full editor from
session tools. Do not remove a whole unique feature based only on similar labels.

Old→canonical capability parity:
- Campaign editor retains identity, defenses, abilities, saves, skills, actions,
  resources, notes, clear/save, derivation and T11 review/accept.
- Non-live use/add-to-combat shortcuts remain when a non-live session exists;
  live context uses existing authoritative action/enlist controls.
- Placement retains name, size, host notes, candidate source and locate behavior.
- Document reader retains projection and permission filtering; shortcuts cannot
  grant owner access or bypass visibility.

## 21. Expected maintenance gain
Delete the saved override cache and repeated placement JSX. Reuse the existing
large editor rather than introducing a second persistent form. Small callback
and focus plumbing may add lines; report measured deltas from this task's source
baseline separately from the prior uncommitted redesign. Do not count tests or
documentation as production-code deletion.

## 22. Implementation and acceptance phases
A. Audit all navigation/import/write families and record canonical decisions (this document).
B. Fix canonical actor state and relocate/reuse the full existing editor.
C. Connect role-safe Actor/own-sheet entries; consolidate token placement and lifecycle language.
D. Map document entry; isolate misleading non-live controls; retain unique capabilities.
E. Browser-test all new entry points, save/clear/reopen, permissions, return context,
   placed-token/combat linkage and existing attack flow. Capture screenshots.
F. Run TypeScript/build/server build, relevant regression suites, then repeat
   duplicate/import/write searches and report remaining debt honestly.

Research: [Foundry Actors](https://foundryvtt.com/article/actors/) distinguishes
Actor ownership and its sheet; [Foundry Tokens](https://foundryvtt.com/article/tokens/)
distinguishes prototype and placed tokens. Borrow explicit lifecycle/linked
access, not its domain model. [Roll20 Journal](https://help.roll20.net/hc/en-us/articles/360039675133-Journal)
connects character sheets and linked tokens. [Owlbear Scenes](https://docs.owlbear.rodeo/docs/scenes/)
keeps scene contents together. [D&D Beyond Maps encounters](https://dndbeyond-support.wizards.com/hc/en-us/articles/46385529638164-Combat-Encounters-on-Maps)
provides token-to-stat-block access and distinguishes encounter removal from
map removal. These official sources support interaction principles, not claims
about the products' internal component reuse.


## Implementation closeout and repeated-search findings

Phases A–F are complete for the high-confidence changes. Campaign, linked token,
combatant and live preparation now open the same existing campaign combat sheet.
The same creation form is composed into its dialog for live improvisation; it
creates a CampaignActorInstance and selects it in the canonical editor. Saving
updates the accepted record in useCampaignDetail; no saved-sheet overlay remains.
Workspace and live map placement now render one form/candidate implementation.
Own-token access opens the existing admitted sheet; personal documents open the
existing BlockDocumentReader. Live-owned rooms no longer show the incompatible
non-live session editor. Solo use is explicitly scoped to the local character.

The repeated inventory covers 462 source files and 130 TSX component/page files;
it is static evidence, not a claim that every conditional branch ran in a browser.
Final measured production delta versus the task-start source baseline is
163 lines added / 86 removed across 13 files, net +77. No new production component,
store, API client, dependency or backend endpoint was introduced. Long existing
JSX lines make raw line savings a weak measure; two entry branches now share the
placement implementation and four Actor entrances share the mature editor.

### Remaining findings, classified rather than hidden

| Finding | Level / priority | Why it remains / next decision |
|---|---|---|
| Creator spell selection and Gameplay spell-manager modal edit the same DND spellbook | 3 / P1 | Real residual shadow editor: source availability, personal spells and preparation limits disagree; unify only after choosing a shared supported rule/source contract, preserving both capabilities |
| Creator/Sheet and CoC/CP equivalents edit portions of the same owner store | 2–3 / P1–P6 | Construction and ongoing sheet use have different jobs; overlapping persistent field UI still deserves shared sections, not a new whole-character editor |
| Room host entering directly through JoinCampaignPanel lacks campaign editor callback | 1 / access gap | Room hosting alone is not campaign-management authorization; authorized campaign launch supplies the capability, direct join does not infer it |
| Unbound campaign NPC placement does not automatically gain T10 AC/initiative projection | Intentional existing authority limit | Existing projections cover approved room bindings; placement preserves Actor linkage/HP seed, but authoritative runtime values remain controlled by existing paths |
| Scene focus vs saved scene vs local/cloud campaigns | 2 / ownership decision | They own different records/scopes; a single persistent Scene/Campaign home requires a product/domain decision |
| Personal/server species pack forms | 2 / P6 | Same field vocabulary, different ownership/validation APIs; common fields can be extracted later |
| Document/community/library previews and empty catalog sections | 5-looking / navigation debt | Existing read/discovery/import jobs are not proven redundant; public catalog alone is an empty state, not a second authoring system |

The spell issue corrects the earlier broad description of builder/sheet overlap:
construction versus use explains the outer pages, but it does NOT justify two
incompatible spellbook management implementations. No rule change was smuggled
into this consolidation. Remaining decisions do not block the completed safe fixes.

Validation: 39 new browser checks, 47 existing live browser checks, 54 regression
commands (42 existing + 12 additional), six presentation checks, TypeScript,
frontend production build and server build all passed. Screenshots and raw
results are in product-ia-reuse/. Backend diff is empty. The comprehensive
PRODUCT_IA_REUSE_REPORT_V1.md contains exact scope, evidence, remaining debt and
explicit A–E answers. No commit, push, staging, cleaning or migration performed.
