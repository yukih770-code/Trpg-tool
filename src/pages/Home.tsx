// AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V1
import { BrainCircuit, Boxes, ChevronRight, Database, Hammer, Map, Network, Play, Upload } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { createTranslator, type Locale } from '../i18n';
import { useAppStore } from '../store/appStore';
import { useCharacterStore } from '../store/characterStore';
import { useCocStore } from '../store/cocStore';
import { useCpStore } from '../store/cpStore';

type System = 'D&D' | 'CoC' | 'CP';
type DevStatusKey = 'scaffold' | 'interfaceReserved' | 'plannedImpl' | 'mock' | 'toolEntry';

type HomeProps = {
  locale: Locale;
  onEnterPlay: (system?: System) => void;
  onOpenPlaceholder: (feature: string) => void;
};

// System-level cards with per-system accent colours
const systemCards: {
  system: System;
  labelKey: string;
  descKey: string;
  cardAccent: string;
  resumeAccent: string;
}[] = [
  {
    system: 'D&D',
    labelKey: 'glossary.dnd2024',
    descKey: 'playMenu.dnd.desc',
    cardAccent: 'border-[#58180d]/30 bg-[#fff8e6] hover:border-[#58180d]/55 hover:shadow-md',
    resumeAccent: 'border-[#58180d]/30 bg-[#fff8e6]',
  },
  {
    system: 'CoC',
    labelKey: 'glossary.coc7e',
    descKey: 'playMenu.coc.desc',
    cardAccent: 'border-[#2f7f68]/30 bg-[#f1fbf7] hover:border-[#2f7f68]/55 hover:shadow-md',
    resumeAccent: 'border-[#2f7f68]/30 bg-[#f1fbf7]',
  },
  {
    system: 'CP',
    labelKey: 'glossary.cyberpunkRed',
    descKey: 'playMenu.cp.desc',
    cardAccent: 'border-[#f5c518]/40 bg-[#fffbea] hover:border-[#f5c518]/70 hover:shadow-md',
    resumeAccent: 'border-[#f5c518]/40 bg-[#fffbea]',
  },
];

// Dev-zone cards — lower visual weight, explicit status badge
const devStatusLabelKeys: Record<DevStatusKey, string> = {
  scaffold: 'home.devZone.status.scaffold',
  interfaceReserved: 'home.devZone.status.interfaceReserved',
  plannedImpl: 'home.devZone.status.plannedImpl',
  mock: 'home.devZone.status.mock',
  toolEntry: 'home.devZone.status.toolEntry',
};

type DevCardDef = {
  key: string;
  titleKey: string;
  icon: typeof Map;
  statusKey: DevStatusKey;
  placeholderKey?: string; // undefined = disabled (no placeholder page yet)
};

const devCards: DevCardDef[] = [
  { key: 'campaigns',     titleKey: 'home.devZone.campaigns.title',     icon: Map,         statusKey: 'plannedImpl',       placeholderKey: 'campaigns' },
  { key: 'sourceSettings',titleKey: 'home.devZone.sourceSettings.title',icon: Database,    statusKey: 'interfaceReserved' },
  { key: 'workshop',      titleKey: 'home.devZone.workshop.title',      icon: Boxes,       statusKey: 'plannedImpl',       placeholderKey: 'community' },
  { key: 'studio',        titleKey: 'home.devZone.studio.title',        icon: Hammer,      statusKey: 'plannedImpl',       placeholderKey: 'studio' },
  { key: 'vtt',           titleKey: 'home.devZone.vtt.title',           icon: Network,     statusKey: 'plannedImpl' },
  { key: 'aiHost',        titleKey: 'home.devZone.aiHost.title',        icon: BrainCircuit,statusKey: 'plannedImpl',       placeholderKey: 'aiHost' },
  { key: 'privateImport', titleKey: 'home.devZone.privateImport.title', icon: Upload,      statusKey: 'toolEntry',         placeholderKey: 'privateImport' },
];

export function Home({ locale, onEnterPlay, onOpenPlaceholder }: HomeProps) {
  const { t } = createTranslator(locale);
  const system       = useAppStore((state) => state.system as System);
  const dndChar      = useCharacterStore((state) => state.character);
  const cocChar      = useCocStore((state) => state.character);
  const cpChar       = useCpStore((state) => state.character);

  const activeSystemCard = systemCards.find((c) => c.system === system) ?? systemCards[0];

  const activeCharacter =
    system === 'CoC' ? cocChar
    : system === 'CP'  ? cpChar
    : dndChar;

  const characterName = (activeCharacter as { name?: string }).name?.trim();

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">

        {/* ── Compact Hero ─────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('home.hero.title')}</h1>
          <p className="mt-1.5 text-sm text-[#51483d]">{t('home.hero.subtitle')}</p>
        </div>

        {/* ── Section 1: 继续上次 ─────────────────────────────────── */}
        <section aria-label={t('home.resume.sectionTitle')}>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
            {t('home.resume.sectionTitle')}
          </h2>
          <div className={`rounded-xl border p-5 ${activeSystemCard.resumeAccent}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#51483d]">
                    {t('home.resume.activeRuleset')}
                  </span>
                  <span className="font-bold">{t(activeSystemCard.labelKey)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#51483d]">
                    {t('home.resume.currentCharacter')}
                  </span>
                  <span className="text-sm">
                    {characterName || <span className="text-[#51483d]">{t('home.resume.noCharacter')}</span>}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => onEnterPlay(system)}
                className="w-fit rounded-md"
              >
                <Play className="mr-2 h-4 w-4" />
                {t('home.resume.continueButton')}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Section 2: 规则系统库 ───────────────────────────────── */}
        <section aria-label={t('home.systems.sectionTitle')}>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
            {t('home.systems.sectionTitle')}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {systemCards.map((card) => (
              <div
                key={card.system}
                className={`flex flex-col rounded-xl border p-5 transition ${card.cardAccent}`}
              >
                <div className="mb-1 font-bold">{t(card.labelKey)}</div>
                <div className="mb-4 flex-1 text-xs text-[#51483d]">{t(card.descKey)}</div>
                <Button
                  size="sm"
                  onClick={() => onEnterPlay(card.system)}
                  className="w-full rounded-md"
                >
                  {t('home.systems.enterSystem')}
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    t('navigation.actorVault'),
                    t('navigation.rulesCompendium'),
                    t('navigation.sourceStatus'),
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onEnterPlay(card.system)}
                      className="rounded-md border border-[#2f2a22]/20 bg-white/50 px-2 py-0.5 text-[10px] text-[#51483d] transition hover:bg-white/90"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: 开发中功能 ───────────────────────────────── */}
        <section aria-label={t('home.devZone.sectionTitle')}>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
            {t('home.devZone.sectionTitle')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {devCards.map((card) => {
              const Icon = card.icon;
              const clickable = Boolean(card.placeholderKey);
              return (
                <button
                  key={card.key}
                  type="button"
                  disabled={!clickable}
                  onClick={clickable ? () => onOpenPlaceholder(card.placeholderKey!) : undefined}
                  className={`rounded-lg border border-[#2f2a22]/12 bg-[#faf8f2] p-4 text-left transition ${
                    clickable
                      ? 'cursor-pointer hover:border-[#2f2a22]/25 hover:bg-white'
                      : 'cursor-default opacity-55'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#6a5f52]" />
                    <Badge
                      variant="outline"
                      className="rounded-md border-[#2f2a22]/25 text-[9px] font-medium uppercase tracking-wide"
                    >
                      {t(devStatusLabelKeys[card.statusKey])}
                    </Badge>
                  </div>
                  <div className="mt-2.5 text-sm font-bold text-[#17130f]">{t(card.titleKey)}</div>
                </button>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
