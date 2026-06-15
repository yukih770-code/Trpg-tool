/**
 * Platform System Rule Sources — static types (scaffold only).
 *
 * AI-LANDMARK: PLATFORM_WORKSHOP_SYSTEM_RULE_SOURCES_SHELL_V1
 *
 * "System Rule Sources" manages ONLY rule books, expansions, community rule
 * packages, and player custom rule packages for one game system. It does NOT
 * manage scenarios / adventures (those belong to Campaign / Module areas).
 *
 * Scope:
 *  - No store, no schema, no real source priority, no load order,
 *    no override, no conflict detection.
 *  - Builder / Rules Compendium / runtime are NOT affected.
 */

export type RuleSourceStatus = 'enabled' | 'comingSoon' | 'reserved';

export type RuleSourceKind =
  | 'core'
  | 'expansion'
  | 'legacy'
  | 'communityRulePackage'
  | 'playerCustomRulePackage';

export type SystemRuleSourceItem = {
  id: string;
  /** Proper rule-source name (e.g. "2024 Core Rules"). Kept as-is across locales. */
  name: string;
  kind: RuleSourceKind;
  status: RuleSourceStatus;
  /** Optional short note; empty string when none. Never copies long rules text. */
  description: string;
};

/** Which kinds belong to the "Core & Expansion" section. */
export const RULE_SOURCE_CORE_KINDS: RuleSourceKind[] = ['core', 'expansion', 'legacy'];
