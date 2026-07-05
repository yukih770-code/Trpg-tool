import { useCallback, useEffect, useState } from 'react';

import type { RoomRuntimeEntryContext, RoomRuntimeEntryMode } from '../../lib/platform/roomRuntimeEntryTypes';
import type { RoomCampaignRefSource, RoomReadyStatus, RoomSnapshot } from '../../lib/platform/roomTypes';
import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';
import {
  appendRoomRuntimeLogEvent,
  listRoomRuntimeLog,
  rollSharedDice,
  type RoomServerHttpClientConfig,
} from '../../lib/platform/roomServerHttpClient';
import { createRoomSocketClient, type RoomSocketConnectionState } from '../../lib/platform/roomSocketClient';
import { RuntimeFullscreenShell, type RuntimeShellMode } from './RuntimeFullscreenShell';
import { SharedDiceDock } from './SharedDiceDock';
import { RuntimeActionDock, buildRuntimeDockActions } from './RuntimeActionDock';
import { RoomRuntimeLogPreviewPanel } from './RoomRuntimeLogPreviewPanel';
import { RuntimePublicInfoPanel, type RuntimePublicInfoItem } from './RuntimePublicInfoPanel';
import { RuntimeManualStateLogPanel, type RuntimeStateLogItem } from './RuntimeManualStateLogPanel';
import { RuntimeCharacterSheetPanel } from './RuntimeCharacterSheetPanel';
import { RuntimeActorRosterPanel, type RuntimeActorRosterEntry } from './RuntimeActorRosterPanel';
import { buildRuntimeCharacterSummary } from './runtimeActorSnapshotAdapter';
import { buildRuntimeInventorySummary } from './runtimeInventoryAdapter';
import { resolveRuntimeActorSnapshot } from './runtimeActorSnapshotSource';
import { RuntimeSceneFocusPanel, type RuntimeSceneFocus } from './RuntimeSceneFocusPanel';
import { RuntimeSceneBoardPanel, type RuntimeSceneBoardDice } from './RuntimeSceneBoardPanel';
import { RuntimeMapStage } from './RuntimeMapStage';

/**
 * RoomRuntimeEntryBridge (v0 / UI1a) — multiplayer Runtime Alpha surface.
 *
 * AI-LANDMARK: ROOM_RUNTIME_ENTRY_BRIDGE_V0
 *
 * The surface a member lands on after clicking "进入跑团桌面" in the lobby.
 * Now rendered inside the fullscreen RuntimeFullscreenShell (UI1a) with Host /
 * Player / Spectator slot differentiation. It is Runtime Alpha: role projection,
 * room log, dice, scene, and read-only actor summary are connected, while
 * RuntimeActor / CampaignActorInstance, permissions, settlement, and store writes
 * remain v0 boundaries. The entry guard result (admissionId /
 * approvedActorBindingId / "已准入角色") is preserved. System-agnostic. No server /
 * WebSocket / RuntimeLog API change.
 */

export interface RoomRuntimeEntryBridgeProps {
  context: RoomRuntimeEntryContext;
  room?: RoomSnapshot;
  serverLabel?: string;
  onBackToLobby?: () => void;
}

const ENTRY_MODE_LABEL: Record<RoomRuntimeEntryMode, string> = {
  hostPreview: '主持人预览',
  playerReady: '玩家（已准备）',
  spectatorPreview: '旁观预览',
};

const READY_LABEL: Record<RoomReadyStatus, string> = {
  ready: '已准备',
  notReady: '未准备',
};

const CAMPAIGN_SOURCE_LABEL: Record<RoomCampaignRefSource, string> = {
  localCampaignLibrary: '本地战役库',
  imported: '导入战役',
  workshop: '工坊',
  unknown: '未知来源',
};

function entryModeToShellMode(mode: RoomRuntimeEntryMode): RuntimeShellMode {
  if (mode === 'hostPreview') return 'host';
  if (mode === 'spectatorPreview') return 'spectator';
  return 'player';
}

function shortId(id: string): string {
  return id.length <= 8 ? id : `…${id.slice(-6)}`;
}

/** Read the scene-focus fields off a host.note payload (noteKind==='sceneFocus'). */
function sceneFromPayload(payload: unknown): { title?: string; body?: string; mapUrl?: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { noteKind?: unknown; title?: unknown; body?: unknown; mapUrl?: unknown };
  if (p.noteKind !== 'sceneFocus') return null;
  return {
    title: typeof p.title === 'string' ? p.title : undefined,
    body: typeof p.body === 'string' ? p.body : undefined,
    mapUrl: typeof p.mapUrl === 'string' ? p.mapUrl : undefined,
  };
}

/** Narrow a dice.roll payload for the Scene Board's recent-rolls list. */
function diceForBoard(payload: unknown): { expression: string; total: number; label?: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { normalizedExpression?: unknown; total?: unknown; label?: unknown };
  if (typeof p.normalizedExpression !== 'string' || typeof p.total !== 'number') return null;
  return { expression: p.normalizedExpression, total: p.total, label: typeof p.label === 'string' ? p.label : undefined };
}

const CLEARANCE_LABEL: Record<string, string> = {
  notSubmitted: '未提交',
  pending: '审核中',
  approved: '已准入',
  rejected: '未通过',
  stale: '需重新确认',
};

export function RoomRuntimeEntryBridge({ context, room, serverLabel, onBackToLobby }: RoomRuntimeEntryBridgeProps) {
  // M32: the bridge owns a live socket while mounted (the lobby's socket closes
  // when the lobby unmounts). runtimeLogAppended feeds the log drawer AND the
  // public-info / state-log feeds from the same event stream; roomSnapshot keeps
  // presence (members / ready) fresh. Dedup is by eventId in every sink.
  const [logLiveEvents, setLogLiveEvents] = useState<RoomRuntimeLogEvent[]>([]);
  const [liveRoom, setLiveRoom] = useState<RoomSnapshot | undefined>(room);
  const [connState, setConnState] = useState<RoomSocketConnectionState>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [feedJustUpdated, setFeedJustUpdated] = useState(false);
  const shellMode = entryModeToShellMode(context.entryMode);

  // Room mode: the SERVER rolls (crypto) and writes the room RuntimeLog; we feed
  // the returned event into the log panel and return the roll to the dock.
  const diceConfig: RoomServerHttpClientConfig = { baseUrl: context.serverBaseUrl };
  const handleRoomDiceRoll = async (input: { expression: string; label?: string }) => {
    if (!context.currentMemberId) throw new Error('需要成员身份才能掷骰。');
    const resp = await rollSharedDice(diceConfig, context.roomId, {
      memberId: context.currentMemberId,
      expression: input.expression,
      label: input.label,
    });
    if (resp.ok === false) throw new Error(resp.message || resp.error);
    setLogLiveEvents((prev) => [...prev, resp.event]);
    return resp.roll;
  };

  // ── Public info / manual state records (M29) ──────────────────────────────
  // Server-authoritative: published/recorded through the room RuntimeLog append
  // endpoint (host.note / state.manualChange, public). The bridge keeps a small
  // filtered mirror for the dock panels; the full log stays in the log drawer.
  const isNoteKind = (e: RoomRuntimeLogEvent) => e.kind === 'host.note' || e.kind === 'state.manualChange';
  const [noteEvents, setNoteEvents] = useState<RoomRuntimeLogEvent[]>([]);
  // All public events (any kind) kept for the Scene Board's recent-activity mix.
  const [recentEvents, setRecentEvents] = useState<RoomRuntimeLogEvent[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const loadNotes = useCallback(() => {
    setNotesLoading(true);
    setNotesError(null);
    listRoomRuntimeLog({ baseUrl: context.serverBaseUrl }, context.roomId)
      .then((result) => {
        setNoteEvents(result.events.filter(isNoteKind));
        setRecentEvents(result.events);
      })
      .catch((e) => setNotesError(e instanceof Error ? e.message : String(e)))
      .finally(() => setNotesLoading(false));
  }, [context.serverBaseUrl, context.roomId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const mergeNoteEvent = (event: RoomRuntimeLogEvent) => {
    if (!isNoteKind(event)) return;
    setNoteEvents((prev) =>
      prev.some((e) => e.eventId === event.eventId) ? prev : [...prev, event].sort((a, b) => a.seq - b.seq),
    );
  };

  // ── M32 live socket: log drawer + feeds + presence share ONE event stream ──
  useEffect(() => {
    const client = createRoomSocketClient({
      baseUrl: context.serverBaseUrl,
      onConnectionStateChange: (state) => {
        setConnState(state);
        if (state === 'open') client.subscribeRoom(context.roomId);
      },
      onRoomSnapshot: (message) => {
        if (message.roomId !== context.roomId) return;
        setLiveRoom(message.payload.room);
        setLastSyncAt(new Date().toISOString());
      },
      onRuntimeLogAppended: (message) => {
        if (message.roomId !== context.roomId) return;
        const publicEvents = message.events.filter((e) => e.visibility === 'public');
        if (publicEvents.length === 0) return;
        // Log drawer buffer (panel merges by eventId — the host's own HTTP-returned
        // event arriving again over the socket cannot duplicate).
        setLogLiveEvents((prev) => [...prev, ...publicEvents]);
        // Feed mirror (same stream, eventId-deduped in mergeNoteEvent).
        let touchedFeeds = false;
        for (const event of publicEvents) {
          if (isNoteKind(event)) {
            mergeNoteEvent(event);
            touchedFeeds = true;
          }
        }
        // Scene Board recent-activity mix (all public kinds, eventId-deduped).
        setRecentEvents((prev) => {
          const seen = new Set(prev.map((e) => e.eventId));
          const added = publicEvents.filter((e) => !seen.has(e.eventId));
          return added.length === 0 ? prev : [...prev, ...added].sort((a, b) => a.seq - b.seq);
        });
        if (touchedFeeds) setFeedJustUpdated(true);
        setLastSyncAt(new Date().toISOString());
      },
    });
    client.connect();
    return () => client.close();
    // mergeNoteEvent/isNoteKind only use stable setters — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.serverBaseUrl, context.roomId]);

  // Brief "刚刚更新" perception window for the feeds.
  useEffect(() => {
    if (!feedJustUpdated) return;
    const timer = setTimeout(() => setFeedJustUpdated(false), 6000);
    return () => clearTimeout(timer);
  }, [feedJustUpdated]);

  const syncDown = connState === 'closed' || connState === 'error';
  const syncLabel =
    connState === 'open' ? '实时同步中' : connState === 'connecting' || connState === 'idle' ? '正在连接同步…' : '同步暂不可用';
  const syncHint = !syncDown
    ? null
    : shellMode === 'host'
      ? '实时同步暂不可用：发布可能失败或延迟送达玩家。已有内容仍可查看。'
      : shellMode === 'player'
        ? '实时同步暂不可用：你可能看不到最新的公开信息。已有内容仍可查看。'
        : '实时同步暂不可用：当前只读内容可能不是最新。已有内容仍可查看。';

  const appendNote = async (input: {
    kind: 'host.note' | 'state.manualChange';
    text: string;
    payload: unknown;
  }) => {
    if (!context.currentMemberId) throw new Error('需要成员身份才能发布。');
    const { event } = await appendRoomRuntimeLogEvent({ baseUrl: context.serverBaseUrl }, context.roomId, {
      kind: input.kind,
      visibility: 'public',
      text: input.text,
      payload: input.payload,
      authorMemberId: context.currentMemberId,
    });
    mergeNoteEvent(event);
    // Feed the shared log panel too (same live-event path as own dice rolls).
    setLogLiveEvents((prev) => [...prev, event]);
  };

  const handlePublishPublicInfo = async (input: { title?: string; body: string }) => {
    await appendNote({
      kind: 'host.note',
      text: input.title ? `【${input.title}】${input.body}` : input.body,
      payload: { noteKind: 'publicInfo', title: input.title, body: input.body },
    });
  };

  const handleRecordStateChange = async (input: {
    targetName?: string;
    body: string;
    changeKind?: string;
    itemLabel?: string;
    actionLabel?: string;
  }) => {
    // M56: item/equipment change fields are OPTIONAL display metadata on the same
    // state.manualChange event. They never modify a character sheet or store.
    const actionItem = [input.actionLabel, input.itemLabel].filter(Boolean).join(' ');
    const composed = [
      input.targetName ? `${input.targetName}：` : '',
      actionItem ? `${actionItem} ` : '',
      input.body,
    ].join('').trim();
    await appendNote({
      kind: 'state.manualChange',
      text: composed || input.body,
      payload: {
        noteKind: 'manualState',
        changeKind: input.changeKind,
        targetName: input.targetName,
        itemLabel: input.itemLabel,
        actionLabel: input.actionLabel,
        body: input.body,
      },
    });
  };

  // M42 scene focus: server-authoritative, written as a public host.note with
  // noteKind='sceneFocus' so it live-syncs and restores from the memory log.
  const handleSetSceneFocus = async (input: { title?: string; body: string; mapUrl?: string }) => {
    await appendNote({
      kind: 'host.note',
      text: input.title ? `【场景】${input.title}` : `【场景】${input.body}`,
      payload: { noteKind: 'sceneFocus', title: input.title, body: input.body, mapUrl: input.mapUrl },
    });
  };

  // Public info feed excludes scene-focus host.notes (those drive the Scene Board,
  // not the 公开信息 list) so the two surfaces stay clean.
  const publicInfoItems: RuntimePublicInfoItem[] = noteEvents
    .filter((e) => e.kind === 'host.note' && sceneFromPayload(e.payload) === null)
    .map((e) => {
      const p = (e.payload ?? {}) as { title?: string; body?: string };
      return { id: e.eventId, title: p.title, body: p.body ?? e.text ?? '', createdAt: e.createdAt, authorLabel: '主持人' };
    });

  // Current scene = latest public host.note with noteKind==='sceneFocus'.
  const sceneEvents = noteEvents.filter((e) => e.kind === 'host.note' && sceneFromPayload(e.payload) !== null);
  const latestSceneEvent = sceneEvents.length > 0 ? sceneEvents[sceneEvents.length - 1] : undefined;
  const currentScene: RuntimeSceneFocus | null = latestSceneEvent
    ? {
        ...(sceneFromPayload(latestSceneEvent.payload) ?? {}),
        body: sceneFromPayload(latestSceneEvent.payload)?.body ?? latestSceneEvent.text ?? '',
        createdAt: latestSceneEvent.createdAt,
      }
    : null;

  // Recent dice for the Scene Board (from the all-kinds public mirror).
  const recentDice: RuntimeSceneBoardDice[] = recentEvents
    .filter((e) => e.kind === 'dice.roll')
    .map((e): RuntimeSceneBoardDice | null => {
      const roll = diceForBoard(e.payload);
      return roll ? { id: e.eventId, label: roll.label, expression: roll.expression, total: roll.total, createdAt: e.createdAt } : null;
    })
    .filter((x): x is RuntimeSceneBoardDice => x !== null);

  const stateLogItems: RuntimeStateLogItem[] = noteEvents
    .filter((e) => e.kind === 'state.manualChange')
    .map((e) => {
      const p = (e.payload ?? {}) as { targetName?: string; body?: string; itemLabel?: string; actionLabel?: string; changeKind?: string };
      return {
        id: e.eventId,
        targetName: p.targetName,
        body: p.body ?? e.text ?? '',
        createdAt: e.createdAt,
        itemLabel: p.itemLabel,
        actionLabel: p.actionLabel,
        changeKind: p.changeKind,
      };
    });

  // M34 presence: prefer the LIVE snapshot (bridge socket) over the entry-time prop.
  const presenceRoom = liveRoom ?? room;
  const members = presenceRoom?.members ?? [];
  const actorBindings = presenceRoom?.lobby?.actorBindings ?? [];
  const readyStates = presenceRoom?.lobby?.readyStates ?? [];

  // ── M37 read-only actor summary (player "我的角色") ─────────────────────────
  // Prefer the live lobby actor-binding draft (carries clearance + status +
  // source) and fall back to the entry context's actorRef. Read-only; no edits.
  const myReadyState = readyStates.find((r) => r.memberId === context.currentMemberId)?.status ?? context.readyState;
  const myBinding = actorBindings.find((b) => b.memberId === context.currentMemberId);
  const myMember = members.find((m) => m.memberId === context.currentMemberId);

  // M57 resolve a REAL character snapshot for the current player from the local
  // character stores (DND / COC / CP-RED), matched by actor id then name. This is
  // the current user's own vault, so it resolves the player's own "我的角色";
  // other players' snapshots live on their machines (roster reflects that).
  const snapshotResult = resolveRuntimeActorSnapshot({
    systemId: context.actorRef?.systemId ?? context.systemId,
    actorId: context.actorRef?.actorId,
    displayName: context.actorRef?.displayName,
  });

  // M46/M49/M57 read-only Runtime Character Sheet summary — built by the safe
  // snapshot adapter from the resolved snapshot (or identity-only when none).
  const characterSummary = buildRuntimeCharacterSummary({
    actorRef: context.actorRef,
    binding: myBinding
      ? {
          displayName: myBinding.actorRef.displayName,
          systemId: myBinding.actorRef.systemId,
          actorId: myBinding.actorRef.actorId,
          source: myBinding.actorRef.source,
          status: myBinding.status,
          clearanceStatus: myBinding.clearance?.status,
        }
      : undefined,
    snapshot: snapshotResult.snapshot,
    playerLabel: myMember?.displayName ?? context.currentRole,
    readyState: myReadyState,
    fallbackSystemId: context.systemId,
    sourceLabel: snapshotResult.sourceKind === 'characterVault' ? snapshotResult.sourceLabel : undefined,
    extraWarnings: snapshotResult.warnings,
    matchConfidence: snapshotResult.matchConfidence,
  });

  // M55/M57 read-only inventory summary from the same resolved snapshot.
  const inventorySummary = buildRuntimeInventorySummary({
    snapshot: snapshotResult.snapshot,
    systemId: characterSummary?.system ?? context.actorRef?.systemId ?? context.systemId,
  });

  const activeCount = members.filter((m) => m.status === 'active').length;
  const approvedCount = actorBindings.filter((b) => b.status === 'approved').length;
  const readyCount = members.filter((m) => {
    const b = actorBindings.find((x) => x.memberId === m.memberId);
    const r = readyStates.find((x) => x.memberId === m.memberId)?.status;
    return m.status === 'active' && b?.status === 'approved' && r === 'ready';
  }).length;

  // M47 host actor roster: player → actor mapping + ready/admission (read-only).
  const rosterEntries: RuntimeActorRosterEntry[] = members
    .filter((m) => m.status !== 'left' && m.status !== 'kicked')
    .map((m) => {
      const b = actorBindings.find((x) => x.memberId === m.memberId);
      const r = readyStates.find((x) => x.memberId === m.memberId)?.status;
      const clearance = b?.clearance?.status;
      const bindingApproved = b?.status === 'approved';
      const admitted = clearance ? clearance === 'approved' : bindingApproved;
      const admissionLabel = b
        ? clearance
          ? CLEARANCE_LABEL[clearance] ?? clearance
          : bindingApproved
            ? '已通过'
            : '待处理'
        : undefined;
      // Snapshot availability is only known for the current user (self) — other
      // players' full character data lives on their own machines.
      const isSelf = m.memberId === context.currentMemberId;
      return {
        memberId: m.memberId,
        name: m.displayName,
        role: m.role,
        online: m.status === 'active',
        ready: r === 'ready',
        admissionLabel,
        admitted,
        actorName: b?.actorRef.displayName,
        system: b?.actorRef.systemId,
        hasActor: !!b,
        snapshotState: !b
          ? undefined
          : isSelf
            ? snapshotResult.matchConfidence === 'high' || snapshotResult.matchConfidence === 'medium'
              ? 'connected'
              : 'unmatched'
            : 'localOnly',
        sourceLabel: isSelf && snapshotResult.sourceKind === 'characterVault' ? snapshotResult.sourceLabel : undefined,
      };
    });

  // M52 state-log target suggestions: bound actor names + player names (read-only
  // aid). Selecting one only fills the free-text target; it never edits a character.
  const stateLogTargets = Array.from(
    new Set(
      rosterEntries
        .flatMap((e) => [e.actorName, e.role === 'player' ? e.name : undefined])
        .filter((x): x is string => !!x && x.trim() !== ''),
    ),
  );

  const card = 'rounded border border-slate-400/30 bg-white/60 p-3';
  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-600';

  // ── Left rail: my entry context (actor binding + ready) ────────────────────
  const actorRail = (
    <div className="space-y-2">
      <div className="text-[11px]">
        <div className="font-bold text-slate-800">{ENTRY_MODE_LABEL[context.entryMode]}</div>
        <div className="text-[10px] text-slate-500">{context.currentRole} · {shortId(context.currentMemberId)}</div>
      </div>
      <div className={card}>
        <div className={`mb-1 ${label}`}>角色绑定</div>
        {context.actorRef ? (
          <div>
            <div className="font-bold text-slate-800">{context.actorRef.displayName}</div>
            <div className="text-[10px] text-slate-500">
              {context.actorRef.systemId}{context.actorRef.actorId ? ` · ${context.actorRef.actorId}` : ''}
            </div>
            {context.approvedActorBindingId && <div className="text-[9px] text-slate-400">binding {shortId(context.approvedActorBindingId)}</div>}
            {context.admissionId && <div className="text-[9px] text-slate-400">admission {shortId(context.admissionId)}</div>}
          </div>
        ) : (
          <div className="text-[11px] italic text-slate-500">无已准入角色（主持人 / 旁观预览可无角色）。</div>
        )}
        <div className="mt-1 text-[11px]">准备：<span className="font-bold">{context.readyState ? READY_LABEL[context.readyState] : '—'}</span></div>
      </div>
    </div>
  );

  // ── Right inspector: mode-differentiated ───────────────────────────────────
  const inspector = (
    <div className="space-y-2">
      {syncHint && (
        <div className="rounded border border-amber-500/40 bg-amber-50/80 px-2 py-1.5 text-[10px] leading-relaxed text-amber-800">
          {syncHint}
        </div>
      )}
      {!syncDown && notesError && (
        <div className="rounded border border-amber-500/40 bg-amber-50/80 px-2 py-1.5 text-[10px] leading-relaxed text-amber-800">
          信息拉取失败，可点击面板中的「刷新」重试。实时推送不受影响。
        </div>
      )}
      <div className={card}>
        <div className={`mb-1 ${label}`}>房间概览</div>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <span>在线 <b className="text-slate-800">{activeCount}</b></span>
          <span>已准入角色 <b className="text-slate-800">{approvedCount}</b></span>
          <span>已准备 <b className="text-slate-800">{readyCount}</b></span>
        </div>
      </div>
      {shellMode === 'host' && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>主持台</div>
          <div className="space-y-0.5 text-[11px] text-slate-700">
            <div>身份：<b>主持人</b></div>
            <div>当前场景：<span className="text-slate-700">{currentScene ? (currentScene.title?.trim() || '（未命名场景）') : '未设置'}</span></div>
            <div>公开信息 <b>{publicInfoItems.length}</b> 条 · 状态记录 <b>{stateLogItems.length}</b> 条</div>
            <div>
              同步：<b className={syncDown ? 'text-amber-700' : 'text-emerald-700'}>{syncLabel}</b>
              {lastSyncAt && (
                <span className="ml-1 text-[10px] text-slate-400">最近 {new Date(lastSyncAt).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          <div className="mt-1.5 border-t border-slate-300/40 pt-1.5">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">玩家 · 角色名单</div>
            <RuntimeActorRosterPanel entries={rosterEntries} />
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            下一步：用底部「当前场景」设置场景，用「公开信息」发布线索，用「状态记录」记下关键变化；日志抽屉可回看全程。
          </p>
        </div>
      )}
      {shellMode === 'player' && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>我的信息</div>
          <div className="space-y-0.5 text-[11px] text-slate-700">
            <div>身份：<b>玩家</b></div>
            <div>角色：<b>{context.actorRef?.displayName ?? '未绑定'}</b></div>
            <div>同步：<b className={syncDown ? 'text-amber-700' : 'text-emerald-700'}>{syncLabel}</b></div>
          </div>
          <p className="mt-1.5 border-t border-slate-300/40 pt-1.5 text-[10px] leading-relaxed text-slate-500">
            你可以：投骰、查看主持人发布的公开信息、在日志抽屉回看全程。
          </p>
        </div>
      )}
      {shellMode === 'spectator' && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>旁观视角</div>
          <div className="space-y-0.5 text-[11px] text-slate-700">
            <div>身份：<b>旁观者</b>（只读）</div>
            <div>同步：<b className={syncDown ? 'text-amber-700' : 'text-emerald-700'}>{syncLabel}</b></div>
          </div>
          <p className="mt-1.5 border-t border-slate-300/40 pt-1.5 text-[10px] leading-relaxed text-slate-500">
            你可以查看公开信息和日志，但不能投骰或修改任何内容。
          </p>
        </div>
      )}
      {context.campaignRef && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>战役关联</div>
          <div className="text-[11px] font-bold text-slate-800">{context.campaignRef.displayName}</div>
          <div className="text-[10px] text-slate-500">
            {CAMPAIGN_SOURCE_LABEL[context.campaignRef.source]} · {context.campaignRef.systemId}
          </div>
        </div>
      )}
      {/* Scene Board as a compact overlay (M47): current scene + recent activity. */}
      <div className={card}>
        <div className={`mb-1 ${label}`}>桌面动态</div>
        <RuntimeSceneBoardPanel
          scene={currentScene}
          publicInfo={publicInfoItems}
          stateLog={stateLogItems}
          recentDice={recentDice}
          role={shellMode}
          meta={{ roomCode: context.roomCode, systemId: context.systemId, serverLabel: serverLabel ?? context.serverBaseUrl }}
          loading={notesLoading}
        />
      </div>
    </div>
  );

  // ── Main stage: map-first tabletop (scene image fills it; HUD floats) ──────
  const mainStage = <RuntimeMapStage scene={currentScene} role={shellMode} loading={notesLoading} />;

  return (
    <RuntimeFullscreenShell
      title={context.campaignRef?.displayName ?? `房间 ${context.roomCode}`}
      systemId={context.systemId}
      mode={shellMode}
      roomCode={context.roomCode}
      connectionLabel={syncLabel}
      connectionTone={connState === 'open' ? 'ok' : syncDown ? 'warn' : 'idle'}
      sceneLabel="Runtime Alpha"
      onExit={onBackToLobby}
      exitLabel="返回房间大厅"
      mainStage={mainStage}
      actorRail={actorRail}
      inspector={inspector}
      actionDock={
        <RuntimeActionDock
          actions={buildRuntimeDockActions(
            shellMode,
            <SharedDiceDock canRoll={!!context.currentMemberId} onRoll={handleRoomDiceRoll} />,
            {
              publicInfoPanel: (
                <RuntimePublicInfoPanel
                  canPublish={shellMode === 'host' && !!context.currentMemberId}
                  items={publicInfoItems}
                  onPublish={handlePublishPublicInfo}
                  onRefresh={loadNotes}
                  loading={notesLoading}
                  feedError={notesError}
                  justUpdated={feedJustUpdated}
                  contextHint={syncDown ? '实时同步暂不可用，此列表可能不是最新。' : null}
                />
              ),
              stateLogPanel:
                shellMode === 'host' ? (
                  <RuntimeManualStateLogPanel
                    canEdit={!!context.currentMemberId}
                    items={stateLogItems}
                    onRecord={handleRecordStateChange}
                    onRefresh={loadNotes}
                    loading={notesLoading}
                    feedError={notesError}
                    justUpdated={feedJustUpdated}
                    contextHint={syncDown ? '实时同步暂不可用，此列表可能不是最新。' : null}
                    candidateTargets={stateLogTargets}
                  />
                ) : undefined,
              actorPanel:
                shellMode === 'player' ? (
                  <RuntimeCharacterSheetPanel summary={characterSummary} inventory={inventorySummary} role="player" />
                ) : undefined,
              scenePanel:
                shellMode === 'host' ? (
                  <RuntimeSceneFocusPanel
                    canEdit={!!context.currentMemberId}
                    scene={currentScene}
                    onSet={handleSetSceneFocus}
                    loading={notesLoading}
                    feedError={notesError}
                    justUpdated={feedJustUpdated}
                    contextHint={syncDown ? '实时同步暂不可用，此场景可能不是最新。' : null}
                  />
                ) : undefined,
            },
          )}
        />
      }
      logDrawer={
        <RoomRuntimeLogPreviewPanel
          roomId={context.roomId}
          baseUrl={context.serverBaseUrl}
          currentMemberId={context.currentMemberId}
          canAppend={!!context.currentMemberId}
          liveEvents={logLiveEvents}
          onConsumedLiveEvents={() => setLogLiveEvents([])}
          defaultCollapsed={false}
        />
      }
    />
  );
}
