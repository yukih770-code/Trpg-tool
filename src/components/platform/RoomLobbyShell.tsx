import { useEffect, useMemo, useState } from 'react';

import {
  approveActorBindingOnRoomServer,
  approveRoomMemberOnServer,
  getRoomServerRoom,
  rejectActorBindingOnRoomServer,
  rejectRoomMemberOnServer,
  setRoomMemberReadyOnServer,
  submitActorBindingToRoomServer,
  RoomServerHttpError,
  type RoomServerHttpClientConfig,
} from '../../lib/platform/roomServerHttpClient';
import {
  createRoomSocketClient,
  type RoomSocketConnectionState,
} from '../../lib/platform/roomSocketClient';
import type {
  RoomActorBindingSource,
  RoomCampaignRefSource,
  RoomLobbyActorBindingStatus,
  RoomMemberIdentity,
  RoomMemberRole,
  RoomMemberStatus,
  RoomReadyStatus,
  RoomSnapshot,
} from '../../lib/platform/roomTypes';
import type {
  RoomRuntimeEntryBlockedReason,
  RoomRuntimeEntryContext,
} from '../../lib/platform/roomRuntimeEntryTypes';
import { evaluateRoomRuntimeEntryEligibility } from '../../lib/platform/roomRuntimeEntryGuard';
import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';
import { RoomRuntimeLogPreviewPanel } from './RoomRuntimeLogPreviewPanel';

/**
 * RoomLobbyShell (v0) — platform Room Lobby surface.
 *
 * AI-LANDMARK: ROOM_LOBBY_SHELL_V0
 *
 * The screen a player/host lands on AFTER joining/creating a room: it subscribes
 * to the room over WebSocket and shows live room + member status, plus pre-session
 * actor-binding DRAFTS and a ready check. This is a LOBBY, NOT Runtime — the actor
 * binding is a lightweight SUMMARY (no RuntimeActor / CampaignActorInstance), there
 * is no map/log/combat/action intent, and no real permission/auth. Host
 * approve/reject (members and bindings) are SCAFFOLD operations against the local
 * Room Server (the backend has no real auth yet). No global store, no
 * RuntimeCombatStore / RuntimeLogLocalStore. System-agnostic (uses systemId only).
 */

export interface RoomLobbyShellProps {
  baseUrl: string;
  roomId: string;
  currentMemberId?: string;
  currentRole?: RoomMemberRole;
  initialRoom?: RoomSnapshot;
  serverLabel?: string;
  /** Back = return to the page the user opened the room from (source-aware label). */
  backLabel?: string;
  onBackToOrigin?: () => void;
  /** Exit = close this lobby view (v0 does NOT call a server-side leave). */
  exitLabel?: string;
  onExitRoom?: () => void;
  /** Origin context shown as a lightweight banner (NOT a permission). */
  originLabel?: string;
  originDetail?: string;
  /** @deprecated Back-compat: used as onBackToOrigin if the new props are absent. */
  onLeaveLobby?: () => void;
  /** Emitted when an eligible member opens the read-only Runtime Entry Preview. */
  onEnterRuntime?: (payload: { context: RoomRuntimeEntryContext; room: RoomSnapshot }) => void;
}

interface SnapshotMeta {
  serverSeq: number;
  reason: string;
  sentAt: string;
}

type MyStatusKind = 'pendingApproval' | 'active' | 'kicked' | 'unknown' | 'other';

const STATUS_LABEL: Record<RoomMemberStatus, string> = {
  invited: '已邀请',
  pendingApproval: '等待审批',
  active: '在线',
  disconnected: '断线',
  left: '已离开',
  kicked: '已移出',
};

const ROLE_LABEL: Record<RoomMemberRole, string> = {
  host: '主持人',
  player: '玩家',
  spectator: '旁观',
};

const CONN_LABEL: Record<RoomSocketConnectionState, string> = {
  idle: '未连接',
  connecting: '连接中…',
  open: '已连接',
  closed: '已断开',
  error: '连接错误',
};

const CONN_TONE: Record<RoomSocketConnectionState, string> = {
  idle: 'text-slate-500',
  connecting: 'text-amber-600',
  open: 'text-emerald-700',
  closed: 'text-slate-500',
  error: 'text-red-700',
};

const BINDING_LABEL: Record<RoomLobbyActorBindingStatus, string> = {
  notSubmitted: '未提交',
  pendingHostApproval: '等待审批',
  approved: '已批准',
  rejected: '已拒绝',
};

const BINDING_TONE: Record<RoomLobbyActorBindingStatus, string> = {
  notSubmitted: 'bg-slate-500/10 text-slate-600',
  pendingHostApproval: 'bg-amber-500/15 text-amber-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-700',
};

const SOURCE_LABEL: Record<RoomActorBindingSource, string> = {
  localActorVault: '本地角色库',
  manualScaffold: '手动草稿',
  imported: '导入',
  unknown: '未知',
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

const ENTRY_BLOCKED_LABEL: Record<RoomRuntimeEntryBlockedReason, string> = {
  roomMissing: '房间快照未就绪。',
  memberMissing: '未匹配当前成员。',
  memberNotActive: '需先成为在线成员（被主持人批准）。',
  actorBindingMissing: '请先提交角色绑定草稿。',
  actorBindingNotApproved: '角色绑定等待主持人批准。',
  memberNotReady: '请先点击「我已准备」。',
  spectatorPreviewOnly: '旁观仅可进入只读预览。',
  unknown: '暂不可进入跑团桌面预览。',
};

function shortId(id: string): string {
  return id.length <= 8 ? id : `…${id.slice(-6)}`;
}

function errMsg(e: unknown): string {
  return e instanceof RoomServerHttpError ? `(${e.status}) ${e.message}` : e instanceof Error ? e.message : String(e);
}

export function RoomLobbyShell({
  baseUrl,
  roomId,
  currentMemberId,
  currentRole,
  initialRoom,
  serverLabel,
  backLabel,
  onBackToOrigin,
  exitLabel,
  onExitRoom,
  originLabel,
  originDetail,
  onLeaveLobby,
  onEnterRuntime,
}: RoomLobbyShellProps) {
  // Back-compat: fall back to onLeaveLobby when the new back/exit props are absent.
  const backHandler = onBackToOrigin ?? onLeaveLobby;
  const exitHandler = onExitRoom;
  const [room, setRoom] = useState<RoomSnapshot | null>(initialRoom ?? null);
  const [connState, setConnState] = useState<RoomSocketConnectionState>('idle');
  const [snapshotMeta, setSnapshotMeta] = useState<SnapshotMeta | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [httpError, setHttpError] = useState<string | null>(null);
  // Per-member host approval action state.
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);
  // Actor binding draft form + submit state.
  const [bindingName, setBindingName] = useState('');
  const [bindingActorId, setBindingActorId] = useState('');
  const [bindingBusy, setBindingBusy] = useState(false);
  const [bindingError, setBindingError] = useState<string | null>(null);
  // Host binding review (per-binding) state.
  const [reviewBindingId, setReviewBindingId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  // Ready toggle state.
  const [readyBusy, setReadyBusy] = useState(false);
  const [readyError, setReadyError] = useState<string | null>(null);
  // Live RuntimeLog events from the shared socket, buffered for the preview panel.
  const [logLiveEvents, setLogLiveEvents] = useState<RoomRuntimeLogEvent[]>([]);

  const config = useMemo<RoomServerHttpClientConfig>(() => ({ baseUrl }), [baseUrl]);

  // WebSocket: connect + subscribe to this room; clean up on unmount.
  useEffect(() => {
    setWsError(null);
    const client = createRoomSocketClient({
      baseUrl,
      onConnectionStateChange: (state) => {
        setConnState(state);
        if (state === 'open') client.subscribeRoom(roomId);
      },
      onRoomSnapshot: (message) => {
        if (message.roomId !== roomId) return;
        setRoom(message.payload.room);
        setSnapshotMeta({ serverSeq: message.serverSeq, reason: message.reason, sentAt: message.sentAt });
      },
      onRuntimeLogAppended: (message) => {
        if (message.roomId !== roomId) return;
        // Buffer public events for the preview panel (reuse this single socket).
        const publicEvents = message.events.filter((e) => e.visibility === 'public');
        if (publicEvents.length > 0) setLogLiveEvents((prev) => [...prev, ...publicEvents]);
      },
      onErrorMessage: (message) => {
        setWsError(`${message.code}: ${message.message}`);
      },
    });
    client.connect();

    return () => {
      client.close();
    };
  }, [baseUrl, roomId]);

  // HTTP fallback: pull an initial snapshot if none was provided.
  useEffect(() => {
    if (initialRoom) return;
    let cancelled = false;
    getRoomServerRoom(config, roomId)
      .then((snapshot) => { if (!cancelled) setRoom(snapshot); })
      .catch((e) => {
        if (!cancelled) {
          setHttpError(e instanceof RoomServerHttpError ? `(${e.status}) ${e.message}` : e instanceof Error ? e.message : String(e));
        }
      });
    return () => { cancelled = true; };
    // initialRoom intentionally read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, roomId]);

  const members = room?.members ?? [];

  const currentMember = useMemo(
    () => (currentMemberId ? members.find((m) => m.memberId === currentMemberId) : undefined),
    [members, currentMemberId],
  );

  const myStatus: MyStatusKind = useMemo(() => {
    if (!currentMember) return 'unknown';
    switch (currentMember.status) {
      case 'pendingApproval': return 'pendingApproval';
      case 'active': return 'active';
      case 'kicked': return 'kicked';
      default: return 'other';
    }
  }, [currentMember]);

  // Host scaffold gate: current member exists, is host, and is active.
  const isHostScaffold =
    !!currentMember && currentMember.role === 'host' && currentMember.status === 'active' && currentRole === 'host';

  const groups = useMemo(() => {
    const host: RoomMemberIdentity[] = [];
    const active: RoomMemberIdentity[] = [];
    const pending: RoomMemberIdentity[] = [];
    const inactive: RoomMemberIdentity[] = [];
    for (const m of members) {
      if (m.role === 'host') host.push(m);
      else if (m.status === 'active') active.push(m);
      else if (m.status === 'pendingApproval' || m.status === 'invited') pending.push(m);
      else inactive.push(m); // disconnected / left / kicked
    }
    return { host, active, pending, inactive };
  }, [members]);

  // Lobby (pre-session) state derived from the room snapshot.
  const actorBindings = room?.lobby?.actorBindings ?? [];
  const readyStates = room?.lobby?.readyStates ?? [];
  const iAmActive = currentMember?.status === 'active';
  const myBinding = currentMemberId ? actorBindings.find((b) => b.memberId === currentMemberId) : undefined;
  const myBindingStatus: RoomLobbyActorBindingStatus = myBinding?.status ?? 'notSubmitted';
  const myReady: RoomReadyStatus =
    (currentMemberId ? readyStates.find((r) => r.memberId === currentMemberId)?.status : undefined) ?? 'notReady';
  const activeCount = members.filter((m) => m.status === 'active').length;
  const approvedCount = actorBindings.filter((b) => b.status === 'approved').length;
  // A ready member only counts when the invariant holds: active + an approved
  // actor binding + readyState 'ready'. Never trust readyStates alone (a stale
  // 'ready' without an approved binding must not inflate the count).
  const isMemberFullyReady = (memberId: string): boolean => {
    const m = members.find((x) => x.memberId === memberId);
    const b = actorBindings.find((x) => x.memberId === memberId);
    const r = readyStates.find((x) => x.memberId === memberId)?.status;
    return m?.status === 'active' && b?.status === 'approved' && r === 'ready';
  };
  const readyCount = members.filter((m) => isMemberFullyReady(m.memberId)).length;
  const memberName = (id: string) => members.find((m) => m.memberId === id)?.displayName ?? shortId(id);

  // Runtime Entry Bridge eligibility (read-only preview; NOT real runtime).
  const entryEligibility = evaluateRoomRuntimeEntryEligibility(room ?? undefined, currentMemberId);
  const handleEnterRuntime = () => {
    if (!room || !currentMember || !currentMemberId || !entryEligibility.canEnter || !entryEligibility.entryMode) return;
    const context: RoomRuntimeEntryContext = {
      roomId,
      roomCode: room.identity.roomCode,
      systemId: room.identity.systemId,
      serverBaseUrl: baseUrl,
      currentMemberId,
      currentRole: currentMember.role,
      approvedActorBindingId: entryEligibility.approvedActorBindingId,
      actorRef: entryEligibility.actorRef,
      readyState: entryEligibility.readyState,
      entryMode: entryEligibility.entryMode,
      campaignRef: room.campaignRef,
      serverSeqAtEntry: snapshotMeta?.serverSeq,
    };
    onEnterRuntime?.({ context, room });
  };

  // Authoritative updates arrive via the WS roomSnapshot broadcast. This HTTP
  // refresh is only a fallback so the UI doesn't appear stuck if the socket is
  // slow or a dev-mode message is dropped — it re-reads the SERVER snapshot
  // (GET /rooms/:roomId); it never fabricates local state.
  const refreshSnapshot = async () => {
    try {
      setRoom(await getRoomServerRoom(config, roomId));
    } catch {
      // non-fatal: WS broadcast remains the source of truth
    }
  };

  const runMemberAction = async (memberId: string, action: 'approve' | 'reject') => {
    setPendingMemberId(memberId);
    setMemberActionError(null);
    try {
      if (action === 'approve') await approveRoomMemberOnServer(config, roomId, memberId);
      else await rejectRoomMemberOnServer(config, roomId, memberId);
      await refreshSnapshot();
    } catch (e) {
      setMemberActionError(errMsg(e));
    } finally {
      setPendingMemberId(null);
    }
  };

  const submitBinding = async () => {
    if (!currentMemberId) return;
    setBindingBusy(true);
    setBindingError(null);
    try {
      await submitActorBindingToRoomServer(config, roomId, {
        memberId: currentMemberId,
        actorRef: {
          displayName: bindingName.trim(),
          actorId: bindingActorId.trim() || undefined,
          systemId: room?.identity.systemId,
          source: 'manualScaffold',
        },
      });
      await refreshSnapshot();
    } catch (e) {
      setBindingError(errMsg(e));
    } finally {
      setBindingBusy(false);
    }
  };

  const reviewBinding = async (bindingId: string, action: 'approve' | 'reject') => {
    setReviewBindingId(bindingId);
    setReviewError(null);
    try {
      if (action === 'approve') await approveActorBindingOnRoomServer(config, roomId, bindingId, currentMemberId);
      else await rejectActorBindingOnRoomServer(config, roomId, bindingId, currentMemberId);
      await refreshSnapshot();
    } catch (e) {
      setReviewError(errMsg(e));
    } finally {
      setReviewBindingId(null);
    }
  };

  const toggleReady = async (ready: boolean) => {
    if (!currentMemberId) return;
    setReadyBusy(true);
    setReadyError(null);
    try {
      await setRoomMemberReadyOnServer(config, roomId, currentMemberId, ready);
      await refreshSnapshot();
    } catch (e) {
      setReadyError(errMsg(e));
    } finally {
      setReadyBusy(false);
    }
  };

  const identity = room?.identity;

  const card = 'rounded border border-slate-400/30 bg-white/60 p-3';
  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-600';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';
  const input = 'rounded border border-slate-400/40 bg-white/70 px-2 py-1 text-[12px] outline-none';
  const reviewBtn = 'rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide disabled:opacity-40';

  return (
    <div className="space-y-4 rounded-lg border border-slate-400/30 bg-slate-50/60 p-4 text-[12px] text-slate-700">
      {/* Header: source-aware Back (left) + title/roomCode, Exit room view (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {backHandler && (
            <button type="button" className={btn} onClick={backHandler}>← {backLabel ?? '返回'}</button>
          )}
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-800">
              战役房间大厅 · Room Lobby
              {identity?.roomCode ? <span className="ml-2 text-slate-500">#{identity.roomCode}</span> : null}
            </div>
            <div className="text-[10px] text-slate-500">这是房间大厅，不是正式跑团桌面（Runtime）。角色绑定 / 准备状态为大厅草稿阶段；进入正式跑团桌面是后续功能。</div>
          </div>
        </div>
        {exitHandler && (
          <button type="button" className={btn} onClick={exitHandler}>{exitLabel ?? '离开房间视图'}</button>
        )}
      </div>

      {/* Origin banner (lightweight context, NOT a permission). */}
      <div className="rounded border border-slate-300/40 bg-white/50 px-2 py-1 text-[10px] text-slate-500">
        来源：<span className="font-bold text-slate-600">{originLabel ?? (room?.campaignRef ? '我的战役' : '房间')}</span>
        {(originDetail ?? room?.campaignRef?.displayName) ? ` / ${originDetail ?? room?.campaignRef?.displayName}` : ''}
        <span className="ml-1 italic">（仅为来源上下文，不是权限）</span>
      </div>

      {/* Connection state */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={label}>连接状态</span>
        <span className={`text-[11px] font-bold ${CONN_TONE[connState]}`}>{CONN_LABEL[connState]}</span>
        {snapshotMeta && (
          <span className="text-[10px] text-slate-500">
            最新快照 · seq {snapshotMeta.serverSeq} · {snapshotMeta.reason} · {snapshotMeta.sentAt}
          </span>
        )}
      </div>
      {wsError && <div className="rounded border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-700">WebSocket：{wsError}</div>}
      {httpError && <div className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] text-red-700">HTTP：{httpError}</div>}

      {/* Room info */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>房间信息</div>
        {identity ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            <Info k="房间码" v={identity.roomCode} strong />
            <Info k="系统" v={identity.systemId} />
            <Info k="房间状态" v={identity.lifecycleStatus} />
            <Info k="加入审批" v={room?.joinApprovalMode ?? '—'} />
            <Info k="roomId" v={shortId(identity.roomId)} />
            <Info k="服务器" v={serverLabel ?? baseUrl} />
          </div>
        ) : (
          <div className="text-[11px] italic text-slate-500">正在获取房间快照…</div>
        )}
        {/* Campaign linkage (read-only; not a permission). */}
        {identity && (
          room?.campaignRef ? (
            <div className="mt-2 border-t border-slate-300/40 pt-2">
              <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
                <Info k="战役名称" v={room.campaignRef.displayName} strong />
                <Info k="战役来源" v={CAMPAIGN_SOURCE_LABEL[room.campaignRef.source]} />
                {room.campaignRef.campaignId && <Info k="campaignId" v={shortId(room.campaignRef.campaignId)} />}
                <Info k="战役系统" v={room.campaignRef.systemId} />
              </div>
            </div>
          ) : (
            <div className="mt-2 border-t border-slate-300/40 pt-2 text-[11px] italic text-slate-500">无战役关联 / 测试房间</div>
          )
        )}
      </section>

      {/* My status */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>我的加入状态</div>
        {myStatus === 'pendingApproval' && <div className="font-bold text-amber-700">等待主持人审批。</div>}
        {myStatus === 'active' && (
          <div>
            <div className="font-bold text-emerald-700">已加入房间。</div>
            <div className="mt-0.5 text-[10px] text-slate-500">下一步：角色绑定 / 准备状态 / 进入正式跑团桌面（后续）。</div>
          </div>
        )}
        {myStatus === 'kicked' && <div className="font-bold text-red-700">加入请求被拒绝，或你已被移出房间。</div>}
        {myStatus === 'other' && currentMember && (
          <div className="font-bold text-slate-600">当前状态：{STATUS_LABEL[currentMember.status]}。</div>
        )}
        {myStatus === 'unknown' && (
          <div className="font-bold text-slate-600">当前成员身份未能匹配。可以返回加入战役页重新加入。</div>
        )}
      </section>

      {/* Members */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>成员列表（{members.length}）</div>
        <MemberGroup title="主持人" members={groups.host} currentMemberId={currentMemberId} />
        <MemberGroup title="在线玩家" members={groups.active} currentMemberId={currentMemberId} />
        <MemberGroup
          title="等待审批"
          members={groups.pending}
          currentMemberId={currentMemberId}
          actions={isHostScaffold ? {
            pendingMemberId,
            onApprove: (id) => runMemberAction(id, 'approve'),
            onReject: (id) => runMemberAction(id, 'reject'),
          } : undefined}
        />
        <MemberGroup title="已离开 / 断线 / 移出" members={groups.inactive} currentMemberId={currentMemberId} />
        {members.length === 0 && <div className="text-[11px] italic text-slate-500">暂无成员信息。</div>}
      </section>

      {/* Actor binding (pre-session draft) */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>角色绑定</div>
        <p className="mb-2 text-[10px] text-slate-500">
          这是角色绑定草稿，不是正式角色导入。后续会连接真实角色库与角色安检。当前系统：{identity?.systemId ?? '—'}（角色 / 调查员 / Solo / Actor）。
        </p>

        <div className="mb-2 text-[11px]">
          {myBindingStatus === 'notSubmitted' && <span className="font-bold text-slate-600">未提交角色。</span>}
          {myBindingStatus === 'pendingHostApproval' && <span className="font-bold text-amber-700">已提交角色草稿，等待 Host 审批。</span>}
          {myBindingStatus === 'approved' && <span className="font-bold text-emerald-700">角色绑定草稿已批准。</span>}
          {myBindingStatus === 'rejected' && (
            <span className="font-bold text-red-700">
              角色绑定被拒绝{myBinding?.rejectionReason ? `：${myBinding.rejectionReason}` : ''}。可修改后重新提交。
            </span>
          )}
          {myBinding && (
            <span className="ml-2 text-[10px] text-slate-500">
              当前：{myBinding.actorRef.displayName}{myBinding.actorRef.actorId ? ` · ${myBinding.actorRef.actorId}` : ''}
            </span>
          )}
        </div>

        {iAmActive ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">角色显示名
              <input className={input} value={bindingName} onChange={(e) => setBindingName(e.target.value)} placeholder="例如 Elaria / 调查员 / Solo" />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">角色 ID（可选）
              <input className={input} value={bindingActorId} onChange={(e) => setBindingActorId(e.target.value)} placeholder="可留空" />
            </label>
            <button type="button" className={btn} disabled={bindingBusy || !bindingName.trim()} onClick={submitBinding}>
              {bindingBusy ? '提交中…' : myBinding ? '更新角色绑定草稿' : '提交角色绑定草稿'}
            </button>
          </div>
        ) : (
          <p className="text-[10px] italic text-slate-500">成为在线成员后才能提交角色绑定草稿。</p>
        )}
        {bindingError && <div className="mt-1 text-[10px] font-bold text-red-700">提交失败：{bindingError}</div>}
      </section>

      {/* Host: actor binding review (scaffold) */}
      {isHostScaffold && (
        <section className={card}>
          <div className={`mb-1.5 ${label}`}>角色绑定审批（主持人）</div>
          <p className="mb-2 text-[10px] text-amber-700">
            主持人审批为本地 Room Server / scaffold 阶段操作，不是正式权限系统。批准不会创建正式角色实例或写回角色库。
          </p>
          {actorBindings.length === 0 ? (
            <p className="text-[11px] italic text-slate-500">暂无角色绑定提交。</p>
          ) : (
            <div className="space-y-1">
              {actorBindings.map((b) => (
                <div key={b.bindingId} className="flex flex-wrap items-center gap-2 rounded border border-slate-300/40 bg-white/70 px-2 py-1 text-[11px]">
                  <span className="font-bold text-slate-800">{memberName(b.memberId)}</span>
                  <span className="text-slate-600">→ {b.actorRef.displayName}</span>
                  {b.actorRef.actorId && <span className="text-[9px] text-slate-400">{b.actorRef.actorId}</span>}
                  <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{b.actorRef.systemId}</span>
                  <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{SOURCE_LABEL[b.actorRef.source]}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${BINDING_TONE[b.status]}`}>{BINDING_LABEL[b.status]}</span>
                  <span className="text-[9px] text-slate-400">{b.submittedAt}</span>
                  {b.status === 'pendingHostApproval' && (
                    <span className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        className={`${reviewBtn} border-emerald-500/50 text-emerald-700`}
                        disabled={reviewBindingId === b.bindingId}
                        onClick={() => reviewBinding(b.bindingId, 'approve')}
                      >
                        {reviewBindingId === b.bindingId ? '处理中…' : '批准'}
                      </button>
                      <button
                        type="button"
                        className={`${reviewBtn} border-red-500/50 text-red-700`}
                        disabled={reviewBindingId === b.bindingId}
                        onClick={() => reviewBinding(b.bindingId, 'reject')}
                      >
                        拒绝
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {reviewError && <div className="mt-1 text-[10px] font-bold text-red-700">操作失败：{reviewError}</div>}
        </section>
      )}

      {/* Ready check */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>准备状态</div>
        {iAmActive ? (
          myBindingStatus === 'approved' ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold ${myReady === 'ready' ? 'text-emerald-700' : 'text-slate-600'}`}>
                {myReady === 'ready' ? '我已准备。' : '尚未准备。'}
              </span>
              <button
                type="button"
                className={btn}
                disabled={readyBusy}
                onClick={() => toggleReady(myReady !== 'ready')}
              >
                {readyBusy ? '处理中…' : myReady === 'ready' ? '取消准备' : '我已准备'}
              </button>
            </div>
          ) : (
            <p className="text-[11px] italic text-slate-500">请先提交角色并等待 Host 批准，之后才能准备。</p>
          )
        ) : (
          <p className="text-[11px] italic text-slate-500">成为在线成员后才能设置准备状态。</p>
        )}
        {readyError && <div className="mt-1 text-[10px] font-bold text-red-700">操作失败：{readyError}</div>}
        <div className="mt-2 text-[10px] text-slate-500">下一步：进入跑团桌面预览（只读，非正式 Runtime）。</div>
      </section>

      {/* Runtime Entry Bridge (read-only preview) */}
      {onEnterRuntime && (
        <section className={card}>
          <div className={`mb-1.5 ${label}`}>跑团桌面预览入口</div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btn} disabled={!entryEligibility.canEnter} onClick={handleEnterRuntime}>
              进入跑团桌面预览
            </button>
            {!entryEligibility.canEnter && entryEligibility.reason && (
              <span className="text-[10px] text-slate-500">{ENTRY_BLOCKED_LABEL[entryEligibility.reason]}</span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-amber-700">
            这是只读的 Runtime Entry Bridge 预览，未接入正式 Runtime / 权限 / 日志 / 地图。
            {currentMember?.role === 'host' && '主持人可直接进入主持人预览，但同样未接入正式 Runtime。'}
          </div>
        </section>
      )}

      {/* Host: ready overview (scaffold) */}
      {isHostScaffold && (
        <section className={card}>
          <div className={`mb-1.5 ${label}`}>准备概览（主持人）</div>
          <div className="mb-2 flex flex-wrap gap-4 text-[11px]">
            <span>在线成员 <b className="text-slate-800">{activeCount}</b></span>
            <span>已批准角色 <b className="text-slate-800">{approvedCount}</b></span>
            <span>已准备 <b className="text-slate-800">{readyCount}</b></span>
          </div>
          {groups.active.length > 0 && (
            <div className="space-y-1">
              {groups.active.map((m) => {
                const b = actorBindings.find((x) => x.memberId === m.memberId);
                const r = readyStates.find((x) => x.memberId === m.memberId)?.status ?? 'notReady';
                const cell = b?.status === 'approved' ? READY_LABEL[r] : '无已批准角色';
                const tone = b?.status === 'approved' ? (r === 'ready' ? 'text-emerald-700' : 'text-slate-600') : 'text-amber-700';
                return (
                  <div key={m.memberId} className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-800">{m.displayName}</span>
                    <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{ROLE_LABEL[m.role]}</span>
                    <span className={`ml-auto font-bold ${tone}`}>{cell}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 text-[10px] text-slate-500">下一步：进入正式 Runtime 桌面（后续）。</div>
        </section>
      )}

      {/* Server-side RuntimeLog preview (reuses this lobby's WebSocket). */}
      <RoomRuntimeLogPreviewPanel
        roomId={roomId}
        baseUrl={baseUrl}
        currentMemberId={currentMemberId}
        currentMemberLabel={currentMember?.displayName}
        canAppend={iAmActive}
        liveEvents={logLiveEvents}
        onConsumedLiveEvents={() => setLogLiveEvents([])}
      />

      {/* Host scaffold note */}
      {isHostScaffold && (
        <div className="rounded border border-amber-500/30 bg-amber-50/50 px-2 py-1.5 text-[10px] text-amber-700">
          主持人审批为本地 Room Server / scaffold 阶段操作，后端暂无真实权限 / 鉴权系统，请勿当作安全权限。
          {memberActionError && <div className="mt-1 font-bold text-red-700">操作失败：{memberActionError}</div>}
        </div>
      )}

      <p className="text-[10px] italic text-slate-400">Room Lobby · 未进入 Runtime · 角色绑定 / 准备为大厅草稿（非正式角色实例）· 未实现地图 / 战斗日志 / action intent。</p>
    </div>
  );
}

function Info({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="min-w-[64px] text-[10px] text-slate-500">{k}</span>
      <span className={strong ? 'text-sm font-black text-slate-800' : 'text-[12px] text-slate-700'}>{v}</span>
    </div>
  );
}

interface MemberGroupActions {
  pendingMemberId: string | null;
  onApprove: (memberId: string) => void;
  onReject: (memberId: string) => void;
}

function MemberGroup({
  title,
  members,
  currentMemberId,
  actions,
}: {
  title: string;
  members: RoomMemberIdentity[];
  currentMemberId?: string;
  actions?: MemberGroupActions;
}) {
  if (members.length === 0) return null;
  const btn = 'rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide disabled:opacity-40';
  return (
    <div className="mb-2">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}（{members.length}）</div>
      <div className="space-y-1">
        {members.map((m) => (
          <div key={m.memberId} className="flex flex-wrap items-center gap-2 rounded border border-slate-300/40 bg-white/70 px-2 py-1">
            <span className="font-bold text-slate-800">{m.displayName}</span>
            {m.memberId === currentMemberId && <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">我</span>}
            <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{ROLE_LABEL[m.role]}</span>
            <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{STATUS_LABEL[m.status]}</span>
            <span className="text-[9px] text-slate-400">{shortId(m.memberId)}</span>
            {actions && m.status === 'pendingApproval' && (
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  className={`${btn} border-emerald-500/50 text-emerald-700`}
                  disabled={actions.pendingMemberId === m.memberId}
                  onClick={() => actions.onApprove(m.memberId)}
                >
                  {actions.pendingMemberId === m.memberId ? '处理中…' : '批准'}
                </button>
                <button
                  type="button"
                  className={`${btn} border-red-500/50 text-red-700`}
                  disabled={actions.pendingMemberId === m.memberId}
                  onClick={() => actions.onReject(m.memberId)}
                >
                  拒绝
                </button>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
