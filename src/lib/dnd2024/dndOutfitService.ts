/**
 * DND Outfit Service (v1) — equip / unequip / replace + snapshot computation.
 *
 * AI-LANDMARK: DND_OUTFIT_SERVICE_V1
 *
 * Pure functions for the casual-outfit loadout, fully separate from the combat
 * Loadout Equip Service. One piece per slot; replacing leaves the old piece in
 * the wardrobe (clothing is never put into a backpack); unequipping empties the
 * slot. `buildOutfitSnapshot` computes the display name via the Theseus rule
 * over core slots (outerwear / top / bottom / footwear).
 *
 * No store / React / localStorage / network; never deletes wardrobe pieces.
 */

import {
  OUTFIT_CORE_SLOTS,
  type OutfitLoadout,
  type OutfitResult,
  type OutfitSlotKey,
  type OutfitSnapshot,
  type OutfitTemplate,
  type ResolveOutfitPiece,
  type Wardrobe,
} from './dndOutfitTypes';

/** Equip a wardrobe piece into its slot (one piece per slot). */
export function equipOutfitPiece(input: {
  wardrobe: Wardrobe;
  loadout: OutfitLoadout;
  instanceId: string;
  slot: OutfitSlotKey;
  resolvePiece: ResolveOutfitPiece;
}): OutfitResult {
  const { wardrobe, loadout, instanceId, slot, resolvePiece } = input;
  const piece = wardrobe.pieces.find((p) => p.instanceId === instanceId);
  if (!piece) return { ok: false, reason: 'piece-not-found' };
  const def = resolvePiece(piece.definitionId);
  if (!def) return { ok: false, reason: 'missing-definition' };
  if (def.slot !== slot) return { ok: false, reason: 'invalid-slot' };

  // Old occupant (if any) simply stops being referenced; it stays in the wardrobe.
  const nextLoadout: OutfitLoadout = { ...loadout, slots: { ...loadout.slots, [slot]: instanceId } };
  return { ok: true, wardrobe, loadout: nextLoadout };
}

/** Replace whatever is in `slot` with the given piece (same semantics as equip). */
export function replaceOutfitPiece(input: {
  wardrobe: Wardrobe;
  loadout: OutfitLoadout;
  instanceId: string;
  slot: OutfitSlotKey;
  resolvePiece: ResolveOutfitPiece;
}): OutfitResult {
  return equipOutfitPiece(input);
}

/** Unequip the piece in `slot` (slot becomes empty; piece stays in the wardrobe). */
export function unequipOutfitPiece(input: {
  loadout: OutfitLoadout;
  slot: OutfitSlotKey;
}): OutfitResult {
  const slots = { ...input.loadout.slots };
  delete slots[input.slot];
  return { ok: true, loadout: { ...input.loadout, slots } };
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

/**
 * Compute the current-outfit snapshot, including Theseus naming.
 *
 * Core-slot retention = how many core slots still hold their ORIGINAL template
 * piece (same definition id as the template specified). Non-core slots (head,
 * accessory, underlayer, special) never affect the outfit name.
 *   ratio ≥ 0.75 → 原套装名
 *   ratio ≥ 0.50 → 原套装名（已调整）
 *   ratio ≥ 0.25 → 基于「原套装名」改造
 *   ratio < 0.25 → 自定义常服
 */
export function buildOutfitSnapshot(input: {
  template?: OutfitTemplate;
  wardrobe: Wardrobe;
  loadout: OutfitLoadout;
  resolvePiece: ResolveOutfitPiece;
}): OutfitSnapshot {
  const { template, wardrobe, loadout, resolvePiece } = input;
  const byInstance = new Map(wardrobe.pieces.map((p) => [p.instanceId, p] as const));

  // Aggregate social descriptors across all currently worn pieces.
  const identity: string[] = [];
  const occasion: string[] = [];
  const credibility: string[] = [];
  const concealment: string[] = [];
  const environment: string[] = [];
  let visibility: string | undefined = template?.visibility;

  for (const slotKey of Object.keys(loadout.slots) as OutfitSlotKey[]) {
    const instanceId = loadout.slots[slotKey];
    if (!instanceId) continue;
    const piece = byInstance.get(instanceId);
    if (!piece) continue;
    const def = resolvePiece(piece.definitionId);
    if (!def) continue;
    if (def.identityImpression) identity.push(...def.identityImpression);
    if (def.occasionFit) occasion.push(...def.occasionFit);
    if (def.credibility) credibility.push(...def.credibility);
    if (def.concealment) concealment.push(...def.concealment);
    if (def.environmentFit) environment.push(...def.environmentFit);
    if (!visibility && def.visibility) visibility = def.visibility;
  }

  // Theseus retention over the template's core slots.
  const coreSlots = template ? template.coreSlots.filter((s) => OUTFIT_CORE_SLOTS.includes(s)) : [];
  const totalCoreSlots = coreSlots.length;
  let retainedCoreSlots = 0;
  for (const slot of coreSlots) {
    const wornInstanceId = loadout.slots[slot];
    if (!wornInstanceId) continue;
    const piece = byInstance.get(wornInstanceId);
    const templateDefId = template?.slots[slot]?.pieceDefinitionId;
    if (piece && templateDefId && piece.definitionId === templateDefId) retainedCoreSlots += 1;
  }

  let displayName: string;
  if (!template) {
    displayName = '自定义常服';
  } else if (totalCoreSlots === 0) {
    displayName = template.name;
  } else {
    const ratio = retainedCoreSlots / totalCoreSlots;
    if (ratio >= 0.75) displayName = template.name;
    else if (ratio >= 0.5) displayName = `${template.name}（已调整）`;
    else if (ratio >= 0.25) displayName = `基于「${template.name}」改造`;
    else displayName = '自定义常服';
  }

  return {
    displayName,
    sourceTemplateId: template?.id,
    retainedCoreSlots,
    totalCoreSlots,
    identityImpression: uniq(identity.length > 0 ? identity : template?.identityImpression ?? []),
    occasionFit: uniq(occasion.length > 0 ? occasion : template?.occasionFit ?? []),
    visibility,
    credibility: uniq(credibility.length > 0 ? credibility : template?.credibility ?? []),
    concealment: uniq(concealment.length > 0 ? concealment : template?.concealment ?? []),
    environmentFit: uniq(environment.length > 0 ? environment : template?.environmentFit ?? []),
    description: template?.description,
  };
}
