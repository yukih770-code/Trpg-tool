import { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { getAvailableRaces, getAvailableClasses, getAvailableFeats } from '../lib/mod-utils';
import { BACKGROUND_DATA } from '../data/backgrounds';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { ScrollArea } from '../../components/ui/scroll-area';
import { AttributeName } from '../lib/dnd-types';
import { toast } from 'sonner';

export function Creator({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const { character, updateField, updateAttrPointBuy, resetCreator } = useCharacterStore();

  const RACE_DATA = getAvailableRaces(character);
  const CLASS_DATA = getAvailableClasses(character);

  const handleComplete = () => {
    // Validate everything
    if (!character.name) {
      setStep(1); return toast("请填写角色名字");
    }
    if (!character.race) {
      setStep(2); return toast("请选择种族");
    }
    const race = RACE_DATA.find(r => r.name === character.race);
    if (race?.subraces.length && !character.subrace) {
      setStep(2); return toast("请选择子种族");
    }
    if (!character.jobClass) {
      setStep(3); return toast("请选择职业");
    }
    const cls = CLASS_DATA.find(c => c.name === character.jobClass);
    if (cls?.subclasses.some(s => s.unlockLevel === 1) && !character.subclass) {
      setStep(3); return toast("请选择子职业");
    }
    if (!character.background) {
      setStep(4); return toast("请选择背景");
    }
    if (!character.feats || character.feats.length === 0) {
      setStep(4); return toast("请选择一个出身专长");
    }
    if (character.remainingPoints > 0) {
       setStep(5); return toast("属性未分配完毕", { description: "请分配剩余的属性点。" });
    }
    
    // Complete logic calculation
    const conVal = character.attrs.Con.base + character.attrs.Con.pointbuy + character.attrs.Con.racebonus;
    const conMod = Math.floor((conVal - 10) / 2);
    const hitDiceSizes: Record<string, number> = { '野蛮人': 12, '战士': 10, '圣武士': 10, '游侠': 10, '法师': 6, '术士': 6, '护法': 10, '武僧': 8, '吟游诗人': 8, '牧师': 8, '德鲁伊': 8, '邪术师': 8, '游荡者': 8 };
    const hd = hitDiceSizes[character.jobClass] || 8;
    const initialHp = hd + conMod;
    const isCaster = ['法师', '吟游诗人', '牧师', '术士', '邪术师', '德鲁伊'].includes(character.jobClass);
    
    const spellbook = { ...character.spellbook };
    if (isCaster) {
       spellbook.slots = { 1: { max: 2, current: 2 } };
    } else {
       spellbook.slots = {};
    }

    if (cls) {
      updateField('weaponProficiencies', cls.weaponProficiencies);
      updateField('armorTraining', cls.armorProficiencies);
      updateField('savingThrowProficiencies', cls.savingThrows as AttributeName[]);
      updateField('inventory', [cls.startingEquipment]);
    }

    const bg = BACKGROUND_DATA.find(b => b.name === character.background);
    if (bg) {
      updateField('skillProficiencies', bg.skillProficiencies);
    }

    updateField('hpMax', Math.max(1, initialHp));
    updateField('hpCurrent', Math.max(1, initialHp));
    updateField('spellbook', spellbook);
    updateField('isCompleted', true);
    onComplete();
  };

  const attrList: AttributeName[] = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
  const attrLabels: Record<AttributeName, string> = { Str: "力量", Dex: "敏捷", Con: "体质", Int: "智力", Wis: "感知", Cha: "魅力" };

  const tabs = [
    { id: 1, label: "基础信息 / Origin" },
    { id: 2, label: "种族 / Race" },
    { id: 3, label: "职业 / Class" },
    { id: 4, label: "背景 / Background" },
    { id: 5, label: "属性 / Abilities" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <div className="col-span-1 flex flex-col gap-3">
        <div className="bg-[#58180d] p-4 text-white shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
          <h2 className="text-xl font-bold uppercase tracking-tighter">角色创建器</h2>
          <p className="text-xs opacity-70 italic mt-1">定制你的命运</p>
        </div>
        
        <div className="flex flex-col gap-1">
          {tabs.map(t => (
            <button key={t.id}
              onClick={() => setStep(t.id)}
              className={`text-left px-4 py-3 font-bold uppercase text-sm border-l-4 transition-all ${
                step === t.id 
                  ? 'border-[#58180d] bg-white text-[#58180d] shadow-[2px_2px_0px_#58180d]' 
                  : 'border-transparent text-[#58180d]/60 hover:text-[#58180d] hover:bg-[#58180d]/5'
              }`}
            >
              {t.label}
              {/* Optional Validation Hint Dots */}
              {t.id === 1 && character.name && <span className="float-right text-green-600">●</span>}
              {t.id === 2 && character.race && <span className="float-right text-green-600">●</span>}
              {t.id === 3 && character.jobClass && <span className="float-right text-green-600">●</span>}
              {t.id === 4 && character.background && <span className="float-right text-green-600">●</span>}
              {t.id === 5 && character.remainingPoints === 0 && <span className="float-right text-green-600">●</span>}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button variant="ghost" onClick={() => { resetCreator(); setStep(1); }} className="text-[#58180d] hover:bg-[#58180d]/10 uppercase text-xs font-bold rounded-none border border-transparent hover:border-[#58180d]">重置所有</Button>
          <Button className="rounded-none bg-[#58180d] text-[#fdf6e3] hover:opacity-90 uppercase font-bold tracking-tight text-lg py-6 shadow-[2px_2px_0px_rgba(0,0,0,0.5)]" onClick={handleComplete}>
            启程 Venture Forth
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="col-span-1 lg:col-span-3 space-y-6">
        {step === 1 && (
          <Card className="bg-[#f4ecd8] border border-[#58180d] text-[#2c1810] rounded-none shadow-[2px_2px_0px_#58180d]">
            <CardHeader className="border-b border-[#58180d]/30">
              <CardTitle className="uppercase font-bold tracking-tight">命运的织卷：基础信息</CardTitle>
              <CardDescription className="text-[#58180d]/70 italic">在众神的书简中，留下你的名讳，宣告你的生平。每一个字迹，都将化为费伦大陆上的实体脚印。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-[#58180d]">角色名称 *</label>
                <Input className="bg-white border-[#58180d] rounded-none focus-visible:ring-[#58180d]" value={character.name} onChange={e => updateField('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-[#58180d]">年龄</label>
                  <Input className="bg-white border-[#58180d] rounded-none focus-visible:ring-[#58180d]" value={character.age} onChange={e => updateField('age', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-[#58180d]">性别</label>
                  <div className="flex flex-wrap gap-2">
                    {['男性', '女性', '非二元', '其他/隐藏'].map((g) => (
                      <button
                        key={g}
                        onClick={() => updateField('gender', g)}
                        className={`flex-1 min-w-[60px] py-2 text-xs font-bold border transition-colors ${
                          character.gender === g
                            ? 'bg-[#58180d] text-white border-[#58180d]'
                            : 'bg-white text-[#58180d] border-[#58180d] hover:bg-[#58180d]/10'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-[#58180d]">掌握语言 (自由描写)</label>
                <Input className="bg-white border-[#58180d] rounded-none focus-visible:ring-[#58180d]" value={character.customLanguages} onChange={e => updateField('customLanguages', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-[#58180d]">人物生平与细节</label>
                <textarea 
                  className="w-full flex min-h-[120px] rounded-none border border-[#58180d] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58180d]"
                  value={character.description} 
                  onChange={e => updateField('description', e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScrollArea className="h-[600px] border border-[#58180d] bg-white/50 p-4 shadow-[2px_2px_0px_#58180d]">
              {RACE_DATA.map(r => (
                <div key={r.name} 
                   className={`p-3 mb-3 border cursor-pointer transition-colors ${character.race === r.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/30 bg-[#ede1c5] hover:border-[#58180d]'}`}
                    onClick={() => {
                     updateField('race', r.name);
                     updateField('subrace', '');
                     updateField('size', r.size);
                     updateField('speed', `${r.speed} 尺`);
                     updateField('customLanguages', r.baseLanguages.join(', '));
                     const newAttrs = { ...character.attrs };
                     attrList.forEach(attr => {
                       newAttrs[attr] = { ...newAttrs[attr], racebonus: r[`${attr.toLowerCase() as Lowercase<AttributeName>}Bonus`] as number };
                     });
                     updateField('attrs', newAttrs);
                   }}>
                  <h3 className="font-bold uppercase tracking-tight">{r.name}</h3>
                  <p className={`text-xs mt-1 leading-tight ${character.race === r.name ? 'text-white/80' : 'text-[#58180d]/70'}`}>{r.desc}</p>
                </div>
              ))}
            </ScrollArea>
            
            {character.race && (
              <Card className="bg-[#f4ecd8] border border-[#58180d] text-[#2c1810] rounded-none shadow-[2px_2px_0px_#58180d] h-fit">
                <CardHeader className="border-b border-[#58180d]/30">
                  <CardTitle className="uppercase font-bold">{character.race} 详情</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {(() => {
                    const race = RACE_DATA.find(x => x.name === character.race);
                    if (!race) return <p className="text-sm italic opacity-60">请先选择一个种族。</p>;
                    return (
                      <>
                        {race.features.map((f, i) => (
                          <p key={i} className="text-sm font-sans tracking-tight">{f}</p>
                        ))}
                        
                        {(race.subraces?.length || 0) > 0 && (
                          <div className="mt-6">
                            <h4 className="text-xs font-bold uppercase border-b border-[#58180d]/30 mb-2 pb-1">选择子种族：</h4>
                            <div className="space-y-2 font-sans">
                              {race.subraces.map(sr => (
                                <div key={sr.name} 
                                   className={`p-2 cursor-pointer border ${character.subrace === sr.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/30 bg-white hover:border-[#58180d]'}`}
                                   onClick={() => {
                                     updateField('subrace', sr.name);
                                     if (sr.size) updateField('size', sr.size);
                                     if (sr.speed) updateField('speed', `${sr.speed} 尺`);
                                     if (sr.baseLanguages) updateField('customLanguages', sr.baseLanguages.join(', '));
                                     
                                     const newAttrs = { ...character.attrs };
                                     attrList.forEach(attr => {
                                       newAttrs[attr] = { 
                                         ...newAttrs[attr], 
                                         racebonus: (race[`${attr.toLowerCase() as Lowercase<AttributeName>}Bonus`] as number) + (sr[`${attr.toLowerCase() as Lowercase<AttributeName>}Bonus`] as number) 
                                       };
                                     });
                                     updateField('attrs', newAttrs);
                                   }}>
                                  <div className="font-bold">{sr.name}</div>
                                  <p className="text-xs mt-1 leading-tight">{sr.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 3 && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <ScrollArea className="h-[600px] border border-[#58180d] bg-white/50 p-4 shadow-[2px_2px_0px_#58180d]">
             {CLASS_DATA.map(c => (
               <div key={c.name} 
                  className={`p-3 mb-3 border cursor-pointer transition-colors ${character.jobClass === c.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/30 bg-[#ede1c5] hover:border-[#58180d]'}`}
                  onClick={() => {
                    updateField('jobClass', c.name);
                    updateField('hitDiceCurrent', 1);
                    updateField('subclass', '');
                  }}>
                 <h3 className="font-bold uppercase tracking-tight">{c.name}</h3>
                 <p className={`text-xs mt-1 leading-tight ${character.jobClass === c.name ? 'text-white/80' : 'text-[#58180d]/70'}`}>{c.desc}</p>
               </div>
             ))}
           </ScrollArea>
           
           {character.jobClass && (
             <Card className="bg-[#f4ecd8] border border-[#58180d] text-[#2c1810] rounded-none shadow-[2px_2px_0px_#58180d] h-fit">
               <CardHeader className="border-b border-[#58180d]/30">
                 <CardTitle className="uppercase font-bold">{character.jobClass} 详情</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 pt-4">
                 {(() => {
                   const cls = CLASS_DATA.find(c => c.name === character.jobClass)!;
                   const lvl1Subclasses = cls.subclasses.filter(sc => sc.unlockLevel === 1);
                   return (
                     <>
                      {lvl1Subclasses.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-bold uppercase border-b border-[#58180d]/30 mb-2 pb-1">选择子职业（1级）：</h4>
                          <div className="space-y-2 font-sans">
                            {lvl1Subclasses.map(sc => (
                              <div key={sc.name} 
                                 className={`p-2 cursor-pointer border ${character.subclass === sc.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/30 bg-white hover:border-[#58180d]'}`}
                                 onClick={() => updateField('subclass', sc.name)}>
                                <div className="font-bold">{sc.name}</div>
                                <p className="text-xs mt-1 leading-tight">{sc.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-sm border border-[#58180d]/30 p-2 bg-white">
                        <span className="text-xs uppercase font-bold text-[#58180d]">生命骰:</span> <span className="font-mono font-bold">{cls.hitDice}</span><br />
                        <span className="text-xs uppercase font-bold text-[#58180d]">主属性:</span> {attrLabels[cls.primaryAbility as AttributeName]}<br />
                        <span className="text-xs uppercase font-bold text-[#58180d]">豁免熟练:</span> {cls.savingThrows.map(s => attrLabels[s as AttributeName] || s).join(', ')}<br />
                        <span className="text-xs uppercase font-bold text-[#58180d]">防具与武器:</span> {[...cls.armorProficiencies, ...cls.weaponProficiencies].join(', ')}
                      </div>
                      <h4 className="text-xs font-bold uppercase border-b border-[#58180d]/30 mt-4 mb-2 pb-1">1级特性：</h4>
                      <ul className="list-disc pl-4 space-y-1 text-sm font-sans">
                        {cls.features.filter(f => f.unlockLevel === 1).map((f, i) => (
                          <li key={i}><span className="font-bold text-[#58180d]">{f.name}：</span>{f.desc}</li>
                        ))}
                      </ul>
                     </>
                   )
                 })()}
               </CardContent>
             </Card>
           )}
         </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-[#58180d] mb-2 px-1">选择出身背景 (Background)</h3>
              <ScrollArea className="h-[400px] border border-[#58180d] bg-white/50 p-4 shadow-[2px_2px_0px_#58180d]">
                {BACKGROUND_DATA.map(bg => (
                  <div key={bg.name} 
                      className={`p-3 mb-3 border cursor-pointer transition-colors ${character.background === bg.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/30 bg-[#ede1c5] hover:border-[#58180d]'}`}
                      onClick={() => {
                        updateField('background', bg.name);
                        // Auto-assign the origin feat from background if not already selected
                        if (bg.originFeat) {
                          updateField('feats', [bg.originFeat]);
                        }
                      }}>
                    <h3 className="font-bold uppercase tracking-tight">{bg.name}</h3>
                    <p className={`text-xs mt-1 leading-tight ${character.background === bg.name ? 'text-white/80' : 'text-[#58180d]/70'}`}>{bg.desc}</p>
                  </div>
                ))}
              </ScrollArea>

              {character.background && (
                <div className="mt-4">
                  <h3 className="text-xs font-bold uppercase text-[#58180d] mb-2 px-1">确认 1 级出身专长 (Origin Feat)</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {getAvailableFeats(character).filter(f => f.category === 'Origin').map(feat => (
                      <div key={feat.name}
                        onClick={() => updateField('feats', [feat.name])}
                        className={`p-2 border text-xs cursor-pointer transition-colors ${
                          character.feats?.includes(feat.name)
                            ? 'border-[#58180d] bg-[#58180d] text-white'
                            : 'border-[#58180d]/30 bg-white hover:border-[#58180d]'
                        }`}
                      >
                        <div className="font-bold uppercase tracking-tighter">{feat.name}</div>
                        <p className={`text-[10px] ${character.feats?.includes(feat.name) ? 'text-white/70' : 'text-[#58180d]/60'}`}>{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {character.background && (
              <Card className="bg-[#f4ecd8] border border-[#58180d] text-[#2c1810] rounded-none shadow-[2px_2px_0px_#58180d] h-fit sticky top-0">
                <CardHeader className="border-b border-[#58180d]/30">
                  <CardTitle className="uppercase font-bold">{character.background}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {(() => {
                    const bg = BACKGROUND_DATA.find(b => b.name === character.background);
                    if (!bg) return <p className="text-xs italic text-[#58180d]/60">请选择一个背景来看详细信息。</p>;
                    const selectedFeat = getAvailableFeats(character).find(f => character.feats?.includes(f.name));
                    return (
                      <div className="text-sm space-y-3 font-sans">
                        <p><strong className="text-xs uppercase font-bold text-[#58180d] block">技能熟练</strong>{bg.skillProficiencies.join(', ')}</p>
                        {selectedFeat && (
                          <div className="p-2 border border-[#58180d]/30 bg-[#58180d]/5">
                            <strong className="text-xs uppercase font-bold text-[#58180d] block mb-1">当前的出身专长</strong>
                            <span className="font-bold">{selectedFeat.name}</span>
                            <p className="text-xs mt-1 text-[#58180d]/80">{selectedFeat.desc}</p>
                          </div>
                        )}
                        {bg.toolProficiencies && <p><strong className="text-xs uppercase font-bold text-[#58180d] block">工具熟练</strong>{bg.toolProficiencies.join(', ')}</p>}
                        <div className="mt-4 pt-4 border-t border-[#58180d]/30">
                          <strong className="text-xs uppercase font-bold text-[#58180d]">背景特性: {bg.feature.name}</strong>
                          <p className="mt-1">{bg.feature.desc}</p>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 5 && (
          <Card className="bg-[#f4ecd8] border border-[#58180d] text-[#2c1810] rounded-none shadow-[2px_2px_0px_#58180d]">
            <CardHeader className="flex flex-row justify-between items-center border-b border-[#58180d]/30 pb-4">
              <div>
                <CardTitle className="uppercase font-bold">属性加点</CardTitle>
                <CardDescription className="text-xs text-[#58180d] mt-1">27点买点系统 (Point Buy)</CardDescription>
              </div>
              <div className="bg-[#ede1c5] border border-[#58180d] px-4 py-2 shadow-inner text-center">
                <span className="text-[10px] uppercase font-bold text-[#58180d] block mb-1">剩余点数</span>
                <span className="text-3xl font-black">{character.remainingPoints}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attrList.map(attr => {
                  const stat = character.attrs[attr];
                  const finalVal = stat.base + stat.pointbuy + stat.racebonus;
                  return (
                    <div key={attr} className="bg-white border border-[#58180d] p-3 flex flex-col gap-2 shadow-[2px_2px_0px_#58180d]">
                      <div className="flex justify-between items-center border-b border-[#58180d]/30 pb-2">
                        <div className="font-bold uppercase tracking-tight">{attrLabels[attr]} <span className="text-[#58180d]/60 text-xs ml-1">({attr})</span></div>
                        <div className="text-[10px] bg-[#58180d]/10 text-[#58180d] px-2 py-0.5 uppercase font-bold">种族加成: +{stat.racebonus}</div>
                      </div>
                      <div className="flex items-center justify-between mt-2 px-2">
                        <Button variant="outline" size="sm" onClick={() => updateAttrPointBuy(attr, stat.pointbuy - 1)} disabled={stat.pointbuy <= 0} className="h-10 w-10 p-0 rounded-none border-[#58180d] text-[#58180d] text-lg font-bold hover:bg-[#58180d] hover:text-white">-</Button>
                        <div className="text-4xl font-black w-14 text-center">{finalVal}</div>
                        <Button variant="outline" size="sm" onClick={() => updateAttrPointBuy(attr, stat.pointbuy + 1)} disabled={stat.pointbuy >= 7 || character.remainingPoints <= 0} className="h-10 w-10 p-0 rounded-none border-[#58180d] text-[#58180d] text-lg font-bold hover:bg-[#58180d] hover:text-white">+</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
