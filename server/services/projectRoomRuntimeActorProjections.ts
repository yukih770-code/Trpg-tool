import type { CampaignActorInstanceRecord, PostgresPlatformFoundationRepositoryResult } from '../adapters/postgresPlatformFoundationRepository.js';
import type { RoomActorBindingSummary, RoomSnapshot } from '../../src/lib/platform/roomTypes.js';
import type { RoomRuntimeActorProjection, RoomRuntimeActorProjectionListResult } from '../../src/lib/platform/roomRuntimeActorProjectionTypes.js';

const DND_LITE_ACTOR_SHEET_OVERRIDE_KEY = 'dndLiteActorSheetV1';

export interface RoomRuntimeActorProjectionRepository {
  getCampaignActorInstanceById(campaignActorInstanceId: string): Promise<PostgresPlatformFoundationRepositoryResult<CampaignActorInstanceRecord | null>>;
}

function approvedBinding(binding: RoomActorBindingSummary): boolean {
  return binding.status === 'approved' && (binding.clearance === undefined || binding.clearance.status === 'approved');
}

function fromBinding(binding: RoomActorBindingSummary): RoomRuntimeActorProjection {
  return {
    bindingId: binding.bindingId,
    campaignActorInstanceId: binding.campaignActorInstanceId,
    displayName: binding.actorRef.displayName,
    systemId: binding.actorRef.systemId,
    hpCurrent: binding.actorRef.hpCurrent,
    hpMax: binding.actorRef.hpMax,
    armorClass: binding.actorRef.armorClass,
    source: 'roomBinding',
  };
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function safeInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100000 ? value : undefined;
}

function readDndLiteCombatSummary(payload: Record<string, unknown>): {
  displayName: string;
  actorKind: 'pc' | 'npc' | 'monster' | 'unknown';
  armorClass?: number;
  currentHp?: number;
  maxHp?: number;
  temporaryHp?: number;
} | undefined {
  const sheet = record(payload[DND_LITE_ACTOR_SHEET_OVERRIDE_KEY]);
  if (!sheet || sheet.schemaVersion !== 1 || typeof sheet.displayName !== 'string' || !sheet.displayName.trim()) return undefined;
  const actorKind = sheet.actorKind;
  if (actorKind !== 'pc' && actorKind !== 'npc' && actorKind !== 'monster' && actorKind !== 'unknown') return undefined;
  const defenses = record(sheet.defenses);
  if (!defenses) return undefined;
  const currentHp = safeInteger(defenses.currentHp);
  const maxHp = safeInteger(defenses.maxHp);
  if (currentHp !== undefined && maxHp !== undefined && currentHp > maxHp) return undefined;
  return {
    displayName: sheet.displayName.trim(), actorKind,
    armorClass: safeInteger(defenses.armorClass), currentHp, maxHp,
    temporaryHp: safeInteger(defenses.temporaryHp),
  };
}

function fromCampaignOverride(
  binding: RoomActorBindingSummary,
  record: CampaignActorInstanceRecord,
): RoomRuntimeActorProjection {
  const fallback = fromBinding(binding);
  const dndSheet = binding.actorRef.systemId === 'dnd5e-2024'
    ? readDndLiteCombatSummary(record.overridePayload)
    : undefined;
  if (!dndSheet) return fallback;

  return {
    ...fallback,
    displayName: dndSheet.displayName,
    actorKind: dndSheet.actorKind,
    hpCurrent: dndSheet.currentHp,
    hpMax: dndSheet.maxHp,
    temporaryHp: dndSheet.temporaryHp,
    armorClass: dndSheet.armorClass,
    source: 'campaignOverride',
  };
}

/**
 * Produces a compact Runtime projection from approved room bindings only.
 * The campaign record is accepted only when it belongs to the Room's campaign
 * and its recorded owner matches the binding member. Missing storage never
 * makes the Runtime unreadable: the existing compact binding remains a safe
 * fallback.
 */
export async function projectRoomRuntimeActorProjections(input: {
  room: RoomSnapshot;
  repository: RoomRuntimeActorProjectionRepository;
}): Promise<RoomRuntimeActorProjectionListResult> {
  const bindings = (input.room.lobby?.actorBindings ?? []).filter(approvedBinding);
  const campaignId = input.room.campaignRef?.campaignId?.trim();
  if (!campaignId || bindings.every((binding) => !binding.campaignActorInstanceId)) {
    return { actors: bindings.map(fromBinding), persistence: 'notLinked' };
  }

  let persistence: RoomRuntimeActorProjectionListResult['persistence'] = 'available';
  const actors = await Promise.all(bindings.map(async (binding) => {
    const fallback = fromBinding(binding);
    const campaignActorInstanceId = binding.campaignActorInstanceId?.trim();
    if (!campaignActorInstanceId) return fallback;

    try {
      const result = await input.repository.getCampaignActorInstanceById(campaignActorInstanceId);
      if (!result.ok) {
        persistence = 'unavailable';
        return fallback;
      }
      const record = result.value;
      const member = input.room.members.find((candidate) => candidate.memberId === binding.memberId);
      if (!record || record.archivedAt || record.campaignId !== campaignId || !member?.userId || record.ownerId !== member.userId) {
        return fallback;
      }
      return fromCampaignOverride(binding, record);
    } catch {
      persistence = 'unavailable';
      return fallback;
    }
  }));

  return { actors, persistence };
}
