/**
 * DND Actor Vault Adapter
 *
 * Maps DND CharacterData to the platform ActorVaultSummary format.
 * This is the DND reference implementation of the Actor Vault Library adapter pattern.
 *
 * See: src/lib/platform/actorVault.ts for the type contracts.
 * See: src/components/platform/ActorVaultLibraryShell.tsx for the shell UI.
 *
 * Forbidden: no COC / CP RED / rule data / dice / runtime / import-export changes.
 */

import type { CharacterData } from '../../lib/dnd-types';
import type {
  ActorVaultSummary,
  ActorVaultStats,
  ActorVaultSortOption,
  ActorVaultColorTheme,
  ActorVaultShellStrings,
} from '../../lib/platform/actorVault';

// ─── Completion check ─────────────────────────────────────────────────────────

/**
 * A DND character is considered "complete" when the four core identity fields
 * are filled in. This is the same check previously inlined in DndWorkspaceShell.
 */
export function isDndCharComplete(char: CharacterData): boolean {
  return Boolean(
    (char as { name?: string }).name?.trim() &&
    char.jobClass &&
    char.race &&
    char.background,
  );
}

// ─── Summary mapper ───────────────────────────────────────────────────────────

export type DndVaultAdapterStrings = {
  unnamed: string;
  level: string;
  classLabel: string;
  species: string;
  background: string;
  source: string;
  sourcePlatform: string;
  creator: string;
  creatorPlaceholder: string;
  campaign: string;
  campaignNone: string;
};

export function buildDndActorSummary(
  char: CharacterData,
  index: number,
  activeId: string | null,
  s: DndVaultAdapterStrings,
): ActorVaultSummary {
  const displayName = (char as { name?: string }).name?.trim() || s.unnamed;
  const classValue = char.subclass
    ? `${char.jobClass || '-'} / ${char.subclass}`
    : (char.jobClass || '-');

  return {
    id: char.id,
    displayName,
    completionStatus: isDndCharComplete(char) ? 'complete' : 'incomplete',
    isActive: char.id === activeId,
    insertionOrder: index,
    sortName: displayName,
    sortNumeric: char.level || 1,
    detailFields: [
      { label: s.level,      value: String(char.level || 1) },
      { label: s.classLabel, value: classValue },
      { label: s.species,    value: char.race || '-' },
      { label: s.background, value: char.background || '-' },
    ],
    metaRows: [
      { label: s.source,   value: s.sourcePlatform },
      { label: s.creator,  value: s.creatorPlaceholder },
      { label: s.campaign, value: s.campaignNone },
    ],
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function buildDndVaultStats(summaries: ActorVaultSummary[]): ActorVaultStats {
  const complete = summaries.filter((s) => s.completionStatus === 'complete').length;
  return {
    total: summaries.length,
    complete,
    incomplete: summaries.length - complete,
    // No updatedAt timestamps in V1 — recentUpdatedLabel stays undefined
  };
}

// ─── Sort options ─────────────────────────────────────────────────────────────

export function buildDndSortOptions(labels: { default: string; name: string; level: string }): ActorVaultSortOption[] {
  return [
    { key: 'default', label: labels.default, kind: 'default' },
    { key: 'name',    label: labels.name,    kind: 'name' },
    { key: 'level',   label: labels.level,   kind: 'numeric' },
  ];
}

// ─── DND color theme ──────────────────────────────────────────────────────────
//
// Defined here (a .ts file adjacent to DndWorkspaceShell.tsx) so Tailwind scans
// these literal strings at build time. All classes are used verbatim in the shell.

export const DND_VAULT_COLOR_THEME: ActorVaultColorTheme = {
  border:       'border-[#58180d]',
  borderLight:  'border-[#58180d]/30',
  borderActive: 'border-[#58180d]/50',
  bgAccent:     'bg-[#58180d]',
  bgActive:     'bg-[#fff8e6]/90',
  bgCard:       'bg-white/55',
  bgInput:      'bg-white/80',
  text:         'text-[#58180d]',
  textMuted:    'text-[#58180d]/55',
  textInvert:   'text-[#fdf6e3]',
  textBody:     'text-[#2c1810]',
  bgHover:      'hover:bg-[#58180d]/10',
  // Computed variants — all defined as literals so Tailwind JIT scans them
  hoverBorder:  'hover:border-[#58180d]',
  focusBorder:  'focus:border-[#58180d]',
  hoverText:    'hover:text-[#58180d]',
};

// ─── DND shell strings builder ────────────────────────────────────────────────

/**
 * Build the ActorVaultShellStrings from a DND translator.
 * Call this inside DndWorkspaceShell where t() is available.
 */
export function buildDndVaultShellStrings(t: (key: string) => string): ActorVaultShellStrings {
  return {
    existingActors:   t('multiWorkspace.actorVault.existingActors'),
    addActor:         t('multiWorkspace.actorVault.addActor'),
    addActorNote:     t('multiWorkspace.actorVault.addActorNote'),
    totalCount:       t('multiWorkspace.actorVault.totalCount'),
    completeCount:    t('multiWorkspace.actorVault.completeCount'),
    incompleteCount:  t('multiWorkspace.actorVault.incompleteCount'),
    recentUpdate:     t('multiWorkspace.actorVault.recentUpdate'),
    vaultBreadcrumbLabel:    t('dndWorkspace.nav.characters'),
    existingActorsSubtitle:  t('dndWorkspace.characterLibrary.existingActorsSubtitle'),
    backToLibrary:    t('dndWorkspace.characterLibrary.backToVault'),
    libraryTitle:     t('dndWorkspace.characterLibrary.title'),
    searchPlaceholder: t('dndWorkspace.characterLibrary.searchPlaceholder'),
    noResults:        t('dndWorkspace.characterLibrary.noResults'),
    activeLabel:      t('multiWorkspace.actorVault.activeIndicator'),
    statusComplete:   t('dndWorkspace.characterLibrary.statusComplete'),
    statusIncomplete: t('dndWorkspace.characterLibrary.statusIncomplete'),
    filterAll:        t('dndWorkspace.characterLibrary.filter.all'),
    filterComplete:   t('dndWorkspace.characterLibrary.filter.complete'),
    filterIncomplete: t('dndWorkspace.characterLibrary.filter.incomplete'),
    enterActorLabel:  t('dndWorkspace.actions.viewSheet'),
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
    importPreview:           t('multiWorkspace.actorVault.importPreview'),
    importPreviewNote:       t('multiWorkspace.actorVault.importPreviewNote'),
    importPreviewTitle:      t('multiWorkspace.actorVault.importPreviewTitle'),
    importPreviewFile:       t('multiWorkspace.actorVault.importPreviewFile'),
    importPreviewValid:      t('multiWorkspace.actorVault.importPreviewValid'),
    importPreviewInvalid:    t('multiWorkspace.actorVault.importPreviewInvalid'),
    importPreviewSummary:    t('multiWorkspace.actorVault.importPreviewSummary'),
    importPreviewSystems:    t('multiWorkspace.actorVault.importPreviewSystems'),
    importPreviewLifecycle:  t('multiWorkspace.actorVault.importPreviewLifecycle'),
    importPreviewConflicts:  t('multiWorkspace.actorVault.importPreviewConflicts'),
    importPreviewUnsupported: t('multiWorkspace.actorVault.importPreviewUnsupported'),
    importPreviewWarnings:   t('multiWorkspace.actorVault.importPreviewWarnings'),
    importPreviewNoWrite:    t('multiWorkspace.actorVault.importPreviewNoWrite'),
    importPreviewChooseFile: t('multiWorkspace.actorVault.importPreviewChooseFile'),
    importPreviewClear:      t('multiWorkspace.actorVault.importPreviewClear'),
  };
}

export function buildDndVaultAdapterStrings(t: (key: string) => string): DndVaultAdapterStrings {
  return {
    unnamed:           t('dndWorkspace.characters.unnamed'),
    level:             t('dndWorkspace.characters.level'),
    classLabel:        t('dndWorkspace.characters.class'),
    species:           t('dndWorkspace.characters.species'),
    background:        t('dndWorkspace.characters.background'),
    source:            t('multiWorkspace.actorVault.source'),
    sourcePlatform:    t('multiWorkspace.actorVault.sourcePlatform'),
    creator:           t('multiWorkspace.actorVault.creator'),
    creatorPlaceholder: t('multiWorkspace.actorVault.creatorPlaceholder'),
    campaign:          t('multiWorkspace.actorVault.campaign'),
    campaignNone:      t('multiWorkspace.actorVault.campaignNone'),
  };
}
