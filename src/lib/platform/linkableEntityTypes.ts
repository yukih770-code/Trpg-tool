/**
 * Platform Linkable Entity — types (scaffold only).
 *
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 *
 * Cross-platform object-linking interface skeleton. Lets core objects
 * (actor / campaign / map / session log / workshop item / fan work / world /
 * npc / music / handout) be represented as shareable, linkable summaries with
 * a share code, a public-path label, and a visibility.
 *
 * Scope: interface skeleton + static metadata only. `shareCode` / `publicPathLabel`
 * are NOT real accessible URLs. No real copy-link, permission check, or routing.
 */

export type LinkableEntityType =
  | 'actor'
  | 'campaign'
  | 'sessionLog'
  | 'map'
  | 'workshopItem'
  | 'fanWork'
  | 'world'
  | 'npc'
  | 'music'
  | 'handout';

export type EntityVisibility =
  | 'private'
  | 'campaignOnly'
  | 'unlisted'
  | 'public';

export type EntityRelationKind =
  | 'features'
  | 'belongsTo'
  | 'inspiredBy'
  | 'uses'
  | 'recaps'
  | 'mentions'
  | 'adaptedFrom'
  | 'relatedTo';

export type LinkableEntitySummary = {
  id: string;
  type: LinkableEntityType;
  title: string;
  subtitle?: string;
  summary: string;
  visibility: EntityVisibility;
  /** Interface skeleton only — not a real accessible link. e.g. ACT-ELYNA */
  shareCode: string;
  /** Display label only. e.g. /share/actor/elyna */
  publicPathLabel: string;
  thumbnail?: string;
  tags: string[];
};

export type EntityRelation = {
  id: string;
  sourceType: LinkableEntityType;
  sourceId: string;
  targetType: LinkableEntityType;
  targetId: string;
  relationKind: EntityRelationKind;
  label: string;
  description?: string;
};
