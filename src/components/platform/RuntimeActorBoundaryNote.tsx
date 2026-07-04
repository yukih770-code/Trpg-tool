import {
  RUNTIME_ACTOR_BOUNDARY_TIERS,
  RUNTIME_ACTOR_INSTANCE_FUTURE_NOTE,
  RUNTIME_STATE_LOG_CAVEAT,
} from './runtimeActorInstanceBoundary';

/**
 * RuntimeActorBoundaryNote (M48 → M51 contract-driven) — actor boundary explainer.
 *
 * AI-LANDMARK: RUNTIME_ACTOR_BOUNDARY_NOTE_V0
 *
 * Renders the four-tier actor boundary (角色库 / 房间绑定 / Runtime 快照 / 战役内实例)
 * and the state-log caveat straight from the boundary contract module, so the copy
 * has ONE source of truth. Pure presentational text — no storage, no write-back.
 */

export interface RuntimeActorBoundaryNoteProps {
  /** 'full' shows the tiers + future note; 'compact' shows only the caveat line. */
  variant?: 'full' | 'compact';
}

export function RuntimeActorBoundaryNote({ variant = 'full' }: RuntimeActorBoundaryNoteProps) {
  if (variant === 'compact') {
    return (
      <p className="text-[10px] leading-relaxed text-slate-500">
        这是跑团中的只读角色视图。{RUNTIME_STATE_LOG_CAVEAT}
        <span className="ml-1 text-slate-400">战役内角色实例与成长回流将在后续版本接入。</span>
      </p>
    );
  }

  return (
    <div className="rounded border border-slate-300/50 bg-white/60 p-2 text-left">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">角色数据边界</div>
      <dl className="space-y-1 text-[10px] leading-relaxed text-slate-600">
        {RUNTIME_ACTOR_BOUNDARY_TIERS.map((tier) => (
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
        {RUNTIME_STATE_LOG_CAVEAT}
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{RUNTIME_ACTOR_INSTANCE_FUTURE_NOTE}</p>
    </div>
  );
}
