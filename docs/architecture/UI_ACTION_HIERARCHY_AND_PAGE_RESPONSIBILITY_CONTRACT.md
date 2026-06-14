# UI Action Hierarchy & Page Responsibility Contract

<!-- AI-LANDMARK: UI_ACTION_HIERARCHY_PAGE_RESPONSIBILITY_CONTRACT_V1 -->

Last updated: 2026-06-14

## Purpose

This document defines the platform-level **UI Action Hierarchy** and **Page Responsibility Contract** so every current and future Game System surface knows: which actions belong where, which containers hold which actions, and which actions must be hidden, gated, or placed elsewhere.

It builds on:
- `docs/architecture/PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` — 9 Platform Patterns and Workspace Section Contract (what Sections exist).
- `docs/architecture/NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md` — navigation semantics for Back / Up / Breadcrumb.
- This document owns **action placement and page-level responsibility** inside those Sections.

This is a documentation baseline. It defines no new `src/` behavior and changes no store schema, runtime logic, dice algorithm, rule data, import/export, routing, workshop, map, inventory, or session implementation.

---

## 1. Overall Principles

**The UI is not a catalogue of everything available. The UI is a visualization of product object relationships, action ownership, and user paths.**

A button placed in the wrong container causes a product semantic error even if the underlying feature works. Correct action placement is not an aesthetic preference — it is a structural constraint.

### Core Principles

| Principle | Rule |
|---|---|
| Page-level actions must not enter object cards | A "Create Character" button placed inside a character card is a misplaced collection-level action |
| Object cards hold object-level actions only | The card represents one object; actions inside it operate on that object |
| Creation flows must not mix into display areas | Builder steps and creation-method cards do not appear inside an Actor Vault display |
| Display pages do not run creation flows | Actor Vault shows the current actor; it does not host a builder step |
| Runtime entry requires context | `startPlaying` / `startInvestigation` / `startMission` require a Module / Scenario / Stage / Session context — they must not appear as standalone vault or sheet CTAs |
| Planned features must not occupy primary visual focus | A planned card must not compete visually with implemented primary CTAs |
| Low-frequency system info must not compete with main actions | System Info belongs to a small link or collapsed section, not next to a primary CTA button |

---

## 2. Action Hierarchy

Eight action tiers. Every button on every page must be classifiable into exactly one tier. If a button cannot be classified, the design is wrong.

---

### A. Platform-level Action / 平台级动作

**Belongs to:** the platform as a whole, not any single game system or actor.

**Examples:**
- Enter Play (switch to Play mode)
- Platform settings
- Switch language
- Platform account / preferences
- Platform home navigation

**Must NOT appear in:**
- Actor cards
- Actor Vault card columns
- Builder steps
- Runtime log panels
- System-specific page headers

---

### B. System-level Action / 系统级动作

**Belongs to:** a specific game system (DND / COC / CP RED / future systems).

**Examples:**
- Enter DND 5e 2024 workspace
- Enter COC 7e workspace
- View Rules Compendium
- View Source Status
- View System Info

**Top navigation allows:**
- `actorVault` (角色库)
- `rulesCompendium` (规则库)
- `sourceStatus` (数据状态)

**System-specific names** (Investigator Vault, Edgerunner Vault, Investigator Compendium) may appear in page titles and card headings. They must not appear in top navigation labels — top navigation uses generic platform labels only.

**System Info** (`overview`) is a low-frequency system-level action. It must not be a primary top-nav item and must not compete with the primary page CTA.

---

### C. Collection-level Action / 集合级动作

**Belongs to:** a collection, such as the actor library, a module library, or a scene library.

**Examples:**
- Create Character / Create Investigator / Create Edgerunner
- Import Character (when implemented)
- New Module / New Scene
- Batch-manage characters
- Filter / sort actor list

**Correct containers:**
- Page title / header area
- Empty-state primary CTA (when the collection is empty)
- Collection toolbar

**Must NOT appear in:**
- An individual actor card's CTA column
- Actor detail panel
- Runtime area
- Builder step body

**Critical example:**
> "Create Character" is a collection-level action on the Actor Vault page — it is **not** an action on the current character card. When a character exists, "Create Character" belongs in the page header area. When no character exists, it is the empty-state primary CTA.

---

### D. Object-level Action / 对象级动作

**Belongs to:** the current object — a specific actor, item, scene, investigator, Edgerunner, etc.

**Examples:**
- View Character Sheet
- Edit Character
- Duplicate Character
- Delete Character
- View Item Detail
- Edit Scene

**Correct containers:** inside the object card or object detail panel.

**Must NOT contain:**
- Create new actor (collection-level)
- Import actor library (collection-level)
- Rules Compendium (system-level)
- Source Status (system-level)
- Start combat / Start investigation / Start mission (runtime-context)

---

### E. Creation-flow Action / 创建流程动作

**Belongs to:** the creation flow.

**Examples:**
- Standard Creation
- Quick Creation (planned)
- Local Import (planned)
- Workshop Import (planned)
- Next step / Previous step
- Finish creation

**Correct containers:**
- Creation Method page (`creationMethod`)
- Builder (`builder`) / Builder Steps
- Import Flow

**Must NOT appear in:**
- Actor display cards (Vault)
- Actor Sheet display page
- Runtime
- Rules Compendium
- Source Status

---

### F. Runtime-context Action / 运行时上下文动作

**Belongs to:** an active scene, module, session, combat encounter, investigation, or mission.

**Examples:**
- Start Playing / Start Battle
- Start Investigation
- Start Mission
- Roll dice
- Cast spell
- Attack
- Consume resource
- Advance turn
- Record clue
- Run encounter

**Future entry point:** these actions must be reached from:
- Module
- Scenario
- Stage / Scene
- Session
- Encounter
- Investigation
- Mission

**V1 rule:**
> Do not expose a Runtime entry CTA directly from Actor Vault or Actor Sheet as a standalone primary button. Runtime code assets are preserved; UI entry points are gated pending Module / Scenario / Stage / Session architecture.

**Rationale:** A character without a session context has no combat state, no encounter data, and no stage. Presenting "Start Playing" implies the platform has initialized a session context when it has not. This misleads users and creates incomplete flows.

---

### G. System-info Action / 系统信息动作

**Belongs to:** low-frequency architectural or help information.

**Examples:**
- System Info (关于此系统)
- About this system
- Usage notes
- Platform architecture notes
- Help

**Correct containers:**
- Small text link below main content
- More / overflow menu
- Collapsed details / `<details>` element
- Page bottom link row

**Must NOT:**
- Appear at the same visual level as the primary CTA
- Compete with object-level or collection-level buttons in a button row
- Be a full-size button next to "Create Character" or "View Sheet"

---

### H. Planned / Future Action / 未来功能动作

**Belongs to:** features not yet implemented or not yet wired to real logic.

**Examples:**
- Full multi-actor library
- Local import / export (when not yet implemented)
- Workshop import
- Multiplayer sync
- Map / board
- Module marketplace
- AI Host
- Plugin ecosystem
- Quick creation

**Display rules:**
- May appear in a roadmap section, collapsed "coming soon" block, or greyed-out planned badge
- Must NOT appear in primary visual area as if they are available
- Must NOT pretend to be an active primary CTA
- Must NOT compete visually with implemented core actions
- Must NOT error on click without a visible `planned` marker

---

## 3. Page Responsibility Contract

Each page has exactly one responsibility domain. If a page tries to do more than one domain, it will inevitably place actions in the wrong tier.

---

### Actor Vault / 角色库

**Responsible for:**
- Display the current actor summary (Character / Investigator / Edgerunner)
- Enter actor sheet (Object-level CTA: "View Sheet")
- Enter actor creation (Collection-level CTA: "Create Character")
- Future: multi-actor list management

**Not responsible for:**
- Full actor sheet content
- Step-by-step actor creation
- Runtime / combat / investigation / mission
- Rule lookup
- Data coverage
- Import/export large flow as primary surface
- System architecture explanation

**Allowed actions:**

| Tier | Action |
|---|---|
| Collection-level | Create Character / Create Investigator / Create Edgerunner |
| Object-level | View Character Sheet / View Investigator Sheet / View Edgerunner Sheet |
| System-info | System Info (small text link only) |

**Forbidden actions:**

| Tier | Action |
|---|---|
| Runtime-context | Start Playing / Start Investigation / Start Mission / Enter Combat |
| Creation-flow | Import/export large planned cards as primary visual |
| Collection-level | "Create Character" placed inside the current actor card's CTA column |
| System-info | System Info button at the same visual level as "View Sheet" |

---

### Actor Sheet / 角色卡

**Responsible for:**
- Display actor state (identity, stats, skills, resources, equipment summary)
- Between-scene / downtime maintenance
- Resource tracking (HP, MP, SAN, EB, etc.)

**Not responsible for:**
- Create new actor
- Manage actor library
- System rules lookup
- Data status
- Runtime without session context

**Allowed actions:**

| Tier | Action |
|---|---|
| Object-level | Edit character / Continue editing (幕间维护) |
| Object-level | Return to Actor Vault (Up navigation) |

**Temporarily hidden (V1 — pending Module / Scene / Session):**

| Tier | Action |
|---|---|
| Runtime-context | Start Playing / Start Investigation / Start Mission |

---

### Creation Method / 创建方式

**Responsible for:**
- Display and select the creation method
- Standard creation (active)
- Quick creation (planned)
- Local import (planned)
- Workshop import (planned)

**Not responsible for:**
- Display current actor detail
- Full actor sheet
- Runtime
- Rules Compendium
- Source Status

**Allowed actions:**

| Tier | Action |
|---|---|
| Creation-flow | Standard creation entry |
| Creation-flow | Quick creation (planned badge) |
| Creation-flow | Local import (planned badge) |
| Creation-flow | Workshop import (planned badge) |

---

### Builder / 创建器

**Responsible for:**
- Step-by-step actor creation or editing
- Left: step navigation
- Center: current step editor
- Right: actor summary / preview

**Not responsible for:**
- Actor library / vault
- Full actor sheet
- Runtime
- Rules Compendium
- Source Status
- Import/export large flows

**Allowed actions:**

| Tier | Action |
|---|---|
| Creation-flow | Next step / Previous step |
| Creation-flow | Finish creation |
| Object-level | View preview (read-only; does not write store during preview) |

---

### Runtime / 运行时

**Responsible for:**
- In-play rule actions, dice, checks within a scene / module / session
- Combat / Investigation / Mission
- Dice roll log
- Resource consumption
- Handout / encounter / notes

**Not responsible for:**
- Actor creation
- Actor library management
- System info
- Data coverage

**V1 state:**
> Runtime code assets are preserved. Entry UI is gated. Runtime is reached from Module / Scenario / Stage / Session — not directly from Actor Vault or Actor Sheet.

---

### Rules Compendium / 规则库

**Responsible for:**
- User-facing rule lookup
- Rule categories, entries, source badges
- Spells / feats / skills / equipment / rule terms

**Not responsible for:**
- Data coverage / verification tables (that is Source Status)
- Runtime rule execution
- Actor creation

**Allowed actions:**

| Tier | Action |
|---|---|
| System-level | Navigate rule categories |
| System-level | Return to Actor Vault (Up navigation) |

---

### Source Status / 数据状态

**Responsible for:**
- Rule source coverage
- Verification trust level (`owner-verified` → `out-of-source`)
- Runtime-ready / indexed-only / planned markers
- Translation status
- Version status

**Not responsible for:**
- User rule lookup (that is Rules Compendium)
- Actor operations
- Runtime actions
- Creation flows

---

### System Overview / 系统信息

**Responsible for:**
- Low-frequency system information
- About this system
- Architecture notes
- Help / guidance

**Not responsible for:**
- Default system entry
- Primary top navigation slot
- Actor asset entry

**V1 product rule:**
> DND / COC / CP RED default entry is Actor Vault. System Overview is retained as a secondary, low-frequency architecture node — it is not the first page a player sees.

---

## 4. Container Placement Rules

Where each action tier belongs in the visual hierarchy.

### Page Header / 页面标题区

**Place here:**
- Collection-level: Create Character / Create Investigator / Create Edgerunner
- System-level: back-to-vault breadcrumb link
- System-level: page title

**Do not place here:**
- Runtime CTAs
- Planned feature cards

---

### Object Card / 对象卡片

**Place here:**
- Object-level: View Detail / View Sheet
- Object-level: Edit this object
- Object-level: Duplicate this object
- Object-level: Delete this object

**Do not place here:**
- Collection-level: Create new actor
- System-level: Enter Rules Compendium / Enter Source Status
- Runtime-context: Start Playing / Start Investigation / Start Mission

---

### Empty State / 空状态

**Place here:**
- Collection-level: Create first actor (primary CTA when vault is empty)
- Collection-level: Import first actor (when implemented)

---

### Sidebar / 侧边栏

**Place here:**
- Platform-level navigation
- System-level navigation (top system nav: Actor Vault / Rules Compendium / Source Status)
- Builder step navigation

**Do not place here:**
- Large blocks of planned features
- Object-level action stacks

---

### Footer / Bottom Link / More Menu / 底部链接 / 更多菜单

**Place here:**
- System-info: System Info link
- System-info: Usage notes
- Planned/future: roadmap items
- Planned/future: coming-soon notes

---

## 5. Button Priority Rules

Each visual area has at most one primary CTA. Multiple primary buttons signal a broken information hierarchy.

### Primary CTA — one per area

| Page | State | Primary CTA |
|---|---|---|
| Actor Vault | Actor exists | View Actor Sheet |
| Actor Vault | No actor | Create Character |
| Actor Sheet | — | Edit / Maintain (幕间维护) |
| Creation Method | — | Standard Creation |
| Builder | — | Next Step / Finish |
| Rules Compendium | — | Navigate category |
| Source Status | — | (display only; no primary action) |
| System Overview | — | Return to Actor Vault |

### Secondary action

Examples:
- Edit character (if View Sheet is primary)
- System Info (small text link)
- Return to previous page

### Tertiary / Low-frequency action

Examples:
- System Info (always tertiary)
- About this system
- Planned / import / export notes
- Roadmap

**Tertiary actions must be visually distinct** from primary and secondary: smaller font, lower opacity, text-only link, or collapsed section.

---

## 6. Anti-patterns / 禁止模式

The following are documented UI errors. Any task that introduces these patterns fails review.

| Anti-pattern | Why it is wrong |
|---|---|
| Placing "Create Character" inside the current actor card's CTA column | "Create" is collection-level. The actor card is object-level. Mixing tiers confuses the object model. |
| Placing "Start Playing" / "Start Battle" as a primary CTA on an actor card with no session context | Runtime entry requires Module / Scene / Session. Without that context, the button creates an incomplete flow and misrepresents platform state. |
| Making planned features into primary-screen large cards | Planned features must not compete visually with implemented functionality. |
| Combining Rules Compendium and Source Status into one page | These are two different services: user rule lookup vs. developer data health. Mixing them makes each harder to use. |
| Placing the System Info button at the same visual level as actor-level buttons | System Info is low-frequency. It should not compete with "View Sheet" in the same button row. |
| Placing Builder / Sheet / Runtime in the top system navigation | These depend on an Actor context. Placing them as top-nav tabs creates empty shells when no actor is selected, and exposes context-dependent views as peer system sections. |
| Using different world-theme names for the same concept in top navigation across systems | "调查员库" / "Edgerunner 库" / "角色库" in the top nav breaks platform mental model consistency. Use generic platform labels in navigation; system-specific names in page content. |
| Adding duplicate entry points to solve a confusing path | Duplicate buttons signal that the IA path is wrong. Fix the path, not the button count. |
| Using button quantity to communicate feature richness | More buttons do not mean richer features. They mean a broken hierarchy. |

---

## 7. Required UI Task Workflow

**Before any UI implementation task, the task must declare:**

```text
Page Responsibility:
- This page is responsible for:
  [list]
- This page is not responsible for:
  [list]

Action Hierarchy:
- Platform-level actions on this page:
- System-level actions on this page:
- Collection-level actions on this page:
- Object-level actions on this page:
- Creation-flow actions on this page:
- Runtime-context actions on this page:
- System-info actions on this page:
- Planned/future actions on this page:

Primary CTA:
Secondary actions:
Hidden actions (and why):
```

No UI task may begin implementation without completing this declaration. If the declaration cannot be completed, the design is insufficiently specified — clarify the specification first.

---

## 8. Review Checklist

Use this checklist for every UI design review and every UI implementation audit:

```text
□ What object does this page serve?
□ For each button: does it operate on the whole page, a collection, a single object, or a runtime context?
□ Is each button in the correct container for its tier?
□ Are all buttons in the same visual row / group actually the same tier?
□ Does any planned feature occupy primary visual focus?
□ Does any runtime entry point lack Module / Scene / Session context?
□ Has any entry point been duplicated for convenience rather than fixing the path?
□ Has system info been mixed with core operational actions?
□ Can the user identify the primary path within 3 seconds of arriving on the page?
□ Is the System Info action visually tertiary (small link, not a button)?
□ Does the top navigation use only generic platform labels?
□ Are all tier-F runtime CTAs hidden or disabled pending session architecture?
```

---

## 9. Current Three-System Application

Immediate UI direction for DND 5e 2024, COC 7e, and CP RED.

### DND 5e 2024

**Actor Vault (`characters` view):**
- Show: current character summary card, "View Sheet" (object-level), "Create Character" in page header (collection-level)
- "Create Character" must NOT appear inside the character card's CTA column
- "Start Playing" / "Enter Combat Panel" hidden (runtime-context, no session context)
- System Info: small text underline link below main content (not a button at the same level as "View Sheet")
- Local Import and Export/Import planned cards: not in primary visual area of Actor Vault (move to Creation Method or collapse)

**Actor Sheet (`sheet` view — in play mode):**
- "Start Playing" / "Enter Combat" temporarily hidden
- Runtime entry pending Module / Scene / Encounter / Session architecture

**System Info (`dashboard` view):**
- Retained as a secondary architecture node
- Default entry is Actor Vault; System Info is not the first page

---

### COC 7e

**Actor Vault (`vault` view):**
- Top navigation label: "角色库" (generic platform label)
- Page content title: "调查员库" (system-specific name; correct here)
- Current investigator card: "View Investigator Sheet" (object-level) only
- "Continue Investigator Editing" must NOT appear in the vault card column (it is creation-flow in actor context; move to sheet if it is 幕间维护)
- "Start Investigation" hidden (runtime-context, no session/scenario context)
- Local Import planned card: not as a primary visual card in vault main area (move to Creation Method)
- System Info: small text underline link below vault content

**Actor Sheet (`sheet` view):**
- "Start Investigation" temporarily hidden
- "Continue Investigator Editing" (幕间维护) — acceptable in sheet as downtime maintenance
- Runtime entry pending Scenario / Investigation / Session architecture

---

### CP RED

**Actor Vault (`vault` view):**
- Top navigation label: "角色库" (generic platform label)
- Page content title: "Edgerunner 库" (system-specific name; correct here)
- Current Edgerunner card: "View Edgerunner Sheet" (object-level) only
- "Continue Edgerunner Editing" must NOT appear in vault card column
- "Start Mission" hidden (runtime-context, no mission/session context)
- Planned cards (multi-actor list, local import) not in primary visual area of vault (move to Creation Method)
- System Info: small text underline link below vault content

**Actor Sheet (`CpEdgerunnerSheetShell`):**
- "Start Mission" temporarily hidden
- "Continue Editing" retained — valid as 幕间维护 (between-session maintenance)
- Runtime entry pending Mission / Scene / Session architecture

---

## 10. Relationship to Existing Architecture Documents

The three architecture documents form a complete constraint set for UI and IA tasks:

| Document | Responsibility |
|---|---|
| `PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` | Defines the 9 Platform Patterns and the Workspace Section Contract — which Sections exist, what each Section is responsible for, and how top navigation is structured |
| `NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md` | Defines navigation semantics — Back (history), Up (parent resolver), Breadcrumb (ancestor chain) — and the LocationNode model |
| **This document** | Defines action placement within Sections — which action tier each button belongs to, which container holds it, what each page is and is not responsible for, and how to audit action hierarchy in UI tasks |

These three documents together constrain all future UI implementation tasks. A task that is consistent with the Workspace Section Contract (§ PLATFORM_PATTERNS) and the Navigation Model (§ NAVIGATION) but violates the Action Hierarchy Contract defined here is still an incorrect design.

---

## 11. Pre-Implementation Acceptance Template (UI Action Tasks)

Every future UI implementation task must answer this template before coding:

```text
Which page (Section) does this task modify?
What is this page responsible for? (from §3 above)
What is this page NOT responsible for?

For each new or changed button:
  - What tier is this action? (A–H from §2)
  - Which container does it belong in? (from §4)
  - Is it a primary / secondary / tertiary action? (from §5)
  - Does it belong to this page's responsibility domain?
  - If tier F (runtime): is there a Module / Scene / Session context?
  - If tier H (planned): does it have a visible planned marker and NOT occupy primary visual focus?

Anti-pattern check (§6):
  - Does any button mix tiers in the same container?
  - Does any planned feature claim primary visual space?
  - Does any runtime CTA appear without session context?
  - Does the top navigation use only generic platform labels?

Files allowed to change:
Files forbidden from changing:
High-risk boundary check: (see PLATFORM_PATTERNS §12)
```

---

## 12. High-Risk Boundaries (Must Be Reviewed Separately)

The same boundaries defined in `PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT.md` §12 apply here. No UI action placement task may bundle in:

- Schema / migration
- Store save format
- Runtime rule logic
- Dice algorithm
- Import / export engine
- True multi-actor store
- Rules Compendium engine
- Source Manager engine
- Map / token / session
- Inventory / item data contract
- Workshop / plugin
- Browser routing / React Router / URL routing / browser History API

---

## Document History

| Date | Change |
|---|---|
| 2026-06-14 | Initial baseline — UI Action Hierarchy & Page Responsibility Contract v1 |
