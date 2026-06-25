/**
 * GM Prep Narrative Card contracts (v0, types only).
 *
 * AI-LANDMARK: NARRATIVE_CARD_CONTRACTS_V0
 *
 * These are PLATFORM-level contracts. They do not implement UI, storage,
 * triggers, media playback, or system rules. DND/COC/CP RED specific rules must
 * be provided by system-specific panels or resolvers.
 *
 * The Narrative Card is the base primitive for the GM Prep / Narrative & Media
 * Workspace: text cards, NPC/scene/clue/event/media nodes, and their links.
 * Media is referenced by id only (no upload/playback); triggers are structural
 * placeholders only (manual-first; no condition engine in v0).
 */

export type NarrativeVisibility =
  | 'dmOnly'
  | 'playerShareable'
  | 'playerVisible'
  | 'projectable'
  | 'prepNote';

export type NarrativeCardKind =
  | 'generic'
  | 'npc'
  | 'scene'
  | 'location'
  | 'clue'
  | 'handout'
  | 'event'
  | 'stateChange'
  | 'media'
  | 'encounter'
  | 'reward'
  | 'trap'
  | 'hazard'
  | 'faction'
  | 'relationship'
  | 'chronicle';

export type NarrativeLinkKind =
  | 'related'
  | 'causes'
  | 'requires'
  | 'reveals'
  | 'foreshadows'
  | 'resolves'
  | 'contains'
  | 'appearsIn'
  | 'belongsTo'
  | 'opposes'
  | 'alliesWith'
  | 'triggers'
  | 'projectsToRuntime'
  | 'writesBackFromRuntime';

export interface NarrativeSourceRef {
  sourceId?: string;
  sourceType?: 'module' | 'workshop' | 'official' | 'custom' | 'runtime' | 'import';
  sourcePath?: string;
  note?: string;
}

export interface NarrativeCardLink {
  targetId: string;
  kind: NarrativeLinkKind;
  label?: string;
  visibility?: NarrativeVisibility;
  note?: string;
}

export interface NarrativeCardSummary {
  title: string;
  subtitle?: string;
  oneLine?: string;
  tags?: string[];
}

export interface NarrativeCardContent {
  summary?: string;
  body?: string;
  gmNotes?: string;
  playerText?: string;
}

// ── Media / event-graph placeholders (structure only; no playback/triggers) ──

export type NarrativeMediaKind =
  | 'image'
  | 'portrait'
  | 'sceneImage'
  | 'cg'
  | 'music'
  | 'ambience'
  | 'soundEffect'
  | 'document'
  | 'mapImage'
  | 'other';

/** A reference to a media asset by id only — no file upload or playback here. */
export interface NarrativeMediaBinding {
  mediaId: string;
  kind: NarrativeMediaKind;
  role?: 'portrait' | 'backdrop' | 'theme' | 'handout' | 'evidence' | 'ambience' | 'battleMusic' | 'reference';
  visibility?: NarrativeVisibility;
  note?: string;
}

export type NarrativeTriggerKind =
  | 'manual'
  // Reserved for a FUTURE condition system. v0 must not implement a condition
  // engine; this literal only marks intent on the structure.
  | 'conditionPlaceholder';

export interface NarrativeTriggerRef {
  triggerId: string;
  kind: NarrativeTriggerKind;
  targetCardId?: string;
  note?: string;
}

export interface NarrativeCard {
  id: string;
  kind: NarrativeCardKind;
  summary: NarrativeCardSummary;
  content?: NarrativeCardContent;
  visibility: NarrativeVisibility;
  tags: string[];
  links: NarrativeCardLink[];
  /** Media referenced by id only; binding declares role/visibility, not playback. */
  mediaBindings?: NarrativeMediaBinding[];
  /** Structural trigger references; v0 is manual-first, no condition engine. */
  triggerRefs?: NarrativeTriggerRef[];
  sourceRef?: NarrativeSourceRef;
  createdAt?: string;
  updatedAt?: string;
}
