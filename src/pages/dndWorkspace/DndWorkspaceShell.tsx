import { useState, type ReactNode } from 'react';
import { BookOpen, Library, ScrollText, Users } from 'lucide-react';
import { createTranslator, readStoredLocale } from '../../i18n';
import {
  DND_2024_BACKGROUND_INDEX_DATA,
  DND_2024_EQUIPMENT_INDEX_DATA,
  DND_2024_FEAT_INDEX_DATA,
  DND_CHARACTER_OPTIONS_COMPLETION_REPORT,
} from '../../data/dnd2024/characterOptionsIndex';
import { DND_SPELL_INDEX_COUNTS } from '../../data/dnd2024/spellIndex';
import { useCharacterStore } from '../../store/characterStore';
import { ActorVaultLibraryShell } from '../../components/platform/ActorVaultLibraryShell';
import { SystemRuleSourcesShell, type SystemRuleSourcesTheme } from '../../components/platform/SystemRuleSourcesShell';
import { DND_RULE_SOURCES } from './dndRuleSourcesAdapter';
import {
  buildDndActorSummary,
  buildDndVaultStats,
  buildDndSortOptions,
  buildDndVaultShellStrings,
  buildDndVaultAdapterStrings,
  DND_VAULT_COLOR_THEME,
} from './dndActorVaultAdapter';
import { deriveVaultSummaries } from '../../lib/platform/actorVault';
import type { ActorVaultAdapter } from '../../lib/platform/actorVault';

/**
 * DndWorkspaceShell
 *
 * AI-LANDMARK: DND_PRODUCT_SHELL_PHASE_1
 * AI-LANDMARK: DND_WORKSPACE_CONTRACT_ALIGNMENT_V1
 *
 * DND product shell phase 1: entering DND opens a workspace dashboard
 * (rule scope, source status, data completion, module launcher) instead of
 * dropping straight into a character sheet. The existing Creator / Sheet /
 * Gameplay UI is rendered unchanged as the "play" view (children).
 *
 * Display-only shell: no rules data changes, no runtime automation, and no
 * real source enable/disable filtering in this phase.
 *
 * Contract Alignment v1: top nav limited to system-level Sections only.
 * Actor Vault is the default/root user entry; overview/dashboard is retained
 * as low-frequency System Info, not as a primary nav item. creationMethod
 * ('create' view) is accessible via CTAs from Actor Vault.
 * builder / sheet / runtime are Actor-context flows — not top-nav peers.
 */

// AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
// 'characterLibrary' view removed — library mode is now managed internally by ActorVaultLibraryShell.
export type DndWorkspaceView = 'dashboard' | 'characters' | 'create' | 'compendium' | 'sources' | 'ruleSources' | 'play';
export type DndPlayTab = 'creator' | 'sheet' | 'gameplay';

type DndWorkspaceShellProps = {
  view: DndWorkspaceView;
  onViewChange: (view: DndWorkspaceView) => void;
  onOpenPlayTab: (tab: DndPlayTab) => void;
  children: ReactNode;
};

const REPORT = DND_CHARACTER_OPTIONS_COMPLETION_REPORT;

export function DndWorkspaceShell({ view, onViewChange, onOpenPlayTab, children }: DndWorkspaceShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const dndChar = useCharacterStore((state) => state.character);
  const dndCharacters = useCharacterStore((state) => state.characters);
  const dndActiveCharacterId = useCharacterStore((state) => state.activeCharacterId);
  const setDndActiveCharacterId = useCharacterStore((state) => state.setActiveCharacterId);
  const resetDndCreator = useCharacterStore((state) => state.resetCreator);
  const characterName = (dndChar as { name?: string }).name?.trim();
  const hasCurrentCharacter = Boolean(
    characterName ||
    dndChar.race ||
    dndChar.background ||
    dndChar.jobClass ||
    dndChar.isCompleted,
  );
  const [plannedSlotLabelKey, setPlannedSlotLabelKey] = useState<string | null>(null);

  // AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
  // DND Actor Vault adapter: maps CharacterData to platform ActorVaultSummary.
  // Search / filter / sort state is now owned by ActorVaultLibraryShell.
  const _adapterStrings = buildDndVaultAdapterStrings(t);
  const _dndVaultAdapter: ActorVaultAdapter<typeof dndCharacters[number]> = {
    getActors: () =>
      // For the active character always use the live compat field (up-to-date with in-session mutations).
      dndCharacters.map(c => (c.id === dndActiveCharacterId ? dndChar : c)),
    getActiveActorId: () => dndActiveCharacterId,
    getSummary: (char, index) => buildDndActorSummary(char, index, dndActiveCharacterId, _adapterStrings),
    getStats: (summaries) => buildDndVaultStats(summaries),
    getAddOptions: () => [],
    getSortOptions: () => buildDndSortOptions({
      default: t('dndWorkspace.characterLibrary.sort.default'),
      name:    t('dndWorkspace.characterLibrary.sort.name'),
      level:   t('dndWorkspace.characterLibrary.sort.level'),
    }),
    getDefaultSortKey: () => 'default',
    onEnterActor: (id) => { setDndActiveCharacterId(id); onOpenPlayTab('sheet'); },
  };
  const _vaultSummaries = deriveVaultSummaries(_dndVaultAdapter);
  const _vaultStats     = _dndVaultAdapter.getStats(_vaultSummaries);
  const _vaultSortOpts  = _dndVaultAdapter.getSortOptions();
  const _vaultStrings   = buildDndVaultShellStrings(t);

  // AI-LANDMARK: DND_WORKSPACE_CONTRACT_ALIGNMENT_V1
  // Top nav = system-level Sections only (Contract §5 / PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT_V1).
  // 'create' (creationMethod) is Actor/Creation context — accessible via CTA from overview & vault.
  // builder / sheet / runtime must NOT appear here; they depend on an Actor context.
  // AI-LANDMARK: SYSTEM_DEFAULT_ENTRY_ACTOR_VAULT_GENERIC_NAV_LABELS_V1
  // Top nav uses generic platform labels only. System flavor stays inside page titles/content.
  const navItems: { key: DndWorkspaceView; labelKey: string; icon: typeof Users }[] = [
    { key: 'characters',  labelKey: 'navigation.actorVault',      icon: Users },
    { key: 'compendium',  labelKey: 'navigation.rulesCompendium', icon: Library },
    { key: 'ruleSources', labelKey: 'navigation.ruleSources',     icon: ScrollText },
    { key: 'sources',     labelKey: 'navigation.sourceStatus',    icon: ScrollText },
  ];

  const completionRows: { labelKey: string; value: string }[] = [
    { labelKey: 'dndWorkspace.completion.species', value: `${REPORT.species.runtime} runtime / ${REPORT.species.manifest} indexed` },
    { labelKey: 'dndWorkspace.completion.backgrounds', value: `${REPORT.backgrounds.runtime} runtime / ${REPORT.backgrounds.manifest} indexed` },
    { labelKey: 'dndWorkspace.completion.classes', value: `${REPORT.classes.runtime} runtime / ${REPORT.classes.manifest} indexed` },
    { labelKey: 'dndWorkspace.completion.subclasses', value: `${REPORT.subclasses.runtime} runtime / ${REPORT.subclasses.manifest} indexed` },
    { labelKey: 'dndWorkspace.completion.spells', value: `${REPORT.spells.runtime} runtime / ${DND_SPELL_INDEX_COUNTS.total} indexed` },
    { labelKey: 'dndWorkspace.completion.feats', value: `${REPORT.originFeats.runtime + REPORT.generalFeats.runtime} runtime / ${DND_2024_FEAT_INDEX_DATA.length} source files` },
    { labelKey: 'dndWorkspace.completion.equipment', value: `${REPORT.equipment.runtimeSample} sample / ${DND_2024_EQUIPMENT_INDEX_DATA.length} categories` },
  ];

  // AI-LANDMARK: MULTI_SYSTEM_WORKSPACE_PLANNED_SLOTS
  // DND planned modules are platform entry points only, not inventory/map/journal implementations.
  //
  // AI-LANDMARK: SYSTEM_HOME_SIMPLIFICATION
  // System Home only shows core Game System entry points.
  // spellIndex / featIndex / equipmentIndex / classIndex are accessible inside the Compendium view;
  // they are NOT listed as top-level home cards. Data coverage detail is linked from Source Status.
  // AI-LANDMARK: SYSTEM_HOME_NAVIGATION_DEDUPLICATION
  // System Home does not repeat top navigation; it shows current character context and next actions.

  const sourceRows: {
    groupKey: 'dndWorkspace.sources.core' | 'dndWorkspace.sources.expansions';
    name: string;
    sourceId: string;
    statusKey: string;
    noteKey: string;
  }[] = [
    {
      groupKey: 'dndWorkspace.sources.core',
      name: 'DND 2024 / SRD5.2',
      sourceId: 'dnd5echm-srd52-primary',
      statusKey: 'dndWorkspace.sources.statusRuntimeReady',
      noteKey: 'dndWorkspace.sources.coreNote',
    },
    {
      groupKey: 'dndWorkspace.sources.expansions',
      name: "Xanathar's Guide to Everything",
      sourceId: 'dnd5echm-xgte',
      statusKey: 'dndWorkspace.sources.statusIndexed',
      noteKey: 'dndWorkspace.sources.xgteNote',
    },
    {
      groupKey: 'dndWorkspace.sources.expansions',
      name: "Tasha's Cauldron of Everything",
      sourceId: 'dnd5echm-tcoe',
      statusKey: 'dndWorkspace.sources.statusIndexed',
      noteKey: 'dndWorkspace.sources.tcoeNote',
    },
  ];

  const compendiumCards: { labelKey: string; count: string; statusKey: string }[] = [
    { labelKey: 'dndWorkspace.modules.spellIndex', count: `${DND_SPELL_INDEX_COUNTS.total}`, statusKey: 'dndWorkspace.compendium.entries' },
    { labelKey: 'dndWorkspace.modules.featIndex', count: `${DND_2024_FEAT_INDEX_DATA.length}`, statusKey: 'dndWorkspace.compendium.files' },
    { labelKey: 'dndWorkspace.modules.equipmentIndex', count: `${DND_2024_EQUIPMENT_INDEX_DATA.length}`, statusKey: 'dndWorkspace.compendium.categories' },
    { labelKey: 'dndWorkspace.modules.classIndex', count: `${REPORT.classes.manifest} / ${REPORT.subclasses.manifest}`, statusKey: 'dndWorkspace.compendium.entries' },
  ];

  const panelClass = 'rounded-lg border-2 border-[#58180d]/30 bg-[#fff8e6]/80 p-5 shadow-sm';

  const dndRuleSourcesTheme: SystemRuleSourcesTheme = {
    panel: panelClass,
    card: 'rounded-md border border-[#58180d]/20 bg-white/50',
    title: 'text-[#58180d]',
    muted: 'text-[#2c1810]/70',
    badgeEnabled: 'border-[#2f7f68]/50 bg-[#2f7f68]/10 text-[#2f7f68]',
    badgePlanned: 'border-[#58180d]/30 text-[#58180d]/70',
    kindBadge: 'border-[#58180d]/30 text-[#58180d]/70',
  };
  const handleNavClick = (nextView: DndWorkspaceView) => {
    // AI-LANDMARK: DND_GAMEPLAY_ENTRY_PRESERVATION
    // Workspace Play / Combat must open DND Gameplay, not the last Builder tab.
    if (nextView === 'play') {
      onOpenPlayTab('gameplay');
      return;
    }

    onViewChange(nextView);
  };
  // AI-LANDMARK: DND_CHARACTER_VAULT_CREATION_METHOD_ENTRY
  // Creation now enters through a method picker; only Standard Creation opens the existing Builder.
  const creationMethodCards: { labelKey: string; noteKey: string; planned?: boolean; onClick: () => void }[] = [
    { labelKey: 'dndWorkspace.creation.standard', noteKey: 'dndWorkspace.creation.standardNote', onClick: () => { resetDndCreator(); onOpenPlayTab('creator'); } },
    { labelKey: 'dndWorkspace.creation.quick', noteKey: 'dndWorkspace.creation.quickNote', planned: true, onClick: () => setPlannedSlotLabelKey('dndWorkspace.creation.quick') },
    { labelKey: 'dndWorkspace.creation.localImport', noteKey: 'dndWorkspace.creation.localImportNote', planned: true, onClick: () => setPlannedSlotLabelKey('dndWorkspace.creation.localImport') },
    { labelKey: 'dndWorkspace.creation.workshop', noteKey: 'dndWorkspace.creation.workshopNote', planned: true, onClick: () => setPlannedSlotLabelKey('dndWorkspace.creation.workshop') },
  ];

  return (
    <div className="min-h-screen bg-[#fdf6e3] text-[#2c1810] font-serif">
      {/* ── DND workspace secondary navigation ── */}
      <div className="border-b-2 border-[#58180d]/70 bg-[#f7ebcf]/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#58180d]" />
            <span className="font-dnd-title text-lg text-[#58180d]">{t('dndWorkspace.title')}</span>
          </div>
          <nav className="flex flex-wrap gap-1" aria-label={t('dndWorkspace.title')}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = view === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavClick(item.key)}
                  className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'border-[#58180d] bg-[#58180d] text-[#fdf6e3]'
                      : 'border-[#58180d]/30 text-[#58180d] hover:border-[#58180d] hover:bg-[#58180d]/10'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(item.labelKey)}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Play view: preserved Creator / Sheet / Gameplay workspace ── */}
      {view === 'play' && children}

      {view !== 'play' && (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {view === 'dashboard' && (
            <div className="flex flex-col gap-6">
              <section className={panelClass}>
                <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#58180d]/55">
                  {t('navigation.breadcrumb.platform')} / {t('navigation.breadcrumb.play')} / DND 5e 2024 / {t('navigation.systemInfo')}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h1 className="font-dnd-title text-3xl text-[#58180d]">DND 5e 2024</h1>
                    <p className="mt-2 text-sm text-[#58180d]/80">
                      <span className="font-bold">{t('dndWorkspace.dashboard.scopeLabel')}：</span>
                      {t('dndWorkspace.dashboard.scope')}
                    </p>
                  </div>
                  <div className="border border-[#58180d]/40 bg-[#58180d]/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#58180d]">
                    {t('dndWorkspace.dashboard.statusLabel')}：{t('dndWorkspace.dashboard.status')}
                  </div>
                </div>
              </section>

              <section className={panelClass}>
                {hasCurrentCharacter ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#58180d]/65">{t('dndWorkspace.characters.current')}</div>
                      <h2 className="mt-2 text-2xl font-bold text-[#2c1810]">{characterName || t('dndWorkspace.characters.unnamed')}</h2>
                      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#58180d]/60">{t('dndWorkspace.characters.level')}</div>
                          <div className="font-bold">{dndChar.level || 1}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#58180d]/60">{t('dndWorkspace.characters.species')}</div>
                          <div className="font-bold">{dndChar.race || t('dndBuilder.common.unselected')}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#58180d]/60">{t('dndWorkspace.characters.background')}</div>
                          <div className="font-bold">{dndChar.background || t('dndBuilder.common.unselected')}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#58180d]/60">{t('dndWorkspace.characters.class')}</div>
                          <div className="font-bold">{dndChar.jobClass || t('dndBuilder.common.unselected')}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 lg:w-44">
                      <button type="button" onClick={() => onOpenPlayTab('sheet')} className="border border-[#58180d]/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#58180d] hover:bg-[#58180d]/10">
                        {t('dndWorkspace.actions.viewSheet')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#58180d]">{t('dndWorkspace.characters.empty')}</h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-[#58180d]/70">{t('dndWorkspace.home.noCharacterNote')}</p>
                    <button
                      type="button"
                      onClick={() => onViewChange('create')}
                      className="mt-5 border border-[#58180d] bg-[#58180d] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#fdf6e3] hover:bg-[#2c1810]"
                    >
                      {t('dndWorkspace.home.createFirstCharacter')}
                    </button>
                  </div>
                )}
                <p className="mt-4 border-t border-[#58180d]/15 pt-3 text-xs text-[#58180d]/55">{t('navigation.rulesAndDataInTopNav')}</p>
                <details className="mt-3 text-xs text-[#58180d]/55">
                  <summary className="cursor-pointer font-bold text-[#58180d]/70">{t('navigation.platformGuidance')}</summary>
                  <div className="mt-2 space-y-1">
                    <p>{t('navigation.selectedActorGuidance')}</p>
                    <p>{t('navigation.campaignGuidance')}</p>
                  </div>
                </details>
              </section>
            </div>
          )}

          {view === 'create' && (
            <section className={panelClass}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#58180d]">{t('dndWorkspace.creation.title')}</h2>
                  <p className="mt-1 text-sm text-[#58180d]/70">{t('dndWorkspace.creation.subtitle')}</p>
                </div>
                <span className="border border-[#58180d]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/70">
                  {t('dndWorkspace.creation.builderBoundary')}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {creationMethodCards.map((card) => (
                  <button
                    key={card.labelKey}
                    type="button"
                    onClick={card.onClick}
                    className="min-h-32 border border-[#58180d]/30 bg-white/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#58180d] hover:shadow-md"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-bold text-[#58180d]">{t(card.labelKey)}</span>
                      {card.planned && (
                        <span className="shrink-0 border border-[#58180d]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/70">
                          {t('multiWorkspace.status.planned')}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block text-xs font-normal leading-relaxed text-[#58180d]/65">{t(card.noteKey)}</span>
                  </button>
                ))}
              </div>
              {plannedSlotLabelKey && (
                <div className="mt-4 border border-dashed border-[#58180d]/40 bg-white/40 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#58180d]/70">
                    {t('multiWorkspace.status.planned')}
                  </div>
                  <h3 className="mt-2 font-bold text-[#58180d]">{t(plannedSlotLabelKey)}</h3>
                  <p className="mt-2 text-sm text-[#58180d]/75">{t('dndWorkspace.creation.plannedMessage')}</p>
                </div>
              )}
              <p className="mt-4 border-t border-[#58180d]/15 pt-3 text-[10px] text-[#58180d]/50">
                {t('dndWorkspace.creation.actorFlowNote')}
              </p>
            </section>
          )}

          {/* AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
              Actor Vault (home + existing library) now rendered by the platform shell.
              DND-specific fields are mapped by dndActorVaultAdapter.ts.
              'characterLibrary' was removed from DndWorkspaceView — the shell manages
              its own 'home'/'existing' mode internally. */}
          {view === 'characters' && (
            <ActorVaultLibraryShell
              summaries={_vaultSummaries}
              stats={_vaultStats}
              sortOptions={_vaultSortOpts}
              defaultSortKey="default"
              onEnterActor={(id) => _dndVaultAdapter.onEnterActor(id)}
              onRequestAdd={() => onViewChange('create')}
              strings={_vaultStrings}
              colorTheme={DND_VAULT_COLOR_THEME}
              panelClassName={panelClass}
            />
          )}

          {view === 'compendium' && (
            <section className={panelClass}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#58180d]">
                {t('dndWorkspace.compendium.title')}
              </h2>
              <p className="mb-4 text-xs text-[#58180d]/70">{t('dndWorkspace.compendium.note')}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {compendiumCards.map((card) => (
                  <div key={card.labelKey} className="border border-[#58180d]/20 bg-white/50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-[#58180d]">{t(card.labelKey)}</div>
                      <span className="border border-[#58180d]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/80">
                        {t('dndWorkspace.sources.statusNeedsCheck')}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-sm text-[#2c1810]/85">
                      {card.count} {t(card.statusKey)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border border-dashed border-[#58180d]/30 bg-white/30 p-3 text-xs text-[#58180d]/60">
                {t('dndWorkspace.compendium.backgroundsLine')}：{DND_2024_BACKGROUND_INDEX_DATA.length}
              </div>
            </section>
          )}

          {view === 'sources' && (
            <section className={panelClass}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#58180d]">
                {t('dndWorkspace.sources.title')}
              </h2>
              <div className="space-y-3">
                {sourceRows.map((row) => (
                  <div key={row.sourceId} className="border border-[#58180d]/20 bg-white/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="mr-2 border border-[#58180d]/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/70">
                          {t(row.groupKey)}
                        </span>
                        <span className="font-bold text-[#58180d]">{row.name}</span>
                      </div>
                      <span className="border border-[#2f7f68]/50 bg-[#2f7f68]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2f7f68]">
                        {t(row.statusKey)}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-[11px] text-[#2c1810]/70">sourceId: {row.sourceId}</div>
                    <p className="mt-1 text-xs text-[#2c1810]/80">{t(row.noteKey)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {view === 'ruleSources' && (
            <SystemRuleSourcesShell items={DND_RULE_SOURCES} t={t} theme={dndRuleSourcesTheme} />
          )}
        </main>
      )}
    </div>
  );
}
