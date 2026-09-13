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
  const { [DND_LITE_ACTOR_SHEET_OVERRIDE_KEY]: _discarded, [DND_ACTOR_PRESET_OVERRIDE_KEY]: _preset, ...remaining } = payload;
  // Clearing the sheet clears the preset marker with it: provenance describes a
  // materialized sheet, and keeping the label after the sheet is gone would
  // claim an origin for values that no longer exist.
  return remaining;
}

/**
 * Quick-actor preset provenance (v1).
 *
 * A LABEL, never a value source. It records which preset an actor was created
 * from so the UI can say "Ordinary person · Custom" and offer a reset; the
 * actor's own `dndLiteActorSheetV1` remains the only saved truth. Nothing reads
 * this marker to supply or override a sheet value, so it cannot become a stale
 * overlay behind the sheet.
 *
 * It lives beside the sheet in the existing free-form override bag — the same
 * place T11b's acceptance breadcrumb lives — so it needs no migration and no
 * new persistent object.
 */
export const DND_ACTOR_PRESET_OVERRIDE_KEY = 'dndActorPresetV1';

export interface DndActorPresetProvenance {
  schemaVersion: 1;
  presetId: string;
  /** Definition version at materialization time; see dndActorPresets.ts. */
  presetVersion: number;
  materializedAt?: string;
}

export function readDndActorPresetProvenance(payload: Record<string, unknown>): DndActorPresetProvenance | undefined {
  const candidate = payload[DND_ACTOR_PRESET_OVERRIDE_KEY];
  if (!isRecord(candidate)) return undefined;
  const presetId = typeof candidate.presetId === 'string' ? candidate.presetId.trim() : '';
  const presetVersion = candidate.presetVersion;
  if (candidate.schemaVersion !== 1 || !presetId) return undefined;
  if (typeof presetVersion !== 'number' || !Number.isInteger(presetVersion)) return undefined;
  return {
    schemaVersion: 1,
    presetId,
    presetVersion,
    materializedAt: typeof candidate.materializedAt === 'string' ? candidate.materializedAt : undefined,
  };
}

export function withDndActorPresetProvenance(
  payload: Record<string, unknown>,
  provenance: Omit<DndActorPresetProvenance, 'schemaVersion'>,
): Record<string, unknown> {
  return { ...payload, [DND_ACTOR_PRESET_OVERRIDE_KEY]: { schemaVersion: 1, ...provenance } };
}

export function projectDndLiteActorSheets(actors: CampaignActorInstance[]): Record<string, DndLiteActorSheet> {
  return actors.reduce<Record<string, DndLiteActorSheet>>((sheets, actor) => {
    const sheet = readDndLiteActorSheetOverride(actor.overridePayload);
    if (sheet) sheets[actor.campaignActorInstanceId] = sheet;
    return sheets;
  }, {});
}
