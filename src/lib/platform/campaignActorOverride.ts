import type { CampaignActorInstance } from '../api/campaignRoomApiClient';
import { validateDndLiteActorSheet } from '../dnd/dndLiteActorSheet';
import type { DndLiteActorSheet } from '../dnd/dndLiteActorTypes';

export const DND_LITE_ACTOR_SHEET_OVERRIDE_KEY = 'dndLiteActorSheetV1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Campaign actor overrides are untrusted serialized JSON at this boundary.
 * Keep invalid or future-shaped data out of the runtime projection.
 */
export function readDndLiteActorSheetOverride(payload: Record<string, unknown>): DndLiteActorSheet | undefined {
  const candidate = payload[DND_LITE_ACTOR_SHEET_OVERRIDE_KEY];
  if (!isRecord(candidate)) return undefined;
  const sheet = candidate as unknown as DndLiteActorSheet;
  try {
    return validateDndLiteActorSheet(sheet).valid ? sheet : undefined;
  } catch {
    return undefined;
  }
}

export function withDndLiteActorSheetOverride(payload: Record<string, unknown>, sheet: DndLiteActorSheet): Record<string, unknown> {
  return { ...payload, [DND_LITE_ACTOR_SHEET_OVERRIDE_KEY]: sheet };
}

export function withoutDndLiteActorSheetOverride(payload: Record<string, unknown>): Record<string, unknown> {
  const { [DND_LITE_ACTOR_SHEET_OVERRIDE_KEY]: _discarded, ...remaining } = payload;
  return remaining;
}

export function projectDndLiteActorSheets(actors: CampaignActorInstance[]): Record<string, DndLiteActorSheet> {
  return actors.reduce<Record<string, DndLiteActorSheet>>((sheets, actor) => {
    const sheet = readDndLiteActorSheetOverride(actor.overridePayload);
    if (sheet) sheets[actor.campaignActorInstanceId] = sheet;
    return sheets;
  }, {});
}
