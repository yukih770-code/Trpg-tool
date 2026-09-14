# D&D Weapon Coverage Audit and Safe Expansion V1

## 1. Executive verdict

**PASS — DAGGER REMAINS THE ONLY SAFE COVERAGE.**

The approved local registry contains 38 canonical weapon definitions. Only `weapon.dagger` has the complete authoritative chain required to materialize a T12 Action. The other 37 rows are explicitly display-only and lack a sourced executable weapon profile, canonical Action, canonical damage Effect, governing-ability rule, and executable mode definition. No new weapon Action was added.

The audit did find and fix a separate Creator identity/quantity defect affecting counted choice options. This preserves canonical IDs for existing approved items without treating those items as executable weapons.

## 2. Approved sources inspected

- `src/data/dnd2024/equipment.ts`: 38 owner-source-matched catalog weapon rows, explicitly marked `usagePolicy: display-only`.
- `src/lib/dnd2024/dndItemDefinitions.ts` and `dndItemRegistry.ts`: canonical identities, normalized simple/martial category, equipment slots, and the dagger-only gameplay bridge.
- `src/lib/dnd2024/gameplay/dndActionDefinitions.ts` and `dndEffectDefinitions.ts`: canonical dagger melee/thrown Actions and shared piercing damage Effect.
- gameplay Action, Effect, weapon-profile, and dice types.
- `CharacterData`, `dndEquipmentSnapshotV1`, resolved weapon proficiencies, and typed inventory/equip state.
- Creator starter parsing, canonical resolution, and materialization.
- T9 Character → Lite Sheet derivation, T11 combat-relevant hash/review, campaign override selection, runtime actor projection, and T12 server Action lookup.

No external source or model-memory D&D rule was used.

## 3. Complete weapon coverage matrix

The reproducible, field-complete matrix is [weapon-coverage-matrix.json](dnd-weapon-coverage-v1/weapon-coverage-matrix.json). It records all requested fields and blocking reasons for every weapon. The table below is the human-readable projection.

Legend:

- **Action/Effect:** canonical sourced gameplay definition exists.
- **Dice/Type:** executable-approved value exists. Every other row has numeric/type text only in the explicitly display-only catalog; that text is recorded separately in the JSON and is not executable authority.
- **Ability:** governing ability options are explicitly represented.
- **Prof:** canonical simple/martial identity maps to the accepted Character's resolved proficiency vocabulary.
- **Mode:** executable Action mode represented, rather than a display hint inferred from category/property text.
- **Schema/T12:** the current Action/T12 path is proven to express and resolve the represented mode without new rule logic. `N` means unproven with current definitions, not necessarily that the TypeScript shape could never be extended.
- **Creator/Snapshot:** an exact canonical label/ID can retain `definitionId`; compound starter bundles are audited separately below.

| Canonical ID | Label | Action | Effect | Dice | Type | Ability | Prof | Mode | Special/property text | Creator | Snapshot | Schema | T12 | Classification |
|---|---|---:|---:|---:|---:|---:|---:|---|---|---:|---:|---:|---:|---|
| `weapon.club` | 短棒 | N | N | N | N | N | Y | — | 轻型 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.dagger` | 匕首 | Y | Y | Y | Y | Y | Y | melee/thrown | 灵巧、轻型、投掷 | Y | Y | Y | Y | `SAFE_NOW` |
| `weapon.greatclub` | 巨棒 | N | N | N | N | N | Y | — | 双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.handaxe` | 手斧 | N | N | N | N | N | Y | — | 轻型、投掷 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.javelin` | 标枪 | N | N | N | N | N | Y | — | 投掷 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.light-hammer` | 轻锤 | N | N | N | N | N | Y | — | 轻型、投掷 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.mace` | 硬头锤 | N | N | N | N | N | Y | — | — | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.quarterstaff` | 长棍 | N | N | N | N | N | Y | — | 多用（1d8） | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.sickle` | 镰刀 | N | N | N | N | N | Y | — | 轻型 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.spear` | 矛 | N | N | N | N | N | Y | — | 投掷、多用（1d8） | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.dart` | 飞镖 | N | N | N | N | N | Y | — | 灵巧、投掷 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.light-crossbow` | 轻弩 | N | N | N | N | N | Y | — | 弹药、装填、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.shortbow` | 短弓 | N | N | N | N | N | Y | — | 弹药、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.sling` | 投石索 | N | N | N | N | N | Y | — | 弹药 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.battleaxe` | 战斧 | N | N | N | N | N | Y | — | 多用（1d10） | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.flail` | 链枷 | N | N | N | N | N | Y | — | — | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.glaive` | 长柄刀 | N | N | N | N | N | Y | — | 重型、触及、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.greataxe` | 巨斧 | N | N | N | N | N | Y | — | 重型、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.greatsword` | 巨剑 | N | N | N | N | N | Y | — | 重型、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.halberd` | 戟 | N | N | N | N | N | Y | — | 重型、触及、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.lance` | 骑枪 | N | N | N | N | N | Y | — | 重型、触及、骑乘双手例外 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.longsword` | 长剑 | N | N | N | N | N | Y | — | 多用（1d10） | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.maul` | 巨锤 | N | N | N | N | N | Y | — | 重型、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.morningstar` | 钉头锤 | N | N | N | N | N | Y | — | — | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.pike` | 长矛 | N | N | N | N | N | Y | — | 重型、触及、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.rapier` | 刺剑 | N | N | N | N | N | Y | — | 灵巧 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.scimitar` | 弯刀 | N | N | N | N | N | Y | — | 灵巧、轻型 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.shortsword` | 短剑 | N | N | N | N | N | Y | — | 灵巧、轻型 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.trident` | 三叉戟 | N | N | N | N | N | Y | — | 投掷、多用（1d10） | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.warpick` | 战镐 | N | N | N | N | N | Y | — | 多用（1d10） | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.warhammer` | 战锤 | N | N | N | N | N | Y | — | 多用（1d10） | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.whip` | 鞭 | N | N | N | N | N | Y | — | 灵巧、触及 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.blowgun` | 吹箭筒 | N | N | N | N | N | Y | — | 弹药、装填；catalog uses flat damage | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.hand-crossbow` | 手弩 | N | N | N | N | N | Y | — | 弹药、轻型、装填 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.heavy-crossbow` | 重弩 | N | N | N | N | N | Y | — | 弹药、重型、装填、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.longbow` | 长弓 | N | N | N | N | N | Y | — | 弹药、重型、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.musket` | 火铳 | N | N | N | N | N | Y | — | 弹药、装填、双手 | Y | Y | N | N | `MISSING_APPROVED_DATA` |
| `weapon.pistol` | 手铳 | N | N | N | N | N | Y | — | 弹药、装填 | Y | Y | N | N | `MISSING_APPROVED_DATA` |

Classification totals: `SAFE_NOW: 1`, `MISSING_APPROVED_DATA: 37`, and zero for `ACTION_SCHEMA_LIMITATION`, `CREATOR_IDENTITY_LIMITATION`, `RULE_ENGINE_LIMITATION`, or `DEFERRED_COMPLEX_MODE`. Classification uses the first blocking gate. Secondary schema/rule complexities are still recorded so they can be addressed after the missing approved gameplay definitions exist.

## 4. SAFE_NOW weapons

Only `weapon.dagger`, and only its melee mode, is supported. It retains the established canonical Action ID `action.item.dagger.melee-weapon-attack`. Two ordinary canonical dagger records still produce one type-level Action.

## 5. Unsupported weapons and blocking categories

All other canonical weapons are `MISSING_APPROVED_DATA`. Their catalog rows prove display labels and display table fields, but the catalog explicitly prohibits executable use. They lack source-backed `weaponProfile` data, canonical Actions, canonical damage Effects, approved governing-ability options, and executable modes.

Secondary work that would remain after adding approved definitions:

- Plain/light/finesse melee weapons need sourced gameplay profiles, canonical Actions/Effects, and explicit ability options.
- Versatile weapons need an authoritative wield/mode selection contract before alternate damage can be exposed.
- Thrown weapons need independent canonical melee/thrown modes plus range enforcement.
- Bows, crossbows, sling, blowgun, and firearms need ranged-mode, range-band, ammunition, and loading contracts that current T12 does not enforce.
- Reach/heavy/two-handed/mounted cases need honest mode/equipment restrictions where they materially affect attack availability.
- Blowgun needs an approved flat-damage representation accepted by the Character adapter; V1 currently accepts sourced dice only.
- Weapon mastery remains outside this task.

## 6. Creator canonical-identity audit

Exact canonical labels and IDs resolve for all 38 registry weapons and can cross `dndEquipmentSnapshotV1`. The audit found four additional defects in current class starter choice strings:

- Barbarian `两把手斧` lost quantity 2.
- Fighter `两把手斧` lost both its canonical identity and quantity because it followed `或`.
- Paladin `5根标枪` lost quantity 5.
- Ranger `两把短剑` lost quantity 2.

The parser now splits a choice first and reads each option's explicit leading count/counter independently. Canonical IDs and quantities are retained. Existing fixed-item cases—Rogue two daggers, Warlock two handaxes, and Monk ten darts—remain correct.

Compound strings such as `轻弩与20支弩矢`, `短弓及20支箭`, and `长弓及20支箭` remain unresolved because they combine weapon and ammunition without a fully approved materialization contract. Abstract choices such as `两把军用武器` and unknown source text such as `两支刃` also remain unresolved. No fuzzy weapon inference was added.

## 7. Fixes applied

- Added a repeatable audit generator that reads the canonical registries and emits the machine-readable matrix without copying the weapon table.
- Preserved per-option starter equipment quantity while resolving exact canonical labels.
- Added focused regression coverage for counted choices, counted fixed items, unresolved compound bundles, and unknown source text.
- Added no weapon gameplay definition or T12 rule.

## 8. Derivation architecture and stable IDs

The existing pure seam is unchanged:

```text
accepted Character snapshot
→ typed equipped definition references
→ approved D&D item/action/effect definitions
→ Character-specific modifiers
→ DndLiteActorAction
→ campaign authority selector
→ runtime actor
→ T12
```

The derivation remains definition-driven. It does not contain a weapon-ID switch or a second weapon table. Dagger identity remains canonical, deterministic, and type-level.

## 9. Ability, proficiency, and damage handling

- Ability selection considers only explicitly sourced profile options. Dagger retains higher STR/DEX modifier selection with source-order tie handling.
- Proficiency reads the accepted Character's resolved weapon proficiency facts and the canonical item's simple/martial identity. Class progression rules are not rerun.
- Damage follows canonical Action → canonical Effect → Character-specific allowed modifier. T12 critical rolling is unchanged.

No other weapon has enough approved data to enter these steps.

## 10. Multi-mode policy

Dagger's canonical thrown Action remains present as approved data but is not materialized because T12 cannot enforce range or ammunition. No versatile, thrown, ranged, loading, reach, mounted, or mastery mode was flattened into a misleading basic Action.

## 11. T9, T11, override, and T12 behavior

- T9 continues deriving only through `dndCharacterToLiteActorSheet`; the runtime UI has no independent weapon derivation.
- T11 continues hashing/reviewing typed equipment references and weapon proficiency. Unaccepted source changes cannot alter the accepted Action.
- Any campaign D&D sheet override remains the complete authority, including custom Actions, `actions: []`, and malformed/legacy content under the existing policy. No merge was introduced.
- T12 still owns authorization, roll mode, RNG, AC comparison, criticals, damage, HP mutation, RuntimeLog, idempotency, and replay. The client cannot submit authoritative weapon statistics.

## 12. Tests and builds

Focused closure results:

- weapon coverage matrix invariant: 38 canonical weapons, 1 `SAFE_NOW`, dagger only
- starter equipment plan: 12 checks
- existing dagger derivation: 22/22 checks
- Character → Lite Sheet: passed
- T11 source hash/review: passed
- campaign override and runtime actor projection: passed
- T12 HTTP/authority, resolver, boundary, intent, kernel/recovery, visibility, and rendering: passed
- TypeScript typecheck: passed
- server production build: passed
- frontend production build: passed

## 13. Real browser acceptance

Because no additional `SAFE_NOW` weapon exists, no new-weapon browser result was fabricated. A real browser regression check reopened the persisted accepted `Derived Dagger Hero` campaign card and confirmed the existing derived dagger Action remained present with +4 attack and `1d4+2` piercing damage, without a campaign Action override.

- [Dagger Action browser regression](dnd-weapon-coverage-v1/01-dagger-regression-browser.png)
- [Accepted-source derived summary](dnd-weapon-coverage-v1/02-dagger-derived-summary.png)

The previously committed end-to-end result remains the authoritative acceptance evidence: dagger attack total 17, 5 piercing damage, target HP 20 → 15; after restart, total 12, 4 piercing damage, target HP 15 → 11.

## 14. PostgreSQL and restart

No schema or persistence change was required. The existing accepted Character snapshot and campaign actor paths remain in use. Local PostgreSQL reports 12 migrations applied, 0 pending, and all 11 schema groups ready. The committed dagger path already passed server restart/reconnect and a post-restart T12 attack.

## 15. Remaining limitations

Authoritative Character-derived coverage remains dagger melee only. Display-only weapon rows are not executable. Free-text inventory cannot generate Actions. Ranged/thrown/versatile/ammunition/loading/reach/mounted/mastery behavior remains deferred, as do magic weapons, per-instance modifiers, resistance, vulnerability, dual wielding, and action economy.

## 16. Recommended next data-contract work

Expansion should begin with an owner-source extraction into executable definitions, not derivation code:

1. Add source-backed `weaponProfile` records with typed dice/type, explicit ability options, and canonical mode references.
2. Add canonical Action and damage Effect definitions with matching `sourceRef` for a coherent group of simple melee weapons.
3. Verify exact Character proficiency vocabulary against those canonical categories.
4. Add explicit wield-mode data before versatile weapons.
5. Add range/ammunition/loading enforcement to the D&D/T12 contract before ranged and thrown modes.
6. Add a typed flat-damage contract before considering blowgun.
7. Only then rerun this matrix and promote rows whose entire chain becomes provable.
