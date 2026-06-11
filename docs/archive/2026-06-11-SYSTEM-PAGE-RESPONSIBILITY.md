# System Page Responsibility

Last updated: 2026-06-10

## 1. Purpose

This file defines responsibility boundaries for Creator, Sheet, Player Gameplay, RollConsole, and future Host Console pages across DND, Call of Cthulhu, and Cyberpunk RED.

The goal is to prevent page-role drift: Creator should not become Gameplay, Sheet should not become a dice console, and Player Gameplay should not absorb Host Console tools.

## 2. Global Responsibility Rules

- Creator owns creation-time choices and allocation.
- Sheet owns display and downtime maintenance.
- Player Gameplay owns runtime operations.
- RollConsole owns result display and logs.
- Host Console is a future separately planned surface.
- Sheet does not own checks.
- Sheet does not own runtime HP / SAN / ammo / resource changes.
- Player Gameplay must not contain Host Tools.
- RollConsole is the single result center.
- Do not keep duplicate result areas.

## 3. Creator Responsibility

Creator should contain:

- Basic character information.
- Attribute generation or entry.
- Occupation, role, class, role path, or equivalent system identity.
- Creation-time skill/resource allocation.
- Initial derived values.
- Initial resource initialization.
- Initial equipment if the system needs it.

Creator should not contain:

- Runtime HP / SAN / ammo / resource changes.
- Check results.
- RollConsole.
- Host tools.
- NPC / enemy control.

## 4. Sheet Responsibility

Sheet should contain:

- Character information display.
- Attribute, skill, and resource display.
- Background, possessions, assets, and other downtime maintenance.
- Growth marks or manual maintenance flags.
- Read-only runtime current values when useful for status awareness.

Sheet should not contain:

- Unrestricted creation-time skill allocation.
- Skill checks.
- Dice-roll toast behavior.
- HP / SAN / MP / Luck direct runtime input controls.
- Combat actions.
- RollConsole.
- Host tools.

## 5. Player Gameplay Responsibility

Player Gameplay should contain:

- Current runtime state.
- HP / SAN / MP / Luck / Humanity and similar runtime changes.
- Checks.
- Actions.
- Resource consumption.
- Status flags.
- Player-visible RollConsole.

Player Gameplay should not contain:

- Full Host Console.
- `gmOnly` logs.
- Hidden roll controls.
- Global NPC / monster management.
- Hidden module information management.
- Multiplayer permissions.

## 6. RollConsole Responsibility

RollConsole should contain:

- Latest Result with large display value.
- Check / action / roll type.
- Calculation details.
- Outcome, success level, NAT labels, exploding dice labels, or equivalent special tags.
- Historical log.
- Readable text.
- `RuntimeLogEntry` rendering.

RollConsole should not contain:

- Multiple duplicate result areas.
- Host tools.
- Free roll as a primary player feature.
- Low-contrast small text.
- Dynamic content that is compressed or clipped.

## 7. Host Console Responsibility

Future Host Console should contain:

- Free roll.
- Secret / `gmOnly` results.
- Reveal controls.
- NPC / enemy tools.
- Random tables.
- Scene and clue management.
- Map / module controls.
- Full session log.

Current phase does not implement Host Console.

## 8. System-Specific Notes

### DND

- Creator / Sheet / Gameplay are currently closest to the reference shape.
- Runtime resources and RuntimeLogEntry are the current reference implementation.
- Action Registry remains v0/v0.1.
- Attack, damage, target model, and Host Console are deferred.

### COC

- Creator skill constraints are complete.
- Sheet cleanup is complete.
- Gameplay runtime actions, skill checks, RollConsole, and local RuntimeLogEntry history are wired and componentized.
- Luck Spending, Pushed Roll, full SAN / insanity automation, and Keeper Console are deferred.

### Cyberpunk RED

- CP RED rule coverage, Sheet cleanup, runtime foundation, Gameplay RollConsole, and local RuntimeLogEntry history are aligned and componentized.
- Combat, armor, ammo, netrunning, and vehicles are deferred.

## 9. Anti-Patterns

Do not:

- Roll dice directly from Sheet.
- Allow unrestricted skill point editing in Sheet.
- Put Host Tools inside Player Gameplay.
- Keep multiple result centers.
- Let `string[]` logs spread into new systems.
- Fake success/failure when no DC/DV/target exists.
- Persist logs into store/schema too early.
- Modify multiple systems' business logic in one implementation round.
