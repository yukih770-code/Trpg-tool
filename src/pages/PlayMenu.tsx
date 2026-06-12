import { ArrowRight, Gamepad2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { createTranslator, type Locale } from '../i18n';

type System = 'D&D' | 'CoC' | 'CP';

type PlayMenuProps = {
  locale: Locale;
  onSelectSystem: (system: System) => void;
};

/**
 * PlayMenu
 *
 * AI-LANDMARK: PLATFORM_PLAY_MENU_COLLAPSIBLE_SIDEBAR
 *
 * Game-style Play main menu: the user picks one ruleset, then enters that
 * ruleset's preserved workspace. Seamless multi-system tab switching is no
 * longer the primary navigation; switching rulesets goes back through this
 * menu. UI structure only — no rules logic and no rule data here.
 */

const systemCards: {
  system: System;
  nameKey: string;
  descKey: string;
  statusKey: string;
  enterKey: string;
  accent: string;
}[] = [
  {
    system: 'D&D',
    nameKey: 'glossary.dnd2024',
    descKey: 'playMenu.dnd.desc',
    statusKey: 'playMenu.status.dataCorrection',
    enterKey: 'playMenu.dnd.enter',
    accent: 'border-[#58180d]/35 bg-[#fff8e6] hover:border-[#58180d]/70',
  },
  {
    system: 'CoC',
    nameKey: 'glossary.coc7e',
    descKey: 'playMenu.coc.desc',
    statusKey: 'playMenu.status.available',
    enterKey: 'playMenu.coc.enter',
    accent: 'border-[#2f7f68]/35 bg-[#f1fbf7] hover:border-[#2f7f68]/70',
  },
  {
    system: 'CP',
    nameKey: 'glossary.cyberpunkRed',
    descKey: 'playMenu.cp.desc',
    statusKey: 'playMenu.status.manualTracking',
    enterKey: 'playMenu.cp.enter',
    accent: 'border-[#f5c518]/45 bg-[#fffbea] hover:border-[#b08d2a]',
  },
];

export function PlayMenu({ locale, onSelectSystem }: PlayMenuProps) {
  const { t } = createTranslator(locale);

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-10 md:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Gamepad2 className="h-6 w-6 text-[#58180d]" />
          <h1 className="text-2xl font-bold md:text-3xl">{t('playMenu.title')}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {systemCards.map((card) => (
            <button
              key={card.system}
              type="button"
              onClick={() => onSelectSystem(card.system)}
              className={`flex flex-col rounded-lg border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.accent}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-lg font-bold">{t(card.nameKey)}</div>
                <Badge variant="outline" className="shrink-0 rounded-md bg-white/70">
                  {t(card.statusKey)}
                </Badge>
              </div>
              <p className="mt-2 flex-1 text-sm leading-5 text-[#51483d]">{t(card.descKey)}</p>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-bold text-[#58180d]">
                {t(card.enterKey)}
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
