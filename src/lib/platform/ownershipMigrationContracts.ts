/**
 * Ownership migration contracts (P5.1 — preparation only, types only).
 *
 * AI-LANDMARK: OWNERSHIP_MIGRATION_CONTRACTS_V1
 *
 * Shared contracts for FUTURE ownerId backfill/migration steps (P5.2+). This
 * file implements NO migration: no store is rewritten, no entity is touched,
 * and existing un-owned local content keeps working exactly as today.
 *
 * Boundary fit: `EntityGraph` nodes already carry an optional `ownerId`; these
 * contracts describe how later steps will assign the local anonymous user (or
 * a future cloud identity) as owner in a reviewable, dry-runnable way.
 */

import type { EntityType } from '../architecture/entityGraph';

/** Why an ownership assignment happened (audit-friendly, additive union). */
export type OwnershipAssignmentReason =
  /** Backfilling legacy local content onto the device's anonymous user. */
  | 'localAnonymousBackfill'
  /** Explicit transfer between two known owners. */
  | 'transfer'
  /** Content imported from a file/package claims the importing user. */
  | 'import'
  | 'custom';

/** One planned or applied ownership change for a single entity. */
export interface OwnershipAssignment {
  entityType: EntityType;
  entityId: string;
  /** Undefined when the entity had no owner yet (the common legacy case). */
  previousOwnerId?: string;
  nextOwnerId: string;
  reason: OwnershipAssignmentReason;
  assignedAt: string;
  note?: string;
}

/**
 * A reviewable migration plan: build → inspect (dryRun) → apply in a later,
 * separately-reviewed P5 step. P5.1 defines the shape only.
 */
export interface OwnershipMigrationPlan {
  planId: string;
  targetOwnerId: string;
  assignments: OwnershipAssignment[];
  dryRun: boolean;
  createdAt: string;
  note?: string;
}

/** Result summary contract for a future apply step (not implemented in P5.1). */
export interface OwnershipMigrationResult {
  planId: string;
  applied: number;
  skipped: number;
  failed: number;
  completedAt: string;
  errors?: { entityId: string; message: string }[];
}
