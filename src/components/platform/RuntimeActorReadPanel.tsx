/**
 * RuntimeActorReadPanel (M37–M39) — read-only "我的角色" summary.
 *
 * AI-LANDMARK: RUNTIME_ACTOR_READ_PANEL_V0
 *
 * A player-facing, READ-ONLY summary of the actor a member brought into the room
 * (from the lobby actor-binding / admission / ready state). It NEVER edits an
 * actor, writes a store, or renders a full character sheet, and does no rules
 * math. It only reuses information the room already knows (actorRef, binding
 * draft status, clearance/admission, ready state). When there is nothing to show
 * it renders a product empty state instead of a placeholder. Host / Spectator do
 * not get this panel wired in (see buildRuntimeDockActions) — it is a player tool.
 * System-agnostic: no DND/COC/CP-RED rule fields.
 */

export interface RuntimeActorReadSummary {
  displayName?: string;
  systemId?: string;
  actorId?: string;
  /** RoomActorBindingSource-ish origin (localActorVault / manualScaffold / …). */
  source?: string;
  bindingId?: string;
  admissionId?: string;
  /** Lobby binding-draft status (approved / pending / …), NOT clearance. */
  bindingStatus?: string;
  /** Character-clearance status when the room provides it (separate layer). */
  clearanceStatus?: string;
  /** 'ready' | 'notReady' when known. */
  readyState?: string;
  note?: string;
}

export interface RuntimeActorReadPanelProps {
  summary?: RuntimeActorReadSummary | null;
  /** Only 'player' gets the actor tool; kept for copy tailoring / future reuse. */
  role?: 'host' | 'player' | 'spectator';
}

const SOURCE_LABEL: Record<string, string> = {
  localActorVault: '本地角色库',
  manualScaffold: '手动创建',
  imported: '导入',
  unknown: '未知来源',
};

const BINDING_STATUS_LABEL: Record<string, string> = {
  notSubmitted: '未提交',
  pendingHostApproval: '等待主持人通过',
  approved: '已通过',
  rejected: '已拒绝',
};

const CLEARANCE_STATUS_LABEL: Record<string, string> = {
  notSubmitted: '未提交',
  pending: '审核中',
  approved: '已准入',
  rejected: '未通过',
  stale: '需重新确认',
};

const READY_LABEL: Record<string, string> = {
  ready: '已准备',
  notReady: '未准备',
};

function label(map: Record<string, string>, key?: string): string | undefined {
  if (!key) return undefined;
  return map[key] ?? key;
}

function shortId(id?: string): string | undefined {
  if (!id) return undefined;
  return id.length <= 8 ? id : `…${id.slice(-6)}`;
}

/** A summary is worth showing only if it names an actor. */
function hasActor(summary?: RuntimeActorReadSummary | null): summary is RuntimeActorReadSummary {
  return !!summary && typeof summary.displayName === 'string' && summary.displayName.trim() !== '';
}

function Row({ k, v, tone }: { k: string; v: string; tone?: 'ok' | 'warn' }) {
  const valueTone = tone === 'ok' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : 'text-slate-800';
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/60 py-1 last:border-b-0">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{k}</span>
      <span className={`text-right text-[12px] font-bold ${valueTone}`}>{v}</span>
    </div>
  );
}

export function RuntimeActorReadPanel({ summary, role }: RuntimeActorReadPanelProps) {
  if (!hasActor(summary)) {
    return (
      <div className="rounded border border-dashed border-slate-400/40 bg-white/40 p-3 text-[11px] leading-relaxed text-slate-500">
        <div className="mb-1 text-[12px] font-bold text-slate-600">还没有可展示的角色</div>
        {role === 'spectator' ? (
          <p>旁观者不绑定角色，因此没有角色摘要可显示。</p>
        ) : (
          <p>
            当前房间还没有为你绑定可展示的角色摘要。请回到房间大厅提交并通过一个角色后，这里会显示你的角色概要。
          </p>
        )}
      </div>
    );
  }

  const sourceLabel = label(SOURCE_LABEL, summary.source);
  const bindingStatusLabel = label(BINDING_STATUS_LABEL, summary.bindingStatus);
  const clearanceLabel = label(CLEARANCE_STATUS_LABEL, summary.clearanceStatus);
  const readyLabel = label(READY_LABEL, summary.readyState);
  const bindingIdShort = shortId(summary.bindingId);
  const admissionIdShort = shortId(summary.admissionId);

  return (
    <div className="space-y-2 text-left">
      <div className="rounded border border-slate-300/60 bg-white/70 p-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[14px] font-black text-slate-800">{summary.displayName}</span>
          <span className="rounded-full border border-slate-400/40 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">只读</span>
        </div>
        <div className="mt-2 space-y-0">
          {summary.systemId && <Row k="系统" v={summary.systemId} />}
          {sourceLabel && <Row k="来源" v={sourceLabel} />}
          {summary.actorId && <Row k="角色 ID" v={summary.actorId} />}
          {bindingStatusLabel && (
            <Row k="绑定" v={bindingStatusLabel} tone={summary.bindingStatus === 'approved' ? 'ok' : 'warn'} />
          )}
          {clearanceLabel && (
            <Row k="准入" v={clearanceLabel} tone={summary.clearanceStatus === 'approved' ? 'ok' : 'warn'} />
          )}
          {readyLabel && <Row k="准备" v={readyLabel} tone={summary.readyState === 'ready' ? 'ok' : 'warn'} />}
          {bindingIdShort && <Row k="binding" v={bindingIdShort} />}
          {admissionIdShort && <Row k="admission" v={admissionIdShort} />}
        </div>
        {summary.note && <p className="mt-1.5 text-[10px] text-slate-500">{summary.note}</p>}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-400">
        这是角色的只读概要。编辑角色数值、查看完整角色卡将在后续版本开放；本面板不会修改任何角色数据。
      </p>
    </div>
  );
}
