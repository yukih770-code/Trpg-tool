/**
 * DND Outfit piece definitions + templates (v1), derived from background outfits.
 *
 * AI-LANDMARK: DND_OUTFIT_DEFINITIONS_V1
 *
 * Promotes the 16 background casual-outfit blueprints (dndCasualOutfits.ts) into
 * the long-term Outfit model: one `OutfitPieceDefinition` per template slot and a
 * new-shape `OutfitTemplate` per background. Ids are STABLE and deterministic
 * (`outfit.<background>.<slot>`), never random. These definitions live in their
 * own registry — they are NOT added to the DND ItemDefinition registry and never
 * enter the backpack. In-world names only; the Criminal outfit reads as a plain
 * low-profile city look and never exposes a hidden identity.
 */

import { DND_CASUAL_OUTFITS, type CasualOutfitSlots, type DndCasualOutfit } from './dndCasualOutfits';
import {
  OUTFIT_CORE_SLOTS,
  type OutfitPieceDefinition,
  type OutfitSlotKey,
  type OutfitTemplate,
  type OutfitTemplateSlot,
  type OutfitVisibility,
} from './dndOutfitTypes';

/** Stable English slugs for the 16 backgrounds (id component only). */
const BACKGROUND_SLUG: Record<string, string> = {
  '侍僧': 'acolyte',
  '警卫': 'guard',
  '水手': 'sailor',
  '工匠': 'artisan',
  '向导': 'guide',
  '抄写员': 'scribe',
  '骗子': 'charlatan',
  '隐士': 'hermit',
  '士兵': 'soldier',
  '罪犯': 'criminal',
  '商人': 'merchant',
  '流浪者': 'drifter',
  '艺人': 'entertainer',
  '贵族': 'noble',
  '农民': 'farmer',
  '智者': 'sage',
};

/** Map the legacy CasualOutfitSlots keys onto the canonical OutfitSlotKey. */
const SLOT_MAP: Record<keyof CasualOutfitSlots, OutfitSlotKey> = {
  head: 'head',
  outer: 'outerwear',
  top: 'top',
  bottom: 'bottom',
  shoes: 'footwear',
  accessory: 'accessory',
  undergarment: 'underlayer',
  special: 'special',
};
const SLOT_KEYS = Object.keys(SLOT_MAP) as (keyof CasualOutfitSlots)[];

const VISIBILITY_SET: OutfitVisibility[] = ['低调', '普通', '醒目', '华丽', '怪异', '危险'];
function normalizeVisibility(raw: string | undefined): OutfitVisibility {
  const v = (raw ?? '').trim();
  if ((VISIBILITY_SET as string[]).includes(v)) return v as OutfitVisibility;
  if (/醒目|显眼/.test(v)) return '醒目';
  if (/华丽|奢/.test(v)) return '华丽';
  if (/低调|朴素/.test(v)) return '低调';
  return '普通';
}

function splitTags(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(/[，、,/／;；]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Strip optional markers / parentheticals from a slot's clothing description. */
function cleanPieceName(raw: string): string {
  return raw.replace(/（[^）]*）|\([^)]*\)/g, '').trim() || raw.trim();
}

function slugFor(outfit: DndCasualOutfit): string {
  return BACKGROUND_SLUG[outfit.backgroundCn] ?? outfit.backgroundCn;
}

const pieceDefs: OutfitPieceDefinition[] = [];
const templates: OutfitTemplate[] = [];

for (const outfit of DND_CASUAL_OUTFITS) {
  const slug = slugFor(outfit);
  const templateId = `outfit.${slug}`;
  const identityImpression = splitTags(outfit.identity);
  const occasionFit = splitTags(outfit.occasions);
  const visibility = normalizeVisibility(outfit.visibility);
  const credibility = splitTags(outfit.credibility);
  const concealment = splitTags(outfit.concealment);
  const environmentFit = splitTags(outfit.environment);

  const slots: Partial<Record<OutfitSlotKey, OutfitTemplateSlot>> = {};
  for (const oldKey of SLOT_KEYS) {
    const value = outfit.slots[oldKey];
    if (!value) continue;
    const slot = SLOT_MAP[oldKey];
    const pieceId = `${templateId}.${slot}`;
    pieceDefs.push({
      id: pieceId,
      name: cleanPieceName(value),
      slot,
      sourceTemplateId: templateId,
      identityImpression,
      occasionFit,
      visibility,
      credibility,
      concealment,
      environmentFit,
    });
    slots[slot] = { pieceDefinitionId: pieceId };
  }

  templates.push({
    id: templateId,
    name: outfit.name,
    sourceBackgroundId: outfit.backgroundCn,
    coreSlots: OUTFIT_CORE_SLOTS.filter((s) => slots[s]),
    slots,
    identityImpression,
    occasionFit,
    visibility,
    credibility,
    concealment,
    environmentFit,
    description: outfit.description,
  });
}

export const DND_OUTFIT_PIECE_DEFINITIONS: OutfitPieceDefinition[] = pieceDefs;
export const DND_OUTFIT_TEMPLATES: OutfitTemplate[] = templates;

const pieceById = new Map<string, OutfitPieceDefinition>(pieceDefs.map((p) => [p.id, p] as const));
const templateById = new Map<string, OutfitTemplate>(templates.map((t) => [t.id, t] as const));
const templateByBackground = new Map<string, OutfitTemplate>(
  templates.map((t) => [t.sourceBackgroundId ?? t.id, t] as const),
);

/** Resolve an outfit piece definition by id (separate from the item registry). */
export function getOutfitPieceDefinition(definitionId: string): OutfitPieceDefinition | undefined {
  return pieceById.get(definitionId);
}

export function getOutfitTemplateById(templateId: string | undefined): OutfitTemplate | undefined {
  if (!templateId) return undefined;
  return templateById.get(templateId);
}

/** Resolve the outfit template for a character background (Chinese name). */
export function getOutfitTemplateByBackground(backgroundCn: string | undefined): OutfitTemplate | undefined {
  if (!backgroundCn) return undefined;
  const key = backgroundCn.trim();
  return templateByBackground.get(key) ?? templates.find((t) => key.includes(t.sourceBackgroundId ?? ''));
}
