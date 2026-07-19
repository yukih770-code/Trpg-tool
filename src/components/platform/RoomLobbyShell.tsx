import { useEffect, useMemo, useState } from 'react';

import {
  approveActorBindingOnRoomServer,
  approveRoomMemberOnServer,
  disbandRoomOnServer,
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
import { resolveDevViewerUserId } from '../../lib/api/apiClient';
import { getCharacterEntryActions, type CharacterEntryActionId } from '../../lib/platform/characterEntryCta';
import {
  listActorVaultRecords,
  type ActorVaultRecord,
  type ActorVaultSystemId,
} from '../../lib/platform/actorVaultRepositoryBridge';
import type {
  RoomActorBindingSource,
  RoomMemberIdentity,
  RoomMemberRole,
  RoomReadyStatus,
  RoomSnapshot,
  RoomSystemId,
} from '../../lib/platform/roomTypes';
import type {
  RoomRuntimeEntryBlockedReason,
  RoomRuntimeEntryContext,
} from '../../lib/platform/roomRuntimeEntryTypes';
import { evaluateRoomRuntimeEntryEligibility } from '../../lib/platform/roomRuntimeEntryGuard';
import { describeRoomPlayerFlow } from '../../lib/platform/roomPlayerFlow';
import { getRoomLobbyPresentationState } from '../../lib/platform/roomLobbyPresentationState';
import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';
import { buildCharacterClearanceDetails, clearanceDetailsFromRoomActorRef } from '../../lib/platform/characterClearanceDetails';
import { resolveRuntimeActorSnapshot } from './runtimeActorSnapshotSource';
import { RoomRuntimeLogPreviewPanel } from './RoomRuntimeLogPreviewPanel';
import { CharacterClearanceDetailsPanel } from './CharacterClearanceDetailsPanel';

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
  /** Opens an existing system character creator. The lobby stays server-authoritative. */
  onOpenFullCharacterCreator?: () => void;
}

interface SnapshotMeta {
  serverSeq: number;
  reason: string;
  sentAt: string;
}

const CONN_LABEL: Record<RoomSocketConnectionState, string> = {
  idle: '未连接',
  connecting: '连接中…',
  open: '已连接',
  closed: '已断开',
  error: '连接错误',
};

const SOURCE_LABEL: Record<RoomActorBindingSource, string> = {
  localActorVault: '本地角色库',
  quickDraft: '快速角色草稿',
  manualScaffold: '手动草稿',
  imported: '导入',
  unknown: '未知',
};

const ENTRY_BLOCKED_LABEL: Record<RoomRuntimeEntryBlockedReason, string> = {
  roomMissing: '房间快照未就绪。',
  roomClosed: '房间已解散，不能进入跑团桌面。',
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

function shortId(id: string): string {
  return id.length <= 8 ? id : `…${id.slice(-6)}`;
}

function errMsg(e: unknown): string {
  return e instanceof RoomServerHttpError ? `(${e.status}) ${e.message}` : e instanceof Error ? e.message : String(e);
}

function isActorVaultSystemId(systemId: RoomSystemId | undefined): systemId is ActorVaultSystemId {
  return systemId === 'dnd5e-2024' || systemId === 'coc7e' || systemId === 'cp-red';
}

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
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
  onOpenFullCharacterCreator,
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
  const [bindingSource, setBindingSource] = useState<RoomActorBindingSource>('quickDraft');
  const [bindingSummary, setBindingSummary] = useState('');
  const [bindingHpCurrent, setBindingHpCurrent] = useState('');
  const [bindingHpMax, setBindingHpMax] = useState('');
  const [bindingArmorClass, setBindingArmorClass] = useState('');
  const [entryActionMode, setEntryActionMode] = useState<'existing' | 'quickDraft' | null>(null);
  const [entryActionNotice, setEntryActionNotice] = useState<string | null>(null);
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
  const [copiedInviteAction, setCopiedInviteAction] = useState<'code' | 'info' | null>(null);
  const [disbandBusy, setDisbandBusy] = useState(false);
  const [disbandError, setDisbandError] = useState<string | null>(null);

  const config = useMemo<RoomServerHttpClientConfig>(() => ({ baseUrl }), [baseUrl]);
  const vaultRecords = useMemo<ActorVaultRecord[]>(() => {
    const systemId = room?.identity.systemId;
    return isActorVaultSystemId(systemId)
      ? listActorVaultRecords(systemId).filter((record) => record.status === 'active')
      : [];
  }, [room?.identity.systemId]);
  const submissionDetails = useMemo(() => {
    const snapshot = bindingSource === 'localActorVault' && bindingActorId.trim()
      ? resolveRuntimeActorSnapshot({ systemId: room?.identity.systemId, actorId: bindingActorId, displayName: bindingName })
      : undefined;
    return buildCharacterClearanceDetails({
      name: bindingName.trim() || '未命名角色',
      sourceType: bindingSource,
      systemId: room?.identity.systemId,
      summary: bindingSummary.trim() || undefined,
      hpCurrent: optionalNumber(bindingHpCurrent),
      hpMax: optionalNumber(bindingHpMax),
      armorClass: optionalNumber(bindingArmorClass),
      snapshot: snapshot?.snapshot,
    });
  }, [bindingActorId, bindingArmorClass, bindingHpCurrent, bindingHpMax, bindingName, bindingSource, bindingSummary, room?.identity.systemId]);

  // WebSocket: connect + subscribe to this room; clean up on unmount.
  useEffect(() => {
    setWsError(null);
    const client = createRoomSocketClient({
      baseUrl,
      localDevViewerUserId: resolveDevViewerUserId(),
      onConnectionStateChange: (state) => {
        setConnState(state);
        if (state === 'open') client.subscribeRoom(roomId, currentMemberId);
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
  }, [baseUrl, currentMemberId, roomId]);

  // HTTP fallback: pull an initial snapshot if none was provided.
  useEffect(() => {
    if (initialRoom) return;
    let cancelled = false;
    getRoomServerRoom(config, roomId, { memberId: currentMemberId })
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
  const roomIsClosed = room?.identity.lifecycleStatus === 'closed' || room?.identity.lifecycleStatus === 'archived';

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
  const myReady: RoomReadyStatus =
    (currentMemberId ? readyStates.find((r) => r.memberId === currentMemberId)?.status : undefined) ?? 'notReady';
  // A ready member only counts when the invariant holds: active + an approved
  // actor binding + readyState 'ready'. Never trust readyStates alone (a stale
  // 'ready' without an approved binding must not inflate the count).
  const isMemberFullyReady = (memberId: string): boolean => {
    const m = members.find((x) => x.memberId === memberId);
    const b = actorBindings.find((x) => x.memberId === memberId);
    const r = readyStates.find((x) => x.memberId === memberId)?.status;
    return m?.status === 'active' && b?.status === 'approved' && r === 'ready';
  };
  const memberName = (id: string) => members.find((m) => m.memberId === id)?.displayName ?? shortId(id);
  const pendingMemberCount = groups.pending.length;
  const pendingBindingCount = actorBindings.filter((b) => b.status === 'pendingHostApproval').length;
  const notReadyActiveCount = members.filter((m) => m.role !== 'host' && m.status === 'active' && !isMemberFullyReady(m.memberId)).length;
  const memberBinding = (memberId: string) => actorBindings.find((binding) => binding.memberId === memberId);
  // Runtime Entry Bridge eligibility (read-only preview; NOT real runtime).
  const entryEligibility = evaluateRoomRuntimeEntryEligibility(room ?? undefined, currentMemberId);
  const presentation = getRoomLobbyPresentationState({
    room: room ?? undefined,
    memberId: currentMemberId,
    canEnterRuntime: entryEligibility.canEnter,
  });
  const pendingReviewBindings = actorBindings.filter((binding) => binding.status === 'pendingHostApproval');
  const reviewQueueCount = pendingMemberCount + pendingReviewBindings.length;
  const visibleRosterMembers = [...members].sort((left, right) => {
    const priority = (member: RoomMemberIdentity): number => {
      if (member.memberId === currentMemberId) return 0;
      if (member.role === 'host') return 1;
      if (member.status === 'pendingApproval') return 3;
      if (member.role === 'spectator') return 4;
      return 2;
    };
    return priority(left) - priority(right) || left.displayName.localeCompare(right.displayName);
  });

  const handleEnterRuntime = () => {
    if (roomIsClosed || !room || !currentMember || !currentMemberId || !entryEligibility.canEnter || !entryEligibility.entryMode) return;
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
      setRoom(await getRoomServerRoom(config, roomId, { memberId: currentMemberId }));
    } catch {
      // non-fatal: WS broadcast remains the source of truth
    }
  };

  const runMemberAction = async (memberId: string, action: 'approve' | 'reject') => {
    setPendingMemberId(memberId);
    setMemberActionError(null);
    try {
      if (!currentMemberId) throw new Error('需要主持人成员身份才能处理加入申请。');
      if (action === 'approve') await approveRoomMemberOnServer(config, roomId, memberId, currentMemberId);
      else await rejectRoomMemberOnServer(config, roomId, memberId, currentMemberId);
      await refreshSnapshot();
    } catch (e) {
      setMemberActionError(errMsg(e));
    } finally {
      setPendingMemberId(null);
    }
  };

  const submitBinding = async () => {
    if (!currentMemberId) return;
    if (roomIsClosed) {
      setBindingError('房间已解散，不能继续提交角色。');
      return;
    }
    if (!iAmActive) {
      setBindingError('请等待主持人批准加入房间后再提交角色。');
      return;
    }
    setBindingBusy(true);
    setBindingError(null);
    try {
      await submitActorBindingToRoomServer(config, roomId, {
        memberId: currentMemberId,
        actorRef: {
          displayName: bindingName.trim(),
          actorId: bindingActorId.trim() || undefined,
          systemId: room?.identity.systemId,
          source: bindingSource,
          summary: bindingSummary.trim() || undefined,
          hpCurrent: optionalNumber(bindingHpCurrent),
          hpMax: optionalNumber(bindingHpMax),
          armorClass: optionalNumber(bindingArmorClass),
          details: submissionDetails,
        },
      });
      await refreshSnapshot();
    } catch (e) {
      setBindingError(errMsg(e));
    } finally {
      setBindingBusy(false);
    }
  };

  const selectVaultActor = (actorId: string) => {
    const actor = vaultRecords.find((record) => record.id === actorId);
    if (!actor) return;
    setBindingActorId(actor.id);
    setBindingName(actor.displayName);
    setBindingSummary(actor.subtitle ?? '');
    setBindingSource('localActorVault');
    setEntryActionMode('existing');
  };

  const handleEntryAction = (actionId: CharacterEntryActionId) => {
    setBindingError(null);
    if (actionId === 'existing') {
      setEntryActionMode('existing');
      setEntryActionNotice(vaultRecords.length > 0
        ? '从本地角色库选择一名与当前系统兼容的角色。'
        : '本地角色库中还没有可用角色；可以创建快速角色或打开完整车卡创建。');
      return;
    }
    if (actionId === 'quickDraft') {
      setBindingActorId('');
      setBindingSource('quickDraft');
      setEntryActionMode('quickDraft');
      setEntryActionNotice('快速角色只用于当前房间的入场申请，不会写入角色库。');
      return;
    }
    if (actionId === 'skipHostCharacter') {
      setEntryActionMode(null);
      setEntryActionNotice('主持人可直接主持；不提交角色不会影响主持人进入桌面。');
      return;
    }
    if (actionId === 'spectator') {
      setEntryActionNotice('请返回加入页并选择「以旁观者加入」。旁观者不需要角色，也不能提交入场角色。');
      return;
    }
    if (onOpenFullCharacterCreator) {
      setEntryActionNotice('正在打开完整车卡创建。完成后请使用页面返回回到此大厅，再从本地角色库选择新角色。');
      onOpenFullCharacterCreator();
      return;
    }
    setEntryActionNotice('当前系统尚未接通完整车卡创建。你仍可选择已有角色或创建快速角色。');
  };

  const reviewBinding = async (bindingId: string, action: 'approve' | 'reject') => {
    setReviewBindingId(bindingId);
    setReviewError(null);
    try {
      if (action === 'approve') await approveActorBindingOnRoomServer(config, roomId, bindingId, currentMemberId);
      else {
        const rejectionReason = window.prompt('可选：告诉玩家需要调整什么。')?.trim() || undefined;
        await rejectActorBindingOnRoomServer(config, roomId, bindingId, currentMemberId, rejectionReason);
      }
      await refreshSnapshot();
    } catch (e) {
      setReviewError(errMsg(e));
    } finally {
      setReviewBindingId(null);
    }
  };

  const toggleReady = async (ready: boolean) => {
    if (!currentMemberId) return;
    if (roomIsClosed) {
      setReadyError('房间已解散，不能再更改 Ready 状态。');
      return;
    }
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
  const handleDisbandRoom = async () => {
    if (!currentMemberId || roomIsClosed) return;
    const confirmed = window.confirm('确认解散房间？解散后，玩家将无法继续加入或进入该房间；历史记录不会被删除。');
    if (!confirmed) return;
    setDisbandBusy(true);
    setDisbandError(null);
    try {
      const result = await disbandRoomOnServer(config, roomId, currentMemberId);
      if (result.room) setRoom(result.room);
      else await refreshSnapshot();
    } catch (error) {
      setDisbandError(errMsg(error));
    } finally {
      setDisbandBusy(false);
    }
  };
  const inviteText = [
    room?.campaignRef?.displayName ? `战役：${room.campaignRef.displayName}` : '战役：联机房间',
    `房间码：${identity?.roomCode ?? '—'}`,
    `房间服务：${serverLabel ?? baseUrl}`,
    '请在“加入战役 / 加入房间”中输入房间码，进入联机大厅后完成角色绑定、ready 和主持人审批。',
  ].join('\n');
  const copyInviteText = async (kind: 'code' | 'info') => {
    const text = kind === 'code' ? identity?.roomCode : inviteText;
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedInviteAction(kind);
      window.setTimeout(() => setCopiedInviteAction(null), 1600);
    } catch {
      setCopiedInviteAction(null);
    }
  };

  const card = 'rounded border border-slate-400/30 bg-white/60 p-3';
  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-600';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';
  const input = 'rounded border border-slate-400/40 bg-white/70 px-2 py-1 text-[12px] outline-none';
  const reviewBtn = 'rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide disabled:opacity-40';
  const submitCharacterBtn = 'rounded border border-amber-600 bg-amber-500 px-4 py-2 text-[12px] font-black text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="space-y-4 rounded-lg border border-slate-400/30 bg-slate-50/60 p-4 text-[12px] text-slate-700">
      {/* Header actions stay source-aware, while the default content remains product-facing. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {backHandler && (
            <button type="button" className={btn} onClick={backHandler}>← {backLabel ?? '返回'}</button>
          )}
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-800">
              联机大厅
              {identity?.roomCode ? <span className="ml-2 text-slate-500">#{identity.roomCode}</span> : null}
            </div>
            <div className="text-[10px] text-slate-500">{room?.campaignRef?.displayName ?? '等待房间信息同步'}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isHostScaffold && identity && !roomIsClosed && (
            <button type="button" className={btn} onClick={() => void copyInviteText('code')}>
              {copiedInviteAction === 'code' ? '已复制房间码' : '复制房间码'}
            </button>
          )}
          {isHostScaffold && !roomIsClosed && (
            <button type="button" className="rounded border border-red-400/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700 disabled:opacity-40" disabled={disbandBusy} onClick={() => void handleDisbandRoom()}>
              {disbandBusy ? '解散中…' : '解散房间'}
            </button>
          )}
          {exitHandler && (
            <button type="button" className={btn} onClick={exitHandler}>{exitLabel ?? '离开大厅'}</button>
          )}
        </div>
      </div>


      <section className={`${card} border-sky-400/30 bg-sky-50/50`}>
        <div className={`mb-1.5 ${label}`}>我的下一步</div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-[220px] flex-1">
            <div className="font-black text-slate-900">{presentation.stateLabel}</div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-700">{presentation.primaryMessage}</p>
            <p className="mt-1 text-[10px] text-slate-500">{presentation.nextStepMessage}</p>
          </div>
          {isHostScaffold && !roomIsClosed && (
            <div className="grid min-w-[220px] grid-cols-2 gap-1.5 text-[10px]">
              <span className="rounded bg-white/70 px-2 py-1">待处理 {reviewQueueCount} 项</span>
              <span className="rounded bg-white/70 px-2 py-1">等待加入 {pendingMemberCount}</span>
              <span className="rounded bg-white/70 px-2 py-1">角色申请 {pendingBindingCount}</span>
              <span className="rounded bg-white/70 px-2 py-1">未准备 {notReadyActiveCount}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-300/40 pt-3">
          {presentation.canShowReadyAction && (
            <button type="button" className={btn} disabled={readyBusy} onClick={() => toggleReady(myReady !== 'ready')}>
              {readyBusy ? '处理中…' : myReady === 'ready' ? '取消 Ready' : '我已准备'}
            </button>
          )}
          {onEnterRuntime && presentation.canShowRuntimeEntry && (
            <button type="button" className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white disabled:opacity-40" disabled={!entryEligibility.canEnter} onClick={handleEnterRuntime}>
              进入跑团桌面
            </button>
          )}
          {presentation.canShowRuntimeEntry && !entryEligibility.canEnter && entryEligibility.reason && (
            <span className="text-[10px] text-slate-500">{ENTRY_BLOCKED_LABEL[entryEligibility.reason]}</span>
          )}
          {roomIsClosed && (backHandler || exitHandler) && (
            <button type="button" className={btn} onClick={backHandler ?? exitHandler}>返回房间列表</button>
          )}
          {readyError && <span className="text-[10px] font-bold text-red-700">操作失败：{readyError}</span>}
          {disbandError && <span className="text-[10px] font-bold text-red-700">解散失败：{disbandError}</span>}
        </div>
      </section>

      <section className={card}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className={label}>玩家槽位 · 已加入 {members.length} 人</div>
          <span className="text-[10px] text-slate-500">查看谁已加入、谁仍在等待。</span>
        </div>
        <div className="space-y-1.5">
          {visibleRosterMembers.map((member) => {
            const binding = memberBinding(member.memberId);
            const isMe = member.memberId === currentMemberId;
            const flow = describeRoomPlayerFlow(room ?? undefined, member.memberId);
            const status = member.status !== 'active'
              ? '等待加入'
              : member.role === 'host'
                ? '主持人'
                : member.role === 'spectator'
                  ? '旁观'
                  : isMemberFullyReady(member.memberId)
                    ? '已准备'
                    : flow.state === 'waitingForHostReview'
                      ? '等待审核'
                      : binding?.status === 'approved'
                        ? '待准备'
                        : '等待角色';
            return (
              <div key={member.memberId} className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded border px-2.5 py-2 ${
                isMe ? 'border-sky-400/50 bg-sky-50/60' : member.status === 'pendingApproval' ? 'border-amber-400/40 bg-amber-50/50' : 'border-slate-300/50 bg-white/70'
              }`}>
                <span className="font-bold text-slate-900">{member.displayName}</span>
                {isMe && <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">我</span>}
                <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">{status}</span>
                <span className="min-w-0 truncate text-[10px] text-slate-500">
                  {member.role === 'spectator' ? '旁观席' : binding?.actorRef.displayName ?? '尚未选择角色'}
                </span>
              </div>
            );
          })}
          <div className="rounded border border-dashed border-slate-300/60 bg-white/40 px-2.5 py-2 text-[10px] text-slate-400">空位 · 等待玩家加入</div>
        </div>
      </section>

      {/* Character entry is shown only for people who can act on it now. */}
      {presentation.canShowCharacterEntry && (
      <section className={`${card} border-amber-400/45 bg-amber-50/35`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className={`mb-1.5 ${label}`}>入场角色</div>
            <div className="text-sm font-black text-slate-900">选择角色并提交审核</div>
          </div>
          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-800">提交后等待主持人确认</span>
        </div>
        <p className="mb-2 text-[10px] text-slate-500">
          {iAmActive
            ? '请选择已有角色、创建快速角色，或以旁观者加入。提交后等待主持人审核。'
            : '主持人批准加入后即可选择并提交角色。'}
        </p>

        <div className="mb-3 flex flex-wrap gap-2">
          {getCharacterEntryActions(currentMember?.role).map((action) => (
            <button
              key={action.id}
              type="button"
              className={`${btn} ${action.id === 'existing' ? 'border-slate-800 bg-slate-800 text-white hover:bg-slate-700' : action.id === 'quickDraft' ? 'border-amber-500/70 bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-white/70 text-slate-700 hover:bg-white'}`}
              onClick={() => handleEntryAction(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
        {entryActionNotice && <p className="mb-3 rounded border border-slate-300/50 bg-white/70 px-2 py-1.5 text-[10px] text-slate-600">{entryActionNotice}</p>}

        <div className="space-y-2">
            {entryActionMode === 'existing' && vaultRecords.length > 0 && (
              <label className="flex max-w-md flex-col gap-0.5 text-[10px] text-slate-500">从本地角色库选择
                <select
                  className={input}
                  value={bindingSource === 'localActorVault' ? bindingActorId : ''}
                  onChange={(event) => selectVaultActor(event.target.value)}
                >
                  <option value="">选择已有角色</option>
                  {vaultRecords.map((actor) => <option key={actor.id} value={actor.id}>{actor.displayName}{actor.subtitle ? ` · ${actor.subtitle}` : ''}</option>)}
                </select>
              </label>
            )}
            {entryActionMode === 'existing' && vaultRecords.length === 0 && (
              <p className="text-[10px] italic text-slate-500">当前系统没有可选的本地角色。可创建快速角色，或完成完整车卡创建后返回此处选择。</p>
            )}
            {entryActionMode === 'existing' && bindingName.trim() && (
              <div className="rounded border border-slate-300/40 bg-white/50 px-2 py-1.5 text-[10px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-700">已选择：{bindingName}</span>
                  <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 font-bold text-slate-600">{SOURCE_LABEL[bindingSource]}</span>
                  <button type="button" className={submitCharacterBtn} disabled={bindingBusy || !iAmActive} onClick={submitBinding}>
                    {bindingBusy ? '提交中…' : iAmActive ? (myBinding ? '更新入场角色' : currentMember?.role === 'host' ? '提交主持人角色' : '提交角色申请') : '等待加入批准后提交'}
                  </button>
                </div>
                <CharacterClearanceDetailsPanel title="将提交给主持人的角色信息" details={submissionDetails} />
              </div>
            )}
            {entryActionMode === 'quickDraft' && <div className="flex flex-wrap items-end gap-2">
              <label className="flex min-w-[220px] flex-col gap-0.5 text-[10px] text-slate-500">角色名
                <input className={input} value={bindingName} onChange={(e) => { setBindingName(e.target.value); if (bindingSource === 'localActorVault') setBindingSource('quickDraft'); }} placeholder="例如 Elaria / 调查员 / Solo" />
              </label>
              <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">角色来源：{SOURCE_LABEL[bindingSource]}</span>
              <button type="button" className={submitCharacterBtn} disabled={bindingBusy || !bindingName.trim() || !iAmActive} onClick={submitBinding}>
                {bindingBusy ? '提交中…' : iAmActive ? (myBinding ? '更新入场角色' : currentMember?.role === 'host' ? '提交主持人角色' : '提交角色申请') : '等待加入批准后提交'}
              </button>
            </div>}
            {entryActionMode === 'quickDraft' && <details open className="rounded border border-slate-300/40 bg-white/50 px-2 py-1">
              <summary className="cursor-pointer text-[10px] font-bold text-slate-500">快速角色摘要（可选）</summary>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
                <label className="sm:col-span-4 flex flex-col gap-0.5 text-[10px] text-slate-500">简短说明
                  <input className={input} value={bindingSummary} onChange={(e) => setBindingSummary(e.target.value)} placeholder="例如：1 级游侠，擅长侦察" />
                </label>
                <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">当前 HP
                  <input className={input} inputMode="decimal" value={bindingHpCurrent} onChange={(e) => setBindingHpCurrent(e.target.value)} />
                </label>
                <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">最大 HP
                  <input className={input} inputMode="decimal" value={bindingHpMax} onChange={(e) => setBindingHpMax(e.target.value)} />
                </label>
                <label className="flex flex-col gap-0.5 text-[10px] text-slate-500">AC / 防护
                  <input className={input} inputMode="decimal" value={bindingArmorClass} onChange={(e) => setBindingArmorClass(e.target.value)} />
                </label>
              </div>
              <label className="mt-2 flex max-w-xs flex-col gap-0.5 text-[10px] text-slate-500">角色 ID（可选）
                <input className={input} value={bindingActorId} onChange={(e) => { setBindingActorId(e.target.value); setBindingSource('quickDraft'); }} placeholder="仅用于本地角色库匹配" />
              </label>
            </details>}
            {entryActionMode === 'quickDraft' && bindingName.trim() && (
              <div className="rounded border border-slate-300/40 bg-white/50 px-2 py-1.5">
                <CharacterClearanceDetailsPanel title="将提交给主持人的角色信息" details={submissionDetails} />
                <p className="mt-1 text-[10px] text-slate-500">快速角色不会写入角色库；缺少装备或特性信息允许提交，但主持人可要求补充。</p>
              </div>
            )}
          {!iAmActive && <p className="text-[10px] italic text-slate-500">你可以先选择或创建角色；成为在线成员后即可提交给主持人。若想旁观，请返回加入页选择旁观者。</p>}
        </div>
        {bindingError && <div className="mt-1 text-[10px] font-bold text-red-700">提交失败：{bindingError}</div>}
      </section>
      )}

      {presentation.shouldShowHostReviewQueue && isHostScaffold && (
        <section className={card}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className={label}>主持人待处理</div>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800">待处理 {reviewQueueCount} 项</span>
          </div>
          {reviewQueueCount === 0 ? (
            <p className="text-[11px] text-emerald-700">当前没有待处理项。你可以进入桌面，或等待玩家陆续准备。</p>
          ) : (
            <div className="space-y-2">
              {groups.pending.map((member) => (
                <div key={`member-${member.memberId}`} className="flex flex-wrap items-center gap-2 rounded border border-amber-400/30 bg-amber-50/60 px-2 py-1.5 text-[11px]">
                  <span className="font-bold text-slate-800">{member.displayName}</span>
                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">加入房间</span>
                  <span className="text-[10px] text-slate-500">等待加入审批</span>
                  <span className="ml-auto flex items-center gap-1">
                    <button type="button" className={`${reviewBtn} border-emerald-500/50 text-emerald-700`} disabled={pendingMemberId === member.memberId} onClick={() => runMemberAction(member.memberId, 'approve')}>
                      {pendingMemberId === member.memberId ? '处理中…' : '批准'}
                    </button>
                    <button type="button" className={`${reviewBtn} border-red-500/50 text-red-700`} disabled={pendingMemberId === member.memberId} onClick={() => runMemberAction(member.memberId, 'reject')}>拒绝</button>
                  </span>
                </div>
              ))}
              {pendingReviewBindings.map((binding) => (
                <div key={binding.bindingId} className="rounded border border-amber-400/30 bg-amber-50/60 px-2 py-1.5 text-[11px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-800">{memberName(binding.memberId)}</span>
                    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">角色申请</span>
                    <span className="text-slate-600">{binding.actorRef.displayName}</span>
                    {binding.actorRef.summary && <span className="max-w-[180px] truncate text-[10px] text-slate-500">{binding.actorRef.summary}</span>}
                    {binding.actorRef.hpMax !== undefined && <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">HP {binding.actorRef.hpCurrent ?? binding.actorRef.hpMax}/{binding.actorRef.hpMax}</span>}
                    {binding.actorRef.armorClass !== undefined && <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">AC {binding.actorRef.armorClass}</span>}
                    <span className="ml-auto flex items-center gap-1">
                      <button type="button" className={`${reviewBtn} border-emerald-500/50 text-emerald-700`} disabled={reviewBindingId === binding.bindingId} onClick={() => reviewBinding(binding.bindingId, 'approve')}>
                        {reviewBindingId === binding.bindingId ? '处理中…' : '批准'}
                      </button>
                      <button type="button" className={`${reviewBtn} border-red-500/50 text-red-700`} disabled={reviewBindingId === binding.bindingId} onClick={() => reviewBinding(binding.bindingId, 'reject')}>拒绝</button>
                    </span>
                  </div>
                  <CharacterClearanceDetailsPanel details={binding.actorRef.details ?? clearanceDetailsFromRoomActorRef(binding.actorRef)} />
                </div>
              ))}
            </div>
          )}
          {memberActionError && <div className="mt-2 text-[10px] font-bold text-red-700">操作失败：{memberActionError}</div>}
          {reviewError && <div className="mt-2 text-[10px] font-bold text-red-700">操作失败：{reviewError}</div>}
        </section>
      )}

      <details className="rounded border border-slate-400/25 bg-white/40 p-3">
        <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wide text-slate-500">
          技术详情
        </summary>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 rounded border border-slate-300/40 bg-white/70 p-2 sm:grid-cols-2">
            {identity && (
              <>
                <Info k="系统" v={identity.systemId} />
                <Info k="房间状态" v={identity.lifecycleStatus} />
                <Info k="加入方式" v={room?.joinApprovalMode ?? '—'} />
                <Info k="房间 ID" v={shortId(identity.roomId)} />
                <Info k="服务器" v={serverLabel ?? baseUrl} />
              </>
            )}
            {room?.campaignRef && (
              <>
                <Info k="来源" v={`${originLabel ?? '战役'} / ${originDetail ?? room.campaignRef.displayName ?? '—'}`} />
                <Info k="战役系统" v={room.campaignRef.systemId} />
              </>
            )}
            <Info k="连接" v={CONN_LABEL[connState]} />
            {snapshotMeta && <Info k="事件序号" v={String(snapshotMeta.serverSeq)} />}
          </div>
          {isHostScaffold && identity && !roomIsClosed && (
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
              <button type="button" className={btn} onClick={() => void copyInviteText('info')}>
                {copiedInviteAction === 'info' ? '已复制邀请信息' : '复制邀请信息'}
              </button>
              <span>把房间码发送给要加入的成员。</span>
            </div>
          )}
          {wsError && <div className="rounded border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-700">连接信息：{wsError}</div>}
          {httpError && <div className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] text-red-700">请求信息：{httpError}</div>}
          <RoomRuntimeLogPreviewPanel
            roomId={roomId}
            baseUrl={baseUrl}
            currentMemberId={currentMemberId}
            currentMemberLabel={currentMember?.displayName}
            canAppend={iAmActive && !roomIsClosed}
            liveEvents={logLiveEvents}
            onConsumedLiveEvents={() => setLogLiveEvents([])}
          />
        </div>
      </details>
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
