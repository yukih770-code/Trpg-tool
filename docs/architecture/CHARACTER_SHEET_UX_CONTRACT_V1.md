# Character Sheet UX Contract v1

Status: architecture / UX contract only.

Scope: shared character-sheet information architecture for DND 5e 2024, COC 7e,
and Cyberpunk RED. This contract defines page responsibility, player-facing
sheet structure, audit/catalog boundaries, system-specific section differences,
and campaign-entry rules.

This document does not implement UI, store writes, schema migration, runtime
logic, dice, rules automation, equipment systems, campaign membership, backend,
multiplayer, maps, handouts, or session state.

## 1. Purpose

The platform now has shared Actor Vault, Campaign Library, campaign entry bridge,
and runtime shell patterns. Character sheets need the same information
architecture discipline.

Current character sheet risks across DND / COC / CP RED:

1. Character Sheet, Character Builder, Character Audit, and Compendium / Catalog
   concerns are mixed together.
2. Default sheets become too long for play use.
3. Catalogs for equipment, spells, items, features, skills, or rules data drift
   into default sheet pages.
4. Source metadata and verification warnings appear as primary player content.
5. DND / COC / CP RED need shared platform structure without being forced into
   one identical visual template.

This contract sets the future target so each system sheet can become a focused
player surface while preserving system flavor.

## 2. Source Context Read

This contract was written after reviewing:

- `AI_IMPLEMENTATION_HANDOFF_CONTRACT_V1.md`
- `NAVIGATION_AND_EXIT_CONTRACT_V1.md`
- `PLATFORM_INTERACTION_UI_CONTRACT_V1.md`
- `REFERENCE_ARCHITECTURE_APPLICATION_GUIDE_V1.md`
- `CAMPAIGN_MEMBERSHIP_CONTRACT_V1.md`
- DND workspace and actor adapter.
- COC workspace and actor adapter.
- CP RED workspace and actor adapter.
- Current sheet / builder / runtime components and related data files for:
  - DND Sheet, Builder, Gameplay, equipment catalog, spellbook, class resources.
  - COC Sheet, Builder, Gameplay, SAN, Luck, pushed roll, growth check.
  - CP RED Sheet, Builder, Gameplay, equipment, weapons, armor, Humanity, EMP,
    cyberware, role ability, netrunning-oriented surfaces.

## 3. Non-Goals

This contract does not authorize:

- Modifying any sheet component.
- Modifying any builder component.
- Modifying COC / CP RED / DND runtime behavior.
- Modifying DND rules data.
- Modifying COC skill, SAN, Luck, or growth-check logic.
- Modifying CP RED equipment, Humanity, cyberware, or netrunning logic.
- Modifying store, save format, schema, or migration.
- Creating real inventory/item contracts.
- Creating real actor-campaign membership.
- Entering CampaignRuntimeShell directly from actor sheets.

Future implementation tasks must scope any code change separately.

## 4. Four Surface Separation

Every system must keep these four surfaces distinct.

### Character Sheet

The Character Sheet is for play and quick reference.

It answers:

- Who is this character?
- What is the character's current state?
- What can the player do right now?
- What resources are available?
- What equipment / clues / cyberware / spells are currently relevant?
- Which campaign entry preparation context can this character use?

The Sheet shows current owned/equipped/prepared/usable state, not full source
catalogs.

### Character Builder

The Character Builder is for creating, leveling, importing, and modifying an
actor.

It owns:

- Source Settings consumption.
- Species / occupation / role / class choices.
- Attribute allocation.
- Skill allocation.
- Equipment/cyberware/spell selection during creation.
- Creation warnings and incomplete choices.
- Add / import / Workshop methods.

Builder decisions must not be presented as runtime summaries on the default
Sheet.

### Character Audit

Character Audit is for verification, source, and data-quality inspection.

It owns:

- `source-labeled`
- `owner-source-matched`
- `needs-human-verification`
- rule metadata
- source references
- import warnings
- data completeness checks
- legacy compatibility notes

Audit content may be accessible from a sheet tab, but must not dominate the
default player view.

### Compendium / Catalog

Compendium / Catalog surfaces are reference browsers for rule definitions and
source data.

They own:

- DND equipment, spells, feats, class features, classes, subclasses.
- COC skills, occupations, sanity rules, combat rules, clue/investigation rules.
- CP RED equipment, black-market items, cyberware, roles, skills, netrunning
  references.

Catalog data is not automatically owned character state.

## 5. Shared Platform Character Sheet Skeleton

This is a shared information architecture skeleton, not a shared visual template.

```text
Character Sheet
├─ Header
│  ├─ Name
│  ├─ System
│  ├─ Core identity
│  ├─ Current campaign / select campaign / enter entry preparation
│  └─ Key state summary
│
├─ Tabs / Sections
│  ├─ Overview
│  ├─ Actions / Checks
│  ├─ Skills
│  ├─ Equipment
│  ├─ System-Specific Abilities
│  ├─ Background / Notes
│  └─ Data / Audit
```

The skeleton may be rendered as tabs, section navigation, a responsive sidebar,
or mobile accordions. It must preserve section responsibility.

Shared responsibilities:

- Header: identity, system, campaign context, and key state.
- Overview: the first player-facing scan surface.
- Actions / Checks: things the player can do or roll.
- Skills: skill list / grouped skill reference / roll placeholders.
- Equipment: actual owned/equipped/current equipment only.
- System-Specific Abilities: spells, class resources, SAN flows, role abilities,
  cyberware, netrunning, or equivalent system logic.
- Background / Notes: narrative, relationships, character story, player notes.
- Data / Audit: metadata, source status, verification, import warnings.

## 6. Shared Defaults And Anti-Patterns

Default character sheets must avoid:

- Full catalogs on the default sheet body.
- Source metadata as primary content.
- Validation warnings as the main play surface.
- Builder choices mixed with play summaries.
- Runtime controls that belong in CampaignRuntimeShell or system Gameplay.
- Direct "Enter Campaign" buttons on actor sheets.
- One generic visual template that erases DND / COC / CP RED identity.

Sheets may share platform structure while retaining different visual direction:

- DND: compact fantasy character sheet, parchment/accent restrained.
- COC: investigation file, dark paper/teal archive tone.
- CP RED: terminal/cyberpunk panel, black/gold/red accents.

## 7. DND Character Sheet Target

```text
DND Character Sheet
├─ Header
│  ├─ Name / level / class / species / background
│  ├─ Current campaign / select campaign
│  └─ HP / AC / initiative / speed / proficiency / passive perception
│
├─ Overview
│  ├─ Six ability scores
│  ├─ Core combat values
│  ├─ Current resource summary
│  └─ Current equipment summary
│
├─ Actions
│  ├─ Common actions
│  ├─ Weapon attacks
│  ├─ Bonus actions
│  ├─ Reactions
│  └─ Available spell actions
│
├─ Skills
├─ Equipment
├─ Spells
├─ Features / Class Resources
├─ Background / Notes
└─ Data / Audit
```

### DND Overview

DND Overview should show:

- Compact STR / DEX / CON / INT / WIS / CHA grid.
- HP, AC, initiative, speed, proficiency bonus, passive perception.
- Current class resource summary.
- Current equipped/owned equipment summary.
- Campaign entry summary.

### DND Actions

DND Actions may show:

- weapon attacks;
- common actions;
- bonus actions;
- reactions;
- available class actions;
- available spell actions;
- roll placeholders where automation is not complete.

### DND Equipment

DND Equipment shows only:

- owned items;
- equipped items;
- backpack;
- currency;
- add equipment entry;
- attunement summary when supported.

Full Equipment Catalog must move to:

- Add Equipment Flow;
- Equipment Catalog Drawer;
- Compendium Browser.

Catalog item definitions are not the same as owned item instances.

### DND Spells

DND Spells may show:

- spell slots;
- pact magic slots;
- prepared spells;
- cantrips;
- known spells;
- spellbook state;
- non-caster empty state.

Full spell catalog browsing belongs in Compendium / Catalog or Add Spell flows.

### DND Features / Class Resources

Class resources should use compact resource cards:

```text
Resource Card
├─ Resource name
├─ Current / maximum
├─ Recovery method
├─ Adjust controls
├─ Restore to max / apply rest
└─ Short note
```

Avoid player-facing developer terms:

- initialize;
- generated state;
- raw resource id as the primary label;
- debug-style maintenance labels.

Source and extraction notes belong in Data / Audit.

## 8. COC Investigator Sheet Target

```text
COC Investigator Sheet
├─ Header
│  ├─ Name / occupation / age / era
│  ├─ Current campaign / select campaign
│  └─ HP / MP / SAN / Luck / Move
│
├─ Overview
│  ├─ Characteristics summary
│  ├─ Sanity / Luck / health state
│  ├─ Credit rating / occupation summary
│  └─ Current clue / note summary
│
├─ Checks
│  ├─ Common checks
│  ├─ Hard / Extreme thresholds
│  ├─ Pushed Roll placeholder
│  └─ Opposed check placeholder
│
├─ Skills
│  ├─ Investigation
│  ├─ Social
│  ├─ Combat
│  ├─ Knowledge
│  └─ Growth Check marks
│
├─ Equipment / Weapons
├─ Conditions
│  ├─ Temporary insanity
│  ├─ Indefinite insanity
│  ├─ Major wound
│  ├─ Dying / unconscious
│  └─ SAN change log placeholder
│
├─ Background / Relationships / Notes
└─ Data / Audit
```

### COC Priorities

COC's sheet must emphasize:

- investigation readiness;
- SAN / Luck / HP / MP;
- skill thresholds;
- pushed rolls;
- growth marks;
- clues and notes;
- occupation and background.

Weapons and equipment are important, but should not dominate the investigator's
first screen unless the campaign context is combat-heavy.

### COC Skills

COC Skills should support:

- base value;
- current value;
- half value;
- fifth value;
- occupational/personal markers;
- growth check marker;
- pushed roll entry point or placeholder.

Growth Check is a system-specific flow. It belongs in COC-specific sheet/runtime
areas, not in the platform generic sheet skeleton.

### COC Conditions

COC Conditions should clearly separate:

- major wound;
- dying;
- unconscious;
- temporary insanity;
- indefinite insanity;
- SAN change history placeholder;
- pushed roll context placeholder.

Audit/source status must remain separate from these play-state conditions.

## 9. CP RED Character Sheet Target

```text
CP RED Character Sheet
├─ Header
│  ├─ Name / Role / Rank / Lifepath summary
│  ├─ Current campaign / select campaign
│  └─ HP / Seriously Wounded / Death Save / Humanity / EMP
│
├─ Overview
│  ├─ STAT summary
│  ├─ Current HP / armor / Humanity
│  ├─ Role Ability summary
│  └─ Current equipment summary
│
├─ Actions / Combat
│  ├─ Weapon attacks
│  ├─ Armor / SP
│  ├─ Ammo
│  ├─ Critical Injury placeholder
│  └─ Cover / Movement placeholder
│
├─ Skills
├─ Equipment
│  ├─ Equipped weapons
│  ├─ Armor
│  ├─ Backpack
│  └─ Stable item instance ids
│
├─ Role Ability
├─ Cyberware / Humanity
├─ Netrunning
├─ Lifepath / Contacts / Notes
└─ Data / Audit
```

### CP RED Priorities

CP RED's sheet must emphasize:

- stable equipment instances;
- weapons, armor, ammo, and SP state;
- Humanity / EMP;
- installed cyberware versus backpack cyberware;
- role ability;
- lifepath, contacts, enemies, and debts;
- netrunning as its own system surface.

### CP RED Equipment

CP RED Equipment must preserve:

- owned but not equipped items;
- equipped/carried weapons;
- equipped armor by location;
- installed versus backpack cyberware;
- fashion/clothing;
- item instance ids.

Do not collapse CP RED equipment into a simple text list once item instances are
available.

### CP RED Cyberware / Humanity

Cyberware and Humanity should be a dedicated section because they are a core
identity/resource axis, not ordinary equipment.

The section may show:

- installed cyberware;
- backpack cyberware;
- Humanity current / max;
- EMP;
- cyberpsycho risk;
- install/remove placeholders;
- audit note if installation behavior is incomplete.

### CP RED Netrunning

Netrunning should not be mixed into generic combat cards.

It should be its own section or runtime-adjacent panel, with placeholders for:

- interface actions;
- NET architecture;
- programs;
- Black ICE;
- node state;
- future runtime bridge.

## 10. Equipment / Item / Catalog Boundary

All systems must distinguish:

```text
Catalog definition != owned item != equipped item != runtime item state
```

Examples:

- DND: a longsword catalog row is not a character's equipped longsword.
- COC: a weapon definition is not an investigator's carried weapon state.
- CP RED: a cyberware catalog row is not an installed cyberware instance.

Default sheets show owned/equipped/current state only.

Catalog browsing belongs in:

- Compendium / Catalog;
- Add Equipment Flow;
- Add Item Flow;
- Catalog Drawer;
- system-specific creation/import flows.

## 11. System-Specific Ability Boundary

The shared skeleton has a "System-Specific Abilities" concept, but each system
owns its details:

- DND: spells, class features, class resources, hit dice, attunement.
- COC: SAN, Luck, Pushed Roll, Growth Check, insanity/major wound state.
- CP RED: Role Ability, Humanity/EMP, cyberware, critical injuries, netrunning.

These sections may share card density and responsive patterns, but must not
reuse labels or visuals that erase system differences.

## 12. Data / Audit Collection Rules

Default sheets may show short warning badges, but full audit detail belongs in
Data / Audit.

Data / Audit collects:

- `source-labeled`
- `needs-human-verification`
- `owner-source-matched`
- metadata
- rule source references
- import warnings
- data completeness checks
- legacy compatibility notes
- automation-deferred notes

Data / Audit must not be the default landing section for ordinary players.

## 13. Campaign Entry Rules

Character sheets must follow `PLATFORM_INTERACTION_UI_CONTRACT_V1.md` and
`CAMPAIGN_MEMBERSHIP_CONTRACT_V1.md`.

Allowed on actor sheets:

- Select Campaign.
- Enter Entry Preparation for an already selected campaign context.

Forbidden on actor sheets:

- Enter Campaign.
- Directly open CampaignRuntimeShell.
- Persist `selectedActorId`.
- Create real Actor-Campaign membership.
- Treat `suggestedActor` as a confirmed runtime actor.

The true `Enter Campaign` action belongs only to:

```text
Campaign detail / entry preparation
```

Campaign-related labels:

- "Open Character Sheet" = view/use actor.
- "Select Campaign" = enter actor-to-campaign selection flow.
- "Enter Entry Preparation" = open campaign detail / entry preparation.
- "Enter Campaign" = only in campaign detail / entry preparation.

## 14. Visual Direction

The shared platform should provide structure, not sameness.

DND:

- compact fantasy sheet;
- readable parchment / dark-red accents;
- tactical state and class resources should be scannable.

COC:

- investigation file / archive tone;
- SAN and clues need high visibility;
- narrative and relationships are more prominent than gear catalogs.

CP RED:

- terminal / cyberpunk panel;
- Humanity, gear state, cyberware, and role ability need strong visual hierarchy;
- netrunning should feel distinct from ordinary combat.

Future implementation should not copy DND sheet layout directly into COC or CP
RED.

## 15. Responsive Rules

All system sheets should:

- keep headers compact;
- keep key state visible on mobile;
- avoid default nested scroll regions;
- keep long skill/equipment lists readable;
- prefer tabs/accordions/sticky section selectors on small screens;
- avoid full catalog tables in default sheet bodies;
- keep action buttons stable and semantically clear.

## 16. Implementation Phase Guidance

Recommended future phases:

1. Platform Sheet IA Shell.
   - Tabs/sections only; no rule/store changes.
2. DND Sheet Refactor.
   - Move equipment catalog out of default sheet.
   - Compact resources and data/audit boundaries.
3. COC Investigator Sheet Refactor.
   - Elevate SAN/Luck/skills/clues and separate growth/pushed-roll surfaces.
4. CP RED Sheet Refactor.
   - Separate equipment instances, cyberware/Humanity, role ability, netrunning.
5. Sheet Campaign Entry Alignment.
   - Ensure all actor sheets expose only Select Campaign / Entry Preparation,
     never direct runtime entry.
6. Data / Audit Tab.
   - Move metadata and validation output into explicit audit surfaces.

Each implementation phase must report whether it touches UI only, store/schema,
runtime logic, rules data, or campaign membership.

## 17. Coding AI Checklist

Before implementing any character sheet change, the AI executor must answer:

- Which system is affected: DND, COC, CP RED, or shared platform?
- Which surface is affected: Sheet, Builder, Audit, or Catalog?
- Is catalog data being moved into the default Sheet?
- Is source metadata becoming primary player content?
- Is the change implying real item instances or inventory behavior?
- Is the change implying complete spell / SAN / Humanity / netrunning automation?
- Is the change adding direct "Enter Campaign" from an actor sheet?
- Are `suggestedActor`, `selectedActorId`, and persistent membership still
  separated?
- Does the change preserve system-specific visual identity?
- Does the change modify store, schema, migration, save format, rules data, or
  runtime logic?

If the task is contract-only or UI-only, it must not introduce store writes,
schema changes, or real runtime behavior.

## 18. Acceptance Boundary

This contract is satisfied when future sheet work can clearly state:

- Sheet / Builder / Audit / Catalog are separated.
- Default sheets show player-relevant current state.
- Full catalogs are routed to catalog/add flows.
- DND / COC / CP RED preserve distinct system priorities.
- Data and verification details are collected in Data / Audit.
- Actor-to-campaign entry follows platform interaction rules.

It is not satisfied by creating one generic sheet template or by moving every
rule/catalog/detail into the default character page.
