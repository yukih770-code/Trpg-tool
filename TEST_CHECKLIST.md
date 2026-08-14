# Test Checklist

Run this checklist after every development round before committing.

---

## 1. Build Checks (Required)

```bash
cd D:\Download\dnd

npx tsc --noEmit
# Expected: no errors, no output

npm run build
# Expected: build succeeds, dist/ generated without errors
```

Both must pass before committing.

### DND Level-One Character Commit Chain

```bash
npm run frontend:verify:dnd-level-one-character
npm run frontend:verify:character-entry
npm run frontend:verify:character-entry-cta
npm run frontend:verify:room-player-flow
```

- [ ] 空白自动草稿不出现在角色库；开始填写后作为“不完整”草稿可见。
- [ ] 检查页的阻断项可返回对应栏目，未清除时不能完成。
- [ ] 法术资料不完整与起始装备未生成显示为诚实警告，不伪造规则完成度。
- [ ] 完成后角色库记录与当前角色同步，刷新后仍为“已完成”。
- [ ] 从战役创建角色会打开正式 Builder；完成后恢复战役 return context。
- [ ] 已完成及不完整 Owned Actor 均可进入房间选择，最终准入仍由房间/主持人审批。

---

## Architecture Contract Checks

- [ ] `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` contains `AI-LANDMARK: SYSTEM_APP_SHELL_THEME_LAYERING_PRINCIPLE_V1`.
- [ ] Game System Workspace Pattern distinguishes Platform Shell, System App Shell, and System Theme / Adapter layers.
- [ ] New system onboarding tiers A / B / C are documented.
- [ ] DND is documented as a reference implementation, not a copy template for COC / CP RED.
- [ ] This docs-only principle update does not modify `src/`, store, schema, runtime, rule data, dice, React Router, or URL routing.
- [ ] Platform contract distinguishes Actor Vault, Campaign Vault, Source Settings, Builder Flow, Session Runtime / VTT, and Workshop responsibilities.
- [ ] Source Settings are documented as system-level settings consumed by Builder, not as scattered per-step Builder controls.
- [ ] Workshop item classes include Playable Asset, Table Asset, Creative Work, and Creator Space, with usageType reserved as principle only.
- [ ] UI Action Hierarchy contract documents Developer Scaffold Mode and forbids planned/scaffold/mock UI from pretending real upload, networking, map sync, or multiplayer Session success.
- [ ] This scaffold-pattern update does not implement Campaign Vault UI, Source Manager, Workshop, VTT, backend, browser History API, or any `src/` behavior.

---

## 2. Page Smoke Tests (Manual)

Open the app in the browser and verify each page loads without crashing.

### Platform Shell

- [ ] App opens to Platform Home by default
- [ ] Sidebar can collapse and expand; collapsed state shows icons only
- [ ] Sidebar collapsed state persists after refresh via localStorage (`trpg-platform-sidebar-collapsed`)
- [ ] Sidebar primary navigation shows Home / Play / Settings; placeholder pages remain reachable from Home cards
- [ ] Sidebar Play and Home "Enter Play" open the Play Main Menu, not a character sheet
- [ ] Play Main Menu shows DND 5e 2024 / COC 7e / Cyberpunk RED cards with a short description and a status label
- [ ] Selecting a ruleset card enters that ruleset's preserved PlayWorkspace
- [ ] Home ruleset cards still enter the selected ruleset workspace directly
- [ ] Active ruleset workspace shows contextual "返回上一层 / Back One Level" when a previous internal state exists
- [ ] If no previous internal state exists, workspace back falls back to "返回系统选择 / Back to System Selection"
- [ ] Home → Play → ruleset workspace → Vault / Sheet / Runtime navigation can return one app-level state at a time
- [ ] Navigation stack restores UI location only and does not copy or mutate character data
- [ ] Browser URL routing and React Router remain unintroduced
- [ ] No router was introduced for Play Menu / workspace staging
- [ ] Campaigns shows a Coming Soon placeholder and does not crash
- [ ] Community Modules shows a Coming Soon placeholder and does not crash
- [ ] Private Import explains v1 character JSON import boundary and does not implement module / ZIP import
- [ ] Content Studio shows a Coming Soon placeholder and does not crash
- [ ] AI Host shows a Coming Soon placeholder and does not crash
- [ ] Settings shows a placeholder if no real settings surface exists
- [ ] Platform Home defaults to Chinese
- [ ] Language switch is located under Settings / Language
- [ ] Home no longer presents language switching as a primary action
- [ ] Home cards use short product labels instead of long developer explanations
- [ ] Coming Soon states remain visible and not misleading
- [ ] Switching language in Settings updates Shell/Home/Placeholder text immediately
- [ ] Language toggle in Settings switches between 中文 and English
- [ ] Locale persists after refresh via localStorage
- [ ] Platform Shell / Home / Placeholder copy is read through `src/i18n` translation keys
- [ ] New locale support can be added by adding a locale file and registering it in `src/i18n/index.ts`
- [ ] Small helper text / placeholder text / Coming Soon text is localized
- [ ] Ruleset names and common acronyms remain readable
- [ ] PlayWorkspace behavior remains unchanged
- [ ] PlayWorkspace still exposes DND / COC / Cyberpunk RED system selector
- [ ] PlayWorkspace still exposes creator / sheet / gameplay tabs, and CP RED market tab
- [ ] Multi-system workspace dashboards expose module cards without implementing real map / inventory / item / community / backend features
- [ ] Planned module cards show a clear placeholder: data-contract work is required before real functionality

### D&D

- [ ] DND Workspace — entering DND shows the Dashboard first, not a character sheet
- [ ] DND Workspace — secondary nav switches 工作台总览 / 角色库 / 规则库 / 规则源状态 / 进入游玩
- [ ] DND Workspace — 进入游玩 / 战斗 opens the Gameplay view rather than staying in Builder
- [ ] DND Workspace — module grid does NOT show Backpack / Items, Map / Tactical Board, or Quests / Notes / Logs cards (removed from module grid in follow-up IA correction)
- [ ] DND Workspace — workspace-tier guidance section (工作台层级) shows Actor Workspace (背包/装备/状态/资源/开始游玩/个人日志) and Session / Campaign Workspace (地图/Board/Token/Handout/Encounter/Session Log/GM工具/玩家列表) as informational text, not clickable module cards
- [ ] DND Workspace — workspace-tier guidance shows a note clarifying these modules belong to their respective workspace, not the system dashboard
- [ ] DND Workspace — no module grid cards implement inventory state, item instances, map tokens, quest persistence, or runtime automation
- [ ] DND Character Vault — shows the current local character card with name, level, species, background, and class when present
- [ ] DND Character Vault — empty state shows a Create Character action and does not imply a real multi-character store
- [ ] DND Character Vault — View Sheet / Continue Editing / Start Playing route to existing Sheet / Builder / Gameplay views
- [ ] DND Creation Method — Standard Creation opens the existing BG3-like Builder
- [ ] DND Creation Method — Quick Creation / Local Import / Workshop Import show planned placeholders only
- [ ] DND Creation Method — Workshop copy is future-facing only and does not implement subscriptions, downloads, accounts, backend, dependencies, or community content
- [ ] DND Workspace — top navigation no longer presents Enter Play / Combat as the primary route; Start Playing is a character-context action
- [ ] DND Sheet — HP / AC / Initiative / Speed / PB use a compact status row and do not dominate the first screen
- [ ] DND Sheet — six ability scores render as a compact 2x3 / 3x2 grid rather than a long vertical column
- [ ] DND Sheet — skills and saving throws use dense rows with clear proficiency markers
- [ ] DND Sheet — attacks/equipment, spell summary, and class resources are summarized without implementing a real inventory/item contract
- [ ] DND Sheet — Start Playing / Enter Combat Panel remains visible and routes to Gameplay
- [ ] DND Sheet — desktop layout is denser and mobile layout remains single-column without horizontal overflow
- [ ] DND Dashboard — shows rule scope (DND 2024 / SRD5.2 + XGtE + TCoE), status, and data completion cards
- [ ] DND Dashboard — module cards open Creator / Sheet / Gameplay in the preserved play view
- [ ] DND Source Status — shows core + expansion sources with sourceId and status labels (display-only, no toggle)
- [ ] DND Compendium — shows spell/feat/equipment/class index entry counts without rendering all 507 spells
- [ ] DND Workspace — COC / CP RED entry is unaffected (no DND shell around other systems)
- [ ] DND Creator — opens, fields editable
- [ ] DND Creator — opens as a responsive Builder Workbench with section navigation, editor area, and character summary
- [ ] DND Creator — desktop layout uses Builder nav / editor / summary columns without nested oversized cards
- [ ] DND Creator — mobile layout does not horizontally overflow; builder section navigation scrolls horizontally
- [ ] DND Creator — builder sections can be switched non-linearly: identity / sources / species / background / class / abilities / feats / spells / equipment / review
- [ ] DND Creator — spell and equipment builder sections are placeholders only and do not implement spell/equipment automation
- [ ] DND Creator — More Actions lowers reset/import-export style utility prominence; DND import/export remains available from the workspace top actions
- [ ] DND Creator — old 创建器 / 角色卡 / 游玩战斗 tabs are not restored inside the Builder
- [ ] DND Creator — existing completion validation and character creation behavior remain unchanged
- [ ] DND index layer — spell/feat/background/equipment indexes compile but are not imported by Creator / Sheet / Gameplay
- [ ] DND index layer — runtime SPELL_DATA still has exactly its pre-index entries; spellbook/spellcasting behavior unchanged
- [ ] DND index layer — DND_2024_SPELL_INDEX_DATA totals 507 (SRD 391 / TCoE 21 / XGtE 95) with unique scope-prefixed ids
- [ ] DND index layer — Artificer / 奇械师 is source-indexed from TCoE in `characterOptionsIndex.ts`
- [ ] DND index layer — Artificer is not added to `CLASS_DATA` / Creator until progression, spellcasting, infusions, and subclasses are verified
- [ ] DND Artificer source completion does not modify `classProgression`, store schema, Creator, Sheet, Gameplay, or rules automation
- [ ] DND Creator — species list shows the 9 owner-source 2024 species (人类/矮人/精灵/半身人/侏儒/龙裔/提夫林/兽人/歌利亚); no subrace step appears
- [ ] DND Creator — selecting a 2024 species sets racebonus to 0 for all abilities and does not overwrite size/speed/languages with placeholders
- [ ] DND Creator — background list shows the 16 local-CHM-confirmed DND 2024 standard backgrounds: 侍僧 / 工匠 / 骗子 / 罪犯 / 艺人 / 农民 / 警卫 / 向导 / 隐士 / 商人 / 贵族 / 智者 / 水手 / 抄写员 / 士兵 / 流浪者
- [ ] DND Creator — newly completed background entries use short pending-verification text and do not fabricate skills, origin feats, equipment, or ability options
- [ ] DND Creator — legacy 艺人 data (if surfaced anywhere) grants 音乐家 (Musician), not 健壮 (Tough)
- [ ] DND Sheet — legacy characters with old race/background strings still render without crashing (pending-verification note may replace legacy trait text)
- [ ] DND Sheet — opens, displays character data
- [ ] DND Sheet — visible Start Playing / Enter Combat Panel CTA opens the preserved Gameplay view
- [ ] DND Gameplay — opens, runtime resources / checks / actions panels render
- [ ] DND Gameplay — remains reachable from the DND Workspace Play / Combat entry after Builder hierarchy cleanup
- [ ] DND Gameplay — existing RollConsole / dice area remains visible when the character is completed
- [ ] DND Gameplay — checks and action use update RollConsole Latest Result and RuntimeLogEntry history
- [ ] DND Gameplay — old or newly loaded characters do not crash when classResources / pactMagicState are missing or initialized
- [ ] DND Gameplay — class resources initialize with current/max and manual +/- or reset controls update current values
- [ ] DND Gameplay — short rest restores short-rest resources and pact magic slots, then writes a RuntimeLogEntry to RollConsole
- [ ] DND Gameplay — long rest restores long-rest resources and, by v1 model, also covers short-rest recovery; result writes to RollConsole
- [ ] DND Gameplay — spell preparation model shows mode, ability, spell slots, pact magic, prepared limit approximation, and deferred hints
- [ ] DND Gameplay — casting a cantrip writes a structured RuntimeLogEntry without consuming a slot
- [ ] DND Gameplay — casting a leveled spell consumes exactly one standard spell slot through the unified spellcasting resource path and updates RollConsole Latest Result
- [ ] DND Gameplay — Warlock / pact caster spellcasting consumes one pact slot through the same spellcasting resource path and logs pact magic metadata
- [ ] DND Gameplay — attempting to cast without an available standard or pact slot does not consume resources and logs an insufficient-resource RuntimeLogEntry
- [ ] DND Gameplay — Action Registry class resource actions consume through `consumeClassResource`, not component-level `current - amount`
- [ ] DND Gameplay — Action Registry Pact Magic actions consume through `consumeSpellcastingResource` and do not fallback to standard spell slots
- [ ] DND Gameplay — missing or insufficient class resources fail cleanly without changing resource state
- [ ] DND Gameplay — spellcasting does not implement target selection, concentration, damage, or spell effects
- [ ] DND Sheet — does not own gameplay roll controls; checks/resources are validated in Gameplay
- [ ] DND Sheet — Equipment Catalog (装备资料) renders weapons / armor & shield / gear & tools as read-only data
- [ ] DND Sheet — Equipment Catalog has no equip/unequip buttons and does not change AC, attacks, damage, resources, or character data
- [ ] DND Sheet — Equipment Catalog viewing writes no RuntimeLogEntry and persists nothing after refresh

### Call of Cthulhu

- [ ] COC Workspace — opens to a dashboard of module cards before entering the preserved COC pages
- [ ] COC Workspace — Create Investigator / Investigator Sheet / Skill Checks / Pushed Rolls / Growth Checks open existing Creator / Sheet / Gameplay views
- [ ] COC Workspace — module grid does NOT show Clues / Handouts, Investigator Notes, or Locations / Map cards (removed from module grid in follow-up IA correction)
- [ ] COC Workspace — COC 规则库/技能索引 and Source Status are visible as planned cards (System Workspace level)
- [ ] COC Workspace — workspace-tier guidance section (工作台层级) shows Actor Workspace (角色卡/当前状态/资源/背包/装备/开始游玩/个人日志) and Session / Campaign Workspace (地图/Board/Token/Handout/线索/Encounter/Session Log/GM工具/玩家列表) as informational text, not clickable module cards
- [ ] COC Workspace — workspace-tier guidance shows a note clarifying these modules belong to their respective workspace, not the system dashboard
- [ ] COC System Home — when investigator exists, shows 3 action buttons: 查看调查员卡 / 继续编辑调查员 / 开始调查 (continue editing was added in Actor Entry alignment)
- [ ] COC System Home — Platform Guidance (collapsed) includes Actor / Player Asset abstraction note and multi-campaign note
- [ ] COC Creator — opens, fields editable
- [ ] COC Sheet — opens and displays investigator data; no gameplay roll controls expected on Sheet
- [ ] COC Gameplay — opens, HP/SAN/MP/Luck runtime buttons functional, dice tray functional
- [ ] COC Gameplay — public skill checks run from Gameplay and update RollConsole Latest Result
- [ ] COC Gameplay — dice modifier selector offers 惩罚骰 2 / 惩罚骰 1 / 普通 / 奖励骰 1 / 奖励骰 2 and defaults to 普通
- [ ] COC Gameplay — bonus and penalty dice are mutually exclusive; selecting one deselects the other
- [ ] COC Gameplay — bonus dice roll extra tens dice and keep the lowest result; penalty dice keep the highest
- [ ] COC Gameplay — skill check RuntimeLogEntry payload records finalRoll / onesDie / tensDice / selectedTens / bonusDice / penaltyDice
- [ ] COC Gameplay — check detail shows tens dice and selected value (e.g. 奖励骰 1：十位骰 [40, 20]，个位 7，取 27)
- [ ] COC Gameplay — SAN Check preset and custom expressions apply runtime SAN loss and update RollConsole Latest Result
- [ ] COC Gameplay — SAN quick roll writes a RuntimeLogEntry and does not auto-deduct SAN
- [ ] COC Gameplay — eligible failed skill check can spend Luck; Luck decreases and a RuntimeLogEntry is appended
- [ ] COC Gameplay — eligible failed non-fumble skill check can make one Pushed Roll; original failed entry remains unchanged and a new RuntimeLogEntry is appended
- [ ] COC Gameplay — Pushed Roll failure shows Keeper adjudication / escalated consequence text; fumble cannot spend Luck
- [ ] COC Gameplay — successful skill check can be marked for growth using the existing runtime growth mark state
- [ ] COC Gameplay — marked skill can run a growth check; roll greater than current skill increases value by 1d10 and writes RuntimeLogEntry
- [ ] COC Gameplay — growth success caps final skill value at 99 and logs rawNewValue / cap / capped in RuntimeLogEntry payload
- [ ] COC Gameplay — growth marks can be manually cleared and do not require Keeper Console / campaign management
- [ ] COC Gameplay — RuntimeLogEntry history log updates after skill checks / runtime changes / free dice rolls

### Cyberpunk RED

- [ ] CP RED Workspace — opens to a dashboard of module cards before entering the preserved CP RED pages
- [ ] CP RED Workspace — Create Character / Character Sheet / Skill Checks / Combat / Equipment / Black Market / Cyberware / Netrunning open existing views
- [ ] CP RED Workspace — module grid does NOT show Enemies / Encounter, Map / Tactical Position, or Session Log cards (removed from module grid in follow-up IA correction)
- [ ] CP RED Workspace — CP RED 规则库/装备索引, 数据完成度, and Source Status are visible as planned cards (System Workspace level)
- [ ] CP RED Workspace — workspace-tier guidance section (工作台层级) shows Actor Workspace (角色卡/当前状态/资源/背包/装备/开始游玩/个人日志) and Session / Campaign Workspace (地图/Board/Token/Handout/线索/Encounter/Session Log/GM工具/玩家列表) as informational text, not clickable module cards
- [ ] CP RED Workspace — workspace-tier guidance shows a note clarifying these modules belong to their respective workspace, not the system dashboard
- [ ] CP Creator — opens, fields editable
- [ ] CP Sheet — opens and displays character data; no gameplay roll controls expected on Sheet
- [ ] CP Gameplay — opens, skill check and stat check functional
- [ ] CP Gameplay — check / role / damage / resource results enter RollConsole Latest Result and RuntimeLogEntry history
- [ ] CP Gameplay — checks without DV show `等待 GM 判定`
- [ ] CP Gameplay — runtime log producers write structured RuntimeLogEntry objects; no string `addLog` fallback is expected
- [ ] CP Market — opens without crash
- [ ] CP Market — item can be added to character inventory
- [ ] CP Market — buying the same-name item twice creates two distinct inventory entries
- [ ] CP RED — legacy inventory/equipment entries without `instanceId` do not crash and receive stable ids when moved between inventory and equipped state
- [ ] CP Sheet — inventory and equipment state are visible
- [ ] CP Sheet — equip / unequip weapon does not lose the item
- [ ] CP Sheet — equip / unequip one same-name weapon instance does not remove the other instance
- [ ] CP Sheet — equip / unequip armor does not lose the item
- [ ] CP Sheet — equip / unequip one same-name armor instance preserves the other instance
- [ ] CP Sheet — install / uninstall cyberware preserves the item and does not automate Humanity Loss
- [ ] CP Sheet — install / uninstall one same-name cyberware instance preserves the other instance
- [ ] CP Sheet — wear / remove fashion preserves the item payload and does not collapse duplicate same-name fashion entries
- [ ] CP Sheet — cyberware install / uninstall does not change Humanity, EMP, or cyberPsycho automatically
- [ ] CP Gameplay — Critical Injury panel can manually add a body or head injury from the existing 2d6 tables
- [ ] CP Gameplay — damage weapon selector uses item instance identity so duplicate same-name carried weapons remain distinguishable
- [ ] CP Gameplay — Critical Injury panel can remove a tracked injury
- [ ] CP Gameplay — manual add/remove writes RuntimeLogEntry records with add-critical-injury / remove-critical-injury actions
- [ ] CP Gameplay — Critical Injury panel is labeled manual tracking and does not roll injuries or apply damage automatically
- [ ] CP Gameplay — tracked critical injuries persist via existing runtime state after refresh
- [ ] CP RED — no armor ablation or ammo automation expected

---

## 3. Persistence Check

- [ ] Enter / modify character data on any sheet
- [ ] Hard-refresh the page (F5 / Cmd+R)
- [ ] Confirm data is still present (Zustand persist via localStorage)

---

## 4. Migration / Import Check

- [ ] Load a character saved under a previous schema version (if available)
- [ ] Confirm the character opens without crash or blank fields
- [ ] Confirm migrateDndCharacter / migrateCocCharacter / migrateCpCharacter ran silently
- [ ] DND / COC / CP RED exports produce a `trpg-platform.character` envelope
- [ ] Envelope import restores the correct system character
- [ ] Legacy naked JSON import still works
- [ ] Invalid JSON shows a clear error
- [ ] Unsupported module/community package JSON is rejected with a clear message
- [ ] No backend/storage adapter was introduced

---

## 5. System Home Simplification Check

- [ ] DND Dashboard — module grid shows exactly 5 cards: 角色库 / 创建角色 / 打开角色卡 / 规则库 / 规则源状态 (no spellIndex / featIndex / equipmentIndex / classIndex)
- [ ] DND Dashboard — 规则库 card has a descriptive note explaining indexes are accessible inside Compendium, not on home
- [ ] DND Dashboard — 规则源状态 card label reads '规则源状态 / System Health' with a note about data coverage
- [ ] DND Dashboard — data completion section is NOT a full grid; replaced by a compact footnote line with a link to Source Status view
- [ ] DND Compendium view — still shows spell/feat/equipment/class index counts (accessible via nav or compendium card, not on home)
- [ ] COC Workspace — module grid does NOT contain a separate 数据完成度 / Data Completion card; coverage detail is in Rules Compendium / Source Status
- [ ] COC Workspace — 规则库 card note describes its contents (skill list, occupations, rule index, coverage tracking)
- [ ] COC Workspace — 规则源状态 card note mentions System Health and owner source registration
- [ ] CP RED Workspace — module grid does NOT contain a separate 数据完成度 / Data Completion card
- [ ] CP RED Workspace — 规则库 card note describes its contents (equipment index, cyberware list, skill reference, coverage tracking)
- [ ] CP RED Workspace — 规则源状态 card note mentions System Health and owner source registration
- [ ] All three system homes answer the core questions: which Game System is this, which Actor can I select/create, can I access Rules Compendium, can I check Source Status / System Health
- [ ] No store, schema, runtime, or rule data changed by this simplification

---

## 5a. Platform Actor Entry Pattern Alignment Check

- [ ] COC System Home — when investigator exists, shows exactly 3 action buttons: 查看调查员卡 / 继续编辑调查员 / 开始调查
- [ ] CP RED System Home — when Edgerunner exists, shows exactly 3 action buttons: 查看角色卡 / 继续编辑角色 / 开始任务
- [ ] COC System Home — Platform Guidance (collapsed `<details>`) includes `actorAbstractionNote` (Character/Investigator/Edgerunner are system display names; platform abstraction is Actor/Player Asset)
- [ ] COC System Home — Platform Guidance includes `actorMultiCampaignNote` (Actor can join multiple campaigns; current version manages local character only)
- [ ] CP RED System Home — same Platform Guidance notes as COC
- [ ] DND Characters view — shows a small Actor abstraction note below the vaultBoundary note (`dndWorkspace.characters.actorNote`)
- [ ] `multiWorkspace.planned.message` mentions Player Asset Vault / Workshop / Source Manager (not a generic placeholder)
- [ ] Landmark `PLATFORM_ACTOR_ENTRY_PATTERN_ALIGNMENT` is present in `src/pages/PlayWorkspace.tsx` and `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- [ ] No store, schema, runtime, or rule data changed by this alignment
- [ ] No React Router or browser URL routing introduced

---

## 5b. COC / CP RED DND-aligned Workspace Reconstruction Check

- [ ] COC workspace nav bar shows 5 buttons: Overview / Investigator Vault / Create Investigator / COC Compendium / Source Status (no Play button in nav)  *(superseded by 5c — nav now has 7 items)*
- [ ] CP RED workspace nav bar shows 5 buttons: Overview / Edgerunner Vault / Create Edgerunner / CP RED Compendium / Source Status
- [ ] COC overview (`dashboard` view) — shows breadcrumb, system title, current investigator card OR empty state with create button
- [ ] CP RED overview — same pattern with Edgerunner data (name / handle / role / roleLevel)
- [ ] COC vault — shows current investigator card with 3 action buttons (view sheet / continue editing / start investigation)
- [ ] CP RED vault — shows current Edgerunner card with 3 action buttons
- [ ] COC create — shows 4 method cards: standard (active → opens creator tab), quick / local import / workshop (all marked Planned)
- [ ] CP RED create — same 4 method cards
- [ ] COC compendium — shows 6 entry shells (skills / occupations / sanity / damage / investigationRules / clueRules), all Planned badges
- [ ] CP RED compendium — shows 6 entry shells (skills / equipment / market / cyberware / combatRules / netrunning), all Planned badges
- [ ] COC sources — shows 1 source entry (coc7e-core, Lightweight Runtime badge)
- [ ] CP RED sources — shows 1 source entry (cpred-core, Lightweight Runtime badge)
- [ ] COC `play` view → renders old COC runtime (tabs + CocCreator/CocSheet/CocGameplay) unchanged
- [ ] CP RED `play` view → renders old CP RED runtime (tabs + CpCreator/CpSheet/CpGameplay/CpMarket) unchanged
- [ ] `NonDndWorkspaceView` type includes `'compendium' | 'sources'` in `PlayWorkspace.tsx`
- [ ] `CocWorkspaceShell` / `CpWorkspaceShell` are wired as the sole renderers for CoC / CP in `PlayWorkspace.tsx`
- [ ] Old render functions (`renderNonDndWorkspaceDashboard`, `renderCharacterVault`, `renderCreationMethod`, `renderPlannedSlot`) are removed from `PlayWorkspace.tsx`
- [ ] `cocWorkspace.*` and `cpWorkspace.*` keys exist in both `zh-CN.ts` and `en.ts`
- [ ] Landmark `COC_CPRED_DND_ALIGNED_WORKSPACE_RECONSTRUCTION` is present in shells and `PlayWorkspace.tsx`
- [ ] No store, schema, runtime rule logic, dice algorithm, or CharacterData changed

---

## 5c. COC Workspace Cleanup v1 Check

- [ ] COC workspace nav bar shows **7** items: 工作台总览 / 调查员库 / 创建调查员 / 调查员卡 / 调查面板 / COC 规则库 / 规则源状态
- [ ] Only one nav bar visible throughout all COC views (no duplicate navigation)
- [ ] COC overview (dashboard) — shows system title, current investigator card/empty state, "rules in top nav" note, collapsible guidance; no tool matrix
- [ ] COC 调查员库 — Actor Vault shell with current investigator card and 3 action buttons; planned slot cards
- [ ] COC 创建调查员 — Creation Method shell with 4 cards (standard active, quick/import/workshop Planned)
- [ ] COC 调查员卡 (sheet view) — shows HP/MP/SAN/Luck row, characteristics grid, top skills summary, "开始调查" + "继续编辑" CTAs; no runtime tool content
- [ ] COC 调查面板 nav item — clicking it launches investigation runtime (CocGameplay embedded, no legacy title bar); nav 'play' item shown as active
- [ ] COC 调查面板 — only shows CocGameplay content; no old import/export/settings/data tabs; no second back button
- [ ] COC 规则库 — 6 shell entry cards (all Planned badge); no real rule data
- [ ] COC 规则源状态 — source status shell; no real Source Manager engine
- [ ] Navigation: overview → 调查员卡 → 继续编辑 → correct; overview → 调查面板 → nav back → correct
- [ ] `NonDndWorkspaceView` includes `'sheet'` in `PlayWorkspace.tsx`
- [ ] `CocWorkspaceView` includes `'sheet'` in `CocWorkspaceShell.tsx`
- [ ] `cocWorkspace.nav.sheet` / `cocWorkspace.nav.runtime` / `cocWorkspace.sheet.*` keys in both locale files
- [ ] Landmark `COC_WORKSPACE_CLEANUP_V1` present in `CocWorkspaceShell.tsx`
- [ ] DND workspace untouched
- [ ] CP RED workspace untouched
- [ ] No store schema, Investigator save format, COC rule data, runtime logic, or dice algorithm changed

---

## 5d. COC Builder BG3-like Shell v1 Check

- [ ] COC Workspace → 创建调查员 → 标准创建 opens the new Investigator Builder shell.
- [ ] Desktop Builder layout uses three columns: left step navigation, center current section, right investigator summary.
- [ ] Builder steps are visible: 身份 / 属性 / 职业 / 技能 / 背景 / 装备 / 检查.
- [ ] Mobile Builder layout stacks into one column and the step navigation can scroll without horizontal page overflow.
- [ ] Builder summary shows current investigator name, occupation, HP/MP, SAN/Luck, key characteristics, and skill summary.
- [ ] Builder shell does not show old import/export/data/settings/help toolbar chrome.
- [ ] Builder shell does not show old Creation / Sheet / Gameplay tabs.
- [ ] View Investigator Sheet and Start Investigation actions route through existing COC workspace context.
- [ ] Builder shell reads current investigator data only and does not change store fields by itself.
- [ ] No COC rule data, runtime logic, dice algorithm, Investigator save format, import/export behavior, or true multi-investigator store changed.

---

## 6. Platform Core Concepts Baseline Check (Docs Only)

- [ ] `docs/architecture/PLATFORM_CORE_CONCEPTS.md` exists and is readable
- [ ] Document defines all 14 platform concepts (Game System through UI Theme / Layout Pack)
- [ ] Game System Registry V1 field spec present with V1 required / optional / future classification
- [ ] DND, COC, CP RED are recorded as built-in Game System entries with systemId / displayName / diceProfile / etc.
- [ ] Future system categories (Japanese TRPG, Wargame, Custom Boardgame, Narrative) are documented
- [ ] Terminology alignment table present (Character/Investigator/Edgerunner → Actor display labels)
- [ ] Atmospheric Minimalism / 氛围化简约 artistic direction documented with layer rules
- [ ] Workshop / Plugin safety model and content layer classification documented
- [ ] Workspace IA three-tier model summary present
- [ ] Landmark `PLATFORM_CORE_CONCEPTS_GAME_SYSTEM_REGISTRY_BASELINE` present in the document
- [ ] No store, schema, runtime, rule data, plugin execution, workshop subscription, or map/inventory/session implementation was changed

---

## 6b. Platform Patterns & Workspace Section Contract Check (Docs Only)

- [ ] `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` exists and is readable
- [ ] Document defines all 9 platform patterns (Game System Workspace, Actor Entry, Builder, Sheet, Runtime, Rules Compendium, Source Status, Session/Campaign, Navigation)
- [ ] Each pattern lists responsibility / non-responsibility / platform-unified / system-customized / V1 minimum / V1 not-do / high-risk boundary
- [ ] Workspace Section Contract defines the 9 sections (overview, actorVault, creationMethod, builder, sheet, runtime, rulesCompendium, sourceStatus, sessionCampaign)
- [ ] implemented / planned / absent three-state semantics are defined, with planned display rules (no fake buttons / no error-on-click CTA)
- [ ] Top navigation rules present (overview/actorVault/rulesCompendium/sourceStatus in top nav; builder/sheet/runtime via Actor context)
- [ ] Builder Pattern present (three-column; Creation Method precedes Builder; preview is summary not Sheet copy) with DND/COC/CP RED builder step examples
- [ ] Sheet Pattern present (identity/coreStats/attributes/skills/resources/equipmentSummary/systemSpecific/runtimeCTA)
- [ ] Runtime embedded-mode rules present (no system shell; no system switch / import-export / tabs / second back button)
- [ ] Rules Compendium vs Source Status boundary present; System Home shows neither coverage tables nor dense index grid
- [ ] Navigation Back / Up / Breadcrumb is concept-only with implementation deferred to a later round (no React Router / URL routing)
- [ ] Future extension coverage present (non-Character Actor, Asset Collection, no-Sheet, no-Runtime, map-heavy, narrative, community/custom)
- [ ] High-risk boundary list present
- [ ] Codex / CC pre-implementation acceptance template present
- [ ] Landmark `PLATFORM_PATTERNS_WORKSPACE_CONTRACT_V1` present in the document
- [ ] No `src/`, store, schema, runtime, rule data, routing, workshop, map, inventory, or session implementation changed

---

## 6d. Navigation Up + Breadcrumb Minimal Implementation v1 Check

- [ ] Workspace toolbar shows **three distinct** controls: Back (返回) / Up (上一级) / Breadcrumb (当前位置)
- [ ] Back button label says "返回上一层" when history exists; "返回系统选择" when stack is empty — unchanged from before
- [ ] Up button label says "上一级" — distinct from Back
- [ ] Breadcrumb displays full path: e.g. `平台 / 游玩 / DND 5e 2024 / 角色库`
- [ ] Back, Up, Breadcrumb labels do not share text — no label reuse
- [ ] **DND**: 角色库 → Up → Game System Home (dashboard)
- [ ] **DND**: 角色卡 (play/sheet) → Up → 角色库 (characters)
- [ ] **DND**: Runtime/Gameplay → Up → 角色卡 (play/sheet)
- [ ] **DND**: Game System Home → Up → exits workspace to Play Menu
- [ ] **COC**: 调查员卡 (sheet view) → Up → 调查员库 (vault)
- [ ] **COC**: 调查面板 (runtime) → Up → 调查员卡 (sheet)
- [ ] **COC**: 调查员库 → Up → Game System Home
- [ ] **CP RED**: Edgerunner Sheet (play/sheet) → Up → Edgerunner 库 (vault)
- [ ] **CP RED**: 任务面板 (runtime) → Up → Edgerunner Sheet
- [ ] **CP RED**: Edgerunner 库 → Up → Game System Home
- [ ] Up does NOT read the history stack — clicking Up from the same location always yields the same parent regardless of how you arrived
- [ ] Back still restores previous UI state from history stack — unchanged
- [ ] Breadcrumb displays view-level label (e.g. "角色库", "创建角色", "角色卡", "规则库", "规则源状态", "游玩", "创建向导", "Game System Home")
- [ ] `navigation.upOneLevel` i18n key present in both locales
- [ ] `navigation.breadcrumb.{actorVault,creationMethod,actorSheet,rulesCompendium,sourceStatus,runtime,builder,systemOverview}` keys present in both locales
- [ ] Landmark `NAVIGATION_UP_BREADCRUMB_MINIMAL_IMPLEMENTATION_V1` present in `src/App.tsx`
- [ ] No React Router introduced
- [ ] No URL routing introduced
- [ ] No `window.history.back()` call introduced
- [ ] No store schema, migration, save format, runtime rule logic, dice algorithm, or rule data changed

---

## 6c. Navigation Back / Up / Breadcrumb Model Check (Docs Only)

- [ ] `docs/architecture/NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md` exists and is readable
- [ ] Back, Up, and Breadcrumb are each defined with responsibility / non-responsibility
- [ ] Document states Back = history stack, Up = parent resolver, Breadcrumb = ancestor chain, and that Up/Breadcrumb are not derived from history
- [ ] `LocationNode` model defined (id / type / labelKey / parentId / systemId / actorId / sessionId / params) with NavigationNodeType list
- [ ] Deterministic parent resolver defined (does not read history; uses LocationNode / Section Contract / registry; fallback to Play Home / Platform Home; new systems only declare parents) with examples
- [ ] Breadcrumb derivation rule defined (walk parentId chain; V1 text-only, V2 clickable ancestors as deterministic navigation; i18n + system/Actor display names) with examples
- [ ] Back stack rules defined (push timing, do-not-push cases, goBack pop, empty-stack fallback, UI-location-only, no character data, not mixed with browser history)
- [ ] Workspace Section default parents defined for all 9 sections and compatible with DND/COC/CP RED/no-Sheet/no-Runtime/roster/map-heavy/narrative systems
- [ ] V1 minimal implementation recommendation present (LocationNode type, derive current node, Back via app stack, Up via resolver, Breadcrumb text)
- [ ] V1 not-do list present (no URL routing, React Router, deep links, browser back binding, route guards, large App.tsx refactor)
- [ ] Navigation UI spec present (distinct Back/Up labels, fallback/disabled rules, mobile breadcrumb collapse)
- [ ] Example scenarios cover DND / COC / CP RED / future wargame (Unit / Roster / Board)
- [ ] High-risk boundary list present
- [ ] Navigation pre-implementation acceptance template present
- [ ] Landmark `NAVIGATION_BACK_UP_BREADCRUMB_MODEL_V1` present in the document
- [ ] No `src/`, store, schema, runtime, rule data, React Router, URL routing, browser History API, map, inventory, session, workshop, or plugin implementation changed

---

## 6d. Platform Workshop + System Rule Sources Check

- [ ] Sidebar 创意工坊 / Workshop opens the Workshop page (not a Coming Soon placeholder); Home/community card also opens it
- [ ] Workshop has Browse / My Subscriptions / Updates & Dependencies sections
- [ ] Browse shows asset-type filters (全部/角色/NPC·怪物/地图/音乐/美术素材/规则包/冒险·剧本/合集·整合包) and sample cards
- [ ] Bundle ("合集 / 整合包") is a content type card (with 包含 list), NOT a top-level module
- [ ] Card buttons are only 查看详情 / 订阅接口预留; no 订阅成功 / 已下载 / 已安装 / 已导入
- [ ] Content landing section maps each asset type to its destination library
- [ ] My Subscriptions shows type / landing / interface-reserved status + low-weight note; cancel is reserved only
- [ ] Updates & Dependencies shows a reservation note only (no popups, no fake conflict, no blocking)
- [ ] DND / COC / CP RED workspaces each have a 规则来源 / Rule Sources nav entry
- [ ] DND rule sources show 2024 Core (enabled), Xanathar's Guide (coming), Tasha's Cauldron (coming), 2014 Legacy (coming), Community Rule Packages (reserved), Player Custom Rule Packages (reserved)
- [ ] COC rule sources show Core Rulebook (enabled), Investigator Handbook (coming), Community + Player Custom (reserved); NO scenario / adventure entries
- [ ] CP RED rule sources show Cyberpunk RED Core (enabled), Black Chrome (coming), Community + Player Custom (reserved)
- [ ] System Rule Sources page shows the override/conflict reservation note and states it does not affect Builder / Compendium / runtime
- [ ] Actor Vault and System Library are unchanged (no regression)
- [ ] No store / schema / migration / save format / rule data / dice / runtime change
- [ ] No real subscription / import / update / conflict detection; no React Router / URL routing
- [ ] Landmark `PLATFORM_WORKSHOP_SYSTEM_RULE_SOURCES_SHELL_V1` present

---

## 6e. Linkable Entity + Fan Plaza Check

- [ ] Home and sidebar both show a 同人广场 / Fan Plaza entry; it opens the Fan Plaza page (not a placeholder)
- [ ] Fan Plaza is a platform-level page, NOT a Workshop sub-page
- [ ] Fan Plaza has a search box, work-type filter, adapted-system filter, related-object filter, and sort filter
- [ ] Fan work cards show title, author, type, format, adapted system, related-object summary, tags, summary, and like/favorite/comment counts (display only)
- [ ] Opening a work detail shows related characters / campaigns / maps / session logs / workshop content via the relation list
- [ ] Each related object shows its share code / public path / visibility; clicking 查看对象 opens a static entity card preview (no route)
- [ ] Detail shows the permission-boundary note (public links only show author-permitted info; full data / hidden plot / GM notes / unpublished logs are not exposed)
- [ ] No real upload / like / favorite / comment / copy-link / publish actions; buttons are interface-reserved only
- [ ] Fan works do not participate in Workshop subscription / dependency / conflict checks
- [ ] System Library, Actor Vault, Workshop browse, and My Subscriptions are unchanged (no regression)
- [ ] No store / schema / migration / save format / rule data change; no React Router / URL routing
- [ ] Landmark `LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1` present

---

## 6f. Platform Adaptive Navigation + Focus Mode Check

- [ ] Desktop (≥ md): platform navigation is a top horizontal bar; no persistent left sidebar
- [ ] Top nav shows 首页 / 系统库 / 创意工坊 / 同人广场 (+ 设置 on wide desktop, else in More) with clear active state
- [ ] DND workspace, Builder, Workshop, and Fan Plaza get full horizontal width (no left-sidebar squeeze)
- [ ] DND Builder three-column layout is visibly more spacious; ability page cards are not cramped; right summary does not cover center content
- [ ] DND system workspace still has its own top nav (角色库 / 规则库 / 规则来源 / 数据状态); system theme not overridden by platform nav
- [ ] Tablet width: top nav stays compact; Settings + reserved entries live in More; content not squeezed
- [ ] Mobile (< md): bottom primary nav shows 首页 / 系统库 / 创意工坊 / 同人广场 / 更多; no left sidebar; content has bottom padding (not covered)
- [ ] Mobile More panel opens (bottom sheet) and closes; contains Settings + reserved AI Settings / User Center / Service Status / Membership + language + back home
- [ ] Mobile does not show the full long breadcrumb; play workspace shows a short title in the app bar
- [ ] Focus mode (play workspace): mobile bottom nav is hidden so Builder/runtime get more height; desktop top bar stays low-weight
- [ ] Back / Up / current-location still work in the play workspace; no double-back-button or simultaneous old-sidebar + new-nav
- [ ] No horizontal overflow at tablet/mobile widths
- [ ] No store / schema / migration / save format / rule data / Builder logic / runtime / dice change; no React Router / URL routing / browser History API
- [ ] Landmark `PLATFORM_ADAPTIVE_NAVIGATION_FOCUS_MODE_V1` present in `src/App.tsx`

---

## 6g. Workshop + Fan Plaza Visual Preview Refinement v2 Check

Workshop:
- [ ] Browse cards each show an image/cover preview (not just a small icon); rulebook / map / music / character / npc / tool covers look visibly different
- [ ] Browse grid is responsive: ~1–2 cols mobile, 2–3 tablet, 3–4 desktop; image area ratio is consistent (16:9)
- [ ] Cards still show author / category / subtype / tags / version / dependency status / impact scope / landing
- [ ] Quick preview opens (page-internal) with a big cover + small gallery + description + metadata
- [ ] Quick preview shows related fan works (mini cards) + related characters / campaigns / logs chips + a "not subscription/dependency/conflict" note
- [ ] No fake subscribe / download / install / import / sync success states; action buttons are interface-reserved

Fan Plaza:
- [ ] Work cards each have a cover / main preview; the plaza is image-forward, not a plain text list
- [ ] Cards show a content-block summary (e.g. 文字 / 图片 / 图集 / 音频 / 外链 / 关联对象引用 / 创意工坊引用)
- [ ] coverMode is reflected in the cover badge: 作者封面 / 作品首图 / 音频视觉 / 类型默认 — all four appear across the mock works
- [ ] Story / recap / illustration / music / setting are NOT forced into one fixed template (cover follows coverMode, not type)
- [ ] Work detail opens with a big cover, body preview, image/gallery/audio/external-link placeholders, related objects, and related Workshop content
- [ ] No fake upload / like / favorite / comment success; buttons are interface-reserved

Linkage + regression:
- [ ] Workshop detail can show related fan works; fan-work detail can show related Workshop content; both are association display only (no subscription/dependency/conflict)
- [ ] PreviewArt uses only CSS gradient / SVG / glyph / waveform — no external image URLs, no image generation
- [ ] System Library, Actor Vault, DND Builder, and platform navigation are unchanged (no regression)
- [ ] No store / schema / save format / rule data / Builder / dice / runtime change; no real backend / routing
- [ ] Landmark `WORKSHOP_FAN_PLAZA_VISUAL_PREVIEW_REFINEMENT_V2` present (PreviewArt.tsx + shells)

---

## 6h. Workshop + Fan Plaza Dedicated Detail Pages v1 Check

Workshop:
- [ ] Clicking a Workshop card main area enters a dedicated item detail view (browse grid + filters are no longer on screen)
- [ ] Detail view has a 返回创意工坊 / Back button (top and bottom); returning restores the browse page
- [ ] Detail view shows a large hero cover, image gallery, long description, version/dependency/impact/landing info, and related fan works + related actors/campaigns/logs
- [ ] Quick preview is now LIGHTWEIGHT only (small cover + title + author + one-line summary + system/category/version/dependency/impact + 进入详情 + subscribe reserved) — no full gallery/long description/related block
- [ ] No fake subscribe / download / install / import success; share code / public path are display-only with reserved copy/open buttons

Fan Plaza:
- [ ] Clicking a Fan Work card main area enters a dedicated work detail view (work flow grid + filters are no longer on screen)
- [ ] Detail view has a 返回同人广场 / Back button (top and bottom); returning restores the browse page
- [ ] Detail view shows a large cover, body, image/gallery/audio/external-link placeholders, related objects, related Workshop content, and a Comments section (reserved)
- [ ] Quick preview is LIGHTWEIGHT only (small cover + title + author + summary + type/format/system + related-object summary + 进入详情) — no full body/media/comments
- [ ] No fake upload / like / favorite / comment success; buttons are interface-reserved

Routing + regression:
- [ ] No React Router / URL routing / browser History API introduced; detail is page-internal state only
- [ ] `rg "react-router|createBrowserRouter|history.pushState|window.location" src/components/platform src/pages/Workshop.tsx src/pages/FanPlaza.tsx` returns no new routing usage
- [ ] Platform navigation, System Library, Actor Vault, and DND Builder are unchanged (no regression)
- [ ] No store / schema / save format / rule data / Builder / dice / runtime change; no real backend
- [ ] Landmark `WORKSHOP_FAN_PLAZA_DEDICATED_DETAIL_PAGES_V1` present (WorkshopItemDetail.tsx + shells)

---

## 6. Console Check

- [ ] Open browser DevTools → Console
- [ ] No red errors on page load
- [ ] No red errors after performing a dice roll or stat check
- [ ] No TypeScript runtime errors (undefined access, etc.)

---

## 6. System Isolation Check

After modifying one system, verify the other two are unaffected:

- [ ] DND pages still load after COC or CP changes
- [ ] COC pages still load after DND or CP changes
- [ ] CP pages still load after DND or COC changes

### Platform Character Entry Pattern

- [ ] DND keeps the existing Character Vault and creation method entry flow.
- [ ] COC Workspace exposes Investigator Vault before Creator / Sheet / Gameplay context actions.
- [ ] COC Standard Creation opens the existing COC Creator; Quick Creation, Local Import, and Workshop Import are planned only.
- [ ] CP RED Workspace exposes Edgerunner Vault before Creator / Sheet / Gameplay context actions.
- [ ] CP RED Standard Creation opens the existing CP RED Creator; Quick Creation, Local Import, and Workshop Import are planned only.
- [ ] Vault and creation method cards are responsive: desktop multi-column, mobile single-column, no horizontal overflow.
- [ ] No true multi-character store, Workshop/backend logic, import/export rewrite, rule data, store schema, migration, or runtime logic changed.

### Game System Home Density

- [ ] Outer Play menu return label says Back to System Selection / 返回系统选择, not a vague play-menu return.
- [ ] DND Game System Home does not repeat the top navigation as a full body module grid.
- [ ] DND Home body shows current character summary plus Open Sheet / Start Playing, or Create First Character when empty.
- [ ] COC Home body shows current investigator summary plus Open Sheet / Start Investigation, or Create Investigator when empty.
- [ ] CP RED Home body shows current Edgerunner summary plus Open Sheet / Start Mission, or Create Edgerunner when empty.
- [ ] Rules Compendium, Source Status, data completion, spell/feat/equipment/class indexes, and architecture notes are not repeated as homepage cards.
- [ ] Platform guidance is collapsed / secondary and uses player-facing copy rather than large Actor Workspace / Session Workspace blocks.
- [ ] Desktop home body keeps only current asset context and 1-2 primary actions; mobile stacks into one column without horizontal overflow.
- [ ] Home density polish does not change store schema, rule data, runtime logic, dice algorithms, map, inventory, session, Workshop, backend, or plugin behavior.

### System Default Entry / Generic Nav Labels

- [ ] Entering DND from system selection defaults to 角色库 / Actor Vault, not 工作台总览 / dashboard.
- [ ] Entering COC from system selection defaults to 角色库 / Actor Vault, while page content may still say 调查员库.
- [ ] Entering CP RED from system selection defaults to 角色库 / Actor Vault, while page content may still say Edgerunner 库.
- [ ] DND / COC / CP RED top system nav shows exactly three generic labels: 角色库 / 规则库 / 数据状态.
- [ ] 工作台总览 / Overview is not the first top-nav item and is only reachable as secondary 系统信息 / System Info.
- [ ] Rules Compendium / Source Status Up returns to Actor Vault; Actor Vault Up returns to system selection.
- [ ] Creation Method / Builder / Sheet / Runtime parent flow remains Actor Vault → Creation Method → Builder and Actor Vault → Sheet → Runtime.
- [ ] Breadcrumb uses Actor Vault as the system root and labels overview as System Info.
- [ ] No store schema, save format, rule logic, dice algorithm, import/export, React Router, URL routing, browser History API, map, inventory, session, Workshop, backend, or plugin behavior changed.

### CP RED Workspace Cleanup v1

- [ ] CP RED Workspace shows only one top system navigation.
- [ ] CP RED overview does not show the old tool matrix or duplicated module cards.
- [ ] Edgerunner Vault shows the current Edgerunner card, context actions, and planned multi-Edgerunner placeholder without implementing a real multi-character store.
- [ ] Create Edgerunner shows Standard Creation, Quick Creation, Local Import, and Workshop Import; only Standard Creation enters the existing creator.
- [ ] Edgerunner Sheet shows a platform sheet summary shell with HP, Humanity, Armor, MOVE, REF, skills summary, equipment / black market / cyberware summary, Start Mission, and Continue Editing.
- [ ] Mission Panel renders `CpGameplay embedded` and does not show old CP RED title chrome, system selector, import/export, data/settings/help buttons, internal Creation / Sheet / Gameplay / Market tabs, or a second back button.
- [ ] CP RED Compendium remains a shell-only category entry surface; no real rules engine is implemented.
- [ ] CP RED Source Status remains a shell-only Source Status / System Health surface; no Source Manager engine is implemented.
- [ ] Navigation history works for overview → vault/create/sheet/runtime/compendium/sources → back one level.
- [ ] Cleanup does not modify DND, COC, store schema, CP RED save format, CP RED rule data, runtime logic, dice algorithm, import/export logic, inventory/map/session/workshop/plugin behavior.

### CP RED Builder BG3-like Shell v1

- [ ] CP RED Workspace → 创建 Edgerunner → 标准创建 opens the new Edgerunner Builder shell.
- [ ] Desktop Builder layout uses three columns: left step navigation, center current section, right Edgerunner summary.
- [ ] Builder steps are visible: 身份 / 人生经历 / 角色职业 / 属性 / 技能 / 装备 / 义体 / 完成.
- [ ] Mobile Builder layout stacks into one column and the step navigation can scroll without horizontal page overflow.
- [ ] Builder summary shows current Handle/name, role, HP/Humanity, armor, MOVE/REF, key stats, skill summary, and equipment/cyberware summary.
- [ ] Builder shell does not show old import/export/data/settings/help toolbar chrome.
- [ ] Builder shell does not show old Creation / Sheet / Gameplay / Market tabs.
- [ ] View Edgerunner Sheet and Start Mission actions route through existing CP RED workspace context.
- [ ] Quick Creation / Local Import / Workshop Import remain planned only.
- [ ] Builder shell reads current Edgerunner data only and does not change store fields by itself.
- [ ] No DND, COC, CP RED rule data, runtime logic, dice algorithm, CP RED save format, import/export behavior, true multi-Edgerunner store, Workshop, map, inventory, or session implementation changed.

---

## 7. Rule Data Source / Trust Metadata Check

- [ ] Owner-provided local / GitHub / PDF rule sources are treated as the only authoritative rule data sources
- [ ] DND local CHM extracted source at `C:\TRPG_CHM_WORK\extracted` is treated as the primary authoritative DND source
- [ ] DND GitHub DND5eChm / SRD5.2Chm sources are treated only as secondary cross-check sources
- [ ] Official DND references are optional supplements and do not override the local CHM source by default
- [ ] DND local CHM audit baseline records 16 standard DND 2024 backgrounds, not the previous 4-entry sparse baseline
- [ ] DND runtime BACKGROUND_DATA follows the 16-background local CHM baseline while detailed mechanics remain needs-human-check
- [ ] DND local CHM audit baseline records 10 PHB 2024 species including `阿斯莫`
- [ ] DND local CHM audit does not modify runtime data, Creator, Sheet, Gameplay, store schema, or migration behavior
- [ ] Existing app data, previous AI-generated data, model memory, BG3, third-party wiki pages, and general web search do not override owner-provided sources
- [ ] Source conflicts resolve in favor of owner-provided sources
- [ ] Items present in owner-provided sources but absent from app data are marked `missing`
- [ ] Items present in app data but absent from owner-provided sources are marked `out-of-source` or `needs-human-check`
- [ ] DND source work records `https://github.com/DND5eChm` as the owner-provided root source without selecting a sole subrepository unless the owner confirms it
- [ ] DND source work uses `SRD5.2Chm` as the primary DND 2024 / SRD5.2 source and `DND5e_chm` only for confirmed XGtE / TCoE / broader cross-check entries
- [ ] DND owner source entry manifest records item names and source paths without copying long rule text or spell effect prose
- [ ] Spell effect entries use source references / structured-field policy / private import policy instead of embedding full text in the public repo
- [ ] Legacy DND classes/races/spells/feats/backgrounds export module-level accuracy metadata marked `ai-assisted-unverified`
- [ ] DND equipment sample exports source-labeled display-only metadata and remains read-only sample data
- [ ] DND class progression exports `needs-human-check` metadata while runtime values remain unchanged
- [ ] DND class/subclass exported data carries source/trust metadata without changing class descriptions, features, unlock levels, or runtime behavior
- [ ] DND class/subclass metadata marks 破誓者 as `out-of-source` / quarantine rather than verified owner-source data
- [ ] DND XGtE / TCoE subclasses such as 幽域追踪者, 剑刃学院, 孢子结社, and 风暴术士 are source-labeled or marked needs-human-check when names conflict
- [ ] DND 2014/2024-conflict subclass groups such as 法师学派, 牧师领域, and 邪术师 level-1 subclass timing are marked `needs-human-check`
- [ ] DND Class / Subclass Correction does not modify Creator, Sheet, Gameplay, Action Registry, store schema, or migration behavior
- [ ] DND background `originFeat` strings resolve to entries in `FEATS_DATA`
- [ ] DND `魔法学徒 (Magic Initiate)` exists only as a minimal source-linked placeholder until effect details and spell selection are verified
- [ ] DND Musician / Tough remain separate entries and background links do not mix 音乐家 with 健壮
- [ ] DND feat metadata distinguishes source-labeled origin/general feat categories from unverified effect text
- [ ] DND Feat / Background Link Correction does not add feat automation, Magic Initiate spell choice UI, Action Registry integration, schema changes, or migration changes
- [ ] DND spell data carries source/trust metadata while retaining the existing runtime spell list
- [ ] DND spell manifest gap report records 507 owner manifest spell entries versus the current runtime list without importing unverified placeholder spells into Gameplay
- [ ] DND spell translation anomalies such as Revivify / True Strike / Hold Person are marked `needs-human-check`
- [ ] DND spell correction does not copy long rules text, automate spell effects, or guess class lists from model memory
- [ ] DND spell correction does not change spell preparation, spellcasting resource consumption, Action Registry, RuntimeLogEntry, schema, or migration behavior
- [ ] DND Sheet species/background display does not use 2014 race/subrace string hardcoding such as dwarf or mountain-dwarf proficiency additions
- [ ] DND Sheet displays current 2024 species/background metadata and marks unverified species traits/background features as pending verification
- [ ] DND Sheet keeps legacy saved race/subrace/background values compatible with legacy/needs-human-check messaging
- [ ] Source-manifest tasks do not modify runtime behavior, Creator, Gameplay, Market, store schema, or migration
- [ ] New verified runtime/core rule data declares source and trust metadata before promotion
- [ ] Unknown-source or suspicious data is not used as the basis for new gameplay features
- [ ] Public/free source data is embedded only within allowed scope
- [ ] Paid-book or official-but-not-public content is referenced by metadata only; long rules text is not copied
- [ ] Homebrew/demo/placeholder data is visibly labeled or kept quarantined
- [ ] High-risk legacy datasets remain unchanged unless the task explicitly schedules quarantine or source labeling

---

## 6k. Actor Vault Single-Actor Action Cleanup v1 Check

- [ ] **DND — actor exists**: vault header shows NO "Create Character" primary button
- [ ] **DND — actor exists**: actor card CTA column shows **only** "View Sheet"; no "Continue Editing" button
- [ ] **DND — actor exists**: footer shows "重新创建 / 替换当前角色" as small underline link with explanatory note
- [ ] **DND — no actor**: empty state shows "Create Character" as prominent primary CTA
- [ ] **COC — investigator exists**: vault header shows NO "Create Investigator" primary button
- [ ] **COC — investigator exists**: investigator card CTA column shows **only** "View Investigator Sheet"; no "Continue Editing" button
- [ ] **COC — investigator exists**: footer shows "重新创建 / 替换当前调查员" as small underline link with explanatory note
- [ ] **COC — no investigator**: empty state shows "Create Investigator" as prominent primary CTA
- [ ] **CP RED — Edgerunner exists**: vault header shows NO "Create Edgerunner" primary button
- [ ] **CP RED — Edgerunner exists**: Edgerunner card CTA column shows **only** "View Character Sheet"; no "Continue Editing" button
- [ ] **CP RED — Edgerunner exists**: footer shows "重新创建 / 替换当前 Edgerunner" as small underline link with explanatory note
- [ ] **CP RED — no Edgerunner**: empty state shows "Create Edgerunner" as prominent primary CTA
- [ ] Replace links use clearly lower visual weight than View Sheet button (opacity/size)
- [ ] `ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1` landmark present in all 3 shell files (6 locations)
- [ ] `multiWorkspace.actions.replaceCurrentCharacter/Investigator/Edgerunner` keys in both locale files
- [ ] `multiWorkspace.singleActor.characterNote/investigatorNote/edgerunnerNote` keys in both locale files
- [ ] Top nav unaffected: still shows 角色库 / 规则库 / 数据状态
- [ ] View Sheet button still opens sheet correctly in all 3 systems
- [ ] Creation Method / Builder code assets untouched
- [ ] Runtime code untouched
- [ ] No store schema, migration, save format, rule logic, dice, import/export, or routing changed

---

## 7a. Multi-Actor Store Architecture Review v1 Check (Docs Only)

- [ ] `docs/architecture/MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW.md` exists and contains `AI-LANDMARK: MULTI_ACTOR_STORE_ARCHITECTURE_REVIEW_V1`
- [ ] Section 1 (Actor unified concept): platform name = Actor; system names = Character / Investigator / Edgerunner; vault UI = 角色库 (generic)
- [ ] Section 2 (Actor instance ID): `actorInstanceId` defined; existing `id` field reused; lazy migration if empty; copy generates new ID
- [ ] Section 3 (Actor metadata): `ActorMeta` (universal fields) + `SystemActorSummary` (discriminated union per system) documented
- [ ] Section 4 (Source/Creator): 5 `ActorSourceType` values; `creatorName` / `creatorUid` / `importedBy` defined; `creatorUid` reserved for future accounts
- [ ] Section 5 (Campaign binding): `CampaignStatus` 4 values; actor can exist independently; `campaignId` reserved; no Campaign store implemented
- [ ] Section 6 (Data models): Option A (per-system arrays) vs Option B (unified Actor Registry) compared with advantages/disadvantages/risks
- [ ] Section 6 recommends **Option A** for V1 multi-actor
- [ ] Section 7 (Migration): single object → `characters[0]`; `id` → `actorInstanceId` (lazy); `schemaVersion` bump; `migrate()` callback; no destructive one-time script
- [ ] Section 8 (UI impact): two-section vault layout unchanged; Existing section becomes list; active actor pointer `activeCharacterId`; most-recent by `updatedAt`
- [ ] Section 9 (Risk boundaries): 10 risks listed (localStorage migration / import-export compat / actor switching / runtime reference / inventory / spell state / undo / campaign binding / actor count limit / active pointer call sites)
- [ ] `src/` **not touched** by this task
- [ ] `PROJECT_STATUS.md` row added for Multi-Actor Store Architecture Review v1
- [ ] `docs/ai/SYMBOL_MAP.md` section added
- [ ] `docs/ai/TASK_ARCHIVE.md` entry appended

---

## 7c. DND Multi-Actor Store + Actor Vault Library v1 Check

- [ ] `DndWorkspaceView` type includes `'characterLibrary'`
- [ ] `'characters'` view shows vault homepage with two entry cards only (NO character list)
- [ ] 已有角色 entry card shows stats: total / complete / incomplete / recent update (—)
- [ ] 添加角色 entry card shows note text + navigates to `'create'` view on click
- [ ] `'characterLibrary'` view renders: back button, title, search bar, filter tabs, sort dropdown, character cards
- [ ] Search filters by name / class / race / background (local, case-insensitive)
- [ ] Filter tabs: 全部, 资料完整, 未完成 — all functional
- [ ] Sort: 名称 and 等级 sort correctly; 最近更新 = insertion order (labeled as planned-accurate)
- [ ] Character cards show: name, level, class (+subclass if present), race, background, source, creator, campaign, completion badge, active badge
- [ ] "进入" button per card: calls `setActiveCharacterId` then `onOpenPlayTab('sheet')`
- [ ] Active character card uses `dndChar` compat field (always up-to-date)
- [ ] Nav "角色库" highlights when `view === 'characterLibrary'`
- [ ] `multiWorkspace.actorVault.addActorNote` + `totalCount` + `completeCount` + `incompleteCount` + `recentUpdate` added to zh-CN.ts + en.ts
- [ ] `dndWorkspace.characterLibrary.*` section added to zh-CN.ts + en.ts (title, backToVault, searchPlaceholder, noResults, statusComplete, statusIncomplete, filter.*, sort.*)
- [ ] COC and CP RED not touched
- [ ] No dice/runtime/routing/Campaign/Workshop/Plugin change
- [ ] `PROJECT_STATUS.md` row added
- [ ] `docs/ai/SYMBOL_MAP.md` section added
- [ ] `docs/ai/TASK_ARCHIVE.md` entry appended

---

## 8a. Platform Actor Vault Library Framework Extraction v1 Check

- [ ] `src/lib/platform/actorVault.ts` exists and contains `AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1`
- [ ] `src/components/platform/ActorVaultLibraryShell.tsx` exists and contains `AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1`
- [ ] `src/pages/dndWorkspace/dndActorVaultAdapter.ts` exists
- [ ] `ActorVaultSummary`, `ActorVaultStats`, `ActorVaultAdapter`, `ActorVaultColorTheme`, `ActorVaultShellStrings` types exported from `src/lib/platform/actorVault.ts`
- [ ] `ActorVaultColorTheme` type includes `hoverBorder`, `focusBorder`, `hoverText` fields
- [ ] `DndWorkspaceView` type no longer contains `'characterLibrary'` (shell manages home/existing internally)
- [ ] DND 角色库 nav item (`view === 'characters'`) renders `<ActorVaultLibraryShell>` — not the old inline JSX
- [ ] Shell home view shows two entry cards: 已有角色 (stats total/complete/incomplete/recent) + 添加角色 (note text)
- [ ] Clicking 已有角色 card → shell navigates to existing list (internal mode change, no external view change)
- [ ] Clicking 添加角色 card → shell calls `onRequestAdd()` → DndWorkspaceShell navigates to `'create'` view
- [ ] Existing list view shows: back button, search input, sort select, filter tabs (全部/资料完整/未完成), character cards
- [ ] Search covers displayName + all detailFields values + all metaRows values
- [ ] Filter tabs functional; sort 名称/等级/最近更新 all sort correctly
- [ ] Character card shows: name, active badge, status badge, detailFields (level/class/species/background), metaRows (source/creator/campaign), 进入 CTA
- [ ] 进入 CTA calls `setActiveCharacterId(id)` then `onOpenPlayTab('sheet')` (unchanged behaviour)
- [ ] Active character is substituted with live `dndChar` compat field (always up-to-date)
- [ ] `DND_VAULT_COLOR_THEME` in `dndActorVaultAdapter.ts` has `hoverBorder`, `focusBorder`, `hoverText` as literal Tailwind class strings
- [ ] No `.replace()` computed class strings in `ActorVaultLibraryShell.tsx`
- [ ] COC workspace untouched; CP RED workspace untouched
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors
- [ ] No dice/runtime/routing/Campaign/Workshop/Plugin/import-export/save format/unified registry changes

---

## 8l. Workshop Browse Taxonomy Cleanup v1 Check

- [ ] `rg "WorkshopAssetType|WORKSHOP_ASSET_TYPE_KEYS|assetType|bundleContains|splitByAssetType" src/` returns **zero matches**
- [ ] `src/lib/platform/workshopTypes.ts` exports `WorkshopCategory`, `WorkshopSystem`, `WorkshopContentShape`, `WorkshopSort`, `WORKSHOP_SUBTYPES`, `WORKSHOP_LANDING_MAP`
- [ ] `WORKSHOP_BROWSE_SAMPLES` has exactly **4 items**; none has id `sample.starter-bundle`
- [ ] `WORKSHOP_SUBSCRIPTION_SAMPLES` has exactly **2 items**; none has id `sub.starter-bundle`
- [ ] `WorkshopShell.tsx` renders search box + 5 filter rows (adaptedSystem, primaryCategory, subtype contextual, contentShape, sort)
- [ ] Subtype row is **hidden** when primary category is `all`
- [ ] Subtype row is **shown** when primary category is e.g. `ruleContent`
- [ ] `toolTemplate` primary category shows **no subtype row** (empty subtypes array)
- [ ] Search box filters cards by title and tags
- [ ] Selecting `mediaAsset` shows the 夜城 card; selecting `character` shows the 新手角色模板 card
- [ ] Landing section lists all 7 primary categories + collection shape row
- [ ] `workshop.filter.adaptedSystem.*`, `workshop.category.*`, `workshop.filter.subtype.*`, `workshop.filter.contentShape.*`, `workshop.filter.sort.*` all present in both locale files
- [ ] `workshop.assetType.*` and `workshop.bundleContains` are **absent** from both locale files
- [ ] No store / schema / migration / routing / workspace-internal files modified
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8m. Workshop Browse + Subscriptions UX Refinement v1 Check

- [ ] Workshop top tab bar shows exactly **2 tabs**: 浏览 / 我的订阅 — no 更新与依赖 tab
- [ ] Filter card has **两个独立区块**: 基础筛选 (适配系统 + 主分类 + 细分类型子面板) and 高级筛选 (内容形态 + 排序)
- [ ] Subtype sub-panel appears only when `primaryCategory ≠ 'all'` and the category has subtypes (e.g. `creatureNpc`, `ruleContent`)
- [ ] Subtype sub-panel is **hidden** when `primaryCategory === 'toolTemplate'` (empty subtypes array)
- [ ] Subtype sub-panel renders with `ml-[88px]` indent and left border — visually nested under 主分类 row
- [ ] Subtype sub-panel header line reads `当前分类：{categoryLabel}` (using `currentCategoryLabel` i18n key)
- [ ] Subtype sub-panel row label is `细分类型：` (using `subtypeRowLabel` i18n key)
- [ ] Browse grid shows exactly **6 sample cards**: dnd-expansion-rules, castle-investigation-maps, night-city-ambience, dnd-starter-character-template, coc-investigator-npc-pack, random-encounter-template
- [ ] Each browse card shows a **落位 (landing)** field row
- [ ] `systemRuleSources` landing prepends system name (e.g. "DND 5e 2024 的系统规则来源")
- [ ] 我的订阅 tab shows **search input** at top + status filter + category filter rows
- [ ] 我的订阅 list shows **4 sample items** with per-item status badges (ok/hasUpdate/ok/possibleConflict)
- [ ] Status badge colors: ok=emerald, hasUpdate=blue, possibleConflict=amber, needsAttention=red, missingDependency=orange, affectsCampaign=purple, disabled=muted
- [ ] Each subscription item shows per-item landing destination
- [ ] `systemRuleSources` subscription landing also prepends system name
- [ ] **管理接口预留** button visible per subscription item (placeholder, no action required)
- [ ] Subscription list **low-weight footnotes** visible at bottom: preflightNote + landingFootnote (text opacity ~40%)
- [ ] `workshop.filter.basicSection` and `workshop.filter.advancedSection` present in both locale files
- [ ] `workshop.filter.subtype.currentCategoryLabel`, `workshop.filter.subtype.subtypeRowLabel`, `workshop.filter.subtype.randomTable` present in both locale files
- [ ] `workshop.card.landing` key present in both locale files
- [ ] `workshop.subscriptions.search.placeholder` present in both locale files
- [ ] `workshop.subscriptions.filterStatus` present in both locale files
- [ ] `workshop.subscriptions.statusFilter.*` (7 keys) present in both locale files
- [ ] `workshop.subscriptions.badge.*` (7 keys) present in both locale files
- [ ] `workshop.subscriptions.manageReserved` present in both locale files
- [ ] `workshop.subscriptions.preflightNote` and `workshop.subscriptions.landingFootnote` present in both locale files
- [ ] `workshop.tabs.updates` key is **absent** from both locale files
- [ ] `workshop.landingTitle` key is **absent** from both locale files
- [ ] `workshop.subscriptions.statusReserved` and `workshop.subscriptions.cancelReserved` keys are **absent** from both locale files
- [ ] `workshop.updates.*` keys are **absent** from both locale files
- [ ] `WORKSHOP_SUBSCRIPTION_SAMPLES` has exactly **4 items** in `workshopTypes.ts`
- [ ] `WorkshopSubscriptionItem` type includes `landing: WorkshopLandingTarget` and `status: WorkshopSubscriptionStatusKey`
- [ ] No store / schema / migration / routing / workspace-internal / rule-data files modified
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8n. Workshop Full Interface Scaffold v1 Check

- [ ] `src/lib/platform/workshopTypes.ts` contains `AI-LANDMARK: WORKSHOP_FULL_INTERFACE_SCAFFOLD_V1`
- [ ] `src/components/platform/WorkshopShell.tsx` contains `AI-LANDMARK: WORKSHOP_FULL_INTERFACE_SCAFFOLD_V1`
- [ ] `WorkshopImpactScope`, `WorkshopDependencyStatus`, `WorkshopActionResult`, `WorkshopActions` types exported from `workshopTypes.ts`
- [ ] `WORKSHOP_ACTION_STUBS` exported from `workshopTypes.ts`; all stub methods return `{ ok: false, status: 'reserved' }`
- [ ] `WORKSHOP_ATTRIBUTE_TAGS` exported from `workshopTypes.ts`; all 7 category keys present (character/creatureNpc/ruleContent/mapScene/adventureModule/mediaAsset/toolTemplate)
- [ ] `WORKSHOP_SUBTYPES` updated: new keys present — `presetCharacter`, `characterOption`, `dungeonMap`, `investigationScript`, `macro`, `characterSheetTemplate`
- [ ] `WorkshopLandingTarget` includes `npcLibrary`, `moduleLibrary`, `toolLibrary`
- [ ] `WORKSHOP_LANDING_MAP`: `creatureNpc → npcLibrary`, `toolTemplate → toolLibrary`
- [ ] `WorkshopBrowseItem` type has: `author`, `description`, `attributeTags`, `version`, `lastUpdatedLabel`, `dependencyStatus`, `impactScope`
- [ ] `WorkshopSubscriptionItem` type has: `author`, `version`, `lastUpdatedLabel`, `dependencyStatus`, `impactScope`
- [ ] `WORKSHOP_BROWSE_SAMPLES` has exactly **6 items** with full metadata
- [ ] `WORKSHOP_SUBSCRIPTION_SAMPLES` has exactly **4 items** with full metadata
- [ ] `WorkshopShell.tsx` has state variable `activeAttributeTag` (default `'all'`)
- [ ] `WorkshopShell.tsx` has state variable `previewId: string | null` (default `null`)
- [ ] Filter area has **attribute tags** chip row (appears inside subtype sub-panel when category is not `'all'`)
- [ ] Quick preview panel renders **between** filter card and browse grid when `previewId !== null`
- [ ] Quick preview panel shows: title, description, author, version, lastUpdated, impactScope, dependencyStatus, attributeTag chips; close button sets `previewId = null`
- [ ] Each browse card has a **快速预览** button that toggles `previewId`
- [ ] Browse cards show: author, version, lastUpdated small text row, attributeTag chips, conditional impactScope
- [ ] 我的订阅 tab shows **subscription profile block** at top (profile label + default label + dashed config-reserved button)
- [ ] Subscription items show extended metadata row: version / lastUpdated / dependencyStatus / impactScope
- [ ] Search covers: title, author, subtype, attributeTags, category, system fields
- [ ] `SubPanelRow` helper component present in `WorkshopShell.tsx` (label-less chip row for sub-panel)
- [ ] `handleCategoryChange` resets both `activeAttributeTag` and `previewId`
- [ ] `workshop.filter.attributeTag.*` section present in both locale files (flat namespace)
- [ ] `workshop.impactScope.*` (7 keys) present in both locale files
- [ ] `workshop.dependencyStatus.*` (5 keys) present in both locale files
- [ ] `workshop.card.quickPreview`, `workshop.card.closePreview`, `workshop.card.author`, `workshop.card.version`, `workshop.card.lastUpdated`, `workshop.card.dependencyStatus`, `workshop.card.impactScope`, `workshop.card.attributeTags`, `workshop.card.previewInterfaceNote` present in both locale files
- [ ] `workshop.landing.npcLibrary`, `workshop.landing.moduleLibrary`, `workshop.landing.toolLibrary` present in both locale files
- [ ] `workshop.subscriptions.profile.label`, `workshop.subscriptions.profile.default`, `workshop.subscriptions.profile.configReserved` present in both locale files
- [ ] `workshop.subscriptions.versionLabel`, `workshop.subscriptions.lastUpdatedLabel`, `workshop.subscriptions.dependencyStatusLabel`, `workshop.subscriptions.impactScopeLabel` present in both locale files
- [ ] No store / schema / migration / save format / rule data / Builder / dice / runtime / Actor Vault / System Library / DND / COC / CP RED internal / Campaign / Module / Session / React Router / URL routing / browser History API files modified
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8k. PlayMenu Dead Code Cleanup v1 Check

- [ ] `rg "PlayMenu" src/` returns **zero matches**
- [ ] `rg "playStage === 'menu'" src/` returns **zero matches**
- [ ] `rg "setPlayStage\('menu'\)" src/` returns **zero matches**
- [ ] `rg "选择规则系统|Choose a game system" src/` returns **zero matches** (in runtime code; archive/docs allowed)
- [ ] `src/pages/PlayMenu.tsx` does **not exist**
- [ ] `playMenu.*` i18n keys absent from `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en.ts`
- [ ] `navigation.backToSystemSelect` key is still present in both locale files (live key, should NOT be removed)
- [ ] `playStage === 'workspace'` branch still exists in App.tsx (retain for workspace render)
- [ ] Pressing Up from DND / COC / CP RED Actor Vault → goes to SystemLibrary, not a blank screen
- [ ] Left nav 「系统库」→ SystemLibrary still works
- [ ] Home fixed entry 「规则系统库」→ SystemLibrary still works
- [ ] DND / COC / CP RED 「进入系统」→ enters workspace still works
- [ ] No store / schema / migration / routing / workspace-internal files modified
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8j. System Library Smoke Test + Legacy Path Check v1 Check

- [ ] Home page first section is **继续上次** (not a full feature grid or dev-card wall)
- [ ] Home page has exactly 4 sections: 继续上次 / 最近使用 / 固定入口 / 平台状态摘要
- [ ] Left sidebar nav shows 「系统库」with Library icon — clicking enters SystemLibrary page
- [ ] Home fixed entry 「规则系统库」enters the **same** SystemLibrary page as the left nav
- [ ] SystemLibrary page filters show 3 rows: 类型 / 可用 / 来源 — no 脚手架/计划中 chip anywhere
- [ ] DND / COC / CP RED cards show 「可进入」badge and active 「进入系统」button
- [ ] Clicking 「进入系统」for DND / COC / CP RED enters the correct workspace (NOT PlayMenu)
- [ ] After workspace entry: Back with empty nav stack → returns to SystemLibrary (not PlayMenu)
- [ ] PlayMenu is NOT reachable via any normal UI click path (nav, home, system library, settings, back)
- [ ] 战锤 / 日式TRPG / 自定义系统 cards show 「未接入」badge and disabled 「后续接入」button
- [ ] `rg "enterPlay()" src/App.tsx` shows only the function definition, no calls without a system arg
- [ ] `rg "playStage.*menu\|setPlayStage.*menu" src/App.tsx` shows only the `else { setPlayStage('menu') }` branch inside `enterPlay` — never called from UI

---

## 8i. System Library Filter Taxonomy Cleanup v1 Check

- [ ] System library shows **三行筛选**: 类型 / 可用 / 来源 — each with a label prefix
- [ ] 类型 chips: 全部/TRPG/桌游/战棋/卡牌/自定义
- [ ] 可用 chips: 全部/可进入/未接入 — NOT 脚手架/计划中
- [ ] 来源 chips: 全部/内置/本地/社区
- [ ] DND/COC/CP RED cards show 「可进入」badge (teal) and 「进入系统」button
- [ ] 战锤/日式TRPG/自定义系统 cards show 「未接入」badge (muted) and disabled 「后续接入」button
- [ ] Unavailable cards are visually lower-weight (opacity-65)
- [ ] Genre tag chips visible on all cards (e.g. DND: TRPG/奇幻/内置, COC: 调查/恐怖)
- [ ] Search box placeholder: 搜索规则系统、类型、题材、标签……
- [ ] Search filters by tag text (e.g. typing 「奇幻」shows DND only)
- [ ] 可用 filter 「可进入」shows only DND/COC/CP RED
- [ ] 来源 filter 「本地」shows only 自定义规则系统
- [ ] DND/COC/CP 「进入系统」navigates to correct workspace
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8h. System Library Duplicate Entry Consolidation v1 Check

- [ ] Left sidebar nav shows 「系统库」(zh) / 「System Library」(en) with Library icon — not 「规则系统」
- [ ] Clicking left nav 「系统库」enters the SystemLibrary page (规则系统库)
- [ ] From home, clicking fixed entry 「规则系统库」enters the **same** SystemLibrary page
- [ ] SystemLibrary page shows subtitle: 「管理已接入、计划中和社区规则系统。」
- [ ] The old 「选择规则系统」PlayMenu page is NOT reachable through any normal UI click path
- [ ] After clicking 「进入系统」for DND/COC/CP in SystemLibrary → entering workspace → clicking back with empty nav stack → returns to SystemLibrary (not PlayMenu)
- [ ] Settings page 「进入游玩工作区」button → goes to SystemLibrary
- [ ] DND / COC / CP RED internal Actor Vault not regressed
- [ ] No store / schema / migration / routing files modified
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8g. System Library Scaffold v1 Check

- [ ] `src/pages/SystemLibrary.tsx` contains `AI-LANDMARK: SYSTEM_LIBRARY_SCAFFOLD_V1`
- [ ] Home → 固定入口 → 规则系统库 navigates to SystemLibrary page (not generic placeholder)
- [ ] SystemLibrary page shows title 「规则系统库」
- [ ] Search box filters cards in real-time by name / desc / type
- [ ] Category chips (全部/TRPG/桌游/战棋/卡牌/自定义) filter cards correctly; only TRPG/自定义 have entries in V1
- [ ] Status chips (全部/已接入/脚手架/计划中/社区/本地) filter cards correctly
- [ ] DND 5e 2024 card shows 「已接入」badge and clickable 「进入系统」button → enters DND workspace
- [ ] COC 7e card shows 「已接入」badge and clickable 「进入系统」button → enters COC workspace
- [ ] Cyberpunk RED card shows 「已接入」badge and clickable 「进入系统」button → enters CP RED workspace
- [ ] 战锤 / 日式TRPG cards show 「计划中」badge, lower opacity, and **disabled** (non-clickable) button
- [ ] 自定义规则系统 card shows 「脚手架」badge, lower opacity, and **disabled** button
- [ ] No placeholder system is visually indistinguishable from installed systems
- [ ] DND / COC / CP RED internal Actor Vault not regressed
- [ ] No store / schema / migration / routing files modified
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8f. Platform Home Launchpad IA Cleanup v2 Check

- [ ] `src/pages/Home.tsx` contains `AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V2`
- [ ] Home page first visible section is **继续上次 / Resume** with a 「继续」button
- [ ] 继续上次 card shows current system name and character name (or placeholder if none); system-accent colour applied
- [ ] **最近使用 / Recent** section shows 3 lightweight system rows (DND/COC/CP); character name appears below system name if exists; clicking enters that system
- [ ] **固定入口 / Pinned** section shows exactly 3 entries: 规则系统库 / 我的战役 / 创意工坊; all open placeholder (no fake routing)
- [ ] **平台状态摘要 / Platform Status** section shows 3 status badges (开发期/脚手架可见/接口预留) + Private Import small button in same row
- [ ] Private Import is a **small utility button** in platform status — not a prominent card or Hero CTA
- [ ] Home does **not** show a full 3-column system feature grid
- [ ] Home does **not** show a dev-zone card wall (7 cards)
- [ ] `rg "home\.systems\.\|home\.devZone\." src/pages/Home.tsx` returns **zero matches**
- [ ] Clicking any 最近使用 row or 继续上次「继续」button enters the correct workspace
- [ ] DND / COC / CP RED internal Actor Vault not regressed
- [ ] No store / schema / migration / routing files modified
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8e. Platform Home Launchpad IA Cleanup v1 Check

- [ ] `src/pages/Home.tsx` previously contained `AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V1` (superseded by v2)
- [ ] Sidebar nav label: 游玩 → 规则系统 (zh-CN) / Play → Rule Systems (en) — carried forward to v2

---

## 8d. Actor Vault Dead I18n Key Cleanup v1 Check

- [ ] `rg "vaultTitle|singleActorLimitNote|campaignTeaser|entryPattern|replaceCurrentCharacter|continueInvestigatorEditing" src/i18n/` returns **zero matches**
- [ ] `rg "multiWorkspace\.singleActor\." src/i18n/` returns **zero matches**
- [ ] `rg "cocWorkspace\.nav\." src/i18n/` returns exactly one match per locale: `nav: { sheet: ...` only
- [ ] `rg "cpWorkspace\.nav\." src/i18n/` returns **zero matches**
- [ ] `rg "cpWorkspace\.vault\." src/i18n/` returns **zero matches**
- [ ] `rg "dndWorkspace\.home\.(openCurrent|enterCompendium|boundarySummary)" src/i18n/` returns **zero matches**
- [ ] `rg "dndWorkspace\.modules\.(characters|create|sheet|play|compendium[^I]|inventory|map|journal|sources)" src/i18n/` returns **zero matches**
- [ ] `rg "dndWorkspace\.characters\.(title|emptyNote|hint|vaultBoundary|actorNote|exportImport)" src/i18n/` returns **zero matches**
- [ ] Alive keys still present: `continueEdgerunnerEditing`, `actorVault.existingActors`, `actorVault.activeIndicator`, `cocWorkspace.nav.sheet`, `dndWorkspace.modules.spellIndex`, `dndWorkspace.characters.current`
- [ ] No `src/pages/`, `src/components/`, `src/lib/`, store, schema, migration, save format, or routing files were modified
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8c. CP RED Actor Vault Library Adoption v1 Check

- [ ] `src/pages/cpWorkspace/cpActorVaultAdapter.ts` exists and contains `AI-LANDMARK: CPRED_ACTOR_VAULT_LIBRARY_ADOPTION_V1`
- [ ] `CP_VAULT_COLOR_THEME` has `bgInput`, `bgCard`, `hoverBorder`, `focusBorder`, `hoverText` all as Tailwind literal strings (dark gold palette)
- [ ] CP RED 角色库 (`view === 'vault'`) renders `<ActorVaultLibraryShell>` using CP RED adapter
- [ ] CP RED vault home view: 已有角色 card shows total/complete/incomplete stats; 添加角色 card present
- [ ] CP RED 已有角色 list: search covers 姓名/代号/Role; 全部/资料完整/未完成 filter tabs; 最近更新/名称/角色等级 sort
- [ ] CP RED character card shows: Role, 角色能力等级, HP, Humanity, source/creator/campaign meta rows, 进入 CTA
- [ ] `displayName` = street handle (`lifePath.handle`) preferred over real name
- [ ] Clicking 进入 → `onOpenPlayTab('sheet')` opens the CP RED sheet
- [ ] Clicking 添加角色 → `onViewChange('createMethod')` opens CP RED creation method view
- [ ] `createMethod` view (with 4 option cards + plannedSlotLabelKey) still works correctly
- [ ] CP RED store / save format / rule logic / dice / equipment / 黑市 / netrunning: not modified
- [ ] DND and COC experience not regressed
- [ ] `cpWorkspace.characterLibrary.*` i18n keys present in both zh-CN.ts and en.ts (including sort.roleLevel)
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 8b. COC Actor Vault Library Adoption v1 Check

- [ ] `src/pages/cocWorkspace/cocActorVaultAdapter.ts` exists and contains `AI-LANDMARK: COC_ACTOR_VAULT_LIBRARY_ADOPTION_V1`
- [ ] `COC_VAULT_COLOR_THEME` has `bgInput`, `hoverBorder`, `focusBorder`, `hoverText` all as Tailwind literal strings
- [ ] `ActorVaultColorTheme` type now includes `bgInput: string`
- [ ] `DND_VAULT_COLOR_THEME` in `dndActorVaultAdapter.ts` now includes `bgInput: 'bg-white/80'`
- [ ] `ActorVaultLibraryShell.tsx` uses `t.bgCard` for home entry cards (no `bg-white/60`)
- [ ] `ActorVaultLibraryShell.tsx` uses `t.bgInput` for search/sort inputs (no `bg-white/80`)
- [ ] COC 角色库 (`view === 'vault'`) renders `<ActorVaultLibraryShell>` using COC adapter
- [ ] COC vault home view: 已有角色 card shows total/complete/incomplete stats; 添加角色 card present
- [ ] COC 已有角色 list: search covers 姓名/职业/居住地; 全部/资料完整/未完成 filter tabs; 最近更新/名称 sort
- [ ] COC character card shows: 姓名, 职业, 年龄, 居住地, source/creator/campaign meta rows, 进入 CTA
- [ ] Clicking 进入 → `onViewChange('sheet')` opens the COC sheet
- [ ] Clicking 添加角色 → `onViewChange('createMethod')` opens COC creation method
- [ ] COC store / save format / rule logic / dice / COC Pushed Roll: not modified
- [ ] DND experience not regressed (DND vault still uses DndActorVaultAdapter, not COC)
- [ ] CP RED workspace not modified
- [ ] `cocWorkspace.characterLibrary.*` i18n keys present in both zh-CN.ts and en.ts
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` completes without errors

---

## 7b. DND Multi-Actor Store Minimal Implementation v1 Check

- [ ] `src/store/characterStore.ts` contains `AI-LANDMARK: DND_MULTI_ACTOR_STORE_MINIMAL_IMPLEMENTATION_V1`
- [ ] `CharacterState` interface has `characters: CharacterData[]`, `activeCharacterId: string | null`, `setActiveCharacterId`, `addCharacter`
- [ ] `_initialChar` extracted as module-level constant; initial state: `characters: [_initialChar]`, `activeCharacterId: _initialChar.id`
- [ ] `syncActiveCharacter` helper present and used in `setActiveCharacterId`, `addCharacter`, `resetCreator`, `loadCharacter`
- [ ] `merge` callback: legacy `{character}` → wraps to `characters[0]`; multi-actor → migrates all + substitutes compat field for active slot
- [ ] `resetCreator` syncs current character to array before creating new blank; new blank is added to array + set as active
- [ ] `loadCharacter` syncs current character to array before upsert + activation
- [ ] DND Actor Vault (`view === 'characters'`) iterates `dndCharacters[]` instead of single `dndChar`
- [ ] Each character card has a "进入" button calling `setActiveCharacterId(char.id)` then `onOpenPlayTab('sheet')`
- [ ] Active character shows `multiWorkspace.actorVault.activeIndicator` badge
- [ ] Standard Creation (all creation method cards) calls `resetDndCreator()` before `onOpenPlayTab('creator')`
- [ ] `multiWorkspace.actorVault.multiActorNote` added to zh-CN.ts + en.ts
- [ ] `multiWorkspace.actorVault.activeIndicator` added to zh-CN.ts + en.ts
- [ ] COC and CP RED files untouched (store, shell, i18n for those systems)
- [ ] No dice/runtime/routing/import/export/Campaign/Workshop/Plugin changes
- [ ] `PROJECT_STATUS.md` row added
- [ ] `docs/ai/SYMBOL_MAP.md` section added
- [ ] `docs/ai/TASK_ARCHIVE.md` entry appended

---

## 6l. Actor Vault Existing/Add Split v1 Check

- [ ] **DND — Existing Actors section**: heading "已有角色 / Existing Actors" visible with singleActorLimitNote subtitle
- [ ] **DND — actor exists**: Existing Actors shows actor card with name / level / class / species / background / source (placeholder) / campaign (placeholder) metadata grid
- [ ] **DND — actor exists**: actor card CTA column shows **only** "View Sheet"; no Create / Edit / Continue Editing / Start Playing in Existing section
- [ ] **DND — no actor**: Existing Actors shows dashed-border empty state with emptyTitle + emptyNote text
- [ ] **DND — Add Actor section**: heading "添加角色 / Add Actor" visible
- [ ] **DND — Add Actor**: Standard Create card is visually primary (solid border / bg); clicking goes directly to Builder (`onOpenPlayTab('creator')`) — does NOT navigate to `view='create'` first
- [ ] **DND — Add Actor**: Quick Create / Local Import / Workshop Import cards are visually lighter (planned styling) and show PLANNED badge
- [ ] **DND — planned slot message**: clicking a planned Add Actor card shows the plannedSlotLabelKey message block below the grid
- [ ] **DND**: no Replace link in footer (removed); singleActor.characterNote caption still visible inside Add Actor section when actor exists
- [ ] **DND**: campaignTeaser text visible at bottom of Add Actor section
- [ ] **COC — Existing Actors section**: heading visible with singleActorLimitNote subtitle
- [ ] **COC — investigator exists**: Existing Actors shows inline card with name / occupation / age / residence / source (placeholder) / campaign (placeholder) — NOT using shared `renderInvestigatorCard()`
- [ ] **COC — investigator exists**: actor card CTA column shows **only** "View Investigator Sheet"; no other CTAs in Existing section
- [ ] **COC — no investigator**: Existing Actors shows empty state
- [ ] **COC — Add Actor**: Standard Create card goes to Builder (`onOpenPlayTab('creator')`); 3 planned cards shown
- [ ] **COC**: dashboard view still uses `renderInvestigatorCard()` (unchanged by this task)
- [ ] **CP RED — Existing Actors section**: heading visible with singleActorLimitNote subtitle
- [ ] **CP RED — Edgerunner exists**: Existing Actors shows inline card with handle (as h3) / name / role / roleLevel / source (placeholder) / campaign (placeholder) — NOT using shared `renderEdgerunnerCard()`
- [ ] **CP RED — Edgerunner exists**: actor card CTA column shows **only** "View Character Sheet"; no other CTAs in Existing section
- [ ] **CP RED — no Edgerunner**: Existing Actors shows empty state
- [ ] **CP RED — Add Actor**: Standard Create card goes to Builder (`onOpenPlayTab('sheet')` → actually `onOpenPlayTab('creator')`); 3 planned cards shown
- [ ] **CP RED**: dashboard view still uses `renderEdgerunnerCard()` (unchanged by this task)
- [ ] Source / Creator / Campaign fields in all 3 actor cards are UI placeholders (no real systems); values are static i18n strings (sourcePlatform / campaignNone)
- [ ] `multiWorkspace.actorVault.*` keys present in both locale files (existingActors / addActor / emptyTitle / emptyNote / singleActorLimitNote / source / sourcePlatform / creator / creatorPlaceholder / campaign / campaignNone / campaignTeaser)
- [ ] `ACTOR_VAULT_EXISTING_ADD_SPLIT_V1` landmark present in all 3 shell files
- [ ] Top nav unaffected: still shows 角色库 / 规则库 / 数据状态
- [ ] Runtime code untouched; store / schema / migration / rule logic / dice / routing / import-export unchanged

---

## 6j. Actor Vault Action Hierarchy Cleanup v1 Check

- [ ] DND Actor Vault: actor card CTA column shows **View Sheet** (primary) + **Continue Editing** (secondary, dimmer styling) + runtimeGateNote text *(superseded by 6k — continueEditing was removed in ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1)*
- [ ] `ACTOR_VAULT_ACTION_HIERARCHY_CLEANUP_V1` landmark present in all 3 shell files
- [ ] Runtime entry (startPlaying / startInvestigation / startMission) still absent from all vaults
- [ ] No store schema, migration, save format, rule logic, dice algorithm, runtime formula, import/export, or routing changed

---

## 6i. UI Action Hierarchy & Page Responsibility Contract v1 Check

- [ ] `docs/architecture/UI_ACTION_HIERARCHY_AND_PAGE_RESPONSIBILITY_CONTRACT.md` exists
- [ ] Document defines 8 action tiers (A: Platform → B: System → C: Collection → D: Object → E: Creation-flow → F: Runtime-context → G: System-info → H: Planned)
- [ ] Each action tier has: definition, examples, correct containers, forbidden containers
- [ ] Page responsibility contracts defined for: Actor Vault / Actor Sheet / Creation Method / Builder / Runtime / Rules Compendium / Source Status / System Overview
- [ ] Container placement rules defined for: page header / object card / empty state / sidebar / footer/menu
- [ ] Button priority rules defined: primary CTA table, secondary, tertiary
- [ ] At least 9 anti-patterns listed with explanations
- [ ] Required UI task workflow declared (page responsibility + action hierarchy + primary CTA + hidden actions)
- [ ] 12-item review checklist present
- [ ] Current DND / COC / CP RED application section present with specific per-system guidance
- [ ] Relationship to PLATFORM_PATTERNS and NAVIGATION docs explained in §10
- [ ] `UI_ACTION_HIERARCHY_PAGE_RESPONSIBILITY_CONTRACT_V1` landmark present in the document
- [ ] `docs/ai/SYMBOL_MAP.md` updated with UI Action Hierarchy section
- [ ] No `src/` files modified (doc-only task)
- [ ] `git status --short` shows only doc files changed

---

## 6h. Actor Vault Responsibility Cleanup + Hide Runtime CTA v1 Check

- [ ] DND Actor Vault (`characters` view): only "View Sheet" + "Create Character" CTAs visible; no "Continue Editing", no "Start Playing"
- [ ] DND Actor Vault: no local-import or export/import planned cards at bottom
- [ ] DND Actor Vault: System Info visible only as small text underline link (not a button)
- [ ] DND dashboard (`dashboard` view): no "Start Playing" button; only "View Sheet"
- [ ] DND Sheet (in play view): no "Start Playing" button visible
- [ ] COC Vault (`vault` view): investigator card shows only "View Investigator Sheet"; no "Continue Editing", no "Start Investigation"
- [ ] COC Vault: no local-import planned card grid at bottom
- [ ] COC Vault: System Info visible only as small text underline link
- [ ] COC Sheet (`sheet` view) header: no "Continue Investigator Editing", no "Start Investigation" buttons
- [ ] CP RED Vault (`vault` view): edgerunner card shows only "View Character Sheet"; no "Continue Editing", no "Start Mission"
- [ ] CP RED Vault: no planned cards (listPlaceholder + localImportCharacter) at bottom
- [ ] CP RED Vault: System Info visible only as small text underline link
- [ ] CP RED Sheet (CpEdgerunnerSheetShell): no "Start Mission" button; "Continue Editing" still present
- [ ] `runtimeGateNote` text visible where expected (vault CTA columns, CP RED sheet sidebar)
- [ ] `ACTOR_VAULT_RESPONSIBILITY_CLEANUP_HIDE_RUNTIME_CTA_V1` landmark present in DndWorkspaceShell, CocWorkspaceShell, CpWorkspaceShell, PlayWorkspace
- [ ] `navigation.runtimeGateNote` key present in both `zh-CN.ts` and `en.ts`
- [ ] Runtime code (Gameplay, CocGameplay, CpGameplay) untouched; only UI entry points removed
- [ ] No store schema, migration, save format, rule logic, dice, runtime formula, or import/export changed
- [ ] No React Router / URL routing / browser History API introduced

---

## 6g. CP RED Workspace Contract Alignment v1 Check

- [ ] CP RED workspace top nav shows exactly **4 items**: 工作台总览 / Edgerunner 库 / CP RED 规则库 / 规则源状态
- [ ] No '创建 Edgerunner' item in the top nav bar
- [ ] No 'Edgerunner 卡' item in the top nav bar
- [ ] No '任务面板' item in the top nav bar
- [ ] CP RED workspace opens to overview (dashboard) with system title and Edgerunner context
- [ ] '创建 Edgerunner' entry accessible via: overview empty-state CTA + vault header CTA
- [ ] 'Edgerunner 卡' accessible via: renderEdgerunnerCard "查看角色卡" button (overview & vault)
- [ ] '任务面板' (runtime) accessible via: renderEdgerunnerCard "开始任务" button
- [ ] CP RED Creator accessible via: createMethod → 标准创建
- [ ] `createMethod` view shows 4 creation cards (标准/快速/本地导入/Workshop); planned cards show planned badge
- [ ] `actorFlowNote` text appears at the bottom of the createMethod view
- [ ] Vault (Edgerunner 库) shows Edgerunner card with 3 action buttons + 2 planned slots
- [ ] CP RED 规则库 shows compendium category shells (all planned)
- [ ] 规则源状态 shows CP RED core source row
- [ ] `CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1` landmark present in `src/pages/cpWorkspace/CpWorkspaceShell.tsx`
- [ ] `cpWorkspace.creation.actorFlowNote` key present in both `zh-CN.ts` and `en.ts`
- [ ] navItems type no longer has `kind`/`view?`/`tab?` fields
- [ ] Overview shows Edgerunner card (or empty state) — no tool matrices, no coverage tables
- [ ] Back button still returns via history stack
- [ ] Up from vault → overview; Up from overview → Play Menu
- [ ] DND workspace **unchanged** — not touched by this task
- [ ] COC workspace **unchanged** — not touched by this task
- [ ] No store schema, migration, save format, CP RED runtime rule logic, dice algorithm, or rule data changed
- [ ] No React Router / URL routing / browser History API introduced

---

## 6f. COC Workspace Contract Alignment v1 Check

- [ ] COC workspace top nav shows exactly **4 items**: 工作台总览 / 调查员库 / COC 规则库 / 规则源状态
- [ ] No '创建调查员' item in the top nav bar
- [ ] No '调查员卡' item in the top nav bar
- [ ] No '调查面板' item in the top nav bar
- [ ] COC workspace opens to overview (dashboard) with system title and investigator context
- [ ] '创建调查员' entry accessible via: overview empty-state CTA + vault header CTA
- [ ] '调查员卡' accessible via: renderInvestigatorCard "查看调查员卡" button (overview & vault)
- [ ] '调查面板' (runtime) accessible via: renderInvestigatorCard "开始调查" button
- [ ] COC Builder (Creator tab) accessible via: createMethod → 标准创建
- [ ] `createMethod` view shows 4 creation cards (标准/快速/本地导入/Workshop); planned cards show planned badge
- [ ] `actorFlowNote` text appears at the bottom of the createMethod view
- [ ] Vault (调查员库) shows investigator card with 3 action buttons + 2 planned slots
- [ ] COC 规则库 shows 6 compendium category shells (all planned)
- [ ] 规则源状态 shows COC 7e core source row
- [ ] `COC_WORKSPACE_CONTRACT_ALIGNMENT_V1` landmark present in `src/pages/cocWorkspace/CocWorkspaceShell.tsx`
- [ ] `cocWorkspace.creation.actorFlowNote` key present in both `zh-CN.ts` and `en.ts`
- [ ] `Activity` and `FileText` icon imports removed from `CocWorkspaceShell.tsx`
- [ ] Overview shows investigator card (or empty state) — no tool matrices, no coverage tables
- [ ] Back button still returns via history stack
- [ ] Up from vault → overview; Up from overview → Play Menu
- [ ] DND workspace **unchanged** — not touched by this task
- [ ] CP RED workspace **unchanged** — not touched by this task
- [ ] No store schema, migration, save format, COC runtime rule logic, dice algorithm, or rule data changed
- [ ] No React Router / URL routing / browser History API introduced

---

## 6e. DND Workspace Contract Alignment v1 Check

- [ ] DND workspace top nav shows exactly **4 items**: 工作台总览 / 角色库 / 规则库 / 规则源状态
- [ ] No '创建角色' item in the top nav bar
- [ ] Navigating to DND workspace shows the 4-item nav with no creation tab
- [ ] '创建角色' view is reachable via the "创建第一个角色" CTA in overview (empty state)
- [ ] '创建角色' view is reachable via the "创建角色" button in 角色库 header
- [ ] Creation method cards (标准/快速/本地导入/Workshop) still appear correctly in the create view
- [ ] Clicking 标准创建 opens DND Creator (Builder Workbench)
- [ ] Planned method cards show planned badge and planned slot message
- [ ] `actorFlowNote` text appears at the bottom of the create view
- [ ] `DND_WORKSPACE_CONTRACT_ALIGNMENT_V1` landmark present in `src/pages/dndWorkspace/DndWorkspaceShell.tsx`
- [ ] `dndWorkspace.creation.actorFlowNote` key present in both `zh-CN.ts` and `en.ts`
- [ ] Overview (dashboard) still shows character context / empty state correctly
- [ ] 角色库 (characters) view still shows Vault entry, 3 action buttons, 2 planned slots
- [ ] 规则库 (compendium) view still shows 4 index cards
- [ ] 规则源状态 (sources) view still shows 3 source rows
- [ ] COC workspace top nav **unchanged** — not touched by this task
- [ ] CP RED workspace top nav **unchanged** — not touched by this task
- [ ] No store schema, migration, save format, runtime rule logic, dice algorithm, or rule data changed
- [ ] No React Router / URL routing / browser History API introduced

---

## 8o. Platform Local-Direct Launcher Clarity v1 Check

- [ ] With private-alpha auth disabled, the launcher does not mention login or registration
- [ ] The single primary CTA reads 「进入服务器工作台」 / “Open server workspace”
- [ ] The primary CTA opens the existing server selection flow
- [ ] The supporting card explains server → campaign/room → Runtime in three steps
- [ ] With private-alpha auth enabled, the existing `PrivateAlphaLoginPanel` remains the authentication gate
- [ ] At a real 390px CSS viewport, the header, title, CTA, and flow card are fully visible
- [ ] At 390px, `document.documentElement.scrollWidth === window.innerWidth`
- [ ] No auth protocol, API, Runtime, Room, store, schema, migration, routing, or dependency changed

---

## 8p. Room Socket Reconnect + Stream Catch-up v1 Check

- [ ] Unexpected WebSocket close schedules a bounded exponential-backoff reconnect
- [ ] Explicit `close()` cancels pending reconnect and does not open another socket
- [ ] Desired room subscription and verified member id are restored after reconnect
- [ ] First subscription omits stream cursors and receives current RuntimeLog / Room Map baselines
- [ ] Runtime desktop refreshes HTTP history after subscription acknowledgement to close the first-load race
- [ ] Reconnect subscription carries independent `afterRuntimeLogSeq` and `afterMapEventSeq` cursors
- [ ] Server replays only records whose sequence is greater than the supplied cursor
- [ ] Existing per-member RuntimeLog and Room Map projection runs before replay delivery
- [ ] A projected-away event still advances the acknowledged true stream baseline
- [ ] Negative, fractional, or unsafe sequence cursors are rejected as `invalidMessage`
- [ ] Transient ruler/area map previews are not stored or replayed
- [ ] Existing room membership, Runtime permission, event payload, HTTP API, and persistence contracts are unchanged
- [ ] `npm run frontend:verify:room-socket-reconnect` passes
- [ ] `npm run runtime:verify:room-socket-reconnect` passes

---

## 8q. Cloud Live Room Recovery v1 Check

- [ ] Campaign-linked cloud room creation assigns a server-issued Runtime Session id
- [ ] Cloud room creation prepares a matching active Runtime Session before accepting the lobby
- [ ] Join, member review, actor binding review, Ready, map permission, and disband responses await the latest same-room lifecycle snapshot write
- [ ] Lifecycle writes for one room remain serialized; queued snapshots are copied and the newest acknowledged mutation wins
- [ ] Join, member review, actor binding review, Ready, map permission, and disband responses await the latest same-room lifecycle snapshot write
- [ ] Lifecycle writes for one room remain serialized; queued snapshots are copied and the newest acknowledged mutation wins
- [ ] A conflicting existing Runtime Session is rejected instead of being rebound to another room
- [ ] Local/LAN rooms without durable campaign context remain memory-only and do not require PostgreSQL
- [ ] Every cloud Room RuntimeLog append uses `live-room-runtime-log-v1:{roomId}:{eventId}` idempotency
- [ ] Repeating the same Room RuntimeLog event does not create a second durable row
- [ ] Appends for one room are serialized and append-producing HTTP paths await the queued mirror before response/broadcast
- [ ] Startup restores RuntimeLog only after recoverable live lobbies are loaded
- [ ] Recovery paginates streams longer than 200 records and preserves the original Room RuntimeLog sequence
- [ ] Recovery ignores unrelated/malformed Runtime Event records
- [ ] Recovery never overwrites a non-empty in-memory live stream
- [ ] The first post-recovery append continues from the restored latest sequence
- [ ] Existing member permissions and per-viewer RuntimeLog projection remain unchanged
- [ ] Campaign-linked Room Map events recover from their host-only durable envelopes without changing viewer visibility projection
- [ ] Actor admission authority rebuilds from complete server-generated clearance summaries; malformed hashes never restore approval
- [ ] A recovered Player can unready, ready again, and move their restored linked character Token
- [ ] Database write failure does not replace in-memory live authority; durable outbox/retry remains deferred
- [ ] The real restart runner removes artificial post-write sleeps and still recovers the last acknowledged lobby mutation
- [ ] The real restart runner removes artificial post-write sleeps and still recovers the last acknowledged lobby mutation
- [ ] Cross-process pub/sub and multi-instance room authority remain deferred
- [ ] `npm run runtime:verify:live-room-log-recovery` passes
- [ ] `npm run runtime:verify:persistence-bridge` passes
- [ ] `npm run runtime:verify:live-room-lifecycle` passes
- [ ] `npm run runtime:verify:live-room-map-recovery` passes
- [ ] `npm run runtime:verify:room-admission-recovery` passes
- [ ] `npm run runtime:verify:room-permissions` passes
- [ ] `npm run runtime:verify:runtime-visibility-projection` passes
- [ ] `npm run runtime:verify:room-socket-reconnect` passes

---

## 8r. Mobile Runtime Action Dock Hierarchy v1

- [ ] Compact Runtime shows no more than three direct role-prioritized actions plus More
- [ ] DND players with an action palette see Action, Dice, and Actor directly; Public Info remains in More
- [ ] Hosts see Dice, Scene/Location, and Public Info directly; records and private notes remain in More
- [ ] Spectators keep Public Info as their sole direct action
- [ ] Local Runtime caller-added Actor and Settings tools remain accessible through More
- [ ] Opening a More item opens its existing mounted panel and preserves panel state across collapse
- [ ] Opening a Runtime auxiliary panel closes both the active dock panel and More menu
- [ ] Desktop keeps the complete action row with no action removed
- [ ] `npm run frontend:verify:runtime-action-dock` passes
- [ ] No dice, RuntimeLog, permission, store, schema, map, combat, or rule behavior changed

---

## 8s. Runtime Player Turn Callout v1

- [ ] Own combatant resolution requires the viewer's approved actor binding and its projected Token
- [ ] Another or missing actor binding cannot produce an own-turn match
- [ ] The server projection retains only the owner's opaque `actorBindingId`; other viewers do not receive it
- [ ] Mobile HUD marks the admitted player's combatant when it is the active turn
- [ ] DND own-turn CTA opens the existing action palette; other systems open the existing dice panel
- [ ] The CTA itself performs no roll, damage, resource consumption, or RuntimeLog append
- [ ] Paused combat disables the own-turn action CTA
- [ ] Players receive no previous/next/end-combat control; host and spectator behavior is unchanged
- [ ] `npm run frontend:verify:runtime-player-turn-callout` passes
- [ ] Existing Runtime visibility, action-dock, combat HUD, TypeScript, and frontend build checks pass

---

## 8t. Mobile Combat HUD Collapse v1

- [ ] Compact HUD shows round, current combatant, initiative, and next combatant in one short row
- [ ] Expand/collapse control has `aria-expanded` and an explicit accessible label
- [ ] Expanded HUD restores visible HP/AC/conditions and existing host/player controls
- [ ] Host starts expanded; waiting player and spectator start compact
- [ ] A newly active own turn expands the player's HUD automatically
- [ ] Late-arriving projected ownership can still expand the current own turn
- [ ] Manual own-turn collapse survives ordinary rerenders
- [ ] A player returns to compact when the active turn moves to another combatant
- [ ] `npm run frontend:verify:mobile-combat-hud-presentation` passes
- [ ] No combat authority, RuntimeLog, dice, permissions, map, server, store, schema, rules, Campaign Runtime, or desktop layout changed

---

## 8u. Mobile Runtime Overlay Exclusivity v1

- [ ] Mobile starts map-first with members, inspector, and log closed
- [ ] Opening members, inspector, or log replaces the previously open supporting panel
- [ ] Toggling the active supporting panel returns to the unobstructed map
- [ ] A valid programmatic action/dice request closes open mobile supporting panels
- [ ] Invalid or disabled action requests do not emit the accepted-open notification
- [ ] Opening a mobile supporting panel closes the active dock panel and More menu
- [ ] Escape closes supporting panels, the active dock panel, and More menu
- [ ] Desktop supporting panels retain their independent open behavior
- [ ] `npm run frontend:verify:runtime-overlay-coordination` passes
- [ ] Existing action-dock, own-turn, combat HUD, TypeScript, and frontend build checks pass
- [ ] No Runtime content, authority, map, server, store, schema, rules, Campaign Runtime, or desktop layout changed

---

## 8v. Host Free Token + Persistent Actor Vault Entry v1

- [ ] Host Runtime Unit tool opens a clearly labeled standalone Token creator before linked units
- [ ] Host can create a Token with only a name when the room has no admitted character
- [ ] Manual Token supports size and optional host note and appends through the existing map event path
- [ ] Manual host Token remains host-controlled and cannot become a player-owned Token
- [ ] Existing admitted-character and combatant placement remains available below the manual creator
- [ ] Active host can enter Runtime without selecting a character and may optionally select one later
- [ ] Active players retain Actor Vault, quick-character, and full-sheet entry after submit, approval, and Ready
- [ ] Replacing a character uses existing re-submission behavior: returns to host review and clears old Ready
- [ ] Spectators, pending members, and closed rooms do not see character submission actions
- [ ] Lobby IA, character CTA, map replay, actor presence, client/server Token authority, TypeScript, and build checks pass
- [ ] No server API, permissions, entry guard, schema, rules, combat, or Campaign Runtime changed

---

## 8w. Mobile Runtime Supporting Sheet v1

- [ ] Opening members, inspector, or log dims the mobile tabletop behind the panel
- [ ] Tapping the dimmed tabletop closes the active supporting panel and returns to the map
- [ ] Top panel switcher remains above the backdrop and can directly replace the active panel
- [ ] Backdrop is absent when all supporting panels are closed
- [ ] Members, inspector, and log triggers expose their controlled region and pressed/expanded state
- [ ] Host label reads Overview, player reads My Info, and spectator reads Spectator
- [ ] Token inspect overlay remains above supporting sheets
- [ ] Desktop supporting panels and layout remain unchanged
- [ ] `npm run frontend:verify:runtime-overlay-coordination` passes
- [ ] Existing action-dock, own-turn, combat HUD, TypeScript, and frontend build checks pass
- [ ] No Runtime content, authority, permissions, map controls, server, store, schema, rules, or Campaign Runtime changed

---

## 8x. Mobile Runtime Map Tool Labels v1

- [ ] Compact Runtime map tools show an icon and visible short label without requiring hover
- [ ] Host order is Select, Move, Measure, Background, Grid, Area, Token
- [ ] Token is a clearly labeled entry into the existing standalone/linked placement panel
- [ ] Player and spectator tool presentation excludes Background, Grid, and Token
- [ ] Chinese labels are 选择/移动/测距/底图/网格/范围/Token
- [ ] English labels remain compact: Select/Move/Measure/Map/Grid/Area/Token
- [ ] Active tools retain pressed styling and explicit `aria-pressed`
- [ ] Tool rail scrolls inside a bounded tabletop height on short mobile screens
- [ ] `npm run frontend:verify:runtime-map-tool-presentation` passes
- [ ] Existing map replay, actor presence, Token ownership, TypeScript, and frontend build checks pass
- [ ] No tool callback, map authority, permissions, roles, server, store/schema, rules, combat, Campaign Runtime, or workspace layout changed

---

## 8y. Mobile Runtime Map Panel Coordination v1

- [ ] Opening Background, Grid, Area, or Token on compact Runtime closes members/inspector/log sheets
- [ ] Opening a compact map panel closes the active action panel and More menu
- [ ] Opening members, inspector, or log closes an active compact map panel
- [ ] Opening a valid direct dock action closes an active compact map panel
- [ ] Opening More and selecting a valid More item both close an active compact map panel
- [ ] Programmatic own-turn action/dice opening closes an active compact map panel
- [ ] Invalid, disabled, or panel-less action requests do not announce a competing surface
- [ ] Escape closes the active compact map panel
- [ ] Replacing one map panel with another keeps exactly one map panel open
- [ ] Desktop map, inspector, and dock panels retain independent behavior
- [ ] `npm run frontend:verify:runtime-map-panel-coordination` passes
- [ ] Existing map tools, action dock, overlay state, map replay, Token ownership, TypeScript, and build checks pass
- [ ] No map/action callback, authority, permissions, roles, server, store/schema, rules, combat, or Campaign Runtime changed

---

## 8z. Mobile Runtime Map Tool Sheet v1

- [ ] Opening Background, Grid, Area, or Token on compact Runtime dims the tabletop behind the panel
- [ ] Tapping the map backdrop closes the active map panel and returns interaction to the map
- [ ] The backdrop blocks map pan, Token movement, measurement/range drawing, zoom, and compact HUD controls
- [ ] The labeled map tool rail stays above the backdrop and directly replaces the active map panel
- [ ] Selecting Select, Move, or Measure from the compact rail closes the sheet and returns to the canvas tool
- [ ] Desktop does not render an interactive backdrop and preserves existing map behavior
- [ ] `npm run frontend:verify:runtime-map-panel-coordination` passes with open/closed backdrop-state coverage
- [ ] Existing map tools, overlay coordination, action dock, map replay, Token ownership, TypeScript, and build checks pass
- [ ] No map callback, event, authority, permissions, server, store/schema, rule, combat, or Campaign Runtime behavior changed

---

## 8aa. Local Runtime Auth Contract Doctor v1

- [ ] `dev:local:doctor` expects `localDev` from both running services
- [ ] `dev:local:auth:doctor` expects `privateAlpha` from both running services
- [ ] Backend `/health` reports its actual authentication mode without secrets
- [ ] Vite `/__trpg_dev_runtime` reports only service and compiled auth mode
- [ ] Legacy/missing diagnostics, mixed modes, and one-service-only states fail Doctor
- [ ] No-running-service state still permits configuration/database diagnosis
- [ ] Start waits for matching backend and frontend reports before opening the browser
- [ ] `npm run dev:local:verify:doctor-contract` passes
- [ ] TypeScript, server build, frontend build, and diff checks pass
- [ ] No auth protocol, cookie, invite/session secret, schema, migration, Runtime, rule, or deployment behavior changed

---

## 8ab. Private Alpha Two-Account Acceptance Gate v1

- [ ] `PRIVATE_ALPHA_SMOKE_URL` is a deployed non-local HTTPS single origin
- [ ] Read-only preflight reports cloudPrivateAlpha/cloud, privateAlpha auth, disabled dev auth, ready database/World schema, unauthenticated login gate, and secure WSS
- [ ] Host and Player use isolated browser profiles and different authenticated user IDs
- [ ] Host creates Server/Campaign/Room; Player joins and submits an existing character
- [ ] Host approves; Player readies; both enter the same Runtime/WebSocket stream
- [ ] Host places linked and standalone Tokens; Player moves only the granted own Token
- [ ] Combat turn callout/action or dice/log flow works across both clients
- [ ] Player refresh and socket reconnect recover session, room, log/map suffix, and turn
- [ ] Process restart results are recorded separately for session, records, room, RuntimeLog, map, and combat
- [ ] No manual row is marked PASS without timestamp/revision/evidence
- [ ] `npm run alpha:verify:acceptance-preflight-contract` passes
- [ ] Current no-URL environment fails preflight before any remote request

---

## 8ac. Live Room Startup Recovery Readiness Gate v1

- [x] Database-backed startup begins with `startupRecovery.status = pending` and does not report healthy
- [x] `/health` returns 503/`ok: false` until lifecycle, admission, RuntimeLog, and Room Map recovery all succeed
- [x] `/rooms/*` returns a retryable 503 while recovery is pending
- [x] `/rooms/*` remains fail-closed when any recovery stage fails
- [x] `/ws` upgrade returns HTTP 503 before recovery is ready
- [x] Memory-only local mode is immediately ready
- [x] Terminal ready/failed decisions cannot be overwritten by late callbacks
- [x] Health diagnostics expose safe aggregate evidence only
- [x] `npm run runtime:verify:startup-recovery-readiness` passes
- [x] `npm run runtime:verify:room-socket-reconnect` passes with pre-ready upgrade rejection coverage
- [x] `npm run alpha:verify:restart-recovery:local` passes across a real backend process restart and PostgreSQL
- [x] TypeScript and server build pass
- [x] No schema, migration, room protocol, permission, rule data, frontend store, or gameplay calculation changed

---

## 8ad. Complete Room Server Health Readiness v1

- [x] `/health` returns 200 only when the configured database is reachable, all required schemas are ready, and startup recovery is ready
- [x] One missing schema family makes health return 503/`ok: false`
- [x] Database unavailability and startup recovery failure remain distinct safe readiness blockers
- [x] Health reports aggregate ready/required schema counts without credentials or entity identifiers
- [x] User, Campaign, Actor, Asset, Runtime, Generated, World, Visibility, Platform Foundation, Scene State, and DND Private Monster schemas are covered
- [x] Schema readiness checks execute concurrently after the database connectivity check
- [x] Memory-only local mode remains ready with zero required database schemas
- [x] Cloud Private Alpha preflight rejects a partial schema deployment even when World Server schema is ready
- [x] `npm run runtime:verify:server-health-readiness` passes
- [x] `npm run alpha:verify:acceptance-preflight-contract` passes with partial-schema rejection coverage
- [x] `npm run alpha:verify:restart-recovery:local` passes against PostgreSQL across a real process restart
- [x] TypeScript and server build pass
- [x] No schema, migration, auth protocol, permission, room protocol, frontend state, rule data, or gameplay calculation changed

---

## 8ae. Durable Live Event Acknowledgement v1

- [x] Campaign-linked RuntimeLog events remain invisible while durable append confirmation is pending
- [x] Campaign-linked Room Map events remain invisible while durable append confirmation is pending
- [x] Successful PostgreSQL append confirms the event before HTTP success and WebSocket broadcast
- [x] Failed or missing durable append result returns HTTP 503 with a retryable safe error
- [x] Failed pending events are removed from memory and cannot appear in later reads or broadcasts
- [x] Compensation removes only the failed event ID and preserves concurrent confirmed events
- [x] Confirmation is serialized per room/stream so reconnect cursors cannot overtake an earlier pending event
- [x] Sequence numbers are not reused after compensation
- [x] Combat RuntimeLog and shared-dice routes use the same durable confirmation boundary
- [x] Portable memory-only rooms preserve immediate append behavior
- [x] `npm run runtime:verify:durable-append-confirmation` passes
- [x] RuntimeLog recovery, Room Map recovery, Socket reconnect, TypeScript, server build, frontend build, and real PostgreSQL restart recovery pass
- [x] No schema, migration, room protocol, WebSocket envelope, permission model, frontend state, rule data, dice algorithm, or combat calculation changed

---

## 8af. Live Room Durability Circuit v1

- [x] Campaign-linked join, disband, member approval/rejection, actor binding changes, Ready, and map permission changes inspect lifecycle persistence results
- [x] Campaign room creation trips the circuit when Runtime Session or initial lifecycle persistence fails
- [x] A failed required snapshot write returns HTTP 503 and is not broadcast
- [x] After the first durability failure, `/rooms/*`, `/ws`, and `/health` remain fail-closed until restart
- [x] Already in-flight snapshot requests cannot publish after another request trips the circuit
- [x] Health diagnostics expose only the circuit status, timestamp, and safe failure kind
- [x] Portable memory-only rooms do not require lifecycle persistence confirmation
- [x] Map permission snapshot is confirmed before its host-only audit event is created
- [x] `npm run runtime:verify:durability-circuit` passes
- [x] Lifecycle persistence, durable event confirmation, room lifecycle/permission, actor admission/campaign link, TypeScript, server/frontend builds, and real PostgreSQL restart recovery pass
- [x] No schema, migration, auth protocol, permission policy, WebSocket envelope, frontend state, rule data, dice algorithm, or combat calculation changed

---

## 8ag. Serialized Room Snapshot Confirmation v1

- [x] `/rooms/*` requests enter in FIFO order and release the gate idempotently on response finish/close
- [x] A client that disconnects while queued releases immediately when admitted and cannot deadlock the gate
- [x] Reads cannot observe an aggregate RoomSnapshot whose durable write is still pending
- [x] Every snapshot mutation awaits the exact immutable snapshot promise it enqueued
- [x] A later queued success cannot replace the failed result returned to an earlier caller
- [x] The implicit registry observer is no longer used as the route durability acknowledgement boundary
- [x] A failed required write trips the circuit before the next HTTP room request can mutate the registry
- [x] WebSocket upgrade and message handling are unavailable while the snapshot gate is active
- [x] WebSocket readiness is checked again after asynchronous viewer resolution
- [x] Portable memory-only rooms preserve their no-database-required behavior
- [x] `npm run runtime:verify:room-traffic-gate` passes
- [x] Lifecycle persistence smoke covers exact failed/successful queue results and final durable state
- [x] TypeScript, server/frontend builds, durable append/circuit smokes, socket reconnect, and real PostgreSQL restart recovery pass
- [x] No schema, migration, auth protocol, room permission, WebSocket envelope, frontend state, rule data, dice algorithm, or gameplay calculation changed

---

## 8ah. Active Room Request Lease v1

- [x] The room traffic gate is integrated through one independently testable middleware
- [x] A client disconnecting while queued never enters its route handler
- [x] A queued disconnect releases its eventual FIFO lease and cannot deadlock later requests
- [x] A client disconnecting after admission does not release a still-running async handler
- [x] The next request enters only after the admitted handler reaches response end/completion
- [x] Response finish and explicit end remain idempotent release boundaries
- [x] The gate returns to idle after active, queued, and abandoned requests complete
- [x] `npm run runtime:verify:room-traffic-middleware` passes
- [x] TypeScript and server build pass
- [x] No schema, migration, auth protocol, room permission, WebSocket envelope, frontend state, rule data, dice algorithm, or gameplay calculation changed

---

## 8ai. Product Truth + Ecosystem / Internal AI Roadmap v1

- [x] README identifies the current product as a deployable single-node private Alpha multiplayer platform
- [x] `CURRENT_PLATFORM_STAGE.md` separates implemented, partial, contract-only, and unimplemented capabilities
- [x] `ECOSYSTEM_AND_AI_ROADMAP.md` defines AI as an internal intelligence layer, not a user-facing local-model service
- [x] Local model and paid cloud API are provider routes behind one future model gateway
- [x] AI suggestions remain behind deterministic validation, permission, confirmation, repository writes, and audit
- [x] Workshop browse and joined-content surfaces render truthful empty states when repositories return no real records
- [x] Workshop and Fan Plaza legacy public seeds contain no fictional works/packages
- [x] Workshop manifest and joined-package contracts describe the current empty-repository boundary
- [x] Empty-state creation CTA opens the existing private content workbench
- [x] Workshop nav space keeps global navigation; builder context uses one icon-only return affordance
- [x] Public publish, review, subscription, install, update, billing, model inference, schema, and backend behavior were not introduced or claimed
- [x] `npm run frontend:verify:workshop-truthful-empty-state` passes
- [x] `npx tsc --noEmit` passes
- [x] `npm run build` passes
- [x] `git diff --check` passes

---

## 8aj. DND Level Advancement Chain v1

- [x] Level management has one primary entry on the owned character sheet and no combat-panel entry
- [x] Closing or cancelling discards transient choices without a persistent write
- [x] Target class, subclass, ASI/feat, cap, duplicate, and prerequisite blockers are resolved before confirmation
- [x] Fighter level 6 detects its source-backed ASI choice from the class progression table
- [x] Single-class spell slots use local progression data and preserve already-spent slots
- [x] Multiclass allocation preserves existing standard slots and surfaces combined-spellcasting/manual-review warnings
- [x] Target-class resources use allocated class level rather than total character level
- [x] Confirm atomically updates both the active compatibility character and its Owned Actor vault row
- [x] Safe undo succeeds only while the current actor exactly matches the committed advancement snapshot
- [x] Character sheet displays every class/subclass level allocation
- [x] `npm run frontend:verify:dnd-level-advancement` passes
- [x] TypeScript and frontend build pass
- [x] Campaign, Room, Runtime authority, rule-data text, and automatic effect execution remain unchanged

---

## 8ak. Local AI Kernel + DND Character Assistant v1

- [x] Backend-only configuration rejects unsafe provider URLs and does not expose provider URLs or secrets to the browser
- [x] Unconfigured, unreachable, model-missing, timeout, cancellation, provider-error, and invalid-output states are normalized truthfully
- [x] Ollama status checks `/api/tags`; structured generation uses `/api/chat` with a JSON schema and no streaming
- [x] Status and suggestion endpoints require the existing verified viewer boundary
- [x] The request contains only a bounded owner Actor summary and available option names, with no inventory, Campaign, Room, Runtime, GM-private, or other-user context
- [x] Model output is runtime-parsed and then deterministically validated against local options, completed-character limits, background/origin-feat consistency, and exact 27-point buy
- [x] Loading, unavailable, model-missing, error, cancel, preview, warning, discard, confirm, stale, audit, and undo states are represented in the existing Builder
- [x] Confirm is the only write boundary and atomically updates the active character plus its Owned Actor vault row
- [x] Stale suggestions cannot overwrite later edits; undo requires an exact committed snapshot
- [x] Audit is bounded and locally persistent; cloud/shared AI artifact persistence is not claimed
- [x] No Campaign, Room, Runtime, visibility projection, billing, rule data, character schema, or migration changed
- [x] `npm run ai:verify:model-gateway` passes
- [x] `npm run api:verify:dnd-character-assistant` passes
- [x] `npm run frontend:verify:dnd-character-assistant` passes
- [x] TypeScript, server build, frontend build, existing DND creation/advancement regressions, AI scope/retrieval policies, and diff checks pass
- [ ] Live Ollama inference acceptance passes after a deployer installs and configures a local model (not bundled by this repository)

---

## 8al. Room Session AI Assistant v1

- [x] Only an authenticated active host can query status, generate, or confirm; player, spectator, pending, mismatched-account, and unauthenticated access is server-rejected
- [x] The active Runtime log surface owns the host-only entry; the lobby and non-host shells do not present it
- [x] Context is assembled server-side from the existing viewer projection and never accepts client-supplied RuntimeLog bodies
- [x] Context is bounded and excludes opaque room/member/actor-binding identifiers and non-whitelisted payload fields from the model prompt
- [x] Preparation, in-session guidance, and recap share one runtime-parsed schema; invalid or task-mismatched output is rejected
- [x] Suggestions are transient, capacity/TTL bounded, room/member/account bound, and consumable only once
- [x] RuntimeLog advancement after generation causes confirmation to fail stale without writing
- [x] Explicit confirmation is the only write boundary and appends one `host.note` through the existing durability path without changing historical events
- [x] Host-only and public drafts are previewed separately; public audit payload excludes host title, summary, risks, next steps, and context fingerprint
- [x] WebSocket broadcast occurs only after durable acknowledgement; failed required persistence uses the existing pending-event compensation path
- [x] Long model inference does not occupy the exclusive `/rooms/*` snapshot lease; `/api/ai/rooms/*` independently checks startup recovery and durability-circuit readiness
- [x] UI covers status, unavailable/model missing, loading, cancel, error, preview, visibility warning, discard, confirm, stale/expiry message, and success
- [x] No Actor, Campaign, membership, permission, map, combat, rule data, schema, migration, cloud provider, billing, or GeneratedArtifact write changed
- [x] `npm run ai:verify:room-session-assistant`, `npm run api:verify:room-session-assistant`, and `npm run frontend:verify:room-session-assistant` pass
- [x] Existing Model Gateway, AI scope/retrieval, Runtime visibility/durability, TypeScript, server/frontend build, and diff checks pass
- [ ] Live Ollama Session inference acceptance passes after a deployer installs and configures a local model

---

## 8am. AI Settings + Model Routing v1

- [x] Authenticated model catalog exposes only safe installed-model projection fields and never provider URL or credentials
- [x] Device-local preference parser safely falls back to Auto after missing, malformed, oversized, or invalid stored values
- [x] Settings distinguishes loading, error, not configured, provider unreachable, no installed model, and ready states
- [x] Off, Auto, and explicit Local model choices are real; Cloud API is visibly disabled and not presented as implemented
- [x] Auto deterministically prefers an installed Qwen 3.6, then configured default, then another allowed model
- [x] Explicit local model must be installed and optionally allowlisted; invalid choices fail before model generation
- [x] DND Character and Room Session clients read preference per request and send bounded route/model headers
- [x] Server revalidates route/model and preserves existing authentication, host authority, projection, preview, confirmation, stale, and write contracts
- [x] `npm run ai:verify:model-gateway` and `npm run ai:verify:model-routing` pass
- [x] `npm run api:verify:dnd-character-assistant` and `npm run api:verify:room-session-assistant` pass
- [x] `npm run frontend:verify:ai-routing-settings`, character assistant, and room session assistant smokes pass
- [ ] Live Ollama catalog and inference acceptance passes on a machine with an installed Qwen 3.6 model
- [ ] Cloud provider, privacy consent, usage ledger, budget, failure compensation, and billing are implemented (future task)

---

## 8an. Campaign AI Artifact Chain v1

- [x] Every endpoint re-authorizes authenticated campaign `edit` authority and hides scoped resource existence on denial
- [x] Generation requires an explicit non-empty source-family selection; consent is request-local and does not rewrite Campaign `aiScope`
- [x] Eligible projections contain only bounded campaign/actor/active-room summaries and the viewer's prior active artifacts
- [x] Full actor snapshots/overrides, room code/access policy/metadata, RuntimeLog, maps, rules, participants, and other owners' artifacts are excluded
- [x] Retrieval preflight and post-fetch scope guard both run; denied/truncated sources fail the whole request and denied bodies stay redacted
- [x] Structured output parser and citation whitelist reject invented/missing source IDs
- [x] Suggestions are TTL-bound, viewer/world/campaign-bound, one-shot, and stale-checked against a re-fetched source fingerprint
- [x] Confirmation atomically writes one owner-private GeneratedArtifact and append-only provenance sources; rollback is verified on source-write failure
- [x] Artifact list/archive/restore are owner- and campaign-scoped; v1 has no hard delete or shared/public visibility
- [x] Campaign detail keeps its existing primary path; AI is a secondary inline tool with no new navigation/back/exit control
- [x] UI covers unavailable, loading, validation/error, preview/citations, discard, confirm, stale/expiry, empty history, archive, and restore
- [x] `npm run api:verify:campaign-artifact-assistant`, `npm run frontend:verify:campaign-artifact-assistant`, and `npm run db:verify:campaign-artifact-atomic` pass
- [x] AI scope/retrieval policies, TypeScript, server/frontend builds, and diff checks pass
- [ ] Campaign-shared/public artifacts, background recommendations, cloud usage ledger/budget/billing, embeddings/vector retrieval, and full AuditLog are implemented (future tasks)

---

## 8ao. Campaign AI Creative Seeds v1

- [x] `worldbuilding_outline` and `adventure_seed` pass the shared structured-output task parser and source-ID citation whitelist
- [x] Both creative tasks complete generate → explicit confirm → owner-private GeneratedArtifact persistence with stable artifact kinds
- [x] Creative prompts distinguish invented proposals from source-backed campaign facts and forbid claims of publishing, applying, creating a dungeon, or joining Workshop content
- [x] Task selection and both draft/history presentations visibly label creative output as an optional proposal
- [x] Saving does not mutate Campaign, Runtime, membership, catalog/Workshop, or collaborative state and does not create a ProposedCommand
- [x] Existing preparation/recap generation, stale confirmation rejection, invalid citation rejection, archive/restore, and owner authority regression continue to pass
- [x] `npm run api:verify:campaign-artifact-assistant`, `npm run frontend:verify:campaign-artifact-assistant`, and `npm run db:verify:campaign-artifact-atomic` pass
- [x] AI scope/retrieval policies, TypeScript, server/frontend builds, and diff checks pass
- [ ] Human adoption into structured campaign/world objects, eligible Workshop recommendation, Runtime handoff, and shared/public artifacts are implemented (future tasks)

---

## 8ap. Campaign AI Curated Memory Adoption v1

- [x] Only active owner/campaign-matched `worldbuilding_outline` and `adventure_seed` artifacts can be adopted; factual, archived, cross-owner, and unauthorized requests fail closed
- [x] First adoption atomically creates one `campaign_creative_adoption` AI Memory plus one append-only GeneratedArtifact provenance row
- [x] AI Memory is fixed to `memory_scope=campaign` and `visibility_scope=user_private`; no Campaign/BlockDocument/Runtime/Workshop/public write occurs
- [x] Duplicate adoption is idempotent; withdrawal archives the memory; re-adoption restores the same record; no hard delete exists
- [x] Active adoption blocks source artifact archive until withdrawal, preserving a recoverable provenance chain
- [x] `adopted_memories` passes retrieval preflight and post-fetch context scope guard and only active owner/campaign memories enter later generation
- [x] Withdrawn memory produces an empty bounded source family and cannot enter later model context
- [x] Adopted-memory citations survive generate → confirm → durable artifact projection
- [x] UI defaults the adopted-memory source on but permits request-local opt-out and clearly separates AI direction from campaign fact/publication/Runtime state
- [x] Navigation keyword audit found no page-level Back/Home/exit affordance; new adoption controls remain secondary object actions
- [x] Atomic persistence smoke covers commit and rollback for both GeneratedArtifact and AI Memory source writes
- [x] Existing character/session/campaign AI routes, model routing, AI policies, TypeScript, server/frontend builds, and diff checks pass
- [ ] Promotion to a real structured BlockDocument/Handout, campaign-shared memory, cross-host review, and Runtime reconciliation are implemented (future tasks)

---

## 8. Pre-Commit Checklist Summary

| Step | Command / Action | Pass? |
|------|-----------------|-------|
| Type check | `npx tsc --noEmit` | ☐ |
| Build | `npm run build` | ☐ |
| DND pages load | Manual | ☐ |
| COC pages load | Manual | ☐ |
| CP pages load | Manual | ☐ |
| Data persists on refresh | Manual | ☐ |
| Old character import OK | Manual | ☐ |
| Console clean | DevTools | ☐ |

Do not use `git add .` or `git add -A`.
Stage only files modified by the current task, for example:

```powershell
git add path/to/file1 path/to/file2
git commit -m "..."
```
