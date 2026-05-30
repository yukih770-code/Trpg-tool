import type { AttributeName, CharacterData, SkillName } from '../../lib/dnd-types';

interface LastCheckResult {
  name: string;
  d20: number;
  modifier: number;
  total: number;
}

interface ChecksPanelProps {
  character: CharacterData;
  lastCheck: LastCheckResult | null;
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
  lastCheck,
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
    <div className="border border-[#58180d] bg-[#f4ecd8] p-3 flex flex-col gap-3 shadow-[2px_2px_0px_#58180d]">
      <div className="flex justify-between items-center border-b border-[#58180d] pb-2">
        <h3 className="text-xs font-bold uppercase text-[#58180d]">检定 / Checks</h3>
        {lastCheck && (
          <div className="text-[10px] font-black uppercase text-[#58180d]">
            总计 {lastCheck.total}
          </div>
        )}
      </div>

      {lastCheck ? (
        <div className="bg-white/70 border border-[#58180d]/30 p-2 text-sm">
          <div className="font-bold text-[#2c1810]">{lastCheck.name}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#58180d]/70 font-mono">
            <span>d20={lastCheck.d20}</span>
            <span>修正={formatModifier(lastCheck.modifier)}</span>
            <span>总计={lastCheck.total}</span>
          </div>
        </div>
      ) : (
        <div className="bg-white/50 border border-dashed border-[#58180d]/30 p-2 text-center text-[10px] text-[#58180d]/60 font-bold uppercase">
          选择属性、技能、豁免或先攻进行检定
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {checkAttrs.map(attr => {
          const modifier = getAttrModifier(attr);
          return (
            <button
              key={`ability-${attr}`}
              className="border border-[#58180d]/40 bg-white/70 p-2 text-left hover:border-[#58180d] hover:bg-white transition-colors"
              onClick={() => rollGameplayCheck(`属性检定：${attrLabels[attr]} (${attr})`, modifier)}
            >
              <div className="text-[10px] font-black uppercase text-[#58180d]">{attr} Check</div>
              <div className="text-sm font-bold text-[#2c1810]">{attrLabels[attr]} {formatModifier(modifier)}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-black uppercase text-[#58180d]">豁免检定 Saves</div>
          <div className="grid grid-cols-2 gap-1">
            {checkAttrs.map(attr => {
              const modifier = getAttrModifier(attr) + (isSaveProficient(attr) ? proficiencyBonus : 0);
              return (
                <button
                  key={`save-${attr}`}
                  className="border border-[#58180d]/30 bg-white/60 px-2 py-1 text-xs font-bold text-[#2c1810] hover:border-[#58180d] hover:bg-white transition-colors"
                  onClick={() => rollGameplayCheck(`豁免检定：${attrLabels[attr]} (${attr} Save)`, modifier)}
                >
                  {attr} Save {formatModifier(modifier)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-black uppercase text-[#58180d]">先攻 Initiative</div>
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
        <div className="text-[10px] font-black uppercase text-[#58180d]">技能检定 Skills</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
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
