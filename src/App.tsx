import { useState } from 'react';
import { ArrowLeft, ChevronsLeft, ChevronsRight, Gamepad2, HomeIcon, Settings, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Toaster } from '../components/ui/sonner';
import { createTranslator, type Locale, readStoredLocale, writeStoredLocale } from './i18n';
import { Home } from './pages/Home';
import { PlayMenu } from './pages/PlayMenu';
import { PlayWorkspace } from './pages/PlayWorkspace';
import { useAppStore } from './store/appStore';

type AppView = 'home' | 'play' | 'placeholder';
type PlayStage = 'menu' | 'workspace';
type System = 'D&D' | 'CoC' | 'CP';

type PlaceholderKey =
  | 'campaigns'
  | 'community'
  | 'privateImport'
  | 'studio'
  | 'aiHost'
  | 'settings';

// AI-LANDMARK: PLATFORM_PLAY_MENU_COLLAPSIBLE_SIDEBAR
// Sidebar is collapsible (persisted via localStorage); Play opens a ruleset
// menu first, and the selected ruleset workspace is the preserved PlayWorkspace.
const sidebarStorageKey = 'trpg-platform-sidebar-collapsed';

function readStoredSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(sidebarStorageKey) === '1';
}

function writeStoredSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(sidebarStorageKey, collapsed ? '1' : '0');
}

const navItems: {
  key: 'home' | 'play' | 'settings';
  labelKey: string;
  kind: 'view' | 'placeholder';
  icon: typeof HomeIcon;
}[] = [
  { key: 'home', labelKey: 'shell.nav.home', kind: 'view', icon: HomeIcon },
  { key: 'play', labelKey: 'shell.nav.play', kind: 'view', icon: Gamepad2 },
  { key: 'settings', labelKey: 'shell.nav.settings', kind: 'placeholder', icon: Settings },
];

function isPlaceholderKey(value: string): value is PlaceholderKey {
  return ['campaigns', 'community', 'privateImport', 'studio', 'aiHost', 'settings'].includes(value);
}

function normalizeFeatureKey(feature: string): PlaceholderKey {
  const normalized = feature.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return isPlaceholderKey(normalized) ? normalized : 'campaigns';
}

export default function App() {
  const [appView, setAppView] = useState<AppView>('home');
  const [playStage, setPlayStage] = useState<PlayStage>('menu');
  const [activePlaceholder, setActivePlaceholder] = useState<PlaceholderKey>('campaigns');
  const [locale, setLocale] = useState<Locale>(readStoredLocale);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(readStoredSidebarCollapsed);
  const setSystem = useAppStore((state) => state.setSystem);

  const { t } = createTranslator(locale);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      writeStoredSidebarCollapsed(next);
      return next;
    });
  };

  const enterPlay = (system?: System) => {
    if (system) {
      setSystem(system);
      setPlayStage('workspace');
    } else {
      setPlayStage('menu');
    }
    setAppView('play');
  };

  const openPlaceholder = (feature: string) => {
    setActivePlaceholder(normalizeFeatureKey(feature));
    setAppView('placeholder');
  };

  const setLocalePreference = (nextLocale: Locale) => {
    setLocale(nextLocale);
    writeStoredLocale(nextLocale);
  };

  const placeholderBaseKey = `shell.placeholders.${activePlaceholder}`;
  const isPrivateImportPlaceholder = activePlaceholder === 'privateImport';
  const sidebarToggleLabel = t(sidebarCollapsed ? 'shell.sidebar.expand' : 'shell.sidebar.collapse');

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside
          className={`border-b border-[#2f2a22]/15 bg-[#17130f] text-[#f7f3ea] transition-all md:border-b-0 md:border-r ${
            sidebarCollapsed ? 'md:w-16' : 'md:w-64'
          }`}
        >
          <div className="flex h-full flex-col gap-4 p-3">
            <div className={`flex items-center gap-2 ${sidebarCollapsed ? 'md:flex-col md:gap-3' : 'justify-between'}`}>
              <div className="flex min-w-0 items-center gap-2 text-sm font-bold">
                <Sparkles className="h-4 w-4 shrink-0 text-[#f5c518]" />
                {!sidebarCollapsed && <span className="truncate">{t('shell.brand')}</span>}
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={sidebarToggleLabel}
                title={sidebarToggleLabel}
                className="rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
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
                    title={t(item.labelKey)}
                    onClick={() => {
                      if (item.key === 'home') {
                        setAppView('home');
                      } else if (item.key === 'play') {
                        enterPlay();
                      } else {
                        openPlaceholder(item.key);
                      }
                    }}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                      sidebarCollapsed ? 'md:justify-center md:px-2' : ''
                    } ${isActive ? 'bg-white text-[#17130f]' : 'text-white/76 hover:bg-white/10 hover:text-white'}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{t(item.labelKey)}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {appView === 'home' && (
            <Home locale={locale} onEnterPlay={enterPlay} onOpenPlaceholder={openPlaceholder} />
          )}

          {appView === 'play' && playStage === 'menu' && (
            <PlayMenu locale={locale} onSelectSystem={(system) => enterPlay(system)} />
          )}

          {appView === 'play' && playStage === 'workspace' && (
            <div>
              <div className="border-b border-[#2f2a22]/15 px-4 py-2 md:px-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlayStage('menu')}
                  className="rounded-md border-[#2f2a22]/20"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('playMenu.backToMenu')}
                </Button>
              </div>
              <PlayWorkspace />
            </div>
          )}

          {appView === 'placeholder' && activePlaceholder === 'settings' && (
            <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-8 md:px-8">
              <div className="rounded-lg border border-[#2f2a22]/15 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-bold">{t('shell.settings.title')}</h1>

                <section className="mt-6 rounded-lg border border-[#2f2a22]/12 bg-[#faf8f2] p-4">
                  <h2 className="text-base font-bold">{t('shell.settings.language.title')}</h2>
                  <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label={t('shell.settings.language.aria')}>
                    <Button
                      type="button"
                      variant={locale === 'zh-CN' ? 'default' : 'outline'}
                      onClick={() => setLocalePreference('zh-CN')}
                      className="rounded-md"
                    >
                      {t('shell.settings.language.zhCN')}
                    </Button>
                    <Button
                      type="button"
                      variant={locale === 'en' ? 'default' : 'outline'}
                      onClick={() => setLocalePreference('en')}
                      className="rounded-md"
                    >
                      {t('shell.settings.language.en')}
                    </Button>
                  </div>
                </section>

                <section className="mt-4 rounded-lg border border-[#2f2a22]/12 bg-white p-4">
                  <h2 className="text-base font-bold">{t('shell.settings.deferred.title')}</h2>
                  <p className="mt-2 text-sm text-[#51483d]">{t('shell.settings.deferred.body')}</p>
                </section>

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

          {appView === 'placeholder' && activePlaceholder !== 'settings' && (
            <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-8 md:px-8">
              <div className="rounded-lg border border-[#2f2a22]/15 bg-white p-6 shadow-sm">
                {!isPrivateImportPlaceholder && (
                  <div className="mb-4">
                    <Badge variant="outline" className="rounded-md border-[#58180d]/35 text-[#58180d]">
                      {t('shell.comingSoon')}
                    </Badge>
                  </div>
                )}
                <h1 className="text-2xl font-bold">{t(`${placeholderBaseKey}.title`)}</h1>
                <p className="mt-3 text-sm text-[#51483d]">
                  {isPrivateImportPlaceholder ? t(`${placeholderBaseKey}.note`) : t('shell.plannedNote')}
                </p>
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
