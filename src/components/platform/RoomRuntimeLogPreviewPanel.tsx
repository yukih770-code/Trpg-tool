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
  RoomRuntimeLogVisibility,
} from '../../lib/platform/roomRuntimeLogTypes';
import type { SharedDiceRollResult } from '../../lib/platform/sharedDiceTypes';

/**
 * RoomRuntimeLogPreviewPanel (v0).
 *
 * AI-LANDMARK: ROOM_RUNTIME_LOG_PREVIEW_PANEL_V0
 *
 * Read-mostly preview of the server-side RuntimeLog for a room: lists PUBLIC
 * events (the server only projects public in v0), merges live `runtimeLogAppended`
 * events handed down by the lobby (it does NOT open its own WebSocket), and lets
 * an active member send a minimal public chat.message. This is NOT formal Runtime,
 * NOT CampaignRuntimeShell, NOT the local RuntimeLog store, NOT map/token/action
 * intent. hostOnly/actorPrivate are shown only as labels and are NOT real privacy.
 * System-agnostic (no DND import, no rule parsing).
 */

export interface RoomRuntimeLogPreviewPanelProps {
  roomId: string;
  baseUrl: string;
  currentMemberId?: string;
  currentMemberLabel?: string;
  canAppend?: boolean;
  /** Live public events from the lobby's shared socket; consumed then cleared. */
  liveEvents?: RoomRuntimeLogEvent[];
  onConsumedLiveEvents?: () => void;
  /** Start collapsed so the lobby's first screen stays light (default true). */
  defaultCollapsed?: boolean;
}

const KIND_LABEL: Record<RoomRuntimeLogEventKind, string> = {
  'chat.message': '聊天',
  'system.note': '系统',
  'dice.roll': '骰子',
  'host.note': '主持人记录',
  'state.manualChange': '状态记录',
};

const VISIBILITY_LABEL: Record<RoomRuntimeLogVisibility, string> = {
  public: '公开',
  hostOnly: '主持人可见（v0 不投递）',
  actorPrivate: '私密（v0 不支持）',
};

function shortId(id: string): string {
  return id.length <= 8 ? id : `…${id.slice(-6)}`;
}

function briefPayload(payload: unknown): string {
  if (payload === undefined) return '';
  try {
    const json = JSON.stringify(payload);
    if (!json) return '';
    return json.length > 120 ? `${json.slice(0, 120)}…` : json;
  } catch {
    return '[unserializable]';
  }
}

/** Merge by eventId, keep public only, sort ascending by seq. */
function mergeEvents(prev: RoomRuntimeLogEvent[], incoming: RoomRuntimeLogEvent[]): RoomRuntimeLogEvent[] {
  const byId = new Map<string, RoomRuntimeLogEvent>();
  for (const e of prev) byId.set(e.eventId, e);
  for (const e of incoming) {
    if (e.visibility === 'public') byId.set(e.eventId, e);
  }
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

function DiceResultLine({ roll }: { roll: SharedDiceRollResult }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5 text-[11px]">
      <span className="text-slate-500">掷骰</span>
      <span className="font-bold text-slate-700">{roll.normalizedExpression}</span>
      {roll.label && <span className="text-[10px] text-slate-400">· {roll.label}</span>}
      <span className="text-slate-500">
        {roll.terms.map((t, i) => (
          <span key={i}>{i > 0 ? ' + ' : ''}[{t.rolls.join(', ')}]</span>
        ))}
        {roll.modifier !== 0 && <span>{roll.modifier > 0 ? ` + ${roll.modifier}` : ` - ${Math.abs(roll.modifier)}`}</span>}
      </span>
      <span className="text-base font-black leading-none text-emerald-700">= {roll.total}</span>
    </div>
  );
}

export function RoomRuntimeLogPreviewPanel({
  roomId,
  baseUrl,
  currentMemberId,
  currentMemberLabel,
  canAppend,
  liveEvents,
  onConsumedLiveEvents,
  defaultCollapsed,
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

  // Initial load (and on room/server change): full public list.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError(null);
    setEvents([]);
    latestSeqRef.current = 0;
    listRoomRuntimeLog(config, roomId)
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
  }, [config, roomId]);

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
    listRoomRuntimeLog(config, roomId, { afterSeq: latestSeqRef.current })
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
      .then(() => {
        // The appended event returns via the shared socket (runtimeLogAppended)
        // and is merged by eventId, so no optimistic insert is needed.
        setDraft('');
      })
      .catch((e) => setSendError(errMsg(e)))
      .finally(() => setSending(false));
  };

  const card = 'rounded border border-slate-400/30 bg-white/60 p-3';
  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-600';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';
  const input = 'rounded border border-slate-400/40 bg-white/70 px-2 py-1 text-[12px] outline-none';

  return (
    <section className={card}>
      {/* Collapsible header: title + counts + (new) badge; expand to see list/input. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="flex items-center gap-2 text-left" onClick={toggleCollapsed} aria-expanded={!collapsed}>
          <span className="text-[10px] text-slate-400">{collapsed ? '▶' : '▼'}</span>
          <span className={label}>RuntimeLog 预览</span>
          <span className="text-[10px] text-slate-500">{events.length} 条 · seq {latestSeqDisplay}</span>
          {unread > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">有新日志 {unread}</span>
          )}
        </button>
        {!collapsed && (
          <button type="button" className={btn} disabled={loading} onClick={refresh}>
            {loading ? '刷新中…' : '刷新日志'}
          </button>
        )}
      </div>

      {collapsed ? null : (
        <>
      <p className="mb-2 mt-1.5 text-[10px] text-slate-500">
        这是 server-side RuntimeLog 的只读预览（v0 仅显示公开事件），不是正式 Runtime / 战斗 / 地图 / 日志写入桌面。
      </p>

      {listError && <div className="mb-2 rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] text-red-700">日志加载失败：{listError}</div>}

      <div className="max-h-72 space-y-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-[11px] italic text-slate-500">{loading ? '加载中…' : '暂无公开日志事件。'}</div>
        ) : (
          events.map((e) => (
            <div key={e.eventId} className="rounded border border-slate-300/40 bg-white/70 px-2 py-1 text-[11px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400">#{e.seq}</span>
                <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{KIND_LABEL[e.kind] ?? e.kind}</span>
                <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{VISIBILITY_LABEL[e.visibility] ?? e.visibility}</span>
                {e.authorMemberId && <span className="text-[9px] text-slate-400">作者 {shortId(e.authorMemberId)}</span>}
                {e.actorBindingId && <span className="text-[9px] text-slate-400">角色 {shortId(e.actorBindingId)}</span>}
                <span className="ml-auto text-[9px] text-slate-400">{e.createdAt}</span>
              </div>
              {e.kind === 'dice.roll' && asDiceRoll(e.payload) ? (
                <DiceResultLine roll={asDiceRoll(e.payload)!} />
              ) : (
                <>
                  {e.text && <div className="mt-0.5 whitespace-pre-wrap text-[12px] text-slate-700">{e.text}</div>}
                  {briefPayload(e.payload) && <div className="mt-0.5 break-all text-[9px] text-slate-400">{briefPayload(e.payload)}</div>}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Send a minimal public chat.message (v0 only). */}
      <div className="mt-2 border-t border-slate-300/40 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={`${input} min-w-[200px] flex-1`}
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            onKeyDown={(ev) => { if (ev.key === 'Enter' && canSend) sendChat(); }}
            placeholder={currentMemberId ? `以 ${currentMemberLabel ?? shortId(currentMemberId)} 发送公开消息…` : '需要成员身份才能发言'}
            disabled={canAppend === false || !currentMemberId}
          />
          <button type="button" className={btn} disabled={!canSend} onClick={sendChat}>
            {sending ? '发送中…' : '发送'}
          </button>
        </div>
        {sendError && <div className="mt-1 text-[10px] font-bold text-red-700">发送失败：{sendError}</div>}
        <p className="mt-1 text-[10px] italic text-slate-400">v0 仅支持发送公开聊天消息；主持人记录 / 骰子 / 状态记录为后续功能。</p>
      </div>
        </>
      )}
    </section>
  );
}
