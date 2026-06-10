import type { CpCharacter } from '../../lib/cp-types';
import { SysHeader } from './CpGameplayShared';

type CpRuntimeStatePanelProps = {
  character: CpCharacter;
  onHpDelta: (delta: number) => void;
  onHumanityDelta: (delta: number) => void;
};

export function CpRuntimeStatePanel({ character, onHpDelta, onHumanityDelta }: CpRuntimeStatePanelProps) {
  const hpPct = character.hp.max > 0 ? (character.hp.current / character.hp.max) * 100 : 0;
  const hpGlow = character.hp.current <= character.seriouslyWounded ? '#f97316' : '#00e5ff';

  return (
    <div className="space-y-4">
      <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
        <SysHeader>VITALS // 生命值</SysHeader>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2.5 bg-[#080810] border border-[#00e5ff]/15 overflow-hidden">
            <div className="h-full transition-all duration-300"
              style={{ width: `${hpPct}%`, backgroundColor: hpGlow, boxShadow: `0 0 8px ${hpGlow}` }} />
          </div>
          <span className="font-bold text-[#00e5ff] text-sm font-mono w-16 text-right">
            {character.hp.current} <span className="text-[#00e5ff]/40">/ {character.hp.max}</span>
          </span>
        </div>
        <div className="text-[10px] text-[#9ab0c8]/40 mb-2">
          重伤阈值 [ {character.seriouslyWounded} ] 　死亡豁免 [ {character.deathSave} ]
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[-5, -3, -1, 1, 3, 5].map(amt => (
            <button key={amt}
              className={`h-7 px-2.5 border text-xs font-mono font-bold transition-colors ${amt < 0
                ? 'border-red-500/40 text-red-400 hover:bg-red-900/20 hover:border-red-400'
                : 'border-[#39ff14]/40 text-[#39ff14] hover:bg-[#39ff14]/10 hover:border-[#39ff14]'}`}
              onClick={() => onHpDelta(amt)}>
              {amt > 0 ? '+' : ''}{amt}
            </button>
          ))}
        </div>
      </div>

      <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
        <SysHeader>HUMANITY // 人性</SysHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2.5 bg-[#080810] border border-purple-500/15 overflow-hidden">
            <div className="h-full transition-all duration-300 bg-purple-500"
              style={{ width: `${character.humanity.max > 0 ? (character.humanity.current / character.humanity.max) * 100 : 0}%`,
                boxShadow: '0 0 8px rgba(168,85,247,0.5)' }} />
          </div>
          <span className="font-bold text-purple-400 text-sm font-mono w-16 text-right">
            {character.humanity.current} <span className="text-purple-400/40">/ {character.humanity.max}</span>
          </span>
        </div>
        <div className="text-[10px] text-[#9ab0c8]/40 mb-2">
          EMP [ {character.stats.EMP} ] 　十位下降 → EMP −1
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[-7, -3, -1, 1].map(amt => (
            <button key={amt}
              className={`h-7 px-2.5 border text-xs font-mono font-bold transition-colors ${amt < 0
                ? 'border-purple-500/40 text-purple-400 hover:bg-purple-900/20'
                : 'border-[#39ff14]/40 text-[#39ff14] hover:bg-[#39ff14]/10'}`}
              onClick={() => onHumanityDelta(amt)}>
              {amt > 0 ? '+' : ''}{amt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
