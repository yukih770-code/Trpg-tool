/**
 * ActorVaultLibraryShell
 *
 * AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
 *
 * Platform-level reusable shell for the Actor Vault Library.
 * Renders three views:
 *   'home'     — vault homepage with two entry cards (existing actors stats + add actor)
 *   'existing' — searchable / filterable / sortable actor card list
 *
 * Does NOT know about any game system's rule fields.
 * Consumes only: ActorVaultSummary[], ActorVaultStats, ActorVaultSortOption[],
 *                onEnterActor(), onRequestAdd(), strings, colorTheme.
 *
 * Used by: DndWorkspaceShell (reference implementation).
 * Future: CocWorkspaceShell, CpWorkspaceShell via system-specific adapters.
 */

import { useEffect, useState } from 'react';
import type {
  ActorVaultPurpose,
  ActorVaultSummary,
  ActorVaultStats,
  ActorVaultSortOption,
  ActorVaultColorTheme,
  ActorVaultShellStrings,
  ActorCreationCompletionContext,
} from '../../lib/platform/actorVault';
import type { CampaignActorSelectReturnContext, CampaignSuggestedActor } from '../../lib/platform/campaignFlow';
import { downloadActorVaultExportSnapshot } from '../../lib/platform/actorVaultExportSnapshot';
import {
  parseActorVaultImportPreview,
  type ActorVaultImportPreview,
} from '../../lib/platform/actorVaultImportPreview';
import {
  applyActorVaultSafeAppendImport,
  buildActorVaultSafeAppendPlan,
  type ActorVaultSafeAppendResult,
} from '../../lib/platform/actorVaultImportSafeAppend';
import type { ActorVaultLifecycleStatus } from '../../lib/platform/actorVaultLifecycleStore';
import { useActorVaultLifecycleStore } from '../../lib/platform/actorVaultLifecycleStore';
import { ContextBar } from './ContextBar';

// ─── Internal types ────────────────────────────────────────────────────────────

type LibraryMode = 'home' | 'existing';
type FilterValue = 'all' | 'complete' | 'incomplete';
type LifecycleFilterValue = 'active' | 'archived' | 'trashed';

// ─── Props ─────────────────────────────────────────────────────────────────────

export type ActorVaultLibraryShellProps = {
  /** Pre-mapped summaries. Caller is responsible for live-actor substitution (active char compat). */
  summaries: ActorVaultSummary[];
  /** Stats shown on the vault homepage existing-actors card. */
  stats: ActorVaultStats;
  /** Sort options available in the library. Must match getAdapter().getSortOptions(). */
  sortOptions: ActorVaultSortOption[];
  /** Key of the sort option that is active on first render. */
  defaultSortKey: string;
  /** Called when the user clicks "Enter" on an actor card. Receives actor id. */
  onEnterActor: (id: string) => void;
  /**
   * Called when the user clicks the "Add Actor" card on the home view.
   * The system workspace shell routes this to its creation flow.
   */
  onRequestAdd: () => void;
  purpose?: ActorVaultPurpose;
  onSelectActorForCampaign?: (
    actor: CampaignSuggestedActor,
    context: CampaignActorSelectReturnContext,
  ) => void;
  onRequestSelectCampaignForActor?: (actor: CampaignSuggestedActor) => void;
  onReturnToCampaignEntry?: (context: CampaignActorSelectReturnContext) => void;
  /** All i18n strings consumed by the shell. Pass via t() from the workspace shell. */
  strings: ActorVaultShellStrings;
  /** Tailwind class strings for theming. Define as string literals in a .tsx file. */
  colorTheme: ActorVaultColorTheme;
  /** Panel wrapper className (e.g. the system's rounded-border card style). */
  panelClassName: string;
  contextBarClassName?: string;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function ActorVaultLibraryShell({
  summaries,
  stats,
  sortOptions,
  defaultSortKey,
  onEnterActor,
  onRequestAdd,
  purpose = { kind: 'manage' },
  onSelectActorForCampaign,
  onRequestSelectCampaignForActor,
  onReturnToCampaignEntry,
  strings,
  colorTheme: t,
  panelClassName,
  contextBarClassName,
}: ActorVaultLibraryShellProps) {
  const [mode, setMode] = useState<LibraryMode>('home');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilterValue>('active');
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [importPreview, setImportPreview] = useState<ActorVaultImportPreview | null>(null);
  const [importPreviewFileName, setImportPreviewFileName] = useState('');
  const [importPreviewText, setImportPreviewText] = useState('');
  const [importResult, setImportResult] = useState<ActorVaultSafeAppendResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedMoreActorKey, setExpandedMoreActorKey] = useState<string | null>(null);
  const lifecycleMetas = useActorVaultLifecycleStore((state) => state.metas);
  const archiveActor = useActorVaultLifecycleStore((state) => state.archiveActor);
  const trashActor = useActorVaultLifecycleStore((state) => state.trashActor);
  const restoreActor = useActorVaultLifecycleStore((state) => state.restoreActor);

  const campaignActorSelectContext =
    purpose.kind === 'selectForCampaign' ? purpose.context : null;
  const campaignActorAddContext = purpose.kind === 'addForCampaign' ? purpose.context : null;
  const isManagePurpose = purpose.kind === 'manage';

  useEffect(() => {
    setMode('home');
    setLifecycleFilter('active');
    setExpandedMoreActorKey(null);
  }, [
    purpose.kind,
    campaignActorSelectContext?.campaignId,
    campaignActorAddContext?.campaignId,
  ]);

  // ── Derived: filtered + sorted summaries ──────────────────────────────────

  const summariesWithLifecycle = summaries.map((summary) => ({
    ...summary,
    lifecycleStatus: getSummaryLifecycleStatus(summary, lifecycleMetas),
  }));

  const lifecycleCounts = summariesWithLifecycle.reduce(
    (counts, summary) => {
      counts[summary.lifecycleStatus] += 1;
      return counts;
    },
    { active: 0, archived: 0, trashed: 0 } satisfies Record<LifecycleFilterValue, number>,
  );
  const activeCompleteCount = summariesWithLifecycle.filter(
    (summary) =>
      summary.lifecycleStatus === 'active' &&
      summary.completionStatus === 'complete',
  ).length;
  const activeIncompleteCount = lifecycleCounts.active - activeCompleteCount;

  const effectiveLifecycleFilter: LifecycleFilterValue = isManagePurpose
    ? lifecycleFilter
    : 'active';

  const lifecycleFiltered = summariesWithLifecycle.filter(
    (s) => s.lifecycleStatus === effectiveLifecycleFilter,
  );

  const filtered = lifecycleFiltered.filter((s) => {
    if (filter === 'complete' && s.completionStatus !== 'complete') return false;
    if (filter === 'incomplete' && s.completionStatus !== 'incomplete') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const haystack = [
        s.displayName,
        ...s.detailFields.map((f) => f.value),
        ...s.metaRows.map((r) => r.value),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const activeSortOption = sortOptions.find((o) => o.key === sortKey) ?? sortOptions[0];

  const sorted = [...filtered].sort((a, b) => {
    switch (activeSortOption?.kind) {
      case 'name':
        return a.sortName.localeCompare(b.sortName, undefined, { sensitivity: 'base' });
      case 'numeric':
        return b.sortNumeric - a.sortNumeric;
      default: // 'default' or unknown → insertion order
        return a.insertionOrder - b.insertionOrder;
    }
  });

  const contextLabel = campaignActorSelectContext
    ? `${strings.campaignSelectionPrefix}「${campaignActorSelectContext.campaignTitle}${
        campaignActorSelectContext.campaignRoomCode
          ? ` #${campaignActorSelectContext.campaignRoomCode}`
          : ''
      }」${strings.campaignSelectionSuffix}`
    : campaignActorAddContext
      ? `${strings.campaignSelectionPrefix}「${campaignActorAddContext.campaignTitle}${
          campaignActorAddContext.campaignRoomCode
            ? ` #${campaignActorAddContext.campaignRoomCode}`
            : ''
        }」${strings.campaignSelectionSuffix}`
      : '';

  const contextBar = campaignActorSelectContext ? (
    <ContextBar
      label={contextLabel}
      status={strings.selectForCampaignLabel}
      backLabel={campaignActorSelectContext.returnLabel}
      onBack={
        onReturnToCampaignEntry
          ? () => onReturnToCampaignEntry(campaignActorSelectContext)
          : undefined
      }
      className={contextBarClassName}
    />
  ) : null;

  const handleImportPreviewFile = async (file: File | undefined) => {
    if (!file) return;
    setImportPreviewFileName(file.name);
    try {
      const fileText = await file.text();
      setImportPreviewText(fileText);
      setImportPreview(parseActorVaultImportPreview(fileText));
      setImportResult(null);
    } catch {
      setImportPreviewText('');
      setImportPreview(parseActorVaultImportPreview(''));
      setImportResult(null);
    }
  };

  const handleSafeAppendImport = () => {
    if (!importPreview || isImporting) return;
    setIsImporting(true);
    try {
      const result = applyActorVaultSafeAppendImport(
        buildActorVaultSafeAppendPlan(importPreview),
      );
      setImportResult(result);
      if (importPreviewText) {
        setImportPreview(parseActorVaultImportPreview(importPreviewText));
      }
    } finally {
      setIsImporting(false);
    }
  };

  // ── Home view ─────────────────────────────────────────────────────────────

  if (mode === 'home') {
    return (
      <div className="flex flex-col gap-6">
        {contextBar}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* ── Existing actors card ── */}
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`min-h-48 border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md ${t.borderLight} ${t.bgCard} ${t.hoverBorder}`}
          >
            <h2 className={`text-lg font-bold ${t.text}`}>{strings.existingActors}</h2>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.totalCount}</div>
                <div className={`mt-1 text-3xl font-bold ${t.textBody}`}>{lifecycleCounts.active}</div>
              </div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.completeCount}</div>
                <div className={`mt-1 text-3xl font-bold ${t.textBody}`}>{activeCompleteCount}</div>
              </div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.incompleteCount}</div>
                <div className={`mt-1 text-3xl font-bold ${t.textBody}`}>{activeIncompleteCount}</div>
              </div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.recentUpdate}</div>
                <div className={`mt-1 text-sm font-bold ${t.textBody} opacity-55`}>
                  {stats.recentUpdatedLabel ?? '—'}
                </div>
              </div>
            </div>
          </button>

          {/* ── Add actor card ── */}
          <button
            type="button"
            onClick={onRequestAdd}
            className={`min-h-48 border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md ${t.borderLight} ${t.bgCard} ${t.hoverBorder}`}
          >
            <h2 className={`text-lg font-bold ${t.text}`}>{strings.addActor}</h2>
            <p className={`mt-3 text-sm leading-relaxed ${t.text} opacity-65`}>{strings.addActorNote}</p>
          </button>

        </div>
      </div>
    );
  }

  // ── Existing library view ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {contextBar}

      {/* ── Page header (no back button — top nav handles history/up/breadcrumb) ── */}
      <div>
        {/* Breadcrumb trail: vault level / current subpage — informational only */}
        <p className={`text-xs ${t.textMuted} opacity-65`}>
          {strings.vaultBreadcrumbLabel}
          <span className="mx-1.5 opacity-40">/</span>
          {strings.libraryTitle}
        </p>
        <h2 className={`mt-1 text-xl font-bold ${t.text}`}>{strings.libraryTitle}</h2>
        <p className={`mt-0.5 text-xs ${t.textMuted} opacity-60`}>{strings.existingActorsSubtitle}</p>
      </div>

      {/* ── Search / Sort / Filter bar ── */}
      <div className={panelClassName}>
        {isManagePurpose && (
          <div className={`mb-3 border-b pb-3 text-xs ${t.borderLight} ${t.textMuted}`}>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <div className="font-bold uppercase tracking-wider">{strings.lifecycleManagementSummary}</div>
                <div className={`mt-1 ${t.textBody}`}>{strings.lifecycleFilteredCount}: {filtered.length}</div>
              </div>
              <div>
                <div className="font-bold uppercase tracking-wider">{strings.lifecycleActive}</div>
                <div className={`mt-1 text-lg font-bold ${t.textBody}`}>{lifecycleCounts.active}</div>
              </div>
              <div>
                <div className="font-bold uppercase tracking-wider">{strings.lifecycleArchived}</div>
                <div className={`mt-1 text-lg font-bold ${t.textBody}`}>{lifecycleCounts.archived}</div>
              </div>
              <div>
                <div className="font-bold uppercase tracking-wider">{strings.lifecycleTrashed}</div>
                <div className={`mt-1 text-lg font-bold ${t.textBody}`}>{lifecycleCounts.trashed}</div>
              </div>
            </div>
            {lifecycleFilter === 'trashed' && (
              <p className={`mt-3 text-[11px] leading-relaxed ${t.textMuted}`}>
                {strings.trashHoldingAreaNote}
              </p>
            )}
            <div className={`mt-3 border-t pt-3 ${t.borderLight}`}>
              <div className="font-bold uppercase tracking-wider">{strings.dataActions}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadActorVaultExportSnapshot()}
                  className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider opacity-80 ${t.borderLight} ${t.text} ${t.bgHover} ${t.hoverBorder}`}
                >
                  {strings.exportSnapshot}
                </button>
                <label className={`cursor-pointer border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider opacity-80 ${t.borderLight} ${t.text} ${t.bgHover} ${t.hoverBorder}`}>
                  {strings.importPreview}
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(event) => {
                      void handleImportPreviewFile(event.currentTarget.files?.[0]);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
              <p className={`mt-2 text-[11px] leading-relaxed ${t.textMuted}`}>
                {strings.exportSnapshotNote}
              </p>
              <p className={`mt-1 text-[11px] leading-relaxed ${t.textMuted}`}>
                {strings.importPreviewNote}
              </p>
            </div>
          </div>
        )}

        {isManagePurpose && importPreview && (
          <ActorVaultImportPreviewPanel
            preview={importPreview}
            fileName={importPreviewFileName}
            result={importResult}
            isImporting={isImporting}
            strings={strings}
            colorTheme={t}
            onSafeAppendImport={handleSafeAppendImport}
            onClear={() => {
              setImportPreview(null);
              setImportPreviewFileName('');
              setImportPreviewText('');
              setImportResult(null);
              setIsImporting(false);
            }}
          />
        )}

        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={strings.searchPlaceholder}
            className={`min-w-0 flex-1 border px-3 py-1.5 text-sm placeholder:opacity-40 focus:outline-none ${t.borderLight} ${t.bgInput} ${t.textBody} ${t.focusBorder} placeholder:${t.text}`}
          />
          {/* Sort */}
          {sortOptions.length > 1 && (
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className={`border px-3 py-1.5 text-xs focus:outline-none ${t.borderLight} ${t.bgInput} ${t.textBody} ${t.focusBorder}`}
            >
              {sortOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {isManagePurpose && (
            <>
              {(
                [
                  { value: 'active' as LifecycleFilterValue, label: strings.lifecycleActive, count: lifecycleCounts.active },
                  { value: 'archived' as LifecycleFilterValue, label: strings.lifecycleArchived, count: lifecycleCounts.archived },
                  { value: 'trashed' as LifecycleFilterValue, label: strings.lifecycleTrashed, count: lifecycleCounts.trashed },
                ] as const
              ).map(({ value, label, count }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLifecycleFilter(value)}
                  className={`border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    lifecycleFilter === value
                      ? `${t.border} ${t.bgAccent} ${t.textInvert}`
                      : `${t.borderLight} ${t.text} opacity-70 ${t.hoverBorder}`
                  }`}
                >
                  {label} · {count}
                </button>
              ))}
              <span className={`mx-1 hidden h-6 border-l ${t.borderLight} sm:block`} />
            </>
          )}
          {(
            [
              { value: 'all' as FilterValue, label: strings.filterAll },
              { value: 'complete' as FilterValue, label: strings.filterComplete },
              { value: 'incomplete' as FilterValue, label: strings.filterIncomplete },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                filter === value
                  ? `${t.border} ${t.bgAccent} ${t.textInvert}`
                  : `${t.borderLight} ${t.text} opacity-70 ${t.hoverBorder}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Actor card list ── */}
      {sorted.length === 0 ? (
        <div className={`${panelClassName} py-8 text-center`}>
          <p className={`text-sm ${t.text} opacity-60`}>{strings.noResults}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((summary) => (
            <div key={getActorActionKey(summary)}>
              <ActorVaultCard
                summary={summary}
                strings={strings}
                colorTheme={t}
                onEnterActor={onEnterActor}
                campaignActorSelectContext={campaignActorSelectContext}
                onSelectActorForCampaign={onSelectActorForCampaign}
                onRequestSelectCampaignForActor={onRequestSelectCampaignForActor}
                onArchiveActor={(actor) => {
                  if (actor.systemId) archiveActor(actor.systemId, actor.id);
                  setExpandedMoreActorKey(null);
                }}
                onTrashActor={(actor) => {
                  if (actor.systemId) trashActor(actor.systemId, actor.id);
                  setExpandedMoreActorKey(null);
                }}
                onRestoreActor={(actor) => {
                  if (actor.systemId) restoreActor(actor.systemId, actor.id);
                  setExpandedMoreActorKey(null);
                }}
                showLifecycleActions={isManagePurpose}
                isMoreActionsExpanded={expandedMoreActorKey === getActorActionKey(summary)}
                onToggleMoreActions={() => {
                  const key = getActorActionKey(summary);
                  setExpandedMoreActorKey((current) => (current === key ? null : key));
                }}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

function ActorVaultImportPreviewPanel({
  preview,
  fileName,
  result,
  isImporting,
  strings,
  colorTheme: t,
  onSafeAppendImport,
  onClear,
}: {
  preview: ActorVaultImportPreview;
  fileName: string;
  result: ActorVaultSafeAppendResult | null;
  isImporting: boolean;
  strings: ActorVaultShellStrings;
  colorTheme: ActorVaultColorTheme;
  onSafeAppendImport: () => void;
  onClear: () => void;
}) {
  const systemSummary = [
    `DND ${preview.systemCounts['dnd5e-2024']}`,
    `COC ${preview.systemCounts.coc7e}`,
    `CP RED ${preview.systemCounts['cp-red']}`,
  ].join(' / ');
  const lifecycleSummary = [
    `${strings.lifecycleActive} ${preview.lifecycleCounts.active}`,
    `${strings.lifecycleArchived} ${preview.lifecycleCounts.archived}`,
    `${strings.lifecycleTrashed} ${preview.lifecycleCounts.trashed}`,
  ].join(' / ');
  const visibleActors = preview.actors.slice(0, 6);
  const remainingActorCount = Math.max(0, preview.actors.length - visibleActors.length);
  const safeAppendCount = preview.isValidSnapshot
    ? preview.actors.filter((actor) => actor.conflict === 'none').length
    : 0;
  const canSafeAppend = preview.isValidSnapshot && safeAppendCount > 0 && !isImporting;

  return (
    <div className={`mb-3 border-b pb-3 ${t.borderLight}`}>
      <div className={`border p-3 ${t.borderLight} ${t.bgCard}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className={`text-[11px] font-bold uppercase tracking-wider ${t.text}`}>
              {strings.importPreviewTitle}
            </div>
            <div className={`mt-1 text-[11px] ${t.textMuted}`}>
              {strings.importPreviewFile}: {fileName || '—'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${preview.isValidSnapshot ? t.borderActive : 'border-red-400'} ${preview.isValidSnapshot ? t.text : 'text-red-600'}`}>
              {preview.isValidSnapshot ? strings.importPreviewValid : strings.importPreviewInvalid}
            </span>
            <button
              type="button"
              onClick={onClear}
              className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${t.borderLight} ${t.text} ${t.bgHover}`}
            >
              {strings.importPreviewClear}
            </button>
          </div>
        </div>

        <div className={`mt-3 grid gap-2 text-[11px] ${t.textBody} sm:grid-cols-4`}>
          <div>
            <div className={`font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.importPreviewSummary}</div>
            <div className="mt-1">
              {preview.supportedActorCount} / {preview.actorCount}
            </div>
          </div>
          <div>
            <div className={`font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.importPreviewSystems}</div>
            <div className="mt-1">{systemSummary}</div>
          </div>
          <div>
            <div className={`font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.importPreviewLifecycle}</div>
            <div className="mt-1">{lifecycleSummary}</div>
          </div>
          <div>
            <div className={`font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.importPreviewConflicts}</div>
            <div className="mt-1">
              {preview.conflictCount} / {strings.importPreviewUnsupported} {preview.unsupportedActorCount}
            </div>
          </div>
        </div>

        <p className={`mt-3 text-[11px] leading-relaxed ${t.textMuted}`}>
          {strings.importPreviewNoWrite}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!canSafeAppend}
            onClick={onSafeAppendImport}
            className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
              canSafeAppend
                ? `${t.border} ${t.bgAccent} ${t.textInvert}`
                : `${t.borderLight} ${t.text} opacity-35`
            }`}
          >
            {strings.safeAppendImport}
          </button>
          <span className={`text-[11px] leading-relaxed ${t.textMuted}`}>
            {safeAppendCount > 0 ? strings.safeAppendImportNote : strings.noSafeAppendActors}
          </span>
        </div>

        {result && (
          <div className={`mt-3 border p-2 text-[11px] ${t.borderLight} ${t.textBody}`}>
            <div className={`font-bold uppercase tracking-wider ${t.textMuted}`}>
              {strings.importResultTitle}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <ResultMetric label={strings.importResultImported} value={result.importedActors.length} />
              <ResultMetric label={strings.importResultSkippedConflicts} value={result.skippedConflictCount} />
              <ResultMetric label={strings.importResultSkippedUnsupported} value={result.skippedUnsupportedCount} />
              <ResultMetric label={strings.importResultSkippedInvalid} value={result.skippedInvalidCount} />
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <div className={`font-bold uppercase tracking-wider ${t.textMuted}`}>
                  {strings.importResultImportedSystems}
                </div>
                <div className="mt-1">
                  DND {result.systemCounts['dnd5e-2024']} / COC {result.systemCounts.coc7e} / CP RED {result.systemCounts['cp-red']}
                </div>
              </div>
              <div>
                <div className={`font-bold uppercase tracking-wider ${t.textMuted}`}>
                  {strings.importResultImportedLifecycle}
                </div>
                <div className="mt-1">
                  {strings.lifecycleActive} {result.lifecycleCounts.active} / {strings.lifecycleArchived} {result.lifecycleCounts.archived} / {strings.lifecycleTrashed} {result.lifecycleCounts.trashed}
                </div>
              </div>
            </div>
          </div>
        )}

        {(preview.errors.length > 0 || preview.warnings.length > 0) && (
          <div className={`mt-3 border p-2 text-[11px] ${t.borderLight} ${t.textBody}`}>
            <div className={`font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.importPreviewWarnings}</div>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {[...preview.errors, ...preview.warnings].slice(0, 8).map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {visibleActors.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {visibleActors.map((actor) => (
              <div key={`${actor.systemId}-${actor.actorId}`} className={`border p-2 text-[11px] ${t.borderLight}`}>
                <div className={`font-bold ${t.text}`}>{actor.displayName}</div>
                <div className={`mt-1 ${t.textMuted}`}>
                  {actor.systemId} / {actor.actorId} / {actor.lifecycleStatus}
                </div>
                {actor.conflict !== 'none' && (
                  <div className="mt-1 font-bold text-amber-700">{strings.importPreviewConflicts}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {remainingActorCount > 0 && (
          <div className={`mt-2 text-[11px] ${t.textMuted}`}>+{remainingActorCount}</div>
        )}
      </div>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-bold uppercase tracking-wider opacity-65">{label}</div>
      <div className="mt-1 text-base font-bold">{value}</div>
    </div>
  );
}

// ─── Actor Creation Completion Shell ──────────────────────────────────────────

export type ActorCreationCompletionShellStrings = {
  readyTitle: string;
  nextStepTitle: string;
  standaloneNote: string;
  forCampaignTitle: string;
  forCampaignNote: string;
  previewActorLabel: string;
  openSheet: string;
  selectCampaign: string;
  returnToCampaignEntry: string;
  shellOnlyNote: string;
};

export type ActorCreationCompletionShellProps = {
  context: ActorCreationCompletionContext;
  strings: ActorCreationCompletionShellStrings;
  colorTheme: ActorVaultColorTheme;
  panelClassName: string;
  onOpenActorSheet: (actor: CampaignSuggestedActor) => void;
  onSelectCampaign: (actor: CampaignSuggestedActor) => void;
  onReturnToCampaignEntry: (context: Extract<ActorCreationCompletionContext, { kind: 'forCampaign' }>) => void;
};

export function ActorCreationCompletionShell({
  context,
  strings,
  colorTheme: t,
  panelClassName,
  onOpenActorSheet,
  onSelectCampaign,
  onReturnToCampaignEntry,
}: ActorCreationCompletionShellProps) {
  const isForCampaign = context.kind === 'forCampaign';
  const title = isForCampaign ? strings.forCampaignTitle : strings.readyTitle;
  const note = isForCampaign ? strings.forCampaignNote : strings.standaloneNote;

  return (
    <div className={`${panelClassName} flex flex-col gap-4`}>
      <div>
        <div className={`text-xs font-bold uppercase tracking-[0.2em] ${t.textMuted}`}>
          {strings.nextStepTitle}
        </div>
        <h2 className={`mt-1 text-xl font-bold ${t.textBody}`}>{title}</h2>
        <p className={`mt-2 text-sm leading-relaxed ${t.textBody} opacity-70`}>
          {note}
        </p>
      </div>

      <div className={`rounded-lg border p-4 ${t.borderLight} ${t.bgCard}`}>
        <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>
          {strings.previewActorLabel}
        </div>
        <div className={`mt-1 text-lg font-bold ${t.textBody}`}>{context.actor.actorName}</div>
        <p className={`mt-2 text-xs leading-relaxed ${t.textMuted}`}>
          {strings.shellOnlyNote}
        </p>
      </div>

      {isForCampaign ? (
        <button
          type="button"
          onClick={() => onReturnToCampaignEntry(context)}
          className={`w-fit border px-4 py-2 text-xs font-bold uppercase tracking-wider ${t.border} ${t.bgAccent} ${t.textInvert}`}
        >
          {strings.returnToCampaignEntry}
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenActorSheet(context.actor)}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${t.border} ${t.bgAccent} ${t.textInvert}`}
          >
            {strings.openSheet}
          </button>
          <button
            type="button"
            onClick={() => onSelectCampaign(context.actor)}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${t.borderActive} ${t.text} ${t.bgHover}`}
          >
            {strings.selectCampaign}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Actor Card sub-component ─────────────────────────────────────────────────

type ActorVaultCardProps = {
  summary: ActorVaultSummary;
  strings: ActorVaultShellStrings;
  colorTheme: ActorVaultColorTheme;
  onEnterActor: (id: string) => void;
  campaignActorSelectContext?: CampaignActorSelectReturnContext | null;
  onSelectActorForCampaign?: (
    actor: CampaignSuggestedActor,
    context: CampaignActorSelectReturnContext,
  ) => void;
  onRequestSelectCampaignForActor?: (actor: CampaignSuggestedActor) => void;
  onArchiveActor?: (actor: ActorVaultSummary) => void;
  onTrashActor?: (actor: ActorVaultSummary) => void;
  onRestoreActor?: (actor: ActorVaultSummary) => void;
  showLifecycleActions?: boolean;
  isMoreActionsExpanded?: boolean;
  onToggleMoreActions?: () => void;
};

function ActorVaultCard({
  summary,
  strings,
  colorTheme: t,
  onEnterActor,
  campaignActorSelectContext,
  onSelectActorForCampaign,
  onRequestSelectCampaignForActor,
  onArchiveActor,
  onTrashActor,
  onRestoreActor,
  showLifecycleActions = false,
  isMoreActionsExpanded = false,
  onToggleMoreActions,
}: ActorVaultCardProps) {
  const isComplete = summary.completionStatus === 'complete';
  const lifecycleStatus = summary.lifecycleStatus ?? 'active';
  const isArchived = lifecycleStatus === 'archived';
  const isTrashed = lifecycleStatus === 'trashed';
  const isSelectable = lifecycleStatus === 'active';

  return (
    <div
      className={`grid grid-cols-1 gap-4 rounded-lg border-2 p-5 lg:grid-cols-[minmax(0,1fr)_auto] ${
        summary.isActive
          ? `${t.borderActive} ${t.bgActive}`
          : `${t.borderLight} ${t.bgCard}`
      }`}
    >
      {/* ── Actor info ── */}
      <div>
        {/* Name row + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`text-xl font-bold ${t.textBody}`}>{summary.displayName}</h3>

          {summary.isActive && (
            <span className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${t.borderActive} ${t.text} opacity-75`}>
              {strings.activeLabel}
            </span>
          )}

          <span
            className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              isComplete
                ? 'border-green-700/40 text-green-800'
                : 'border-amber-600/40 text-amber-700'
            }`}
          >
            {isComplete ? strings.statusComplete : strings.statusIncomplete}
          </span>

          {isArchived && (
            <span className="border border-slate-500/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
              {strings.archivedStatusLabel}
            </span>
          )}

          {isTrashed && (
            <span className="border border-red-700/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-700">
              {strings.trashedStatusLabel}
            </span>
          )}
        </div>

        {(isArchived || isTrashed) && (
          <p className={`mt-2 text-xs leading-relaxed ${t.textMuted}`}>
            {isArchived ? strings.archivedActorNote : strings.trashedActorNote}
          </p>
        )}

        {/* Detail fields grid */}
        {summary.detailFields.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
            {summary.detailFields.map((field) => (
              <div key={field.label}>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>
                  {field.label}
                </div>
                <div className={`font-bold ${t.textBody}`}>{field.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Metadata row */}
        {summary.metaRows.length > 0 && (
          <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] ${t.textMuted}`}>
            {summary.metaRows.map((row) => (
              <span key={row.label}>
                <span className="font-bold">{row.label}：</span>
                {row.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Action groups ── */}
      <div className="flex flex-col justify-center gap-3 lg:w-44">
        {campaignActorSelectContext && onSelectActorForCampaign && (
          <button
            type="button"
            disabled={!isSelectable}
            onClick={() =>
              onSelectActorForCampaign(
                { actorId: summary.id, actorName: summary.displayName },
                campaignActorSelectContext,
              )
            }
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
              isSelectable
                ? `${t.border} ${t.bgAccent} ${t.textInvert}`
                : `${t.borderLight} ${t.text} opacity-35`
            }`}
          >
            {strings.selectForCampaignLabel}
          </button>
        )}
        <button
          type="button"
          onClick={() => onEnterActor(summary.id)}
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            campaignActorSelectContext
              ? `${t.borderActive} ${t.text} ${t.bgHover}`
              : `${t.border} ${t.bgAccent} ${t.textInvert}`
          }`}
        >
          {strings.enterActorLabel}
        </button>
        {!campaignActorSelectContext && lifecycleStatus === 'active' && onRequestSelectCampaignForActor && (
          <button
            type="button"
            onClick={() =>
              onRequestSelectCampaignForActor({
                actorId: summary.id,
                actorName: summary.displayName,
              })
            }
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${t.borderActive} ${t.text} ${t.bgHover}`}
          >
            {strings.selectCampaignLabel}
          </button>
        )}
        {showLifecycleActions && (
          <div className={`border-t pt-2 ${t.borderLight}`}>
            <div className={`mb-1 text-[9px] font-bold uppercase tracking-wider ${t.textMuted} opacity-70`}>
              {strings.managementActions}
            </div>
            <div className="flex flex-col gap-1.5">
              {lifecycleStatus === 'active' && (
                <>
                  <button
                    type="button"
                    aria-expanded={isMoreActionsExpanded}
                    aria-label={
                      isMoreActionsExpanded
                        ? strings.moreActionsCollapseLabel
                        : strings.moreActionsExpandLabel
                    }
                    onClick={onToggleMoreActions}
                    className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${t.borderLight} ${t.text} ${t.bgHover} ${t.hoverBorder}`}
                  >
                    {isMoreActionsExpanded
                      ? strings.moreActionsExpanded
                      : strings.moreActionsCollapsed}
                  </button>
                  {isMoreActionsExpanded && (
                    <div className={`flex flex-col gap-1.5 border px-2 py-2 ${t.borderLight}`}>
                      <button
                        type="button"
                        onClick={() => onArchiveActor?.(summary)}
                        className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-75 ${t.borderLight} ${t.text} ${t.bgHover} ${t.hoverBorder}`}
                      >
                        {strings.archiveActor}
                      </button>
                      <button
                        type="button"
                        onClick={() => onTrashActor?.(summary)}
                        className="border border-red-700/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700/80 hover:bg-red-700/10"
                      >
                        {strings.moveToTrash}
                      </button>
                    </div>
                  )}
                </>
              )}
              {lifecycleStatus === 'archived' && (
                <>
                  <button
                    type="button"
                    onClick={() => onRestoreActor?.(summary)}
                    className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${t.borderActive} ${t.text} ${t.bgHover}`}
                  >
                    {strings.restoreActor}
                  </button>
                  <button
                    type="button"
                    aria-expanded={isMoreActionsExpanded}
                    aria-label={
                      isMoreActionsExpanded
                        ? strings.moreActionsCollapseLabel
                        : strings.moreActionsExpandLabel
                    }
                    onClick={onToggleMoreActions}
                    className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${t.borderLight} ${t.text} ${t.bgHover} ${t.hoverBorder}`}
                  >
                    {isMoreActionsExpanded
                      ? strings.moreActionsExpanded
                      : strings.moreActionsCollapsed}
                  </button>
                  {isMoreActionsExpanded && (
                    <div className={`flex flex-col gap-1.5 border px-2 py-2 ${t.borderLight}`}>
                      <button
                        type="button"
                        onClick={() => onTrashActor?.(summary)}
                        className="border border-red-700/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700/80 hover:bg-red-700/10"
                      >
                        {strings.moveToTrash}
                      </button>
                    </div>
                  )}
                </>
              )}
              {lifecycleStatus === 'trashed' && (
                <button
                  type="button"
                  onClick={() => onRestoreActor?.(summary)}
                  className={`border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${t.borderActive} ${t.text} ${t.bgHover}`}
                >
                  {strings.restoreActor}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getActorActionKey(summary: ActorVaultSummary): string {
  return `${summary.systemId ?? 'unknown'}:${summary.id}`;
}

function getSummaryLifecycleStatus(
  summary: ActorVaultSummary,
  metas: ReturnType<typeof useActorVaultLifecycleStore.getState>['metas'],
): ActorVaultLifecycleStatus {
  if (!summary.systemId) return summary.lifecycleStatus ?? 'active';
  return metas.find(
    (meta) => meta.systemId === summary.systemId && meta.actorId === summary.id,
  )?.lifecycleStatus ?? summary.lifecycleStatus ?? 'active';
}
