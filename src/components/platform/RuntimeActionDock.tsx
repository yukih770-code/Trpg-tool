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

/** Small consistent placeholder body for not-yet-implemented tools. */
export function RuntimeActionPlaceholder({ body }: { body: string }) {
  return (
    <div className="text-[11px] leading-relaxed text-slate-500">
      {body}
      <div className="mt-1 text-[10px] font-bold italic text-amber-700">后续接入（当前仅入口，未实现真实功能）。</div>
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
  panel: <RuntimeActionPlaceholder body="日志：请使用左下角的日志抽屉查看运行日志。" />,
};

/**
 * Role-scoped unified Runtime dock actions (M25.1b). 投骰 is one same-weight tool.
 * The caller supplies the dice panel (its own onRoll) so the same tray works in
 * local and multiplayer. Players do NOT see host tools (NPC / 场景 / 设置); a
 * spectator does not roll by default. Unimplemented tools are host-only placeholders
 * (or role-appropriate view placeholders), clearly marked "后续接入".
 */
export function buildRuntimeDockActions(mode: RuntimeActionMode, dicePanel: ReactNode): RuntimeDockAction[] {
  if (mode === 'spectator') {
    return [
      { id: 'handout', label: 'Handout', disabled: true, panel: <RuntimeActionPlaceholder body="Handout：查看主持人公开的图片、文档、线索。当前未接入真实 Handout 系统。" /> },
      LOG_ACTION,
      { id: 'view', label: '视角', disabled: true, panel: <RuntimeActionPlaceholder body="视角：后续用于地图视角 / 镜头跟随。当前未接入。" /> },
    ];
  }
  if (mode === 'player') {
    return [
      { id: 'dice', label: '投骰', panel: dicePanel },
      { id: 'actor', label: '我的角色', shortLabel: '角色', disabled: true, panel: <RuntimeActionPlaceholder body="我的角色：后续接入角色卡 / 角色状态。当前仅入口。" /> },
      { id: 'handout', label: 'Handout', disabled: true, panel: <RuntimeActionPlaceholder body="Handout：查看主持人公开的图片、文档、线索。当前未接入真实 Handout 系统。" /> },
      LOG_ACTION,
    ];
  }
  // host
  return [
    { id: 'dice', label: '投骰', panel: dicePanel },
    { id: 'scene', label: '场景', disabled: true, panel: <RuntimeActionPlaceholder body="添加场景：后续用于创建 / 切换运行时场景。当前未接入真实场景系统。" /> },
    { id: 'handout', label: 'Handout', disabled: true, panel: <RuntimeActionPlaceholder body="发布 Handout：后续用于向玩家发布 / 管理图片、文档、线索。当前未接入真实 Handout 系统。" /> },
    { id: 'npc', label: 'NPC', disabled: true, panel: <RuntimeActionPlaceholder body="管理 NPC：后续用于添加、查看和控制 NPC。当前未接入真实 NPC 系统。" /> },
    LOG_ACTION,
    { id: 'more', label: '更多', disabled: true, panel: <RuntimeActionPlaceholder body="更多 / 设置：后续用于局内设置、联机设置、结束会话等。当前仅入口。" /> },
  ];
}
