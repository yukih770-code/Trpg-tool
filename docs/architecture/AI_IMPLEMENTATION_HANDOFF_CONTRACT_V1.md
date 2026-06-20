# AI Implementation Handoff Contract v1

<!-- AI-LANDMARK: AI_IMPLEMENTATION_HANDOFF_CONTRACT_V1 -->

Last updated: 2026-06-19

Task: `AI Implementation Handoff Contract v1`

This contract governs multi-model implementation handoff. ChatGPT may plan or
review, while Claude Code / Codex may execute. Every executing AI must preserve
the platform information architecture before editing code.

This document is a process and architecture contract only. It does not implement
UI, backend, storage, rules runtime, migration, Workshop, Package Library,
Campaign, multiplayer, or repository behavior.

Before any implementation task, AI agents must read:
`docs/architecture/AI_IMPLEMENTATION_EXECUTION_RULES_V1.md`

The final report must include an `Execution Rules Compliance` section.

## 1. Required Layer Identification

Before changing files, the executing AI must identify which layer the requested
change belongs to:

- Platform Shell
- System Library / Catalog
- System Workspace Landing
- Module Home
- Object Library
- Object Detail
- Create / Add Flow
- Runtime / Gameplay
- Backend / Repository

If a task touches more than one layer, the AI must name each layer and explain
why the boundary is necessary. If the task can be completed within one layer, it
must stay within that layer.

## 2. No Layer Flattening

Different information architecture layers must not be flattened into one page.

Forbidden examples:

- System Library / Catalog must not directly expose character or campaign
  operations.
- System Workspace Landing must not expand directly into `我的角色`,
  `添加角色`, `我的战役`, or `添加战役`.
- Character modules must not permanently show campaign switching.
- Campaign modules must not permanently show character switching.
- Create / import methods must not appear as top-level module entries.

Correct direction:

```text
System Library
└─ Enter System
   └─ System Workspace Landing
      ├─ Character Module
      │  └─ Object Library / Add Flow
      └─ Campaign Module
         └─ Object Library / Add Flow
```

## 3. Reuse Successful Existing Patterns

When a proven pattern exists, migrate it instead of inventing a parallel pattern.

Examples:

- Campaign modules should migrate the `ActorVaultLibraryShell` pattern:
  `home` / `existing` / add flow.
- Package Library should preserve Workshop and content-center boundaries instead
  of treating packages as campaigns or rooms.
- Settings pages should follow the categorized Settings pattern instead of
  exposing preferences as primary platform actions.

If a task proposes a new pattern while an existing pattern is available, the AI
must justify why the existing pattern cannot be reused.

## 4. Convenience Must Not Increase Cognitive Load

Do not show every possible path just because it is convenient.

Rules:

- A page should serve one primary task.
- A module page should focus on the current module.
- A character page should not permanently expose campaign switching.
- A campaign page should not permanently expose character switching.
- When another object is needed, use return context, `returnTo`, or suggested
  values rather than permanent parallel navigation.

Context handoff is preferred over global shortcut clutter.

## 5. Mandatory Object and Surface Distinctions

Every implementation task must distinguish:

- Catalog / Launcher
- Workspace
- Module
- Library
- Detail
- Create / Add Flow

Definitions:

- Catalog / Launcher: browse, filter, and enter systems or spaces.
- Workspace: system-level or platform-level operational space.
- Module: a major branch inside a workspace, such as characters or campaigns.
- Library: manage existing objects of one type.
- Detail: inspect or act on one object.
- Create / Add Flow: choose how an object enters the user's space, including
  standard creation, quick creation, import, or Workshop/community sources.

Import is part of an Add Flow unless a later contract explicitly says otherwise.

## 6. Binding Contract Dependencies

Every implementation task must respect existing architecture contracts,
including:

- `NAVIGATION_AND_EXIT_CONTRACT_V1.md`
- `SYSTEM_ENTRY_AND_CAMPAIGN_FLOW_CONTRACT_V1.md`
- `OBJECT_MANAGEMENT_ACTION_CONTRACT_V1.md`
- `PACKAGE_LIBRARY_CONTRACT_V1.md`
- `ACTOR_PORTRAIT_MEDIA_BINDING_CONTRACT_V1.md`
- `VISIBILITY_AND_PROJECTION_CONTRACT_V1.md`
- `REPOSITORY_IMPLEMENTATION_BOUNDARY_V1.md`

If a task appears to conflict with one of these contracts, the AI must stop and
report the conflict before implementation.

## 7. Required Completion Report

Every implementation report must explicitly answer:

1. Which existing component or pattern was referenced?
2. Did the change add any new permanent parallel entry point?
3. Did the change flatten any IA layer?
4. Did the change preserve the Navigation & Exit Contract?
5. Did the change perform any real write behavior?
6. Did the change touch store, schema, migration, save format, rules runtime, or
   backend boundaries?
7. What were the `npx tsc --noEmit` and `npm run build` results?
8. What is the current `git status --short`?
9. What are the exact `git add` commands? Never suggest `git add .` or
   `git add -A`.

## 8. Red Flags That Require Stopping

The executing AI must stop and request review when it detects:

- A catalog page starting to expose object-specific actions.
- A workspace landing page expanding into library and creation sub-actions.
- A module page adding permanent cross-module switching.
- A detail page embedding a low-quality create form for another object type.
- A Workshop package being treated as a campaign room.
- A campaign entry action being merged into ordinary object management actions.
- A write operation being introduced in a task scoped as shell, placeholder, or
  contract-only.

## 9. Acceptance Boundary

This contract is satisfied when future AI execution can clearly state:

- the current IA layer,
- the existing pattern being reused,
- the boundaries not crossed,
- and the verification results.

It is not satisfied by merely making navigation "more convenient" if that
convenience exposes unrelated tasks on the same page.
