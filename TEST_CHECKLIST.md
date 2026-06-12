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
- [ ] Active ruleset workspace shows a "返回游玩菜单 / Back to Play Menu" button; switching rulesets goes back through the menu
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

### D&D

- [ ] DND Workspace — entering DND shows the Dashboard first, not a character sheet
- [ ] DND Workspace — secondary nav switches 工作台总览 / 角色库 / 规则库 / 规则源状态 / 进入游玩
- [ ] DND Dashboard — shows rule scope (DND 2024 / SRD5.2 + XGtE + TCoE), status, and data completion cards
- [ ] DND Dashboard — module cards open Creator / Sheet / Gameplay in the preserved play view
- [ ] DND Source Status — shows core + expansion sources with sourceId and status labels (display-only, no toggle)
- [ ] DND Compendium — shows spell/feat/equipment/class index entry counts without rendering all 507 spells
- [ ] DND Workspace — COC / CP RED entry is unaffected (no DND shell around other systems)
- [ ] DND Creator — opens, fields editable
- [ ] DND index layer — spell/feat/background/equipment indexes compile but are not imported by Creator / Sheet / Gameplay
- [ ] DND index layer — runtime SPELL_DATA still has exactly its pre-index entries; spellbook/spellcasting behavior unchanged
- [ ] DND index layer — DND_2024_SPELL_INDEX_DATA totals 507 (SRD 391 / TCoE 21 / XGtE 95) with unique scope-prefixed ids
- [ ] DND index layer — Artificer / 奇械师 is source-indexed from TCoE in `characterOptionsIndex.ts`
- [ ] DND index layer — Artificer is not added to `CLASS_DATA` / Creator until progression, spellcasting, infusions, and subclasses are verified
- [ ] DND Artificer source completion does not modify `classProgression`, store schema, Creator, Sheet, Gameplay, or rules automation
- [ ] DND Creator — species list shows the 9 owner-source 2024 species (人类/矮人/精灵/半身人/侏儒/龙裔/提夫林/兽人/歌利亚); no subrace step appears
- [ ] DND Creator — selecting a 2024 species sets racebonus to 0 for all abilities and does not overwrite size/speed/languages with placeholders
- [ ] DND Creator — background list shows 侍僧/士兵/智者/罪犯; 半精灵/半兽人/吉斯洋基人 and legacy backgrounds are not offered as defaults
- [ ] DND Creator — legacy 艺人 data (if surfaced anywhere) grants 音乐家 (Musician), not 健壮 (Tough)
- [ ] DND Sheet — legacy characters with old race/background strings still render without crashing (pending-verification note may replace legacy trait text)
- [ ] DND Sheet — opens, displays character data
- [ ] DND Gameplay — opens, runtime resources / checks / actions panels render
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

## 5. Console Check

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

---

## 7. Rule Data Source / Trust Metadata Check

- [ ] Owner-provided local / GitHub / PDF rule sources are treated as the only authoritative rule data sources
- [ ] DND local CHM extracted source at `C:\TRPG_CHM_WORK\extracted` is treated as the primary authoritative DND source
- [ ] DND GitHub DND5eChm / SRD5.2Chm sources are treated only as secondary cross-check sources
- [ ] Official DND references are optional supplements and do not override the local CHM source by default
- [ ] DND local CHM audit baseline records 16 standard DND 2024 backgrounds, not the previous 4-entry sparse baseline
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
