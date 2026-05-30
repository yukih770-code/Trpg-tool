import { useState } from 'react';
import { useCocStore } from '../store/cocStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import type { CocSkill } from '../lib/coc-types';
import {
  getCocDerivedHp,
  getCocDerivedMp,
  getCocInitialSan,
  getCocSanMax,
} from '../lib/coc-utils';

const COC_CREATION_SKILL_MAX = 90;

type SkillAllocationType = 'none' | 'occupational' | 'personal';

type SkillAllocationEntry = {
  type: SkillAllocationType;
  invested: number;
};

type SkillAllocationState = Record<string, SkillAllocationEntry>;

function getInitialSkillAllocation(characterSkills: CocSkill[]): SkillAllocationState {
  return Object.fromEntries(
    characterSkills.map((skill) => {
      const invested = Math.max(0, skill.value - skill.baseValue);
      const type: SkillAllocationType = skill.isOccupational
        ? 'occupational'
        : skill.isPersonal
          ? 'personal'
          : 'none';

      return [skill.name, {
        type,
        invested: type === 'none' ? 0 : Math.min(invested, COC_CREATION_SKILL_MAX - skill.baseValue),
      }];
    }),
  );
}

export function CocCreator({ onComplete }: { onComplete: () => void }) {
  const { character, updateField, updateCharacteristic } = useCocStore();
  const [step, setStep] = useState(1);
  const [skillAllocation, setSkillAllocation] = useState<SkillAllocationState>(() =>
    getInitialSkillAllocation(character.skills),
  );

  const occupationalBudget = character.characteristics.EDU * 4;
  const personalBudget = character.characteristics.INT * 2;
  const allocationEntries = Object.values(skillAllocation) as SkillAllocationEntry[];
  const occupationalSpent = allocationEntries
    .filter(entry => entry.type === 'occupational')
    .reduce((sum, entry) => sum + entry.invested, 0);
  const personalSpent = allocationEntries
    .filter(entry => entry.type === 'personal')
    .reduce((sum, entry) => sum + entry.invested, 0);
  const occupationalRemaining = occupationalBudget - occupationalSpent;
  const personalRemaining = personalBudget - personalSpent;

  const rollCharacteristic = (char: string) => {
    let result = 0;
    if (['STR', 'CON', 'DEX', 'APP', 'POW'].includes(char)) {
      result = (rollD6() + rollD6() + rollD6()) * 5;
    } else if (['SIZ', 'INT', 'EDU'].includes(char)) {
      result = (rollD6() + rollD6() + 6) * 5;
    } else if (char === 'LUK') {
      result = (rollD6() + rollD6() + rollD6()) * 5;
    }
    updateCharacteristic(char as any, result);
  };

  const rollD6 = () => Math.floor(Math.random() * 6) + 1;

  const rollAll = () => {
    ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU', 'LUK'].forEach(c => rollCharacteristic(c));
  };

  const getSkillAllocationEntry = (skillName: string) =>
    skillAllocation[skillName] ?? { type: 'none' as SkillAllocationType, invested: 0 };

  const setSkillAllocationType = (skillName: string, type: SkillAllocationType) => {
    setSkillAllocation(prev => ({
      ...prev,
      [skillName]: {
        type,
        invested: 0,
      },
    }));
  };

  const adjustSkillInvestment = (skillName: string, baseValue: number, delta: number) => {
    setSkillAllocation(prev => {
      const current = prev[skillName] ?? { type: 'none' as SkillAllocationType, invested: 0 };
      if (current.type === 'none') return prev;

      const spent = (Object.entries(prev) as Array<[string, SkillAllocationEntry]>)
        .filter(([name, entry]) => name !== skillName && entry.type === current.type)
        .reduce((sum, [, entry]) => sum + entry.invested, 0);
      const budget = current.type === 'occupational' ? occupationalBudget : personalBudget;
      const maxBySkill = Math.max(0, COC_CREATION_SKILL_MAX - baseValue);
      const maxByBudget = Math.max(0, budget - spent);
      const nextInvested = Math.max(0, Math.min(current.invested + delta, maxBySkill, maxByBudget));

      if (!Number.isFinite(nextInvested)) return prev;

      return {
        ...prev,
        [skillName]: {
          ...current,
          invested: nextInvested,
        },
      };
    });
  };

  const saveAllocatedSkills = () => {
    updateField('skills', character.skills.map(skill => {
      const entry = getSkillAllocationEntry(skill.name);
      const invested = Number.isFinite(entry.invested) ? entry.invested : 0;
      const safeInvested = entry.type === 'none'
        ? 0
        : Math.max(0, Math.min(invested, COC_CREATION_SKILL_MAX - skill.baseValue));

      return {
        ...skill,
        value: skill.baseValue + safeInvested,
        isOccupational: entry.type === 'occupational',
        isPersonal: entry.type === 'personal',
      };
    }));
  };

  const handleNextStep = () => {
    if (step === 1 && !character.name) {
      toast.error('请输入调查员姓名');
      return;
    }
    if (step === 2) {
      if (Object.values(character.characteristics).some(v => v === 0)) {
        toast.error('请掷出所有的属性值');
        return;
      }
      // Set derived stats via pure-function utilities (coc-utils)
      const hp = getCocDerivedHp(character.characteristics.CON, character.characteristics.SIZ);
      const mp = getCocDerivedMp(character.characteristics.POW);
      const sanStart = getCocInitialSan(character.characteristics.POW);
      const cthulhuMythosValue = character.skills.find(s => s.name === '克苏鲁神话 (Cthulhu Mythos)')?.value ?? 0;
      const sanMax = getCocSanMax(cthulhuMythosValue);
      updateField('hp', { current: hp, max: hp });
      updateField('mp', { current: mp, max: mp });
      updateField('sanity', { current: sanStart, start: sanStart, max: sanMax });
      updateField('luck', { current: character.characteristics.LUK, start: character.characteristics.LUK });
      setSkillAllocation(getInitialSkillAllocation(character.skills));
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      if (occupationalRemaining < 0 || personalRemaining < 0) {
        toast.error('技能点预算超支。可能是返回重掷属性后预算降低，请重新分配技能点。');
        return;
      }
      saveAllocatedSkills();
      onComplete();
    }
  };

  return (
    <div className="space-y-6 text-[#d4d4d8]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#059669]">调查员创建 (Investigator Creation)</h2>
        <div className="text-sm font-mono text-[#059669]">Step {step} of 3</div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b border-[#059669]/50 pb-2 mb-4">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="uppercase text-xs font-bold font-mono">姓名 Name</label>
              <Input 
                value={character.name} 
                onChange={(e) => updateField('name', e.target.value)} 
                className="bg-[#111] border-[#059669]/30 focus:border-[#059669] text-[#d4d4d8] font-serif rounded-none"
                placeholder="例如: 赫伯特·韦斯特"
              />
            </div>
            <div className="space-y-2">
              <label className="uppercase text-xs font-bold font-mono">玩家 Player</label>
              <Input 
                value={character.player} 
                onChange={(e) => updateField('player', e.target.value)} 
                className="bg-[#111] border-[#059669]/30 focus:border-[#059669] text-[#d4d4d8] font-serif rounded-none"
              />
            </div>
            <div className="space-y-2">
              <label className="uppercase text-xs font-bold font-mono">职业 Occupation</label>
              <Input 
                value={character.occupation} 
                onChange={(e) => updateField('occupation', e.target.value)} 
                className="bg-[#111] border-[#059669]/30 focus:border-[#059669] text-[#d4d4d8] font-serif rounded-none"
              />
            </div>
            <div className="space-y-2">
              <label className="uppercase text-xs font-bold font-mono">年龄 Age</label>
              <Input 
                type="number"
                value={character.age} 
                onChange={(e) => updateField('age', parseInt(e.target.value) || 20)} 
                className="bg-[#111] border-[#059669]/30 focus:border-[#059669] text-[#d4d4d8] font-serif rounded-none"
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-[#059669]/50 pb-2 mb-4">
            <h3 className="text-lg font-bold">属性检定 (Characteristics)</h3>
            <Button size="sm" onClick={rollAll} variant="outline" className="border-[#059669] text-[#059669] hover:bg-[#059669] hover:text-[#111] rounded-none">一键掷骰</Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU', 'LUK'].map(char => (
               <div key={char} className="border border-[#059669]/30 p-3 bg-[#111] flex flex-col items-center relative">
                 <div className="text-xs uppercase font-mono text-[#059669]/70 mb-2">{char === 'STR'? '力量': char==='CON'?'体质': char==='SIZ'?'体型': char==='DEX'?'敏捷': char==='APP'?'外貌': char==='INT'?'智力': char==='POW'?'意志': char==='EDU'?'教育':'幸运'} {char}</div>
                 <div className="text-3xl font-bold mb-2">{(character.characteristics as any)[char] || '--'}</div>
                 <Button size="sm" onClick={() => rollCharacteristic(char)} variant="ghost" className="h-6 text-[10px] uppercase text-[#059669] hover:text-white hover:bg-[#059669]/20 w-full rounded-none">Roll</Button>
               </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-sm">
          <div className="border-b border-[#059669]/50 pb-3">
            <h3 className="text-lg font-bold">技能分配 / SKILL ALLOCATION</h3>
            <p className="mt-2 text-xs text-[#d4d4d8]/80">
              本轮为最小创建期分配：玩家手动选择本职或兴趣类别，完整职业技能表和信用评级范围后续实现。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-[#059669]/40 bg-[#059669]/10 p-3">
              <div className="text-xs uppercase font-mono text-[#059669]">本职技能点</div>
              <div className="text-lg font-bold">EDU × 4 = {occupationalBudget}</div>
              <div className="text-sm">本职剩余：<span className="font-bold text-[#34d399]">{occupationalRemaining}</span></div>
            </div>
            <div className="border border-[#059669]/40 bg-[#059669]/10 p-3">
              <div className="text-xs uppercase font-mono text-[#059669]">兴趣技能点</div>
              <div className="text-lg font-bold">INT × 2 = {personalBudget}</div>
              <div className="text-sm">兴趣剩余：<span className="font-bold text-[#34d399]">{personalRemaining}</span></div>
            </div>
          </div>

          <div className="max-h-[460px] overflow-y-auto pr-2 space-y-2">
            {character.skills.map(skill => {
              const entry = getSkillAllocationEntry(skill.name);
              const currentValue = skill.baseValue + entry.invested;
              const remainingForType = entry.type === 'occupational'
                ? occupationalRemaining
                : entry.type === 'personal'
                  ? personalRemaining
                  : 0;
              const canIncrease = entry.type !== 'none'
                && currentValue < COC_CREATION_SKILL_MAX
                && remainingForType > 0;
              const canDecrease = entry.type !== 'none' && entry.invested > 0;

              return (
                <div key={skill.name} className="border border-[#059669]/25 bg-[#111] p-3">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#d4d4d8]">{skill.name}</div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#d4d4d8]/75">
                        <span>基础值：{skill.baseValue}</span>
                        <span>当前值：<strong className="text-[#34d399]">{currentValue}</strong></span>
                        <span>投入：{entry.invested}</span>
                        <span>上限：{COC_CREATION_SKILL_MAX}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-[#059669]">分配类型</span>
                      {[
                        ['none', '未分配'],
                        ['occupational', '本职'],
                        ['personal', '兴趣'],
                      ].map(([type, label]) => (
                        <Button
                          key={type}
                          type="button"
                          size="sm"
                          variant={entry.type === type ? 'default' : 'outline'}
                          onClick={() => setSkillAllocationType(skill.name, type as SkillAllocationType)}
                          className={entry.type === type
                            ? 'h-7 rounded-none bg-[#059669] text-[#111] hover:bg-[#059669]/80'
                            : 'h-7 rounded-none border-[#059669]/40 text-[#059669] hover:bg-[#059669]/20 hover:text-white'
                          }
                        >
                          {label}
                        </Button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      {[-5, -1, 1, 5].map(amount => {
                        const isIncrease = amount > 0;
                        return (
                          <Button
                            key={amount}
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isIncrease ? !canIncrease : !canDecrease}
                            onClick={() => adjustSkillInvestment(skill.name, skill.baseValue, amount)}
                            className="h-7 w-10 rounded-none border-[#059669]/40 text-[#059669] hover:bg-[#059669]/20 hover:text-white disabled:opacity-30"
                          >
                            {amount > 0 ? `+${amount}` : amount}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {entry.type === 'none' && (
                    <div className="mt-2 text-xs text-[#fbbf24]">未选择分配类型，技能保持基础值。</div>
                  )}
                  {entry.type !== 'none' && currentValue >= COC_CREATION_SKILL_MAX && (
                    <div className="mt-2 text-xs text-[#fbbf24]">已达到创建期上限 {COC_CREATION_SKILL_MAX}。</div>
                  )}
                  {entry.type !== 'none' && remainingForType <= 0 && currentValue < COC_CREATION_SKILL_MAX && (
                    <div className="mt-2 text-xs text-[#fbbf24]">对应技能点预算已用尽。</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-[#059669]/30">
        <Button 
          variant="outline" 
          onClick={() => setStep(step - 1)} 
          disabled={step === 1}
          className="border-[#059669] text-[#059669] hover:bg-[#059669]/20 hover:text-white rounded-none uppercase font-mono"
        >
          返回 (Back)
        </Button>
        <Button 
          onClick={handleNextStep}
          className="bg-[#059669] text-[#111] hover:bg-[#059669]/80 rounded-none uppercase font-bold font-mono"
        >
          {step === 3 ? '完成创建 (Finish)' : '下一步 (Next)'}
        </Button>
      </div>
    </div>
  );
}
