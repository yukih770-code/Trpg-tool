import { RuntimeActorBoundaryNote } from './RuntimeActorBoundaryNote';

/**
 * RuntimeActorRosterPanel (M47) — host player → actor mapping (read-only).
 *
 * AI-LANDMARK: RUNTIME_ACTOR_ROSTER_PANEL_V0
 *
 * Gives the host an at-a-glance roster: which player holds which actor, plus
 * ready / admission / binding status and who is still missing a character. It is
 * READ-ONLY reporting derived from room membership + actor bindings + ready state
 * — NO kick, approve, edit, or actor-transfer actions live here. The caller builds
 * the entries via a safe adapter. Players/spectators do not get this panel wired in.
 */

export interface RuntimeActorRosterEntry {
  memberId: string;
  name: string;
  role: 'host' | 'player' | 'spectator';
  online: boolean;
  ready?: boolean;
  /** Character-clearance/admission label (already localized), if any. */
  admissionLabel?: string;
  admitted?: boolean;
  actorName?: string;
  system?: string;
  hasActor: boolean;
  /** M64 snapshot state (only 'connected'/'unmatched' are known for self; other
   * players' full sheets live on their machines → 'localOnly'). */
  snapshotState?: 'connected' | 'localOnly' | 'unmatched' | 'awaiting';
  /** M60: provenance label when a snapshot was resolved (self only). */
  sourceLabel?: string;
}

const SNAPSHOT_STATE: Record<'connected' | 'localOnly' | 'unmatched' | 'awaiting', { label: string; cls: string; title?: string }> = {
  connected: { label: '已连接角色卡', cls: 'bg-emerald-500/10 text-emerald-700' },
  localOnly: { label: '完整角色卡在玩家本地', cls: 'bg-slate-500/10 text-slate-500', title: '完整角色卡快照通常只在该玩家本地可用' },
  unmatched: { label: '未匹配本地角色库', cls: 'bg-amber-500/10 text-amber-700' },
  awaiting: { label: '等待玩家角色数据', cls: 'bg-slate-500/10 text-slate-500' },
};

export interface RuntimeActorRosterPanelProps {
  entries: RuntimeActorRosterEntry[];
}

const ROLE_LABEL: Record<'host' | 'player' | 'spectator', string> = {
  host: '主持人',
  player: '玩家',
  spectator: '旁观',
};

export function RuntimeActorRosterPanel({ entries }: RuntimeActorRosterPanelProps) {
  const players = entries.filter((e) => e.role === 'player');
  const missingActor = players.filter((e) => !e.hasActor).length;
  const notReady = players.filter((e) => e.ready === false).length;
  const notAdmitted = players.filter((e) => e.hasActor && e.admitted === false).length;

  return (
    <div className="space-y-2 text-left">
      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 font-bold text-slate-600">玩家 {players.length}</span>
        <span className={`rounded-full px-1.5 py-0.5 font-bold ${missingActor > 0 ? 'bg-amber-500/15 text-amber-700' : 'bg-slate-500/10 text-slate-500'}`}>缺角色 {missingActor}</span>
        <span className={`rounded-full px-1.5 py-0.5 font-bold ${notReady > 0 ? 'bg-amber-500/15 text-amber-700' : 'bg-slate-500/10 text-slate-500'}`}>未准备 {notReady}</span>
        <span className={`rounded-full px-1.5 py-0.5 font-bold ${notAdmitted > 0 ? 'bg-amber-500/15 text-amber-700' : 'bg-slate-500/10 text-slate-500'}`}>未准入 {notAdmitted}</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-[11px] italic text-slate-500">还没有成员。分享房间码邀请玩家加入。</p>
      ) : (
        <div className="space-y-1">
          {entries.map((e) => (
            <div key={e.memberId} className="rounded border border-slate-300/50 bg-white/70 px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${e.online ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  title={e.online ? '在线' : '离线'}
                  aria-hidden
                />
                <span className="font-bold text-slate-800">{e.name}</span>
                <span className="rounded-full border border-slate-400/40 px-1.5 text-[9px] font-bold text-slate-500">{ROLE_LABEL[e.role]}</span>
                {e.role === 'player' && (
                  <span className="ml-auto text-[10px]">
                    <span className={e.ready ? 'text-emerald-700' : 'text-slate-400'}>{e.ready ? '已准备' : '未准备'}</span>
                  </span>
                )}
              </div>
              {e.role === 'player' && (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-3 text-[10px] text-slate-500">
                  {e.hasActor ? (
                    <>
                      <span className="font-bold text-slate-700">{e.actorName}</span>
                      {e.system && <span>· {e.system}</span>}
                      {e.admissionLabel && (
                        <span className={e.admitted ? 'text-emerald-700' : 'text-amber-700'}>· {e.admissionLabel}</span>
                      )}
                      {e.snapshotState && (
                        <span
                          className={`rounded-full px-1.5 text-[9px] font-bold ${SNAPSHOT_STATE[e.snapshotState].cls}`}
                          title={e.sourceLabel ?? SNAPSHOT_STATE[e.snapshotState].title}
                        >
                          {SNAPSHOT_STATE[e.snapshotState].label}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="italic text-amber-700">未绑定角色</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-slate-500">
        完整角色卡快照通常只在该玩家本地可用；主持人当前看到的是房间绑定和公开摘要。
        角色对应关系用于跑团展示；这里不做踢人、审批或转移角色等管理操作。完整战役内角色实例将在后续阶段接入。
      </p>
      <RuntimeActorBoundaryNote variant="full" />
    </div>
  );
}
