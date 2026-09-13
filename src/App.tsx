import { useEffect, useState } from 'react';
// P5.1 Identity Foundation: first-launch anonymous local user bootstrap.
import { ensureLocalUserIdentity } from './lib/platform/localUserIdentity';
// P5.2 Actor Vault ownership backfill (idempotent, additive, offline-only).
import { ensureActorVaultOwnershipBackfill } from './lib/platform/actorVaultOwnership';
// P5.3 Campaign ownership backfill (same additive-registry pattern as P5.2).
import { ensureCampaignOwnershipBackfill } from './lib/platform/campaignOwnership';
// P5.4: "我的主页" points at the REAL local anonymous user, not 'author-sample'.
import { getCurrentLocalProfileUserId } from './lib/platform/localViewerIdentity';
// P5.10I: one current-viewer account projection drives all account surfaces.
import { getCurrentViewerAccount } from './lib/platform/currentViewerAccount';
import { ArrowLeft, HomeIcon, Library, MoreHorizontal, Palette, Settings, Sparkles, Store, Swords, X } from 'lucide-react';
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
  type PlayWorkspaceBackOverride,
  type PlayWorkspaceNavigationState,
} from './pages/PlayWorkspace';
import { useAppStore } from './store/appStore';
import { classifyApiServiceFailure, isDevApiDemoFallbackEnabled, isPrivateAlphaAuthEnabled, resolveDevViewerUserId } from './lib/api/apiClient';
import { ApiClientError } from './lib/api/apiTypes';
import { authApiClient, type AuthenticatedApiUser } from './lib/api/authApiClient';
import type { WorldServerRecord } from './lib/api/worldServerApiClient';
import { useWorldServers } from './lib/worldServer/useWorldServers';
import { useWorldServerDetail } from './lib/worldServer/useWorldServerDetail';
import { PlatformOperationsWorkspace } from './components/platform/PlatformOperationsWorkspace';
import { ServerContextBar } from './components/platform/ServerContextBar';
import { ServerProfileBoard } from './components/platform/ServerProfileBoard';
import { ServerCampaignWorkspace } from './components/platform/ServerCampaignWorkspace';
import { LocalDevIdentitySwitcher } from './components/platform/LocalDevIdentitySwitcher';
import { PrivateAlphaLoginPanel } from './components/platform/PrivateAlphaLoginPanel';
import { ServerInvitePanel } from './components/platform/ServerInvitePanel';
import { DndPrivateSpeciesPackEditorPanel } from './components/platform/DndPrivateSpeciesPackEditorPanel';
import { AiSettingsPanel } from './components/platform/AiSettingsPanel';

type AppView = 'home' | 'play' | 'placeholder' | 'systemLibrary' | 'workshop' | 'fanPlaza' | 'documents' | 'personalHub' | 'userProfile';
type PlayStage = 'menu' | 'workspace';
type System = 'D&D' | 'CoC' | 'CP';
type EntryStage = 'launcher' | 'serverSelect' | 'serverHome' | 'platform';
type MockWorldServerRole = 'owner' | 'admin' | 'member';

type DisplayWorldServer = {
  id: string;
  name: string;
  description: string;
  role: MockWorldServerRole;
  memberCount?: number;
  activeCampaigns?: number;
  enabledSystems: string[];
  lastActive?: string;
  lifecycleStatus?: string;
  ownerId?: string;
  defaultGameSystemId?: string;
  source: 'api' | 'demo';
};

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
type MobileNavKey = 'home' | 'campaigns' | 'systemLibrary' | 'personalHub';

// `labelKey` resolves via i18n; `label` is a literal fallback when no key exists
// (e.g. personalHub has no shell.nav key yet — i18n locale files are out of scope).
const PRIMARY_NAV: { key: PlatformNavKey; labelKey?: string; label?: { zh: string; en: string }; icon: typeof HomeIcon }[] = [
  { key: 'home',          labelKey: 'shell.nav.home',          icon: HomeIcon },
  { key: 'systemLibrary', labelKey: 'shell.nav.systemLibrary', icon: Library  },
  { key: 'personalHub',   label: { zh: '我的资料库', en: 'My Library' }, icon: Sparkles },
  { key: 'workshop',      labelKey: 'shell.nav.workshop',      icon: Store    },
  { key: 'fanPlaza',      labelKey: 'shell.nav.fanPlaza',      icon: Palette  },
];

const MOCK_WORLD_SERVERS: DisplayWorldServer[] = [
  {
    id: 'server-starlit-table',
    name: '星灯跑团会',
    description: '奇幻、调查与赛博朋克混合的长期社群空间。',
    role: 'owner',
    memberCount: 8,
    activeCampaigns: 3,
    // Dev-only demo seed (VITE_SERVER_WORKSPACE_DEMO). Kept D&D-only so a
    // developer with the flag on never sees a paused system look enabled.
    enabledSystems: ['DND 5e'],
    lastActive: '刚刚',
    source: 'demo',
  },
  {
    id: 'server-night-archive',
    name: '夜航档案馆',
    description: '偏调查、悬疑和短篇战役的朋友服务器。',
    role: 'member',
    memberCount: 5,
    activeCampaigns: 1,
    enabledSystems: ['DND 5e'],
    lastActive: '昨天',
    source: 'demo',
  },
];

const roleLabel: Record<MockWorldServerRole, string> = {
  owner: '服主',
  admin: '管理员',
  member: '成员',
};

function isPlaceholderKey(value: string): value is PlaceholderKey {
  return ['campaigns', 'community', 'privateImport', 'studio', 'aiHost', 'settings'].includes(value);
}

function apiErrorMessage(error: ApiClientError | null, locale: Locale, privateAlphaAuthEnabled = false): string {
  if (!error) return '';
  if (privateAlphaAuthEnabled && error.statusCode === 401) {
    return locale === 'en' ? 'Your sign-in session expired. Please sign in again.' : '登录已失效，请重新登录。';
  }
  switch (classifyApiServiceFailure(error)) {
    case 'invalid_dev_identity': return locale === 'en' ? 'The current dev user is not present in the local database. Create the dev viewer fixture first.' : '当前开发用户未在本地数据库中创建，请先创建 dev viewer fixture。';
    case 'backend_unreachable': return locale === 'en' ? 'Cannot reach the local backend. Make sure it is running.' : '无法连接本地服务器，请确认后端已经启动。';
    case 'service_unavailable': return locale === 'en' ? 'The world server service is temporarily unavailable.' : '世界服务器服务暂时不可用。';
    case 'access_denied': return locale === 'en' ? 'You do not have access to this server.' : '你没有权限访问这个服务器。';
    case 'not_found': return locale === 'en' ? 'This server could not be found.' : '找不到这个服务器。';
    default: return locale === 'en' ? 'The server list request failed. Please try again.' : '服务器列表请求失败，请稍后重试。';
  }
}

function normalizeFeatureKey(feature: string): PlaceholderKey {
  const normalized = feature.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return isPlaceholderKey(normalized) ? normalized : 'campaigns';
}

function createServerHandle(displayName: string): string {
  const normalized = displayName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'server';
  const suffix = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${normalized}-${suffix}`;
}

function createServerErrorMessage(error: ApiClientError | null, locale: Locale, privateAlphaAuthEnabled = false): string {
  // A missing local dev user arrives as a 409, but it is an identity problem,
  // not a duplicate — say so instead of telling the host to retry.
  if (classifyApiServiceFailure(error) === 'invalid_dev_identity') return apiErrorMessage(error, locale, privateAlphaAuthEnabled);
  if (error?.statusCode === 400) return locale === 'en' ? 'Unable to create the server. Check the server name and try again.' : '无法创建服务器，请检查服务器名称后重试。';
  if (error?.statusCode === 409) return locale === 'en' ? 'This server request conflicts with existing data. Try again.' : '服务器创建请求与现有数据冲突，请重试。';
  return apiErrorMessage(error, locale, privateAlphaAuthEnabled);
}

export default function App() {
  // AI-LANDMARK: LOCAL_ANONYMOUS_USER_IDENTITY_V1 (first-launch bootstrap)
  // Idempotent: creates the device-local anonymous user once, then no-ops.
  // Offline-only; no login, no network; changes no visible behavior.
  useEffect(() => {
    ensureLocalUserIdentity();
    // P5.2: assign the local anonymous user as owner of existing local actors.
    // Additive registry only — reads character stores, writes a separate key,
    // idempotent, no character-schema change, no visible behavior change.
    ensureActorVaultOwnershipBackfill();
    // P5.3: same for local campaigns. Additive registry, idempotent, never
    // throws — startup can never be blocked by ownership backfill.
    ensureCampaignOwnershipBackfill();
  }, []);

  const [appView, setAppView] = useState<AppView>('home');
  const [playStage, setPlayStage] = useState<PlayStage>('menu');
  const [activePlaceholder, setActivePlaceholder] = useState<PlaceholderKey>('campaigns');
  const [locale, setLocale] = useState<Locale>(readStoredLocale);
  const [entryStage, setEntryStage] = useState<EntryStage>('launcher');
  const privateAlphaAuthEnabled = isPrivateAlphaAuthEnabled();
  const [privateAlphaAuthState, setPrivateAlphaAuthState] = useState<{
    status: 'checking' | 'authenticated' | 'unauthenticated';
    user?: AuthenticatedApiUser;
    error?: ApiClientError | null;
    reason?: 'login' | 'expired';
  }>({ status: privateAlphaAuthEnabled ? 'checking' : 'unauthenticated' });
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [createServerName, setCreateServerName] = useState<string>('');
  const [createServerError, setCreateServerError] = useState<ApiClientError | null>(null);
  const [createServerLoading, setCreateServerLoading] = useState<boolean>(false);
  const [moreOpen, setMoreOpen] = useState<boolean>(false);
  // P5.4: default profile identity = the device's local anonymous user (lazy init
  // is safe: the repository creates the user on first access, idempotently).
  const [profileUserId, setProfileUserId] = useState<string>(() => getCurrentLocalProfileUserId());
  // P5.10I: single account projection for the top-nav + account dropdown.
  const viewerAccount = getCurrentViewerAccount(locale === 'en' ? 'en' : 'zh');
  const [activeSettingsCat, setActiveSettingsCat] = useState<string | null>(null);
  const [playWorkspaceNavigation, setPlayWorkspaceNavigation] = useState<PlayWorkspaceNavigationState>(
    defaultPlayWorkspaceNavigationState,
  );
  const [navigationStack, setNavigationStack] = useState<NavigationState[]>([]);
  const [playWorkspaceBackOverride, setPlayWorkspaceBackOverride] =
    useState<PlayWorkspaceBackOverride | null>(null);
  const [workshopReturnToCreator, setWorkshopReturnToCreator] = useState(false);
  const system = useAppStore((state) => state.system as System);
  const setSystem = useAppStore((state) => state.setSystem);
  useEffect(() => {
    let active = true;
    if (!privateAlphaAuthEnabled) {
      setPrivateAlphaAuthState({ status: 'unauthenticated' });
      return () => { active = false; };
    }
    void authApiClient.me()
      .then((result) => {
        if (!active) return;
        setPrivateAlphaAuthState(result.authenticated && result.user
          ? { status: 'authenticated', user: result.user }
          : { status: 'unauthenticated' });
      })
      .catch((error) => {
        if (!active) return;
        setPrivateAlphaAuthState({ status: 'unauthenticated', error: error instanceof ApiClientError ? error : new ApiClientError('network', 'Authentication request failed.') });
      });
    return () => { active = false; };
  }, [privateAlphaAuthEnabled]);

  const apiIdentityReady = !privateAlphaAuthEnabled || privateAlphaAuthState.status === 'authenticated';
  const worldServersState = useWorldServers({ enabled: entryStage !== 'launcher' && apiIdentityReady });
  const worldServerDetail = useWorldServerDetail(selectedServerId, {
    enabled: entryStage !== 'launcher' && selectedServerId !== '' && apiIdentityReady,
  });
  useEffect(() => {
    if (privateAlphaAuthEnabled && worldServersState.error?.statusCode === 401) {
      setPrivateAlphaAuthState({ status: 'unauthenticated', error: worldServersState.error, reason: 'expired' });
    }
  }, [privateAlphaAuthEnabled, worldServersState.error]);
  const viewerUserId = privateAlphaAuthEnabled ? privateAlphaAuthState.user?.userId : resolveDevViewerUserId();
  const demoFallbackEnabled = isDevApiDemoFallbackEnabled();
  const apiWorldServers: DisplayWorldServer[] = worldServersState.servers.map((server: WorldServerRecord) => ({
    id: server.worldServerId,
    name: server.displayName,
    description: server.description ?? '',
    role: server.ownerId === viewerUserId ? 'owner' : 'member',
    enabledSystems: [],
    lifecycleStatus: server.lifecycleStatus,
    ownerId: server.ownerId,
    defaultGameSystemId: server.defaultGameSystemId,
    source: 'api',
  }));
  const displayWorldServers = apiWorldServers.length > 0
    ? apiWorldServers
    : (demoFallbackEnabled ? MOCK_WORLD_SERVERS : []);
  const selectedWorldServer = displayWorldServers.find((server) => server.id === selectedServerId);
  const selectedApiServer = worldServerDetail.server ?? worldServersState.servers.find((server) => server.worldServerId === selectedServerId) ?? null;
  const selectedViewerMembership = viewerUserId
    ? worldServerDetail.members.find((member) => member.userId === viewerUserId)
    : undefined;
  const canManageSelectedServer = Boolean(
    selectedApiServer && viewerUserId && (
      selectedApiServer.ownerId === viewerUserId
      || selectedViewerMembership?.roleKey === 'owner'
      || selectedViewerMembership?.roleKey === 'admin'
    ),
  );
  const selectedServerMemberCount = selectedWorldServer?.source === 'api'
    ? worldServerDetail.members.length
    : selectedWorldServer?.memberCount;
  const selectedServerSystems = selectedWorldServer?.source === 'api'
    ? worldServerDetail.gameSystems
      .filter((binding) => binding.bindingStatus !== 'archived')
      .map((binding) => binding.gameSystemId)
    : selectedWorldServer?.enabledSystems ?? [];
  const selectedServerRoleLabel = selectedWorldServer
    ? locale === 'en'
      ? ({ owner: 'Owner', admin: 'Admin', member: 'Member' } as const)[selectedWorldServer.role]
      : roleLabel[selectedWorldServer.role]
    : '';

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

  const handlePlayWorkspaceBack = () => {
    if (playWorkspaceBackOverride) {
      playWorkspaceBackOverride.onBack();
      return;
    }
    if (navigationStack.length > 0) {
      goBack();
      return;
    }
    fallbackNavigation();
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
    if (feature === 'workshop' || feature === 'community') {
      setWorkshopReturnToCreator(false);
      setAppView('workshop');
      return;
    }
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

  const openCampaignHub = () => {
    if (selectedApiServer) {
      openPlaceholder('campaigns');
      return;
    }
    pushNavigation();
    setPlayWorkspaceNavigation({
      ...defaultPlayWorkspaceNavigationState,
      dndWorkspaceView: system === 'D&D' ? 'campaigns' : 'dashboard',
      systemWorkspaceView: system === 'D&D' ? 'dashboard' : 'campaigns',
    });
    setPlayStage('workspace');
    setAppView('play');
  };

  const openPersonalContentWorkshop = () => {
    setWorkshopReturnToCreator(true);
    setAppView('workshop');
  };

  const returnToCreatorFromWorkshop = () => {
    setWorkshopReturnToCreator(false);
    setPlayStage('workspace');
    setAppView('play');
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

  const mobilePrimaryNav: { key: MobileNavKey; label: string; icon: typeof HomeIcon }[] = [
    { key: 'home', label: t('shell.nav.home'), icon: HomeIcon },
    { key: 'campaigns', label: locale === 'en' ? 'Campaigns' : '战役', icon: Swords },
    { key: 'systemLibrary', label: locale === 'en' ? 'Systems' : '系统', icon: Library },
    { key: 'personalHub', label: locale === 'en' ? 'Library' : '资料', icon: Sparkles },
  ];

  const isMobileNavActive = (key: MobileNavKey): boolean => {
    if (key === 'campaigns') {
      return (appView === 'placeholder' && activePlaceholder === 'campaigns')
        || (appView === 'play' && (
          system === 'D&D'
            ? playWorkspaceNavigation.dndWorkspaceView === 'campaigns'
            : playWorkspaceNavigation.systemWorkspaceView === 'campaigns'
        ));
    }
    return appView === key;
  };

  const handleMobileNavClick = (key: MobileNavKey) => {
    if (key === 'campaigns') {
      setMoreOpen(false);
      openCampaignHub();
      return;
    }
    handleNavClick(key);
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
    : appView === 'personalHub' ? (locale === 'en' ? 'My Library' : '我的资料库')
    : appView === 'userProfile' ? (locale === 'en' ? 'Profile' : '用户主页')
    : appView === 'play' ? systemLabel
    : activePlaceholder === 'settings' ? t('shell.nav.settings')
    : t(`${placeholderBaseKey}.title`);

  const desktopNavBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
      active ? 'bg-white text-[#17130f]' : 'text-white/76 hover:bg-white/10 hover:text-white'
    }`;

  // Categorized settings (only Language + My Profile are active today; server
  // admin groups stay visible as unavailable owner/admin sections).
  const SETTINGS_CATS = [
    '常规',
    '外观',
    '语言',
    '账号',
    '服务器设置',
    '成员与角色',
    '邀请与加入申请',
    '游戏系统',
    '图鉴与资料包',
    '聊天与发言',
    '战役与房间',
    'AI 与自动化',
    '高级设置',
    '数据与备份',
    '媒体与存储',
    '跑团偏好',
    '安全与隐私',
    '帮助与反馈',
  ];
  const settingsReservedContent: Record<string, string[]> = {
    常规: ['默认首页', '默认打开系统', '启动时恢复上次工作区'],
    外观: ['深色 / 浅色 / 跟随系统', '主题皮肤', '强调色', '显示密度'],
    服务器设置: ['服务器名称', '服务器简介', '图标 / 封面', '可见性', '默认服务器首页', '服务器公告栏'],
    成员与角色: ['设置管理员', '成员角色', '权限矩阵', '封禁 / 黑名单', '成员可见性'],
    邀请与加入申请: ['邀请链接', '房间码策略', '加入申请', '审批队列', '邀请过期策略'],
    游戏系统: ['已启用游戏系统', '默认起始系统', '规则集版本', '不同战役可使用不同系统', '自定义系统入口'],
    图鉴与资料包: ['服务器图鉴', '私有资料包', '工坊资料包', '资料包版本', '发布到服务器图鉴'],
    聊天与发言: ['公告发布权限', '频道 / 聊天室规则', '@全体成员权限', '上传文件权限', '消息管理权限'],
    战役与房间: ['谁可以创建战役', '谁可以创建房间', '房间可见性', '旧版本房间加入策略', '运行中房间兼容策略'],
    高级设置: ['服务器刷新策略', '软更新策略', '规则版本发布', '公式编辑器', '导入 / 导出', '备份与恢复', '审计日志', '危险区'],
    数据与备份: ['导出平台备份', '导入平台备份', '本地备份目录', '清理缓存'],
    媒体与存储: ['素材目录', '图片缓存', '原图保存策略', '存储占用'],
    跑团偏好: ['默认骰子设置', '默认公开 / 私密投骰', '房间显示偏好', '聊天记录保存策略'],
    安全与隐私: ['主页可见性', '收藏夹公开设置', '角色公开默认值', '局域网访问提示'],
    帮助与反馈: ['使用说明', '问题反馈', '举报 / 投诉'],
  };
  const serverAdminSettingsCats = new Set([
    '服务器设置',
    '成员与角色',
    '邀请与加入申请',
    '游戏系统',
    '图鉴与资料包',
    '聊天与发言',
    '战役与房间',
    '高级设置',
  ]);
  const reservedSettingsRow = (label: string) => (
    <div
      key={label}
      className="flex items-center justify-between gap-2 border-b border-[#2f2a22]/8 py-2 text-sm text-[#51483d]/70 last:border-b-0"
    >
      {label}
      <span className="border border-dashed border-[#2f2a22]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/45">
        {locale === 'en' ? 'Unavailable' : '暂未开放'}
      </span>
    </div>
  );
  const renderServerDataSettingsRows = (cat: string) => {
    if (!selectedApiServer || entryStage !== 'platform') return null;
    const settings = worldServerDetail.settings?.settings ?? selectedApiServer.serverSettingsPayload;
    const rows = cat === '服务器设置'
      ? [
          ['服务器名称', selectedApiServer.displayName],
          ['服务器简介', selectedApiServer.description || '未填写'],
          ['可见性', selectedApiServer.serverVisibility],
          ['加入方式', selectedApiServer.joinPolicy],
          ['生命周期', selectedApiServer.lifecycleStatus],
        ]
      : cat === '成员与角色'
        ? [['成员数量', `${worldServerDetail.members.length}`], ['角色数量', `${worldServerDetail.roles.length}`]]
        : cat === '游戏系统'
          ? worldServerDetail.gameSystems.map((systemBinding) => [
              systemBinding.isDefault ? '默认起始系统' : '已启用游戏系统',
              systemBinding.displayName,
            ])
          : cat === '高级设置'
            ? [['设置字段', `${Object.keys(settings).length}`], ['状态', '可在服务器设置中继续配置']]
            : [];
    if (rows.length === 0) return null;
    return (
      <div className="flex flex-col">
        <div className="mb-3 rounded-lg border border-[#2f2a22]/12 bg-[#f7f3ea] px-3 py-2 text-xs leading-5 text-[#51483d]">
          仅显示当前服务器已同步的资料；修改权限仍由服务器端决定。
        </div>
        {rows.map(([label, value]) => (
          <div key={`${cat}-${label}-${value}`} className="flex items-center justify-between gap-3 border-b border-[#2f2a22]/8 py-2 text-sm last:border-b-0">
            <span className="text-[#51483d]/70">{label}</span>
            <span className="text-right font-semibold text-[#17130f]">{value}</span>
          </div>
        ))}
      </div>
    );
  };
  const renderReservedSettingsRows = (cat: string) => {
    const serverData = renderServerDataSettingsRows(cat);
    if (serverData) return serverData;
    return (
      <div className="flex flex-col">
        {serverAdminSettingsCats.has(cat) && (
          <div className="mb-3 rounded-lg border border-[#2f2a22]/12 bg-[#f7f3ea] px-3 py-2 text-xs leading-5 text-[#51483d]">
            仅服主 / 管理员可修改。
          </div>
        )}
        {(settingsReservedContent[cat] ?? []).map(reservedSettingsRow)}
      </div>
    );
  };
  const renderSettingsCategory = (cat: string) => {
    if (cat === 'AI 与自动化') {
      return <AiSettingsPanel locale={locale} />;
    }
    if (cat === '邀请与加入申请' && selectedServerId && entryStage === 'platform') {
      return <ServerInvitePanel worldServerId={selectedServerId} locale={locale} canManage={canManageSelectedServer} />;
    }
    if (cat === '图鉴与资料包' && selectedServerId && entryStage === 'platform') {
      return <DndPrivateSpeciesPackEditorPanel
        locale={locale}
        worldServerId={selectedServerId}
        canManage={canManageSelectedServer}
        dndEnabled={worldServerDetail.gameSystems.some((binding) => binding.bindingStatus !== 'archived' && binding.gameSystemId === 'dnd5e-2024')}
      />;
    }
    if (cat === '语言') {
      const isZh = locale === 'zh-CN';
      const isEn = locale === 'en';
      return (
        <div className="flex max-w-md flex-col gap-2" role="group" aria-label={t('shell.settings.language.aria')}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#51483d]/55">
            {isEn ? 'Interface language' : '当前界面语言'}
          </div>

          {/* 中文 — recommended / active */}
          <button
            type="button"
            onClick={() => setLocalePreference('zh-CN')}
            aria-pressed={isZh}
            className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${isZh ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d] hover:border-[#2f2a22]/40'}`}
          >
            <span className="text-sm font-bold">{t('shell.settings.language.zhCN')}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isZh ? 'text-white/80' : 'text-[#51483d]/55'}`}>
              {isZh ? (isEn ? 'Active' : '已启用') : (isEn ? 'Recommended' : '推荐')}
            </span>
          </button>

          {/* English — still switchable, but flagged incomplete (Beta) */}
          <button
            type="button"
            onClick={() => setLocalePreference('en')}
            aria-pressed={isEn}
            className={`flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-left transition ${isEn ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d] hover:border-[#2f2a22]/40'}`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">{t('shell.settings.language.en')}</span>
              <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isEn ? 'border-white/40 text-white/80' : 'border-[#2f2a22]/30 text-[#51483d]/55'}`}>Beta</span>
            </span>
            <span className={`text-[10px] ${isEn ? 'text-white/70' : 'text-[#51483d]/55'}`}>
              {isEn ? 'Translation incomplete — some UI may still show Chinese.' : '暂未完整翻译，部分界面仍可能显示中文。'}
            </span>
          </button>

          {/* Auto-follow is a future note, not a selectable language. */}
          <div className="mt-1 rounded-lg border border-dashed border-[#2f2a22]/25 px-3 py-2 text-[11px] text-[#51483d]/55">
            {isEn
              ? 'Auto language: not available yet.'
              : '自动跟随语言：暂未开放。'}
          </div>
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
              setProfileUserId(getCurrentLocalProfileUserId());
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
    return renderReservedSettingsRows(cat);
  };

  const resetPlatformLocation = () => {
    setAppView('home');
    setPlayStage('menu');
    setActivePlaceholder('campaigns');
    setPlayWorkspaceNavigation(defaultPlayWorkspaceNavigationState);
    setNavigationStack([]);
    setPlayWorkspaceBackOverride(null);
    setActiveSettingsCat(null);
  };

  const handleCreateServer = async () => {
    const displayName = createServerName.trim();
    if (!displayName) {
      setCreateServerError(new ApiClientError('api_error', locale === 'en' ? 'Enter a server name.' : '请输入服务器名称。'));
      return;
    }
    setCreateServerLoading(true);
    setCreateServerError(null);
    try {
      const server = await worldServersState.createServer({
        displayName,
        serverHandle: createServerHandle(displayName),
      });
      setCreateServerName('');
      setSelectedServerId(server.worldServerId);
      resetPlatformLocation();
      setEntryStage('platform');
    } catch (error) {
      setCreateServerError(error instanceof ApiClientError ? error : new ApiClientError('network', locale === 'en' ? 'Server creation failed.' : '创建服务器失败。'));
    } finally {
      setCreateServerLoading(false);
    }
  };

  const exitCurrentServer = () => {
    setMoreOpen(false);
    resetPlatformLocation();
    setSelectedServerId('');
    setEntryStage('serverSelect');
  };

  const openSelectedServerSettings = () => {
    setEntryStage('platform');
    setAppView('placeholder');
    setActivePlaceholder('settings');
    setActiveSettingsCat('服务器设置');
  };

  const logoutToLauncher = async () => {
    setMoreOpen(false);
    resetPlatformLocation();
    setSelectedServerId('');
    if (privateAlphaAuthEnabled) {
      try {
        await authApiClient.logout();
      } catch {
        // Client state must still return to the login gate after a failed logout request.
      }
      setPrivateAlphaAuthState({ status: 'unauthenticated' });
    }
    setEntryStage('launcher');
  };

  const signInPrivateAlpha = async (input: { displayName: string; accessCode: string }) => {
    setPrivateAlphaAuthState((previous) => ({ ...previous, status: 'checking', error: null, reason: undefined }));
    try {
      const result = await authApiClient.loginPrivateAlpha(input);
      setPrivateAlphaAuthState({ status: 'authenticated', user: result.user });
      resetPlatformLocation();
      setEntryStage('serverSelect');
    } catch (error) {
      setPrivateAlphaAuthState({
        status: 'unauthenticated',
        error: error instanceof ApiClientError ? error : new ApiClientError('network', 'Sign-in request failed.'),
        reason: 'login',
      });
    }
  };

  if (privateAlphaAuthEnabled && privateAlphaAuthState.status !== 'authenticated') {
    const authError = privateAlphaAuthState.error;
    const authMessage = privateAlphaAuthState.status === 'checking'
      ? null
      : authError?.statusCode === 401 && privateAlphaAuthState.reason === 'expired'
        ? t('privateAlphaAuth.sessionExpired')
        : authError?.statusCode === 401
        ? t('privateAlphaAuth.invalidCredentials')
        : authError?.statusCode === 503
          ? t('privateAlphaAuth.serviceUnavailable')
          : authError?.kind === 'network'
            ? t('privateAlphaAuth.backendUnreachable')
            : authError
              ? t('privateAlphaAuth.requestFailed')
              : null;
    if (privateAlphaAuthState.status === 'checking' && !authError) {
      return <div className="flex min-h-screen items-center justify-center bg-[#17130f] text-sm font-semibold text-white/70">{t('privateAlphaAuth.checking')}</div>;
    }
    return <PrivateAlphaLoginPanel locale={locale} loading={privateAlphaAuthState.status === 'checking'} error={authMessage} onSubmit={signInPrivateAlpha} onToggleLocale={() => setLocalePreference(locale === 'en' ? 'zh-CN' : 'en')} />;
  }

  if (entryStage === 'launcher') {
    return (
      <div className="min-h-screen bg-[#17130f] text-[#f7f3ea]">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl min-w-0 flex-col overflow-x-hidden px-4 py-6 md:px-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="h-4 w-4 text-[#f5c518]" />
              {t('shell.brand')}
            </div>
            <button
              type="button"
              onClick={() => setLocalePreference(locale === 'en' ? 'zh-CN' : 'en')}
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10"
            >
              {locale === 'en' ? '中文' : 'English'}
            </button>
          </header>

          <main className="grid min-w-0 flex-1 items-center gap-8 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="min-w-0">
              <div className="mb-4 inline-flex rounded-full border border-[#f5c518]/25 bg-[#f5c518]/10 px-3 py-1 text-xs font-bold text-[#f5c518]">
                {locale === 'en' ? 'Local & LAN play' : '本地与局域网'}
              </div>
              <h1 className="max-w-full break-words text-3xl font-black leading-[1.1] tracking-tight sm:max-w-3xl sm:text-5xl md:text-6xl [overflow-wrap:anywhere]">
                {locale === 'en' ? (
                  'Choose a server. Start your next session.'
                ) : (
                  <>选择服务器，<span className="block sm:inline">开始你的下一场跑团。</span></>
                )}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
                {locale === 'en'
                  ? 'Continue an existing campaign or create a new table space.'
                  : '继续已有战役，或创建一个新的跑团空间。'}
              </p>
              <div className="mt-8">
                <Button
                  type="button"
                  onClick={() => setEntryStage('serverSelect')}
                  className="rounded-md bg-[#f5c518] text-[#17130f] hover:bg-[#f5c518]/90"
                >
                  {locale === 'en' ? 'Open server workspace' : '进入服务器工作台'}
                </Button>
              </div>
            </section>

            <aside className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
              <div className="text-xs font-bold uppercase tracking-widest text-white/50">
                {locale === 'en' ? 'From server to table' : '从服务器到跑团桌面'}
              </div>
              <ol className="mt-4 grid gap-3 text-sm text-white/75">
                {[
                  locale === 'en' ? 'Choose or create a server' : '选择或创建服务器',
                  locale === 'en' ? 'Open a campaign and room' : '打开战役与房间',
                  locale === 'en' ? 'Bring your character into Runtime' : '带上角色进入跑团桌面',
                ].map((label, index) => (
                  <li key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/8 bg-black/10 px-3 py-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5c518]/12 text-[10px] font-black text-[#f5c518]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 break-words font-semibold">{label}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </main>
        </div>
        <Toaster />
      </div>
    );
  }

  if (entryStage === 'serverSelect') {
    return (
      <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
                {locale === 'en' ? 'Server workspace' : '服务器工作台'}
              </div>
              <h1 className="mt-1 text-3xl font-black">
                {locale === 'en' ? 'Choose a server' : '选择服务器'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#51483d]">
                {locale === 'en'
                  ? 'Your servers appear here. Select one to continue.'
                  : '你的服务器会出现在这里。选择一个继续。'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEntryStage('launcher')}
                className="w-fit rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d] hover:bg-[#2f2a22]/5"
              >
                {locale === 'en' ? 'Back to launcher' : '返回登录器'}
              </button>
              {privateAlphaAuthEnabled && (
                <button
                  type="button"
                  onClick={logoutToLauncher}
                  className="w-fit rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-bold text-[#58180d] hover:bg-[#fff8e6]"
                >
                  {locale === 'en' ? 'Log out' : '退出登录'}
                </button>
              )}
            </div>
          </header>

          {!privateAlphaAuthEnabled && (
            <LocalDevIdentitySwitcher
              locale={locale}
              failureKind={classifyApiServiceFailure(worldServersState.error)}
            />
          )}

          {worldServersState.loading && !demoFallbackEnabled && (
            <section className="rounded-2xl border border-[#2f2a22]/12 bg-white p-6 text-sm text-[#51483d]">
              {t('worldServer.loading')}
            </section>
          )}

          {!worldServersState.loading && worldServersState.error && !demoFallbackEnabled && (
            <section className="rounded-2xl border border-[#2f2a22]/12 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">{t('worldServer.unableToLoad')}</h2>
              <p className="mt-2 text-sm leading-6 text-[#51483d]">{apiErrorMessage(worldServersState.error, locale, privateAlphaAuthEnabled)}</p>
              <button
                type="button"
                onClick={() => void worldServersState.refresh()}
                className="mt-4 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm font-bold text-[#51483d] hover:bg-[#2f2a22]/5"
              >
                {t('worldServer.retry')}
              </button>
            </section>
          )}

          {!worldServersState.loading && !worldServersState.error && displayWorldServers.length === 0 && (
            <section className="rounded-2xl border border-dashed border-[#2f2a22]/18 bg-white/65 p-6">
              <h2 className="text-lg font-bold">{t('worldServer.noServers')}</h2>
              <p className="mt-2 text-sm leading-6 text-[#51483d]">
                {t('worldServer.noServersNote')}
              </p>
              {privateAlphaAuthEnabled && (
                <ol className="mt-4 grid gap-2 text-sm leading-6 text-[#51483d] md:grid-cols-3">
                  <li className="rounded-md bg-white px-3 py-2">1. {t('privateAlphaOnboarding.createServer')}</li>
                  <li className="rounded-md bg-white px-3 py-2">2. {t('privateAlphaOnboarding.createCampaign')}</li>
                  <li className="rounded-md bg-white px-3 py-2">3. {t('privateAlphaOnboarding.createRoom')}</li>
                </ol>
              )}
            </section>
          )}

          {displayWorldServers.length > 0 && (
            <section className="grid gap-3 md:grid-cols-2">
              {displayWorldServers.map((server) => (
                <button
                  key={server.id}
                  type="button"
                  onClick={() => {
                    setSelectedServerId(server.id);
                    resetPlatformLocation();
                    setEntryStage('platform');
                  }}
                  className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 text-left shadow-sm transition hover:border-[#58180d]/35 hover:bg-[#fff8e6]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold">{server.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-[#51483d]">{server.description || t('worldServer.noDescription')}</p>
                    </div>
                    <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1 text-[11px] font-bold text-[#51483d]">
                      {roleLabel[server.role]}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-[#51483d]">
                    {server.memberCount !== undefined && <span className="rounded-full bg-[#2f2a22]/6 px-2.5 py-1">{server.memberCount} 名成员</span>}
                    {server.activeCampaigns !== undefined && <span className="rounded-full bg-[#2f2a22]/6 px-2.5 py-1">{server.activeCampaigns} 个战役</span>}
                    {server.lifecycleStatus && <span className="rounded-full bg-[#2f2a22]/6 px-2.5 py-1">{server.lifecycleStatus}</span>}
                    {server.source === 'demo' && <span className="rounded-full border border-dashed border-[#2f2a22]/25 px-2.5 py-1">{t('worldServer.localDemo')}</span>}
                  </div>
                </button>
              ))}
            </section>
          )}

          <section className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-[#2f2a22]/18 bg-white/65 p-5">
              <h2 className="text-lg font-bold">{locale === 'en' ? 'Create server' : '创建服务器'}</h2>
              <p className="mt-2 text-sm leading-6 text-[#51483d]">
                {privateAlphaAuthEnabled
                  ? (locale === 'en' ? 'The signed-in user will create this server.' : '当前登录用户会成为此服务器的创建者。')
                  : t('worldServer.createByCurrentDevUser')}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#51483d]">
                {locale === 'en'
                  ? 'Start a new server space.'
                  : '创建一个新的服务器空间。'}
              </p>
              <form
                className="mt-4 flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleCreateServer();
                }}
              >
                <label className="text-xs font-bold text-[#51483d]" htmlFor="world-server-name">
                  {t('worldServer.serverName')}
                </label>
                <input
                  id="world-server-name"
                  value={createServerName}
                  onChange={(event) => setCreateServerName(event.target.value)}
                  placeholder={t('worldServer.serverNamePlaceholder')}
                  className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#58180d]/45"
                />
                <Button type="submit" disabled={createServerLoading} className="w-fit rounded-md">
                  {createServerLoading
                    ? t('worldServer.creating')
                    : t('worldServer.create')}
                </Button>
              </form>
              {createServerError && (
                <p className="mt-3 text-sm leading-5 text-[#8b3a2f]">{createServerErrorMessage(createServerError, locale, privateAlphaAuthEnabled) || createServerError.message}</p>
              )}
            </div>
            <div className="rounded-2xl border border-dashed border-[#2f2a22]/18 bg-white/65 p-5">
              <h2 className="text-lg font-bold">{locale === 'en' ? 'Join server' : '加入服务器'}</h2>
              <p className="mt-2 text-sm leading-6 text-[#51483d]">
                {locale === 'en'
                  ? 'Invite code and application flow.'
                  : '通过邀请码或申请加入。'}
              </p>
              <button
                type="button"
                disabled
                className="mt-4 rounded-md border border-[#2f2a22]/15 px-4 py-2 text-sm font-bold text-[#51483d]/50"
              >
                {locale === 'en' ? 'Join unavailable' : '加入暂未开放'}
              </button>
            </div>
          </section>
        </main>
        <Toaster />
      </div>
    );
  }

  if (entryStage === 'serverHome' && selectedWorldServer?.source === 'api' && worldServerDetail.loading && !worldServerDetail.server) {
    return (
      <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-4 px-4 py-8 md:px-8">
          <p className="text-sm text-[#51483d]">{t('worldServer.loading')}</p>
          <button type="button" onClick={exitCurrentServer} className="w-fit rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d]">
            {t('worldServer.backToServers')}
          </button>
        </main>
      </div>
    );
  }

  if (entryStage === 'serverHome' && selectedWorldServer?.source === 'api' && worldServerDetail.error && !worldServerDetail.server) {
    return (
      <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-4 px-4 py-8 md:px-8">
          <h1 className="text-2xl font-black">{t('worldServer.unableToOpen')}</h1>
          <p className="text-sm leading-6 text-[#51483d]">{apiErrorMessage(worldServerDetail.error, locale)}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void worldServerDetail.refresh()} className="rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white">
              {t('worldServer.retry')}
            </button>
            <button type="button" onClick={exitCurrentServer} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d]">
              {t('worldServer.backToServers')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (entryStage === 'serverHome' && selectedWorldServer) {
    return (
      <ServerProfileBoard
        locale={locale}
        serverName={selectedWorldServer.name}
        description={selectedApiServer?.description ?? selectedWorldServer.description}
        roleLabel={roleLabel[selectedWorldServer.role]}
        lifecycleStatus={selectedApiServer?.lifecycleStatus}
        members={worldServerDetail.members}
        gameSystems={worldServerDetail.gameSystems}
        partialSync={worldServerDetail.partialErrors.length > 0}
        canManageServer={canManageSelectedServer}
        onBackToWorkspace={() => {
          setEntryStage('platform');
          setAppView('home');
          setNavigationStack([]);
        }}
        onOpenSettings={openSelectedServerSettings}
        onExitServer={exitCurrentServer}
        onLogout={() => void logoutToLauncher()}
      />
    );
  }

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
                aria-label={navLabel(item)}
                title={navLabel(item)}
                className={desktopNavBtn(active)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{navLabel(item)}</span>
              </button>
            );
          })}
        </nav>
        {/* Top-right: account menu only. Settings lives inside this menu (not as a separate gear or a main nav tab). */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-label={locale === 'en' ? 'Account menu' : '账号菜单'}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">{viewerAccount.avatarLabel}</span>
            <span className="hidden lg:inline">{viewerAccount.displayName}</span>
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

      {selectedWorldServer && (
        <ServerContextBar
          locale={locale}
          serverName={selectedWorldServer.name}
          roleLabel={selectedServerRoleLabel}
          memberCount={selectedServerMemberCount}
          enabledSystems={selectedServerSystems}
          onOpenProfile={() => setEntryStage('serverHome')}
          onOpenCampaigns={() => {
            openCampaignHub();
          }}
          onExitServer={exitCurrentServer}
        />
      )}

      {/* ── Main content (full width; no left sidebar) ── */}
      <div className={`min-w-0 ${focusMode ? '' : 'pb-16 md:pb-0'}`}>
        {appView === 'home' && (
          <>
            {selectedWorldServer && (
              <PlatformOperationsWorkspace
                locale={locale}
                serverName={selectedWorldServer.name}
                roleLabel={selectedServerRoleLabel}
                memberCount={selectedServerMemberCount ?? 0}
                activeCampaignCount={selectedWorldServer.activeCampaigns}
                enabledSystems={selectedServerSystems}
                onOpenProfile={() => setEntryStage('serverHome')}
                onOpenCampaigns={() => {
                  openCampaignHub();
                }}
              />
            )}
            <Home locale={locale} onEnterPlay={enterPlay} onOpenPlaceholder={openPlaceholder} />
          </>
        )}

        {appView === 'systemLibrary' && (
          <SystemLibrary locale={locale} onEnterPlay={enterPlay} />
        )}

        {appView === 'workshop' && (
          <Workshop
            locale={locale}
            initialTab={workshopReturnToCreator ? 'myContent' : 'browse'}
            onReturnToCreator={workshopReturnToCreator ? returnToCreatorFromWorkshop : undefined}
          />
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
          <UserProfileSpace
            profileUserId={profileUserId}
            locale={locale}
            onBack={goBack}
            onOpenPersonalHub={() => {
              pushNavigation();
              setAppView('personalHub');
            }}
          />
        )}

        {appView === 'play' && playStage === 'workspace' && (
          <div>
            <div className="border-b border-[#2f2a22]/10 px-4 py-2 md:px-8">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={handlePlayWorkspaceBack}
                  aria-label={playWorkspaceBackOverride?.label ?? (navigationStack.length > 0 ? t('navigation.backOneLevel') : t('navigation.noPreviousBackToSystemSelect'))}
                  title={playWorkspaceBackOverride?.label ?? (navigationStack.length > 0 ? t('navigation.backOneLevel') : t('navigation.noPreviousBackToSystemSelect'))}
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
              onBackOverrideChange={setPlayWorkspaceBackOverride}
              onOpenPersonalContentWorkshop={openPersonalContentWorkshop}
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

        {appView === 'placeholder' && activePlaceholder === 'campaigns' && selectedApiServer && (
          <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
            <ServerCampaignWorkspace
              worldServerId={selectedApiServer.worldServerId}
              locale={locale}
              gameSystems={worldServerDetail.gameSystems}
              defaultGameSystemId={selectedApiServer.defaultGameSystemId}
              canManageServer={canManageSelectedServer}
              viewerUserId={viewerUserId}
              hostDisplayName={privateAlphaAuthState.user?.displayName ?? viewerAccount.displayName}
            />
          </main>
        )}

        {appView === 'placeholder' && activePlaceholder !== 'settings' && activePlaceholder !== 'campaigns' && (
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
          {mobilePrimaryNav.map((item) => {
            const Icon = item.icon;
            const active = isMobileNavActive(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleMobileNavClick(item.key)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${
                  active ? 'text-[#f5c518]' : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
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
                {viewerAccount.avatarLabel}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#17130f]">{viewerAccount.displayName}</p>
                <p className="truncate text-[11px] text-[#51483d]/60">@{viewerAccount.handle}</p>
                <p className="truncate text-[10px] text-[#51483d]/45">{viewerAccount.authStateLabel}</p>
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
                  setProfileUserId(getCurrentLocalProfileUserId());
                  setAppView('userProfile');
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                <Palette className="h-4 w-4 shrink-0" />
                {locale === 'en' ? 'My Profile' : '我的主页'}
              </button>

              {/* 我的资料库 */}
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
                {locale === 'en' ? 'My Library' : '我的资料库'}
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavClick('workshop')}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8 md:hidden"
              >
                <Store className="h-4 w-4 shrink-0" />
                {t('shell.nav.workshop')}
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleNavClick('fanPlaza')}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8 md:hidden"
              >
                <Palette className="h-4 w-4 shrink-0" />
                {t('shell.nav.fanPlaza')}
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
              {selectedApiServer && canManageSelectedServer && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={openSelectedServerSettings}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  {locale === 'en' ? 'Server settings' : '服务器设置'}
                </button>
              )}
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

              <button
                type="button"
                role="menuitem"
                onClick={exitCurrentServer}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17130f] hover:bg-[#2f2a22]/8"
              >
                <HomeIcon className="h-4 w-4 shrink-0" />
                {locale === 'en' ? 'Exit current server' : '退出当前服务器'}
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={logoutToLauncher}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-[#58180d] hover:bg-[#fff8e6]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                {locale === 'en' ? 'Log out' : '退出登录'}
              </button>
            </div>
          </div>
        </>
      )}

      <Toaster />
    </div>
  );
}
