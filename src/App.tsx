import { useState } from 'react';
import { ArrowLeft, HomeIcon, Library, MoreHorizontal, Palette, Settings, Sparkles, Store, X } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Toaster } from '../components/ui/sonner';
import { createTranslator, type Locale, readStoredLocale, writeStoredLocale } from './i18n';
import { Home } from './pages/Home';
import { SystemLibrary } from './pages/SystemLibrary';
import { Workshop } from './pages/Workshop';
import { FanPlaza } from './pages/FanPlaza';
import { DocumentLibraryShell } from './components/platform/DocumentLibraryShell';
import { PersonalContentHub } from './components/platform/PersonalContentHub';
import { UserProfileSpace } from './components/platform/UserProfileSpace';
import {
  PlayWorkspace,
  defaultPlayWorkspaceNavigationState,
  type PlayWorkspaceNavigationState,
} from './pages/PlayWorkspace';
import { useAppStore } from './store/appStore';

type AppView = 'home' | 'play' | 'placeholder' | 'systemLibrary' | 'workshop' | 'fanPlaza' | 'documents' | 'personalHub' | 'userProfile';
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
type PlatformNavKey = 'home' | 'systemLibrary' | 'personalHub' | 'workshop' | 'fanPlaza';

// `labelKey` resolves via i18n; `label` is a literal fallback when no key exists
// (e.g. personalHub has no shell.nav key yet — i18n locale files are out of scope).
const PRIMARY_NAV: { key: PlatformNavKey; labelKey?: string; label?: { zh: string; en: string }; icon: typeof HomeIcon }[] = [
  { key: 'home',          labelKey: 'shell.nav.home',          icon: HomeIcon },
  { key: 'systemLibrary', labelKey: 'shell.nav.systemLibrary', icon: Library  },
  { key: 'personalHub',   label: { zh: '我的内容', en: 'My Content' }, icon: Sparkles },
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
  const [profileUserId, setProfileUserId] = useState<string>('author-sample');
  const [activeSettingsCat, setActiveSettingsCat] = useState<string | null>(null);
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
    | 'campaignVault'
    | 'campaignCreation'
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
      if (dndView === 'campaigns')  return 'campaignVault';
      if (dndView === 'createCampaign') return 'campaignCreation';
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
    if (sysView === 'campaigns')    return 'campaignVault';
    if (sysView === 'createCampaign') return 'campaignCreation';
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
      case 'campaignVault':   return 'systemLibrary';
      case 'campaignCreation': return 'campaignVault';
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
      case 'campaignVault':   return 'navigation.breadcrumb.campaignVault';
      case 'campaignCreation': return 'navigation.breadcrumb.campaignCreation';
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
      case 'campaignVault':
        return ['navigation.breadcrumb.campaignVault'];
      case 'campaignCreation':
        return ['navigation.breadcrumb.campaignVault', getBreadcrumbViewLabelKey(nodeType)];
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
        case 'campaignVault':
          next.dndWorkspaceView = 'campaigns';
          break;
        case 'campaignCreation':
          next.dndWorkspaceView = 'createCampaign';
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
        case 'campaignVault':
          next.systemWorkspaceView = 'campaigns';
          break;
        case 'campaignCreation':
          next.systemWorkspaceView = 'createCampaign';
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
    setPlayWorkspaceNavigation({
      ...defaultPlayWorkspaceNavigationState,
      dndWorkspaceView: 'dashboard',
      systemWorkspaceView: 'dashboard',
    });
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
    // Personal Content Hub is a real platform space, not a placeholder.
    if (feature === 'personalHub') {
      setAppView('personalHub');
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
  const navLabel = (item: (typeof PRIMARY_NAV)[number]): string =>
    item.labelKey ? t(item.labelKey) : locale === 'en' ? item.label!.en : item.label!.zh;

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
    if (key === 'settings') {
      setActiveSettingsCat(null); // open to the category list (mobile), not a stale second-level
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
    : appView === 'documents' ? (locale === 'en' ? 'Documents' : '文档资料')
    : appView === 'personalHub' ? (locale === 'en' ? 'My Content' : '我的内容')
    : appView === 'userProfile' ? (locale === 'en' ? 'Profile' : '用户主页')
    : appView === 'play' ? systemLabel
    : activePlaceholder === 'settings' ? t('shell.nav.settings')
    : t(`${placeholderBaseKey}.title`);

  const desktopNavBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
      active ? 'bg-white text-[#17130f]' : 'text-white/76 hover:bg-white/10 hover:text-white'
    }`;

  // Categorized settings (only Language + My Profile are live; rest reserved).
  const SETTINGS_CATS = ['常规', '外观', '语言', '账号', '数据与备份', '媒体与存储', '跑团偏好', '安全与隐私', '帮助与反馈'];
  const settingsReservedContent: Record<string, string[]> = {
    常规: ['默认首页', '默认打开系统', '启动时恢复上次工作区'],
    外观: ['深色 / 浅色 / 跟随系统', '主题皮肤', '强调色', '显示密度'],
    数据与备份: ['导出平台备份', '导入平台备份', '本地备份目录', '清理缓存'],
    媒体与存储: ['素材目录', '图片缓存', '原图保存策略', '存储占用'],
    跑团偏好: ['默认骰子设置', '默认公开 / 私密投骰', '房间显示偏好', '聊天记录保存策略'],
    安全与隐私: ['主页可见性', '收藏夹公开设置', '角色公开默认值', '局域网访问提示'],
    帮助与反馈: ['使用说明', '问题反馈', '举报 / 投诉'],
  };
  const reservedSettingsRow = (label: string) => (
    <div
      key={label}
      className="flex items-center justify-between gap-2 border-b border-[#2f2a22]/8 py-2 text-sm text-[#51483d]/70 last:border-b-0"
    >
      {label}
      <span className="border border-dashed border-[#2f2a22]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/45">
        {t('shell.more.reserved')}
      </span>
    </div>
  );
  const renderSettingsCategory = (cat: string) => {
    if (cat === '语言') {
      return (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('shell.settings.language.aria')}>
          <span className="flex items-center gap-1 rounded-md border border-dashed border-[#2f2a22]/25 px-2.5 py-1 text-xs font-bold text-[#51483d]/55">
            自动检测
            <span className="text-[9px] uppercase tracking-wider text-[#51483d]/45">{t('shell.more.reserved')}</span>
          </span>
          <button
            type="button"
            onClick={() => setLocalePreference('zh-CN')}
            className={`rounded-md border px-2.5 py-1 text-xs font-bold ${locale === 'zh-CN' ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d]'}`}
          >
            {t('shell.settings.language.zhCN')}
          </button>
          <button
            type="button"
            onClick={() => setLocalePreference('en')}
            className={`rounded-md border px-2.5 py-1 text-xs font-bold ${locale === 'en' ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d]'}`}
          >
            {t('shell.settings.language.en')}
          </button>
        </div>
      );
    }
    if (cat === '账号') {
      return (
        <div className="flex flex-col">
          {reservedSettingsRow('昵称')}
          {reservedSettingsRow('头像')}
          <button
            type="button"
            onClick={() => {
              pushNavigation();
              setProfileUserId('author-sample');
              setAppView('userProfile');
            }}
            className="flex items-center justify-between gap-2 border-b border-[#2f2a22]/8 py-2 text-left text-sm font-semibold text-[#17130f] hover:text-[#58180d] last:border-b-0"
          >
            我的主页
            <span className="text-[10px] font-normal text-[#51483d]/50">打开 →</span>
          </button>
          {reservedSettingsRow('登录 / 退出')}
        </div>
      );
    }
    return <div className="flex flex-col">{(settingsReservedContent[cat] ?? []).map(reservedSettingsRow)}</div>;
  };

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
                <span>{navLabel(item)}</span>
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
        {/* Top-right: avatar = account menu entry (not "··· 更多"). */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-label={locale === 'en' ? 'Account menu' : '账号菜单'}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">示</span>
            <span className="hidden lg:inline">示例作者</span>
          </button>
        </div>
      </header>

      {/* ── Mobile: lightweight top app bar ── */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#2f2a22]/15 bg-[#17130f] px-3 py-2 text-[#f7f3ea] md:hidden">
        <div className="flex min-w-0 items-center gap-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 shrink-0 text-[#f5c518]" />
          <span className="truncate">{mobileTitle}</span>
        </div>
        {/* Mobile top-right: avatar = account menu entry. */}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          aria-label={locale === 'en' ? 'Account menu' : '账号菜单'}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white transition hover:bg-white/25"
        >
          示
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
          <Workshop locale={locale} />
        )}

        {appView === 'fanPlaza' && (
          <FanPlaza locale={locale} />
        )}

        {appView === 'documents' && (
          <DocumentLibraryShell locale={locale} onBack={goBack} />
        )}

        {appView === 'personalHub' && (
          <PersonalContentHub locale={locale} />
        )}

        {appView === 'userProfile' && (
          <UserProfileSpace profileUserId={profileUserId} locale={locale} onBack={goBack} />
        )}

        {appView === 'play' && playStage === 'workspace' && (
          <div>
            <div className="border-b border-[#2f2a22]/10 px-4 py-2 md:px-8">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={navigationStack.length > 0 ? goBack : fallbackNavigation}
                  aria-label={navigationStack.length > 0 ? t('navigation.backOneLevel') : t('navigation.noPreviousBackToSystemSelect')}
                  title={navigationStack.length > 0 ? t('navigation.backOneLevel') : t('navigation.noPreviousBackToSystemSelect')}
                  className="rounded-md border-[#2f2a22]/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
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
          <main className="w-full px-4 py-6 md:px-8 md:py-8">
            <div className="mb-6 flex items-center gap-3">
              {activeSettingsCat !== null ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveSettingsCat(null)}
                    aria-label={locale === 'en' ? 'Back to Settings' : '返回设置'}
                    title={locale === 'en' ? 'Back to Settings' : '返回设置'}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2f2a22]/20 bg-white text-[#17130f] transition hover:bg-[#2f2a22]/8 md:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goBack}
                    aria-label={locale === 'en' ? 'Back' : '返回'}
                    title={locale === 'en' ? 'Back' : '返回'}
                    className="hidden h-8 w-8 items-center justify-center rounded-md border border-[#2f2a22]/20 bg-white text-[#17130f] transition hover:bg-[#2f2a22]/8 md:inline-flex"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label={locale === 'en' ? 'Back' : '返回'}
                  title={locale === 'en' ? 'Back' : '返回'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2f2a22]/20 bg-white text-[#17130f] transition hover:bg-[#2f2a22]/8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div>
                <h1 className="hidden text-2xl font-bold md:block">{t('shell.settings.title')}</h1>
                <h1 className="text-2xl font-bold md:hidden">{activeSettingsCat ?? t('shell.settings.title')}</h1>
              </div>
            </div>

            <div className="grid w-full max-w-7xl grid-cols-1 gap-5 md:grid-cols-[16rem_minmax(0,1fr)]">
              <nav className={`flex flex-col gap-1 rounded-lg border border-[#2f2a22]/12 bg-white p-2 md:sticky md:top-20 md:self-start ${activeSettingsCat !== null ? 'hidden md:flex' : 'flex'}`}>
                {SETTINGS_CATS.map((cat) => {
                  const active = (activeSettingsCat ?? '常规') === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveSettingsCat(cat)}
                      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${active ? 'bg-[#17130f] text-white md:bg-[#2f2a22]/10 md:text-[#17130f]' : 'text-[#51483d] hover:bg-[#2f2a22]/8'}`}
                    >
                      {cat}
                      <span className="text-[#51483d]/40 md:hidden">›</span>
                    </button>
                  );
                })}
              </nav>

              <div className={`${activeSettingsCat !== null ? 'block' : 'hidden md:block'}`}>
                <section className="min-h-[420px] rounded-lg border border-[#2f2a22]/12 bg-white p-5 shadow-sm md:p-6">
                  <h2 className="mb-2 hidden text-[11px] font-bold uppercase tracking-wider text-[#51483d] md:block">
                    {activeSettingsCat ?? '常规'}
                  </h2>
                  {renderSettingsCategory(activeSettingsCat ?? '常规')}
                </section>
              </div>
            </div>
          </main>
        )}

        {appView === 'placeholder' && activePlaceholder !== 'settings' && (
          <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
            <button
              type="button"
              onClick={goBack}
              aria-label={locale === 'en' ? 'Back' : '返回'}
              title={locale === 'en' ? 'Back' : '返回'}
              className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2f2a22]/20 bg-white text-[#17130f] transition hover:bg-[#2f2a22]/8"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
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
                <span className="truncate">{navLabel(item)}</span>
              </button>
            );
          })}
          {/* Bottom-right: avatar "我" = account menu entry (not "更多"). */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-label={locale === 'en' ? 'Account menu' : '账号菜单'}
            className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-white/70 transition hover:text-white"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold text-white">示</span>
            <span className="truncate">{locale === 'en' ? 'Me' : '我'}</span>
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
            {/* Account header (avatar / nickname placeholder) */}
            <div className="mb-2 flex items-center gap-2 border-b border-[#2f2a22]/10 pb-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f2a22]/15 to-[#2f2a22]/35 text-sm font-bold text-[#51483d]">
                示
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#17130f]">示例作者</p>
                <p className="truncate text-[11px] text-[#51483d]/60">@graycastle_author</p>
              </div>
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
              {/* 我的主页 */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  pushNavigation();
                  setProfileUserId('author-sample');
                  setAppView('userProfile');
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                <Palette className="h-4 w-4 shrink-0" />
                {locale === 'en' ? 'My Profile' : '我的主页'}
              </button>

              {/* 我的内容 */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMoreOpen(false);
                  pushNavigation();
                  setAppView('personalHub');
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                {locale === 'en' ? 'My Content' : '我的内容'}
              </button>

              {/* 数据与备份 → settings */}
              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavClick('settings')}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                <Library className="h-4 w-4 shrink-0" />
                {locale === 'en' ? 'Data & Backup' : '数据与备份'}
              </button>

              {/* 设置 */}
              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavClick('settings')}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                <Settings className="h-4 w-4 shrink-0" />
                {t('shell.nav.settings')}
              </button>

              {/* 帮助与反馈 → settings */}
              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavClick('settings')}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                <MoreHorizontal className="h-4 w-4 shrink-0" />
                {locale === 'en' ? 'Help & Feedback' : '帮助与反馈'}
              </button>

              <div className="my-1 border-t border-[#2f2a22]/10" />

              {/* 退出登录 (reserved — no real auth) */}
              <button
                type="button"
                role="menuitem"
                disabled
                className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-[#51483d]/55"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  {locale === 'en' ? 'Log out' : '退出登录'}
                </span>
                <span className="border border-dashed border-[#2f2a22]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/50">
                  {t('shell.more.reserved')}
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      <Toaster />
    </div>
  );
}
