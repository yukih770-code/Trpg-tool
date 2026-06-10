import type { Dispatch, SetStateAction } from 'react';
import type { CpCharacter, CpStat } from '../../lib/cp-types';
import { CP_DV_TABLE, CP_SKILLS, CP_STAT_ORDER } from '../../lib/cp-types';
import { SysHeader } from './CpGameplayShared';

type CpChecksPanelProps = {
  character: CpCharacter;
  selectedSkill: string;
  setSelectedSkill: Dispatch<SetStateAction<string>>;
  selectedDV: number;
  setSelectedDV: Dispatch<SetStateAction<number>>;
  modifier: number;
  setModifier: Dispatch<SetStateAction<number>>;
  onSkillCheck: () => void;
  onStatCheck: (stat: CpStat) => void;
};

export function CpChecksPanel({
  character,
  selectedSkill,
  setSelectedSkill,
  selectedDV,
  setSelectedDV,
  modifier,
  setModifier,
  onSkillCheck,
  onStatCheck,
}: CpChecksPanelProps) {
  return (
    <div className="space-y-4">
      <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
        <SysHeader>SKILL CHECK // 技能检定</SysHeader>
        <div className="space-y-2 mb-3">
          <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}
            className="w-full bg-[#080810] border border-[#00e5ff]/20 text-[#9ab0c8] text-xs p-2 font-mono outline-none focus:border-[#00e5ff] focus:shadow-[0_0_8px_rgba(0,229,255,0.2)]">
            <option value="">— 选择技能 SELECT SKILL —</option>
            {CP_SKILLS.filter(s => (character.skills[s.name] ?? s.baseLevel) > 0).map(s => {
              const lv = character.skills[s.name] ?? s.baseLevel;
              const total = lv + character.stats[s.linkedStat];
              return <option key={s.name} value={s.name}>{s.name} {s.linkedStat}:{character.stats[s.linkedStat]}+技:{lv}={total}</option>;
            })}
          </select>

          <div className="flex gap-2">
            <div className="flex-1">
              <div className="text-[9px] text-[#00e5ff]/40 mb-1 uppercase tracking-wide">难度 DV</div>
              <select value={selectedDV} onChange={e => setSelectedDV(parseInt(e.target.value))}
                className="w-full bg-[#080810] border border-[#00e5ff]/20 text-[#9ab0c8] text-xs p-2 font-mono outline-none focus:border-[#00e5ff]">
                {CP_DV_TABLE.map(d => <option key={d.dv} value={d.dv}>{d.label} (DV{d.dv})</option>)}
              </select>
            </div>
            <div className="w-24">
              <div className="text-[9px] text-[#00e5ff]/40 mb-1 uppercase tracking-wide">修正值</div>
              <div className="flex">
                <button className="w-7 h-8 border border-[#00e5ff]/20 text-[#00e5ff] font-bold text-xs hover:bg-[#00e5ff]/10"
                  onClick={() => setModifier(m => m - 1)}>−</button>
                <div className="flex-1 h-8 border-t border-b border-[#00e5ff]/20 flex items-center justify-center text-sm font-bold text-[#f5c518] font-mono">
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </div>
                <button className="w-7 h-8 border border-[#00e5ff]/20 text-[#00e5ff] font-bold text-xs hover:bg-[#00e5ff]/10"
                  onClick={() => setModifier(m => m + 1)}>+</button>
              </div>
            </div>
          </div>

          <button onClick={onSkillCheck}
            className="w-full py-2 bg-[#00e5ff] text-[#080810] font-bold uppercase font-mono text-xs tracking-widest hover:bg-[#00b8cc] transition-colors"
            style={{ boxShadow: '0 0 12px rgba(0,229,255,0.3)' }}>
            ▸ 掷骰检定 ROLL CHECK
          </button>
        </div>
      </div>

      <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
        <SysHeader>STAT CHECKS // 属性检定</SysHeader>
        <div className="flex flex-wrap gap-1">
          {CP_STAT_ORDER.map(stat => (
            <button key={stat}
              className="h-8 px-2 border border-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-mono hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]/50 transition-colors"
              onClick={() => onStatCheck(stat)}>
              {stat} <span className="text-[#f5c518] font-bold">[{character.stats[stat]}]</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
