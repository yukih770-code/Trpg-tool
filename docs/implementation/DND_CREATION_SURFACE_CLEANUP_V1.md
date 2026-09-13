# D&D Creation Surface Cleanup V1

Status: **PASS**, corrected and verified in the real API-backed local product.

The earlier fixture-only verdict was insufficient. Its campaign used a D&D-prefixed `systemId`, while the production campaign shown by the owner stores the legacy value `p` and is displayed as a custom system. That difference selected a separate name-only branch that the fixture never exercised.

## Production root cause and correction

The old click path was:

- `创建 NPC` → `openActorTask('npc')` → `creatingActorKind` stayed undefined because `isDndCampaign('p')` was false → `!dndCampaign && actorTask === 'npc'` rendered `nameOnlyCreationForm` → `handleCreateNameOnlyActor` immediately called `createCampaignActor`.
- `添加怪物` → `openActorTask('customMonster')` for the same non-D&D-prefixed value → the same name-only form and immediate-persist handler.

The name-only state, JSX, handler, and translations have now been removed. `创建 NPC` always opens the canonical unsaved `DndLiteActorSheetPanel` draft. `添加怪物` still opens the Monster Catalog, and `创建自定义怪物` opens the same canonical panel with Monster presets. A completed draft is persisted once by `createActorFromDraft`; a newly created D&D-sheet actor in a legacy campaign can be reopened in that same panel.

## Surfaces and decisions

| User intent | User job and canonical object | Verdict | Final surface |
|---|---|---|---|
| Create Player Character | Build a persistent, legal `CharacterData` record and save it to the Character Library | KEEP | The existing canonical D&D Creator opens directly from Create Character |
| Use custom/manual Player content | Use personal species, background, class, feat, spell, and related definitions while building the same `CharacterData` | REUSE CANONICAL SURFACE | Personal content is selected in the Creator's Rules sources section and then uses the same fields, readiness validation, completion, and save path |
| Create NPC | Prepare one usable campaign-owned `CampaignActorInstance` | REUSE CANONICAL SURFACE | Create NPC opens `DndLiteActorSheetPanel` immediately in create mode, with NPC presets inside it; persistence happens only on Create |
| Create Custom Monster | Prepare one usable campaign-owned custom Monster | REUSE CANONICAL SURFACE | No suitable Monster → Create Custom Monster opens the same `DndLiteActorSheetPanel`, with Monster presets inside it |
| Add normal Monster | Select complete indexed/private Monster content and materialize a campaign Actor | KEEP | Add Monster opens the Monster Catalog; selection creates the linked campaign Actor and opens the canonical Actor editor |
| Plan for a future Player Character | Previously created a name-only campaign PC placeholder | DELETE | Invite the player and have them submit a canonical Character; no half-object is persisted |
| Join once with a temporary Character | Enter one room without creating a persistent Character | DEMOTE / KEEP | The collapsed More join methods escape hatch writes only its explicit room-admission contract: name, optional summary, HP/max HP, and AC |

## Cleanup

The public Character creation method chooser was removed. Its only working card led to the canonical Creator; Quick Creation, local import, and Workshop import were nonfunctional planned cards. Every persistent Player Character creation CTA now enters the canonical Creator directly. The obsolete creation-method state, render branch, and bilingual keys were removed.

The advanced campaign PC placeholder was removed because it wrote a name-only persistent `CampaignActorInstance` before the user reached a usable editor. Player Characters now enter campaigns through Character Library submission and host approval.

The campaign Monster Catalog no longer exposes the basic-only private Monster create/edit/archive controls. That surface could save a template with empty abilities, actions, speed, saves, skills, senses, and traits, then directed the user elsewhere for completion. The underlying Monster template API, repository, importer, and complete catalog records remain. Campaign-specific custom Monsters use the complete campaign Actor editor.

No standalone component file was deleted: all three obsolete surfaces were embedded branches in shared production components. Their state, handlers, JSX, imports, and unused i18n keys were physically removed.

## Canonical flows

- Player Character: Character Library or Room → Create Character → canonical D&D Creator → readiness validation → `CharacterData`.
- NPC: Campaign cast → Create NPC → full campaign Actor sheet with presets → Create → one `CampaignActorInstance`.
- Normal Monster: Campaign cast → Add Monster → Monster Catalog → Add to campaign and open Actor.
- Custom Monster: Monster Catalog → No suitable Monster → Create Custom Monster → full campaign Actor sheet → Create.
- Temporary Character: Room → More join methods → Temporary Character → minimal room admission; it never enters the Character Library.

## Reused code

The cleanup reuses `Creator`, `useCharacterStore`, `finalizeDndLevelOneCharacter`, `DndSpellManager`, personal-content projections, `DndLiteActorSheetPanel`, `DndActorPresetPicker`, preset materialization, Actor validation/action/resource editors, campaign Actor overrides, the Campaign Actor API, Monster Catalog selection, Dialog primitives, and the existing temporary room-admission contract.

## Browser evidence

Chrome 152 exercised the real `App.tsx` product at `http://127.0.0.1:3000`, the real backend at `http://127.0.0.1:8787`, and the configured PostgreSQL database. The path used server `88` and campaign `p`, matching the owner's screenshots. No preview component or fixture API was involved.

- `production-actor-creator-proof/01-npc-full-editor-first-screen.png`: the first screen after `创建 NPC` is the full canonical editor.
- `production-actor-creator-proof/02-custom-monster-full-editor-first-screen.png`: the first screen after Monster Catalog → `创建自定义怪物` is the same editor with Monster presets.
- `production-actor-creator-proof/03-npc-combat-fields.png`: HP, AC, speed, six abilities, saves, skills, action attack/damage fields, resources, notes, tags, and the final Create action are visible.
- `production-actor-creator-proof/04-reopened-npc-same-editor.png`: the persisted NPC reopens in the recognizable editor in edit mode.
- Machine-readable result: `production-actor-creator-proof/verification.json`.

The live actor count remained 1 after opening and editing the unsaved NPC draft. It became 2 only after the final `创建角色` action. The new record contains `dndActorPresetV1` and a complete `dndLiteActorSheetV1`, including six abilities and one combat action.

## Tests and limitations

Frontend TypeScript, production build, focused source checks, live backend/database health, and the real product browser journey are the final gate. The previous fixture-only browser result is retained only as superseded historical evidence. Existing Session-Ready server/runtime work was not changed by this correction.

Equipment remains display-oriented and does not derive attack shortcuts. Personal content may describe rules that are not executable; the Creator states that boundary. Temporary Characters intentionally carry only the room-admission fields and cannot be converted automatically into persistent Characters. Complete private Monster template authoring remains outside this campaign creation surface; existing complete templates can still be imported and selected.
