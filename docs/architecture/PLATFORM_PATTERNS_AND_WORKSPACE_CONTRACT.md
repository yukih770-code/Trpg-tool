# Platform Patterns & Workspace Section Contract

<!-- AI-LANDMARK: PLATFORM_PATTERNS_WORKSPACE_CONTRACT_V1 -->

Last updated: 2026-06-13

## Purpose

This document is the **architecture baseline** that DND 5e 2024, COC 7e, Cyberpunk RED, and all future Game Systems must align to. It defines the platform-level **Patterns** and the **Workspace Section Contract** so that systems are *implementations of platform patterns*, not copies of one another's pages.

It complements `docs/architecture/PLATFORM_CORE_CONCEPTS.md`:
- `PLATFORM_CORE_CONCEPTS.md` owns the **vocabulary and Game System Registry field spec** (what objects exist).
- This document owns the **Patterns and Section Contract** (how a Game System surfaces those objects in the UI/IA).

This is a documentation baseline. It defines no new `src/` behavior and changes no store schema, runtime logic, dice algorithm, rule data, import/export, routing, workshop, map, inventory, or session implementation.

---

## 1. Overall Principles

1. **Platform Patterns take priority over single-system page implementations.** A new system implements the Patterns; it does not fork another system's pages.
2. **DND / COC / CP RED are implementations of the Patterns, not hard templates for each other.** DND is currently the most mature reference implementation, but "reference" ≠ "template to copy literally."
3. **Current UI is v0 / IA-validation.** It exists to validate information architecture, not to be the final visual design.
4. **Final UI will be redesigned after the underlying architecture stabilizes.** Visual polish is deliberately deferred.
5. **Every architecture-class implementation task must first align to this document** and to `PLATFORM_CORE_CONCEPTS.md`, and must reference which Pattern / Section it implements.

Invariants inherited from `PLATFORM_CORE_CONCEPTS.md`:
- `Character` / `Investigator` / `Edgerunner` are **system display labels**; the platform abstraction is **Actor / Player Asset**.
- One Actor can be enrolled in multiple Campaigns / Modules / Sessions.
- The platform is **not** bounded by the three built-in systems.

---

## 2. The Nine Platform Patterns

Each Pattern lists: responsibility · non-responsibility · platform-unified · system-customized · V1 minimum · V1 not-do · high-risk boundary.

### 2.1 Game System Workspace Pattern
- **Responsible for:** Containing one Game System and exposing its standard Section entries (the Section Contract in §3).
- **Not responsible for:** Actor state, runtime play, rule computation.
- **Platform-unified:** The Section name set, the shell layout skeleton, the navigation semantics.
- **System-customized:** Which Sections are filled, their display labels, theme accent, planned markers.
- **V1 minimum:** Each built-in system exposes the same named Sections; missing ones are marked `planned` / `absent`. Implemented today as `DndWorkspaceShell`, `CocWorkspaceShell`, `CpWorkspaceShell`.
- **V1 not-do:** Per-system bespoke pages outside the contract; pushing Actor/Session content into the workspace.
- **High-risk boundary:** Replacing the hardcoded `system === 'D&D' | 'CoC' | 'CP'` branches with registry-driven dispatch is a P2+ task — not part of this baseline.

### 2.2 Actor / Player Asset Entry Pattern
- **Responsible for:** The unified entry from Vault/Home into a specific Actor's context, and the "start playing" CTA placement.
- **Not responsible for:** Creation flow internals, Sheet layout internals.
- **Platform-unified:** Actor card shape, entry motion, "start playing" belongs to Actor context.
- **System-customized:** Actor summary fields (level/class, SAN/Luck, role/handle).
- **V1 minimum:** Actor card → Sheet; "start playing" triggers from Actor context. Implemented as DND Character Vault, COC Investigator Vault, CP RED Edgerunner Vault (current-asset shells).
- **V1 not-do:** Multi-actor store redesign, Asset Collection.
- **High-risk boundary:** True multi-actor store is a P2+ schema task.

### 2.3 Builder Pattern
- **Responsible for:** The three-column creation flow (step nav · current step editor · Actor summary/preview).
- **Not responsible for:** Creation Method selection (which precedes Builder), Actor library, full Sheet, runtime.
- **Platform-unified:** Three-column skeleton, step-navigation semantics, preview slot.
- **System-customized:** The declared `builderSteps[]`.
- **V1 minimum:** Step shell + only existing real editing wired to the existing store. Implemented as DND responsive Builder Workbench, COC `CocInvestigatorBuilderShell`, CP RED `CpEdgerunnerBuilderShell`.
- **V1 not-do:** Save migration, full rule calculation, real import, Workshop.
- **High-risk boundary:** Editable Builder migration that writes new store fields is a schema-class change.

### 2.4 Sheet Pattern
- **Responsible for:** Actor status display and downtime maintenance.
- **Not responsible for:** Checks, dice, runtime resource consumption.
- **Platform-unified:** The Sheet section set (§7): identity / coreStats / attributes / skills / resources / equipmentSummary / systemSpecific / runtimeCTA.
- **System-customized:** `systemSpecific` content; which sections apply.
- **V1 minimum:** Layout shell reading the existing store; Runtime CTA routes (does not compute).
- **V1 not-do:** Roll/check controls, item-instance operations, rule calculation inside Sheet.
- **High-risk boundary:** Sheet Template schema / generic rendering is deferred.

### 2.5 Runtime / Gameplay Pattern
- **Responsible for:** In-play checks, dice, actions, combat, item use, log, handout — as **embedded content**.
- **Not responsible for:** Owning a system-level shell, top navigation, or system switching.
- **Platform-unified:** Embedded mode; RollConsole + `RuntimeLogEntry[]` result center.
- **System-customized:** Action panels (DND spells/resources, COC SAN/growth, CP role/damage).
- **V1 minimum:** Legacy `Gameplay` / `CocGameplay` / `CpGameplay` preserved as embedded content components (`embedded` prop hides legacy chrome).
- **V1 not-do:** Show system switch / import-export / data-settings-help / top nav / old Creation-Sheet-Gameplay tabs / a second back button inside embedded runtime.
- **High-risk boundary:** Runtime rule logic, dice algorithm, target/damage pipeline are out of scope for any Pattern/IA task.

### 2.6 Rules Compendium Pattern
- **Responsible for:** User-facing rule lookup — categories, entries, source badges.
- **Not responsible for:** Coverage/verification tables (those belong to Source Status), rule execution.
- **Platform-unified:** Search/category shell, entry card, source badge.
- **System-customized:** `compendiumCategories`.
- **V1 minimum:** Shell-only category entries (DND has a display-only index layer; COC/CP are planned shells).
- **V1 not-do:** Compendium engine, full official tables, long rules text.
- **High-risk boundary:** Rules Compendium engine is a separate high-risk subsystem.

### 2.7 Source Status / System Health Pattern
- **Responsible for:** Data coverage, sources, trust/verification status (developer / power-user facing).
- **Not responsible for:** End-user rule lookup (Compendium), System Home display.
- **Platform-unified:** Coverage view skeleton, `trustLevel` badges (reuse `rule-data-metadata.ts`).
- **System-customized:** `sourcePackages` + coverage matrix.
- **V1 minimum:** A dedicated Source Status surface summarizing existing coverage/metadata.
- **V1 not-do:** Showing coverage detail tables on System Home.
- **High-risk boundary:** A real Source Manager engine is a separate high-risk subsystem.

### 2.8 Session / Campaign Pattern
- **Responsible for:** Campaign/session context — Board/Token/NPC/Session Log/Handout/GM tools.
- **Not responsible for:** Actor personal state, system-level config.
- **Platform-unified:** Campaign container concept; Actor↔Campaign many-to-many.
- **System-customized:** `sessionSupportLevel`, `boardCapabilityLevel`.
- **V1 minimum:** IA placeholder only (workspace-tier guidance describes it; no clickable modules).
- **V1 not-do:** Real session/map/multiplayer/persistence.
- **High-risk boundary:** Session/Campaign store, board/token data contract, multiplayer — all deferred.

### 2.9 Navigation Pattern
- **Responsible for:** The unified semantics of Back / Up / Breadcrumb (§10).
- **Not responsible for:** URL routing or a browser History API overhaul.
- **Platform-unified:** A lightweight LocationNode model + the three navigation semantics.
- **System-customized:** Each Section declares its logical parent.
- **V1 minimum:** App-level history stack for Back already exists (`PLATFORM_NAVIGATION_HISTORY_STACK`). Up/Breadcrumb formalization is the next navigation round.
- **V1 not-do:** React Router, URL routing, `window.history` rewrite.
- **High-risk boundary:** Any browser routing / React Router introduction is high-risk and out of scope.

---

## 3. Workspace Section Contract

Every Game System may declare the following standard Sections. Each Section has a three-state status (§4).

| Section id | User-visible name | Responsible for | Not responsible for | Top nav? | Needs Actor ctx? | Needs Session ctx? |
|---|---|---|---|---|---|---|
| `overview` | System Home / 工作台总览 | Current/last Actor + recommended next step | Coverage tables, Actor state, runtime | **Yes** | No | No |
| `actorVault` | Actor Vault / 角色库·调查员库·Edgerunner库 | Actor list, import/export/copy/archive | Building, runtime | **Yes** | No | No |
| `creationMethod` | Create / 创建 | Standard / Quick / Local Import / Workshop Import selection | Step-by-step editing (that is Builder) | Cautious | No | No |
| `builder` | Builder | Step-by-step Actor creation/editing | Library, full Sheet, runtime | No (Actor CTA) | Yes | No |
| `sheet` | Sheet / 角色卡 | Actor status display + downtime maintenance | Checks, dice, runtime consumption | No (Actor CTA) | Yes | No |
| `runtime` | Play / Gameplay / 调查面板·任务面板 | Checks, dice, actions, log, handout (embedded) | System-level shell | No (Actor CTA) | Yes | Optional |
| `rulesCompendium` | Rules Compendium / 规则库 | User rule lookup | Coverage detail | **Yes** | No | No |
| `sourceStatus` | Source Status / System Health / 规则源状态 | Coverage, sources, trust status | User rule lookup | **Yes** | No | No |
| `sessionCampaign` | Session / Campaign | Board/token/handout/session log/GM tools | Actor personal state | No (Session ctx) | Optional | Yes |

### Three-system example mapping

| Section | DND 5e 2024 | COC 7e | CP RED |
|---|---|---|---|
| `overview` | `implemented` | `implemented` | `implemented` |
| `actorVault` | `implemented` (Character Vault) | `implemented` (Investigator Vault) | `implemented` (Edgerunner Vault) |
| `creationMethod` | `implemented` (4 methods, only Standard active) | `implemented` | `implemented` |
| `builder` | `implemented` (Builder Workbench) | `implemented` (Investigator Builder shell) | `implemented` (Edgerunner Builder shell) |
| `sheet` | `implemented` | `implemented` (summary shell) | `implemented` (summary shell) |
| `runtime` | `implemented` (Gameplay) | `implemented` (CocGameplay embedded) | `implemented` (CpGameplay embedded) |
| `rulesCompendium` | `implemented` (display-only index) | `planned` | `planned` |
| `sourceStatus` | `implemented` (display-only) | `planned` (lightweight) | `planned` (lightweight) |
| `sessionCampaign` | `absent`→`planned` (IA guidance only) | `absent`→`planned` | `absent`→`planned` |

### How future systems declare Sections

A future Game System (Japanese TRPG, wargame, narrative, custom) declares, in its Registry entry, which Sections it surfaces and at what status. A wargame may set `sheet: absent` (unit cards instead), `actorVault` re-labeled to a roster, and `sessionCampaign: planned` at a higher `boardCapabilityLevel`. A pure narrative system may set `runtime: present` but minimal, `sheet: present`, and `sessionCampaign: absent`.

---

## 4. Section Three-State Semantics

- **`implemented`** — currently available and usable.
- **`planned`** — will be added later; must **not** masquerade as implemented.
- **`absent`** — this system does not need this Section.

`planned` display rules:
- Does not occupy the primary visual focus (not the main CTA).
- May be greyed out.
- May be collapsed.
- One-line note is sufficient.
- Must never create a fake button or an unusable primary CTA that errors on click.

---

## 5. Top Navigation Rules

- **Top system navigation is appropriate for:** `overview`, `actorVault`, `rulesCompendium`, `sourceStatus` (all system-level, not tied to a specific Actor).
- **Use with caution:** `creationMethod` (it is a Vault/Home "create" entry, acceptable as a nav item but conceptually a creation entry, not a peer tab).
- **Do not place directly in top nav:** `builder`, `sheet`, `runtime` — these depend on an Actor context and must be reached through Actor / Creation / Sheet CTAs. Placing them as peer top-nav tabs creates empty shells when no Actor exists.

---

## 6. Builder Pattern Detail

Platform-level Builder layout:

```
Left:   step navigation
Center: current step editor
Right:  Actor summary / preview
```

Rules:
- **Creation Method precedes Builder.** Standard Creation / Quick Creation / Local Import / Workshop Import belong to `creationMethod`, not inside Builder.
- Builder only handles step-by-step creation/editing (entered via Standard/Quick).
- Builder does **not** own the Actor library (`actorVault`).
- Builder does **not** own the full Sheet.
- Builder does **not** own runtime.
- The right preview is a **summary**, not a Sheet copy.

Declared `builderSteps[]` examples (system-declared, not platform-hardcoded):

- **DND:** species · class · background · abilities · skills · spells · equipment · finish
- **COC:** identity · characteristics · occupation · skills · background · equipment · finish
- **CP RED:** identity · lifepath · role · stats · skills · gear · cyberware · finish

These steps are declared by each system. The platform renders the three-column skeleton; it does not hardcode a single system's step list.

---

## 7. Sheet Pattern Detail

Standard Sheet regions:

```
identity
coreStats
attributes
skills
resources
equipmentSummary
systemSpecific
runtimeCTA
```

Rules:
- Sheet is Actor status display + downtime maintenance.
- Sheet does **not** carry primary dice / combat / runtime consumption.
- `runtimeCTA` enters runtime from Sheet or Actor context.
- `equipmentSummary` is summary-only; the real inventory / item data contract is defined separately and later.

---

## 8. Runtime Pattern Detail

- Runtime must **never** carry a system-level shell.
- Runtime must support **embedded mode** (`embedded` prop already present on `CocGameplay` / `CpGameplay`; DND Gameplay is reached as the workspace play view).
- Legacy DND / COC / CP RED runtime is preserved as embedded content components.
- Runtime must **not** display: system switch · import/export · data/settings/help · top system navigation · old Creation/Sheet/Gameplay tabs · a second back button.

---

## 9. Rules Compendium vs Source Status

- **Rules Compendium:** user rule lookup — categories / entries / source badges; player- and GM-facing.
- **Source Status / System Health:** data coverage / sources / trust level (`owner-verified` … `out-of-source`) / runtime-ready vs indexed-only vs planned; developer and power-user facing.
- **System Home shows neither coverage tables nor a dense index grid** — only current Actor + recommended next step, with rules/source/data routed to their own Sections.

---

## 10. Navigation Pattern (Concept Only — Not Implemented Here)

Three distinct semantics, **not from the same source**:

- **Back** — history return, using the app-level history stack. The history stack is responsible for Back **only**.
- **Up** — parent return, using a deterministic parent resolver from the current LocationNode's declared parent. **Not** derived from the history stack.
- **Breadcrumb** — current location path, derived from the current LocationNode's ancestor chain (walking `parentId`). **Not** derived from the history stack.

Lightweight model (conceptual):

```
LocationNode { id, type, parentId?, label, systemId? }
- Back:       independent history array (push/pop)
- Up:         current.parentId → parent node
- Breadcrumb: walk parentId chain → ancestor list
```

This document only defines the concept. The next round — **Navigation Back / Up / Breadcrumb Model v1** — will implement Up and Breadcrumb on top of the existing `PLATFORM_NAVIGATION_HISTORY_STACK` Back behavior, with **no** React Router, URL routing, or browser History API rewrite.

---

## 11. Future Extension Coverage

The Patterns and Section Contract accommodate future systems via Registry declaration:

| Future need | How the contract accommodates it |
|---|---|
| Non-Character Actor (Unit / Vehicle / NPC) | `primaryActorType` + `actorKind`; Actor Entry Pattern is label-agnostic |
| Asset Collection (Party / Army / Roster / Crew) | `actorVault` re-labeled; Asset Collection is a platform object (see Core Concepts §2.3) |
| System without a traditional Sheet | `sheet: absent`; runtime/overview still available |
| System with no / weak Runtime | `runtime: absent` or minimal; `automationLevel: 0` |
| Map-heavy system | `boardCapabilityLevel: 2–3`; `sessionCampaign` surfaced earlier |
| Pure narrative system | `sheet: present` minimal, `runtime` light, `sessionCampaign: absent` |
| Community rule package | declared as a Content Package + Registry entry (deferred, sandboxed) |
| Custom rules | `gameType: Custom`; fully declarative Section set |

Because Sections are **declared** (with three-state status) rather than assumed, the platform never hardcodes "every system has a Character / a Sheet / a combat Runtime."

---

## 12. High-Risk Boundaries (Must Be Reviewed Separately)

The following are **never** bundled into a Pattern / IA / Section task. Each requires its own isolated round and human/Opus review:

- schema / migration
- store save format
- runtime rule logic
- dice algorithm
- import / export
- true multi-actor store
- Rules Compendium engine
- Source Manager
- map / token / session
- inventory / item
- Workshop / plugin
- browser routing / React Router / URL routing

---

## 13. Codex / CC Pre-Implementation Acceptance Template

Every future implementation task must answer this template before coding:

```text
Which Platform Pattern / Section Contract entry does this implement?
Which files are allowed to change?
Which files are forbidden?
Does it touch any high-risk boundary (§12)? (If yes → stop, make it its own round.)
Is there exactly one primary goal?
Is it screenshot-verifiable?
Is there a manual click-test path?
What is the pass condition?
What is the fail condition?
Is it rollbackable (single commit, exact git add — no `git add .` / `-A`)?
Do git status / npx tsc --noEmit / npm run build pass?
```

Rules:
- Implement the Pattern / declared Section; do **not** copy another system's pages.
- `planned` / `absent` Sections use badge + collapsed note; never fake buttons or error-on-click CTAs.
- Runtime changes are limited to embedded wrapping; no rule logic.
- Sonnet read-only audit must confirm: zero rule-logic change, no duplicate functions, no legacy-tool residue.

---

## Document History

| Date | Change |
|---|---|
| 2026-06-13 | Initial baseline — Platform Patterns & Workspace Section Contract v1 |
