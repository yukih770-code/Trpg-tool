import { useEffect, useState, type ReactNode } from 'react';

/**
 * RuntimeFullscreenShell (UI1b) — Owlbear-style STAGE-FIRST fullscreen layout.
 *
 * AI-LANDMARK: RUNTIME_FULLSCREEN_SHELL_V0
 *
 * Stage-first: a compact (~44px) Header sits on top, and the Main Stage fills the
 * entire area below it as "the tabletop". The Actor Rail, Inspector, Action Dock
 * and Log Drawer are FLOATING / COLLAPSIBLE OVERLAYS positioned absolutely over
 * the stage — they never sit in the document flow and never compress the stage.
 * Presentational LAYOUT only: NO map / token / fog / dice / state logic — callers
 * pass content into the slots. Used by both CampaignRuntimeShell and
 * RoomRuntimeEntryBridge. Panels use translucent surfaces + backdrop blur (core
 * Tailwind only — no new dependency).
 */

export type RuntimeShellMode = 'host' | 'player' | 'spectator';
export type RuntimeShellTone = 'dnd' | 'coc' | 'cp' | 'neutral';

export interface RuntimeFullscreenShellProps {
  title: string;
  systemId?: string;
  mode: RuntimeShellMode;
  tone?: RuntimeShellTone;
  roomCode?: string;
  connectionLabel?: string;
  /** Tone for the header connection dot: ok (live) / warn (down) / idle (connecting) / local (offline single-player). */
  connectionTone?: 'ok' | 'warn' | 'idle' | 'local';
  sceneLabel?: string;
  onExit?: () => void;
  exitLabel?: string;
  onSettings?: () => void;
  // Slots (callers provide content; sensible placeholders render when omitted).
  mainStage?: ReactNode;
  actorRail?: ReactNode;
  inspector?: ReactNode;
  actionDock?: ReactNode;
  logDrawer?: ReactNode;
}

const MODE_LABEL: Record<RuntimeShellMode, string> = {
  host: '主持人',
  player: '玩家',
  spectator: '旁观',
};

const TONE_ACCENT: Record<RuntimeShellTone, string> = {
  dnd: 'text-[#7a2810]',
  coc: 'text-[#2f7f68]',
  cp: 'text-[#b8901a]',
  neutral: 'text-slate-700',
};

// Role identity badge tone — so "who am I" reads at a glance in the header.
const MODE_TONE: Record<RuntimeShellMode, string> = {
  host: 'border-amber-500/50 bg-amber-500/15 text-amber-800',
  player: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-800',
  spectator: 'border-slate-400/50 bg-slate-400/10 text-slate-600',
};

const CONN_DOT: Record<'ok' | 'warn' | 'idle' | 'local', string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  idle: 'bg-slate-400 animate-pulse',
  local: 'bg-sky-500',
};

export function RuntimeFullscreenShell({
  title,
  systemId,
  mode,
  tone = 'neutral',
  roomCode,
  connectionLabel,
  connectionTone = 'idle',
  sceneLabel,
  onExit,
  exitLabel,
  onSettings,
  mainStage,
  actorRail,
  inspector,
  actionDock,
  logDrawer,
}: RuntimeFullscreenShellProps) {
  // Overlay open/collapsed state — keeps the Main Stage maximal by default.
  // Inspector defaults open for host (more tools), collapsed for player/spectator.
  const [railOpen, setRailOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(() => mode === 'host');
  const [logOpen, setLogOpen] = useState(false);

  // Lock body scroll while the fullscreen Runtime is mounted (no outer page
  // scrollbar). Restored on unmount.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const chip = 'rounded-full border border-slate-400/40 px-2 py-0.5 text-[10px] font-bold text-slate-600';
  const btn = 'rounded border border-slate-500/40 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';
  const panel = 'rounded-lg border border-slate-300/70 bg-white/80 shadow-lg backdrop-blur-sm';
  const railLabel = 'mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500';
  const iconBtn = 'rounded border border-slate-400/50 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-600';

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden overscroll-none bg-slate-100 text-[12px] text-slate-700">
      {/* Compact Runtime Header (~44px) */}
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-300 bg-white/85 px-3">
        <div className={`min-w-0 truncate text-sm font-black ${TONE_ACCENT[tone]}`}>
          {title}
          {roomCode ? <span className="ml-1.5 font-bold text-slate-400">#{roomCode}</span> : null}
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${MODE_TONE[mode]}`}>
          {MODE_LABEL[mode]}
        </span>
        {systemId && <span className={`${chip} hidden sm:inline`}>{systemId}</span>}
        {sceneLabel && <span className={`${chip} hidden md:inline`}>场景：{sceneLabel}</span>}
        {connectionLabel && (
          <span className={`${chip} hidden items-center gap-1.5 sm:inline-flex`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${CONN_DOT[connectionTone]}`} aria-hidden />
            {connectionLabel}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" className={btn} disabled onClick={onSettings} title="设置（即将推出）">设置</button>
          {onExit && <button type="button" className={btn} onClick={onExit}>{exitLabel ?? '离开'}</button>}
        </div>
      </header>

      {/* Stage area: Main Stage fills it; everything else floats over it. */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Main Stage (base layer, full bleed). The inner wrapper is h-full so a
            caller's mainStage can fill the whole tabletop instead of sizing to
            its own content (UI1b.1). */}
        <div className="absolute inset-0 p-3">
          <div className="h-full w-full">
            {mainStage ?? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-400/50 bg-white/30 p-8 text-center">
                <div>
                  <div className="text-sm font-bold text-slate-600">主舞台</div>
                  <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-slate-500">
                    这里是跑团桌面。地图、场景与角色标记将在后续版本开放。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Left Actor Rail — narrow strip, expands as overlay (does NOT compress stage) */}
        {actorRail !== undefined && (
          railOpen ? (
            <aside className={`absolute left-2 top-2 bottom-2 z-10 flex w-56 flex-col overflow-hidden ${panel}`}>
              <div className="flex items-center justify-between border-b border-slate-300/60 px-2 py-1">
                <span className={railLabel + ' mb-0'}>角色 / 成员</span>
                <button type="button" className={iconBtn} onClick={() => setRailOpen(false)} title="收起">◀</button>
              </div>
              <div className="overflow-y-auto p-2">{actorRail}</div>
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => setRailOpen(true)}
              className={`absolute left-2 top-2 z-10 w-12 ${panel} flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold text-slate-600`}
              title="展开角色 / 成员"
            >
              <span aria-hidden className="text-sm leading-none">☰</span>
              <span>成员</span>
            </button>
          )
        )}

        {/* Right Inspector — floating overlay, collapsible (does NOT compress stage) */}
        {inspectorOpen ? (
          <aside className={`absolute right-2 top-2 bottom-2 z-10 flex w-[min(340px,80vw)] flex-col overflow-hidden ${panel}`}>
            <div className="flex items-center justify-between border-b border-slate-300/60 px-2 py-1">
              <span className={railLabel + ' mb-0'}>
                {mode === 'host' ? '主持人检视器' : mode === 'player' ? '我的信息' : '旁观'}
              </span>
              <button type="button" className={iconBtn} onClick={() => setInspectorOpen(false)} title="收起">▶</button>
            </div>
            <div className="overflow-y-auto p-3">
              {inspector ?? <div className="text-[11px] italic text-slate-500">检视器内容后续接入。</div>}
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setInspectorOpen(true)}
            className={`absolute right-2 top-2 z-10 ${panel} px-2 py-1 text-[10px] font-bold text-slate-600`}
            title="展开检视器"
          >
            ◀ 检视器
          </button>
        )}

        {/* Bottom Action Dock — floating, centered, safe-area padded, above log.
            A provided actionDock brings its own container (e.g. RuntimeActionDock,
            which floats its own expanding panel); only the default fallback uses a pill. */}
        {actionDock ? (
          <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex max-w-[96vw] -translate-x-1/2 justify-center">
            {actionDock}
          </div>
        ) : (
          <div className={`absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 -translate-x-1/2 ${panel} rounded-full px-3 py-1.5`}>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
              <span className="font-bold uppercase tracking-wide text-slate-500">行动区</span>
              <button type="button" className={btn} disabled>投骰</button>
              <button type="button" className={btn} disabled>公开信息</button>
              <button type="button" className={btn} disabled>状态记录</button>
              <button type="button" className={btn} disabled>日志</button>
            </div>
          </div>
        )}

        {/* Log Drawer — bottom-left, collapsed by default, clears the rail; safe-area padded */}
        {logDrawer && (
          <div className={`absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-16 z-10 w-[min(420px,42vw)] overflow-hidden ${panel}`}>
            <button
              type="button"
              onClick={() => setLogOpen((v) => !v)}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-600"
            >
              <span>日志</span>
              <span className="text-[10px] text-slate-400">{logOpen ? '收起 ▼' : '展开 ▶'}</span>
            </button>
            {logOpen && <div className="max-h-[35vh] overflow-y-auto border-t border-slate-300/60 px-2 pb-2">{logDrawer}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
