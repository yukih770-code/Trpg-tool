import { Progress } from '../../../components/ui/progress';
import type { CharacterData } from '../../lib/dnd-types';

interface VitalsPanelProps {
  character: CharacterData;
  hpPercent: number;
  onDamage: () => void;
  onHeal: () => void;
  onShortRest: () => void;
  onLongRest: () => void;
}

export function VitalsPanel({
  character,
  hpPercent,
  onDamage,
  onHeal,
  onShortRest,
  onLongRest,
}: VitalsPanelProps) {
  return (
    <div className="border border-[#58180d] bg-[#f4ecd8] p-4 flex flex-col gap-4 shadow-[2px_2px_0px_#58180d]">
      <h3 className="text-xs font-bold uppercase border-b border-[#58180d]/30 pb-2 text-[#58180d]">生命体征 Vitals</h3>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end mb-1">
          <span className="font-bold text-sm uppercase">当前生命 HP</span>
          <span className={`text-2xl font-black ${character.hpCurrent <= character.hpMax / 4 ? "text-red-600" : ""}`}>
            {character.hpCurrent} <span className="text-sm font-normal text-[#58180d]/50">/ {character.hpMax}</span>
          </span>
        </div>
        <Progress value={hpPercent} className="h-3 bg-white border border-[#58180d]/30 rounded-none [&>div]:bg-[#58180d]" />
      </div>

      <div className="flex gap-2 mt-2 border-t border-[#58180d]/30 pt-4">
        <button className="flex-1 bg-red-900 text-white py-2 text-xs font-bold uppercase hover:opacity-90 transition-opacity" onClick={onDamage}>⚔️ 受到伤害</button>
        <button className="flex-1 bg-emerald-800 text-white py-2 text-xs font-bold uppercase hover:opacity-90 transition-opacity" onClick={onHeal}>💚 恢复生命</button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 border border-[#58180d]/30 bg-white p-2 text-center cursor-pointer hover:border-[#58180d] transition" onClick={onShortRest}>
          <div className="text-[10px] font-bold uppercase text-[#58180d]">短休</div>
          <div className="text-[9px] text-[#58180d]/60 mt-1 uppercase">消耗生命骰</div>
        </div>
        <div className="flex-1 border border-[#58180d]/30 bg-white p-2 text-center cursor-pointer hover:border-[#58180d] transition" onClick={onLongRest}>
          <div className="text-[10px] font-bold uppercase text-[#58180d]">长休</div>
          <div className="text-[9px] text-[#58180d]/60 mt-1 uppercase">完全恢复</div>
        </div>
      </div>
    </div>
  );
}
