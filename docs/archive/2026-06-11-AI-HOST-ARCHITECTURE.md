# AI Host Architecture

Last updated: 2026-05-31

## 1. Purpose

This document defines how AI may participate in this TRPG manager across DND 2024, Call of Cthulhu 7th, and Cyberpunk RED.

It defines boundaries for:

- AI Assistant
- AI Co-Host
- AI Host
- AI/API command proposals
- Story branch generation
- Hidden knowledge
- Visibility / reveal
- Rule execution boundaries

Current phase is documentation only. This document does not implement AI APIs, Host Console, tool execution, permissions, store changes, schema changes, or migrations.

## 2. AI Roles

### AI Assistant / 辅助模式

Used when a human DM/KP/GM is present.

AI can:

- Explain rules.
- Summarize logs.
- Draft NPCs.
- Draft scenes.
- Remind the host of possible rules.
- Help the host prepare story branches.

AI does not make final rulings in Assistant mode.

### AI Co-Host / 副主持模式

Used when a human host is present but wants AI to share preparation or adjudication workload.

AI can:

- Suggest DC / DV / difficulty.
- Suggest story branches.
- Suggest NPC actions.
- Suggest monster / enemy reactions.
- Generate hidden information.
- Generate public narration.
- Suggest reveal mode.

The human host confirms before execution.

### AI Host / AI 主持模式

Used when no human DM/KP/GM is present.

AI can:

- Advance scenes.
- Roleplay NPCs.
- Decide DC / DV / difficulty.
- Decide enemy / NPC actions.
- Manage hidden information.
- Generate clues.
- Control story branches.
- Generate rule-result suggestions.
- Decide which information is `public`, `gmOnly`, or `revealed`.

Even in AI Host mode, state changes must pass through a ProposedCommand / Validation / Execution pipeline. AI Host should not directly mutate character state or bypass rules.

## 3. Page Boundary

### Player Gameplay

Contains:

- Player character state.
- Player-available actions.
- Player skill checks.
- Player resource changes.
- Player-visible RollConsole.

Does not contain:

- AI Host tools.
- Host hidden state.
- Full `gmOnly` logs.
- Global NPC / monster management.
- AI world-state control.

### Host Console

Future Host Console contains:

- Human Host tools.
- AI Co-Host assistance.
- AI Host control panel.
- `gmOnly` logs.
- Reveal controls.
- NPC / enemy management.
- Scene / clue management.
- Random tables.
- Story branches.

Current phase does not implement Host Console.

## 4. AI Host Authority Model

### Authority 0: Suggest Only

AI can suggest only. It cannot execute or mutate state.

### Authority 1: Auto Narration

AI can automatically output narration, but cannot change state.

### Authority 2: Confirmed Commands

AI can generate state-change commands, but the user or host must confirm them.

### Authority 3: Limited Auto Apply

AI can automatically apply low-risk changes, such as ordinary log entries or light resource changes, only when explicitly configured.

### Authority 4: Major Consequences Require Confirmation

Death, insanity, major wounds, permanent attribute changes, character deletion, and major story reveals must require human confirmation.

Default authority should be 0 or 1. AI Host mode may raise authority to 2. Authority 3 must be explicitly enabled by the user. Authority 4 consequences must never be fully automatic.

## 5. ProposedCommand Pipeline

AI/API output must not execute directly. The intended future pipeline is:

```text
AI / API Output
↓
ProposedCommand
↓
Validation
↓
User or Host Confirmation
↓
Store Action / Runtime Action
↓
RuntimeLogEntry
```

Recommended future shape:

```ts
type ProposedCommand = {
  id: string;
  system: "dnd" | "coc" | "cpred";
  source: "ai" | "api" | "user";
  mode: "assistant" | "coHost" | "host";
  kind:
    | "stateChange"
    | "logEntry"
    | "npcDraft"
    | "itemDraft"
    | "sceneDraft"
    | "rulesExplanation"
    | "actionSuggestion"
    | "storyBranch"
    | "visibilityChange";
  title: string;
  explanation: string;
  payload: unknown;
  requiresConfirmation: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
};
```

Notes:

- `ProposedCommand` is a future direction, not implemented now.
- All state changes must be validated.
- All critical-risk commands must require confirmation.
- Successful execution must create a `RuntimeLogEntry`.

## 6. Story Branch Generation

AI can generate:

- Public branches.
- Hidden branches.
- Multiple candidate branches.
- NPC reactions.
- Scene changes.
- Failure consequences.
- Success consequences.
- Clue hints.
- Misleading clues.

An AI-generated branch should include:

- `title`
- `public narration`
- `gmOnly notes`
- `triggers`
- `possible checks`
- `consequences`
- `reveal plan`

Rules:

- Player-visible narration and Host-only notes must be separated.
- AI-generated branches should not directly change character state.
- Any state change caused by a branch must go through `ProposedCommand`.

## 7. Hidden Knowledge / Visibility

- AI Host can manage `gmOnly` information.
- Player Gameplay does not display `gmOnly`.
- Future Host Console displays `gmOnly`.
- AI can suggest reveal modes:
  - `showFull`
  - `showOutcome`
  - `showNarration`
  - `hidden`
- Major reveals require host or user confirmation.
- AI must not silently write `gmOnly` content into public logs.

## 8. Rule Engine Boundary

AI can:

- Request rule calculations.
- Recommend which check to use.
- Recommend DC / DV / difficulty.
- Explain rule results.
- Generate narrative interpretation.

AI should not:

- Bypass `coc-utils`, `cp-utils`, `dnd-utils`, or equivalent rule evaluators.
- Fabricate dice results.
- Directly mutate store.
- Directly write migrations.
- Directly overwrite `RuntimeLogEntry`.
- Directly reveal hidden information.

Rule calculations should be performed by project rule utilities, evaluators, or validated dice APIs rather than by freeform AI text.

## 9. Dice and Randomness

- Actual rolls should be produced by the local rule system or by an explicit dice API.
- AI should not invent dice results unless the mode is explicitly pure narrative simulation.
- In AI Host mode, dice results should still become `RuntimeLogEntry` records.
- A `gmOnly` roll is visibility, not a special dice type.

## 10. Integration With Existing Architecture

This document extends and depends on:

- `TRPG_SYSTEM_FEATURE_MATRIX.md`
- `SYSTEM_PAGE_RESPONSIBILITY.md`
- `GAMEPLAY_UI_CONTRACT.md`
- `RUNTIME_LOG_ARCHITECTURE.md`
- `RULESET_EXTENSION_ARCHITECTURE.md` if it exists
- `COC_RULE_COVERAGE.md`
- future `CPRED_RULE_COVERAGE.md`
- future `IMPLEMENTATION_ROADMAP.md`

Relationship summary:

- Page responsibility docs define where AI surfaces may appear.
- Gameplay UI contract defines RollConsole and player/host boundaries.
- Runtime log architecture defines the envelope AI-generated and AI-executed results must use.
- Rule coverage docs define what AI may safely ask the rules system to calculate.
- Implementation roadmap should decide when AI phases are allowed to move from docs to code.

## 11. Current Non-Implementation Scope

Current phase does not implement:

- AI API.
- AI Host Console.
- Host Console.
- `ProposedCommand` runtime.
- Permissions.
- Automatic AI state mutation.
- Multiplayer.
- AI memory / long-term campaign memory.
- External model provider config.
- Tool/plugin execution.
- Voice / live session mode.

## 12. Recommended Future Phases

### AI-0 Docs only

Current phase. Define architecture, boundaries, risks, and future execution pipeline.

### AI-1 Read-only Assistant

AI reads logs and character state to generate summaries, reminders, and rule explanations. No mutation.

### AI-2 Draft Generator

AI drafts NPCs, items, clues, scenes, and other prep artifacts. Drafts do not mutate runtime state.

### AI-3 Co-Host Suggestions

AI suggests DC / DV, NPC actions, story branches, reveal plans, and consequences. Human confirmation required.

### AI-4 AI Host Solo Mode

When no human host exists, AI manages scenes, NPCs, hidden information, and branches. State changes still require the command pipeline.

### AI-5 Confirmed Command Execution

AI generates `ProposedCommand` objects. Validated and confirmed commands can execute store/runtime actions and produce `RuntimeLogEntry` records.

### AI-6 Host Console Integration

AI Host integrates with Host Console, visibility, reveal controls, `gmOnly` logs, NPC tools, and scene tools.

### AI-7 Multiplayer / Server-Authoritative AI

In multiplayer, AI commands are validated and executed by server-authoritative logic with permissions and visibility enforcement.

