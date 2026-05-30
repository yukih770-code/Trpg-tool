interface RollConsolePanelProps {
  combatLog: string[];
  latestResult: {
    kind: 'check' | 'roll' | 'action' | 'system';
    title: string;
    displayValue: string;
    calculation: string;
    tag?: string;
    outcome?: string;
  };
}

function dndLogColor(line: string): string {
  if (line.includes('大成功') || line.includes('自然20') || line.includes('天然 20')) return 'text-yellow-700 font-bold';
  if (line.includes('成功') && !line.includes('失败')) return 'text-emerald-700 font-bold';
  if (line.includes('大失败') || line.includes('自然1') || line.includes('天然 1')) return 'text-red-800 font-bold';
  if (line.includes('失败')) return 'text-red-600';
  if (line.includes('[系统]')) return 'text-[#8a5a4a] italic';
  if (line.includes('[动作]')) return 'text-[#58180d] font-bold';
  if (line.includes('[检定]')) return 'text-[#3a1712] font-bold';
  if (line.includes('[掷骰]')) return 'text-[#4a241c]';
  return 'text-[#4a241c]';
}

export function RollConsolePanel({
  combatLog,
  latestResult,
}: RollConsolePanelProps) {
  const latestKindLabel: Record<typeof latestResult.kind, string> = {
    check: '检定 / CHECK',
    roll: '掷骰 / ROLL',
    action: '动作 / ACTION',
    system: '系统 / SYSTEM',
  };

  return (
    <div className="border-2 border-[#58180d] p-3 bg-[#ede1c5] flex flex-col shadow-[3px_3px_0px_#58180d] lg:h-[220px] lg:shrink-0">
      <div className="flex justify-between items-center border-b-2 border-[#58180d] mb-2 pb-1.5">
        <h3 className="text-sm font-black uppercase text-[#58180d]">掷骰日志 / ROLL LOG</h3>
        <span className="text-[10px] font-black uppercase text-[#7a4a3a]">玩家结果日志</span>
      </div>

      <div className="mb-2 border-2 border-[#58180d] bg-[#fdf6e3] p-2 shadow-[2px_2px_0px_#58180d]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase text-[#7a4a3a]">最新结果 / LATEST · {latestKindLabel[latestResult.kind]}</div>
            <div className="mt-1 truncate text-sm font-black text-[#3a1712]">{latestResult.title}</div>
            <div className="mt-1 text-[11px] font-bold text-[#6b3328]">{latestResult.calculation}</div>
          </div>
          <div className="shrink-0 text-4xl font-black leading-none text-[#58180d]">
            {latestResult.displayValue}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {latestResult.tag && (
            <span className="border border-[#8a3a2a] bg-[#ede1c5] px-1.5 py-0.5 text-[10px] font-black text-[#6b1f16]">
              {latestResult.tag}
            </span>
          )}
          {latestResult.outcome && (
            <span className="border border-[#58180d]/30 bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-[#7a4a3a]">
              {latestResult.outcome}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 font-mono text-[10px] overflow-y-auto custom-scrollbar mb-2 bg-[#fdf6e3]/80 p-2 border border-[#58180d]/20 text-[#4a241c]">
        {combatLog.map((log, index) => (
          <div key={index} className={`border-b border-[#58180d]/10 py-1 last:border-0 ${dndLogColor(log)}`}>
            {log}
          </div>
        ))}
      </div>

    </div>
  );
}
