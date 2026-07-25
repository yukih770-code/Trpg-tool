# DND Rule Coverage Matrix

Last updated: 2026-06-13

This document tracks how far DND 2024 rules are represented in the current app. For this matrix, "In Data" means structured DND 2024 rule data under `src/data/dnd2024` / `src/lib/dnd2024`, not legacy descriptive text in class definitions.

## Data Integrity Warning

Rules Data Integrity Audit v1 found high-risk unverified/source-light datasets in the broader DND rule data surface.

Coverage levels in this document describe implemented mechanics and app wiring, not verified publication-safe rules data. Source/trust metadata foundation is being introduced before further rules feature expansion.

Rule data must declare source and trust metadata before being treated as verified runtime/core data. Unknown-source or suspicious data must not be promoted into new gameplay features. Public/free sources may be embedded only within allowed scope; paid-book or official-but-not-public content may be referenced by metadata but must not copy long rules text. Homebrew/demo/placeholder data must be visibly labeled or quarantined.

DND Rule Metadata Application v1 has started the metadata phase of DND data correction. Legacy DND class, species/race, spell, feat, and background data is retained for app continuity but marked `ai-assisted-unverified` with `needs-human-verification` usage policy. DND equipment remains read-only sample data with source-labeled display-only metadata. `classProgression` remains runtime-active but is marked `needs-human-check` until individual values are verified against owner-provided source paths. Content correction is deferred to later DND data correction tasks.

DND Species / Background Display Cleanup v1 removed 2014 race/subrace string-hardcoded display behavior from Sheet. Sheet now prefers current species/background definitions and metadata, uses quarantined legacy fallback only for old saved values, and labels legacy or unverified content instead of presenting it as verified DND 2024 rules. No species/background data, Creator flow, schema, migration, COC, CP RED, or Platform behavior changed.

DND Class / Subclass Correction v1 started the class/subclass metadata correction phase. Existing class/subclass entries are retained for app continuity but now carry source/trust metadata that separates DND 2024 owner-source entries, XGtE/TCoE source-labeled entries, 2014/2024 conflict entries, and out-of-source quarantine entries such as 破誓者. Subclass progression automation and value/content correction remain deferred. No classProgression values, Creator behavior, Gameplay logic, schema, or migration changed.

DND Feat / Background Link Correction v1 completed the first origin-feat link pass. Background `originFeat` values are checked against `FEATS_DATA`; `魔法学徒 (Magic Initiate)` was added as a minimal source-linked placeholder so the 2024 Acolyte/Sage background links resolve. Existing feat effect text remains unverified unless later corrected from owner sources. Feat effect automation, Magic Initiate spell selection, prerequisite redesign, Action Registry integration, schema, and migration changes remain deferred.

DND Origin Feat Local CHM Completion v1 completed the identity-level baseline for the 10 DND 2024 origin feats in `玩家手册2024/专长/起源专长.htm`. `巧匠 (Crafter)` and `医疗师 (Healer)` are now present in `FEATS_DATA`, and the 工匠 / 隐士 background links use their matching stable display names. Detailed choice flows and executable feat effects remain deferred; no character schema, migration, Runtime, or automation changed.

DND Equipment Local CHM Completion v1 completed the structured identity/catalog pass for the 38 weapon rows in `玩家手册2024/装备/武器.htm` and 13 armor/shield rows in `玩家手册2024/装备/护甲.htm`. The catalog now carries local-source references, aliases needed by existing starter equipment, and display-only weapon mastery labels. DND Tool Local CHM Completion v1 adds 17 artisan tools and 8 other-tool categories from `工匠工具.htm` and `其他工具.htm`, including the starter-equipment names used by current backgrounds/classes. Adventuring gear, packs, and all executable equipment mechanics remain deferred; no inventory behavior, AC calculation, attacks, ammunition, tool checks, crafting, or Runtime behavior changed.

DND Spell Manifest Correction v1 completed the first spell identity/source pass. The current 20 runtime spell entries are retained for compatibility and now carry source/trust metadata; the owner manifest's 507 spell entries are recorded as a deferred full-index gap rather than imported into Gameplay. Known translation anomalies (`Revivify`, `True Strike`, `Hold Person`) are marked `needs-human-check` because the owner manifest confirms identity/level but leaves Chinese names, schools, class lists, and effect text for later checked extraction. No spell effects automation, concentration, damage, target, schema, migration, or gameplay behavior changed.

DND Artificer Source Completion v1 completed the class-gap source indexing pass. `奇械师 / Artificer` is source-indexed from TCoE with related spell-list, infusion, and subclass source paths, but remains runtime-deferred. It is not added to `CLASS_DATA` or Creator because progression, spellcasting, infusions, and subclass automation still require source-level verification.

DND Background Runtime Completion v1 completed the local-CHM runtime baseline pass. `BACKGROUND_DATA` now follows the local CHM primary source baseline with all 16 standard DND 2024 backgrounds. Detailed background mechanics, skill mappings, origin feats, equipment, and ability options remain `needs-human-check`; no schema, migration, Creator, Sheet, Gameplay, COC, CP RED, or Platform behavior changed.

DND Character Builder Responsive Workbench Phase 1 completed as a UI/layout pass only. The original Creator selection and completion logic is preserved but presented through a responsive workbench with section navigation, an editor area, and a live summary/todo panel. Spell and equipment builder sections are placeholders/boundary notes only; no rule data, schema, migration, spell automation, equipment system, Sheet logic, or Gameplay logic changed.

Multi-System Workspace Shell Planned Slots v1 added DND workspace module slots for Backpack / Items, Map / Tactical Board, and Quests / Notes / Logs. These are entry-only placeholders with a data-contract warning; no item instance model, inventory store, map/token model, quest log persistence, schema, migration, or runtime automation was added.

DND Character Vault & Creation Method Entry v1 completed as an information-architecture pass. The DND Character Vault is a current-character shell only; it does not implement a real multi-character store, archive, duplicate, campaign assignment, or import/export rewrite. Character creation now enters through a creation method selection screen, where Standard Creation opens the existing Builder and Quick Creation / Local Import / Workshop Import remain planned placeholders. Sheet exposes a visible Start Playing action into the preserved Gameplay view; no Sheet calculations, Gameplay runtime, dice algorithm, rule data, schema, or migration changed.

<!-- AI-LANDMARK: DND_LOCAL_CHM_FULL_COVERAGE_AUDIT -->
## DND Local CHM Full Coverage Audit v1

Source policy update:

- `dnd-local-chm-primary` at `C:\TRPG_CHM_WORK\extracted` is now the primary authoritative DND source.
- GitHub DND5eChm / SRD5.2Chm sources remain secondary cross-check sources.
- Official references are optional supplements only and do not override the local CHM source.
- Current app data is an audit target and must be checked against local CHM before being treated as complete.

Local CHM audit summary:

| Area | Current Runtime Count | Current Source Index Count | Local CHM Source Count | Status | Primary Gap / Next Task |
|---|---:|---:|---:|---|---|
| Species | 9 | 9 | 10 | incomplete | Add/check `阿斯莫 / Aasimar`; task: `DND CHM Species Runtime Source Correction v1` |
| Backgrounds | 16 | 5 legacy sparse index rows (runtime now local-CHM complete) | 16 standard backgrounds | runtime-ready / needs-human-check | Verify detailed mechanics, skill mappings, origin feats, equipment, and ability options |
| Origin Feats | 10 source-linked identity entries | individual headings in local CHM | 10 PHB origin feats | identity-complete / mechanics deferred | Add dedicated choice and effect contracts before automation |
| General / Fighting / Epic Feats | 9 general runtime-like entries | category file only | 43 general + 10 fighting style + 12 epic boon PHB headings | incomplete | Build CHM feat manifest; TCoE/XGtE extension feats require de-dup/scope review |
| Classes | 12 | Artificer source-indexed only | 13 (12 PHB + TCoE Artificer) | source-indexed / runtime-deferred | Promote Artificer only after progression/spellcasting/infusions are verified |
| Subclasses | 46 | partial metadata/index only | 48 PHB core subclass pages + XGtE/TCoE subclass-related pages | incomplete / needs-human-check | Dedicated subclass de-dup/source classification audit; raw extension pages include non-subclass support pages |
| Spells | 20 | 507 | 507 (`391` PHB + `21` TCoE + `95` XGtE headings) | source-indexed / runtime-deferred | Extract checked Chinese names/schools/classes/effect fields without copying long prose |
| Equipment | 79 structured core rows (38 weapons + 13 armor/shields + 25 tools + 3 legacy gear samples) | 13 category rows | 13 PHB equipment files with many table rows | weapons/armor/tools complete; other categories incomplete | Extract adventuring gear, packs, mounts, services, and magic-item rows separately |
| Tools | 25 source-matched tool rows | category rows | PHB tool files (`工匠工具`, `其他工具`) | data-complete / runtime-deferred | Tool checks, crafting, variants, gaming-set details, and specific instrument rows need separate contracts |
| Weapons | 38 source-matched rows | category row | `武器.htm` table (38 weapon data rows) | data-complete / runtime-deferred | Preserve display/catalog only; do not wire attacks, mastery, or ammunition yet |
| Armor | 13 source-matched armor/shield rows | category row | `护甲.htm` table (13 armor/shield data rows) | data-complete / runtime-deferred | Preserve display/catalog only; do not wire AC automation yet |
| Magic Items | 0 | category row only | DMG 2024 treasure / magic item categories present | source-located / runtime-deferred | Separate DMG magic item manifest; not current runtime |
| Class Progression | 4 complete-ish samples + placeholders | source paths only | PHB class pages + TCoE Artificer page present | incomplete / needs-human-check | Value-level progression extraction and verification |
| Class Resources | partial runtime resources | source paths only | PHB/TCoE class feature/support pages present | incomplete / needs-human-check | Resource extraction one class at a time |
| Spell Lists | partial runtime lists | source paths/index | PHB class spell-list pages + Artificer spell-list page present | incomplete / needs-human-check | Extract class spell list membership from CHM |

Backgrounds correction from local CHM:

- Local CHM confirms 16 DND 2024 standard backgrounds under `玩家手册2024/角色起源/背景`.
- The previous sparse GitHub-derived 4-background baseline is superseded for completeness decisions.
- Standard backgrounds: 侍僧 / Acolyte, 工匠 / Artisan, 骗子 / Charlatan, 罪犯 / Criminal, 艺人 / Entertainer, 农民 / Farmer, 警卫 / Guard, 向导 / Guide, 隐士 / Hermit, 商人 / Merchant, 贵族 / Noble, 智者 / Sage, 水手 / Sailor, 抄写员 / Scribe, 士兵 / Soldier, 流浪者 / Wayfarer.
- `珊娜萨的万事指南/角色选项/构建角色生平.html` remains an XGtE life-event tool, not a standard background.
- `背景详述.htm`, `起源的构成部分.htm`, `第二步：确定起源.htm`, and `第四章：角色起源.htm` are overview/build-rule/workflow pages, not individual standard background entries.

Runtime safety baseline:

- Creator Safety: unchanged; do not add CHM-backed entries to Creator until they carry source/trust metadata and field-level verification.
- Sheet Safety: unchanged; Sheet should continue to label unverified/legacy content rather than presenting it as verified.
- Gameplay Safety: unchanged; no spell effects, feat effects, equipment automation, class progression, or subclass automation is implied by this audit.
- Runtime Automation: deferred for all newly found CHM coverage gaps.

## 1. Coverage Levels

| Level | Name | Meaning |
|---:|---|---|
| 0 | Not Extracted | Rule is not represented in the app except as future intent. |
| 1 | Extracted | Rule exists as notes, labels, or legacy display text, but not as structured 2024 data. |
| 2 | In Data | Rule is represented in structured rule data or utilities. |
| 3 | In Runtime State | Character state has a dedicated container for the rule. |
| 4 | Shown in UI | Runtime/data state is visible to the user. |
| 5 | Manual Control | User can manually adjust the state without automated rule enforcement. |
| 6 | Automated Rule Execution | App applies the rule automatically in the appropriate workflow. |

## 2. Class Resource Coverage

| Feature | shouldBeClassResource | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---:|---|---|---|
| Barbarian Rage | Yes | 5 | Structured `ClassResourceDefinition`; initialized into `classResources`; shown and manually adjusted in Gameplay; long rest recovery writes RollConsole `RuntimeLogEntry`. | No duration, damage bonus, resistance, or full Rage condition workflow. | Future Rage action/state workflow after combat boundaries are defined. |
| Bard Bardic Inspiration | Yes | 5 | Structured resource with dice progression and Cha minimum max formula; initialized into `classResources`; shown and manually adjusted; rest recovery follows normal long rest then Font of Inspiration short/long rest data when unlocked. | No target state, reaction usage, or die application workflow. | Future target/effect model. |
| Cleric Channel Divinity | Yes | 1 | Exists only as legacy descriptive class feature text. | No structured 2024 progression resource, actions, or recovery. | Add Cleric progression resource data. |
| Druid Wild Shape | Yes | 1 | Exists only as legacy descriptive class feature text. | No structured charges, forms, stat replacement, temp HP, or recovery. | Add Druid progression resource data; later forms registry. |
| Fighter Second Wind | Yes | 5 | Structured resource exists, initializes into runtime state, supports manual controls, special short rest +1 recovery, long rest full recovery, and rest logs. | No healing roll workflow. | Future narrow Second Wind action. |
| Fighter Action Surge | Yes | 5 | Structured `shortOrLongRest` resource exists, initializes into runtime state, supports manual controls and rest recovery logs. | No action economy enforcement. | Future action economy layer. |
| Fighter Indomitable | Yes | 0 | Not represented as structured data or runtime state. | Resource count and reroll automation missing. | Add Fighter progression data. |
| Monk Focus Points | Yes | 5 | Structured Focus Point pool exists, max = Monk level, initializes into runtime state, supports manual controls and short/long rest recovery logs. | No discipline action catalog or per-technique costs beyond Action Registry v0 examples. | Future Monk action registry expansion. |
| Paladin Lay on Hands | Yes | 5 | Structured healing pool exists, max = 5 × Paladin level, initializes into runtime state, supports manual controls and long rest recovery logs. | No healing/poison/disease option workflow. | Future Lay on Hands action panel. |
| Paladin Channel Divinity | Yes | 0 | Not represented as structured data. | Resource count, oath options, and recovery missing. | Add Paladin progression and oath data. |
| Ranger Favored Enemy Charges | Yes | 1 | Legacy Ranger text mentions favored enemy concept, but no structured charges. | No 2024 structured charge pool or Hunter's Mark linkage. | Add Ranger progression data. |
| Rogue Cunning Strike | No | 0 | Not represented. | This is an attack rider / action option, not a generic spendable `classResources` pool. | Future Action Registry / attack rider model. |
| Sorcerer Sorcery Points | Yes | 5 | Structured point pool exists, max = Sorcerer level, initializes into runtime state, supports manual controls and long rest recovery logs. | No Metamagic options or spell slot conversion workflow. | Future Metamagic / conversion layer. |
| Sorcerer Innate Sorcery | Yes | 5 | Structured long-rest resource exists, initializes into runtime state, supports manual controls and rest recovery logs. | No duration, spell save DC benefit, or attack bonus automation. | Future Sorcerer action workflow. |
| Warlock Pact Magic | Yes | 5 | Structured pact progression; initialized into `pactMagicState`; shown and manually adjusted in Gameplay; short and long rest recovery writes RollConsole `RuntimeLogEntry`; DND Spellcasting Path Unification v1 can spend pact slots through the same spellcasting resource path. | No upcasting choice UI, target/effect handling, or full pact-slot spell action model. | Pact spell action expansion later. |
| Warlock Invocations | No | 2 | Currently represented in structured data as a count-like resource, but Invocations are choices/passive features, not spendable resources. | Needs choice registry / passive feature selection; should not become consume/recover controls long term. | Move toward feature choice registry; avoid Action Registry consumption semantics. |
| Wizard Arcane Recovery | Yes | 5 | Structured `ClassResourceDefinition`; initialized into `classResources`; shown and manually adjusted. | Special spell-slot restoration chooser and once-per-long-rest workflow remain deferred. | Special recovery workflow after standard rest recovery. |

## 3. Spellcasting Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Standard spell slots | 5 | `spellbook.slots` runtime state exists; Sheet/Gameplay show slots; Gameplay consumes slots through `consumeSpellcastingResource`. | Slot progression still partly hardcoded in store level-up; no DND 2024 full integration. | Replace hardcoded slot updates with progression utilities. |
| pactMagicState | 5 | Dedicated runtime state; initialized from progression; shown and manually adjusted in Gameplay; short/long rest recovery and spellcasting consumption are logged to RollConsole. | No upcasting choice UI or full pact spell action model. | Add richer Pact Magic casting choices later. |
| Prepared spells | 5 | `spellbook.prepared`; Gameplay spell manager can prepare/unprepare; `getDndSpellPreparationModel` exposes mode, ability, slots, pact magic, prepared limit, ruleHint, and deferred markers. | Prepared limits using formula-based classes remain v1 approximations; full official list / Wizard spellbook workflow is deferred. | Refine class-specific preparation only after spell data is expanded. |
| Known spells | 5 | `spellbook.known`; Gameplay spell manager can learn/remove for known casters. | Known spell limits and upgrade replacement are not fully enforced. | Add class-specific known spell limits. |
| Spell casting action | 5 | Gameplay "施展" button routes through `consumeSpellcastingResource`, supports cantrips, standard slots, and Pact Magic slots, and writes structured RuntimeLogEntry records. | No action economy, components, range, target, save/attack resolution, concentration, or spell effect automation. | Future Action Registry / spell action layer after target/effect dependencies. |
| Spell slot consumption | 5 | `consumeSpellcastingResource` is the unified spellcasting resource path; legacy `consumeSpellSlot` is a compatibility wrapper. | No upcasting decision UI, target, concentration, or damage automation. | Keep resource path stable before spell actions expand. |
| Concentration | 0 | Not represented. | No concentration state, break checks, or replacement warnings. | Add `concentrationState`. |
| Exhaustion | 0 | Not represented. | No exhaustion state, penalties, or recovery workflow. | Future condition/effect layer. |
| Bonus action spell restriction | 0 | Not represented. | No action economy tracking or spell cast timing. | Future Action Registry / turn state. |
| Ritual casting | 2 | Ritual metadata exists on spells; progression notes describe ritual behavior. | No ritual casting UI/action path or class-specific validation. | Add ritual action support later. |

## 4. Combat / Action Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Attack roll | 1 | Gameplay has generic attack button/toast and free dice roller. | No weapon attack model, proficiency, ability, AC target, advantage, or hit resolution. | Equipment and attack/damage panel. |
| Damage roll | 1 | Free dice roller can roll damage dice manually. | No damage formulas, resistances, vulnerabilities, or target HP application. | Damage model after equipment. |
| Saving throw | 4 | Sheet shows saving throw modifiers and rolls checks manually. | No DC targeting or spell/condition-driven saves. | Action Registry with save definitions. |
| Conditions | 2 | Structured progression type supports `ConditionDefinition`; sample Barbarian/Bard conditions exist. | No runtime condition state or UI tracker. | Add condition state later. |
| Action Registry v0 | 5 | Minimal `DndActionDefinition` / `ResourceCost` types exist; `actionRegistry.ts` registers resource-backed actions; Gameplay has an Actions v0 panel; classResource costs consume through `consumeClassResource`; Pact Magic costs consume through `consumeSpellcastingResource`. | No `spellSlot` resource cost support, full action economy, attack/damage, enemy target, concentration, or combat log integration. | Action Registry audit, then targeted attack/damage or spellcasting action work. |
| Action / Bonus Action / Reaction | 4 | Action definitions can carry `actionType`; Gameplay displays Action v0 entries that match existing runtime resources. | No per-turn action economy, no reaction timing, no enforcement of action limits. | Future action economy state after registry stabilizes. |
| Reactions / opportunity attacks | 0 | Not represented. | Needs turn state, trigger model, movement/position, and target layer. | Future action economy + encounter layer. |
| Divine Smite | 0 | Not represented. | This is not a class resource; it is a spell/action damage rider using spell slots. | Future attack rider / spell action integration. |
| Cunning Strike | 0 | Not represented. | Not a class resource; it is an attack rider choice tied to Sneak Attack. | Future Action Registry / attack rider model. |
| Hunter's Mark | 1 | Spell data likely covers spell text; no Ranger feature automation. | Not modeled as Favored Enemy charges or concentration target state. | Ranger progression plus concentration state. |
| Metamagic | 0 | Not represented. | Metamagic options and Sorcery Point costs missing; not a direct class resource by itself. | Sorcery Points first, then Metamagic option registry. |
| Action Surge | 5 | Structured short/long rest resource exists and is manually controlled/logged through Gameplay resources. | No action economy enforcement or extra-action execution workflow. | Future action economy layer. |
| Wild Shape | 1 | Legacy Druid text only. | No charges, forms, transformed stats, or duration. | Druid progression, then forms registry. |
| Summoned creatures | 0 | Not represented. | Needs Actor/Target model, creature stat blocks, ownership, initiative, and duration. | Future Actor/Encounter layer. |

## 4.1 Active Forms / Transformation Coverage

Active forms are planned hard-core platform capabilities, but they depend on Actor + Condition + active overlay infrastructure. They should not be implemented as one-off UI swaps before that substrate exists.

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Wild Shape | 1 | Legacy Druid text exists; no active form runtime. | Beast form registry, active overlay, duration, resource recovery, temp HP/stat replacement. | Future Active Form layer after Actor/Condition substrate. |
| Polymorph | 0 | Not represented. | Target transformation, concentration, stat replacement, form duration. | Future Active Form + spell effect model. |
| Shapechange | 0 | Not represented. | High-level form choice, retained features, condition/effect interactions. | Future Active Form model. |
| True Polymorph | 0 | Not represented. | Permanent/temporary transformation, target state, concentration, ownership. | Future Active Form + Actor layer. |
| Alter Self | 0 | Not represented. | Non-combat transformation utility, active effect duration. | Future condition/effect layer. |
| Disguise Self | 0 | Not represented. | Appearance overlay only; no actor stat replacement. | Future non-combat overlay/effect model. |
| Enlarge / Reduce | 0 | Not represented. | Size overlay, damage modifiers, concentration. | Future active overlay + condition/effect model. |
| Gaseous Form | 0 | Not represented. | Movement/condition overlay, concentration, action restrictions. | Future active overlay + condition/effect model. |
| Non-combat transformation utility | 0 | Not represented. | Needs active overlay that can affect narration, appearance, movement, and scene interaction. | Future Scene/Actor layer. |

Action Registry v0 implemented:
- Minimal `DndActionDefinition` and `ResourceCost` types.
- `actionRegistry.ts` with v0 resource-backed action definitions.
- Gameplay Actions v0 panel.
- `classResource` consumption through centralized `consumeClassResource`.
- `pactMagic` consumption through `consumeSpellcastingResource`, preserving Pact Magic no-fallback semantics.

Action Registry v0 explicitly not implemented:
- `spellSlot` resource costs or spell slot consumption.
- Divine Smite, Cunning Strike, Metamagic, or Hunter's Mark automation.
- Attack rolls, damage rolls, enemy targets, concentration, full action economy, or combat log integration.

## 5. Rest / Recovery Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Short rest HP / hit dice | 1 | `restShort` exists as a stub and does not spend hit dice. | Hit dice spending, healing roll, and UI choices missing. | Implement short rest hit dice flow. |
| Long rest HP / hit dice | 6 | `restLong` restores HP and some hit dice. | DND 2024 edge cases and exhaustion/conditions not modeled. | Keep simple unless broader rest system is added. |
| Spell slot recovery | 6 | `restLong` restores standard spell slots. | Does not yet use progression data for every slot update; Pact Magic is tracked separately. | Align store slot refresh with progression utilities later. |
| Class resource recovery | 5 | `restShort` / `restLong` recover runtime class resources according to `recoveryType` plus selected special v1 recoveries, and Gameplay writes recovery results to RollConsole `RuntimeLogEntry`. | HP / Hit Dice detailed rest automation, exhaustion, conditions, and full special feature workflows are deferred. | Keep v1 narrow unless broader rest system is scheduled. |
| Pact magic recovery | 5 | `pactMagicState` restores on short rest and long rest; recovery result is logged in RollConsole, and spellcasting can consume pact slots through the unified resource path. | Full pact spell action effects and upcasting choice UI remain deferred. | Add richer Pact Magic casting integration later. |
| Special recovery rules | 3 | `recoveryType: special` and notes exist; v1 implements limited short/long rest handling for selected resources such as Fighter Second Wind. | Arcane Recovery spell slot chooser and per-feature special workflows remain deferred. | Handle feature-specific recovery workflows separately. |

Rest recovery semantics:
- In this tool's v1 model, long rest refreshes long-rest resources and also refreshes short-rest resources because a long rest subsumes short-rest recovery.
- This does not implement full HP / Hit Dice spending choices, exhaustion, conditions, or detailed feature-specific recovery flows.

## 6. Equipment / Inventory Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Weapons | 2 | Structured Equipment Data Layer v1: typed weapon items with damage dice, damage type, properties, and range exist in `src/data/dnd2024/equipment.ts` and display read-only on Sheet. | No attack formulas, proficiency wiring, mastery properties runtime, inventory, or equip state. | Equipped slots and weapon actions after inventory schema is scheduled. |
| Armor | 2 | Structured Equipment Data Layer v1: typed armor/shield items with base AC, dex modifier mode, strength requirement, and stealth disadvantage flags display read-only on Sheet. | No equipped armor state, AC recalculation, or shield rules runtime. | Equipped slots and AC integration in a later store-focused round. |
| Backpack | 1 | `inventory: string[]` stores simple text entries. | No item quantity, container, or item metadata. | Inventory item schema. |
| Consumables | 0 | Not represented as structured consumables. | Quantity, use actions, effects, and deletion/charge tracking missing. | Item action model. |
| Magic items | 0 | Not represented. | Item rules, charges, rarity, attunement, and actions missing. | Magic item registry later. |
| Attunement | 0 | Not represented. | Attunement slots and prerequisites missing. | Add after magic item schema. |
| Weight | 0 | Not represented. | Item weights, carrying capacity, encumbrance missing. | Add after structured inventory. |
| Item actions | 0 | Not represented. | No use/equip/activate action model. | Future Action Registry. |

Structured Equipment Data Layer v1 note:
- DND structured equipment data layer v1 added. Includes minimal typed weapon / armor / gear data and read-only display.
- Inventory, equip/unequip, AC automation, attack rolls, damage rolls, weapon mastery, ammo, and Action Registry integration remain deferred.
- No CharacterData schema or migration changed.

Resource Consumption Unification v1 note:
- DND class resource consumption now uses `consumeClassResource` rather than component-level naked subtraction.
- Spell slot and Pact Magic consumption continue to route through `consumeSpellcastingResource`.
- Action Registry v1, target/effect handling, attack/damage automation, and schema/migration changes remain deferred.

## 6.1 Exploration / Travel Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Exploration turns / travel pace | 0 | Not represented. | Needs time, movement, party pace, and scene context. | Future Scene/Exploration layer. |
| Stealth / hiding | 1 | Skill checks can be rolled manually. | No opposed passive perception, cover, lighting, or scene state. | Future Actor/Scene + opposed check model. |
| Perception / passive checks | 1 | Character values can be displayed/rolled manually. | No passive check automation or hidden DC flow. | Future Host/Scene layer. |
| Traps / hazards | 0 | Not represented. | Needs hazard data, detection/disarm workflows, damage/effects. | Future Scene/Encounter layer. |

## 6.2 Species / Background Coverage (Correction v1)

DND Background / Species Correction v1 status:
- Default Creator species list currently follows the earlier sparse owner source manifest: 人类 / 矮人 / 精灵 / 半身人 / 侏儒 / 龙裔 / 提夫林 / 兽人 / 歌利亚. Local CHM audit now shows `阿斯莫` also exists under `玩家手册2024/角色起源/种族`, so the runtime list is incomplete. Species traits / size / speed / languages remain `needs-human-check`; Creator skips empty placeholder values.
- Default Creator background list now follows the local CHM baseline with 16 standard backgrounds under `玩家手册2024/角色起源/背景`. Detailed skill / origin-feat / equipment / ability-option mappings remain pending human verification; newly completed entries use short placeholder feature text rather than copied rules prose.
- Legacy 2014 race/subrace/racial-ASI data and legacy 2014-style backgrounds are retained as `LEGACY_RACE_DATA` / `LEGACY_BACKGROUND_DATA` with quarantine metadata; 半精灵 / 半兽人 are marked `out-of-source` (not 2024 species), 吉斯洋基人 is marked `out-of-source` for the declared scope.
- TCoE 定制血统 (Custom Lineage) exists in the owner source but is an optional rule, recorded as `needs-human-check` and not added to the default species list.
- The legacy Musician / Tough (音乐家 / 健壮) mix-up in the 艺人 background was corrected to 音乐家 (Musician).
- Known display consequence: legacy characters whose race name overlaps a 2024 species (e.g. 矮人) now show the pending-verification species note on Sheet instead of legacy 2014 trait text; legacy subrace feature display is hidden. Stored character values (racebonus, size, speed) are unchanged.
- No store schema or migration changed.

## 6.3 Character Options Source Index (Completion v1)

DND Character Options Source Completion v1 status:
- Display-only source indexes now exist, separated from runtime data: spells 507/507 indexed (`src/data/dnd2024/spellIndex.ts`: SRD 391 / TCoE 21 / XGtE 95; name/level/scope only), backgrounds 5 legacy sparse index entries, feat sources 7 (category-file level), equipment categories 13 (`src/data/dnd2024/characterOptionsIndex.ts`). Runtime `BACKGROUND_DATA` has been completed to the 16 local-CHM standard backgrounds; the separate display-only background index can be rebuilt later.
- Runtime gaps recorded in `DND_CHARACTER_OPTIONS_COMPLETION_REPORT`: classes runtime 12/13 (奇械师 TCoE source-indexed / runtime-deferred), subclasses 46/73, runtime spells 20/507, feat rows and equipment rows pending later extraction passes.
- Indexes carry `source-labeled` / `display-only` metadata and must not be promoted into Creator / spellbook / Gameplay runtime until individually verified.
- No spell effects, feat effects, equipment rules, or subclass features were implemented or copied.

## 6.4 DND Product Shell (Phase 1)

- DND now enters through a workspace dashboard (`DndWorkspaceShell`): rule scope, source status, completion cards, and module entries are visible before character workflows.
- The shell is display-only UI layering: no rules data, runtime logic, source filtering, or schema changed; Creator / Sheet / Gameplay render unchanged inside the "play" view.
- DND Builder Workbench Phase 1 modernizes the Creator presentation inside the preserved play view: identity / sources / species / background / class / abilities / feats / spells / equipment / review sections can be switched non-linearly, with responsive mobile-safe layout and a live summary panel. Existing creation logic remains unchanged.
- Platform Character Entry Pattern Alignment v1 keeps DND as the reference pattern: Character Vault / creation method selection / Sheet context action / Gameplay entry remain preserved without DND rule data, schema, store, Sheet, or Gameplay runtime changes.

## 7. Current Priority Gap List

### P0: Blocks Existing Functionality

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| No current P0 DND blocker identified | Existing character creation, sheet display, standard spell slot consumption, and manual class resource controls can function. | Continue incremental coverage. |

### P1: Next Phase

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| Full special recovery workflows remain deferred | Basic rest recovery is wired, but Arcane Recovery, detailed Second Wind healing, and other feature-specific choices are not automated. | Implement one special recovery flow at a time. |
| Rich Pact Magic casting choices remain deferred | Pact slots can now be consumed through the unified spellcasting resource path, but no upcasting selector, target, concentration, or spell effect workflow exists. | Add richer Pact Magic spell action UI only after spell action boundaries are scheduled. |
| Subclass resources and choices remain incomplete | Base class runtime resources cover the v1 target, but subclass resource pools and feature choices are not broadly modeled. | Add subclass resource definitions only when the subclass layer is scheduled. |
| Spell slot progression still partly hardcoded | Level-up slot changes can diverge from DND 2024 progression data. | Use `getSpellSlotsAtLevel()` in a controlled data-layer/store pass. |

### P2: Later Automation

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| Action Registry v0 needs audit and next-layer design | v0 now describes resource-backed actions and consumes classResource / pactMagic, but it intentionally excludes spellSlot costs, full action economy, attacks, damage, targets, concentration, and combat logging. | Audit v0 registry entries, then design the next narrow layer. |
| Concentration absent | Many spells and features need single-active concentration tracking. | Add concentration runtime state. |
| Divine Smite / Cunning Strike / Metamagic not modeled | These are action/spell/attack option systems, not generic class resources. | Add as future Action Registry or option registry work, not as `classResources`. |
| Invocations modeled as count-like resource | Invocations are choices/passives, not spendable uses. | Move to feature choice registry later. |

### P3: Not Now

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| Full equipment automation | Requires item schema, equipped slots, weapon attacks, armor, weight, and item actions. | Defer until DND runtime/action foundations are stable. |
| Full combat automation | Requires target model, action economy, conditions, damage application, and encounter state. | Defer until Action Registry is designed. |
| Magic items and attunement | Large standalone subsystem. | Defer until structured inventory exists. |
