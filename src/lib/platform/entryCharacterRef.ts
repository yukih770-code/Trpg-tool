import type { CampaignActorInstance } from '../api/campaignRoomApiClient';
import type { CampaignEntryDraft } from './campaignEntryDraftStore';
import type { CampaignSuggestedActor } from './campaignFlow';
import type { DndLiteActorSheet } from '../dnd/dndLiteActorTypes';
import type { MapTokenPresenceCandidate } from '../map/actorPresence';
import { tokenInitials } from '../map/actorPresence';
import type { MapTokenHpSummary, MapTokenKind, MapTokenSourceType } from '../map/mapRuntimeTypes';
import type { RuntimeAcDisplay, RuntimeHpDisplay } from './roomRuntimeVisibility';
import type { ActorVaultRecord } from './actorVaultRepositoryBridge';
import type { RoomActorBindingSummary, RoomMemberIdentity } from './roomTypes';

/**
 * A display-safe normalization layer between existing character entry sources
 * and map presence. It is not a new persistence or permission authority.
 */
export type EntryCharacterSourceType =
  | 'vaultActor'
  | 'campaignSuggestedActor'
  | 'campaignActor'
  | 'dndLiteActor'
  | 'roomActorBinding'
  | 'quickDraft'
  | 'manualSummary';

export interface EntryCharacterRef {
  id: string;
  sourceType: EntryCharacterSourceType;
  sourceId?: string;
  displayName: string;
  systemId?: string;
  ownerUserId?: string;
  controlledByUserId?: string;
  /** Room-local linkage for an approved binding; it is not a global role. */
  roomMemberId?: string;
  actorBindingId?: string;
  initials?: string;
  kind?: MapTokenKind;
  hpSummary?: MapTokenHpSummary;
  /** Local or server-projected display data only; never use it as an authority source. */
  hpDisplay?: RuntimeHpDisplay;
  acDisplay?: RuntimeAcDisplay;
  summary?: string;
  armorClass?: number;
  conditionSummary?: string[];
  /** Only a host-carried convenience or an admitted room binding is placeable in Room Runtime. */
  isApprovedForRoom?: boolean;
  isLocalDraft?: boolean;
  isHostCarried?: boolean;
}

type CampaignSuggestedActorLike = Pick<CampaignSuggestedActor, 'actorId' | 'actorName'>;

function normalizedName(value: string | undefined, fallback = '未命名角色'): string {
  return value?.trim() || fallback;
}

function withInitials(ref: Omit<EntryCharacterRef, 'initials'>): EntryCharacterRef {
  return { ...ref, initials: tokenInitials(ref.displayName) };
}

export function entryCharacterFromCampaignSuggestedActor(
  actor: CampaignSuggestedActorLike | undefined,
  options: {
    systemId?: string;
    ownerUserId?: string;
    isHostCarried?: boolean;
    hpSummary?: MapTokenHpSummary;
    hpDisplay?: RuntimeHpDisplay;
    acDisplay?: RuntimeAcDisplay;
    armorClass?: number;
    conditionSummary?: string[];
  } = {},
): EntryCharacterRef | undefined {
  const actorId = actor?.actorId?.trim();
  const displayName = actor?.actorName?.trim();
  if (!actorId || !displayName) return undefined;
  const isQuickDraft = actorId.startsWith('ui-preview-');
  return withInitials({
    id: actorId,
    sourceId: actorId,
    sourceType: isQuickDraft ? 'quickDraft' : 'campaignSuggestedActor',
    displayName,
    systemId: options.systemId,
    ownerUserId: options.ownerUserId,
    controlledByUserId: options.ownerUserId,
    kind: 'playerCharacter',
    hpSummary: options.hpSummary,
    hpDisplay: options.hpDisplay,
    acDisplay: options.acDisplay,
    armorClass: options.armorClass,
    conditionSummary: options.conditionSummary,
    isLocalDraft: true,
    isHostCarried: options.isHostCarried,
  });
}

/** A local entry draft needs a resolved actor summary before it can be displayed safely. */
export function entryCharacterFromCampaignEntryDraft(
  draft: CampaignEntryDraft | undefined,
  actor: CampaignSuggestedActorLike | undefined,
): EntryCharacterRef | undefined {
  if (!draft?.selectedActorId || draft.selectedActorId !== actor?.actorId) return undefined;
  return entryCharacterFromCampaignSuggestedActor(actor, { systemId: draft.systemId });
}

export function entryCharacterFromRoomBinding(
  binding: RoomActorBindingSummary | undefined,
  member?: RoomMemberIdentity,
): EntryCharacterRef | undefined {
  if (!binding?.bindingId || !binding.actorRef.displayName?.trim()) return undefined;
  const approved = binding.status === 'approved' && binding.clearance?.status === 'approved';
  return withInitials({
    id: binding.actorRef.actorId?.trim() || binding.bindingId,
    sourceId: binding.bindingId,
    sourceType: 'roomActorBinding',
    displayName: normalizedName(binding.actorRef.displayName),
    systemId: binding.actorRef.systemId,
    ownerUserId: member?.userId,
    controlledByUserId: member?.userId,
    roomMemberId: binding.memberId,
    actorBindingId: binding.bindingId,
    kind: 'playerCharacter',
    summary: binding.actorRef.summary,
    armorClass: binding.actorRef.armorClass,
    hpSummary: binding.actorRef.hpCurrent !== undefined || binding.actorRef.hpMax !== undefined
      ? { current: binding.actorRef.hpCurrent ?? binding.actorRef.hpMax ?? 0, max: binding.actorRef.hpMax ?? binding.actorRef.hpCurrent ?? 0 }
      : undefined,
    isApprovedForRoom: approved,
  });
}

/** Read-only Actor Vault record normalized for a room entry preview. */
export function entryCharacterFromActorVaultRecord(actor: ActorVaultRecord): EntryCharacterRef {
  return withInitials({
    id: actor.id,
    sourceId: actor.id,
    sourceType: 'vaultActor',
    displayName: normalizedName(actor.displayName),
    systemId: actor.systemId,
    summary: actor.subtitle,
    kind: 'playerCharacter',
    isLocalDraft: true,
  });
}

export function entryCharacterFromCampaignActor(actor: CampaignActorInstance | undefined): EntryCharacterRef | undefined {
  if (!actor?.campaignActorInstanceId) return undefined;
  return withInitials({
    id: actor.campaignActorInstanceId,
    sourceId: actor.campaignActorInstanceId,
    sourceType: 'campaignActor',
    displayName: normalizedName(actor.displayName),
    ownerUserId: actor.ownerId,
    controlledByUserId: actor.ownerId,
    kind: actor.actorKind === 'pc' ? 'playerCharacter' : actor.actorKind === 'monster' ? 'monster' : actor.actorKind === 'npc' ? 'npc' : 'unknown',
  });
}

export function entryCharacterFromDndLiteActor(
  campaignActorId: string | undefined,
  sheet: DndLiteActorSheet | undefined,
  ownerUserId?: string,
): EntryCharacterRef | undefined {
  if (!campaignActorId?.trim() || !sheet) return undefined;
  return withInitials({
    id: campaignActorId,
    sourceId: campaignActorId,
    sourceType: 'dndLiteActor',
    displayName: normalizedName(sheet.displayName),
    ownerUserId,
    controlledByUserId: ownerUserId,
    kind: sheet.actorKind === 'pc' ? 'playerCharacter' : sheet.actorKind === 'monster' ? 'monster' : sheet.actorKind === 'npc' ? 'npc' : 'unknown',
    hpSummary: {
      current: sheet.defenses.currentHp,
      max: sheet.defenses.maxHp,
      temporary: sheet.defenses.temporaryHp,
    },
    armorClass: sheet.defenses.armorClass,
    acDisplay: sheet.defenses.armorClass === undefined
      ? undefined
      : { kind: 'exact', value: sheet.defenses.armorClass },
  });
}

export function entryCharacterFromManualSummary(input: {
  id?: string;
  displayName?: string;
  systemId?: string;
  ownerUserId?: string;
}): EntryCharacterRef | undefined {
  const displayName = input.displayName?.trim();
  if (!displayName) return undefined;
  const id = input.id?.trim() || `manual:${displayName.toLowerCase()}`;
  return withInitials({
    id,
    sourceId: id,
    sourceType: 'manualSummary',
    displayName,
    systemId: input.systemId,
    ownerUserId: input.ownerUserId,
    controlledByUserId: input.ownerUserId,
    kind: 'unknown',
  });
}

function mapSourceType(sourceType: EntryCharacterSourceType): MapTokenSourceType {
  switch (sourceType) {
    case 'campaignActor': return 'campaign_actor';
    case 'dndLiteActor': return 'dndLiteActor';
    case 'roomActorBinding': return 'roomActorBinding';
    case 'vaultActor':
    case 'campaignSuggestedActor': return 'vaultActor';
    case 'quickDraft': return 'quickDraft';
    case 'manualSummary': return 'manual';
  }
}

export function entryCharacterToPresenceCandidate(ref: EntryCharacterRef | undefined): MapTokenPresenceCandidate | undefined {
  if (!ref?.id || !ref.displayName.trim()) return undefined;
  return {
    sourceType: mapSourceType(ref.sourceType),
    sourceId: ref.sourceId ?? ref.id,
    displayName: ref.displayName,
    initials: ref.initials ?? tokenInitials(ref.displayName),
    kind: ref.kind ?? 'unknown',
    ownerUserId: ref.ownerUserId,
    controlledByUserId: ref.controlledByUserId,
    roomMemberId: ref.roomMemberId,
    actorBindingId: ref.actorBindingId,
    hpSummary: ref.hpSummary,
    hpDisplay: ref.hpDisplay,
    acDisplay: ref.acDisplay,
    conditionSummary: ref.conditionSummary,
    campaignActorId: ref.sourceType === 'campaignActor' || ref.sourceType === 'dndLiteActor' ? ref.id : undefined,
  };
}

/** Room maps may receive only admitted bindings or explicit host-carried convenience entries. */
export function placeableEntryCharacterCandidates(refs: readonly EntryCharacterRef[]): MapTokenPresenceCandidate[] {
  return refs
    .filter((ref) => ref.isApprovedForRoom || ref.isHostCarried)
    .map(entryCharacterToPresenceCandidate)
    .filter((candidate): candidate is MapTokenPresenceCandidate => candidate !== undefined);
}
