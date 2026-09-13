import { useEffect, useMemo, useRef, useState } from 'react';

import {
  appendRoomRuntimeLogEvent,
  listRoomRuntimeLog,
  RoomServerHttpError,
  type RoomServerHttpClientConfig,
} from '../../lib/platform/roomServerHttpClient';
import type {
  RoomRuntimeLogEvent,
  RoomRuntimeLogEventKind,
} from '../../lib/platform/roomRuntimeLogTypes';
import type { SharedDiceRollResult } from '../../lib/platform/sharedDiceTypes';
import { RoomSessionAssistantPanel } from './RoomSessionAssistantDialog';
import { RoomAttackResult } from './RoomAttackResolutionDetails';
import { DndSavingThrowResult } from '../dnd/DndSavingThrowControls';
import { DndRuntimeStateResult } from '../dnd/DndRuntimeStateResult';

/**
 * RoomRuntimeLogPreviewPanel (v0).
 *
 * AI-LANDMARK: ROOM_RUNTIME_LOG_PREVIEW_PANEL_V0
 *
 * Read-mostly preview of the server-side RuntimeLog for a room: lists the
 * current member's server-projected events, merges live `runtimeLogAppended`
 * events handed down by the lobby (it does NOT open its own WebSocket), and lets
 * an active member send a minimal public chat.message. This is NOT formal Runtime,
 * NOT CampaignRuntimeShell, NOT the local RuntimeLog store, NOT map/token/action
 * intent. The server projects hostOnly records only to the authenticated active
 * host; actorPrivate remains unsupported.
 * System-agnostic (no DND import, no rule parsing).
 */

export interface RoomRuntimeLogPreviewPanelProps {
  roomId: string;
  baseUrl: string;
  currentMemberId?: string;
  currentMemberLabel?: string;
  canAppend?: boolean;
  memberNames?: Record<string, string>;
  /** Live public events from the lobby's shared socket; consumed then cleared. */
  liveEvents?: RoomRuntimeLogEvent[];
  onConsumedLiveEvents?: () => void;
  /** Start collapsed so the lobby's first screen stays light (default true). */
  defaultCollapsed?: boolean;
  /** Active Runtime host-only contextual tool. Server authority is still re-checked. */
  enableHostSessionAssistant?: boolean;
}

const KIND_LABEL: Record<RoomRuntimeLogEventKind, string> = {
  'chat.message': '聊天',
  'system.note': '系统',
  'dice.roll': '骰子',
  'host.note': '公开信息',
  'state.manualChange': '状态记录',
  'combat.started': '战斗开始',
  'combat.initiative_rolled': '先攻',
  'combat.turn_advanced': '回合',
  'combat.round_advanced': '轮次',
  'combat.combatant_added': '加入战斗',
  'combat.combatant_updated': '战斗状态',
  'combat.combatant_removed': '离开战斗',
  'combat.damage_applied': '伤害',
  'combat.attack_resolved': '攻击结算',
  'combat.conditions_updated': 'D&D 状态',
  'runtime.resource_changed': '资源 / 施法',
  'runtime.saving_throw_requested': '豁免请求',
  'runtime.saving_throw_resolved': '豁免结算',
  'combat.healing_applied': '治疗',
  'combat.temporary_hp_applied': '临时生命',
  'combat.condition_added': '状态',
  'combat.condition_removed': '状态',
  'combat.condition_toggled': '状态',
  'combat.hp_overridden': '生命值',
  'combat.table_cleared': '战斗重置',
  'combat.paused': '战斗暂停',
  'combat.resumed': '战斗继续',
  'combat.ended': '战斗结束',
};

function shortId(id: string): string {
  return id.length <= 8 ? id : `…${id.slice(-6)}`;
}

// ── M35 timeline filter ──────────────────────────────────────────────────────
type LogFilterId = 'all' | 'dice' | 'info' | 'state' | 'other';

const LOG_FILTERS: { id: LogFilterId; label: string; empty: string }[] = [
  { id: 'all', label: '全部', empty: '还没有日志。投骰、公开信息和状态记录都会出现在这里。' },
  { id: 'dice', label: '投骰', empty: '还没有投骰记录。' },
  { id: 'info', label: '公开信息', empty: '还没有公开信息。' },
  { id: 'state', label: '状态记录', empty: '还没有状态记录。' },
  { id: 'other', label: '系统/其他', empty: '没有系统或聊天消息。' },
];

function matchesLogFilter(e: RoomRuntimeLogEvent, filter: LogFilterId): boolean {
  switch (filter) {
    case 'all': return true;
    case 'dice': return e.kind === 'dice.roll' || e.kind === 'combat.attack_resolved' || e.kind === 'runtime.saving_throw_requested' || e.kind === 'runtime.saving_throw_resolved';
    case 'info': return e.kind === 'host.note';
    case 'state': return e.kind === 'state.manualChange' || e.kind === 'runtime.resource_changed' || e.kind.startsWith('combat.') && e.kind !== 'combat.attack_resolved';
    case 'other': return e.kind === 'system.note' || e.kind === 'chat.message';
  }
}

// ── M36 Session Recap v0 (pure derivation, no AI, no persistence) ────────────
function buildSessionRecap(events: RoomRuntimeLogEvent[]): string {
  const scenes = events.filter(isSceneFocusEvent);
  const infos = events.filter((e) => e.kind === 'host.note' && !isSceneFocusEvent(e));
  const states = events.filter((e) => e.kind === 'state.manualChange');
  const dice = events.filter((e) => e.kind === 'dice.roll');
  const others = events.filter((e) => e.kind === 'system.note' || e.kind === 'chat.message');

  const isEmpty =
    scenes.length === 0 && infos.length === 0 && states.length === 0 && dice.length === 0 && others.length === 0;

  const lines: string[] = [
    '# 本场回顾（草稿）',
    '',
    '> 根据本场日志自动整理的回顾草稿，可复制后自行编辑。',
    ...(isEmpty
      ? ['', '_本场还没有可回顾的内容。设置当前场景、发布公开信息、记录状态或投骰后，这里会自动汇总。_']
      : []),
    '',
    `## 场景（${scenes.length}）`,
    ...(scenes.length === 0 ? ['- （无）'] : scenes.map((e) => {
      const p = (e.payload ?? {}) as { title?: string; body?: string };
      const body = p.body ?? e.text ?? '';
      return p.title ? `- 【${p.title}】${body}` : `- ${body}`;
    })),
    '',
    `## 公开信息（${infos.length}）`,
    ...(infos.length === 0 ? ['- （无）'] : infos.map((e) => {
      const p = (e.payload ?? {}) as { title?: string; body?: string };
      const body = p.body ?? e.text ?? '';
      return p.title ? `- 【${p.title}】${body}` : `- ${body}`;
    })),
    '',
    `## 状态记录（${states.length}）`,
    ...(states.length === 0 ? ['- （无）'] : states.map((e) => {
      const p = (e.payload ?? {}) as { targetName?: string; body?: string; itemLabel?: string; actionLabel?: string };
      const actionItem = [p.actionLabel, p.itemLabel].filter(Boolean).join(' ');
      const detail = [actionItem, p.body ?? e.text ?? ''].filter(Boolean).join(' ').trim();
      return p.targetName ? `- ${p.targetName}：${detail}` : `- ${detail}`;
    })),
    '',
    `## 投骰（${dice.length}）`,
    ...(dice.length === 0 ? ['- （无）'] : dice.map((e) => {
      const roll = asDiceRoll(e.payload);
      if (!roll) return `- ${e.text ?? '掷骰'}`;
      return `- ${roll.normalizedExpression} = ${roll.total}${roll.label ? `（${roll.label}）` : ''}`;
    })),
    '',
    `## 其他`,
    `- 系统 / 聊天事件共 ${others.length} 条`,
  ];
  return lines.join('\n');
}

/** Merge by eventId. Visibility has already been projected server-side. */
function mergeEvents(prev: RoomRuntimeLogEvent[], incoming: RoomRuntimeLogEvent[]): RoomRuntimeLogEvent[] {
  const byId = new Map<string, RoomRuntimeLogEvent>();
  for (const e of prev) byId.set(e.eventId, e);
  for (const e of incoming) byId.set(e.eventId, e);
  return [...byId.values()].sort((a, b) => a.seq - b.seq);
}

function errMsg(e: unknown): string {
  return e instanceof RoomServerHttpError ? `(${e.status}) ${e.message}` : e instanceof Error ? e.message : String(e);
}

/** Narrow a log event payload to a SharedDiceRollResult for structured display. */
function asDiceRoll(payload: unknown): SharedDiceRollResult | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Partial<SharedDiceRollResult>;
  if (typeof p.total !== 'number' || !Array.isArray(p.terms) || typeof p.normalizedExpression !== 'string') return null;
  return p as SharedDiceRollResult;
}

/** Narrow a payload written by the M29 public-info / state-log / M42 scene / M56 item panels. */
function asRunNote(payload: unknown): { noteKind?: string; title?: string; targetName?: string; body?: string; mapUrl?: string; itemLabel?: string; actionLabel?: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { noteKind?: unknown; title?: unknown; targetName?: unknown; body?: unknown; mapUrl?: unknown; itemLabel?: unknown; actionLabel?: unknown };
  if (p.noteKind !== 'publicInfo' && p.noteKind !== 'manualState' && p.noteKind !== 'sceneFocus') return null;
  return {
    noteKind: typeof p.noteKind === 'string' ? p.noteKind : undefined,
    title: typeof p.title === 'string' ? p.title : undefined,
    targetName: typeof p.targetName === 'string' ? p.targetName : undefined,
    body: typeof p.body === 'string' ? p.body : undefined,
    mapUrl: typeof p.mapUrl === 'string' ? p.mapUrl : undefined,
    itemLabel: typeof p.itemLabel === 'string' ? p.itemLabel : undefined,
    actionLabel: typeof p.actionLabel === 'string' ? p.actionLabel : undefined,
  };
}

/** True for a public host.note that sets the current scene focus (M42). */
function isSceneFocusEvent(e: RoomRuntimeLogEvent): boolean {
  return e.kind === 'host.note' && asRunNote(e.payload)?.noteKind === 'sceneFocus';
}

/** 公开信息：主持人发布的信息，标题加粗；状态记录：目标 + 说明。 */
function RunNoteLine({ e }: { e: RoomRuntimeLogEvent }) {
  const note = asRunNote(e.payload);
  const body = note?.body ?? e.text ?? '';
  if (e.kind === 'host.note') {
    const isScene = note?.noteKind === 'sceneFocus';
    return (
      <div className="mt-0.5 text-[12px] leading-relaxed">
        {isScene && <span className="mr-1" aria-hidden>📍</span>}
        {note?.title && <span className="mr-1.5 font-bold text-slate-800">{note.title}</span>}
        <span className="whitespace-pre-wrap text-slate-700">{body}</span>
        {isScene && note?.mapUrl && <span className="ml-1.5 text-[9px] text-teal-600">· 含场景图</span>}
      </div>
    );
  }
  const actionItem = [note?.actionLabel, note?.itemLabel].filter(Boolean).join(' ');
  return (
    <div className="mt-0.5 text-[12px] leading-relaxed">
      {note?.targetName && <span className="mr-1.5 font-bold text-slate-800">{note.targetName}</span>}
      {actionItem && (
        <span className="mr-1.5 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">{actionItem}</span>
      )}
      <span className="whitespace-pre-wrap text-slate-700">{body}</span>
      <span className="ml-1.5 text-[9px] text-slate-400">（手动记录，不影响角色卡）</span>
    </div>
  );
}

function DiceResultLine({ roll }: { roll: SharedDiceRollResult }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5 text-[11px]">
      <span className="text-slate-500">掷骰</span>
      <span className="font-bold text-slate-700">{roll.normalizedExpression}</span>
      {roll.mode && roll.mode !== 'normal' && (
        <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
          {roll.mode === 'advantage' ? '优势' : '劣势'}
        </span>
      )}
      {roll.label && <span className="text-[10px] text-slate-400">· {roll.label}</span>}
      <span className="text-slate-500">
        {/* Advantage/disadvantage shows both faces and which one counted; older
            events without semantic metadata keep the original term rendering. */}
        {roll.rawRolls && roll.keptRoll !== undefined ? (
          <span>
            [{roll.rawRolls.join(', ')}]
            {roll.rawRolls.length > 1 && <span className="font-bold text-slate-700"> → {roll.keptRoll}</span>}
          </span>
        ) : (
          roll.terms.map((t, i) => (
            <span key={i}>{i > 0 ? ' + ' : ''}[{t.rolls.join(', ')}]</span>
          ))
        )}
        {roll.modifier !== 0 && <span>{roll.modifier > 0 ? ` + ${roll.modifier}` : ` - ${Math.abs(roll.modifier)}`}</span>}
      </span>
      <span className="text-base font-black leading-none text-emerald-700">= {roll.total}</span>
      {roll.dc !== undefined && (
        <span className={`text-[10px] font-bold ${roll.outcome === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
          DC {roll.dc} {roll.outcome === 'success' ? '成功' : '失败'}
        </span>
      )}
      {roll.isNatural20 && <span className="text-[10px] font-bold text-amber-700">天然 20</span>}
      {roll.isNatural1 && <span className="text-[10px] font-bold text-slate-500">天然 1</span>}
    </div>
  );
}

export function RoomRuntimeLogPreviewPanel({
  roomId,
  baseUrl,
  currentMemberId,
  currentMemberLabel,
  canAppend,
  memberNames = {},
  liveEvents,
  onConsumedLiveEvents,
  defaultCollapsed,
  enableHostSessionAssistant,
}: RoomRuntimeLogPreviewPanelProps) {
  const config = useMemo<RoomServerHttpClientConfig>(() => ({ baseUrl }), [baseUrl]);
  const [events, setEvents] = useState<RoomRuntimeLogEvent[]>([]);
  // Cursor: ALWAYS the server's true latestSeq, never max(events.seq) (M21.2).
  const latestSeqRef = useRef(0);
  const [latestSeqDisplay, setLatestSeqDisplay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // Collapsed by default to keep the lobby's first screen light.
  const [collapsed, setCollapsed] = useState(defaultCollapsed ?? true);
  const [seenCount, setSeenCount] = useState(0);
  // M35 timeline filter + M36 session recap (both derive from the SAME events).
  const [logFilter, setLogFilter] = useState<LogFilterId>('all');
  const [activityTab, setActivityTab] = useState<'chat' | 'game'>('game');
  const [showDebug, setShowDebug] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [recapCopied, setRecapCopied] = useState<'idle' | 'ok' | 'fail'>('idle');

  // Initial load (and on room/server change): full public list.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError(null);
    setEvents([]);
    latestSeqRef.current = 0;
    listRoomRuntimeLog(config, roomId, { memberId: currentMemberId })
      .then((result) => {
        if (cancelled) return;
        setEvents(mergeEvents([], result.events));
        latestSeqRef.current = result.latestSeq;
        setLatestSeqDisplay(result.latestSeq);
      })
      .catch((e) => {
        if (!cancelled) setListError(errMsg(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config, roomId, currentMemberId]);

  // Merge live events handed down by the lobby (shared socket), then clear them.
  useEffect(() => {
    if (!liveEvents || liveEvents.length === 0) return;
    setEvents((prev) => mergeEvents(prev, liveEvents));
    const maxLive = liveEvents.reduce((m, e) => Math.max(m, e.seq), 0);
    latestSeqRef.current = Math.max(latestSeqRef.current, maxLive);
    setLatestSeqDisplay(latestSeqRef.current);
    onConsumedLiveEvents?.();
    // onConsumedLiveEvents intentionally omitted from deps (parent re-creates it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveEvents]);

  const refresh = () => {
    setLoading(true);
    setListError(null);
    listRoomRuntimeLog(config, roomId, { afterSeq: latestSeqRef.current, memberId: currentMemberId })
      .then((result) => {
        setEvents((prev) => mergeEvents(prev, result.events));
        latestSeqRef.current = Math.max(latestSeqRef.current, result.latestSeq);
        setLatestSeqDisplay(latestSeqRef.current);
      })
      .catch((e) => setListError(errMsg(e)))
      .finally(() => setLoading(false));
  };

  // Keep "seen" in sync while expanded so the collapsed badge shows only truly new events.
  useEffect(() => {
    if (!collapsed) setSeenCount(events.length);
  }, [collapsed, events.length]);
  const unread = collapsed ? Math.max(0, events.length - seenCount) : 0;
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      if (!next) setSeenCount(events.length); // expanding -> mark all seen
      return next;
    });
  };

  const canSend = canAppend !== false && !!currentMemberId && draft.trim().length > 0 && !sending;

  const sendChat = () => {
    if (!currentMemberId || draft.trim().length === 0) return;
    setSending(true);
    setSendError(null);
    appendRoomRuntimeLogEvent(config, roomId, {
      kind: 'chat.message',
      visibility: 'public',
      text: draft.trim(),
      authorMemberId: currentMemberId,
    })
      .then(({ event }) => {
        setEvents((previous) => mergeEvents(previous, [event]));
        setActivityTab('chat');
        setDraft('');
      })
      .catch((e) => setSendError(errMsg(e)))
      .finally(() => setSending(false));
  };

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [activityTab, collapsed, events.length]);
  const visibleEvents = events.filter((event) => activityTab === 'chat' ? event.kind === 'chat.message' : event.kind !== 'chat.message' && matchesLogFilter(event, logFilter));

  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-600';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';
  const input = 'rounded border border-slate-400/40 bg-white/70 px-2 py-1 text-[12px] outline-none';

  return (
    <section className="live-activity">
      {/* Collapsible header: title + counts + (new) badge; expand to see list/input. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="flex items-center gap-2 text-left" onClick={toggleCollapsed} aria-expanded={!collapsed}>
          <span className="text-[10px] text-slate-400">{collapsed ? '▶' : '▼'}</span>
          <span className={label}>聊天与游戏动态</span>
          <span className="text-[10px] text-slate-500">{events.length} 条</span>
          {unread > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">有新日志 {unread}</span>
          )}
        </button>
        {!collapsed && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={btn}
              onClick={() => { setShowRecap((v) => !v); setRecapCopied('idle'); }}
              aria-pressed={showRecap}
            >
              {showRecap ? '日志列表' : '本场回顾'}
            </button>
            <button type="button" className={btn} disabled={loading} onClick={refresh}>
              {loading ? '刷新中…' : '刷新日志'}
            </button>
          </div>
        )}
      </div>

      {collapsed ? null : (
        <>


      {enableHostSessionAssistant && currentMemberId && (
        <details className="my-2"><summary className="cursor-pointer text-xs">AI 本场助手</summary><RoomSessionAssistantPanel
          roomId={roomId}
          baseUrl={baseUrl}
          memberId={currentMemberId}
          onConfirmed={(event) => {
            setEvents((previous) => mergeEvents(previous, [event]));
            latestSeqRef.current = Math.max(latestSeqRef.current, event.seq);
            setLatestSeqDisplay(latestSeqRef.current);
          }}
        /></details>
      )}

      {listError && <div className="mb-2 rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] text-red-700">日志加载失败：{listError}</div>}

      {showRecap ? (
        /* ── M36 Session Recap v0 ── */
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-500">根据本场日志自动整理的回顾草稿（不含 AI 加工），可复制后编辑分享。</p>
          <textarea
            readOnly
            value={buildSessionRecap(events)}
            rows={14}
            className="w-full rounded border border-slate-400/40 bg-white/80 p-2 font-mono text-[11px] leading-relaxed text-slate-700"
            onFocus={(ev) => ev.currentTarget.select()}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={btn}
              onClick={() => {
                const text = buildSessionRecap(events);
                try {
                  void navigator.clipboard.writeText(text).then(
                    () => setRecapCopied('ok'),
                    () => setRecapCopied('fail'),
                  );
                } catch {
                  setRecapCopied('fail');
                }
              }}
            >
              复制 Markdown
            </button>
            {recapCopied === 'ok' && <span className="text-[10px] font-bold text-emerald-700">已复制 ✓</span>}
            {recapCopied === 'fail' && <span className="text-[10px] text-amber-700">复制失败，请点击文本框全选后手动复制。</span>}
          </div>
        </div>
      ) : (
      <>
      <div className="my-3 flex gap-2" aria-label="动态类别">
        {(['chat', 'game'] as const).map((tab) => <button key={tab} type="button" className={btn} aria-pressed={activityTab === tab} onClick={() => setActivityTab(tab)}>{tab === 'chat' ? '聊天' : '游戏记录'}</button>)}
      </div>
      {/* Game-only filters preserve the existing projected event feed. */}
      <div className="mb-1.5 flex flex-wrap gap-1" hidden={activityTab !== 'game'}>
        {LOG_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={logFilter === f.id}
            onClick={() => setLogFilter(f.id)}
            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
              logFilter === f.id
                ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-800'
                : 'border-slate-400/40 bg-white/60 text-slate-500 hover:bg-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div ref={feedRef} className="live-activity-feed space-y-1 overflow-y-auto" role="log" aria-label={activityTab === 'chat' ? '聊天消息' : '游戏记录'}>
        {visibleEvents.length === 0 ? (
          <div className="text-[11px] italic text-slate-500">
            {loading ? '加载中…' : activityTab === 'chat' ? '向队伍发送第一条消息。' : LOG_FILTERS.find((f) => f.id === logFilter)?.empty}
          </div>
        ) : (
          visibleEvents.map((e) => (
            <article key={e.eventId} className="border-b border-slate-300/50 py-3 text-[11px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-600">{e.kind === 'chat.message' ? memberNames[e.authorMemberId ?? ''] ?? (e.authorMemberId === currentMemberId ? currentMemberLabel ?? '我' : '成员') : KIND_LABEL[e.kind] ?? '游戏事件'}</span>
                {e.visibility === 'hostOnly' && <span className="text-amber-800">仅主持人</span>}
                <time className="ml-auto text-slate-500" dateTime={e.createdAt}>{new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
              {e.kind === 'dice.roll' && asDiceRoll(e.payload) ? (
                <DiceResultLine roll={asDiceRoll(e.payload)!} />
              ) : e.kind === 'combat.attack_resolved' ? (
                <RoomAttackResult event={e} />
              ) : e.kind === 'runtime.saving_throw_requested' || e.kind === 'runtime.saving_throw_resolved' ? (
                <DndSavingThrowResult event={e} />
              ) : e.kind === 'runtime.resource_changed' || e.kind === 'combat.conditions_updated' ? (
                <DndRuntimeStateResult event={e} />
              ) : e.kind === 'host.note' || e.kind === 'state.manualChange' ? (
                <RunNoteLine e={e} />
              ) : (
                <>
                  {e.text && <div className="mt-0.5 whitespace-pre-wrap text-[12px] text-slate-700">{e.text}</div>}

                </>
              )}
              {showDebug && <pre className="mt-2 overflow-auto text-[10px]">{JSON.stringify(e, null, 2)}</pre>}
            </article>
          ))
        )}
      </div>
      </>
      )}

      {/* Send a minimal public chat.message (v0 only). */}
      <div className="mt-2 border-t border-slate-300/40 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="公开聊天消息" className={`${input} min-w-0 flex-1`}
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            onKeyDown={(ev) => { if (ev.key === 'Enter' && !ev.nativeEvent.isComposing && canSend) sendChat(); }}
            placeholder={currentMemberId ? `以 ${currentMemberLabel ?? shortId(currentMemberId)} 发送公开消息…` : '需要成员身份才能发言'}
            disabled={canAppend === false || !currentMemberId}
          />
          <button type="button" className={btn} disabled={!canSend} onClick={sendChat}>
            {sending ? '发送中…' : '发送'}
          </button>
        </div>
        {sendError && <div className="mt-1 text-[10px] font-bold text-red-700">发送失败：{sendError}</div>}
        <details className="mt-4 text-xs"><summary className="cursor-pointer text-slate-500">诊断信息</summary><p>事件游标 {latestSeqDisplay} · 仅包含当前成员获准接收的数据</p><label className="flex items-center gap-2"><input type="checkbox" checked={showDebug} onChange={(event) => setShowDebug(event.target.checked)} />显示原始事件</label></details>
      </div>
        </>
      )}
    </section>
  );
}
