import { useState } from 'react';
import { ArrowLeft, ChevronUp, ChevronsLeft, ChevronsRight, HomeIcon, Library, Settings, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Toaster } from '../components/ui/sonner';
import { createTranslator, type Locale, readStoredLocale, writeStoredLocale } from './i18n';
import { Home } from './pages/Home';
import { PlayMenu } from './pages/PlayMenu';
import { SystemLibrary } from './pages/SystemLibrary';
import {
  PlayWorkspace,
  defaultPlayWorkspaceNavigationState,
  type PlayWorkspaceNavigationState,
} from './pages/PlayWorkspace';
import { useAppStore } from './store/appStore';

type AppView = 'home' | 'play' | 'placeholder' | 'systemLibrary';
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
  key: 'home' | 'systemLibrary' | 'settings';
  labelKey: string;
  kind: 'view' | 'placeholder';
  icon: typeof HomeIcon;
}[] = [
  { key: 'home',          labelKey: 'shell.nav.home',          kind: 'view',        icon: HomeIcon },
  { key: 'systemLibrary', labelKey: 'shell.nav.systemLibrary', kind: 'view',        icon: Library  },
  { key: 'settings',      labelKey: 'shell.nav.settings',      kind: 'placeholder', icon: Settings },
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
  const [playWorkspaceNavigation, setPlayWorkspaceNavigation] = useState<PlayWorkspaceNavigationState>(
    defaultPlayWorkspaceNavigationState,
  );
  const [navigationStack, setNavigationStack] = useState<NavigationState[]>([]);
  const system = useAppStore((state) => state.system as System);
  const setSystem = useAppStore((state) => state.setSystem);

  const { t } = createTranslator(locale);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      writeStoredSidebarCollapsed(next);
      return next;
    });
  };

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
  // Parent chain: runtime/builder/actorSheet → actorVault/creationMethod → actorVault → playMenu.
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

  const getParentNodeType = (nodeType: WorkspaceNodeType): WorkspaceNodeType | 'playMenu' => {
    switch (nodeType) {
      case 'runtime':         return 'actorSheet';
      case 'builder':         return 'creationMethod';
      case 'actorSheet':      return 'actorVault';
      case 'actorVault':      return 'playMenu';
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

    if (parentType === 'playMenu') {
      setPlayStage('menu');
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
    pushNavigation();
    if (system) {
      setSystem(system);
      setPlayWorkspaceNavigation(defaultPlayWorkspaceNavigationState);
      setPlayStage('workspace');
    } else {
      setPlayStage('menu');
    }
    setAppView('play');
  };

  const openPlaceholder = (feature: string) => {
    pushNavigation();
    if (feature === 'ruleSystems' || feature === 'systemLibrary') {
      setAppView('systemLibrary');
      return;
    }
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
  const systemLabel = system === 'D&D' ? 'DND 5e 2024' : system === 'CoC' ? 'COC 7e' : 'Cyberpunk RED';

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
                        navigateHome();
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

          {appView === 'systemLibrary' && (
            <SystemLibrary locale={locale} onEnterPlay={enterPlay} />
          )}

          {appView === 'play' && playStage === 'menu' && (
            <PlayMenu locale={locale} onSelectSystem={(system) => enterPlay(system)} />
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
                  <div className="text-xs text-[#51483d]">
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
        </section>
      </div>
      <Toaster />
    </div>
  );
}
