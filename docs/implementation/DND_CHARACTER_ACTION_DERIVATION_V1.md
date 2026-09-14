# D&D Character Action Derivation V1

## 1. Original Session-Ready limitation

An accepted Player Character could enter a Campaign and combat, but its approved weapon equipment did not produce a T12 attack Action. A GM had to retype an attack into the campaign actor sheet.

## 2. Equipment authority audit

The repository has two distinct representations. `CharacterData.inventory: string[]` is legacy display/compatibility data. The typed inventory store carries canonical `definitionId`, quantity, and equipped-slot state. Only the typed identity is sufficient to reconnect an accepted Character to approved rules.

## 3. Why legacy inventory strings are insufficient

Names such as `Long Sword +1 maybe`, localized labels, and aggregate starter text cannot prove a canonical item, rules source, equipped state, or executable mode. The derivation path never parses legacy inventory strings into combat statistics.

## 4. Optional authoritative equipment-reference snapshot

`CharacterData` now permits the additive `dndEquipmentSnapshotV1` block:

```ts
{
  schemaVersion: 1,
  items: Array<{
    definitionId: string,
    quantity: number,
    equipSlot?: string
  }>
}
```

The Actor Vault bridge copies this narrow, deterministically sorted block from the existing typed inventory store. Names, notes, prices, and client-copied weapon statistics are excluded. The reader bounds and validates untrusted snapshot JSON.

## 5. Approved weapon metadata source

Derivation resolves `definitionId` through the existing D&D 2024 item registry. It requires a sourced item definition, sourced weapon profile, sourced Action definition, and sourced damage effect with matching `sourceRef`. The verified chain is `weapon.dagger` → `action.item.dagger.melee-weapon-attack` → `effect.item.dagger.piercing-damage`.

## 6. Why V1 derives dagger only

The dagger is the only catalog weapon with a complete source-backed gameplay profile and Action/effect chain in the approved registry. V1 does not infer missing weapon rules. It materializes only the dagger melee mode because current T12 does not enforce range or ammunition for the sourced thrown mode.

## 7. Pure deterministic derivation

`deriveDndWeaponActionsFromCharacterSnapshot` is a pure adapter over one accepted `CharacterData` snapshot. It reads equipped main-hand and off-hand canonical references, resolves approved definitions, and returns sorted Actions plus unsupported definition IDs. It performs no I/O, persistence, rolling, or state mutation.

## 8. Stable Action identity

The derived Action reuses the canonical Action definition ID: `action.item.dagger.melee-weapon-attack`. Identity is weapon-type based rather than inventory-instance based, so repeated derivation, duplicate dagger rows, serialization, and restart produce the same ID.

## 9. Attack bonus

Attack bonus is the selected eligible ability modifier plus the existing level-derived proficiency bonus when the accepted Character is proficient. No attack bonus is accepted from inventory text or browser-submitted attack intent.

## 10. Damage formula and type

The base `1d4` and `piercing` type come from the approved dagger damage effect. The adapter appends the selected ability modifier to form the T12 formula, such as `1d4+2`. It refuses malformed dice, flat damage in this V1 bridge, or an effect without a sourced matching definition.

## 11. Proficiency

Proficiency is matched against exact, normalized weapon identities or the exact resolved Character proficiency vocabulary for the approved weapon category. A proficient level-1 Character receives the repository's +2 proficiency bonus; a non-proficient Character receives only the selected ability modifier.

## 12. Ability selection

The adapter considers only abilities explicitly allowed by the sourced weapon profile. Dagger allows Strength or Dexterity. It chooses the higher modifier; a tie keeps the profile's source order, making the result deterministic.

## 13. Duplicate daggers

Equipped definition IDs are deduplicated before Action materialization. Two canonical dagger instances therefore produce one stable type-level dagger Action. Quantity and instance order cannot create duplicate or unstable shortcuts.

## 14. Unknown and free-text refusal

Unknown typed IDs are reported as unsupported and produce no Action. Legacy free-text inventory, including an imported `Long Sword +1 maybe`, produces no Action even when it resembles a weapon.

## 15. Rogue `两把匕首` bug and fix

The real Creator journey exposed owner-source starter text `两把匕首`. It previously became one ambiguous aggregate item without canonical identity. The starter parser now recognizes an explicit leading Chinese or Arabic quantity plus counter, resolves the remaining `匕首` label through the canonical registry, and produces quantity 2 of `weapon.dagger`. Embedded bundles such as `短弓及20支箭` remain unresolved. The transformation is deterministic and the resulting duplicate instances still yield one Action ID.

## 16. T9 integration

`dndCharacterToLiteActorSheet` includes derived Actions in the existing `DndLiteActorSheet`. The result still passes the existing sheet validator. The campaign UI displays the accepted-source Action and lets an explicit save create the existing campaign override.

## 17. T11 accepted-source gate

Weapon proficiencies and the typed equipment-reference block are included in combat-relevant source hashing and review. Live fallback derives from the campaign's accepted snapshot. Changes in the Character source are reviewable and cannot affect combat until accepted.

## 18. Campaign override precedence

One centralized selector chooses sheet authority. If the campaign override key is present, that payload wins, including a custom Action, an intentionally empty `actions: []`, or a malformed value. Accepted-source derivation is allowed only when the override key is absent. No merge semantics were added.

## 19. T12 server-authoritative integration

Both Action listing and attack declaration call the same authority selector. The browser sends only intent identifiers and roll mode. T12 reloads the authoritative Action from the campaign override or accepted-source chain, performs authorization and D&D resolution on the server, applies HP atomically, and appends one resolved runtime event. Hostile submitted fields such as `attackBonus: 999` and `damageFormula: 999d999` are ignored by the intent boundary and covered by the HTTP authority smoke.

## 20. Legacy snapshot compatibility

The new block is optional and does not change the Character schema version. Old snapshots decode without migration and simply derive no equipment Action when they lack typed references. Legacy inventory strings remain available for display/compatibility.

## 21. Real browser evidence

The verified browser path was Creator → level-1 Rogue → canonical dagger equipment → Actor Vault → accepted campaign source → live Player Character → derived dagger shortcut → T12 attack, with no GM-authored attack. The derived card showed attack bonus +4 and `1d4+2` piercing. The first attack hit with total 17, rolled 5 piercing damage, and changed the target from 20 to 15 HP.

- [Accepted derived Action card](dnd-character-action-derivation/01-derived-action-card.png)
- [Live derived attack shortcut](dnd-character-action-derivation/02-live-derived-attack-shortcut.png)
- [Authoritative T12 result](dnd-character-action-derivation/03-authoritative-attack-result.png)
- [Free-text import refused](dnd-character-action-derivation/04-free-text-refused.png)

## 22. Restart and recovery

The PostgreSQL-backed room server was restarted with the repository environment. Startup restored the lobby, actor admission, RuntimeLog, and map events. The same room and accepted Character reconnected with the same derived Action ID and no campaign override. A second T12 attack after restart hit with total 12, rolled 4 piercing damage, and changed the target from 15 to 11 HP.

- [Post-restart derived T12 attack](dnd-character-action-derivation/05-post-restart-derived-attack.png)

## 23. Tests and builds

Closure verification passed:

- weapon derivation: 22/22 checks
- Character → Lite Sheet: 99/99 checks
- combat-relevant snapshot fields: 129 assertions
- T11 source hash: 73 assertions
- T11 source review: 79 assertions
- T12 HTTP/authority, boundaries, resolver, kernel/recovery, intent idempotency, visibility, and rendering smokes
- actor runtime projection: 47/47 checks
- campaign actor override: 6/6 checks
- D&D level-one Character and Actor Vault cloud sync smokes
- `npx tsc --noEmit`
- Node server production build
- Vite production frontend build
- local doctor and PostgreSQL readiness: 12 migrations applied, 0 pending, 11/11 schema groups ready

## 24. Remaining limitations

V1 derives only an equipped, canonical, source-backed dagger melee attack. Other weapons, unrecognized custom items, legacy free-text equipment, unequipped weapons, thrown/ranged dagger behavior, range, ammunition, retrieval, weapon mastery, resistance, vulnerability, and broader equipment semantics remain unsupported. Manual campaign actor Actions continue to work through the existing override and remain authoritative when present.
