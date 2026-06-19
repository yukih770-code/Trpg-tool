import { useState, type ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { createTranslator, readStoredLocale } from '../../i18n';
import { useCpStore } from '../../store/cpStore';
// AI-LANDMARK: CPRED_ACTOR_VAULT_LIBRARY_ADOPTION_V1
import { ActorVaultLibraryShell } from '../../components/platform/ActorVaultLibraryShell';
import { CampaignLibraryShell } from '../../components/platform/CampaignLibraryShell';
import { SystemWorkspaceEntryShell } from '../../components/platform/SystemWorkspaceEntryShell';
import { SystemRuleSourcesShell, type SystemRuleSourcesTheme } from '../../components/platform/SystemRuleSourcesShell';
import { CPRED_RULE_SOURCES } from './cpRuleSourcesAdapter';
import { deriveVaultSummaries, type ActorVaultAdapter } from '../../lib/platform/actorVault';
import type { CpCharacter } from '../../lib/cp-types';
import type {
  CampaignActorAddReturnContext,
  CampaignActorSelectReturnContext,
  CampaignSuggestedActor,
} from '../../lib/platform/campaignFlow';
import {
  buildCpActorSummary,
  buildCpVaultAdapterStrings,
  buildCpVaultStats,
  buildCpSortOptions,
  buildCpVaultShellStrings,
  CP_VAULT_COLOR_THEME,
} from './cpActorVaultAdapter';

/**
 * CpWorkspaceShell
 *
 * AI-LANDMARK: COC_CPRED_DND_ALIGNED_WORKSPACE_RECONSTRUCTION
 * AI-LANDMARK: CPRED_WORKSPACE_CONTRACT_ALIGNMENT_V1
 *
 * CP RED Game System Workspace Shell — aligned with DndWorkspaceShell structure.
 * Top nav = generic platform Sections only (Contract §5 / PLATFORM_PATTERNS_AND_WORKSPACE_CONTRACT_V1).
 * Actor Vault is the default/root user entry; dashboard/systemOverview is retained as
 * low-frequency System Info, not as a primary nav item.
 * createMethod / sheet / mission (runtime) are Actor/Creation context — accessible via CTA only.
 * Existing CP RED runtime (CpCreator / CpSheet / CpGameplay / CpMarket) is preserved
 * as children and rendered under the 'play' view. No store schema, runtime rule logic,
 * or dice algorithm is modified.
 */

// Must stay compatible with NonDndWorkspaceView in PlayWorkspace.tsx
type CpWorkspaceView =
  | 'dashboard'
  | 'vault'
  | 'campaigns'
  | 'createCampaign'
  | 'createMethod'
  | 'compendium'
  | 'sources'
  | 'ruleSources'
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

type CpBuilderStep =
  | 'identity'
  | 'lifepath'
  | 'role'
  | 'stats'
  | 'skills'
  | 'equipment'
  | 'cyberware'
  | 'review';

type CpEdgerunnerBuilderShellProps = {
  onOpenSheet: () => void;
  onStartMission: () => void;
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
        {/* AI-LANDMARK: ACTOR_VAULT_RESPONSIBILITY_CLEANUP_HIDE_RUNTIME_CTA_V1
            Sheet CTA: startMission hidden (runtime gated). continueEditing kept (幕间维护). */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onContinueEditing}
            className={`border px-4 py-3 text-xs font-bold uppercase tracking-wider ${gold.secondary}`}
          >
            {t('multiWorkspace.actions.continueEdgerunnerEditing')}
          </button>
          <p className="mt-1 text-[10px] leading-relaxed opacity-40">
            {t('navigation.runtimeGateNote')}
          </p>
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

// AI-LANDMARK: CPRED_BUILDER_BG3_LIKE_SHELL_V1
// Shell-only BG3-like CP RED builder. Reads the current Edgerunner for preview;
// it does not write store fields, recalculate rules, alter dice, or change save format.
export function CpEdgerunnerBuilderShell({
  onOpenSheet,
  onStartMission,
}: CpEdgerunnerBuilderShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const character = useCpStore((state) => state.character);
  const [step, setStep] = useState<CpBuilderStep>('identity');
  const unselected = t('dndBuilder.common.unselected');
  const displayName = character.lifePath?.handle?.trim() || character.name?.trim() || t('multiWorkspace.cp.entry.unnamed');
  const armorSummary = [
    character.armorHead ? `${t('cpWorkspace.sheet.armorHead')} SP ${character.armorHead.sp}` : null,
    character.armorBody ? `${t('cpWorkspace.sheet.armorBody')} SP ${character.armorBody.sp}` : null,
  ].filter(Boolean).join(' / ') || unselected;
  const topSkills = Object.entries(character.skills)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const steps: {
    id: CpBuilderStep;
    labelKey: string;
    hintKey: string;
    status: 'complete' | 'planned' | 'pending';
  }[] = [
    { id: 'identity',  labelKey: 'cpBuilder.steps.identity',  hintKey: 'cpBuilder.hints.identity',  status: character.name || character.lifePath?.handle ? 'complete' : 'pending' },
    { id: 'lifepath',  labelKey: 'cpBuilder.steps.lifepath',  hintKey: 'cpBuilder.hints.lifepath',  status: character.lifePath?.motivation || character.lifePath?.hometown ? 'complete' : 'planned' },
    { id: 'role',      labelKey: 'cpBuilder.steps.role',      hintKey: 'cpBuilder.hints.role',      status: character.role ? 'complete' : 'pending' },
    { id: 'stats',     labelKey: 'cpBuilder.steps.stats',     hintKey: 'cpBuilder.hints.stats',     status: Object.values(character.stats).some(Boolean) ? 'complete' : 'pending' },
    { id: 'skills',    labelKey: 'cpBuilder.steps.skills',    hintKey: 'cpBuilder.hints.skills',    status: topSkills.length > 0 ? 'complete' : 'planned' },
    { id: 'equipment', labelKey: 'cpBuilder.steps.equipment', hintKey: 'cpBuilder.hints.equipment', status: character.weapons.length || character.armorBody || character.armorHead ? 'complete' : 'planned' },
    { id: 'cyberware', labelKey: 'cpBuilder.steps.cyberware', hintKey: 'cpBuilder.hints.cyberware', status: character.cyberware.length ? 'complete' : 'planned' },
    { id: 'review',    labelKey: 'cpBuilder.steps.review',    hintKey: 'cpBuilder.hints.review',    status: character.name ? 'complete' : 'pending' },
  ];

  const statusLabel = (status: (typeof steps)[number]['status']) => {
    if (status === 'complete') return t('cpBuilder.status.complete');
    if (status === 'planned') return t('multiWorkspace.status.planned');
    return t('cpBuilder.status.pending');
  };

  const renderField = (labelKey: string, value: string | number | undefined) => (
    <div className="rounded border border-[#d8b954]/25 bg-black/20 p-3">
      <div className={`text-[10px] font-bold uppercase tracking-wider ${gold.accent}`}>{t(labelKey)}</div>
      <div className="mt-1 break-words text-sm font-bold">{value || unselected}</div>
    </div>
  );

  const sectionHeader = (titleKey: string, noteKey: string) => (
    <div className="mb-4 border-b border-[#d8b954]/20 pb-3">
      <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${gold.accent}`}>
        {t('cpBuilder.currentStep')}
      </div>
      <h2 className={`mt-1 text-2xl font-black tracking-widest ${gold.accentStrong}`}>{t(titleKey)}</h2>
      <p className="mt-1 text-sm leading-relaxed opacity-70">{t(noteKey)}</p>
    </div>
  );

  const renderPlaceholder = (titleKey: string, noteKey: string) => (
    <div className="mt-4 rounded border border-dashed border-[#d8b954]/35 bg-black/20 p-4">
      <div className={`text-xs font-bold uppercase tracking-wider ${gold.accent}`}>{t(titleKey)}</div>
      <p className="mt-2 text-sm leading-relaxed opacity-70">{t(noteKey)}</p>
    </div>
  );

  const renderStep = () => {
    if (step === 'identity') {
      return (
        <section className={gold.panel}>
          {sectionHeader('cpBuilder.steps.identity', 'cpBuilder.descriptions.identity')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renderField('multiWorkspace.cp.entry.handle', character.lifePath?.handle)}
            {renderField('multiWorkspace.cp.entry.name', character.name)}
            {renderField('cpBuilder.fields.player', character.player)}
            {renderField('cpBuilder.fields.ageGender', `${character.age || '--'} / ${character.gender || unselected}`)}
            {renderField('cpBuilder.fields.style', character.lifePath?.clothingStyle)}
            {renderField('cpBuilder.fields.culturalOrigin', character.lifePath?.hometown)}
          </div>
          <p className="mt-4 rounded border border-dashed border-[#d8b954]/30 bg-black/20 p-3 text-xs opacity-65">
            {t('cpBuilder.shellOnlyNote')}
          </p>
        </section>
      );
    }

    if (step === 'lifepath') {
      return (
        <section className={gold.panel}>
          {sectionHeader('cpBuilder.steps.lifepath', 'cpBuilder.descriptions.lifepath')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renderField('cpBuilder.fields.hometown', character.lifePath?.hometown)}
            {renderField('cpBuilder.fields.motivation', character.lifePath?.motivation)}
            {renderField('cpBuilder.fields.personality', character.lifePath?.personality)}
            {renderField('cpBuilder.fields.familyOrigin', character.lifePath?.originsFamily)}
            {renderField('cpBuilder.fields.childhoodHero', character.lifePath?.childhoodHero)}
            {renderField('cpBuilder.fields.careerPath', character.lifePath?.careerPath)}
          </div>
          {renderPlaceholder('cpBuilder.placeholders.lifepathTitle', 'cpBuilder.placeholders.lifepathNote')}
        </section>
      );
    }

    if (step === 'role') {
      return (
        <section className={gold.panel}>
          {sectionHeader('cpBuilder.steps.role', 'cpBuilder.descriptions.role')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renderField('multiWorkspace.cp.entry.role', character.role)}
            {renderField('multiWorkspace.cp.entry.roleLevel', character.roleLevel)}
            {renderField('cpBuilder.fields.housing', character.housing)}
            {renderField('cpBuilder.fields.eurobucks', `${character.eb} eb`)}
          </div>
          {renderPlaceholder('cpBuilder.placeholders.roleTitle', 'cpBuilder.placeholders.roleNote')}
        </section>
      );
    }

    if (step === 'stats') {
      return (
        <section className={gold.panel}>
          {sectionHeader('cpBuilder.steps.stats', 'cpBuilder.descriptions.stats')}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {Object.entries(character.stats).map(([key, value]) => (
              <div key={key} className="rounded border border-[#d8b954]/25 bg-black/20 p-3 text-center">
                <div className={`text-xs font-bold ${gold.accent}`}>{key}</div>
                <div className={`mt-1 text-2xl font-black ${gold.accentStrong}`}>{value || '--'}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {renderField('cpWorkspace.sheet.hp', `${character.hp.current}/${character.hp.max}`)}
            {renderField('cpWorkspace.sheet.humanity', `${character.humanity.current}/${character.humanity.max}`)}
            {renderField('cpWorkspace.sheet.move', character.stats.MOVE)}
            {renderField('cpWorkspace.sheet.ref', character.stats.REF)}
          </div>
        </section>
      );
    }

    if (step === 'skills') {
      return (
        <section className={gold.panel}>
          {sectionHeader('cpBuilder.steps.skills', 'cpBuilder.descriptions.skills')}
          {topSkills.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {topSkills.map(([skillName, value]) => (
                <div key={skillName} className="flex items-center justify-between rounded border border-[#d8b954]/25 bg-black/20 px-3 py-2 text-xs">
                  <span className="truncate">{skillName}</span>
                  <span className={`ml-3 font-bold ${gold.accentStrong}`}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            renderPlaceholder('cpBuilder.placeholders.skillsTitle', 'cpBuilder.placeholders.skillsNote')
          )}
        </section>
      );
    }

    if (step === 'equipment') {
      return (
        <section className={gold.panel}>
          {sectionHeader('cpBuilder.steps.equipment', 'cpBuilder.descriptions.equipment')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {renderField('cpBuilder.fields.weapons', character.weapons.map(w => w.name).join(', '))}
            {renderField('cpWorkspace.sheet.armor', armorSummary)}
            {renderField('cpBuilder.fields.gear', character.inventory?.gear?.map(item => item.name).join(', '))}
          </div>
          {renderPlaceholder('cpBuilder.placeholders.equipmentTitle', 'cpBuilder.placeholders.equipmentNote')}
        </section>
      );
    }

    if (step === 'cyberware') {
      return (
        <section className={gold.panel}>
          {sectionHeader('cpBuilder.steps.cyberware', 'cpBuilder.descriptions.cyberware')}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {renderField('cpWorkspace.compendium.cyberware', character.cyberware.map(cw => cw.name).join(', '))}
            {renderField('cpWorkspace.sheet.humanity', `${character.humanity.current}/${character.humanity.max}`)}
          </div>
          {renderPlaceholder('cpBuilder.placeholders.cyberwareTitle', 'cpBuilder.placeholders.cyberwareNote')}
        </section>
      );
    }

    return (
      <section className={gold.panel}>
        {sectionHeader('cpBuilder.steps.review', 'cpBuilder.descriptions.review')}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {renderField('multiWorkspace.cp.entry.handle', character.lifePath?.handle)}
          {renderField('multiWorkspace.cp.entry.name', character.name)}
          {renderField('multiWorkspace.cp.entry.role', character.role)}
          {renderField('cpBuilder.fields.resources', `HP ${character.hp.current}/${character.hp.max} · Humanity ${character.humanity.current}/${character.humanity.max} · ${character.eb} eb`)}
          {renderField('cpBuilder.fields.dataStatus', t('cpBuilder.status.shell'))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onOpenSheet} className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.secondary}`}>
            {t('multiWorkspace.actions.viewCharacterSheet')}
          </button>
          <button type="button" onClick={onStartMission} className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.primary}`}>
            {t('multiWorkspace.actions.startMission')}
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] overflow-x-hidden">
      <section className={`${gold.panel} mb-4`}>
        <div className={`text-xs font-bold uppercase tracking-[0.22em] ${gold.accent}`}>
          {t('cpBuilder.header.eyebrow')}
        </div>
        <h1 className={`mt-2 text-3xl font-black tracking-widest ${gold.accentStrong}`}>{t('cpBuilder.header.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-75">{t('cpBuilder.header.subtitle')}</p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className={`${gold.card} p-3`}>
            <div className={`mb-2 hidden text-[10px] font-bold uppercase tracking-[0.22em] ${gold.accent} md:block`}>
              {t('cpBuilder.nav.title')}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
              {steps.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`min-w-[116px] rounded border px-3 py-2 text-left transition md:min-w-0 ${
                    step === item.id
                      ? gold.navActive
                      : `${gold.navInactive} bg-black/20`
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{t(item.labelKey)}</span>
                    <span className="text-[9px] opacity-70">{statusLabel(item.status)}</span>
                  </div>
                  <div className={`mt-1 hidden text-[10px] leading-tight md:block ${step === item.id ? 'text-[#0d0d0d]/70' : 'text-[#d8b954]/60'}`}>
                    {t(item.hintKey)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0">{renderStep()}</main>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className={`${gold.card} p-4`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${gold.accent}`}>
              {t('cpBuilder.summary.title')}
            </h2>
            <div className="mt-3 space-y-2">
              {[
                [t('multiWorkspace.cp.entry.handle'), displayName],
                [t('multiWorkspace.cp.entry.role'), character.role || unselected],
                ['HP / Humanity', `${character.hp.current}/${character.hp.max} · ${character.humanity.current}/${character.humanity.max}`],
                ['Armor', armorSummary],
                ['MOVE / REF', `${character.stats.MOVE} / ${character.stats.REF}`],
                [t('cpBuilder.fields.keyStats'), `INT ${character.stats.INT} / COOL ${character.stats.COOL} / EMP ${character.stats.EMP}`],
                [t('cpBuilder.fields.skillSummary'), topSkills.length ? topSkills.map(([name, value]) => `${name} ${value}`).join(' / ') : t('cpBuilder.placeholders.skillSummary')],
                [t('cpBuilder.fields.equipmentCyberware'), `${character.weapons.length} / ${character.cyberware.length}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 text-xs last:border-0">
                  <span className={`shrink-0 font-bold uppercase tracking-wider ${gold.accent}`}>{label}</span>
                  <span className="min-w-0 text-right font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded border border-dashed border-[#d8b954]/30 bg-black/20 p-3 text-xs leading-relaxed opacity-70">
              <div className={`font-bold ${gold.accent}`}>{t('cpBuilder.nextStep')}</div>
              <p className="mt-1">{t('cpBuilder.nextStepNote')}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={onOpenSheet} className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.secondary}`}>
                {t('multiWorkspace.actions.viewCharacterSheet')}
              </button>
              <button type="button" onClick={onStartMission} className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.primary}`}>
                {t('multiWorkspace.actions.startMission')}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
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
  const [campaignActorAddContext, setCampaignActorAddContext] =
    useState<CampaignActorAddReturnContext | null>(null);
  const [campaignActorSelectContext, setCampaignActorSelectContext] =
    useState<CampaignActorSelectReturnContext | null>(null);
  const [suggestedCampaignActor, setSuggestedCampaignActor] =
    useState<CampaignSuggestedActor | null>(null);

  const cpRuleSourcesTheme: SystemRuleSourcesTheme = {
    panel: gold.panel,
    card: 'rounded-md border border-[#d8b954]/30 bg-[#0d0d0d]/70',
    title: gold.accentStrong,
    muted: gold.accent,
    badgeEnabled: gold.statusYellow,
    badgePlanned: gold.badgePlanned,
    kindBadge: gold.badge,
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
    setCampaignActorSelectContext(null);
    onViewChange('createMethod');
  };

  const handleRequestSelectActorForCampaign = (context: CampaignActorSelectReturnContext) => {
    setCampaignActorSelectContext(context);
    setCampaignActorAddContext(null);
    onViewChange('vault');
  };

  const handleSelectActorForCampaign = (actor: CampaignSuggestedActor) => {
    setSuggestedCampaignActor(actor);
    setCampaignActorSelectContext(null);
    onViewChange('campaigns');
  };

  const handleReturnToCampaignEntry = () => {
    onViewChange('campaigns');
  };

  // Edgerunner data rows for cards
  const edgerunnerRows = [
    { lk: 'multiWorkspace.cp.entry.name',      v: cpChar.name                 || t('multiWorkspace.cp.entry.unnamed') },
    { lk: 'multiWorkspace.cp.entry.handle',     v: cpChar.lifePath?.handle     || t('dndBuilder.common.unselected') },
    { lk: 'multiWorkspace.cp.entry.role',       v: cpChar.role       || t('dndBuilder.common.unselected') },
    { lk: 'multiWorkspace.cp.entry.roleLevel',  v: String(cpChar.roleLevel ?? t('dndBuilder.common.unselected')) },
  ];

  const panelClass = gold.panel;

  // ── CP RED Actor Vault adapter (AI-LANDMARK: CPRED_ACTOR_VAULT_LIBRARY_ADOPTION_V1) ──
  const _cpAdapterStrings = buildCpVaultAdapterStrings(t);
  const _cpVaultAdapter: ActorVaultAdapter<CpCharacter> = {
    getActors:        () => cpChar.name?.trim() || cpChar.lifePath?.handle?.trim() ? [cpChar] : [],
    getActiveActorId: () => cpChar.id?.trim() || 'cp-single',
    getSummary:       (char, index) => buildCpActorSummary(char, index, _cpAdapterStrings),
    getStats:         (summaries) => buildCpVaultStats(summaries),
    getAddOptions:    () => [],
    getSortOptions:   () => buildCpSortOptions({
      default:   t('cpWorkspace.characterLibrary.sort.default'),
      name:      t('cpWorkspace.characterLibrary.sort.name'),
      roleLevel: t('cpWorkspace.characterLibrary.sort.roleLevel'),
    }),
    getDefaultSortKey: () => 'default',
    onEnterActor:      (_id) => { onOpenPlayTab('sheet'); },
  };
  const _cpVaultSummaries = deriveVaultSummaries(_cpVaultAdapter);
  const _cpVaultStats     = _cpVaultAdapter.getStats(_cpVaultSummaries);
  const _cpVaultSortOpts  = _cpVaultAdapter.getSortOptions();
  const _cpVaultStrings   = buildCpVaultShellStrings(t);

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
      {/* AI-LANDMARK: ACTOR_VAULT_RESPONSIBILITY_CLEANUP_HIDE_RUNTIME_CTA_V1
          AI-LANDMARK: ACTOR_VAULT_ACTION_HIERARCHY_CLEANUP_V1
          AI-LANDMARK: ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1
          Actor card CTA: Tier-D View Sheet only. Edit excluded (goes to Creation Method, not object-level).
          Runtime (startMission) gated. Replace is low-freq bottom entry on vault page. */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onOpenPlayTab('sheet')}
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${gold.secondary}`}
        >
          {t('multiWorkspace.actions.viewCharacterSheet')}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-mono ${gold.body}`}>

      {/* ── CP RED workspace shell brand ── */}
      <div className={gold.navBar}>
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <BookOpen className={`h-5 w-5 ${gold.navBrand}`} />
            <span className={`font-mono text-lg font-bold tracking-widest ${gold.navBrand}`}>{t('cpWorkspace.title')}</span>
          </div>
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
                  {t('multiWorkspace.eyebrow')}
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

              <SystemWorkspaceEntryShell
                systemName={t('glossary.cyberpunkRed')}
                tone="cp"
                actorNoteKey="systemWorkspaceEntry.cp.actorNote"
                campaignNoteKey="systemWorkspaceEntry.cp.campaignNote"
                onEnterActors={() => onViewChange('vault')}
                onEnterCampaigns={() => {
                  setCampaignActorAddContext(null);
                  setCampaignActorSelectContext(null);
                  setSuggestedCampaignActor(null);
                  onViewChange('campaigns');
                }}
              />
            </div>
          )}

          {/* Edgerunner Vault — AI-LANDMARK: CPRED_ACTOR_VAULT_LIBRARY_ADOPTION_V1
              Replaced bespoke vault JSX with platform ActorVaultLibraryShell.
              Original landmarks preserved below for historical reference:
              AI-LANDMARK: ACTOR_VAULT_ACTION_HIERARCHY_CLEANUP_V1
              AI-LANDMARK: ACTOR_VAULT_SINGLE_ACTOR_ACTION_CLEANUP_V1
              AI-LANDMARK: ACTOR_VAULT_EXISTING_ADD_SPLIT_V1 */}
          {view === 'vault' && (
            <ActorVaultLibraryShell
              summaries={_cpVaultSummaries}
              stats={_cpVaultStats}
              sortOptions={_cpVaultSortOpts}
              defaultSortKey="default"
              onEnterActor={_cpVaultAdapter.onEnterActor}
              onRequestAdd={() => {
                setCampaignActorAddContext(null);
                setCampaignActorSelectContext(null);
                setSuggestedCampaignActor(null);
                onViewChange('createMethod');
              }}
              campaignActorSelectContext={campaignActorSelectContext}
              onSelectActorForCampaign={handleSelectActorForCampaign}
              onReturnToCampaignEntry={handleReturnToCampaignEntry}
              strings={_cpVaultStrings}
              colorTheme={CP_VAULT_COLOR_THEME}
              panelClassName={panelClass}
            />
          )}

          {view === 'campaigns' && (
            <CampaignLibraryShell
              systemId="cyberpunk-red"
              systemName={t('glossary.cyberpunkRed')}
              tone="cp"
              initialMode={campaignActorAddContext || campaignActorSelectContext || suggestedCampaignActor ? 'detail' : undefined}
              suggestedActor={suggestedCampaignActor}
              onRequestAddActorForCampaign={handleRequestAddActorForCampaign}
              onRequestSelectActorForCampaign={handleRequestSelectActorForCampaign}
              onAddCampaign={() => onViewChange('createCampaign')}
              panelClassName={panelClass}
            />
          )}

          {view === 'createCampaign' && (
            <CampaignLibraryShell
              systemId="cyberpunk-red"
              systemName={t('glossary.cyberpunkRed')}
              tone="cp"
              mode="create"
              panelClassName={panelClass}
            />
          )}

          {/* Creation Method */}
          {view === 'createMethod' && (
            <section className={panelClass}>
              {campaignActorAddContext && (
                <div className="mb-4 rounded border border-[#d8b954]/35 bg-black/20 p-4 text-sm">
                  <div className={`font-bold ${gold.accentStrong}`}>
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
                    className={`mt-3 border px-3 py-1.5 text-xs font-bold transition ${gold.secondary}`}
                  >
                    {campaignActorAddContext.returnLabel}
                  </button>
                </div>
              )}
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
              <p className={`mt-4 border-t border-white/10 pt-3 text-[10px] opacity-50`}>
                {t('cpWorkspace.creation.actorFlowNote')}
              </p>
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

          {view === 'ruleSources' && (
            <SystemRuleSourcesShell items={CPRED_RULE_SOURCES} t={t} theme={cpRuleSourcesTheme} />
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
