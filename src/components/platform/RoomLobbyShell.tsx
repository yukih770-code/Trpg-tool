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
  RoomActorBindingClearanceStatus,
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
type LobbyStepState = 'done' | 'current' | 'waiting';

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
  actorNotAdmitted: '角色尚未通过准入。',
  actorAdmissionRejected: '角色准入已被拒绝。',
  actorAdmissionStale: '角色准入已过期，需要重新提交。',
  memberNotReady: '请先点击「我已准备」。',
  spectatorPreviewOnly: '旁观仅可进入只读跑团桌面。',
  unknown: '暂不可进入跑团桌面。',
};

const CLEARANCE_LABEL: Record<RoomActorBindingClearanceStatus, string> = {
  notSubmitted: '未准入',
  pending: '等待准入',
  approved: '已准入',
  rejected: '准入已拒绝',
  stale: '准入已过期',
};

const CLEARANCE_TONE: Record<RoomActorBindingClearanceStatus, string> = {
  notSubmitted: 'bg-slate-500/10 text-slate-600',
  pending: 'bg-amber-500/15 text-amber-700',
  approved: 'bg-emerald-500/15 text-emerald-700',
  rejected: 'bg-red-500/15 text-red-700',
  stale: 'bg-orange-500/15 text-orange-700',
};

/** Small badge for a binding's clearance summary (undefined = not yet wired). */
function ClearanceBadge({ status }: { status?: RoomActorBindingClearanceStatus }) {
  if (!status) {
    return <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">未接入准入</span>;
  }
  return <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${CLEARANCE_TONE[status]}`}>{CLEARANCE_LABEL[status]}</span>;
}

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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
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
  const myClearanceStatus = myBinding?.clearance?.status;
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
  const pendingMemberCount = groups.pending.length;
  const pendingBindingCount = actorBindings.filter((b) => b.status === 'pendingHostApproval').length;
  const notReadyActiveCount = members.filter((m) => m.status === 'active' && !isMemberFullyReady(m.memberId)).length;
  const memberBinding = (memberId: string) => actorBindings.find((binding) => binding.memberId === memberId);
  const myBindingLabel =
    myBindingStatus === 'approved'
      ? '已绑定'
      : myBindingStatus === 'pendingHostApproval'
        ? '待审批'
        : myBindingStatus === 'rejected'
          ? '需重新提交'
          : '未绑定';
  const myReadyLabel = myReady === 'ready' ? '已准备' : '未准备';
  // Runtime Entry Bridge eligibility (read-only preview; NOT real runtime).
  const entryEligibility = evaluateRoomRuntimeEntryEligibility(room ?? undefined, currentMemberId);
  const playerNextStep =
    myStatus === 'pendingApproval'
      ? '等待主持人批准加入房间。'
      : myStatus !== 'active'
        ? '重新加入或等待主持人处理房间成员状态。'
        : myBindingStatus === 'notSubmitted'
          ? '选择或填写角色信息，并提交给主持人。'
          : myBindingStatus === 'pendingHostApproval'
            ? '等待主持人确认角色绑定。'
            : myClearanceStatus !== 'approved'
              ? '完整角色安检暂未启用；当前等待准入占位通过。'
              : myReady !== 'ready'
                ? '确认后点击“我已准备”。'
                : '等待主持人开始，或进入联机跑团桌面。';
  const lobbySteps: { label: string; detail: string; state: LobbyStepState }[] = [
    {
      label: '加入房间',
      detail: myStatus === 'pendingApproval' ? '等待主持人批准加入房间' : myStatus === 'active' ? '已加入' : '未完成',
      state: myStatus === 'active' ? 'done' : myStatus === 'pendingApproval' ? 'current' : 'waiting',
    },
    {
      label: '绑定角色',
      detail:
        myBindingStatus === 'notSubmitted'
          ? '提交角色给主持人'
          : myBindingStatus === 'rejected'
            ? '修改后重新提交'
            : myBinding?.actorRef.displayName ?? '已提交',
      state: myStatus !== 'active' ? 'waiting' : myBindingStatus === 'notSubmitted' || myBindingStatus === 'rejected' ? 'current' : 'done',
    },
    {
      label: '等待审批',
      detail:
        myBindingStatus === 'pendingHostApproval'
          ? '等待主持人确认角色绑定'
          : myBindingStatus === 'approved'
            ? '已确认'
            : '等待提交角色',
      state: myBindingStatus === 'pendingHostApproval' ? 'current' : myBindingStatus === 'approved' ? 'done' : 'waiting',
    },
    {
      label: '标记准备',
      detail: myReady === 'ready' ? '已准备' : '确认后点击准备',
      state: myReady === 'ready' ? 'done' : myBindingStatus === 'approved' && myClearanceStatus === 'approved' ? 'current' : 'waiting',
    },
    {
      label: '进入桌面',
      detail: entryEligibility.canEnter ? '可进入跑团桌面' : '等待前置条件完成',
      state: entryEligibility.canEnter ? 'current' : 'waiting',
    },
  ];
  const hostQueueItems = [
    ...groups.pending.map((member) => ({
      key: `member-${member.memberId}`,
      player: member.displayName,
      actor: memberBinding(member.memberId)?.actorRef.displayName ?? '未绑定',
      status: '待加入',
      action: '批准 / 拒绝成员',
    })),
    ...actorBindings
      .filter((binding) => binding.status === 'pendingHostApproval')
      .map((binding) => ({
        key: `binding-${binding.bindingId}`,
        player: memberName(binding.memberId),
        actor: binding.actorRef.displayName,
        status: '待角色审批',
        action: '确认 / 拒绝角色',
      })),
    ...members
      .filter((member) => member.status === 'active' && !isMemberFullyReady(member.memberId))
      .map((member) => ({
        key: `ready-${member.memberId}`,
        player: member.displayName,
        actor: memberBinding(member.memberId)?.actorRef.displayName ?? '未绑定',
        status: '未准备',
        action: '等待玩家完成',
      })),
  ];

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
      admissionId: entryEligibility.admissionId,
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
            <div className="text-[10px] text-slate-500">联机大厅：成员加入、角色绑定和准备完成后进入跑团桌面。</div>
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

      <section className={card}>
        <div className={`mb-1.5 ${label}`}>大厅状态</div>
        {identity ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatusPill label="连接" value={CONN_LABEL[connState]} tone={connState === 'open' ? 'ok' : connState === 'error' ? 'bad' : 'warn'} />
            <StatusPill label="我的状态" value={currentMember ? STATUS_LABEL[currentMember.status] : '未匹配'} tone={myStatus === 'active' ? 'ok' : myStatus === 'pendingApproval' ? 'warn' : myStatus === 'kicked' ? 'bad' : 'muted'} />
            <StatusPill label="角色" value={myBindingLabel} tone={myBindingStatus === 'approved' ? 'ok' : myBindingStatus === 'rejected' ? 'bad' : myBindingStatus === 'pendingHostApproval' ? 'warn' : 'muted'} />
            <StatusPill label="准备" value={myReadyLabel} tone={myReady === 'ready' ? 'ok' : 'muted'} />
          </div>
        ) : (
          <div className="text-[11px] italic text-slate-500">正在获取房间快照…</div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span>房间码 <b className="text-slate-800">{identity?.roomCode ?? '—'}</b></span>
          <span className="text-slate-400">/</span>
          <span>{room?.campaignRef?.displayName ?? '无战役关联'}</span>
          <button
            type="button"
            className={`${btn} ml-auto`}
            aria-expanded={showTechnicalDetails}
            onClick={() => setShowTechnicalDetails((value) => !value)}
          >
            {showTechnicalDetails ? '收起技术详情' : '技术详情'}
          </button>
        </div>
        {showTechnicalDetails && (
          <div className="mt-3 rounded border border-slate-300/40 bg-white/70 p-2">
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {identity && (
                <>
                  <Info k="系统" v={identity.systemId} />
                  <Info k="房间状态" v={identity.lifecycleStatus} />
                  <Info k="加入审批" v={room?.joinApprovalMode ?? '—'} />
                  <Info k="roomId" v={shortId(identity.roomId)} />
                  <Info k="服务器" v={serverLabel ?? baseUrl} />
                </>
              )}
              {room?.campaignRef && (
                <>
                  <Info k="战役来源" v={CAMPAIGN_SOURCE_LABEL[room.campaignRef.source]} />
                  {room.campaignRef.campaignId && <Info k="campaignId" v={shortId(room.campaignRef.campaignId)} />}
                  <Info k="战役系统" v={room.campaignRef.systemId} />
                </>
              )}
              {snapshotMeta && (
                <>
                  <Info k="seq" v={String(snapshotMeta.serverSeq)} />
                  <Info k="reason" v={snapshotMeta.reason} />
                  <Info k="sentAt" v={snapshotMeta.sentAt} />
                </>
              )}
            </div>
            {wsError && <div className="mt-2 rounded border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-700">WebSocket：{wsError}</div>}
            {httpError && <div className="mt-2 rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] text-red-700">HTTP：{httpError}</div>}
          </div>
        )}
      </section>

      <section className={card}>
        <div className={`mb-1.5 ${label}`}>{isHostScaffold ? '主持人下一步' : '下一步'}</div>
        {isHostScaffold ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-3">
              <StatusPill label="待批准成员" value={String(pendingMemberCount)} tone={pendingMemberCount > 0 ? 'warn' : 'ok'} />
              <StatusPill label="待审批角色" value={String(pendingBindingCount)} tone={pendingBindingCount > 0 ? 'warn' : 'ok'} />
              <StatusPill label="未准备成员" value={String(notReadyActiveCount)} tone={notReadyActiveCount > 0 ? 'warn' : 'ok'} />
            </div>
            {hostQueueItems.length > 0 ? (
              <div className="space-y-1">
                {hostQueueItems.map((item) => (
                  <div key={item.key} className="flex flex-wrap items-center gap-2 rounded border border-amber-400/30 bg-amber-50/60 px-2 py-1 text-[11px]">
                    <span className="font-bold text-slate-800">{item.player}</span>
                    <span className="text-slate-600">角色：{item.actor}</span>
                    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">{item.status}</span>
                    <span className="ml-auto text-[10px] text-slate-500">{item.action}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] font-bold text-emerald-700">当前没有待处理项。可以进入桌面，或等待玩家陆续准备。</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <PlayerLobbyStepper steps={lobbySteps} />
            <p className="rounded border border-slate-300/40 bg-white/70 px-2 py-1 text-[12px] font-bold text-slate-700">{playerNextStep}</p>
          </div>
        )}
      </section>

      {/* My status */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>我的加入状态</div>
        {myStatus === 'pendingApproval' && <div className="font-bold text-amber-700">等待主持人审批。</div>}
        {myStatus === 'active' && (
          <div>
            <div className="font-bold text-emerald-700">已加入房间。</div>
            <div className="mt-0.5 text-[10px] text-slate-500">下一步：绑定角色、准备，然后进入联机跑团桌面。</div>
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
        <div className={`mb-1.5 ${label}`}>我的角色</div>
        <p className="mb-2 text-[10px] text-slate-500">
          把你准备用于本房间的角色提交给主持人。完整角色安检暂未启用；当前只提交角色身份与绑定草稿，不写入角色库，也不会创建正式战役内角色实例。
        </p>

        <div className="mb-3 rounded border border-slate-300/40 bg-white/70 p-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800">当前绑定：{myBinding?.actorRef.displayName ?? '未绑定'}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${BINDING_TONE[myBindingStatus]}`}>{BINDING_LABEL[myBindingStatus]}</span>
            {myBinding && <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">角色来源：{SOURCE_LABEL[myBinding.actorRef.source]}</span>}
            {myBinding && <ClearanceBadge status={myClearanceStatus} />}
          </div>
          {myBindingStatus === 'pendingHostApproval' && <p className="mt-1 text-amber-700">已提交给主持人，正在等待确认角色绑定。</p>}
          {myBindingStatus === 'approved' && <p className="mt-1 text-emerald-700">主持人已确认角色绑定。</p>}
          {myBindingStatus === 'rejected' && (
            <p className="mt-1 text-red-700">
              角色绑定被拒绝{myBinding?.rejectionReason ? `：${myBinding.rejectionReason}` : ''}。可修改后重新提交。
            </p>
          )}
        </div>

        {iAmActive ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-[220px] flex-col gap-0.5 text-[10px] text-slate-500">角色名
                <input className={input} value={bindingName} onChange={(e) => setBindingName(e.target.value)} placeholder="例如 Elaria / 调查员 / Solo" />
              </label>
              <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">角色来源：手动填写</span>
              <button type="button" className={btn} disabled={bindingBusy || !bindingName.trim()} onClick={submitBinding}>
                {bindingBusy ? '提交中…' : myBinding ? '更新角色绑定' : '提交角色给主持人'}
              </button>
            </div>
            <details className="rounded border border-slate-300/40 bg-white/50 px-2 py-1">
              <summary className="cursor-pointer text-[10px] font-bold text-slate-500">高级 / 可选：角色 ID</summary>
              <label className="mt-2 flex max-w-xs flex-col gap-0.5 text-[10px] text-slate-500">角色 ID（可留空）
                <input className={input} value={bindingActorId} onChange={(e) => setBindingActorId(e.target.value)} placeholder="仅用于未来匹配本地角色库" />
              </label>
            </details>
          </div>
        ) : (
          <p className="text-[10px] italic text-slate-500">成为在线成员后才能提交角色给主持人。</p>
        )}
        {bindingError && <div className="mt-1 text-[10px] font-bold text-red-700">提交失败：{bindingError}</div>}
      </section>

      {/* Host: actor binding review (scaffold) */}
      {isHostScaffold && (
        <section className={card}>
          <div className={`mb-1.5 ${label}`}>待审批角色（主持人）</div>
          <p className="mb-2 text-[10px] text-amber-700">
            当前只是确认玩家提交的角色身份与绑定草稿；完整角色安检暂未启用。批准不会创建正式角色实例，也不会写回角色库。
          </p>
          {actorBindings.length === 0 ? (
            <p className="text-[11px] italic text-slate-500">暂无角色绑定提交。</p>
          ) : (
            <div className="space-y-1">
              {actorBindings.map((b) => (
                <div key={b.bindingId} className="flex flex-wrap items-center gap-2 rounded border border-slate-300/40 bg-white/70 px-2 py-1 text-[11px]">
                  <span className="font-bold text-slate-800">{memberName(b.memberId)}</span>
                  <span className="text-slate-600">→ {b.actorRef.displayName}</span>
                  <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{b.actorRef.systemId}</span>
                  <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{SOURCE_LABEL[b.actorRef.source]}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${BINDING_TONE[b.status]}`}>{BINDING_LABEL[b.status]}</span>
                  <ClearanceBadge status={b.clearance?.status} />
                  <span className="text-[9px] text-slate-400">{b.submittedAt}</span>
                  {b.status === 'pendingHostApproval' && (
                    <span className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        className={`${reviewBtn} border-emerald-500/50 text-emerald-700`}
                        disabled={reviewBindingId === b.bindingId}
                        onClick={() => reviewBinding(b.bindingId, 'approve')}
                      >
                        {reviewBindingId === b.bindingId ? '处理中…' : '确认角色绑定'}
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
            myClearanceStatus === 'approved' ? (
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
              <p className="text-[11px] italic text-amber-700">角色准入占位尚未通过，暂不能准备。完整规则安检将在后续接入。</p>
            )
          ) : (
            <p className="text-[11px] italic text-slate-500">请先提交角色并等待 Host 批准，之后才能准备。</p>
          )
        ) : (
          <p className="text-[11px] italic text-slate-500">成为在线成员后才能设置准备状态。</p>
        )}
        {readyError && <div className="mt-1 text-[10px] font-bold text-red-700">操作失败：{readyError}</div>}
        <div className="mt-2 text-[10px] text-slate-500">下一步：进入联机跑团桌面 Alpha。</div>
      </section>

      {/* Runtime Entry Bridge (Runtime Alpha surface) */}
      {onEnterRuntime && (
        <section className={card}>
          <div className={`mb-1.5 ${label}`}>联机跑团桌面</div>
          {isHostScaffold ? (
            <p className="mb-2 text-[11px] text-slate-600">
              仍有未准备成员：<b>{notReadyActiveCount}</b>；仍有待审批角色：<b>{pendingBindingCount}</b>。
              你可以先进入桌面，也可以等待所有人准备完成。
            </p>
          ) : (
            <p className="mb-2 text-[11px] text-slate-600">
              请先完成角色绑定和准备。如果按钮不可用，说明仍在等待主持人审批，或你尚未准备。
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btn} disabled={!entryEligibility.canEnter} onClick={handleEnterRuntime}>
              进入跑团桌面
            </button>
            {!entryEligibility.canEnter && entryEligibility.reason && (
              <span className="text-[10px] text-slate-500">{ENTRY_BLOCKED_LABEL[entryEligibility.reason]}</span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-amber-700">
            Alpha：这是联机跑团桌面，不是战役详情页；角色实例、权限和结算仍为 v0 边界。
            {currentMember?.role === 'host' && '主持人可直接进入主持人桌面。'}
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
          <div className="mt-2 text-[10px] text-slate-500">下一步：进入联机跑团桌面 Alpha。</div>
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

      <p className="text-[10px] italic text-slate-400">Room Lobby · 联机大厅 · 角色绑定 / 准备为大厅草稿（非正式角色实例）。</p>
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

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'ok' | 'warn' | 'bad' | 'muted';
}) {
  const toneClass =
    tone === 'ok'
      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-800'
      : tone === 'warn'
        ? 'border-amber-400/40 bg-amber-500/10 text-amber-800'
        : tone === 'bad'
          ? 'border-red-400/40 bg-red-500/10 text-red-800'
          : 'border-slate-300/50 bg-slate-500/10 text-slate-700';
  return (
    <div className={`rounded border px-2 py-1 ${toneClass}`}>
      <div className="text-[9px] font-bold uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-0.5 text-[11px] font-black">{value}</div>
    </div>
  );
}

function PlayerLobbyStepper({ steps }: { steps: { label: string; detail: string; state: LobbyStepState }[] }) {
  const tone: Record<LobbyStepState, string> = {
    done: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-800',
    current: 'border-amber-400/50 bg-amber-500/10 text-amber-800',
    waiting: 'border-slate-300/50 bg-white/70 text-slate-500',
  };
  const mark: Record<LobbyStepState, string> = {
    done: '✓',
    current: '•',
    waiting: '○',
  };
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-5">
      {steps.map((step, index) => (
        <div key={step.label} className={`rounded border px-2 py-1 ${tone[step.state]}`}>
          <div className="flex items-center gap-1 text-[10px] font-black">
            <span aria-hidden>{mark[step.state]}</span>
            <span>{index + 1}. {step.label}</span>
          </div>
          <div className="mt-0.5 text-[9px] leading-snug opacity-80">{step.detail}</div>
        </div>
      ))}
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
