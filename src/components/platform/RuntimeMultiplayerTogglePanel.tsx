import { useState, type ReactNode } from 'react';

import {
  PROMOTION_CARRY_LABEL,
  RUNTIME_AUTHORITY_LABEL,
  RUNTIME_PROMOTION_CHECKLIST,
  RUNTIME_SESSION_MODE_LABEL,
  RUNTIME_SYNC_LABEL,
  type PromotionCarryKind,
  type RuntimeModeDescriptor,
} from './runtimeModeContract';
import { RoomServerStatusBanner } from './RoomServerStatusBanner';
import type { RoomLaunchActionState } from '../../lib/platform/hostedRoomLaunch';

/**
 * RuntimeMultiplayerTogglePanel (M70/M71/M72) — local runtime settings + readiness.
 *
 * AI-LANDMARK: RUNTIME_MULTIPLAYER_TOGGLE_PANEL_V0
 *
 * A settings card for the LOCAL runtime: it shows the current run mode / sync
 * state / authority / character-data source, and can create a Room Lobby through
 * the shared hosted-room launch path. This is NOT Runtime promotion: it does not
 * replay local RuntimeLog, migrate scene/state, open sockets here, or write store.
 */

export interface RuntimeMultiplayerTogglePanelProps {
  descriptor: RuntimeModeDescriptor;
  /** Where the character sheet's data comes from (e.g. 本地角色库 · DND 5E). */
  actorSourceLabel?: string;
  /** Optional compact clearance summary (M73) rendered inside the settings panel. */
  clearanceSummary?: ReactNode;
  onCreateHostedRoom?: () => void;
  launchState?: RoomLaunchActionState;
  launchError?: string | null;
}

const CARRY_TONE: Record<PromotionCarryKind, string> = {
  carried: 'text-emerald-700',
  reconfirm: 'text-amber-700',
  dropped: 'text-slate-400',
};

const CARRY_DOT: Record<PromotionCarryKind, string> = {
  carried: 'bg-emerald-500',
  reconfirm: 'bg-amber-500',
  dropped: 'bg-slate-400',
};

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/60 py-1 last:border-b-0">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{k}</span>
      <span className="text-right text-[11px] font-bold text-slate-800">{v}</span>
    </div>
  );
}

export function RuntimeMultiplayerTogglePanel({
  descriptor,
  actorSourceLabel,
  clearanceSummary,
  onCreateHostedRoom,
  launchState = 'idle',
  launchError,
}: RuntimeMultiplayerTogglePanelProps) {
  const [showChecklist, setShowChecklist] = useState(false);
  const isLocal = descriptor.authority === 'local';
  const canCreateHostedRoom = Boolean(onCreateHostedRoom && isLocal);

  const groups: PromotionCarryKind[] = ['carried', 'reconfirm', 'dropped'];

  return (
    <div className="space-y-2 text-left">
      {/* In-runtime settings framing — NOT a campaign-detail "进入战役" surface. */}
      <div className="rounded border border-slate-300/60 bg-slate-500/5 px-2.5 py-1.5">
        <div className="text-[11px] font-black text-slate-700">运行设置</div>
        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
          你已在 Runtime 中。这里用于调整当前运行、同步和局内体验；关闭此面板即返回当前 Runtime。
        </p>
      </div>

      {clearanceSummary}

      <div className="rounded border border-slate-300/60 bg-white/70 p-2.5">
        <div className="mb-1 text-[11px] font-bold text-slate-700">运行与同步</div>
        <div className="space-y-0">
          <Row k="运行模式" v={RUNTIME_SESSION_MODE_LABEL[descriptor.sessionMode]} />
          <Row k="同步状态" v={RUNTIME_SYNC_LABEL[descriptor.sync]} />
          <Row k="权威来源" v={RUNTIME_AUTHORITY_LABEL[descriptor.authority]} />
          <Row k="角色卡来源" v={actorSourceLabel ?? '本地角色库'} />
        </div>
        {isLocal && (
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            本地 Runtime 是游戏本体；联机只是可选同步层。当前会创建联机房间大厅，玩家可加入、绑定角色、ready 并由主持人审批。
          </p>
        )}
      </div>

      {isLocal && <RoomServerStatusBanner className="text-left" />}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canCreateHostedRoom || launchState === 'launching'}
          onClick={onCreateHostedRoom}
          className={`rounded border px-2.5 py-1 text-[11px] font-bold ${
            canCreateHostedRoom
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 disabled:opacity-50'
              : 'border-slate-300/60 bg-white/50 text-slate-400'
          }`}
          title={canCreateHostedRoom ? '创建联机房间大厅' : '仅主持人可从本地 Runtime 创建联机房间'}
        >
          {launchState === 'launching' ? '正在创建房间…' : '创建联机房间'}
        </button>
        <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
          {canCreateHostedRoom ? '进入房间大厅' : '只读'}
        </span>
        <button
          type="button"
          onClick={() => setShowChecklist((v) => !v)}
          className="ml-auto rounded border border-slate-400/50 bg-white/70 px-2 py-1 text-[10px] font-bold text-slate-600"
          aria-expanded={showChecklist}
        >
          {showChecklist ? '收起开启前检查' : '查看开启前检查'}
        </button>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500">
        当前会创建联机房间大厅；本地 RuntimeLog、场景和状态记录暂不会自动迁移。未来会支持从当前 Runtime 状态生成 replay / promotion。
      </p>
      {launchError && (
        <p className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] leading-relaxed text-red-700">
          创建联机房间失败：{launchError}
        </p>
      )}

      {showChecklist && (
        <div className="space-y-2 rounded border border-slate-300/50 bg-white/60 p-2">
          {groups.map((group) => {
            const items = RUNTIME_PROMOTION_CHECKLIST.filter((i) => i.kind === group);
            return (
              <div key={group}>
                <div className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${CARRY_TONE[group]}`}>
                  {PROMOTION_CARRY_LABEL[group]}
                </div>
                <ul className="space-y-0.5">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-baseline gap-1.5 text-[11px] text-slate-700">
                      <span className={`mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${CARRY_DOT[group]}`} aria-hidden />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <p className="border-t border-slate-300/40 pt-1.5 text-[10px] leading-relaxed text-slate-400">
            以上仅为开启前检查说明；本轮只创建房间大厅，不 replay 本地日志，不迁移场景或状态记录。
          </p>
        </div>
      )}
    </div>
  );
}
