/**
 * RuntimeActorBoundaryNote (M48) — actor instance boundary explainer.
 *
 * AI-LANDMARK: RUNTIME_ACTOR_BOUNDARY_NOTE_V0
 *
 * A tiny, honest UI block that separates three concepts so the interface never
 * pretends to do more than it does:
 *   - 角色库角色: the player's saved original, maintained in the character library.
 *   - 当前房间角色: the snapshot/reference bound & admitted for THIS runtime.
 *   - 战役内角色实例: the FUTURE authoritative instance that will persist in-campaign
 *     HP / resources / growth. Not implemented yet.
 * It also states that this session's manual state log stays in the log/recap and
 * does NOT rewrite the character library original. Pure presentational text.
 */

export interface RuntimeActorBoundaryNoteProps {
  /** 'full' shows the three tiers; 'compact' shows only the one-line caveat. */
  variant?: 'full' | 'compact';
}

export function RuntimeActorBoundaryNote({ variant = 'full' }: RuntimeActorBoundaryNoteProps) {
  if (variant === 'compact') {
    return (
      <p className="text-[10px] leading-relaxed text-slate-500">
        这是跑团中的只读角色视图。本场的手动状态记录会进入日志与回顾，
        <span className="font-bold">不会自动修改角色库原件</span>；战役内角色实例与成长回流将在后续版本接入。
      </p>
    );
  }

  return (
    <div className="rounded border border-slate-300/50 bg-white/60 p-2 text-left">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">角色数据边界</div>
      <dl className="space-y-1 text-[10px] leading-relaxed text-slate-600">
        <div>
          <dt className="inline font-bold text-slate-700">角色库角色：</dt>
          <dd className="inline"> 你保存的原始角色，在角色库中维护。</dd>
        </div>
        <div>
          <dt className="inline font-bold text-slate-700">当前房间角色：</dt>
          <dd className="inline"> 本次进入 Runtime 时绑定 / 准入的角色快照。</dd>
        </div>
        <div>
          <dt className="inline font-bold text-slate-700">战役内角色实例：</dt>
          <dd className="inline"> 未来用于保存战役内 HP、资源、成长与结算的权威实例（后续版本接入）。</dd>
        </div>
      </dl>
      <p className="mt-1.5 border-t border-slate-300/40 pt-1.5 text-[10px] leading-relaxed text-slate-500">
        本场的手动状态记录会进入日志与回顾，<span className="font-bold">不会自动改写角色库原件</span>。
      </p>
    </div>
  );
}
