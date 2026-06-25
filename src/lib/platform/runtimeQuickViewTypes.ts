/**
 * Runtime Quick View contracts (v0, types only).
 *
 * AI-LANDMARK: RUNTIME_QUICK_VIEW_CONTRACTS_V0
 *
 * These are PLATFORM-level contracts. They do not implement UI, storage,
 * triggers, media playback, or system rules. DND/COC/CP RED specific rules must
 * be provided by system-specific panels or resolvers.
 *
 * Runtime Quick View unifies the VIEW FORMAT (not the underlying model) for
 * looking at a player character / NPC / monster / trap / summon / object /
 * scene element during play. System-specific values (spell slots, SAN,
 * Humanity, death saves, class resources, specific weapon actions) are NOT
 * modeled here — they go through the generic `resources` / `keyTraits` /
 * `visibleActions` fields or behind `detailRef`, filled by system panels.
 *
 * This module intentionally imports nothing (no dnd2024 / gameplay coupling).
 */

export type RuntimeQuickViewEntityKind =
  | 'playerCharacter'
  | 'npc'
  | 'monster'
  | 'summon'
  | 'trap'
  | 'hazard'
  | 'object'
  | 'scene'
  | 'location'
  | 'custom';

export type RuntimeQuickViewVisibility = 'hostOnly' | 'playerVisible' | 'public' | 'hidden';

export interface RuntimeQuickViewBasicSection {
  name: string;
  displayName?: string;
  kind: RuntimeQuickViewEntityKind;
  subtitle?: string;
  oneLine?: string;
  age?: string;
  gender?: string;
  species?: string;
  role?: string;
  portraitMediaId?: string;
}

export interface RuntimeQuickViewResource {
  id: string;
  label: string;
  current?: number;
  max?: number;
  note?: string;
}

export interface RuntimeQuickViewCombatSection {
  hpCurrent?: number;
  hpMax?: number;
  tempHp?: number;
  armorClass?: number;
  defenseLabel?: string;
  initiative?: number;
  speed?: string;
  conditions?: string[];
  buffs?: string[];
  debuffs?: string[];
  keyTraits?: string[];
  visibleActions?: string[];
  /** Generic resource readout; system-specific pools (slots/SAN/etc.) map here. */
  resources?: RuntimeQuickViewResource[];
}

export interface RuntimeQuickViewRelationship {
  targetId: string;
  label?: string;
  note?: string;
  visibility?: RuntimeQuickViewVisibility;
}

export interface RuntimeQuickViewSecret {
  id: string;
  title: string;
  note: string;
  visibility: 'hostOnly';
}

export interface RuntimeQuickViewNarrativeSection {
  backgroundSummary?: string;
  currentGoal?: string;
  currentAttitude?: string;
  relationships?: RuntimeQuickViewRelationship[];
  secrets?: RuntimeQuickViewSecret[];
  relatedSceneIds?: string[];
  /** Points at NarrativeCard ids — summaries only; the full body stays in the card. */
  relatedCardIds?: string[];
}

export interface RuntimeQuickViewMediaSection {
  portraitMediaId?: string;
  sceneMediaIds?: string[];
  handoutIds?: string[];
  audioCueIds?: string[];
}

export type RuntimeQuickViewSourceType =
  | 'character'
  | 'npcCard'
  | 'monsterStatBlock'
  | 'runtimeActor'
  | 'narrativeCard'
  | 'trap'
  | 'hazard'
  | 'custom';

export interface RuntimeQuickViewDetailRef {
  type: 'characterSheet' | 'npcCard' | 'monsterStatBlock' | 'narrativeCard' | 'runtimeActor' | 'custom';
  id: string;
}

export interface RuntimeQuickView {
  id: string;
  /** Id of the underlying source object (character / npc card / stat block / actor / …). */
  sourceId: string;
  sourceType: RuntimeQuickViewSourceType;

  visibility: RuntimeQuickViewVisibility;

  basic: RuntimeQuickViewBasicSection;
  combat?: RuntimeQuickViewCombatSection;
  narrative?: RuntimeQuickViewNarrativeSection;
  media?: RuntimeQuickViewMediaSection;

  /** Entry point to the full detail surface (sheet / card / stat block). */
  detailRef?: RuntimeQuickViewDetailRef;
}
