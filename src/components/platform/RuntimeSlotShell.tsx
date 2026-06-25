import type { ReactNode } from 'react';

import {
  getRuntimeLayoutModeContract,
  type RuntimeLayoutMode,
  type RuntimeLayoutSlotId,
  type RuntimeProjectionRole,
} from '../../lib/platform/runtimeLayoutTypes';

/**
 * RuntimeSlotShell (v0) — placeholder layout renderer with a slot content API.
 *
 * AI-LANDMARK: RUNTIME_SLOT_SHELL_SKELETON_V0
 *
 * Renders the platform layout SLOTS for a given mode + projection role, driven
 * by `runtimeLayoutTypes` contracts. Callers may inject content per slot via
 * `slotContent`; slots without injected content show a placeholder. It is still
 * a skeleton: no real map engine, no tokens/drag/vision/measure/AOE/fog, no real
 * Action Dock, and no system rule content (AC/SAN/spell slots etc. are NOT
 * rendered here — those belong to future system panels mounted into these slots).
 */

const SLOT_LABELS: Record<RuntimeLayoutSlotId, string> = {
  runtimeCanvas: 'Runtime Canvas',
  actorRail: 'Actor Rail',
  turnOrFocusRail: 'Turn / Focus Rail',
  contextInspector: 'Context Inspector',
  actionDock: 'Action Dock',
  logDrawer: 'Log Drawer',
  toolPalette: 'Tool Palette',
  handoutPanel: 'Handout Panel',
  notesPanel: 'Notes Panel',
  systemPanel: 'System Panel',
  devPanel: 'Dev Panel',
};

const CANVAS_PLACEHOLDER_TEXT: Record<RuntimeLayoutMode, string> = {
  tacticalMap: 'Tactical Map Canvas Placeholder',
  theaterScene: 'Theater Scene Canvas Placeholder',
  investigationCase: 'Investigation Case Board Placeholder',
};

const CANVAS_PLACEHOLDER_HINT: Record<RuntimeLayoutMode, string> = {
  tacticalMap: '未来：地图 / token / 网格 / 范围（本轮不实现）。',
  theaterScene: '未来：场景图 / NPC 焦点 / handout（本轮不实现）。',
  investigationCase: '未来：线索板 / 关系图 / 证据（本轮不实现）。',
};

/** Per-slot content overrides supplied by the caller. */
export type RuntimeSlotContentMap = Partial<Record<RuntimeLayoutSlotId, ReactNode>>;

export interface RuntimeSlotShellProps {
  mode: RuntimeLayoutMode;
  role: RuntimeProjectionRole;
  tone?: string;
  title?: string;
  children?: ReactNode;
  /** Inject real/temporary content into specific slots; missing slots show a placeholder. */
  slotContent?: RuntimeSlotContentMap;
  /** Show the slot placement/state subtext + hidden-slot debug listing. Default true. */
  showSlotDebug?: boolean;
}

export function RuntimeSlotShell({
  mode,
  role,
  title,
  children,
  slotContent,
  showSlotDebug = true,
}: RuntimeSlotShellProps) {
  const contract = getRuntimeLayoutModeContract(mode);
  if (!contract) {
    return (
      <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-50/60 p-3 text-[11px] text-rose-800">
        Unknown runtime layout mode: {mode}
      </div>
    );
  }

  const projection = contract.projections.find((p) => p.role === role);
  const visibleSlots = projection?.visibleSlots ?? [];
  const hiddenSlots = projection?.hiddenSlots ?? [];
  const expandedSet = new Set(projection?.defaultExpandedSlots ?? []);
  const content = slotContent ?? {};

  const slotById = new Map(contract.slots.map((s) => [s.id, s] as const));
  const visibleNonCanvas = visibleSlots.filter((id) => id !== 'runtimeCanvas');
  const canvasVisible = visibleSlots.includes('runtimeCanvas');
  const canvasOverride = content.runtimeCanvas;

  return (
    <div className="mt-3 rounded-lg border border-slate-400/40 bg-slate-50/60 p-3 text-[11px] text-slate-800">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-400/30 pb-1.5">
        <span className="text-xs font-black uppercase tracking-wide">{title ?? 'Runtime Layout Shell'}</span>
        <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[9px] font-bold">
          mode: {mode} · role: {role} · canvas: {contract.canvasKind} · placeholder
        </span>
      </div>

      {/* Canvas slot — caller override or mode-specific placeholder */}
      {canvasVisible && (
        <div className="mb-2 rounded border border-dashed border-slate-400/50 bg-white/50 p-3">
          {canvasOverride ?? (
            <div className="flex min-h-[80px] flex-col items-center justify-center text-center">
              <div className="text-xs font-bold">{CANVAS_PLACEHOLDER_TEXT[mode]}</div>
              <div className="mt-1 text-[10px] opacity-60">{CANVAS_PLACEHOLDER_HINT[mode]}</div>
            </div>
          )}
          {children}
        </div>
      )}

      {/* Visible (non-canvas) slots — caller override or placeholder card */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {visibleNonCanvas.map((id) => {
          const def = slotById.get(id);
          const expanded = expandedSet.has(id);
          const slotOverride = content[id];
          return (
            <div
              key={id}
              className={`rounded border px-2 py-1.5 ${expanded ? 'border-slate-500/50 bg-white/70' : 'border-slate-400/25 bg-white/40'}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold">{SLOT_LABELS[id]}</span>
                {showSlotDebug && (
                  <span className="text-[8px] uppercase opacity-50">{expanded ? 'expanded' : (def?.defaultState ?? 'collapsed')}</span>
                )}
              </div>
              {showSlotDebug && (
                <div className="mt-0.5 text-[9px] opacity-55">
                  {def ? `${def.placement} · ${def.isPlatformOwned ? 'platform' : 'system'}${def.allowsSystemContent ? ' · system-content' : ''}` : '—'}
                </div>
              )}
              <div className="mt-1">
                {slotOverride ?? <div className="text-[10px] italic opacity-45">placeholder</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden slots (debug listing only — never rendered as content) */}
      {showSlotDebug && hiddenSlots.length > 0 && (
        <div className="mt-2 text-[9px] opacity-50">
          hidden for {role}: {hiddenSlots.map((id) => SLOT_LABELS[id]).join(', ')}
        </div>
      )}
    </div>
  );
}
