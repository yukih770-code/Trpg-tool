/**
 * CharacterClearanceSummary (M73) — character / clearance PLACEHOLDER surface.
 *
 * AI-LANDMARK: CHARACTER_CLEARANCE_SUMMARY_V0
 *
 * Reserves display space for character binding + clearance WITHOUT pretending a
 * real clearance system exists yet. There is no rule validation, no AI, no
 * approval engine here — it only shows the lightweight facts the app already has
 * (bound actor, data source, admission/ready) plus honest "完整安检将在角色数据
 * 完善后启用" copy. Two variants:
 *   - 'full'    → campaign detail (host prep): reserves the fuller clearance block.
 *   - 'compact' → in-runtime settings: a light current-actor / admission summary.
 */

export interface CharacterClearanceSummaryProps {
  variant?: 'full' | 'compact';
  actorName?: string;
  systemLabel?: string;
  sourceLabel?: string;
  /** Localized admission / clearance label if the room provided one. */
  admissionLabel?: string;
  /** True when the resolver couldn't match a local character (needs a look). */
  needsRecheck?: boolean;
  /** Local runtime has no room approval — clearance is N/A, not "failed". */
  local?: boolean;
}

function Row({ k, v, tone }: { k: string; v: string; tone?: 'ok' | 'warn' | 'muted' }) {
  const valueTone =
    tone === 'ok' ? 'text-emerald-700' : tone === 'warn' ? 'text-amber-700' : tone === 'muted' ? 'text-slate-400' : 'text-slate-800';
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/60 py-1 last:border-b-0">
      <span className="text-[10px] uppercase tracking-wide text-slate-500">{k}</span>
      <span className={`text-right text-[11px] font-bold ${valueTone}`}>{v}</span>
    </div>
  );
}

export function CharacterClearanceSummary({
  variant = 'compact',
  actorName,
  systemLabel,
  sourceLabel,
  admissionLabel,
  needsRecheck,
  local,
}: CharacterClearanceSummaryProps) {
  const actorValue = actorName?.trim() || '未选择角色';
  const admissionValue = local
    ? '本地运行 · 无需房间准入'
    : admissionLabel?.trim() || '待准入';
  const recheckValue = needsRecheck ? '建议复核（未匹配本地角色库）' : '暂无需重新安检';

  if (variant === 'compact') {
    return (
      <div className="rounded border border-slate-300/60 bg-white/70 p-2.5 text-left">
        <div className="mb-1 text-[11px] font-bold text-slate-700">角色 / 准入</div>
        <div className="space-y-0">
          <Row k="当前角色" v={actorValue} />
          <Row k="准入状态" v={admissionValue} tone={local ? 'muted' : admissionLabel ? 'ok' : 'warn'} />
          {sourceLabel && <Row k="角色卡来源" v={sourceLabel} />}
          <Row k="是否需要重新安检" v={recheckValue} tone={needsRecheck ? 'warn' : 'muted'} />
        </div>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
          完整角色安检将在角色数据完善后启用；当前仅显示轻量摘要，不会自动修改角色卡。
        </p>
      </div>
    );
  }

  // Full — campaign detail host prep. Reserves the space; does not fake clearance.
  return (
    <div className="rounded-lg border border-slate-300/60 bg-white/70 p-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold text-slate-700">角色绑定 / 安检</div>
        <span className="rounded-full border border-slate-400/40 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">占位 · 待完善</span>
      </div>
      <div className="mt-2 space-y-0">
        <Row k="当前绑定角色" v={actorValue} />
        {systemLabel && <Row k="系统" v={systemLabel} />}
        {sourceLabel && <Row k="角色卡来源" v={sourceLabel} />}
        <Row k="角色卡摘要" v={sourceLabel ? '可在 Runtime「我的角色」查看' : '待角色数据完善'} tone="muted" />
        <Row k="安检状态" v="未启用（占位）" tone="muted" />
        <Row k="准入状态" v={admissionValue} tone={local ? 'muted' : admissionLabel ? 'ok' : 'warn'} />
        <Row k="是否需要复核" v={recheckValue} tone={needsRecheck ? 'warn' : 'muted'} />
        <Row k="主持人审批状态" v="未启用（占位）" tone="muted" />
      </div>
      <p className="mt-2 border-t border-slate-300/40 pt-2 text-[10px] leading-relaxed text-slate-500">
        完整安检将在角色数据（规则字段）完善后启用：确定性系统规则做硬校验，AI 仅做差异总结与异常提示，主持人做最终确认。当前为预留展示，不代表已完成安检。
      </p>
    </div>
  );
}
