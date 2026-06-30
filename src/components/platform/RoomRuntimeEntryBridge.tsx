import type { RoomRuntimeEntryContext, RoomRuntimeEntryMode } from '../../lib/platform/roomRuntimeEntryTypes';
import type { RoomCampaignRefSource, RoomReadyStatus, RoomSnapshot } from '../../lib/platform/roomTypes';
import { RuntimeFullscreenShell, type RuntimeShellMode } from './RuntimeFullscreenShell';

/**
 * RoomRuntimeEntryBridge (v0 / UI1a) — read-only Runtime Entry Preview.
 *
 * AI-LANDMARK: ROOM_RUNTIME_ENTRY_BRIDGE_V0
 *
 * The surface a member lands on after clicking "进入跑团桌面预览" in the lobby.
 * Now rendered inside the fullscreen RuntimeFullscreenShell (UI1a) with Host /
 * Player / Spectator slot differentiation. It is still a READ-ONLY preview of the
 * room runtime entry context — NOT the runtime. No map / token / RuntimeLog /
 * action intent, no RuntimeActor / CampaignActorInstance, no store writes. The
 * entry guard result (admissionId / approvedActorBindingId / "已准入角色") is
 * preserved. System-agnostic. No server / WebSocket / RuntimeLog API change.
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

export function RoomRuntimeEntryBridge({ context, room, serverLabel, onBackToLobby }: RoomRuntimeEntryBridgeProps) {
  const members = room?.members ?? [];
  const actorBindings = room?.lobby?.actorBindings ?? [];
  const readyStates = room?.lobby?.readyStates ?? [];

  const activeCount = members.filter((m) => m.status === 'active').length;
  const approvedCount = actorBindings.filter((b) => b.status === 'approved').length;
  const readyCount = members.filter((m) => {
    const b = actorBindings.find((x) => x.memberId === m.memberId);
    const r = readyStates.find((x) => x.memberId === m.memberId)?.status;
    return m.status === 'active' && b?.status === 'approved' && r === 'ready';
  }).length;

  const shellMode = entryModeToShellMode(context.entryMode);
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
          <div className={`mb-1 ${label}`}>主持人工具（占位）</div>
          <p className="text-[10px] text-slate-500">准入队列 / NPC / Handout / Notes 后续接入；局内开启联机为后续功能。</p>
        </div>
      )}
      {shellMode === 'player' && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>我的信息</div>
          <p className="text-[10px] text-slate-500">已准入并准备就绪。角色卡 / 可见信息后续接入。</p>
        </div>
      )}
      {shellMode === 'spectator' && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>旁观</div>
          <p className="text-[10px] text-slate-500">旁观只读预览，无角色绑定与行动。</p>
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
    </div>
  );

  // ── Main stage: entry context + not-yet-runtime notice ─────────────────────
  const mainStage = (
    // Preview canvas fills the stage; notice + entry context are light centered
    // content (no full-width banner, no absolute corner that collides with overlays).
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-400/50 bg-white/30 p-4 text-center">
      <div className="text-base font-bold text-slate-600">地图 / 场景桌面（预览）· Map / Scene Canvas</div>
      <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-slate-500">进入正式 Runtime 后显示地图与 token。当前为入口预览。</p>
      <div className="mt-3 inline-block rounded border border-amber-500/30 bg-amber-50/70 px-2 py-1 text-[9px] text-amber-700">
        只读预览 · 未接入正式 Runtime / 地图 / 日志
      </div>
      <div className="mt-3 grid max-w-sm grid-cols-2 gap-x-4 gap-y-0.5 text-left">
        <Info k="房间码" v={context.roomCode} strong />
        <Info k="系统" v={context.systemId} />
        <Info k="roomId" v={shortId(context.roomId)} />
        <Info k="服务器" v={serverLabel ?? context.serverBaseUrl} />
        {typeof context.serverSeqAtEntry === 'number' && <Info k="快照 seq" v={String(context.serverSeqAtEntry)} />}
      </div>
    </div>
  );

  return (
    <RuntimeFullscreenShell
      title={context.campaignRef?.displayName ?? `房间 ${context.roomCode}`}
      systemId={context.systemId}
      mode={shellMode}
      roomCode={context.roomCode}
      sceneLabel="入口预览"
      onExit={onBackToLobby}
      exitLabel="返回房间大厅"
      mainStage={mainStage}
      actorRail={actorRail}
      inspector={inspector}
    />
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
