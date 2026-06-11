# COC Rule Coverage Matrix

Last updated: 2026-06-11

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
| HP / MP / SAN / Luck derived values | 5 | Derived values are written during creation; runtime foundation and CocGameplay runtime panel exist. | Advanced workflows remain deferred. | P0 |
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
| Sheet-side rolls removed | 5 | Sheet no longer owns roll/toast checks. | Gameplay RollConsole now owns player-visible results. | P0 |
| Sheet-side unrestricted skill editing removed | 5 | Skill values are no longer direct inputs. | Downtime growth workflow deferred. | P0 |

Sheet Responsibility Cleanup v1 is complete. Sheet is display plus downtime maintenance; it does not own checks or unrestricted creation-time skill editing.

## 5. Gameplay Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| Runtime state panel | 5 | CocGameplay displays runtime HP / MP / SAN / Luck and flags. | Advanced workflows remain deferred. | P0 |
| HP / MP / SAN / Luck changes | 5 | CocGameplay uses existing runtime store actions. | No full SAN/Luck workflow automation. | P0 |
| Major Wound / Dying / Unconscious | 5 | Runtime flags can be displayed/toggled manually. | No automatic Keeper prompts or full medical workflow. | P1 |
| Temporary / Indefinite Insanity flags | 5 | Runtime flags can be displayed/toggled manually. | No full insanity workflow. | P2 |
| Skill Checks | 5 | Public skill checks run in CocGameplay and write RuntimeLogEntry results; successful checks can be marked for growth. | Advanced growth/campaign management remains deferred. | P0 |
| SAN Check | 5 | CocGameplay can run SAN Check, apply basic SAN loss, and write RuntimeLogEntry results. | Full insanity automation remains deferred. | P1 |
| Luck Check | 3 | d100 evaluator can cover checks. | No dedicated Luck Check UI. | P1 |
| Luck spending | 5 | Eligible failed skill checks can spend Luck to become regular success. | Advanced restrictions and Keeper approval deferred. | P1 |
| Pushed Roll | 2 | `pushedRollContext` exists. | No UI or consequence workflow. | P2 |
| Growth marks from successful checks | 5 | Successful public skill checks can be marked for growth in CocGameplay. | Keeper/campaign management remains deferred. | P1 |
| RollConsole | 5 | CocGameplay has a player RollConsole. | Keeper Console remains deferred. | P0 |
| RuntimeLogEntry[] | 5 | CocGameplay local logs use RuntimeLogEntry[]. | No store/schema persistence by design. | P0 |
| Latest Result | 5 | Derived from latest local RuntimeLogEntry. | No visibility filtering. | P0 |
| History Log | 5 | RuntimeLogEntry history is displayed in RollConsole. | No persistent session log. | P0 |
| Result visibility | 0 | Documented only. | No filtering/reveal. | P3 |
| Keeper Console boundary | 1 | Documented. | No Keeper Console implementation. | P3 |

Runtime state, store actions, player skill checks, basic SAN Check, basic Luck Spending, basic Growth Check, RollConsole, and local RuntimeLogEntry history are wired in CocGameplay. Keeper Console, `gmOnly` visibility, full campaign management, and full SAN / insanity automation remain deferred.

## 6. Skill Check Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| d100 | 5 | Public skill checks roll d100 in CocGameplay and log results. | Bonus/penalty dice remain deferred. | P0 |
| Critical | 5 | Evaluator returns critical and RollConsole displays the result. | None for current public skill-check scope. | P0 |
| Extreme | 5 | Evaluator returns extreme and RollConsole displays the result. | None for current public skill-check scope. | P0 |
| Hard | 5 | Evaluator returns hard and RollConsole displays the result. | None for current public skill-check scope. | P0 |
| Regular | 5 | Evaluator returns regular and RollConsole displays the result. | None for current public skill-check scope. | P0 |
| Failure | 5 | Evaluator returns failure and RollConsole displays the result. | None for current public skill-check scope. | P0 |
| Fumble | 5 | Evaluator returns fumble and RollConsole displays the result. | None for current public skill-check scope. | P0 |
| Target value | 5 | Skill value is used as the target for public skill checks. | Opposed/hidden targets remain deferred. | P0 |
| Bonus / penalty dice | 0 | Not implemented. | Needs COC-specific roll UI and evaluator. | P1 |
| Opposed rolls | 0 | Not implemented. | Needs target/opposed result model. | P2 |
| Pushed roll | 2 | Context container exists. | No UI or consequences. | P2 |
| Luck spending after failure | 5 | Eligible failed public skill checks can spend Luck to become regular success. | Advanced restrictions and Keeper approval deferred. | P1 |
| Growth mark eligibility | 5 | Successful public skill checks can create a pending growth mark prompt in CocGameplay. | Full Keeper review workflow deferred. | P1 |

## 7. SAN / Insanity Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| SAN Check | 5 | CocGameplay runs d100 SAN Check and writes RuntimeLogEntry results. | Keeper/hidden variants deferred. | P1 |
| SAN loss expression | 5 | Basic preset/custom expressions are supported in CocGameplay. | Complex expressions need later support. | P1 |
| Success/failure loss | 5 | Success/failure loss is applied through runtime SAN action. | Full insanity consequence flow deferred. | P1 |
| Single SAN loss 5+ prompt | 5 | RuntimeLogEntry detail warns about temporary insanity risk. | INT check and full temporary insanity workflow deferred. | P2 |
| INT check for temporary insanity | 0 | Not implemented. | Needs workflow. | P2 |
| One-day cumulative 1/5 initial SAN loss | 0 | Not implemented. | Needs session/day tracking. | P3 |
| Bout of Madness | 0 | Not implemented. | Needs table/workflow. | P3 |
| Insanity symptom tables | 0 | Not implemented. | Needs data and Keeper control. | P3 |
| Manual flags | 5 | Runtime flags can be displayed/toggled manually in CocGameplay. | Automatic insanity flagging deferred. | P1 |

Basic SAN Check and manual runtime flags exist in CocGameplay. Full insanity automation is deferred, and Keeper judgment remains necessary.

## 8. HP / Major Wound / Dying Coverage

| Rule Area | Current Level | Current Status | Gaps | Priority |
|---|---:|---|---|---|
| HP current | 5 | CocGameplay HP +/-1 is wired. | Broader HP workflow remains manual. | P0 |
| Damage / healing | 5 | CocGameplay HP manual adjustment is wired. | Auto major wound trigger and full medical workflow deferred. | P0 |
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
| Luck current | 5 | CocGameplay Luck +/-1 is wired. | Dedicated Luck Check UI remains deferred. | P0 |
| Luck spending | 5 | Eligible failed skill checks can spend Luck to become regular success. | Advanced restrictions and Keeper approval deferred. | P1 |
| Luck check | 3 | d100 evaluator can support it. | No dedicated UI/log integration. | P1 |
| Forbidden Luck spend cases | 0 | Not implemented. | Needs rule-specific validation. | P2 |
| Pushed Roll eligibility | 2 | Context state exists. | No eligibility UI. | P2 |
| Pushed Roll consequences | 0 | Not implemented. | Requires Keeper/AI/host adjudication. | P2 |
| Skill growth marks | 5 | Runtime marks, Sheet checkbox, and CocGameplay mark/clear controls exist. | Full campaign advancement remains deferred. | P1 |
| Improvement check | 5 | CocGameplay can run a marked skill growth check. | Keeper Console / campaign phase workflow deferred. | P1 |
| 1d10 improvement | 5 | Successful growth check applies raw `previousValue + 1d10` through existing skill update action. | Maximum skill cap 99 and occupation/archetype progression automation deferred. | P1 |

V1 note: improvement currently applies raw `previousValue + 1d10`; the COC 7e maximum skill cap of 99 is deferred.

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
- `growthRoll`
- `growthIncrease`
- `skillValueBefore`
- `skillValueAfter`

Priority guidance:

- P0: `d100`, `skillValue`, `successLevel`, `outcome`
- P1: `luckSpent`, `isPushed`, `sanLoss`, `hpChange`, growth check fields
- P2/P3: full insanity details and Keeper reveal metadata

## 12. Recommended Next Steps

1. COC Runtime State UI Panel v1
2. COC Gameplay RollConsole RuntimeLogEntry v1
3. COC Skill Check Wiring v1
4. COC SAN Check v1
5. COC Luck Spending v1
6. COC Pushed Roll v1
7. COC Growth Check v1
8. COC Insanity Flags / Prompts v1
9. Keeper Console later

## 13. Current Freeze Note

This document records rule coverage only. It does not lift project governance. Rule coverage owner docs now live under `docs/rules/`; implementation sequencing and active task scope are governed by `PROJECT_STATUS.md`, `AI_WORKFLOW.md`, and `docs/ai/ACTIVE_TASK.md`.
