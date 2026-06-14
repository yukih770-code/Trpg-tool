# Project Status

Last updated: 2026-06-14

## Project Overview

Multi-system TTRPG character manager.  
Three systems: **D&D 5e/2024**, **Call of Cthulhu (COC)**, **Cyberpunk RED (CP)**.  
Stack: React + TypeScript + Vite + Zustand (persist) + Tailwind + shadcn/ui.

---

## System Status

### Cross-System Rule & Feature Architecture

| Item | Status |
|------|--------|
| Cross-System Rule & Feature Architecture phase | 🚧 In Progress |
| TRPG_SYSTEM_FEATURE_MATRIX.md | ✅ Added |
| SYSTEM_PAGE_RESPONSIBILITY.md | ✅ Added |
| AI_HOST_ARCHITECTURE.md | ✅ Added |
| docs/rules/COC_RULE_COVERAGE.md | ✅ Added |
| docs/rules/CPRED_RULE_COVERAGE.md | ✅ Added |
| docs/rules/DND_RULE_COVERAGE.md | ✅ Added |
| IMPLEMENTATION_ROADMAP.md | ✅ Added |
| PLATFORM_ARCHITECTURE.md | ✅ Added |
| AI Context Index v1 (`docs/ai/PROJECT_INDEX.md`, `docs/ai/SYMBOL_MAP.md`, `docs/ai/TASK_CONTEXT_TEMPLATE.md`) | ✅ Added |
| AI Task Lifecycle v1 (`docs/ai/ACTIVE_TASK.md`, `docs/ai/TASK_ARCHIVE.md`) | ✅ Added |
| Documentation Governance v1 (`AI_WORKFLOW.md`, `docs/ai/*`, `docs/archive/README.md`) | ✅ Added |
| Documentation Consolidation v1 | ✅ Done |
| Hardcore Platform Reorientation v1 | ✅ Done |
| Open-Source Community Ecosystem Goal | ✅ Planned |
| Platform Shell / Home / Play Workspace Layering | ✅ Added |
| Rule Data Source / Trust Metadata Foundation | ✅ Added |
| Project Rule Source Authority Policy | ✅ Added |
| DND Owner Source Entry Manifest | ✅ Added |
| Platform Play Menu + Collapsible Sidebar v1 | ✅ Added |
| DND Rule Metadata Application | ✅ Added |
| DND Species / Background Display Cleanup | ✅ Added |
| DND Class / Subclass Correction v1 | ✅ Started |
| DND Feat / Background Link Correction v1 | ✅ Completed |
| DND Spell Manifest Correction v1 | ✅ Completed |
| DND Artificer Source Completion v1 | ✅ Done (source-indexed; runtime deferred) |
| DND Local CHM Source Authority + Full Coverage Audit v1 | ✅ Done (docs audit; runtime unchanged) |
| DND Background Runtime Completion v1 | ✅ Done (16 local-CHM backgrounds; mechanics pending check) |
| DND Character Builder Responsive Workbench Phase 1 | ✅ Done (UI layout only; logic unchanged) |
| DND Gameplay Entry Preservation v1 | ✅ Done (Gameplay / dice area remains reachable after Builder cleanup) |
| DND Sheet Layout Compact v1 | ✅ Done (player-facing compact sheet layout; logic unchanged) |
| Multi-System Workspace Shell Planned Slots v1 | ✅ Done (module entries + planned placeholders only) |
| DND Character Vault & Creation Method Entry v1 | ✅ Done (Vault shell + creation method entry; runtime unchanged) |
| Platform Core Concepts / Game System Registry Baseline v1 | ✅ Done (docs/architecture only; no code change) |
| System Actor Session Workspace IA Correction Follow-up v1 | ✅ Done (removed 9 Actor/Session cards from module grids; workspace-tier guidance is informational only) |
| System Home Simplification v1 | ✅ Done (DND/COC/CP RED home pages simplified to core entry points; index cards and data grids removed from home) |
| Platform Actor Entry Pattern Alignment v1 | ✅ Done (COC/CP dashboard gets "continue editing" button; Actor/Player Asset abstraction note added to all three systems; planned.message updated) |
| Platform Navigation History Stack v1 | ✅ Done (lightweight app-level back stack; no router / URL routing) |
| COC / CP RED DND-aligned Workspace Reconstruction v1 | ✅ Done (CocWorkspaceShell + CpWorkspaceShell created; PlayWorkspace wired; NonDndWorkspaceView extended; cocWorkspace.* / cpWorkspace.* i18n added) |
| COC Workspace Cleanup v1 | ✅ Done (7-item nav; 'sheet' view with HP/MP/SAN/Luck+characteristics+skills summary; 'play' nav item calls onOpenPlayTab('gameplay'); NonDndWorkspaceView extended with 'sheet'; cocWorkspace.nav.sheet/runtime + cocWorkspace.sheet.* i18n; landmark COC_WORKSPACE_CLEANUP_V1) |
| COC Builder BG3-like Shell v1 | ✅ Done (COC Standard Creation now opens a three-column Investigator Builder shell; preview/read-only UI only; no store/save/rule/runtime/dice changes) |
| CP RED Builder BG3-like Shell v1 | ✅ Done (CP RED Standard Creation now opens a three-column Edgerunner Builder shell; preview/read-only UI only; no store/save/rule/runtime/dice changes) |
| Platform Pattern + Workspace Section Contract v1 | ✅ Done (docs/architecture only; 9 platform patterns + workspace section contract; no code change) |
| System App Shell Principle Integration v1 | ✅ Done (docs/architecture only; System App Shell / System Theme Adapter layering integrated into the Platform Patterns contract; no code change) |
| Campaign Vault + Source Settings + Workshop Scaffold Pattern Integration v1 | ✅ Done (docs/architecture only; Campaign Vault, Source Settings, Workshop item classes, and Developer Scaffold Mode principles integrated; no code change) |
| Navigation Back / Up / Breadcrumb Model v1 | ✅ Done (docs/architecture only; Back=history, Up=parent resolver, Breadcrumb=ancestor chain; no code change) |
| Navigation Up + Breadcrumb Minimal Implementation v1 | ✅ Done (App.tsx: deriveNodeType/getParentNodeType/goUp helpers; Up button added to workspace toolbar; breadcrumb extended to workspace-view level; 9 i18n keys per locale; landmark NAVIGATION_UP_BREADCRUMB_MINIMAL_IMPLEMENTATION_V1) |
| DND Workspace Contract Alignment v1 | ✅ Done (DndWorkspaceShell top nav reduced to 4 system-level Sections: overview/actorVault/rulesCompendium/sourceStatus; 'create' removed from navItems, accessible via CTA only; actorFlowNote i18n key added; landmark DND_WORKSPACE_CONTRACT_ALIGNMENT_V1) |
| COC Workspace Contract Alignment v1 | ✅ Done (CocWorkspaceShell top nav reduced to 4 system-level Sections: overview/actorVault/rulesCompendium/sourceStatus; createMethod/sheet/play removed from navItems, accessible via Actor context CTA; Activity+FileText imports removed; isActiveNav+handleNavClick simplified; actorFlowNote i18n key added; landmark COC_WORKSPACE_CONTRACT_ALIGNMENT_V1) |
| CP RED Workspace Contract Alignment v1 | ✅ Done (CpWorkspaceShell top nav reduced to 4 system-level Sections: overview/actorVault/rulesCompendium/sourceStatus; createMethod/sheet/gameplay(mission) removed from navItems, accessible via Actor context CTA; navItems type simplified (kind/view?/tab? removed); isActiveNav+handleNavClick simplified; actorFlowNote i18n key added; landmark CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1) |
| CP RED stable item instance id / equipment disappearing fix v1 | ✅ Done (CP RED inventory/equipment movement now preserves stable item instance identity across equip/unequip/install/remove flows; duplicate same-name items remain distinguishable; legacy no-id items are normalized lazily; no CP RED rule data, dice, combat formula, schema, migration, DND, or COC change) |
| System Default Entry Actor Vault + Generic Nav Labels v1 | ✅ Done (DND/COC/CP RED default system entry is Actor Vault; top system nav now uses generic platform labels: 角色库 / 规则库 / 数据状态; overview/dashboard retained as secondary System Info; no rule logic, save format, dice, runtime formula, routing, map, inventory, session, workshop, or plugin change) |
| Actor Vault Responsibility Cleanup + Hide Runtime CTA v1 | ✅ Done (Actor Vault (DND/COC/CP RED) now shows only current actor summary + open sheet + create; runtime CTAs (startPlaying/startInvestigation/startMission/continueEditing) removed from vault and sheet views; planned import/export cards removed from vault pages; System Info demoted to small text link; DND Sheet onStartPlaying prop not passed; CP RED Sheet startMission removed; continueEditing retained in CP RED sheet (幕间维护); runtimeGateNote i18n key added; landmark ACTOR_VAULT_RESPONSIBILITY_CLEANUP_HIDE_RUNTIME_CTA_V1) |
| UI Action Hierarchy & Page Responsibility Contract v1 | ✅ Done (docs/architecture only; establishes 8-tier UI action hierarchy A–H: platform/system/collection/object/creation-flow/runtime-context/system-info/planned; page responsibility contracts for all 8 Section types; container placement rules; button priority rules; 9 anti-patterns; required UI task workflow; 12-item review checklist; current DND/COC/CP RED application; relationship to PLATFORM_PATTERNS and NAVIGATION docs; landmark UI_ACTION_HIERARCHY_PAGE_RESPONSIBILITY_CONTRACT_V1; no src/ changes) |
| Actor Vault Action Hierarchy Cleanup v1 | ✅ Done (DND/COC/CP RED vault actor card CTA columns now follow action hierarchy contract: Tier-D View Sheet primary + Tier-D Edit secondary (optional); page header = Tier-C Create + Tier-G System Info small link; ACTOR_VAULT_ACTION_HIERARCHY_CLEANUP_V1 landmark added to all 3 vault shell files (5 locations); no new i18n keys needed; no runtime/store/schema changes; landmark ACTOR_VAULT_ACTION_HIERARCHY_CLEANUP_V1) |
| Actor Vault Single-Actor Action Cleanup v1 | ✅ Done (DND/COC/CP RED Actor Vault pages now respect the current single-actor limitation: when actor exists, header Create CTA is hidden; actor card shows only true object-level View Sheet action; Edit/Create demoted to low-frequency "Replace current actor" small underline link with single-actor explanatory note; when no actor, empty state shows Create CTA normally; 6 new i18n keys added (replaceCurrentCharacter/Investigator/Edgerunner + singleActor notes); landmark ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1; no multi-actor store, save format, schema, migration, runtime logic, dice algorithm, routing, import/export change) |
| Actor Vault Recent Entry Microcopy Fix v1 | ✅ Done (i18n-only: 当前角色→最近角色, 当前调查员→最近调查员, 当前 Edgerunner→最近 Edgerunner; 查看角色卡/查看调查员卡 buttons → 进入/Enter; 6 keys in zh-CN.ts + 6 in en.ts; no shell files touched; no structure/store/schema/runtime/dice/routing change) |
| Actor Vault Existing/Add Split v1 | ✅ Done (DND/COC/CP RED Actor Vault pages restructured into two named sections: 已有角色/Existing Actors (current actor card with expanded metadata + View Sheet CTA only) and 添加角色/Add Actor (Standard Create → Builder directly + Quick Create/Local Import/Workshop Import as planned entries); empty state in Existing section; singleActorLimitNote caption; campaignTeaser in Add Actor; inline actor card render in vault (shared renderInvestigatorCard/renderEdgerunnerCard unchanged — still used by dashboard); DND reuses existing creationMethodCards array; 13 new i18n keys under multiWorkspace.actorVault.*; landmark ACTOR_VAULT_EXISTING_ADD_SPLIT_V1; no multi-actor store, save format, schema, migration, runtime logic, dice algorithm, routing, import/export change) |
| Multi-Actor Store Architecture Review v1 | ✅ Done (docs/architecture only; L3 architecture review for future multi-actor vault; defines Actor unified concept, actorInstanceId, ActorMeta + SystemActorSummary discriminated union, source/creator fields, campaign binding fields, Option A vs Option B data model comparison (→ Option A recommended), additive migration strategy, UI impact, 10 risk boundaries; no src/ change; landmark MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1) |
| Platform Actor Vault Library Framework Extraction v1 | ✅ Done (ActorVaultAdapter<TActor> + ActorVaultLibraryShell extracted; DND reference impl via dndActorVaultAdapter.ts; 'characterLibrary' removed from DndWorkspaceView; COC/CP RED untouched; no save format/registry/routing/runtime change) |
| DND Multi-Actor Store + Actor Vault Library v1 | ✅ Done (DND Actor Vault restructured into 3-layer navigation: vault homepage ('characters' view) → character library ('characterLibrary' view) → add character ('create' view); vault homepage shows two entry cards: 已有角色 (stats: total/complete/incomplete/recentUpdate) + 添加角色 (note + navigates to create); character library has local search (name/class/race/background), filter tabs (全部/资料完整/未完成), sort (最近更新=insertion order/名称/等级), detailed character cards (name/level/class+subclass/race/background/source/creator/campaign/statusBadge/activeBadge) each with 进入 CTA; nav highlights 角色库 when on characterLibrary; active character always shown via compat dndChar field (up-to-date with all mutations); 'characterLibrary' added to DndWorkspaceView type; local state: libSearch/libFilter/libSort; isCharComplete helper; totalChars/completeChars/incompleteChars derived; 16 new i18n keys added (zh-CN + en); landmark DND_MULTI_ACTOR_STORE_ACTOR_VAULT_LIBRARY_V1; COC/CP RED untouched; no dice/runtime/routing/Campaign/Workshop/Plugin change) |
| COC Actor Vault Library Adoption v1 | ✅ Done (COC 角色库 migrated to platform ActorVaultLibraryShell via cocActorVaultAdapter.ts; COC_VAULT_COLOR_THEME (dark teal); bgInput field added to ActorVaultColorTheme + shell; DND_VAULT_COLOR_THEME updated; CocWorkspaceShell vault JSX replaced with <ActorVaultLibraryShell>; cocWorkspace.characterLibrary.* i18n (zh-CN + en); single-actor V1: getActors() returns [] or [cocChar]; onEnterActor → sheet; onRequestAdd → createMethod; COC store/save/rule/dice/CP RED untouched; landmark COC_ACTOR_VAULT_LIBRARY_ADOPTION_V1) |
| DND Multi-Actor Store Minimal Implementation v1 | ✅ Done (Option A multi-actor store for DND only: `characters: CharacterData[]` + `activeCharacterId: string | null` added to characterStore; `syncActiveCharacter` helper syncs compat `character` field at switch/reset/load checkpoints; `merge` callback handles legacy `{character}` shape (wraps to `characters[0]`) and new `{characters[], activeCharacterId}` shape (substitutes compat field for active slot); new actions: `setActiveCharacterId`, `addCharacter`; `resetCreator` and `loadCharacter` updated to sync then write array; DND Actor Vault shows full characters[] list, each card has "进入" button calling `setActiveCharacterId` then navigating to sheet; active character shows "当前" badge; Standard Creation calls `resetCreator()` before opening Creator so new character is added to array; 2 i18n keys added: `multiActorNote` + `activeIndicator` (zh-CN + en); landmark DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1; COC/CP RED untouched; no dice/runtime/routing/import/export change) |
| CP RED Actor Vault Library Adoption v1 | ✅ Done (CP RED 角色库 migrated to platform ActorVaultLibraryShell via cpActorVaultAdapter.ts; CP_VAULT_COLOR_THEME (dark gold); CpWorkspaceShell vault JSX replaced with <ActorVaultLibraryShell>; cpWorkspace.characterLibrary.* i18n (zh-CN + en); single-actor V1: getActors() returns [] or [cpChar]; sort: default/name/roleLevel(numeric); displayName = handle preferred; onEnterActor → sheet; onRequestAdd → createMethod; CP RED store/save/rule/dice/equipment/黑市/netrunning/COC/DND untouched; landmark CPRED_ACTOR_VAULT_LIBRARY_ADOPTION_V1) |
| Actor Vault Dead I18n Key Cleanup v1 | ✅ Done (~60 dead keys removed from zh-CN.ts + en.ts; multiWorkspace.singleActor/entryPattern entire blocks deleted; multiWorkspace.actions 5 dead keys; multiWorkspace.actorVault 5 dead keys; multiWorkspace.coc/cp modules+notes+home(3)+entry(4) blocks; cocWorkspace.nav 6→1 (kept sheet); cpWorkspace.nav+vault entire blocks; dndWorkspace.home 4 dead keys; dndWorkspace.modules 10→4 (kept spellIndex/featIndex/equipmentIndex/classIndex); dndWorkspace.characters 7 dead fields; no src/pages/ src/components/ src/lib/ store schema routing change; landmark ACTOR_VAULT_DEAD_I18N_CLEANUP_V1) |
| System Library Filter Taxonomy Cleanup v1 | ✅ Done (SystemLibrary.tsx: StatusKey→AvailabilityKey+SourceKey; 3 filter rows: 类型/可用/来源; dev-status words 脚手架/计划中 removed from primary filters; available cards badge=「可进入」+「进入系统」CTA; unavailable cards badge=「未接入」+disabled「后续接入」button at opacity-65; genre tag chips on all cards; search includes tag corpus; i18n restructured: systemLibrary.availability.*/source.*/badge.*/tags.*/unavailableButton; no store/schema/routing change; landmark unchanged SYSTEM_LIBRARY_SCAFFOLD_V1) |
| System Library Duplicate Entry Consolidation v1 | ✅ Done (left nav play→systemLibrary (系统库/Library icon); openPlaceholder intercepts 'ruleSystems'+'systemLibrary' → setAppView('systemLibrary'); fallbackNavigation from workspace → systemLibrary; Settings+placeholder buttons → openPlaceholder('ruleSystems'); PlayMenu code retained but unreachable through all UI paths; SystemLibrary subtitle added; shell.nav.systemLibrary + systemLibrary.subtitle i18n; no store/schema/routing/workspace-internal change; landmark SYSTEM_LIBRARY_DUPLICATE_ENTRY_CONSOLIDATION_V1 n/a — wiring change only) |
| System Library Scaffold v1 | ✅ Done (src/pages/SystemLibrary.tsx created; AppView extended with 'systemLibrary'; openPlaceholder('ruleSystems') intercepted → real page; search: local filter on name/desc/type; category filter: 全部/TRPG/桌游/战棋/卡牌/自定义; status filter: 全部/已接入/脚手架/计划中/社区/本地; 3 installed cards (DND/COC/CP) with 「进入系统」 CTA + 3 placeholder cards (战锤/日式TRPG/自定义) at opacity-65 with disabled button, not disguised as available; systemLibrary.* i18n (zh-CN + en); no store/schema/routing/workspace-internal change; landmark SYSTEM_LIBRARY_SCAFFOLD_V1) |
| Platform Home Launchpad IA Cleanup v2 | ✅ Done (Home.tsx rewritten as 4-section true Launchpad: (1) 继续上次/Resume — system-accent CTA card; (2) 最近使用/Recent — lightweight 3-row system list with optional char name, V1 source = store state; (3) 固定入口/Pinned — 3 shortcut buttons (规则系统库/我的战役/创意工坊) → onOpenPlaceholder; (4) 平台状态摘要/Platform Status — 3 status badges + Private Import small utility button; home no longer acts as full feature directory; removed: full 3-col system grid, 7-card dev zone wall, per-system chip links; i18n: removed home.systems.*/home.devZone.*, added home.recent.*/home.pinned.*/home.platformStatus.*; no store/schema/routing/workspace-internal change; landmark PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V2) |
| Platform Home Launchpad IA Cleanup v1 | ✅ Done (Home.tsx rewritten as 3-section Launchpad: (1) 继续上次/Resume — highest-CTA 「继续」button + system/character info, system-tinted accent card; (2) 规则系统库/Rule Systems — 3 equal-weight system cards with 进入系统 CTA + 角色库/规则库/数据状态 chips; (3) 开发中功能/In Development — 7 dev-zone cards with explicit status badges (脚手架/接口预留/后续实现/工具入口), clickable where placeholder exists, disabled otherwise; Private Import moved from Hero to dev-zone; sidebar nav 游玩→规则系统; Hero compressed to title+subtitle only; i18n restructured: home.resume.* / home.systems.* / home.devZone.* added, old home.snapshot/workspaces/roadmap removed; no store/schema/routing/workspace-internal change; landmark PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V1) |

Architecture phase scope:
- Documents DND / COC / Cyberpunk RED feature layers, priorities, page responsibilities, and freeze decisions.
- Documents AI Assistant / AI Co-Host / AI Host roles and future ProposedCommand boundaries.
- Materializes COC and CP RED rule coverage matrices.
- Defines the post-freeze implementation roadmap.
- Establishes ephemeral active-task context and compressed task archive; no `CODE_LANDMARKS.md`, with markdown navigation based on symbols and `rg -n`.
- Establishes documentation governance owner rules, archive firewall, active task lifecycle, and exact-file git safety.
- Consolidates A-class rule/index docs into `docs/rules/` and `docs/ai/`, archives one-off historical architecture docs under `docs/archive/`, and removes stale `CURRENT_PROJECT_STATE.md`.
- Clarifies the final target as a hardcore multi-system TRPG platform and the current strategy as staged hard-core architecture.
- Current phase is P1 Rules Runtime Closure; low-barrier UX is a delivery principle, not a feature ceiling.
- Full map, multiplayer, AI Host, full DND Wild Shape / Active Form, and outer platform layers remain deferred until Actor/Target, condition/effect, permissions, and schema dependencies are ready.
- Records open-source community content ecosystem as a long-term hard-core platform goal; public ecosystem content must be original or redistributable, private user import remains separate, and implementation is deferred until stable schemas and content package boundaries exist.
- Platform Home Shell v1 added: default entry is now Platform Home, and the previous complete main interface is preserved as `PlayWorkspace`.
- Platform Home Shell v1 now includes a lightweight i18n foundation in `src/i18n/`; default locale is `zh-CN`, English UI remains available, and locale persists via `localStorage` key `trpg-platform-locale`.
- Language switching was moved under Settings / Language; Home no longer presents language switching as a primary platform action.
- Platform Home Shell v1 product polish completed: Home microcopy was reduced to product-style labels; long developer explanations were removed from Home, the sidebar, Settings, and placeholder pages.
- Coming Soon placeholders remain visible and not misleading, using a short "即将开放 / Coming Soon" badge and a one-line "该功能已列入后续阶段。/ Planned for a later phase." note.
- The i18n foundation remains unchanged and extensible; removed copy had its translation keys cleaned up in both locales.
- No PlayWorkspace or rules logic was changed by the product polish.
- Platform Play Menu + Collapsible Sidebar v1 added. Play no longer needs to open directly into a character sheet.
- Ruleset selection is now menu-driven (`src/pages/PlayMenu.tsx`) to improve immersion and avoid unnecessary multi-system loading pressure; the selected ruleset workspace shows a "返回游玩菜单 / Back to Play Menu" button, and switching rulesets goes back through the menu.
- The sidebar is collapsible (ChatGPT-style); collapsed state persists via `localStorage` key `trpg-platform-sidebar-collapsed`; sidebar primary navigation is reduced to Home / Play / Settings, with placeholder pages still reachable from Home cards.
- Existing ruleset workspaces are preserved; the PlayWorkspace internal system selector remains as a low-priority compatibility control rather than primary navigation.
- Landmark: `PLATFORM_PLAY_MENU_COLLAPSIBLE_SIDEBAR`. No rules logic, rule data, schema, or migration changed by this shell round.
- Only Platform Shell / Home / placeholder text was localized through translation keys; PlayWorkspace internal rules UI is not translated by this shell layer.
- Play enters the preserved ruleset workspace; DND / COC / Cyberpunk RED creator, sheet, gameplay, and CP RED market tabs remain inside `PlayWorkspace`.
- Campaigns, Community Modules, Content Studio, Private Import expansion, map, multiplayer, and AI Host remain explicit placeholders/deferred.
- No DND / COC / CP RED rule logic was changed.
- No package changes, store schema changes, schema changes, or migration changes.
- CP RED stable item instance id / equipment disappearing fix v1 completed. CP RED inventory and equipment flows now preserve stable item instance identity across equip and unequip actions, preventing items from disappearing when moved between inventory and equipped state. Existing data without item instance ids remains compatible through lazy id assignment at movement boundaries. No CP RED rule data, dice algorithm, combat formula, DND, COC, map, session, workshop, plugin, React Router, URL routing, or browser History API implementation changed.
- System Default Entry Actor Vault + Generic Nav Labels v1 completed. DND, COC, and CP RED now default to Actor Vault as the system entry point, reflecting the product principle that player-facing TRPG workflows start from characters/actors. Top-level system navigation now uses generic platform labels: Actor Vault, Rules Compendium, and Source Status. System-specific names remain inside page titles and content. System Overview is retained as a low-frequency architecture/system-info concept but no longer acts as the default system landing page or primary nav item. No rule logic, save format, dice algorithm, runtime formula, import/export, routing, workshop, map, inventory, session, or cross-system store implementation changed.
- Platform Core Concepts / Game System Registry Baseline v1 completed. The project now defines Game System, Actor / Player Asset, Asset Collection, Dice Profile, Sheet/Builder Template, Board Capability, Source Package, Workshop Item, Theme, and Plugin concepts as platform-level architecture terms. DND, COC, and CP RED are documented as built-in Game System registry entries rather than platform boundaries. No store schema, runtime logic, rule data, workshop subscription, plugin execution, map, inventory, or session implementation changed.
- New document: `docs/architecture/PLATFORM_CORE_CONCEPTS.md` — full concept definitions, Game System Registry V1 field spec, three built-in system entries, terminology alignment, Atmospheric Minimalism artistic direction, Workshop/Plugin safety model, and workspace IA summary.
- Platform is re-positioned as: Chinese-first, extensible, multi-ruleset TRPG / tabletop game tool platform. DND / COC / CP RED are built-in samples, not the platform boundary.
- Key invariants established: Character / Investigator / Edgerunner are system display labels; Actor / Player Asset is the platform abstraction; one Actor can join multiple Campaigns / Modules / Sessions; Asset Collection covers Party / Crew / Army / Roster.
- Landmark: `PLATFORM_CORE_CONCEPTS_GAME_SYSTEM_REGISTRY_BASELINE` in `docs/architecture/PLATFORM_CORE_CONCEPTS.md`.
- System App Shell Principle Integration v1 completed. System App Shell 与系统主题分层原则 is now part of `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`; DND remains a reference implementation, not a copy template. No `src/`, store, schema, runtime, rule data, dice, React Router, or URL routing changed.
- Campaign Vault + Source Settings + Workshop Scaffold Pattern Integration v1 completed. Platform contracts now distinguish Actor Vault, Campaign Vault, Source Settings, Builder Flow, Session Runtime / VTT, and Workshop, including Workshop item classes and Developer Scaffold Mode transparency rules. No new docs, `src/`, store, schema, migration, save format, runtime, rule data, dice, React Router, URL routing, or browser History API changed.
- Rules Data Integrity + Source Verification Audit v1 found high-risk unverified/source-light datasets across DND / COC / CP RED.
- Rule Data Source / Trust Metadata Foundation v1 added shared rule data provenance types in `src/lib/rules/rule-data-metadata.ts` (landmark `RULE_DATA_SOURCE_TRUST_METADATA`).
- Project Rule Source Authority Policy v1 added rule-source manifest policy (landmark `RULE_SOURCE_AUTHORITY_POLICY`): owner-provided GitHub / PDF rule sources are authoritative over existing app data, previous AI-generated data, model memory, third-party sources, and general web search.
- DND owner-provided root source is recorded as `https://github.com/DND5eChm`; repository-level source selection still requires owner confirmation.
- Rule data conflicts must resolve in favor of owner-provided sources; source items missing from app data are marked `missing`, and app items absent from owner-provided sources are marked `out-of-source` or `needs-human-check`.
- Source authority policy work changed documentation only; no rule data, Creator, Gameplay, Market, store schema, or migration behavior was changed.
- DND Owner Source Entry Manifest v1 added `docs/rule-sources/dnd-manifest/DND_OWNER_SOURCE_ENTRY_MANIFEST.md` from owner-confirmed `SRD5.2Chm` and `DND5e_chm` repositories.
- The DND owner manifest records classes, subclasses, species/races, backgrounds, feat source files, spell heading IDs, equipment categories, and class-resource/progression source paths without copying rule descriptions or spell effect text.
- Spell effect text remains source-referenced only in the public manifest; later runtime use should rely on publication-safe structured fields or a private/local import layer.
- DND Rule Metadata Application v1 started source/trust metadata application before content correction.
- Legacy DND class, race/species, spell, feat, and background datasets are retained but marked `ai-assisted-unverified` / `needs-human-verification`.
- DND 2024 equipment sample data is source-labeled as display-only, and `classProgression` remains runtime-active with `needs-human-check` accuracy metadata pending value-level verification.
- DND Species / Background Display Cleanup v1 completed. Sheet no longer relies on 2014 race/subrace string hardcoding such as dwarf/subrace weapon or armor training for species feature display.
- Legacy saved race/subrace/background values remain compatible in Sheet via quarantined legacy data fallback and explicit needs-human-check messaging; no data correction, schema, migration, Creator, Gameplay, or store behavior changed.
- DND Class / Subclass Correction v1 started. Existing class/subclass data now carries source/trust metadata, with owner-source-matched entries separated from XGtE/TCoE labels, `needs-human-check` conflicts, and out-of-source quarantine markers.
- Out-of-source and 2014/2024-conflict subclasses are no longer documented as verified owner-source data. Subclass progression automation, runtime correction, and content correction remain deferred; no schema/migration or gameplay behavior changed.
- DND Feat / Background Link Correction v1 completed. Background `originFeat` strings are now checked against `FEATS_DATA`; `魔法学徒 (Magic Initiate)` was added as a source-linked minimal placeholder to repair the 2024 background link.
- Existing feat effects remain unverified unless separately corrected. Feat effect automation, prerequisites beyond existing checks, choice UI, Magic Initiate spell selection, and Action Registry integration remain deferred; no schema/migration or gameplay behavior changed.
- DND Spell Manifest Correction v1 completed using the safe route-B strategy: the current 20 runtime spell entries are retained, source/trust metadata was added, and the 507-entry owner manifest gap is recorded without importing placeholder spells into Gameplay.
- Known translation anomalies (`Revivify`, `True Strike`, `Hold Person`) are no longer treated as verified translations; owner manifest confirms identity/level, while Chinese names, schools, class lists, and effect summaries remain pending checked extraction. Full spell automation remains deferred.
- DND Artificer Source Completion v1 completed. `奇械师 / Artificer` is now source-indexed from TCoE (`塔莎的万事坩埚/玩家选项/职业/奇械师.html`) with related spell-list, infusion, and subclass source paths, so it is no longer an untracked class gap.
- Artificer runtime support remains deferred: it was not added to `CLASS_DATA` or Creator because `classProgression`, spellcasting, infusions, and subclass runtime behavior still require source-level verification.
- DND Local CHM Source Authority + Full Coverage Audit v1 completed as a documentation/source-policy audit only. Local CHM extracted source at `C:\TRPG_CHM_WORK\extracted` is now the primary authoritative DND source (`dnd-local-chm-primary`); GitHub DND5eChm / SRD5.2Chm are secondary cross-check sources, and official references are optional supplements.
- Local CHM full coverage audit corrected the previous sparse baseline: DND 2024 standard backgrounds are 16, not 4; PHB 2024 species are 10 including `阿斯莫`; spells remain 507 source headings across PHB/TCoE/XGtE; equipment, feats, subclasses, class progression, class resources, spell lists, and magic items require dedicated extraction/verification tasks before runtime promotion.
- No DND runtime data, `src/data/*`, Creator, Sheet, Gameplay, store schema, migration, COC, CP RED, or Platform behavior changed by the CHM audit.
- DND Background Runtime Completion v1 completed. Runtime `BACKGROUND_DATA` now follows the local CHM primary source baseline with 16 standard DND 2024 backgrounds. Detailed background mechanics remain `needs-human-check`, and newly completed entries use short placeholder text rather than copied rules prose.
- No store schema, migration, Creator, Sheet, Gameplay, COC, CP RED, or Platform behavior changed by the background runtime completion.
- DND Character Builder Responsive Workbench Phase 1 completed. The existing Creator logic is now presented through a BG3-like builder workbench with section navigation, current editor area, and live character summary / todo panel.
- Builder sections cover identity, source status, species, background, class, abilities, feats, spells, equipment, and review. Spell/equipment sections are boundary placeholders only; no spell automation, equipment system, inventory, schema, migration, or rules data changes were introduced.
- DND Gameplay Entry Preservation v1 completed. The DND Workspace "进入游玩 / 战斗" entry now routes directly to the preserved Gameplay view after Builder hierarchy cleanup.
- Existing DND Gameplay / RollConsole remains reachable. Full dice/action/item/map interaction redesign remains deferred to later Action / Inventory / Map runtime work; no dice algorithm, runtime rule logic, store schema, migration, or rule data changed.
- DND Sheet Layout Compact v1 completed. The DND character sheet now uses a more compact player-facing layout with condensed core stats, a compact ability grid, denser skill/save presentation, and clearer summary zones for attacks, equipment, spells, and class resources.
- This remains UI v0 / IA validation, not final visual redesign. No CharacterData schema, rule data, runtime logic, dice algorithm, inventory contract, spell preparation logic, class resource logic, workshop, map, or session implementation changed.
- Multi-System Workspace Shell Planned Slots v1 completed. DND / COC / CP RED now expose system-level module cards and planned slots from their workspaces.
- Planned slots are entry-only placeholders: DND Backpack / Items, Map / Tactical Board, Quests / Notes / Logs; COC Investigator Vault, Clues / Handouts, Investigation Notes / Session Log, Locations / Map, Source Status; CP RED Edgerunner Vault, Enemies / Encounter, Map / Tactical Position, Session Log, Source Status.
- No inventory data contract, map/token data contract, item system, encounter state, community/backend logic, multiplayer sync, rule data, store schema, migration, Sheet runtime, or Gameplay runtime changed.
- DND Character Vault & Creation Method Entry v1 completed. DND now routes character creation through a lightweight Character Vault and creation method selection screen before opening the existing Builder.
- Sheet now exposes a visible Start Playing / Enter Combat Panel action that opens the preserved Gameplay surface. Gameplay / RollConsole assets are preserved as future Runtime Surface assets; no dice algorithm, store schema, rule data, import/export logic, or runtime logic changed.
- Rule data must declare source and trust metadata before being treated as verified runtime/core data.
- Unknown-source or suspicious rule data must not be promoted into new gameplay features until it is labeled, quarantined, or verified.
- Public/free sources may be embedded only within allowed scope; paid-book or official-but-not-public content may be referenced by source metadata but must not copy long rules text.
- Homebrew/demo/placeholder data must be visibly labeled or quarantined before further feature expansion relies on it.
- Freeze planning now has a roadmap; resumed code work must follow it one narrow, single-system phase at a time.
- Current readiness state: DND, COC, and CP RED Player Gameplay pages are componentized and aligned around local `RuntimeLogEntry[]` RollConsole patterns.

### D&D 5e / 2024

| Item | Status |
|------|--------|
| schemaVersion + migrateDndCharacter | ✅ Done |
| 2024 progression foundation (XP / proficiency / ASI) | ✅ Done |
| classResources container | ✅ Done |
| pactMagicState container | ✅ Done |
| DND Gameplay Interaction v0 | ✅ Done |
| Action Registry v0 | ✅ Done |
| DND Structured LogEntry v1 | ✅ Done |
| DND Gameplay Componentization v1 | ✅ Done |
| DND 2024 Class Resources and Spell Preparation Closure v1 | ✅ Done |
| DND Spellcasting Path Unification v1 | ✅ Done |
| DND Character Options Source Completion v1 | ✅ Done (index layer; runtime promotion deferred) |
| DND Structured Equipment Data Layer v1 | ✅ Done |
| DND Resource Consumption Unification v1 | ✅ Done |
| DND Background / Species Correction v1 | ✅ Started (entry names source-matched; mechanics pending human check) |
| DND Class / Subclass Correction v1 | ✅ Started (metadata/source labeling only; mechanics pending human check) |
| DND Feat / Background Link Correction v1 | ✅ Done (origin feat link + metadata only; effects automation deferred) |
| DND Spell Manifest Correction v1 | ✅ Done (runtime spell list retained; 507-entry index deferred) |
| DND Artificer Source Completion v1 | ✅ Done (source-indexed; runtime deferred) |
| DND Background Runtime Completion v1 | ✅ Done (BACKGROUND_DATA 16/16 local-CHM standard backgrounds) |
| DND Character Builder Responsive Workbench Phase 1 | ✅ Done (responsive builder layout; original logic preserved) |
| DND Gameplay Entry Preservation v1 | ✅ Done (Workspace Play / Combat opens Gameplay; RollConsole reachable) |
| DND Sheet Layout Compact v1 | ✅ Done (compact status / ability / skill / summary layout; logic unchanged) |
| Multi-System Workspace Shell Planned Slots v1 | ✅ Done (DND/COC/CP RED module cards; planned slots only) |
| DND Character Vault & Creation Method Entry v1 | ✅ Done (current-character Vault shell; Standard Creation opens existing Builder) |

Action Registry v0 scope:
- Supports only `classResource` and `pactMagic` resource costs.
- Does not support `spellSlot` resource costs.
- Does not implement full action economy, attack resolution, damage resolution, enemy targets, concentration, or combat log integration.

DND Structured LogEntry v1 scope:
- DND Gameplay local `combatLog` uses `RuntimeLogEntry[]` instead of `string[]`.
- Default visibility is `public`.
- Local UI state only; no store, schema, or migration changes.
- No visibility filtering, reveal workflow, Host Console, or multiplayer sync.

DND Gameplay Componentization v1 scope:
- `Gameplay.tsx` orchestrates local state, checks, action use, resources, spellbook, and RollConsole through panel components under `src/pages/gameplay/`.
- Sheet no longer owns gameplay roll controls; Player Gameplay owns checks, actions, runtime resource use, and player-visible result logging.
- No attack/damage target layer, spellSlot Action Registry refactor, Host Console, AI Host, or multiplayer work.

DND 2024 Class Resources and Spell Preparation Closure v1 scope:
- Base class resource definitions and runtime state cover Barbarian Rage, Bardic Inspiration, Fighter Second Wind / Action Surge, Monk Focus, Paladin Lay on Hands, Sorcerer Sorcery Points, Warlock Pact Magic state, and Wizard Arcane Recovery definition.
- DND short rest / long rest resource recovery now writes local `RuntimeLogEntry` records into the RollConsole; toast remains supplemental only.
- Long rest v1 refreshes long-rest resources and also covers short-rest resources because a long rest subsumes short-rest recovery in this tool model.
- `getDndSpellPreparationModel` centralizes preparation mode, spellcasting ability, standard slots, pact magic, prepared limit approximation, rule hints, and deferred markers.
- Prepared spell limits for formula-based classes remain v1 approximations; full official spell list, full spell preparation UI, Wizard spellbook workflow, HP/Hit Dice rest automation, exhaustion/conditions, enemy/target/damage pipeline, and full combat Action Registry remain deferred.

DND Spellcasting Path Unification v1 scope:
- Gameplay spell casting now routes through `consumeSpellcastingResource` for cantrips, standard spell slots, and Pact Magic slots.
- Legacy `consumeSpellSlot` remains as a compatibility wrapper instead of a separate UI path.
- Spell casting writes structured local `RuntimeLogEntry` records with spell name, spell level, resource type, slot level, previous/remaining slots, and pact magic metadata.
- Pact Magic slots take priority over standard spell slots for any spell at or below `pactMagicState.slotLevel`. When pact slots are exhausted, the cast returns `ok: false` without falling back to standard slots. This is correct for pure Warlocks and is a v1 simplification for multiclass characters who hold both slot types.
- No spell effects, target selection, concentration, saving throws, damage automation, Action Registry spellSlot costs, schema, migration, COC, or CP RED changes.

DND Structured Equipment Data Layer v1 scope:
- DND structured equipment data layer v1 added. Includes minimal typed weapon / armor / gear data and read-only display.
- Types live in `src/lib/dnd2024/equipment-types.ts`; sample data (6 weapons, 4 armor/shield, 4 gear/tools, source `dnd2024-basic`) lives in `src/data/dnd2024/equipment.ts` (landmark `DND_EQUIPMENT_DATA_LAYER`).
- DND Sheet shows a read-only 装备资料 / Equipment Catalog panel (`src/pages/sheet/DndEquipmentCatalogPanel.tsx`); it does not write to the character store and writes no RuntimeLogEntry.
- Inventory, equip/unequip, AC automation, attack rolls, damage rolls, weapon mastery, ammo, magic items, attunement, and Action Registry integration remain deferred.
- No CharacterData schema or migration changed.

DND Resource Consumption Unification v1 scope:
- DND Resource Consumption Unification v1 added.
- Class resource consumption now uses centralized `consumeClassResource` instead of component-level naked subtraction.
- Action Registry v0 resource-backed actions call `consumeClassResource` for class resources and continue routing Pact Magic consumption through `consumeSpellcastingResource`.
- Spell slot and pact magic consumption continue to route through `consumeSpellcastingResource`, preserving the Pact Magic no-fallback v1 semantics.
- Action Registry v1, action economy, attacks, damage, targets, equipment combat, schema, and migration remain deferred.

DND Background / Species Correction v1 scope:
- DND Background / Species Correction v1 started. Legacy 2014 race/subrace/background-feature data is retained but quarantined or marked legacy (`LEGACY_RACE_DATA` / `LEGACY_BACKGROUND_DATA`, usagePolicy `quarantine`).
- Default DND 2024 species data still follows the earlier source-matched 9-species baseline pending CHM species correction. Default background data now follows the local CHM primary source baseline with 16 standard DND 2024 backgrounds.
- Species traits / size / speed / languages and background skill / origin-feat / equipment / ability-option mappings are NOT fabricated; they carry `needs-human-verification` metadata, and Creator skips empty species placeholder values instead of writing them into characters.
- 半精灵 / 半兽人 / 吉斯洋基人 and 2014 subraces are marked out-of-source / quarantined; TCoE 定制血统 recorded as needs-human-check only. The legacy 艺人 background's Musician / Tough (音乐家 / 健壮) mix-up is fixed.
- Minimal compatible type extension only: optional `id` / `ruleMeta` fields on `RaceDef` / `BackgroundDef`.
- No COC / CP RED / Platform changes. No schema / migration changed (race/subrace/background remain plain string fields; racebonus stays an existing numeric field written as 0 for 2024 species).
- Landmark: `DND_BACKGROUND_SPECIES_CORRECTION`.

DND Character Options Source Completion v1 scope:
- DND is now prioritized as the first fully finished system before moving deeply into COC / CP RED.
- Character option index completion is separated from runtime automation: source-labeled indexes may exist without being treated as fully automated gameplay rules.
- `src/data/dnd2024/spellIndex.ts` adds a display-only spell index of all 507 owner-manifest spell entries (SRD5.2 391 / TCoE 21 / XGtE 95) with English name, level, and scope; Chinese names, schools, class lists, and effects remain needs-human-check. Runtime `SPELL_DATA` stays at 20 entries and is unchanged.
- `src/data/dnd2024/characterOptionsIndex.ts` adds display-only indexes: classes (奇械师 / Artificer source-indexed from TCoE), backgrounds (4 SRD + 1 XGtE partial), feat source files (7, category-file level only), equipment categories (13), plus `DND_CHARACTER_OPTIONS_COMPLETION_REPORT` recording runtime-vs-manifest gaps (classes runtime 12/13 — 奇械师 source-indexed / runtime-deferred; subclasses 46/73).
- No index is wired into Creator / Sheet / Gameplay runtime; Creator behavior unchanged (runtime BACKGROUND_DATA already equals the 4 owner-source-confirmed backgrounds).
- No long rules text copied; no model-memory completion; feat/equipment individual rows deliberately NOT fabricated (manifest only confirms category files).
- No schema / migration, COC, CP RED, or Platform changes.
- Landmark: `DND_CHARACTER_OPTIONS_SOURCE_COMPLETION`.

DND 2024 Completion Checklist:

| Area | Status |
|---|---|
| Species | 9/9 SRD 来源条目入默认列表；特性提取 needs-human-check；TCoE 定制血统未计入 |
| Backgrounds | 16/16 local CHM 标准背景已进入 runtime 默认；详细机制、技能、出身专长、装备、属性选项待人工核对 |
| Origin Feats | runtime 7 条 ai-assisted；来源仅类别文件级，单条提取待后续轮 |
| General Feats | runtime 9 条 ai-assisted；来源仅类别文件级 |
| Classes | runtime 12/13；奇械师 TCoE 已 source-indexed / runtime-deferred |
| Subclasses | 46/73（差额归 Class/Subclass Correction 系列） |
| Spells | runtime 20 / index 507（507 全量 display-only 索引完成） |
| Equipment | runtime 样例 14 件 / 类别索引 13/13；单件行待表格提取 |
| Runtime Automation | 法术效果 / 专长效果 / 装备规则 / 子职业特性自动化均未做（按计划 deferred） |
| Creator Safety | 未接入任何 index；默认列表行为不变 |
| Sheet Safety | 未新增 Sheet 接线；既有只读展示不变 |
| Gameplay Safety | 施法 runtime / RollConsole / RuntimeLogEntry 未变 |

DND Product Shell Phase 1 scope:
- DND Product Shell Phase 1 added. DND now enters through a workspace dashboard instead of feeling like a small utility panel.
- `src/pages/dndWorkspace/DndWorkspaceShell.tsx` wraps the preserved DND workspace with secondary navigation (工作台总览 / 角色库 / 规则库 / 规则源状态 / 进入游玩); PlayWorkspace delegates to it only when the active system is D&D.
- Ruleset source/expansion status (DND 2024 / SRD5.2 core; XGtE / TCoE expansions with sourceId and runtime-ready / source-indexed / needs-human-check labels) is visible before character workflows; display-only, no real source toggle filtering.
- The dashboard shows data completion cards driven by `DND_CHARACTER_OPTIONS_COMPLETION_REPORT` / index exports (no scattered hardcoding) and module entry cards into Creator / Sheet / Gameplay / compendium placeholders.
- Existing Creator / Sheet / Gameplay are preserved unchanged as the workspace "play" view; COC / CP RED rendering paths are untouched.
- No rules data, schema, migration, or runtime logic changed. New zh/en copy added under `dndWorkspace.*` translation keys.
- Landmark: `DND_PRODUCT_SHELL_PHASE_1`.

### Call of Cthulhu (COC)

| Item | Status |
|------|--------|
| schemaVersion + migrateCocCharacter | ✅ Done |
| coc-utils pure functions (HP/MP/SAN/d100 check) | ✅ Done |
| CocCreator — uses getCocDerivedHp/Mp/InitialSan/SanMax | ✅ Done |
| CocSheet — uses evaluateCocD100Check | ✅ Done |
| CocGameplay — uses evaluateCocD100Check | ✅ Done |
| COC runtime state v2 foundation | ✅ Done |
| COC Runtime State UI Panel v1 | ✅ Done |
| COC Gameplay RollConsole RuntimeLogEntry v1 | ✅ Done |
| COC Skill Check Wiring v1 | ✅ Done |
| COC SAN Check + Luck Spending v1 | ✅ Done |
| COC Pushed Roll v1 | ✅ Done |
| COC Growth Check v1 | ✅ Done |
| COC Bonus / Penalty Dice v1 | ✅ Done |
| COC Gameplay Componentization v1 | ✅ Done |
| COC Creator skill point constraint v1 | ✅ Done |
| COC Sheet responsibility cleanup v1 | ✅ Done |

COC runtime state v2 foundation scope:
- Adds local character `runtime` state for HP, MP, SAN, Luck, status flags, skill growth marks, and pushed roll context.
- Migrates old COC characters to schemaVersion 2 and fills missing runtime fields idempotently.
- Adds store actions for runtime initialization and manual HP/MP/SAN/Luck/flag/growth-mark/pushed-roll updates.
- No COC UI wiring, Keeper Console, visibility filtering, full insanity flow, Luck spending UI, or pushed roll UI.

COC Runtime State UI Panel v1 scope:
- CocGameplay displays runtime-first HP, MP, SAN, and Luck values with legacy fallback.
- CocGameplay uses existing runtime store actions for HP/MP/SAN/Luck adjustment and manual runtime flag toggles.
- No RollConsole, RuntimeLogEntry, Skill Check wiring, SAN Check workflow, Luck spending workflow, Pushed Roll UI, Keeper Console, or visibility filtering.

COC Gameplay RollConsole RuntimeLogEntry v1 scope:
- CocGameplay local logs use `RuntimeLogEntry[]` instead of `string[]`.
- CocGameplay displays a RollConsole-style Latest Result and structured history log from local runtime log entries.
- Existing resource adjustments, flag toggles, runtime initialization, SAN quick roll, and free dice roll log producers write local COC RuntimeLogEntry objects.
- No store, schema, migration, full Skill Check wiring, SAN Check workflow, Luck spending workflow, Pushed Roll UI, Keeper Console, gmOnly filtering, reveal workflow, combat, or chase changes.

COC Skill Check Wiring v1 scope:
- CocGameplay displays player-facing public skill checks from the existing character skills list.
- Skill check results use `evaluateCocD100Check` and write local `RuntimeLogEntry` objects for CocRollConsolePanel Latest Result and history display.
- SAN quick roll now uses the runtime-first SAN current value.
- No store, schema, migration, Luck spending, Pushed Roll, growth resolution, SAN Check workflow, Keeper Console, gmOnly filtering, reveal workflow, combat, or chase changes.

COC SAN Check + Luck Spending v1 scope:
- CocGameplay has a minimum SAN Check panel with preset/custom SAN loss expressions, applies SAN loss through existing `changeSan`, and writes local `RuntimeLogEntry` results.
- Eligible failed public skill checks can spend Luck to become ordinary success through existing `changeLuck`, with a follow-up `RuntimeLogEntry`.
- No full insanity automation, Pushed Roll, growth resolution, Keeper Console, AI Host, multiplayer, store, schema, migration, DND, or CP RED changes.

COC Pushed Roll v1 scope:
- Eligible failed non-fumble public skill checks can make one local Pushed Roll from CocGameplay.
- Pushed Roll does not modify the original failed skill check entry; it appends a new local `RuntimeLogEntry` with `pushed-roll`, source entry id, result tags, and Keeper-adjudication note on failure.
- Luck Spending and Pushed Roll are mutually cleared after either correction path is used; no store/schema/migration changes.
- No full Keeper Console, full insanity automation, Growth Check, AI Host, map, multiplayer, DND, or CP RED changes.

COC Growth Check v1 scope:
- Successful public skill checks can be marked for growth using existing persisted `runtime.skillGrowthMarks`.
- Marked skills can run a minimum growth check in CocGameplay: roll d100, improve only when roll is greater than current skill, then write `min(99, previousValue + 1d10)`.
- Growth success now applies maximum skill cap 99; the RuntimeLogEntry payload records `rawNewValue`, `cap`, and `capped`.
- Growth mark, clear, and resolution events write local `RuntimeLogEntry` records for the CocGameplay RollConsole.
- No Keeper Console, full campaign advancement, occupation/archetype progression, full insanity automation, map, multiplayer, AI Host, DND, or CP RED changes.

COC Bonus / Penalty Dice v1 scope:
- COC bonus / penalty dice v1 implemented. Supports normal, 1/2 bonus dice, and 1/2 penalty dice.
- `rollCocD100WithDice` / `evaluateCocD100CheckWithDice` in `coc-utils` roll extra tens dice and delegate success-level evaluation to the existing `evaluateCocD100Check` path (landmark `COC_BONUS_PENALTY_DICE_RESOLUTION`).
- Bonus and penalty dice cancel each other before rolling; the CocGameplay checks panel uses a mutually exclusive 惩罚 2 / 惩罚 1 / 普通 / 奖励 1 / 奖励 2 selector defaulting to 普通.
- Skill check RuntimeLogEntry records final roll and tens dice selection (`finalRoll`, `onesDie`, `tensDice`, `selectedTens`, `bonusDice`, `penaltyDice`, `source: 'coc-check'`).
- Pushed Roll, Sanity, Madness, Opposed Roll, and Keeper tools remain deferred and unchanged; no store, schema, migration, DND, or CP RED changes.

COC Gameplay Componentization v1 scope:
- `CocGameplay.tsx` now orchestrates local state, runtime handlers, roll handlers, and panel composition while COC Gameplay UI sections live under `src/pages/cocGameplay/`.
- Extracted RollConsole, Runtime State, Checks, Dice Tray, and COC Gameplay shared helper modules.
- Behavior is intended to stay unchanged: local RuntimeLogEntry history remains capped at 20, latest entry stays first, entries use `system: 'coc'` and `visibility: 'public'`.
- Free Dice Tray remains in Gameplay as an isolated utility panel for now.
- No store, schema, migration, SAN Check workflow expansion, Luck Spending, Pushed Roll, Growth resolution, Keeper Console, AI Host, multiplayer, DND, or CP RED changes.

COC Creator skill point constraint v1 scope:
- CocCreator Step 3 now provides creation-time skill allocation with EDU × 4 occupational points and INT × 2 personal interest points.
- Skills can be marked occupational, personal, or unallocated, with current values clamped between base value and 90.
- No occupation skill table, Credit Rating range, age adjustments, Sheet cleanup, Gameplay automation, or Keeper Console.

COC Sheet responsibility cleanup v1 scope:
- CocSheet no longer performs sheet-side roll/toast checks or unrestricted skill value editing.
- HP, MP, SAN, and Luck are displayed read-only from runtime state with legacy field fallback.
- Skill growth checkboxes use `runtime.skillGrowthMarks`; no automatic growth resolution or Gameplay RollConsole wiring.

### Cyberpunk RED (CP)

| Item | Status |
|------|--------|
| schemaVersion + migrateCpCharacter | ✅ Done |
| cp-utils pure functions (HP/SW/DB/Humanity/exploding-d10/skill-check) | ✅ Done |
| CpSheet responsibility cleanup v1 | ✅ Done |
| CP RED runtime state foundation v2 | ✅ Done |
| CP RED Gameplay RollConsole RuntimeLogEntry v1 | ✅ Done |
| CP RED Skill Check Wiring v1 | ✅ Done |
| CP RED Log Envelope Purification v1 | ✅ Done |
| CP RED Gameplay Componentization v1 | ✅ Done |
| CP RED Equipment / Market Inventory Flow v1 | ✅ Done |
| CP RED Stable Item Instance ID v1 | ✅ Done |
| CP RED Critical Injury Manual Tracking v1 | ✅ Done |
| CpGameplay — uses evaluateCpExplodingD10 / evaluateCpSkillCheck | ✅ Done |
| cpStore — uses getCpMaxHp / getCpSeriouslyWoundedThreshold / getCpDeathSaveBase / getCpHumanityMax / isCpCyberpsycho | ✅ Done |

CP RED runtime state foundation v2 scope:
- Adds optional `runtime` state for HP, Humanity, runtime EMP, armor SP shell, wound flags, and critical injury tracking.
- Runtime foundation migrated old CP RED characters to schemaVersion 2 and filled missing runtime state idempotently; Stable Item Instance ID v1 now bumps CP RED character schemaVersion to 3.
- Adds runtime store actions for initialization, refresh, HP/Humanity deltas, runtime flags, and critical injury tracking.
- No CP RED UI changes, RuntimeLogEntry integration, RollConsole, no-DV path, armor/ammo/damage automation, Netrunning, GM Console, or AI Host.

CP RED Gameplay RollConsole RuntimeLogEntry v1 scope:
- CpGameplay local logs now use `RuntimeLogEntry[]` instead of `string[]`.
- CpGameplay displays a RollConsole-style Latest Result derived from the first runtime log entry, with structured history in the same result center.
- Existing CP RED skill checks, stat checks, role ability checks, death saves, damage rolls, resource adjustments, injury handling, free dice rolls, and system messages now write local CP RED `RuntimeLogEntry` objects.
- Log Envelope Purification v1 removes the legacy string `addLog` compatibility path; current CP RED runtime log writes must pass structured `RuntimeLogEntry` objects.
- No store, schema, migration, CP RED type, cp-utils, Sheet, Creator, DND, or COC changes.
- No armor ablation, ammo tracking, full combat automation, critical injury pipeline expansion, Netrunning expansion, GM Console, gmOnly/reveal, AI Host, multiplayer, map, or scene work.

CP RED Skill Check Wiring v1 scope:
- No-DV role ability checks now display `等待 GM 判定` instead of success/failure and include `no-dv` / `gm-adjudication` tags.
- CpGameplay skill check success handling avoids non-null assertion and keeps the existing DV-based behavior.
- Netrunner no-roll actions, NET damage prompts, Solo pool reset, and Lawman backup calls now write structured local `RuntimeLogEntry` objects instead of string system logs.
- The string `addLog` compatibility path has been removed; new writes must use structured local `RuntimeLogEntry` objects.
- No rule expansion, Netrunning state machine, armor ablation, ammo tracking, full damage pipeline, GM Console, AI Host, store, schema, migration, DND, or COC changes.

CP RED Gameplay Componentization v1 scope:
- `CpGameplay.tsx` now orchestrates local state, handlers, and panel composition while CP RED Gameplay UI sections live under `src/pages/cpGameplay/`.
- Extracted RollConsole, runtime state, checks, role ability, damage/death save/injury, and free dice tray panels.
- Behavior is intended to stay unchanged: local RuntimeLogEntry history remains capped at 20, latest entry stays first, entries use `system: 'cpred'` and `visibility: 'public'`.
- Free Dice Tray remains in Gameplay as an isolated utility panel for now.
- No store, schema, migration, armor/ammo automation, Netrunning state machine, GM Console, AI Host, multiplayer, DND, or COC changes.

CP RED Equipment / Market Inventory Flow v1 scope:
- Reuses existing CP RED inventory/equipment fields and store actions for market-to-inventory flow.
- CpMarket can add weapons, armor, cyberware, fashion, and gear to character inventory using existing EB/fashion EB purchase paths.
- CpSheet shows inventory/equipment state and supports equip/unequip/install/uninstall without losing items.
- Cyberware install/uninstall is state-only; Humanity Loss automation remains deferred.
- CP RED Stable Item Instance ID v1 adds `instanceId` to inventory/equipped weapons, armor, cyberware, fashion, and gear.
- Same-name duplicate items can coexist at the inventory/equip flow level; legacy missing `instanceId` values are migrated or handled by safe fallback.
- Durability, ammo, armor ablation, Humanity Loss automation, and full damage pipeline remain deferred.
- No armor ablation, ammo tracking, full damage pipeline, Netrunning state machine, GM Console, AI Host, DND, or COC changes.

CP RED Critical Injury Manual Tracking v1 scope:
- CP RED Critical Injury Manual Tracking v1 added. Supports manually adding/removing body/head critical injuries and logging them.
- `src/lib/cp2024/critical-injuries.ts` adapts the existing 2d6 tables in `cp-types.ts` into id/location-tagged definitions (landmark `CPRED_CRITICAL_INJURY_MANUAL_TRACKING`); no new injury text was authored.
- `CpCriticalInjuryPanel` in CpGameplay lets the player pick a body/head entry, add it, and remove tracked entries; add/remove writes structured `RuntimeLogEntry` records with `action: 'add-critical-injury' / 'remove-critical-injury'` and `source: 'cpred-critical-injury'`.
- Tracking reuses the existing safe `runtime.criticalInjuries` state and `addCriticalInjury` / `removeCriticalInjury` store actions (dual-written with the legacy `injuries` field), so entries persist via the existing runtime state; no schema or migration changed.
- The pre-existing damage-roll auto-injury path and Damage Panel INJURY TRACKER are unchanged.
- Automatic damage triggers, armor ablation, ammo, treatment, death saves, and full damage pipeline remain deferred.

Local Data Contract Hardening v1 scope:
- Local Data Contract Hardening v1 added.
- Character export now uses a `trpg-platform.character` envelope with `system`, `schemaVersion`, `exportedAt`, and `character`.
- Legacy naked character JSON import remains supported through centralized compatibility parsing.
- Envelope and legacy imports restore the detected DND / COC / CP RED system character through the existing store load actions.
- Module/community package import, storage adapter, backend, cloud sync, campaign/session persistence, and multi-character library remain deferred.
- No DND / COC / CP RED rule logic, store schema, or migration changed.

Platform Character Entry Pattern Alignment v1 scope:
- Platform Character Entry Pattern Alignment v1 completed.
- DND keeps the existing lightweight Character Vault and creation method entry pattern.
- COC now has a lightweight Investigator Vault, current-investigator context actions, and a creation method screen before the existing COC Creator.
- CP RED now has a lightweight Edgerunner Vault, current-character context actions, and a creation method screen before the existing CP RED Creator.
- Standard Creation opens the existing system creator. Quick Creation, Local Import, and Workshop Import are planned placeholders only.
- Sheet / Gameplay / RollConsole assets remain reachable through character-context actions; no runtime logic, dice algorithm, import/export logic, store schema, migration, or rule data changed.
- System Navigation & Home Density Polish v1 completed. Game System Home pages now reduce duplicate navigation, use top navigation for system sections, and use the home body for overview and recommended next actions.
- DND Home no longer repeats the full top-nav module list in the body; it keeps current character / vault, create character, and compendium as primary CTAs plus a compact system status entry.
- COC and CP RED Home pages now follow the same overview + recommended-next-action pattern instead of rendering a dense module grid.
- Back / breadcrumb labeling is clarified: the outer Play menu returns to system selection, while system workspace pages return to the current system home/workspace.
- Landmark: `SYSTEM_NAVIGATION_HOME_DENSITY_POLISH`. No store schema, runtime logic, rule data, map, inventory, session, workshop, backend, or plugin implementation changed.
- System Home Navigation Deduplication v1 completed. Game System Home pages now avoid duplicated navigation between top system tabs and body cards.
- Home bodies now focus on current asset context and recommended next actions: current character / investigator / Edgerunner summary, open sheet, start play/investigation/mission, or create the first asset when empty.
- Data coverage, index categories, and architecture boundary details are routed to their proper secondary pages or collapsed guidance.
- Landmark: `SYSTEM_HOME_NAVIGATION_DEDUPLICATION`. No store schema, runtime logic, rule data, map, inventory, session, workshop, backend, or plugin implementation changed.
- Platform Navigation History Stack v1 completed. The platform now supports a lightweight app-level back stack for internal navigation across Home, Play, Game System Workspace, Actor context, Sheet, Builder, and Runtime entry points.
- Fixed "return to system select" behavior is replaced with contextual "back one level" behavior where prior navigation state exists; if no prior app state exists, workspace back falls back to system selection and dead-end shell pages fall back to Home.
- The navigation stack stores UI location only: app view, play stage, active placeholder, selected system, and PlayWorkspace tab/view state. It does not store character data or alter persisted stores.
- Landmark: `PLATFORM_NAVIGATION_HISTORY_STACK`. No store schema, runtime logic, dice algorithm, rule data, React Router, browser URL routing overhaul, map, inventory, session, workshop, backend, or plugin implementation changed.
- System Actor Session Workspace IA Correction v1 completed. DND / COC / CP RED workspace dashboards now declare System / Actor / Session workspace tier boundaries via planned-module notes and concept cards.
- DND planned modules corrected: `inventory` → Actor Workspace; `map` → Session / Campaign Workspace; `journal` → Actor Workspace. New IA concept section added to DND dashboard.
- COC planned modules corrected: `handouts` / `locations` → Session / Campaign Workspace; `notes` → Actor Workspace (renamed to '调查员笔记'). New planned cards for COC 规则库/技能索引 and 数据完成度. New IA concept section added to COC dashboard.
- CP RED planned modules corrected: `encounter` / `map` / `sessionLog` → Session / Campaign Workspace. New planned cards for CP RED 规则库/装备索引 and 数据完成度. New IA concept section added to CP RED dashboard.
- Landmark: `SYSTEM_ACTOR_SESSION_WORKSPACE_IA_CORRECTION` placed in `DndWorkspaceShell.tsx` and `PlayWorkspace.tsx`. No runtime logic, dice algorithm, store schema, migration, or rule data changed.
- CP RED Workspace Cleanup v1 completed. The CP RED workspace now exposes a clean DND-aligned platform shell with overview, Edgerunner Vault, creation method, Edgerunner sheet, mission runtime, rules compendium, and source status sections.
- Legacy CP RED runtime code remains preserved and embedded only as the mission panel content via `CpGameplay embedded`.
- The CP RED Edgerunner sheet route now uses a platform-style summary shell with Start Mission / Continue Editing context actions instead of rendering the old detailed tool page as the workspace-level sheet.
- No store schema, CP RED save format, CP RED rule data, runtime logic, dice algorithm, real multi-Edgerunner store, rules engine, source manager, map, inventory, session, workshop, or plugin implementation changed.
- Landmark: `CPRED_WORKSPACE_CLEANUP_V1`.
- COC Builder BG3-like Shell v1 completed. COC Standard Creation now enters a platform Builder shell with left creation steps, center section content, and right investigator summary / preview.
- The COC Builder shell is read-only/preview-oriented in this phase; it does not change COC store schema, Investigator save format, rule data, runtime logic, dice algorithm, import/export behavior, or true multi-investigator storage.
- Landmark: `COC_BUILDER_BG3_LIKE_SHELL_V1`.
- CP RED Builder BG3-like Shell v1 completed. The CP RED Edgerunner creation flow now uses a DND-aligned BG3-like builder shell with left step navigation, center step content, and right Edgerunner summary.
- Standard creation enters the new builder shell, while quick creation, local import, and Workshop import remain planned. No store schema, CP RED save format, CP RED rule data, runtime logic, dice algorithm, real multi-Edgerunner store, import/export logic, rules engine, source manager, workshop, map, inventory, or session implementation changed.
- Landmark: `CPRED_BUILDER_BG3_LIKE_SHELL_V1`.
- Platform Pattern + Workspace Section Contract v1 completed. The project now defines platform-level patterns for Game System Workspace, Actor Entry, Builder, Sheet, Runtime, Rules Compendium, Source Status, Session/Campaign, and Navigation. DND, COC, CP RED, and future systems are treated as implementations of platform patterns rather than copies of one another. No src code, store schema, runtime logic, rule data, routing, workshop, map, inventory, or session implementation changed.
- New document: `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` — 9 platform patterns, the 9-entry Workspace Section Contract with implemented/planned/absent three-state semantics, top-navigation rules, Builder/Sheet/Runtime pattern detail, Rules Compendium vs Source Status boundary, Navigation Back/Up/Breadcrumb concept (impl deferred to a later round), future-extension coverage, high-risk boundary list, and a Codex/CC pre-implementation acceptance template.
- This document complements `docs/architecture/PLATFORM_CORE_CONCEPTS.md`: Core Concepts owns vocabulary + Game System Registry field spec; Patterns + Contract owns how a Game System surfaces those objects in UI/IA.
- Landmark: `PLATFORM_PATTERNS_WORKSPACE_CONTRACT_V1` in `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md`.
- Navigation Back / Up / Breadcrumb Model v1 completed. The platform now formally distinguishes historical Back, deterministic parent Up, and Breadcrumb path navigation. Back remains history-stack based, Up is resolved from LocationNode parent relationships, and Breadcrumb is derived from the current LocationNode ancestor chain. This is a documentation-only architecture baseline; no src code, store schema, runtime logic, rule data, URL routing, React Router, browser History API, map, inventory, session, workshop, or plugin implementation changed.
- New document: `docs/architecture/NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md` — three navigation semantics, the `LocationNode` model, deterministic parent resolver, breadcrumb derivation, back-stack push/skip rules, per-Section default parents, V1 minimal/not-do guidance, navigation UI spec, DND/COC/CP RED/wargame example scenarios, high-risk boundary list, and a navigation-task acceptance template.
- Up and Breadcrumb are never derived from the history stack; Up uses the parent resolver, Breadcrumb walks the `parentId` chain. V1 adds no React Router, no URL routing, and no browser History API rewrite.
- Landmark: `NAVIGATION_BACK_UP_BREADCRUMB_MODEL_V1` in `docs/architecture/NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md`.

System Actor Session Workspace IA Correction v1 scope:
- Three-tier workspace IA defined: System Workspace (rule scope, character library, creation, compendium, source status, completion); Actor Workspace (character card, current status, resources, inventory, start playing, personal journal); Session / Campaign Workspace (map, token, handout, session log, encounter, GM tools).
- DND planned module notes updated: `dndWorkspace.planned.inventory` → Actor Workspace; `dndWorkspace.planned.map` → Session / Campaign Workspace; `dndWorkspace.planned.journal` → Actor Workspace.
- COC planned module notes updated: `multiWorkspace.coc.notes.handouts` / `.locations` → Session / Campaign Workspace; `.notes` → Actor Workspace. Label for `notes` module renamed to '调查员笔记 / Investigator Notes'. New planned module cards `compendium` and `completion` added to cocModuleCards array (System Workspace level).
- CP RED planned module notes updated: `multiWorkspace.cp.notes.encounter` / `.map` / `.sessionLog` → Session / Campaign Workspace. New planned module cards `compendium` and `completion` added to cpModuleCards array (System Workspace level).
- New `dndWorkspace.ia` i18n section added (zh-CN + en) with Actor/Session concept card text.
- New `multiWorkspace.ia` i18n section added (zh-CN + en) with Actor/Session concept card text and multiCampaign note.
- IA concept card sections (UI only, no state) added to DND workspace dashboard and COC/CP workspace dashboards.
- No runtime logic, dice algorithm, store schema, migration, COC/CP/DND rule data, or import/export logic changed.
- Landmark: `SYSTEM_ACTOR_SESSION_WORKSPACE_IA_CORRECTION`.
- System Actor Session Workspace IA Correction Follow-up v1 completed. Actor-level and session-level modules were removed from all three system dashboard module grids and are now represented only in the workspace-tier guidance section.
- DND: `inventory`, `map`, `journal` cards removed from `moduleCards` array. System dashboard now shows only system-level entries (characters, create, sheet, compendium, spell/feat/equipment/class index, sources).
- COC: `handouts`, `notes`, `locations` cards removed from `cocModuleCards` array. System dashboard now shows only system-level entries (vault, create, sheet, skill checks, pushed rolls, growth checks, compendium, completion, sources).
- CP RED: `encounter`, `map`, `sessionLog` cards removed from `cpModuleCards` array. System dashboard now shows only system-level entries (vault, create, sheet, skill checks, combat, market, cyberware, netrunning, compendium, completion, sources).
- Workspace-tier guidance section strengthened: `dndWorkspace.ia.note`, `multiWorkspace.ia.note` keys added; Actor/Session notes expanded to include all specified modules (角色卡/调查员卡/Edgerunner卡, 背包/装备, 状态, 资源, 开始游玩, 个人日志 for Actor; 地图/Board/Scene, Token, Handout/线索, Encounter/Enemy, Session Log, GM工具, 玩家列表 for Session).
- No runtime logic, dice algorithm, store schema, migration, COC/CP/DND rule data, or import/export logic changed.

System Actor Session Workspace IA Correction Follow-up v1 scope:
- Removed 9 non-system-level planned module cards total: DND (inventory, map, journal), COC (handouts, notes, locations), CP RED (encounter, map, sessionLog).
- These modules are still referenced in workspace-tier guidance `<div>` sections (informational, non-clickable), not in the `<button>` module grid.
- New i18n keys: `dndWorkspace.ia.note` and `multiWorkspace.ia.note` (both zh-CN and en).
- Updated i18n keys: `dndWorkspace.ia.actorWorkspaceNote`, `dndWorkspace.ia.sessionWorkspaceNote`, `multiWorkspace.ia.actorWorkspaceNote`, `multiWorkspace.ia.sessionWorkspaceNote`.
- No new module card keys. No store, schema, migration, or rule data changes.

---

## Build Status

| Check | Status |
|-------|--------|
| npx tsc --noEmit | ✅ Passing |
| npm run build | ✅ Passing |
| Git committed | ⏳ Pending |

---

## Known Intentional Non-Replacements

- `computeEmpFromHumanity` in `cpStore.ts` — delta-based (adjusts EMP only at ten-boundary crossings). Semantically different from `getCpRuntimeEmp` (absolute `floor(humanity/10)`). Left as-is by design.

---

## Explicitly Out of Scope (This Phase)

- CP: armorState, armor ablation, ammo consumption
- CP: roleAbilityState, netrunningState, vehicleState
- CP: getCpArmorPenetration / getCpHeadshotDamageAfterArmor / hasCpCriticalInjury
- COC: insanity system, skill improvement rolls
- DND: spell effects, target selection, concentration, action economy, combat automation

---

## Directory Layout (src)

```
src/
  lib/
    dnd-types.ts / dndMigration.ts
    coc-types.ts / cocMigration.ts / coc-utils.ts
    cp-types.ts  / cpMigration.ts
    cp2024/
      cp-utils.ts
  store/
    dndStore.ts
    cocStore.ts
    cpStore.ts
  pages/
    DndCreator.tsx / DndSheet.tsx / DndGameplay.tsx
    CocCreator.tsx / CocSheet.tsx / CocGameplay.tsx
    CpCreator.tsx  / CpSheet.tsx  / CpGameplay.tsx / CpMarket.tsx
```
