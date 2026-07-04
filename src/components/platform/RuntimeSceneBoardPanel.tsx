import type { RuntimeSceneFocus } from './RuntimeSceneFocusPanel';
import type { RuntimePublicInfoItem } from './RuntimePublicInfoPanel';
import type { RuntimeStateLogItem } from './RuntimeManualStateLogPanel';

/**
 * RuntimeSceneBoardPanel (M43 → M47 overlay) — the "what's happening now" panel.
 *
 * AI-LANDMARK: RUNTIME_SCENE_BOARD_PANEL_V0
 *
 * A COMPACT, READ-ONLY OVERLAY (not a centered dashboard). It rides in the right
 * Inspector above the map and aggregates already-existing context: the current
 * scene (title only — the full scene art + description live on the map stage /
 * Scene HUD), plus the latest public info, state records and dice. It derives
 * nothing new: no filters, no drag, no scene list, no history. Editing the scene
 * happens in the Scene Focus dock; this panel only reflects it. Role tailors copy.
 */

export interface RuntimeSceneBoardDice {
  id: string;
  label?: string;
  expression: string;
  total: number;
  createdAt?: string;
}

export interface RuntimeSceneBoardMeta {
  roomCode?: string;
  systemId?: string;
  serverLabel?: string;
}

export interface RuntimeSceneBoardPanelProps {
  scene: RuntimeSceneFocus | null;
  publicInfo: RuntimePublicInfoItem[];
  stateLog: RuntimeStateLogItem[];
  recentDice: RuntimeSceneBoardDice[];
  role: 'host' | 'player' | 'spectator';
  meta?: RuntimeSceneBoardMeta;
  loading?: boolean;
}

const sectionLabel = 'mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500';

function lastN<T>(items: T[], n: number): T[] {
  return items.length <= n ? [...items] : items.slice(items.length - n);
}

export function RuntimeSceneBoardPanel({
  scene,
  publicInfo,
  stateLog,
  recentDice,
  role,
  meta,
  loading,
}: RuntimeSceneBoardPanelProps) {
  const sceneTitle = (scene?.title ?? '').trim();
  const hasScene = !!scene && (sceneTitle !== '' || (scene.body ?? '').trim() !== '' || (scene.mapUrl ?? '').trim() !== '');
  const recentInfo = lastN(publicInfo, 3).reverse();
  const recentState = lastN(stateLog, 3).reverse();
  const recentRolls = lastN(recentDice, 3).reverse();

  const roleReadHint =
    role === 'host'
      ? '用底部「当前场景」更新场景，用「公开信息」「状态记录」推动桌面。'
      : role === 'player'
        ? '投骰与「我的角色」在底部行动区。'
        : '旁观者只读：可查看场景与公开动态，不能修改任何内容。';

  return (
    <div className="space-y-2 text-left">
      {/* Current scene (title line only — full art + description are on the map). */}
      <div className="rounded border border-emerald-500/30 bg-emerald-50/40 px-2 py-1.5">
        <div className={sectionLabel}>当前场景</div>
        {hasScene ? (
          <div className="flex items-baseline gap-1.5 text-[12px]">
            <span aria-hidden>📍</span>
            <span className="font-black text-slate-800">{sceneTitle || '当前场景'}</span>
          </div>
        ) : (
          <div className="text-[11px] italic leading-relaxed text-slate-500">
            {loading
              ? '正在载入当前场景…'
              : role === 'host'
                ? '还没有设置场景，点击底部「当前场景」。'
                : '主持人还没有设置当前场景。'}
          </div>
        )}
      </div>

      <div className="rounded border border-slate-300/50 bg-white/70 px-2 py-1.5">
        <div className={sectionLabel}>最近公开信息</div>
        {recentInfo.length === 0 ? (
          <p className="text-[11px] italic text-slate-500">暂无公开信息。</p>
        ) : (
          <div className="space-y-1">
            {recentInfo.map((item) => (
              <div key={item.id} className="text-[11px] leading-relaxed">
                {item.title && <span className="mr-1 font-bold text-slate-800">{item.title}</span>}
                <span className="whitespace-pre-wrap text-slate-700">{item.body}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded border border-slate-300/50 bg-white/70 px-2 py-1.5">
        <div className={sectionLabel}>最近状态记录</div>
        {recentState.length === 0 ? (
          <p className="text-[11px] italic text-slate-500">暂无状态记录。</p>
        ) : (
          <div className="space-y-1">
            {recentState.map((item) => (
              <div key={item.id} className="text-[11px] leading-relaxed">
                {item.targetName && <span className="mr-1 font-bold text-slate-800">{item.targetName}</span>}
                <span className="whitespace-pre-wrap text-slate-700">{item.body}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded border border-slate-300/50 bg-white/70 px-2 py-1.5">
        <div className={sectionLabel}>最近投骰</div>
        {recentRolls.length === 0 ? (
          <p className="text-[11px] italic text-slate-500">暂无投骰。</p>
        ) : (
          <div className="space-y-1">
            {recentRolls.map((roll) => (
              <div key={roll.id} className="flex items-baseline gap-1.5 text-[11px]">
                <span className="font-bold text-slate-700">{roll.expression}</span>
                {roll.label && <span className="text-[10px] text-slate-400">· {roll.label}</span>}
                <span className="ml-auto font-black text-emerald-700">= {roll.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] leading-relaxed text-slate-500">
        {roleReadHint} 完整时间线与「本场回顾」在左下角日志抽屉。
      </p>
      {meta && (meta.roomCode || meta.systemId) && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-slate-400">
          {meta.roomCode && <span>房间码 {meta.roomCode}</span>}
          {meta.systemId && <span>系统 {meta.systemId}</span>}
        </div>
      )}
    </div>
  );
}
