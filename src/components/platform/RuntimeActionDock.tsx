import { useState, type ReactNode } from 'react';

/**
 * RuntimeActionDock (M25.1a) — unified bottom Action Dock (pure UI).
 *
 * AI-LANDMARK: RUNTIME_ACTION_DOCK_V0
 *
 * A single row of SAME-WEIGHT tool buttons (投骰 / 场景 / Handout / NPC / 地图 /
 * 设置). Clicking a tool expands ONE floating panel above the row; clicking the
 * active tool again collapses it. Only one panel is open at a time. Panels float
 * (absolute) and never sit in document flow / compress the Main Stage.
 *
 * All panels are kept MOUNTED (hidden when inactive) so a panel's internal state
 * (e.g. the SharedDiceDock expression / tray / last result) survives collapse and
 * tool-switching. This component owns NO tool logic — callers pass panel content.
 */

export interface RuntimeDockAction {
  id: string;
  label: string;
  shortLabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  panel?: ReactNode;
}

export interface RuntimeActionDockProps {
  actions: RuntimeDockAction[];
  defaultActiveActionId?: string | null;
  className?: string;
}

/** Small consistent placeholder body for not-yet-available tools (product tone). */
export function RuntimeActionPlaceholder({ body }: { body: string }) {
  return (
    <div className="text-[11px] leading-relaxed text-slate-500">
      {body}
      <div className="mt-1 text-[10px] font-bold text-amber-700">即将推出 · 该功能将在后续版本开放。</div>
    </div>
  );
}

export function RuntimeActionDock({ actions, defaultActiveActionId = null, className }: RuntimeActionDockProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultActiveActionId);

  const toggle = (id: string) => setActiveId((cur) => (cur === id ? null : id));

  const baseBtn = 'rounded border px-2 py-1 text-[11px] font-bold';
  const idle = 'border-slate-400/50 bg-white/70 text-slate-700 hover:bg-white';
  const activeCls = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-800';

  const panelActions = actions.filter((a) => a.panel !== undefined || a.disabledReason);

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Floating panel(s) above the row — all mounted, only the active one shown. */}
      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
        {panelActions.map((a) => (
          <div
            key={a.id}
            className={`${a.id === activeId ? '' : 'hidden'} w-[min(560px,92vw)] max-h-[60vh] overflow-y-auto rounded-lg border border-slate-300/70 bg-white/90 p-3 shadow-lg backdrop-blur-sm`}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">{a.label}</span>
              <button
                type="button"
                className="rounded border border-slate-400/50 bg-white/70 px-1.5 text-[10px] font-bold text-slate-500"
                onClick={() => setActiveId(null)}
              >
                收起 ▾
              </button>
            </div>
            {a.panel}
          </div>
        ))}
      </div>

      {/* Same-weight tool button row. */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a.id)}
            aria-pressed={activeId === a.id}
            title={a.disabledReason}
            className={`${baseBtn} ${activeId === a.id ? activeCls : idle}`}
          >
            {a.shortLabel ?? a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type RuntimeActionMode = 'host' | 'player' | 'spectator';

const LOG_ACTION: RuntimeDockAction = {
  id: 'log',
  label: '日志',
  panel: <RuntimeActionPlaceholder body="日志：完整运行日志在左下角的日志抽屉中，包括投骰、公开信息和状态记录。" />,
};

/** Optional real panels injected by the caller (M29). When provided they replace
 * the corresponding placeholder; when omitted the dock falls back to a
 * product-tone placeholder so older callers keep compiling. */
export interface RuntimeDockExtraPanels {
  /** 公开信息 / Handout v0 — host publish + player/spectator read feed. */
  publicInfoPanel?: ReactNode;
  /** 状态记录 v0 — host manual state log (host dock only). */
  stateLogPanel?: ReactNode;
}

const PUBLIC_INFO_FALLBACK = (
  <RuntimeActionPlaceholder body="公开信息：主持人发布给全桌的场景描述、线索与要点会显示在这里。" />
);

/**
 * Role-scoped unified Runtime dock actions (M25.1b / M29). 投骰 is one same-weight
 * tool. The caller supplies the dice panel and (M29) the real 公开信息 / 状态记录
 * panels, so the same dock works in local and multiplayer. Players do NOT see
 * host tools (状态记录 / 场景 / 更多); a spectator does not roll by default.
 */
export function buildRuntimeDockActions(
  mode: RuntimeActionMode,
  dicePanel: ReactNode,
  extras?: RuntimeDockExtraPanels,
): RuntimeDockAction[] {
  const publicInfo: RuntimeDockAction = {
    id: 'publicInfo',
    label: '公开信息',
    shortLabel: '信息',
    panel: extras?.publicInfoPanel ?? PUBLIC_INFO_FALLBACK,
  };

  if (mode === 'spectator') {
    return [
      publicInfo,
      LOG_ACTION,
      { id: 'view', label: '视角', disabled: true, panel: <RuntimeActionPlaceholder body="视角：跟随地图镜头、聚焦当前场景。" /> },
    ];
  }
  if (mode === 'player') {
    return [
      { id: 'dice', label: '投骰', panel: dicePanel },
      { id: 'actor', label: '我的角色', shortLabel: '角色', disabled: true, panel: <RuntimeActionPlaceholder body="我的角色：查看并管理你的角色卡与角色状态。" /> },
      publicInfo,
      LOG_ACTION,
    ];
  }
  // host
  return [
    { id: 'dice', label: '投骰', panel: dicePanel },
    publicInfo,
    {
      id: 'stateLog',
      label: '状态记录',
      shortLabel: '记录',
      panel: extras?.stateLogPanel ?? (
        <RuntimeActionPlaceholder body="状态记录：随手记下伤害、线索与重要变化，全桌可见。" />
      ),
    },
    { id: 'scene', label: '场景', disabled: true, panel: <RuntimeActionPlaceholder body="场景：创建和切换场景，向玩家展示当前舞台。" /> },
    LOG_ACTION,
    { id: 'more', label: '更多', disabled: true, panel: <RuntimeActionPlaceholder body="更多：局内设置、联机管理、结束本次会话。" /> },
  ];
}
