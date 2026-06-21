# AI Implementation Execution Rules v1

<!-- AI-LANDMARK: AI_IMPLEMENTATION_EXECUTION_RULES_V1 -->

Last updated: 2026-06-21

Status: binding execution gate.

This document is an execution gate, not a passive reference. All future AI
implementation, audit, and documentation-governance tasks must read this
document and `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md` before modifying files or
reporting completion. Reports must explicitly state which rules were applied.

这是 AI 实现任务的强制执行规范，不是普通参考资料。后续任何涉及代码、
UI、store、runtime、repository、schema、导航、角色卡、战役、导入导出、
权限、多人、数据管理的任务，都必须读取并执行本规范。

This document does not implement UI, store, repository, runtime, schema,
migration, backend, permissions, multiplayer, import/export, campaign
membership, or rules behavior.

## 1. Level 0 Entry Gate

The following documents are global mandatory Level 0 execution gates:

1. `AI_IMPLEMENTATION_EXECUTION_RULES_V1.md`
2. `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md`

Every implementation, audit, and documentation-governance task must read both
Level 0 documents before editing files or reporting completion.

`AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md` defines which Level 1 documents are
triggered by the current task, which Level 2 documents require alignment, and
which Level 3 documents are reference only.

Mandatory Level 0 rules:

1. Every task must identify triggered Level 1 documents through the Matrix.
2. Every task must report the triggered Level 1 documents and related Level 2
   documents.
3. Final reports must use explicit `Compliance` sections, not only "read: yes".
4. If a Level 0 or triggered Level 1 document is missing, conflicting, or cannot
   be executed, the AI must stop and report instead of guessing.
5. Current repository state takes priority over old plans, old handoff text, and
   conversation memory.
6. UI shell does not equal real implementation.
7. Documentation contract does not equal code implementation.

## 2. Binding Contract Stack

The following contracts are execution constraints, not optional references:

1. `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md`
2. `REFERENCE_ARCHITECTURE_APPLICATION_GUIDE_V1.md`
3. `NAVIGATION_AND_EXIT_CONTRACT_V1.md`
4. `PLATFORM_INTERACTION_UI_CONTRACT_V1.md`
5. `CAMPAIGN_MEMBERSHIP_CONTRACT_V1.md`
6. `CHARACTER_SHEET_UX_CONTRACT_V1.md`
7. `DATA_MANAGEMENT_MVP_SCOPE_V1.md`

Every AI implementation, audit, or documentation-governance task must read the
Matrix and the relevant triggered contracts before editing.
When a task touches code, UI, store, repository, runtime, schema, navigation,
campaign entry, character sheet, import/export, permissions, multiplayer, or
data management, this execution gate must be read first.

## 3. Rule Priority

Apply rules in this order:

1. Safety / data integrity / no destructive action.
2. Current repository state and explicit user task scope.
3. Level 0: `AI_IMPLEMENTATION_EXECUTION_RULES_V1.md`.
4. Level 0: `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md`.
5. Triggered Level 1 contracts identified by the Matrix.
6. Related Level 2 alignment documents identified by the Matrix.
7. Level 3 reference documents and old plans.

If MVP scope conflicts with a long-term architecture contract, the AI must stop
and report the conflict. It must not choose a short-term implementation path on
its own.

## 4. Data Management MVP Positioning

Data Management MVP Scope is a phase scope, not an architecture override.

`DATA_MANAGEMENT_MVP_SCOPE_V1.md` 是当前阶段的施工范围，不是上位架构规则。
它只能限定当前阶段优先做什么、暂不做什么。它不能推翻 Reference
Architecture、Campaign Membership、Platform Interaction、Character Sheet UX
等长期契约。

The MVP can define implementation order and current non-goals. It cannot:

- collapse object layers;
- turn UI flow state into a future domain schema;
- persist local runtime context as campaign membership;
- name local-only storage as final backend schema;
- present placeholder behavior as real data management;
- bypass repository / adapter boundaries unless a contract explicitly allows it.

## 5. Long-Term Architecture Non-Regression Rule

MVP work must not regress the long-term architecture.

Mandatory rules:

1. MVP implementation must not break object layering.
2. MVP implementation must not hard-code UI flow state as future domain model.
3. MVP implementation must not persist `selectedActorId` as
   `CampaignMembership`.
4. MVP implementation must not name or design local-only stores as final backend
   schemas.
5. MVP implementation must not label mock, sample, or placeholder behavior as
   real functionality.
6. MVP implementation must not bypass repository / adapter boundaries by letting
   pages manipulate low-level stores directly, unless a contract explicitly
   allows it.
7. MVP implementation may be local-first, but it must remain replaceable,
   migratable, and able to be taken over by future repository/backend layers.

## 6. Mandatory Layer Declaration

Before implementation, the AI must declare which object layers and state layers
are touched.

Object layers:

- `CatalogObject`
- `OwnedObject`
- `CampaignObject`
- `RuntimeObject`
- `LogEvent`
- `Projection`

State layers:

- `UI State`
- `Flow State`
- `Runtime Local Context`
- `Persistent Domain State`
- `Collaborative State`
- `Server State`

Forbidden:

1. Treating Catalog as Owned.
2. Treating Owned Actor as `CampaignActorInstance`.
3. Treating `CampaignActorInstance` as `RuntimeActor`.
4. Treating Projection as real permission.
5. Treating `suggestedActor` as `selectedActorId`.
6. Treating `selectedActorId` as persistent `CampaignMembership`.
7. Treating UI placeholder as real data management.

## 7. Navigation And Back Button Check

Any task touching a page, shell, workspace, library, detail, or entry flow must
perform a navigation check.

The AI must search and report relevant occurrences of:

```text
back
return
exit
onBack
onExit
返回
退出
上一级
返回首页
当前位置
←
```

Mandatory rules:

1. One page may have only one primary return / exit affordance.
2. `WorkspaceShell` / `PageShell` owns page-level back affordances.
3. `ContextBar` owns context-flow return only.
4. Ordinary content components must not render page-level back buttons by
   default.
5. Visible UI must not show `返回首页`, `返回上一层`, `上一级`, or `当前位置`.
6. Return text belongs only in `aria-label` / `title`.

If a task cannot safely clean all navigation issues, the report must list the
remaining risk.

## 8. Button Semantics Check

Any UI task must preserve platform button semantics.

Rules:

- `进入`: only for entering a system, module, campaign runtime, or runtime
  space.
- `打开角色卡`: viewing / using an actor sheet.
- `选择此角色`: returning an actor from a selection context.
- `选择战役`: actor-to-campaign selection context.
- `进入入场准备`: campaign detail / entry preparation.
- `进入战役`: only in campaign detail / entry preparation.
- `添加`: umbrella entry for create / import / clone / select-from-package.
- `创建` / `导入`: methods inside Add Flow only.

Forbidden:

1. Showing `进入战役` directly on actor sheets.
2. Abusing `进入` on actor library cards.
3. Entering runtime directly from campaign list cards.
4. Showing both player and host primary `进入战役` CTAs in the same entry panel.

## 9. Actor / Campaign / Runtime Boundary Check

Any task touching Actor, Campaign, Entry, or Runtime must enforce:

```text
ActorVaultActor != CampaignActorInstance
CampaignActorInstance != RuntimeActor
suggestedActor != selectedActorId
selectedActorId != persistent CampaignMembership
Entry UI context != real membership
```

Mandatory rules:

1. Actor sheets may select a campaign, but cannot directly enter runtime.
2. `进入战役` can happen only from campaign detail / entry preparation.
3. Current UI-only host entry is not real multiplayer authority.
4. Future campaigns must have exactly one Primary Host.
5. AssistantHost / Co-GM may be multiple, but must be authorized by Primary
   Host.

## 10. Character Sheet Layering Check

Any task touching DND / COC / CP RED character sheets must preserve:

- `Character Sheet`: used during play.
- `Character Builder`: creation / leveling / modification.
- `Character Audit`: source / validation / needs-human-check information.
- `Compendium / Catalog`: equipment, spells, features, items, careers, classes,
  and other reference data.

Forbidden:

1. Putting full catalogs into the default character sheet.
2. Exposing metadata / source / needs-human-verification as default player main
   information.
3. Mixing Builder choices with Sheet runtime summaries.
4. Forcing DND / COC / CP RED into one visual template that erases system
   differences.

## 11. Data Management MVP Check

Data implementation must prioritize the offline personal campaign MVP while
preserving long-term architecture.

Current phase priority:

1. Campaign Local Store.
2. `CampaignLibraryShell` connected to real local campaign store.
3. ActorVault repository bridge.
4. Campaign Entry Draft.
5. RuntimeLog local repository.
6. `CampaignRuntimeShell` connected to RuntimeLog.
7. Manual State Change -> RuntimeLog.
8. Local import/export envelope.

Do not implement early:

- real multiplayer;
- complete permissions;
- complete `CampaignMembership`;
- complete `CampaignActorInstance`;
- complete map / Scene / Token;
- complete Handout publishing;
- complete Workshop installer;
- complete backend / WebSocket / account system.

## 12. Placeholder Transparency

Any placeholder, scaffold, sample, mock, or disabled UI must be clearly labeled.

Forbidden:

- presenting mock/sample data as real user data;
- presenting disabled scaffold actions as available behavior;
- implying persistence, sync, permissions, or backend behavior that does not
  exist;
- hiding local-only shortcuts behind final-domain terminology.

## 13. Mandatory Report Section

Every AI implementation report must include:

```text
Execution Rules Compliance
AI Contract Enforcement Matrix Compliance
```

and answer:

1. Was `AI_IMPLEMENTATION_EXECUTION_RULES_V1.md` read?
2. Was `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md` read?
3. Which Level 1 documents were triggered by this task?
4. Which Level 2 documents were read for alignment?
5. Which object layers were touched: Catalog / Owned / Campaign / Runtime / Log
   / Projection?
6. Which state layers were touched: UI / Flow / Runtime Local / Persistent /
   Server / Collaborative?
7. Did the task touch navigation / back buttons? If yes, was
   `back/return/exit/返回/←` searched?
8. Did the task touch button semantics? If yes, were the `进入` / `打开` /
   `选择` / `添加` rules preserved?
9. Did the task touch Actor / Campaign / Runtime? If yes, were suggested /
   selected / membership boundaries preserved?
10. Did the task touch character sheets? If yes, was Sheet / Builder / Audit /
   Catalog layering preserved?
11. Did the task touch data management? If yes, did it follow
   `DATA_MANAGEMENT_MVP_SCOPE_V1.md`?
12. Were placeholders introduced? If yes, were they clearly labeled?
13. Were any required Level 0 / Level 1 documents missing or conflicting?
14. Were any rules not fully executed? If yes, list the reason and follow-up.

For every triggered Level 1 or upgraded Level 2 document, the report must use
this format:

```text
<Contract Name> Compliance:
- Triggered this round:
- Applicable clauses:
- How this round complied:
- Deviations:
- Reason / follow-up:
```

## 14. MVP Non-Regression Check

Reports for data-management or local-MVP tasks must also include:

1. Was `DATA_MANAGEMENT_MVP_SCOPE_V1.md` used as current phase scope?
2. Could the implementation cause long-term architecture regression?
3. Did it introduce a local-only shortcut?
4. If yes, is the shortcut clearly labeled and kept replaceable through an
   adapter / repository boundary?
5. Did any implementation sacrifice a long-term contract for MVP speed?

## 15. Stop Conditions

The AI must stop and report rather than implement when it detects:

- `AI_IMPLEMENTATION_EXECUTION_RULES_V1.md` cannot be read;
- `AI_CONTRACT_ENFORCEMENT_MATRIX_V1.md` cannot be read;
- a triggered Level 1 document is missing, conflicting, or impossible to apply;
- MVP scope conflicting with a higher-priority architecture contract;
- a proposed shortcut that would become hard to migrate;
- a task that needs schema/migration but is scoped as UI-only;
- a task that would persist suggested/selected flow state as membership;
- a task that would imply backend, permission, multiplayer, map, handout, or log
  behavior without an explicit data contract;
- a navigation change that would create duplicate visible back/exit controls.

## 16. Acceptance Boundary

This execution gate is satisfied only when future implementation reports can
show that both Level 0 documents were read, which Level 1 documents were
triggered, which rules were applied, which layers were touched, and which
boundaries were preserved.

It is not satisfied by citing contracts passively while implementing a shortcut
that violates object layering, navigation, button semantics, character-sheet
separation, membership boundaries, or long-term architecture.
