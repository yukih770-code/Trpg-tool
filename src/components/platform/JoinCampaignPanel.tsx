import { useState } from 'react';

import {
  createRoomOnServer,
  fetchRoomServerHealth,
  joinRoomOnServer,
  listRoomServerRooms,
  RoomServerHttpError,
  type RoomServerHttpClientConfig,
  type RoomServerRoomListItem,
} from '../../lib/platform/roomServerHttpClient';
import type { RoomDiscoverySource } from '../../lib/platform/roomDiscoveryTypes';
import type { RoomJoinResult, RoomSystemId } from '../../lib/platform/roomTypes';

/**
 * JoinCampaignPanel (v0) — "加入战役" surface.
 *
 * AI-LANDMARK: JOIN_CAMPAIGN_PANEL_V0
 *
 * Frontend HTTP-only shell to discover/join rooms from a portable Room Server.
 * Currently only LAN / local Room Server (HTTP) is real; official & third-party
 * sources are placeholders. No WebSocket, no LAN discovery, no runtime entry, no
 * actor binding. System-agnostic (uses systemId, not DND-specific concepts).
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
}

export function JoinCampaignPanel({ systemId, panelClassName }: JoinCampaignPanelProps) {
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
    await createRoomOnServer(config, { hostDisplayName: hostName.trim() || 'GM', systemId });
    setRooms(await listRoomServerRooms(config));
  });
  const doJoin = (code: string) => run(async () => {
    const result = await joinRoomOnServer(config, { inviteCodeOrRoomCode: code.trim(), requestedDisplayName: joinName.trim() || 'Player' });
    setJoinResult(result);
  });

  const input = 'rounded border border-slate-400/40 bg-white/70 px-2 py-1 text-[12px] outline-none';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';

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
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">本地 Room Server 测试入口</div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">主持人显示名
                <input className={input} value={hostName} onChange={(e) => setHostName(e.target.value)} />
              </label>
              <button type="button" className={btn} disabled={busy} onClick={createTestRoom}>创建本地测试房间</button>
            </div>
          </section>

          {/* Room list */}
          <section>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">房间列表（{rooms.length}）</div>
            {rooms.length === 0 ? (
              <p className="text-[11px] italic text-slate-500">暂无房间。先“刷新房间”，或创建一个本地测试房间。</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {rooms.map((room) => (
                  <div key={room.roomId} className="rounded border border-slate-400/30 bg-white/60 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black">房间码 {room.roomCode}</span>
                      <span className="rounded-full bg-slate-500/15 px-1.5 py-0.5 text-[9px] font-bold">{room.lifecycleStatus}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500">
                      系统 {room.systemId} · 成员 {room.memberCount} · 来源 局域网联机 / 本地 Room Server
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">加入方式：需要房间码 · 需要主持人审批</div>
                    <button type="button" className={`${btn} mt-1.5`} disabled={busy} onClick={() => { setJoinCode(room.roomCode); doJoin(room.roomCode); }}>申请加入</button>
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
      <p className="mt-3 text-[10px] italic text-slate-400">本地 Room Server 调试入口，不是正式线上联机。未进入 Runtime、未绑定角色、未实现 WebSocket。</p>
    </div>
  );
}
