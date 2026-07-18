import { useEffect, useMemo, useState } from 'react';
import type { CampaignRuntimeContext } from '../../lib/platform/campaignFlow';
import type { LocalCampaignSystemId } from '../../lib/platform/campaignLocalStore';
import type {
  RuntimeLogEventType,
} from '../../lib/platform/runtimeLogLocalStore';
import { useRuntimeLogLocalStore } from '../../lib/platform/runtimeLogLocalStore';
import { useRuntimeLogEventsForCampaign } from '../../lib/platform/runtimeLogRepository';
import { createTranslator, readStoredLocale } from '../../i18n';
import { DndRuntimeCombatDevPanel } from './DndRuntimeCombatDevPanel';
import { RuntimeSlotShell } from './RuntimeSlotShell';
import { RuntimeFullscreenShell, type RuntimeShellMode } from './RuntimeFullscreenShell';
import { SharedDiceDock } from './SharedDiceDock';
import { RuntimeActionDock, buildRuntimeDockActions } from './RuntimeActionDock';
import { RuntimePublicInfoPanel, type RuntimePublicInfoItem } from './RuntimePublicInfoPanel';
import { RuntimeManualStateLogPanel, type RuntimeStateLogItem } from './RuntimeManualStateLogPanel';
import { RuntimeCharacterSheetPanel } from './RuntimeCharacterSheetPanel';
import { RuntimeMapStage } from './RuntimeMapStage';
import { BasicMapBoard } from './BasicMapBoard';
import { RuntimeSceneBoardPanel, type RuntimeSceneBoardDice } from './RuntimeSceneBoardPanel';
import { RuntimeSceneFocusPanel, type RuntimeSceneFocus } from './RuntimeSceneFocusPanel';
import { resolveRuntimeActorSnapshot } from './runtimeActorSnapshotSource';
import { buildRuntimeCharacterSummary } from './runtimeActorSnapshotAdapter';
import { buildRuntimeInventorySummary } from './runtimeInventoryAdapter';
import { RuntimeMultiplayerTogglePanel } from './RuntimeMultiplayerTogglePanel';
import { describeRuntimeMode } from './runtimeModeContract';
import { CharacterClearanceSummary } from './CharacterClearanceSummary';
import { rollSharedDiceExpression, formatSharedDiceRoll } from '../../lib/platform/sharedDiceExpression';
import type { RoomLaunchActionState } from '../../lib/platform/hostedRoomLaunch';
import type { MapRuntimeEventDraft } from '../../lib/map/mapRuntimeTypes';
import type { MapRuntimeReplayEvent } from '../../lib/map/mapRuntimeReplay';

// Dev-only: the Runtime Layout Shell Preview (RuntimeSlotShell + DND combat dev
// panel) is hidden from normal Runtime; flip to true only for layout debugging.
const SHOW_RUNTIME_LAYOUT_DEV_PREVIEW = false;

/** Unbiased in-browser RNG in [1, sides] (crypto if available; Math.random fallback). */
function browserDiceRng(sides: number): number {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const limit = Math.floor(0x100000000 / sides) * sides;
    const buf = new Uint32Array(1);
    let x = 0;
    do {
      c.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return (x % sides) + 1;
  }
  return Math.floor(Math.random() * sides) + 1;
}

type CampaignRuntimeTone = 'dnd' | 'coc' | 'cp';

type CampaignRuntimeShellProps = {
  context: CampaignRuntimeContext;
  tone: CampaignRuntimeTone;
  onExitRuntime: () => void;
  onHostLaunchRoom?: (context: CampaignRuntimeContext) => void;
  roomLaunchState?: RoomLaunchActionState;
  roomLaunchError?: string | null;
};

type RuntimeLogCategory = 'roll' | 'action' | 'system' | 'handout' | 'host';
type ManualStateChangeEventType = Extract<
  RuntimeLogEventType,
  | 'actor.hpChanged'
  | 'actor.resourceChanged'
  | 'actor.sanChanged'
  | 'actor.humanityChanged'
  | 'actor.note'
>;

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
// Minimal CampaignRuntimeShell: local RuntimeLog read/append plus optional
// parent-owned hosted-room launch. No replay/promotion, map token, permission
// system, or rule runtime.
export function CampaignRuntimeShell({
  context,
  tone,
  onExitRuntime,
  onHostLaunchRoom,
  roomLaunchState,
  roomLaunchError,
}: CampaignRuntimeShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const [systemNoteDraft, setSystemNoteDraft] = useState('');
  const [manualStateType, setManualStateType] = useState<ManualStateChangeEventType>('actor.hpChanged');
  const [manualStateActorId, setManualStateActorId] = useState(context.selectedActorId ?? '');
  const [manualStateLabel, setManualStateLabel] = useState('');
  const [manualStateNote, setManualStateNote] = useState('');
  const theme = toneClasses[tone];
  const isHost = context.selectedEntryRole === 'host';
  const shellMode: RuntimeShellMode = isHost ? 'host' : 'player';
  const currentActor = context.selectedActorName ?? t('campaignRuntime.header.noActor');
  const runtimeSystemId = toLocalCampaignSystemId(context.systemId);
  const appendRuntimeLogEvent = useRuntimeLogLocalStore((state) => state.appendRuntimeLogEvent);
  const runtimeLogEvents = useRuntimeLogEventsForCampaign(context.campaignId);
  // Local DND map interaction is deliberately session-local. It gives the
  // single-table path the same ruler and preset terrain tools without claiming
  // room sync or durable campaign map storage.
  const localMapId = `local:${context.campaignId}`;
  const [localMapEvents, setLocalMapEvents] = useState<MapRuntimeReplayEvent[]>([]);
  const appendLocalMapEvent = async (event: MapRuntimeEventDraft) => {
    setLocalMapEvents((previous) => [
      ...previous,
      {
        eventKind: event.eventKind,
        payload: event.payload,
        seq: previous.length === 0 ? 1 : (previous[previous.length - 1].seq ?? previous.length) + 1,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

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

  // M25.1a: the old per-role dock item arrays were replaced by the unified
  // RuntimeActionDock. M25.1b: the heavy Inspector placeholder lists (host console /
  // side panel / player panel / locked host tools) were removed in favor of a light
  // role summary; their tool semantics now live in the role-scoped action dock.

  const runtimeLogFilters = [
    { id: 'all', labelKey: 'campaignRuntime.log.filters.all' },
    { id: 'roll', labelKey: 'campaignRuntime.log.filters.roll' },
    { id: 'action', labelKey: 'campaignRuntime.log.filters.action' },
    { id: 'system', labelKey: 'campaignRuntime.log.filters.system' },
    { id: 'handout', labelKey: 'campaignRuntime.log.filters.handout' },
    { id: 'host', labelKey: 'campaignRuntime.log.filters.host', hostOnly: true },
  ];

  const visibleRuntimeLogFilters = runtimeLogFilters.filter((filter) => isHost || !filter.hostOnly);
  const manualStateChangeOptions = useMemo(
    () => getManualStateChangeOptions(runtimeSystemId),
    [runtimeSystemId],
  );

  useEffect(() => {
    if (!manualStateChangeOptions.some((option) => option.type === manualStateType)) {
      setManualStateType(manualStateChangeOptions[0]?.type ?? 'actor.note');
    }
  }, [manualStateChangeOptions, manualStateType]);

  useEffect(() => {
    setManualStateActorId(context.selectedActorId ?? '');
  }, [context.selectedActorId]);

  const handleAppendSystemNote = () => {
    const message = systemNoteDraft.trim();
    if (!isHost || !runtimeSystemId || !message) return;
    appendRuntimeLogEvent({
      campaignId: context.campaignId,
      systemId: runtimeSystemId,
      type: 'system.note',
      message,
    });
    setSystemNoteDraft('');
  };

  const handleAppendManualStateChange = () => {
    const label = manualStateLabel.trim();
    const note = manualStateNote.trim();
    if (!isHost || !runtimeSystemId || (!label && !note)) return;
    appendRuntimeLogEvent({
      campaignId: context.campaignId,
      actorId: manualStateActorId.trim() || undefined,
      systemId: runtimeSystemId,
      type: manualStateType,
      message: [label, note].filter(Boolean).join(' - '),
      payload: {
        label: label || undefined,
        note: note || undefined,
      },
    });
    setManualStateLabel('');
    setManualStateNote('');
  };

  // ── Public info / manual state records (M29, local authority) ──────────────
  // Local Runtime writes the LOCAL RuntimeLog through the existing local store:
  // public info = system.note + payload.noteKind 'publicInfo' (no local schema
  // change); dock-recorded state changes = actor.note + payload.noteKind
  // 'manualState'. The existing detailed forms in the log panel are unchanged.
  const handleLocalPublishPublicInfo = (input: { title?: string; body: string }) => {
    if (!isHost || !runtimeSystemId) return;
    appendRuntimeLogEvent({
      campaignId: context.campaignId,
      systemId: runtimeSystemId,
      type: 'system.note',
      message: input.title ? `【${input.title}】${input.body}` : input.body,
      payload: { noteKind: 'publicInfo', title: input.title, body: input.body },
    });
  };

  const handleLocalRecordStateChange = (input: { targetName?: string; body: string }) => {
    if (!isHost || !runtimeSystemId) return;
    appendRuntimeLogEvent({
      campaignId: context.campaignId,
      systemId: runtimeSystemId,
      type: 'actor.note',
      message: input.targetName ? `${input.targetName}：${input.body}` : input.body,
      payload: { noteKind: 'manualState', targetName: input.targetName, body: input.body },
    });
  };

  const activeEvents = runtimeLogEvents.filter((e) => e.lifecycleStatus !== 'tombstoned');

  const publicInfoItems: RuntimePublicInfoItem[] = activeEvents
    .filter((e) => e.type === 'system.note' && (e.payload as { noteKind?: string } | undefined)?.noteKind === 'publicInfo')
    .map((e) => {
      const p = (e.payload ?? {}) as { title?: string; body?: string };
      return { id: e.id, title: p.title, body: p.body ?? e.message, createdAt: e.createdAt, authorLabel: '主持人' };
    });

  const stateLogItems: RuntimeStateLogItem[] = activeEvents
    .filter((e) => {
      const noteKind = (e.payload as { noteKind?: string } | undefined)?.noteKind;
      if (noteKind === 'manualState') return true;
      return (
        e.type === 'actor.hpChanged' ||
        e.type === 'actor.resourceChanged' ||
        e.type === 'actor.sanChanged' ||
        e.type === 'actor.humanityChanged'
      );
    })
    .map((e) => {
      const p = (e.payload ?? {}) as { targetName?: string; body?: string };
      return { id: e.id, targetName: p.targetName, body: p.body ?? e.message, createdAt: e.createdAt };
    });

  // ── M65B/M66 local actor context + read-only character sheet ───────────────
  // Local Runtime is a real Runtime: derive an actorRef from the campaign entry
  // selection and reuse the SAME (mode-agnostic) resolver + adapters + sheet as
  // the room bridge. No store writes, no character edits.
  const localActorRef = context.selectedActorId || context.selectedActorName
    ? { actorId: context.selectedActorId, displayName: context.selectedActorName, systemId: context.systemId }
    : undefined;
  const hasLocalActor = !!localActorRef;
  const snapshotResult = resolveRuntimeActorSnapshot({
    systemId: context.systemId,
    actorId: context.selectedActorId,
    displayName: context.selectedActorName,
  });
  const characterSummary = buildRuntimeCharacterSummary({
    actorRef: localActorRef,
    snapshot: snapshotResult.snapshot,
    playerLabel: context.selectedActorName ?? (isHost ? '主持人' : '玩家'),
    fallbackSystemId: context.systemId,
    sourceLabel: snapshotResult.sourceKind === 'characterVault' ? snapshotResult.sourceLabel : undefined,
    extraWarnings: snapshotResult.warnings,
    matchConfidence: snapshotResult.matchConfidence,
  });
  const inventorySummary = buildRuntimeInventorySummary({ snapshot: snapshotResult.snapshot, systemId: context.systemId });

  // ── M67 local scene focus (local RuntimeLog, no server) ────────────────────
  const handleLocalSetScene = (input: { title?: string; body: string; mapUrl?: string }) => {
    if (!isHost || !runtimeSystemId) return;
    appendRuntimeLogEvent({
      campaignId: context.campaignId,
      systemId: runtimeSystemId,
      type: 'system.note',
      message: input.title ? `【场景】${input.title}` : `【场景】${input.body}`,
      payload: { noteKind: 'sceneFocus', title: input.title, body: input.body, mapUrl: input.mapUrl },
    });
  };
  const sceneEvents = activeEvents.filter(
    (e) => e.type === 'system.note' && (e.payload as { noteKind?: string } | undefined)?.noteKind === 'sceneFocus',
  );
  const latestSceneEvent = sceneEvents.length > 0 ? sceneEvents[sceneEvents.length - 1] : undefined;
  const currentScene: RuntimeSceneFocus | null = latestSceneEvent
    ? (() => {
        const p = (latestSceneEvent.payload ?? {}) as { title?: string; body?: string; mapUrl?: string };
        return { title: p.title, body: p.body ?? latestSceneEvent.message, mapUrl: p.mapUrl, createdAt: latestSceneEvent.createdAt };
      })()
    : null;

  // Recent dice for the local Scene Board (from local roll.performed events).
  const recentDice: RuntimeSceneBoardDice[] = activeEvents
    .filter((e) => e.type === 'roll.performed')
    .map((e): RuntimeSceneBoardDice | null => {
      const p = (e.payload ?? {}) as { normalizedExpression?: unknown; total?: unknown; label?: unknown };
      return typeof p.normalizedExpression === 'string' && typeof p.total === 'number'
        ? { id: e.id, label: typeof p.label === 'string' ? p.label : undefined, expression: p.normalizedExpression, total: p.total, createdAt: e.createdAt }
        : null;
    })
    .filter((x): x is RuntimeSceneBoardDice => x !== null);

  const actorPanelNode = (
    <RuntimeCharacterSheetPanel summary={characterSummary} inventory={inventorySummary} role={isHost ? 'host' : 'player'} />
  );

  // M69–M72 local runtime mode descriptor + settings/multiplayer-readiness panel.
  const runtimeModeDescriptor = describeRuntimeMode({ isHost, hasActor: hasLocalActor, hasServer: false });
  // M73 compact clearance summary for in-runtime settings (local = no room approval).
  const clearanceCompactNode = (
    <CharacterClearanceSummary
      variant="compact"
      actorName={characterSummary?.displayName ?? context.selectedActorName}
      sourceLabel={characterSummary?.dataSourceLabel}
      needsRecheck={characterSummary?.matchConfidence === 'low'}
      local
    />
  );
  const multiplayerPanelNode = (
    <RuntimeMultiplayerTogglePanel
      descriptor={runtimeModeDescriptor}
      actorSourceLabel={characterSummary?.dataSourceLabel}
      clearanceSummary={clearanceCompactNode}
      onCreateHostedRoom={isHost && onHostLaunchRoom ? () => onHostLaunchRoom(context) : undefined}
      launchState={roomLaunchState}
      launchError={roomLaunchError}
    />
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
        <div className={`font-bold ${theme.accent}`}>{t('campaignRuntime.log.localTitle')}</div>
        <p className={`mt-1 ${theme.muted}`}>{t('campaignRuntime.log.localNote')}</p>
      </div>

      {isHost ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <form
            className={`rounded-lg border p-3 ${theme.card}`}
            onSubmit={(event) => {
              event.preventDefault();
              handleAppendSystemNote();
            }}
          >
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${theme.muted}`}>
              {t('campaignRuntime.log.addSystemNote')}
            </label>
            <textarea
              value={systemNoteDraft}
              onChange={(event) => setSystemNoteDraft(event.target.value)}
              placeholder={t('campaignRuntime.log.systemNotePlaceholder')}
              rows={3}
              className={`mt-2 w-full resize-y rounded border bg-transparent px-3 py-2 text-xs outline-none ${theme.border}`}
            />
            <button
              type="submit"
              disabled={!runtimeSystemId || !systemNoteDraft.trim()}
              className={`mt-2 border px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                runtimeSystemId && systemNoteDraft.trim()
                  ? theme.badge
                  : `cursor-default opacity-55 ${theme.action}`
              }`}
            >
              {t('campaignRuntime.log.appendSystemNote')}
            </button>
            <p className={`mt-2 text-[11px] leading-relaxed ${theme.muted}`}>
              {t('campaignRuntime.log.systemNoteScope')}
            </p>
          </form>

          <form
            className={`rounded-lg border p-3 ${theme.card}`}
            onSubmit={(event) => {
              event.preventDefault();
              handleAppendManualStateChange();
            }}
          >
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${theme.muted}`}>
              {t('campaignRuntime.log.manualState.title')}
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={manualStateType}
                onChange={(event) => setManualStateType(event.target.value as ManualStateChangeEventType)}
                className={`rounded border bg-transparent px-3 py-2 text-xs outline-none ${theme.border}`}
              >
                {manualStateChangeOptions.map((option) => (
                  <option key={option.type} value={option.type}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
              <input
                value={manualStateActorId}
                onChange={(event) => setManualStateActorId(event.target.value)}
                placeholder={t('campaignRuntime.log.manualState.actorPlaceholder')}
                className={`rounded border bg-transparent px-3 py-2 text-xs outline-none ${theme.border}`}
              />
            </div>
            <input
              value={manualStateLabel}
              onChange={(event) => setManualStateLabel(event.target.value)}
              placeholder={t(manualStateLabelPlaceholderKey(runtimeSystemId))}
              className={`mt-2 w-full rounded border bg-transparent px-3 py-2 text-xs outline-none ${theme.border}`}
            />
            <textarea
              value={manualStateNote}
              onChange={(event) => setManualStateNote(event.target.value)}
              placeholder={t('campaignRuntime.log.manualState.notePlaceholder')}
              rows={3}
              className={`mt-2 w-full resize-y rounded border bg-transparent px-3 py-2 text-xs outline-none ${theme.border}`}
            />
            <button
              type="submit"
              disabled={!runtimeSystemId || (!manualStateLabel.trim() && !manualStateNote.trim())}
              className={`mt-2 border px-3 py-2 text-xs font-bold uppercase tracking-wider ${
                runtimeSystemId && (manualStateLabel.trim() || manualStateNote.trim())
                  ? theme.badge
                  : `cursor-default opacity-55 ${theme.action}`
              }`}
            >
              {t('campaignRuntime.log.manualState.append')}
            </button>
            <p className={`mt-2 text-[11px] leading-relaxed ${theme.muted}`}>
              {t('campaignRuntime.log.manualState.scope')}
            </p>
          </form>
        </div>
      ) : null}

      <div className="space-y-2">
        {runtimeLogEvents.length === 0 ? (
          <div className={`rounded-lg border p-3 text-xs leading-relaxed ${theme.card}`}>
            <div className={`font-bold ${theme.accent}`}>{t('campaignRuntime.log.emptyTitle')}</div>
            <p className={`mt-1 ${theme.muted}`}>{t('campaignRuntime.log.emptyNote')}</p>
          </div>
        ) : runtimeLogEvents.map((entry) => (
          <article key={entry.id} className={`rounded-lg border p-3 ${theme.card}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
                {t(`campaignRuntime.log.category.${runtimeLogCategoryForEvent(entry.type)}`)}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                {formatRuntimeLogTimestamp(entry.createdAt)}
              </span>
            </div>
            <h4 className={`mt-2 text-sm font-bold ${theme.accent}`}>
              {t(runtimeLogEventTypeLabelKey(entry.type))}
            </h4>
            <p className={`mt-1 whitespace-pre-wrap text-xs leading-relaxed ${theme.muted}`}>
              {entry.message}
            </p>
            {entry.actorId ? (
              <p className={`mt-2 text-[11px] ${theme.muted}`}>
                {t('campaignRuntime.log.actorId')}：{entry.actorId}
              </p>
            ) : null}
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

  const actorRail = (
    <div className="space-y-2">
      <div className={`rounded border p-2 ${theme.card}`}>
        <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>{t('campaignRuntime.header.actor')}</div>
        <div className={`mt-0.5 text-sm font-bold ${theme.accent}`}>{currentActor}</div>
      </div>
      {participantItems.map(([labelKey, value]) => (
        <div key={labelKey} className={`rounded border p-2 text-xs ${theme.card}`}>
          <div className={`font-bold ${theme.muted}`}>{t(labelKey)}</div>
          <div className="mt-1 font-semibold">{value}</div>
        </div>
      ))}
    </div>
  );

  // DND local Runtime uses the interactive board; COC/CP keep the shared static
  // scene stage until their system-specific map interaction contracts exist.
  const mainStage = context.systemId === 'dnd5e-2024' ? (
    <BasicMapBoard
      locale={readStoredLocale()}
      mapId={localMapId}
      mapEvents={localMapEvents}
      fallbackBackgroundUrl={currentScene?.mapUrl}
      sceneTitle={currentScene?.title}
      sceneDescription={currentScene?.body}
      statusNote="本地地图仅在当前运行页面保留；开启联机房间后可使用实时地图同步。"
      canManage={isHost}
      onAppendEvent={appendLocalMapEvent}
    />
  ) : (
    <RuntimeMapStage scene={currentScene} role={shellMode} />
  );

  const summaryRow = (k: string, v: string) => (
    <div className={`rounded border p-2 ${theme.card}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>{k}</div>
      <div className="mt-0.5 font-semibold">{v}</div>
    </div>
  );

  // M68 local-mode indicator — a calm "local runtime" note, NOT an error/missing state.
  const modeNote = (
    <div className="rounded border border-slate-300/50 bg-white/70 px-2 py-1.5 text-[10px] leading-relaxed text-slate-600">
      <span className="font-bold text-slate-700">本地运行中 · 未开启多人同步。</span>{' '}
      本地 Runtime 也是完整 Runtime；联机只是可选的同步层。当前角色卡来自本地角色库，状态记录不会自动修改角色卡。
    </div>
  );

  // M67 shared Scene Board overlay (local data): current scene + recent activity.
  const sceneBoardNode = (
    <RuntimeSceneBoardPanel
      scene={currentScene}
      publicInfo={publicInfoItems}
      stateLog={stateLogItems}
      recentDice={recentDice}
      role={shellMode}
      meta={{ roomCode: context.campaignRoomCode, systemId: context.systemId }}
    />
  );

  // M25.1b: light role summary — no big placeholder lists / dev preview by default.
  const inspector = isHost ? (
    <div className="space-y-2">
      {modeNote}
      {summaryRow('当前场景', currentScene ? (currentScene.title?.trim() || '（未命名场景）') : '未设置')}
      {summaryRow('在场角色', currentActor)}
      <div className="rounded border border-slate-300/40 bg-white/60 p-2">{sceneBoardNode}</div>
      <p className={`text-[10px] leading-relaxed ${theme.muted}`}>
        下一步：用底部「当前场景」设置场景，用「公开信息」发布线索，用「状态记录」记下关键变化；日志抽屉可回看全程。
      </p>
      {SHOW_RUNTIME_LAYOUT_DEV_PREVIEW && tone === 'dnd' && (
        <RuntimeSlotShell
          mode="tacticalMap"
          role="host"
          tone={tone}
          title="Runtime Layout Shell Preview"
          slotContent={{ devPanel: <DndRuntimeCombatDevPanel /> }}
        />
      )}
    </div>
  ) : (
    <div className="space-y-2">
      {modeNote}
      {summaryRow('当前角色', currentActor)}
      <div className="rounded border border-slate-300/40 bg-white/60 p-2">{sceneBoardNode}</div>
      <p className={`text-[10px] leading-relaxed ${theme.muted}`}>
        你可以：投骰、打开「我的角色」查看角色卡、在「公开信息」查看主持人发布的内容、在日志抽屉回看全程。
      </p>
    </div>
  );

  // Local mode: roll in-browser (local authority) and write the LOCAL RuntimeLog.
  // The local store has no 'dice.roll' kind (M25.1 keeps its schema), so we use the
  // equivalent 'roll.performed' with the SharedDiceRollResult as payload.
  const handleLocalDiceRoll = async (input: { expression: string; label?: string }) => {
    const outcome = rollSharedDiceExpression(input.expression, browserDiceRng, input.label);
    if (outcome.ok === false) throw new Error(outcome.message);
    const roll = outcome.roll;
    if (runtimeSystemId) {
      appendRuntimeLogEvent({
        campaignId: context.campaignId,
        systemId: runtimeSystemId,
        type: 'roll.performed',
        message: formatSharedDiceRoll(roll),
        payload: roll,
      });
    }
    return roll;
  };

  // Unified Runtime Action Dock: 投骰 (local roll) + real 公开信息 / 状态记录
  // panels (M29). Same dock as multiplayer; only the authority differs (local
  // store here, server append in the room bridge).
  const dockActions = buildRuntimeDockActions(shellMode, <SharedDiceDock onRoll={handleLocalDiceRoll} />, {
    publicInfoPanel: (
      <RuntimePublicInfoPanel
        canPublish={isHost && !!runtimeSystemId}
        items={publicInfoItems}
        onPublish={handleLocalPublishPublicInfo}
      />
    ),
    stateLogPanel: isHost ? (
      <RuntimeManualStateLogPanel
        canEdit={!!runtimeSystemId}
        items={stateLogItems}
        onRecord={handleLocalRecordStateChange}
      />
    ) : undefined,
    scenePanel: isHost ? (
      <RuntimeSceneFocusPanel canEdit={isHost} scene={currentScene} onSet={handleLocalSetScene} />
    ) : undefined,
    // Player branch uses actorPanel; host (solo) gets it appended below.
    actorPanel: !isHost ? actorPanelNode : undefined,
  });
  // Solo host (host role WITH a selected actor) can view their own character
  // without losing host tools — append 我的角色 to the host dock.
  if (isHost && hasLocalActor) {
    dockActions.push({ id: 'actor', label: '我的角色', shortLabel: '角色', panel: actorPanelNode });
  }
  // M70/M72: local runtime settings + multiplayer readiness entry (no networking).
  dockActions.push({ id: 'settings', label: '设置 / 多人', shortLabel: '设置', panel: multiplayerPanelNode });
  const actionDock = <RuntimeActionDock actions={dockActions} />;

  const logDrawer = (
    <div>
      <div className={`text-sm font-bold ${theme.accent}`}>{t('campaignRuntime.log.title')}</div>
      <p className={`mt-1 text-xs ${theme.muted}`}>{t('campaignRuntime.log.note')}</p>
      {renderRuntimeLogPanel()}
    </div>
  );

  return (
    <RuntimeFullscreenShell
      title={context.campaignTitle}
      systemId={context.systemId}
      mode={shellMode}
      tone={tone}
      roomCode={context.campaignRoomCode}
      connectionLabel="本地运行中 · 未开启多人同步"
      connectionTone="local"
      onExit={onExitRuntime}
      exitLabel="返回战役"
      mainStage={mainStage}
      actorRail={actorRail}
      inspector={inspector}
      actionDock={actionDock}
      logDrawer={logDrawer}
    />
  );
}

function toLocalCampaignSystemId(systemId: string): LocalCampaignSystemId | null {
  if (systemId === 'dnd5e-2024' || systemId === 'coc7e' || systemId === 'cp-red') {
    return systemId;
  }
  return null;
}

function runtimeLogCategoryForEvent(type: RuntimeLogEventType): RuntimeLogCategory {
  if (type === 'roll.performed') return 'roll';
  if (type === 'system.note' || type === 'session.started') return 'system';
  if (type === 'actor.note') return 'action';
  if (
    type === 'actor.hpChanged' ||
    type === 'actor.resourceChanged' ||
    type === 'actor.sanChanged' ||
    type === 'actor.humanityChanged'
  ) {
    return 'action';
  }
  return 'system';
}

function runtimeLogEventTypeLabelKey(type: RuntimeLogEventType): string {
  const labels: Record<RuntimeLogEventType, string> = {
    'session.started': 'campaignRuntime.log.eventTypes.sessionStarted',
    'roll.performed': 'campaignRuntime.log.eventTypes.rollPerformed',
    'actor.note': 'campaignRuntime.log.eventTypes.actorNote',
    'actor.hpChanged': 'campaignRuntime.log.eventTypes.actorHpChanged',
    'actor.resourceChanged': 'campaignRuntime.log.eventTypes.actorResourceChanged',
    'actor.sanChanged': 'campaignRuntime.log.eventTypes.actorSanChanged',
    'actor.humanityChanged': 'campaignRuntime.log.eventTypes.actorHumanityChanged',
    'system.note': 'campaignRuntime.log.eventTypes.systemNote',
  };
  return labels[type];
}

function formatRuntimeLogTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getManualStateChangeOptions(
  systemId: LocalCampaignSystemId | null,
): Array<{ type: ManualStateChangeEventType; labelKey: string }> {
  switch (systemId) {
    case 'coc7e':
      return [
        { type: 'actor.hpChanged', labelKey: 'campaignRuntime.log.manualState.types.hp' },
        { type: 'actor.sanChanged', labelKey: 'campaignRuntime.log.manualState.types.san' },
        { type: 'actor.resourceChanged', labelKey: 'campaignRuntime.log.manualState.types.cocResource' },
        { type: 'actor.note', labelKey: 'campaignRuntime.log.manualState.types.actorNote' },
      ];
    case 'cp-red':
      return [
        { type: 'actor.hpChanged', labelKey: 'campaignRuntime.log.manualState.types.hp' },
        { type: 'actor.humanityChanged', labelKey: 'campaignRuntime.log.manualState.types.humanity' },
        { type: 'actor.resourceChanged', labelKey: 'campaignRuntime.log.manualState.types.cpResource' },
        { type: 'actor.note', labelKey: 'campaignRuntime.log.manualState.types.actorNote' },
      ];
    case 'dnd5e-2024':
    default:
      return [
        { type: 'actor.hpChanged', labelKey: 'campaignRuntime.log.manualState.types.hp' },
        { type: 'actor.resourceChanged', labelKey: 'campaignRuntime.log.manualState.types.dndResource' },
        { type: 'actor.note', labelKey: 'campaignRuntime.log.manualState.types.actorNote' },
      ];
  }
}

function manualStateLabelPlaceholderKey(systemId: LocalCampaignSystemId | null): string {
  switch (systemId) {
    case 'coc7e':
      return 'campaignRuntime.log.manualState.labelPlaceholderCoc';
    case 'cp-red':
      return 'campaignRuntime.log.manualState.labelPlaceholderCp';
    case 'dnd5e-2024':
    default:
      return 'campaignRuntime.log.manualState.labelPlaceholderDnd';
  }
}
