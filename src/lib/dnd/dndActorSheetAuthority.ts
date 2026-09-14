import type { DndLiteActorSheet } from './dndLiteActorTypes.js';
import { deriveDndLiteActorSheetFromSnapshot } from './dndCharacterToLiteActorSheet.js';
import { validateDndLiteActorSheet } from './dndLiteActorSheet.js';

export const DND_LITE_ACTOR_SHEET_KEY = 'dndLiteActorSheetV1';

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function validSheet(value: unknown): DndLiteActorSheet | undefined {
  const candidate = record(value) as unknown as DndLiteActorSheet | undefined;
  if (!candidate) return undefined;
  try {
    return validateDndLiteActorSheet(candidate).valid ? candidate : undefined;
  } catch {
    return undefined;
  }
}

export type DndActorSheetAuthority = {
  source: 'campaignOverride' | 'acceptedCharacter';
  /** Payload shape consumed by the existing T12 authored-action reader. */
  actionPayload: Record<string, unknown>;
  sheet?: DndLiteActorSheet;
};

/**
 * Selects the campaign actor's single combat-sheet authority.
 *
 * Presence of the override key wins even when the value is malformed or its
 * action list is empty. This prevents a hidden fallback from replacing an
 * intentional GM override. Only complete absence permits pure derivation from
 * the campaign's frozen, accepted Character snapshot.
 */
export function resolveDndActorSheetAuthority(input: {
  snapshotPayload: Record<string, unknown>;
  overridePayload: Record<string, unknown>;
}): DndActorSheetAuthority {
  if (Object.prototype.hasOwnProperty.call(input.overridePayload, DND_LITE_ACTOR_SHEET_KEY)) {
    return {
      source: 'campaignOverride',
      actionPayload: input.overridePayload,
      sheet: validSheet(input.overridePayload[DND_LITE_ACTOR_SHEET_KEY]),
    };
  }
  const sheet = deriveDndLiteActorSheetFromSnapshot(input.snapshotPayload)?.sheet;
  return {
    source: 'acceptedCharacter',
    actionPayload: sheet ? { [DND_LITE_ACTOR_SHEET_KEY]: sheet } : {},
    sheet,
  };
}

