// AI-LANDMARK: RULE_DATA_SOURCE_TRUST_METADATA
// Shared metadata contract for rule data provenance and publication-safety review.

export type RuleDataSource =
  | 'dnd5echm-srd52-primary'
  | 'dnd5echm-main-5e-crosscheck'
  | 'dnd5echm-xgte'
  | 'dnd5echm-tcoe'
  | 'ai-assisted'
  | 'dnd2024-srd'
  | 'dnd2024-free-rules'
  | 'xgte'
  | 'tcoe'
  | 'coc7-quickstart'
  | 'coc7-core'
  | 'coc7-investigator'
  | 'cpred-easy-mode'
  | 'cpred-core'
  | 'rtg-free-dlc'
  | 'homebrew'
  | 'placeholder'
  | 'demo'
  | 'unknown'
  | 'unverified-web';

export type RuleDataTrustLevel =
  | 'owner-source-matched'
  | 'verified-public'
  | 'source-labeled'
  | 'ai-assisted-unverified'
  | 'needs-human-check'
  | 'out-of-source'
  | 'official-but-not-public-content'
  | 'homebrew'
  | 'placeholder'
  | 'demo'
  | 'unknown'
  | 'suspicious'
  | 'not-found';

export type RuleDataPublicScope =
  | 'public-free'
  | 'official-reference-only'
  | 'paid-book-reference-only'
  | 'homebrew'
  | 'demo'
  | 'unknown';

export type RuleDataContentPolicy =
  | 'safe-to-embed'
  | 'name-and-metadata-only'
  | 'do-not-embed-rules-text'
  | 'quarantine';

export type RuleDataUsagePolicy =
  | 'core-runtime-ok'
  | 'display-only'
  | 'needs-human-verification'
  | 'quarantine';

export type RuleDataMetadata = {
  source: RuleDataSource;
  trustLevel: RuleDataTrustLevel;
  publicScope?: RuleDataPublicScope;
  contentPolicy?: RuleDataContentPolicy;
  usagePolicy?: RuleDataUsagePolicy;
  sourceRef?: string;
  sourceUrl?: string;
  sourceNote?: string;
  verifiedAt?: string;
};
