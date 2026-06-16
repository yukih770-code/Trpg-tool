/**
 * Platform Workshop — types, interface stubs, and static sample data.
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
 *   UI scaffold, type definitions, interface stubs, and static sample data only.
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

// ─── Static browse samples (6 items) ─────────────────────────────────────────

export const WORKSHOP_BROWSE_SAMPLES: WorkshopBrowseItem[] = [
  {
    id: 'sample.dnd-expansion-rules',
    title: { 'zh-CN': 'DND 扩展规则包', en: 'DND Expansion Rule Package' },
    author: 'Workshop Sample',
    description: {
      'zh-CN': '为 DND 5e 2024 系统设计的扩展规则包，新增职业特性与规则调整，订阅后进入系统规则来源。',
      en: 'An expansion rule package for DND 5e 2024, adding class features and mechanic adjustments.',
    },
    category: 'ruleContent',
    subtype: 'rulePackage',
    attributeTags: ['affectsCharacterCreation', 'mayOverrideRules'],
    system: 'dnd5e2024',
    contentShape: 'singleItem',
    version: 'v1.0.0',
    lastUpdatedLabel: '2025-06-01',
    dependencyStatus: 'none',
    impactScope: 'characterCreation',
    previewImageKind: 'rulebook',
    galleryPreviewKinds: ['rulebook', 'tool'],
  },
  {
    id: 'sample.castle-investigation-maps',
    title: { 'zh-CN': '古堡调查地图包', en: 'Old Castle Investigation Map Pack' },
    author: 'Workshop Sample',
    description: {
      'zh-CN': 'COC 7e 风格的古堡建筑地图包，无网格可打印，适合调查剧本使用。',
      en: 'A COC 7e style castle building map pack, gridless and printable, suited for investigation scenarios.',
    },
    category: 'mapScene',
    subtype: 'buildingMap',
    attributeTags: ['gridless', 'printable'],
    system: 'coc7e',
    contentShape: 'contentPack',
    version: 'v1.1.0',
    lastUpdatedLabel: '2025-05-20',
    dependencyStatus: 'none',
    impactScope: 'assetsOnly',
    previewImageKind: 'map',
    galleryPreviewKinds: ['map', 'map', 'adventure'],
  },
  {
    id: 'sample.night-city-ambience',
    title: { 'zh-CN': '夜城环境音乐包', en: 'Night City Ambience Music Pack' },
    author: 'Workshop Sample',
    description: {
      'zh-CN': 'Cyberpunk RED 风格环境音乐包，城市场景循环播放，订阅后进入媒体素材库。',
      en: 'A Cyberpunk RED ambience music pack with loopable city scene tracks.',
    },
    category: 'mediaAsset',
    subtype: 'ambience',
    attributeTags: ['loopable', 'urbanScene'],
    system: 'cyberpunkRed',
    contentShape: 'contentPack',
    version: 'v1.0.2',
    lastUpdatedLabel: '2025-04-15',
    dependencyStatus: 'none',
    impactScope: 'assetsOnly',
    previewImageKind: 'music',
    galleryPreviewKinds: ['music', 'music'],
  },
  {
    id: 'sample.dnd-starter-character-template',
    title: { 'zh-CN': '新手角色模板', en: 'Starter Character Template' },
    author: 'Workshop Sample',
    description: {
      'zh-CN': 'DND 5e 2024 新手推荐角色模板，低等级即开即用，订阅后进入角色库。',
      en: 'A DND 5e 2024 beginner-recommended character template. Low level, ready to play.',
    },
    category: 'character',
    subtype: 'characterTemplate',
    attributeTags: ['beginnerRecommended', 'lowLevel', 'readyToPlay'],
    system: 'dnd5e2024',
    contentShape: 'singleItem',
    version: 'v1.0.0',
    lastUpdatedLabel: '2025-03-10',
    dependencyStatus: 'none',
    impactScope: 'assetsOnly',
    previewImageKind: 'character',
    galleryPreviewKinds: ['character', 'character'],
  },
  {
    id: 'sample.coc-investigator-npc-pack',
    title: { 'zh-CN': 'COC 调查员 NPC 包', en: 'COC Investigator NPC Pack' },
    author: 'Workshop Sample',
    description: {
      'zh-CN': 'COC 7e 调查员 NPC 内容包，可对话中立角色，适合调查剧本，订阅后进入 NPC 库。',
      en: 'A COC 7e investigator NPC content pack with conversable neutral characters for investigation scenarios.',
    },
    category: 'creatureNpc',
    subtype: 'npc',
    attributeTags: ['conversable', 'neutral'],
    system: 'coc7e',
    contentShape: 'contentPack',
    version: 'v1.0.1',
    lastUpdatedLabel: '2025-05-01',
    dependencyStatus: 'none',
    impactScope: 'assetsOnly',
    previewImageKind: 'npc',
    galleryPreviewKinds: ['npc', 'npc', 'character'],
  },
  {
    id: 'sample.random-encounter-template',
    title: { 'zh-CN': '随机遭遇表模板', en: 'Random Encounter Table Template' },
    author: 'Workshop Sample',
    description: {
      'zh-CN': '通用随机遭遇表模板，GM 辅助工具，仅辅助作用，订阅后进入工具模板库。',
      en: 'A generic random encounter table template. GM assist-only tool, lands in tool library.',
    },
    category: 'toolTemplate',
    subtype: 'randomTable',
    attributeTags: ['generic', 'assistOnly'],
    system: 'generic',
    contentShape: 'singleItem',
    version: 'v1.0.0',
    lastUpdatedLabel: '2025-02-28',
    dependencyStatus: 'none',
    impactScope: 'assetsOnly',
    previewImageKind: 'tool',
    galleryPreviewKinds: ['tool', 'rulebook'],
  },
];

// ─── Static subscription samples (4 items with varied status badges) ──────────

export const WORKSHOP_SUBSCRIPTION_SAMPLES: WorkshopSubscriptionItem[] = [
  {
    id: 'sub.dnd-expansion-rules',
    title: { 'zh-CN': 'DND 扩展规则包', en: 'DND Expansion Rule Package' },
    author: 'Workshop Sample',
    category: 'ruleContent',
    subtype: 'rulePackage',
    system: 'dnd5e2024',
    contentShape: 'singleItem',
    version: 'v1.0.0',
    lastUpdatedLabel: '2025-06-01',
    landing: 'systemRuleSources',
    dependencyStatus: 'none',
    impactScope: 'characterCreation',
    status: 'ok',
  },
  {
    id: 'sub.castle-investigation-maps',
    title: { 'zh-CN': '古堡调查地图包', en: 'Old Castle Investigation Map Pack' },
    author: 'Workshop Sample',
    category: 'mapScene',
    subtype: 'buildingMap',
    system: 'coc7e',
    contentShape: 'contentPack',
    version: 'v1.0.0',
    lastUpdatedLabel: '2025-04-01',
    landing: 'mapLibrary',
    dependencyStatus: 'none',
    impactScope: 'assetsOnly',
    status: 'hasUpdate',
  },
  {
    id: 'sub.night-city-ambience',
    title: { 'zh-CN': '夜城环境音乐包', en: 'Night City Ambience Music Pack' },
    author: 'Workshop Sample',
    category: 'mediaAsset',
    subtype: 'ambience',
    system: 'cyberpunkRed',
    contentShape: 'contentPack',
    version: 'v1.0.2',
    lastUpdatedLabel: '2025-04-15',
    landing: 'mediaLibrary',
    dependencyStatus: 'none',
    impactScope: 'assetsOnly',
    status: 'ok',
  },
  {
    id: 'sub.dnd-mechanic-adjustment',
    title: { 'zh-CN': '规则调整包示例', en: 'Rule Adjustment Pack (Example)' },
    author: 'Workshop Sample',
    category: 'ruleContent',
    subtype: 'mechanicAdjustment',
    system: 'dnd5e2024',
    contentShape: 'singleItem',
    version: 'v0.3.0',
    lastUpdatedLabel: '2025-01-15',
    landing: 'systemRuleSources',
    dependencyStatus: 'reserved',
    impactScope: 'runtime',
    status: 'possibleConflict',
  },
];

// ─── Locale helper ────────────────────────────────────────────────────────────

export function localized(text: LocalizedText, locale: string): string {
  return locale === 'en' ? text.en : text['zh-CN'];
}
