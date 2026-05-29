import { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { ScrollArea } from '../../components/ui/scroll-area';
import { getAvailableSpells, getAvailableClasses, getAvailableFeats } from '../lib/mod-utils';
import { AttributeName, SpellInfo, FeatDef } from '../lib/dnd-types';
import { toast } from 'sonner';

function dndLogColor(line: string): string {
  if (line.includes('大成功') || line.includes('自然20')) return 'text-yellow-600 font-bold';
  if (line.includes('成功') && !line.includes('失败')) return 'text-emerald-700 font-bold';
  if (line.includes('大失败') || line.includes('自然1')) return 'text-red-700 font-bold';
  if (line.includes('失败')) return 'text-red-600';
  if (line.includes('[系统]')) return 'text-[#58180d]/40 italic';
  return 'text-[#2c1810]';
}

export function Gameplay() {
  const { character, levelUp, restShort, restLong, modifyHp, updateSpellbook, consumeSpellSlot, updateField } = useCharacterStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showSpellManager, setShowSpellManager] = useState(false);
  const [selectedSubclass, setSelectedSubclass] = useState<string>('');
  const [asiChoices, setAsiChoices] = useState<AttributeName[]>([]);
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  const [diceTray, setDiceTray] = useState<Record<string, number>>({});
  const [combatLog, setCombatLog] = useState<string[]>(['[系统] 战斗模拟面板已就绪。']);
  const [lastRoll, setLastRoll] = useState<{ total: number; formula: string; detail: string; type: 'crit'|'fumble'|'success'|'neutral' } | null>(null);

  const SPELL_DATA = getAvailableSpells(character);
  const CLASS_DATA = getAvailableClasses(character);
  const FEATS_DATA = getAvailableFeats(character);

  if (!character.isCompleted) {
    return <div className="text-center py-20 text-neutral-400">请先在创建器中完成角色创建。</div>;
  }

  const hpPercent = Math.max(0, Math.min(100, (character.hpCurrent / character.hpMax) * 100));

  const castSpell = (spellName: string, level: number) => {
    if (level === 0) {
      toast(`作为戏法施展了 ${spellName}!`);
      return;
    }
    
    if (consumeSpellSlot(level)) {
      toast(`内源法力涌动...`, {
        description: `消耗了 1 个 ${level}环 法术位，施展了 ${spellName}!`
      });
    } else {
      toast.error(`法力不足！`, {
        description: `你没有剩余的 ${level}环 法术位了。`
      });
    }
  };

  const handleDamage = () => {
    const amount = parseInt(prompt("输入受到的伤害数值:") || "0", 10);
    if (amount > 0) modifyHp(-amount);
  };

  const handleHeal = () => {
    const amount = parseInt(prompt("输入恢复的生命值:") || "0", 10);
    if (amount > 0) modifyHp(amount);
  };

  let modifierAttr: AttributeName = 'Cha';
  if (['法师'].includes(character.jobClass)) modifierAttr = 'Int';
  if (['牧师', '德鲁伊', '游侠'].includes(character.jobClass)) modifierAttr = 'Wis';
  const stat = character.attrs[modifierAttr];
  const castingMod = Math.floor((stat.base + stat.pointbuy + stat.racebonus + (stat.extrabonus||0) - 10) / 2);

  const isPreparedCaster = ['牧师', '德鲁伊', '圣武士', '法师'].includes(character.jobClass);
  const maxPrepared = Math.max(1, character.level + castingMod);
  const isCaster = ['法师', '吟游诗人', '牧师', '术士', '邪术师', '德鲁伊', '圣武士', '游侠'].includes(character.jobClass);

  const classSpells = SPELL_DATA.filter(s => s.classes.includes(character.jobClass));
  const maxSpellLevel = Object.keys(character.spellbook.slots).length > 0 ? Math.max(...Object.keys(character.spellbook.slots).map(Number)) : 0;
  
  const availableSpells = classSpells.filter(s => s.level <= maxSpellLevel);
  const knownSpells = character.spellbook.known || [];
  const preparedSpells = character.spellbook.prepared || [];

  const activeSpells = isPreparedCaster 
    ? availableSpells.filter(s => preparedSpells.includes(s.name_cn))
    : knownSpells;

  const handleTogglePrepare = (spellName: string) => {
    if (preparedSpells.includes(spellName)) {
      updateSpellbook(knownSpells, preparedSpells.filter(n => n !== spellName));
    } else {
      if (preparedSpells.length >= maxPrepared) {
         toast(`你最多只能准备 ${maxPrepared} 个法术！`);
         return;
      }
      updateSpellbook(knownSpells, [...preparedSpells, spellName]);
    }
  };

  const handleToggleLearn = (spell: SpellInfo) => {
    const spellName = spell.name_cn;
    if (knownSpells.find(s => s.name_cn === spellName)) {
      updateSpellbook(knownSpells.filter(s => s.name_cn !== spellName), preparedSpells.filter(n => n !== spellName));
    } else {
      updateSpellbook([...knownSpells, spell], preparedSpells);
    }
  };

  const classDef = CLASS_DATA.find(c => c.name === character.jobClass);
  const nextLvl = character.level + 1;
  const isAsiLevel = [4, 8, 12, 16, 19].includes(nextLvl);
  const subclassOptions = classDef?.subclasses.filter(sc => sc.unlockLevel === nextLvl && !character.subclass) || [];

  const handleLevelUpConfirm = () => {
    if (subclassOptions.length > 0 && !selectedSubclass) {
      toast("请选择子职业");
      return;
    }
    if (isAsiLevel && asiChoices.length !== 2 && !selectedFeat) {
      toast("请分配2点属性提升，或者选择一个通用专长");
      return;
    }

    const conMod = Math.floor((character.attrs.Con.base + character.attrs.Con.pointbuy + character.attrs.Con.racebonus + character.attrs.Con.extrabonus - 10) / 2);
    const hitDiceSizes: Record<string, number> = { '野蛮人': 7, '战士': 6, '圣武士': 6, '游侠': 6, '法师': 4, '术士': 4, '牧师': 5, '吟游诗人': 5, '邪术师': 5, '武僧': 5, '德鲁伊': 5, '游荡者': 5 };
    const baseHpIncrease = hitDiceSizes[character.jobClass] || 5;
    const hpIncrease = Math.max(1, baseHpIncrease + conMod);

    levelUp(hpIncrease, selectedSubclass, asiChoices, selectedFeat || undefined);
    setShowLevelUp(false);
    setSelectedSubclass('');
    setAsiChoices([]);
    setSelectedFeat(null);
    toast(`成功升至 Level ${nextLvl}!`, { description: `最大生命值增加了 ${hpIncrease}${selectedFeat ? `，获得了专长：${selectedFeat}` : ''}。`});
  };

  const handleAsiChange = (attr: AttributeName, increment: number) => {
     if (increment > 0) {
        if (asiChoices.length >= 2) return;
        setSelectedFeat(null); // Clear feat if ASI is chosen
        setAsiChoices([...asiChoices, attr]);
     } else {
        const idx = asiChoices.indexOf(attr);
        if (idx !== -1) {
           const newChoices = [...asiChoices];
           newChoices.splice(idx, 1);
           setAsiChoices(newChoices);
        }
     }
  };

  const handleFeatSelect = (featName: string) => {
    setSelectedFeat(featName);
    setAsiChoices([]); // Clear ASI if feat is chosen
  };

  const attrLabels: Record<AttributeName, string> = { Str: "力量", Dex: "敏捷", Con: "体质", Int: "智力", Wis: "感知", Cha: "魅力" };

  const handleAddDie = (die: string) => {
    setDiceTray(prev => ({ ...prev, [die]: (prev[die] || 0) + 1 }));
  };

  const handleClearDice = () => {
    setDiceTray({});
  };

  const handleRollDice = () => {
    let total = 0;
    let details: string[] = [];
    for (const [die, count] of (Object.entries(diceTray) as [string, number][])) {
      if (count > 0) {
        const sides = parseInt(die.substring(1), 10);
        let individualRolls: number[] = [];
        for (let i = 0; i < count; i++) {
          const roll = Math.floor(Math.random() * sides) + 1;
          total += roll;
          individualRolls.push(roll);
        }
        details.push(`${count}${die}[${individualRolls.join(', ')}]`);
      }
    }
    
    if (details.length === 0) return;

    const msg = `掷出 ${details.join(' + ')}，总和: ${total}`;
    setCombatLog(prev => [msg, ...prev].slice(0, 20));
    toast.success(`掷出骰子`, { description: msg });

    // Detect d20 crits/fumbles
    const hasD20 = 'd20' in diceTray && diceTray['d20'] > 0;
    const rollType = hasD20 && total === 20 ? 'crit' : hasD20 && total === 1 ? 'fumble' : 'neutral';
    setLastRoll({ total, formula: details.join(' + '), detail: details.join(' + ') + ' = ' + total, type: rollType });
    setDiceTray({});
  };

  return (
    <div className="space-y-6">
      {/* ... existing header ... */}
      <div className="flex justify-between items-center border-b-2 border-[#58180d] mb-4 pb-2">
        <h2 className="text-2xl font-bold uppercase tracking-tighter text-[#58180d]">战斗与游玩面板</h2>
        <Button onClick={() => setShowLevelUp(true)} className="bg-[#58180d] text-[#fdf6e3] hover:opacity-90 uppercase text-sm font-bold rounded-none">
          ✨ 升级 (当前 Lv.{character.level})
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ... existing columns ... */}
        {/* Actions & Vitals Column */}
        <div className="col-span-1 lg:col-span-6 flex flex-col gap-4">
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
              <button className="flex-1 bg-red-900 text-white py-2 text-xs font-bold uppercase hover:opacity-90 transition-opacity" onClick={handleDamage}>⚔️ 受到伤害</button>
              <button className="flex-1 bg-emerald-800 text-white py-2 text-xs font-bold uppercase hover:opacity-90 transition-opacity" onClick={handleHeal}>💚 恢复生命</button>
            </div>

            <div className="flex gap-2">
               <div className="flex-1 border border-[#58180d]/30 bg-white p-2 text-center cursor-pointer hover:border-[#58180d] transition" onClick={() => { restShort(); toast("进行了短休 (1小时)"); }}>
                 <div className="text-[10px] font-bold uppercase text-[#58180d]">短休</div>
                 <div className="text-[9px] text-[#58180d]/60 mt-1 uppercase">消耗生命骰</div>
               </div>
               <div className="flex-1 border border-[#58180d]/30 bg-white p-2 text-center cursor-pointer hover:border-[#58180d] transition" onClick={() => { restLong(); toast("进行了长休 (8小时)", {description: "生命值与法术位已全满！"}); }}>
                 <div className="text-[10px] font-bold uppercase text-[#58180d]">长休</div>
                 <div className="text-[9px] text-[#58180d]/60 mt-1 uppercase">完全恢复</div>
               </div>
            </div>
          </div>

          <div className="border border-[#58180d] p-3 bg-white/30 flex flex-col flex-1">
            <h3 className="text-xs font-bold uppercase border-b border-[#58180d] mb-2 pb-1 text-[#58180d]">战斗日志 & 自由掷骰</h3>
            <div className="flex-1 font-mono text-[10px] overflow-hidden custom-scrollbar max-h-[150px] overflow-y-auto mb-2 bg-[#fdf6e3]/50 p-2 border border-[#58180d]/10">
               {combatLog.map((log, i) => (
                 <div key={i} className={`border-b border-[#58180d]/10 py-1 last:border-0 ${dndLogColor(log)}`}>{log}</div>
               ))}
            </div>
            
            {/* Last Roll Result — prominent display */}
            {lastRoll && (
              <div className={`mb-3 border-2 p-3 text-center transition-all
                ${lastRoll.type === 'crit' ? 'border-yellow-500 bg-yellow-900/20' :
                  lastRoll.type === 'fumble' ? 'border-red-700 bg-red-900/20' :
                  'border-[#58180d]/60 bg-[#58180d]/10'}`}>
                <div className="text-[10px] uppercase font-black text-[#58180d] tracking-widest mb-1">
                  {lastRoll.type === 'crit' ? '⚡ 自然20 — 大成功！' : lastRoll.type === 'fumble' ? '💀 自然1 — 大失败！' : '🎲 掷骰结果'}
                </div>
                <div className={`text-5xl font-black font-serif leading-none mb-1
                  ${lastRoll.type === 'crit' ? 'text-yellow-500' : lastRoll.type === 'fumble' ? 'text-red-600' : 'text-[#58180d]'}`}>
                  {lastRoll.total}
                </div>
                <div className="text-[10px] text-[#58180d]/60 font-mono">{lastRoll.formula}</div>
              </div>
            )}

            <div className="mt-auto pt-2 border-t border-[#58180d]/30">
               <div className="flex justify-between items-center mb-2">
                 <div className="text-[9px] uppercase font-black text-[#58180d]">选取投掷骰: {(Object.entries(diceTray) as [string, number][]).filter(([_, c]) => c > 0).map(([d, c]) => `${c}${d}`).join(' + ') || '—'}</div>
                 <div className="flex gap-1">
                   <Button size="sm" variant="outline" className="h-5 px-2 text-[9px] rounded-none border-[#58180d] text-[#58180d]" onClick={handleClearDice}>清空</Button>
                   <Button size="sm" className="h-5 px-3 text-[9px] rounded-none bg-[#58180d] text-[#fdf6e3] font-black" onClick={handleRollDice} disabled={Object.values(diceTray).every(c => c === 0)}>R O L L</Button>
                 </div>
               </div>
               <div className="flex flex-wrap gap-1">
                 {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(die => (
                   <button key={die}
                     className="w-9 h-9 border-2 border-[#58180d] bg-white text-[#58180d] font-black text-[11px] hover:bg-[#58180d] hover:text-white transition-colors relative shadow-sm"
                     onClick={() => handleAddDie(die)}>
                     {die}
                     {diceTray[die] > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-700 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] leading-none font-black">{diceTray[die]}</span>}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Spells & Equipment Column */}
        <div className="col-span-1 lg:col-span-6 flex flex-col gap-4">
          {isCaster ? (
            <div className="border border-[#58180d] bg-[#ede1c5] p-3 flex flex-col gap-2 shadow-[2px_2px_0px_#58180d] min-h-[300px]">
              <div className="flex justify-between items-center border-b border-[#58180d] pb-2">
                <h3 className="text-xs font-bold uppercase text-[#58180d] flex items-center">
                  魔法书 & 法术位
                  {isPreparedCaster && <span className="ml-2 font-normal text-[10px] bg-[#58180d]/10 px-1 py-0.5 rounded">已准备 {preparedSpells.length}/{maxPrepared}</span>}
                </h3>
                <Button size="sm" variant="outline" className="h-6 text-[10px] rounded-none border-[#58180d] text-[#58180d] px-2 py-0 uppercase" onClick={() => setShowSpellManager(true)}>管理法术</Button>
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
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar font-sans">
                  {activeSpells.map(spell => (
                    <div key={spell.name_cn} className="flex justify-between items-center text-sm p-2 bg-white border-l-2 border-[#58180d] hover:bg-[#58180d]/5 transition">
                      <div>
                        <div className="font-bold text-[#2c1810]">{spell.name_cn} <span className="text-xs font-normal italic text-[#58180d]">({spell.level}环)</span></div>
                        <div className="text-[10px] text-[#58180d]/70 line-clamp-1 mt-0.5">{spell.desc}</div>
                      </div>
                      <button className="bg-[#58180d] text-white px-3 py-1 text-[10px] font-bold uppercase rounded-none shrink-0" 
                        onClick={() => castSpell(spell.name_cn, spell.level)}>
                        施展
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-[#58180d] bg-[#f4ecd8] p-3 flex flex-col gap-2 min-h-[300px]">
              <h3 className="text-xs font-bold uppercase border-b border-[#58180d] pb-2 text-[#58180d]">战斗行动 Actions</h3>
              <div className="space-y-2 flex-1">
                <div className="flex justify-between items-center text-sm p-2 bg-white/40 border-l-2 border-[#58180d]">
                  <span className="font-serif">普通攻击 Attack</span>
                  <div className="flex gap-4 items-center">
                    <button className="bg-[#58180d] text-white px-3 py-1 text-[10px] font-bold uppercase" onClick={() => toast("发起攻击！")}>执行</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Level Up Modal Overlay */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-[#2c1810]/80 flex items-center justify-center z-50 p-4 font-serif">
          <div className="bg-[#fdf6e3] border-4 border-[#58180d] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6">
            <h2 className="text-3xl font-black uppercase text-[#58180d] border-b-2 border-[#58180d] pb-2 text-center">系统提示: 等级提升</h2>
            
            <p className="text-center font-bold">你准备好升至 <span className="text-xl text-[#58180d]">Level {nextLvl}</span> 了吗？</p>

            {subclassOptions.length > 0 && (
               <div className="border border-[#58180d] p-4 bg-white/50">
                 <h3 className="text-sm font-bold uppercase text-[#58180d] mb-3">选择你的道途 / 子职业</h3>
                 <div className="space-y-2">
                    {subclassOptions.map(sc => (
                      <div key={sc.name} 
                           className={`p-2 border cursor-pointer ${selectedSubclass === sc.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/30 bg-white'}`}
                           onClick={() => setSelectedSubclass(sc.name)}>
                         <div className="font-bold">{sc.name}</div>
                         <p className="text-xs mt-1 leading-tight">{sc.desc}</p>
                      </div>
                    ))}
                 </div>
               </div>
            )}

            {isAsiLevel && (
               <div className="space-y-4">
                 <div className="border border-[#58180d] p-4 bg-white/50">
                   <h3 className="text-sm font-bold uppercase text-[#58180d] mb-1">选项 A: 属性提升 (ASI)</h3>
                   <p className="text-xs text-[#58180d]/80 mb-3">分配 2 点属性。提升两项不同属性各 1 点，或一项提升 2 点。<br/>剩余待分配点数: <span className="font-bold text-lg text-[#58180d]">{2 - asiChoices.length}</span></p>
                   <div className="grid grid-cols-2 gap-2">
                     {(Object.keys(attrLabels) as AttributeName[]).map(attr => {
                        const count = asiChoices.filter(a => a === attr).length;
                        const stat = character.attrs[attr];
                        const currentScore = stat.base + stat.pointbuy + stat.racebonus + (stat.extrabonus || 0);
                        return (
                          <div key={attr} className="flex items-center justify-between border border-[#58180d]/30 p-2 bg-white">
                            <div>
                              <span className="font-bold text-sm uppercase">{attrLabels[attr]}</span>
                              <span className="text-xs ml-2">{currentScore}</span>
                            </div>
                            <div className="flex gap-1 items-center">
                              <button className="w-5 h-5 border border-[#58180d] bg-[#ede1c5] flex items-center justify-center font-bold disabled:opacity-50" onClick={() => handleAsiChange(attr, -1)} disabled={count === 0}>-</button>
                              <span className="w-4 text-center font-bold text-[#58180d]">+ {count}</span>
                              <button className="w-5 h-5 border border-[#58180d] text-white bg-[#58180d] flex items-center justify-center font-bold disabled:opacity-50" onClick={() => handleAsiChange(attr, 1)} disabled={asiChoices.length >= 2 || currentScore + count >= 20}>+</button>
                            </div>
                          </div>
                        )
                     })}
                   </div>
                 </div>

                 <div className="border border-[#58180d] p-4 bg-white/50">
                    <h3 className="text-sm font-bold uppercase text-[#58180d] mb-1">选项 B: 选择通用专长 (General Feat)</h3>
                    <p className="text-xs text-[#58180d]/80 mb-3">选择一个特殊的专长来强化你的角色。这会替代你的属性提升。</p>
                    <ScrollArea className="h-[200px] border border-[#58180d]/30 bg-white">
                      <div className="p-2 space-y-2">
                        {FEATS_DATA.filter(f => f.category === 'General' && f.checkPrereq(character)).map(f => (
                          <div key={f.name}
                               onClick={() => handleFeatSelect(f.name)}
                               className={`p-2 border text-xs cursor-pointer transition-colors ${selectedFeat === f.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/30 hover:border-[#58180d]'}`}>
                             <div className="font-bold uppercase tracking-tight">{f.name}</div>
                             <p className={`text-[10px] mt-1 ${selectedFeat === f.name ? 'text-white/70' : 'text-[#58180d]/60'}`}>{f.desc}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                 </div>
               </div>
            )}
            
            <div className="flex justify-end gap-3 mt-4 border-t-2 border-[#58180d] pt-4">
               <button className="px-4 py-2 border border-[#58180d] text-[#58180d] font-bold uppercase" onClick={() => { setShowLevelUp(false); setSelectedSubclass(''); setAsiChoices([]); setSelectedFeat(null); }}>取消</button>
               <button className="px-4 py-2 bg-[#58180d] text-white font-bold uppercase" onClick={handleLevelUpConfirm}>确认跃升</button>
            </div>
          </div>
        </div>
      )}
      {/* Spell Manager Modal */}
      {showSpellManager && (
        <div className="fixed inset-0 bg-[#2c1810]/80 flex items-center justify-center z-50 p-4 font-serif">
          <div className="bg-[#fdf6e3] border-4 border-[#58180d] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b-2 border-[#58180d] pb-2">
              <h2 className="text-2xl font-black uppercase text-[#58180d]">管理法术与法术书</h2>
              <button className="text-[#58180d] font-bold text-xl hover:opacity-70" onClick={() => setShowSpellManager(false)}>✕</button>
            </div>
            
            {/* Context Help */}
            <div className="bg-white/60 border border-[#58180d]/30 p-4 text-sm font-sans mb-2">
              {isPreparedCaster ? (
                <>
                  <p className="font-bold text-[#58180d] mb-1">施法准备 (Prepared Spellcaster)</p>
                  <p>作为{character.jobClass}，你需要在进行长休时准备你的法术。你可以准备 <strong className="text-red-800">{maxPrepared}</strong> 个法术。</p>
                  {character.jobClass === '法师' && <p className="mt-1 text-xs italic">法师需要首先将法术抄录（学习）到法术书中，然后只能从法术书中准备法术。</p>}
                </>
              ) : (
                <>
                  <p className="font-bold text-[#58180d] mb-1">已知施法 (Known Spellcaster)</p>
                  <p>作为{character.jobClass}，你掌握固定数量的法术，一经掌握即可随时通过消耗法术位来施展。</p>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
              {/* ALL SPELLS / AVAILABLE */}
              <div className="border border-[#58180d] bg-white flex flex-col">
                <div className="bg-[#58180d] text-white p-2 text-sm font-bold uppercase text-center tracking-wide">
                  {character.jobClass === '法师' ? "职业可用法术 (加入法术书)" : isPreparedCaster ? "职业可用法术 (全表可用)" : "职业可用法术 (请学习)"}
                </div>
                <div className="p-3 space-y-2 overflow-y-auto max-h-[400px] flex-1">
                   {availableSpells.map(spell => {
                     const isKnown = knownSpells.some(s => s.name_cn === spell.name_cn);
                     const isPrep = preparedSpells.includes(spell.name_cn);
                     return (
                       <div key={spell.name_cn} className="border border-[#58180d]/20 p-2 text-sm flex justify-between items-center bg-[#f4ecd8]/40 hover:bg-[#58180d]/10">
                          <div>
                            <span className="font-bold">{spell.name_cn}</span> <span className="text-[10px] text-[#58180d] italic">{spell.level}环</span>
                            <p className="text-[10px] text-[#58180d]/70 w-40 truncate">{spell.desc}</p>
                          </div>
                          <div>
                            {(!isPreparedCaster || character.jobClass === '法师') ? (
                              <Button size="sm" variant={isKnown ? "default" : "outline"} className={`h-6 text-[10px] rounded-none px-2 ${isKnown ? 'bg-[#58180d] text-white hover:bg-red-800' : 'border-[#58180d]'}`} onClick={() => handleToggleLearn(spell)}>
                                {isKnown ? '已学习/抄录' : '学习'}
                              </Button>
                            ) : (
                              <Button size="sm" variant={isPrep ? "default" : "outline"} className={`h-6 text-[10px] rounded-none px-2 ${isPrep ? 'bg-[#58180d] text-white hover:bg-red-800' : 'border-[#58180d]'}`} onClick={() => handleTogglePrepare(spell.name_cn)}>
                                {isPrep ? '已准备' : '准备'}
                              </Button>
                            )}
                          </div>
                       </div>
                     )
                   })}
                </div>
              </div>

              {/* MY SPELLBOOK / PREPARED */}
              <div className="border border-[#58180d] bg-[#f4ecd8] flex flex-col shadow-[2px_2px_0px_#58180d]">
                <div className="bg-[#ede1c5] border-b border-[#58180d] p-2 text-sm font-bold uppercase text-center tracking-wide text-[#58180d] flex justify-between px-4">
                  <span>我的配置</span>
                  {isPreparedCaster && <span>{preparedSpells.length} / {maxPrepared} 已准备</span>}
                </div>
                <div className="p-3 space-y-2 overflow-y-auto max-h-[400px] flex-1">
                  {(!isPreparedCaster || character.jobClass === '法师') && knownSpells.length === 0 && (
                     <div className="text-center text-xs text-[#58180d]/50 p-4">你还没有学习任何法术。</div>
                  )}
                  {isPreparedCaster && character.jobClass !== '法师' && preparedSpells.length === 0 && (
                     <div className="text-center text-xs text-[#58180d]/50 p-4">你还没有准备任何法术。</div>
                  )}
                  
                  {character.jobClass === '法师' ? (
                     knownSpells.map(spell => {
                        const isPrep = preparedSpells.includes(spell.name_cn);
                        return (
                          <div key={spell.name_cn} className="border border-[#58180d] p-2 text-sm flex justify-between items-center bg-white shadow-sm">
                            <div><span className="font-bold">{spell.name_cn}</span> <span className="text-[10px] text-[#58180d]">({spell.level}环)</span></div>
                            <Button size="sm" variant={isPrep ? "default" : "outline"} className={`h-6 text-[10px] rounded-none px-2 ${isPrep ? 'bg-emerald-700 hover:bg-red-800 text-white border-emerald-700' : 'border-[#58180d]'}`} onClick={() => handleTogglePrepare(spell.name_cn)}>
                              {isPrep ? '已准备' : '准备'}
                            </Button>
                          </div>
                        )
                     })
                  ) : !isPreparedCaster ? (
                     knownSpells.map(spell => (
                        <div key={spell.name_cn} className="border border-[#58180d] p-2 text-sm flex justify-between items-center bg-white shadow-sm">
                          <div className="font-bold">{spell.name_cn} <span className="text-[10px] font-normal text-[#58180d] italic">({spell.level}环)</span></div>
                          <span className="text-[10px] text-emerald-800 font-bold uppercase">随时可用</span>
                        </div>
                     ))
                  ) : (
                     <div className="space-y-2">
                       {/* Cleric / Druid Prepared */}
                       {preparedSpells.map(spellName => {
                         const spell = availableSpells.find(s => s.name_cn === spellName);
                         if (!spell) return null;
                         return (
                           <div key={spell.name_cn} className="border border-[#58180d] p-2 text-sm flex justify-between items-center bg-white shadow-sm">
                             <div className="font-bold">{spell.name_cn} <span className="text-[10px] font-normal text-[#58180d] italic">({spell.level}环)</span></div>
                             <Button size="sm" variant="default" className="bg-[#58180d] text-white hover:bg-red-800 h-6 text-[10px] rounded-none px-2" onClick={() => handleTogglePrepare(spell.name_cn)}>
                               卸下
                             </Button>
                           </div>
                         )
                       })}
                     </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-[#58180d]/30">
               <Button className="rounded-none bg-[#58180d] text-[#fdf6e3] hover:opacity-90 uppercase font-bold" onClick={() => setShowSpellManager(false)}>完成 / 返回</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
