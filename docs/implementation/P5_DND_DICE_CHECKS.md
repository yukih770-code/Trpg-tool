# P5 DND Dice / Checks Runtime Layer

## Scope

This slice adds a DND-specific local runtime tool for DND campaigns in the
server workspace. It supports safe common dice formulas, d20 checks with
normal/advantage/disadvantage modes, optional DC comparison, attack rolls
against optional AC, and lightweight damage rolls including a simple critical
damage rule.

The UI is host-operated in this local runtime workspace. It can select existing
campaign actor records or local combatants as readable names, but it does not
read or modify a full character sheet.

## Dice safety

`dndDiceRoller` parses a small additive grammar such as `d20`, `1d20+5`,
`2d6+3`, and `1d4+1d6+2`. It does not use `eval`. Formula length, dice group,
dice-count, and die-side limits reject unsupported or unsafe input.

The roller accepts an injected random source so smoke coverage can be
deterministic. Critical damage doubles the rolled dice only; a flat modifier is
counted once.

## Runtime records

Successful local results attempt to append one of these public Runtime Events:

- `dnd.check_rolled`
- `dnd.skill_rolled`
- `dnd.save_rolled`
- `dnd.attack_rolled`
- `dnd.damage_rolled`
- `dnd.roll_note`

Payloads include readable summaries plus formula, mode, raw rolls, kept d20,
modifier, total, and optional DC/AC result. Runtime Events remain append-only.
If an append fails, the local result remains visible and the UI reports that it
is not yet durable; this slice does not claim live synchronization.

## Boundaries

This is not a full DND rules engine, monster database, spell system, or full
character sheet. It does not apply damage to HP, change inventory, consume
spell resources, create RuntimeActor or CampaignActorInstance records, change
WebSocket behavior, or add database/API schema.

## Follow-up candidates

- DND Lite Actor Sheet
- NPC / monster templates
- explicit HP apply workflow
- spell and ability actions
- grid and range integration

## Verification

Run `npm run frontend:verify:dnd-dice`, followed by the standard runtime smoke,
API, TypeScript, build, leak, and diff checks.
