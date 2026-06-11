import { BookOpen, BrainCircuit, Boxes, FlaskConical, Gamepad2, Hammer, Import, Map, Play, Shield } from 'lucide-react';
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

const rulesets: {
  system: System;
  baseKey: string;
  labelKey: string;
  accent: string;
}[] = [
  {
    system: 'D&D',
    baseKey: 'home.workspaces.dnd',
    labelKey: 'glossary.dnd2024',
    accent: 'border-[#58180d]/35 bg-[#fff8e6]',
  },
  {
    system: 'CoC',
    baseKey: 'home.workspaces.coc',
    labelKey: 'glossary.coc7e',
    accent: 'border-[#2f7f68]/35 bg-[#f1fbf7]',
  },
  {
    system: 'CP',
    baseKey: 'home.workspaces.cp',
    labelKey: 'glossary.cyberpunkRed',
    accent: 'border-[#f5c518]/45 bg-[#fffbea]',
  },
];

const roadmapCards = [
  {
    key: 'campaigns',
    baseKey: 'home.roadmap.campaigns',
    phaseKey: 'glossary.v2',
    icon: Map,
  },
  {
    key: 'community',
    baseKey: 'home.roadmap.community',
    phaseKey: 'glossary.v3',
    icon: Boxes,
  },
  {
    key: 'studio',
    baseKey: 'home.roadmap.studio',
    phaseKey: 'glossary.v3',
    icon: Hammer,
  },
  {
    key: 'aiHost',
    baseKey: 'home.roadmap.aiHost',
    phaseKey: 'glossary.v4',
    icon: BrainCircuit,
  },
];

const systemLabelKeys: Record<System, string> = {
  'D&D': 'glossary.dnd2024',
  CoC: 'glossary.coc7e',
  CP: 'glossary.cyberpunkRed',
};

export function Home({ locale, onEnterPlay, onOpenPlaceholder }: HomeProps) {
  const { t } = createTranslator(locale);
  const { system } = useAppStore();
  const dndChar = useCharacterStore((state) => state.character);
  const cocChar = useCocStore((state) => state.character);
  const cpChar = useCpStore((state) => state.character);

  const activeCharacter =
    system === 'CoC' ? cocChar
    : system === 'CP' ? cpChar
    : dndChar;

  const characterName = (activeCharacter as { name?: string }).name?.trim();

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
          <div className="rounded-lg border border-[#2f2a22]/15 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-md border-[#58180d]/35 text-[#58180d]">{t('home.hero.badge')}</Badge>
              <Badge variant="secondary" className="rounded-md">{t('home.hero.phase')}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-normal md:text-3xl">
              {t('home.hero.title')}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#51483d]">
              {t('home.hero.body')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => onEnterPlay()} className="rounded-md">
                <Play className="mr-2 h-4 w-4" />
                {t('home.hero.enterPlay')}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenPlaceholder('privateImport')}
                className="rounded-md border-[#2f2a22]/20"
              >
                <Import className="mr-2 h-4 w-4" />
                {t('home.hero.privateImport')}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-[#2f2a22]/15 bg-[#17130f] p-5 text-[#f7f3ea] shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4" />
              {t('home.snapshot.title')}
            </div>
            <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-white/55">{t('home.snapshot.activeRuleset')}</div>
              <div className="mt-1 text-lg font-bold">{t(systemLabelKeys[system])}</div>
              <div className="mt-4 text-xs uppercase tracking-wider text-white/55">{t('home.snapshot.currentCharacter')}</div>
              <div className="mt-1 text-base">{characterName || t('home.snapshot.emptyCharacter')}</div>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/65">
              {t('home.snapshot.help')}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[#2f2a22]/15 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{t('home.workspaces.title')}</h2>
              <p className="text-sm text-[#63594d]">{t('home.workspaces.help')}</p>
            </div>
            <Gamepad2 className="h-5 w-5 text-[#58180d]" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {rulesets.map((ruleset) => (
              <button
                key={ruleset.system}
                type="button"
                onClick={() => onEnterPlay(ruleset.system)}
                className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${ruleset.accent}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold">{t(ruleset.labelKey)}</div>
                  <Badge variant="outline" className="rounded-md bg-white/70">{t('home.workspaces.playBadge')}</Badge>
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-[#6a5f52]">{t(`${ruleset.baseKey}.subtitle`)}</div>
                <p className="mt-3 text-sm leading-5 text-[#3e362d]">{t(`${ruleset.baseKey}.description`)}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-[#2f2a22]/15 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#58180d]" />
              <h2 className="text-lg font-bold">{t('home.privateImport.title')}</h2>
            </div>
            <p className="text-sm leading-6 text-[#51483d]">
              {t('home.privateImport.body')}
            </p>
            <Button variant="outline" onClick={() => onEnterPlay()} className="mt-4 rounded-md border-[#2f2a22]/20">
              {t('home.privateImport.action')}
            </Button>
          </div>

          <div className="rounded-lg border border-[#2f2a22]/15 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[#58180d]" />
              <h2 className="text-lg font-bold">{t('home.roadmap.title')}</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {roadmapCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => onOpenPlaceholder(card.key)}
                    className="rounded-lg border border-[#2f2a22]/15 bg-[#faf8f2] p-4 text-left transition hover:border-[#58180d]/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Icon className="h-4 w-4 text-[#58180d]" />
                      <Badge variant="outline" className="rounded-md">{t('home.roadmap.comingSoon')} · {t(card.phaseKey)}</Badge>
                    </div>
                    <div className="mt-3 font-bold">{t(`${card.baseKey}.title`)}</div>
                    <p className="mt-2 text-sm leading-5 text-[#63594d]">{t(`${card.baseKey}.text`)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
