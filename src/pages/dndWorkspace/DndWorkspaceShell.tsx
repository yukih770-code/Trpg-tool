import { useEffect, useState, type ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { createTranslator, readStoredLocale } from '../../i18n';
import {
  DND_2024_BACKGROUND_INDEX_DATA,
  DND_2024_EQUIPMENT_INDEX_DATA,
  DND_2024_FEAT_INDEX_DATA,
  DND_CHARACTER_OPTIONS_COMPLETION_REPORT,
} from '../../data/dnd2024/characterOptionsIndex';
import { DND_SPELL_INDEX_COUNTS } from '../../data/dnd2024/spellIndex';
import { useCharacterStore } from '../../store/characterStore';
import {
  ActorCreationCompletionShell,
  ActorVaultLibraryShell,
} from '../../components/platform/ActorVaultLibraryShell';
import { CampaignLibraryShell } from '../../components/platform/CampaignLibraryShell';
import { JoinCampaignPanel } from '../../components/platform/JoinCampaignPanel';
import { CampaignRuntimeShell } from '../../components/platform/CampaignRuntimeShell';
import { HostedRoomLaunchPanel } from '../../components/platform/HostedRoomLaunchPanel';
import { DndPersonalSpeciesPackPanel } from '../../components/platform/DndPersonalSpeciesPackPanel';
import type { LocalCampaign } from '../../lib/platform/campaignLocalStore';
import {
  launchHostedRoomFromCampaign,
  normalizeHostedRoomLaunchError,
  type HostedRoomLaunchCampaignRef,
  type HostedRoomLaunchSession,
  type RoomLaunchActionState,
  type RoomLaunchSource,
} from '../../lib/platform/hostedRoomLaunch';
import { CharacterCampaignCtaProvider } from '../../components/platform/CharacterCampaignCta';
import { ContextBar } from '../../components/platform/ContextBar';
import { SystemWorkspaceEntryShell } from '../../components/platform/SystemWorkspaceEntryShell';
import { SystemRuleSourcesShell, type SystemRuleSourcesTheme } from '../../components/platform/SystemRuleSourcesShell';
import { DND_RULE_SOURCES } from './dndRuleSourcesAdapter';
import { makeCampaignActorAddReturnContextFromSelect } from '../../lib/platform/campaignFlow';
import {
  buildDndActorSummary,
  buildDndVaultStats,
  buildDndSortOptions,
  buildDndVaultShellStrings,
  buildDndVaultAdapterStrings,
  DND_VAULT_COLOR_THEME,
} from './dndActorVaultAdapter';
import { deriveVaultSummaries } from '../../lib/platform/actorVault';
import type { ActorCreationCompletionContext, ActorVaultAdapter } from '../../lib/platform/actorVault';
import {
  getActiveActorVaultRecord,
  listActorVaultRecords,
  type ActorVaultRecord,
} from '../../lib/platform/actorVaultRepositoryBridge';
import type {
  CampaignActorAddReturnContext,
  CampaignActorSelectReturnContext,
  CampaignSelectForActorReturnContext,
  CampaignInstanceSummary,
  CampaignRuntimeContext,
  CampaignSuggestedActor,
} from '../../lib/platform/campaignFlow';

/**
 * DndWorkspaceShell
 *
 * AI-LANDMARK: DND_PRODUCT_SHELL_PHASE_1
 * AI-LANDMARK: DND_WORKSPACE_CONTRACT_ALIGNMENT_V1
 *
 * DND product shell phase 1: entering DND opens a workspace dashboard
 * (rule scope, source status, data completion, module launcher) instead of
 * dropping straight into a character sheet. The existing Creator / Sheet /
 * Gameplay UI is rendered unchanged as the "play" view (children).
 *
 * Display-only shell: no rules data changes, no runtime automation, and no
 * real source enable/disable filtering in this phase.
 *
 * Contract Alignment v1: top nav limited to system-level Sections only.
 * Actor Vault is the default/root user entry; overview/dashboard is retained
 * as low-frequency System Info, not as a primary nav item. creationMethod
 * ('create' view) is accessible via CTAs from Actor Vault.
 * builder / sheet / runtime are Actor-context flows — not top-nav peers.
 */

// AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
// 'characterLibrary' view removed — library mode is now managed internally by ActorVaultLibraryShell.
export type DndWorkspaceView = 'dashboard' | 'characters' | 'campaigns' | 'createCampaign' | 'create' | 'compendium' | 'sources' | 'ruleSources' | 'play';
export type DndPlayTab = 'creator' | 'sheet' | 'gameplay';

type DndWorkspaceShellProps = {
  view: DndWorkspaceView;
  onViewChange: (view: DndWorkspaceView) => void;
  onOpenPlayTab: (tab: DndPlayTab) => void;
  onGlobalBackOverrideChange?: (override: { label?: string; onBack: () => void } | null) => void;
  children: ReactNode;
};

const REPORT = DND_CHARACTER_OPTIONS_COMPLETION_REPORT;

export function DndWorkspaceShell({
  view,
  onViewChange,
  onOpenPlayTab,
  onGlobalBackOverrideChange,
  children,
}: DndWorkspaceShellProps) {
  const locale = readStoredLocale();
  const { t } = createTranslator(locale);
  const dndChar = useCharacterStore((state) => state.character);
  const dndCharacters = useCharacterStore((state) => state.characters);
  const dndActiveCharacterId = useCharacterStore((state) => state.activeCharacterId);
  const setDndActiveCharacterId = useCharacterStore((state) => state.setActiveCharacterId);
  const resetDndCreator = useCharacterStore((state) => state.resetCreator);
  const characterName = (dndChar as { name?: string }).name?.trim();
  const hasCurrentCharacter = Boolean(
    characterName ||
    dndChar.race ||
    dndChar.background ||
    dndChar.jobClass ||
    dndChar.isCompleted,
  );
  const [plannedSlotLabelKey, setPlannedSlotLabelKey] = useState<string | null>(null);
  const [campaignActorAddContext, setCampaignActorAddContext] =
    useState<CampaignActorAddReturnContext | null>(null);
  const [campaignActorSelectContext, setCampaignActorSelectContext] =
    useState<CampaignActorSelectReturnContext | null>(null);
  const [campaignSelectForActorContext, setCampaignSelectForActorContext] =
    useState<CampaignSelectForActorReturnContext | null>(null);
  const [suggestedCampaignActor, setSuggestedCampaignActor] =
    useState<CampaignSuggestedActor | null>(null);
  const [focusedCampaignId, setFocusedCampaignId] = useState<string | null>(null);
  // "进入战役" top-level tab: 主持战役 (local library) | 加入战役 (room server).
  const [campaignEntryTab, setCampaignEntryTab] = useState<'mine' | 'join'>('mine');
  const [campaignRuntimeContext, setCampaignRuntimeContext] =
    useState<CampaignRuntimeContext | null>(null);
  const [openCampaignListOnReturn, setOpenCampaignListOnReturn] = useState(false);
  // Hosted LAN room launched from a campaign (M19). v0 uses the local Room Server.
  const [hostedRoomSession, setHostedRoomSession] =
    useState<(HostedRoomLaunchSession & { returnRuntimeContext?: CampaignRuntimeContext }) | null>(null);
  const [hostLaunchError, setHostLaunchError] = useState<string | null>(null);
  const [hostLaunchState, setHostLaunchState] = useState<RoomLaunchActionState>('idle');
  const [actorCreationCompletionContext, setActorCreationCompletionContext] =
    useState<ActorCreationCompletionContext | null>(null);

  const openCampaignDetail = (campaignId: string) => {
    setFocusedCampaignId(campaignId);
    setOpenCampaignListOnReturn(false);
    setCampaignEntryTab('mine');
    onViewChange('campaigns');
  };

  const handleHostLaunchRoom = (
    campaign: HostedRoomLaunchCampaignRef,
    source: RoomLaunchSource = 'campaignDetail',
    returnRuntimeContext?: CampaignRuntimeContext,
  ) => {
    setHostLaunchError(null);
    setHostLaunchState('launching');
    if (source === 'campaignDetail') {
      openCampaignDetail(campaign.id);
    }
    if (source === 'campaignList') {
      setFocusedCampaignId(null);
      setOpenCampaignListOnReturn(true);
      setCampaignEntryTab('mine');
      onViewChange('campaigns');
    }
    void (async () => {
      try {
        const session = await launchHostedRoomFromCampaign({ campaign, source });
        if (source === 'runtimeSettings') {
          setCampaignRuntimeContext(null);
          setCampaignEntryTab('mine');
          onViewChange('campaigns');
        }
        setHostedRoomSession({ ...session, returnRuntimeContext });
        setHostLaunchState('idle');
      } catch (e) {
        setHostLaunchError(normalizeHostedRoomLaunchError(e));
        setHostLaunchState('failed');
      }
    })();
  };

  const handleCloseHostedRoom = () => {
    const closedSession = hostedRoomSession;
    const returnCampaignId = closedSession?.sourceCampaignId ?? closedSession?.room.campaignRef?.campaignId;
    setHostedRoomSession(null);
    if (closedSession?.source === 'runtimeSettings' && closedSession.returnRuntimeContext) {
      setCampaignRuntimeContext(closedSession.returnRuntimeContext);
      return;
    }
    if (closedSession?.source === 'campaignList') {
      setFocusedCampaignId(null);
      setOpenCampaignListOnReturn(true);
      setCampaignEntryTab('mine');
      onViewChange('campaigns');
      return;
    }
    if (returnCampaignId) {
      openCampaignDetail(returnCampaignId);
      return;
    }
    setCampaignEntryTab('mine');
    onViewChange('campaigns');
  };

  function buildActorCreationCompletionContext(): ActorCreationCompletionContext {
    const actor: CampaignSuggestedActor = {
      actorId: dndActiveCharacterId ?? 'ui-preview-dnd-actor',
      actorName: characterName || t('multiWorkspace.actorCreationCompletion.placeholderActorName'),
    };

    if (campaignActorAddContext) {
      return { kind: 'forCampaign', actor, campaign: campaignActorAddContext };
    }

    return { kind: 'standalone', actor };
  }

  function showActorCreationCompletion() {
    setActorCreationCompletionContext(buildActorCreationCompletionContext());
    setPlannedSlotLabelKey(null);
  }

  function handleOpenCompletedActorSheet() {
    setActorCreationCompletionContext(null);
    onOpenPlayTab('sheet');
  }

  function handleSelectCampaignForCompletedActor(actor: CampaignSuggestedActor) {
    setActorCreationCompletionContext(null);
    setCampaignSelectForActorContext({
      actorId: actor.actorId,
      actorName: actor.actorName,
      source: 'actorLibrary',
      returnLabel: t('campaignLibrary.returnContext.returnToActorVault'),
      returnTo: {
        view: 'characterLibrary',
        systemId: 'dnd2024',
        actorId: actor.actorId,
      },
    });
    setCampaignActorAddContext(null);
    setCampaignActorSelectContext(null);
    onViewChange('campaigns');
  }

  function handleReturnCreatedActorToCampaign(context: Extract<ActorCreationCompletionContext, { kind: 'forCampaign' }>) {
    setSuggestedCampaignActor(context.actor);
    setFocusedCampaignId(context.campaign.campaignId);
    setActorCreationCompletionContext(null);
    setCampaignActorAddContext(null);
    setCampaignActorSelectContext(null);
    setCampaignSelectForActorContext(null);
    onViewChange('campaigns');
  }

  // AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
  // AI-LANDMARK: ACTOR_VAULT_REPOSITORY_BRIDGE_UI_INTEGRATION_V1
  // DND Actor Vault now reads the platform ActorVaultRecord bridge first, then
  // resolves each record into the system-specific summary projection.
  // Search / filter / sort state is still owned by ActorVaultLibraryShell.
  const _adapterStrings = buildDndVaultAdapterStrings(t);
  const _dndActorVaultRecords = listActorVaultRecords('dnd5e-2024');
  const _dndActiveActorVaultRecordId =
    getActiveActorVaultRecord('dnd5e-2024')?.id ?? dndActiveCharacterId;
  const _dndCharactersById = new Map(dndCharacters.map((char) => [char.id, char]));
  if (dndChar.id) {
    _dndCharactersById.set(dndChar.id, dndChar);
  }
  const _dndVaultAdapter: ActorVaultAdapter<ActorVaultRecord> = {
    getActors: () => _dndActorVaultRecords,
    getActiveActorId: () => _dndActiveActorVaultRecordId ?? null,
    getSummary: (record, index) => {
      const character = _dndCharactersById.get(record.id);
      return character
        ? buildDndActorSummary(character, index, _dndActiveActorVaultRecordId ?? null, _adapterStrings)
        : {
            id: record.id,
            displayName: record.displayName,
            completionStatus: 'incomplete',
            isActive: record.id === _dndActiveActorVaultRecordId,
            insertionOrder: index,
            sortName: record.displayName.toLowerCase(),
            sortNumeric: 0,
            detailFields: record.subtitle
              ? [{ label: t('multiWorkspace.actorVault.source'), value: record.subtitle }]
              : [],
            metaRows: [
              { label: t('multiWorkspace.actorVault.source'), value: record.source },
            ],
          };
    },
    getStats: (summaries) => buildDndVaultStats(summaries),
    getAddOptions: () => [],
    getSortOptions: () => buildDndSortOptions({
      default: t('dndWorkspace.characterLibrary.sort.default'),
      name:    t('dndWorkspace.characterLibrary.sort.name'),
      level:   t('dndWorkspace.characterLibrary.sort.level'),
    }),
    getDefaultSortKey: () => 'default',
    onEnterActor: (id) => { setDndActiveCharacterId(id); onOpenPlayTab('sheet'); },
  };
  const _vaultSummaries = deriveVaultSummaries(_dndVaultAdapter);
  const _vaultStats     = _dndVaultAdapter.getStats(_vaultSummaries);
  const _vaultSortOpts  = _dndVaultAdapter.getSortOptions();
  const _vaultStrings   = buildDndVaultShellStrings(t);

  const completionRows: { labelKey: string; value: string }[] = [
    { labelKey: 'dndWorkspace.completion.species', value: `${REPORT.species.runtime} runtime / ${REPORT.species.manifest} indexed` },
    { labelKey: 'dndWorkspace.completion.backgrounds', value: `${REPORT.backgrounds.runtime} runtime / ${REPORT.backgrounds.manifest} indexed` },
    { labelKey: 'dndWorkspace.completion.classes', value: `${REPORT.classes.runtime} runtime / ${REPORT.classes.manifest} indexed` },
    { labelKey: 'dndWorkspace.completion.subclasses', value: `${REPORT.subclasses.runtime} runtime / ${REPORT.subclasses.manifest} indexed` },
    { labelKey: 'dndWorkspace.completion.spells', value: `${REPORT.spells.runtime} runtime / ${DND_SPELL_INDEX_COUNTS.total} indexed` },
    { labelKey: 'dndWorkspace.completion.feats', value: `${REPORT.originFeats.runtime + REPORT.generalFeats.runtime} runtime / ${DND_2024_FEAT_INDEX_DATA.length} source files` },
    { labelKey: 'dndWorkspace.completion.equipment', value: `${REPORT.equipment.runtimeSample} sample / ${DND_2024_EQUIPMENT_INDEX_DATA.length} categories` },
  ];

  // AI-LANDMARK: MULTI_SYSTEM_WORKSPACE_PLANNED_SLOTS
  // DND planned modules are platform entry points only, not inventory/map/journal implementations.
  //
  // AI-LANDMARK: SYSTEM_HOME_SIMPLIFICATION
  // System Home only shows core Game System entry points.
  // spellIndex / featIndex / equipmentIndex / classIndex are accessible inside the Compendium view;
  // they are NOT listed as top-level home cards. Data coverage detail is linked from Source Status.
  // AI-LANDMARK: SYSTEM_HOME_NAVIGATION_DEDUPLICATION
  // System Home does not repeat top navigation; it shows current character context and next actions.

  const sourceRows: {
    groupKey: 'dndWorkspace.sources.core' | 'dndWorkspace.sources.expansions';
    name: string;
    sourceId: string;
    statusKey: string;
    noteKey: string;
  }[] = [
    {
      groupKey: 'dndWorkspace.sources.core',
      name: 'DND 2024 / SRD5.2',
      sourceId: 'dnd5echm-srd52-primary',
      statusKey: 'dndWorkspace.sources.statusRuntimeReady',
      noteKey: 'dndWorkspace.sources.coreNote',
    },
    {
      groupKey: 'dndWorkspace.sources.expansions',
      name: "Xanathar's Guide to Everything",
      sourceId: 'dnd5echm-xgte',
      statusKey: 'dndWorkspace.sources.statusIndexed',
      noteKey: 'dndWorkspace.sources.xgteNote',
    },
    {
      groupKey: 'dndWorkspace.sources.expansions',
      name: "Tasha's Cauldron of Everything",
      sourceId: 'dnd5echm-tcoe',
      statusKey: 'dndWorkspace.sources.statusIndexed',
      noteKey: 'dndWorkspace.sources.tcoeNote',
    },
  ];

  const compendiumCards: { labelKey: string; count: string; statusKey: string }[] = [
    { labelKey: 'dndWorkspace.modules.spellIndex', count: `${DND_SPELL_INDEX_COUNTS.total}`, statusKey: 'dndWorkspace.compendium.entries' },
    { labelKey: 'dndWorkspace.modules.featIndex', count: `${DND_2024_FEAT_INDEX_DATA.length}`, statusKey: 'dndWorkspace.compendium.files' },
    { labelKey: 'dndWorkspace.modules.equipmentIndex', count: `${DND_2024_EQUIPMENT_INDEX_DATA.length}`, statusKey: 'dndWorkspace.compendium.categories' },
    { labelKey: 'dndWorkspace.modules.classIndex', count: `${REPORT.classes.manifest} / ${REPORT.subclasses.manifest}`, statusKey: 'dndWorkspace.compendium.entries' },
  ];

  const panelClass = 'rounded-lg border-2 border-[#58180d]/30 bg-[#fff8e6]/80 p-5 shadow-sm';

  const dndRuleSourcesTheme: SystemRuleSourcesTheme = {
    panel: panelClass,
    card: 'rounded-md border border-[#58180d]/20 bg-white/50',
    title: 'text-[#58180d]',
    muted: 'text-[#2c1810]/70',
    badgeEnabled: 'border-[#2f7f68]/50 bg-[#2f7f68]/10 text-[#2f7f68]',
    badgePlanned: 'border-[#58180d]/30 text-[#58180d]/70',
    kindBadge: 'border-[#58180d]/30 text-[#58180d]/70',
  };
  // AI-LANDMARK: DND_CHARACTER_VAULT_CREATION_METHOD_ENTRY
  // Creation now enters through a method picker; only Standard Creation opens the existing Builder.
  const creationMethodCards: { labelKey: string; noteKey: string; planned?: boolean; onClick: () => void }[] = [
    {
      labelKey: 'dndWorkspace.creation.standard',
      noteKey: 'dndWorkspace.creation.standardNote',
      onClick: () => {
        if (campaignActorAddContext) {
          showActorCreationCompletion();
          return;
        }
        resetDndCreator();
        onOpenPlayTab('creator');
      },
    },
    { labelKey: 'dndWorkspace.creation.quick', noteKey: 'dndWorkspace.creation.quickNote', planned: true, onClick: showActorCreationCompletion },
    { labelKey: 'dndWorkspace.creation.localImport', noteKey: 'dndWorkspace.creation.localImportNote', planned: true, onClick: showActorCreationCompletion },
    { labelKey: 'dndWorkspace.creation.workshop', noteKey: 'dndWorkspace.creation.workshopNote', planned: true, onClick: showActorCreationCompletion },
  ];

  const handleRequestAddActorForCampaign = (context: CampaignActorAddReturnContext) => {
    setCampaignActorAddContext(context);
    setCampaignActorSelectContext(null);
    setCampaignSelectForActorContext(null);
    setActorCreationCompletionContext(null);
    onViewChange('create');
  };

  const handleRequestSelectActorForCampaign = (context: CampaignActorSelectReturnContext) => {
    setCampaignActorSelectContext(context);
    setCampaignActorAddContext(null);
    setCampaignSelectForActorContext(null);
    setActorCreationCompletionContext(null);
    onViewChange('characters');
  };

  const handleSelectActorForCampaign = (
    actor: CampaignSuggestedActor,
    context?: CampaignActorSelectReturnContext,
  ) => {
    setSuggestedCampaignActor(actor);
    setFocusedCampaignId(context?.campaignId ?? context?.returnTo.campaignId ?? null);
    setCampaignActorSelectContext(null);
    setCampaignSelectForActorContext(null);
    setActorCreationCompletionContext(null);
    onViewChange('campaigns');
  };

  const handleRequestSelectCampaignForActor = (
    actor: CampaignSuggestedActor,
    source: CampaignSelectForActorReturnContext['source'] = 'actorLibrary',
  ) => {
    setCampaignSelectForActorContext({
      actorId: actor.actorId,
      actorName: actor.actorName,
      source,
      returnLabel: source === 'actorDetail'
        ? t('multiWorkspace.actorVault.returnToActorSheet')
        : t('campaignLibrary.returnContext.returnToActorVault'),
      returnTo: {
        view: source === 'actorDetail' ? 'characterDetail' : 'characterLibrary',
        systemId: 'dnd2024',
        actorId: actor.actorId,
      },
    });
    setCampaignActorAddContext(null);
    setCampaignActorSelectContext(null);
    setActorCreationCompletionContext(null);
    onViewChange('campaigns');
  };

  const handleSelectCampaignForActor = (
    campaign: CampaignInstanceSummary,
    context: CampaignSelectForActorReturnContext,
  ) => {
    setSuggestedCampaignActor({
      actorId: context.actorId,
      actorName: context.actorName,
    });
    setFocusedCampaignId(campaign.campaignId);
    setCampaignSelectForActorContext(null);
    setCampaignActorAddContext(null);
    setCampaignActorSelectContext(null);
    setActorCreationCompletionContext(null);
    onViewChange('campaigns');
  };

  const handleReturnToActorContext = (context?: CampaignSelectForActorReturnContext) => {
    setCampaignSelectForActorContext(null);
    setActorCreationCompletionContext(null);
    if (context?.returnTo.view === 'characterDetail') {
      onOpenPlayTab('sheet');
      return;
    }
    onViewChange('characters');
  };

  const handleReturnToCampaignEntry = () => {
    const runtimeReturnTo = campaignRuntimeContext?.returnTo;
    const returnCampaignId = campaignRuntimeContext?.campaignId;
    setCampaignRuntimeContext(null);
    setActorCreationCompletionContext(null);
    setCampaignEntryTab('mine');
    onViewChange('campaigns');
    if (runtimeReturnTo === 'campaignList') {
      setFocusedCampaignId(null);
      setOpenCampaignListOnReturn(true);
      return;
    }
    if (returnCampaignId) {
      openCampaignDetail(returnCampaignId);
      return;
    }
    setOpenCampaignListOnReturn(true);
  };

  const handleEnterCampaignRuntime = (context: CampaignRuntimeContext) => {
    setFocusedCampaignId(context.returnTo === 'campaignList' ? null : context.campaignId);
    setOpenCampaignListOnReturn(false);
    setCampaignEntryTab('mine');
    setCampaignRuntimeContext(context);
  };

  useEffect(() => {
    if (!onGlobalBackOverrideChange) return;
    if (!campaignRuntimeContext) {
      onGlobalBackOverrideChange(null);
      return;
    }
    onGlobalBackOverrideChange({
      label: campaignRuntimeContext.returnTo === 'campaignList' ? '返回战役列表' : '返回战役详情',
      onBack: handleReturnToCampaignEntry,
    });
    return () => onGlobalBackOverrideChange(null);
  }, [campaignRuntimeContext, onGlobalBackOverrideChange]);

  const handleCampaignCreatedOrImported = (campaign: LocalCampaign) => {
    setSuggestedCampaignActor(null);
    setCampaignActorAddContext(null);
    setCampaignActorSelectContext(null);
    setCampaignSelectForActorContext(null);
    setActorCreationCompletionContext(null);
    setHostedRoomSession(null);
    openCampaignDetail(campaign.id);
  };

  const activeDndActorForCampaign: CampaignSuggestedActor = {
    actorId: dndActiveCharacterId ?? 'ui-preview-dnd-actor',
    actorName: characterName || t('multiWorkspace.actorCreationCompletion.placeholderActorName'),
  };

  return (
    <div className="min-h-screen bg-[#fdf6e3] text-[#2c1810] font-serif">
      {/* ── DND workspace shell brand ── */}
      <div className="border-b-2 border-[#58180d]/70 bg-[#f7ebcf]/60">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#58180d]" />
            <span className="font-dnd-title text-lg text-[#58180d]">{t('dndWorkspace.title')}</span>
          </div>
        </div>
      </div>

      {/* ── Play view: preserved Creator / Sheet / Gameplay workspace ── */}
      {view === 'play' && (
        <CharacterCampaignCtaProvider
          value={{
            tone: 'dnd',
            actorName: activeDndActorForCampaign.actorName,
            onSelectCampaign: () => handleRequestSelectCampaignForActor(activeDndActorForCampaign, 'actorDetail'),
          }}
        >
          {children}
        </CharacterCampaignCtaProvider>
      )}

      {view !== 'play' && (
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {campaignRuntimeContext && (
            <CampaignRuntimeShell
              context={campaignRuntimeContext}
              tone="dnd"
              onExitRuntime={handleReturnToCampaignEntry}
              onHostLaunchRoom={(runtimeContext) =>
                handleHostLaunchRoom(
                  { id: runtimeContext.campaignId, title: runtimeContext.campaignTitle, systemId: 'dnd5e-2024' },
                  'runtimeSettings',
                  runtimeContext,
                )
              }
              roomLaunchState={hostLaunchState}
              roomLaunchError={hostLaunchError}
            />
          )}

          {!campaignRuntimeContext && view === 'dashboard' && (
            <div className="flex flex-col gap-6">
              <section className={panelClass}>
                <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#58180d]/55">
                  {t('dndWorkspace.dashboard.scopeLabel')}
                </div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h1 className="font-dnd-title text-3xl text-[#58180d]">DND 5e 2024</h1>
                    <p className="mt-2 text-sm text-[#58180d]/80">
                      <span className="font-bold">{t('dndWorkspace.dashboard.scopeLabel')}：</span>
                      {t('dndWorkspace.dashboard.scope')}
                    </p>
                  </div>
                  <div className="border border-[#58180d]/40 bg-[#58180d]/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#58180d]">
                    {t('dndWorkspace.dashboard.statusLabel')}：{t('dndWorkspace.dashboard.status')}
                  </div>
                </div>
              </section>

              <SystemWorkspaceEntryShell
                systemName="DND 5e 2024"
                tone="dnd"
                actorNoteKey="systemWorkspaceEntry.dnd.actorNote"
                campaignNoteKey="systemWorkspaceEntry.dnd.campaignNote"
                onEnterActors={() => {
                  setActorCreationCompletionContext(null);
                  onViewChange('characters');
                }}
                onEnterCampaigns={() => {
                  setCampaignActorAddContext(null);
                  setCampaignActorSelectContext(null);
                  setCampaignSelectForActorContext(null);
                  setSuggestedCampaignActor(null);
                  setActorCreationCompletionContext(null);
                  onViewChange('campaigns');
                }}
              />
            </div>
          )}

          {!campaignRuntimeContext && view === 'create' && (
            <section className={panelClass}>
              {campaignActorAddContext && (
                <ContextBar
                  label={`${t('campaignLibrary.returnContext.addingActorPrefix')}「${campaignActorAddContext.campaignTitle}${
                    campaignActorAddContext.campaignRoomCode ? ` #${campaignActorAddContext.campaignRoomCode}` : ''
                  }」${t('campaignLibrary.returnContext.addingActorSuffix')} ${t('campaignLibrary.returnContext.afterComplete')}`}
                  backLabel={campaignActorAddContext.returnLabel}
                  onBack={handleReturnToCampaignEntry}
                  className="mb-4 border-[#58180d]/30 bg-white/50 text-[#58180d]"
                />
              )}
              {actorCreationCompletionContext ? (
                <ActorCreationCompletionShell
                  context={actorCreationCompletionContext}
                  strings={{
                    readyTitle: t('multiWorkspace.actorCreationCompletion.readyTitle'),
                    nextStepTitle: t('multiWorkspace.actorCreationCompletion.nextStepTitle'),
                    standaloneNote: t('multiWorkspace.actorCreationCompletion.standaloneNote'),
                    forCampaignTitle: t('multiWorkspace.actorCreationCompletion.forCampaignTitle'),
                    forCampaignNote: t('multiWorkspace.actorCreationCompletion.forCampaignNote'),
                    previewActorLabel: t('multiWorkspace.actorCreationCompletion.previewActorLabel'),
                    openSheet: t('multiWorkspace.actorCreationCompletion.openSheet'),
                    selectCampaign: t('multiWorkspace.actorCreationCompletion.selectCampaign'),
                    returnToCampaignEntry: t('multiWorkspace.actorCreationCompletion.returnToCampaignEntry'),
                    shellOnlyNote: t('multiWorkspace.actorCreationCompletion.shellOnlyNote'),
                  }}
                  colorTheme={DND_VAULT_COLOR_THEME}
                  panelClassName="border border-[#58180d]/20 bg-white/45 p-5"
                  onOpenActorSheet={handleOpenCompletedActorSheet}
                  onSelectCampaign={handleSelectCampaignForCompletedActor}
                  onReturnToCampaignEntry={handleReturnCreatedActorToCampaign}
                />
              ) : (
                <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#58180d]">{t('dndWorkspace.creation.title')}</h2>
                  <p className="mt-1 text-sm text-[#58180d]/70">{t('dndWorkspace.creation.subtitle')}</p>
                </div>
                <span className="border border-[#58180d]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/70">
                  {t('dndWorkspace.creation.builderBoundary')}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {creationMethodCards.map((card) => (
                  <button
                    key={card.labelKey}
                    type="button"
                    onClick={card.onClick}
                    className="min-h-32 border border-[#58180d]/30 bg-white/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#58180d] hover:shadow-md"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-bold text-[#58180d]">{t(card.labelKey)}</span>
                      {card.planned && (
                        <span className="shrink-0 border border-[#58180d]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/70">
                          {t('multiWorkspace.status.planned')}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block text-xs font-normal leading-relaxed text-[#58180d]/65">{t(card.noteKey)}</span>
                  </button>
                ))}
              </div>
              {plannedSlotLabelKey && (
                <div className="mt-4 border border-dashed border-[#58180d]/40 bg-white/40 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#58180d]/70">
                    {t('multiWorkspace.status.planned')}
                  </div>
                  <h3 className="mt-2 font-bold text-[#58180d]">{t(plannedSlotLabelKey)}</h3>
                  <p className="mt-2 text-sm text-[#58180d]/75">{t('dndWorkspace.creation.plannedMessage')}</p>
                </div>
              )}
              <p className="mt-4 border-t border-[#58180d]/15 pt-3 text-[10px] text-[#58180d]/50">
                {t('dndWorkspace.creation.actorFlowNote')}
              </p>
                </>
              )}
            </section>
          )}

          {/* AI-LANDMARK: PLATFORM_ACTOR_VAULT_LIBRARY_FRAMEWORK_EXTRACTION_V1
              Actor Vault (home + existing library) now rendered by the platform shell.
              DND-specific fields are mapped by dndActorVaultAdapter.ts.
              'characterLibrary' was removed from DndWorkspaceView — the shell manages
              its own 'home'/'existing' mode internally. */}
          {!campaignRuntimeContext && view === 'characters' && (
            <ActorVaultLibraryShell
              summaries={_vaultSummaries}
              stats={_vaultStats}
              sortOptions={_vaultSortOpts}
              defaultSortKey="default"
              onEnterActor={(id) => _dndVaultAdapter.onEnterActor(id)}
              onRequestAdd={() => {
                if (campaignActorSelectContext) {
                  setCampaignActorAddContext(makeCampaignActorAddReturnContextFromSelect(campaignActorSelectContext));
                  setCampaignActorSelectContext(null);
                } else {
                  setCampaignActorAddContext(null);
                  setCampaignActorSelectContext(null);
                  setCampaignSelectForActorContext(null);
                  setSuggestedCampaignActor(null);
                }
                setActorCreationCompletionContext(null);
                onViewChange('create');
              }}
              purpose={
                campaignActorSelectContext
                  ? { kind: 'selectForCampaign', context: campaignActorSelectContext }
                  : { kind: 'manage' }
              }
              onSelectActorForCampaign={handleSelectActorForCampaign}
              onRequestSelectCampaignForActor={handleRequestSelectCampaignForActor}
              onReturnToCampaignEntry={handleReturnToCampaignEntry}
              strings={_vaultStrings}
              colorTheme={DND_VAULT_COLOR_THEME}
              panelClassName={panelClass}
              contextBarClassName="border-[#58180d]/30 bg-white/50 text-[#58180d]"
              homeCards={<DndPersonalSpeciesPackPanel locale={locale} />}
            />
          )}

          {!campaignRuntimeContext && view === 'campaigns' && hostedRoomSession && (
            <HostedRoomLaunchPanel
              baseUrl={hostedRoomSession.baseUrl}
              room={hostedRoomSession.room}
              hostMemberId={hostedRoomSession.hostMemberId}
              serverLabel="本地 Room Server（局域网 v0）"
              backLabel={
                hostedRoomSession.source === 'runtimeSettings'
                  ? '返回本地 Runtime'
                  : hostedRoomSession.source === 'campaignList'
                    ? '返回战役列表'
                    : '返回战役详情'
              }
              originLabel={hostedRoomSession.source === 'runtimeSettings' ? '当前 Runtime' : '主持战役'}
              originDetail={
                hostedRoomSession.source === 'runtimeSettings'
                  ? '从本地 Runtime 创建的联机房间大厅'
                  : hostedRoomSession.room.campaignRef?.displayName
              }
              onClose={handleCloseHostedRoom}
              onBackOverrideChange={onGlobalBackOverrideChange}
              panelClassName={panelClass}
            />
          )}

          {!campaignRuntimeContext && view === 'campaigns' && !hostedRoomSession && (
            <div className="space-y-3">
              {hostLaunchError && (
                <div className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-700">
                  <div className="font-bold">无法创建联机房间：请确认 Room Server 正在运行。</div>
                  <details className="mt-0.5">
                    <summary className="cursor-pointer text-[10px] font-bold text-red-700/70">诊断信息</summary>
                    <div className="mt-0.5 break-words text-[10px] opacity-80">{hostLaunchError}</div>
                  </details>
                </div>
              )}
              <div className="flex items-center gap-2 border-b border-[#58180d]/15 pb-1">
                <span className="text-sm font-black uppercase tracking-wider text-[#58180d]">进入战役</span>
                <div className="ml-2 flex gap-1">
                  {([['mine', '主持战役'], ['join', '加入战役']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCampaignEntryTab(key)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                        campaignEntryTab === key ? 'bg-[#58180d] text-white' : 'text-[#58180d]/70 hover:bg-[#58180d]/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {campaignEntryTab === 'mine' ? (
                <CampaignLibraryShell
                  systemId="dnd5e-2024"
                  systemName="DND 2024"
                  tone="dnd"
                  initialMode={
                    campaignActorAddContext || campaignActorSelectContext || suggestedCampaignActor || focusedCampaignId
                      ? 'detail'
                      : openCampaignListOnReturn
                        ? 'existing'
                        : undefined
                  }
                  initialCampaignId={campaignActorAddContext?.campaignId ?? campaignActorSelectContext?.campaignId ?? focusedCampaignId}
                  purpose={
                    campaignSelectForActorContext
                      ? { kind: 'selectForActor', context: campaignSelectForActorContext }
                      : { kind: 'manage' }
                  }
                  suggestedActor={suggestedCampaignActor}
                  onRequestAddActorForCampaign={handleRequestAddActorForCampaign}
                  onRequestSelectActorForCampaign={handleRequestSelectActorForCampaign}
                  onSelectCampaignForActor={handleSelectCampaignForActor}
                  onReturnToActorContext={handleReturnToActorContext}
                  onEnterCampaignRuntime={handleEnterCampaignRuntime}
                  onHostLaunchRoom={handleHostLaunchRoom}
                  onCampaignCreated={handleCampaignCreatedOrImported}
                  onCampaignImported={handleCampaignCreatedOrImported}
                  onBackOverrideChange={onGlobalBackOverrideChange}
                  panelClassName={panelClass}
                />
              ) : (
                <JoinCampaignPanel
                  systemId="dnd5e-2024"
                  tone="dnd"
                  panelClassName={panelClass}
                  onBackOverrideChange={onGlobalBackOverrideChange}
                  onOpenFullCharacterCreator={() => {
                    resetDndCreator();
                    onOpenPlayTab('creator');
                  }}
                />
              )}
            </div>
          )}

          {!campaignRuntimeContext && view === 'createCampaign' && (
            <CampaignLibraryShell
              systemId="dnd5e-2024"
              systemName="DND 2024"
              tone="dnd"
              mode="create"
              onCampaignCreated={handleCampaignCreatedOrImported}
              onCampaignImported={handleCampaignCreatedOrImported}
              onBackOverrideChange={onGlobalBackOverrideChange}
              panelClassName={panelClass}
            />
          )}

          {!campaignRuntimeContext && view === 'compendium' && (
            <section className={panelClass}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-[#58180d]">
                {t('dndWorkspace.compendium.title')}
              </h2>
              <p className="mb-4 text-xs text-[#58180d]/70">{t('dndWorkspace.compendium.note')}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {compendiumCards.map((card) => (
                  <div key={card.labelKey} className="border border-[#58180d]/20 bg-white/50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-[#58180d]">{t(card.labelKey)}</div>
                      <span className="border border-[#58180d]/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/80">
                        {t('dndWorkspace.sources.statusNeedsCheck')}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-sm text-[#2c1810]/85">
                      {card.count} {t(card.statusKey)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border border-dashed border-[#58180d]/30 bg-white/30 p-3 text-xs text-[#58180d]/60">
                {t('dndWorkspace.compendium.backgroundsLine')}：{DND_2024_BACKGROUND_INDEX_DATA.length}
              </div>
            </section>
          )}

          {!campaignRuntimeContext && view === 'sources' && (
            <section className={panelClass}>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#58180d]">
                {t('dndWorkspace.sources.title')}
              </h2>
              <div className="space-y-3">
                {sourceRows.map((row) => (
                  <div key={row.sourceId} className="border border-[#58180d]/20 bg-white/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="mr-2 border border-[#58180d]/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#58180d]/70">
                          {t(row.groupKey)}
                        </span>
                        <span className="font-bold text-[#58180d]">{row.name}</span>
                      </div>
                      <span className="border border-[#2f7f68]/50 bg-[#2f7f68]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#2f7f68]">
                        {t(row.statusKey)}
                      </span>
                    </div>
                    <div className="mt-2 font-mono text-[11px] text-[#2c1810]/70">sourceId: {row.sourceId}</div>
                    <p className="mt-1 text-xs text-[#2c1810]/80">{t(row.noteKey)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!campaignRuntimeContext && view === 'ruleSources' && (
            <SystemRuleSourcesShell items={DND_RULE_SOURCES} t={t} theme={dndRuleSourcesTheme} />
          )}
        </main>
      )}
    </div>
  );
}
