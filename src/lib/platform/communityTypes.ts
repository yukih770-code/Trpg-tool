/**
 * Platform Community / Fan Work — types (scaffold only).
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 *
 * Fan Plaza is the expressive sharing community (stories, recaps, illustrations,
 * comics, music, settings, character profiles, essays). Separate from the
 * Workshop (playable content). Fan works do NOT participate in subscription,
 * dependency, conflict, load-order, or session preflight checks.
 */

export type FanWorkType =
  | 'story'
  | 'campaignRecap'
  | 'illustration'
  | 'comic'
  | 'music'
  | 'setting'
  | 'characterProfile'
  | 'essay';

export type FanWorkContentFormat =
  | 'text'
  | 'imageGallery'
  | 'audio'
  | 'mixed'
  | 'externalLink';

/**
 * Cover / main-preview source for a fan work.
 * A fan work's visual is NOT fixed by its type — it follows this priority:
 *   authorSelected → firstImage → audioVisual → typeFallback.
 * Type fallback visuals are used ONLY when there is no author cover or media.
 */
export type FanWorkCoverMode =
  | 'authorSelected'
  | 'firstImage'
  | 'audioVisual'
  | 'typeFallback';

/** Content blocks a fan work actually contains (multimodal — many may apply). */
export type FanWorkContentBlockKind =
  | 'text'
  | 'image'
  | 'imageGallery'
  | 'audio'
  | 'externalLink'
  | 'relationEmbed'
  | 'workshopEmbed';

export type FanWorkVisibility = 'public' | 'unlisted' | 'private';

/** Adapted-system / world background tag (NOT rule participation). */
export type FanWorkSystem = 'dnd5e2024' | 'coc7e' | 'cyberpunkRed' | 'generic' | 'original';

export type FanWork = {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  type: FanWorkType;
  format: FanWorkContentFormat;
  /** Cover source (authorSelected | firstImage | audioVisual | typeFallback). */
  coverMode: FanWorkCoverMode;
  /** Type-fallback visual kind (used only when no author cover / primary media). */
  coverKind?: FanWorkType;
  /** Optional author-supplied cover label (display only — no real image). */
  coverLabel?: string;
  /** Multimodal content blocks this work actually contains. */
  contentBlocks: FanWorkContentBlockKind[];
  summary: string;
  bodyPreview: string;
  coverImage?: string;
  tags: string[];
  systemId?: FanWorkSystem;
  visibility: FanWorkVisibility;
  /** Interface skeleton only — not a real accessible link. */
  shareCode: string;
  publicPathLabel: string;
  /**
   * @deprecated Legacy private relation array. No longer queried by the UI —
   * cross-object relations now live in the EntityGraph. Retained only as a seed
   * source (`lib/architecture/entityGraphSeed`). Query via EntityGraphRepository.
   */
  relationIds: string[];
  /**
   * @deprecated Seed source only (consumed by entityGraphSeed to build
   * workshop↔fanwork edges). Query relations via EntityGraphRepository.
   */
  relatedWorkshopItemIds?: string[];
  createdAtLabel: string;
  updatedAtLabel: string;
  likeCount: number;
  favoriteCount: number;
  commentCount: number;
};
