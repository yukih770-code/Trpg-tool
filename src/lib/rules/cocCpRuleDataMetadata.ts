/**
 * COC / CP RED Existing Rules Data Provenance Metadata v1
 *
 * AI-LANDMARK: COC_CP_RULE_DATA_PROVENANCE_METADATA_V1
 *
 * Provenance / source-status metadata for the rule DATASETS that already exist
 * (or are notably absent) in the COC 7e and Cyberpunk RED layers. DND already
 * has its own RuleDataMetadata provenance; this file gives COC and CP RED an
 * equivalent provenance index WITHOUT touching their data.
 *
 * Strict scope (this is provenance metadata, NOT rule content):
 * - Contains NO rule values: no skills, occupations, weapons, armor, cyberware,
 *   roles, lifepath options, critical-injury tables, or any official text.
 * - Does NOT copy COC_BASE_SKILLS / CP_SKILLS / CP_WEAPON_LIST / CP_ROLES etc.
 * - Does NOT move data files, change any data values, or refactor coc-types.ts /
 *   cp-types.ts.
 * - Does NOT modify Creator / Sheet / Store / Adapter / Runtime / Campaign /
 *   ActorVault / import-export / Source Settings / WorkshopPackage wiring.
 * - Does NOT add publicCode to any public rule catalog item.
 *
 * Source-priority rule (see docs/rules/COC_RULE_COVERAGE.md /
 * CPRED_RULE_COVERAGE.md): rule data is never AI-memory generated. Completion
 * order: user-provided local material / reference contract > in-repo structured
 * data / store / adapter / creator-sheet implementation > official public
 * material (cross-check only) > community material (assist only). AI memory is
 * not a source.
 *
 * Current material status: COC and CP RED do NOT yet have a user reference
 * contract equivalent to DND's owner manifest. Existing COC/CP data is therefore
 * marked as unverified-existing-data / needs-human-check, and missing content is
 * marked pending-user-local-source. This file does not attempt to fill it.
 */

export type ExistingRulesDataSystemId = 'coc7e' | 'cp-red';

export type ExistingRulesDataSourceStatus =
  | 'in-repo-existing-data'
  | 'pending-user-local-source'
  | 'needs-human-check'
  | 'missing'
  | 'not-yet-modeled';

export type ExistingRulesDataTrustLevel =
  | 'source-labeled'
  | 'needs-human-check'
  | 'unverified-existing-data'
  | 'pending-source';

export interface ExistingRulesDataMetadataEntry {
  systemId: ExistingRulesDataSystemId;
  datasetId: string;
  label: string;
  /** Where the dataset (or its stand-in) lives today. Empty when missing / not modeled. */
  currentLocation: string[];
  sourceStatus: ExistingRulesDataSourceStatus;
  trustLevel: ExistingRulesDataTrustLevel;
  /** True when absence/incompleteness blocks a rules-complete character sheet (车卡). */
  blocksCompleteCharacterSheet: boolean;
  /** True when absence/incompleteness blocks runtime/gameplay automation. */
  blocksRuntimeAutomation: boolean;
  /** True when finishing/verifying this dataset requires user-provided local source material. */
  needsUserLocalSource: boolean;
  notes: string;
}

// ── COC 7e ───────────────────────────────────────────────────────────────────
// Existing data is inlined in src/lib/coc-types.ts with no provenance metadata.
// No user COC reference contract yet.

const COC_METADATA: ExistingRulesDataMetadataEntry[] = [
  {
    systemId: 'coc7e',
    datasetId: 'coc-base-skills',
    label: 'Base Skills',
    currentLocation: ['src/lib/coc-types.ts (COC_BASE_SKILLS)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'Full base-skill list with base values already exists but is inlined in a types file with no provenance. Source verification needs a user COC reference contract.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-attributes',
    label: 'Attributes',
    currentLocation: ['src/lib/coc-utils.ts', 'src/store/cocStore.ts', 'src/pages/CocCreator.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: false,
    notes: 'Characteristic generation is mechanics wired in Creator; not a content table.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-derived-attributes',
    label: 'Derived Attributes (HP/MP/SAN/Luck/DB)',
    currentLocation: ['src/lib/coc-utils.ts'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: false,
    notes: 'Derived values computed via pure utilities; formula logic, not content tables.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-occupation-templates',
    label: 'Occupation Templates',
    currentLocation: [],
    sourceStatus: 'pending-user-local-source',
    trustLevel: 'pending-source',
    blocksCompleteCharacterSheet: true,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'Occupation is a free-text string only; no occupation table exists. Blocks occupation skill list + Credit Rating. Do NOT fabricate; needs user COC reference.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-occupation-skill-points',
    label: 'Occupation Skill Points (EDU x 4)',
    currentLocation: ['src/pages/CocCreator.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: false,
    notes: 'Budget/cap constraint wired (cap 90); no occupation-specific allowed-skill list because occupation templates are missing.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-personal-interest-skill-points',
    label: 'Personal Interest Skill Points (INT x 2)',
    currentLocation: ['src/pages/CocCreator.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: false,
    notes: 'Budget/cap constraint wired; no advanced validation beyond budget and cap.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-credit-rating',
    label: 'Credit Rating',
    currentLocation: ['src/lib/coc-types.ts (COC_BASE_SKILLS base-0 entry only)'],
    sourceStatus: 'pending-user-local-source',
    trustLevel: 'pending-source',
    blocksCompleteCharacterSheet: true,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'Exists only as a base-0 skill row; no occupation-driven range/validation. Depends on occupation templates + user reference.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-weapons-catalog',
    label: 'Weapons Catalog',
    currentLocation: ['src/lib/coc-types.ts (CocWeapon type; per-character field only)'],
    sourceStatus: 'missing',
    trustLevel: 'pending-source',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: true,
    notes: 'CocWeapon is a character field; no weapon catalog data. Manual entry only. Needs user reference.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-items-catalog',
    label: 'Items / Gear Catalog',
    currentLocation: ['src/store/cocStore.ts (free-text inventory)'],
    sourceStatus: 'missing',
    trustLevel: 'pending-source',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'No structured item catalog; inventory is free text. Needs user reference.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-investigator-background-fields',
    label: 'Investigator Background Fields',
    currentLocation: ['src/store/cocStore.ts', 'src/pages/CocCreator.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: false,
    notes: 'Backstory fields editable; no structured clue/relationship model (not required for car-card).',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-sanity-basics',
    label: 'Sanity Basics',
    currentLocation: ['src/lib/coc-utils.ts', 'src/pages/cocGameplay/CocSanCheckPanel.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: false,
    notes: 'Basic SAN check + manual flags wired; full insanity automation deferred (madness/insanity tables are a separate missing dataset).',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-damage-basics',
    label: 'Damage / HP Basics',
    currentLocation: ['src/lib/coc-utils.ts', 'src/pages/CocGameplay.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: false,
    notes: 'HP delta + major wound/dying pure helpers exist; full medical workflow deferred.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-growth-improvement',
    label: 'Growth / Improvement',
    currentLocation: ['src/pages/CocGameplay.tsx', 'src/store/cocStore.ts'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: false,
    notes: 'Growth marks + 1d10 improvement (cap 99) wired in gameplay.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'coc-madness-insanity',
    label: 'Madness / Insanity',
    currentLocation: [],
    sourceStatus: 'not-yet-modeled',
    trustLevel: 'pending-source',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: true,
    notes: 'Bout of madness / symptom tables / phobias / manias are level 0. Needs user reference contract.',
  },
];

// ── CP RED ───────────────────────────────────────────────────────────────────
// Existing data is inlined in src/lib/cp-types.ts with no provenance metadata.
// No user CP RED reference contract yet.

const CP_METADATA: ExistingRulesDataMetadataEntry[] = [
  {
    systemId: 'cp-red',
    datasetId: 'cp-roles',
    label: 'Roles',
    currentLocation: ['src/lib/cp-types.ts (CP_ROLES)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: '10 roles structured but inlined in a types file with no provenance. Source verification needs a user CP RED reference contract.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-role-abilities',
    label: 'Role Abilities',
    currentLocation: ['src/lib/cp-types.ts (CP_ROLE_ABILITIES)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: true,
    notes: 'One ability per role present at display/state level; automation deferred. No provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-stats',
    label: 'Stats',
    currentLocation: ['src/lib/cp-types.ts (CP_STAT_ORDER)', 'src/store/cpStore.ts'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: false,
    notes: 'Core stats wired in Creator/Sheet/Gameplay; stat ordering is structural.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-skills',
    label: 'Skills',
    currentLocation: ['src/lib/cp-types.ts (CP_SKILLS)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'Skill list structured but inlined with no provenance; creation-time skill-point allocation still needs audit (coverage level 1).',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-lifepath',
    label: 'Lifepath',
    currentLocation: ['src/lib/cp-types.ts (CpLifePath type + lifePath field)'],
    sourceStatus: 'pending-user-local-source',
    trustLevel: 'pending-source',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'Lifepath data STRUCTURE exists, but no lifepath option/random tables. Does not block a basic car-card; full lifepath needs user reference. Do NOT fabricate tables.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-equipment',
    label: 'Equipment (general)',
    currentLocation: ['src/lib/cp-types.ts', 'src/pages/CpMarket.tsx (MISC_ITEMS)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'Catalogs inlined; market add-to-inventory wired. Values/prices unverified; no provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-weapons',
    label: 'Weapons',
    currentLocation: ['src/lib/cp-types.ts (CP_WEAPON_LIST)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: true,
    notes: 'Weapon catalog present + buyable; no attack/damage automation. Values unverified; no provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-armor',
    label: 'Armor',
    currentLocation: ['src/lib/cp-types.ts (CP_ARMOR_LIST)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: true,
    notes: 'Armor catalog present + equippable; no SP/ablation runtime. Values unverified; no provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-cyberware',
    label: 'Cyberware',
    currentLocation: ['src/lib/cp-types.ts (CP_CYBERWARE_LIST)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: true,
    notes: 'Cyberware catalog present + install/uninstall (state-only); Humanity Loss not automated. Values unverified; no provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-fashion',
    label: 'Fashion / Style',
    currentLocation: ['src/lib/cp-types.ts (CP_CLOTHING_LIST)'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'Fashion catalog present + wearable. Values unverified; no provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-humanity-emp',
    label: 'Humanity / EMP',
    currentLocation: ['src/lib/cp2024/cp-utils.ts', 'src/store/cpStore.ts'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: false,
    notes: 'Humanity/EMP pure logic + runtime wired; cyberware-driven Humanity Loss automation deferred.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-hp-death-save',
    label: 'HP / Death Save',
    currentLocation: ['src/lib/cp2024/cp-utils.ts', 'src/pages/CpGameplay.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: false,
    notes: 'HP, seriously-wounded threshold, death save base wired; full mortally-wounded workflow deferred.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-market',
    label: 'Market',
    currentLocation: ['src/pages/CpMarket.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: true,
    notes: 'Buy/equip/install flow wired with stable instance ids; prices come from inlined catalogs and are unverified. Dynamic economy deferred.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-critical-injuries',
    label: 'Critical Injuries',
    currentLocation: ['src/lib/cp-types.ts (CP_CRIT_INJURIES_BODY/HEAD)', 'src/lib/cp2024/critical-injuries.ts'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'unverified-existing-data',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: true,
    notes: '2d6 body/head tables present; manual add/remove tracking. Values unverified; automation deferred; no provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-netrunning-basics',
    label: 'Netrunning Basics',
    currentLocation: [],
    sourceStatus: 'not-yet-modeled',
    trustLevel: 'pending-source',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: true,
    needsUserLocalSource: true,
    notes: 'Fully deferred (level 0). Large subsystem; needs user reference contract before any data.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cp-character-creation-flow',
    label: 'Character Creation Flow',
    currentLocation: ['src/pages/CpCreator.tsx'],
    sourceStatus: 'in-repo-existing-data',
    trustLevel: 'needs-human-check',
    blocksCompleteCharacterSheet: false,
    blocksRuntimeAutomation: false,
    needsUserLocalSource: false,
    notes: 'Creation works, but skill-point allocation is coverage level 1 and needs a dedicated audit.',
  },
];

export const COC_CP_EXISTING_RULES_DATA_METADATA: ExistingRulesDataMetadataEntry[] = [
  ...COC_METADATA,
  ...CP_METADATA,
];

/** All provenance entries for a single system. */
export function getExistingRulesDataMetadata(
  systemId: ExistingRulesDataSystemId,
): ExistingRulesDataMetadataEntry[] {
  return COC_CP_EXISTING_RULES_DATA_METADATA.filter((entry) => entry.systemId === systemId);
}

/** Entries that require user-provided local source material to finish/verify. */
export function getDatasetsNeedingUserLocalSource(
  systemId?: ExistingRulesDataSystemId,
): ExistingRulesDataMetadataEntry[] {
  return COC_CP_EXISTING_RULES_DATA_METADATA.filter(
    (entry) =>
      entry.needsUserLocalSource &&
      (systemId === undefined || entry.systemId === systemId),
  );
}

/** Entries whose absence/incompleteness blocks a rules-complete character sheet. */
export function getCharacterSheetBlockers(
  systemId?: ExistingRulesDataSystemId,
): ExistingRulesDataMetadataEntry[] {
  return COC_CP_EXISTING_RULES_DATA_METADATA.filter(
    (entry) =>
      entry.blocksCompleteCharacterSheet &&
      (systemId === undefined || entry.systemId === systemId),
  );
}
