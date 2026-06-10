import type { Dispatch, SetStateAction } from 'react';
import { SysHeader } from './CpGameplayShared';

type CpDiceTrayPanelProps = {
  diceTray: Record<string, number>;
  setDiceTray: Dispatch<SetStateAction<Record<string, number>>>;
  onRoll: () => void;
};

export function CpDiceTrayPanel({ diceTray, setDiceTray, onRoll }: CpDiceTrayPanelProps) {
  return (
    <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
      <SysHeader>DICE TRAY // 自由掷骰</SysHeader>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {['d4','d6','d8','d10','d12','d20'].map(die => (
          <button key={die}
            className="w-10 h-10 border-2 border-[#00e5ff]/30 bg-[#080810] text-[#00e5ff] font-bold text-[11px] hover:border-[#00e5ff] hover:bg-[#00e5ff]/10 hover:shadow-[0_0_8px_rgba(0,229,255,0.2)] transition-all relative"
            onClick={() => setDiceTray(p => ({ ...p, [die]: (p[die] || 0) + 1 }))}>
            {die}
            {diceTray[die] > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#f5c518] text-[#080810] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black leading-none">
                {diceTray[die]}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="text-[10px] text-[#9ab0c8]/40 mb-2 font-mono">
        {(Object.entries(diceTray) as [string, number][]).filter(([,c]) => c > 0).map(([d,c]) => `${c}${d}`).join(' + ') || '—  选择骰子开始'}
      </div>
      <div className="flex gap-2">
        <button onClick={() => setDiceTray({})}
          className="px-3 py-1 border border-[#00e5ff]/20 text-[#9ab0c8]/50 text-xs font-mono hover:text-[#9ab0c8] hover:border-[#00e5ff]/40 transition-colors">
          清空
        </button>
        <button onClick={onRoll}
          disabled={Object.values(diceTray).every(c => c === 0)}
          className="flex-1 py-1 bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-bold font-mono uppercase hover:bg-[#00e5ff]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ boxShadow: '0 0 8px rgba(0,229,255,0.1)' }}>
          ▸ R O L L
        </button>
      </div>
    </div>
  );
}
