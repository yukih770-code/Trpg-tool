// AI-LANDMARK: PLATFORM_HOME_LAUNCHPAD_IA_CLEANUP_V2
import { BookOpen, ChevronRight, Library, Palette, Play, Sparkles } from 'lucide-react';
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

const quickEntries: {
  key: string;
  label: [string, string];
  note: [string, string];
  icon: typeof Library;
  action: 'systemLibrary' | 'currentSystem' | 'workshop' | 'fanPlaza' | 'personalHub';
}[] = [
  {
    key: 'systemLibrary',
    label: ['系统资料库', 'System library'],
    note: ['浏览已支持的规则系统。', 'Browse supported game systems.'],
    icon: BookOpen,
    action: 'systemLibrary',
  },
  {
    key: 'myCharacters',
    label: ['我的角色', 'My characters'],
    note: ['回到当前系统继续角色流程。', 'Continue in the current game system.'],
    icon: Library,
    action: 'currentSystem',
  },
  {
    key: 'workshop',
    label: ['创意工坊', 'Workshop'],
    note: ['浏览已公开的资料包与创作。', 'Browse published packs and creations.'],
    icon: Sparkles,
    action: 'workshop',
  },
  {
    key: 'fanPlaza',
    label: ['同人广场', 'Community plaza'],
    note: ['浏览已公开的故事与分享。', 'Browse published stories and sharing.'],
    icon: Palette,
    action: 'fanPlaza',
  },
  {
    key: 'personalHub',
    label: ['我的资料库', 'My library'],
    note: ['查看自己的资料与收藏。', 'View your own resources and saved items.'],
    icon: Library,
    action: 'personalHub',
  },
];

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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">

        {/* ── Section 1: 继续上次 ────────────────────────────────────── */}
        <section aria-label={t('home.resume.sectionTitle')}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#51483d]">
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
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#51483d]">
            {t('home.recent.sectionTitle')}
          </h2>
          <div className="grid gap-2 md:grid-cols-3">
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

        <section aria-label={locale === 'en' ? 'Quick access' : '常用入口'}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#51483d]">
            {locale === 'en' ? 'Quick access' : '常用入口'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickEntries.map((entry) => {
              const Icon = entry.icon;
              const handleClick = () => {
                if (entry.action === 'systemLibrary') {
                  onOpenPlaceholder('systemLibrary');
                  return;
                }
                if (entry.action === 'currentSystem') {
                  onEnterPlay(system);
                  return;
                }
                onOpenPlaceholder(entry.action);
              };

              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={handleClick}
                  className="flex min-h-[108px] flex-col gap-3 rounded-xl border border-[#2f2a22]/15 bg-white/60 px-4 py-4 text-left transition hover:border-[#2f2a22]/30 hover:bg-white/90"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-[#6a5f52]" />
                    <span className="text-sm font-semibold">{entry.label[locale === 'en' ? 1 : 0]}</span>
                  </div>
                  <span className="text-xs leading-5 text-[#51483d]">{entry.note[locale === 'en' ? 1 : 0]}</span>
                </button>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
