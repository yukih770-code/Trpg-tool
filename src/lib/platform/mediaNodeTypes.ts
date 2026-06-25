/**
 * GM Prep media node / asset binding contracts (v0, types only).
 *
 * AI-LANDMARK: PREP_MEDIA_NODE_CONTRACTS_V0
 *
 * These are platform-level media contracts for GM prep and narrative-graph
 * workflows. They define asset references, media nodes, bindings, cue options,
 * and handoff intents. They do NOT implement upload, playback, triggers,
 * storage, UI, or system-specific rules (DND/COC/CP RED). System mapping is a
 * later concern.
 *
 * Three-layer model:
 *   - PrepMediaAssetRef : the resource itself (file/URL/ref + source/credit).
 *   - PrepMediaNode     : a media node's identity in the narrative graph.
 *   - PrepMediaBinding  : how a resource attaches to an owner (scene/NPC/etc.).
 * Default to a binding (attachment); promote to a MediaNode when the asset is
 * reused, triggerable, projectable to Runtime, or carries narrative meaning.
 */

export type PrepMediaKind =
  | 'image'
  | 'portrait'
  | 'sceneImage'
  | 'cg'
  | 'mapImage'
  | 'music'
  | 'ambience'
  | 'soundEffect'
  | 'document'
  | 'handout'
  | 'video'
  | 'other';

export type PrepMediaVisibility =
  | 'dmOnly'
  | 'playerShareable'
  | 'playerVisible'
  | 'projectable'
  | 'prepNote';

export type PrepMediaSourceType =
  | 'upload'
  | 'url'
  | 'localRef'
  | 'workshop'
  | 'module'
  | 'official'
  | 'custom'
  | 'generated'
  | 'unknown';

/** A reference to a media resource. Reference fields only — no upload here. */
export interface PrepMediaAssetRef {
  mediaId: string;
  kind: PrepMediaKind;
  sourceType: PrepMediaSourceType;
  uri?: string;
  filename?: string;
  mimeType?: string;
  title?: string;
  credit?: string;
  licenseNote?: string;
  sourceRef?: string;
  tags?: string[];
  note?: string;
}

export type PrepMediaNodeRole =
  | 'portrait'
  | 'backdrop'
  | 'sceneIllustration'
  | 'cg'
  | 'theme'
  | 'ambience'
  | 'battleMusic'
  | 'soundCue'
  | 'handout'
  | 'evidence'
  | 'map'
  | 'reference'
  | 'other';

/** A media node's identity within the narrative graph (reused/triggerable media). */
export interface PrepMediaNode {
  id: string;
  mediaId: string;
  kind: PrepMediaKind;
  role: PrepMediaNodeRole;
  title: string;
  description?: string;
  visibility: PrepMediaVisibility;
  tags: string[];
  sourceRef?: string;
  relatedCardIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type PrepMediaBindingOwnerType =
  | 'narrativeCard'
  | 'npcCard'
  | 'scene'
  | 'location'
  | 'clue'
  | 'handout'
  | 'encounter'
  | 'monster'
  | 'reward'
  | 'runtimeQuickView'
  | 'runtimeSlot'
  | 'custom';

export type PrepMediaBindingDisplayMode =
  | 'thumbnail'
  | 'inline'
  | 'background'
  | 'spotlight'
  | 'drawer'
  | 'audioCue'
  | 'hidden';

/** How a media resource attaches to an owner. Not the resource itself. */
export interface PrepMediaBinding {
  id: string;
  ownerType: PrepMediaBindingOwnerType;
  ownerId: string;
  mediaId: string;
  /** Set when the binding points at a promoted MediaNode (reused/triggerable). */
  mediaNodeId?: string;
  role: PrepMediaNodeRole;
  visibility: PrepMediaVisibility;
  displayMode?: PrepMediaBindingDisplayMode;
  sortOrder?: number;
  note?: string;
}

// ── Audio cue (structure only — no playback) ────────────────────────────────

export type PrepAudioPlaybackMode = 'oneShot' | 'loop' | 'playlist' | 'crossfadePlaceholder';

export interface PrepAudioCueOptions {
  playbackMode: PrepAudioPlaybackMode;
  volume?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
  loop?: boolean;
  note?: string;
}

export interface PrepMediaCue {
  id: string;
  mediaId: string;
  bindingId?: string;
  label: string;
  visibility: PrepMediaVisibility;
  audio?: PrepAudioCueOptions;
  note?: string;
}

// ── Runtime handoff intent (declaration only — execution is P7.10) ──────────

export type PrepMediaHandoffIntentType =
  | 'showImage'
  | 'setSceneBackdrop'
  | 'publishHandout'
  | 'playAudio'
  | 'stopAudio'
  | 'attachToQuickView'
  | 'appendRuntimeLog'
  | 'custom';

export interface PrepMediaHandoffIntent {
  id: string;
  type: PrepMediaHandoffIntentType;
  mediaId: string;
  mediaNodeId?: string;
  bindingId?: string;
  /** Optional target platform layout slot id (string-typed to avoid coupling). */
  targetRuntimeSlotId?: string;
  visibility: PrepMediaVisibility;
  requiresHostConfirm: boolean;
  note?: string;
}
