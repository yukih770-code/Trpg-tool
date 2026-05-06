import { useState } from 'react';
import { useCocStore } from '../store/cocStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

export function CocCreator({ onComplete }: { onComplete: () => void }) {
  const { character, updateField, updateCharacteristic } = useCocStore();
  const [step, setStep] = useState(1);

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
      // Set derived
      updateField('hp', { current: Math.floor((character.characteristics.CON + character.characteristics.SIZ) / 10), max: Math.floor((character.characteristics.CON + character.characteristics.SIZ) / 10) });
      updateField('mp', { current: Math.floor(character.characteristics.POW / 5), max: Math.floor(character.characteristics.POW / 5) });
      updateField('sanity', { current: character.characteristics.POW, start: character.characteristics.POW, max: 99 });
      updateField('luck', { current: character.characteristics.LUK, start: character.characteristics.LUK });
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
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
          <h3 className="text-lg font-bold border-b border-[#059669]/50 pb-2 mb-4">技能分配 (Skills)</h3>
          <p className="opacity-80 leading-relaxed max-w-2xl text-xs">
            在标准规则下，你拥有基于 <strong>EDU × 4 ({character.characteristics.EDU * 4})</strong> 的本职技能点，以及 <strong>INT × 2 ({character.characteristics.INT * 2})</strong> 的个人兴趣技能点。<br/><br/>
            (为了工具的便利性，我们暂时跳过加点验证，你可以直接在之后的“角色卡”页面任意调整技能点数，请遵循你车卡的具体规则。)
          </p>

          <div className="mt-8 p-4 border border-[#059669]/30 bg-[#059669]/5 text-center">
            <p className="text-lg font-bold text-[#059669]">调查员已准备就绪</p>
            <p className="text-xs opacity-60 mt-2">“那些最古老、最强烈的恐惧，是对未知的恐惧。”</p>
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
