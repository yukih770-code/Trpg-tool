# DND Rule Coverage Matrix

Last updated: 2026-05-30

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
| Barbarian Rage | Yes | 5 | Structured `ClassResourceDefinition`; initialized into `classResources`; shown and manually adjusted in Sheet. | No automatic use rules, duration, damage bonus, resistance, or rest recovery. | Rest recovery v1, then Action Registry entry for activating Rage. |
| Bard Bardic Inspiration | Yes | 5 | Structured resource with dice progression; initialized into `classResources`; shown and manually adjusted. | Max currently resolves from generic expression support; no Cha minimum rule, target state, reaction usage, or Font of Inspiration recovery automation. | Improve max formula support, then rest recovery and target/effect model. |
| Cleric Channel Divinity | Yes | 1 | Exists only as legacy descriptive class feature text. | No structured 2024 progression resource, actions, or recovery. | Add Cleric progression resource data. |
| Druid Wild Shape | Yes | 1 | Exists only as legacy descriptive class feature text. | No structured charges, forms, stat replacement, temp HP, or recovery. | Add Druid progression resource data; later forms registry. |
| Fighter Second Wind | Yes | 1 | Exists only as legacy descriptive class feature text. | No structured resource, healing roll, scaling, or recovery. | Add Fighter progression resource data and manual state. |
| Fighter Action Surge | Yes | 1 | Exists only as legacy descriptive class feature text. | No structured resource or action economy integration. | Add Fighter progression data; later Action Registry. |
| Fighter Indomitable | Yes | 0 | Not represented as structured data or runtime state. | Resource count and reroll automation missing. | Add Fighter progression data. |
| Monk Focus Points | Yes | 1 | Exists only as legacy descriptive class feature text. | No structured Focus Point pool, discipline actions, or recovery. | Add Monk progression resource data. |
| Paladin Lay on Hands | Yes | 1 | Exists only as legacy descriptive class feature text. | No structured healing pool, disease/poison options, or manual controls. | Add Paladin progression resource data. |
| Paladin Channel Divinity | Yes | 0 | Not represented as structured data. | Resource count, oath options, and recovery missing. | Add Paladin progression and oath data. |
| Ranger Favored Enemy Charges | Yes | 1 | Legacy Ranger text mentions favored enemy concept, but no structured charges. | No 2024 structured charge pool or Hunter's Mark linkage. | Add Ranger progression data. |
| Rogue Cunning Strike | No | 0 | Not represented. | This is an attack rider / action option, not a generic spendable `classResources` pool. | Future Action Registry / attack rider model. |
| Sorcerer Sorcery Points | Yes | 0 | Not represented as structured data. | Point pool, conversion, Metamagic options, and recovery missing. | Add Sorcerer progression resource data. |
| Sorcerer Innate Sorcery | Yes | 0 | Not represented as structured data. | Uses, duration, spell save DC benefit, and recovery missing. | Add Sorcerer progression data. |
| Warlock Pact Magic | Yes | 5 | Structured pact progression; initialized into `pactMagicState`; shown and manually adjusted in Sheet. | Not connected to spell casting; no automatic short rest recovery. | Pact Magic casting integration or rest recovery v1. |
| Warlock Invocations | No | 2 | Currently represented in structured data as a count-like resource, but Invocations are choices/passive features, not spendable resources. | Needs choice registry / passive feature selection; should not become consume/recover controls long term. | Move toward feature choice registry; avoid Action Registry consumption semantics. |
| Wizard Arcane Recovery | Yes | 5 | Structured `ClassResourceDefinition`; initialized into `classResources`; shown and manually adjusted. | No special recovery rule, spell slot restoration chooser, or once-per-long-rest automation. | Special recovery workflow after standard rest recovery. |

## 3. Spellcasting Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Standard spell slots | 5 | `spellbook.slots` runtime state exists; Sheet/Gameplay show slots; Gameplay can consume a slot when casting. | Slot progression still partly hardcoded in store level-up; no DND 2024 full integration. | Replace hardcoded slot updates with progression utilities. |
| pactMagicState | 5 | Dedicated runtime state; initialized from progression; shown and manually adjusted in Sheet. | Not used by Gameplay spell casting; no short rest recovery. | Add Pact Magic spell casting path or rest recovery. |
| Prepared spells | 5 | `spellbook.prepared`; Gameplay spell manager can prepare/unprepare. | Prepared limits are simplified and not fully 2024 accurate for every class. | Wire preparation modes and formulas from progression data. |
| Known spells | 5 | `spellbook.known`; Gameplay spell manager can learn/remove for known casters. | Known spell limits and upgrade replacement are not fully enforced. | Add class-specific known spell limits. |
| Spell casting action | 6 | Gameplay "施展" button consumes standard slots for leveled spells and permits cantrips. | No action economy, components, range, target, save/attack resolution, or Pact Magic use. | Future Action Registry. |
| Spell slot consumption | 6 | `consumeSpellSlot(level)` reduces standard slot current when available. | Only standard slots; no upcasting decision model or pact slots. | Generalize casting resource selection. |
| Concentration | 0 | Not represented. | No concentration state, break checks, or replacement warnings. | Add `concentrationState`. |
| Bonus action spell restriction | 0 | Not represented. | No action economy tracking or spell cast timing. | Future Action Registry / turn state. |
| Ritual casting | 2 | Ritual metadata exists on spells; progression notes describe ritual behavior. | No ritual casting UI/action path or class-specific validation. | Add ritual action support later. |

## 4. Combat / Action Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Attack roll | 1 | Gameplay has generic attack button/toast and free dice roller. | No weapon attack model, proficiency, ability, AC target, advantage, or hit resolution. | Equipment and Action Registry. |
| Damage roll | 1 | Free dice roller can roll damage dice manually. | No damage formulas, resistances, vulnerabilities, or target HP application. | Damage model after equipment. |
| Saving throw | 4 | Sheet shows saving throw modifiers and rolls checks manually. | No DC targeting or spell/condition-driven saves. | Action Registry with save definitions. |
| Conditions | 2 | Structured progression type supports `ConditionDefinition`; sample Barbarian/Bard conditions exist. | No runtime condition state or UI tracker. | Add condition state later. |
| Action / Bonus Action / Reaction | 2 | Structured action definitions exist in progression data for sample classes. | No runtime action economy, no UI execution path. | Future Action Registry. |
| Divine Smite | 0 | Not represented. | This is not a class resource; it is a spell/action damage rider using spell slots. | Future attack rider / spell action integration. |
| Cunning Strike | 0 | Not represented. | Not a class resource; it is an attack rider choice tied to Sneak Attack. | Future Action Registry / attack rider model. |
| Hunter's Mark | 1 | Spell data likely covers spell text; no Ranger feature automation. | Not modeled as Favored Enemy charges or concentration target state. | Ranger progression plus concentration state. |
| Metamagic | 0 | Not represented. | Metamagic options and Sorcery Point costs missing; not a direct class resource by itself. | Sorcery Points first, then Metamagic option registry. |
| Action Surge | 1 | Legacy Fighter text only. | No structured resource or extra action execution. | Fighter progression, then Action Registry. |
| Wild Shape | 1 | Legacy Druid text only. | No charges, forms, transformed stats, or duration. | Druid progression, then forms registry. |

## 5. Rest / Recovery Coverage

| Rule Area | currentCoverageLevel | currentImplementation | missingPieces | nextStep |
|---|---:|---|---|---|
| Short rest HP / hit dice | 1 | `restShort` exists as a stub and does not spend hit dice. | Hit dice spending, healing roll, and UI choices missing. | Implement short rest hit dice flow. |
| Long rest HP / hit dice | 6 | `restLong` restores HP and some hit dice. | DND 2024 edge cases and exhaustion/conditions not modeled. | Keep simple unless broader rest system is added. |
| Spell slot recovery | 6 | `restLong` restores standard spell slots. | Does not use progression data; Pact Magic not included. | Align with progression and pact recovery. |
| Class resource recovery | 2 | Resources contain `recoveryType`; no automatic recovery. | No short/long/special recovery execution. | DND restShort/restLong resource recovery v1. |
| Pact magic recovery | 5 | Pact slots are manual state; recoveryType is known. | Not automatically restored on short rest. | Add short rest pact recovery. |
| Special recovery rules | 2 | `recoveryType: special` and notes exist for examples like Arcane Recovery. | No custom workflows or per-feature limits. | Handle after basic rest recovery. |

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

## 7. Current Priority Gap List

### P0: Blocks Existing Functionality

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| No current P0 DND blocker identified | Existing character creation, sheet display, standard spell slot consumption, and manual class resource controls can function. | Continue incremental coverage. |

### P1: Next Phase

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| Class resource recovery is not automated | Resources can be initialized and manually adjusted, but rests do not restore them. | Implement DND restShort/restLong resource recovery v1 using `recoveryType`. |
| Pact Magic is not recovered on short rest | Warlock pact slots are visible/manual but not integrated into rest. | Add pact recovery to short rest. |
| Structured class resources missing for most classes | Only sample progression classes have meaningful structured resource data. | Add Cleric, Druid, Fighter, Monk, Paladin, Ranger, Sorcerer progression resources. |
| Spell slot progression still partly hardcoded | Level-up slot changes can diverge from DND 2024 progression data. | Use `getSpellSlotsAtLevel()` in a controlled data-layer/store pass. |

### P2: Later Automation

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| Action Registry absent | Actions, bonus actions, reactions, riders, and resource costs cannot be executed consistently. | Design Action Registry after runtime resources stabilize. |
| Concentration absent | Many spells and features need single-active concentration tracking. | Add concentration runtime state. |
| Divine Smite / Cunning Strike / Metamagic not modeled | These are action/spell/attack option systems, not generic class resources. | Add as future Action Registry or option registry work, not as `classResources`. |
| Invocations modeled as count-like resource | Invocations are choices/passives, not spendable uses. | Move to feature choice registry later. |

### P3: Not Now

| Gap | Why It Matters | Suggested Fix |
|---|---|---|
| Full equipment automation | Requires item schema, equipped slots, weapon attacks, armor, weight, and item actions. | Defer until DND runtime/action foundations are stable. |
| Full combat automation | Requires target model, action economy, conditions, damage application, and encounter state. | Defer until Action Registry is designed. |
| Magic items and attunement | Large standalone subsystem. | Defer until structured inventory exists. |
