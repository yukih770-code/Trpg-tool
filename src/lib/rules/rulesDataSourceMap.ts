/**
 * Rules Data Source Map v1
 *
 * AI-LANDMARK: RULES_DATA_SOURCE_MAP_V1
 *
 * A code-referenceable inventory of the rule DATASETS in this project: where
 * each one currently lives, what state it is in, whether it carries provenance
 * metadata, whether it can be treated as runtime data, whether it blocks a
 * complete character sheet (车卡), and what local source material is still
 * needed before it can be completed.
 *
 * Strict scope (this file is a MAP, not rule content):
 * - It contains NO rule values, tables, spells, occupations, lifepath options,
 *   stat blocks, or any official rules text.
 * - It does not change Creator / Sheet / Store / Adapter / Runtime / Campaign /
 *   ActorVault / import-export behavior, Source Settings behavior, or any
 *   WorkshopPackage rules wiring.
 * - It does not promote any dataset (e.g. DND spellIndex) into runtime, and it
 *   does not add publicCode to public rule catalog items.
 *
 * Source-priority rule (see docs/rules/*_RULE_COVERAGE.md):
 * Rule data is never AI-memory generated. Completion requires, in order:
 * user-provided local material / reference contract > in-repo structured data /
 * store / adapter / creator-sheet implementation > official public material
 * (cross-check only) > community material (assist only). AI memory is not a
 * source. DND already has a user reference contract (DND_OWNER_SOURCE_ENTRY_
 * MANIFEST.md + local CHM). COC and CP RED do NOT yet have an equivalent user
 * reference contract, so their missing content is marked pending-user-local-source.
 *
 * Status values reflect the Rules Data Readiness Audit v1 findings and the
 * docs/rules coverage matrices; counts/notes are descriptive only.
 */

export type RulesSystemId = 'dnd5e-2024' | 'coc7e' | 'cp-red';

export type RulesDatasetStatus =
  | 'runtime-ready'
  | 'partial'
  | 'display-only'
  | 'hardcoded'
  | 'missing'
  | 'pending-local-source'
  | 'needs-human-check';

export type RulesDatasetPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type RulesDatasetSourceStatus =
  | 'user-reference-contract'
  | 'in-repo-structured-data'
  | 'in-repo-hardcoded-data'
  | 'pending-user-local-source'
  | 'missing';

export interface RulesDataSourceMapEntry {
  systemId: RulesSystemId;
  datasetId: string;
  label: string;
  /** Where the dataset (or its current stand-in) lives today. Empty when missing. */
  currentLocation: string[];
  status: RulesDatasetStatus;
  priority: RulesDatasetPriority;
  /** True when the absence/incompleteness blocks a rules-complete character sheet. */
  blocksCompleteCharacterSheet: boolean;
  /** True when this dataset already carries RuleDataMetadata provenance. */
  hasRuleDataMetadata: boolean;
  sourceStatus: RulesDatasetSourceStatus;
  notes: string;
}

// ── DND 2024 ─────────────────────────────────────────────────────────────────
// Only system with a separated src/data rules layer + RuleDataMetadata +
// a user-provided reference contract (owner CHM manifest).

const DND_ENTRIES: RulesDataSourceMapEntry[] = [
  {
    systemId: 'dnd5e-2024',
    datasetId: 'species',
    label: 'Species / Race',
    currentLocation: ['src/data/races.ts'],
    status: 'partial',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: 'Runtime 9 vs local-CHM 10 (阿斯莫/Aasimar missing). Traits/size/speed/languages needs-human-check.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'backgrounds',
    label: 'Backgrounds',
    currentLocation: ['src/data/backgrounds.ts'],
    status: 'needs-human-check',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: 'Runtime 16/16 local-CHM standard backgrounds; skill/origin-feat/equipment/ability mappings needs-human-check.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'classes',
    label: 'Classes',
    currentLocation: ['src/data/classes.ts'],
    status: 'partial',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: 'Runtime 12/13 (奇械师/Artificer source-indexed, runtime-deferred). Entries carry source/trust metadata, values still need-human-verification.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'subclasses',
    label: 'Subclasses',
    currentLocation: ['src/data/classes.ts'],
    status: 'partial',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: 'Runtime 46 vs manifest 73 (raw pages include non-subclass support pages); de-dup/source classification pending.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'classProgression',
    label: 'Class Progression',
    currentLocation: ['src/data/dnd2024/classProgression.ts'],
    status: 'needs-human-check',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Runtime-active but value-level verification deferred; a few complete-ish samples plus placeholders.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'proficiencyBonus',
    label: 'Proficiency Bonus',
    currentLocation: ['src/lib/dnd2024/progression-utils.ts'],
    status: 'runtime-ready',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Derived via progression utilities; standard table logic, not source-content data.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'skills',
    label: 'Skills',
    currentLocation: ['src/store/characterStore.ts', 'src/pages/Creator.tsx'],
    status: 'runtime-ready',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Ability/skill/save model wired in Creator + store; mechanics, not source-content tables.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'savingThrows',
    label: 'Saving Throws',
    currentLocation: ['src/store/characterStore.ts', 'src/lib/dnd2024/progression-utils.ts'],
    status: 'runtime-ready',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Save modifiers derived and shown; no DC targeting layer yet (runtime/action concern, not data).',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'feats',
    label: 'Feats',
    currentLocation: ['src/data/feats.ts'],
    status: 'partial',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: 'Runtime ~8 origin + ~9 general are ai-assisted-unverified; manifest source only at category-file level. Row-level extraction pending.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'spellsRuntime',
    label: 'Spells (runtime SPELL_DATA)',
    currentLocation: ['src/data/spells.ts'],
    status: 'partial',
    priority: 'P1',
    blocksCompleteCharacterSheet: true,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: 'Runtime 20 of 507; ai-assisted-unverified. Caster sheets are incomplete until a verified subset is promoted from spellIndex (NOT this round).',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'spellIndex',
    label: 'Spell Source Index (display-only)',
    currentLocation: ['src/data/dnd2024/spellIndex.ts'],
    status: 'display-only',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: '507 entries (name/level/scope only), source-labeled display-only. Must NOT be wired into runtime until individually verified.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'equipment',
    label: 'Equipment (catalog)',
    currentLocation: ['src/data/dnd2024/equipment.ts', 'src/data/dnd2024/characterOptionsIndex.ts'],
    status: 'display-only',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: 'Runtime sample 14 items; index records 13 category files. Row-level table extraction pending.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'weapons',
    label: 'Weapons',
    currentLocation: ['src/data/dnd2024/equipment.ts'],
    status: 'display-only',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: '~6 sample weapons display-only; 武器.htm full table not extracted. No attack/mastery runtime.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'armor',
    label: 'Armor',
    currentLocation: ['src/data/dnd2024/equipment.ts'],
    status: 'display-only',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: '~4 sample armor/shield display-only; 护甲.htm full table not extracted. No AC automation.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'tools',
    label: 'Tools',
    currentLocation: ['src/data/dnd2024/equipment.ts', 'src/data/dnd2024/characterOptionsIndex.ts'],
    status: 'partial',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: true,
    sourceStatus: 'user-reference-contract',
    notes: '~1 sample tool; tool category files present in manifest; dedicated row parser pending.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'spellSlots',
    label: 'Spell Slots',
    currentLocation: ['src/store/characterStore.ts', 'src/lib/dnd2024/progression-utils.ts'],
    status: 'runtime-ready',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Slots tracked and consumed; level-up slot updates still partly hardcoded vs progression data.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'spellPreparation',
    label: 'Spell Preparation',
    currentLocation: ['src/lib/dnd2024/spell-preparation-model.ts'],
    status: 'runtime-ready',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Prepared/known model wired; class-specific limits are v1 approximations.',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'classResources',
    label: 'Class Resources',
    currentLocation: ['src/lib/dnd2024/resource-utils.ts', 'src/store/characterStore.ts'],
    status: 'partial',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Many resources at manual-control level; several class features still level 0-1 (e.g. Druid Wild Shape, Cleric/Paladin Channel Divinity).',
  },
  {
    systemId: 'dnd5e-2024',
    datasetId: 'levelUpFlow',
    label: 'Level-up Flow',
    currentLocation: ['src/store/characterStore.ts', 'src/lib/dnd2024/progression-utils.ts'],
    status: 'partial',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Level-up exists; some progression updates hardcoded rather than driven by progression data.',
  },
];

// ── COC 7e ───────────────────────────────────────────────────────────────────
// Rule content currently inlined in src/lib/coc-types.ts; no RuleDataMetadata.
// No user reference contract yet -> missing content is pending-user-local-source.

const COC_ENTRIES: RulesDataSourceMapEntry[] = [
  {
    systemId: 'coc7e',
    datasetId: 'attributes',
    label: 'Attributes',
    currentLocation: ['src/lib/coc-utils.ts', 'src/store/cocStore.ts', 'src/pages/CocCreator.tsx'],
    status: 'runtime-ready',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Characteristic generation wired in Creator; age adjustments not integrated.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'derivedAttributes',
    label: 'Derived Attributes (HP/MP/SAN/Luck/DB)',
    currentLocation: ['src/lib/coc-utils.ts'],
    status: 'runtime-ready',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Derived values computed via pure utilities and written at creation.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'skills',
    label: 'Skills (base list)',
    currentLocation: ['src/lib/coc-types.ts (COC_BASE_SKILLS)'],
    status: 'hardcoded',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Full base-skill list with base values, but inlined in a types file and missing RuleDataMetadata. Future: move to src/data/coc + add provenance.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'occupationTemplates',
    label: 'Occupation Templates',
    currentLocation: [],
    status: 'missing',
    priority: 'P0',
    blocksCompleteCharacterSheet: true,
    hasRuleDataMetadata: false,
    sourceStatus: 'pending-user-local-source',
    notes: 'Occupation is a free-text string only (coc-types.ts). No occupation table -> blocks occupation skill list + Credit Rating. Needs user COC reference contract.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'occupationSkillPoints',
    label: 'Occupation Skill Points (EDU x 4)',
    currentLocation: ['src/pages/CocCreator.tsx'],
    status: 'partial',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Budget/cap constraint wired (cap 90), but no occupation-specific allowed-skill list because occupation templates are missing.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'personalInterestSkillPoints',
    label: 'Personal Interest Skill Points (INT x 2)',
    currentLocation: ['src/pages/CocCreator.tsx'],
    status: 'partial',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Budget/cap constraint wired; no advanced validation beyond budget and cap.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'creditRating',
    label: 'Credit Rating',
    currentLocation: ['src/lib/coc-types.ts (COC_BASE_SKILLS entry only)'],
    status: 'missing',
    priority: 'P1',
    blocksCompleteCharacterSheet: true,
    hasRuleDataMetadata: false,
    sourceStatus: 'pending-user-local-source',
    notes: 'Credit Rating exists only as a base-0 skill row; no occupation-driven range/validation. Depends on occupation templates + user reference.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'weapons',
    label: 'Weapons',
    currentLocation: ['src/lib/coc-types.ts (CocWeapon type; per-character field only)'],
    status: 'missing',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'pending-user-local-source',
    notes: 'CocWeapon is a character field; no weapon catalog data. Manual entry only. Needs user reference.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'items',
    label: 'Items / Gear',
    currentLocation: ['src/store/cocStore.ts (free-text inventory)'],
    status: 'missing',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'pending-user-local-source',
    notes: 'No structured item catalog; inventory is free text. Needs user reference.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'investigatorBackgroundFields',
    label: 'Investigator Background Fields',
    currentLocation: ['src/store/cocStore.ts', 'src/pages/CocCreator.tsx'],
    status: 'runtime-ready',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Backstory fields editable; no structured clue/relationship model (not required for car-card).',
  },
  {
    systemId: 'coc7e',
    datasetId: 'sanityBasics',
    label: 'Sanity Basics',
    currentLocation: ['src/lib/coc-utils.ts', 'src/pages/cocGameplay/CocSanCheckPanel.tsx'],
    status: 'partial',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Basic SAN check + manual flags wired; insanity/madness tables are missing (separate dataset).',
  },
  {
    systemId: 'coc7e',
    datasetId: 'damageBasics',
    label: 'Damage / HP Basics',
    currentLocation: ['src/lib/coc-utils.ts', 'src/pages/CocGameplay.tsx'],
    status: 'partial',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'HP delta + major wound/dying pure helpers exist; full medical workflow deferred.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'growthImprovement',
    label: 'Growth / Improvement',
    currentLocation: ['src/pages/CocGameplay.tsx', 'src/store/cocStore.ts'],
    status: 'runtime-ready',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Growth marks + 1d10 improvement (cap 99) wired in gameplay.',
  },
  {
    systemId: 'coc7e',
    datasetId: 'madnessInsanity',
    label: 'Madness / Insanity',
    currentLocation: [],
    status: 'missing',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'pending-user-local-source',
    notes: 'Bout of madness / symptom tables / phobias / manias are level 0. Needs user reference contract.',
  },
];

// ── CP RED ───────────────────────────────────────────────────────────────────
// Richest structured catalogs of the three, but all inlined in
// src/lib/cp-types.ts with no RuleDataMetadata. No user reference contract yet.

const CP_ENTRIES: RulesDataSourceMapEntry[] = [
  {
    systemId: 'cp-red',
    datasetId: 'roles',
    label: 'Roles',
    currentLocation: ['src/lib/cp-types.ts (CP_ROLES)'],
    status: 'hardcoded',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: '10 roles structured but inlined in a types file with no provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'roleAbilities',
    label: 'Role Abilities',
    currentLocation: ['src/lib/cp-types.ts (CP_ROLE_ABILITIES)'],
    status: 'hardcoded',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'One ability per role present; display/state level, automation deferred. No provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'stats',
    label: 'Stats',
    currentLocation: ['src/lib/cp-types.ts (CP_STAT_ORDER)', 'src/store/cpStore.ts'],
    status: 'runtime-ready',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Core stats wired in Creator/Sheet/Gameplay.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'skills',
    label: 'Skills',
    currentLocation: ['src/lib/cp-types.ts (CP_SKILLS)'],
    status: 'hardcoded',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Skill list structured but inlined; creation-time skill-point allocation still needs audit (coverage level 1).',
  },
  {
    systemId: 'cp-red',
    datasetId: 'lifepath',
    label: 'Lifepath',
    currentLocation: ['src/lib/cp-types.ts (CpLifePath type + lifePath field)'],
    status: 'partial',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'pending-user-local-source',
    notes: 'Lifepath data STRUCTURE exists, but no lifepath option/random tables. Tables need user reference contract.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'equipment',
    label: 'Equipment (general)',
    currentLocation: ['src/lib/cp-types.ts', 'src/pages/CpMarket.tsx (MISC_ITEMS)'],
    status: 'hardcoded',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Catalogs inlined; market add-to-inventory wired. No provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'weapons',
    label: 'Weapons',
    currentLocation: ['src/lib/cp-types.ts (CP_WEAPON_LIST)'],
    status: 'hardcoded',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Weapon catalog present + buyable; no attack/damage automation. No provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'armor',
    label: 'Armor',
    currentLocation: ['src/lib/cp-types.ts (CP_ARMOR_LIST)'],
    status: 'hardcoded',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Armor catalog present + equippable; no SP/ablation runtime. No provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'cyberware',
    label: 'Cyberware',
    currentLocation: ['src/lib/cp-types.ts (CP_CYBERWARE_LIST)'],
    status: 'hardcoded',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Cyberware catalog present + install/uninstall (state-only); Humanity Loss not automated. No provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'fashion',
    label: 'Fashion / Style',
    currentLocation: ['src/lib/cp-types.ts (CP_CLOTHING_LIST)'],
    status: 'hardcoded',
    priority: 'P3',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Fashion catalog present + wearable. No provenance metadata.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'humanityEmp',
    label: 'Humanity / EMP',
    currentLocation: ['src/lib/cp2024/cp-utils.ts', 'src/store/cpStore.ts'],
    status: 'runtime-ready',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Humanity/EMP pure logic + runtime wired; cyberware-driven Humanity Loss automation deferred.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'hpDeathSave',
    label: 'HP / Death Save',
    currentLocation: ['src/lib/cp2024/cp-utils.ts', 'src/pages/CpGameplay.tsx'],
    status: 'runtime-ready',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'HP, seriously-wounded threshold, death save base wired; full mortally-wounded workflow deferred.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'market',
    label: 'Market',
    currentLocation: ['src/pages/CpMarket.tsx'],
    status: 'runtime-ready',
    priority: 'P1',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: 'Buy/equip/install flow across categories with stable instance ids; dynamic economy deferred. MISC_ITEMS inlined.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'criticalInjuries',
    label: 'Critical Injuries',
    currentLocation: ['src/lib/cp-types.ts (CP_CRIT_INJURIES_BODY/HEAD)', 'src/lib/cp2024/critical-injuries.ts'],
    status: 'hardcoded',
    priority: 'P2',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-hardcoded-data',
    notes: '2d6 body/head tables present; manual add/remove tracking. No provenance metadata; automation deferred.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'netrunningBasics',
    label: 'Netrunning Basics',
    currentLocation: [],
    status: 'missing',
    priority: 'P3',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'pending-user-local-source',
    notes: 'Fully deferred (level 0). Large subsystem; needs user reference contract before any data.',
  },
  {
    systemId: 'cp-red',
    datasetId: 'characterCreationFlow',
    label: 'Character Creation Flow',
    currentLocation: ['src/pages/CpCreator.tsx'],
    status: 'partial',
    priority: 'P0',
    blocksCompleteCharacterSheet: false,
    hasRuleDataMetadata: false,
    sourceStatus: 'in-repo-structured-data',
    notes: 'Creation works, but skill-point allocation is coverage level 1 and needs a dedicated audit.',
  },
];

export const RULES_DATA_SOURCE_MAP: RulesDataSourceMapEntry[] = [
  ...DND_ENTRIES,
  ...COC_ENTRIES,
  ...CP_ENTRIES,
];

/** All map entries for a single system. */
export function getRulesDataSourceMap(systemId: RulesSystemId): RulesDataSourceMapEntry[] {
  return RULES_DATA_SOURCE_MAP.filter((entry) => entry.systemId === systemId);
}

/** Datasets whose absence/incompleteness blocks a rules-complete character sheet. */
export function getCompleteSheetBlockers(systemId?: RulesSystemId): RulesDataSourceMapEntry[] {
  return RULES_DATA_SOURCE_MAP.filter(
    (entry) =>
      entry.blocksCompleteCharacterSheet &&
      (systemId === undefined || entry.systemId === systemId),
  );
}

/** Datasets that are waiting on user-provided local source material. */
export function getPendingUserLocalSource(systemId?: RulesSystemId): RulesDataSourceMapEntry[] {
  return RULES_DATA_SOURCE_MAP.filter(
    (entry) =>
      entry.sourceStatus === 'pending-user-local-source' &&
      (systemId === undefined || entry.systemId === systemId),
  );
}
