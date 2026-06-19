import { useState, type ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { createTranslator, readStoredLocale } from '../../i18n';
import { useCocStore } from '../../store/cocStore';
// AI-LANDMARK: COC_ACTOR_VAULT_LIBRARY_ADOPTION_V1
import { ActorVaultLibraryShell } from '../../components/platform/ActorVaultLibraryShell';
import { CampaignLibraryShell } from '../../components/platform/CampaignLibraryShell';
import { SystemWorkspaceEntryShell } from '../../components/platform/SystemWorkspaceEntryShell';
import { SystemRuleSourcesShell, type SystemRuleSourcesTheme } from '../../components/platform/SystemRuleSourcesShell';
import { COC_RULE_SOURCES } from './cocRuleSourcesAdapter';
import {
  buildCocActorSummary,
  buildCocVaultStats,
  buildCocSortOptions,
  buildCocVaultShellStrings,
  buildCocVaultAdapterStrings,
  COC_VAULT_COLOR_THEME,
} from './cocActorVaultAdapter';
import { deriveVaultSummaries } from '../../lib/platform/actorVault';
import type { ActorVaultAdapter } from '../../lib/platform/actorVault';
import type { CocCharacter } from '../../lib/coc-types';
import type { CampaignActorAddReturnContext } from '../../lib/platform/campaignFlow';

/**
 * CocWorkspaceShell
 *
 * AI-LANDMARK: COC_CPRED_DND_ALIGNED_WORKSPACE_RECONSTRUCTION
 * AI-LANDMARK: COC_WORKSPACE_CLEANUP_V1  (sheet view shell added)
 * AI-LANDMARK: COC_WORKSPACE_CONTRACT_ALIGNMENT_V1
 *
 * COC Game System Workspace Shell — aligned with DndWorkspaceShell structure.
 * Provides DND-identical IA: overview / vault / create / compendium / sources / play.
 * Existing COC runtime (CocCreator / CocSheet / CocGameplay) is preserved as children
 * and rendered under the 'play' view. No store schema, runtime rule logic, or dice
 * algorithm is modified.
 *
 * Contract Alignment v1: top nav limited to generic platform Sections only.
 * Actor Vault is the default/root user entry; overview/dashboard is retained
 * as low-frequency System Info, not as a primary nav item. creationMethod,
 * sheet, and runtime are Actor/Creation context — accessible via CTAs only.
 * builder / sheet / runtime must NOT appear as peer top-nav items.
 */

// Must stay compatible with NonDndWorkspaceView in PlayWorkspace.tsx
type CocWorkspaceView =
  | 'dashboard'
  | 'vault'
  | 'campaigns'
  | 'createCampaign'
  | 'createMethod'
  | 'sheet'
  | 'compendium'
  | 'sources'
  | 'ruleSources'
  | 'play'
  | 'planned';

type CocWorkspaceShellProps = {
  view: CocWorkspaceView;
  currentPlayTab?: string;
  onViewChange: (view: CocWorkspaceView) => void;
  onOpenPlayTab: (tab: string) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  children: ReactNode;
};

// COC dark-teal theme constants
const teal = {
  navBar: 'border-b-2 border-[#2f7f68]/70 bg-[#0d1211]/95',
  navBrand: 'text-[#5aa58f]',
  navActive: 'border-[#2f7f68] bg-[#2f7f68] text-[#06100d]',
  navInactive: 'border-[#2f7f68]/30 text-[#8fb7aa] hover:border-[#2f7f68] hover:bg-[#2f7f68]/10',
  body: 'bg-[#151a18] text-[#d4d4d8]',
  panel: 'rounded-lg border border-[#2f7f68]/65 bg-[#0f1413]/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.38)]',
  card: 'rounded-lg border border-[#2f7f68]/35 bg-[#101816]/85',
  cardHover: 'hover:border-[#2f7f68]',
  accent: 'text-[#8fb7aa]',
  accentStrong: 'text-[#5aa58f]',
  badge: 'border-[#2f7f68]/60 text-[#8fb7aa]',
  badgePlanned: 'border-[#2f7f68]/40 text-[#8fb7aa]/70',
  statusGreen: 'border-[#2f7f68]/50 bg-[#2f7f68]/10 text-[#2f7f68]',
  primary: 'border-[#2f7f68] bg-[#2f7f68] text-[#06100d] hover:bg-[#8fb7aa]',
  secondary: 'border-[#2f7f68]/60 text-[#8fb7aa] hover:border-[#2f7f68] hover:bg-[#2f7f68]/10',
  planned: 'border-dashed border-[#2f7f68]/40 bg-black/10',
};

type CocBuilderStep =
  | 'identity'
  | 'characteristics'
  | 'occupation'
  | 'skills'
  | 'backstory'
  | 'equipment'
  | 'review';

type CocInvestigatorBuilderShellProps = {
  onOpenSheet: () => void;
  onStartInvestigation: () => void;
};

// AI-LANDMARK: COC_BUILDER_BG3_LIKE_SHELL_V1
// Shell-only BG3-like COC builder. Reads current investigator data for preview;
// does not write store fields, recalculate rules, or change save format.
export function CocInvestigatorBuilderShell({
  onOpenSheet,
  onStartInvestigation,
}: CocInvestigatorBuilderShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const character = useCocStore((state) => state.character);
  const [step, setStep] = useState<CocBuilderStep>('identity');
  const unselected = t('dndBuilder.common.unselected');
  const displayName = character.name?.trim() || t('multiWorkspace.coc.entry.unnamed');
  const runtimePools = {
    hp: character.runtime?.hp ?? character.hp,
    mp: character.runtime?.mp ?? character.mp,
    san: character.runtime?.san ?? { current: character.sanity.current, max: character.sanity.max },
    luck: character.runtime?.luck ?? { current: character.luck.current },
  };

  const steps: {
    id: CocBuilderStep;
    labelKey: string;
    hintKey: string;
    status: 'complete' | 'planned' | 'pending';
  }[] = [
    { id: 'identity',        labelKey: 'cocBuilder.steps.identity',        hintKey: 'cocBuilder.hints.identity',        status: character.name ? 'complete' : 'pending' },
    { id: 'characteristics', labelKey: 'cocBuilder.steps.characteristics', hintKey: 'cocBuilder.hints.characteristics', status: Object.values(character.characteristics).some(Boolean) ? 'complete' : 'pending' },
    { id: 'occupation',      labelKey: 'cocBuilder.steps.occupation',      hintKey: 'cocBuilder.hints.occupation',      status: character.occupation ? 'complete' : 'planned' },
    { id: 'skills',          labelKey: 'cocBuilder.steps.skills',          hintKey: 'cocBuilder.hints.skills',          status: 'planned' },
    { id: 'backstory',       labelKey: 'cocBuilder.steps.backstory',       hintKey: 'cocBuilder.hints.backstory',       status: 'planned' },
    { id: 'equipment',       labelKey: 'cocBuilder.steps.equipment',       hintKey: 'cocBuilder.hints.equipment',       status: 'planned' },
    { id: 'review',          labelKey: 'cocBuilder.steps.review',          hintKey: 'cocBuilder.hints.review',          status: character.name ? 'complete' : 'pending' },
  ];

  const characteristicRows = Object.entries(character.characteristics);
  const topSkills = character.skills
    .filter(skill => skill.isOccupational || skill.isPersonal || skill.value > skill.baseValue)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const statusLabel = (status: (typeof steps)[number]['status']) => {
    if (status === 'complete') return t('cocBuilder.status.complete');
    if (status === 'planned') return t('multiWorkspace.status.planned');
    return t('cocBuilder.status.pending');
  };

  const renderField = (labelKey: string, value: string | number | undefined) => (
    <div className="rounded border border-[#2f7f68]/25 bg-black/10 p-3">
      <div className={`text-[10px] font-bold uppercase tracking-wider ${teal.accent}`}>{t(labelKey)}</div>
      <div className="mt-1 break-words text-sm font-bold">{value || unselected}</div>
    </div>
  );

  const sectionHeader = (titleKey: string, noteKey: string) => (
    <div className="mb-4 border-b border-[#2f7f68]/20 pb-3">
      <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${teal.accent}`}>
        {t('cocBuilder.currentStep')}
      </div>
      <h2 className={`mt-1 text-2xl font-bold ${teal.accentStrong}`}>{t(titleKey)}</h2>
      <p className="mt-1 text-sm leading-relaxed opacity-70">{t(noteKey)}</p>
    </div>
  );

  const renderStep = () => {
    if (step === 'identity') {
      return (
        <section className={teal.panel}>
          {sectionHeader('cocBuilder.steps.identity', 'cocBuilder.descriptions.identity')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renderField('multiWorkspace.coc.entry.name', character.name)}
            {renderField('cocBuilder.fields.player', character.player)}
            {renderField('multiWorkspace.coc.entry.age', character.age)}
            {renderField('cocBuilder.fields.era', t('cocBuilder.placeholders.era'))}
            {renderField('multiWorkspace.coc.entry.occupation', character.occupation)}
            {renderField('cocBuilder.fields.residence', character.residence)}
          </div>
          <p className="mt-4 rounded border border-dashed border-[#2f7f68]/30 bg-black/10 p-3 text-xs opacity-65">
            {t('cocBuilder.shellOnlyNote')}
          </p>
        </section>
      );
    }

    if (step === 'characteristics') {
      return (
        <section className={teal.panel}>
          {sectionHeader('cocBuilder.steps.characteristics', 'cocBuilder.descriptions.characteristics')}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {characteristicRows.map(([key, value]) => (
              <div key={key} className="rounded border border-[#2f7f68]/25 bg-black/10 p-3 text-center">
                <div className={`text-xs font-bold ${teal.accent}`}>{key}</div>
                <div className={`mt-1 text-2xl font-black ${teal.accentStrong}`}>{value || '--'}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs opacity-60">{t('cocBuilder.descriptions.characteristicsReadOnly')}</p>
        </section>
      );
    }

    if (step === 'occupation') {
      return (
        <section className={teal.panel}>
          {sectionHeader('cocBuilder.steps.occupation', 'cocBuilder.descriptions.occupation')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renderField('multiWorkspace.coc.entry.occupation', character.occupation)}
            {renderField('cocBuilder.fields.occupationStyle', t('cocBuilder.placeholders.occupationStyle'))}
          </div>
          <PlaceholderBox titleKey="cocBuilder.placeholders.fullOccupationRulesTitle" noteKey="cocBuilder.placeholders.fullOccupationRulesNote" />
        </section>
      );
    }

    if (step === 'skills') {
      return (
        <section className={teal.panel}>
          {sectionHeader('cocBuilder.steps.skills', 'cocBuilder.descriptions.skills')}
          {topSkills.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {topSkills.map(skill => (
                <div key={skill.name} className="flex items-center justify-between rounded border border-[#2f7f68]/25 bg-black/10 px-3 py-2 text-xs">
                  <span className="truncate">{skill.name}</span>
                  <span className={`ml-3 font-bold ${teal.accentStrong}`}>{skill.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <PlaceholderBox titleKey="cocBuilder.placeholders.skillAllocationTitle" noteKey="cocBuilder.placeholders.skillAllocationNote" />
          )}
        </section>
      );
    }

    if (step === 'backstory') {
      return (
        <section className={teal.panel}>
          {sectionHeader('cocBuilder.steps.backstory', 'cocBuilder.descriptions.backstory')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renderField('cocBuilder.fields.personalDescription', character.backstory.personalDescription)}
            {renderField('cocBuilder.fields.ideologyBeliefs', character.backstory.ideologyBeliefs)}
            {renderField('cocBuilder.fields.significantPeople', character.backstory.significantPeople)}
            {renderField('cocBuilder.fields.meaningfulLocations', character.backstory.meaningfulLocations)}
          </div>
          <PlaceholderBox titleKey="cocBuilder.placeholders.backstoryTitle" noteKey="cocBuilder.placeholders.backstoryNote" />
        </section>
      );
    }

    if (step === 'equipment') {
      return (
        <section className={teal.panel}>
          {sectionHeader('cocBuilder.steps.equipment', 'cocBuilder.descriptions.equipment')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {renderField('cocBuilder.fields.inventory', character.inventory.join(', '))}
            {renderField('cocBuilder.fields.cash', character.finances.cash)}
            {renderField('cocBuilder.fields.weapons', character.weapons.map(w => w.name).join(', '))}
          </div>
          <PlaceholderBox titleKey="cocBuilder.placeholders.equipmentTitle" noteKey="cocBuilder.placeholders.equipmentNote" />
        </section>
      );
    }

    return (
      <section className={teal.panel}>
        {sectionHeader('cocBuilder.steps.review', 'cocBuilder.descriptions.review')}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {renderField('multiWorkspace.coc.entry.name', character.name)}
          {renderField('multiWorkspace.coc.entry.occupation', character.occupation)}
          {renderField('cocBuilder.fields.resources', `HP ${runtimePools.hp.current}/${runtimePools.hp.max} · MP ${runtimePools.mp.current}/${runtimePools.mp.max} · SAN ${runtimePools.san.current}/${runtimePools.san.max}`)}
          {renderField('cocBuilder.fields.dataStatus', t('cocBuilder.status.shell'))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onOpenSheet} className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${teal.secondary}`}>
            {t('multiWorkspace.actions.viewInvestigatorSheet')}
          </button>
          <button type="button" onClick={onStartInvestigation} className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${teal.primary}`}>
            {t('multiWorkspace.actions.startInvestigation')}
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] overflow-x-hidden">
      <section className={`${teal.panel} mb-4`}>
        <div className={`text-xs font-bold uppercase tracking-[0.22em] ${teal.accent}`}>
          {t('cocBuilder.header.eyebrow')}
        </div>
        <h1 className={`mt-2 text-3xl font-bold ${teal.accentStrong}`}>{t('cocBuilder.header.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-75">{t('cocBuilder.header.subtitle')}</p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className={`${teal.card} p-3`}>
            <div className={`mb-2 hidden text-[10px] font-bold uppercase tracking-[0.22em] ${teal.accent} md:block`}>
              {t('cocBuilder.nav.title')}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
              {steps.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`min-w-[116px] rounded border px-3 py-2 text-left transition md:min-w-0 ${
                    step === item.id
                      ? `${teal.navActive}`
                      : `${teal.navInactive} bg-black/10`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{t(item.labelKey)}</span>
                    <span className="text-[9px] opacity-70">{statusLabel(item.status)}</span>
                  </div>
                  <div className={`mt-1 hidden text-[10px] leading-tight md:block ${step === item.id ? 'text-[#06100d]/70' : 'text-[#8fb7aa]/60'}`}>
                    {t(item.hintKey)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0">{renderStep()}</main>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className={`${teal.card} p-4`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${teal.accent}`}>
              {t('cocBuilder.summary.title')}
            </h2>
            <div className="mt-3 space-y-2">
              {[
                [t('multiWorkspace.coc.entry.name'), displayName],
                [t('multiWorkspace.coc.entry.occupation'), character.occupation || unselected],
                [t('cocBuilder.fields.era'), t('cocBuilder.placeholders.era')],
                ['HP / MP', `${runtimePools.hp.current}/${runtimePools.hp.max} · ${runtimePools.mp.current}/${runtimePools.mp.max}`],
                ['SAN / Luck', `${runtimePools.san.current}/${runtimePools.san.max} · ${runtimePools.luck.current}`],
                [t('cocBuilder.fields.keyCharacteristics'), `INT ${character.characteristics.INT || '--'} / POW ${character.characteristics.POW || '--'} / EDU ${character.characteristics.EDU || '--'}`],
                [t('cocBuilder.fields.skillSummary'), topSkills.length ? topSkills.map(s => `${s.name} ${s.value}`).join(' / ') : t('cocBuilder.placeholders.skillSummary')],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 text-xs last:border-0">
                  <span className={`shrink-0 font-bold uppercase tracking-wider ${teal.accent}`}>{label}</span>
                  <span className="min-w-0 text-right font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded border border-dashed border-[#2f7f68]/30 bg-black/10 p-3 text-xs leading-relaxed opacity-70">
              <div className={`font-bold ${teal.accent}`}>{t('cocBuilder.nextStep')}</div>
              <p className="mt-1">{t('cocBuilder.nextStepNote')}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={onOpenSheet} className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${teal.secondary}`}>
                {t('multiWorkspace.actions.viewInvestigatorSheet')}
              </button>
              <button type="button" onClick={onStartInvestigation} className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${teal.primary}`}>
                {t('multiWorkspace.actions.startInvestigation')}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PlaceholderBox({ titleKey, noteKey }: { titleKey: string; noteKey: string }) {
  const { t } = createTranslator(readStoredLocale());
  return (
    <div className="mt-4 rounded border border-dashed border-[#2f7f68]/35 bg-black/10 p-4">
      <div className="text-xs font-bold uppercase tracking-wider text-[#8fb7aa]">{t(titleKey)}</div>
      <p className="mt-2 text-sm leading-relaxed opacity-70">{t(noteKey)}</p>
    </div>
  );
}

export function CocWorkspaceShell({
  view,
  currentPlayTab = '',
  onViewChange,
  onOpenPlayTab,
  onBack,
  canGoBack = false,
  children,
}: CocWorkspaceShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const cocChar = useCocStore((state) => state.character);
  const hasCurrentCharacter = Boolean(cocChar.name?.trim() || cocChar.occupation?.trim());
  const displayName = cocChar.name?.trim();
  const [plannedSlotLabelKey, setPlannedSlotLabelKey] = useState<string | null>(null);
  const [campaignActorAddContext, setCampaignActorAddContext] =
    useState<CampaignActorAddReturnContext | null>(null);

  const cocRuleSourcesTheme: SystemRuleSourcesTheme = {
    panel: teal.panel,
    card: 'rounded-md border border-[#2f7f68]/30 bg-[#101816]/70',
    title: teal.accentStrong,
    muted: teal.accent,
    badgeEnabled: teal.statusGreen,
    badgePlanned: teal.badgePlanned,
    kindBadge: teal.badge,
  };

  const handleBack = () => {
    if (canGoBack && onBack) {
      onBack();
    } else {
      onViewChange('vault');
    }
  };

  const handleRequestAddActorForCampaign = (context: CampaignActorAddReturnContext) => {
    setCampaignActorAddContext(context);
    onViewChange('createMethod');
  };

  const handleReturnToCampaignEntry = () => {
    onViewChange('campaigns');
  };

  // Investigator data rows for cards
  const investigatorRows = [
    { lk: 'multiWorkspace.coc.entry.name',      v: cocChar.name       || t('multiWorkspace.coc.entry.unnamed') },
    { lk: 'multiWorkspace.coc.entry.occupation', v: cocChar.occupation || t('dndBuilder.common.unselected') },
    { lk: 'multiWorkspace.coc.entry.age',        v: String(cocChar.age || t('dndBuilder.common.unselected')) },
    { lk: 'multiWorkspace.coc.entry.residence',  v: cocChar.residence  || t('dndBuilder.common.unselected') },
  ];

  // Sheet view: runtime pool values (prefer runtime if initialized)
  const sheetRp = {
    hp:   cocChar.runtime?.hp   ?? cocChar.hp,
    mp:   cocChar.runtime?.mp   ?? cocChar.mp,
    san:  cocChar.runtime?.san  ?? { current: cocChar.sanity.current, max: cocChar.sanity.max },
    luck: cocChar.runtime?.luck ?? { current: cocChar.luck.current },
  };
  const sheetChars = [
    ['STR', cocChar.characteristics.STR],
    ['CON', cocChar.characteristics.CON],
    ['SIZ', cocChar.characteristics.SIZ],
    ['DEX', cocChar.characteristics.DEX],
    ['APP', cocChar.characteristics.APP],
    ['INT', cocChar.characteristics.INT],
    ['POW', cocChar.characteristics.POW],
    ['EDU', cocChar.characteristics.EDU],
  ] as [string, number][];
  const sheetTopSkills = cocChar.skills
    .filter(s => s.isOccupational || s.isPersonal || s.value > s.baseValue)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const panelClass = teal.panel;

  // ── Actor Vault Library (platform shell) ────────────────────────────────────
  // AI-LANDMARK: COC_ACTOR_VAULT_LIBRARY_ADOPTION_V1
  // V1: COC is single-actor. The store holds one CocCharacter; we wrap it as a
  // one-element array. No store schema / save-format change is made here.
  const _cocAdapterStrings = buildCocVaultAdapterStrings(t);
  const _cocVaultAdapter: ActorVaultAdapter<CocCharacter> = {
    getActors:        () => cocChar.name?.trim() ? [cocChar] : [],
    getActiveActorId: () => cocChar.id?.trim() || 'coc-single',
    getSummary:       (char, index) => buildCocActorSummary(char, index, _cocAdapterStrings),
    getStats:         (summaries) => buildCocVaultStats(summaries),
    getAddOptions:    () => [],
    getSortOptions:   () => buildCocSortOptions({
      default: t('cocWorkspace.characterLibrary.sort.default'),
      name:    t('cocWorkspace.characterLibrary.sort.name'),
    }),
    getDefaultSortKey: () => 'default',
    onEnterActor:      (_id) => { onViewChange('sheet'); },
  };
  const _cocVaultSummaries = deriveVaultSummaries(_cocVaultAdapter);
  const _cocVaultStats     = _cocVaultAdapter.getStats(_cocVaultSummaries);
  const _cocVaultSortOpts  = _cocVaultAdapter.getSortOptions();
  const _cocVaultStrings   = buildCocVaultShellStrings(t);

  // ── Shared: investigator card with 3 action buttons ──────
  const renderInvestigatorCard = () => (
    <div className={`grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_13rem]`}>
      <div className={`${teal.card} p-5`}>
        <div className={`text-xs font-bold uppercase tracking-wider ${teal.accent}`}>
          {t('multiWorkspace.coc.entry.current')}
        </div>
        <h3 className="mt-2 text-2xl font-bold">{displayName || t('multiWorkspace.coc.entry.unnamed')}</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {investigatorRows.map((row) => (
            <div key={row.lk} className="border border-white/10 bg-black/10 p-3">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${teal.accent}`}>{t(row.lk)}</div>
              <div className="mt-1 break-words text-sm font-bold">{row.v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* AI-LANDMARK: ACTOR_VAULT_RESPONSIBILITY_CLEANUP_HIDE_RUNTIME_CTA_V1
          AI-LANDMARK: ACTOR_VAULT_ACTION_HIERARCHY_CLEANUP_V1
          AI-LANDMARK: ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1
          Actor card CTA: Tier-D View Sheet only. Edit excluded (goes to Creation Method, not object-level).
          Runtime (startInvestigation) gated. Replace is low-freq bottom entry on vault page. */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onViewChange('sheet')}
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${teal.secondary}`}
        >
          {t('multiWorkspace.actions.viewInvestigatorSheet')}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-serif ${teal.body}`}>

      {/* ── COC workspace shell brand ── */}
      <div className={teal.navBar}>
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <BookOpen className={`h-5 w-5 ${teal.navBrand}`} />
            <span className={`font-elite text-lg ${teal.navBrand}`}>{t('cocWorkspace.title')}</span>
          </div>
        </div>
      </div>

      {/* ── Play view: preserved COC runtime ──
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
                <div className={`mb-4 text-[11px] font-bold uppercase tracking-wider ${teal.accent} opacity-55`}>
                  {t('navigation.breadcrumb.platform')} / {t('navigation.breadcrumb.play')} / {t('glossary.coc7e')} / {t('navigation.systemInfo')}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-[0.2em] ${teal.accent}`}>
                      {t('multiWorkspace.eyebrow')}
                    </div>
                    <h1 className={`mt-2 font-coc-title text-3xl ${teal.accentStrong}`}>
                      {t('multiWorkspace.coc.title')}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm opacity-75">{t('multiWorkspace.coc.subtitle')}</p>
                  </div>
                  <div className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${teal.badge}`}>
                    {t('multiWorkspace.status.entryOnly')}
                  </div>
                </div>
              </section>

              <SystemWorkspaceEntryShell
                systemName={t('glossary.coc7e')}
                tone="coc"
                actorNoteKey="systemWorkspaceEntry.coc.actorNote"
                campaignNoteKey="systemWorkspaceEntry.coc.campaignNote"
                onEnterActors={() => onViewChange('vault')}
                onEnterCampaigns={() => {
                  setCampaignActorAddContext(null);
                  onViewChange('campaigns');
                }}
              />
            </div>
          )}

          {/* Actor Vault — AI-LANDMARK: COC_ACTOR_VAULT_LIBRARY_ADOPTION_V1
              Replaced bespoke vault JSX with platform ActorVaultLibraryShell.
              Previously: ACTOR_VAULT_ACTION_HIERARCHY_CLEANUP_V1 / ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1 /
              ACTOR_VAULT_EXISTING_ADD_SPLIT_V1 — all landmark contracts still hold; now enforced by the platform shell.
              onEnterActor opens the COC sheet. onRequestAdd navigates to createMethod.
              V1: COC single-actor — getActors() returns [] or [cocChar]; home card shows stat 0 or 1. */}
          {view === 'vault' && (
            <ActorVaultLibraryShell
              summaries={_cocVaultSummaries}
              stats={_cocVaultStats}
              sortOptions={_cocVaultSortOpts}
              defaultSortKey="default"
              onEnterActor={(_id) => onViewChange('sheet')}
              onRequestAdd={() => {
                setCampaignActorAddContext(null);
                onViewChange('createMethod');
              }}
              strings={_cocVaultStrings}
              colorTheme={COC_VAULT_COLOR_THEME}
              panelClassName={panelClass}
            />
          )}

          {view === 'campaigns' && (
            <CampaignLibraryShell
              systemId="coc7e"
              systemName={t('glossary.coc7e')}
              tone="coc"
              initialMode={campaignActorAddContext ? 'detail' : undefined}
              onRequestAddActorForCampaign={handleRequestAddActorForCampaign}
              onAddCampaign={() => onViewChange('createCampaign')}
              panelClassName={panelClass}
            />
          )}

          {view === 'createCampaign' && (
            <CampaignLibraryShell
              systemId="coc7e"
              systemName={t('glossary.coc7e')}
              tone="coc"
              mode="create"
              panelClassName={panelClass}
            />
          )}

          {/* Creation Method */}
          {view === 'createMethod' && (
            <section className={panelClass}>
              {campaignActorAddContext && (
                <div className="mb-4 rounded border border-[#2f7f68]/35 bg-black/10 p-4 text-sm">
                  <div className={`font-bold ${teal.accentStrong}`}>
                    {t('campaignLibrary.returnContext.addingActorPrefix')}「{campaignActorAddContext.campaignTitle}
                    {campaignActorAddContext.campaignRoomCode ? ` #${campaignActorAddContext.campaignRoomCode}` : ''}」
                    {t('campaignLibrary.returnContext.addingActorSuffix')}
                  </div>
                  <p className="mt-1 text-xs opacity-70">
                    {t('campaignLibrary.returnContext.afterComplete')}
                  </p>
                  <button
                    type="button"
                    onClick={handleReturnToCampaignEntry}
                    className={`mt-3 border px-3 py-1.5 text-xs font-bold transition ${teal.secondary}`}
                  >
                    {campaignActorAddContext.returnLabel}
                  </button>
                </div>
              )}
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-[0.2em] ${teal.accent}`}>
                    {t('multiWorkspace.creation.eyebrow')}
                  </div>
                  <h2 className={`mt-1 text-xl font-bold ${teal.accentStrong}`}>
                    {t('multiWorkspace.coc.creation.title')}
                  </h2>
                  <p className="mt-1 text-sm opacity-75">{t('multiWorkspace.coc.creation.subtitle')}</p>
                </div>
                <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${teal.badgePlanned}`}>
                  {t('cocWorkspace.creation.builderBoundary')}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  {
                    labelKey: 'multiWorkspace.creation.standard',
                    noteKey:  'multiWorkspace.coc.creation.standardNote',
                    planned:  false,
                    onClick:  () => onOpenPlayTab('creator'),
                  },
                  {
                    labelKey: 'multiWorkspace.creation.quick',
                    noteKey:  'multiWorkspace.coc.creation.quickNote',
                    planned:  true,
                    onClick:  () => setPlannedSlotLabelKey('multiWorkspace.creation.quick'),
                  },
                  {
                    labelKey: 'multiWorkspace.creation.localImportInvestigator',
                    noteKey:  'multiWorkspace.coc.creation.localImportNote',
                    planned:  true,
                    onClick:  () => setPlannedSlotLabelKey('multiWorkspace.creation.localImportInvestigator'),
                  },
                  {
                    labelKey: 'multiWorkspace.creation.workshop',
                    noteKey:  'multiWorkspace.coc.creation.workshopNote',
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
                        ? `border-[#2f7f68]/35 bg-[#101816]/85 ${teal.cardHover}`
                        : 'border-[#2f7f68] bg-[#2f7f68]/10 hover:bg-[#2f7f68]/20'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className={`font-bold ${teal.accentStrong}`}>{t(card.labelKey)}</span>
                      {card.planned && (
                        <span className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-wider ${teal.badgePlanned}`}>
                          {t('multiWorkspace.status.planned')}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block text-xs leading-relaxed opacity-75">{t(card.noteKey)}</span>
                  </button>
                ))}
              </div>

              {plannedSlotLabelKey && (
                <div className={`mt-4 border ${teal.planned} p-4`}>
                  <div className={`text-xs font-bold uppercase tracking-wider ${teal.accent} opacity-70`}>
                    {t('multiWorkspace.status.planned')}
                  </div>
                  <h3 className={`mt-2 font-bold ${teal.accentStrong}`}>{t(plannedSlotLabelKey)}</h3>
                  <p className="mt-2 text-sm opacity-75">{t('multiWorkspace.planned.message')}</p>
                </div>
              )}
              <p className={`mt-4 border-t border-white/10 pt-3 text-[10px] opacity-50`}>
                {t('cocWorkspace.creation.actorFlowNote')}
              </p>
            </section>
          )}

          {/* AI-LANDMARK: COC_WORKSPACE_CLEANUP_V1
              Investigator Sheet shell — summary view, not the full CocSheet runtime.
              Reads from store directly; no rule logic, no save-format change. */}
          {view === 'sheet' && (
            <section className={panelClass}>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className={`text-xs font-bold uppercase tracking-[0.2em] ${teal.accent}`}>
                    {t('cocWorkspace.nav.sheet')}
                  </div>
                  <h2 className={`mt-1 text-xl font-bold ${teal.accentStrong}`}>
                    {displayName || t('multiWorkspace.coc.entry.unnamed')}
                  </h2>
                  {cocChar.occupation && (
                    <p className="mt-0.5 text-sm opacity-65">{cocChar.occupation}</p>
                  )}
                </div>
                {/* AI-LANDMARK: ACTOR_VAULT_RESPONSIBILITY_CLEANUP_HIDE_RUNTIME_CTA_V1
                    Sheet header: runtime CTAs (startInvestigation / continueEditing) removed.
                    Runtime entry requires Module / Scene / Session architecture. */}
              </div>

              {hasCurrentCharacter ? (
                <div className="space-y-4">
                  {/* HP / MP / SAN / Luck */}
                  <div className={`${teal.card} p-4`}>
                    <div className={`mb-3 text-[10px] font-bold uppercase tracking-wider ${teal.accent}`}>
                      {t('cocWorkspace.sheet.resources')}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {([
                        { label: 'HP',   cur: sheetRp.hp.current,   max: sheetRp.hp.max },
                        { label: 'MP',   cur: sheetRp.mp.current,   max: sheetRp.mp.max },
                        { label: 'SAN',  cur: sheetRp.san.current,  max: sheetRp.san.max },
                        { label: 'Luck', cur: sheetRp.luck.current, max: undefined },
                      ] as { label: string; cur: number; max: number | undefined }[]).map(r => (
                        <div key={r.label} className="border border-white/10 bg-black/10 p-2 text-center">
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${teal.accent}`}>{r.label}</div>
                          <div className="mt-1 text-lg font-bold leading-none">
                            {r.cur}
                            {r.max !== undefined && (
                              <span className="ml-0.5 text-xs opacity-45">/{r.max}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Characteristics */}
                  <div className={`${teal.card} p-4`}>
                    <div className={`mb-3 text-[10px] font-bold uppercase tracking-wider ${teal.accent}`}>
                      {t('cocWorkspace.sheet.characteristics')}
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                      {sheetChars.map(([label, val]) => (
                        <div key={label} className="border border-white/10 bg-black/10 p-2 text-center">
                          <div className={`text-[10px] font-bold ${teal.accent}`}>{label}</div>
                          <div className="mt-0.5 text-base font-bold">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills summary */}
                  {sheetTopSkills.length > 0 && (
                    <div className={`${teal.card} p-4`}>
                      <div className={`mb-3 text-[10px] font-bold uppercase tracking-wider ${teal.accent}`}>
                        {t('cocWorkspace.sheet.skills')}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {sheetTopSkills.map(sk => (
                          <div key={sk.name} className="flex items-center justify-between border border-white/10 bg-black/10 px-2 py-1.5">
                            <span className="truncate text-xs">{sk.name}</span>
                            <span className={`ml-2 shrink-0 text-xs font-bold ${teal.accentStrong}`}>{sk.value}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] opacity-40">{t('cocWorkspace.sheet.skillsNote')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`rounded-lg border ${teal.planned} p-8 text-center`}>
                  <p className="text-sm opacity-75">{t('multiWorkspace.coc.entry.empty')}</p>
                  <button
                    type="button"
                    onClick={() => onViewChange('createMethod')}
                    className={`mt-4 border px-4 py-2 text-xs font-bold uppercase tracking-wider ${teal.primary}`}
                  >
                    {t('multiWorkspace.actions.createInvestigator')}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Rules Compendium (shell) */}
          {view === 'compendium' && (
            <section className={panelClass}>
              <h2 className={`mb-2 text-sm font-bold uppercase tracking-wider ${teal.accent}`}>
                {t('cocWorkspace.compendium.title')}
              </h2>
              <p className="mb-4 text-xs opacity-70">{t('cocWorkspace.compendium.note')}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { lk: 'cocWorkspace.compendium.skills',             nk: 'cocWorkspace.compendium.skillsNote' },
                  { lk: 'cocWorkspace.compendium.occupations',        nk: 'cocWorkspace.compendium.occupationsNote' },
                  { lk: 'cocWorkspace.compendium.sanity',             nk: 'cocWorkspace.compendium.sanityNote' },
                  { lk: 'cocWorkspace.compendium.damage',             nk: 'cocWorkspace.compendium.damageNote' },
                  { lk: 'cocWorkspace.compendium.investigationRules', nk: 'cocWorkspace.compendium.investigationRulesNote' },
                  { lk: 'cocWorkspace.compendium.clueRules',          nk: 'cocWorkspace.compendium.clueRulesNote' },
                ].map((card) => (
                  <div key={card.lk} className="border border-[#2f7f68]/25 bg-[#101816]/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`font-bold ${teal.accent}`}>{t(card.lk)}</div>
                      <span className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-wider ${teal.badgePlanned}`}>
                        {t('multiWorkspace.status.planned')}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed opacity-65">{t(card.nk)}</p>
                  </div>
                ))}
              </div>
              <div className={`mt-4 border ${teal.planned} p-3 text-xs opacity-60`}>
                {t('cocWorkspace.compendium.planned')}
              </div>
            </section>
          )}

          {/* Source Status / System Health (shell) */}
          {view === 'sources' && (
            <section className={panelClass}>
              <h2 className={`mb-4 text-sm font-bold uppercase tracking-wider ${teal.accent}`}>
                {t('cocWorkspace.sources.title')}
              </h2>
              <p className="mb-4 text-xs opacity-70">{t('cocWorkspace.sources.note')}</p>
              <div className="space-y-3">
                <div className="border border-[#2f7f68]/25 bg-[#101816]/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className={`mr-2 border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${teal.badgePlanned}`}>
                        {t('cocWorkspace.sources.core')}
                      </span>
                      <span className={`font-bold ${teal.accent}`}>{t('cocWorkspace.sources.coreSource')}</span>
                    </div>
                    <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${teal.statusGreen}`}>
                      {t('cocWorkspace.sources.coreStatus')}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-[11px] opacity-60">
                    sourceId: {t('cocWorkspace.sources.coreSourceId')}
                  </div>
                  <p className="mt-1 text-xs opacity-75">{t('cocWorkspace.sources.coreNote')}</p>
                </div>
              </div>
              <div className={`mt-4 border ${teal.planned} p-3 text-xs opacity-60`}>
                {t('cocWorkspace.sources.planned')}
              </div>
            </section>
          )}

          {view === 'ruleSources' && (
            <SystemRuleSourcesShell items={COC_RULE_SOURCES} t={t} theme={cocRuleSourcesTheme} />
          )}

          {/* Planned slot */}
          {view === 'planned' && (
            <div className="flex min-h-[60vh] items-center justify-center">
              <section className={`w-full max-w-2xl ${panelClass}`}>
                <div className={`text-xs font-bold uppercase tracking-[0.2em] ${teal.accent}`}>
                  {t('multiWorkspace.status.planned')}
                </div>
                <h1 className={`mt-3 text-2xl font-bold ${teal.accentStrong}`}>
                  {t('multiWorkspace.planned.title')}
                </h1>
                <p className="mt-3 text-sm leading-relaxed opacity-75">
                  {t('multiWorkspace.planned.message')}
                </p>
                <button
                  type="button"
                  onClick={handleBack}
                  className={`mt-5 border px-4 py-2 text-xs font-bold uppercase tracking-wider ${teal.secondary}`}
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
