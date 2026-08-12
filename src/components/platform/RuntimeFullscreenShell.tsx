import { useEffect, useId, useState, type ReactNode } from 'react';
import {
  hasOpenRuntimeAuxiliaryPanel,
  initialRuntimeAuxiliaryPanels,
  reduceRuntimeAuxiliaryPanels,
  type RuntimeAuxiliaryPanel,
} from '../../lib/platform/runtimeOverlayCoordination';
import { RUNTIME_ACTION_DOCK_DID_OPEN_EVENT, RUNTIME_AUXILIARY_PANEL_OPEN_EVENT } from './RuntimeActionDock';

/**
 * RuntimeFullscreenShell (UI1b) — Owlbear-style STAGE-FIRST fullscreen layout.
 *
 * AI-LANDMARK: RUNTIME_FULLSCREEN_SHELL_V0
 * AI-LANDMARK: MOBILE_RUNTIME_OVERLAY_EXCLUSIVITY_V1
 * AI-LANDMARK: MOBILE_RUNTIME_SUPPORTING_SHEET_V1
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
  /** Small, temporary runtime interaction surface such as Token inspection. */
  overlay?: ReactNode;
  /** Compact, always-visible mobile status such as the active combat turn. */
  mobileStatus?: ReactNode;
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

function isCompactRuntimeViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

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
  overlay,
  mobileStatus,
  actionDock,
  logDrawer,
}: RuntimeFullscreenShellProps) {
  // Overlay open/collapsed state — keeps the Main Stage maximal by default.
  // Desktop hosts start with the overview open. Mobile always starts map-first:
  // supporting information is available through the compact panel switcher.
  const [auxiliaryPanels, setAuxiliaryPanels] = useState(
    () => initialRuntimeAuxiliaryPanels(mode === 'host' && !isCompactRuntimeViewport()),
  );
  const { railOpen, inspectorOpen, logOpen } = auxiliaryPanels;
  const supportingSheetOpen = hasOpenRuntimeAuxiliaryPanel(auxiliaryPanels);
  const runtimeShellId = useId();
  const railPanelId = `${runtimeShellId}-members`;
  const inspectorPanelId = `${runtimeShellId}-inspector`;
  const logPanelId = `${runtimeShellId}-log`;
  const inspectorLabel = mode === 'host' ? '主持人检视器' : mode === 'player' ? '我的信息' : '旁观';
  const mobileInspectorLabel = mode === 'host' ? '概览' : mode === 'player' ? '我的信息' : '旁观';

  const closeAuxiliaryPanels = () => {
    setAuxiliaryPanels((current) => reduceRuntimeAuxiliaryPanels(current, { type: 'close-all' }));
  };

  const toggleAuxiliaryPanel = (panel: RuntimeAuxiliaryPanel) => {
    const compact = isCompactRuntimeViewport();
    const key = panel === 'rail' ? 'railOpen' : panel === 'inspector' ? 'inspectorOpen' : 'logOpen';
    const opening = !auxiliaryPanels[key];
    if (opening && compact) {
      window.dispatchEvent(new Event(RUNTIME_AUXILIARY_PANEL_OPEN_EVENT));
    }
    setAuxiliaryPanels((current) => reduceRuntimeAuxiliaryPanels(current, { type: 'toggle', panel, compact }));
  };

  // Lock body scroll while the fullscreen Runtime is mounted (no outer page
  // scrollbar). Restored on unmount.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const closeMobileAuxiliaryPanelsForDock = () => {
      if (isCompactRuntimeViewport()) closeAuxiliaryPanels();
    };
    window.addEventListener(RUNTIME_ACTION_DOCK_DID_OPEN_EVENT, closeMobileAuxiliaryPanelsForDock);
    return () => window.removeEventListener(RUNTIME_ACTION_DOCK_DID_OPEN_EVENT, closeMobileAuxiliaryPanelsForDock);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuxiliaryPanels();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const chip = 'rounded-full border border-slate-400/40 px-2 py-0.5 text-[10px] font-bold text-slate-600';
  const btn = 'rounded border border-slate-500/40 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';
  const panel = 'rounded-lg border border-slate-300/70 bg-white/80 shadow-lg backdrop-blur-sm';
  const railLabel = 'mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500';
  const iconBtn = 'rounded border border-slate-400/50 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-600';

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden overscroll-none bg-slate-100 text-[12px] text-slate-700">
      {/* Compact Runtime Header (~44px) */}
      <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-slate-300 bg-white/90 px-2 sm:h-11 sm:gap-2 sm:px-3">
        <div className={`min-w-0 flex-1 truncate text-sm font-black sm:flex-none ${TONE_ACCENT[tone]}`}>
          {title}
          {roomCode ? <span className="ml-1.5 hidden font-bold text-slate-400 sm:inline">#{roomCode}</span> : null}
        </div>
        <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold sm:px-2 ${MODE_TONE[mode]}`}>
          {MODE_LABEL[mode]}
        </span>
        {systemId && <span className={`${chip} hidden sm:inline`}>{systemId}</span>}
        {sceneLabel && <span className={`${chip} hidden md:inline`}>场景：{sceneLabel}</span>}
        {connectionLabel && (
          <>
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300/70 sm:hidden"
              title={connectionLabel}
              aria-label={connectionLabel}
            >
              <span className={`inline-block h-2 w-2 rounded-full ${CONN_DOT[connectionTone]}`} aria-hidden />
            </span>
            <span className={`${chip} hidden items-center gap-1.5 sm:inline-flex`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${CONN_DOT[connectionTone]}`} aria-hidden />
              {connectionLabel}
            </span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {onSettings && <button type="button" className={btn} onClick={onSettings}>设置</button>}
          {onExit && (
            <button type="button" className={`${btn} shrink-0 py-1`} onClick={onExit} title={exitLabel ?? '离开'}>
              <span className="sm:hidden">返回</span>
              <span className="hidden sm:inline">{exitLabel ?? '离开'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Stage area: Main Stage fills it; everything else floats over it. */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Main Stage (base layer, full bleed). The inner wrapper is h-full so a
            caller's mainStage can fill the whole tabletop instead of sizing to
            its own content (UI1b.1). */}
        <div className="absolute inset-0 p-0 sm:p-2 lg:p-3">
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

        {supportingSheetOpen && (
          <button
            type="button"
            aria-label="返回地图"
            title="返回地图"
            onClick={closeAuxiliaryPanels}
            className="absolute inset-0 z-[25] bg-slate-950/25 backdrop-blur-[1px] md:hidden"
          />
        )}

        {/* Left Actor Rail — narrow strip, expands as overlay (does NOT compress stage) */}
        {actorRail !== undefined && (
          railOpen ? (
            <aside id={railPanelId} aria-label="角色 / 成员" className={`absolute inset-x-2 bottom-16 z-30 flex max-h-[70vh] w-auto flex-col overflow-hidden md:inset-y-2 md:left-2 md:right-auto md:max-h-none md:w-56 ${panel}`}>
              <div className="flex items-center justify-between border-b border-slate-300/60 px-2 py-1">
                <span className={railLabel + ' mb-0'}>角色 / 成员</span>
                <button type="button" className={iconBtn} onClick={() => toggleAuxiliaryPanel('rail')} title="收起">关闭</button>
              </div>
              <div className="overflow-y-auto p-2">{actorRail}</div>
            </aside>
          ) : (
            <button
              type="button"
              onClick={() => toggleAuxiliaryPanel('rail')}
              aria-controls={railPanelId}
              aria-expanded={railOpen}
              className={`absolute left-2 top-2 z-10 hidden w-12 md:flex ${panel} flex-col items-center gap-0.5 py-1.5 text-[10px] font-bold text-slate-600`}
              title="展开角色 / 成员"
            >
              <span aria-hidden className="text-sm leading-none">☰</span>
              <span>成员</span>
            </button>
          )
        )}

        {/* Right Inspector — floating overlay, collapsible (does NOT compress stage) */}
        {inspectorOpen ? (
          <aside id={inspectorPanelId} aria-label={inspectorLabel} className={`absolute inset-x-2 bottom-16 z-30 flex max-h-[70vh] w-auto flex-col overflow-hidden md:inset-y-2 md:left-auto md:right-2 md:max-h-none md:w-[min(340px,80vw)] ${panel}`}>
            <div className="flex items-center justify-between border-b border-slate-300/60 px-2 py-1">
              <span className={railLabel + ' mb-0'}>
                {inspectorLabel}
              </span>
              <button type="button" className={iconBtn} onClick={() => toggleAuxiliaryPanel('inspector')} title="收起">关闭</button>
            </div>
            <div className="overflow-y-auto p-3">
              {inspector ?? <div className="text-[11px] italic text-slate-500">检视器内容后续接入。</div>}
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => toggleAuxiliaryPanel('inspector')}
            aria-controls={inspectorPanelId}
            aria-expanded={inspectorOpen}
            className={`absolute right-2 top-2 z-10 hidden md:block ${panel} px-2 py-1 text-[10px] font-bold text-slate-600`}
            title="展开检视器"
          >
            ◀ 检视器
          </button>
        )}

        {/* Mobile supporting panels share one compact switcher. Only one may cover
            the map at a time; the tabletop remains the default surface. */}
        <div role="toolbar" aria-label="运行时信息面板" className="absolute left-1/2 top-2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-300/70 bg-white/90 p-1 shadow-lg backdrop-blur-sm md:hidden">
          {actorRail !== undefined && (
            <button type="button" onClick={() => toggleAuxiliaryPanel('rail')} aria-controls={railPanelId} aria-pressed={railOpen} className={`min-h-9 rounded-lg px-2.5 text-[11px] font-bold ${railOpen ? 'bg-slate-800 text-white' : 'text-slate-700'}`}>
              成员
            </button>
          )}
          <button type="button" onClick={() => toggleAuxiliaryPanel('inspector')} aria-controls={inspectorPanelId} aria-pressed={inspectorOpen} className={`min-h-9 rounded-lg px-2.5 text-[11px] font-bold ${inspectorOpen ? 'bg-slate-800 text-white' : 'text-slate-700'}`}>
            {mobileInspectorLabel}
          </button>
          {logDrawer && (
            <button type="button" onClick={() => toggleAuxiliaryPanel('log')} aria-controls={logPanelId} aria-pressed={logOpen} className={`min-h-9 rounded-lg px-2.5 text-[11px] font-bold ${logOpen ? 'bg-slate-800 text-white' : 'text-slate-700'}`}>
              日志
            </button>
          )}
        </div>

        {mobileStatus && (
          <div className="pointer-events-none absolute inset-x-2 top-[3.75rem] z-20 md:hidden">
            {mobileStatus}
          </div>
        )}

        {/* Bottom Action Dock — floating, centered, safe-area padded, above log.
            A provided actionDock brings its own container (e.g. RuntimeActionDock,
            which floats its own expanding panel); only the default fallback uses a pill. */}
        {actionDock ? (
          <div
            className="absolute inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 flex justify-center md:inset-x-auto md:bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:left-1/2 md:max-w-[96vw] md:-translate-x-1/2"
            onClickCapture={() => {
              if (isCompactRuntimeViewport()) closeAuxiliaryPanels();
            }}
          >
            {actionDock}
          </div>
        ) : (
          <div className={`absolute inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 ${panel} rounded-xl px-3 py-1.5 md:rounded-full`}>
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
          <div id={logPanelId} role="region" aria-label="日志" className={`absolute inset-x-2 bottom-16 z-30 max-h-[70vh] overflow-hidden md:inset-x-auto md:bottom-[max(0.75rem,env(safe-area-inset-bottom))] md:left-16 md:z-10 md:w-[min(420px,42vw)] ${logOpen ? '' : 'hidden md:block'} ${panel}`}>
            <button
              type="button"
              onClick={() => toggleAuxiliaryPanel('log')}
              className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-600"
            >
              <span>日志</span>
              <span className="text-[10px] text-slate-400">{logOpen ? '收起 ▼' : '展开 ▶'}</span>
            </button>
            {logOpen && <div className="max-h-[62vh] overflow-y-auto border-t border-slate-300/60 px-2 pb-2 md:max-h-[35vh]">{logDrawer}</div>}
          </div>
        )}

        {overlay}
      </div>
    </div>
  );
}
