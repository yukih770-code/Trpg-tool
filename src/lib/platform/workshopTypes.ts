/**
 * Platform Workshop — types and interface contracts.
 *
 * AI-LANDMARK: WORKSHOP_FULL_INTERFACE_SCAFFOLD_V1
 * (supersedes WORKSHOP_BROWSE_SUBSCRIPTIONS_UX_REFINEMENT_V1)
 *
 * Browse taxonomy:
 *   Primary category  — character | creatureNpc | ruleContent | mapScene |
 *                       adventureModule | mediaAsset | toolTemplate
 *   Subtype           — contextual per primary category (see WORKSHOP_SUBTYPES)
 *                       answers "what kind of content is this?"
 *   Attribute tags    — cross-cutting characteristics (see WORKSHOP_ATTRIBUTE_TAGS)
 *                       answers "what traits does this content have?"
 *   Adapted system    — dnd5e2024 | coc7e | cyberpunkRed | generic
 *   Content shape     — singleItem | contentPack | collection
 *   Sort              — featured | newest | recentlyUpdated | popular |
 *                       highRated | popularDependency
 *
 * Subscription status (background checks — progressive disclosure):
 *   ok | needsAttention | hasUpdate | missingDependency |
 *   possibleConflict | affectsCampaign | disabled
 *   Surface only as item-level badges; not a top-level tab.
 *
 * Scope:
 *   No store, no schema, no real subscription, download, import, install,
 *   update, dependency check, conflict detection, or preflight logic.
 *   UI shell, type definitions, and interface stubs only. Public catalog and
 *   subscription records must come from a repository; this module must not
 *   seed fictional community content.
 */

// ─── Primary taxonomy types ───────────────────────────────────────────────────

export type WorkshopCategory =
  | 'character'
  | 'creatureNpc'
  | 'ruleContent'
  | 'mapScene'
  | 'adventureModule'
  | 'mediaAsset'
  | 'toolTemplate';

export type WorkshopSystem = 'dnd5e2024' | 'coc7e' | 'cyberpunkRed' | 'generic';

/**
 * Static preview-image kind. Drives the PreviewArt cover placeholder so each
 * content style has a distinct look. Does NOT reference a real image.
 */
export type WorkshopPreviewImageKind =
  | 'rulebook'
  | 'map'
  | 'music'
  | 'character'
  | 'npc'
  | 'tool'
  | 'adventure';

export type WorkshopContentShape = 'singleItem' | 'contentPack' | 'collection';

export type WorkshopSort =
  | 'featured'
  | 'newest'
  | 'recentlyUpdated'
  | 'popular'
  | 'highRated'
  | 'popularDependency';

export type WorkshopLandingTarget =
  | 'actorVault'
  | 'npcLibrary'
  | 'campaignAssets'
  | 'mapLibrary'
  | 'mediaLibrary'
  | 'systemRuleSources'
  | 'campaignVault'
  | 'moduleLibrary'
  | 'toolLibrary'
  | 'splitByShape';

/** What platform areas does this content affect at runtime / character creation? */
export type WorkshopImpactScope =
  | 'none'
  | 'characterCreation'
  | 'rulesCompendium'
  | 'runtime'
  | 'campaign'
  | 'session'
  | 'assetsOnly';

/** Dependency resolution status (background check — scaffold stub only). */
export type WorkshopDependencyStatus =
  | 'none'
  | 'satisfied'
  | 'missing'
  | 'versionMismatch'
  | 'reserved';

/**
 * Subscription item status key.
 * Surfaces as item-level badge only (progressive disclosure).
 * Not a top-level tab.
 */
export type WorkshopSubscriptionStatusKey =
  | 'ok'
  | 'needsAttention'
  | 'hasUpdate'
  | 'missingDependency'
  | 'possibleConflict'
  | 'affectsCampaign'
  | 'disabled';

// ─── Action interface stubs ───────────────────────────────────────────────────

/** Result shape for all Workshop action stubs (interface reserved). */
export type WorkshopActionResult = {
  ok: boolean;
  message: string;
  status: 'reserved' | 'localOnly' | 'notImplemented';
};

/**
 * Workshop action interface — all methods are interface stubs only.
 * No real subscription, import, download, install, update, dependency check,
 * conflict detection, rule override, or session preflight is implemented.
 */
export type WorkshopActions = {
  previewItem: (itemId: string) => WorkshopActionResult;
  reserveSubscribe: (itemId: string) => WorkshopActionResult;
  reserveUnsubscribe: (itemId: string) => WorkshopActionResult;
  reserveEnable: (itemId: string) => WorkshopActionResult;
  reserveDisable: (itemId: string) => WorkshopActionResult;
  reserveResolveDependency: (itemId: string) => WorkshopActionResult;
  reserveResolveConflict: (itemId: string) => WorkshopActionResult;
  reserveApplySubscriptionProfile: (profileId: string) => WorkshopActionResult;
  reserveRunPreflightCheck: (campaignId?: string) => WorkshopActionResult;
};

/** Stub implementation — all actions return reserved status. */
export const WORKSHOP_ACTION_STUBS: WorkshopActions = {
  previewItem: (_id) => ({ ok: false, message: 'Preview interface reserved.', status: 'reserved' }),
  reserveSubscribe: (_id) => ({ ok: false, message: 'Subscribe interface reserved.', status: 'reserved' }),
  reserveUnsubscribe: (_id) => ({ ok: false, message: 'Unsubscribe interface reserved.', status: 'reserved' }),
  reserveEnable: (_id) => ({ ok: false, message: 'Enable interface reserved.', status: 'reserved' }),
  reserveDisable: (_id) => ({ ok: false, message: 'Disable interface reserved.', status: 'reserved' }),
  reserveResolveDependency: (_id) => ({ ok: false, message: 'Dependency resolution reserved.', status: 'reserved' }),
  reserveResolveConflict: (_id) => ({ ok: false, message: 'Conflict resolution reserved.', status: 'reserved' }),
  reserveApplySubscriptionProfile: (_id) => ({ ok: false, message: 'Subscription profile interface reserved.', status: 'reserved' }),
  reserveRunPreflightCheck: (_id) => ({ ok: false, message: 'Preflight check interface reserved.', status: 'reserved' }),
};

// ─── Taxonomy constants ───────────────────────────────────────────────────────

export const WORKSHOP_CATEGORY_KEYS: WorkshopCategory[] = [
  'character',
  'creatureNpc',
  'ruleContent',
  'mapScene',
  'adventureModule',
  'mediaAsset',
  'toolTemplate',
];

export const WORKSHOP_SYSTEM_KEYS: WorkshopSystem[] = [
  'dnd5e2024',
  'coc7e',
  'cyberpunkRed',
  'generic',
];

export const WORKSHOP_CONTENT_SHAPE_KEYS: WorkshopContentShape[] = [
  'singleItem',
  'contentPack',
  'collection',
];

export const WORKSHOP_SORT_KEYS: WorkshopSort[] = [
  'featured',
  'newest',
  'recentlyUpdated',
  'popular',
  'highRated',
  'popularDependency',
];

export const WORKSHOP_SUBSCRIPTION_STATUS_KEYS: WorkshopSubscriptionStatusKey[] = [
  'ok',
  'needsAttention',
  'hasUpdate',
  'missingDependency',
  'possibleConflict',
  'affectsCampaign',
  'disabled',
];

export const WORKSHOP_IMPACT_SCOPE_KEYS: WorkshopImpactScope[] = [
  'none', 'characterCreation', 'rulesCompendium', 'runtime', 'campaign', 'session', 'assetsOnly',
];

export const WORKSHOP_DEPENDENCY_STATUS_KEYS: WorkshopDependencyStatus[] = [
  'none', 'satisfied', 'missing', 'versionMismatch', 'reserved',
];

/**
 * Contextual subtypes per primary category.
 * Answers: "What kind of content is this?"
 */
export const WORKSHOP_SUBTYPES: Record<WorkshopCategory, string[]> = {
  character: [
    'presetCharacter', 'characterTemplate', 'buildGuide',
    'characterBackground', 'artworkBound',
  ],
  creatureNpc: [
    'npc', 'monster', 'boss', 'merchant', 'companion',
    'factionCharacter', 'organizationMember',
  ],
  ruleContent: [
    'rulePackage', 'characterOption', 'spellAbility',
    'equipmentItem', 'creatureRule', 'mechanicAdjustment', 'referenceTable',
  ],
  mapScene: [
    'battleMap', 'regionMap', 'cityMap', 'dungeonMap',
    'buildingMap', 'wildernessMap', 'worldMap', 'scenePack',
  ],
  adventureModule: [
    'singleAdventure', 'shortAdventure', 'longCampaign',
    'encounter', 'dungeon', 'investigationScript', 'scenePack',
  ],
  mediaAsset: [
    'music', 'sfx', 'ambience', 'voicePack',
    'characterArt', 'illustration', 'icon', 'token', 'handout',
  ],
  toolTemplate: [
    'randomTable', 'macro', 'generatorTemplate', 'characterSheetTemplate',
    'quickReference', 'gmTool', 'playerTool',
  ],
};

/**
 * Contextual attribute tags per primary category.
 * Answers: "What characteristics does this content have?"
 * Cross-cutting; multiple may apply to a single item.
 */
export const WORKSHOP_ATTRIBUTE_TAGS: Record<WorkshopCategory, string[]> = {
  character: [
    'beginnerRecommended', 'lowLevel', 'midLevel', 'highLevel',
    'readyToPlay', 'importable', 'storyFocused', 'combatFocused',
  ],
  creatureNpc: [
    'combatable', 'conversable', 'friendly', 'hostile',
    'neutral', 'elite', 'groupUnit', 'recruitable',
  ],
  ruleContent: [
    'affectsCharacterCreation', 'affectsCombat', 'affectsRest',
    'affectsEquipment', 'affectsCasting', 'requiresGmApproval', 'mayOverrideRules',
  ],
  mapScene: [
    'gridded', 'gridless', 'vttReady', 'printable',
    'multiFloor', 'dynamicLighting', 'includesTokens', 'includesWalls',
  ],
  adventureModule: [
    'beginnerFriendly', 'combatFocused', 'narrativeFocused', 'investigationFocused',
    'horror', 'fantasy', 'cyberpunk', 'episodic', 'requiresMap', 'includesHandout',
  ],
  mediaAsset: [
    'loopable', 'combatAtmosphere', 'investigationAtmosphere', 'urbanScene',
    'horrorAtmosphere', 'printable', 'transparentBg', 'licenseUnconfirmed',
  ],
  toolTemplate: [
    'generic', 'systemSpecific', 'beginnerRecommended', 'automated',
    'assistOnly', 'requiresSetup',
  ],
};

/** Default preview-image kind per primary category (fallback when item omits it). */
export const WORKSHOP_PREVIEW_KIND_MAP: Record<WorkshopCategory, WorkshopPreviewImageKind> = {
  character:       'character',
  creatureNpc:     'npc',
  ruleContent:     'rulebook',
  mapScene:        'map',
  adventureModule: 'adventure',
  mediaAsset:      'music',
  toolTemplate:    'tool',
};

/** Default content landing target per primary category. */
export const WORKSHOP_LANDING_MAP: Record<WorkshopCategory, WorkshopLandingTarget> = {
  character:       'actorVault',
  creatureNpc:     'npcLibrary',
  ruleContent:     'systemRuleSources',
  mapScene:        'mapLibrary',
  adventureModule: 'campaignVault',
  mediaAsset:      'mediaLibrary',
  toolTemplate:    'toolLibrary',
};

// ─── Item types ───────────────────────────────────────────────────────────────

export type LocalizedText = { 'zh-CN': string; en: string };

export type WorkshopBrowseItem = {
  id: string;
  title: LocalizedText;
  author: string;
  description: LocalizedText;
  category: WorkshopCategory;
  subtype?: string;
  attributeTags: string[];
  system: WorkshopSystem;
  contentShape: WorkshopContentShape;
  version: string;
  lastUpdatedLabel: string;
  dependencyStatus: WorkshopDependencyStatus;
  impactScope: WorkshopImpactScope;
  /** Static cover preview kind (drives PreviewArt). No real image. */
  previewImageKind: WorkshopPreviewImageKind;
  /** Optional gradient accent override (hex) for the cover. */
  previewAccent?: string;
  /** Small static gallery preview kinds (detail view thumbnails). No real images. */
  galleryPreviewKinds?: WorkshopPreviewImageKind[];
  /** Only set for collection-shaped items that span multiple categories. */
  contains?: WorkshopCategory[];
};

/** Resolve an item's preview kind, falling back to the category default. */
export function workshopPreviewKind(item: WorkshopBrowseItem): WorkshopPreviewImageKind {
  return item.previewImageKind ?? WORKSHOP_PREVIEW_KIND_MAP[item.category];
}

export type WorkshopSubscriptionItem = {
  id: string;
  title: LocalizedText;
  author: string;
  category: WorkshopCategory;
  subtype?: string;
  system: WorkshopSystem;
  contentShape: WorkshopContentShape;
  version: string;
  lastUpdatedLabel: string;
  landing: WorkshopLandingTarget;
  dependencyStatus: WorkshopDependencyStatus;
  impactScope: WorkshopImpactScope;
  status: WorkshopSubscriptionStatusKey;
};

// ─── Locale helper ────────────────────────────────────────────────────────────

export function localized(text: LocalizedText, locale: string): string {
  return locale === 'en' ? text.en : text['zh-CN'];
}
