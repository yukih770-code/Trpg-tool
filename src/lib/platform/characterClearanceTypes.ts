/**
 * Character Clearance contracts (v0, types only).
 *
 * AI-LANDMARK: CHARACTER_CLEARANCE_CONTRACTS_V0
 *
 * This module defines platform-level contracts for future Character Clearance.
 * It does NOT enforce clearance, mutate actor stores, approve admissions, compute
 * hashes, or call AI. Current `RoomActorBinding` (RoomSnapshot.lobby.actorBindings)
 * remains the v0 lobby binding until a later milestone integrates these contracts.
 *
 * Design constraints:
 *  - Platform-level only — NO DND/COC/CP RED rule fields are hardcoded here. There
 *    is no shared CharacterData type in this codebase (actors live in per-system
 *    stores surfaced via ActorVaultAdapter), so ActorSnapshot is produced by a
 *    per-system ActorSnapshotAdapter (see actorSnapshotAdapter.ts).
 *  - System-specific data rides as system-tagged `Record<string, unknown>` payloads
 *    with clearly named buckets; this contract never inspects their contents.
 *  - RuntimeActorState and ActorStateDelta are intentionally NOT defined here
 *    (future M25). AIInspectionAdvice is advisory only — never authoritative.
 */

// ── Rule profile (host-authored gate) ───────────────────────────────────────

export type CampaignRuleStrictness = 'lenient' | 'standard' | 'strict' | 'custom';

/**
 * A lightweight policy bucket. v0 keeps these intentionally shallow — full rule
 * semantics are NOT modeled here (no rules engine). `mode` gives a coarse intent;
 * `allow`/`deny` are opaque string ids interpreted by a future per-system checker.
 */
export interface RulePolicyList {
  mode?: 'allowAll' | 'denyAll' | 'allowListed' | 'denyListed';
  allow?: string[];
  deny?: string[];
  note?: string;
}

export interface RuleNumericRange {
  min?: number;
  max?: number;
}

export interface CampaignRuleProfile {
  profileId: string;
  campaignId: string;
  systemId: string;
  /** Bumped on every edit; cached admissions compare against this. */
  version: number;
  strictness: CampaignRuleStrictness;
  /** Opaque rule-source ids the host permits (interpreted per system later). */
  allowedRuleSources: string[];
  levelRange?: RuleNumericRange;
  allowCustomRules?: boolean;

  // Reserved, lightweight policy slots (NOT a rules engine). Optional in v0.
  classPolicy?: RulePolicyList;
  speciesPolicy?: RulePolicyList;
  backgroundPolicy?: RulePolicyList;
  featPolicy?: RulePolicyList;
  multiclassPolicy?: RulePolicyList;
  equipmentPolicy?: RulePolicyList;
  currencyPolicy?: RuleNumericRange;
  magicItemPolicy?: RulePolicyList;
  spellPolicy?: RulePolicyList;

  createdAt: string;
  updatedAt: string;
}

// ── Actor snapshot (normalized projection at submit time) ────────────────────

/**
 * Field tiers control what participates in the clearance hash.
 *  - clearanceRelevant: gate-relevant (level, abilities, class, feats, spells,
 *    equipment, currency, magic items, resources). HASHED.
 *  - cosmetic: avatar, appearance, backstory, UI prefs. NOT hashed.
 *  - privateNotes: player-private notes. NOT hashed.
 */
export type ActorSnapshotFieldTier = 'clearanceRelevant' | 'cosmetic' | 'privateNotes';

export interface ActorSnapshotPayload {
  /** Gate-relevant, system-tagged data. The ONLY tier covered by the hash. */
  clearanceRelevant: Record<string, unknown>;
  /** Cosmetic data (avatar/appearance/backstory/UI). Not hashed. */
  cosmetic?: Record<string, unknown>;
  /** Player-private notes. Not hashed. */
  privateNotes?: Record<string, unknown>;
}

/** Immutable, system-tagged projection of an actor at a moment in time. */
export interface ActorSnapshot {
  snapshotId: string;
  systemId: string;
  /** Vault/store actor id this snapshot was projected from (if any). */
  sourceActorId?: string;
  displayName: string;
  /** Bumped when the snapshot projection shape changes (affects hashing). */
  schemaVersion: number;
  capturedAt: string;
  payload: ActorSnapshotPayload;
}

// ── Snapshot hash (computed by a trusted/server layer — NOT here) ────────────

export type ActorSnapshotHashAlgorithm = 'sha256';

/**
 * Content hash over the clearanceRelevant tier only. MUST be computed by a
 * server-side / trusted layer (never trust a client-supplied hash). v0 defines
 * the shape only — no hashing is implemented in this milestone.
 */
export interface ActorSnapshotHash {
  algorithm: ActorSnapshotHashAlgorithm;
  value: string;
  /** Snapshot schemaVersion the hash was computed against. */
  schemaVersion: number;
  /** Tiers included in the hash (v0: ['clearanceRelevant']). */
  coveredFieldTiers: ActorSnapshotFieldTier[];
  /** Optional list of concrete field paths covered (for transparency/audit). */
  coveredFields?: string[];
  computedAt: string;
}

// ── Admission record (clearance verdict for an actor version in a scope) ─────

export type ActorAdmissionStatus = 'pending' | 'approved' | 'rejected' | 'revoked' | 'stale';

export interface ActorAdmissionRecord {
  admissionId: string;
  campaignId: string;
  /** Set when the admission is bound to a specific running session. */
  runtimeSessionId?: string;
  /** The room the admission was decided in (if applicable). */
  roomId?: string;
  memberId?: string;
  sourceActorId?: string;
  approvedSnapshotId?: string;
  /** The hash that defines "已通过版本" for免审 lookups. */
  approvedSnapshotHash?: ActorSnapshotHash;
  status: ActorAdmissionStatus;
  inspectionResultId?: string;
  decidedByMemberId?: string;
  decidedAt?: string;
  /** Optional reason for reject/revoke/stale. */
  reason?: string;
  /** When superseded by a newer admission of the same actor. */
  supersedesAdmissionId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Inspection result (deterministic check output; AI is advisory) ───────────

export type InspectionFindingSeverity = 'info' | 'warning' | 'error';

export interface InspectionFinding {
  findingId: string;
  /** error = hard block; warning = host confirm; info = note. */
  severity: InspectionFindingSeverity;
  /** Stable machine code, e.g. 'level.aboveMax'. */
  code: string;
  message: string;
  /** Path into the snapshot payload, e.g. 'clearanceRelevant.level'. */
  fieldPath?: string;
  /** Opaque reference to the rule/source that produced this finding. */
  sourceRef?: string;
}

export type InspectionResultStatus = 'passed' | 'blocked' | 'needsHostReview';

export interface InspectionResult {
  inspectionResultId: string;
  snapshotId: string;
  campaignId: string;
  ruleProfileId: string;
  ruleProfileVersion: number;
  /**
   * passed = no errors/warnings; needsHostReview = warnings present;
   * blocked = at least one error. AI advice can NEVER override an error.
   */
  status: InspectionResultStatus;
  findings: InspectionFinding[];
  aiAdvice?: AIInspectionAdvice;
  createdAt: string;
}

// ── AI inspection advice (advisory ONLY — never authoritative) ───────────────

export type AIInspectionRiskLevel = 'low' | 'medium' | 'high';

/**
 * Future small-model output. Advisory ONLY: it may summarize diffs, flag fields,
 * and explain risk, but it MUST NOT approve, reject, edit actors, or bypass hard
 * rules (errors). No model is called in v0; this is a shape contract.
 */
export interface AIInspectionAdvice {
  adviceId: string;
  riskLevel: AIInspectionRiskLevel;
  summary: string;
  flaggedFields?: string[];
  explanations?: string[];
  /** Ids of in-session deltas correlated to changes (future M25). */
  correlatedDeltaIds?: string[];
  modelVersion?: string;
  confidence?: number;
  /** Always non-binding; surfaced to the host as guidance only. */
  disclaimer: string;
}

// ── Future (NOT defined here) ────────────────────────────────────────────────
// RuntimeActorState and ActorStateDelta are intentionally deferred to a later
// milestone (M25). Do not add them in this contracts module.
