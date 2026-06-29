import { useEffect, useMemo, useRef, useState } from 'react';

import {
  approveRoomMemberOnServer,
  getRoomServerRoom,
  rejectRoomMemberOnServer,
  RoomServerHttpError,
  type RoomServerHttpClientConfig,
} from '../../lib/platform/roomServerHttpClient';
import {
  createRoomSocketClient,
  type RoomSocketClient,
  type RoomSocketConnectionState,
} from '../../lib/platform/roomSocketClient';
import type {
  RoomMemberIdentity,
  RoomMemberRole,
  RoomMemberStatus,
  RoomSnapshot,
} from '../../lib/platform/roomTypes';

/**
 * RoomLobbyShell (v0) — platform Room Lobby surface.
 *
 * AI-LANDMARK: ROOM_LOBBY_SHELL_V0
 *
 * The screen a player/host lands on AFTER joining/creating a room: it subscribes
 * to the room over WebSocket and shows live room + member status. This is a LOBBY,
 * NOT Runtime — no actor binding, no ready check, no map/log/combat, no real
 * permission/auth. Host approve/reject are SCAFFOLD operations against the local
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
  onLeaveLobby?: () => void;
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

function shortId(id: string): string {
  return id.length <= 8 ? id : `…${id.slice(-6)}`;
}

export function RoomLobbyShell({
  baseUrl,
  roomId,
  currentMemberId,
  currentRole,
  initialRoom,
  serverLabel,
  onLeaveLobby,
}: RoomLobbyShellProps) {
  const [room, setRoom] = useState<RoomSnapshot | null>(initialRoom ?? null);
  const [connState, setConnState] = useState<RoomSocketConnectionState>('idle');
  const [snapshotMeta, setSnapshotMeta] = useState<SnapshotMeta | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);
  const [httpError, setHttpError] = useState<string | null>(null);
  // Per-member host action state.
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [memberActionError, setMemberActionError] = useState<string | null>(null);

  const config = useMemo<RoomServerHttpClientConfig>(() => ({ baseUrl }), [baseUrl]);
  const clientRef = useRef<RoomSocketClient | null>(null);

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
      onErrorMessage: (message) => {
        setWsError(`${message.code}: ${message.message}`);
      },
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      clientRef.current = null;
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

  const runMemberAction = async (memberId: string, action: 'approve' | 'reject') => {
    setPendingMemberId(memberId);
    setMemberActionError(null);
    try {
      if (action === 'approve') await approveRoomMemberOnServer(config, roomId, memberId);
      else await rejectRoomMemberOnServer(config, roomId, memberId);
      // Prefer the WS roomSnapshot for the update; refresh HTTP as a fallback in
      // case the socket is slow/closed.
      try {
        const snapshot = await getRoomServerRoom(config, roomId);
        setRoom(snapshot);
      } catch {
        // non-fatal: WS broadcast should still update us
      }
    } catch (e) {
      setMemberActionError(
        e instanceof RoomServerHttpError ? `(${e.status}) ${e.message}` : e instanceof Error ? e.message : String(e),
      );
    } finally {
      setPendingMemberId(null);
    }
  };

  const identity = room?.identity;

  const card = 'rounded border border-slate-400/30 bg-white/60 p-3';
  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-600';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';

  return (
    <div className="space-y-4 rounded-lg border border-slate-400/30 bg-slate-50/60 p-4 text-[12px] text-slate-700">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-black text-slate-800">战役房间大厅 · Room Lobby</div>
          <div className="text-[10px] text-slate-500">这是房间大厅，不是正式跑团桌面（Runtime）。角色绑定 / 准备状态 / 进入正式跑团桌面是后续功能。</div>
        </div>
        {onLeaveLobby && (
          <button type="button" className={btn} onClick={onLeaveLobby}>返回加入战役</button>
        )}
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

      {/* Host scaffold note */}
      {isHostScaffold && (
        <div className="rounded border border-amber-500/30 bg-amber-50/50 px-2 py-1.5 text-[10px] text-amber-700">
          主持人审批为本地 Room Server / scaffold 阶段操作，后端暂无真实权限 / 鉴权系统，请勿当作安全权限。
          {memberActionError && <div className="mt-1 font-bold text-red-700">操作失败：{memberActionError}</div>}
        </div>
      )}

      <p className="text-[10px] italic text-slate-400">Room Lobby · 未进入 Runtime · 未绑定角色 · 未实现准备状态 / 地图 / 战斗日志。</p>
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
