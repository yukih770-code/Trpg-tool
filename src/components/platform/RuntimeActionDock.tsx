import { useEffect, useState, type ReactNode } from 'react';

export const RUNTIME_AUXILIARY_PANEL_OPEN_EVENT = 'runtime:auxiliary-panel-open';
export const RUNTIME_ACTION_DOCK_OPEN_EVENT = 'runtime:action-dock-open';
export const RUNTIME_ACTION_DOCK_DID_OPEN_EVENT = 'runtime:action-dock-did-open';
export const RUNTIME_MAP_PANEL_DID_OPEN_EVENT = 'runtime:map-panel-did-open';

export function requestRuntimeDockAction(actionId: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(RUNTIME_ACTION_DOCK_OPEN_EVENT, { detail: { actionId } }));
}

/**
 * RuntimeActionDock (M25.1a) — unified bottom Action Dock (pure UI).
 *
 * AI-LANDMARK: RUNTIME_ACTION_DOCK_V0
 * AI-LANDMARK: MOBILE_RUNTIME_ACTION_DOCK_HIERARCHY_V1
 * AI-LANDMARK: MOBILE_RUNTIME_OVERLAY_EXCLUSIVITY_V1
 * AI-LANDMARK: MOBILE_RUNTIME_MAP_PANEL_COORDINATION_V1
 *
 * Desktop presents the complete tool row. Compact screens keep up to three
 * role-prioritized actions visible and place lower-frequency tools in More.
 * Clicking a tool expands ONE floating panel above the row; clicking the active
 * tool again collapses it. Only one panel/menu is open at a time. Panels float
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
  /** Compact Runtime placement. Unspecified caller-added utilities safely overflow. */
  mobilePlacement?: 'primary' | 'direct' | 'overflow';
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
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const closeForAuxiliaryPanel = () => {
      setActiveId(null);
      setMoreOpen(false);
    };
    window.addEventListener(RUNTIME_AUXILIARY_PANEL_OPEN_EVENT, closeForAuxiliaryPanel);
    window.addEventListener(RUNTIME_MAP_PANEL_DID_OPEN_EVENT, closeForAuxiliaryPanel);
    return () => {
      window.removeEventListener(RUNTIME_AUXILIARY_PANEL_OPEN_EVENT, closeForAuxiliaryPanel);
      window.removeEventListener(RUNTIME_MAP_PANEL_DID_OPEN_EVENT, closeForAuxiliaryPanel);
    };
  }, []);

  useEffect(() => {
    const openRequestedAction = (event: Event) => {
      const actionId = (event as CustomEvent<{ actionId?: unknown }>).detail?.actionId;
      const requested = findOpenableRuntimeDockAction(actions, actionId);
      if (!requested) return;
      setMoreOpen(false);
      setActiveId(requested.id);
      window.dispatchEvent(new Event(RUNTIME_ACTION_DOCK_DID_OPEN_EVENT));
    };
    window.addEventListener(RUNTIME_ACTION_DOCK_OPEN_EVENT, openRequestedAction);
    return () => window.removeEventListener(RUNTIME_ACTION_DOCK_OPEN_EVENT, openRequestedAction);
  }, [actions]);

  useEffect(() => {
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setActiveId(null);
      setMoreOpen(false);
    };
    window.addEventListener('keydown', dismissOnEscape);
    return () => window.removeEventListener('keydown', dismissOnEscape);
  }, []);

  const toggle = (id: string) => {
    const opening = activeId !== id;
    setMoreOpen(false);
    setActiveId((cur) => (cur === id ? null : id));
    if (opening && findOpenableRuntimeDockAction(actions, id)) {
      window.dispatchEvent(new Event(RUNTIME_ACTION_DOCK_DID_OPEN_EVENT));
    }
  };

  const toggleMore = () => {
    const opening = !moreOpen;
    setActiveId(null);
    setMoreOpen(opening);
    if (opening) window.dispatchEvent(new Event(RUNTIME_ACTION_DOCK_DID_OPEN_EVENT));
  };

  const baseBtn = 'min-h-10 shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1 text-[11px] font-bold transition md:min-h-0 md:rounded md:px-2';
  const idle = 'border-slate-400/50 bg-white/70 text-slate-700 hover:bg-white';
  const activeCls = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-800';
  const comingSoon = 'border-slate-300/50 bg-white/40 text-slate-400 hover:bg-white/60';

  const panelActions = actions.filter((a) => a.panel !== undefined || a.disabledReason);
  const { direct: mobileDirectActions, overflow: mobileOverflowActions } = splitRuntimeDockActionsForMobile(actions);
  const activeOverflowAction = mobileOverflowActions.find((action) => action.id === activeId);

  return (
    <div className={`relative w-full rounded-xl border border-slate-300/70 bg-white/90 p-1 shadow-lg backdrop-blur-sm md:w-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none ${className ?? ''}`}>
      {/* Floating panel(s) above the row — all mounted, only the active one shown. */}
      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2">
        {panelActions.map((a) => (
          <div
            key={a.id}
            className={`${a.id === activeId ? '' : 'hidden'} w-[calc(100vw_-_1rem)] max-w-[560px] max-h-[65vh] overflow-y-auto rounded-xl border border-slate-300/70 bg-white/95 p-3 shadow-lg backdrop-blur-sm md:w-[min(560px,92vw)] md:max-h-[60vh]`}
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
        {moreOpen && mobileOverflowActions.length > 0 && (
          <div className="w-[calc(100vw_-_1rem)] max-w-[420px] rounded-xl border border-slate-300/70 bg-white/95 p-3 shadow-lg backdrop-blur-sm md:hidden">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-700">更多工具</span>
              <button type="button" onClick={() => setMoreOpen(false)} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-500">关闭</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {mobileOverflowActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled={action.disabled}
                  title={action.disabledReason}
                  onClick={() => {
                    if (action.disabled) return;
                    setMoreOpen(false);
                    setActiveId(action.id);
                    if (action.panel !== undefined) {
                      window.dispatchEvent(new Event(RUNTIME_ACTION_DOCK_DID_OPEN_EVENT));
                    }
                  }}
                  className="min-h-11 rounded-lg border border-slate-300/70 bg-white px-2.5 py-2 text-left text-[11px] font-bold text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <span className="block">{action.label}</span>
                  {action.disabledReason && <span className="mt-0.5 block text-[9px] font-normal text-slate-400">{action.disabledReason}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compact screens keep immediate actions visible and move utilities into
          an explicit More menu. Desktop retains the complete action row. */}
      <div className="flex items-center gap-1 md:hidden">
        {mobileDirectActions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={action.disabled}
            onClick={() => {
              if (!action.disabled) toggle(action.id);
            }}
            aria-pressed={activeId === action.id}
            title={action.disabledReason ?? (action.disabled ? '即将推出' : undefined)}
            className={`${baseBtn} min-w-0 flex-1 ${activeId === action.id ? activeCls : action.disabled ? comingSoon : action.mobilePlacement === 'primary' ? 'border-slate-800 bg-slate-800 text-white' : idle}`}
          >
            {action.shortLabel ?? action.label}
          </button>
        ))}
        {mobileOverflowActions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              toggleMore();
            }}
            aria-expanded={moreOpen}
            className={`${baseBtn} min-w-[4.25rem] ${moreOpen || activeOverflowAction ? activeCls : idle}`}
          >
            {activeOverflowAction?.shortLabel ?? '更多'}
          </button>
        )}
      </div>

      <div className="hidden flex-wrap items-center justify-center gap-1 md:flex">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={a.disabled}
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

export function findOpenableRuntimeDockAction(
  actions: readonly RuntimeDockAction[],
  actionId: unknown,
): RuntimeDockAction | undefined {
  if (typeof actionId !== 'string') return undefined;
  return actions.find((action) => action.id === actionId && !action.disabled && action.panel !== undefined);
}

export function splitRuntimeDockActionsForMobile(actions: readonly RuntimeDockAction[]): { direct: RuntimeDockAction[]; overflow: RuntimeDockAction[] } {
  const prioritized = actions.filter((action) => action.mobilePlacement === 'primary');
  const direct = [...prioritized, ...actions.filter((action) => action.mobilePlacement === 'direct')].slice(0, 3);
  const directIds = new Set(direct.map((action) => action.id));
  return { direct, overflow: actions.filter((action) => !directIds.has(action.id)) };
}

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
    mobilePlacement: mode === 'player' && isDnd && !!extras?.dndActionPanel ? 'overflow' : 'direct',
    panel: extras?.publicInfoPanel ?? PUBLIC_INFO_FALLBACK,
  };

  if (mode === 'spectator') {
    return [{ ...publicInfo, mobilePlacement: 'primary' }];
  }
  if (mode === 'player') {
    return [
      ...(isDnd && extras?.dndActionPanel ? [{ id: 'dndActions', label: '动作', shortLabel: '动作', mobilePlacement: 'primary' as const, panel: extras.dndActionPanel }] : []),
      { id: 'dice', label: '投骰', mobilePlacement: isDnd && extras?.dndActionPanel ? 'direct' : 'primary', panel: dicePanel },
      {
        id: 'actor',
        label: isCoc ? '我的调查员' : '我的角色',
        shortLabel: '角色',
        mobilePlacement: 'direct',
        panel: extras?.actorPanel ?? (
          <RuntimeActionPlaceholder body="我的角色：查看并管理你的角色卡与角色状态。" />
        ),
      },
      publicInfo,
    ];
  }
  // host
  return [
    ...(isDnd && extras?.dndActionPanel ? [{ id: 'dndActions', label: '攻击动作', shortLabel: '攻击', mobilePlacement: 'direct' as const, panel: extras.dndActionPanel }] : []),
    { id: 'dice', label: '投骰', mobilePlacement: 'primary', panel: dicePanel },
    {
      id: 'scene',
      label: isCoc ? '当前地点' : '当前场景',
      shortLabel: isCoc ? '地点' : '场景',
      mobilePlacement: 'direct',
      panel: extras?.scenePanel ?? (
        <RuntimeActionPlaceholder body="当前场景：设置本场的地点、氛围与参考图，同步给所有人。" />
      ),
    },
    publicInfo,
    {
      id: 'stateLog',
      label: isCoc ? '公开记录' : '状态记录',
      shortLabel: '记录',
      mobilePlacement: 'overflow',
      panel: extras?.stateLogPanel ?? (
        <RuntimeActionPlaceholder body="状态记录：随手记下伤害、线索与重要变化，全桌可见。" />
      ),
    },
    ...(isCoc && extras?.privateNotesPanel ? [{
      id: 'keeperNotes',
      label: 'Keeper 笔记',
      shortLabel: '笔记',
      mobilePlacement: 'overflow' as const,
      panel: extras.privateNotesPanel,
    }] : []),
  ];
}
