import { ArrowLeft } from 'lucide-react';
import type { CampaignRuntimeContext } from '../../lib/platform/campaignFlow';
import { createTranslator, readStoredLocale } from '../../i18n';

type CampaignRuntimeTone = 'dnd' | 'coc' | 'cp';

type CampaignRuntimeShellProps = {
  context: CampaignRuntimeContext;
  tone: CampaignRuntimeTone;
  onExitRuntime: () => void;
};

type RuntimeLogCategory = 'roll' | 'action' | 'system' | 'handout' | 'host';

type RuntimeLogEntry = {
  id: string;
  category: RuntimeLogCategory;
  scope: 'public' | 'host';
  titleKey: string;
  bodyKey: string;
  metaKey: string;
};

const toneClasses: Record<CampaignRuntimeTone, {
  wrapper: string;
  panel: string;
  card: string;
  accent: string;
  muted: string;
  border: string;
  badge: string;
  action: string;
}> = {
  dnd: {
    wrapper: 'bg-[#fdf6e3] text-[#2c1810]',
    panel: 'border-[#58180d]/25 bg-white/60',
    card: 'border-[#58180d]/20 bg-[#fff8e6]/70',
    accent: 'text-[#58180d]',
    muted: 'text-[#58180d]/70',
    border: 'border-[#58180d]/25',
    badge: 'border-[#58180d]/30 text-[#58180d]/75',
    action: 'border-[#58180d]/35 text-[#58180d]/55',
  },
  coc: {
    wrapper: 'bg-[#0f1413] text-[#d8efe6]',
    panel: 'border-[#2f7f68]/35 bg-[#101816]/90',
    card: 'border-[#2f7f68]/30 bg-black/20',
    accent: 'text-[#5aa58f]',
    muted: 'text-[#8fb7aa]/75',
    border: 'border-[#2f7f68]/35',
    badge: 'border-[#2f7f68]/40 text-[#8fb7aa]/80',
    action: 'border-[#2f7f68]/40 text-[#8fb7aa]/60',
  },
  cp: {
    wrapper: 'bg-[#080808] text-[#f5e8a3]',
    panel: 'border-[#d8b954]/35 bg-[#0d0d0d]/90',
    card: 'border-[#d8b954]/30 bg-black/30',
    accent: 'text-[#f5c518]',
    muted: 'text-[#d8b954]/75',
    border: 'border-[#d8b954]/35',
    badge: 'border-[#d8b954]/40 text-[#d8b954]/80',
    action: 'border-[#d8b954]/40 text-[#d8b954]/60',
  },
};

// AI-LANDMARK: CAMPAIGN_RUNTIME_SHELL_UI_V1
// Minimal CampaignRuntimeShell: UI shell only. No multiplayer, backend, map,
// handout, runtime log write, store write, permission system, or rule runtime.
export function CampaignRuntimeShell({
  context,
  tone,
  onExitRuntime,
}: CampaignRuntimeShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const theme = toneClasses[tone];
  const isHost = context.selectedEntryRole === 'host';
  const currentActor = context.selectedActorName ?? t('campaignRuntime.header.noActor');

  const participantItems = [
    ['campaignRuntime.participants.host', isHost ? t('campaignRuntime.status.current') : t('campaignRuntime.status.placeholder')],
    ['campaignRuntime.participants.playerCharacters', context.selectedActorName ?? t('campaignRuntime.status.placeholder')],
    ['campaignRuntime.participants.npc', t('campaignRuntime.status.placeholder')],
    ['campaignRuntime.participants.spectators', t('campaignRuntime.status.placeholder')],
    ['campaignRuntime.participants.onlineStatus', t('campaignRuntime.status.placeholder')],
  ];

  const mainStageItems = [
    'campaignRuntime.mainStage.scene',
    'campaignRuntime.mainStage.publicScene',
    'campaignRuntime.mainStage.map',
    'campaignRuntime.mainStage.script',
    'campaignRuntime.mainStage.combat',
    'campaignRuntime.mainStage.investigation',
  ];

  const publicSidePanelItems = [
    'campaignRuntime.sidePanel.actorSummary',
    'campaignRuntime.sidePanel.handout',
    'campaignRuntime.sidePanel.sceneInfo',
  ];

  const hostConsoleItems = [
      'campaignRuntime.host.npcManagement',
      'campaignRuntime.host.mapManagement',
      'campaignRuntime.host.handoutManagement',
      'campaignRuntime.host.packageEnablement',
      'campaignRuntime.host.playerManagement',
      'campaignRuntime.host.campaignSettings',
      'campaignRuntime.host.gmNotes',
  ];

  const playerPanelItems = [
      'campaignRuntime.player.ownActor',
      'campaignRuntime.player.publicScene',
      'campaignRuntime.player.publicHandout',
      'campaignRuntime.player.publicMap',
      'campaignRuntime.player.publicLog',
      'campaignRuntime.player.diceArea',
  ];

  const playerLockedHostItems = [
    'campaignRuntime.host.npcManagement',
    'campaignRuntime.host.handoutManagement',
    'campaignRuntime.host.packageEnablement',
    'campaignRuntime.host.campaignSettings',
  ];

  const hostActionDockItems = [
    'campaignRuntime.actions.rollDice',
    'campaignRuntime.actions.addScene',
    'campaignRuntime.actions.publishHandout',
    'campaignRuntime.actions.manageNpc',
    'campaignRuntime.actions.openMap',
    'campaignRuntime.actions.campaignSettings',
  ];

  const playerActionDockItems = [
    'campaignRuntime.actions.rollDice',
    'campaignRuntime.actions.openActorSheet',
    'campaignRuntime.actions.openMap',
    'campaignRuntime.actions.viewHandouts',
    'campaignRuntime.actions.viewPublicLog',
  ];

  const runtimeLogFilters = [
    { id: 'all', labelKey: 'campaignRuntime.log.filters.all' },
    { id: 'roll', labelKey: 'campaignRuntime.log.filters.roll' },
    { id: 'action', labelKey: 'campaignRuntime.log.filters.action' },
    { id: 'system', labelKey: 'campaignRuntime.log.filters.system' },
    { id: 'handout', labelKey: 'campaignRuntime.log.filters.handout' },
    { id: 'host', labelKey: 'campaignRuntime.log.filters.host', hostOnly: true },
  ];

  const runtimeLogEntries: RuntimeLogEntry[] = [
    {
      id: 'system-entry',
      category: 'system',
      scope: 'public',
      titleKey: 'campaignRuntime.log.entries.systemEntry.title',
      bodyKey: 'campaignRuntime.log.entries.systemEntry.body',
      metaKey: 'campaignRuntime.log.entries.systemEntry.meta',
    },
    {
      id: 'actor-ready',
      category: 'action',
      scope: 'public',
      titleKey: 'campaignRuntime.log.entries.actorReady.title',
      bodyKey: 'campaignRuntime.log.entries.actorReady.body',
      metaKey: 'campaignRuntime.log.entries.actorReady.meta',
    },
    {
      id: 'sample-roll',
      category: 'roll',
      scope: 'public',
      titleKey: 'campaignRuntime.log.entries.sampleRoll.title',
      bodyKey: 'campaignRuntime.log.entries.sampleRoll.body',
      metaKey: 'campaignRuntime.log.entries.sampleRoll.meta',
    },
    {
      id: 'host-prompt',
      category: 'host',
      scope: 'host',
      titleKey: 'campaignRuntime.log.entries.hostPrompt.title',
      bodyKey: 'campaignRuntime.log.entries.hostPrompt.body',
      metaKey: 'campaignRuntime.log.entries.hostPrompt.meta',
    },
    {
      id: 'handout-public',
      category: 'handout',
      scope: 'public',
      titleKey: 'campaignRuntime.log.entries.handoutPublic.title',
      bodyKey: 'campaignRuntime.log.entries.handoutPublic.body',
      metaKey: 'campaignRuntime.log.entries.handoutPublic.meta',
    },
  ];

  const visibleRuntimeLogFilters = runtimeLogFilters.filter((filter) => isHost || !filter.hostOnly);
  const visibleRuntimeLogEntries = runtimeLogEntries.filter((entry) => isHost || entry.scope === 'public');

  const renderPlaceholderList = (items: string[]) => (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((key) => (
        <button
          key={key}
          type="button"
          disabled
          className={`cursor-default border px-3 py-2 text-left text-xs font-bold opacity-70 ${theme.action}`}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );

  const renderRuntimeLogPanel = () => (
    <div className="mt-3 space-y-3">
      <div>
        <div className={`text-[11px] font-bold uppercase tracking-wider ${theme.muted}`}>
          {t('campaignRuntime.log.filterLabel')}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleRuntimeLogFilters.map((filter, index) => (
            <span
              key={filter.id}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                index === 0 ? `${theme.badge} opacity-100` : `${theme.action} opacity-70`
              }`}
            >
              {t(filter.labelKey)}
            </span>
          ))}
        </div>
      </div>

      <div className={`rounded-lg border p-3 text-xs leading-relaxed ${theme.card}`}>
        <div className={`font-bold ${theme.accent}`}>{t('campaignRuntime.log.shellTitle')}</div>
        <p className={`mt-1 ${theme.muted}`}>{t('campaignRuntime.log.shellNote')}</p>
      </div>

      <div className="space-y-2">
        {visibleRuntimeLogEntries.map((entry) => (
          <article key={entry.id} className={`rounded-lg border p-3 ${theme.card}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
                {t(`campaignRuntime.log.category.${entry.category}`)}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                {t(entry.metaKey)}
              </span>
            </div>
            <h4 className={`mt-2 text-sm font-bold ${theme.accent}`}>{t(entry.titleKey)}</h4>
            <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>{t(entry.bodyKey)}</p>
          </article>
        ))}
      </div>

      {!isHost ? (
        <div className={`rounded-lg border p-3 text-xs leading-relaxed ${theme.card}`}>
          <div className={`font-bold ${theme.accent}`}>{t('campaignRuntime.log.playerLockedTitle')}</div>
          <p className={`mt-1 ${theme.muted}`}>{t('campaignRuntime.log.playerLockedNote')}</p>
        </div>
      ) : null}
    </div>
  );

  return (
    <section className={`min-h-[calc(100vh-8rem)] rounded-lg border p-4 shadow-sm md:p-5 ${theme.wrapper} ${theme.border}`}>
      <header className={`rounded-lg border p-4 ${theme.panel}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={onExitRuntime}
              aria-label={t('campaignRuntime.header.backToCampaignDetail')}
              title={t('campaignRuntime.header.backToCampaignDetail')}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-transparent transition hover:opacity-80 ${theme.border} ${theme.accent}`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${theme.muted}`}>
                {t('campaignRuntime.eyebrow')}
              </div>
              <h2 className={`mt-1 break-words text-2xl font-bold ${theme.accent}`}>
                {context.campaignTitle}
                {context.campaignRoomCode ? ` #${context.campaignRoomCode}` : ''}
              </h2>
            </div>
          </div>
          <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
            {t('campaignRuntime.header.connectionPlaceholder')}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
          {[
            [t('campaignRuntime.header.system'), context.systemId],
            [t('campaignRuntime.header.roomCode'), context.campaignRoomCode ?? '-'],
            [t('campaignRuntime.header.role'), t(isHost ? 'campaignRuntime.role.host' : 'campaignRuntime.role.player')],
            [t('campaignRuntime.header.actor'), currentActor],
            [t('campaignRuntime.header.source'), t('campaignRuntime.header.sourceCampaignEntry')],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className={`font-bold uppercase tracking-wider ${theme.muted}`}>{label}</dt>
              <dd className="mt-1 break-words font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[14rem_minmax(0,1fr)_18rem]">
        <aside className={`rounded-lg border p-4 ${theme.panel}`}>
          <h3 className={`text-sm font-bold ${theme.accent}`}>{t('campaignRuntime.participants.title')}</h3>
          <div className="mt-3 flex flex-col gap-2">
            {participantItems.map(([labelKey, value]) => (
              <div key={labelKey} className={`rounded border p-2 text-xs ${theme.card}`}>
                <div className={`font-bold ${theme.muted}`}>{t(labelKey)}</div>
                <div className="mt-1 font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </aside>

        <main className={`rounded-lg border p-4 ${theme.panel}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={`text-lg font-bold ${theme.accent}`}>{t('campaignRuntime.mainStage.title')}</h3>
              <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
                {t('campaignRuntime.mainStage.note')}
              </p>
            </div>
            <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
              {t('campaignRuntime.status.shellOnly')}
            </span>
          </div>
          <div className={`mt-4 min-h-64 rounded-lg border p-4 ${theme.card}`}>
            {renderPlaceholderList(mainStageItems)}
          </div>
        </main>

        <aside className={`rounded-lg border p-4 ${theme.panel}`}>
          <h3 className={`text-sm font-bold ${theme.accent}`}>
            {t(isHost ? 'campaignRuntime.host.title' : 'campaignRuntime.player.title')}
          </h3>
          <p className={`mt-2 text-xs leading-relaxed ${theme.muted}`}>
            {t(isHost ? 'campaignRuntime.host.note' : 'campaignRuntime.player.note')}
          </p>

          {isHost ? (
            <div className="mt-4 space-y-4">
              <section>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${theme.muted}`}>
                  {t('campaignRuntime.host.consoleTitle')}
                </h4>
                <div className="mt-2">{renderPlaceholderList(hostConsoleItems)}</div>
              </section>
              <section>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${theme.muted}`}>
                  {t('campaignRuntime.sidePanel.publicInfo')}
                </h4>
                <div className="mt-2">{renderPlaceholderList(publicSidePanelItems)}</div>
              </section>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <section>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${theme.muted}`}>
                  {t('campaignRuntime.player.publicViewTitle')}
                </h4>
                <div className="mt-2">{renderPlaceholderList(playerPanelItems)}</div>
              </section>
              <section className={`rounded border p-3 ${theme.card}`}>
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${theme.muted}`}>
                  {t('campaignRuntime.host.lockedHostTools')}
                </h4>
                <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
                  {t('campaignRuntime.player.hostToolsLockedNote')}
                </p>
                <div className="mt-2">{renderPlaceholderList(playerLockedHostItems)}</div>
              </section>
            </div>
          )}
        </aside>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={`rounded-lg border p-4 ${theme.panel}`}>
          <h3 className={`text-sm font-bold ${theme.accent}`}>{t('campaignRuntime.log.title')}</h3>
          <p className={`mt-1 text-xs ${theme.muted}`}>{t('campaignRuntime.log.note')}</p>
          {renderRuntimeLogPanel()}
        </section>

        <section className={`rounded-lg border p-4 ${theme.panel}`}>
          <h3 className={`text-sm font-bold ${theme.accent}`}>{t('campaignRuntime.actions.title')}</h3>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            {t(isHost ? 'campaignRuntime.actions.hostNote' : 'campaignRuntime.actions.playerNote')}
          </p>
          <div className="mt-3">{renderPlaceholderList(isHost ? hostActionDockItems : playerActionDockItems)}</div>
        </section>
      </div>
    </section>
  );
}
