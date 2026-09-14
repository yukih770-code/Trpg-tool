# D&D Weapon Gameplay Profiles V1

## 1. Executive verdict

**PASS — GAMEPLAY PROFILE COVERAGE EXPANDED.** The approved local source supports three additional property-free melee profiles: `weapon.mace`, `weapon.flail`, and `weapon.morningstar`. Together with the existing dagger melee profile, the current registry has 4 `SAFE_NOW` weapons out of 38 canonical definitions. A real Mace Character reached the Action Dock and resolved through T12 before and after backend restart.

## 2. Previous 1/38 baseline

The committed Weapon Coverage Audit baseline was 38 canonical weapon definitions, 1 `SAFE_NOW` weapon (`weapon.dagger` melee), and 37 `MISSING_APPROVED_DATA` definitions. Commits `84bf2ad` and `6a3a457` preserve that audit checkpoint. This task leaves the baseline visible and records a current result of 4 `SAFE_NOW` and 34 `MISSING_APPROVED_DATA`.

## 3. Approved source provenance

`docs/rule-sources/DND_SOURCES.md` designates the owner-provided local CHM extraction at `C:\TRPG_CHM_WORK\extracted` as the primary D&D authority, source ID `dnd-local-chm-primary`. The canonical catalog rows in `src/data/dnd2024/equipment.ts` are owner-source-matched. Runtime use was previously deferred by their display-only policy; this task normalizes only the reviewed cohort through the existing gameplay contracts.

| Approved local source | Fields used | SHA-256 |
|---|---|---|
| `玩家手册2024/装备/武器.htm` | canonical identity, category, melee mode, dice, damage type, empty property list | `DFFA4E8D79C3A97C18FBD3631045A9DDD318A916A960A19C53F8BF2191EC89F7` |
| `玩家手册2024/进行游戏/攻击检定.htm` | ordinary melee Strength attack and proficiency addition | `A68E5D5A5772612FA80292B98CF1A33DB04ACA9F3C66E5E539CF6AED93674DDC` |
| `玩家手册2024/进行游戏/伤害掷骰.htm` | add the attack ability modifier to weapon damage | `A180381967EBDDEF252D0AFD0A44D040307759694739363EE966C6A9A3BBBBB6` |
| `玩家手册2024/术语汇编/其他术语.htm` | canonical Bludgeoning/Piercing damage-type vocabulary | `7F5E4DB04CAFE2C911597C925BABF45972BEA3955117F2494C7EB1720E4101CC` |

No external page or model-memory rule supplied executable data.

## 4. Selected cohort: mace, flail, and morningstar

| Weapon | Canonical ID | Category | Source damage | Properties |
|---|---|---|---|---|
| 硬头锤 / Mace | `weapon.mace` | simple melee | 1d6 bludgeoning | none |
| 链枷 / Flail | `weapon.flail` | martial melee | 1d8 bludgeoning | none |
| 钉头锤 / Morningstar | `weapon.morningstar` | martial melee | 1d8 piercing | none |

## 5. Why this cohort was safe

Each row has one ordinary melee attack mode and no listed weapon property. The profiles require no range bands, ammunition, loading, finesse choice, thrown mode, versatile damage, reach, heavy/two-handed restriction, mounted exception, mastery execution, per-instance state, or new action-economy rule. Every field required by the existing Action, Effect, Character derivation, and T12 contracts is therefore present in the approved sources.

## 6. Canonical item definitions

`dndStandardMeleeWeaponProfiles.ts` selects the three canonical IDs and reads their dice, localized damage type, category, and display name from `DND_BASIC_WEAPONS`. It rejects a row unless its source identity, source reference, melee category, empty property list, missing range, dice shape, and damage-type mapping match the reviewed contract. `dndItemDefinitions.ts` attaches the generated `weaponProfile` and `actionRefs` to the existing canonical item rows; it does not introduce a second weapon table.

## 7. Action definitions

Each item exposes exactly one sourced creature-targeting weapon Action with Action cost, AC as target defense, Strength as the roll ability, and one canonical Effect reference:

- `action.item.mace.melee-weapon-attack`
- `action.item.flail.melee-weapon-attack`
- `action.item.morningstar.melee-weapon-attack`

The centralized `dndActionDefinitions.ts` registry consumes these definitions. No frontend-only or server-only action registry was added.

## 8. Effect definitions

The centralized Effect registry receives:

- `effect.item.mace.bludgeoning-damage` → 1d6 bludgeoning
- `effect.item.flail.bludgeoning-damage` → 1d8 bludgeoning
- `effect.item.morningstar.piercing-damage` → 1d8 piercing

Dice and damage type come from the canonical catalog row. Character derivation adds the allowed ability modifier; T12 retains its existing critical and damage behavior.

## 9. Ability rules

The three profiles expose only `abilityOptions: ['str']`, supported by the approved attack-roll source for ordinary melee weapon attacks. The existing derivation chooses only abilities listed by the profile. Dagger keeps its existing STR/DEX selection behavior unchanged.

## 10. Proficiency mapping

The existing simple/martial mapping remains authoritative. A Character proficient with `简易武器` receives proficiency for Mace; `军用武器` covers Flail and Morningstar. The data-driven suite proves proficient and non-proficient results for every new profile. No class progression rule is rerun.

## 11. Stable identity

Item → Action → Effect references use deterministic canonical IDs. Duplicate equipped instances collapse to one type-level Action, and serialized snapshots derive byte-equivalent action payloads. The existing dagger IDs remain unchanged.

## 12. Coverage classifier changes

The audit no longer hardcodes that Dagger must be the only safe weapon. It validates the 38-row catalog and count consistency, then classifies from actual definition completeness. A row is `SAFE_NOW` only when its sourced weapon profile, canonical Action and Effect, governing ability, proficiency mapping, executable mode, schema fit, and T12 compatibility all pass.

## 13. Creator identity behavior

The real canonical Creator generated Cleric starter equipment, retained `definitionId: 'weapon.mace'`, materialized one Mace, and equipped it in `mainHand`. The accepted snapshot also retained that exact ID and slot. Legacy free-text inventory remains unable to fabricate an Action.

## 14. Browser integration bug discovered

The first Action Dock attempt showed no attack action for the newly admitted Mace combatant. The exact trace showed:

1. saved Character inventory: canonical `weapon.mace`, equipped `mainHand`;
2. accepted campaign actor snapshot: the same `dndEquipmentSnapshotV1` entry;
3. pure derivation: `action.item.mace.melee-weapon-attack`, `+4`, `1d6+2`, bludgeoning;
4. Character → Lite Sheet: the same action;
5. campaign `overridePayload`: `{}`;
6. RuntimeActorProjection: accepted Character source, unchanged since approval;
7. server `runtime/dnd-actions`: `[]` in the already-running server process;
8. Action Dock: empty action list from that response.

## 15. Exact root cause of the missing Mace Action

The first broken boundary was the server-side runtime action selector process. It was serving a `dist-server` build created before the new gameplay profiles were compiled, while the frontend and direct TypeScript suites were reading the current source tree. The durable actor, accepted snapshot, T9 derivation, authority selector, projection link, and override state were correct. This was stale running code, not a source-data, override, projection, or T12 defect.

## 16. Exact fix

The repository server production build was regenerated and the local backend was restarted through `scripts/dev-local.ps1 -Mode Backend`. The same campaign actor and combatant then returned the canonical Mace action from `runtime/dnd-actions`; no campaign sheet edit, fallback, fuzzy lookup, frontend derivation, or weapon-specific server patch was used.

## 17. T9

T9 remains the sole Character → `DndLiteActorSheet` materialization seam. The exact accepted Mace snapshot produces a valid Lite Sheet action with ID `action.item.mace.melee-weapon-attack`, attack bonus `+4`, damage formula `1d6+2`, and damage type `bludgeoning`. Flail and Morningstar pass the same data-driven valid-sheet integration.

## 18. T11

T11 behavior is unchanged. Review detects action-relevant changes, unaccepted Character changes cannot replace the accepted action, and accepting a changed source advances the derived action. The real Mace actor reported `sourceChangedSinceApproval: false` before and after restart.

## 19. Campaign override semantics

No campaign sheet override existed for the browser actor: `overridePayload` was `{}`. Existing precedence remains unchanged: when no D&D sheet override exists, the accepted-source derived sheet may provide Actions; when an override exists, it is complete authority, and `actions: []` intentionally blocks derived actions. The regression suite proves that empty-override behavior.

## 20. Runtime authority selector

The authoritative server follows the combatant/source link to `campaign_actor_3719889d-8603-48e9-b349-5eba74b893bf`, loads its accepted snapshot, calls the centralized D&D actor-sheet authority selector, and lists only authored/derived action IDs that can be resolved against the accepted action payload. After the current build loaded, the endpoint returned the stable Mace action before and after restart.

## 21. T12

T12 received the canonical Action and remained weapon-agnostic. It continued to own authorization, intent parsing, cryptographic RNG, AC comparison, hit/critical resolution, damage rolling, HP mutation, RuntimeLog append, idempotency, and replay. No `weapon.mace`, `weapon.flail`, or `weapon.morningstar` branch was added to T12.

## 22. Client-forgery protection

The profile suite submits hostile-looking `attackBonus`, `damageFormula`, and `damageType` fields with a Mace intent. `readDndAttackIntent` discards them, retaining only the intent ID, combatant IDs, canonical action ID, and mode. The resolver reloads the accepted authoritative Mace Action. The focused T12 HTTP suite also passed hostile-number and authority checks.

## 23. Real Mace browser result

The same `Mace Profile Hero` created through the canonical Character Creator was admitted to the existing `Derived Action Acceptance` room and placed into combat without a GM-authored Action.

| Attempt | Action | Server result | Damage | Target HP |
|---|---|---|---|---|
| current-build pre-persistence-restart | `action.item.mace.melee-weapon-attack` | natural 1, total 5, miss (`1 + 4`) | none | 11/20 → 11/20 |
| post-restart | same ID | roll 8, total 12, hit (`8 + 4`) | 1d6+2 bludgeoning; die 4; total 6 | 11/20 → 5/20 |

Browser evidence:

- `dnd-weapon-gameplay-profiles-v1/01-mace-approved-lobby.png`: accepted Mace Character in the lobby;
- `dnd-weapon-gameplay-profiles-v1/02-mace-action-ready.png`: Mace selected with the canonical action and Training Dummy target;
- `dnd-weapon-gameplay-profiles-v1/03-mace-attack-resolved.png`: authoritative natural-1 miss;
- `dnd-weapon-gameplay-profiles-v1/04-mace-post-restart-hit.png`: post-restart hit, 6 bludgeoning, target HP 5.

## 24. Restart and PostgreSQL result

After the first Mace event, the backend was stopped and relaunched through repository tooling. Startup recovery completed at `2026-09-14T14:19:23.253Z`, restoring 6 rooms, 1 admission, 12 RuntimeLog events across rooms, and 36 map events. The first Mace event remained at room sequence 10, the accepted actor still had equipped `weapon.mace`, the override remained `{}`, and the action endpoint returned the unchanged canonical ID. The second browser attack then resolved at room sequence 11.

`dev:local:doctor` and strict database readiness reported 12 applied migrations, 0 pending, dry-run plan count 0, and all 11 required schema groups ready. No migration was created or applied by this task.

## 25. Final coverage matrix

| State | Canonical weapons | `SAFE_NOW` | `MISSING_APPROVED_DATA` |
|---|---:|---:|---:|
| committed baseline | 38 | 1 | 37 |
| gameplay profiles V1 | 38 | 4 | 34 |

The exact `SAFE_NOW` set is `weapon.dagger` (melee only), `weapon.mace`, `weapon.flail`, and `weapon.morningstar`. The generated machine-readable matrix is `dnd-weapon-coverage-v1/weapon-coverage-matrix.json`.

## 26. Tests and builds

All required focused checks passed:

| Verification | Result |
|---|---|
| new gameplay-profile suite | 41/41 |
| coverage audit | 38 total; 4 `SAFE_NOW`; 34 missing |
| starter equipment plan | 12/12 |
| existing dagger derivation | 22/22 |
| Character → Lite Sheet | 99/99 |
| combat-relevant fields | 129 assertions |
| T11 source hash | 73 assertions |
| T11 source review | 79 assertions |
| runtime actor projection | 47 checks |
| campaign override | 6 checks |
| T12 HTTP, resolver, boundaries, intents, kernel/recovery, visibility, UI intents, rendering | all passed |
| canonical level-one Character | passed |
| TypeScript `tsc --noEmit` | passed |
| server production build | passed |
| frontend production build | 2,205 modules transformed; passed |
| local runtime/database doctor | ready |
| task-owned `git diff --check` | passed |

## 27. Remaining unsupported weapons and modes

The remaining 34 catalog rows stay non-executable until their complete approved gameplay contracts exist. Light/finesse weapons need their property behavior and ability options; versatile weapons need a wield-mode contract; thrown and ranged weapons need independent modes and range enforcement; bows, crossbows, sling, blowgun, and firearms need ammunition/loading handling; reach, heavy/two-handed, and mounted cases need availability restrictions; blowgun needs typed flat damage. Mastery, magic weapons, per-instance bonuses, resistance/vulnerability, dual wielding, and broader action economy remain outside V1.

## 28. Recommended next step

Normalize the next source-backed cohort only after its full property contract is represented. The most direct next architecture work is typed mode/range/ammunition support, followed by a fresh coverage audit that promotes only definitions whose item → Action → Effect → accepted Character → T12 chain is complete.
