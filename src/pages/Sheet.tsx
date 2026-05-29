import { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { AttributeName, SkillName } from '../lib/dnd-types';
import { BACKGROUND_DATA } from '../data/backgrounds';
import { getAvailableClasses, getAvailableRaces, getAvailableFeats } from '../lib/mod-utils';
import { toast } from 'sonner';

export function Sheet() {
  const { character, updateField, initializeRuntimeResources } = useCharacterStore();
  const [isFeatDialogOpen, setIsFeatDialogOpen] = useState(false);

  const CLASS_DATA = getAvailableClasses(character);
  const RACE_DATA = getAvailableRaces(character);
  const FEATS_DATA = getAvailableFeats(character);

  const handleAddFeat = (featName: string) => {
    if (!character.feats?.includes(featName)) {
      updateField('feats', [...(character.feats || []), featName]);
      setIsFeatDialogOpen(false);
    }
  };

  const handleRemoveFeat = (index: number) => {
    const updatedFeats = [...(character.feats || [])];
    updatedFeats.splice(index, 1);
    updateField('feats', updatedFeats);
  };

  const attrList: { key: AttributeName; label: string }[] = [
    { key: 'Str', label: '力量' },
    { key: 'Dex', label: '敏捷' },
    { key: 'Con', label: '体质' },
    { key: 'Int', label: '智力' },
    { key: 'Wis', label: '感知' },
    { key: 'Cha', label: '魅力' },
  ];

  const getAttrData = (attr: AttributeName) => {
    const data = character.attrs[attr];
    const score = data.base + data.pointbuy + data.racebonus + data.extrabonus;
    const mod = Math.floor((score - 10) / 2);
    return { score, mod };
  };

  const getProfBonus = () => Math.ceil(1 + (character.level / 4));

  const allSkills: { name: SkillName; attr: AttributeName }[] = [
    { name: '运动', attr: 'Str' },
    { name: '特技', attr: 'Dex' }, { name: '巧手', attr: 'Dex' }, { name: '隐匿', attr: 'Dex' },
    { name: '奥秘', attr: 'Int' }, { name: '历史', attr: 'Int' }, { name: '调查', attr: 'Int' }, { name: '自然', attr: 'Int' }, { name: '宗教', attr: 'Int' },
    { name: '驯兽', attr: 'Wis' }, { name: '洞察', attr: 'Wis' }, { name: '医药', attr: 'Wis' }, { name: '察觉', attr: 'Wis' }, { name: '生存', attr: 'Wis' },
    { name: '欺瞒', attr: 'Cha' }, { name: '威吓', attr: 'Cha' }, { name: '表演', attr: 'Cha' }, { name: '游说', attr: 'Cha' }
  ];

  const rollCheck = (name: string, modifier: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + modifier;
    toast(`🎲 ${name}检定:`, {
      description: `1d20(${roll}) ${modifier >= 0 ? '+' : ''}${modifier} = ${total}`,
    });
  };

  if (!character.isCompleted) {
    return <div className="text-center py-20 text-[#58180d]/60 font-bold uppercase tracking-widest text-sm">请先在创建器中完成角色创建。</div>;
  }

  // Base and race features
  const classDef = CLASS_DATA.find(c => c.name === character.jobClass);
  const raceDef = RACE_DATA.find(r => r.name === character.race);
  const bgDef = BACKGROUND_DATA.find(b => b.name === character.background);

  if (!classDef || !raceDef) {
    return <div className="text-center py-20 text-[#58180d]/40">角色数据读取中或未完成创建...</div>;
  }
  
  const activeSkills = [
    ...(bgDef?.skillProficiencies || [])
    // We would add race/class skills here if we collected them in Creator
  ];

  const profBonus = getProfBonus();
  
  // Calculate dynamic AC based on class (e.g. Barbarian Unarmored Defense)
  const dexMod = getAttrData('Dex').mod;
  const conMod = getAttrData('Con').mod;
  let acTotal = character.acMod + dexMod;
  if (character.jobClass === '野蛮人' && character.acMod === 10) { // Assuming no armor
     acTotal += conMod;
  }
  
  const initiative = dexMod;
  const savingThrows = classDef?.savingThrows || [];

  const armorProf = classDef?.armorProficiencies || [];
  const weaponProf = classDef?.weaponProficiencies || [];

  // If Mountain Dwarf, they get Light and Medium armor
  if (character.subrace === '山地矮人') {
    if (!armorProf.includes("轻甲")) armorProf.push("轻甲");
    if (!armorProf.includes("中甲")) armorProf.push("中甲");
  }
  // Dwarf combat training
  if (character.race === '矮人') {
    if (!weaponProf.includes("战斧")) weaponProf.push("战斧", "战锤", "手斧", "轻锤");
  }
  // Elf weapon training
  if (character.subrace === '高等精灵') {
     if (!weaponProf.includes("长剑")) weaponProf.push("长剑", "细剑", "短弓", "长弓");
  }

  // Deduplicate
  const finalArmorProf = [...new Set(armorProf)];
  const finalWeaponProf = [...new Set(weaponProf)];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Header Info - Using the Bento style */}
      <div className="col-span-1 lg:col-span-12 flex flex-col md:flex-row items-start border-b-2 border-[#58180d] pb-4 mb-2 gap-6">
        
        <div className="flex flex-col flex-1 justify-between h-full py-2">
          <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter text-[#2c1810] mb-4">
            {character.name || 'Unnamed'} 
          </h2>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col border-l border-[#58180d]/30 pl-4">
              <span className="text-xs uppercase text-[#58180d] font-bold">职业与等级 / 背景</span>
              <span className="text-md font-sans">{character.jobClass} {character.subclass} {character.level}级 / {character.background}</span>
            </div>
            <div className="flex flex-col border-l border-[#58180d]/30 pl-4">
              <span className="text-xs uppercase text-[#58180d] font-bold">种族 / 阵营</span>
              <span className="text-md font-sans">{character.race} {character.subrace} / 守序中立</span>
            </div>
            <div className="flex flex-col border-l border-[#58180d]/30 pl-4">
              <span className="text-xs uppercase text-[#58180d] font-bold">性别 / 年龄</span>
              <span className="text-md font-sans">{character.gender || '-'} / {character.age || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attributes Column */}
      <div className="col-span-1 lg:col-span-2 flex flex-col gap-3">
        {attrList.map(a => {
          const { score, mod } = getAttrData(a.key);
          return (
            <div key={a.key} 
                className="bg-[#ede1c5] p-3 border border-[#58180d] flex flex-col items-center cursor-pointer hover:bg-[#58180d] hover:text-white transition-colors group" 
                onClick={() => rollCheck(`${a.label}检定`, mod)}>
              <span className="text-xs uppercase font-bold text-[#58180d] group-hover:text-white/80">{a.label} {a.key}</span>
              <span className="text-3xl font-black">{score}</span>
              <span className="bg-[#58180d] text-white text-xs px-2 py-0.5 rounded-full group-hover:bg-white group-hover:text-[#58180d]">{mod >= 0 ? '+' : ''}{mod}</span>
            </div>
          )
        })}
      </div>

      {/* Skills and Saves Column */}
      <div className="col-span-1 lg:col-span-3 flex flex-col gap-4 overflow-hidden">
        <div className="border border-[#58180d] p-3 bg-white/50 h-[300px] flex flex-col">
          <h3 className="text-xs font-bold uppercase border-b border-[#58180d] mb-2 pb-1">技能检定 Skills</h3>
          <div className="flex-1 overflow-y-auto space-y-1 text-sm font-sans custom-scrollbar pr-2">
            {allSkills.map(skill => {
              const isProf = activeSkills.includes(skill.name);
              const mod = getAttrData(skill.attr).mod + (isProf ? profBonus : 0);
              return (
                <div key={skill.name} onClick={() => rollCheck(skill.name, mod)}
                    className={`flex justify-between items-center p-1 cursor-pointer hover:bg-[#58180d]/10 ${!isProf ? 'opacity-70' : ''}`}>
                  <span className="flex gap-2">
                    {isProf ? <span className="text-[#58180d] font-bold">●</span> : <span>○</span>} 
                    {skill.name}
                  </span>
                  <span className={isProf ? "font-bold" : ""}>{mod >= 0 ? '+' : ''}{mod}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div className="border border-[#58180d] p-3 bg-white/50 flex flex-col">
          <h3 className="text-xs font-bold uppercase border-b border-[#58180d] mb-2 pb-1">豁免检定 Saving Throws</h3>
          <div className="space-y-1 text-sm font-sans">
            {/* Simple display, driven by class saves */}
            {attrList.map(a => {
              const { mod } = getAttrData(a.key);
              const isProf = savingThrows.includes(a.key); 
              const totalMod = mod + (isProf ? profBonus : 0);
              return (
                 <div key={`save-${a.key}`} className={`flex justify-between p-1 cursor-pointer hover:bg-[#58180d]/10 ${!isProf ? 'opacity-70' : ''}`} onClick={() => rollCheck(`${a.label}豁免`, totalMod)}>
                   <span className="flex gap-2">
                     {isProf ? <span className="text-[#58180d] font-bold">●</span> : <span>○</span>}
                     {a.label} {a.key}
                   </span>
                   <span className={isProf ? "font-bold" : ""}>{totalMod >= 0 ? '+' : ''}{totalMod}</span>
                 </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Combat Stats Column */}
      <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 h-24">
          <div className="border-2 border-[#58180d] bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100" onClick={() => rollCheck("防御检定", acTotal)}>
            <span className="text-[10px] font-bold uppercase">护甲等级 AC</span>
            <span className="text-3xl font-bold">{acTotal}</span>
          </div>
          <div className="border-2 border-[#58180d] bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100" onClick={() => rollCheck("先攻", initiative)}>
            <span className="text-[10px] font-bold uppercase">先攻 Init</span>
            <span className="text-3xl font-bold">{initiative >= 0 ? '+' : ''}{initiative}</span>
          </div>
          <div className="border-2 border-[#58180d] bg-white flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase">速度 Spd</span>
            <span className="text-3xl font-bold">{character.speed}ft</span>
          </div>
        </div>
        
        <div className="border-2 border-[#58180d] bg-white p-4 flex-1 flex flex-col gap-3 relative min-h-[200px]">
          <div className="absolute top-0 right-0 bg-[#58180d] text-white px-2 py-1 text-[10px] uppercase font-bold">当前生命 HP</div>
          <div className="flex items-center justify-center flex-1 border-b border-[#58180d]/30 pb-2">
            <span className="text-6xl font-black">{character.hpCurrent}</span>
            <span className="text-xl text-[#58180d]/50 ml-2">/ {character.hpMax}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-[#58180d]/30 p-2 text-center">
              <span className="block text-[10px] uppercase">生命骰数 Hit Dice</span>
              <span className="text-lg font-bold">{character.hitDiceCurrent}d{character.jobClass === '野蛮人' ? '12' : character.jobClass === '护法' ? '10' : character.jobClass === '吟游诗人' ? '8' : '8'}</span>
            </div>
            <div className="border border-[#58180d]/30 p-2 text-center">
              <span className="block text-[10px] uppercase">熟练加值 Prof</span>
              <span className="text-lg font-bold">+{profBonus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Column */}
      <div className="col-span-1 lg:col-span-3 flex flex-col gap-4">
        <div className="border border-[#58180d] p-3 bg-white/30 flex-1 flex flex-col min-h-[200px]">
          <h3 className="text-xs font-bold uppercase border-b border-[#58180d] mb-2 pb-1">特质与背景 Features</h3>
          <div className="flex-1 overflow-y-auto text-sm font-sans custom-scrollbar leading-relaxed space-y-3">
            <p className="italic opacity-80 border-b border-[#58180d]/10 pb-2">{character.description || '无详细描述。'}</p>
            
            {/* Background Feature */}
            {bgDef?.feature && (
              <div>
                <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">[背景]</span> {bgDef.feature.name}</p>
                <p className="text-xs mt-0.5">{bgDef.feature.desc}</p>
              </div>
            )}

            {/* Race Features */}
            {raceDef?.features.map((f, i) => {
              const matches = f.match(/-\s*(.+?)（(.+?)）：(.+)/);
              if (matches) {
                 return (
                   <div key={`race-f-${i}`}>
                     <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">[种族]</span> {matches[2]}</p>
                     <p className="text-xs mt-0.5">{matches[3]}</p>
                   </div>
                 )
              }
              return (
                <div key={`race-f-${i}`}>
                  <p className="text-xs mt-0.5"><span className="opacity-60">[种族]</span> {f}</p>
                </div>
              )
            })}
            
            {/* Subrace Features */}
            {raceDef?.subraces?.find(s => s.name === character.subrace)?.features.map((f, i) => {
              const matches = f.match(/-\s*(.+?)（(.+?)）：(.+)/);
              if (matches) {
                 return (
                   <div key={`subrace-f-${i}`}>
                     <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">[{character.subrace}]</span> {matches[2]}</p>
                     <p className="text-xs mt-0.5">{matches[3]}</p>
                   </div>
                 )
              }
              return (
                <div key={`subrace-f-${i}`}>
                  <p className="text-xs mt-0.5"><span className="opacity-60">[{character.subrace}]</span> {f}</p>
                </div>
              )
            })}

            {/* Class Features */}
            {classDef?.features.filter(f => f.unlockLevel <= character.level).map((f, i) => (
               <div key={`class-f-${i}`}>
                 <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">[职业 L{f.unlockLevel}]</span> {f.name}</p>
                 <p className="text-xs mt-0.5">{f.desc}</p>
               </div>
            ))}

            {/* Subclass Features */}
            {character.subclass && classDef?.subclasses?.find(s => s.name === character.subclass)?.features.filter(f => f.unlockLevel <= character.level).map((f, i) => (
               <div key={`subclass-f-${i}`}>
                 <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">[{character.subclass} L{f.unlockLevel}]</span> {f.name}</p>
                 <p className="text-xs mt-0.5">{f.desc}</p>
               </div>
            ))}
          </div>
        </div>
        <div className="border border-[#58180d] p-3 bg-white/30 flex-1 flex flex-col min-h-[150px]">
          <h3 className="text-xs font-bold uppercase border-b border-[#58180d] mb-2 pb-1">熟练项 Proficiencies</h3>
          <div className="text-xs font-sans space-y-2">
            <p><strong className="block text-[10px] text-[#58180d] uppercase">防具培训</strong> {finalArmorProf.length > 0 ? finalArmorProf.join(', ') : '无'}</p>
            <p><strong className="block text-[10px] text-[#58180d] uppercase">武器熟练</strong> {finalWeaponProf.length > 0 ? finalWeaponProf.join(', ') : '无'}</p>
            <p><strong className="block text-[10px] text-[#58180d] uppercase">语言</strong> {character.customLanguages}</p>
          </div>
        </div>

        <div className="border border-[#58180d] p-3 bg-white/30 flex flex-col min-h-[150px]">
          <div className="flex items-center justify-between gap-2 border-b border-[#58180d] mb-2 pb-1">
            <h3 className="text-xs font-bold uppercase">职业资源 Class Resources</h3>
            <Button
              size="sm"
              className="h-6 rounded-none bg-[#58180d] hover:bg-[#2c1810] text-[10px] px-2"
              onClick={initializeRuntimeResources}
            >
              初始化职业资源
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar text-xs font-sans space-y-2">
            {character.classResources.length > 0 ? (
              character.classResources.map((resource) => (
                <div key={resource.id} className="border border-[#58180d]/20 bg-white/40 p-2">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#58180d]">{resource.sourceFeature || resource.id}</p>
                      <p className="text-[10px] text-[#58180d]/60">{resource.id}</p>
                    </div>
                    <span className="font-bold text-[#2c1810] shrink-0">{resource.current} / {resource.max}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#2c1810]/80">
                    {resource.recoveryType && <span>恢复: {resource.recoveryType}</span>}
                    {resource.dice && <span>骰面: {resource.dice}</span>}
                  </div>
                  {resource.notes && <p className="mt-1 text-[10px] leading-relaxed text-[#2c1810]/70">{resource.notes}</p>}
                </div>
              ))
            ) : (
              <div className="text-xs italic text-gray-500">暂无职业资源</div>
            )}

            {character.pactMagicState && (
              <div className="border border-[#58180d]/30 bg-[#ede1c5]/60 p-2">
                <div className="flex justify-between gap-2">
                  <p className="font-bold text-[#58180d]">契约魔法位 Pact Magic</p>
                  <span className="font-bold text-[#2c1810] shrink-0">{character.pactMagicState.current} / {character.pactMagicState.max}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#2c1810]/80">
                  <span>环级: {character.pactMagicState.slotLevel}</span>
                  <span>恢复: {character.pactMagicState.recoveryType}</span>
                </div>
                {character.pactMagicState.notes && <p className="mt-1 text-[10px] leading-relaxed text-[#2c1810]/70">{character.pactMagicState.notes}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="border border-[#58180d] p-3 bg-white/30 flex flex-col min-h-[150px]">
          <h3 className="text-xs font-bold uppercase border-b border-[#58180d] mb-2 pb-1">个人专长 Feats</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ul className="space-y-1 mb-2 text-sm font-sans">
              {(character.feats || []).length > 0 ? (
                character.feats.map((feat, i) => (
                  <li key={i} className="flex justify-between items-center group bg-[#58180d]/5 pl-2">
                    <span className="font-bold text-[#58180d]">{feat}</span>
                    <button 
                      onClick={() => handleRemoveFeat(i)}
                      className="text-red-600 opacity-0 group-hover:opacity-100 px-2 py-0.5 hover:bg-red-100 transition-opacity"
                    >
                      ×
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-xs italic text-gray-500">暂无专长</li>
              )}
            </ul>
          </div>
          <div className="flex gap-2 mt-2 pt-2 border-t border-[#58180d]/10">
            <Dialog open={isFeatDialogOpen} onOpenChange={setIsFeatDialogOpen}>
              <DialogTrigger asChild>
                 <Button size="sm" className="w-full h-7 rounded-none bg-[#58180d] hover:bg-[#2c1810]">
                   + 自由添加专长 (DM特批/剧情奖励)
                 </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[600px] bg-[#fdf6e3] border-2 border-[#58180d] text-[#2c1810] font-serif rounded-none shadow-[4px_4px_0px_#58180d]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold uppercase text-[#58180d]">选取追加专长</DialogTitle>
                  <p className="text-xs text-[#58180d]/70 italic mt-1 font-sans">注意：正常规则下，角色应该由于类升阶（Level Up - ASI）而在「游玩面板」获得专长。此面板用于手动添加背景扩展或DM给予的额外专长。</p>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3 mt-2">
                    {FEATS_DATA.map((feat) => {
                      const isMeetPrereq = feat.checkPrereq(character);
                      const isAlreadyLearned = character.feats?.includes(feat.name);
                      return (
                        <div key={feat.name} className={`p-3 border ${isMeetPrereq ? 'border-[#58180d] bg-white' : 'border-gray-300 bg-gray-100 opacity-70'} flex flex-col gap-2 relative`}>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-bold text-[#58180d]">{feat.name}</h4>
                              <p className="text-xs text-black/70 mt-1 leading-relaxed">{feat.desc}</p>
                              <div className="text-[10px] mt-2 font-sans">
                                <strong>先决条件:</strong> <span className={isMeetPrereq ? 'text-green-700' : 'text-red-600'}>{feat.prerequisiteDesc}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isMeetPrereq || isAlreadyLearned}
                              onClick={() => handleAddFeat(feat.name)}
                              className="shrink-0 h-8 rounded-none border-[#58180d] text-[#58180d] hover:bg-[#58180d] hover:text-white"
                            >
                              {isAlreadyLearned ? '已习得' : (isMeetPrereq ? '学习' : '未满足条件')}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Detail Text Column */}
      <div className="col-span-1 lg:col-span-12 border-t-2 border-[#58180d] pt-4 mt-2">
        <h3 className="text-sm font-bold uppercase text-[#58180d] mb-3">人物详情 Character Details</h3>
        <div className="bg-[#1a0f0a] border border-[#58180d] p-4 text-[#d5c4a1] font-serif flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <h4 className="text-xs uppercase tracking-widest text-[#a68a56] border-b border-[#58180d]/50 pb-1 mb-2">生平与描述</h4>
            <div className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">
              {character.description || '一位尚未留下传说的冒险者...'}
            </div>
            {character.activeMods && character.activeMods.length > 0 && (
              <div className="mt-4 text-xs italic text-[#a68a56]">
                * 织网者低语：命运之线已纠缠——此人承载了 <strong>[{character.activeMods.join(', ')}]</strong> 的异世法则。
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-[#58180d]/50 text-sm leading-relaxed text-[#a68a56] italic">
               "在这片充满未知的费伦大陆上，众神掷下的不仅是命运的骰子。你的故事，可能成为吟游诗人口中传唱千年的史诗，也可能只是酒馆角落里的一声叹息... 愿知识指引你，冒险者。"
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
