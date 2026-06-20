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
import { ContextBar } from './ContextBar';

// ─── Internal types ────────────────────────────────────────────────────────────

type LibraryMode = 'home' | 'existing';
type FilterValue = 'all' | 'complete' | 'incomplete';

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
  const [sortKey, setSortKey] = useState(defaultSortKey);

  const campaignActorSelectContext =
    purpose.kind === 'selectForCampaign' ? purpose.context : null;
  const campaignActorAddContext = purpose.kind === 'addForCampaign' ? purpose.context : null;

  useEffect(() => {
    setMode('home');
  }, [
    purpose.kind,
    campaignActorSelectContext?.campaignId,
    campaignActorAddContext?.campaignId,
  ]);

  // ── Derived: filtered + sorted summaries ──────────────────────────────────

  const filtered = summaries.filter((s) => {
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
                <div className={`mt-1 text-3xl font-bold ${t.textBody}`}>{stats.total}</div>
              </div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.completeCount}</div>
                <div className={`mt-1 text-3xl font-bold ${t.textBody}`}>{stats.complete}</div>
              </div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${t.textMuted}`}>{strings.incompleteCount}</div>
                <div className={`mt-1 text-3xl font-bold ${t.textBody}`}>{stats.incomplete}</div>
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
            <div key={summary.id}>
              <ActorVaultCard
                summary={summary}
                strings={strings}
                colorTheme={t}
                onEnterActor={onEnterActor}
                campaignActorSelectContext={campaignActorSelectContext}
                onSelectActorForCampaign={onSelectActorForCampaign}
                onRequestSelectCampaignForActor={onRequestSelectCampaignForActor}
              />
            </div>
          ))}
        </div>
      )}

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
};

function ActorVaultCard({
  summary,
  strings,
  colorTheme: t,
  onEnterActor,
  campaignActorSelectContext,
  onSelectActorForCampaign,
  onRequestSelectCampaignForActor,
}: ActorVaultCardProps) {
  const isComplete = summary.completionStatus === 'complete';

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
        </div>

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

      {/* ── Enter CTA ── */}
      <div className="flex flex-col justify-center gap-2 lg:w-40">
        {campaignActorSelectContext && onSelectActorForCampaign && (
          <button
            type="button"
            onClick={() =>
              onSelectActorForCampaign(
                { actorId: summary.id, actorName: summary.displayName },
                campaignActorSelectContext,
              )
            }
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${t.border} ${t.bgAccent} ${t.textInvert}`}
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
        {!campaignActorSelectContext && onRequestSelectCampaignForActor && (
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
      </div>
    </div>
  );
}
