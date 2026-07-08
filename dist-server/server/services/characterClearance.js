/**
 * Character Clearance helpers (server v0).
 *
 * AI-LANDMARK: ROOM_SERVER_CHARACTER_CLEARANCE_V0
 *
 * Minimal server-side seam for the deterministic clearance pipeline:
 *  - createSyntheticActorSnapshot: build an ActorSnapshot from the lobby
 *    binding's actorRef summary. This is NOT a real per-system character snapshot
 *    (it reads no DND/COC/CP RED store and no full character sheet) — it only
 *    establishes the admission pipeline.
 *  - hashActorSnapshot: server-side sha256 over the clearanceRelevant tier only.
 *  - inspectActorSnapshot: v0 stub that always passes (no rules engine). Real
 *    CampaignRuleProfile / per-system rule checks come in a later milestone.
 *
 * No AI, no rules engine, no actor-store reads, no extra dependency (node:crypto).
 */
import { createHash, randomUUID } from 'node:crypto';
/** Build a synthetic snapshot from the lobby binding's actor reference. */
export function createSyntheticActorSnapshot(actorRef) {
    const now = new Date().toISOString();
    return {
        snapshotId: `snapshot_${randomUUID()}`,
        systemId: actorRef.systemId,
        sourceActorId: actorRef.actorId,
        displayName: actorRef.displayName,
        schemaVersion: 1,
        capturedAt: now,
        payload: {
            // Built in a fixed key order so the hash is stable for identical refs.
            clearanceRelevant: {
                systemId: actorRef.systemId,
                actorId: actorRef.actorId ?? null,
                displayName: actorRef.displayName,
                source: actorRef.source,
            },
        },
    };
}
/**
 * Server-side hash of the clearanceRelevant tier only. v0 uses a stable
 * JSON.stringify of the fixed-order synthetic payload; a canonical-JSON hash can
 * replace this when real per-system snapshots arrive.
 */
export function hashActorSnapshot(snapshot) {
    const canonical = JSON.stringify(snapshot.payload.clearanceRelevant);
    const value = createHash('sha256')
        .update(`${snapshot.systemId}|${snapshot.schemaVersion}|${canonical}`)
        .digest('hex');
    return {
        algorithm: 'sha256',
        value,
        schemaVersion: snapshot.schemaVersion,
        coveredFieldTiers: ['clearanceRelevant'],
        computedAt: new Date().toISOString(),
    };
}
/** Deterministic inspection stub — v0 always passes (no rules engine). */
export function inspectActorSnapshot(snapshot, campaignId) {
    return {
        inspectionResultId: `inspection_${randomUUID()}`,
        snapshotId: snapshot.snapshotId,
        campaignId,
        ruleProfileId: 'default',
        ruleProfileVersion: 1,
        status: 'passed',
        findings: [],
        createdAt: new Date().toISOString(),
    };
}
