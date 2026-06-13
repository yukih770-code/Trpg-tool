import { useState, type ReactNode } from 'react';
import { BookOpen, LayoutDashboard, Library, ScrollText, Users } from 'lucide-react';
import { createTranslator, readStoredLocale } from '../../i18n';
import { useCpStore } from '../../store/cpStore';

/**
 * CpWorkspaceShell
 *
 * AI-LANDMARK: COC_CPRED_DND_ALIGNED_WORKSPACE_RECONSTRUCTION
 *
 * CP RED Game System Workspace Shell — aligned with DndWorkspaceShell structure.
 * Provides DND-identical IA: overview / vault / create / compendium / sources / play.
 * Existing CP RED runtime (CpCreator / CpSheet / CpGameplay / CpMarket) is preserved
 * as children and rendered under the 'play' view. No store schema, runtime rule logic,
 * or dice algorithm is modified.
 */

// Must stay compatible with NonDndWorkspaceView in PlayWorkspace.tsx
type CpWorkspaceView =
  | 'dashboard'
  | 'vault'
  | 'createMethod'
  | 'compendium'
  | 'sources'
  | 'play'
  | 'planned';

type CpWorkspaceShellProps = {
  view: CpWorkspaceView;
  currentPlayTab?: string;
  onViewChange: (view: CpWorkspaceView) => void;
  onOpenPlayTab: (tab: string) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  children: ReactNode;
};

// CP RED dark-gold theme constants
const gold = {
  navBar: 'border-b-2 border-[#d8b954]/70 bg-[#0a0a0a]/95',
  navBrand: 'text-[#f5c518]',
  navActive: 'border-[#f5c518] bg-[#f5c518] text-[#0d0d0d]',
  navInactive: 'border-[#d8b954]/30 text-[#d8b954] hover:border-[#f5c518] hover:bg-[#f5c518]/10',
  body: 'bg-[#0d0d0d] text-[#d4d4d8]',
  panel: 'rounded-lg border border-[#d8b954]/65 bg-[#0a0a0a]/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]',
  card: 'rounded-lg border border-[#d8b954]/35 bg-[#0d0d0d]/85',
  cardHover: 'hover:border-[#f5c518]',
  accent: 'text-[#d8b954]',
  accentStrong: 'text-[#f5c518]',
  badge: 'border-[#d8b954]/60 text-[#d8b954]',
  badgePlanned: 'border-[#d8b954]/40 text-[#d8b954]/70',
  statusYellow: 'border-[#d8b954]/50 bg-[#d8b954]/10 text-[#d8b954]',
  primary: 'border-[#f5c518] bg-[#f5c518] text-[#0d0d0d] hover:bg-[#d8b954]',
  secondary: 'border-[#d8b954]/60 text-[#d8b954] hover:border-[#f5c518] hover:bg-[#f5c518]/10',
  planned: 'border-dashed border-[#d8b954]/40 bg-black/10',
};

type CpEdgerunnerSheetShellProps = {
  onStartMission: () => void;
  onContinueEditing: () => void;
};

export function CpEdgerunnerSheetShell({
  onStartMission,
  onContinueEditing,
}: CpEdgerunnerSheetShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const character = useCpStore((state) => state.character);
  const displayName = character.lifePath?.handle?.trim() || character.name?.trim() || t('multiWorkspace.cp.entry.unnamed');
  const armorSummary = [
    character.armorHead ? `${t('cpWorkspace.sheet.armorHead')} SP ${character.armorHead.sp}` : null,
    character.armorBody ? `${t('cpWorkspace.sheet.armorBody')} SP ${character.armorBody.sp}` : null,
  ].filter(Boolean).join(' / ') || t('dndBuilder.common.unselected');
  const trainedSkills = Object.entries(character.skills)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const summaryCards = [
    { labelKey: 'cpWorkspace.sheet.hp', value: `${character.hp.current}/${character.hp.max}` },
    { labelKey: 'cpWorkspace.sheet.humanity', value: `${character.humanity.current}/${character.humanity.max}` },
    { labelKey: 'cpWorkspace.sheet.armor', value: armorSummary },
    { labelKey: 'cpWorkspace.sheet.move', value: character.stats.MOVE },
    { labelKey: 'cpWorkspace.sheet.ref', value: character.stats.REF },
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className={`${gold.card} p-5`}>
          <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent}`}>
            {t('cpWorkspace.sheet.eyebrow')}
          </div>
          <h2 className={`mt-2 text-3xl font-black tracking-widest ${gold.accentStrong}`}>
            {displayName}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              { labelKey: 'multiWorkspace.cp.entry.name', value: character.name || t('dndBuilder.common.unselected') },
              { labelKey: 'multiWorkspace.cp.entry.role', value: character.role || t('dndBuilder.common.unselected') },
              { labelKey: 'multiWorkspace.cp.entry.roleLevel', value: String(character.roleLevel ?? t('dndBuilder.common.unselected')) },
              { labelKey: 'cpWorkspace.sheet.eb', value: `${character.eb} eb` },
            ].map((row) => (
              <div key={row.labelKey} className="border border-white/10 bg-black/10 p-3">
                <div className={`text-[10px] font-bold uppercase tracking-wider ${gold.accent}`}>{t(row.labelKey)}</div>
                <div className="mt-1 break-words font-bold">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onStartMission}
            className={`border px-4 py-3 text-xs font-bold uppercase tracking-wider ${gold.primary}`}
          >
            {t('multiWorkspace.actions.startMission')}
          </button>
          <button
            type="button"
            onClick={onContinueEditing}
            className={`border px-4 py-3 text-xs font-bold uppercase tracking-wider ${gold.secondary}`}
          >
            {t('multiWorkspace.actions.continueEdgerunnerEditing')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaryCards.map((card) => (
          <div key={card.labelKey} className={`${gold.card} p-4`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${gold.accent}`}>
              {t(card.labelKey)}
            </div>
            <div className={`mt-2 break-words text-xl font-black ${gold.accentStrong}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className={`${gold.card} p-5`}>
          <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent}`}>
            {t('cpWorkspace.sheet.skillSummary')}
          </div>
          {trainedSkills.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {trainedSkills.map(([skillName, value]) => (
                <div key={skillName} className="flex items-center justify-between border border-white/10 bg-black/10 px-3 py-2 text-xs">
                  <span className="truncate">{skillName}</span>
                  <span className={`font-bold ${gold.accentStrong}`}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm opacity-60">{t('cpWorkspace.sheet.noSkills')}</p>
          )}
        </div>

        <div className={`${gold.card} p-5`}>
          <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent}`}>
            {t('cpWorkspace.sheet.summaryEntries')}
          </div>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
              <span>{t('cpWorkspace.compendium.equipment')}</span>
              <span className={gold.accentStrong}>{character.weapons.length}</span>
            </div>
            <div className="flex justify-between gap-3 border-b border-white/10 pb-2">
              <span>{t('cpWorkspace.compendium.market')}</span>
              <span className={gold.accentStrong}>{t('multiWorkspace.status.planned')}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>{t('cpWorkspace.compendium.cyberware')}</span>
              <span className={gold.accentStrong}>{character.cyberware.length}</span>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed opacity-60">
            {t('cpWorkspace.sheet.sheetShellNote')}
          </p>
        </div>
      </div>
    </section>
  );
}

export function CpWorkspaceShell({
  view,
  currentPlayTab = '',
  onViewChange,
  onOpenPlayTab,
  onBack,
  canGoBack = false,
  children,
}: CpWorkspaceShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const cpChar = useCpStore((state) => state.character);
  const hasCurrentCharacter = Boolean(cpChar.name?.trim() || cpChar.lifePath?.handle?.trim());
  const displayName = cpChar.lifePath?.handle?.trim() || cpChar.name?.trim();
  const [plannedSlotLabelKey, setPlannedSlotLabelKey] = useState<string | null>(null);

  // AI-LANDMARK: CPRED_WORKSPACE_CLEANUP_V1
  // CP RED top nav is the only system navigation; body sections do not repeat it as a tool grid.
  const navItems: {
    key: string;
    labelKey: string;
    icon: typeof LayoutDashboard;
    kind: 'view' | 'playTab';
    view?: CpWorkspaceView;
    tab?: string;
  }[] = [
    { key: 'dashboard',    labelKey: 'cpWorkspace.nav.overview',   icon: LayoutDashboard, kind: 'view', view: 'dashboard' },
    { key: 'vault',        labelKey: 'cpWorkspace.nav.vault',      icon: Users,           kind: 'view', view: 'vault' },
    { key: 'createMethod', labelKey: 'cpWorkspace.nav.create',     icon: BookOpen,        kind: 'view', view: 'createMethod' },
    { key: 'sheet',        labelKey: 'cpWorkspace.nav.sheet',      icon: Users,           kind: 'playTab', tab: 'sheet' },
    { key: 'gameplay',     labelKey: 'cpWorkspace.nav.mission',    icon: LayoutDashboard, kind: 'playTab', tab: 'gameplay' },
    { key: 'compendium',   labelKey: 'cpWorkspace.nav.compendium', icon: Library,         kind: 'view', view: 'compendium' },
    { key: 'sources',      labelKey: 'cpWorkspace.nav.sources',    icon: ScrollText,      kind: 'view', view: 'sources' },
  ];

  const isActiveNav = (item: (typeof navItems)[number]) => {
    if (item.kind === 'playTab') {
      return view === 'play' && currentPlayTab === item.tab;
    }
    if (view === 'planned' || view === 'play') return false;
    return view === item.view;
  };

  const handleNavClick = (item: (typeof navItems)[number]) => {
    setPlannedSlotLabelKey(null);
    if (item.kind === 'playTab' && item.tab) {
      onOpenPlayTab(item.tab);
      return;
    }
    if (item.view) {
      onViewChange(item.view);
    }
  };

  const handleBack = () => {
    if (canGoBack && onBack) {
      onBack();
    } else {
      onViewChange('dashboard');
    }
  };

  // Edgerunner data rows for cards
  const edgerunnerRows = [
    { lk: 'multiWorkspace.cp.entry.name',      v: cpChar.name                 || t('multiWorkspace.cp.entry.unnamed') },
    { lk: 'multiWorkspace.cp.entry.handle',     v: cpChar.lifePath?.handle     || t('dndBuilder.common.unselected') },
    { lk: 'multiWorkspace.cp.entry.role',       v: cpChar.role       || t('dndBuilder.common.unselected') },
    { lk: 'multiWorkspace.cp.entry.roleLevel',  v: String(cpChar.roleLevel ?? t('dndBuilder.common.unselected')) },
  ];

  const panelClass = gold.panel;

  // ── Shared: edgerunner card with 3 action buttons ──────
  const renderEdgerunnerCard = () => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_13rem]">
      <div className={`${gold.card} p-5`}>
        <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent}`}>
          {t('multiWorkspace.cp.entry.current')}
        </div>
        <h3 className="mt-2 text-2xl font-bold">{displayName || t('multiWorkspace.cp.entry.unnamed')}</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {edgerunnerRows.map((row) => (
            <div key={row.lk} className="border border-white/10 bg-black/10 p-3">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${gold.accent}`}>{t(row.lk)}</div>
              <div className="mt-1 break-words text-sm font-bold">{row.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onOpenPlayTab('sheet')}
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.secondary}`}
        >
          {t('multiWorkspace.actions.viewCharacterSheet')}
        </button>
        <button
          type="button"
          onClick={() => onOpenPlayTab('creator')}
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.secondary}`}
        >
          {t('multiWorkspace.actions.continueEdgerunnerEditing')}
        </button>
        <button
          type="button"
          onClick={() => onOpenPlayTab('gameplay')}
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.primary}`}
        >
          {t('multiWorkspace.actions.startMission')}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-mono ${gold.body}`}>

      {/* ── CP RED workspace secondary navigation ── */}
      <div className={gold.navBar}>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <BookOpen className={`h-5 w-5 ${gold.navBrand}`} />
            <span className={`font-mono text-lg font-bold tracking-widest ${gold.navBrand}`}>{t('cpWorkspace.title')}</span>
          </div>
          <nav className="flex flex-wrap gap-1" aria-label={t('cpWorkspace.title')}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveNav(item);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                    active ? gold.navActive : gold.navInactive
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

      {/* ── Play view: preserved CP RED runtime ──
          AI-LANDMARK: LEGACY_RUNTIME_EMBEDDED_MODE
          Children are embedded legacy content; this shell owns navigation chrome. */}
      {view === 'play' && children}

      {/* ── Non-play views ── */}
      {view !== 'play' && (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">

          {/* Overview / Game System Home */}
          {view === 'dashboard' && (
            <div className="flex flex-col gap-6">
              <section className={panelClass}>
                <div className={`mb-4 text-[11px] font-bold uppercase tracking-wider ${gold.accent} opacity-55`}>
                  {t('navigation.breadcrumb.platform')} / {t('navigation.breadcrumb.play')} / {t('glossary.cyberpunkRed')} / {t('navigation.gameSystemHome')}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-[0.2em] ${gold.accent}`}>
                      {t('multiWorkspace.eyebrow')}
                    </div>
                    <h1 className={`mt-2 font-mono text-3xl font-black tracking-widest ${gold.accentStrong}`}>
                      {t('multiWorkspace.cp.title')}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm opacity-75">{t('multiWorkspace.cp.subtitle')}</p>
                  </div>
                  <div className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${gold.badge}`}>
                    {t('multiWorkspace.status.entryOnly')}
                  </div>
                </div>
              </section>

              <section className={panelClass}>
                {hasCurrentCharacter ? (
                  renderEdgerunnerCard()
                ) : (
                  <div className="text-center">
                    <h2 className={`text-2xl font-bold ${gold.accentStrong}`}>
                      {t('multiWorkspace.cp.entry.empty')}
                    </h2>
                    <p className="mx-auto mt-2 max-w-xl text-sm opacity-75">
                      {t('multiWorkspace.cp.home.noActorNote')}
                    </p>
                    <button
                      type="button"
                      onClick={() => onViewChange('createMethod')}
                      className={`mt-5 border px-5 py-2 text-xs font-bold uppercase tracking-wider ${gold.primary}`}
                    >
                      {t('multiWorkspace.actions.createEdgerunner')}
                    </button>
                  </div>
                )}
                <p className={`mt-4 border-t border-white/10 pt-3 text-xs opacity-55`}>
                  {t('navigation.rulesAndDataInTopNav')}
                </p>
                <details className="mt-3 text-xs opacity-55">
                  <summary className={`cursor-pointer font-bold ${gold.accent}`}>
                    {t('navigation.platformGuidance')}
                  </summary>
                  <div className="mt-2 space-y-1">
                    <p>{t('navigation.actorAbstractionNote')}</p>
                    <p>{t('navigation.actorMultiCampaignNote')}</p>
                    <p>{t('navigation.selectedActorGuidance')}</p>
                    <p>{t('navigation.campaignGuidance')}</p>
                  </div>
                </details>
              </section>
            </div>
          )}

          {/* Edgerunner Vault */}
          {view === 'vault' && (
            <section className={panelClass}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-[0.2em] ${gold.accent}`}>
                    {t('multiWorkspace.entryPattern.eyebrow')}
                  </div>
                  <h2 className={`mt-1 text-xl font-bold ${gold.accentStrong}`}>
                    {t('multiWorkspace.cp.entry.vaultTitle')}
                  </h2>
                  <p className="mt-1 text-sm opacity-75">{t('multiWorkspace.cp.entry.vaultHint')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onViewChange('createMethod')}
                  className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.primary}`}
                >
                  {t('multiWorkspace.actions.createEdgerunner')}
                </button>
              </div>

              {hasCurrentCharacter ? (
                <>
                  {renderEdgerunnerCard()}
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className={`border ${gold.planned} p-4`}>
                      <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent}`}>
                        {t('cpWorkspace.vault.listPlaceholderTitle')}
                      </div>
                      <p className={`mt-2 text-xs leading-relaxed opacity-65`}>
                        {t('cpWorkspace.vault.listPlaceholderNote')}
                      </p>
                      <span className={`mt-3 inline-block border px-2 py-0.5 text-[10px] uppercase tracking-wider ${gold.badgePlanned}`}>
                        {t('multiWorkspace.status.planned')}
                      </span>
                    </div>
                    <div className={`border ${gold.planned} p-4`}>
                      <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent}`}>
                        {t('multiWorkspace.creation.localImportCharacter')}
                      </div>
                      <p className={`mt-2 text-xs leading-relaxed opacity-65`}>
                        {t('multiWorkspace.cp.creation.localImportNote')}
                      </p>
                      <span className={`mt-3 inline-block border px-2 py-0.5 text-[10px] uppercase tracking-wider ${gold.badgePlanned}`}>
                        {t('multiWorkspace.status.planned')}
                      </span>
                    </div>
                  </div>
                  <p className={`mt-4 border-t border-white/10 pt-3 text-xs opacity-60`}>
                    {t('multiWorkspace.cp.entry.vaultBoundary')} {t('navigation.actorAbstractionNote')}
                  </p>
                </>
              ) : (
                <div className={`rounded-lg border ${gold.planned} p-8 text-center`}>
                  <h3 className={`text-xl font-bold ${gold.accentStrong}`}>
                    {t('multiWorkspace.cp.entry.empty')}
                  </h3>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed opacity-75">
                    {t('multiWorkspace.cp.entry.emptyNote')}
                  </p>
                  <button
                    type="button"
                    onClick={() => onViewChange('createMethod')}
                    className={`mt-5 border px-5 py-2 text-xs font-bold uppercase tracking-wider ${gold.primary}`}
                  >
                    {t('multiWorkspace.actions.createEdgerunner')}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Creation Method */}
          {view === 'createMethod' && (
            <section className={panelClass}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-[0.2em] ${gold.accent}`}>
                    {t('multiWorkspace.creation.eyebrow')}
                  </div>
                  <h2 className={`mt-1 text-xl font-bold ${gold.accentStrong}`}>
                    {t('multiWorkspace.cp.creation.title')}
                  </h2>
                  <p className="mt-1 text-sm opacity-75">{t('multiWorkspace.cp.creation.subtitle')}</p>
                </div>
                <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${gold.badgePlanned}`}>
                  {t('cpWorkspace.creation.builderBoundary')}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  {
                    labelKey: 'multiWorkspace.creation.standard',
                    noteKey:  'multiWorkspace.cp.creation.standardNote',
                    planned:  false,
                    onClick:  () => onOpenPlayTab('creator'),
                  },
                  {
                    labelKey: 'multiWorkspace.creation.quick',
                    noteKey:  'multiWorkspace.cp.creation.quickNote',
                    planned:  true,
                    onClick:  () => setPlannedSlotLabelKey('multiWorkspace.creation.quick'),
                  },
                  {
                    labelKey: 'multiWorkspace.creation.localImportCharacter',
                    noteKey:  'multiWorkspace.cp.creation.localImportNote',
                    planned:  true,
                    onClick:  () => setPlannedSlotLabelKey('multiWorkspace.creation.localImportCharacter'),
                  },
                  {
                    labelKey: 'multiWorkspace.creation.workshop',
                    noteKey:  'multiWorkspace.cp.creation.workshopNote',
                    planned:  true,
                    onClick:  () => setPlannedSlotLabelKey('multiWorkspace.creation.workshop'),
                  },
                ].map((card) => (
                  <button
                    key={card.labelKey}
                    type="button"
                    onClick={card.onClick}
                    className={`min-h-32 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${
                      card.planned
                        ? `border-[#d8b954]/35 bg-[#0d0d0d]/85 ${gold.cardHover}`
                        : 'border-[#f5c518] bg-[#f5c518]/10 hover:bg-[#f5c518]/20'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className={`font-bold ${gold.accentStrong}`}>{t(card.labelKey)}</span>
                      {card.planned && (
                        <span className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-wider ${gold.badgePlanned}`}>
                          {t('multiWorkspace.status.planned')}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block text-xs leading-relaxed opacity-75">{t(card.noteKey)}</span>
                  </button>
                ))}
              </div>

              {plannedSlotLabelKey && (
                <div className={`mt-4 border ${gold.planned} p-4`}>
                  <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent} opacity-70`}>
                    {t('multiWorkspace.status.planned')}
                  </div>
                  <h3 className={`mt-2 font-bold ${gold.accentStrong}`}>{t(plannedSlotLabelKey)}</h3>
                  <p className="mt-2 text-sm opacity-75">{t('multiWorkspace.planned.message')}</p>
                </div>
              )}
            </section>
          )}

          {/* Rules Compendium (shell) */}
          {view === 'compendium' && (
            <section className={panelClass}>
              <h2 className={`mb-2 text-sm font-bold uppercase tracking-wider ${gold.accent}`}>
                {t('cpWorkspace.compendium.title')}
              </h2>
              <p className="mb-4 text-xs opacity-70">{t('cpWorkspace.compendium.note')}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { lk: 'cpWorkspace.compendium.skills',       nk: 'cpWorkspace.compendium.skillsNote' },
                  { lk: 'cpWorkspace.compendium.equipment',    nk: 'cpWorkspace.compendium.equipmentNote' },
                  { lk: 'cpWorkspace.compendium.market',       nk: 'cpWorkspace.compendium.marketNote' },
                  { lk: 'cpWorkspace.compendium.cyberware',    nk: 'cpWorkspace.compendium.cyberwareNote' },
                  { lk: 'cpWorkspace.compendium.combatRules',  nk: 'cpWorkspace.compendium.combatRulesNote' },
                  { lk: 'cpWorkspace.compendium.netrunning',   nk: 'cpWorkspace.compendium.netrunningNote' },
                ].map((card) => (
                  <div key={card.lk} className="border border-[#d8b954]/25 bg-[#0d0d0d]/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`font-bold ${gold.accent}`}>{t(card.lk)}</div>
                      <span className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-wider ${gold.badgePlanned}`}>
                        {t('multiWorkspace.status.planned')}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed opacity-65">{t(card.nk)}</p>
                  </div>
                ))}
              </div>
              <div className={`mt-4 border ${gold.planned} p-3 text-xs opacity-60`}>
                {t('cpWorkspace.compendium.planned')}
              </div>
            </section>
          )}

          {/* Source Status / System Health (shell) */}
          {view === 'sources' && (
            <section className={panelClass}>
              <h2 className={`mb-4 text-sm font-bold uppercase tracking-wider ${gold.accent}`}>
                {t('cpWorkspace.sources.title')}
              </h2>
              <p className="mb-4 text-xs opacity-70">{t('cpWorkspace.sources.note')}</p>
              <div className="space-y-3">
                <div className="border border-[#d8b954]/25 bg-[#0d0d0d]/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className={`mr-2 border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${gold.badgePlanned}`}>
                        {t('cpWorkspace.sources.core')}
                      </span>
                      <span className={`font-bold ${gold.accent}`}>{t('cpWorkspace.sources.coreSource')}</span>
                    </div>
                    <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${gold.statusYellow}`}>
                      {t('cpWorkspace.sources.coreStatus')}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-[11px] opacity-60">
                    sourceId: {t('cpWorkspace.sources.coreSourceId')}
                  </div>
                  <p className="mt-1 text-xs opacity-75">{t('cpWorkspace.sources.coreNote')}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    { title: 'cpWorkspace.sources.runtimeReady', note: 'cpWorkspace.sources.runtimeReadyNote' },
                    { title: 'cpWorkspace.sources.indexedOnly', note: 'cpWorkspace.sources.indexedOnlyNote' },
                    { title: 'cpWorkspace.sources.plannedOnly', note: 'cpWorkspace.sources.plannedOnlyNote' },
                  ].map((item) => (
                    <div key={item.title} className="border border-[#d8b954]/20 bg-black/10 p-3">
                      <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent}`}>
                        {t(item.title)}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed opacity-65">{t(item.note)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`mt-4 border ${gold.planned} p-3 text-xs opacity-60`}>
                {t('cpWorkspace.sources.planned')}
              </div>
            </section>
          )}

          {/* Planned slot */}
          {view === 'planned' && (
            <div className="flex min-h-[60vh] items-center justify-center">
              <section className={`w-full max-w-2xl ${panelClass}`}>
                <div className={`text-xs font-bold uppercase tracking-[0.2em] ${gold.accent}`}>
                  {t('multiWorkspace.status.planned')}
                </div>
                <h1 className={`mt-3 text-2xl font-bold ${gold.accentStrong}`}>
                  {t('multiWorkspace.planned.title')}
                </h1>
                <p className="mt-3 text-sm leading-relaxed opacity-75">
                  {t('multiWorkspace.planned.message')}
                </p>
                <button
                  type="button"
                  onClick={handleBack}
                  className={`mt-5 border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.secondary}`}
                >
                  {canGoBack && onBack
                    ? t('navigation.backOneLevel')
                    : t('multiWorkspace.actions.backToWorkspace')}
                </button>
              </section>
            </div>
          )}

        </main>
      )}
    </div>
  );
}
