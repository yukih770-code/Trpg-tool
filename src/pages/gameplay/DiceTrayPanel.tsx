import { Button } from '../../../components/ui/button';

interface LastRollResult {
  total: number;
  formula: string;
  detail: string;
  type: 'crit' | 'fumble' | 'success' | 'neutral';
}

interface DiceTrayPanelProps {
  combatLog: string[];
  diceTray: Record<string, number>;
  lastRoll: LastRollResult | null;
  onAddDie: (die: string) => void;
  onClearDice: () => void;
  onRollDice: () => void;
}

function dndLogColor(line: string): string {
  if (line.includes('大成功') || line.includes('自然20')) return 'text-yellow-600 font-bold';
  if (line.includes('成功') && !line.includes('失败')) return 'text-emerald-700 font-bold';
  if (line.includes('大失败') || line.includes('自然1')) return 'text-red-700 font-bold';
  if (line.includes('失败')) return 'text-red-600';
  if (line.includes('[系统]')) return 'text-[#58180d]/40 italic';
  return 'text-[#2c1810]';
}

export function DiceTrayPanel({
  combatLog,
  diceTray,
  lastRoll,
  onAddDie,
  onClearDice,
  onRollDice,
}: DiceTrayPanelProps) {
  return (
    <div className="border border-[#58180d] p-3 bg-white/30 flex flex-col flex-1">
      <h3 className="text-xs font-bold uppercase border-b border-[#58180d] mb-2 pb-1 text-[#58180d]">战斗日志 & 自由掷骰</h3>
      <div className="flex-1 font-mono text-[10px] overflow-hidden custom-scrollbar max-h-[150px] overflow-y-auto mb-2 bg-[#fdf6e3]/50 p-2 border border-[#58180d]/10">
        {combatLog.map((log, i) => (
          <div key={i} className={`border-b border-[#58180d]/10 py-1 last:border-0 ${dndLogColor(log)}`}>{log}</div>
        ))}
      </div>

      {/* Last Roll Result — prominent display */}
      {lastRoll && (
        <div className={`mb-3 border-2 p-3 text-center transition-all
          ${lastRoll.type === 'crit' ? 'border-yellow-500 bg-yellow-900/20' :
            lastRoll.type === 'fumble' ? 'border-red-700 bg-red-900/20' :
            'border-[#58180d]/60 bg-[#58180d]/10'}`}>
          <div className="text-[10px] uppercase font-black text-[#58180d] tracking-widest mb-1">
            {lastRoll.type === 'crit' ? '⚡ 自然20 — 大成功！' : lastRoll.type === 'fumble' ? '💀 自然1 — 大失败！' : '🎲 掷骰结果'}
          </div>
          <div className={`text-5xl font-black font-serif leading-none mb-1
            ${lastRoll.type === 'crit' ? 'text-yellow-500' : lastRoll.type === 'fumble' ? 'text-red-600' : 'text-[#58180d]'}`}>
            {lastRoll.total}
          </div>
          <div className="text-[10px] text-[#58180d]/60 font-mono">{lastRoll.formula}</div>
        </div>
      )}

      <div className="mt-auto pt-2 border-t border-[#58180d]/30">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[9px] uppercase font-black text-[#58180d]">选取投掷骰: {(Object.entries(diceTray) as [string, number][]).filter(([_, c]) => c > 0).map(([d, c]) => `${c}${d}`).join(' + ') || '—'}</div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-5 px-2 text-[9px] rounded-none border-[#58180d] text-[#58180d]" onClick={onClearDice}>清空</Button>
            <Button size="sm" className="h-5 px-3 text-[9px] rounded-none bg-[#58180d] text-[#fdf6e3] font-black" onClick={onRollDice} disabled={Object.values(diceTray).every(c => c === 0)}>R O L L</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(die => (
            <button key={die}
              className="w-9 h-9 border-2 border-[#58180d] bg-white text-[#58180d] font-black text-[11px] hover:bg-[#58180d] hover:text-white transition-colors relative shadow-sm"
              onClick={() => onAddDie(die)}>
              {die}
              {diceTray[die] > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-700 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] leading-none font-black">{diceTray[die]}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
