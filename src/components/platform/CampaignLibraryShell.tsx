import type {
  CampaignActorAddReturnContext,
  CampaignActorSelectReturnContext,
  CampaignEntryRole,
  CampaignInstanceSummary,
  CampaignLibraryPurpose,
  CampaignRuntimeContext,
  CampaignSuggestedActor,
} from '../../lib/platform/campaignFlow';
import type { LocalCampaign, LocalCampaignSystemId, LocalCampaignStatus } from '../../lib/platform/campaignLocalStore';
import { useCampaignLocalStore } from '../../lib/platform/campaignLocalStore';
import { createTranslator, readStoredLocale } from '../../i18n';
import { useEffect, useMemo, useState } from 'react';
import { ContextBar } from './ContextBar';

type CampaignLibraryTone = 'dnd' | 'coc' | 'cp';
type CampaignLibraryMode = 'home' | 'existing' | 'detail' | 'add';

type CampaignLibraryShellProps = {
  systemId: LocalCampaignSystemId;
  systemName: string;
  tone: CampaignLibraryTone;
  mode?: 'library' | 'create';
  initialMode?: Exclude<CampaignLibraryMode, 'add'>;
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
  archived: 2,
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
  const theme = toneClasses[tone];

  const allCampaigns = useCampaignLocalStore((state) => state.campaigns);
  const createCampaign = useCampaignLocalStore((state) => state.createCampaign);
  const updateCampaign = useCampaignLocalStore((state) => state.updateCampaign);
  const archiveCampaign = useCampaignLocalStore((state) => state.archiveCampaign);
  const deleteCampaign = useCampaignLocalStore((state) => state.deleteCampaign);
  const getCampaignById = useCampaignLocalStore((state) => state.getCampaignById);

  const campaigns = useMemo(
    () =>
      allCampaigns
        .filter((campaign) => campaign.systemId === systemId)
        .sort((a, b) => {
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          if (statusDiff !== 0) return statusDiff;
          return b.updatedAt.localeCompare(a.updatedAt);
        }),
    [allCampaigns, systemId],
  );
  const activeCampaigns = campaigns.filter((campaign) => campaign.status !== 'archived');
  const draftCampaigns = campaigns.filter((campaign) => campaign.status === 'draft');
  const campaignSelectForActorContext =
    purpose.kind === 'selectForActor' ? purpose.context : null;
  const effectiveSuggestedActor =
    suggestedActor ??
    (campaignSelectForActorContext
      ? {
          actorId: campaignSelectForActorContext.actorId,
          actorName: campaignSelectForActorContext.actorName,
        }
      : null);
  const selectedCampaign =
    selectedCampaignId && getCampaignById(selectedCampaignId)?.systemId === systemId
      ? getCampaignById(selectedCampaignId)
      : campaigns[0];

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
      setLibraryMode('existing');
      return;
    }
    if (initialMode) setLibraryMode(initialMode);
  }, [initialMode, campaignSelectForActorContext?.actorId]);

  useEffect(() => {
    if (campaignSelectForActorContext || suggestedActor) {
      setSelectedEntryRole('playerCharacter');
    }
  }, [campaignSelectForActorContext?.actorId, suggestedActor?.actorId]);

  useEffect(() => {
    if (selectedCampaignId && !campaigns.some((campaign) => campaign.id === selectedCampaignId)) {
      setSelectedCampaignId(campaigns[0]?.id ?? null);
    }
  }, [campaigns, selectedCampaignId]);

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

  const requestSelectActorForCampaign = () => {
    if (!selectedCampaign) return;
    setSelectedEntryRole('playerCharacter');
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
    setSelectedCampaignId(campaign.id);
    onSelectCampaignForActor(toCampaignInstanceSummary(campaign), campaignSelectForActorContext);
  };

  const handleDeleteCampaign = (campaign: LocalCampaign) => {
    if (!window.confirm(t('campaignLibrary.actions.deleteConfirm'))) return;
    deleteCampaign(campaign.id);
    if (selectedCampaignId === campaign.id) {
      setSelectedCampaignId(null);
      setLibraryMode('existing');
    }
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
                disabled
                placeholder={t('campaignLibrary.existing.searchPlaceholder')}
                className="min-w-0 flex-1 border bg-transparent px-3 py-1.5 text-sm opacity-60"
              />
              <select disabled className="border bg-transparent px-3 py-1.5 text-xs opacity-60">
                <option>{t('campaignLibrary.existing.sortRecent')}</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                'campaignLibrary.existing.filterAll',
                'campaignLibrary.existing.filterActive',
                'campaignLibrary.existing.filterNeedsAttention',
              ].map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled
                  className={`border px-3 py-1 text-[11px] font-bold uppercase tracking-wider opacity-65 ${theme.badge}`}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>

          {campaigns.length === 0 ? (
            <EmptyCampaignState
              theme={theme}
              title={t('campaignLibrary.empty.title')}
              note={t('campaignLibrary.empty.note')}
              addLabel={t('campaignLibrary.actions.add')}
              onAdd={onAddCampaign ?? (() => setLibraryMode('add'))}
            />
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id}>
                <CampaignCard
                  campaign={campaign}
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
                  onArchive={() => archiveCampaign(campaign.id)}
                  onDelete={() => handleDeleteCampaign(campaign)}
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
            selectedEntryRole={selectedEntryRole}
            setSelectedEntryRole={setSelectedEntryRole}
            requestSelectActorForCampaign={requestSelectActorForCampaign}
            enterCampaignRuntime={enterCampaignRuntime}
            canEnterPlayerRuntime={canEnterPlayerRuntime}
            canEnterHostRuntime={canEnterHostRuntime}
            hostPrepItems={hostPrepItems}
            onBack={() => setLibraryMode('existing')}
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
  systemName,
  theme,
  t,
  canSelect,
  onSelect,
  onViewDetail,
  onActivate,
  onArchive,
  onDelete,
}: {
  campaign: LocalCampaign;
  systemName: string;
  theme: (typeof toneClasses)[CampaignLibraryTone];
  t: (key: string) => string;
  canSelect: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
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
          {t(`campaignLibrary.status.${campaign.status}`)}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t('campaignLibrary.fields.system'), systemName],
          [t('campaignLibrary.detail.fields.roomCode'), campaign.roomCode || '-'],
          [t('campaignLibrary.fields.status'), t(`campaignLibrary.status.${campaign.status}`)],
          [t('campaignLibrary.fields.updatedAt'), formatCampaignDate(campaign.updatedAt)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className={`font-bold uppercase tracking-wider ${theme.muted}`}>{label}</dt>
            <dd className="mt-1 break-words font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {canSelect && (
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
        {campaign.status !== 'active' && (
          <button
            type="button"
            onClick={onActivate}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t('campaignLibrary.actions.activate')}
          </button>
        )}
        {campaign.status !== 'archived' && (
          <button
            type="button"
            onClick={onArchive}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.secondary}`}
          >
            {t('campaignLibrary.actions.archive')}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.danger}`}
        >
          {t('campaignLibrary.actions.delete')}
        </button>
      </div>
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
  selectedEntryRole,
  setSelectedEntryRole,
  requestSelectActorForCampaign,
  enterCampaignRuntime,
  canEnterPlayerRuntime,
  canEnterHostRuntime,
  hostPrepItems,
  onBack,
}: {
  campaign: LocalCampaign;
  systemId: LocalCampaignSystemId;
  systemName: string;
  theme: (typeof toneClasses)[CampaignLibraryTone];
  t: (key: string) => string;
  effectiveSuggestedActor: CampaignSuggestedActor | null;
  selectedEntryRole: CampaignEntryRole;
  setSelectedEntryRole: (role: CampaignEntryRole) => void;
  requestSelectActorForCampaign: () => void;
  enterCampaignRuntime: () => void;
  canEnterPlayerRuntime: boolean;
  canEnterHostRuntime: boolean;
  hostPrepItems: string[];
  onBack: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        aria-label={t('campaignLibrary.detail.backToMine')}
        title={t('campaignLibrary.detail.backToMine')}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold ${theme.secondary}`}
      >
        ←
      </button>

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
            {t(`campaignLibrary.status.${campaign.status}`)}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
          {[
            [t('campaignLibrary.fields.system'), systemName],
            [t('campaignLibrary.detail.fields.roomCode'), campaign.roomCode ?? '-'],
            [t('campaignLibrary.fields.status'), t(`campaignLibrary.status.${campaign.status}`)],
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
                className={`border px-3 py-2 text-xs font-bold ${theme.secondary}`}
              >
                {t(
                  selectedEntryRole === 'host'
                    ? 'campaignLibrary.detail.playerPrep.switchToPlayer'
                    : effectiveSuggestedActor
                      ? 'campaignLibrary.detail.playerPrep.changeActor'
                      : 'campaignLibrary.detail.entry.selectOrAddActor',
                )}
              </button>
              {selectedEntryRole === 'playerCharacter' && (
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

function formatCampaignDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
