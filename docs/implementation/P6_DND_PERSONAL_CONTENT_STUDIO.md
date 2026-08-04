# P6 DND Personal Content Studio

## Purpose

Let any authenticated player author private DND reference content without
requiring World Server ownership or a visible "pack name" step. The workbench
is organised around the thing being created: a species, class, subclass,
background, feat, spell, item, or monster.

## Authoring Model

- The visible unit is a **rule entry**. A player can save one entry or combine
  several related entries in one save.
- The existing personal-compendium pack/version model remains an internal,
  immutable storage and history container. For normal creation its display
  name is derived from the entries, so authors do not have to invent a library
  name before making a single species or item.
- Editing an existing saved library creates a new immutable version; the old
  version remains available to characters and Rooms that already reference it.
- JSON import is intentionally an advanced library-level route because the
  imported document already has a versioned container.

## Current Structured Facts

- Species: size, speed, traits, and heritage choices.
- Backgrounds and feats: readable proficiencies, prerequisites, and feature
  notes.
- Classes and subclasses: ability, hit die, proficiencies, equipment note, and
  repeatable `level | name | description` feature progressions.
- Spells: readable casting facts.
- Items: category, rarity, weight, cost, weapon/armor facts, and usage note.
- Monsters: basic combat facts plus repeatable trait/action/reaction/legendary
  action text.

All fields are declarative reference data. Personal entries do not automatically
equip a character, modify AC/HP, create Tokens, roll attacks, consume spell
slots, or execute effects.

## Authority Boundary

Private content remains owned by its author. Character creation may project
supported entry kinds as choices, but a Room host still controls whether a
character and its submitted personal-content references are admitted. This
workbench does not grant Room, Runtime, World Server, or moderator authority.

## Deferred Work

- Full level 1-20 class progression and resource/choice schemas.
- Structured equipment inventory and equipped-item projection.
- Monster template-to-combatant placement flow.
- Full spell target/range/effect automation.
- Public workshop publication, review, discovery, and collaboration.
