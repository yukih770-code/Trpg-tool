import type {
  CampaignActorAddReturnContext,
  CampaignActorSelectReturnContext,
  CampaignEntryRole,
  CampaignInstanceSummary,
  CampaignLibraryPurpose,
  CampaignRuntimeContext,
  CampaignSuggestedActor,
} from '../../lib/platform/campaignFlow';
import { createTranslator, readStoredLocale } from '../../i18n';
import { useEffect, useState } from 'react';
import { ContextBar } from './ContextBar';

type CampaignLibraryTone = 'dnd' | 'coc' | 'cp';
type CampaignLibraryMode = 'home' | 'existing' | 'detail';

type CampaignLibraryShellProps = {
  systemId: string;
  systemName: string;
  tone: CampaignLibraryTone;
  mode?: 'library' | 'create';
  initialMode?: CampaignLibraryMode;
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
}> = {
  dnd: {
    card: 'border-[#58180d]/25 bg-white/55',
    accent: 'text-[#58180d]',
    muted: 'text-[#58180d]/70',
    primary: 'border-[#58180d] bg-[#58180d] text-[#fdf6e3]',
    secondary: 'border-[#58180d]/35 text-[#58180d]/55',
    badge: 'border-[#58180d]/30 text-[#58180d]/70',
  },
  coc: {
    card: 'border-[#2f7f68]/35 bg-[#101816]/85',
    accent: 'text-[#5aa58f]',
    muted: 'text-[#8fb7aa]/75',
    primary: 'border-[#2f7f68] bg-[#2f7f68] text-[#06100d]',
    secondary: 'border-[#2f7f68]/40 text-[#8fb7aa]/60',
    badge: 'border-[#2f7f68]/40 text-[#8fb7aa]/70',
  },
  cp: {
    card: 'border-[#d8b954]/35 bg-[#0d0d0d]/85',
    accent: 'text-[#f5c518]',
    muted: 'text-[#d8b954]/75',
    primary: 'border-[#f5c518] bg-[#f5c518] text-[#0d0d0d]',
    secondary: 'border-[#d8b954]/40 text-[#d8b954]/60',
    badge: 'border-[#d8b954]/40 text-[#d8b954]/70',
  },
};

// AI-LANDMARK: A11_SYSTEM_WORKSPACE_ENTRY_SHELL_V1
// Campaign Library placeholder: exposes CampaignInstance mental model only.
// No room creation, room-code generation, multiplayer, backend, actor binding,
// PackageLibrary UI, or Workshop Builder behavior is implemented here.
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
  const [selectedEntryRole, setSelectedEntryRole] = useState<CampaignEntryRole>('playerCharacter');
  const theme = toneClasses[tone];
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
  const sampleCampaign: CampaignInstanceSummary = {
    campaignId: 'sample-grey-mist-a12f',
    systemId,
    title: t('campaignLibrary.sample.title'),
    roomCode: 'A12F',
    sourcePackageId: 'sample-grey-mist-package',
    lastPlayedAt: t('campaignLibrary.sample.lastPlayedAt'),
  };

  const createActions = [
    'campaignLibrary.create.standard',
    'campaignLibrary.create.quick',
    'campaignLibrary.create.importCampaign',
  ];
  const stats = [
    ['campaignLibrary.stats.total', '1'],
    ['campaignLibrary.stats.active', '1'],
    ['campaignLibrary.stats.hosted', '1'],
    ['campaignLibrary.stats.joined', '0'],
    ['campaignLibrary.stats.needsAttention', '0'],
    ['campaignLibrary.stats.recentPlayed', sampleCampaign.lastPlayedAt],
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
    setSelectedEntryRole('playerCharacter');
    onRequestSelectActorForCampaign?.({
      campaignId: sampleCampaign.campaignId,
      campaignTitle: sampleCampaign.title,
      campaignRoomCode: sampleCampaign.roomCode,
      source: 'campaignEntry',
      returnLabel: t('campaignLibrary.returnContext.returnButton'),
      returnTo: {
        view: 'campaignDetail',
        systemId,
        campaignId: sampleCampaign.campaignId,
      },
    });
  };

  const canEnterRuntime = Boolean(
    onEnterCampaignRuntime &&
    (selectedEntryRole === 'host' || effectiveSuggestedActor),
  );

  const enterCampaignRuntime = () => {
    if (!canEnterRuntime || !onEnterCampaignRuntime) return;

    onEnterCampaignRuntime({
      campaignId: sampleCampaign.campaignId,
      campaignTitle: sampleCampaign.title,
      campaignRoomCode: sampleCampaign.roomCode,
      systemId,
      selectedEntryRole,
      selectedActorId: selectedEntryRole === 'playerCharacter' ? effectiveSuggestedActor?.actorId : undefined,
      selectedActorName: selectedEntryRole === 'playerCharacter' ? effectiveSuggestedActor?.actorName : undefined,
      source: 'campaignEntry',
    });
  };

  return (
    <section className={panelClassName ?? 'rounded-lg border p-5'}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={`text-xs font-bold uppercase tracking-[0.22em] ${theme.muted}`}>
            {t(mode === 'create' ? 'campaignLibrary.create.eyebrow' : 'campaignLibrary.eyebrow')}
          </div>
          <h2 className={`mt-2 text-2xl font-bold ${theme.accent}`}>
            {t(mode === 'create' ? 'campaignLibrary.create.title' : 'campaignLibrary.title')}
          </h2>
          <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${theme.muted}`}>
            {t(mode === 'create' ? 'campaignLibrary.create.subtitle' : 'campaignLibrary.subtitle')}
          </p>
        </div>
        <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
          {systemName}
        </span>
      </div>

      {mode === 'create' && (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {createActions.map((key, index) => (
            <button
              key={key}
              type="button"
              disabled
              className={`min-h-28 cursor-default border p-4 text-left opacity-75 ${index === 0 ? theme.primary : theme.secondary}`}
            >
              <span className="block text-sm font-bold">{t(key)}</span>
              <span className="mt-2 block text-xs leading-relaxed opacity-75">
                {t('campaignLibrary.actions.placeholder')}
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
            onClick={onAddCampaign}
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

          <div className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                  {t('campaignLibrary.recent')}
                </div>
                <h3 className={`mt-1 text-xl font-bold ${theme.accent}`}>
                  {sampleCampaign.title} #{sampleCampaign.roomCode}
                </h3>
              </div>
              <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${theme.badge}`}>
                {t('campaignLibrary.status.sample')}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
              {[
                [t('campaignLibrary.fields.system'), systemName],
                [t('campaignLibrary.fields.identity'), t('campaignLibrary.sample.identity')],
                [t('campaignLibrary.fields.sourcePackage'), t('campaignLibrary.sample.sourcePackage')],
                [t('campaignLibrary.fields.lastPlayed'), sampleCampaign.lastPlayedAt],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className={`font-bold uppercase tracking-wider ${theme.muted}`}>{label}</dt>
                  <dd className="mt-1 break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {campaignSelectForActorContext && onSelectCampaignForActor ? (
                <button
                  type="button"
                  onClick={() => onSelectCampaignForActor(sampleCampaign, campaignSelectForActorContext)}
                  className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${theme.primary}`}
                >
                  {t('campaignLibrary.returnContext.selectCampaignButton')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setLibraryMode('detail')}
                className={`border px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                  campaignSelectForActorContext ? theme.secondary : theme.primary
                }`}
              >
                {t('campaignLibrary.actions.viewDetail')}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'library' && libraryMode === 'detail' && (
        <div className="mt-5 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setLibraryMode('existing')}
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
                  {sampleCampaign.title} #{sampleCampaign.roomCode}
                </h3>
                <p className={`mt-2 text-sm leading-relaxed ${theme.muted}`}>
                  {t('campaignLibrary.detail.subtitle')}
                </p>
              </div>
              <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${theme.badge}`}>
                {t('campaignLibrary.status.sample')}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
              {[
                [t('campaignLibrary.fields.system'), systemName],
                [t('campaignLibrary.detail.fields.roomCode'), sampleCampaign.roomCode ?? '-'],
                [t('campaignLibrary.fields.sourcePackage'), t('campaignLibrary.sample.sourcePackage')],
                [t('campaignLibrary.fields.lastPlayed'), sampleCampaign.lastPlayedAt],
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
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={requestSelectActorForCampaign}
                  className={`border px-3 py-2 text-xs font-bold ${theme.secondary}`}
                >
                  {t(effectiveSuggestedActor ? 'campaignLibrary.detail.playerPrep.changeActor' : 'campaignLibrary.detail.entry.selectOrAddActor')}
                </button>
                <button
                  type="button"
                  onClick={enterCampaignRuntime}
                  disabled={!canEnterRuntime}
                  className={`border px-3 py-2 text-xs font-bold ${
                    canEnterRuntime
                      ? theme.primary
                      : `cursor-default opacity-65 ${theme.secondary}`
                  }`}
                >
                  {t('campaignLibrary.detail.playerPrep.enterCampaign')}
                </button>
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
                  {t('campaignLibrary.detail.entry.hostEntryNote')}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEntryRole('host')}
                    className={`border px-3 py-2 text-xs font-bold ${
                      selectedEntryRole === 'host' ? theme.primary : theme.secondary
                    }`}
                  >
                    {t('campaignLibrary.detail.entry.enterAsHost')}
                  </button>
                  <button
                    type="button"
                    onClick={enterCampaignRuntime}
                    disabled={selectedEntryRole !== 'host'}
                    className={`border px-3 py-2 text-xs font-bold ${
                      selectedEntryRole === 'host'
                        ? theme.primary
                        : `cursor-default opacity-65 ${theme.secondary}`
                    }`}
                  >
                    {t('campaignLibrary.detail.playerPrep.enterCampaign')}
                  </button>
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
        </div>
      )}

      {mode === 'library' && (
        <p className={`mt-5 border-t pt-4 text-xs leading-relaxed ${theme.muted}`}>
          {t('campaignLibrary.shortConcept')}
        </p>
      )}
    </section>
  );
}
