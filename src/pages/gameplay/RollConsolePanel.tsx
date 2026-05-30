import type { RuntimeLogEntry, RuntimeLogKind } from '../../lib/runtime-log-types';

interface RollConsolePanelProps {
  combatLog: RuntimeLogEntry[];
}

function dndLogColor(entry: RuntimeLogEntry): string {
  if (entry.tags?.includes('nat20')) return 'text-yellow-700 font-bold';
  if (entry.tags?.includes('nat1')) return 'text-red-800 font-bold';
  if (entry.outcome === '成功') return 'text-emerald-700 font-bold';
  if (entry.outcome === '失败') return 'text-red-600 font-bold';
  if (entry.kind === 'system') return 'text-[#8a5a4a] italic';
  if (entry.kind === 'action') return 'text-[#58180d] font-bold';
  if (entry.kind === 'check') return 'text-[#3a1712] font-bold';
  return 'text-[#4a241c]';
}

export function RollConsolePanel({
  combatLog,
}: RollConsolePanelProps) {
  const latestResult = combatLog[0];
  const latestKindLabel: Record<RuntimeLogKind, string> = {
    check: '检定 / CHECK',
    roll: '掷骰 / ROLL',
    action: '动作 / ACTION',
    damage: '伤害 / DAMAGE',
    resource: '资源 / RESOURCE',
    system: '系统 / SYSTEM',
    narration: '叙述 / NARRATION',
  };
  const latestTags = latestResult?.tags || [];
  const latestSpecialTag = latestTags.includes('nat20')
    ? '天然 20 / NAT 20'
    : latestTags.includes('nat1')
      ? '天然 1 / NAT 1'
      : undefined;

  return (
    <div className="border-2 border-[#58180d] p-3 bg-[#ede1c5] flex flex-col shadow-[3px_3px_0px_#58180d] lg:h-[220px] lg:shrink-0">
      <div className="flex justify-between items-center border-b-2 border-[#58180d] mb-2 pb-1.5">
        <h3 className="text-sm font-black uppercase text-[#58180d]">掷骰日志 / ROLL LOG</h3>
        <span className="text-[10px] font-black uppercase text-[#7a4a3a]">玩家结果日志</span>
      </div>

      <div className="mb-2 border-2 border-[#58180d] bg-[#fdf6e3] p-2 shadow-[2px_2px_0px_#58180d]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase text-[#7a4a3a]">
              最新结果 / LATEST · {latestResult ? latestKindLabel[latestResult.kind] : '系统 / SYSTEM'}
            </div>
            <div className="mt-1 truncate text-sm font-black text-[#3a1712]">{latestResult?.title || '系统提示'}</div>
            <div className="mt-1 text-[11px] font-bold text-[#6b3328]">
              {latestResult?.calculation || latestResult?.detail || latestResult?.summary || '等待检定、动作或系统结果。'}
            </div>
          </div>
          <div className="shrink-0 text-4xl font-black leading-none text-[#58180d]">
            {latestResult?.displayValue ?? '待命'}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {latestSpecialTag && (
            <span className="border border-[#8a3a2a] bg-[#ede1c5] px-1.5 py-0.5 text-[10px] font-black text-[#6b1f16]">
              {latestSpecialTag}
            </span>
          )}
          {latestResult?.outcome && (
            <span className="border border-[#58180d]/30 bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-[#7a4a3a]">
              {latestResult.outcome}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 font-mono text-[10px] overflow-y-auto custom-scrollbar mb-2 bg-[#fdf6e3]/80 p-2 border border-[#58180d]/20 text-[#4a241c]">
        {combatLog.map((entry) => (
          <div key={entry.id} className={`border-b border-[#58180d]/10 py-1 last:border-0 ${dndLogColor(entry)}`}>
            <div>
              [{latestKindLabel[entry.kind].split(' / ')[0]}] {entry.title}：{entry.summary}
            </div>
            {(entry.detail || entry.calculation) && (
              <div className="mt-0.5 text-[10px] font-normal text-[#7a4a3a]">
                {entry.detail || entry.calculation}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
