import { useEffect, useState } from 'react';

import {
  createRoomOnServer,
  fetchRoomServerHealth,
  joinRoomOnServer,
  listRoomServerRooms,
  RoomServerHttpError,
  type RoomServerHttpClientConfig,
  type RoomServerRoomListItem,
} from '../../lib/platform/roomServerHttpClient';
import type { DiscoveredRoomSummary, RoomDiscoverySource, RoomJoinRequirement } from '../../lib/platform/roomDiscoveryTypes';
import {
  canDisplayDiscoveredRoomForSystem,
  mapRoomServerRoomsToDiscovered,
} from '../../lib/platform/roomDiscoveryMapper';
import type { RoomJoinResult, RoomMemberRole, RoomSnapshot, RoomSystemId } from '../../lib/platform/roomTypes';
import type { RoomRuntimeEntryContext } from '../../lib/platform/roomRuntimeEntryTypes';
import { RoomLobbyShell } from './RoomLobbyShell';
import { RoomRuntimeEntryBridge } from './RoomRuntimeEntryBridge';

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

const DEFAULT_BASE_URL = 'http://localhost:8787';

const SOURCE_TABS: { key: RoomDiscoverySource; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'lan', label: '局域网联机' },
  { key: 'official', label: '官方服务器' },
  { key: 'thirdParty', label: '第三方服务器' },
];

export interface JoinCampaignPanelProps {
  systemId?: RoomSystemId;
  tone?: string;
  panelClassName?: string;
  onBackOverrideChange?: (override: { label?: string; onBack: () => void } | null) => void;
}

export function JoinCampaignPanel({ systemId, panelClassName, onBackOverrideChange }: JoinCampaignPanelProps) {
  const [source, setSource] = useState<RoomDiscoverySource>('lan');
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [rooms, setRooms] = useState<RoomServerRoomListItem[]>([]);
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hostName, setHostName] = useState('测试主持人');
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
    origin: 'joinCampaign' | 'testRoom';
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
      const isTestRoom = lobby.origin === 'testRoom';
      onBackOverrideChange({
        label: isTestRoom ? '返回测试入口' : '返回加入战役',
        onBack: () => setLobby(null),
      });
      return () => onBackOverrideChange(null);
    }

    onBackOverrideChange(null);
    return () => onBackOverrideChange(null);
  }, [lobby, runtimeEntry, onBackOverrideChange]);

  const config: RoomServerHttpClientConfig = { baseUrl };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof RoomServerHttpError ? `(${e.status}) ${e.message}` : e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const checkConnection = () => run(async () => { await fetchRoomServerHealth(config); setHealthOk(true); });
  const refreshRooms = () => run(async () => { setRooms(await listRoomServerRooms(config)); setHealthOk(true); });
  const createTestRoom = () => run(async () => {
    const { room } = await createRoomOnServer(config, { hostDisplayName: hostName.trim() || 'GM', systemId });
    setRooms(await listRoomServerRooms(config));
    const host = room.members.find((m) => m.role === 'host');
    setLobby({
      baseUrl,
      roomId: room.identity.roomId,
      currentMemberId: host?.memberId,
      currentRole: 'host',
      initialRoom: room,
      origin: 'testRoom',
    });
  });
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
    const isTestRoom = lobby.origin === 'testRoom';
    return (
      <div className={panelClassName ?? 'rounded-lg border border-slate-400/30 bg-slate-50/60 p-4'}>
        <RoomLobbyShell
          baseUrl={lobby.baseUrl}
          roomId={lobby.roomId}
          currentMemberId={lobby.currentMemberId}
          currentRole={lobby.currentRole}
          initialRoom={lobby.initialRoom}
          serverLabel={LOCAL_SERVER_LABEL}
          backLabel={isTestRoom ? '返回测试入口' : '返回加入战役'}
          onBackToOrigin={() => setLobby(null)}
          exitLabel="离开房间视图"
          onExitRoom={() => setLobby(null)}
          originLabel={isTestRoom ? '测试房间' : '加入战役'}
          originDetail={isTestRoom ? '无战役关联' : '手动加入 / 房间发现'}
          onEnterRuntime={(payload) => setRuntimeEntry(payload)}
        />
      </div>
    );
  }

  return (
    <div className={panelClassName ?? 'rounded-lg border border-slate-400/30 bg-slate-50/60 p-4'}>
      {/* Sub-nav */}
      <div className="mb-3 flex flex-wrap gap-1">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSource(tab.key)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition ${
              source === tab.key ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-400/40 text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-3 text-[10px] text-slate-500">
        仅显示当前系统（{systemId ?? '未指定'}）的房间。「全部」= 当前系统下所有来源；「局域网联机」= 当前系统的本地 / LAN Room Server。
      </div>

      {(source === 'official' || source === 'thirdParty') && (
        <div className="rounded border border-dashed border-slate-400/40 bg-white/50 p-4 text-[12px] text-slate-600">
          {source === 'official' ? '官方服务器房间目录：后续支持（本轮未实现）。' : '第三方服务器目录 / 自托管收藏：后续支持（本轮未实现）。'}
        </div>
      )}

      {(source === 'all' || source === 'lan') && (
        <div className="space-y-4 text-[12px] text-slate-700">
          {/* Local Room Server connection */}
          <section className="rounded border border-slate-400/30 bg-white/50 p-3">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">局域网联机 / 本地 Room Server</div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">服务器地址
                <input className={`${input} min-w-[220px]`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={DEFAULT_BASE_URL} />
              </label>
              <button type="button" className={btn} disabled={busy} onClick={checkConnection}>检查连接</button>
              <button type="button" className={btn} disabled={busy} onClick={refreshRooms}>刷新房间</button>
              {healthOk === true && <span className="text-[11px] font-bold text-emerald-700">已连接</span>}
            </div>
          </section>

          {/* Dev/test: create local room */}
          <section className="rounded border border-amber-500/30 bg-amber-50/50 p-3">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">测试房间（无战役关联）· 开发 / 局域网草稿</div>
            <p className="mb-1.5 text-[10px] text-amber-700/80">仅用于本地开发 / 局域网联调，创建的是无战役关联的测试房间。正式主持房间请从「我的战役」进入某个战役后点「开启局域网房间」。</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">主持人显示名
                <input className={input} value={hostName} onChange={(e) => setHostName(e.target.value)} />
              </label>
              <button type="button" className={btn} disabled={busy} onClick={createTestRoom}>创建测试房间（无战役关联）</button>
            </div>
          </section>

          {/* Room list — from mapped + system-filtered DiscoveredRoomSummary */}
          <section>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
              房间列表（{discoveredRooms.length}）· 当前系统 · 来源：局域网 / 本地（官方 / 第三方：后续支持）
            </div>
            {rooms.length > 0 && discoveredRooms.length === 0 ? (
              <p className="text-[11px] italic text-slate-500">服务器上有房间，但没有匹配当前系统（{systemId ?? '未指定'}）的房间。</p>
            ) : discoveredRooms.length === 0 ? (
              <p className="text-[11px] italic text-slate-500">暂无房间。先“刷新房间”，或创建一个本地测试房间。</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {discoveredRooms.map((room) => (
                  <div key={room.roomId} className="rounded border border-slate-400/30 bg-white/60 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black">房间码 {room.roomCode ?? '—'}</span>
                      <span className="rounded-full bg-slate-500/15 px-1.5 py-0.5 text-[9px] font-bold">{room.lifecycleStatus}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      系统 {room.systemId} · 成员 {room.memberCount} · 来源 局域网联机 / {room.serverLabel ?? '本地 Room Server'}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">加入方式：{JOIN_REQUIREMENT_LABEL[room.joinRequirement]}</div>
                    <button
                      type="button"
                      className={`${btn} mt-1.5`}
                      disabled={busy || !room.roomCode}
                      onClick={() => { if (room.roomCode) { setJoinCode(room.roomCode); doJoin(room.roomCode); } }}
                    >
                      申请加入
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Manual join */}
          <section className="rounded border border-slate-400/30 bg-white/50 p-3">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">手动加入房间</div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">房间码
                <input className={`${input} w-28`} value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="ABC123" />
              </label>
              <label className="flex items-center gap-1">显示名
                <input className={input} value={joinName} onChange={(e) => setJoinName(e.target.value)} />
              </label>
              <button type="button" className={btn} disabled={busy || !joinCode.trim()} onClick={() => doJoin(joinCode)}>申请加入</button>
            </div>
            {joinResult && (
              <div className="mt-2 rounded border border-slate-400/30 bg-white/70 px-2 py-1.5 text-[11px]">
                {joinResult.decision === 'pendingHostApproval' && <div className="font-bold text-amber-700">等待主持人审批…</div>}
                {joinResult.decision === 'accepted' && <div className="font-bold text-emerald-700">已加入房间。</div>}
                {joinResult.decision === 'invalidInvite' && <div className="font-bold text-red-700">无效房间码。</div>}
                {joinResult.decision === 'roomClosed' && <div className="font-bold text-red-700">房间已关闭。</div>}
                <div className="mt-0.5 text-[10px] text-slate-500">
                  decision={joinResult.decision}
                  {joinResult.roomId ? ` · roomId=${joinResult.roomId}` : ''}
                  {joinResult.memberId ? ` · memberId=${joinResult.memberId}` : ''}
                  {joinResult.assignedRole ? ` · role=${joinResult.assignedRole}` : ''}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {error && <div className="mt-3 rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[11px] text-red-700">{error}</div>}
      <p className="mt-3 text-[10px] italic text-slate-400">本地 Room Server 调试入口，不是正式线上联机。房间大厅已支持 WebSocket 实时成员状态、大厅级角色绑定草稿与准备检查；正式 Runtime、日志与地图同步仍未实现。</p>
    </div>
  );
}
