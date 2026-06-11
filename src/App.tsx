import { useState } from 'react';
import { BrainCircuit, Boxes, Gamepad2, HomeIcon, Import, Map, Settings, Sparkles, Wrench } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Toaster } from '../components/ui/sonner';
import { createTranslator, type Locale, readStoredLocale, writeStoredLocale } from './i18n';
import { Home } from './pages/Home';
import { PlayWorkspace } from './pages/PlayWorkspace';
import { useAppStore } from './store/appStore';

type AppView = 'home' | 'play' | 'placeholder';
type System = 'D&D' | 'CoC' | 'CP';

type PlaceholderKey =
  | 'campaigns'
  | 'community'
  | 'privateImport'
  | 'studio'
  | 'aiHost'
  | 'settings';

const navItems: {
  key: AppView | PlaceholderKey;
  labelKey: string;
  kind: 'view' | 'placeholder';
  icon: typeof HomeIcon;
}[] = [
  { key: 'home', labelKey: 'shell.nav.home', kind: 'view', icon: HomeIcon },
  { key: 'play', labelKey: 'shell.nav.play', kind: 'view', icon: Gamepad2 },
  { key: 'campaigns', labelKey: 'shell.nav.campaigns', kind: 'placeholder', icon: Map },
  { key: 'community', labelKey: 'shell.nav.community', kind: 'placeholder', icon: Boxes },
  { key: 'privateImport', labelKey: 'shell.nav.privateImport', kind: 'placeholder', icon: Import },
  { key: 'studio', labelKey: 'shell.nav.studio', kind: 'placeholder', icon: Wrench },
  { key: 'aiHost', labelKey: 'shell.nav.aiHost', kind: 'placeholder', icon: BrainCircuit },
  { key: 'settings', labelKey: 'shell.nav.settings', kind: 'placeholder', icon: Settings },
];

function isPlaceholderKey(value: string): value is PlaceholderKey {
  return ['campaigns', 'community', 'privateImport', 'studio', 'aiHost', 'settings'].includes(value);
}

function normalizeFeatureKey(feature: string): PlaceholderKey {
  const normalized = feature.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return isPlaceholderKey(normalized) ? normalized : 'campaigns';
}

function getNextLocale(locale: Locale): Locale {
  return locale === 'zh-CN' ? 'en' : 'zh-CN';
}

export default function App() {
  const [appView, setAppView] = useState<AppView>('home');
  const [activePlaceholder, setActivePlaceholder] = useState<PlaceholderKey>('campaigns');
  const [locale, setLocale] = useState<Locale>(readStoredLocale);
  const setSystem = useAppStore((state) => state.setSystem);

  const { t, tList } = createTranslator(locale);

  const enterPlay = (system?: System) => {
    if (system) setSystem(system);
    setAppView('play');
  };

  const openPlaceholder = (feature: string) => {
    setActivePlaceholder(normalizeFeatureKey(feature));
    setAppView('placeholder');
  };

  const toggleLocale = () => {
    const nextLocale = getNextLocale(locale);
    setLocale(nextLocale);
    writeStoredLocale(nextLocale);
  };

  const placeholderBaseKey = `shell.placeholders.${activePlaceholder}`;
  const placeholderDetails = tList(`${placeholderBaseKey}.details`);

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="border-b border-[#2f2a22]/15 bg-[#17130f] text-[#f7f3ea] md:w-64 md:border-b-0 md:border-r">
          <div className="flex h-full flex-col gap-5 p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="h-4 w-4 text-[#f5c518]" />
                {t('shell.brand')}
              </div>
              <div className="mt-1 text-xs leading-5 text-white/55">
                {t('shell.subtitle')}
              </div>
            </div>

            <nav className="grid gap-1" aria-label={t('shell.navigationLabel')}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.kind === 'view'
                    ? appView === item.key
                    : appView === 'placeholder' && activePlaceholder === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.kind === 'view') {
                        setAppView(item.key as AppView);
                      } else {
                        openPlaceholder(item.key);
                      }
                    }}
                    className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                      isActive ? 'bg-white text-[#17130f]' : 'text-white/76 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {t(item.labelKey)}
                    </span>
                    {item.kind === 'placeholder' && (
                      <span className={`text-[10px] ${isActive ? 'text-[#58180d]' : 'text-white/45'}`}>{t('shell.soon')}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto grid gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/58">
                {t('shell.sidebarNote')}
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/58">{t('shell.language.current')}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleLocale}
                  aria-label={t('shell.language.aria')}
                  className="mt-2 w-full rounded-md border-white/20 bg-white/8 text-white hover:bg-white hover:text-[#17130f]"
                >
                  {t('shell.language.switch')}
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {appView === 'home' && (
            <Home locale={locale} onEnterPlay={enterPlay} onOpenPlaceholder={openPlaceholder} />
          )}

          {appView === 'play' && <PlayWorkspace />}

          {appView === 'placeholder' && (
            <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-8 md:px-8">
              <div className="rounded-lg border border-[#2f2a22]/15 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-md border-[#58180d]/35 text-[#58180d]">
                    {t(`${placeholderBaseKey}.phase`)}
                  </Badge>
                  <Badge variant="secondary" className="rounded-md">{t('shell.placeholderBadge')}</Badge>
                </div>
                <h1 className="text-2xl font-bold">{t(`${placeholderBaseKey}.title`)}</h1>
                <p className="mt-3 text-sm leading-6 text-[#51483d]">{t(`${placeholderBaseKey}.summary`)}</p>
                <div className="mt-5 grid gap-3">
                  {placeholderDetails.map((detail) => (
                    <div key={detail} className="rounded-md border border-[#2f2a22]/12 bg-[#faf8f2] p-3 text-sm leading-6 text-[#51483d]">
                      {detail}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => enterPlay()} className="rounded-md">
                    {t('shell.enterPlay')}
                  </Button>
                  <Button variant="outline" onClick={() => setAppView('home')} className="rounded-md border-[#2f2a22]/20">
                    {t('shell.backHome')}
                  </Button>
                </div>
              </div>
            </main>
          )}
        </section>
      </div>
      <Toaster />
    </div>
  );
}
