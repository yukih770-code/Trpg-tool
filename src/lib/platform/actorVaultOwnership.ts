/**
 * Actor Vault ownership backfill (P5.2 — Actor Vault ONLY).
 *
 * AI-LANDMARK: ACTOR_VAULT_OWNERSHIP_BACKFILL_V1
 *
 * First real ownership migration step after P5.1. It assigns the device's local
 * anonymous user (from `localUserRepository`) as the owner of existing local
 * actor / character records — WITHOUT modifying any character store schema.
 *
 * Design choice (deliberately low-risk, reviewable, offline-first):
 * - Ownership is held in a DEDICATED additive registry (its own localStorage
 *   key), keyed by `${systemId}:${actorId}`. This mirrors how `EntityGraph`
 *   carries `ownerId` separately from payload, and matches the P4.3/P4.5 rule
 *   that adding ownership must be additive and must never rewrite existing
 *   records. The three character stores (DND / COC / CP-RED) are read ONLY.
 * - No character schema bump, no store migration, no UI change, no network, no
 *   vendor SDK. Existing characters load exactly as before.
 *
 * Scope guard: this migrates ONLY actor/character ownership. Campaign, Package,
 * Workshop, Media, Room, and Runtime authority are explicitly untouched.
 */

import type {
  OwnershipAssignment,
  OwnershipMigrationPlan,
  OwnershipMigrationResult,
} from './ownershipMigrationContracts';
import { localUserRepository } from './localUserIdentity';
import { useCharacterStore } from '../../store/characterStore';
import { useCocStore } from '../../store/cocStore';
import { useCpStore } from '../../store/cpStore';

// ── Ownership record shape (additive; actor records "carry" ownerId here) ─────

export interface ActorOwnershipRecord {
  /** Game system the actor belongs to (matches the store's system id). */
  systemId: string;
  /** Stable actor id from the system character store. */
  actorId: string;
  /** Owner user id. Optional until backfilled (compatibility-first). */
  ownerId?: string;
  assignedAt?: string;
  reason?: OwnershipAssignment['reason'];
}

interface ActorVaultOwnershipMap {
  schemaVersion: 1;
  /** key = `${systemId}:${actorId}`. */
  entries: Record<string, ActorOwnershipRecord>;
  updatedAt: string;
}

export const ACTOR_VAULT_OWNERSHIP_STORAGE_KEY = 'trpg-actor-vault-ownership-v1';

function nowIso(): string {
  return new Date().toISOString();
}

function ownershipKey(systemId: string, actorId: string): string {
  return `${systemId}:${actorId}`;
}

// ── Read the three character stores (READ-ONLY, defensive) ───────────────────

interface ScannedActor {
  systemId: string;
  actorId: string;
}

function safeCharacters(getState: () => { characters?: unknown }): unknown[] {
  try {
    const state = getState();
    return Array.isArray(state.characters) ? state.characters : [];
  } catch {
    return [];
  }
}

/** System id ↔ store binding. Read-only; never mutates a character store. */
const ACTOR_SYSTEMS: { systemId: string; read: () => unknown[] }[] = [
  { systemId: 'dnd5e-2024', read: () => safeCharacters(() => useCharacterStore.getState()) },
  { systemId: 'coc7e', read: () => safeCharacters(() => useCocStore.getState()) },
  { systemId: 'cp-red', read: () => safeCharacters(() => useCpStore.getState()) },
];

function scanLocalActors(): ScannedActor[] {
  const out: ScannedActor[] = [];
  for (const system of ACTOR_SYSTEMS) {
    for (const raw of system.read()) {
      const rec = raw as { id?: unknown } | null;
      const actorId = rec && typeof rec.id === 'string' ? rec.id.trim() : '';
      if (actorId !== '') out.push({ systemId: system.systemId, actorId });
    }
  }
  return out;
}

// ── Ownership map persistence (own localStorage key; in-memory mirror) ────────

let inMemoryMap: ActorVaultOwnershipMap | null = null;

function isOwnershipMap(value: unknown): value is ActorVaultOwnershipMap {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<ActorVaultOwnershipMap>;
  return m.schemaVersion === 1 && !!m.entries && typeof m.entries === 'object';
}

function emptyMap(): ActorVaultOwnershipMap {
  return { schemaVersion: 1, entries: {}, updatedAt: nowIso() };
}

function loadMap(): ActorVaultOwnershipMap {
  if (inMemoryMap) return inMemoryMap;
  if (typeof window === 'undefined') {
    inMemoryMap = emptyMap();
    return inMemoryMap;
  }
  try {
    const raw = window.localStorage.getItem(ACTOR_VAULT_OWNERSHIP_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    inMemoryMap = isOwnershipMap(parsed) ? parsed : emptyMap();
  } catch {
    inMemoryMap = emptyMap();
  }
  return inMemoryMap;
}

function saveMap(map: ActorVaultOwnershipMap): void {
  inMemoryMap = map;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTOR_VAULT_OWNERSHIP_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Quota / access failure must never break offline play; the in-memory map
    // still serves this session.
  }
}

// ── Public reads ─────────────────────────────────────────────────────────────

/** Current owner of a local actor, if backfilled. Read-only. */
export function getActorOwnerId(systemId: string, actorId: string): string | undefined {
  return loadMap().entries[ownershipKey(systemId, actorId)]?.ownerId;
}

/** Current ownership record of a local actor, if backfilled. Read-only. */
export function getActorOwnershipRecord(systemId: string, actorId: string): ActorOwnershipRecord | undefined {
  return loadMap().entries[ownershipKey(systemId, actorId)];
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
 * Build a reviewable backfill plan for local actors missing an owner. Pure /
 * read-only: it does NOT write anything. `dryRun` is always true here.
 */
export function planActorVaultOwnershipBackfill(): OwnershipMigrationPlan {
  const targetOwnerId = localUserRepository.getOrCreateCurrentUser().identity.userId;
  const map = loadMap();
  const assignedAt = nowIso();

  const assignments: OwnershipAssignment[] = scanLocalActors()
    .filter((a) => !map.entries[ownershipKey(a.systemId, a.actorId)]?.ownerId)
    .map((a) => ({
      entityType: 'actor',
      entityId: a.actorId,
      previousOwnerId: undefined,
      nextOwnerId: targetOwnerId,
      reason: 'localAnonymousBackfill',
      assignedAt,
      note: `system=${a.systemId}`,
    }));

  return {
    planId: makePlanId(),
    targetOwnerId,
    assignments,
    dryRun: true,
    createdAt: assignedAt,
    note: 'Actor Vault ownership backfill (local anonymous user).',
  };
}

/**
 * Apply the backfill idempotently: assigns the local user as owner of every
 * local actor that has no owner yet. Safe to run repeatedly — already-owned
 * actors are skipped. Never throws (errors are collected in the result).
 */
export function applyActorVaultOwnershipBackfill(): OwnershipMigrationResult {
  const plan = planActorVaultOwnershipBackfill();
  const map = loadMap();
  const errors: { entityId: string; message: string }[] = [];
  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const assignment of plan.assignments) {
    try {
      const systemId = assignment.note?.startsWith('system=') ? assignment.note.slice('system='.length) : '';
      const key = ownershipKey(systemId, assignment.entityId);
      if (map.entries[key]?.ownerId) {
        skipped += 1;
        continue;
      }
      map.entries[key] = {
        systemId,
        actorId: assignment.entityId,
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
 * Idempotent startup entry point. Ensures local actors are owned by the device's
 * anonymous user. No-op when everything is already owned. Never throws.
 */
export function ensureActorVaultOwnershipBackfill(): OwnershipMigrationResult {
  try {
    return applyActorVaultOwnershipBackfill();
  } catch {
    return { planId: 'ownership_plan_error', applied: 0, skipped: 0, failed: 0, completedAt: nowIso() };
  }
}
