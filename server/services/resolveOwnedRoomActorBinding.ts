/**
 * Canonicalizes a submitted Vault actor reference before it reaches room state.
 *
 * Only an authenticated owner may bind a persisted actor. The output is a small
 * room-lobby projection; it intentionally never copies the full Actor Vault
 * payload into a RoomSnapshot or turns it into a CampaignActorInstance.
 */

import type { PostgresActorRepository } from '../adapters/postgresActorRepository.js';
import { buildCharacterClearanceDetails } from '../../src/lib/platform/characterClearanceDetails.js';
import type { RoomActorBindingSource, RoomPersonalContentReferenceSummary, RoomSystemId } from '../../src/lib/platform/roomTypes.js';

export interface SubmittedRoomActorReference {
  systemId?: string;
  actorId?: string;
  displayName: string;
  source?: unknown;
  summary?: string;
  hpCurrent?: number;
  hpMax?: number;
  armorClass?: number;
  details?: unknown;
  contentReferences?: RoomPersonalContentReferenceSummary[];
}

export type OwnedRoomActorBindingResolution =
  | { ok: true; actorRef: SubmittedRoomActorReference }
  | { ok: false; code: 'not_found' | 'forbidden' | 'system_mismatch' | 'unavailable'; message: string };

/**
 * A submission without actorId remains a provisional quick draft/manual lobby
 * summary. As soon as actorId is supplied, the browser-provided character
 * fields are replaced with a server-owned Vault projection.
 */
export async function resolveOwnedRoomActorBinding(
  repository: Pick<PostgresActorRepository, 'getActorById'>,
  input: {
    viewerUserId: string;
    roomSystemId: RoomSystemId;
    actorRef: SubmittedRoomActorReference;
  },
): Promise<OwnedRoomActorBindingResolution> {
  const actorId = input.actorRef.actorId?.trim();
  if (!actorId) return { ok: true, actorRef: input.actorRef };

  const result = await repository.getActorById(actorId);
  if (result.ok === false) {
    return { ok: false, code: 'unavailable', message: 'Actor vault service is unavailable.' };
  }
  const actor = result.value;
  // Treat missing, archived, and foreign records uniformly. This avoids turning
  // a room binding endpoint into an actor-id discovery oracle.
  if (!actor || actor.archivedAt || actor.ownerId !== input.viewerUserId) {
    return { ok: false, code: 'not_found', message: 'Selected character is unavailable.' };
  }
  if (actor.systemId !== input.roomSystemId) {
    return { ok: false, code: 'system_mismatch', message: 'Selected character does not match this room system.' };
  }

  const source: RoomActorBindingSource = 'localActorVault';
  const details = buildCharacterClearanceDetails({
    name: actor.displayName,
    sourceType: source,
    systemId: actor.systemId,
    snapshot: actor.payload,
  });
  return {
    ok: true,
    actorRef: {
      actorId: actor.actorId,
      systemId: actor.systemId,
      displayName: actor.displayName,
      source,
      summary: details.review.summary,
      hpCurrent: details.combat.hpCurrent,
      hpMax: details.combat.hpMax,
      armorClass: details.combat.ac,
      details,
      contentReferences: input.actorRef.contentReferences,
      // Do not trust client-provided summary/HP/details for a persisted Vault
      // record. A future campaign actor instance will project safe live fields.
    },
  };
}
