import type {
  CampaignActorAddReturnContext,
  CampaignActorSelectReturnContext,
  CampaignEntryRole,
  CampaignInstanceSummary,
  CampaignLibraryPurpose,
  CampaignRuntimeContext,
  CampaignSuggestedActor,
} from '../../lib/platform/campaignFlow';
import type { CampaignEntryDraftRole } from '../../lib/platform/campaignEntryDraftStore';
import type {
  LocalCampaign,
  LocalCampaignLifecycleStatus,
  LocalCampaignSystemId,
  LocalCampaignStatus,
} from '../../lib/platform/campaignLocalStore';
import {
  createCampaignLibraryActions,
  filterVisibleCampaigns,
  findCampaignById,
  getCampaignEntryDraftSummary,
  toCampaignInstanceSummary,
  useCampaignEntryDrafts,
  useCampaignLibraryData,
} from '../../lib/platform/campaignLibraryRepository';
import { downloadCampaignLibraryExportSnapshot } from '../../lib/platform/campaignExportSnapshot';
import { parseCampaignImportPreview, type CampaignImportPreview } from '../../lib/platform/campaignImportPreview';
import {
  applyCampaignCopyAsNewImport,
  applyCampaignSafeAppendImport,
  buildCampaignCopyAsNewPlan,
  buildCampaignSafeAppendPlan,
  type CampaignCopyAsNewResult,
  type CampaignSafeAppendResult,
} from '../../lib/platform/campaignImportSafeAppend';
import { createTranslator, readStoredLocale } from '../../i18n';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ContextBar } from './ContextBar';

type CampaignLibraryTone = 'dnd' | 'coc' | 'cp';
type CampaignLibraryMode = 'home' | 'existing' | 'detail' | 'add';
type CampaignLifecycleFilter = Extract<LocalCampaignLifecycleStatus, 'active' | 'archived' | 'trashed'>;
type CampaignEditDraft = {
  title: string;
  description: string;
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
  onCampaignCreated?: (campaign: LocalCampaign) => void;
  onCampaignImported?: (campaign: LocalCampaign) => void;
  onRequestAddActorForCampaign?: (context: CampaignActorAddReturnContext) => void;
  onRequestSelectActorForCampaign?: (context: CampaignActorSelectReturnContext) => void;
  onSelectCampaignForActor?: (
    campaign: CampaignInstanceSummary,
    context: Extract<CampaignLibraryPurpose, { kind: 'selectForActor' }>['context'],
  ) => void;
  onReturnToActorContext?: (context: Extract<CampaignLibraryPurpose, { kind: 'selectForActor' }>['context']) => void;
  onEnterCampaignRuntime?: (context: CampaignRuntimeContext) => void;
  /** Hand the selected campaign to the parent to host a LAN Room Server room (M19). */
  onHostLaunchRoom?: (campaign: LocalCampaign) => void;
  onBackOverrideChange?: (override: { label?: string; onBack: () => void } | null) => void;
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
  onCampaignCreated,
  onCampaignImported,
  onRequestSelectActorForCampaign,
  onSelectCampaignForActor,
  onReturnToActorContext,
  onEnterCampaignRuntime,
  onHostLaunchRoom,
  onBackOverrideChange,
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
  const [expandedMoreCampaignId, setExpandedMoreCampaignId] = useState<string | null>(null);
  const [campaignImportPreviewFileName, setCampaignImportPreviewFileName] = useState('');
  const [campaignImportPreview, setCampaignImportPreview] = useState<CampaignImportPreview | null>(null);
  const [campaignImportPreviewError, setCampaignImportPreviewError] = useState('');
  const [campaignSafeAppendResult, setCampaignSafeAppendResult] = useState<CampaignSafeAppendResult | null>(null);
  const [campaignCopyAsNewResult, setCampaignCopyAsNewResult] = useState<CampaignCopyAsNewResult | null>(null);
  const [isImportingCampaigns, setIsImportingCampaigns] = useState(false);
  const [campaignEditDraft, setCampaignEditDraft] = useState<CampaignEditDraft>({
    title: '',
    description: '',
    status: 'draft',
  });
  const theme = toneClasses[tone];

  const { allCampaigns, campaigns } = useCampaignLibraryData(systemId);
  const campaignEntryDrafts = useCampaignEntryDrafts();
  const actions = useMemo(() => createCampaignLibraryActions(), []);
  const campaignSelectForActorContext =
    purpose.kind === 'selectForActor' ? purpose.context : null;

  const effectiveLifecycleFilter: CampaignLifecycleFilter = campaignSelectForActorContext ? 'active' : campaignLifecycleFilter;
  const visibleCampaigns = useMemo(
    () => filterVisibleCampaigns(campaigns, effectiveLifecycleFilter, campaignSearchQuery),
    [campaigns, effectiveLifecycleFilter, campaignSearchQuery],
  );
  const activeCampaigns = campaigns.filter((campaign) => campaign.lifecycleStatus === 'active');
  const draftCampaigns = campaigns.filter((campaign) => campaign.lifecycleStatus === 'active' && campaign.status === 'draft');
  const selectedCampaignById = findCampaignById(allCampaigns, selectedCampaignId);
  const selectedCampaign =
    selectedCampaignById?.systemId === systemId
      ? selectedCampaignById
      : visibleCampaigns[0] ?? campaigns.find((campaign) => campaign.lifecycleStatus === 'active') ?? campaigns[0];
  const isWaitingForInitialCampaign = Boolean(
    initialCampaignId &&
    campaigns.some((campaign) => campaign.id === initialCampaignId) &&
    selectedCampaign?.id !== initialCampaignId,
  );
  const draftSummary = getCampaignEntryDraftSummary({
    drafts: campaignEntryDrafts,
    campaign: selectedCampaign,
    systemId,
  });
  const selectedCampaignDraft = draftSummary.draft;
  const hasStaleDraftActor = draftSummary.hasStaleDraftActor;
  const effectiveSuggestedActor =
    suggestedActor ??
    (campaignSelectForActorContext
      ? {
          actorId: campaignSelectForActorContext.actorId,
          actorName: campaignSelectForActorContext.actorName,
        }
      : draftSummary.suggestedActor);
  const campaignSafeAppendPlan = useMemo(
    () => (campaignImportPreview ? buildCampaignSafeAppendPlan(campaignImportPreview) : null),
    [campaignImportPreview],
  );
  const campaignCopyAsNewPlan = useMemo(
    () => (campaignImportPreview ? buildCampaignCopyAsNewPlan(campaignImportPreview) : null),
    [campaignImportPreview],
  );

  const createActions = [
    { key: 'campaignLibrary.create.standard', enabled: true },
    { key: 'campaignLibrary.create.quick', enabled: false },
    { key: 'campaignLibrary.create.importCampaign', enabled: false },
  ];
  const stats = [
    // M23.1: host-only workbench — the "joined / 我参与的" stat is removed (joining
    // lives under 加入战役).
    ['campaignLibrary.stats.total', String(campaigns.length)],
    ['campaignLibrary.stats.active', String(activeCampaigns.filter((campaign) => campaign.status === 'active').length)],
    ['campaignLibrary.stats.hosted', String(campaigns.length)],
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
        actions.setEntryDraftRole(selectedCampaign.id, systemId, 'player');
      }
      return;
    }
    if (selectedCampaignDraft?.selectedEntryRole) {
      setSelectedEntryRole(fromDraftEntryRole(selectedCampaignDraft.selectedEntryRole));
    }
  }, [
    actions,
    campaignSelectForActorContext?.actorId,
    isWaitingForInitialCampaign,
    selectedCampaign?.id,
    selectedCampaignDraft?.selectedEntryRole,
    suggestedActor?.actorId,
    systemId,
  ]);

  useEffect(() => {
    if (isWaitingForInitialCampaign) return;
    if (!selectedCampaign || !suggestedActor) return;
    actions.setEntryDraftActor(selectedCampaign.id, systemId, suggestedActor.actorId);
    actions.setEntryDraftRole(selectedCampaign.id, systemId, 'player');
  }, [
    actions,
    selectedCampaign?.id,
    isWaitingForInitialCampaign,
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
      actions.setEntryDraftRole(selectedCampaign.id, systemId, toDraftEntryRole(role));
    }
  };

  const openCampaignDetail = (campaign: LocalCampaign) => {
    setSelectedCampaignId(campaign.id);
    setCampaignLifecycleFilter(campaign.lifecycleStatus);
    setLibraryMode('detail');
  };

  useEffect(() => {
    if (!onBackOverrideChange || mode !== 'library') return;

    if (campaignSelectForActorContext) {
      onBackOverrideChange({
        label: campaignSelectForActorContext.returnLabel,
        onBack: () => onReturnToActorContext?.(campaignSelectForActorContext),
      });
      return () => onBackOverrideChange(null);
    }

    if (libraryMode === 'detail') {
      onBackOverrideChange({
        label: '返回战役列表',
        onBack: () => setLibraryMode('existing'),
      });
      return () => onBackOverrideChange(null);
    }

    if (libraryMode === 'existing' || libraryMode === 'add') {
      onBackOverrideChange({
        label: '返回主持战役',
        onBack: () => setLibraryMode('home'),
      });
      return () => onBackOverrideChange(null);
    }

    onBackOverrideChange(null);
    return () => onBackOverrideChange(null);
  }, [campaignSelectForActorContext, libraryMode, mode, onBackOverrideChange]);

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
  // M23.1: host workbench — entering a campaign is always as host here; the
  // player path now lives under 加入战役, so this no longer depends on the
  // host/player role toggle.
  const canEnterHostRuntime = Boolean(selectedCampaign && onEnterCampaignRuntime);

  const enterCampaignRuntimeAsHost = () => {
    if (!selectedCampaign || !onEnterCampaignRuntime) return;
    onEnterCampaignRuntime({
      campaignId: selectedCampaign.id,
      campaignTitle: selectedCampaign.title,
      campaignRoomCode: selectedCampaign.roomCode,
      systemId,
      selectedEntryRole: 'host',
      source: 'campaignEntry',
    });
  };

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
    const campaign = actions.createCampaign({
      systemId,
      title: t('campaignLibrary.create.defaultTitle'),
      description: t('campaignLibrary.create.defaultDescription'),
      status: 'draft',
    });
    openCampaignDetail(campaign);
    onCampaignCreated?.(campaign);
  };

  const handleSelectCampaignForActor = (campaign: LocalCampaign) => {
    if (!campaignSelectForActorContext || !onSelectCampaignForActor) return;
    if (campaign.lifecycleStatus !== 'active') return;
    setSelectedCampaignId(campaign.id);
    actions.setEntryDraftActor(campaign.id, systemId, campaignSelectForActorContext.actorId);
    actions.setEntryDraftRole(campaign.id, systemId, 'player');
    onSelectCampaignForActor(toCampaignInstanceSummary(campaign), campaignSelectForActorContext);
  };

  const startEditingCampaign = (campaign: LocalCampaign) => {
    if (editingCampaignId === campaign.id) {
      cancelEditingCampaign();
      return;
    }
    setExpandedMoreCampaignId(null);
    setEditingCampaignId(campaign.id);
    setCampaignEditDraft({
      title: campaign.title,
      description: campaign.description ?? '',
      status: campaign.status,
    });
  };

  const cancelEditingCampaign = () => {
    setEditingCampaignId(null);
    setCampaignEditDraft({
      title: '',
      description: '',
      status: 'draft',
    });
  };

  const saveEditingCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCampaignId || !campaignEditDraft.title.trim()) return;
    actions.updateCampaign(editingCampaignId, {
      title: campaignEditDraft.title,
      description: campaignEditDraft.description.trim() || undefined,
      status: campaignEditDraft.status,
    });
    cancelEditingCampaign();
  };

  const handleArchiveCampaign = (campaign: LocalCampaign) => {
    actions.archiveCampaign(campaign.id);
    setExpandedMoreCampaignId(null);
    setCampaignLifecycleFilter('archived');
    if (selectedCampaignId === campaign.id) {
      setLibraryMode('existing');
    }
  };

  const handleRestoreCampaign = (campaign: LocalCampaign) => {
    actions.restoreCampaign(campaign.id);
    setExpandedMoreCampaignId(null);
    setCampaignLifecycleFilter('active');
  };

  const handleMoveCampaignToTrash = (campaign: LocalCampaign) => {
    if (!window.confirm(t('campaignLibrary.actions.moveToTrashConfirm'))) return;
    actions.trashCampaign(campaign.id);
    setExpandedMoreCampaignId(null);
    if (selectedCampaignId === campaign.id) {
      setSelectedCampaignId(null);
      setLibraryMode('existing');
    }
    setCampaignLifecycleFilter('trashed');
  };

  const handleExportCampaignSnapshot = () => {
    downloadCampaignLibraryExportSnapshot();
  };

  const handlePreviewCampaignSnapshotImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setCampaignImportPreviewFileName(file.name);
    setCampaignImportPreview(null);
    setCampaignImportPreviewError('');
    setCampaignSafeAppendResult(null);
    setCampaignCopyAsNewResult(null);

    void file.text()
      .then((text) => {
        setCampaignImportPreview(parseCampaignImportPreview(text, allCampaigns));
      })
      .catch(() => {
        setCampaignImportPreviewError(t('campaignLibrary.importPreview.readError'));
      });
  };

  const handleSafeAppendCampaignImport = () => {
    if (!campaignSafeAppendPlan || campaignSafeAppendPlan.importableCampaigns.length === 0 || isImportingCampaigns) return;
    setIsImportingCampaigns(true);
    try {
      const result = applyCampaignSafeAppendImport(campaignSafeAppendPlan);
      setCampaignSafeAppendResult(result);
      setCampaignCopyAsNewResult(null);
      const importedCampaign = result.importedCampaigns.find((campaign) => campaign.systemId === systemId);
      if (importedCampaign) {
        openCampaignDetail(importedCampaign);
        onCampaignImported?.(importedCampaign);
      }
    } finally {
      setIsImportingCampaigns(false);
    }
  };

  const handleCopyCampaignConflictsAsNew = () => {
    if (!campaignCopyAsNewPlan || campaignCopyAsNewPlan.copyableCampaigns.length === 0 || isImportingCampaigns) return;
    setIsImportingCampaigns(true);
    try {
      const result = applyCampaignCopyAsNewImport(campaignCopyAsNewPlan);
      setCampaignCopyAsNewResult(result);
      setCampaignSafeAppendResult(null);
      const importedCampaign = result.copiedCampaigns.find((campaign) => campaign.systemId === systemId);
      if (importedCampaign) {
        openCampaignDetail(importedCampaign);
        onCampaignImported?.(importedCampaign);
      }
    } finally {
      setIsImportingCampaigns(false);
    }
  };

  const handleCopyCampaignRoomCode = (roomCode?: string) => {
    const code = roomCode?.trim();
    if (!code || typeof navigator === 'undefined' || !navigator.clipboard) return;
    void navigator.clipboard.writeText(code);
  };

  const showAddFlow = (mode === 'create' || libraryMode === 'add') && libraryMode !== 'detail';
  const showDetail = (mode === 'library' || mode === 'create') && libraryMode === 'detail';

  return (
    <section className={panelClassName ?? 'rounded-lg border p-5'}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={`text-xs font-bold uppercase tracking-[0.22em] ${theme.muted}`}>
            {showAddFlow ? t('campaignLibrary.create.eyebrow') : '战役中心'}
          </div>
          <h2 className={`mt-2 text-2xl font-bold ${theme.accent}`}>
            {showAddFlow ? t('campaignLibrary.create.title') : '主持战役'}
          </h2>
          <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${theme.muted}`}>
            {showAddFlow ? t('campaignLibrary.create.subtitle') : '创建、管理、准备并开启你主持的战役。新建 / 导入战役在此进行；加入他人的战役请使用「加入战役」。'}
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
            <h3 className={`text-lg font-bold ${theme.accent}`}>我主持的战役</h3>
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
            <h3 className={`text-lg font-bold ${theme.accent}`}>新建 / 导入战役</h3>
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
                    setExpandedMoreCampaignId(null);
                    setSelectedCampaignId(campaign.id);
                    setLibraryMode('detail');
                  }}
                  onActivate={() => {
                    actions.updateCampaign(campaign.id, { status: 'active' });
                    setExpandedMoreCampaignId(null);
                  }}
                  onArchive={() => handleArchiveCampaign(campaign)}
                  onRestore={() => handleRestoreCampaign(campaign)}
                  onMoveToTrash={() => handleMoveCampaignToTrash(campaign)}
                  onStartEdit={() => startEditingCampaign(campaign)}
                  onCancelEdit={cancelEditingCampaign}
                  onSubmitEdit={saveEditingCampaign}
                  onEditDraftChange={setCampaignEditDraft}
                  onCopyRoomCode={() => handleCopyCampaignRoomCode(campaign.roomCode)}
                  isMoreActionsExpanded={expandedMoreCampaignId === campaign.id}
                  onToggleMoreActions={() => {
                    setEditingCampaignId(null);
                    setExpandedMoreCampaignId((current) => (current === campaign.id ? null : campaign.id));
                  }}
                />
              </div>
            ))
          )}

          {!campaignSelectForActorContext && (
            <div className={`rounded-lg border px-3 py-2 text-xs ${theme.badge}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-bold ${theme.accent}`}>{t('campaignLibrary.export.title')}</span>
                <span className={`min-w-40 flex-1 leading-relaxed ${theme.muted}`}>
                  {t('campaignLibrary.export.note')}
                </span>
                <button
                  type="button"
                  onClick={handleExportCampaignSnapshot}
                  className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${theme.secondary}`}
                >
                  {t('campaignLibrary.export.action')}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2">
                <span className={`font-bold ${theme.accent}`}>{t('campaignLibrary.importPreview.title')}</span>
                <span className={`min-w-40 flex-1 leading-relaxed ${theme.muted}`}>
                  {t('campaignLibrary.importPreview.note')}
                </span>
                <label className={`inline-flex cursor-pointer border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${theme.secondary}`}>
                  <span>{t('campaignLibrary.importPreview.action')}</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={handlePreviewCampaignSnapshotImport}
                    className="sr-only"
                  />
                </label>
              </div>
              {(campaignImportPreview || campaignImportPreviewError || campaignImportPreviewFileName) && (
                <CampaignImportPreviewPanel
                  fileName={campaignImportPreviewFileName}
                  preview={campaignImportPreview}
                  safeAppendPlan={campaignSafeAppendPlan}
                  copyAsNewPlan={campaignCopyAsNewPlan}
                  safeAppendResult={campaignSafeAppendResult}
                  copyAsNewResult={campaignCopyAsNewResult}
                  isImporting={isImportingCampaigns}
                  error={campaignImportPreviewError}
                  theme={theme}
                  t={t}
                  onSafeAppend={handleSafeAppendCampaignImport}
                  onCopyAsNew={handleCopyCampaignConflictsAsNew}
                />
              )}
            </div>
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
            enterCampaignRuntimeAsHost={enterCampaignRuntimeAsHost}
            canEnterPlayerRuntime={canEnterPlayerRuntime}
            canEnterHostRuntime={canEnterHostRuntime}
            hostPrepItems={hostPrepItems}
            onHostLaunchRoom={selectedCampaign && onHostLaunchRoom ? () => onHostLaunchRoom(selectedCampaign) : undefined}
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
  onCopyRoomCode,
  isMoreActionsExpanded,
  onToggleMoreActions,
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
  onCopyRoomCode: () => void;
  isMoreActionsExpanded: boolean;
  onToggleMoreActions: () => void;
}) {
  const isEditing = Boolean(editDraft);
  const canManage = !canSelect;
  const hasMoreActions = canManage;
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
            aria-expanded={isEditing}
            onClick={onStartEdit}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t(isEditing ? 'campaignLibrary.actions.collapseEdit' : 'campaignLibrary.actions.edit')}
          </button>
        )}
        {campaign.roomCode && (
          <button
            type="button"
            onClick={onCopyRoomCode}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t('campaignLibrary.actions.copyRoomCode')}
          </button>
        )}
        {hasMoreActions && (
          <button
            type="button"
            aria-expanded={isMoreActionsExpanded}
            aria-label={t(isMoreActionsExpanded ? 'campaignLibrary.actions.moreCollapseLabel' : 'campaignLibrary.actions.moreExpandLabel')}
            onClick={onToggleMoreActions}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t(isMoreActionsExpanded ? 'campaignLibrary.actions.moreExpanded' : 'campaignLibrary.actions.moreCollapsed')}
          </button>
        )}
      </div>
      {hasMoreActions && isMoreActionsExpanded && (
        <div className={`mt-3 flex flex-col gap-2 rounded-lg border p-3 ${theme.card}`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
            {t('campaignLibrary.actions.lifecycleActions')}
          </div>
          <div className="flex flex-wrap gap-2">
            {campaign.lifecycleStatus === 'active' && campaign.status !== 'active' && (
              <button
                type="button"
                onClick={onActivate}
                className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
              >
                {t('campaignLibrary.actions.activate')}
              </button>
            )}
            {campaign.lifecycleStatus === 'active' && (
              <button
                type="button"
                onClick={onArchive}
                className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
              >
                {t('campaignLibrary.actions.archive')}
              </button>
            )}
            {campaign.lifecycleStatus !== 'active' && (
              <button
                type="button"
                onClick={onRestore}
                className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
              >
                {t('campaignLibrary.actions.restore')}
              </button>
            )}
            {campaign.lifecycleStatus !== 'trashed' && (
              <button
                type="button"
                onClick={onMoveToTrash}
                className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.danger}`}
              >
                {t('campaignLibrary.actions.moveToTrash')}
              </button>
            )}
          </div>
        </div>
      )}
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
              <div className="mt-1 flex flex-wrap gap-2">
                <input
                  value={campaign.roomCode ?? t('campaignLibrary.edit.generatedMissingRoomCode')}
                  readOnly
                  aria-readonly="true"
                  className="min-w-0 flex-1 border bg-transparent px-3 py-2 text-sm opacity-75"
                />
                {campaign.roomCode && (
                  <button
                    type="button"
                    onClick={onCopyRoomCode}
                    className={`border px-3 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
                  >
                    {t('campaignLibrary.actions.copyRoomCode')}
                  </button>
                )}
              </div>
              <span className={`mt-1 block text-[11px] font-normal leading-relaxed ${theme.muted}`}>
                {t('campaignLibrary.edit.roomCodeNote')}
              </span>
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

function CampaignImportPreviewPanel({
  fileName,
  preview,
  safeAppendPlan,
  copyAsNewPlan,
  safeAppendResult,
  copyAsNewResult,
  isImporting,
  error,
  theme,
  t,
  onSafeAppend,
  onCopyAsNew,
}: {
  fileName: string;
  preview: CampaignImportPreview | null;
  safeAppendPlan: ReturnType<typeof buildCampaignSafeAppendPlan> | null;
  copyAsNewPlan: ReturnType<typeof buildCampaignCopyAsNewPlan> | null;
  safeAppendResult: CampaignSafeAppendResult | null;
  copyAsNewResult: CampaignCopyAsNewResult | null;
  isImporting: boolean;
  error: string;
  theme: (typeof toneClasses)[CampaignLibraryTone];
  t: (key: string) => string;
  onSafeAppend: () => void;
  onCopyAsNew: () => void;
}) {
  const summary = preview?.summary;
  const canSafeAppend = Boolean(
    preview?.isRecognizedSnapshot &&
    safeAppendPlan &&
    safeAppendPlan.importableCampaigns.length > 0 &&
    !isImporting,
  );
  const canCopyAsNew = Boolean(
    preview?.isRecognizedSnapshot &&
    copyAsNewPlan &&
    copyAsNewPlan.copyableCampaigns.length > 0 &&
    !isImporting,
  );
  return (
    <div className={`mt-4 rounded-lg border p-4 text-xs ${theme.card}`}>
      <div className={`font-bold uppercase tracking-wider ${theme.accent}`}>
        {t('campaignLibrary.importPreview.resultTitle')}
      </div>
      {fileName && (
        <div className={`mt-2 ${theme.muted}`}>
          {t('campaignLibrary.importPreview.fileName')}：<span className="font-semibold">{fileName}</span>
        </div>
      )}
      <p className={`mt-2 leading-relaxed ${theme.muted}`}>
        {t('campaignLibrary.importPreview.dryRunNotice')}
      </p>
      {preview?.isRecognizedSnapshot && (
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <button
            type="button"
            disabled={!canSafeAppend}
            onClick={onSafeAppend}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
              canSafeAppend ? theme.primary : `cursor-default opacity-55 ${theme.secondary}`
            }`}
          >
            {t('campaignLibrary.importPreview.safeAppendAction')}
          </button>
          <p className={`max-w-2xl text-xs leading-relaxed ${theme.muted}`}>
            {t('campaignLibrary.importPreview.safeAppendNote')}
          </p>
          <button
            type="button"
            disabled={!canCopyAsNew}
            onClick={onCopyAsNew}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
              canCopyAsNew ? theme.primary : `cursor-default opacity-55 ${theme.secondary}`
            }`}
          >
            {t('campaignLibrary.importPreview.copyAsNewAction')}
          </button>
          <p className={`max-w-2xl text-xs leading-relaxed ${theme.muted}`}>
            {t('campaignLibrary.importPreview.copyAsNewNote')}
          </p>
        </div>
      )}
      {error && (
        <p className={`mt-3 rounded border p-3 leading-relaxed ${theme.danger}`}>
          {error}
        </p>
      )}
      {preview && (
        <>
          {!preview.isRecognizedSnapshot && preview.errors.length > 0 && (
            <div className={`mt-3 rounded border p-3 leading-relaxed ${theme.danger}`}>
              {preview.errors.map((message) => (
                <div key={message}>{message}</div>
              ))}
            </div>
          )}
          {summary && (
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['campaignLibrary.importPreview.metrics.total', summary.totalCampaigns],
                ['campaignLibrary.importPreview.metrics.valid', summary.validCampaigns],
                ['campaignLibrary.importPreview.metrics.invalid', summary.invalidCampaigns],
                ['campaignLibrary.importPreview.metrics.sameId', summary.sameIdExistingConflicts],
                ['campaignLibrary.importPreview.metrics.sameRoomCode', summary.sameRoomCodeExistingConflicts],
                ['campaignLibrary.importPreview.metrics.unsupportedMalformed', summary.unsupportedMalformedCount],
              ].map(([labelKey, value]) => (
                <div key={labelKey} className={`border p-2 ${theme.badge}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                    {t(String(labelKey))}
                  </div>
                  <div className="mt-1 text-lg font-bold">{value}</div>
                </div>
              ))}
            </div>
          )}
          {summary && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <PreviewCountGroup
                title={t('campaignLibrary.importPreview.systemCounts')}
                rows={[
                  ['DND', summary.systemCounts['dnd5e-2024']],
                  ['COC', summary.systemCounts.coc7e],
                  ['CP RED', summary.systemCounts['cp-red']],
                ]}
                theme={theme}
              />
              <PreviewCountGroup
                title={t('campaignLibrary.importPreview.lifecycleCounts')}
                rows={[
                  [t('campaignLibrary.status.active'), summary.lifecycleCounts.active],
                  [t('campaignLibrary.status.archived'), summary.lifecycleCounts.archived],
                  [t('campaignLibrary.status.trashed'), summary.lifecycleCounts.trashed],
                ]}
                theme={theme}
              />
            </div>
          )}
          {safeAppendResult && (
            <div className={`mt-3 rounded-lg border p-3 ${theme.badge}`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                {t('campaignLibrary.importPreview.safeAppendResultTitle')}
              </div>
              <p className={`mt-2 leading-relaxed ${theme.muted}`}>
                {t('campaignLibrary.importPreview.safeAppendResultNote')}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ['campaignLibrary.importPreview.resultMetrics.imported', safeAppendResult.importedCampaigns.length],
                  ['campaignLibrary.importPreview.resultMetrics.skippedSameId', safeAppendResult.skippedSameIdExistingCount],
                  ['campaignLibrary.importPreview.resultMetrics.skippedSameRoomCode', safeAppendResult.skippedSameRoomCodeExistingCount],
                  ['campaignLibrary.importPreview.resultMetrics.skippedInvalid', safeAppendResult.skippedInvalidCount],
                ].map(([labelKey, value]) => (
                  <div key={labelKey} className={`border p-2 ${theme.card}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                      {t(String(labelKey))}
                    </div>
                    <div className="mt-1 text-lg font-bold">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <PreviewCountGroup
                  title={t('campaignLibrary.importPreview.systemCounts')}
                  rows={[
                    ['DND', safeAppendResult.systemCounts['dnd5e-2024']],
                    ['COC', safeAppendResult.systemCounts.coc7e],
                    ['CP RED', safeAppendResult.systemCounts['cp-red']],
                  ]}
                  theme={theme}
                />
                <PreviewCountGroup
                  title={t('campaignLibrary.importPreview.lifecycleCounts')}
                  rows={[
                    [t('campaignLibrary.status.active'), safeAppendResult.lifecycleCounts.active],
                    [t('campaignLibrary.status.archived'), safeAppendResult.lifecycleCounts.archived],
                    [t('campaignLibrary.status.trashed'), safeAppendResult.lifecycleCounts.trashed],
                  ]}
                  theme={theme}
                />
              </div>
            </div>
          )}
          {copyAsNewResult && (
            <div className={`mt-3 rounded-lg border p-3 ${theme.badge}`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                {t('campaignLibrary.importPreview.copyAsNewResultTitle')}
              </div>
              <p className={`mt-2 leading-relaxed ${theme.muted}`}>
                {t('campaignLibrary.importPreview.copyAsNewResultNote')}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ['campaignLibrary.importPreview.resultMetrics.copiedAsNew', copyAsNewResult.copiedCampaigns.length],
                  ['campaignLibrary.importPreview.resultMetrics.skippedFailed', copyAsNewResult.skippedFailedCount],
                  ['campaignLibrary.importPreview.resultMetrics.skippedInvalid', copyAsNewResult.skippedInvalidCount],
                  ['campaignLibrary.importPreview.resultMetrics.skippedNoConflict', copyAsNewResult.skippedNoConflictCount],
                ].map(([labelKey, value]) => (
                  <div key={labelKey} className={`border p-2 ${theme.card}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                      {t(String(labelKey))}
                    </div>
                    <div className="mt-1 text-lg font-bold">{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <PreviewCountGroup
                  title={t('campaignLibrary.importPreview.systemCounts')}
                  rows={[
                    ['DND', copyAsNewResult.systemCounts['dnd5e-2024']],
                    ['COC', copyAsNewResult.systemCounts.coc7e],
                    ['CP RED', copyAsNewResult.systemCounts['cp-red']],
                  ]}
                  theme={theme}
                />
                <PreviewCountGroup
                  title={t('campaignLibrary.importPreview.lifecycleCounts')}
                  rows={[
                    [t('campaignLibrary.status.active'), copyAsNewResult.lifecycleCounts.active],
                    [t('campaignLibrary.status.archived'), copyAsNewResult.lifecycleCounts.archived],
                    [t('campaignLibrary.status.trashed'), copyAsNewResult.lifecycleCounts.trashed],
                  ]}
                  theme={theme}
                />
              </div>
              {copyAsNewResult.mappings.length > 0 && (
                <div className={`mt-3 border p-3 ${theme.card}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                    {t('campaignLibrary.importPreview.copyAsNewMappings')}
                  </div>
                  <ul className="mt-2 space-y-2">
                    {copyAsNewResult.mappings.map((mapping) => (
                      <li key={`${mapping.originalCampaignId}-${mapping.newCampaignId}`} className="leading-relaxed">
                        <span className="font-bold">{mapping.title}</span>
                        <span className={`block ${theme.muted}`}>
                          {mapping.originalCampaignId} → {mapping.newCampaignId}
                        </span>
                        <span className={`block ${theme.muted}`}>
                          {mapping.originalRoomCode} → {mapping.newRoomCode}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PreviewCountGroup({
  title,
  rows,
  theme,
}: {
  title: string;
  rows: Array<[string, number]>;
  theme: (typeof toneClasses)[CampaignLibraryTone];
}) {
  return (
    <div className={`border p-3 ${theme.badge}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>{title}</div>
      <dl className="mt-2 grid grid-cols-1 gap-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <dt>{label}</dt>
            <dd className="font-bold">{value}</dd>
          </div>
        ))}
      </dl>
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
  enterCampaignRuntimeAsHost,
  canEnterPlayerRuntime,
  canEnterHostRuntime,
  hostPrepItems,
  onHostLaunchRoom,
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
  enterCampaignRuntimeAsHost: () => void;
  canEnterPlayerRuntime: boolean;
  canEnterHostRuntime: boolean;
  hostPrepItems: string[];
  onHostLaunchRoom?: () => void;
}) {
  // M23.1: this is the HOST workbench detail. The player-prep path now lives under
  // 加入战役, so it is hidden here (kept in code for the player flow / types).
  const SHOW_PLAYER_PREP = false;
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

        {(effectiveSuggestedActor || hasStaleDraftActor) && (
          <div className={`mt-4 rounded-lg border p-3 text-xs leading-relaxed ${theme.badge}`}>
            <div className={`font-bold ${theme.accent}`}>
              {effectiveSuggestedActor
                ? `已带入角色：${effectiveSuggestedActor.actorName}`
                : '已带入一个角色上下文'}
            </div>
            <p className="mt-1 opacity-80">
              该角色来自角色库选择战役流程。当前主持战役详情仅保留主持人工作台；玩家入场请走“加入战役”。正式角色准入、安检与绑定将在 Character Clearance 阶段实现。
            </p>
            {hasStaleDraftActor && (
              <p className={`mt-2 ${theme.muted}`}>
                之前保存的预选角色已无法解析，请在后续准入流程中重新选择。
              </p>
            )}
          </div>
        )}
      </div>

      <div className={`rounded-lg border p-5 ${theme.card}`}>
        <h4 className={`text-lg font-bold ${theme.accent}`}>进入与开启</h4>
        <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
          开启局域网房间让玩家加入，或进入当前战役的运行界面。玩家加入请走「加入战役」。
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4">
          {SHOW_PLAYER_PREP && (
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
          )}

          <div className={`rounded-lg border p-4 ${theme.card}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
              {t('campaignLibrary.detail.entry.hostPath')}
            </div>
            <h5 className={`mt-1 text-base font-bold ${theme.accent}`}>
              {t('campaignLibrary.detail.hostPrep.title')}
            </h5>
            <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
              {t('campaignLibrary.detail.entry.hostActiveNote')}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* Primary CTA: launch a LAN Room Server room (NOT formal Runtime). */}
              {onHostLaunchRoom && (
                <button
                  type="button"
                  onClick={onHostLaunchRoom}
                  className={`border px-3 py-2 text-xs font-bold ${theme.primary}`}
                >
                  开启局域网房间
                </button>
              )}
              {/* Secondary CTA: enter the current campaign's run surface (local shell v0). */}
              <button
                type="button"
                onClick={enterCampaignRuntimeAsHost}
                disabled={!canEnterHostRuntime}
                className={`border px-3 py-2 text-xs font-bold ${
                  canEnterHostRuntime ? theme.secondary : `cursor-default opacity-65 ${theme.secondary}`
                }`}
              >
                进入战役
              </button>
            </div>
            <p className={`mt-2 text-[11px] leading-relaxed ${theme.muted}`}>
              进入战役：进入当前战役的运行界面（当前为本地运行壳，后续会与联机 Runtime 合流）。
            </p>
            {onHostLaunchRoom && (
              <p className={`mt-2 text-[11px] leading-relaxed ${theme.muted}`}>
                从当前战役创建一个 Room Server 房间（本地 / 局域网 v0），玩家可通过房间码加入。这不是进入正式 Runtime。
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className={`rounded-lg border p-5 ${theme.card}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className={`text-lg font-bold ${theme.accent}`}>{t('campaignLibrary.detail.hostPrep.title')}</h4>
              <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
                {t('campaignLibrary.detail.hostPrep.activeNote')}
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
