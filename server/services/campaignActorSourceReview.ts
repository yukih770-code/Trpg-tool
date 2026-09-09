/**
 * Host review and acceptance of a changed character source (T11b, server).
 *
 * AI-LANDMARK: CAMPAIGN_ACTOR_SOURCE_REVIEW_V1
 *
 * T11a records a baseline and reports `sourceChangedSinceApproval`. This closes
 * that lifecycle: the host sees WHAT changed, and explicitly accepts.
 *
 * Boundary rules enforced here:
 *  - PRIVACY. The server reads the player's Vault actor at this already
 *    authorized boundary, but the response carries only derived, combat-relevant
 *    values and a field-level diff. Raw `CharacterData` never crosses the wire.
 *    A host is not entitled to read a player's Vault (`actorApiHandlers` refuses
 *    it), and T11b does not create a back door.
 *  - SERVER AUTHORITY. Acceptance never trusts a client-supplied payload, hash
 *    or derived sheet. The server re-reads the Vault actor and re-derives the
 *    hash at accept time. The client's `expectedSourceHash` is used ONLY as an
 *    equality guard, never as stored data.
 *  - MANUAL ONLY. Nothing here synchronises automatically, and accepting a
 *    source version does not touch the campaign-local combat sheet.
 *  - Acceptance mutates one campaign_actor_instances row. It appends no
 *    RuntimeLog event, touches no combat state, and changes no admission.
 */

import {
  compareDndCharacterCombatRelevantHash,
  formatDndCharacterCombatRelevantHash,
  DND_COMBAT_RELEVANT_HASH_SYSTEM_ID,
} from './dndCharacterCombatRelevantHash.js';
import { buildDndCharacterSourceReview } from '../../src/lib/dnd/dndCharacterSourceReview.js';
import type { DndCharacterSourceReview } from '../../src/lib/dnd/dndCharacterSourceReview.js';
import type { CampaignActorInstanceRecord } from '../adapters/postgresPlatformFoundationRepository.js';

type RepoResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

/** Read-only Vault port. Only ever used to derive; never echoed to a client. */
export interface CampaignActorSourceVaultRepository {
  getActorById(actorId: string): Promise<RepoResult<{
    actorId: string;
    ownerId: string;
    systemId: string;
    displayName: string;
    payload: Record<string, unknown>;
    archivedAt?: string;
  } | null>>;
}

export interface CampaignActorSourceAcceptanceRepository {
  acceptCampaignActorSourceUpdate(input: {
    campaignActorInstanceId: string;
    snapshotPayload: Record<string, unknown>;
    snapshotHash: string;
    acceptance: { acceptedByUserId?: string; acceptedAt: string; previousSnapshotHash?: string };
  }): Promise<RepoResult<CampaignActorInstanceRecord | null>>;
}

/**
 * The campaign actor's link to a Vault character was established by an approved
 * room binding (T11a). If the Vault actor now reports a DIFFERENT owner, the
 * link is stale or wrong, and reading it would expose one player's derived
 * values to a host through another player's actor. Refuse rather than derive.
 *
 * Only enforced when both sides actually carry an owner: host-authored actors
 * legitimately have none.
 */
function linkOwnershipHolds(actor: CampaignActorInstanceRecord, sourceOwnerId: string | undefined): boolean {
  const linked = actor.ownerId?.trim();
  const source = sourceOwnerId?.trim();
  if (!linked || !source) return true;
  return linked === source;
}

export type CampaignActorSourceReviewDecision =
  | 'reviewed'
  | 'notLinkedToSource'
  | 'unsupportedSystem'
  | 'sourceUnavailable'
  | 'unavailable';

/**
 * The complete host-facing review payload.
 *
 * `currentSourceHash` is the server's own re-derivation, echoed so the host's
 * accept can prove it is accepting the version it reviewed. It is a hash, not
 * character data — it reveals nothing about the character.
 */
export interface CampaignActorSourceReviewResult {
  decision: CampaignActorSourceReviewDecision;
  campaignActorInstanceId?: string;
  /** `unchanged` | `changed` | `unknown` — mirrors the derived comparison. */
  status?: DndCharacterSourceReview['status'];
  /** True only when the stored baseline and the current source provably differ. */
  sourceChangedSinceApproval?: boolean;
  review?: DndCharacterSourceReview;
  acceptedSourceHash?: string;
  currentSourceHash?: string;
  message?: string;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/**
 * Builds the review for one campaign actor.
 *
 * The caller has ALREADY authorized the requester for campaign edit/review;
 * this service does not re-authorize and must never be exposed unauthenticated.
 */
export async function reviewCampaignActorSourceUpdate(input: {
  actor: CampaignActorInstanceRecord;
  vaultRepository: CampaignActorSourceVaultRepository;
  systemId?: string;
}): Promise<CampaignActorSourceReviewResult> {
  const { actor, vaultRepository } = input;
  const sourceActorId = actor.sourceActorId?.trim();
  if (!sourceActorId) {
    return { decision: 'notLinkedToSource', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'This campaign actor is not linked to a Vault character.' };
  }
  const systemId = input.systemId ?? DND_COMBAT_RELEVANT_HASH_SYSTEM_ID;
  if (systemId !== DND_COMBAT_RELEVANT_HASH_SYSTEM_ID) {
    return { decision: 'unsupportedSystem', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'Source review is only implemented for DND 2024 characters.' };
  }

  let current;
  try {
    current = await vaultRepository.getActorById(sourceActorId);
  } catch {
    return { decision: 'unavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The character source could not be read.' };
  }
  if (!current.ok) {
    return { decision: 'unavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The character source could not be read.' };
  }
  if (!current.value || current.value.archivedAt) {
    return { decision: 'sourceUnavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The linked character is no longer available.' };
  }
  if (!linkOwnershipHolds(actor, current.value.ownerId)) {
    return { decision: 'sourceUnavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The linked character no longer belongs to this actor\u2019s owner.' };
  }

  const currentPayload = record(current.value.payload) ?? {};
  const currentSourceHash = formatDndCharacterCombatRelevantHash(currentPayload);
  const comparison = compareDndCharacterCombatRelevantHash({
    storedHash: actor.snapshotHash,
    currentPayload,
  });

  const review = buildDndCharacterSourceReview({
    acceptedPayload: actor.snapshotPayload,
    currentPayload,
  });

  return {
    decision: 'reviewed',
    campaignActorInstanceId: actor.campaignActorInstanceId,
    status: review.status,
    // The hash is authoritative for "did it move"; the derived diff explains it.
    // They can legitimately disagree: a change outside the lite sheet moves the
    // hash while producing no reviewable field, and that is reported honestly
    // as `changed` with an empty field list rather than hidden.
    sourceChangedSinceApproval: comparison === 'changed',
    review: comparison === 'changed' && review.status === 'unchanged'
      ? { ...review, status: 'changed' }
      : review,
    ...(actor.snapshotHash ? { acceptedSourceHash: actor.snapshotHash } : {}),
    ...(currentSourceHash ? { currentSourceHash } : {}),
  };
}

export type CampaignActorSourceAcceptanceDecision =
  | 'accepted'
  | 'notLinkedToSource'
  | 'unsupportedSystem'
  | 'sourceUnavailable'
  | 'sourceUnreadable'
  | 'reviewVersionMismatch'
  | 'unavailable';

export interface CampaignActorSourceAcceptanceResult {
  decision: CampaignActorSourceAcceptanceDecision;
  campaignActorInstanceId?: string;
  actor?: CampaignActorInstanceRecord;
  acceptedSourceHash?: string;
  previousSourceHash?: string;
  message?: string;
}

/**
 * Accepts the CURRENT source as the new campaign baseline.
 *
 * TOCTOU: `expectedSourceHash` is required. The server re-reads the Vault actor
 * and re-derives its hash; if that does not equal what the host reviewed, the
 * acceptance is REJECTED rather than silently accepting a version nobody looked
 * at. Rejecting is the safer minimal behavior — the host simply reviews again,
 * and no unreviewed character can ever become the accepted baseline.
 *
 * Only the freshly server-derived payload and hash are written. The client's
 * value is compared and then discarded.
 */
export async function acceptCampaignActorSourceUpdate(input: {
  actor: CampaignActorInstanceRecord;
  vaultRepository: CampaignActorSourceVaultRepository;
  acceptanceRepository: CampaignActorSourceAcceptanceRepository;
  expectedSourceHash: string;
  acceptedByUserId?: string;
  systemId?: string;
  now?: string;
}): Promise<CampaignActorSourceAcceptanceResult> {
  const { actor, vaultRepository, acceptanceRepository } = input;
  const sourceActorId = actor.sourceActorId?.trim();
  if (!sourceActorId) {
    return { decision: 'notLinkedToSource', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'This campaign actor is not linked to a Vault character.' };
  }
  const systemId = input.systemId ?? DND_COMBAT_RELEVANT_HASH_SYSTEM_ID;
  if (systemId !== DND_COMBAT_RELEVANT_HASH_SYSTEM_ID) {
    return { decision: 'unsupportedSystem', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'Source acceptance is only implemented for DND 2024 characters.' };
  }

  let current;
  try {
    current = await vaultRepository.getActorById(sourceActorId);
  } catch {
    return { decision: 'unavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The character source could not be read.' };
  }
  if (!current.ok) {
    return { decision: 'unavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The character source could not be read.' };
  }
  if (!current.value || current.value.archivedAt) {
    return { decision: 'sourceUnavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The linked character is no longer available.' };
  }
  if (!linkOwnershipHolds(actor, current.value.ownerId)) {
    return { decision: 'sourceUnavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The linked character no longer belongs to this actor\u2019s owner.' };
  }

  // Re-derive from the server's own read. The client supplied nothing usable.
  const snapshotPayload = record(current.value.payload) ?? {};
  const snapshotHash = formatDndCharacterCombatRelevantHash(snapshotPayload);
  if (!snapshotHash) {
    return { decision: 'sourceUnreadable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The linked character could not be read as a DND 2024 character.' };
  }
  if (snapshotHash !== input.expectedSourceHash) {
    return {
      decision: 'reviewVersionMismatch',
      campaignActorInstanceId: actor.campaignActorInstanceId,
      message: 'The character changed again since it was reviewed. Review the update again before accepting.',
    };
  }

  let written;
  try {
    written = await acceptanceRepository.acceptCampaignActorSourceUpdate({
      campaignActorInstanceId: actor.campaignActorInstanceId,
      snapshotPayload,
      snapshotHash,
      acceptance: {
        ...(input.acceptedByUserId ? { acceptedByUserId: input.acceptedByUserId } : {}),
        acceptedAt: input.now ?? new Date().toISOString(),
        ...(actor.snapshotHash ? { previousSnapshotHash: actor.snapshotHash } : {}),
      },
    });
  } catch {
    return { decision: 'unavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The accepted source could not be stored.' };
  }
  if (!written.ok || !written.value) {
    return { decision: 'unavailable', campaignActorInstanceId: actor.campaignActorInstanceId, message: 'The accepted source could not be stored.' };
  }

  return {
    decision: 'accepted',
    campaignActorInstanceId: actor.campaignActorInstanceId,
    actor: written.value,
    acceptedSourceHash: snapshotHash,
    ...(actor.snapshotHash ? { previousSourceHash: actor.snapshotHash } : {}),
  };
}
