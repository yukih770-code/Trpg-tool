// AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V2
import { BookOpen, ChevronRight, Library, Palette, Play, Sparkles, Upload } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { createTranslator, type Locale } from '../i18n';
import { useAppStore } from '../store/appStore';
import { useCharacterStore } from '../store/characterStore';
import { useCocStore } from '../store/cocStore';
import { useCpStore } from '../store/cpStore';

type System = 'D&D' | 'CoC' | 'CP';

type HomeProps = {
  locale: Locale;
  onEnterPlay: (system?: System) => void;
  onOpenPlaceholder: (feature: string) => void;
};

const systemCards: {
  system: System;
  labelKey: string;
  resumeAccent: string;
  recentAccent: string;
}[] = [
  {
    system: 'D&D',
    labelKey: 'glossary.dnd2024',
    resumeAccent: 'border-[#58180d]/30 bg-[#fff8e6]',
    recentAccent: 'border-[#58180d]/20 bg-[#fff8e6]/70 hover:border-[#58180d]/40 hover:bg-[#fff8e6]',
  },
  {
    system: 'CoC',
    labelKey: 'glossary.coc7e',
    resumeAccent: 'border-[#2f7f68]/30 bg-[#f1fbf7]',
    recentAccent: 'border-[#2f7f68]/20 bg-[#f1fbf7]/70 hover:border-[#2f7f68]/40 hover:bg-[#f1fbf7]',
  },
  {
    system: 'CP',
    labelKey: 'glossary.cyberpunkRed',
    resumeAccent: 'border-[#f5c518]/40 bg-[#fffbea]',
    recentAccent: 'border-[#f5c518]/30 bg-[#fffbea]/70 hover:border-[#f5c518]/55 hover:bg-[#fffbea]',
  },
];

const pinnedEntries: {
  key: string;
  labelKey: string;
  noteKey: string;
  actionLabelKey: string;
  icon: typeof Library;
  action: 'systemLibrary' | 'currentSystem' | 'disabled';
}[] = [
  {
    key: 'recentCampaigns',
    labelKey: 'home.pinned.recentCampaigns',
    noteKey: 'home.pinned.recentCampaignsNote',
    actionLabelKey: 'home.pinned.openSystemLibrary',
    icon: BookOpen,
    action: 'systemLibrary',
  },
  {
    key: 'recentCharacters',
    labelKey: 'home.pinned.recentCharacters',
    noteKey: 'home.pinned.recentCharactersNote',
    actionLabelKey: 'home.pinned.continueSystem',
    icon: Library,
    action: 'currentSystem',
  },
  {
    key: 'drafts',
    labelKey: 'home.pinned.drafts',
    noteKey: 'home.pinned.draftsNote',
    actionLabelKey: 'home.pinned.comingSoon',
    icon: Sparkles,
    action: 'disabled',
  },
  {
    key: 'pending',
    labelKey: 'home.pinned.pending',
    noteKey: 'home.pinned.pendingNote',
    actionLabelKey: 'home.pinned.comingSoon',
    icon: Palette,
    action: 'disabled',
  },
];

const platformStatusTagKeys = [
  'home.platformStatus.tags.devMode',
  'home.platformStatus.tags.scaffoldVisible',
  'home.platformStatus.tags.interfaceReserved',
] as const;

export function Home({ locale, onEnterPlay, onOpenPlaceholder }: HomeProps) {
  const { t } = createTranslator(locale);
  const system  = useAppStore((state) => state.system as System);
  const dndChar = useCharacterStore((state) => state.character);
  const cocChar = useCocStore((state) => state.character);
  const cpChar  = useCpStore((state) => state.character);

  const activeSystemCard = systemCards.find((c) => c.system === system) ?? systemCards[0];

  const activeCharacter =
    system === 'CoC' ? cocChar
    : system === 'CP'  ? cpChar
    : dndChar;
  const activeCharName = (activeCharacter as { name?: string } | null)?.name?.trim();

  const charNameBySystem = {
    'D&D': (dndChar as { name?: string } | null)?.name?.trim(),
    'CoC': (cocChar as { name?: string } | null)?.name?.trim(),
    'CP':  (cpChar  as { name?: string } | null)?.name?.trim(),
  };

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-8">

        {/* ── Compact Hero ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('home.hero.title')}</h1>
          <p className="mt-1.5 text-sm text-[#51483d]">{t('home.hero.subtitle')}</p>
        </div>

        {/* ── Section 1: 继续上次 ────────────────────────────────────── */}
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
                    {activeCharName || (
                      <span className="text-[#51483d]">{t('home.resume.noCharacter')}</span>
                    )}
                  </span>
                </div>
              </div>
              <Button onClick={() => onEnterPlay(system)} className="w-fit rounded-md">
                <Play className="mr-2 h-4 w-4" />
                {t('home.resume.continueButton')}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Section 2: 最近使用 ────────────────────────────────────── */}
        <section aria-label={t('home.recent.sectionTitle')}>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
            {t('home.recent.sectionTitle')}
          </h2>
          <div className="flex flex-col gap-2">
            {systemCards.map((card) => (
              <button
                key={card.system}
                type="button"
                onClick={() => onEnterPlay(card.system)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${card.recentAccent}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{t(card.labelKey)}</span>
                  {charNameBySystem[card.system] && (
                    <span className="text-xs text-[#51483d]">{charNameBySystem[card.system]}</span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#51483d]" />
              </button>
            ))}
          </div>
        </section>

        {/* ── Section 3: 我的工作 ────────────────────────────────────── */}
        <section aria-label={t('home.pinned.sectionTitle')}>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
            {t('home.pinned.sectionTitle')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinnedEntries.map((entry) => {
              const Icon = entry.icon;
              const disabled = entry.action === 'disabled';
              const handleClick = () => {
                if (entry.action === 'systemLibrary') {
                  onOpenPlaceholder('systemLibrary');
                  return;
                }
                if (entry.action === 'currentSystem') {
                  onEnterPlay(system);
                }
              };

              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={disabled ? undefined : handleClick}
                  disabled={disabled}
                  className={`flex min-h-[108px] flex-col gap-3 rounded-xl border border-[#2f2a22]/15 bg-white/60 px-4 py-4 text-left transition ${
                    disabled
                      ? 'cursor-not-allowed opacity-70'
                      : 'hover:border-[#2f2a22]/30 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-[#6a5f52]" />
                    <span className="text-sm font-semibold">{t(entry.labelKey)}</span>
                  </div>
                  <span className="text-xs leading-5 text-[#51483d]">{t(entry.noteKey)}</span>
                  <span className="mt-auto text-[11px] font-semibold text-[#6a3f2a]">
                    {t(entry.actionLabelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Section 4: 平台状态摘要 ───────────────────────────────── */}
        <section aria-label={t('home.platformStatus.sectionTitle')}>
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
            {t('home.platformStatus.sectionTitle')}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {platformStatusTagKeys.map((key) => (
              <Badge
                key={key}
                variant="outline"
                className="rounded-md border-[#2f2a22]/20 text-[10px] font-medium text-[#51483d]"
              >
                {t(key)}
              </Badge>
            ))}
            <button
              type="button"
              disabled
              title={t('home.platformStatus.localImportReserved')}
              className="flex cursor-not-allowed items-center gap-1.5 rounded-md border border-[#2f2a22]/15 bg-white/50 px-3 py-1.5 text-[11px] text-[#51483d] opacity-75 sm:ml-auto"
            >
              <Upload className="h-3 w-3" />
              {t('home.platformStatus.privateImport')}
            </button>
            <span className="text-[11px] text-[#7a6f63]">
              {t('home.platformStatus.localImportReserved')}
            </span>
          </div>
        </section>

      </main>
    </div>
  );
}
