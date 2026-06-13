import { useState, type ReactNode } from 'react';
import { BookOpen, Gamepad2, LayoutDashboard, Library, ScrollText, Users } from 'lucide-react';
import { createTranslator, readStoredLocale } from '../../i18n';
import {
  DND_2024_BACKGROUND_INDEX_DATA,
  DND_2024_EQUIPMENT_INDEX_DATA,
  DND_2024_FEAT_INDEX_DATA,
  DND_CHARACTER_OPTIONS_COMPLETION_REPORT,
} from '../../data/dnd2024/characterOptionsIndex';
import { DND_SPELL_INDEX_COUNTS } from '../../data/dnd2024/spellIndex';
import { useCharacterStore } from '../../store/characterStore';

/**
 * DndWorkspaceShell
 *
 * AI-LANDMARK: DND_PRODUCT_SHELL_PHASE_1
 *
 * DND product shell phase 1: entering DND opens a workspace dashboard
 * (rule scope, source status, data completion, module launcher) instead of
 * dropping straight into a character sheet. The existing Creator / Sheet /
 * Gameplay UI is rendered unchanged as the "play" view (children).
 *
 * Display-only shell: no rules data changes, no runtime automation, and no
 * real source enable/disable filtering in this phase.
 */

export type DndWorkspaceView = 'dashboard' | 'characters' | 'compendium' | 'sources' | 'play';
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
  const characterName = (dndChar as { name?: string }).name?.trim();
  const [plannedSlotLabelKey, setPlannedSlotLabelKey] = useState<string | null>(null);

  const navItems: { key: DndWorkspaceView; labelKey: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', labelKey: 'dndWorkspace.nav.dashboard', icon: LayoutDashboard },
    { key: 'characters', labelKey: 'dndWorkspace.nav.characters', icon: Users },
    { key: 'compendium', labelKey: 'dndWorkspace.nav.compendium', icon: Library },
    { key: 'sources', labelKey: 'dndWorkspace.nav.sources', icon: ScrollText },
    { key: 'play', labelKey: 'dndWorkspace.nav.play', icon: Gamepad2 },
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
  const moduleCards: { labelKey: string; noteKey?: string; planned?: boolean; onClick: () => void }[] = [
    { labelKey: 'dndWorkspace.modules.create', onClick: () => onOpenPlayTab('creator') },
    { labelKey: 'dndWorkspace.modules.sheet', onClick: () => onOpenPlayTab('sheet') },
    { labelKey: 'dndWorkspace.modules.play', onClick: () => onOpenPlayTab('gameplay') },
    { labelKey: 'dndWorkspace.modules.compendium', onClick: () => onViewChange('compendium') },
    { labelKey: 'dndWorkspace.modules.spellIndex', onClick: () => onViewChange('compendium') },
    { labelKey: 'dndWorkspace.modules.featIndex', onClick: () => onViewChange('compendium') },
    { labelKey: 'dndWorkspace.modules.equipmentIndex', onClick: () => onViewChange('compendium') },
    { labelKey: 'dndWorkspace.modules.classIndex', onClick: () => onViewChange('compendium') },
    { labelKey: 'dndWorkspace.modules.sources', onClick: () => onViewChange('sources') },
    { labelKey: 'dndWorkspace.modules.inventory', noteKey: 'dndWorkspace.planned.inventory', planned: true, onClick: () => setPlannedSlotLabelKey('dndWorkspace.modules.inventory') },
    { labelKey: 'dndWorkspace.modules.map', noteKey: 'dndWorkspace.planned.map', planned: true, onClick: () => setPlannedSlotLabelKey('dndWorkspace.modules.map') },
    { labelKey: 'dndWorkspace.modules.journal', noteKey: 'dndWorkspace.planned.journal', planned: true, onClick: () => setPlannedSlotLabelKey('dndWorkspace.modules.journal') },
  ];

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
  const handleNavClick = (nextView: DndWorkspaceView) => {
    // AI-LANDMARK: DND_GAMEPLAY_ENTRY_PRESERVATION
    // Workspace Play / Combat must open DND Gameplay, not the last Builder tab.
    if (nextView === 'play') {
      onOpenPlayTab('gameplay');
      return;
    }

    onViewChange(nextView);
  };

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
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#58180d]">
                  {t('dndWorkspace.dashboard.completionTitle')}
                </h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {completionRows.map((row) => (
                    <div key={row.labelKey} className="border border-[#58180d]/20 bg-white/50 p-3">
                      <div className="text-xs font-bold text-[#58180d]">{t(row.labelKey)}</div>
                      <div className="mt-1 font-mono text-[11px] text-[#2c1810]/80">{row.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={panelClass}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#58180d]">
                  {t('dndWorkspace.dashboard.modulesTitle')}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {moduleCards.map((card) => (
                    <button
                      key={card.labelKey}
                      type="button"
                      onClick={card.onClick}
                      className="border border-[#58180d]/30 bg-white/60 p-4 text-left font-bold text-[#58180d] transition hover:-translate-y-0.5 hover:border-[#58180d] hover:shadow-md"
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span>{t(card.labelKey)}</span>
                        {card.planned && (
                          <span className="shrink-0 border border-[#58180d]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/70">
                            {t('multiWorkspace.status.planned')}
                          </span>
                        )}
                      </span>
                      {card.noteKey && <span className="mt-2 block text-xs font-normal leading-relaxed text-[#58180d]/65">{t(card.noteKey)}</span>}
                    </button>
                  ))}
                </div>
                {plannedSlotLabelKey && (
                  <div className="mt-4 border border-dashed border-[#58180d]/40 bg-white/40 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#58180d]/70">
                      {t('multiWorkspace.status.planned')}
                    </div>
                    <h3 className="mt-2 font-bold text-[#58180d]">{t(plannedSlotLabelKey)}</h3>
                    <p className="mt-2 text-sm text-[#58180d]/75">{t('multiWorkspace.planned.message')}</p>
                  </div>
                )}
              </section>
            </div>
          )}

          {view === 'characters' && (
            <section className={panelClass}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#58180d]">
                {t('dndWorkspace.characters.title')}
              </h2>
              <div className="border border-[#58180d]/20 bg-white/50 p-4">
                <div className="text-xs uppercase tracking-wider text-[#58180d]/70">{t('dndWorkspace.characters.current')}</div>
                <div className="mt-1 text-lg font-bold">{characterName || t('dndWorkspace.characters.empty')}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onOpenPlayTab('creator')}
                  className="border border-[#58180d] bg-[#58180d] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#fdf6e3] hover:bg-[#2c1810]"
                >
                  {t('dndWorkspace.modules.create')}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPlayTab('sheet')}
                  className="border border-[#58180d]/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#58180d] hover:bg-[#58180d]/10"
                >
                  {t('dndWorkspace.modules.sheet')}
                </button>
              </div>
              <p className="mt-4 text-xs text-[#58180d]/60">{t('dndWorkspace.characters.hint')}</p>
            </section>
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
        </main>
      )}
    </div>
  );
}
