import { useState, type ReactNode } from 'react';

/**
 * RuntimeActionDock (M25.1a) — unified bottom Action Dock (pure UI).
 *
 * AI-LANDMARK: RUNTIME_ACTION_DOCK_V0
 *
 * A single row of SAME-WEIGHT tool buttons (投骰 / 场景 / 公开信息 / 状态记录).
 * Clicking a tool expands ONE floating panel above the row; clicking the
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

/** Small consistent fallback body when a caller has not supplied a panel yet. */
export function RuntimeActionPlaceholder({ body }: { body: string }) {
  return (
    <div className="text-[11px] leading-relaxed text-slate-500">
      {body}
    </div>
  );
}

export function RuntimeActionDock({ actions, defaultActiveActionId = null, className }: RuntimeActionDockProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultActiveActionId);

  const toggle = (id: string) => setActiveId((cur) => (cur === id ? null : id));

  const baseBtn = 'rounded border px-2 py-1 text-[11px] font-bold transition';
  const idle = 'border-slate-400/50 bg-white/70 text-slate-700 hover:bg-white';
  const activeCls = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-800';
  const comingSoon = 'border-slate-300/50 bg-white/40 text-slate-400 hover:bg-white/60';

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
            onClick={() => {
              if (!a.disabled) toggle(a.id);
            }}
            aria-pressed={activeId === a.id}
            title={a.disabledReason ?? (a.disabled ? '即将推出' : undefined)}
            className={`${baseBtn} ${activeId === a.id ? activeCls : a.disabled ? comingSoon : idle}`}
          >
            {a.shortLabel ?? a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export type RuntimeActionMode = 'host' | 'player' | 'spectator';

/** Optional real panels injected by the caller (M29). When provided they replace
 * the corresponding placeholder; when omitted the dock falls back to a
 * product-tone placeholder so older callers keep compiling. */
export interface RuntimeDockExtraPanels {
  /** 公开信息 / Handout v0 — host publish + player/spectator read feed. */
  publicInfoPanel?: ReactNode;
  /** 状态记录 v0 — host manual state log (host dock only). */
  stateLogPanel?: ReactNode;
  /** 我的角色 read-only summary (M37) — player dock only. */
  actorPanel?: ReactNode;
  /** 当前场景 focus editor (M42) — host dock only. */
  scenePanel?: ReactNode;
  /** Keeper-only session notes — supplied only by a server-safe room runtime. */
  privateNotesPanel?: ReactNode;
  /** DND player action palette; it only launches existing server-authoritative rolls. */
  dndActionPanel?: ReactNode;
}

const PUBLIC_INFO_FALLBACK = (
  <RuntimeActionPlaceholder body="公开信息：主持人发布给全桌的场景描述、线索与要点会显示在这里。" />
);

/**
 * Role-scoped unified Runtime dock actions (M25.1b / M29). 投骰 is one same-weight
 * tool. The caller supplies the dice panel and (M29) the real 公开信息 / 状态记录
 * panels, so the same dock works in local and multiplayer. Players do NOT see
 * host tools (状态记录 / 场景); a spectator does not roll by default.
 */
export function buildRuntimeDockActions(
  mode: RuntimeActionMode,
  dicePanel: ReactNode,
  extras?: RuntimeDockExtraPanels,
  systemId?: string,
): RuntimeDockAction[] {
  const isCoc = systemId === 'coc7e';
  const isDnd = systemId === 'dnd5e-2024';
  const publicInfoLabel = isCoc ? '公开线索' : '公开信息';
  const publicInfo: RuntimeDockAction = {
    id: 'publicInfo',
    label: publicInfoLabel,
    shortLabel: isCoc ? '线索' : '信息',
    panel: extras?.publicInfoPanel ?? PUBLIC_INFO_FALLBACK,
  };

  if (mode === 'spectator') {
    return [publicInfo];
  }
  if (mode === 'player') {
    return [
      ...(isDnd && extras?.dndActionPanel ? [{ id: 'dndActions', label: '动作', shortLabel: '动作', panel: extras.dndActionPanel }] : []),
      { id: 'dice', label: '投骰', panel: dicePanel },
      {
        id: 'actor',
        label: isCoc ? '我的调查员' : '我的角色',
        shortLabel: '角色',
        panel: extras?.actorPanel ?? (
          <RuntimeActionPlaceholder body="我的角色：查看并管理你的角色卡与角色状态。" />
        ),
      },
      publicInfo,
    ];
  }
  // host
  return [
    { id: 'dice', label: '投骰', panel: dicePanel },
    {
      id: 'scene',
      label: isCoc ? '当前地点' : '当前场景',
      shortLabel: isCoc ? '地点' : '场景',
      panel: extras?.scenePanel ?? (
        <RuntimeActionPlaceholder body="当前场景：设置本场的地点、氛围与参考图，同步给所有人。" />
      ),
    },
    publicInfo,
    {
      id: 'stateLog',
      label: isCoc ? '公开记录' : '状态记录',
      shortLabel: '记录',
      panel: extras?.stateLogPanel ?? (
        <RuntimeActionPlaceholder body="状态记录：随手记下伤害、线索与重要变化，全桌可见。" />
      ),
    },
    ...(isCoc && extras?.privateNotesPanel ? [{
      id: 'keeperNotes',
      label: 'Keeper 笔记',
      shortLabel: '笔记',
      panel: extras.privateNotesPanel,
    }] : []),
  ];
}
