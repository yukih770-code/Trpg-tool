/**
 * COC Actor Vault Adapter
 *
 * AI-LANDMARK: COC_ACTOR_VAULT_LIBRARY_ADOPTION_V1
 *
 * Maps CocCharacter to the platform ActorVaultSummary format.
 * COC reference implementation of the Actor Vault Library adapter pattern.
 *
 * COC now uses the same per-system multi-actor Actor Vault pattern as DND.
 * The adapter maps the concrete investigator for each ActorVaultRecord.
 *
 * See: src/lib/platform/actorVault.ts for type contracts.
 * See: src/components/platform/ActorVaultLibraryShell.tsx for the shell UI.
 * See: src/pages/dndWorkspace/dndActorVaultAdapter.ts for DND reference impl.
 *
 * Forbidden: no DND / CP RED / COC rule logic / COC dice / COC skill growth /
 * COC Pushed Roll / Campaign / Module / Session / map / routing change.
 */

import type { CocCharacter } from '../../lib/coc-types';
import type {
  ActorVaultSummary,
  ActorVaultStats,
  ActorVaultSortOption,
  ActorVaultColorTheme,
  ActorVaultShellStrings,
} from '../../lib/platform/actorVault';

// ─── Completion check ─────────────────────────────────────────────────────────

/**
 * A COC investigator is "complete" when name + occupation + at least one
 * non-zero characteristic are present. This is the V1 lightweight check.
 */
export function isCocCharComplete(char: CocCharacter): boolean {
  const hasName = Boolean(char.name?.trim());
  const hasOccupation = Boolean(char.occupation?.trim());
  const hasCharacteristics = Object.values(char.characteristics ?? {}).some(
    (v) => typeof v === 'number' && v > 0,
  );
  return hasName && hasOccupation && hasCharacteristics;
}

// ─── Adapter string types ─────────────────────────────────────────────────────

export type CocVaultAdapterStrings = {
  unnamed: string;
  occupation: string;
  age: string;
  residence: string;
  source: string;
  sourcePlatform: string;
  creator: string;
  creatorPlaceholder: string;
  campaign: string;
  campaignNone: string;
};

export function buildCocVaultAdapterStrings(
  t: (key: string) => string,
): CocVaultAdapterStrings {
  return {
    unnamed:            t('multiWorkspace.coc.entry.unnamed'),
    occupation:         t('multiWorkspace.coc.entry.occupation'),
    age:                t('multiWorkspace.coc.entry.age'),
    residence:          t('multiWorkspace.coc.entry.residence'),
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
 * Maps one COC investigator into the platform ActorVault card summary.
 */
export function buildCocActorSummary(
  char: CocCharacter,
  index: number,
  activeId: string | null,
  s: CocVaultAdapterStrings,
): ActorVaultSummary {
  const id = char.id.trim();
  const displayName = char.name?.trim() || s.unnamed;

  return {
    id,
    displayName,
    completionStatus: isCocCharComplete(char) ? 'complete' : 'incomplete',
    isActive: id === activeId,
    insertionOrder: index,
    sortName: displayName.toLowerCase(),
    sortNumeric: 0, // COC has no level
    detailFields: [
      { label: s.occupation, value: char.occupation?.trim() || '-' },
      { label: s.age,        value: char.age ? String(char.age) : '-' },
      { label: s.residence,  value: char.residence?.trim() || '-' },
    ],
    metaRows: [
      { label: s.source,   value: s.sourcePlatform },
      { label: s.creator,  value: s.creatorPlaceholder },
      { label: s.campaign, value: s.campaignNone },
    ],
  };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function buildCocVaultStats(summaries: ActorVaultSummary[]): ActorVaultStats {
  const complete = summaries.filter((s) => s.completionStatus === 'complete').length;
  return {
    total: summaries.length,
    complete,
    incomplete: summaries.length - complete,
    // No updatedAt in V1 — recentUpdatedLabel stays undefined
  };
}

// ─── Sort options ─────────────────────────────────────────────────────────────

export function buildCocSortOptions(
  labels: { default: string; name: string },
): ActorVaultSortOption[] {
  return [
    { key: 'default', label: labels.default, kind: 'default' },
    { key: 'name',    label: labels.name,    kind: 'name' },
  ];
}

// ─── COC color theme ──────────────────────────────────────────────────────────
//
// Defined here (a .ts file adjacent to CocWorkspaceShell.tsx) so Tailwind JIT
// scans these literal class strings at build time.
// Color reference: teal palette from CocWorkspaceShell.tsx.

export const COC_VAULT_COLOR_THEME: ActorVaultColorTheme = {
  border:       'border-[#2f7f68]',
  borderLight:  'border-[#2f7f68]/30',
  borderActive: 'border-[#2f7f68]/50',
  bgAccent:     'bg-[#2f7f68]',
  bgActive:     'bg-[#2f7f68]/15',
  bgCard:       'bg-[#101816]/85',
  bgInput:      'bg-[#0d1211]/90',
  text:         'text-[#5aa58f]',
  textMuted:    'text-[#8fb7aa]',
  textInvert:   'text-[#06100d]',
  textBody:     'text-[#d4d4d8]',
  bgHover:      'hover:bg-[#2f7f68]/10',
  // Computed variants — all defined as literals so Tailwind JIT scans them
  hoverBorder:  'hover:border-[#2f7f68]',
  focusBorder:  'focus:border-[#2f7f68]',
  hoverText:    'hover:text-[#5aa58f]',
};

// ─── COC shell strings builder ────────────────────────────────────────────────

export function buildCocVaultShellStrings(t: (key: string) => string): ActorVaultShellStrings {
  return {
    existingActors:         t('multiWorkspace.actorVault.existingActors'),
    addActor:               t('multiWorkspace.actorVault.addActor'),
    addActorNote:           t('multiWorkspace.actorVault.addActorNote'),
    totalCount:             t('multiWorkspace.actorVault.totalCount'),
    completeCount:          t('multiWorkspace.actorVault.completeCount'),
    incompleteCount:        t('multiWorkspace.actorVault.incompleteCount'),
    recentUpdate:           t('multiWorkspace.actorVault.recentUpdate'),
    vaultBreadcrumbLabel:   t('navigation.actorVault'),
    existingActorsSubtitle: t('cocWorkspace.characterLibrary.existingActorsSubtitle'),
    backToLibrary:          t('cocWorkspace.characterLibrary.backToVault'),
    libraryTitle:           t('cocWorkspace.characterLibrary.title'),
    searchPlaceholder:      t('cocWorkspace.characterLibrary.searchPlaceholder'),
    noResults:              t('cocWorkspace.characterLibrary.noResults'),
    activeLabel:            t('multiWorkspace.actorVault.activeIndicator'),
    statusComplete:         t('cocWorkspace.characterLibrary.statusComplete'),
    statusIncomplete:       t('cocWorkspace.characterLibrary.statusIncomplete'),
    filterAll:              t('cocWorkspace.characterLibrary.filter.all'),
    filterComplete:         t('cocWorkspace.characterLibrary.filter.complete'),
    filterIncomplete:       t('cocWorkspace.characterLibrary.filter.incomplete'),
    enterActorLabel:        t('multiWorkspace.actions.viewInvestigatorSheet'),
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
    managementActions:       t('multiWorkspace.actorVault.managementActions'),
    moreActionsCollapsed:    t('multiWorkspace.actorVault.moreActionsCollapsed'),
    moreActionsExpanded:     t('multiWorkspace.actorVault.moreActionsExpanded'),
    moreActionsExpandLabel:  t('multiWorkspace.actorVault.moreActionsExpandLabel'),
    moreActionsCollapseLabel: t('multiWorkspace.actorVault.moreActionsCollapseLabel'),
    trashHoldingAreaNote:    t('multiWorkspace.actorVault.trashHoldingAreaNote'),
    archivedActorNote:       t('multiWorkspace.actorVault.archivedActorNote'),
    trashedActorNote:        t('multiWorkspace.actorVault.trashedActorNote'),
    exportSnapshot:          t('multiWorkspace.actorVault.exportSnapshot'),
    exportSnapshotNote:      t('multiWorkspace.actorVault.exportSnapshotNote'),
    dataActions:             t('multiWorkspace.actorVault.dataActions'),
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
    safeAppendImport:        t('multiWorkspace.actorVault.safeAppendImport'),
    safeAppendImportNote:    t('multiWorkspace.actorVault.safeAppendImportNote'),
    noSafeAppendActors:      t('multiWorkspace.actorVault.noSafeAppendActors'),
    importResultTitle:       t('multiWorkspace.actorVault.importResultTitle'),
    importResultImported:    t('multiWorkspace.actorVault.importResultImported'),
    importResultSkippedConflicts: t('multiWorkspace.actorVault.importResultSkippedConflicts'),
    importResultSkippedUnsupported: t('multiWorkspace.actorVault.importResultSkippedUnsupported'),
    importResultSkippedInvalid: t('multiWorkspace.actorVault.importResultSkippedInvalid'),
    importResultImportedSystems: t('multiWorkspace.actorVault.importResultImportedSystems'),
    importResultImportedLifecycle: t('multiWorkspace.actorVault.importResultImportedLifecycle'),
  };
}
