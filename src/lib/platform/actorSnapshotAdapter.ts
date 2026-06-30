/**
 * Actor snapshot adapter boundary (v0, interface only).
 *
 * AI-LANDMARK: ACTOR_SNAPSHOT_ADAPTER_BOUNDARY_V0
 *
 * Defines the per-system boundary that turns a system-specific actor (from a
 * per-system store) into a platform-neutral ActorSnapshot for Character Clearance.
 * It does NOT implement any adapter, touch any store, compute hashes, or enforce
 * rules. Each system (DND 5e 2024 / COC 7e / CP RED / custom) will implement its
 * own adapter in a later milestone; this module only declares the contract.
 *
 * Rationale: there is no shared CharacterData type — actors live in per-system
 * stores (characterStore / cocStore / cpStore) and are surfaced via
 * ActorVaultAdapter. Snapshotting must likewise be per-system.
 */

import type { ActorSnapshot } from './characterClearanceTypes';

export interface ActorSnapshotOptions {
  /** Vault/store actor id to record as the snapshot's source (if known). */
  sourceActorId?: string;
  /** Override the display name; otherwise the adapter derives it. */
  displayName?: string;
  /** ISO timestamp to stamp on the snapshot; adapter may default to now. */
  capturedAt?: string;
  /** Whether to include cosmetic fields in the snapshot (default adapter choice). */
  includeCosmetic?: boolean;
  /** Whether to include private notes (default adapter choice). */
  includePrivateNotes?: boolean;
}

/**
 * Per-system snapshot producer. Implementations live with each system and are the
 * ONLY place that reads a concrete actor shape; the platform never inspects it.
 */
export interface ActorSnapshotAdapter<TActor = unknown> {
  /** The system this adapter snapshots, e.g. 'dnd5e-2024' | 'coc7e' | 'cp-red'. */
  systemId: string;
  /** Project a system-specific actor into a platform ActorSnapshot. */
  createSnapshot(actor: TActor, options?: ActorSnapshotOptions): ActorSnapshot;
}

/**
 * Registry boundary for looking up a snapshot adapter by systemId. Declares the
 * lookup surface only; no concrete registry/instances are created in v0.
 */
export interface ActorSnapshotAdapterRegistry {
  register(adapter: ActorSnapshotAdapter): void;
  get(systemId: string): ActorSnapshotAdapter | undefined;
  list(): ActorSnapshotAdapter[];
}
