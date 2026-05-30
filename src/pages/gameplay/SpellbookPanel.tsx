import { Button } from '../../../components/ui/button';
import type { CharacterData, SpellInfo } from '../../lib/dnd-types';

interface SpellbookPanelProps {
  character: CharacterData;
  isCaster: boolean;
  isPreparedCaster: boolean;
  preparedSpells: string[];
  activeSpells: SpellInfo[];
  maxPrepared: number;
  onManageSpells: () => void;
  onCastSpell: (spellName: string, level: number) => void;
  onBasicAttack: () => void;
}

export function SpellbookPanel({
  character,
  isCaster,
  isPreparedCaster,
  preparedSpells,
  activeSpells,
  maxPrepared,
  onManageSpells,
  onCastSpell,
  onBasicAttack,
}: SpellbookPanelProps) {
  return isCaster ? (
    <div className="border border-[#58180d] bg-[#ede1c5] p-3 flex flex-col gap-2 shadow-[2px_2px_0px_#58180d] min-h-[300px] lg:flex-1 lg:min-h-[360px] lg:overflow-hidden">
      <div className="flex justify-between items-center border-b border-[#58180d] pb-2">
        <h3 className="text-xs font-bold uppercase text-[#58180d] flex items-center">
          法术 / SPELLBOOK
          {isPreparedCaster && <span className="ml-2 font-normal text-[10px] bg-[#58180d]/10 px-1 py-0.5 rounded">已准备 {preparedSpells.length}/{maxPrepared}</span>}
        </h3>
        <Button size="sm" variant="outline" className="h-6 text-[10px] rounded-none border-[#58180d] text-[#58180d] px-2 py-0 uppercase" onClick={onManageSpells}>管理法术</Button>
      </div>

      {/* SLOTS RENDER */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {Object.entries(character.spellbook.slots).map(([lvl, slotData]) => (
          <div key={lvl} className="bg-white/50 border border-[#58180d]/30 p-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold text-[#58180d]">{lvl}环法术位</span>
              <span className="text-xs font-bold">{slotData.current} / {slotData.max}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {Array.from({length: slotData.max}).map((_, i) => (
                <div key={i} className={`w-3.5 h-3.5 border ${i < slotData.current ? 'bg-[#58180d] border-[#58180d]' : 'bg-transparent border-[#58180d]/30'}`}/>
              ))}
            </div>
          </div>
        ))}
      </div>

      {activeSpells.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-[#58180d]/60 font-bold uppercase border-2 border-dashed border-[#58180d]/30 p-4 text-center">
          尚未准备或学习任何法术。<br />点击右上角 "管理法术" 开始配置。
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto pr-2 custom-scrollbar font-sans">
          {activeSpells.map(spell => (
            <div key={spell.name_cn} className="flex justify-between items-center text-sm p-2 bg-white border-l-2 border-[#58180d] hover:bg-[#58180d]/5 transition">
              <div>
                <div className="font-bold text-[#2c1810]">{spell.name_cn} <span className="text-xs font-normal italic text-[#58180d]">({spell.level}环)</span></div>
                <div className="text-[10px] text-[#58180d]/70 line-clamp-1 mt-0.5">{spell.desc}</div>
              </div>
              <button className="bg-[#58180d] text-white px-3 py-1 text-[10px] font-bold uppercase rounded-none shrink-0" 
                onClick={() => onCastSpell(spell.name_cn, spell.level)}>
                施展
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <div className="border border-[#58180d] bg-[#f4ecd8] p-3 flex flex-col gap-2 min-h-[300px] lg:flex-1 lg:min-h-[360px] lg:overflow-hidden">
      <h3 className="text-xs font-bold uppercase border-b border-[#58180d] pb-2 text-[#58180d]">战斗行动 / ACTIONS</h3>
      <div className="space-y-2 flex-1">
        <div className="flex justify-between items-center text-sm p-2 bg-white/40 border-l-2 border-[#58180d]">
          <span className="font-serif">普通攻击 / ATTACK</span>
          <div className="flex gap-4 items-center">
            <button className="bg-[#58180d] text-white px-3 py-1 text-[10px] font-bold uppercase" onClick={onBasicAttack}>执行</button>
          </div>
        </div>
      </div>
    </div>
  );
}
