# D&D Quick Actor Presets — Implementation (V1)

> Preset → materialized canonical Actor draft → same canonical sheet → edit →
> Custom. One Actor, one editor, one source of truth.

## 1. Product problem

Creating an NPC produced an Actor that was only a name plus `actorKind: 'npc'`.
`handleCreateCampaignActor` called `createCampaignActor({ displayName, actorKind })`
with **no `overridePayload` at all**, so the new Actor had no abilities, no AC,
no HP, no speed and no actions. The moment that civilian, guard or improvised
creature was pulled into combat, the GM had to author every field from an empty
form — mid-session.

The monster path already did the right thing: `handleCreateMonsterActorDraft`
passed `overridePayload: withDndLiteActorSheetOverride({}, dndMonsterToLiteActorSheet(monster))`.
That is exactly the shape this feature generalises to a starting archetype.

## 2. Existing Actor lifecycle (unchanged)

```
CharacterData (Character Library)   -- players only, canonical Character Creator
        |  admission
CampaignActorInstance               -- campaign-owned record
        |  override_payload.dndLiteActorSheetV1
DndLiteActorSheet                   -- the canonical combat definition
        |  place on map
MapToken -> Combatant -> RuntimeActor
```

A preset enters at exactly one point: it supplies the **initial contents** of
`override_payload.dndLiteActorSheetV1` at creation. Nothing else in the lifecycle
changes, and none of these objects are collapsed.

## 3. Preset mental model

A preset is a **starting state**, like a game-mode preset that becomes "Custom"
once you move one of its sliders.

```
Preset definition (code)
      |  materialize ONCE, at creation
DndLiteActorSheet (the Actor owns these values outright)
      |  GM edits a preset-controlled field
Custom  -- same Actor, same sheet, same editor
      |  Reset to archetype
Preset
```

## 4. Why a preset is not a new Actor type

- No new persistent domain object. The only thing stored beyond the canonical
  sheet is a label: `{ presetId, presetVersion, materializedAt }`.
- No second editor. The picker feeds `DndLiteActorSheetPanel`, which is where
  every campaign actor is already edited.
- No runtime inheritance. `materializeDndActorPreset` returns plain owned data
  with no reference back to the definition.
- No second source of truth. Nothing reads the preset label to supply or
  override a value; the saved sheet is always authoritative.

## 5. Preset materialization

`materializeDndActorPreset(presetId, { displayName, actorKind, locale })` folds
the archetype onto `createDefaultDndLiteActorSheet()` and returns a canonical
sheet. `displayName` and `actorKind` come from the caller.

Internal coherence rule, so numbers are authored rather than arbitrary:

- `attackBonus` = governing ability modifier + the preset's proficiency bonus,
  computed with the project's own `calculateDndAbilityModifier`.
- Proficient saves and skills = ability modifier + proficiency bonus.
- Damage adds the ability modifier only where the archetype says it should, and
  a `+0` modifier is never appended (`1d4`, not `1d4+0`).
- Armour class, max HP and speed are flat authored values a GM is expected to
  change. `currentHp` is seeded from `maxHp`.

## 6. Preset → Custom semantics

Preset-controlled fields — the only ones that can flip the status:

`abilities`, `proficiencyBonus`, `defenses.armorClass`, `defenses.maxHp`,
`defenses.currentHp`, `defenses.speedFt`, `savingThrows`, `skills`, `actions`.

Deliberately **not** controlled:

| Field | Why |
|---|---|
| `displayName` | The GM always names the actor. Naming is not customising the archetype. |
| `actorKind` | Chosen by the entrance. |
| `notes`, `tags` | Narrative, not mechanics. Writing a description should not read as "Custom". |
| `defenses.temporaryHp` | Play state; no archetype authors it. |

Comparison is a normalized field-by-field check (`compareDndActorPresetState`),
not reference equality and not raw `JSON.stringify`: numeric maps compare
key-by-key so ordering and `undefined` do not matter, and actions compare on the
fields that decide behaviour — including `name`, because renaming "Melee weapon"
to "Rusty axe" is a real edit the GM made to this actor.

Status is computed against the **draft**, so the badge flips while editing rather
than after saving.

`status: 'unknown'` is returned — never `'custom'` — when the actor has no preset
label, or when its stored `presetVersion` differs from
`DND_ACTOR_PRESET_DEFINITION_VERSION`. Blaming the GM for a change a later build
made to the definition would be wrong.

## 7. NPC flow

```
Campaign Cast -> Create NPC
  -> archetype picker (Ordinary person / Armed / Scout / Ranged /
                       Spellcaster-like / Skilled expert / Blank)
  -> type a name
  -> Create                       <- fast path ends here; the Actor is usable
  -> canonical sheet opens automatically for optional editing
```

## 8. Monster flow (Catalog stays primary)

```
Add monster -> existing Monster Catalog        <- unchanged, still the default
                 -> select -> campaign actor -> canonical sheet
              -> "没有合适的怪物？" (secondary)
                 -> Create custom monster
                   -> archetype picker (Brute / Small creature / Scout /
                                        Ranged / Spellcaster-like / Blank)
```

Quick presets never compete with the catalog; they are the fallback for
improvised and custom creatures, exactly as before this change.

## 9. Temporary-character reuse decision — partial, deliberately

The temporary-character admission contract carries a short summary plus
`hpCurrent`, `hpMax` and `armorClass`. Abilities, saving throws, skills and
actions have **nowhere to go** in it.

Decision: **reuse the same preset definitions to prefill the four fields the
contract actually holds**, and carry nothing else. `dndActorPresetQuickDraftValues`
returns exactly `{ summary, hpCurrent, hpMax, armorClass }`. No second set of
temporary-character templates exists, the admission contract is unchanged, and no
mechanical data is smuggled into free text. The values remain editable.

## 10. Preset data source decision — project-defined, labelled

Audited first. The repository contains **no approved NPC or creature stat-block
data** to derive from:

- `src/data/dnd2024/` holds character options, class progression, spell index and
  equipment. The equipment table is explicitly `usagePolicy: 'display-only'`.
- The only "Guard" in shipped data is a character **background**, not a stat block.
- Monster templates are per-world-server content a user imported themselves
  (`worldServerId`, `createdByUserId`, `importBatchId`) — not shipped data, and
  not guaranteed to exist.

Therefore **strategy A**: project-defined generic archetypes, declared through the
repository's own provenance contract:

```
DND_ACTOR_PRESET_PROVENANCE = {
  source: 'homebrew', trustLevel: 'homebrew', publicScope: 'homebrew',
  contentPolicy: 'safe-to-embed', usagePolicy: 'core-runtime-ok',
  sourceRef: 'project-defined:dnd-quick-actor-presets-v1',
}
```

No official stat block is reproduced, and the picker says so on screen. Archetype
names avoid official creature names for this reason ("Armed / martial", not
"Guard"; "Spellcaster-like", not "Mage").

**NPC archetypes are not player classes.** They model no class levels, spell
slots, features or resources, and the UI never presents one as a legal player
character.

## 11. Canonical sheet reuse

No `QuickActorSheet`, `QuickNpcSheet`, `NpcEditorV2` or equivalent exists.
`DndLiteActorSheetPanel` remains the one canonical surface; this change adds one
status card to it. The only new component is `DndActorPresetPicker`, a
presentational radiogroup that selects a starting point and creates nothing.

## 12. T12 compatibility

Preset actions are written in the canonical action shape the T12 resolver already
reads from `override_payload.dndLiteActorSheetV1.actions[]`:

- `kind` is `weapon_attack` or `spell_attack` — the only kinds `readAuthoredDndAttack` accepts
- `attackBonus` is a safe integer within ±100 — required, or the resolver throws
- `damageFormula` parses under `parseDndDiceFormula` and matches the projection's
  `/^[0-9dD+\-\s]+$/` shortcut filter

No parallel attack format, no client-side dice, no change to T12 authority.

## 13. Persistence / provenance decision

The label lives beside the sheet in the existing free-form override bag — the
same place T11b's acceptance breadcrumb lives:

```
override_payload = {
  dndLiteActorSheetV1: { ...canonical sheet... },   <- authoritative values
  dndActorPresetV1: { schemaVersion: 1, presetId, presetVersion, materializedAt },  <- label only
}
```

**No migration.** `override_payload` is JSONB and the campaign actor API already
accepts a whole payload. Clearing the sheet clears the label with it, so a label
can never outlive the values it describes. A malformed label is ignored rather
than trusted, and an actor with no label gets none inferred.

The stale-overlay risk is structurally absent: the label carries an id, never a
copy of any value, and the comparison re-materializes the archetype on demand.

## 14. Permissions

Unchanged. Creation still runs through `createCampaignActor` behind
`canManageServer`, and the sheet still saves through `updateCampaignActor` behind
the same check — both already require campaign edit rights server-side. No
permission was broadened, and room host status still implies nothing about
campaign management.

Reset is a draft operation that writes nothing until the host saves through the
normal path, so it cannot touch ownership, bindings, admission, map tokens,
RuntimeLog or live combat HP.

## 15. Implementation files

**New**

| File | Role |
|---|---|
| `src/lib/dnd/dndActorPresets.ts` | Definitions, materialization, preset/custom comparison, reset, temp-draft subset |
| `src/lib/dnd/dndActorPresetsSmoke.ts` | 147 assertions |
| `src/components/platform/DndActorPresetPicker.tsx` | Accessible radiogroup picker |

**Modified**

| File | Change |
|---|---|
| `src/lib/platform/campaignActorOverride.ts` | `dndActorPresetV1` label read/write; clearing the sheet clears the label |
| `src/components/platform/ServerCampaignWorkspace.tsx` | Preset picker in the NPC / custom-monster form; materialize on create |
| `src/components/platform/DndLiteActorSheetPanel.tsx` | Archetype status card, changed-field list, reset |
| `src/components/platform/RoomLobbyShell.tsx` | Temporary-character prefill from the same definitions |
| `package.json` | `frontend:verify:dnd-actor-presets` |

## 16. Tests

`npm run frontend:verify:dnd-actor-presets` — 147 assertions covering
materialization validity, the T12 action contract, preset/custom detection
(including the fields that must **not** flip it), reset, no-shared-state between
materializations, provenance round-tripping, picker composition, and the
temporary-draft subset. Boundary assertions confirm no preset emits conditions,
resources or spell slots.

## 17. Remaining limitations

1. **Browser workflows were not executed.** No dev server was reachable and the
   cloud container cannot run Vite (its `node_modules` holds Windows-only native
   binaries). The manual checklist is in the task report.
2. **Every archetype is proficiency bonus 2.** There is no level/CR scaling — a
   GM raising difficulty edits HP, AC and the attack bonus by hand, which flips
   the actor to Custom as designed.
3. **No portrait or token defaults.** Token presentation is chosen at placement
   and was left alone.
4. **Reset has no per-field granularity.** It restores all preset-controlled
   fields at once; the status card lists which ones diverged.
5. **Non-D&D campaigns are unchanged** — they still create a name-only actor,
   because presets are deliberately D&D-system-owned.
6. **Exact official stat blocks remain a content dependency.** If the product
   wants an official Commoner or Guard, that needs approved source data and a
   product-owner decision; this pass ships clearly-labelled generic archetypes
   instead of fabricating them.
