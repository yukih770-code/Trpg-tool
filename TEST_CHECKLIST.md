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
- [ ] CP Sheet — inventory and equipment state are visible
- [ ] CP Sheet — equip / unequip weapon does not lose the item
- [ ] CP Sheet — equip / unequip one same-name weapon instance does not remove the other instance
- [ ] CP Sheet — equip / unequip armor does not lose the item
- [ ] CP Sheet — equip / unequip one same-name armor instance preserves the other instance
- [ ] CP Sheet — install / uninstall cyberware preserves the item and does not automate Humanity Loss
- [ ] CP Sheet — install / uninstall one same-name cyberware instance preserves the other instance
- [ ] CP Sheet — cyberware install / uninstall does not change Humanity, EMP, or cyberPsycho automatically
- [ ] CP Gameplay — Critical Injury panel can manually add a body or head injury from the existing 2d6 tables
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
