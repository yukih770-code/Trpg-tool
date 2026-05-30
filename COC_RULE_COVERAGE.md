# COC Rule Coverage Matrix

Last updated: 2026-05-31

## 1. Purpose

This file records Call of Cthulhu 7th Edition rule coverage in the current project: implemented layers, gaps, priorities, and recommended next steps.

It is a planning and freeze document. It does not implement rules, UI, store state, schema, migration, Keeper Console, or gameplay automation.

## 2. Coverage Level Definitions

| Level | Meaning |
|---:|---|
| Level 0 | Not implemented. |
| Level 1 | Static text / pure data exists. |
| Level 2 | State container exists. |
| Level 3 | Pure function calculation exists. |
| Level 4 | Runtime state / store actions are wired. |
| Level 5 | UI is operable, but Keeper judgment is still required. |
| Level 6 | Complete automated rules loop. |

## 3. Character Creation Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Basic information | 5 | CocCreator captures basic investigator info. | Needs later polish only. | P0 |
| Attribute generation | 5 | Creator supports rolling characteristics. | Age adjustments and EDU improvement are not integrated. | P0 |
| HP / MP / SAN / Luck derived values | 4 | Derived values are written during creation; runtime foundation exists. | Runtime panel not wired in CocGameplay. | P0 |
| Occupation selection | 1 | Occupation text field exists. | No structured occupation table. | P1 |
| Occupational skill points EDU x 4 | 5 | Creator Skill Point Constraint v1 implemented. | No occupation-specific allowed skill list. | P0 |
| Personal interest skill points INT x 2 | 5 | Creator Skill Point Constraint v1 implemented. | No advanced validation beyond budget and cap. | P0 |
| Initial skill values | 5 | Base values and allocated values are saved. | Some special skills need deeper rule handling later. | P0 |
| Creation-time skill cap | 5 | Creation cap is currently 90. | Cap is local Creator policy, not broader rules module. | P1 |
| Occupation skill restrictions | 0 | Not implemented. | Needs structured occupation definitions. | P2 |
| Credit Rating range | 0 | Not implemented. | Needs occupation table and range validation. | P2 |
| Age adjustments | 0 | Not implemented. | Needs age rule workflow. | P2 |
| EDU improvement check | 0 | Not implemented. | Needs creation-time improvement workflow. | P2 |
| Backstory fields | 5 | Sheet supports maintenance. | No structured clue/relationship model. | P1 |
| Assets / equipment | 4 | Sheet supports inventory and finance maintenance. | No structured equipment/economy automation. | P2 |

Runtime Foundation v2, Creator Skill Point Constraint v1, and Sheet Responsibility Cleanup v1 are complete. Full occupation tables, Credit Rating ranges, age adjustments, and EDU improvement checks remain deferred.

## 4. Sheet Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Characteristic display | 5 | Sheet displays characteristics with half/fifth. | No roll behavior, by design. | P0 |
| Skill display | 5 | Skills are read-only on Sheet. | No inline skill editing, by design. | P0 |
| Half / fifth | 5 | Displayed for characteristics and skills. | None for current Sheet scope. | P0 |
| HP / MP / SAN / Luck display | 5 | Displayed read-only with runtime-first fallback. | Runtime operations belong in Gameplay. | P0 |
| Runtime-first display | 5 | Sheet prefers `character.runtime` when present. | No runtime mutation on Sheet. | P0 |
| Growth marks | 4 | Uses `runtime.skillGrowthMarks`. | No automatic improvement check. | P1 |
| Backstory maintenance | 5 | Editable on Sheet. | No structured story graph. | P1 |
| Inventory maintenance | 5 | Editable text inventory. | No structured equipment system. | P2 |
| Asset maintenance | 5 | Finance fields remain editable. | No economy automation. | P2 |
| Sheet-side rolls removed | 5 | Sheet no longer owns roll/toast checks. | Gameplay RollConsole still needed. | P0 |
| Sheet-side unrestricted skill editing removed | 5 | Skill values are no longer direct inputs. | Downtime growth workflow deferred. | P0 |

Sheet Responsibility Cleanup v1 is complete. Sheet is display plus downtime maintenance; it does not own checks or unrestricted creation-time skill editing.

## 5. Gameplay Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Runtime state panel | 0 | Not wired. | Needs CocGameplay runtime panel. | P0 |
| HP / MP / SAN / Luck changes | 4 | Store actions exist. | CocGameplay does not use them yet. | P0 |
| Major Wound / Dying / Unconscious | 4 | Runtime flags and HP delta utility exist. | Gameplay prompts/UI not wired. | P1 |
| Temporary / Indefinite Insanity flags | 2 | Runtime flags exist. | No full insanity workflow. | P2 |
| Skill Checks | 3 | Pure function exists; existing UI is not contract-aligned. | Needs RollConsole/RuntimeLogEntry integration. | P0 |
| SAN Check | 3 | SAN loss parser exists. | No SAN Check UI/workflow. | P1 |
| Luck Check | 3 | d100 evaluator can cover checks. | No dedicated Luck Check UI. | P1 |
| Luck spending | 4 | Luck current/action exists. | No spending UI/rule validation. | P1 |
| Pushed Roll | 2 | `pushedRollContext` exists. | No UI or consequence workflow. | P2 |
| Growth marks from successful checks | 2 | Growth mark state exists. | No automatic eligibility or marking from checks. | P2 |
| RollConsole | 0 | Not wired for COC. | Needs DND-style player RollConsole. | P0 |
| RuntimeLogEntry[] | 0 | Not wired for COC. | Needs structured log migration. | P0 |
| Latest Result | 0 | Not wired for COC. | Needs RollConsole. | P0 |
| History Log | 1 | Existing logs may be strings. | Needs RuntimeLogEntry. | P0 |
| Result visibility | 0 | Documented only. | No filtering/reveal. | P3 |
| Keeper Console boundary | 1 | Documented. | No Keeper Console implementation. | P3 |

Runtime state and store actions have a foundation, but CocGameplay is not yet wired to runtime actions, RollConsole, or RuntimeLogEntry. Keeper Console and `gmOnly` visibility remain deferred.

## 6. Skill Check Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| d100 | 3 | Pure function exists. | Needs unified UI/log wiring. | P0 |
| Critical | 3 | Evaluator returns critical. | Needs COC RollConsole display. | P0 |
| Extreme | 3 | Evaluator returns extreme. | Needs COC RollConsole display. | P0 |
| Hard | 3 | Evaluator returns hard. | Needs COC RollConsole display. | P0 |
| Regular | 3 | Evaluator returns regular. | Needs COC RollConsole display. | P0 |
| Failure | 3 | Evaluator returns failure. | Needs COC RollConsole display. | P0 |
| Fumble | 3 | Evaluator returns fumble. | Needs COC RollConsole display. | P0 |
| Target value | 3 | Evaluator accepts target value. | Needs UI wiring. | P0 |
| Bonus / penalty dice | 0 | Not implemented. | Needs COC-specific roll UI and evaluator. | P1 |
| Opposed rolls | 0 | Not implemented. | Needs target/opposed result model. | P2 |
| Pushed roll | 2 | Context container exists. | No UI or consequences. | P2 |
| Luck spending after failure | 2 | Luck state/action exists. | No rule UI or validations. | P1 |
| Growth mark eligibility | 2 | Growth mark state exists. | No automatic mark from successful checks. | P2 |

## 7. SAN / Insanity Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| SAN Check | 3 | SAN loss parser exists; d100 evaluator exists. | No integrated UI. | P1 |
| SAN loss expression | 3 | Basic parser/roller exists. | Complex expressions need later support. | P1 |
| Success/failure loss | 3 | Parser separates success/failure expressions. | No UI integration. | P1 |
| Single SAN loss 5+ prompt | 0 | Not implemented. | Needs temporary insanity prompt. | P2 |
| INT check for temporary insanity | 0 | Not implemented. | Needs workflow. | P2 |
| One-day cumulative 1/5 initial SAN loss | 0 | Not implemented. | Needs session/day tracking. | P3 |
| Bout of Madness | 0 | Not implemented. | Needs table/workflow. | P3 |
| Insanity symptom tables | 0 | Not implemented. | Needs data and Keeper control. | P3 |
| Manual flags | 2 | Runtime flags exist. | UI not wired. | P1 |

SAN loss parser and runtime flags exist. Full insanity automation is deferred, and Keeper judgment remains necessary.

## 8. HP / Major Wound / Dying Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| HP current | 4 | Runtime state/action exists. | Gameplay UI not wired. | P0 |
| Damage / healing | 4 | `changeHp` and `applyCocHpDelta` exist. | Gameplay UI not wired. | P0 |
| Major Wound | 3 | Pure function detects trigger. | UI/prompt not wired. | P1 |
| Unconscious | 3 | Pure function derives flag. | UI/prompt not wired. | P1 |
| Dying | 3 | Pure function derives flag. | UI/prompt not wired. | P1 |
| CON roll to avoid death | 0 | Not implemented. | Needs death workflow. | P2 |
| First Aid | 0 | Not implemented. | Needs skill workflow and healing limits. | P2 |
| Medicine | 0 | Not implemented. | Needs skill workflow and healing limits. | P2 |
| Natural healing | 0 | Not implemented. | Needs downtime workflow. | P2 |
| Damage history | 0 | Not implemented. | Needs log/history model. | P3 |

## 9. Luck / Pushed Roll / Growth Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Luck current | 4 | Runtime state/action exists. | Gameplay UI not wired. | P0 |
| Luck spending | 2 | State exists. | No UI, restrictions, or post-failure workflow. | P1 |
| Luck check | 3 | d100 evaluator can support it. | No dedicated UI/log integration. | P1 |
| Forbidden Luck spend cases | 0 | Not implemented. | Needs rule-specific validation. | P2 |
| Pushed Roll eligibility | 2 | Context state exists. | No eligibility UI. | P2 |
| Pushed Roll consequences | 0 | Not implemented. | Requires Keeper/AI/host adjudication. | P2 |
| Skill growth marks | 4 | Runtime marks and Sheet checkbox exist. | No auto mark from checks. | P1 |
| Improvement check | 0 | Not implemented. | Needs downtime growth phase. | P2 |
| 1d10 improvement | 0 | Not implemented. | Needs growth resolution workflow. | P2 |

## 10. Keeper Console / Hidden Results Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| `gmOnly` visibility | 1 | Documented architecture only. | No implementation. | P3 |
| Hidden Psychology roll | 0 | Not implemented. | Future Keeper Console. | P3 |
| Hidden clue checks | 0 | Not implemented. | Future Keeper Console / scene layer. | P3 |
| Reveal full result | 0 | Not implemented. | Future visibility/reveal workflow. | P3 |
| Reveal outcome only | 0 | Not implemented. | Future visibility/reveal workflow. | P3 |
| Reveal narration only | 0 | Not implemented. | Future visibility/reveal workflow. | P3 |
| Keeper notes | 0 | Not implemented. | Future Host Console. | P3 |
| NPC / monster | 0 | Not implemented. | Future Host Console / target layer. | P3 |
| Scene / clue management | 0 | Not implemented. | Future module/scene layer. | P3 |

All Keeper Console and hidden-result features are deferred. They do not belong in Player Gameplay.

## 11. RuntimeLogEntry Payload Recommendation

Recommended COC payload fields:

- `d100`
- `skillName`
- `skillValue`
- `successLevel`
- `isCritical`
- `isFumble`
- `isPushed`
- `luckSpent`
- `sanLoss`
- `hpChange`
- `mpChange`
- `majorWoundTriggered`
- `insanityTriggered`

Priority guidance:

- P0: `d100`, `skillValue`, `successLevel`, `outcome`
- P1: `luckSpent`, `isPushed`, `sanLoss`, `hpChange`
- P2/P3: full insanity details and Keeper reveal metadata

## 12. Recommended Next Steps

1. COC Runtime State UI Panel v1
2. COC Gameplay RollConsole RuntimeLogEntry v1
3. COC Skill Check Wiring v1
4. COC SAN Check v1
5. COC Luck Spending v1
6. COC Pushed Roll v1
7. COC Insanity Flags / Prompts v1
8. Keeper Console later

## 13. Current Freeze Note

This document records rule coverage only. It does not lift the project freeze. Freeze exit still requires `CPRED_RULE_COVERAGE.md` to exist and both COC/CPRED rule coverage documents to be reviewed, followed by `IMPLEMENTATION_ROADMAP.md` defining the next code phase.

