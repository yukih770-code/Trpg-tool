# User journey IA audit V1

September 11, 2026. Second-pass audit; current worktree is authoritative. Preserve prior live/reuse changes and T7–T12. No staging, commit, push, spell consolidation, T13/T14, Mod or Workshop work.

## A. Executive journey verdict

Feature legitimacy did not establish correct priority. The screenshots show a host's optional character section expanding into four competing actions and temporary manual fields; campaign preparation leads with AI and generic Actor CRUD. Both are valid capabilities placed ahead of the user's immediate decision.

## B. Top journey problems

1. Temporary room-only admission looks like normal character creation.
2. “Host character” implies a special character type; the actual model is GM with an optional ordinary PC.
3. Existing DND creator navigation loses the lobby and offers no automatic selected-character return.
4. Campaign PC/NPC/monster type selection exposes database categories before distinct user tasks.
5. Monster catalog is tied to non-live session tools even though preparation is independent.
6. Empty states recommend quick/manual entry instead of the canonical system creator.
7. IDs and source-binding status compete with actionable participant information.

## C. Capability priority matrix

| Capability | Exists / owner / canonical UI | Primary context | Other access class | Never primary in |
|---|---|---|---|---|
| Server selection | Yes / platform / existing server selector | Enter product | ADMINISTRATIVE policy/settings | Character admission |
| Join invite/code | Yes / room / JoinCampaignPanel | Invited player | ADVANCED endpoint diagnostics | Live table |
| Existing character choice | Yes / Vault / lobby picker over existing index | Unbound player | CONTEXTUAL GM also plays PC | GM-only entry |
| DND character creation | Yes / system / Creator | Empty DND library | SECONDARY existing-character picker | Permanent lobby fields |
| Host entry | Yes / room / existing guarded runtime action | GM | PRIMARY | N/A |
| GM also plays a PC | Yes / ordinary admission | None | SECONDARY optional disclosure | GM default |
| Temporary character | Yes / existing binding draft | None | ESCAPE HATCH “More options” | Default character path |
| Temporary HP/AC | Yes / submitted summary | None | ADVANCED explicit disclosure | Default lobby |
| Manual character ID | Existing input does not supply quick-draft submitted actor identity | None | Remove unused input from normal flow | Player/GM onboarding |
| Spectate | Yes / room role | Spectator joining | SECONDARY join choice | PC editor |
| Readiness/review | Yes / server / current lobby | Relevant pending/approved state | CONTEXTUAL | Unrelated setup |
| Campaign player roster | Yes / CampaignActorInstance | Campaign cast overview | CONTEXTUAL participant status | Generic PC row creation |
| Add player character | Yes / owner Vault + admission | Invite/select/create through room | SECONDARY to campaign preparation | Manual generic Actor CRUD |
| Create NPC | Yes / campaign / existing sheet | NPC preparation | CONTEXTUAL live preparation | Room player entry |
| Add monster | Yes / catalog → campaign Actor | Monster preparation | CONTEXTUAL live improvisation | Generic type selector |
| Custom monster | Yes / campaign / existing sheet | None | ESCAPE HATCH catalog alternative | Default catalog path |
| Manual PC placeholder | Existing campaign record creation | None | ADVANCED planning exception | Normal PC onboarding |
| Campaign sheet | Yes / existing DndLiteActorSheetPanel | Selected campaign Actor | CONTEXTUAL token/combat | Default lobby |
| Source review/acceptance | Yes / T11 / existing sheet | Source warning/review | CONTEXTUAL; detail ADVANCED | Generic cast status |
| Place linked Actor | Yes / map / BasicMapBoard | Map preparation | CONTEXTUAL live | Character creation |
| Unlinked marker | Yes / scene placement | None | ESCAPE HATCH placement tools | Actor creation |
| Combat/action/turn | Yes / server runtime / existing live controls | Active encounter | CONTEXTUAL | Lobby |
| Dice/chat/activity | Yes / room stream / existing docks | Relevant live task | SECONDARY/history | Character admission |
| Saved scenes/import | Yes / current room snapshot lifecycle | Scene preparation | ADVANCED import/export | Default lobby |
| AI assistance | Yes / existing assistant panels | Explicit assistance task | SECONDARY collapsed | Ahead of preparing cast |
| Personal/server content | Yes / existing scoped editors | Content management | ADMINISTRATIVE server enablement | Normal room entry |
| Documents/community | Yes / existing reader/discovery | Reading/discovery | SECONDARY outer navigation | Live primary action |
| Account/preferences | Yes / existing settings | Account task | ADMINISTRATIVE | Live primary action |
| Raw IDs/log payload/source hash | Yes / diagnostics | None | DEVELOPER/DIAGNOSTIC | Normal journey |

Classes apply per context: one intended priority for each capability on a given screen. No measured usage percentages are available; next-30-second relevance is a design hypothesis validated through task walkthroughs, not invented analytics.


### C.1 Current priority versus intended access

This expands the owner/UI inventory above. A dash means the capability has no intended access at that level; classes are assigned per context, not globally. “Before” means the inspected starting worktree.

| Capability | Should exist? | Canonical owner | Canonical UI | Primary where? | Secondary where? | Contextual where? | Escape hatch where? | Advanced where? | Never appear where? | Before → intended here |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Server/campaign selection | Yes | Platform | Existing workspace navigation | Outer entry | Live return | Selected server | — | — | Mandatory PC creation step | Retain primary outside play |
| Campaign creation | Yes | Platform | Existing campaign form | Empty campaign list | Existing campaigns | Manager | — | Raw system fallback | Live table | Retain contextual disclosure |
| Open/resume lobby | Yes | Platform room | HostedRoomLaunchPanel | GM campaign return | — | Recoverable room | — | — | Character editor | Retain primary |
| Manual room record | Yes | Campaign persistence | Existing room form | — | — | — | — | Campaign room records | Main live-entry CTA row | Permanent form → Advanced disclosure |
| Join/invite | Yes | Platform room | JoinCampaignPanel | Invited player | Spectator option | Room status | — | Endpoint overrides | Active combat action row | Retain role-aware primary |
| Existing PC | Yes | System Vault | Lobby picker | Returning/unbound player | GM-PC disclosure | Approved replacement | — | — | Host-only prerequisite | Four equal choices → emphasized with saved records |
| New D&D PC | Yes | D&D | Creator | Empty library | Existing-PC picker | D&D room context | — | — | Permanent lobby stat form | Detached navigation → canonical dialog/selected return |
| GM only | Yes | Room membership | Guarded entry button | Host lobby | — | Active host | — | — | PC-type selection | Ambiguous host identity → direct entry |
| GM plus PC | Yes | Ordinary character admission | Same picker/Creator | — | Optional host disclosure | Host participation | — | — | Separate HostCharacter builder | Special labels → ordinary PC workflow |
| Temporary PC | Yes | Existing room binding | Existing quickDraft submission | — | — | Explicit selection | More joining options | Optional stats | Default character form | Prominent alternative → escape hatch |
| Manual temporary ID | No useful normal input | Existing identifier mapping | No public input | — | — | — | — | Diagnostics only if needed | Ordinary admission | Removed misleading input |
| Spectator | Yes | Room role | Existing spectator join | Explicit spectator journey | Join alternatives | Read-only entry | — | — | Character-required flow | Retain role semantics; demote alternative in PC flow |
| Ready/review | Yes | Server room | Existing next-action/review blocks | Relevant state | — | Pending/approved participant | — | — | Unrelated creation fields | Retain; simplify language |
| Player roster | Yes | Room projection | Existing roster | — | — | Current room | — | — | Ahead of required character choice | Above choice → below current action |
| Personal content attachment | Yes | Personal content + admission | Existing pack selector | — | Optional disclosure | D&D admission | — | Versions in content tools | Default required choice | Always shown → optional disclosure |
| Add campaign PC | Yes | Owner Vault/admission | Existing room path | Player recruitment | Cast task | Campaign manager | — | Explicit preparation placeholder | Generic name/type PC creation | Generic CRUD → invite/owner selection guidance |
| Create NPC | Yes | Campaign | Shared Actor creation + sheet | NPC preparation | — | Authorized live prep | — | — | Player room entry | Generic CRUD → named task |
| Add monster | Yes | Catalog/campaign | Existing monster panel + shared sheet | Monster preparation | — | Authorized live prep | Custom monster | Template administration | Player character creation | Buried catalog → selection-first contextual dialog |
| Campaign sheet | Yes | Campaign Actor | DndLiteActorSheetPanel | Selected D&D Actor | — | Token/combat/cast entry | — | Override management | Non-D&D fake sheet | Retain canonical editor; system guard |
| Source review | Yes | T11 | Existing review controls | — | — | Source change/warning | — | Hash/payload detail | Generic cast row | Keep meaningful warning, remove raw row status |
| Map placement | Yes | Room/map | BasicMapBoard shared controls | GM map prep | — | Authorized live map | Unlinked marker | Geometry/configuration | PC admission | Retain prior consolidation |
| Scene operations | Yes | Room scene state | Existing scene controls | Scene preparation | Saved scenes | Selected scene | Local import fallback | Import/export | Default join | Retain scoped management |
| Combat / attack / HP | Yes | Authoritative runtime | Existing live controls | Active encounter | — | Role/turn/target | Host manual adjustment | — | Campaign definition as live truth | Retain T7–T12 |
| Chat / rolls / history | Yes | RuntimeLog | Existing docks | Chosen live action | History drawer | Current room | — | Raw payload diagnostics | Character onboarding | Retain prior live hierarchy |
| AI assistance | Yes | Existing AI flows | Existing assistant panels | Explicit assistant task | Collapsed preparation | Selected content | — | — | Ahead of cast preparation | Prominent prep block → secondary |
| Documents/content | Yes | Existing scoped content | Canonical reader/hubs | Reading/authoring | Outer navigation | Selected document | — | Imports | Duplicate inline reader in lobby | Retain prior reuse |
| Server policies/catalog administration | Yes | Platform/server | Existing settings/catalog tools | Administrative task | — | Authorized manager | — | Template edit/import | Monster selection default | Management fields → Advanced in picker |
| Accounts/preferences | Yes | Platform identity | Existing settings | Account task | Outer navigation | Signed-in context | — | — | Required game action | Retain administrative owner |
| LAN setup | Yes | Connection infrastructure | Existing LAN panel | — | — | Local connection task | — | Collapsed connection setup | Ordinary lobby | Retain demotion |
| Raw runtime/source IDs | Yes for diagnosis | Existing contracts | Technical details | — | — | Meaningful failure detail | — | Developer/diagnostic | Normal character choice | Retain diagnostic disclosure |

No usage analytics were available. These placements follow task relevance and observed control competition, not a claimed percentage of users.

## D. Journey friction matrix

Decision counts describe visible competing choices, not measured clicks or completion rates.

| Journey | First screen / goal | Current decisions and friction | Recommended next path / reuse |
|---|---|---|---|
| A New player | Invite/join → play | Join role, four character CTAs, source categories, temporary values; creator leaves flow | Join → existing or canonical create → selected character → explicit submit/review/ready |
| B Returning player | Lobby → use existing PC | Character choices compete even when binding exists | Current character and readiness first; change character secondary |
| C New GM | Empty campaign → first game | Room record, generic actor name/type, AI compete | Prepare cast with NPC/catalog actions; room invite explains player participation |
| D Returning GM | Campaign → resume | Existing resume already promoted | Preserve resume; preparation stays one click away |
| E GM preparation | Cast/map → ready | PC/NPC/monster are one CRUD choice; catalog buried | Group cast; NPC creation, monster catalog and player invite have distinct entrances |
| F Live GM | Table → another goblin | Generic name/type form in shared actor dialog | Add monster catalog/custom or NPC → same Actor sheet → table placement |
| G Host-only | Lobby → run game | Optional host section still presents a special character concept | Enter as GM; no character required |
| H GM-PC | Lobby → run and play | “Host character” suggests separate identity | “I also play a character” → same player selector/creator |
| I One-shot player | Lobby → temporary participation | Quick draft is overly prominent; unclear retention/conversion | More options → temporary → minimal name → optional advanced stats; honest room record scope |
| J Spectator | Join → watch | Must not be routed into PC creation | Existing spectator role → guarded read-only entry; no character requirement |

Flow exits: creator completion/cancel returns to the mounted lobby; monster selection creates a campaign instance and returns to the same selected Actor editor. Existing rejection/ready/room-close behavior stays server-owned.


### D.1 Decision and continuation walkthroughs

Counts below are design counts of branch decisions (not every field in a legal character builder). “Concepts” counts task-level nouns exposed at entry. They are estimates from the inspected UI, not usability-study measurements.

| Journey | Before branches / concepts → after | Primary decision and action | Secondary / escape options | Exit / return | Architecture exposure and predictability |
|---|---|---|---|---|---|
| New player | 4 competing character entrances / ~7 concepts → 2 / ~3 | Existing or create; empty library emphasizes create | Temporary and spectator under More | Creator cancel/complete returns to lobby; completion selects saved PC | No HP/AC/ID knowledge required; submit → approval → ready explicit |
| Returning player | 4 entrance choices / ~6 → 1 current-character decision / ~3 | Use approved PC and ready; otherwise pick saved PC | Replace character in disclosure | Table returns to same lobby | Local/cloud provenance still visible, but IDs are handled internally |
| New GM | Name/type/create plus room/AI / ~7 → 3 cast jobs / ~4 | Open lobby to recruit players; choose NPC or monster for preparation | PC placeholder/custom monster; room records Advanced | Saved NPC opens same sheet; close returns to campaign | Record versus live lobby remains available but no longer equal priority |
| Returning GM | Resume versus other campaign tools / ~4 → 1 immediate action / ~2 | Resume existing lobby | Preparation and room management | Lobby → table → lobby | Existing continuity preserved |
| GM preparation | Generic 3-way backend type / ~6 → 3 named user jobs / ~4 | Add PCs, create NPC, select monster | Custom monster; template management Advanced | Catalog result opens selected campaign sheet | Persistent definition and map placement remain separate tasks |
| Live improvisation | Generic type/create/editor / ~5 → selected task/catalog/editor / ~3 | Preparation → monster/NPC → existing sheet | Custom monster | Dialog closes to still-mounted table, then shared placement | No runtime cache or alternate save truth introduced |
| Host only | Host character's 4 branches / ~5 → 1 primary action / ~2 | Enter as GM | Optional “I also play a character” | Existing table entry | No PC requirement or special host character object |
| GM-PC | Host-specific 4 branches / ~6 → optional disclosure then 2 / ~3 | Choose or create ordinary PC | Temporary fallback | Same saved-ID return; ordinary submission | Host membership remains unchanged |
| Temporary player | Quick draft plus 5 manual inputs / ~7 → explicit More choice + name / ~3 | Choose temporary, name, submit | Stats Advanced; canonical create always reachable | Existing review path | No library save or automatic conversion promised; room record may persist |
| Spectator | Join-role choice / ~2 → 1 explicit role choice / ~2 | Join as spectator, enter | Return to joining page to change intended role | Existing read-only table | No character or ownership prerequisite |

### D.2 “Why is this here?” screen review

| Screen/block | Next-30-second justification | Final disposition / evidence |
|---|---|---|
| Empty player picker | Needs a character to submit | Create emphasized, above roster; new-player-empty.png |
| Selected PC summary | Needs to verify and submit selected character | Explicit submit; created-character-return.png |
| Host next action | Needs to run the table | Enter as host, optional PC collapsed; host-only.png |
| Roster | Needs awareness of others, after own entry decision | Below character decision; does not set ownership |
| Temporary scope | Needs to understand what will be saved | Visible after explicit temporary choice; temporary-explicit.png |
| Manual stats | Only needed for uncommon temporary summaries | Advanced, closed |
| Campaign rooms | Returning GM needs resume; new GM needs lobby | Open/resume retained; manual record form Advanced |
| Empty cast | GM needs next preparation job | Player/NPC/monster task entrances and per-group guidance |
| Populated cast | GM needs to find a person or creature | Grouped by task, shared editor buttons |
| Monster picker | GM needs a monster instance now | Select/search and prominent Add; template administration Advanced |
| Live preparation | GM needs contextual changes without losing encounter | Same campaign dialog above mounted table |
| Technical details | Helps diagnose a connection/source issue | Remains closed outside deliberate inspection |
| Outer system creator | Needed for legal character decisions | Canonical component retained; dense builder itself not redesigned |
| Document/content/account screens | Distinct reading, authoring and identity jobs | Existing owners retained; no new lobby copies |

## E. Screen real estate

Lobby: next required action always visible; role-specific character section contextual; temporary and spectator alternatives secondary/escape hatch; manual stats advanced; diagnostics closed. Campaign: cast tasks and relevant people first; AI secondary; technical source state behind details. Live: preserve table/action prominence and contextual preparation. Outer libraries/settings retain unique jobs; do not promote every supported capability.

## F. Character entry findings

CharacterData is owned by the system store. listActorVaultRecords is a read-only index. Local selection synchronizes through ensureLocalActorInCloud before existing submitActorBindingToRoomServer. Approval creates/links the campaign instance; runtime projection, Token and Combatant remain separate lifecycle objects.

Temporary submission uses quickDraft and deliberately omits actorId even if the current manual ID field is populated. It does not create a Vault character. Existing server room persistence can retain the admission record; do not promise deletion at session end or automatic later conversion. No system default HP/AC should be invented.

## G. Host identity

Server entry guard allows active hosts without a character. The ordinary admission API is reused if a host also controls a PC. Thus no “HostCharacter” concept or new role operation is needed; change language/hierarchy only.

## H. Campaign cast

Generic campaign create accepts pc/npc/monster, but those intents differ. Player characters normally come through owner selection/creator and admission. NPCs are campaign-authored; monsters can be seeded from the existing server catalog. Custom monster/PC placeholders remain explicit advanced exceptions. All instance editing converges on the existing sheet. Grouping does not alter actorKind or ownership.

## I. PC / NPC / monster creation findings

PC entry uses owner selection/creator and existing admission. NPC creation uses the existing campaign Actor create operation followed by the canonical D&D sheet. Monster selection reuses the private catalog, preserves its source reference, then opens that sheet. Custom systems retain campaign records without being routed into a D&D editor. No new actor type or creator contract was introduced.

## J. Internal terminology

Demote raw active/source-binding status to task language: ready for play, linked player character, campaign-created character, preparation placeholder. Preserve meaningful missing-source warnings within the selected editor. Remove unused manual ID from temporary input; stats remain available behind Advanced. Do not rewrite technical identifiers in transport/domain objects.

## K. Canonical creator feasibility

Creator already accepts onComplete(actorId), finalizes via finalizeDndLevelOneCharacter, commits through commitCompletedCharacter, and updates the existing Vault index. The current DndWorkspaceShell room callback resets/navigates away, while hosted rooms supply none. A small DND-owned contextual wrapper can reuse Creator with the same store and completion contract, keep lobby state mounted, and return the saved ID. No new platform builder or registry.

An existing unfinished system draft must not be silently reset. Continue it in the canonical creator; starting from a completed character can use the existing resetCreator operation. Cancellation preserves draft data and does not submit admission.

## L. Return/continuation

Mount the DND creator in an existing Dialog above the lobby. On completion, refresh the local index, select returned local ID, and show a saved-to-library status. Submission remains a separate explicit action using existing synchronization/admission. Cancel restores lobby and focus; it never auto-approves or auto-binds. Non-DND systems keep truthful unsupported-context guidance rather than a fake complete builder.

## M. Empty states

An empty DND picker promotes Create character. Other systems direct users to their existing system library/creator and retain explicit temporary fallback. Empty cast explains players join with their characters and offers NPC/catalog preparation. Missing monster catalog content retains the custom-monster escape hatch.

## N. Role hierarchy

Player: choose or create own PC, then submit/ready. GM: enter/run first. GM-PC: optional ordinary character flow. Spectator: enter read-only without character. Host review is visible when actionable; technical details do not substitute for next-action copy.

## O. Research

[D&D Beyond campaign joining](https://dndbeyond-support.wizards.com/hc/en-us/articles/14025808350612-Joining-a-D-D-Beyond-Campaign) offers existing and creator-based character entry from the invite context. [Foundry player orientation](https://foundryvtt.com/article/player-orientation/) distinguishes player identity and assigned character. [Roll20 character creation](https://help.roll20.net/hc/en-us/articles/360046574454-How-to-Create-a-Character/) ties access to the game's permissions and character sheet. [Owlbear rooms](https://docs.owlbear.rodeo/docs/rooms/) separates room participation from tabletop assets. Borrow task continuity and role relevance; do not copy their ownership models or claim measured frequency or internal component reuse.


Research distinction: Foundry itself supports a name/type Actor dialog; its existence is evidence that generic CRUD can be legitimate in an Actor directory, not proof it belongs at the start of player admission. Its system defines Actor types/sheets, and prepared Actors can be imported from a compendium. This task changes contextual entrances while retaining one editor. [Foundry Actors](https://foundryvtt.com/article/actors/).

Foundry distinguishes scene-specific placed Tokens from their Actor/prototype and explicitly documents linked versus independent resources. That supports preserving object lifecycles rather than collapsing characters and placements for UI simplicity. [Foundry Tokens](https://foundryvtt.com/article/tokens/).

Owlbear's scene workflow organizes tabletop content in scenes. It is not evidence that this product should remove its system character creation or server admission. The transferable inference is to keep preparation/content and room participation understandable as separate jobs. [Owlbear Scenes](https://docs.owlbear.rodeo/docs/scenes/).

The official materials do not establish temporary-character usage frequency, guaranteed creator return behavior across every vendor, or a universal policy for GM-owned PCs. Those remain product-specific; no ownership/admission semantics were imported.

## P. High-confidence implementation

1. Reprioritize lobby character CTAs and host wording; make temporary/manual choices explicit.
2. Reuse canonical DND Creator in a small system-owned dialog wrapper with saved-ID return.
3. Remove unused temporary-ID input; retain optional stats and truthful scope.
4. Reorganize campaign cast by user intent; reuse existing catalog and sheet; promote catalog selection above template editing.
5. Preserve room/admission/current-runtime guards and test creator completion/cancel, existing/temporary/host/spectator, cast/catalog, live return and regressions.
6. Record screenshots, exact changes, limitations and final 29-topic report.

## Q. Explicitly unchanged

No ownership, persistence, admission, permission or visibility changes. No automatic conversion of temporary characters; no new entity. No legal-character or spell rule change. No CoC/CP creator-contract rewrite. No saved-scene ownership change. Preserve original campaign save-race fix, shared placement/editor/reader paths, live table and T12. Existing unusual capabilities remain reachable at deliberate lower priority.

Implementation completed: 42 journey checks, 39 previous reuse checks, 47 previous live checks, 55 behavioral regression commands and six presentation assertions pass. Frontend typecheck/build and server build pass. See USER_JOURNEY_IA_REPORT_V1.md for evidence, limitations and exact changes.
