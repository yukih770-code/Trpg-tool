// AI-LANDMARK: RULE_DATA_SOURCE_TRUST_METADATA
// Shared metadata contract for rule data provenance and publication-safety review.

export type RuleDataSource =
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
  | 'verified-public'
  | 'source-labeled'
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

export type RuleDataMetadata = {
  source: RuleDataSource;
  trustLevel: RuleDataTrustLevel;
  publicScope: RuleDataPublicScope;
  contentPolicy: RuleDataContentPolicy;
  sourceUrl?: string;
  sourceNote?: string;
  verifiedAt?: string;
};
