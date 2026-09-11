# Live play UX redesign — completion report

Completed September 11, 2026 in D:/Download/dnd. This report covers the frontend
redesign requested in the attached long-run product brief. The existing T12
implementation is consumed without changing its rules or visibility policy.
No commit, push, staging, migration, T13/T14, Mod or Workshop implementation.

## 1. UX diagnosis

The main problem was information hierarchy: the screens presented subsystem
inventory ahead of the next action. The six supplied screenshots and component
trace showed these recurring failures:

- Campaign creation, counters and preparation competed with starting/resuming a room.
- Hosts who could already enter saw a tall, mandatory-looking character form.
- Empty queues and technical metadata occupied space without helping the next decision.
- A large host inspector mixed combat setup, duplicate room status and architecture documentation.
- Actor, target, action and result were separated across panels and scrolling.
- Chat, gameplay history and raw RuntimeLog diagnostics competed in one surface.
- Repeated bordered cards and explanatory prose obscured priority.

The initial screenshot-by-screenshot diagnosis and full component inventory are
in [the working plan](LIVE_PLAY_UX_REDESIGN_V1.md). The navigation trace was
App → World Server → ServerCampaignWorkspace → HostedRoomLaunchPanel →
RoomLobbyShell → RoomRuntimeEntryBridge. JoinCampaignPanel also reaches the bridge.

## 2. Mature-product references and borrowed principles

Official material was inspected September 10, 2026. These are documentation-based
interaction references, not hands-on product testing or exact pixel comparisons.

| Reference | Principle applied |
|---|---|
| [Foundry player orientation](https://foundryvtt.com/article/player-orientation/) | Stable canvas, scene navigation, side panels and immediate action anchors. |
| [Foundry combat encounters](https://foundryvtt.com/article/combat/) | Raise the initiative/current-turn surface when an encounter exists. |
| [D&D Beyond Maps](https://www.dndbeyond.com/posts/1816-the-official-d-d-vtt-navigating-maps-on-d-d-beyond) | Keep character/monster access, action and recorded result near the tabletop. |
| [Owlbear rooms](https://docs.owlbear.rodeo/docs/rooms/) and [scenes](https://docs.owlbear.rodeo/docs/scenes/) | Quiet scene-first defaults; disclose scene setup deliberately. |
| [Roll20 toolbar](https://help.roll20.net/hc/en-us/articles/360039674753-Toolbar-Overview) | Group role/context tools; avoid exposing rare settings as permanent forms. |

No branding, artwork, exact product layout, unsupported macro system or game
mechanic was copied.

## 3. Before → after information hierarchy

| Before | After |
|---|---|
| Dashboard-like nested panels | Compact session header, dominant table, supporting panel, action region |
| Default-open broad inspector | Panels closed initially; one supporting panel at a time |
| Actions in a secondary popover | Persistent actor → action → target → mode → attack controls |
| Desktop turn context buried in combat management | Horizontal initiative/current-turn strip during active or paused combat |
| Result found in detailed history | Readable inline result plus expandable game-history details |
| Chat, log and raw fields together | Chat/game views, explicit diagnostics disclosure |
| Preparation ahead of room entry | Start/resume promoted; preparation and record management disclosed |

The scene title remains available as context. The large duplicate overview was
removed. Existing map tools and secondary dice/scene/note actions remain accessible.

## 4. Player live-play experience

Players enter with supporting panels closed. Their available actor and projected
vitals sit beside the action controls. Selecting a map token sets the target;
the same target is available through the labeled dropdown. Normal, advantage
and disadvantage sit beside the Attack button. Recorded roll, outcome, damage
and allowed resulting state appear immediately below the action.

Character, party and activity are one interaction away. The character sheet uses
live projected combatant vitals when present, avoiding stale snapshot HP/AC and
avoiding an exact-value fallback when the projection hides a value. Unsupported
resources are not invented to populate the panel.

Pending attacks continue to show their frozen actor/action/target/mode even if
map selection or turn changes. Retry uses the original intent. Exploration
without a combat actor shows concise character/dice access instead of a disabled
attack form. Spectators receive no attack or host-management controls.

## 5. Host live-play experience

Hosts use the same attack loop with an explicit controlled-actor selector.
Actor and target are independent, so selecting an enemy target does not replace
the acting monster. Token inspection also provides a host control action.

The encounter panel contains the existing adjudication controls. Setup, adding
combatants, initiative rerolls and direct raw edits are disclosed; active turn,
pause/resume and end controls remain available in encounter context. Scene,
lobby, help and diagnostics belong to the preparation surface.

Host character admission in the lobby is optional and initially collapsed.
Empty review chrome is omitted. Campaign creation, AI preparation, actors and
room-record tools remain available behind disclosure, with room start/resume ahead.

## 6. Combat-active experience

Active/paused combat adds a horizontal round/turn/initiative strip. Hosts can
advance the turn there. Exploration removes the strip. Combat display is now
derived directly from the existing projected-event replay in the bridge, so
closing the encounter inspector does not suspend updates.

The six-combatant fixture validates player attacks, host NPC attacks, retained
combatants after resolution, next-turn updates and a scrolling narrow encounter
panel. Attack summaries read recorded structured payloads; they do not run rules
or RNG. Existing detailed roll rendering remains expandable.

## 7. Removed, demoted or collapsed

| Surface | Treatment and reason |
|---|---|
| Duplicate room/scene/activity overview | Removed from live composition; the focused surfaces already supply it. |
| Architecture/data-boundary prose | Help/details; irrelevant to a routine action. |
| Raw projected JSON, IDs and sequences | Explicit diagnostics; normal history uses human names, time and outcomes. |
| Empty host review queue | Hidden unless actionable/error context exists. |
| Host character form | Optional disclosure; hosting does not require character submission. |
| Encounter setup/reroll/direct edits | Contextual disclosure; preserve existing manual capabilities. |
| Campaign creation/preparation/record management | Collapsed when appropriate; prioritize room entry. |
| Repeated nested encounter rows/cards | Reduced to tighter grouped rows and separators. |

Source warnings, errors, meaningful visibility badges and existing destructive
confirmation paths remain. The separate local development preview was already
gated by SHOW_RUNTIME_LAYOUT_DEV_PREVIEW=false and is unchanged.

## 8. Exact files changed

All source paths below are relative to src/components/platform/.

| Modified tracked file | Purpose |
|---|---|
| BasicMapBoard.tsx | Live-only panel coordination; keyboard inspection; distinguish target clicks from denied drags; avoid stationary move events. |
| RoomAttackResolutionDetails.tsx | Add compact recorded-result presentation. |
| RoomAttackResolutionDetailsSmoke.tsx | Update obsolete action-label/empty-state expectations; retain privacy assertions. |
| RoomLobbyShell.tsx | Optional character disclosure and empty-queue cleanup. |
| RoomRuntimeCombatPanel.tsx | Focus encounter controls; remove duplicate summary/prose; disclose setup/manual edits. |
| RoomRuntimeEntryBridge.tsx | Compose live shell, initiative, action bar, role panels and direct projected combat display. |
| RoomRuntimeLogPreviewPanel.tsx | Chat/game separation, readable history, explicit diagnostics, draft/echo handling. |
| RuntimeCharacterSheetPanel.tsx | Live projected vitals, metadata disclosure and compact empty groups. |
| RuntimeDndActionPanel.tsx | Persistent compact attack loop, frozen pending presentation and inline results. |
| RuntimeMapStage.tsx | Concise non-D&D empty-state copy. |
| RuntimeTokenInspectPanel.tsx | Keyboard focus/trap/return and contextual host control. |
| ServerCampaignWorkspace.tsx | Promote room entry; disclose creation, preparation and management. |

New source files: LivePlayShell.tsx, LiveCombatStrip.tsx, livePlay.css.

New verification files, all in tests/live-play/:
index.html, preview.tsx, browser.mjs, run-browser.mjs, presentationSmoke.tsx,
verify.mjs.

New documentation: docs/implementation/LIVE_PLAY_UX_REDESIGN_V1.md and
docs/implementation/LIVE_PLAY_UX_REDESIGN_REPORT_V1.md.

New evidence in docs/implementation/live-play-ux/: the eleven PNG files in
section 9, browser-results.json, regression-results.json and
accessibility-results.json. No unrelated work files were changed by this task.

## 9. Screenshots and rendered validation

Real production components were rendered in a DEV-only deterministic fixture
using headless Microsoft Edge/Playwright. HTTP/socket responses were simulated;
campaign read methods supplied fixture data. Each final screenshot was visually
reviewed. This verifies composition and interaction without accessing real rooms.

| Screenshot | Scenario |
|---|---|
| [player-combat-1440.png](live-play-ux/player-combat-1440.png) | Player, six combatants, persistent action loop |
| [player-result-activity-1440.png](live-play-ux/player-result-activity-1440.png) | Inline result and game activity |
| [player-character-1440.png](live-play-ux/player-character-1440.png) | Character panel with live projected vitals |
| [host-combat-1920.png](live-play-ux/host-combat-1920.png) | Host NPC control and combat strip |
| [host-combat-inspector-1024.png](live-play-ux/host-combat-inspector-1024.png) | Narrow encounter panel and contained scroll |
| [host-exploration-1440.png](live-play-ux/host-exploration-1440.png) | Host exploration without permanent combat infrastructure |
| [host-lobby-1440.png](live-play-ux/host-lobby-1440.png) | Optional character entry and concise lobby |
| [spectator-1440.png](live-play-ux/spectator-1440.png) | Spectator permissions/presentation |
| [custom-exploration-1440.png](live-play-ux/custom-exploration-1440.png) | Custom-system empty scene |
| [player-fallback-390.png](live-play-ux/player-fallback-390.png) | Narrow fallback |
| [campaign-entry-1440.png](live-play-ux/campaign-entry-1440.png) | Room resume ahead of disclosed management |

Self-review as new/experienced player and host found and fixed: target selection
incorrectly showing a movement error, stale sheet values, pending-intent display
drift after map selection, chat HTTP/socket echo duplication, keyboard token
inspection and turn updates depending on an open inspector.

## 10. Viewports checked

| State / viewport | Measured table bounds | Viewport fraction |
|---|---|---:|
| Player combat, 1440×900 | 1440×648 | 72.0% |
| Host combat, 1920×1080 | 1920×861 | 79.7% |
| Host encounter panel open, 1024×768 | 714×520 | 47.2% |
| Host exploration, 1440×900 | 1440×750 | 83.3% |
| Player fallback, 390×844 | 390×483 | 57.2% |

No document overflow was detected in these measured states. Table bounds include
map overlays, not just unobstructed artwork. The 1024-wide supporting panel
scrolls; all six combatant rows exist but need not fit at once. Closing it returns
the width to the map. Measurements are in browser-results.json.

## 11. Accessibility checks

- Labeled native controls and keyboard access to the action loop.
- Visible primary focus outline measured at 3px; primary Attack height 36px.
- Supporting-panel opening focus, Escape dismissal and trigger focus return.
- Keyboard token inspection using Shift+Enter or ContextMenu, modal Tab wrapping,
  Escape and focus return to the token.
- Chat submission respects IME composition; chat drafts survive panel collapse.
- Contained scrolling and onscreen primary action at the narrow fallback.
- Sampled new primary text contrast: header 13.33:1, Attack 7.65:1, panel 12.17:1.

These samples are recorded in accessibility-results.json. They are not a full
WCAG, screen-reader, touch-target or all-component contrast audit.

## 12. Tests and builds — exact results

| Command/check | Result |
|---|---|
| npm.cmd run lint | PASS, exit 0 (TypeScript check) |
| npm.cmd run build | PASS, exit 0; 2,212 modules; single-file output 3,443.61 kB, gzip 820.10 kB |
| npm.cmd run server:build | PASS, exit 0 |
| node tests/live-play/verify.mjs | PASS, 42/42 existing regression commands |
| npx.cmd tsx tests/live-play/presentationSmoke.tsx | PASS, 6 presentation assertions |
| verifyLivePlay(browser, origin, output), exported by tests/live-play/browser.mjs | PASS, 47 checks; 11 screenshots; zero browser exceptions |
| git diff --check -- src docs tests | PASS |
| git diff --quiet -- server src/lib | PASS, no changes |
| git diff --cached --stat | Empty, nothing staged |

The regression runner records every selected existing script, exact executed
command and full output in [regression-results.json](live-play-ux/regression-results.json).
Browser assertions and geometry are in [browser-results.json](live-play-ux/browser-results.json).
The standalone run-browser.mjs wraps the same exported browser suite; it accepts
LIVE_PLAY_ORIGIN, PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE for local setup.

Key checks cover the original T12 request fields, selected PC/NPC/target/mode,
byte-equivalent retry intent, one simulated resolution on retry, projection-safe
result rendering, turn updates with the inspector closed, unauthorized drag
denial, panel coordination, chat deduplication and spectator affordances.

An unscoped git diff --check still reports the pre-existing blank line at EOF in
scripts/dev-local.ps1:427. That unrelated file was preserved.

## 13. Backend/domain invariants unchanged

No files in server/ or src/lib/ changed. Existing regression expectations for
authority, security and visibility were preserved. The UI still calls the
existing authoritative operations and consumes their projected results.

- T7 runtime write authority and T9 character derivation remain unchanged.
- T10 combat/map projection and spectator policy remain unchanged, including
  existing publicShared exact HP/temporary HP/AC visibility.
- T11 source review/acceptance remains available in campaign management.
- T12 actorCombatantId intent, PC/NPC authorization, partitioned append path,
  one combat.attack_resolved event, server rules/RNG, frozen idempotent retry,
  history fallback and fingerprint-conflict handling remain existing behavior.
- Replay uses recorded events; presentation adds no dice/rules execution.
- Shared RuntimeLog text and event projection policy are unchanged. Richer
  summaries use structured projected payload fields already supplied to the viewer.
- Durability/recovery, authentication, World Server policy and schemas are unchanged.

The existing crypto-backed roller is untouched. No equipment system, resolver
registry, migration or mechanics beyond T12 were introduced.

## 14. Remaining UX limitations

- Browser tests use deterministic fixtures, not a deployed/authenticated
  two-account session. Server regressions complement them but do not replace that test.
- At 1024px an open supporting panel reduces map width and needs internal scroll.
- The 390px fallback keeps the attack usable, but map tokens/tools remain crowded
  and some legacy labels wrap. This was not a complete mobile redesign.
- Some legacy panels still use small type. The accessibility check is sampled.
- The available sheet depends on admitted/projected data. Missing resources,
  mechanics and full remote character snapshots are not fabricated.
- T12 actions require combatants and authored attacks; empty states explain that
  prerequisite instead of adding an equipment or action-authoring system.
- The live UI remains predominantly Chinese with some existing terminology.
- The existing large single-file bundle remains; this pass did not change bundling.
- No human usability study or broad assistive-technology audit was performed.

## 15. Deviations from the contract

No product/backend scope expansion was needed. The proposed spatial hierarchy
was adapted to the existing map tools and data rather than adding a new tool
system. A narrow 390px fallback was checked in addition to the requested desktop
and tablet sizes. Browser validation uses fixture transport, as disclosed above.

Only obsolete UI text/empty-state test expectations were adjusted. Existing
privacy assertions were retained. The already-gated local development preview
was left unchanged. The earlier T12 visibility correction remains authoritative;
this UX pass does not introduce a second visibility regime.

## 16. git diff --stat

Tracked diff at completion (Git abbreviations retained):

    scripts/dev-local.ps1                              |  15 +-
    src/components/platform/BasicMapBoard.tsx          |  29 ++-
    .../platform/RoomAttackResolutionDetails.tsx       |  20 ++
    .../platform/RoomAttackResolutionDetailsSmoke.tsx  |   7 +-
    src/components/platform/RoomLobbyShell.tsx         |   9 +-
    src/components/platform/RoomRuntimeCombatPanel.tsx |  67 +----
    src/components/platform/RoomRuntimeEntryBridge.tsx | 277 ++++-----------------
    .../platform/RoomRuntimeLogPreviewPanel.tsx        | 122 +++------
    .../platform/RuntimeCharacterSheetPanel.tsx        |  49 ++--
    src/components/platform/RuntimeDndActionPanel.tsx  | 217 ++++------------
    src/components/platform/RuntimeMapStage.tsx        |   6 +-
    .../platform/RuntimeTokenInspectPanel.tsx          |  24 +-
    .../platform/ServerCampaignWorkspace.tsx           |  71 +++---
    13 files changed, 298 insertions(+), 615 deletions(-)

This includes the unrelated pre-existing scripts/dev-local.ps1 change. The task's
tracked source diff is 12 files, 290 insertions and 608 deletions. Ordinary git
diff --stat excludes untracked additions: three source files, six verification
files, two Markdown documents, eleven screenshots and three JSON evidence files.

## 17. git status summary

- Twelve tracked platform source files modified by this task, listed in section 8.
- Three new platform source files, six new tests, two documents and fourteen
  evidence files remain untracked; no files staged.
- Pre-existing modified scripts/dev-local.ps1 preserved.
- Pre-existing .work/, .yuki-activity-stage/, .yuki-icons-stage/,
  .yuki-phone-nav-stage/, .yuki-private-judge-stage/, .yuki-room-stage/,
  .yuki-voice-production/, .yuki-voice-stage/, Claude outputs/, output/, outputs/,
  tools/ and work/ preserved.
- Git groups the new verification files under the untracked tests/ directory.
- No commit or push. Work stops before T13/T14/Mod/Workshop implementation.
