import type { Dispatch, SetStateAction } from 'react';
import type { CpCharacter } from '../../lib/cp-types';
import { SysHeader } from './CpGameplayShared';

type CpDamagePanelProps = {
  character: CpCharacter;
  selectedWeapon: string;
  setSelectedWeapon: Dispatch<SetStateAction<string>>;
  aimAtHead: boolean;
  setAimAtHead: Dispatch<SetStateAction<boolean>>;
  onDamageRoll: () => void;
  onDeathSave: () => void;
  onRemoveInjury: (injury: string) => void;
};

export function CpDamagePanel({
  character,
  selectedWeapon,
  setSelectedWeapon,
  aimAtHead,
  setAimAtHead,
  onDamageRoll,
  onDeathSave,
  onRemoveInjury,
}: CpDamagePanelProps) {
  return (
    <div className="space-y-4">
      <button onClick={onDeathSave}
        className="w-full border-2 border-red-500/50 text-red-400 hover:bg-red-900/15 hover:border-red-400 py-2 uppercase text-xs font-bold font-mono tracking-widest transition-colors"
        style={{ boxShadow: '0 0 8px rgba(239,68,68,0.1)' }}>
        ■ 死亡豁免 DEATH SAVE — 基础值 [ {character.deathSave} ]
      </button>

      {character.weapons.length > 0 && (
        <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
          <SysHeader>DAMAGE // 伤害掷骰</SysHeader>
          <div className="flex gap-2 mb-2">
            <select value={selectedWeapon} onChange={e => setSelectedWeapon(e.target.value)}
              className="flex-1 bg-[#080810] border border-[#00e5ff]/20 text-[#9ab0c8] text-xs p-2 font-mono outline-none focus:border-[#00e5ff]">
              {character.weapons.map(w => <option key={w.name} value={w.name}>{w.name} ({w.damage})</option>)}
            </select>
            <button onClick={onDamageRoll}
              className="px-3 bg-[#f5c518] text-[#080810] font-bold uppercase font-mono text-xs hover:bg-[#f5c518]/80 transition-colors"
              style={{ boxShadow: '0 0 10px rgba(245,197,24,0.25)' }}>
              🔫 ROLL
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAimAtHead(h => !h)}
              className={`text-[10px] px-2 py-1 border font-mono uppercase transition-colors ${aimAtHead
                ? 'border-red-400 text-red-400 bg-red-900/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                : 'border-[#00e5ff]/20 text-[#9ab0c8]/40 hover:border-[#00e5ff]/40'}`}>
              {aimAtHead ? '🎯 瞄准头部 (−8命中)' : '○ 瞄准头部'}
            </button>
            <span className="text-[9px] text-[#9ab0c8]/25">两骰同最大 → 2d6重伤表</span>
          </div>
        </div>
      )}

      {(character.injuries ?? []).length > 0 && (
        <div className="border-2 border-orange-500/40 bg-orange-950/20 p-4"
          style={{ boxShadow: '0 0 12px rgba(249,115,22,0.1)' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-2">
            <span className="animate-pulse">▸</span>
            INJURY TRACKER — {character.injuries.length} 处伤势
          </div>
          <div className="space-y-1.5">
            {(character.injuries ?? []).map((inj, i) => (
              <div key={i} className="flex items-start gap-2 border border-orange-500/20 px-3 py-1.5">
                <span className="text-orange-300 flex-1 text-[10px] leading-relaxed font-mono">{inj}</span>
                <button
                  onClick={() => onRemoveInjury(inj)}
                  className="text-[9px] border border-orange-500/30 text-orange-400 px-1.5 py-0.5 hover:bg-orange-900/30 shrink-0 uppercase font-mono">
                  处理
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
