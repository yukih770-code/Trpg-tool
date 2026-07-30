import type { CampaignActorInstanceRecord, PostgresPlatformFoundationRepositoryResult } from '../adapters/postgresPlatformFoundationRepository.js';
import type { RoomActorBindingSummary, RoomSnapshot } from '../../src/lib/platform/roomTypes.js';
import type { RoomRuntimeActorProjection, RoomRuntimeActorProjectionListResult, RoomRuntimeDndActionShortcut } from '../../src/lib/platform/roomRuntimeActorProjectionTypes.js';

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

function actionKind(value: unknown): RoomRuntimeDndActionShortcut['kind'] {
  return value === 'weapon_attack' || value === 'spell_attack' || value === 'spell_cast' || value === 'save_dc' || value === 'damage_only' || value === 'utility'
    ? value
    : 'utility';
}

function saveAbility(value: unknown): RoomRuntimeDndActionShortcut['saveAbility'] {
  return value === 'strength' || value === 'dexterity' || value === 'constitution' || value === 'intelligence' || value === 'wisdom' || value === 'charisma'
    ? value
    : undefined;
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

function readDndLiteActionShortcuts(payload: Record<string, unknown>): RoomRuntimeDndActionShortcut[] {
  const sheet = record(payload[DND_LITE_ACTOR_SHEET_OVERRIDE_KEY]);
  if (!sheet || sheet.schemaVersion !== 1 || !Array.isArray(sheet.actions)) return [];
  return sheet.actions.flatMap((value) => {
    const action = record(value);
    if (!action) return [];
    const id = typeof action?.id === 'string' ? action.id.trim() : '';
    const name = typeof action?.name === 'string' ? action.name.trim() : '';
    if (!id || !name) return [];
    const attackBonus = typeof action.attackBonus === 'number' && Number.isInteger(action.attackBonus) && action.attackBonus >= -100 && action.attackBonus <= 100 ? action.attackBonus : undefined;
    const damageFormula = typeof action.damageFormula === 'string' && /^[0-9dD+\-\s]+$/.test(action.damageFormula) ? action.damageFormula.replace(/\s+/g, '') : undefined;
    const damageType = typeof action.damageType === 'string' && action.damageType.trim().length <= 48 ? action.damageType.trim() || undefined : undefined;
    const saveDc = typeof action.saveDc === 'number' && Number.isInteger(action.saveDc) && action.saveDc >= 0 && action.saveDc <= 100 ? action.saveDc : undefined;
    return [{ id, name, kind: actionKind(action.kind), attackBonus, damageFormula, damageType, saveAbility: saveAbility(action.saveAbility), saveDc }];
  }).slice(0, 12);
}

/**
 * Extracts only a player's compact spellbook labels from their approved
 * campaign-actor snapshot. Full spell descriptions, components, private notes,
 * and the source snapshot never leave the server projection.
 */
function readDndSpellbookActionShortcuts(payload: Record<string, unknown>): RoomRuntimeDndActionShortcut[] {
  const spellbook = record(payload.spellbook);
  if (!spellbook || !Array.isArray(spellbook.known)) return [];
  const preparedNames = new Set(
    Array.isArray(spellbook.prepared)
      ? spellbook.prepared.filter((value): value is string => typeof value === 'string').map((value) => value.trim()).filter(Boolean)
      : [],
  );
  const seen = new Set<string>();
  return spellbook.known.flatMap((value, index) => {
    const spell = record(value);
    if (!spell) return [];
    const name = typeof spell.nameCn === 'string' && spell.nameCn.trim()
      ? spell.nameCn.trim()
      : typeof spell.name_cn === 'string' && spell.name_cn.trim()
        ? spell.name_cn.trim()
        : typeof spell.name_en === 'string' && spell.name_en.trim()
          ? spell.name_en.trim()
          : '';
    if (!name || seen.has(name)) return [];
    seen.add(name);
    const identity = typeof spell.id === 'string' && spell.id.trim() ? spell.id.trim() : `spell-${index}-${name}`;
    const spellLevel = typeof spell.level === 'number' && Number.isInteger(spell.level) && spell.level >= 0 && spell.level <= 9 ? spell.level : undefined;
    const activation = typeof spell.cast_time === 'string' && spell.cast_time.trim().length <= 48 ? spell.cast_time.trim() : undefined;
    const range = typeof spell.range === 'string' && spell.range.trim().length <= 48 ? spell.range.trim() : undefined;
    const prepared = preparedNames.has(name)
      || (typeof spell.name_cn === 'string' && preparedNames.has(spell.name_cn.trim()))
      || (typeof spell.name_en === 'string' && preparedNames.has(spell.name_en.trim()));
    return [{ id: `spellbook:${identity}`, name, kind: 'spell_cast' as const, spellLevel, activation, range, availability: prepared ? 'prepared' as const : 'known' as const }];
  }).slice(0, 12);
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
  currentMemberId?: string;
}): Promise<RoomRuntimeActorProjectionListResult> {
  const bindings = (input.room.lobby?.actorBindings ?? []).filter(approvedBinding);
  const campaignId = input.room.campaignRef?.campaignId?.trim();
  if (!campaignId || bindings.every((binding) => !binding.campaignActorInstanceId)) {
    return { actors: bindings.map(fromBinding), persistence: 'notLinked' };
  }

  let persistence: RoomRuntimeActorProjectionListResult['persistence'] = 'available';
  let selfDndActions: RoomRuntimeDndActionShortcut[] | undefined;
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
      if (binding.memberId === input.currentMemberId && binding.actorRef.systemId === 'dnd5e-2024') {
        const explicitActions = readDndLiteActionShortcuts(record.overridePayload);
        const spellbookActions = readDndSpellbookActionShortcuts(record.snapshotPayload);
        selfDndActions = [...explicitActions, ...spellbookActions].slice(0, 16);
      }
      return fromCampaignOverride(binding, record);
    } catch {
      persistence = 'unavailable';
      return fallback;
    }
  }));

  return { actors, persistence, ...(selfDndActions?.length ? { selfDndActions } : {}) };
}
