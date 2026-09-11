# Live play UX redesign V1

Working decisions, 2026-09-10. Frontend composition only; preserve T7–T12,
visibility, permissions and persistence. No commit/push, T13/T14 or Mods.

## A–B. Diagnosis and screenshot evidence

| Screenshot | Pixel/interaction problem | Decision |
|---|---|---|
| 182626 | Campaign creation, counts and AI preparation precede the room entry. Nested cards give every subsystem equal weight. | Collapse creation/preparation; put resume/start room ahead of actor administration. |
| 182604 | Lobby is a tall single-column form. A host who can already enter still sees mandatory-looking character submission. | Compact entry summary + roster; optional host character disclosure; player requirements remain visible. |
| 182611 | Empty review area and technical metadata still consume substantial space. | Hide empty review chrome; keep diagnostics closed and deliberately named. |
| 182617 | Raw sequence/authority terminology occupies the log before any gameplay exists. Chat and game events share one wall. | Chat/game tabs; compact human-readable events; raw details behind explicit diagnostics. |
| 182539 | Host inspector opens by default and leads with empty combat setup, duplicate status and roster. | No initial inspector. Contextual combat panel; encounter strip only while active/paused. |
| 182544 | Architecture prose exceeds a viewport, then duplicates scene/activity already elsewhere. | Move boundaries to help; remove duplicate live overview; provide focused party/character access. |

Main failure: the interface exposes subsystem structure rather than a player's
next action. Controls and consequences are separated by scroll and overlays.

## C. Code and data-flow inventory

`App` → World Server view → `ServerCampaignWorkspace` →
`HostedRoomLaunchPanel` → `RoomLobbyShell` → `RoomRuntimeEntryBridge` →
`RuntimeFullscreenShell`. `JoinCampaignPanel` also enters the same bridge.

- Bridge owns socket, projected room/map/log feeds, scene, selection and T12 HTTP callbacks.
- `BasicMapBoard` owns map presentation/tools; map events stay in their own stream.
- `RoomRuntimeCombatPanel` replays combat and provides existing host manual controls.
- `RuntimeMobileCombatHud` currently exposes the useful turn summary only on mobile.
- `RuntimeActionDock` holds dice, character, D&D actions, scene and notes as popovers.
- `RuntimeDndActionPanel` freezes pending intent and calls T12; `RoomAttackResolutionDetails` reads projected facts.
- `RuntimeActorRosterPanel` and `RuntimeCharacterSheetPanel` mix useful information with architecture prose.
- `RoomRuntimeLogPreviewPanel` combines chat, gameplay and raw metadata.
- Campaign actor source review and acceptance remain in the campaign workspace.
- Separate `CampaignRuntimeShell` includes `RuntimeSlotShell` / `DndRuntimeCombatDevPanel`; its existing `SHOW_RUNTIME_LAYOUT_DEV_PREVIEW=false` gate already keeps that preview out of normal play. Preserve it unchanged.

Integration hazard: combat state currently reaches the bridge through a mounted
inspector child. Closing that inspector can suspend state updates. Derive the
bridge's display directly from the existing projected event replay instead.

## D–E. Mature-product evidence and limits

Official pages inspected September 10, 2026; these are documented interaction
patterns, not a claim of hands-on testing or exact pixel measurements.

- [Foundry player orientation](https://foundryvtt.com/article/player-orientation/): canvas, scene navigation, tabbed sidebars, own-token HUD and hotbar. Borrow stable spatial anchors and immediate actions.
- [Foundry encounters](https://foundryvtt.com/article/combat/): encounter-specific tracker and current/next turn. Borrow context-dependent combat emphasis.
- [D&D Beyond Maps](https://www.dndbeyond.com/posts/1816-the-official-d-d-vtt-navigating-maps-on-d-d-beyond): character/monster access and rolls near the tabletop, shared game log. Borrow the actor → action → visible result loop.
- [Owlbear rooms](https://docs.owlbear.rodeo/docs/rooms/) and [scenes](https://docs.owlbear.rodeo/docs/scenes/): room presence, central scene and dock-based assets; scene configuration stays in dedicated controls. Borrow a quiet default canvas and deliberate setup disclosure.
- [Roll20 toolbar](https://help.roll20.net/hc/en-us/articles/360039674753-Toolbar-Overview) (updated July 21, 2026): grouped select/pan/measure/dice/turn tools, separate GM layers, settings for rare session operations. Borrow role-specific tools and labeled access.

Do not copy branding/artwork, complete layouts, macro scripting, fog/lighting,
inventories, resources or mechanics that this repository does not implement.

## F–I. Target hierarchy and role/context layouts

1. Compact session/scene header, connection status and panel controls.
2. Active/paused encounter: horizontal round/turn/initiative strip. Exploration: absent.
3. Dominant tabletop with existing map tool rail. At most one supporting panel:
   party, character, encounter, activity or preparation. Collapsed by default.
4. Persistent D&D attack strip: acting character + visible vitals → action →
   target → mode → attack. Results stay adjacent; pending retries keep frozen intent.
5. Secondary dice/scene/info/notes remain explicitly accessible without permanent forms.

Player: own actor fixed, character sheet one click, target from map/dropdown,
compact attack loop and chat/game activity. No host administration.

Host live: explicit controlled-actor selector (default current turn), independent
target selection, same attack loop, one-click encounter/adjudication panel.
Host preparation: scene/roster/context/help separate from live encounter controls.
Spectator: tabletop and allowed information/activity, no action controls.

## J. Demotions

- Default-open inspector → closed supporting panel.
- Architecture boundary notes → help/details.
- Raw event payload/IDs/sequence → explicit diagnostics, never normal event rows.
- Lobby host character form → optional details; player admission unchanged.
- Campaign creation and AI preparation → disclosure, room entry promoted.
- Empty/redundant combat, scene and roster overview cards → focused surfaces.

## K. Implementation and verification

1. Recompose shell and derive combat display independently of inspector mounting.
2. Compact persistent action loop, character quick view and structured result summary.
3. Add context-sensitive desktop initiative with existing host callbacks.
4. Separate chat/game activity from debug and keep draft state across collapse.
5. Focus host encounter controls and optional preparation; declutter lobby/campaign entry.
6. Review keyboard/focus/scroll and desktop widths; use real rendered screenshots where available.
7. Run T12/domain regressions, focused UI tests, TypeScript/server/frontend builds.
8. Self-review as new/experienced player, six-combatant host, exploration host and 1440×900 user.

Target viewports: 1440×900, 1920×1080 and 1024×768; narrower fallback checked too.
Final evidence, limitations and exact file/status inventory are recorded in
[the completion report](LIVE_PLAY_UX_REDESIGN_REPORT_V1.md).

## Completion — 2026-09-11

All implementation phases are complete. Live rooms now use `LivePlayShell`;
the separate local preview and its original shell remain unchanged. The map,
persistent actor/action/target controls, conditional initiative strip and one
supporting panel establish the new hierarchy. Chat/game history and explicit
diagnostics share existing projected data without changing visibility.

Self-review fixed quiet target selection versus denied dragging, keyboard token
inspection/focus return, stale sheet vitals, pending-intent display during map
selection changes, HTTP/socket chat deduplication and combat updates while the
inspector is closed. Six combatants remain available in a scrolling encounter
panel at narrower widths.

Validation: 47 browser checks, 42 existing regression commands, six presentation
assertions, TypeScript and frontend/server builds passed. Eleven rendered
screenshots cover player, host, spectator, combat, exploration, lobby and
campaign entry at 1440×900, 1920×1080, 1024×768 and 390×844.

Browser verification uses real production components with deterministic fake
transport; it does not constitute a deployed multi-account integration test.
Sampled focus/contrast checks are not a full accessibility audit. Legacy small
text and crowded narrow-screen map controls remain documented limitations.
No server/domain changes, migration, commit, push or work beyond T12.
