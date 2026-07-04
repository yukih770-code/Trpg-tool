import {
  RUNTIME_INVENTORY_CAVEAT,
  RUNTIME_INVENTORY_OWNERSHIP_TIERS,
} from './runtimeInventoryBoundary';

/**
 * RuntimeInventoryBoundaryNote (M54) — inventory ownership boundary explainer.
 *
 * AI-LANDMARK: RUNTIME_INVENTORY_BOUNDARY_NOTE_V0
 *
 * Renders the three inventory ownership tiers (角色库背包 / 当前房间装备视图 /
 * 战役内背包实例) and the "records don't rewrite the vault" caveat from the
 * inventory boundary contract, so the copy has one source of truth. Pure text.
 */

export interface RuntimeInventoryBoundaryNoteProps {
  variant?: 'full' | 'compact';
}

export function RuntimeInventoryBoundaryNote({ variant = 'full' }: RuntimeInventoryBoundaryNoteProps) {
  if (variant === 'compact') {
    return <p className="text-[10px] leading-relaxed text-slate-400">{RUNTIME_INVENTORY_CAVEAT}</p>;
  }

  return (
    <div className="rounded border border-slate-300/50 bg-white/60 p-2 text-left">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">物品归属边界</div>
      <dl className="space-y-1 text-[10px] leading-relaxed text-slate-600">
        {RUNTIME_INVENTORY_OWNERSHIP_TIERS.map((tier) => (
          <div key={tier.id}>
            <dt className="inline font-bold text-slate-700">
              {tier.label}
              {tier.status === 'future' && (
                <span className="ml-1 rounded-full bg-slate-500/10 px-1 py-0.5 text-[8px] font-bold text-slate-500">后续</span>
              )}
              ：
            </dt>
            <dd className="inline"> {tier.description}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-1.5 border-t border-slate-300/40 pt-1.5 text-[10px] leading-relaxed text-slate-500">
        {RUNTIME_INVENTORY_CAVEAT}
      </p>
    </div>
  );
}
