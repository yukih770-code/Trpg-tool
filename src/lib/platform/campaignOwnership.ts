/**
 * Campaign ownership backfill (P5.3 — Campaign ONLY).
 *
 * AI-LANDMARK: CAMPAIGN_OWNERSHIP_BACKFILL_V1
 *
 * Extends the P5.2 ownership foundation from Actor Vault to local campaigns:
 * the device's local anonymous user (from `localUserRepository`) becomes the
 * owner of existing local campaigns — WITHOUT modifying the campaign store
 * schema, the persisted campaign records, or any import/export envelope.
 *
 * Why a dedicated additive registry instead of `LocalCampaign.ownerId`:
 * - `normalizePersistedCampaign` (campaignLocalStore) strips unknown fields on
 *   rehydrate, so an ownerId written into records would be silently dropped by
 *   any code path that predates the field — a partial-wire data-loss hazard.
 * - Campaign export snapshots serialize LocalCampaign as-is. A record-level
 *   ownerId would leak the EXPORTING device's owner into imports on another
 *   device (wrong owner). With a registry, an imported campaign is naturally
 *   adopted by the IMPORTING device's local user on the next backfill run —
 *   which is the correct offline-first semantic.
 * - It mirrors `actorVaultOwnership` (P5.2) exactly, so both registries can be
 *   normalized together in one future cloud-sync step, and it is reversible:
 *   deleting the single localStorage key removes all ownership metadata
 *   without touching any campaign record.
 *
 * Ownership here is METADATA ONLY — no permission filtering, no access
 * control, no membership, no Room Server protocol involvement. `campaignRef`
 * sent to the Room Server is deliberately untouched (protocol freeze).
 */

import type {
  OwnershipAssignment,
  OwnershipMigrationPlan,
  OwnershipMigrationResult,
} from './ownershipMigrationContracts';
import { localUserRepository } from './localUserIdentity';
// P5.5: shared local persistence adapter (same key, same behavior, one impl).
import { createLocalJsonStore } from './localPersistenceAdapter';
import { useCampaignLocalStore } from './campaignLocalStore';

// ── Ownership record shape (additive; campaign records are never rewritten) ──

export interface CampaignOwnershipRecord {
  /** Stable campaign id from the campaign local store. */
  campaignId: string;
  /** Game system of the campaign at assignment time (metadata only). */
  systemId?: string;
  /** Owner user id. Optional until backfilled (compatibility-first). */
  ownerId?: string;
  assignedAt?: string;
  reason?: OwnershipAssignment['reason'];
}

interface CampaignOwnershipMap {
  schemaVersion: 1;
  /** key = campaignId (campaign ids are globally unique). */
  entries: Record<string, CampaignOwnershipRecord>;
  updatedAt: string;
}

export const CAMPAIGN_OWNERSHIP_STORAGE_KEY = 'trpg-campaign-ownership-v1';

function nowIso(): string {
  return new Date().toISOString();
}

// ── Read the campaign store (READ-ONLY, defensive) ───────────────────────────

interface ScannedCampaign {
  campaignId: string;
  systemId: string;
}

/**
 * Scan ALL local campaigns, including archived and trashed ones — lifecycle
 * state is not ownership state, and a recovered campaign must keep its owner.
 * Read-only; never mutates the campaign store.
 */
function scanLocalCampaigns(): ScannedCampaign[] {
  try {
    const campaigns = useCampaignLocalStore.getState().campaigns;
    if (!Array.isArray(campaigns)) return [];
    const out: ScannedCampaign[] = [];
    for (const raw of campaigns) {
      const rec = raw as { id?: unknown; systemId?: unknown } | null;
      const campaignId = rec && typeof rec.id === 'string' ? rec.id.trim() : '';
      if (campaignId !== '') {
        out.push({
          campaignId,
          systemId: rec && typeof rec.systemId === 'string' ? rec.systemId : '',
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

// ── Ownership map persistence (P5.5: shared adapter; same key, same mirror) ──

function isOwnershipMap(value: unknown): value is CampaignOwnershipMap {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<CampaignOwnershipMap>;
  return m.schemaVersion === 1 && !!m.entries && typeof m.entries === 'object';
}

function emptyMap(): CampaignOwnershipMap {
  return { schemaVersion: 1, entries: {}, updatedAt: nowIso() };
}

const ownershipStore = createLocalJsonStore<CampaignOwnershipMap>({
  key: CAMPAIGN_OWNERSHIP_STORAGE_KEY,
  fallback: emptyMap,
  validate: isOwnershipMap,
});

function loadMap(): CampaignOwnershipMap {
  return ownershipStore.read();
}

function saveMap(map: CampaignOwnershipMap): void {
  ownershipStore.write(map);
}

// ── Public reads (metadata only — never used for permission decisions) ───────

/** Current owner of a local campaign, if backfilled. Read-only. */
export function getCampaignOwnerId(campaignId: string): string | undefined {
  return loadMap().entries[campaignId]?.ownerId;
}

/** Current ownership record of a local campaign, if backfilled. Read-only. */
export function getCampaignOwnershipRecord(campaignId: string): CampaignOwnershipRecord | undefined {
  return loadMap().entries[campaignId];
}

/**
 * Productized ownership copy for UI surfaces. Never exposes the raw ownerId.
 * Returns undefined when the campaign has no recorded owner yet, so callers
 * can keep their existing placeholder copy.
 */
export function getCampaignOwnershipLabel(campaignId: string): string | undefined {
  return getCampaignOwnerId(campaignId) ? '归属：本地用户' : undefined;
}

function makePlanId(): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `ownership_plan_${rand}`;
}

// ── Backfill: plan (dry-run) + apply (idempotent) ────────────────────────────

/**
 * Build a reviewable backfill plan for local campaigns missing an owner.
 * Pure / read-only: it does NOT write anything. `dryRun` is always true here.
 */
export function planCampaignOwnershipBackfill(): OwnershipMigrationPlan {
  const targetOwnerId = localUserRepository.getOrCreateCurrentUser().identity.userId;
  const map = loadMap();
  const assignedAt = nowIso();

  const assignments: OwnershipAssignment[] = scanLocalCampaigns()
    .filter((c) => !map.entries[c.campaignId]?.ownerId)
    .map((c) => ({
      entityType: 'campaign',
      entityId: c.campaignId,
      previousOwnerId: undefined,
      nextOwnerId: targetOwnerId,
      reason: 'localAnonymousBackfill',
      assignedAt,
      note: `system=${c.systemId}`,
    }));

  return {
    planId: makePlanId(),
    targetOwnerId,
    assignments,
    dryRun: true,
    createdAt: assignedAt,
    note: 'Campaign ownership backfill (local anonymous user).',
  };
}

/**
 * Apply the backfill idempotently: assigns the local user as owner of every
 * local campaign that has no owner yet. Safe to run repeatedly — already-owned
 * campaigns are skipped. Never throws (errors are collected in the result).
 */
export function applyCampaignOwnershipBackfill(): OwnershipMigrationResult {
  const plan = planCampaignOwnershipBackfill();
  const map = loadMap();
  const errors: { entityId: string; message: string }[] = [];
  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const assignment of plan.assignments) {
    try {
      if (map.entries[assignment.entityId]?.ownerId) {
        skipped += 1;
        continue;
      }
      const systemId = assignment.note?.startsWith('system=')
        ? assignment.note.slice('system='.length)
        : undefined;
      map.entries[assignment.entityId] = {
        campaignId: assignment.entityId,
        ...(systemId ? { systemId } : {}),
        ownerId: assignment.nextOwnerId,
        assignedAt: assignment.assignedAt,
        reason: 'localAnonymousBackfill',
      };
      applied += 1;
    } catch (e) {
      failed += 1;
      errors.push({ entityId: assignment.entityId, message: e instanceof Error ? e.message : String(e) });
    }
  }

  if (applied > 0) {
    map.updatedAt = nowIso();
    saveMap(map);
  }

  return {
    planId: plan.planId,
    applied,
    skipped,
    failed,
    completedAt: nowIso(),
    ...(errors.length > 0 ? { errors } : {}),
  };
}

/**
 * Idempotent startup entry point. Ensures local campaigns are owned by the
 * device's anonymous user. No-op when everything is already owned. Never throws.
 */
export function ensureCampaignOwnershipBackfill(): OwnershipMigrationResult {
  try {
    return applyCampaignOwnershipBackfill();
  } catch {
    return { planId: 'ownership_plan_error', applied: 0, skipped: 0, failed: 0, completedAt: nowIso() };
  }
}

// ── Diagnostic summary (no UI; usable from future diagnostics surfaces) ──────

export interface CampaignOwnershipSummary {
  totalCampaigns: number;
  ownedCampaigns: number;
  unownedCampaigns: number;
}

/** Read-only ownership coverage summary across ALL local campaigns. */
export function summarizeCampaignOwnership(): CampaignOwnershipSummary {
  const map = loadMap();
  const scanned = scanLocalCampaigns();
  const owned = scanned.filter((c) => Boolean(map.entries[c.campaignId]?.ownerId)).length;
  return {
    totalCampaigns: scanned.length,
    ownedCampaigns: owned,
    unownedCampaigns: scanned.length - owned,
  };
}
