import type { AttributeName, CharacterData, SkillName } from '../../lib/dnd-types';

interface ChecksPanelProps {
  character: CharacterData;
  checkDc: string;
  onCheckDcChange: (value: string) => void;
  onClearCheckDc: () => void;
  checkAttrs: AttributeName[];
  allSkills: { name: SkillName; attr: AttributeName }[];
  attrLabels: Record<AttributeName, string>;
  proficiencyBonus: number;
  getAttrModifier: (attr: AttributeName) => number;
  formatModifier: (modifier: number) => string;
  isSaveProficient: (attr: AttributeName) => boolean;
  rollGameplayCheck: (name: string, modifier: number) => void;
}

export function ChecksPanel({
  character,
  checkDc,
  onCheckDcChange,
  onClearCheckDc,
  checkAttrs,
  allSkills,
  attrLabels,
  proficiencyBonus,
  getAttrModifier,
  formatModifier,
  isSaveProficient,
  rollGameplayCheck,
}: ChecksPanelProps) {
  return (
    <div className="border border-[#58180d] bg-[#f4ecd8] p-3 flex flex-col gap-3 shadow-[2px_2px_0px_#58180d] lg:shrink-0">
      <div className="flex justify-between items-center border-b border-[#58180d] pb-2">
        <h3 className="text-xs font-bold uppercase text-[#58180d]">检定 / CHECKS</h3>
        <div className="text-[10px] font-bold uppercase text-[#58180d]/60">结果进入掷骰日志</div>
      </div>

      <div className="border border-[#58180d]/30 bg-white/60 p-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <label className="text-[10px] font-black uppercase text-[#58180d]">
            目标 DC
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={checkDc}
              onChange={(event) => onCheckDcChange(event.target.value)}
              placeholder="未设置"
              className="h-7 w-24 border border-[#58180d]/50 bg-[#fdf6e3] px-2 text-xs font-bold text-[#3a1712] outline-none placeholder:text-[#8a5a4a]"
            />
            <button
              className="h-7 border border-[#58180d]/40 bg-transparent px-2 text-[10px] font-bold text-[#6b3328] disabled:opacity-40"
              disabled={!checkDc}
              onClick={onClearCheckDc}
            >
              清除 DC
            </button>
          </div>
        </div>
        <div className="mt-1 text-[10px] leading-relaxed text-[#7a4a3a]">
          未设置 DC 时只显示总值，并等待 DM 判定。
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {checkAttrs.map(attr => {
          const modifier = getAttrModifier(attr);
          return (
            <button
              key={`ability-${attr}`}
              className="border border-[#58180d]/40 bg-white/70 p-2 text-left hover:border-[#58180d] hover:bg-white transition-colors"
              onClick={() => rollGameplayCheck(`属性检定：${attrLabels[attr]} (${attr})`, modifier)}
            >
              <div className="text-[10px] font-black uppercase text-[#58180d]">{attr} 检定</div>
              <div className="text-sm font-bold text-[#2c1810]">{attrLabels[attr]} {formatModifier(modifier)}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-black uppercase text-[#58180d]">豁免检定 / SAVES</div>
          <div className="grid grid-cols-2 gap-1">
            {checkAttrs.map(attr => {
              const modifier = getAttrModifier(attr) + (isSaveProficient(attr) ? proficiencyBonus : 0);
              return (
                <button
                  key={`save-${attr}`}
                  className="border border-[#58180d]/30 bg-white/60 px-2 py-1 text-xs font-bold text-[#2c1810] hover:border-[#58180d] hover:bg-white transition-colors"
                  onClick={() => rollGameplayCheck(`豁免检定：${attrLabels[attr]} (${attr} Save)`, modifier)}
                >
                  {attr} 豁免 {formatModifier(modifier)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-black uppercase text-[#58180d]">先攻 / INITIATIVE</div>
          <button
            className="h-full min-h-16 border border-[#58180d]/40 bg-white/70 p-3 text-left hover:border-[#58180d] hover:bg-white transition-colors"
            onClick={() => rollGameplayCheck('先攻检定：Initiative', getAttrModifier('Dex'))}
          >
            <div className="text-[10px] font-black uppercase text-[#58180d]">掷先攻</div>
            <div className="text-lg font-black text-[#2c1810]">DEX {formatModifier(getAttrModifier('Dex'))}</div>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-black uppercase text-[#58180d]">技能检定 / SKILLS</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-[180px] lg:max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          {allSkills.map(skill => {
            const modifier = getAttrModifier(skill.attr) + (character.skillProficiencies.includes(skill.name) ? proficiencyBonus : 0);
            return (
              <button
                key={skill.name}
                className="border border-[#58180d]/30 bg-white/60 px-2 py-1 text-left hover:border-[#58180d] hover:bg-white transition-colors"
                onClick={() => rollGameplayCheck(`技能检定：${skill.name}`, modifier)}
              >
                <div className="text-xs font-bold text-[#2c1810]">{skill.name}</div>
                <div className="text-[10px] text-[#58180d]/70">{skill.attr} {formatModifier(modifier)}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
