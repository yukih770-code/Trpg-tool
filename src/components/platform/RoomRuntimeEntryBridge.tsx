import type { RoomRuntimeEntryContext, RoomRuntimeEntryMode } from '../../lib/platform/roomRuntimeEntryTypes';
import type { RoomCampaignRefSource, RoomReadyStatus, RoomSnapshot } from '../../lib/platform/roomTypes';

/**
 * RoomRuntimeEntryBridge (v0) — read-only Runtime Entry Preview.
 *
 * AI-LANDMARK: ROOM_RUNTIME_ENTRY_BRIDGE_V0
 *
 * The surface a member lands on after clicking "进入跑团桌面预览" in the lobby.
 * It is a READ-ONLY preview of the room runtime entry context — NOT the runtime.
 * It does NOT mount CampaignRuntimeShell, RuntimeSlotShell, or any DND gameplay;
 * no RuntimeLog / map / token / action intent; it creates no RuntimeActor or
 * CampaignActorInstance and writes to no store. roomCode / Host role shown here
 * are NOT real auth. System-agnostic (uses systemId only).
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

  const card = 'rounded border border-slate-400/30 bg-white/60 p-3';
  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-600';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';

  return (
    <div className="space-y-4 rounded-lg border border-slate-400/30 bg-slate-50/60 p-4 text-[12px] text-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-black text-slate-800">跑团桌面入口预览 · Runtime Entry Preview</div>
          <div className="text-[10px] text-slate-500">这是 Runtime Entry Bridge，尚未进入正式 Runtime。</div>
        </div>
        {onBackToLobby && (
          <button type="button" className={btn} onClick={onBackToLobby}>返回房间大厅</button>
        )}
      </div>

      {/* Entry context */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>入口上下文</div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          <Info k="房间码" v={context.roomCode} strong />
          <Info k="系统" v={context.systemId} />
          <Info k="入口模式" v={ENTRY_MODE_LABEL[context.entryMode]} />
          <Info k="角色" v={context.currentRole} />
          <Info k="roomId" v={shortId(context.roomId)} />
          <Info k="成员 ID" v={shortId(context.currentMemberId)} />
          <Info k="服务器" v={serverLabel ?? context.serverBaseUrl} />
          {typeof context.serverSeqAtEntry === 'number' && <Info k="快照 seq" v={String(context.serverSeqAtEntry)} />}
        </div>
      </section>

      {/* Campaign linkage (read-only; not a permission) */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>战役关联</div>
        {context.campaignRef ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            <Info k="战役名称" v={context.campaignRef.displayName} strong />
            <Info k="战役来源" v={CAMPAIGN_SOURCE_LABEL[context.campaignRef.source]} />
            {context.campaignRef.campaignId && <Info k="campaignId" v={shortId(context.campaignRef.campaignId)} />}
            <Info k="战役系统" v={context.campaignRef.systemId} />
          </div>
        ) : (
          <div className="text-[11px] italic text-slate-500">无战役关联测试房间</div>
        )}
      </section>

      {/* Actor binding + ready */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>角色绑定与准备</div>
        {context.actorRef ? (
          <div className="text-[12px]">
            <span className="font-bold text-slate-800">{context.actorRef.displayName}</span>
            <span className="ml-2 text-[10px] text-slate-500">
              {context.actorRef.systemId}
              {context.actorRef.actorId ? ` · ${context.actorRef.actorId}` : ''}
              {context.approvedActorBindingId ? ` · ${shortId(context.approvedActorBindingId)}` : ''}
            </span>
          </div>
        ) : (
          <div className="text-[11px] italic text-slate-500">本入口未携带已批准的角色绑定（主持人 / 旁观预览可无角色）。</div>
        )}
        <div className="mt-1 text-[11px]">
          准备状态：<span className="font-bold">{context.readyState ? READY_LABEL[context.readyState] : '—'}</span>
        </div>
      </section>

      {/* Room overview counts (read-only) */}
      <section className={card}>
        <div className={`mb-1.5 ${label}`}>房间概览</div>
        <div className="flex flex-wrap gap-4 text-[11px]">
          <span>在线成员 <b className="text-slate-800">{activeCount}</b></span>
          <span>已准入角色 <b className="text-slate-800">{approvedCount}</b></span>
          <span>已准备 <b className="text-slate-800">{readyCount}</b></span>
        </div>
      </section>

      {/* Not-yet-runtime notice */}
      <div className="rounded border border-amber-500/30 bg-amber-50/50 px-2 py-1.5 text-[10px] text-amber-700">
        尚未进入正式 Runtime。RuntimeLog / 地图 / token / action intent 未接入；CampaignActorInstance / RuntimeActor 尚未创建；
        roomCode 与主持人身份在此仅为 scaffold 展示，不是真实权限。
      </div>

      <p className="text-[10px] italic text-slate-400">Runtime Entry Bridge · 只读预览 · 未接入正式 Runtime / 权限 / 日志 / 地图。</p>
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
