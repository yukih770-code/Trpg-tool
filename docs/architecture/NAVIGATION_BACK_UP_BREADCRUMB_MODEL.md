# Navigation Back / Up / Breadcrumb Model

<!-- AI-LANDMARK: NAVIGATION_BACK_UP_BREADCRUMB_MODEL_V1 -->

Last updated: 2026-06-13

## Purpose

This document defines the platform-level navigation model so every current and future Game System Workspace reuses one consistent set of navigation semantics. It formalizes three distinct navigation behaviors — **Back**, **Up**, and **Breadcrumb** — and the shared **LocationNode / parent resolver / breadcrumb derivation** model.

It builds on:
- `docs/architecture/PLATFORM_CORE_CONCEPTS.md` — vocabulary + Game System Registry.
- `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` — the 9 Patterns and the Workspace Section Contract (Navigation Pattern §2.9, §10 there described this model at concept level; this document is the full specification).

This is a documentation baseline. It defines no `src/` behavior and changes no store schema, runtime logic, dice algorithm, rule data, URL routing, React Router, browser History API, map, inventory, session, workshop, or plugin implementation.

---

## 1. Overall Conclusion

- The platform must support **Back / Up / Breadcrumb simultaneously**; they are three different behaviors, not three names for one behavior.
- The **app-level history stack is responsible for Back only** (already implemented: `PLATFORM_NAVIGATION_HISTORY_STACK` in `App.tsx`).
- **Up is resolved by a deterministic parent resolver** from `LocationNode` parent relationships.
- **Breadcrumb is derived from the current `LocationNode` ancestor chain** (walking `parentId`).
- **Up and Breadcrumb are never derived from the history stack.**
- V1 introduces **no React Router, no URL routing, and no browser History API rewrite**.

The three behaviors answer different questions:
- **Back** answers "where was I a moment ago?" (history).
- **Up** answers "what contains this?" (structure).
- **Breadcrumb** answers "where am I right now?" (location path).

---

## 2. The Three Navigation Semantics

### 2.1 Back / 历史返回
**Responsible for:**
- Returning to the previous internal state the user actually visited.
- Example: Sheet → Runtime → Back returns to Sheet.
- Implemented by the app-level history stack.

**Not responsible for:**
- Returning to the logical parent.
- Generating the breadcrumb.
- URL deep links.

### 2.2 Up / 父级返回
**Responsible for:**
- Returning to the current page's logical parent (file-manager "up one level").
- Example: Actor Sheet → Actor Vault.
- Example: Builder Step → Builder home or Creation Method.
- Example: Rule Category → Rules Compendium.

**Not responsible for:**
- Returning to a historically visited page.
- Browser back.
- Depending on where the user entered from.

### 2.3 Breadcrumb / 当前位置路径
**Responsible for:**
- Showing the current location hierarchy.
- Example: 平台 / 游玩 / DND 5E 2024 / 角色库 / 角色卡.
- Derived from the current `LocationNode` parent chain.
- V1 may display only; V2 may make ancestors clickable.

**Not responsible for:**
- Acting as a history record.
- Replacing Back.
- Replacing Up.

### 2.4 Separation invariants
```
Back  ≠ Up
Up    does NOT depend on the history stack
Breadcrumb does NOT come from the history stack
```

---

## 3. LocationNode Model

Lightweight, conceptual (no code this round):

```ts
type NavigationNodeType =
  | 'platformHome'
  | 'playHome'
  | 'gameSystem'
  | 'systemOverview'
  | 'actorVault'
  | 'creationMethod'
  | 'builder'
  | 'builderStep'
  | 'actorSheet'
  | 'runtime'
  | 'rulesCompendium'
  | 'ruleCategory'
  | 'sourceStatus'
  | 'sessionCampaign'
  | 'board'
  | 'workshop'
  | 'settings';

type LocationNode = {
  id: string;                       // current location node id
  type: NavigationNodeType;
  labelKey: string;                 // i18n key for display
  parentId?: string;                // drives Up and Breadcrumb
  systemId?: string;                // DND / COC / CP RED / future systems
  actorId?: string;                 // character / investigator / Edgerunner / Unit / Vehicle
  sessionId?: string;               // reserved for Campaign / Session
  params?: Record<string, string>;  // rule category / builder step / etc.
};
```

Field notes:
- `id` — the current location node.
- `parentId` — the single source of truth for **Up** and **Breadcrumb**.
- `systemId` — supports DND / COC / CP RED and any future Game System.
- `actorId` — supports a specific character / investigator / Edgerunner / Unit / Vehicle.
- `sessionId` — reserved for future Campaign / Session contexts.
- `params` — reserved for local state such as rule category or builder step.

The current `LocationNode` is **derived from current app state** (active system, play stage, selected workspace view, selected actor, builder step). It is not a new persisted store and carries no character data.

---

## 4. Parent Resolver

A deterministic resolver:

```text
getParentNode(currentNode) -> parentNode | null
```

Rules:
- The parent resolver **does not read the history stack**.
- It decides the parent **only** from the `LocationNode` (its `type` / `parentId` / `systemId`), the Workspace Section Contract default parents (§7), and the Game System registry.
- If there is no parent, **fallback** to Play Home, then Platform Home.
- A new Game System only declares its nodes' parents; it must **not** modify the navigation core logic.

Examples:
```text
actorSheet.parent      = actorVault
runtime.parent         = actorSheet (or actor context)
builderStep.parent     = builder
builder.parent         = creationMethod
creationMethod.parent  = actorVault
rulesCompendium.parent = actorVault
ruleCategory.parent    = rulesCompendium
sourceStatus.parent    = actorVault
systemOverview.parent  = actorVault
sessionCampaign.parent = gameSystem (or playHome)
```

---

## 5. Breadcrumb Derivation

```text
getBreadcrumb(currentNode) = walk the parentId chain from root to current
```

Rules:
- Breadcrumb comes from the **current location**, not from history.
- V1 may show a text-only path.
- V2 may support clicking ancestor nodes.
- Clicking an ancestor is **deterministic navigation** (a jump to that node), **not** Back.
- Breadcrumb labels use i18n `labelKey`.
- Breadcrumb supports system display names and Actor display names (so the same node type renders "角色卡" for DND, "调查员卡" for COC, "Edgerunner 卡" for CP RED).

Examples:
```text
平台 / 游玩 / DND 5E 2024 / 角色库 / P 的角色卡
平台 / 游玩 / COC 7e / 创建调查员 / 属性
平台 / 游玩 / CP RED / 规则库 / 装备
平台 / 游玩 / 某战棋系统 / Army Roster / Unit Sheet
```

---

## 6. Back Stack Rules

- The Back stack stores historical `LocationNode` snapshots (UI location only).
- **Push when:** the user actively moves from one location to another location.
- **Do NOT push when:**
  - in-page transient UI expand / collapse,
  - tooltip / modal lightweight toggles,
  - form field editing.
- `goBack` pops from the history stack.
- If the stack is empty, **fallback** to the parent resolver, then Play Home.

Constraints:
- The Back stack must **not** store character data.
- It stores **UI location only**.
- It must **not** store large objects.
- It must **not** be mixed with browser history.

---

## 7. Relationship to the Workspace Section Contract

Default parent of each Section (from `PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` §3):

```text
overview        → actorVault
actorVault      → playHome
creationMethod  → actorVault
builder         → creationMethod
builderStep     → builder
sheet           → actorVault
runtime         → sheet (or actor context)
rulesCompendium → actorVault
ruleCategory    → rulesCompendium
sourceStatus    → actorVault
sessionCampaign → actorVault (or gameSystem)
```

V1 product default: entering a Game System lands on `actorVault`. `overview` is retained as a low-frequency System Info node, not as the default system landing page.

Compatibility requirements — the model accommodates:
- **DND / COC / CP RED** — current built-in systems.
- **Future new rule systems** — declare node parents only.
- **Systems without a Sheet** — `actorSheet` node is `absent`; `runtime.parent` falls back to actor context or `actorVault`.
- **Systems without a Runtime** — `runtime` node is `absent`; no runtime node ever becomes a parent.
- **Multi-unit roster systems** — `actorVault` becomes a roster; `actorSheet` becomes a unit sheet; `board` parent is `sessionCampaign`.
- **Map-heavy systems** — `board.parent = sessionCampaign`; higher `boardCapabilityLevel`.
- **Pure narrative systems** — minimal node set (`systemOverview` / `actorSheet` / light `runtime`); no `board`.

Because parents are **declared per node**, the navigation core never hardcodes "every system has a Sheet / Runtime / Board."

---

## 8. V1 Minimal Implementation Recommendation

(Documentation guidance for a future implementation round — not implemented here.)

**V1 should:**
- Define the `LocationNode` type.
- Derive the current `LocationNode` from current app state.
- Keep Back using the existing app-level history stack.
- Add an **Up** button using the parent resolver.
- Show a **Breadcrumb** as a text ancestor chain.
- Do **not** add URL routing.
- Do **not** introduce React Router.
- Do **not** add deep-link sharing.
- Do **not** bind the browser back button.

**V1 should NOT:**
- URL path design.
- browser History API.
- React Router.
- shareable links.
- session deep link.
- multi-window sync.
- route guards.
- permission system.
- large-scale `App.tsx` refactor.

---

## 9. Navigation UI Specification

A page should provide:
```text
Back:       返回上一历史状态
Up:         上一级 / 回到父级
Breadcrumb: 当前位置
```

Requirements:
- Back and Up have **different labels** (Back = "返回", Up = "上一级").
- Up may display as "上一级".
- Back may display as "返回".
- If there is no history, Back may be **disabled** or fall back.
- If there is no parent, Up may be **hidden** or **disabled**.
- Breadcrumb must not occupy too much first-screen space.
- On mobile, Breadcrumb may collapse to show only the current node + its parent.

---

## 10. Example Scenarios

### DND
```text
平台 / 游玩 / DND 5E 2024 / 角色库 / 角色卡 / 战斗面板
```
**Back:**
```text
战斗面板 → 角色卡   (returns to previously visited state)
```
**Up:**
```text
战斗面板 → 角色卡
角色卡   → 角色库
角色库   → DND 工作台总览
```

### COC
```text
平台 / 游玩 / COC 7e / 创建调查员 / 技能
```
**Back:**
```text
技能步骤 → 上一个访问过的步骤或创建入口
```
**Up:**
```text
技能步骤     → 调查员创建器 (builder)
调查员创建器 → 创建调查员 (creationMethod)
创建调查员   → COC 工作台总览
```

### CP RED
```text
平台 / 游玩 / CP RED / Edgerunner 卡 / 任务面板
```
**Back:**
```text
任务面板 → Edgerunner 卡
```
**Up:**
```text
任务面板     → Edgerunner 卡
Edgerunner 卡 → Edgerunner 库
```

### Future wargame system
```text
平台 / 游玩 / 某战棋系统 / Army Roster / Unit Sheet / Board
```
How the model accommodates it:
- `Army Roster` is the `actorVault` node re-labeled (an Asset Collection of Units).
- `Unit Sheet` is the `actorSheet` node with `actorId` pointing to a Unit (`actorKind: unit`).
- `Board` is a `board` node whose parent is `sessionCampaign` (or the roster's session context).
- **Up:** Board → Unit Sheet → Army Roster → system overview.
- **Breadcrumb** is derived the same way as for DND/COC/CP RED — the only differences are labels (`labelKey`) and node types declared by the system. No navigation core change is needed to support Unit / Roster / Board.

---

## 11. High-Risk Boundaries (Must Be Reviewed Separately)

When this navigation model is eventually implemented, the following are **never** bundled in and each requires its own isolated round + human/Opus review:

- React Router
- URL routing
- browser History API
- deep links
- route guards
- auth / permission
- session / campaign persistence
- `actorId` / `sessionId` store migration
- multi-actor store
- map / board route integration

---

## 12. Pre-Implementation Acceptance Template (Navigation Tasks)

Every future navigation implementation task must answer:

```text
Which part of Back / Up / Breadcrumb does this implement?
Does it reference NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md?
Does it change only navigation UI / location state?
Does it introduce React Router?
Does it change URL routing?
Does it call window.history.back?
Does it affect store / save format?
Does it affect runtime rule logic?
Can Back be manually click-tested?
Can Up be manually click-tested?
Is the Breadcrumb visible?
How does it fall back when there is no parent?
How does it fall back when there is no history?
Is the mobile Breadcrumb readable?
```

Rules:
- Back stays history-stack based; Up uses the parent resolver; Breadcrumb derives from the ancestor chain.
- No React Router / URL routing / browser History API integration.
- Sonnet read-only audit must confirm: zero store/schema/runtime/rule-data change; Back and Up are not conflated.

---

## Document History

| Date | Change |
|---|---|
| 2026-06-13 | Initial baseline — Navigation Back / Up / Breadcrumb Model v1 |
