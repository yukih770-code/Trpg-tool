import type {
  CampaignActorAddReturnContext,
  CampaignActorSelectReturnContext,
  CampaignEntryRole,
  CampaignInstanceSummary,
  CampaignLibraryPurpose,
  CampaignRuntimeContext,
  CampaignSuggestedActor,
} from '../../lib/platform/campaignFlow';
import { useCampaignEntryDraftStore, type CampaignEntryDraftRole } from '../../lib/platform/campaignEntryDraftStore';
import type {
  LocalCampaign,
  LocalCampaignLifecycleStatus,
  LocalCampaignSystemId,
  LocalCampaignStatus,
} from '../../lib/platform/campaignLocalStore';
import { useCampaignLocalStore } from '../../lib/platform/campaignLocalStore';
import { getActorVaultRecord } from '../../lib/platform/actorVaultRepositoryBridge';
import { createTranslator, readStoredLocale } from '../../i18n';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ContextBar } from './ContextBar';

type CampaignLibraryTone = 'dnd' | 'coc' | 'cp';
type CampaignLibraryMode = 'home' | 'existing' | 'detail' | 'add';
type CampaignLifecycleFilter = Extract<LocalCampaignLifecycleStatus, 'active' | 'archived' | 'trashed'>;
type CampaignEditDraft = {
  title: string;
  description: string;
  roomCode: string;
  status: LocalCampaignStatus;
};

type CampaignLibraryShellProps = {
  systemId: LocalCampaignSystemId;
  systemName: string;
  tone: CampaignLibraryTone;
  mode?: 'library' | 'create';
  initialMode?: Exclude<CampaignLibraryMode, 'add'>;
  initialCampaignId?: string | null;
  purpose?: CampaignLibraryPurpose;
  suggestedActor?: CampaignSuggestedActor | null;
  onAddCampaign?: () => void;
  onRequestAddActorForCampaign?: (context: CampaignActorAddReturnContext) => void;
  onRequestSelectActorForCampaign?: (context: CampaignActorSelectReturnContext) => void;
  onSelectCampaignForActor?: (
    campaign: CampaignInstanceSummary,
    context: Extract<CampaignLibraryPurpose, { kind: 'selectForActor' }>['context'],
  ) => void;
  onReturnToActorContext?: (context: Extract<CampaignLibraryPurpose, { kind: 'selectForActor' }>['context']) => void;
  onEnterCampaignRuntime?: (context: CampaignRuntimeContext) => void;
  panelClassName?: string;
  contextBarClassName?: string;
};

const toneClasses: Record<CampaignLibraryTone, {
  card: string;
  accent: string;
  muted: string;
  primary: string;
  secondary: string;
  badge: string;
  danger: string;
}> = {
  dnd: {
    card: 'border-[#58180d]/25 bg-white/55',
    accent: 'text-[#58180d]',
    muted: 'text-[#58180d]/70',
    primary: 'border-[#58180d] bg-[#58180d] text-[#fdf6e3]',
    secondary: 'border-[#58180d]/35 text-[#58180d]/55',
    badge: 'border-[#58180d]/30 text-[#58180d]/70',
    danger: 'border-red-700/45 text-red-700/75',
  },
  coc: {
    card: 'border-[#2f7f68]/35 bg-[#101816]/85',
    accent: 'text-[#5aa58f]',
    muted: 'text-[#8fb7aa]/75',
    primary: 'border-[#2f7f68] bg-[#2f7f68] text-[#06100d]',
    secondary: 'border-[#2f7f68]/40 text-[#8fb7aa]/60',
    badge: 'border-[#2f7f68]/40 text-[#8fb7aa]/70',
    danger: 'border-red-400/45 text-red-300/75',
  },
  cp: {
    card: 'border-[#d8b954]/35 bg-[#0d0d0d]/85',
    accent: 'text-[#f5c518]',
    muted: 'text-[#d8b954]/75',
    primary: 'border-[#f5c518] bg-[#f5c518] text-[#0d0d0d]',
    secondary: 'border-[#d8b954]/40 text-[#d8b954]/60',
    badge: 'border-[#d8b954]/40 text-[#d8b954]/70',
    danger: 'border-red-400/45 text-red-300/75',
  },
};

const statusOrder: Record<LocalCampaignStatus, number> = {
  active: 0,
  draft: 1,
};

const lifecycleOrder: Record<LocalCampaignLifecycleStatus, number> = {
  active: 0,
  archived: 1,
  trashed: 2,
};

// AI-LANDMARK: A11_SYSTEM_WORKSPACE_ENTRY_SHELL_V1
// Campaign Library now reads/writes LocalCampaign records only.
// No CampaignMembership, CampaignActorInstance, RuntimeSession, multiplayer,
// backend, permission, RuntimeLog, map, handout, PackageLibrary UI, or
// Workshop Builder behavior is implemented here.
export function CampaignLibraryShell({
  systemId,
  systemName,
  tone,
  mode = 'library',
  initialMode,
  initialCampaignId,
  purpose = { kind: 'manage' },
  suggestedActor,
  onAddCampaign,
  onRequestSelectActorForCampaign,
  onSelectCampaignForActor,
  onReturnToActorContext,
  onEnterCampaignRuntime,
  panelClassName,
  contextBarClassName,
}: CampaignLibraryShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const [libraryMode, setLibraryMode] = useState<CampaignLibraryMode>(initialMode ?? 'home');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedEntryRole, setSelectedEntryRole] = useState<CampaignEntryRole>('playerCharacter');
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [campaignLifecycleFilter, setCampaignLifecycleFilter] = useState<CampaignLifecycleFilter>('active');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignEditDraft, setCampaignEditDraft] = useState<CampaignEditDraft>({
    title: '',
    description: '',
    roomCode: '',
    status: 'draft',
  });
  const theme = toneClasses[tone];

  const allCampaigns = useCampaignLocalStore((state) => state.campaigns);
  const createCampaign = useCampaignLocalStore((state) => state.createCampaign);
  const updateCampaign = useCampaignLocalStore((state) => state.updateCampaign);
  const archiveCampaign = useCampaignLocalStore((state) => state.archiveCampaign);
  const restoreCampaign = useCampaignLocalStore((state) => state.restoreCampaign);
  const trashCampaign = useCampaignLocalStore((state) => state.trashCampaign);
  const getCampaignById = useCampaignLocalStore((state) => state.getCampaignById);
  const campaignEntryDrafts = useCampaignEntryDraftStore((state) => state.drafts);
  const setCampaignEntryDraftActor = useCampaignEntryDraftStore((state) => state.setCampaignEntryDraftActor);
  const setCampaignEntryDraftRole = useCampaignEntryDraftStore((state) => state.setCampaignEntryDraftRole);
  const campaignSelectForActorContext =
    purpose.kind === 'selectForActor' ? purpose.context : null;

  const campaigns = useMemo(
    () =>
      allCampaigns
        .filter((campaign) => campaign.systemId === systemId)
        .sort((a, b) => {
          const lifecycleDiff = lifecycleOrder[a.lifecycleStatus] - lifecycleOrder[b.lifecycleStatus];
          if (lifecycleDiff !== 0) return lifecycleDiff;
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          if (statusDiff !== 0) return statusDiff;
          return b.updatedAt.localeCompare(a.updatedAt);
        }),
    [allCampaigns, systemId],
  );
  const effectiveLifecycleFilter: CampaignLifecycleFilter = campaignSelectForActorContext ? 'active' : campaignLifecycleFilter;
  const normalizedSearchQuery = campaignSearchQuery.trim().toLowerCase();
  const visibleCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        if (campaign.lifecycleStatus !== effectiveLifecycleFilter) return false;
        if (!normalizedSearchQuery) return true;
        return [
          campaign.title,
          campaign.description ?? '',
          campaign.roomCode ?? '',
        ].some((value) => value.toLowerCase().includes(normalizedSearchQuery));
      }),
    [campaigns, effectiveLifecycleFilter, normalizedSearchQuery],
  );
  const activeCampaigns = campaigns.filter((campaign) => campaign.lifecycleStatus === 'active');
  const draftCampaigns = campaigns.filter((campaign) => campaign.lifecycleStatus === 'active' && campaign.status === 'draft');
  const selectedCampaign =
    selectedCampaignId && getCampaignById(selectedCampaignId)?.systemId === systemId
      ? getCampaignById(selectedCampaignId)
      : visibleCampaigns[0] ?? campaigns.find((campaign) => campaign.lifecycleStatus === 'active') ?? campaigns[0];
  const isWaitingForInitialCampaign = Boolean(
    initialCampaignId &&
    campaigns.some((campaign) => campaign.id === initialCampaignId) &&
    selectedCampaign?.id !== initialCampaignId,
  );
  const selectedCampaignDraft = selectedCampaign
    ? campaignEntryDrafts.find((draft) => draft.campaignId === selectedCampaign.id)
    : undefined;
  const draftActorRecord =
    selectedCampaignDraft?.systemId === systemId && selectedCampaignDraft.selectedActorId
      ? getActorVaultRecord(systemId, selectedCampaignDraft.selectedActorId)
      : undefined;
  const draftSuggestedActor: CampaignSuggestedActor | null = draftActorRecord
    ? {
        actorId: draftActorRecord.id,
        actorName: draftActorRecord.displayName,
      }
    : null;
  const hasStaleDraftActor = Boolean(
    selectedCampaignDraft?.selectedActorId &&
    selectedCampaignDraft.systemId === systemId &&
    !draftActorRecord,
  );
  const effectiveSuggestedActor =
    suggestedActor ??
    (campaignSelectForActorContext
      ? {
          actorId: campaignSelectForActorContext.actorId,
          actorName: campaignSelectForActorContext.actorName,
        }
      : draftSuggestedActor);

  const createActions = [
    { key: 'campaignLibrary.create.standard', enabled: true },
    { key: 'campaignLibrary.create.quick', enabled: false },
    { key: 'campaignLibrary.create.importCampaign', enabled: false },
  ];
  const stats = [
    ['campaignLibrary.stats.total', String(campaigns.length)],
    ['campaignLibrary.stats.active', String(activeCampaigns.filter((campaign) => campaign.status === 'active').length)],
    ['campaignLibrary.stats.hosted', String(campaigns.length)],
    ['campaignLibrary.stats.joined', '0'],
    ['campaignLibrary.stats.needsAttention', String(draftCampaigns.length)],
    ['campaignLibrary.stats.recentPlayed', campaigns[0] ? formatCampaignDate(campaigns[0].updatedAt) : '-'],
  ];
  const hostPrepItems = [
    'campaignLibrary.detail.hostPrep.importActors',
    'campaignLibrary.detail.hostPrep.addMap',
    'campaignLibrary.detail.hostPrep.addHandout',
    'campaignLibrary.detail.hostPrep.enablePackage',
    'campaignLibrary.detail.hostPrep.managePlayers',
    'campaignLibrary.detail.hostPrep.diceLogSettings',
    'campaignLibrary.detail.hostPrep.campaignSettings',
  ];

  useEffect(() => {
    if (campaignSelectForActorContext) {
      setCampaignLifecycleFilter('active');
      setLibraryMode('existing');
      return;
    }
    if (initialMode) setLibraryMode(initialMode);
  }, [initialMode, campaignSelectForActorContext?.actorId]);

  useEffect(() => {
    if (!initialCampaignId) return;
    const initialCampaign = campaigns.find((campaign) => campaign.id === initialCampaignId);
    if (!initialCampaign) return;
    setCampaignLifecycleFilter(initialCampaign.lifecycleStatus);
    setSelectedCampaignId(initialCampaignId);
  }, [campaigns, initialCampaignId]);

  useEffect(() => {
    if (isWaitingForInitialCampaign) return;
    if (campaignSelectForActorContext || suggestedActor) {
      setSelectedEntryRole('playerCharacter');
      if (selectedCampaign) {
        setCampaignEntryDraftRole(selectedCampaign.id, systemId, 'player');
      }
      return;
    }
    if (selectedCampaignDraft?.selectedEntryRole) {
      setSelectedEntryRole(fromDraftEntryRole(selectedCampaignDraft.selectedEntryRole));
    }
  }, [
    campaignSelectForActorContext?.actorId,
    isWaitingForInitialCampaign,
    selectedCampaign?.id,
    selectedCampaignDraft?.selectedEntryRole,
    setCampaignEntryDraftRole,
    suggestedActor?.actorId,
    systemId,
  ]);

  useEffect(() => {
    if (isWaitingForInitialCampaign) return;
    if (!selectedCampaign || !suggestedActor) return;
    setCampaignEntryDraftActor(selectedCampaign.id, systemId, suggestedActor.actorId);
    setCampaignEntryDraftRole(selectedCampaign.id, systemId, 'player');
  }, [
    selectedCampaign?.id,
    isWaitingForInitialCampaign,
    setCampaignEntryDraftActor,
    setCampaignEntryDraftRole,
    suggestedActor?.actorId,
    systemId,
  ]);

  useEffect(() => {
    if (selectedCampaignId && !campaigns.some((campaign) => campaign.id === selectedCampaignId)) {
      setSelectedCampaignId(visibleCampaigns[0]?.id ?? campaigns[0]?.id ?? null);
    }
  }, [campaigns, selectedCampaignId, visibleCampaigns]);

  const contextLabel = campaignSelectForActorContext
    ? `${t('campaignLibrary.returnContext.selectingCampaignPrefix')}「${campaignSelectForActorContext.actorName}」${t('campaignLibrary.returnContext.selectingCampaignSuffix')}`
    : '';

  const contextBar = campaignSelectForActorContext ? (
    <ContextBar
      label={contextLabel}
      status={t('campaignLibrary.returnContext.selectCampaignButton')}
      backLabel={campaignSelectForActorContext.returnLabel}
      onBack={
        onReturnToActorContext
          ? () => onReturnToActorContext(campaignSelectForActorContext)
          : undefined
      }
      className={contextBarClassName}
    />
  ) : null;

  const setEntryRoleDraft = (role: CampaignEntryRole) => {
    setSelectedEntryRole(role);
    if (selectedCampaign) {
      setCampaignEntryDraftRole(selectedCampaign.id, systemId, toDraftEntryRole(role));
    }
  };

  const requestSelectActorForCampaign = () => {
    if (!selectedCampaign) return;
    setEntryRoleDraft('playerCharacter');
    onRequestSelectActorForCampaign?.({
      campaignId: selectedCampaign.id,
      campaignTitle: selectedCampaign.title,
      campaignRoomCode: selectedCampaign.roomCode,
      source: 'campaignEntry',
      returnLabel: t('campaignLibrary.returnContext.returnButton'),
      returnTo: {
        view: 'campaignDetail',
        systemId,
        campaignId: selectedCampaign.id,
      },
    });
  };

  const canEnterRuntime = Boolean(
    selectedCampaign &&
    onEnterCampaignRuntime &&
    (selectedEntryRole === 'host' || effectiveSuggestedActor),
  );
  const canEnterPlayerRuntime = Boolean(
    selectedCampaign &&
    onEnterCampaignRuntime &&
    selectedEntryRole === 'playerCharacter' &&
    effectiveSuggestedActor,
  );
  const canEnterHostRuntime = Boolean(
    selectedCampaign &&
    onEnterCampaignRuntime &&
    selectedEntryRole === 'host',
  );

  const enterCampaignRuntime = () => {
    if (!selectedCampaign || !canEnterRuntime || !onEnterCampaignRuntime) return;

    onEnterCampaignRuntime({
      campaignId: selectedCampaign.id,
      campaignTitle: selectedCampaign.title,
      campaignRoomCode: selectedCampaign.roomCode,
      systemId,
      selectedEntryRole,
      selectedActorId: selectedEntryRole === 'playerCharacter' ? effectiveSuggestedActor?.actorId : undefined,
      selectedActorName: selectedEntryRole === 'playerCharacter' ? effectiveSuggestedActor?.actorName : undefined,
      source: 'campaignEntry',
    });
  };

  const handleCreateCampaign = () => {
    const campaign = createCampaign({
      systemId,
      title: t('campaignLibrary.create.defaultTitle'),
      description: t('campaignLibrary.create.defaultDescription'),
      status: 'draft',
    });
    setSelectedCampaignId(campaign.id);
    setLibraryMode('detail');
  };

  const handleSelectCampaignForActor = (campaign: LocalCampaign) => {
    if (!campaignSelectForActorContext || !onSelectCampaignForActor) return;
    if (campaign.lifecycleStatus !== 'active') return;
    setSelectedCampaignId(campaign.id);
    setCampaignEntryDraftActor(campaign.id, systemId, campaignSelectForActorContext.actorId);
    setCampaignEntryDraftRole(campaign.id, systemId, 'player');
    onSelectCampaignForActor(toCampaignInstanceSummary(campaign), campaignSelectForActorContext);
  };

  const startEditingCampaign = (campaign: LocalCampaign) => {
    setEditingCampaignId(campaign.id);
    setCampaignEditDraft({
      title: campaign.title,
      description: campaign.description ?? '',
      roomCode: campaign.roomCode ?? '',
      status: campaign.status,
    });
  };

  const cancelEditingCampaign = () => {
    setEditingCampaignId(null);
    setCampaignEditDraft({
      title: '',
      description: '',
      roomCode: '',
      status: 'draft',
    });
  };

  const saveEditingCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCampaignId || !campaignEditDraft.title.trim()) return;
    updateCampaign(editingCampaignId, {
      title: campaignEditDraft.title,
      description: campaignEditDraft.description.trim() || undefined,
      roomCode: campaignEditDraft.roomCode.trim() || undefined,
      status: campaignEditDraft.status,
    });
    cancelEditingCampaign();
  };

  const handleArchiveCampaign = (campaign: LocalCampaign) => {
    archiveCampaign(campaign.id);
    setCampaignLifecycleFilter('archived');
    if (selectedCampaignId === campaign.id) {
      setLibraryMode('existing');
    }
  };

  const handleRestoreCampaign = (campaign: LocalCampaign) => {
    restoreCampaign(campaign.id);
    setCampaignLifecycleFilter('active');
  };

  const handleMoveCampaignToTrash = (campaign: LocalCampaign) => {
    if (!window.confirm(t('campaignLibrary.actions.moveToTrashConfirm'))) return;
    trashCampaign(campaign.id);
    if (selectedCampaignId === campaign.id) {
      setSelectedCampaignId(null);
      setLibraryMode('existing');
    }
    setCampaignLifecycleFilter('trashed');
  };

  const showAddFlow = (mode === 'create' || libraryMode === 'add') && libraryMode !== 'detail';
  const showDetail = (mode === 'library' || mode === 'create') && libraryMode === 'detail';

  return (
    <section className={panelClassName ?? 'rounded-lg border p-5'}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={`text-xs font-bold uppercase tracking-[0.22em] ${theme.muted}`}>
            {t(showAddFlow ? 'campaignLibrary.create.eyebrow' : 'campaignLibrary.eyebrow')}
          </div>
          <h2 className={`mt-2 text-2xl font-bold ${theme.accent}`}>
            {t(showAddFlow ? 'campaignLibrary.create.title' : 'campaignLibrary.title')}
          </h2>
          <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${theme.muted}`}>
            {t(showAddFlow ? 'campaignLibrary.create.subtitle' : 'campaignLibrary.subtitle')}
          </p>
        </div>
        <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
          {systemName}
        </span>
      </div>

      {showAddFlow && (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {createActions.map((action, index) => (
            <button
              key={action.key}
              type="button"
              disabled={!action.enabled}
              onClick={action.enabled ? handleCreateCampaign : undefined}
              className={`min-h-28 border p-4 text-left ${
                action.enabled ? 'transition hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default opacity-60'
              } ${index === 0 ? theme.primary : theme.secondary}`}
            >
              <span className="block text-sm font-bold">{t(action.key)}</span>
              <span className="mt-2 block text-xs leading-relaxed opacity-75">
                {t(action.enabled ? 'campaignLibrary.create.standardNote' : 'campaignLibrary.actions.placeholder')}
              </span>
            </button>
          ))}
        </div>
      )}

      {mode === 'library' && libraryMode === 'home' && (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setLibraryMode('existing')}
            className={`min-h-48 border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}
          >
            <h3 className={`text-lg font-bold ${theme.accent}`}>{t('campaignLibrary.title')}</h3>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
              {stats.map(([labelKey, value]) => (
                <div key={labelKey}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                    {t(labelKey)}
                  </div>
                  <div className="mt-1 break-words text-2xl font-bold">{value}</div>
                </div>
              ))}
            </div>
          </button>

          <button
            type="button"
            onClick={onAddCampaign ?? (() => setLibraryMode('add'))}
            className={`min-h-48 border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}
          >
            <h3 className={`text-lg font-bold ${theme.accent}`}>{t('campaignLibrary.actions.add')}</h3>
            <p className={`mt-3 text-sm leading-relaxed ${theme.muted}`}>
              {t('campaignLibrary.actions.addNote')}
            </p>
          </button>
        </div>
      )}

      {mode === 'library' && libraryMode === 'existing' && (
        <div className="mt-5 flex flex-col gap-4">
          {contextBar}
          <div>
            <p className={`text-xs ${theme.muted}`}>
              {t('campaignLibrary.eyebrow')}
              <span className="mx-1.5 opacity-40">/</span>
              {t('campaignLibrary.existing.title')}
            </p>
            <h3 className={`mt-1 text-xl font-bold ${theme.accent}`}>
              {t('campaignLibrary.existing.title')}
            </h3>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>
              {t('campaignLibrary.existing.subtitle')}
            </p>
          </div>

          <div className={`rounded-lg border p-4 ${theme.card}`}>
            <div className="flex flex-wrap gap-3">
              <input
                type="search"
                value={campaignSearchQuery}
                onChange={(event) => setCampaignSearchQuery(event.target.value)}
                placeholder={t('campaignLibrary.existing.searchPlaceholder')}
                className="min-w-0 flex-1 border bg-transparent px-3 py-1.5 text-sm"
              />
              <select disabled className="border bg-transparent px-3 py-1.5 text-xs opacity-60">
                <option>{t('campaignLibrary.existing.sortRecent')}</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                ['active', 'campaignLibrary.existing.filterActive'],
                ['archived', 'campaignLibrary.existing.filterArchived'],
                ['trashed', 'campaignLibrary.existing.filterTrashed'],
              ].map(([filter, key]) => (
                <button
                  key={key}
                  type="button"
                  disabled={Boolean(campaignSelectForActorContext) && filter !== 'active'}
                  onClick={() => {
                    setCampaignLifecycleFilter(filter as CampaignLifecycleFilter);
                    setEditingCampaignId(null);
                  }}
                  className={`border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                    effectiveLifecycleFilter === filter ? theme.primary : theme.badge
                  } ${Boolean(campaignSelectForActorContext) && filter !== 'active' ? 'cursor-default opacity-50' : ''}`}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <p className={`mt-3 text-xs leading-relaxed ${theme.muted}`}>
              {t('campaignLibrary.existing.lifecycleNote')}
            </p>
          </div>

          {visibleCampaigns.length === 0 ? (
            <EmptyCampaignState
              theme={theme}
              title={t(campaigns.length === 0 ? 'campaignLibrary.empty.title' : 'campaignLibrary.empty.noMatchesTitle')}
              note={t(campaigns.length === 0 ? 'campaignLibrary.empty.note' : 'campaignLibrary.empty.noMatchesNote')}
              addLabel={t('campaignLibrary.actions.add')}
              onAdd={onAddCampaign ?? (() => setLibraryMode('add'))}
            />
          ) : (
            visibleCampaigns.map((campaign) => (
              <div key={campaign.id}>
                <CampaignCard
                  campaign={campaign}
                  editDraft={editingCampaignId === campaign.id ? campaignEditDraft : null}
                  systemName={systemName}
                  theme={theme}
                  t={t}
                  canSelect={Boolean(campaignSelectForActorContext && onSelectCampaignForActor)}
                  onSelect={() => handleSelectCampaignForActor(campaign)}
                  onViewDetail={() => {
                    setSelectedCampaignId(campaign.id);
                    setLibraryMode('detail');
                  }}
                  onActivate={() => updateCampaign(campaign.id, { status: 'active' })}
                  onArchive={() => handleArchiveCampaign(campaign)}
                  onRestore={() => handleRestoreCampaign(campaign)}
                  onMoveToTrash={() => handleMoveCampaignToTrash(campaign)}
                  onStartEdit={() => startEditingCampaign(campaign)}
                  onCancelEdit={cancelEditingCampaign}
                  onSubmitEdit={saveEditingCampaign}
                  onEditDraftChange={setCampaignEditDraft}
                />
              </div>
            ))
          )}
        </div>
      )}

      {showDetail && (
        selectedCampaign ? (
          <CampaignDetail
            campaign={selectedCampaign}
            systemId={systemId}
            systemName={systemName}
            theme={theme}
            t={t}
            effectiveSuggestedActor={effectiveSuggestedActor}
            hasStaleDraftActor={hasStaleDraftActor}
            selectedEntryRole={selectedEntryRole}
            setSelectedEntryRole={setEntryRoleDraft}
            requestSelectActorForCampaign={requestSelectActorForCampaign}
            enterCampaignRuntime={enterCampaignRuntime}
            canEnterPlayerRuntime={canEnterPlayerRuntime}
            canEnterHostRuntime={canEnterHostRuntime}
            hostPrepItems={hostPrepItems}
          />
        ) : (
          <div className="mt-5">
            <EmptyCampaignState
              theme={theme}
              title={t('campaignLibrary.empty.title')}
              note={t('campaignLibrary.empty.note')}
              addLabel={t('campaignLibrary.actions.add')}
              onAdd={onAddCampaign ?? (() => setLibraryMode('add'))}
            />
          </div>
        )
      )}

      {mode === 'library' && (
        <p className={`mt-5 border-t pt-4 text-xs leading-relaxed ${theme.muted}`}>
          {t('campaignLibrary.shortConcept')}
        </p>
      )}
    </section>
  );
}

function CampaignCard({
  campaign,
  editDraft,
  systemName,
  theme,
  t,
  canSelect,
  onSelect,
  onViewDetail,
  onActivate,
  onArchive,
  onRestore,
  onMoveToTrash,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onEditDraftChange,
}: {
  campaign: LocalCampaign;
  editDraft: CampaignEditDraft | null;
  systemName: string;
  theme: (typeof toneClasses)[CampaignLibraryTone];
  t: (key: string) => string;
  canSelect: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onMoveToTrash: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
  onEditDraftChange: (draft: CampaignEditDraft) => void;
}) {
  const isEditing = Boolean(editDraft);
  const canManage = !canSelect;
  return (
    <div className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
            {t('campaignLibrary.recent')}
          </div>
          <h3 className={`mt-1 text-xl font-bold ${theme.accent}`}>
            {campaign.title}{campaign.roomCode ? ` #${campaign.roomCode}` : ''}
          </h3>
          <p className={`mt-2 max-w-2xl text-xs leading-relaxed ${theme.muted}`}>
            {campaign.description || t('campaignLibrary.empty.noDescription')}
          </p>
        </div>
        <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${theme.badge}`}>
          {t(getCampaignStatusLabelKey(campaign))}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t('campaignLibrary.fields.system'), systemName],
          [t('campaignLibrary.detail.fields.roomCode'), campaign.roomCode || '-'],
          [t('campaignLibrary.fields.status'), t(getCampaignStatusLabelKey(campaign))],
          [t('campaignLibrary.fields.updatedAt'), formatCampaignDate(campaign.updatedAt)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className={`font-bold uppercase tracking-wider ${theme.muted}`}>{label}</dt>
            <dd className="mt-1 break-words font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {canSelect && campaign.lifecycleStatus === 'active' && (
          <button
            type="button"
            onClick={onSelect}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.primary}`}
          >
            {t('campaignLibrary.returnContext.selectCampaignButton')}
          </button>
        )}
        <button
          type="button"
          onClick={onViewDetail}
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
            canSelect ? theme.secondary : theme.primary
          }`}
        >
          {t('campaignLibrary.actions.viewDetail')}
        </button>
        {canManage && campaign.lifecycleStatus === 'active' && (
          <button
            type="button"
            onClick={onStartEdit}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t('campaignLibrary.actions.edit')}
          </button>
        )}
        {canManage && campaign.lifecycleStatus === 'active' && campaign.status !== 'active' && (
          <button
            type="button"
            onClick={onActivate}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t('campaignLibrary.actions.activate')}
          </button>
        )}
        {canManage && campaign.lifecycleStatus === 'active' && (
          <button
            type="button"
            onClick={onArchive}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t('campaignLibrary.actions.archive')}
          </button>
        )}
        {canManage && campaign.lifecycleStatus !== 'active' && (
          <button
            type="button"
            onClick={onRestore}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t('campaignLibrary.actions.restore')}
          </button>
        )}
        {canManage && campaign.lifecycleStatus !== 'trashed' && (
          <button
            type="button"
            onClick={onMoveToTrash}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.danger}`}
          >
            {t('campaignLibrary.actions.moveToTrash')}
          </button>
        )}
      </div>
      {isEditing && editDraft && (
        <form onSubmit={onSubmitEdit} className={`mt-4 rounded-lg border p-4 ${theme.card}`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
            {t('campaignLibrary.edit.title')}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-xs font-bold">
              <span className={theme.muted}>{t('campaignLibrary.edit.fields.title')}</span>
              <input
                value={editDraft.title}
                onChange={(event) => onEditDraftChange({ ...editDraft, title: event.target.value })}
                className="mt-1 w-full border bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold">
              <span className={theme.muted}>{t('campaignLibrary.edit.fields.roomCode')}</span>
              <input
                value={editDraft.roomCode}
                onChange={(event) => onEditDraftChange({ ...editDraft, roomCode: event.target.value })}
                className="mt-1 w-full border bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold md:col-span-2">
              <span className={theme.muted}>{t('campaignLibrary.edit.fields.description')}</span>
              <textarea
                value={editDraft.description}
                onChange={(event) => onEditDraftChange({ ...editDraft, description: event.target.value })}
                rows={3}
                className="mt-1 w-full border bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold">
              <span className={theme.muted}>{t('campaignLibrary.edit.fields.status')}</span>
              <select
                value={editDraft.status}
                onChange={(event) => onEditDraftChange({ ...editDraft, status: event.target.value as LocalCampaignStatus })}
                className="mt-1 w-full border bg-transparent px-3 py-2 text-sm"
              >
                <option value="draft">{t('campaignLibrary.status.draft')}</option>
                <option value="active">{t('campaignLibrary.status.active')}</option>
              </select>
            </label>
          </div>
          <p className={`mt-3 text-xs leading-relaxed ${theme.muted}`}>
            {t('campaignLibrary.edit.lifecycleNote')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!editDraft.title.trim()}
              className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                editDraft.title.trim() ? theme.primary : `cursor-default opacity-60 ${theme.secondary}`
              }`}
            >
              {t('campaignLibrary.actions.save')}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
            >
              {t('campaignLibrary.actions.cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CampaignDetail({
  campaign,
  systemId,
  systemName,
  theme,
  t,
  effectiveSuggestedActor,
  hasStaleDraftActor,
  selectedEntryRole,
  setSelectedEntryRole,
  requestSelectActorForCampaign,
  enterCampaignRuntime,
  canEnterPlayerRuntime,
  canEnterHostRuntime,
  hostPrepItems,
}: {
  campaign: LocalCampaign;
  systemId: LocalCampaignSystemId;
  systemName: string;
  theme: (typeof toneClasses)[CampaignLibraryTone];
  t: (key: string) => string;
  effectiveSuggestedActor: CampaignSuggestedActor | null;
  hasStaleDraftActor: boolean;
  selectedEntryRole: CampaignEntryRole;
  setSelectedEntryRole: (role: CampaignEntryRole) => void;
  requestSelectActorForCampaign: () => void;
  enterCampaignRuntime: () => void;
  canEnterPlayerRuntime: boolean;
  canEnterHostRuntime: boolean;
  hostPrepItems: string[];
}) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      <div className={`rounded-lg border p-5 ${theme.card}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${theme.muted}`}>
              {t('campaignLibrary.detail.eyebrow')}
            </div>
            <h3 className={`mt-2 text-2xl font-bold ${theme.accent}`}>
              {campaign.title}{campaign.roomCode ? ` #${campaign.roomCode}` : ''}
            </h3>
            <p className={`mt-2 text-sm leading-relaxed ${theme.muted}`}>
              {campaign.description || t('campaignLibrary.detail.subtitle')}
            </p>
          </div>
          <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${theme.badge}`}>
            {t(getCampaignStatusLabelKey(campaign))}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
          {[
            [t('campaignLibrary.fields.system'), systemName],
            [t('campaignLibrary.detail.fields.roomCode'), campaign.roomCode ?? '-'],
            [t('campaignLibrary.fields.status'), t(getCampaignStatusLabelKey(campaign))],
            [t('campaignLibrary.fields.updatedAt'), formatCampaignDate(campaign.updatedAt)],
            [t('campaignLibrary.detail.fields.identityStatus'), t('campaignLibrary.detail.identityStatus')],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className={`font-bold uppercase tracking-wider ${theme.muted}`}>{label}</dt>
              <dd className="mt-1 break-words font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={`rounded-lg border p-5 ${theme.card}`}>
        <h4 className={`text-lg font-bold ${theme.accent}`}>{t('campaignLibrary.detail.entry.title')}</h4>
        <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
          {t('campaignLibrary.detail.entry.suggestedActorNote')}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`rounded-lg border p-4 ${theme.card}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
              {t('campaignLibrary.detail.entry.playerPath')}
            </div>
            <h5 className={`mt-1 text-base font-bold ${theme.accent}`}>
              {t('campaignLibrary.detail.playerPrep.title')}
            </h5>
            <div className={`mt-3 text-sm ${theme.muted}`}>
              <span className="font-bold">{t('campaignLibrary.detail.playerPrep.currentActor')}：</span>
              {effectiveSuggestedActor?.actorName ?? t('campaignLibrary.detail.playerPrep.unselected')}
            </div>
            {effectiveSuggestedActor && (
              <div className={`mt-3 rounded border p-3 text-xs leading-relaxed ${theme.badge}`}>
                <div className="font-bold">
                  {t('campaignLibrary.detail.playerPrep.suggestedActor')}：{effectiveSuggestedActor.actorName}
                </div>
                <p className="mt-1 opacity-75">
                  {t('campaignLibrary.detail.playerPrep.suggestedActorNote')}
                </p>
              </div>
            )}
            {hasStaleDraftActor && (
              <p className={`mt-3 rounded border p-3 text-xs leading-relaxed ${theme.danger}`}>
                {t('campaignLibrary.detail.playerPrep.staleDraftActor')}
              </p>
            )}
            {selectedEntryRole === 'host' && effectiveSuggestedActor && (
              <p className={`mt-3 text-xs leading-relaxed ${theme.muted}`}>
                {t('campaignLibrary.detail.playerPrep.hostActiveActorNote')}
              </p>
            )}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  selectedEntryRole === 'host'
                    ? () => setSelectedEntryRole('playerCharacter')
                    : requestSelectActorForCampaign
                }
                className={`border px-3 py-2 text-xs font-bold ${
                  selectedEntryRole === 'playerCharacter' && !effectiveSuggestedActor
                    ? theme.primary
                    : theme.secondary
                }`}
              >
                {t(
                  selectedEntryRole === 'host'
                    ? 'campaignLibrary.detail.playerPrep.switchToPlayer'
                    : effectiveSuggestedActor
                    ? 'campaignLibrary.detail.playerPrep.changeActor'
                      : 'campaignLibrary.detail.entry.selectOrAddActor',
                )}
              </button>
              {selectedEntryRole === 'playerCharacter' && effectiveSuggestedActor && (
                <button
                  type="button"
                  onClick={enterCampaignRuntime}
                  disabled={!canEnterPlayerRuntime}
                  className={`border px-3 py-2 text-xs font-bold ${
                    canEnterPlayerRuntime
                      ? theme.primary
                      : `cursor-default opacity-65 ${theme.secondary}`
                  }`}
                >
                  {t('campaignLibrary.detail.playerPrep.enterCampaign')}
                </button>
              )}
            </div>
          </div>

          <div className={`rounded-lg border p-4 ${theme.card}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
              {t('campaignLibrary.detail.entry.hostPath')}
            </div>
            <h5 className={`mt-1 text-base font-bold ${theme.accent}`}>
              {t('campaignLibrary.detail.hostPrep.title')}
            </h5>
            <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
              {selectedEntryRole === 'host'
                ? t('campaignLibrary.detail.entry.hostActiveNote')
                : t('campaignLibrary.detail.entry.hostEntryNote')}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedEntryRole === 'host' ? (
                <button
                  type="button"
                  onClick={enterCampaignRuntime}
                  disabled={!canEnterHostRuntime}
                  className={`border px-3 py-2 text-xs font-bold ${
                    canEnterHostRuntime
                      ? theme.primary
                      : `cursor-default opacity-65 ${theme.secondary}`
                  }`}
                >
                  {t('campaignLibrary.detail.playerPrep.enterCampaign')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedEntryRole('host')}
                  className={`border px-3 py-2 text-xs font-bold ${theme.secondary}`}
                >
                  {t('campaignLibrary.detail.entry.switchToHost')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className={`rounded-lg border p-5 ${theme.card} ${selectedEntryRole === 'host' ? '' : 'opacity-55'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className={`text-lg font-bold ${theme.accent}`}>{t('campaignLibrary.detail.hostPrep.title')}</h4>
              <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
                {selectedEntryRole === 'host'
                  ? t('campaignLibrary.detail.hostPrep.activeNote')
                  : t('campaignLibrary.detail.hostPrep.disabledNote')}
              </p>
            </div>
            <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${theme.badge}`}>
              {t('campaignLibrary.detail.placeholder')}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {hostPrepItems.map((key) => (
              <button
                key={key}
                type="button"
                disabled
                className={`cursor-default border px-3 py-2 text-left text-xs font-bold opacity-65 ${theme.secondary}`}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">{systemId}</span>
    </div>
  );
}

function EmptyCampaignState({
  theme,
  title,
  note,
  addLabel,
  onAdd,
}: {
  theme: (typeof toneClasses)[CampaignLibraryTone];
  title: string;
  note: string;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className={`rounded-lg border p-6 ${theme.card}`}>
      <h3 className={`text-lg font-bold ${theme.accent}`}>{title}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${theme.muted}`}>{note}</p>
      <button
        type="button"
        onClick={onAdd}
        className={`mt-4 border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.primary}`}
      >
        {addLabel}
      </button>
    </div>
  );
}

function toCampaignInstanceSummary(campaign: LocalCampaign): CampaignInstanceSummary {
  return {
    campaignId: campaign.id,
    systemId: campaign.systemId,
    title: campaign.title,
    roomCode: campaign.roomCode,
    lastPlayedAt: campaign.updatedAt,
  };
}

function toDraftEntryRole(role: CampaignEntryRole): CampaignEntryDraftRole {
  return role === 'host' ? 'host' : 'player';
}

function fromDraftEntryRole(role: CampaignEntryDraftRole): CampaignEntryRole {
  return role === 'host' ? 'host' : 'playerCharacter';
}

function getCampaignStatusLabelKey(campaign: LocalCampaign): string {
  if (campaign.lifecycleStatus === 'archived') return 'campaignLibrary.status.archived';
  if (campaign.lifecycleStatus === 'trashed') return 'campaignLibrary.status.trashed';
  return `campaignLibrary.status.${campaign.status}`;
}

function formatCampaignDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
