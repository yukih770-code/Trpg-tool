/**
 * Server Ruleset Versioning — shared type contract (P5.S1). Frontend-only.
 *
 * AI-LANDMARK: SERVER_RULESET_VERSIONING_CONTRACT_V1
 *
 * A dependency-free contract describing how a World Server's *ruleset* is
 * versioned, how advanced (visual) settings edits become draft → published
 * versions, and how campaigns / runtime rooms pin a **snapshot** of a published
 * version so that already-preparing or already-playing tables are never forcibly
 * upgraded. Types + pure, deterministic helpers ONLY.
 *
 * This is a CONTRACT, not an implementation. No React, no server, no Postgres, no
 * browser API, no server database env vars. It defines nothing about permissions,
 * DB tables, or UI — see docs/architecture/SERVER_RULESET_VERSIONING_SOFT_UPDATE_UX_V1.md.
 *
 * Boundary reminders:
 *  - Advanced rules are edited through visual/schema-driven UI, never code edits.
 *  - Publishing advanced settings creates a NEW server ruleset version; the old
 *    version and old pack versions remain available (non-destructive).
 *  - Campaigns/rooms use snapshots; running/preparing tables keep their snapshot.
 *  - Old data is never deleted by a ruleset change.
 */

// ── Version lifecycle ────────────────────────────────────────────────────────

export type RulesetVersionStatus =
  | 'draft'
  | 'published'
  | 'deprecated'
  | 'archived';

/**
 * Impact of moving from one published ruleset version to the next.
 *  - safe: additive only (e.g. a new pack version added); existing tables keep working.
 *  - refreshRequired: compatible rule-knob changes that a loaded client should reload
 *    to pick up, but existing characters/rooms remain valid.
 *  - breaking: template change, pack removal/downgrade, or an incompatible knob change
 *    that can invalidate existing characters/rooms and needs host/user review.
 */
export type RulesetChangeImpact =
  | 'safe'
  | 'refreshRequired'
  | 'breaking';

export interface RulesetCompatibilitySummary {
  impact: RulesetChangeImpact;
  requiresRoomReload: boolean;
  requiresCharacterRecheck: boolean;
  requiresCompendiumReindex: boolean;
  requiresHostReview: boolean;
  notes: string[];
}

/**
 * One published (or draft) version of a World Server's ruleset. `ruleKnobs` holds
 * the visual/advanced-settings values (schema-driven, never code). `enabledPackVersionIds`
 * pins exact pack versions (species/classes/monsters/items/maps packs), so a version
 * is fully reproducible and old pack versions stay referenceable.
 */
export interface ServerRulesetVersion {
  serverId: string;
  versionId: string;
  versionNumber: number;
  status: RulesetVersionStatus;
  /** The published version this draft/version was branched from, if any. */
  basedOnVersionId?: string;
  rulesetTemplateId: string;
  enabledPackVersionIds: string[];
  ruleKnobs: Record<string, unknown>;
  compatibility: RulesetCompatibilitySummary;
  createdAt: string;
  publishedAt?: string;
}

// ── Snapshots (campaign prep + runtime room) ─────────────────────────────────

/**
 * A campaign pins the server ruleset version it was prepared under. Preparing
 * players keep this snapshot even after the server publishes a newer version.
 */
export interface CampaignRulesetSnapshot {
  campaignId: string;
  serverId: string;
  serverRulesetVersionId: string;
  enabledPackVersionIds: string[];
  createdAt: string;
}

/**
 * A live/runtime room locks the ruleset version at session start. A running table
 * is never forcibly upgraded; new entrants either load this snapshot or (on a
 * breaking mismatch) see a prompt. `lockedAt` marks when the room froze its ruleset.
 */
export interface RuntimeRulesetSnapshot {
  roomId: string;
  campaignId: string;
  serverId: string;
  serverRulesetVersionId: string;
  enabledPackVersionIds: string[];
  lockedAt: string;
}

// ── Change classification (pure) ─────────────────────────────────────────────

/**
 * A minimal, deterministic description of what changed between two published
 * versions. Real diffing (per-knob, per-pack) is a future implementation concern;
 * this contract only needs the coarse flags that decide impact + UX.
 */
export interface RulesetChangeDescriptor {
  /** The ruleset template id changed (e.g. DND 5e 2024 -> a different template). */
  templateChanged: boolean;
  /** One or more packs were added; nothing removed/downgraded. */
  packVersionsAdded: boolean;
  /** One or more packs were removed or downgraded (potentially data-invalidating). */
  packVersionsRemovedOrDowngraded: boolean;
  /** Compatible rule-knob values changed (existing characters/rooms stay valid). */
  ruleKnobsChangedCompatible: boolean;
  /** A rule-knob change that can invalidate existing characters/rooms. */
  ruleKnobsChangedIncompatible: boolean;
}

const EMPTY_DESCRIPTOR: RulesetChangeDescriptor = {
  templateChanged: false,
  packVersionsAdded: false,
  packVersionsRemovedOrDowngraded: false,
  ruleKnobsChangedCompatible: false,
  ruleKnobsChangedIncompatible: false,
};

/** Deterministic impact classification. Breaking wins over refreshRequired over safe. */
export function classifyRulesetChange(
  descriptor: Partial<RulesetChangeDescriptor> = {},
): RulesetChangeImpact {
  const d = { ...EMPTY_DESCRIPTOR, ...descriptor };
  if (d.templateChanged || d.packVersionsRemovedOrDowngraded || d.ruleKnobsChangedIncompatible) {
    return 'breaking';
  }
  if (d.ruleKnobsChangedCompatible) {
    return 'refreshRequired';
  }
  // Additive-only (or no-op) changes are non-destructive and safe.
  return 'safe';
}

/** Build a compatibility summary from a change descriptor. Pure + deterministic. */
export function summarizeRulesetCompatibility(
  descriptor: Partial<RulesetChangeDescriptor> = {},
): RulesetCompatibilitySummary {
  const d = { ...EMPTY_DESCRIPTOR, ...descriptor };
  const impact = classifyRulesetChange(d);
  const notes: string[] = [];
  if (d.templateChanged) notes.push('Ruleset template changed.');
  if (d.packVersionsAdded) notes.push('New pack version(s) added (additive).');
  if (d.packVersionsRemovedOrDowngraded) notes.push('Pack version(s) removed or downgraded.');
  if (d.ruleKnobsChangedCompatible) notes.push('Compatible rule-knob change(s).');
  if (d.ruleKnobsChangedIncompatible) notes.push('Incompatible rule-knob change(s) may invalidate existing tables.');
  if (notes.length === 0) notes.push('No effective change.');

  return {
    impact,
    requiresRoomReload: impact !== 'safe',
    requiresCharacterRecheck: impact === 'breaking',
    requiresCompendiumReindex: d.packVersionsAdded || d.packVersionsRemovedOrDowngraded || d.templateChanged,
    requiresHostReview: impact === 'breaking',
    notes,
  };
}

/** Whether a runtime snapshot still matches the server's latest published version. */
export function isRuntimeSnapshotCurrent(
  snapshot: Pick<RuntimeRulesetSnapshot, 'serverRulesetVersionId'>,
  latestServerRulesetVersionId: string,
): boolean {
  return snapshot.serverRulesetVersionId === latestServerRulesetVersionId;
}
