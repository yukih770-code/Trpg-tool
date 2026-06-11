# DND Rule Coverage Matrix

Last updated: 2026-06-11

This document tracks how far DND 2024 rules are represented in the current app. For this matrix, "In Data" means structured DND 2024 rule data under `src/data/dnd2024` / `src/lib/dnd2024`, not legacy descriptive text in class definitions.

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
| Warlock Pact Magic | Yes | 5 | Structured pact progression; initialized into `pactMagicState`; shown and manually adjusted in Gameplay; short and long rest recovery writes RollConsole `RuntimeLogEntry`. | Not connected to spell casting; no upcasting or pact-slot casting path. | Pact Magic casting integration later. |
| Warlock Invocations | No | 2 | Currently represented in structured data as a count-like resource, but Invocations are choices/passive features, not spendable resources. | Needs choice registry / passive feature selection; should not become consume/recover controls long term. | Move toward feature choice registry; avoid Action Registry consumption semantics. |
| Wizard Arcane Recovery | Yes | 5 | Structured `ClassResourceDefinition`; initialized into `classResources`; shown and manually adjusted. | Special spell-slot restoration chooser and once-per-long-rest workflow remain deferred. | Special recovery workflow after standard rest recovery. |

## 3. Spellcasting Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Standard spell slots | 5 | `spellbook.slots` runtime state exists; Sheet/Gameplay show slots; Gameplay can consume a slot when casting. | Slot progression still partly hardcoded in store level-up; no DND 2024 full integration. | Replace hardcoded slot updates with progression utilities. |
| pactMagicState | 5 | Dedicated runtime state; initialized from progression; shown and manually adjusted in Gameplay; short and long rest recovery is logged to RollConsole. | Not used by Gameplay spell casting. | Add Pact Magic spell casting path later. |
| Prepared spells | 5 | `spellbook.prepared`; Gameplay spell manager can prepare/unprepare; `getDndSpellPreparationModel` exposes mode, ability, slots, pact magic, prepared limit, ruleHint, and deferred markers. | Prepared limits using formula-based classes remain v1 approximations; full official list / Wizard spellbook workflow is deferred. | Refine class-specific preparation only after spell data is expanded. |
| Known spells | 5 | `spellbook.known`; Gameplay spell manager can learn/remove for known casters. | Known spell limits and upgrade replacement are not fully enforced. | Add class-specific known spell limits. |
| Spell casting action | 6 | Gameplay "施展" button consumes standard slots for leveled spells and permits cantrips. | No action economy, components, range, target, save/attack resolution, or Pact Magic use. | Future Action Registry; `spellSlot` costs are intentionally not part of v0. |
| Spell slot consumption | 6 | `consumeSpellSlot(level)` reduces standard slot current when available. | Only standard slots; no upcasting decision model or pact slots. | Generalize casting resource selection. |
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
| Action Registry v0 | 5 | Minimal `DndActionDefinition` / `ResourceCost` types exist; `actionRegistry.ts` registers resource-backed actions; Gameplay has an Actions v0 panel; classResource and pactMagic costs can be consumed manually. | No `spellSlot` resource cost support, full action economy, attack/damage, enemy target, concentration, or combat log integration. | Action Registry audit, then targeted attack/damage or spellcasting action work. |
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
- `classResource` consumption through existing runtime resource controls.
- `pactMagic` consumption through existing pact magic controls.

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
| Pact magic recovery | 5 | `pactMagicState` restores on short rest and long rest; recovery result is logged in RollConsole. | Pact-slot spell casting path is still deferred. | Add Pact Magic casting integration later. |
| Special recovery rules | 3 | `recoveryType: special` and notes exist; v1 implements limited short/long rest handling for selected resources such as Fighter Second Wind. | Arcane Recovery spell slot chooser and per-feature special workflows remain deferred. | Handle feature-specific recovery workflows separately. |

Rest recovery semantics:
- In this tool's v1 model, long rest refreshes long-rest resources and also refreshes short-rest resources because a long rest subsumes short-rest recovery.
- This does not implement full HP / Hit Dice spending choices, exhaustion, conditions, or detailed feature-specific recovery flows.

## 6. Equipment / Inventory Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Weapons | 1 | Weapon proficiencies and starting equipment text exist. | No structured weapon items, attack formulas, damage dice, mastery properties. | Structured equipment data. |
| Armor | 1 | Armor proficiencies/training and manual AC modifier exist. | No structured armor items, equipped armor, shield rules, stealth disadvantage. | Structured equipment and equipped slots. |
| Backpack | 1 | `inventory: string[]` stores simple text entries. | No item quantity, container, or item metadata. | Inventory item schema. |
| Consumables | 0 | Not represented as structured consumables. | Quantity, use actions, effects, and deletion/charge tracking missing. | Item action model. |
| Magic items | 0 | Not represented. | Item rules, charges, rarity, attunement, and actions missing. | Magic item registry later. |
| Attunement | 0 | Not represented. | Attunement slots and prerequisites missing. | Add after magic item schema. |
| Weight | 0 | Not represented. | Item weights, carrying capacity, encumbrance missing. | Add after structured inventory. |
| Item actions | 0 | Not represented. | No use/equip/activate action model. | Future Action Registry. |

## 6.1 Exploration / Travel Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Exploration turns / travel pace | 0 | Not represented. | Needs time, movement, party pace, and scene context. | Future Scene/Exploration layer. |
| Stealth / hiding | 1 | Skill checks can be rolled manually. | No opposed passive perception, cover, lighting, or scene state. | Future Actor/Scene + opposed check model. |
| Perception / passive checks | 1 | Character values can be displayed/rolled manually. | No passive check automation or hidden DC flow. | Future Host/Scene layer. |
| Traps / hazards | 0 | Not represented. | Needs hazard data, detection/disarm workflows, damage/effects. | Future Scene/Encounter layer. |

## 7. Current Priority Gap List

### P0: Blocks Existing Functionality

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| No current P0 DND blocker identified | Existing character creation, sheet display, standard spell slot consumption, and manual class resource controls can function. | Continue incremental coverage. |

### P1: Next Phase

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| Full special recovery workflows remain deferred | Basic rest recovery is wired, but Arcane Recovery, detailed Second Wind healing, and other feature-specific choices are not automated. | Implement one special recovery flow at a time. |
| Pact Magic casting is not integrated | Pact slots recover on rest and are manually adjustable, but spell casting still consumes standard spell slots only. | Add Pact Magic casting path later without expanding Action Registry v0. |
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
