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
import { rollSharedDiceExpression, formatSharedDiceRoll } from '../../lib/platform/sharedDiceExpression';

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
// Minimal CampaignRuntimeShell: local RuntimeLog read/append only. No
// multiplayer, backend, map, handout publish, permission system, or rule runtime.
export function CampaignRuntimeShell({
  context,
  tone,
  onExitRuntime,
}: CampaignRuntimeShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const [systemNoteDraft, setSystemNoteDraft] = useState('');
  const [manualStateType, setManualStateType] = useState<ManualStateChangeEventType>('actor.hpChanged');
  const [manualStateActorId, setManualStateActorId] = useState(context.selectedActorId ?? '');
  const [manualStateLabel, setManualStateLabel] = useState('');
  const [manualStateNote, setManualStateNote] = useState('');
  const theme = toneClasses[tone];
  const isHost = context.selectedEntryRole === 'host';
  const currentActor = context.selectedActorName ?? t('campaignRuntime.header.noActor');
  const runtimeSystemId = toLocalCampaignSystemId(context.systemId);
  const appendRuntimeLogEvent = useRuntimeLogLocalStore((state) => state.appendRuntimeLogEvent);
  const runtimeLogEvents = useRuntimeLogEventsForCampaign(context.campaignId);

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

  const shellMode: RuntimeShellMode = isHost ? 'host' : 'player';

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

  const mainStage = (
    // Map / Scene canvas fills the whole stage; scene items are light centered chips
    // (no full-width banner), so nothing compresses the tabletop.
    <div className={`flex h-full flex-col items-center justify-center rounded-lg border p-4 text-center ${theme.card}`}>
      <div className={`text-base font-bold ${theme.accent}`}>地图 / 场景桌面 · Map / Scene Canvas</div>
      <p className={`mx-auto mt-2 max-w-md text-[11px] leading-relaxed ${theme.muted}`}>{t('campaignRuntime.mainStage.note')}</p>
      <div className="mt-3 flex max-w-xl flex-wrap justify-center gap-1.5">
        {mainStageItems.map((key) => (
          <span key={key} className={`cursor-default rounded-full border px-2 py-0.5 text-[10px] font-bold opacity-70 ${theme.action}`}>
            {t(key)}
          </span>
        ))}
      </div>
    </div>
  );

  const summaryRow = (k: string, v: string) => (
    <div className={`rounded border p-2 ${theme.card}`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>{k}</div>
      <div className="mt-0.5 font-semibold">{v}</div>
    </div>
  );

  // M25.1b: light role summary — no big placeholder lists / dev preview by default.
  const inspector = isHost ? (
    <div className="space-y-2">
      {summaryRow('当前场景', '未设置')}
      {summaryRow('在场角色', currentActor)}
      {summaryRow('待处理事项', '—')}
      <p className={`text-[10px] leading-relaxed ${theme.muted}`}>
        主持人工具（场景 / Handout / NPC / 设置）在底部行动坞，后续接入。
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
      {summaryRow('当前角色', currentActor)}
      <p className={`text-[10px] leading-relaxed ${theme.muted}`}>角色状态 / 公开信息后续接入。</p>
    </div>
  );

  // Local mode: roll in-browser (local authority) and write the LOCAL RuntimeLog.
  // The local store has no 'dice.roll' kind (M25.1 keeps its schema), so we use the
  // equivalent 'roll.performed' with the SharedDiceRollResult as payload.
  const handleLocalDiceRoll = async (input: { expression: string; label?: string }) => {
    const outcome = rollSharedDiceExpression(input.expression, browserDiceRng, input.label);
    if (!outcome.ok) throw new Error(outcome.message);
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

  // Unified Runtime Action Dock: 投骰 (local roll) + placeholder tools. Same dock
  // as multiplayer; the dice tray is one same-weight tool, not a resident panel.
  const actionDock = (
    <RuntimeActionDock actions={buildRuntimeDockActions(shellMode, <SharedDiceDock onRoll={handleLocalDiceRoll} />)} />
  );

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
      connectionLabel={t('campaignRuntime.header.connectionPlaceholder')}
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
