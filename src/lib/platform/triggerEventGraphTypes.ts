/**
 * GM Prep trigger / event graph contracts (v0, types only).
 *
 * AI-LANDMARK: PREP_TRIGGER_EVENT_GRAPH_CONTRACTS_V0
 *
 * These are platform-level trigger and event graph contracts for GM prep
 * workflows. They define event nodes, trigger nodes, state change declarations,
 * graph edges, and manual-first execution metadata. They do NOT implement
 * trigger execution, condition evaluation, scripting, storage, UI, media
 * playback, or system-specific rules (DND/COC/CP RED).
 *
 * Principles: manual-first triggers only; condition triggers are a reserved
 * placeholder (no expression/if-else/variable/script). Every trigger is meant to
 * be previewable, confirmable, skippable, and undoable. References to media /
 * RuntimeLog / narrative cards are by id only — this module imports nothing and
 * stays platform-neutral.
 */

export type PrepEventVisibility =
  | 'dmOnly'
  | 'playerShareable'
  | 'playerVisible'
  | 'projectable'
  | 'prepNote';

// ── Event nodes ─────────────────────────────────────────────────────────────

export type PrepEventNodeKind =
  | 'storyBeat'
  | 'sceneTransition'
  | 'npcEntrance'
  | 'npcExit'
  | 'clueReveal'
  | 'handoutReveal'
  | 'mediaCue'
  | 'encounterStart'
  | 'encounterEnd'
  | 'trapTriggered'
  | 'hazardTriggered'
  | 'rewardGranted'
  | 'questUpdated'
  | 'stateChanged'
  | 'runtimeLog'
  | 'custom';

/** A "something happens" node in the prep graph. NOT a RuntimeLog entry. */
export interface PrepEventNode {
  id: string;
  kind: PrepEventNodeKind;
  title: string;
  description?: string;
  visibility: PrepEventVisibility;
  tags: string[];
  relatedCardIds?: string[];
  relatedMediaIds?: string[];
  relatedEncounterIds?: string[];
  sourceRef?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── State change declarations (intent only — never applied here) ────────────

export type PrepStateChangeTargetType =
  | 'npc'
  | 'playerCharacter'
  | 'monster'
  | 'runtimeActor'
  | 'scene'
  | 'location'
  | 'clue'
  | 'quest'
  | 'relationship'
  | 'handout'
  | 'custom';

export type PrepStateChangeKind =
  | 'setStatus'
  | 'addStatus'
  | 'removeStatus'
  | 'changeAttitude'
  | 'changeVisibility'
  | 'markDiscovered'
  | 'markResolved'
  | 'markDefeated'
  | 'markDead'
  | 'updateQuestState'
  | 'updateRelationship'
  | 'applyRuntimeChangePlaceholder'
  | 'custom';

/** A declared INTENT to change state. Not a RuntimeChange; applies nothing. */
export interface PrepStateChangeDeclaration {
  id: string;
  kind: PrepStateChangeKind;
  targetType: PrepStateChangeTargetType;
  targetId: string;
  label: string;
  value?: string | number | boolean;
  note?: string;
  visibility?: PrepEventVisibility;
  requiresHostConfirm: boolean;
}

// ── Trigger nodes (manual-first) ────────────────────────────────────────────

export type PrepTriggerKind =
  // Reserved for a FUTURE condition system. v0 implements no condition engine,
  // no expressions, no if/else/variables/scripts.
  | 'manual'
  | 'conditionPlaceholder';

export type PrepTriggerStatus = 'draft' | 'armed' | 'fired' | 'skipped' | 'disabled';

export interface PrepTriggerNode {
  id: string;
  kind: PrepTriggerKind;
  title: string;
  description?: string;
  status: PrepTriggerStatus;
  eventNodeIds: string[];
  stateChangeIds?: string[];
  mediaHandoffIntentIds?: string[];
  visibility: PrepEventVisibility;
  requiresPreview: boolean;
  requiresHostConfirm: boolean;
  canSkip: boolean;
  canUndo: boolean;
  note?: string;
}

// ── Graph edges ─────────────────────────────────────────────────────────────

export type PrepEventGraphEdgeKind =
  | 'related'
  | 'precedes'
  | 'follows'
  | 'causes'
  | 'requires'
  | 'reveals'
  | 'foreshadows'
  | 'resolves'
  | 'blocks'
  | 'unlocks'
  | 'triggers'
  | 'changesState'
  | 'projectsToRuntime'
  | 'writesBackFromRuntime';

export interface PrepEventGraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  kind: PrepEventGraphEdgeKind;
  label?: string;
  visibility?: PrepEventVisibility;
  note?: string;
}

// ── Execution preview / record (metadata only — no execution) ───────────────

export type PrepTriggerExecutionMode = 'preview' | 'manualFire' | 'skip' | 'undoPlaceholder';

export interface PrepTriggerExecutionPreview {
  triggerId: string;
  eventNodeIds: string[];
  stateChangeIds: string[];
  mediaHandoffIntentIds: string[];
  warnings: string[];
  requiresHostConfirm: boolean;
}

/** A record of a (manual) trigger handling — describes, does not execute. */
export interface PrepTriggerExecutionRecord {
  id: string;
  triggerId: string;
  mode: PrepTriggerExecutionMode;
  firedEventNodeIds: string[];
  appliedStateChangeIds: string[];
  mediaHandoffIntentIds: string[];
  runtimeLogEventIds?: string[];
  sessionId?: string;
  note?: string;
  createdAt?: string;
}

// ── Graph container ─────────────────────────────────────────────────────────

export interface PrepEventGraph {
  id: string;
  title: string;
  description?: string;
  eventNodes: PrepEventNode[];
  stateChanges: PrepStateChangeDeclaration[];
  triggerNodes: PrepTriggerNode[];
  edges: PrepEventGraphEdge[];
  executionRecords?: PrepTriggerExecutionRecord[];
  tags: string[];
  visibility: PrepEventVisibility;
  sourceRef?: string;
  createdAt?: string;
  updatedAt?: string;
}
