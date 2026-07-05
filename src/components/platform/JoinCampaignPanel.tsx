import { useEffect, useState } from 'react';

import {
  fetchRoomServerHealth,
  joinRoomOnServer,
  listRoomServerRooms,
  RoomServerHttpError,
  type RoomServerHttpClientConfig,
  type RoomServerRoomListItem,
} from '../../lib/platform/roomServerHttpClient';
import type { RoomJoinRequirement } from '../../lib/platform/roomDiscoveryTypes';
import {
  canDisplayDiscoveredRoomForSystem,
  mapRoomServerRoomsToDiscovered,
} from '../../lib/platform/roomDiscoveryMapper';
import type { RoomJoinResult, RoomMemberRole, RoomSnapshot, RoomSystemId } from '../../lib/platform/roomTypes';
import type { RoomRuntimeEntryContext } from '../../lib/platform/roomRuntimeEntryTypes';
import { roomServerHttpUrl } from '../../lib/platform/roomServerConfig';
import { RoomLobbyShell } from './RoomLobbyShell';
import { RoomRuntimeEntryBridge } from './RoomRuntimeEntryBridge';
import { RoomServerStatusBanner } from './RoomServerStatusBanner';

/**
 * JoinCampaignPanel (v0) — "加入战役" surface.
 *
 * AI-LANDMARK: JOIN_CAMPAIGN_PANEL_V0
 *
 * Frontend shell to discover/join rooms from a portable Room Server (HTTP), then
 * hand off to RoomLobbyShell. This panel itself is HTTP-only (discover / create /
 * join); RoomLobbyShell owns the WebSocket live member status, the lobby-level
 * actor-binding drafts, and the ready check. Currently only LAN / local Room
 * Server is real; official & third-party sources are placeholders. No LAN
 * discovery, and no Runtime / RuntimeLog / map-token yet. System-agnostic (uses
 * systemId, not DND-specific concepts).
 */

// Default Room Server address comes from env (roomServerConfig): localhost for
// local dev, or the deployed cloud Room Server on Netlify. The user can still
// override it in the address input below.
const DEFAULT_BASE_URL = roomServerHttpUrl;

function normalizeJoinError(error: unknown): { message: string; detail: string } {
  const detail = error instanceof RoomServerHttpError ? `(${error.status}) ${error.message}` : error instanceof Error ? error.message : String(error);
  const lower = detail.toLowerCase();
  if (error instanceof RoomServerHttpError && error.status === 0) {
    return {
      message: '无法连接房间服务：请确认你和主持人在同一局域网，且主持人已开启房间。',
      detail,
    };
  }
  if (lower.includes('not found') || lower.includes('invalid') || (error instanceof RoomServerHttpError && error.status === 404)) {
    return {
      message: '找不到这个房间：请检查房间码是否正确。',
      detail,
    };
  }
  if (lower.includes('closed')) {
    return {
      message: '房间已关闭：请让主持人重新创建联机房间。',
      detail,
    };
  }
  return {
    message: '加入房间失败：请稍后重试，或请主持人确认房间仍然开放。',
    detail,
  };
}

export interface JoinCampaignPanelProps {
  systemId?: RoomSystemId;
  tone?: string;
  panelClassName?: string;
  onBackOverrideChange?: (override: { label?: string; onBack: () => void } | null) => void;
}

export function JoinCampaignPanel({ systemId, panelClassName, onBackOverrideChange }: JoinCampaignPanelProps) {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [rooms, setRooms] = useState<RoomServerRoomListItem[]>([]);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [diagnosticDetail, setDiagnosticDetail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('玩家');
  const [joinResult, setJoinResult] = useState<RoomJoinResult | null>(null);
  // After create/join, enter the Room Lobby (NOT Runtime).
  const [lobby, setLobby] = useState<{
    baseUrl: string;
    roomId: string;
    currentMemberId?: string;
    currentRole?: RoomMemberRole;
    initialRoom?: RoomSnapshot;
    origin: 'joinCampaign';
  } | null>(null);
  // Read-only Runtime Entry Preview (bridge), entered from the lobby.
  const [runtimeEntry, setRuntimeEntry] = useState<{ context: RoomRuntimeEntryContext; room: RoomSnapshot } | null>(null);

  useEffect(() => {
    if (!onBackOverrideChange) return;

    if (runtimeEntry) {
      onBackOverrideChange({
        label: '返回房间大厅',
        onBack: () => setRuntimeEntry(null),
      });
      return () => onBackOverrideChange(null);
    }

    if (lobby) {
      onBackOverrideChange({
        label: '返回加入战役',
        onBack: () => setLobby(null),
      });
      return () => onBackOverrideChange(null);
    }

    onBackOverrideChange(null);
    return () => onBackOverrideChange(null);
  }, [lobby, runtimeEntry, onBackOverrideChange]);

  const config: RoomServerHttpClientConfig = { baseUrl };

  const run = async (fn: () => Promise<void>, surface: 'join' | 'diagnostic' = 'join') => {
    setBusy(true);
    if (surface === 'join') {
      setError(null);
      setErrorDetail(null);
    } else {
      setDiagnosticError(null);
      setDiagnosticDetail(null);
    }
    try {
      await fn();
    } catch (e) {
      const normalized = normalizeJoinError(e);
      if (surface === 'join') {
        setError(normalized.message);
        setErrorDetail(normalized.detail);
      } else {
        setHealthOk(false);
        setDiagnosticError(normalized.message);
        setDiagnosticDetail(normalized.detail);
      }
    } finally {
      setBusy(false);
    }
  };

  const checkConnection = () => run(async () => { await fetchRoomServerHealth(config); setHealthOk(true); }, 'diagnostic');
  const refreshRooms = () => run(async () => { setRooms(await listRoomServerRooms(config)); setHealthOk(true); }, 'diagnostic');
  const doJoin = (code: string) => run(async () => {
    const result = await joinRoomOnServer(config, { inviteCodeOrRoomCode: code.trim(), requestedDisplayName: joinName.trim() || 'Player' });
    setJoinResult(result);
    // Enter the lobby once we have a room to subscribe to (accepted or pending).
    if (result.roomId && (result.decision === 'accepted' || result.decision === 'pendingHostApproval')) {
      setLobby({
        baseUrl,
        roomId: result.roomId,
        currentMemberId: result.memberId,
        currentRole: result.assignedRole,
        // No initialRoom for joins: RoomLobbyShell pulls a snapshot over HTTP/WS.
        origin: 'joinCampaign',
      });
    }
  });

  // Boundary: never render the raw Room Server list. Map to DiscoveredRoomSummary,
  // then filter to the CURRENT system only (exact match v0).
  const LOCAL_SERVER_LABEL = '本地 Room Server';
  const discoveredRooms = mapRoomServerRoomsToDiscovered(rooms, {
    source: 'lan',
    serverBaseUrl: baseUrl,
    serverLabel: LOCAL_SERVER_LABEL,
  }).filter((room) => !systemId || canDisplayDiscoveredRoomForSystem(room, systemId));

  const JOIN_REQUIREMENT_LABEL: Record<RoomJoinRequirement, string> = {
    open: '开放加入',
    roomCodeRequired: '需要房间码',
    hostApprovalRequired: '需要主持人审批',
    inviteOnly: '仅邀请',
  };

  const roomStatusLabel = (status: string) => {
    if (status === 'open') return '大厅中';
    if (status === 'inSession') return '跑团中';
    if (status === 'paused') return '已暂停';
    if (status === 'closed') return '已关闭';
    if (status === 'draft') return '准备中';
    return '待同步';
  };

  const input = 'rounded border border-slate-400/40 bg-white/70 px-2 py-1 text-[12px] outline-none';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';

  if (runtimeEntry) {
    return (
      <div className={panelClassName ?? 'rounded-lg border border-slate-400/30 bg-slate-50/60 p-4'}>
        <RoomRuntimeEntryBridge
          context={runtimeEntry.context}
          room={runtimeEntry.room}
          serverLabel={LOCAL_SERVER_LABEL}
          onBackToLobby={() => setRuntimeEntry(null)}
        />
      </div>
    );
  }

  if (lobby) {
    return (
      <div className={panelClassName ?? 'rounded-lg border border-slate-400/30 bg-slate-50/60 p-4'}>
        <RoomLobbyShell
          baseUrl={lobby.baseUrl}
          roomId={lobby.roomId}
          currentMemberId={lobby.currentMemberId}
          currentRole={lobby.currentRole}
          initialRoom={lobby.initialRoom}
          serverLabel={LOCAL_SERVER_LABEL}
          backLabel="返回加入战役"
          onBackToOrigin={() => setLobby(null)}
          exitLabel="离开房间视图"
          onExitRoom={() => setLobby(null)}
          originLabel="加入战役"
          originDetail="你已进入联机大厅。请绑定角色并等待主持人审批。"
          onEnterRuntime={(payload) => setRuntimeEntry(payload)}
        />
      </div>
    );
  }

  return (
    <div className={panelClassName ?? 'rounded-lg border border-slate-400/30 bg-slate-50/60 p-4'}>
      <section className="rounded border border-slate-400/30 bg-white/80 p-4 text-[12px] text-slate-700">
        <div className="text-base font-black text-slate-900">加入联机大厅</div>
        <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-500">
          选择一个可加入的大厅，或输入主持人提供的房间码。加入后会先进入联机大厅，在那里绑定角色、ready，并等待主持人审批。
        </p>
      </section>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
        <section className="rounded border border-slate-400/25 bg-white/55 p-3 text-[12px] text-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[12px] font-black text-slate-800">可加入的大厅</div>
              <p className="mt-0.5 text-[10px] text-slate-500">
                仅显示当前系统（{systemId ?? '未指定'}）可加入的本地大厅。
              </p>
            </div>
            <button type="button" className={btn} disabled={busy} onClick={refreshRooms}>刷新大厅</button>
          </div>

          {healthOk === false && discoveredRooms.length === 0 ? (
            <div className="mt-3 rounded border border-slate-300/50 bg-white/70 p-3 text-[11px] leading-relaxed text-slate-600">
              <div className="font-bold text-slate-700">暂时无法发现局域网大厅。</div>
              <p className="mt-0.5">请确认主持人已经创建房间，且你们在同一局域网。你也可以输入房间码后重试。</p>
            </div>
          ) : rooms.length > 0 && discoveredRooms.length === 0 ? (
            <div className="mt-3 rounded border border-slate-300/50 bg-white/70 p-3 text-[11px] leading-relaxed text-slate-600">
              房间服务中有大厅，但没有匹配当前系统的大厅。你仍然可以输入主持人提供的房间码加入。
            </div>
          ) : discoveredRooms.length === 0 ? (
            <div className="mt-3 rounded border border-slate-300/50 bg-white/70 p-3 text-[11px] leading-relaxed text-slate-600">
              <div className="font-bold text-slate-700">暂未发现可加入大厅。</div>
              <p className="mt-0.5">你仍然可以输入主持人提供的房间码加入。</p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-2">
              {discoveredRooms.map((room) => {
                const roomTitle = room.displayName ?? (room.roomCode ? `大厅 ${room.roomCode}` : '未命名大厅');
                return (
                  <div key={room.roomId} className="rounded border border-slate-400/30 bg-white/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-slate-900">{roomTitle}</div>
                        <div className="mt-0.5 font-mono text-[10px] font-bold text-slate-400">房间码 {room.roomCode ?? '待同步'}</div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">
                        {roomStatusLabel(room.lifecycleStatus)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
                      <div className="rounded bg-slate-500/5 px-1.5 py-1">
                        <div className="font-bold uppercase tracking-wide text-slate-400">系统</div>
                        <div className="mt-0.5 font-semibold text-slate-700">{room.systemId}</div>
                      </div>
                      <div className="rounded bg-slate-500/5 px-1.5 py-1">
                        <div className="font-bold uppercase tracking-wide text-slate-400">主持人</div>
                        <div className="mt-0.5 font-semibold text-slate-700">{room.hostDisplayName ?? '待同步'}</div>
                      </div>
                      <div className="rounded bg-slate-500/5 px-1.5 py-1">
                        <div className="font-bold uppercase tracking-wide text-slate-400">人数</div>
                        <div className="mt-0.5 font-semibold text-slate-700">已加入 {room.memberCount} 人</div>
                      </div>
                      <div className="rounded bg-slate-500/5 px-1.5 py-1">
                        <div className="font-bold uppercase tracking-wide text-slate-400">来源</div>
                        <div className="mt-0.5 font-semibold text-slate-700">{room.serverLabel ?? '本地 Room Server'}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500">加入方式：{JOIN_REQUIREMENT_LABEL[room.joinRequirement]}</span>
                      <button
                        type="button"
                        className="rounded border border-slate-800 bg-slate-800 px-3 py-1 text-[11px] font-black text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-40"
                        disabled={busy || !room.roomCode}
                        onClick={() => { if (room.roomCode) { setJoinCode(room.roomCode); doJoin(room.roomCode); } }}
                      >
                        加入大厅
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-3">
          <section className="rounded border border-slate-400/30 bg-white/75 p-3 text-[12px] text-slate-700">
            <div className="text-[12px] font-black text-slate-800">使用房间码加入</div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">房间码由主持人在联机大厅中复制发送。</p>
            <div className="mt-3 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                房间码
                <input
                  className={`${input} mt-1 w-full text-sm font-bold uppercase tracking-wide`}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="ABC123"
                />
              </label>
              <label className="block text-[11px] font-bold text-slate-700">
                显示名
                <input
                  className={`${input} mt-1 w-full text-sm`}
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="玩家"
                />
              </label>
              <button
                type="button"
                className="w-full rounded border border-slate-800 bg-slate-800 px-4 py-2 text-[12px] font-black text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-40"
                disabled={busy || !joinCode.trim()}
                onClick={() => doJoin(joinCode)}
              >
                {busy ? '正在加入…' : '加入大厅'}
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              加入后你会先进入房间大厅，不会直接进入跑团桌面。
            </p>
            {joinResult && (
              <div className="mt-3 rounded border border-slate-400/30 bg-white/70 px-2 py-1.5 text-[11px]">
                {joinResult.decision === 'pendingHostApproval' && <div className="font-bold text-amber-700">加入请求已发送：等待主持人批准。</div>}
                {joinResult.decision === 'accepted' && <div className="font-bold text-emerald-700">已加入房间，正在进入联机大厅。</div>}
                {joinResult.decision === 'invalidInvite' && <div className="font-bold text-red-700">找不到这个房间。请检查房间码是否正确。</div>}
                {joinResult.decision === 'roomClosed' && <div className="font-bold text-red-700">房间已关闭。请让主持人重新创建联机房间。</div>}
                <details className="mt-1">
                  <summary className="cursor-pointer text-[10px] font-bold text-slate-400">诊断信息</summary>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    decision={joinResult.decision}
                    {joinResult.roomId ? ` · roomId=${joinResult.roomId}` : ''}
                    {joinResult.memberId ? ` · memberId=${joinResult.memberId}` : ''}
                    {joinResult.assignedRole ? ` · role=${joinResult.assignedRole}` : ''}
                  </div>
                </details>
              </div>
            )}
            {error && (
              <div className="mt-3 rounded border border-red-400/40 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-700">
                <div className="font-bold">{error}</div>
                {errorDetail && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[10px] font-bold text-red-700/70">诊断信息</summary>
                    <div className="mt-0.5 break-words text-[10px] opacity-80">{errorDetail}</div>
                  </details>
                )}
              </div>
            )}
          </section>

          <section className="rounded border border-slate-400/20 bg-white/55 p-3 text-[12px] text-slate-700">
            <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-600">加入后流程</div>
            <ol className="space-y-1.5 text-[11px]">
              {['进入大厅', '绑定角色', '等待审批', '标记 ready', '进入跑团桌面'].map((step, index) => (
                <li key={step} className="flex items-center gap-2 rounded border border-slate-300/50 bg-white/70 px-2 py-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-white">{index + 1}</span>
                  <span className="font-bold text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <details className="mt-3 rounded border border-slate-400/25 bg-white/40 p-3 text-[12px] text-slate-700">
        <summary className="cursor-pointer text-[11px] font-black uppercase tracking-wide text-slate-600">
          网络设置与诊断
        </summary>
        <div className="mt-3 space-y-3">
          <RoomServerStatusBanner baseUrl={baseUrl} />
          <section className="rounded border border-slate-400/30 bg-white/50 p-3">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">连接方式：局域网 Room Server</div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">服务器地址
                <input className={`${input} min-w-[220px]`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={DEFAULT_BASE_URL} />
              </label>
              <button type="button" className={btn} disabled={busy} onClick={checkConnection}>检查连接</button>
              <button type="button" className={btn} disabled={busy} onClick={refreshRooms}>刷新大厅</button>
              {healthOk === true && <span className="text-[11px] font-bold text-emerald-700">当前状态：已连接</span>}
              {healthOk !== true && <span className="text-[11px] font-bold text-slate-500">当前状态：未确认</span>}
            </div>
            <div className="mt-2 text-[10px] leading-relaxed text-slate-500">
              如果无法连接，请确认主持人已经创建联机房间、你和主持人在同一局域网，并且房间码输入正确。
            </div>
            {diagnosticError && (
              <div className="mt-2 rounded border border-red-400/40 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-700">
                <div className="font-bold">{diagnosticError}</div>
                {diagnosticDetail && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[10px] font-bold text-red-700/70">技术信息</summary>
                    <div className="mt-0.5 break-words text-[10px] opacity-80">{diagnosticDetail}</div>
                  </details>
                )}
              </div>
            )}
          </section>

          <section className="rounded border border-dashed border-slate-400/30 bg-white/50 p-3 text-[11px] text-slate-500">
            <div className="font-bold text-slate-600">未来联机来源</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-500/10 px-2 py-0.5 font-bold">官方服务器：未来支持</span>
              <span className="rounded-full bg-slate-500/10 px-2 py-0.5 font-bold">第三方服务器：未来支持</span>
            </div>
          </section>
        </div>
      </details>
      <p className="mt-3 text-[10px] italic text-slate-400">加入后会先进入 Room Lobby。这里是局域网 / 本地 Room Server 入口，不是公网邀请链接服务。</p>
    </div>
  );
}
