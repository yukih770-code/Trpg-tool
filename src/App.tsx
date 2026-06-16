import { useState } from 'react';
import { ArrowLeft, ChevronUp, HomeIcon, Library, MoreHorizontal, Palette, Settings, Sparkles, Store, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Toaster } from '../components/ui/sonner';
import { createTranslator, type Locale, readStoredLocale, writeStoredLocale } from './i18n';
import { Home } from './pages/Home';
import { SystemLibrary } from './pages/SystemLibrary';
import { Workshop } from './pages/Workshop';
import { FanPlaza } from './pages/FanPlaza';
import {
  PlayWorkspace,
  defaultPlayWorkspaceNavigationState,
  type PlayWorkspaceNavigationState,
} from './pages/PlayWorkspace';
import { useAppStore } from './store/appStore';

type AppView = 'home' | 'play' | 'placeholder' | 'systemLibrary' | 'workshop' | 'fanPlaza';
type PlayStage = 'menu' | 'workspace';
type System = 'D&D' | 'CoC' | 'CP';

type PlaceholderKey =
  | 'campaigns'
  | 'community'
  | 'privateImport'
  | 'studio'
  | 'aiHost'
  | 'settings';

type NavigationState = {
  appView: AppView;
  playStage: PlayStage;
  activePlaceholder: PlaceholderKey;
  system: System;
  playWorkspace: PlayWorkspaceNavigationState;
};

function areNavigationStatesEqual(left: NavigationState, right: NavigationState): boolean {
  return (
    left.appView === right.appView &&
    left.playStage === right.playStage &&
    left.activePlaceholder === right.activePlaceholder &&
    left.system === right.system &&
    left.playWorkspace.tab === right.playWorkspace.tab &&
    left.playWorkspace.dndWorkspaceView === right.playWorkspace.dndWorkspaceView &&
    left.playWorkspace.systemWorkspaceView === right.playWorkspace.systemWorkspaceView &&
    left.playWorkspace.plannedSlotTitleKey === right.playWorkspace.plannedSlotTitleKey
  );
}

// AI-LANDMARK: PLATFORM_ADAPTIVE_NAVIGATION_FOCUS_MODE_V1
// Adaptive platform navigation: desktop/tablet top horizontal bar, mobile bottom
// primary nav + More panel. No persistent desktop left sidebar (it squeezed
// system workspaces, especially the DND Builder three-column layout). Complex
// workflow pages (play workspace) use focus mode to reduce platform-nav pressure.
// Platform nav switches top-level modules only; system + page navigation stay
// inside their own surfaces.
type PlatformNavKey = 'home' | 'systemLibrary' | 'workshop' | 'fanPlaza';

const PRIMARY_NAV: { key: PlatformNavKey; labelKey: string; icon: typeof HomeIcon }[] = [
  { key: 'home',          labelKey: 'shell.nav.home',          icon: HomeIcon },
  { key: 'systemLibrary', labelKey: 'shell.nav.systemLibrary', icon: Library  },
  { key: 'workshop',      labelKey: 'shell.nav.workshop',      icon: Store    },
  { key: 'fanPlaza',      labelKey: 'shell.nav.fanPlaza',      icon: Palette  },
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
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  const [playWorkspaceNavigation, setPlayWorkspaceNavigation] = useState<PlayWorkspaceNavigationState>(
    defaultPlayWorkspaceNavigationState,
  );
  const [navigationStack, setNavigationStack] = useState<NavigationState[]>([]);
  const system = useAppStore((state) => state.system as System);
  const setSystem = useAppStore((state) => state.setSystem);

  const { t } = createTranslator(locale);

  // AI-LANDMARK: PLATFORM_NAVIGATION_HISTORY_STACK
  // Lightweight app-level navigation stack. It stores UI location only:
  // app view, play stage, selected system, and workspace tab/mode. Character
  // data remains in system stores and is never copied into navigation history.
  const createNavigationSnapshot = (): NavigationState => ({
    appView,
    playStage,
    activePlaceholder,
    system,
    playWorkspace: playWorkspaceNavigation,
  });

  const pushNavigation = () => {
    const snapshot = createNavigationSnapshot();
    setNavigationStack((prev) => {
      const last = prev[prev.length - 1];
      return last && areNavigationStatesEqual(last, snapshot) ? prev : [...prev, snapshot];
    });
  };

  const restoreNavigation = (previous: NavigationState) => {
    setSystem(previous.system);
    setPlayWorkspaceNavigation(previous.playWorkspace);
    setActivePlaceholder(previous.activePlaceholder);
    setPlayStage(previous.playStage);
    setAppView(previous.appView);
  };

  const fallbackNavigation = () => {
    if (appView === 'play' && playStage === 'workspace') {
      setAppView('systemLibrary');
      return;
    }

    setAppView('home');
  };

  const goBack = () => {
    const previous = navigationStack[navigationStack.length - 1];

    if (!previous) {
      fallbackNavigation();
      return;
    }

    restoreNavigation(previous);
    setNavigationStack((prev) => prev.slice(0, -1));
  };

  // AI-LANDMARK: NAVIGATION_UP_BREADCRUMB_MINIMAL_IMPLEMENTATION_V1
  //
  // Workspace-level node types for deterministic Up navigation.
  // Maps to the LocationNode model in docs/architecture/NAVIGATION_BACK_UP_BREADCRUMB_MODEL.md.
  // Up = parent resolver (deterministic); Back = history stack (unchanged).
  //
  // Parent chain: runtime/builder/actorSheet → actorVault/creationMethod → actorVault → systemLibrary.
  // systemOverview is retained as a low-frequency System Info node; it is not
  // the default landing page or top-nav root.
  type WorkspaceNodeType =
    | 'systemOverview'
    | 'actorVault'
    | 'creationMethod'
    | 'actorSheet'
    | 'rulesCompendium'
    | 'sourceStatus'
    | 'runtime'
    | 'builder';

  const deriveNodeType = (
    sys: System,
    dndView: string,
    sysView: string,
    tab: string,
  ): WorkspaceNodeType => {
    if (sys === 'D&D') {
      if (dndView === 'play') {
        if (tab === 'gameplay') return 'runtime';
        if (tab === 'sheet')    return 'actorSheet';
        return 'builder'; // 'creator'
      }
      if (dndView === 'characters') return 'actorVault';
      if (dndView === 'create')     return 'creationMethod';
      if (dndView === 'compendium') return 'rulesCompendium';
      if (dndView === 'sources')    return 'sourceStatus';
      return 'systemOverview'; // 'dashboard'
    }
    // CoC / CP RED
    if (sysView === 'play') {
      if (tab === 'gameplay') return 'runtime';
      if (tab === 'sheet')    return 'actorSheet';
      return 'builder'; // 'creator'
    }
    if (sysView === 'vault')        return 'actorVault';
    if (sysView === 'createMethod') return 'creationMethod';
    if (sysView === 'sheet')        return 'actorSheet'; // CoC shell summary view
    if (sysView === 'compendium')   return 'rulesCompendium';
    if (sysView === 'sources')      return 'sourceStatus';
    return 'systemOverview'; // 'dashboard' or 'planned'
  };

  const getParentNodeType = (nodeType: WorkspaceNodeType): WorkspaceNodeType | 'systemLibrary' => {
    switch (nodeType) {
      case 'runtime':         return 'actorSheet';
      case 'builder':         return 'creationMethod';
      case 'actorSheet':      return 'actorVault';
      case 'actorVault':      return 'systemLibrary';
      case 'creationMethod':  return 'actorVault';
      case 'rulesCompendium': return 'actorVault';
      case 'sourceStatus':    return 'actorVault';
      case 'systemOverview':  return 'actorVault';
    }
  };

  const getBreadcrumbViewLabelKey = (nodeType: WorkspaceNodeType): string => {
    switch (nodeType) {
      case 'systemOverview':  return 'navigation.breadcrumb.systemOverview';
      case 'actorVault':      return 'navigation.breadcrumb.actorVault';
      case 'creationMethod':  return 'navigation.breadcrumb.creationMethod';
      case 'actorSheet':      return 'navigation.breadcrumb.actorSheet';
      case 'rulesCompendium': return 'navigation.breadcrumb.rulesCompendium';
      case 'sourceStatus':    return 'navigation.breadcrumb.sourceStatus';
      case 'runtime':         return 'navigation.breadcrumb.runtime';
      case 'builder':         return 'navigation.breadcrumb.builder';
    }
  };

  const getBreadcrumbViewLabelKeys = (nodeType: WorkspaceNodeType): string[] => {
    switch (nodeType) {
      case 'actorVault':
        return ['navigation.breadcrumb.actorVault'];
      case 'systemOverview':
        return ['navigation.breadcrumb.actorVault', getBreadcrumbViewLabelKey(nodeType)];
      case 'creationMethod':
        return ['navigation.breadcrumb.actorVault', getBreadcrumbViewLabelKey(nodeType)];
      case 'builder':
        return [
          'navigation.breadcrumb.actorVault',
          'navigation.breadcrumb.creationMethod',
          getBreadcrumbViewLabelKey(nodeType),
        ];
      case 'actorSheet':
        return ['navigation.breadcrumb.actorVault', getBreadcrumbViewLabelKey(nodeType)];
      case 'runtime':
        return [
          'navigation.breadcrumb.actorVault',
          'navigation.breadcrumb.actorSheet',
          getBreadcrumbViewLabelKey(nodeType),
        ];
      case 'rulesCompendium':
      case 'sourceStatus':
        return ['navigation.breadcrumb.actorVault', getBreadcrumbViewLabelKey(nodeType)];
    }
  };

  const goUp = () => {
    const nodeType = deriveNodeType(
      system,
      playWorkspaceNavigation.dndWorkspaceView,
      playWorkspaceNavigation.systemWorkspaceView,
      playWorkspaceNavigation.tab,
    );
    const parentType = getParentNodeType(nodeType);

    pushNavigation(); // snapshot current state so Back can return here

    if (parentType === 'systemLibrary') {
      setAppView('systemLibrary');
      return;
    }

    // Translate parent node type back to PlayWorkspaceNavigationState
    const next: PlayWorkspaceNavigationState = { ...playWorkspaceNavigation };

    if (system === 'D&D') {
      switch (parentType) {
        case 'actorSheet':
          next.dndWorkspaceView = 'play';
          next.tab = 'sheet';
          break;
        case 'actorVault':
          next.dndWorkspaceView = 'characters';
          break;
        case 'creationMethod':
          next.dndWorkspaceView = 'create';
          break;
        case 'systemOverview':
          next.dndWorkspaceView = 'dashboard';
          break;
        default:
          next.dndWorkspaceView = 'characters';
      }
    } else {
      // CoC / CP RED
      switch (parentType) {
        case 'actorSheet':
          if (system === 'CoC') {
            next.systemWorkspaceView = 'sheet';
          } else {
            // CP: embedded sheet tab
            next.systemWorkspaceView = 'play';
            next.tab = 'sheet';
          }
          break;
        case 'actorVault':
          next.systemWorkspaceView = 'vault';
          break;
        case 'creationMethod':
          next.systemWorkspaceView = 'createMethod';
          break;
        case 'systemOverview':
          next.systemWorkspaceView = 'dashboard';
          break;
        default:
          next.systemWorkspaceView = 'vault';
      }
    }

    setPlayWorkspaceNavigation(next);
  };

  const navigateHome = () => {
    if (appView !== 'home') {
      pushNavigation();
    }
    setAppView('home');
  };

  const enterPlay = (system?: System) => {
    if (!system) return;
    pushNavigation();
    setSystem(system);
    setPlayWorkspaceNavigation(defaultPlayWorkspaceNavigationState);
    setPlayStage('workspace');
    setAppView('play');
  };

  const openPlaceholder = (feature: string) => {
    pushNavigation();
    if (feature === 'ruleSystems' || feature === 'systemLibrary') {
      setAppView('systemLibrary');
      return;
    }
    // Creative Workshop has a real scaffold page; never open it as a placeholder.
    if (feature === 'workshop' || feature === 'community') {
      setAppView('workshop');
      return;
    }
    // Fan Plaza is a platform-level scaffold page, not a placeholder.
    if (feature === 'fanPlaza') {
      setAppView('fanPlaza');
      return;
    }
    setActivePlaceholder(normalizeFeatureKey(feature));
    setAppView('placeholder');
  };

  const setLocalePreference = (nextLocale: Locale) => {
    setLocale(nextLocale);
    writeStoredLocale(nextLocale);
  };

  // ── Platform nav helpers ───────────────────────────────────────────────────
  const isNavActive = (key: PlatformNavKey | 'settings'): boolean => {
    if (key === 'settings') return appView === 'placeholder' && activePlaceholder === 'settings';
    return appView === key;
  };

  const handleNavClick = (key: PlatformNavKey | 'settings') => {
    setMoreOpen(false);
    if (key === 'home') {
      navigateHome();
      return;
    }
    openPlaceholder(key);
  };

  const placeholderBaseKey = `shell.placeholders.${activePlaceholder}`;
  const isPrivateImportPlaceholder = activePlaceholder === 'privateImport';
  const systemLabel = system === 'D&D' ? 'DND 5e 2024' : system === 'CoC' ? 'COC 7e' : 'Cyberpunk RED';

  // Complex workflow pages reduce platform-nav pressure (focus mode).
  const focusMode = appView === 'play' && playStage === 'workspace';

  const mobileTitle =
    appView === 'home' ? t('shell.nav.home')
    : appView === 'systemLibrary' ? t('shell.nav.systemLibrary')
    : appView === 'workshop' ? t('shell.nav.workshop')
    : appView === 'fanPlaza' ? t('shell.nav.fanPlaza')
    : appView === 'play' ? systemLabel
    : activePlaceholder === 'settings' ? t('shell.nav.settings')
    : t(`${placeholderBaseKey}.title`);

  const desktopNavBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
      active ? 'bg-white text-[#17130f]' : 'text-white/76 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      {/* ── Desktop / Tablet: top horizontal platform navigation ── */}
      <header className="sticky top-0 z-30 hidden items-center gap-1 border-b border-[#2f2a22]/15 bg-[#17130f] px-3 py-2 text-[#f7f3ea] md:flex md:px-4">
        <div className="mr-2 flex items-center gap-2 text-sm font-bold lg:mr-3">
          <Sparkles className="h-4 w-4 shrink-0 text-[#f5c518]" />
          <span className="hidden lg:inline">{t('shell.brand')}</span>
        </div>
        <nav className="flex items-center gap-1" aria-label={t('shell.navigationLabel')}>
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                aria-current={active ? 'page' : undefined}
                className={desktopNavBtn(active)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
          {/* Settings is inline only on wide desktops; otherwise it lives in More. */}
          <button
            type="button"
            onClick={() => handleNavClick('settings')}
            aria-current={isNavActive('settings') ? 'page' : undefined}
            className={`hidden xl:flex ${desktopNavBtn(isNavActive('settings'))}`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>{t('shell.nav.settings')}</span>
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            title={t('shell.more.open')}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white/76 transition hover:bg-white/10 hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t('shell.nav.more')}</span>
          </button>
        </div>
      </header>

      {/* ── Mobile: lightweight top app bar ── */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#2f2a22]/15 bg-[#17130f] px-3 py-2 text-[#f7f3ea] md:hidden">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 shrink-0 text-[#f5c518]" />
          <span className="truncate">{mobileTitle}</span>
        </div>
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          aria-label={t('shell.more.open')}
          className="ml-auto rounded-md p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      {/* ── Main content (full width; no left sidebar) ── */}
      <div className={`min-w-0 ${focusMode ? '' : 'pb-16 md:pb-0'}`}>
        {appView === 'home' && (
          <Home locale={locale} onEnterPlay={enterPlay} onOpenPlaceholder={openPlaceholder} />
        )}

        {appView === 'systemLibrary' && (
          <SystemLibrary locale={locale} onEnterPlay={enterPlay} />
        )}

        {appView === 'workshop' && (
          <Workshop locale={locale} onBackHome={navigateHome} />
        )}

        {appView === 'fanPlaza' && (
          <FanPlaza locale={locale} onBackHome={navigateHome} />
        )}

        {appView === 'play' && playStage === 'workspace' && (
          <div>
            <div className="border-b border-[#2f2a22]/15 px-4 py-2 md:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={navigationStack.length > 0 ? goBack : fallbackNavigation}
                  title={navigationStack.length > 0 ? t('navigation.backOneLevel') : t('navigation.noPreviousBackToSystemSelect')}
                  className="rounded-md border-[#2f2a22]/20"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t(navigationStack.length > 0 ? 'navigation.backOneLevel' : 'navigation.backToSystemSelect')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goUp}
                  title={t('navigation.upOneLevel')}
                  className="rounded-md border-[#2f2a22]/20"
                >
                  <ChevronUp className="mr-2 h-4 w-4" />
                  {t('navigation.upOneLevel')}
                </Button>
                {/* Full breadcrumb is desktop/tablet only; mobile shows the short title in the app bar. */}
                <div className="hidden text-xs text-[#51483d] md:block">
                  <span className="font-bold">{t('navigation.currentLocation')}：</span>
                  {(() => {
                    const nodeType = deriveNodeType(
                      system,
                      playWorkspaceNavigation.dndWorkspaceView,
                      playWorkspaceNavigation.systemWorkspaceView,
                      playWorkspaceNavigation.tab,
                    );
                    const viewLabels = getBreadcrumbViewLabelKeys(nodeType).map((labelKey) => t(labelKey));
                    return [
                      t('navigation.breadcrumb.platform'),
                      t('navigation.breadcrumb.play'),
                      systemLabel,
                      ...viewLabels,
                    ].join(' / ');
                  })()}
                </div>
              </div>
            </div>
            <PlayWorkspace
              navigationState={playWorkspaceNavigation}
              onNavigationChange={setPlayWorkspaceNavigation}
              onBeforeNavigate={pushNavigation}
              onBack={goBack}
              canGoBack={navigationStack.length > 0}
            />
          </div>
        )}

        {appView === 'placeholder' && activePlaceholder === 'settings' && (
          <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center px-4 py-8 md:px-8">
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
                <Button onClick={() => openPlaceholder('ruleSystems')} className="rounded-md">
                  {t('shell.enterPlay')}
                </Button>
                <Button variant="outline" onClick={navigateHome} className="rounded-md border-[#2f2a22]/20">
                  {t('shell.backHome')}
                </Button>
              </div>
            </div>
          </main>
        )}

        {appView === 'placeholder' && activePlaceholder !== 'settings' && (
          <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center px-4 py-8 md:px-8">
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
                <Button onClick={() => openPlaceholder('ruleSystems')} className="rounded-md">
                  {t('shell.enterPlay')}
                </Button>
                <Button variant="outline" onClick={navigateHome} className="rounded-md border-[#2f2a22]/20">
                  {t('shell.backHome')}
                </Button>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* ── Mobile: bottom primary navigation (hidden in focus mode) ── */}
      {!focusMode && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex border-t border-white/10 bg-[#17130f] text-[#f7f3ea] md:hidden"
          aria-label={t('shell.navigationLabel')}
        >
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${
                  active ? 'text-[#f5c518]' : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{t(item.labelKey)}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-white/70 transition hover:text-white"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="truncate">{t('shell.nav.more')}</span>
          </button>
        </nav>
      )}

      {/* ── More panel (mobile bottom sheet / desktop dropdown) ── */}
      {moreOpen && (
        <>
          <button
            type="button"
            aria-label={t('shell.more.close')}
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/40"
          />
          <div
            role="menu"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border border-[#2f2a22]/15 bg-white p-3 shadow-xl md:inset-auto md:bottom-auto md:right-3 md:top-14 md:w-72 md:rounded-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold">{t('shell.more.title')}</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label={t('shell.more.close')}
                className="rounded-md p-1 text-[#51483d] hover:bg-[#2f2a22]/8"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavClick('settings')}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                <Settings className="h-4 w-4 shrink-0" />
                {t('shell.nav.settings')}
              </button>

              {/* Reserved entries (interface only) */}
              {['aiSettings', 'userCenter', 'serviceStatus', 'membership'].map((key) => (
                <button
                  key={key}
                  type="button"
                  role="menuitem"
                  disabled
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-[#51483d]/60"
                >
                  {t(`shell.more.${key}`)}
                  <span className="border border-dashed border-[#2f2a22]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/50">
                    {t('shell.more.reserved')}
                  </span>
                </button>
              ))}

              <div className="my-1 border-t border-[#2f2a22]/10" />

              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#51483d]/60">
                {t('shell.more.language')}
              </div>
              <div className="flex gap-2 px-3 pb-1">
                <button
                  type="button"
                  onClick={() => setLocalePreference('zh-CN')}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs font-bold ${
                    locale === 'zh-CN' ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d]'
                  }`}
                >
                  {t('shell.settings.language.zhCN')}
                </button>
                <button
                  type="button"
                  onClick={() => setLocalePreference('en')}
                  className={`flex-1 rounded-md border px-2 py-1 text-xs font-bold ${
                    locale === 'en' ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d]'
                  }`}
                >
                  {t('shell.settings.language.en')}
                </button>
              </div>

              <div className="my-1 border-t border-[#2f2a22]/10" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  navigateHome();
                }}
                className="rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                {t('shell.backHome')}
              </button>
            </div>
          </div>
        </>
      )}

      <Toaster />
    </div>
  );
}
