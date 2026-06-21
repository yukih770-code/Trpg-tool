/**
 * CP RED Actor Vault Adapter
 *
 * AI-LANDMARK: CPRED_ACTOR_VAULT_LIBRARY_ADOPTION_V1
 *
 * Maps CpCharacter to the platform ActorVaultSummary format.
 * CP RED implementation of the Actor Vault Library adapter pattern.
 *
 * CP RED now uses the same per-system multi-actor Actor Vault pattern as DND.
 * The adapter maps the concrete edgerunner for each ActorVaultRecord.
 *
 * See: src/lib/platform/actorVault.ts for type contracts.
 * See: src/components/platform/ActorVaultLibraryShell.tsx for the shell UI.
 * See: src/pages/cocWorkspace/cocActorVaultAdapter.ts for COC reference impl.
 *
 * Forbidden: no CP RED store / save format / rule logic / dice algorithm /
 * equipment / 黑市 / netrunning / Campaign / Module / Session / routing change.
 * No DND / COC change.
 */

import type { CpCharacter } from '../../lib/cp-types';
import type {
  ActorVaultSummary,
  ActorVaultStats,
  ActorVaultSortOption,
  ActorVaultColorTheme,
  ActorVaultShellStrings,
} from '../../lib/platform/actorVault';

// ─── Completion check ─────────────────────────────────────────────────────────

/**
 * A CP RED edgerunner is "complete" when name + role are both filled in.
 * V1 lightweight check — mirrors the minimal readiness bar for the vault card.
 */
export function isCpCharComplete(char: CpCharacter): boolean {
  return Boolean(char.name?.trim()) && Boolean(char.role?.trim());
}

// ─── Adapter string types ─────────────────────────────────────────────────────

export type CpVaultAdapterStrings = {
  unnamed: string;
  handle: string;
  role: string;
  roleLevel: string;
  hp: string;
  humanity: string;
  source: string;
  sourcePlatform: string;
  creator: string;
  creatorPlaceholder: string;
  campaign: string;
  campaignNone: string;
};

export function buildCpVaultAdapterStrings(
  t: (key: string) => string,
): CpVaultAdapterStrings {
  return {
    unnamed:            t('multiWorkspace.cp.entry.unnamed'),
    handle:             t('multiWorkspace.cp.entry.handle'),
    role:               t('multiWorkspace.cp.entry.role'),
    roleLevel:          t('multiWorkspace.cp.entry.roleLevel'),
    hp:                 t('cpWorkspace.sheet.hp'),
    humanity:           t('cpWorkspace.sheet.humanity'),
    source:             t('multiWorkspace.actorVault.source'),
    sourcePlatform:     t('multiWorkspace.actorVault.sourcePlatform'),
    creator:            t('multiWorkspace.actorVault.creator'),
    creatorPlaceholder: t('multiWorkspace.actorVault.creatorPlaceholder'),
    campaign:           t('multiWorkspace.actorVault.campaign'),
    campaignNone:       t('multiWorkspace.actorVault.campaignNone'),
  };
}

// ─── Summary mapper ───────────────────────────────────────────────────────────

/**
 * displayName prefers the street handle (lifePath.handle) then the real name.
 */
export function buildCpActorSummary(
  char: CpCharacter,
  index: number,
  activeId: string | null,
  s: CpVaultAdapterStrings,
): ActorVaultSummary {
  const id = char.id.trim();
  const handle = char.lifePath?.handle?.trim();
  const realName = char.name?.trim();
  const displayName = handle || realName || s.unnamed;

  return {
    id,
    displayName,
    completionStatus: isCpCharComplete(char) ? 'complete' : 'incomplete',
    isActive: id === activeId,
    insertionOrder: index,
    sortName: displayName.toLowerCase(),
    sortNumeric: char.roleLevel ?? 0,
    detailFields: [
      { label: s.role,      value: char.role?.trim() || '-' },
      { label: s.roleLevel, value: char.roleLevel != null ? String(char.roleLevel) : '-' },
      { label: s.hp,        value: char.hp ? `${char.hp.current}/${char.hp.max}` : '-' },
      { label: s.humanity,  value: char.humanity ? `${char.humanity.current}/${char.humanity.max}` : '-' },
    ],
    metaRows: [
      { label: s.source,   value: s.sourcePlatform },
      { label: s.creator,  value: s.creatorPlaceholder },
      { label: s.campaign, value: s.campaignNone },
    ],
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function buildCpVaultStats(summaries: ActorVaultSummary[]): ActorVaultStats {
  const complete = summaries.filter((s) => s.completionStatus === 'complete').length;
  return {
    total: summaries.length,
    complete,
    incomplete: summaries.length - complete,
    // No updatedAt in V1 — recentUpdatedLabel stays undefined
  };
}

// ─── Sort options ─────────────────────────────────────────────────────────────

export function buildCpSortOptions(
  labels: { default: string; name: string; roleLevel: string },
): ActorVaultSortOption[] {
  return [
    { key: 'default',   label: labels.default,   kind: 'default' },
    { key: 'name',      label: labels.name,      kind: 'name' },
    { key: 'roleLevel', label: labels.roleLevel, kind: 'numeric' },
  ];
}

// ─── CP RED color theme ───────────────────────────────────────────────────────
//
// Defined here (a .ts file adjacent to CpWorkspaceShell.tsx) so Tailwind JIT
// scans these literal class strings at build time.
// Color reference: gold palette from CpWorkspaceShell.tsx `gold` object.
//
// ALL hover/focus variants defined as string literals — never computed —
// so Tailwind JIT picks them up. See PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1.

export const CP_VAULT_COLOR_THEME: ActorVaultColorTheme = {
  border:       'border-[#d8b954]',
  borderLight:  'border-[#d8b954]/30',
  borderActive: 'border-[#d8b954]/50',
  bgAccent:     'bg-[#f5c518]',
  bgActive:     'bg-[#f5c518]/15',
  bgCard:       'bg-[#0d0d0d]/85',
  bgInput:      'bg-[#0a0a0a]/90',
  text:         'text-[#f5c518]',
  textMuted:    'text-[#d8b954]',
  textInvert:   'text-[#0d0d0d]',
  textBody:     'text-[#d4d4d8]',
  bgHover:      'hover:bg-[#f5c518]/10',
  // Computed variants — all defined as literals so Tailwind JIT scans them
  hoverBorder:  'hover:border-[#f5c518]',
  focusBorder:  'focus:border-[#f5c518]',
  hoverText:    'hover:text-[#f5c518]',
};

// ─── CP RED shell strings builder ─────────────────────────────────────────────

export function buildCpVaultShellStrings(t: (key: string) => string): ActorVaultShellStrings {
  return {
    existingActors:         t('multiWorkspace.actorVault.existingActors'),
    addActor:               t('multiWorkspace.actorVault.addActor'),
    addActorNote:           t('multiWorkspace.actorVault.addActorNote'),
    totalCount:             t('multiWorkspace.actorVault.totalCount'),
    completeCount:          t('multiWorkspace.actorVault.completeCount'),
    incompleteCount:        t('multiWorkspace.actorVault.incompleteCount'),
    recentUpdate:           t('multiWorkspace.actorVault.recentUpdate'),
    vaultBreadcrumbLabel:   t('navigation.actorVault'),
    existingActorsSubtitle: t('cpWorkspace.characterLibrary.existingActorsSubtitle'),
    backToLibrary:          t('cpWorkspace.characterLibrary.backToVault'),
    libraryTitle:           t('cpWorkspace.characterLibrary.title'),
    searchPlaceholder:      t('cpWorkspace.characterLibrary.searchPlaceholder'),
    noResults:              t('cpWorkspace.characterLibrary.noResults'),
    activeLabel:            t('multiWorkspace.actorVault.activeIndicator'),
    statusComplete:         t('cpWorkspace.characterLibrary.statusComplete'),
    statusIncomplete:       t('cpWorkspace.characterLibrary.statusIncomplete'),
    filterAll:              t('cpWorkspace.characterLibrary.filter.all'),
    filterComplete:         t('cpWorkspace.characterLibrary.filter.complete'),
    filterIncomplete:       t('cpWorkspace.characterLibrary.filter.incomplete'),
    enterActorLabel:        t('multiWorkspace.actions.viewCharacterSheet'),
    campaignSelectionPrefix: t('campaignLibrary.returnContext.selectingActorPrefix'),
    campaignSelectionSuffix: t('campaignLibrary.returnContext.selectingActorSuffix'),
    campaignSelectionNote:   t('campaignLibrary.returnContext.selectingActorNote'),
    returnToCampaignEntry:   t('campaignLibrary.returnContext.returnButton'),
    selectForCampaignLabel:  t('campaignLibrary.returnContext.selectActorButton'),
    selectCampaignLabel:     t('multiWorkspace.actorVault.selectCampaign'),
    lifecycleActive:         t('multiWorkspace.actorVault.lifecycleActive'),
    lifecycleArchived:       t('multiWorkspace.actorVault.lifecycleArchived'),
    lifecycleTrashed:        t('multiWorkspace.actorVault.lifecycleTrashed'),
    lifecycleStatus:         t('multiWorkspace.actorVault.lifecycleStatus'),
    lifecycleManagementSummary: t('multiWorkspace.actorVault.lifecycleManagementSummary'),
    lifecycleFilteredCount:  t('multiWorkspace.actorVault.lifecycleFilteredCount'),
    archivedStatusLabel:     t('multiWorkspace.actorVault.archivedStatusLabel'),
    trashedStatusLabel:      t('multiWorkspace.actorVault.trashedStatusLabel'),
    archiveActor:            t('multiWorkspace.actorVault.archiveActor'),
    restoreActor:            t('multiWorkspace.actorVault.restoreActor'),
    moveToTrash:             t('multiWorkspace.actorVault.moveToTrash'),
    archivedActorNote:       t('multiWorkspace.actorVault.archivedActorNote'),
    trashedActorNote:        t('multiWorkspace.actorVault.trashedActorNote'),
    exportSnapshot:          t('multiWorkspace.actorVault.exportSnapshot'),
    exportSnapshotNote:      t('multiWorkspace.actorVault.exportSnapshotNote'),
  };
}
