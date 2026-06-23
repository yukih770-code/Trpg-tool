/**
 * DND Outfit / Wardrobe foundation types (v1).
 *
 * AI-LANDMARK: DND_OUTFIT_TYPES_V1
 *
 * Casual clothing is a SEPARATE system from combat equipment and from the
 * inventory. Outfit pieces are NOT ItemDefinitions, NOT InventoryItems, and they
 * never enter the backpack or the DND item registry. This module only declares
 * the long-term shapes; data lives in dndOutfitDefinitions, behavior in
 * dndOutfitService, persistence in characterWardrobeStore.
 *
 * All vocabulary is in-world (身份印象 / 场合适配 / 显眼程度 / 可信度 / 隐蔽性 /
 * 环境适配 / 衣物状态). No "RP" wording, no exposure/adult mechanics.
 */

export type OutfitSlotKey =
  | 'head'
  | 'outerwear'
  | 'top'
  | 'bottom'
  | 'footwear'
  | 'accessory'
  | 'underlayer'
  | 'special';

/** Core slots that define a "套装" identity for Theseus naming. */
export const OUTFIT_CORE_SLOTS: OutfitSlotKey[] = ['outerwear', 'top', 'bottom', 'footwear'];

export const OUTFIT_SLOT_ORDER: OutfitSlotKey[] = [
  'head', 'outerwear', 'top', 'bottom', 'footwear', 'accessory', 'underlayer', 'special',
];

export const OUTFIT_SLOT_LABELS: Record<OutfitSlotKey, string> = {
  head: '头部',
  outerwear: '外层',
  top: '上衣',
  bottom: '下装',
  footwear: '鞋履',
  accessory: '饰品',
  underlayer: '贴身',
  special: '特殊',
};

export type OutfitVisibility = '低调' | '普通' | '醒目' | '华丽' | '怪异' | '危险';

export type OutfitCondition = '整洁' | '磨损' | '破旧' | '沾尘' | '修补';

export type OutfitPieceOrigin =
  | 'background-outfit'
  | 'manual-import'
  | 'campaign-reward'
  | 'custom'
  | 'migration';

/** A clothing-piece template (blueprint). Not an item; not in the backpack. */
export interface OutfitPieceDefinition {
  id: string;
  name: string;
  slot: OutfitSlotKey;
  description?: string;

  identityImpression?: string[];
  occasionFit?: string[];
  visibility?: OutfitVisibility;
  credibility?: string[];
  concealment?: string[];
  environmentFit?: string[];

  sourceTemplateId?: string;
  /** True for platform-introduced (non-official) pieces. */
  platformExtension?: boolean;
}

/** A clothing piece a character actually owns. */
export interface OutfitPieceInstance {
  instanceId: string;
  definitionId: string;
  condition?: OutfitCondition;
  origin: OutfitPieceOrigin;
}

/** Everything a character owns to wear (not worn = simply not referenced by the loadout). */
export interface Wardrobe {
  pieces: OutfitPieceInstance[];
}

/** The current worn outfit: at most one piece instance per slot. */
export interface OutfitLoadout {
  templateId?: string;
  slots: Partial<Record<OutfitSlotKey, string>>;
}

/** One slot of a template: a reference to a piece definition. */
export interface OutfitTemplateSlot {
  pieceDefinitionId: string;
}

/** Per-background blueprint used to seed the wardrobe + initial loadout. */
export interface OutfitTemplate {
  id: string;
  name: string;
  sourceBackgroundId?: string;
  coreSlots: OutfitSlotKey[];
  slots: Partial<Record<OutfitSlotKey, OutfitTemplateSlot>>;

  identityImpression: string[];
  occasionFit: string[];
  visibility?: OutfitVisibility;
  credibility: string[];
  concealment: string[];
  environmentFit: string[];
  description?: string;
}

/** Computed view of the current outfit (display + Theseus retention). */
export interface OutfitSnapshot {
  displayName: string;
  sourceTemplateId?: string;
  retainedCoreSlots: number;
  totalCoreSlots: number;

  identityImpression: string[];
  occasionFit: string[];
  visibility?: string;
  credibility: string[];
  concealment: string[];
  environmentFit: string[];

  description?: string;
}

export type OutfitFailureReason = 'piece-not-found' | 'missing-definition' | 'invalid-slot';

export type OutfitResult =
  | { ok: true; wardrobe?: Wardrobe; loadout: OutfitLoadout }
  | { ok: false; reason: OutfitFailureReason };

export type ResolveOutfitPiece = (definitionId: string) => OutfitPieceDefinition | undefined;
