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

/**
 * RuntimeMultiplayerTogglePanel (M70/M71/M72) — local runtime settings + readiness.
 *
 * AI-LANDMARK: RUNTIME_MULTIPLAYER_TOGGLE_PANEL_V0
 *
 * A read-only settings card for the LOCAL runtime: it shows the current run mode /
 * sync state / authority / character-data source, and a "开启多人同步" entry that is
 * intentionally NOT enabled this round — clicking it only reveals the promotion
 * readiness checklist (what a future local→room upgrade would carry, re-confirm,
 * or drop). It creates NO room, opens NO socket, writes NO store. Pure UI/contract.
 */

export interface RuntimeMultiplayerTogglePanelProps {
  descriptor: RuntimeModeDescriptor;
  /** Where the character sheet's data comes from (e.g. 本地角色库 · DND 5E). */
  actorSourceLabel?: string;
  /** Optional compact clearance summary (M73) rendered inside the settings panel. */
  clearanceSummary?: ReactNode;
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

export function RuntimeMultiplayerTogglePanel({ descriptor, actorSourceLabel, clearanceSummary }: RuntimeMultiplayerTogglePanelProps) {
  const [showChecklist, setShowChecklist] = useState(false);
  const isLocal = descriptor.authority === 'local';

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
            本地 Runtime 是完整 Runtime；联机只是可选的同步层。开启多人同步后，Room Server 将成为同步权威，其他玩家可加入同一战役 Runtime。
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          className="rounded border border-slate-300/60 bg-white/50 px-2.5 py-1 text-[11px] font-bold text-slate-400"
          title="本轮尚未启用完整联机升级"
        >
          开启多人同步
        </button>
        <span className="rounded-full bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">准备中</span>
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
        当前入口用于展示未来"本地转联机"的流程与准备检查；本轮点击不会创建房间，也不会改变当前 Runtime。
      </p>

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
            以上仅为开启前检查说明；真正的日志 replay、房间创建与权限迁移将在后续版本实现。
          </p>
        </div>
      )}
    </div>
  );
}
