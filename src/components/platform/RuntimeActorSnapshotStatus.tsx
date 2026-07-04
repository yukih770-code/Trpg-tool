/**
 * RuntimeActorSnapshotStatus (M62) — character data match-confidence banner.
 *
 * AI-LANDMARK: RUNTIME_ACTOR_SNAPSHOT_STATUS_V0
 *
 * A tiny, product-tone status line explaining WHERE the character sheet's data
 * came from and how confident the match is — so a player understands why their
 * sheet is connected / only bound / empty, without ever seeing raw ids or
 * developer phrasing. Pure presentational; driven by the resolver's confidence.
 */

export type RuntimeSnapshotConfidence = 'high' | 'medium' | 'low' | 'none';

export interface RuntimeActorSnapshotStatusProps {
  confidence?: RuntimeSnapshotConfidence;
  sourceLabel?: string;
}

export function RuntimeActorSnapshotStatus({ confidence, sourceLabel }: RuntimeActorSnapshotStatusProps) {
  if (!confidence || confidence === 'none') {
    return (
      <div className="rounded border border-slate-300/50 bg-white/60 px-2 py-1.5 text-[10px] leading-relaxed text-slate-500">
        当前系统暂未接入完整角色快照，仅显示房间绑定信息。
      </div>
    );
  }

  const tone =
    confidence === 'high'
      ? 'border-emerald-500/40 bg-emerald-50/50 text-emerald-800'
      : confidence === 'medium'
        ? 'border-amber-500/40 bg-amber-50/60 text-amber-800'
        : 'border-slate-300/50 bg-white/60 text-slate-500';

  const headline =
    confidence === 'high'
      ? '已连接本地角色库角色'
      : confidence === 'medium'
        ? '已通过角色名匹配本地角色库'
        : '仅使用房间绑定信息';

  const detail =
    confidence === 'high'
      ? '当前视图显示该角色库中的只读摘要。'
      : confidence === 'medium'
        ? '若显示内容不符合预期，请返回角色库确认角色名称。'
        : '尚未匹配到本地角色库中的完整角色卡；已显示房间绑定的角色名与状态。';

  return (
    <div className={`rounded border px-2 py-1.5 text-[10px] leading-relaxed ${tone}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            confidence === 'high' ? 'bg-emerald-500' : confidence === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
          }`}
          aria-hidden
        />
        <span className="font-bold">{headline}</span>
        {sourceLabel && confidence !== 'low' && <span className="opacity-70">· {sourceLabel}</span>}
      </div>
      <div className="mt-0.5 opacity-90">{detail}</div>
    </div>
  );
}
