import { useState } from 'react';
import { useCocStore } from '../store/cocStore';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { evaluateCocD100Check } from '../lib/coc-utils';

function cocLogColor(line: string): string {
  if (line.includes('极难成功')) return 'text-yellow-300 font-bold';
  if (line.includes('困难成功')) return 'text-green-300 font-bold';
  if (line.includes('成功') && !line.includes('失败')) return 'text-green-400';
  if (line.includes('大失败')) return 'text-red-500 font-bold';
  if (line.includes('失败')) return 'text-red-400';
  if (line.includes('理智') && line.includes('失去')) return 'text-purple-400';
  if (line.includes('[系统]')) return 'text-[#d4d4d8]/40 italic';
  return 'text-[#d4d4d8]';
}

export function CocGameplay() {
  const { character, updateField } = useCocStore();
  const [diceTray, setDiceTray] = useState<Record<string, number>>({});
  const [combatLog, setCombatLog] = useState<string[]>(['[系统] 克苏鲁的呼唤游玩面板已就绪。']);
  const [lastRoll, setLastRoll] = useState<{ total: number; formula: string; type: 'extreme'|'hard'|'success'|'fail'|'fumble'|'neutral' } | null>(null);

  const handleAddDie = (die: string) => {
    setDiceTray(prev => ({ ...prev, [die]: (prev[die] || 0) + 1 }));
  };

  const handleClearDice = () => {
    setDiceTray({});
  };

  const handleChangeHP = (amt: number) => {
    const newHP = Math.max(0, Math.min(character.hp.max, character.hp.current + amt));
    updateField('hp', { ...character.hp, current: newHP });
    let msg = '';
    if (amt > 0) msg = `恢复了 ${amt} 点体数 (HP)。当前 HP: ${newHP}/${character.hp.max}`;
    else msg = `受到了 ${Math.abs(amt)} 点伤害。当前 HP: ${newHP}/${character.hp.max}`;
    
    setCombatLog(prev => [msg, ...prev].slice(0, 20));
    if (newHP <= 0) {
      toast.error('意识模糊或者面临死亡...', { description: '你的HP已归零。请根据规则判定是否重伤死亡。' });
    }
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
    // d100 CoC thresholds
    const hasD100 = 'd100' in diceTray && diceTray['d100'] > 0;
    const rollType = hasD100 && total === 100 ? 'fumble' : 'neutral';
    setLastRoll({ total, formula: details.join(' + '), type: rollType });
    setDiceTray({});
  };

  return (
    <div className="space-y-6 text-[#d4d4d8] font-serif">
      <div className="flex justify-between items-center border-b border-[#059669]/50 pb-2">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#059669]">游玩面板 (Gameplay)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="border border-[#059669]/30 bg-[#111] p-4">
            <h3 className="text-[#059669] font-bold uppercase mb-2 border-b border-[#059669]/30 pb-1">状态管理</h3>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <div className="text-xs opacity-70 mb-1">体数 (HP) 操作</div>
                 <div className="flex gap-1">
                   <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-red-900" onClick={() => handleChangeHP(-1)}>-1</Button>
                   <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-red-900" onClick={() => handleChangeHP(-5)}>-5</Button>
                   <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-[#059669] hover:text-[#111]" onClick={() => handleChangeHP(1)}>+1</Button>
                 </div>
               </div>
               <div>
                 <div className="text-xs opacity-70 mb-1">理智 (SAN) 操作</div>
                 <div className="flex gap-1">
                   <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-[#58180d]" onClick={() => {
                     const newSan = Math.max(0, character.sanity.current - 1);
                     updateField('sanity', { ...character.sanity, current: newSan });
                     setCombatLog(prev => [`失去了 1 点理智 (SAN)。当前 SAN: ${newSan}`, ...prev].slice(0, 20));
                   }}>-1</Button>
                   <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-[#58180d]" onClick={() => {
                     const newSan = Math.max(0, character.sanity.current - 10);
                     updateField('sanity', { ...character.sanity, current: newSan });
                     setCombatLog(prev => [`失去了 10 点理智 (SAN)!! 可能触发疯狂。当前 SAN: ${newSan}`, ...prev].slice(0, 20));
                   }}>-10</Button>
                   <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-[#059669] hover:text-[#111]" onClick={() => {
                     const newSan = Math.min(character.sanity.max, character.sanity.current + 1);
                     updateField('sanity', { ...character.sanity, current: newSan });
                     setCombatLog(prev => [`恢复了 1 点理智 (SAN)。当前 SAN: ${newSan}`, ...prev].slice(0, 20));
                   }}>+1</Button>
                 </div>
               </div>
               <div>
                 <div className="text-xs opacity-70 mb-1">魔法 (MP) 操作</div>
                 <div className="flex gap-1">
                   <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-red-900" onClick={() => {
                     const newMp = Math.max(0, character.mp.current - 1);
                     updateField('mp', { ...character.mp, current: newMp });
                     setCombatLog(prev => [`消耗了 1 点魔法 (MP)。当前 MP: ${newMp}`, ...prev].slice(0, 20));
                   }}>-1</Button>
                   <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-[#059669] hover:text-[#111]" onClick={() => {
                     const newMp = Math.min(character.mp.max, character.mp.current + 1);
                     updateField('mp', { ...character.mp, current: newMp });
                     setCombatLog(prev => [`恢复了 1 点魔法 (MP)。当前 MP: ${newMp}`, ...prev].slice(0, 20));
                   }}>+1</Button>
                 </div>
               </div>
            </div>
            
            <div className="mt-8 border-t border-[#059669]/30 pt-4">
               <h3 className="text-[#059669] font-bold uppercase mb-2">常用检定 (Quick Rolls)</h3>
               <div className="flex flex-wrap gap-2">
                 <Button size="sm" variant="outline" className="text-xs h-8 rounded-none border-[#059669] text-[#059669] hover:bg-[#059669] hover:text-[#111]" onClick={() => {
                    const roll = Math.floor(Math.random() * 100) + 1;
                    const val = character.sanity.current;
                    // Use evaluateCocD100Check so fumble/critical rules are consistent with CocSheet
                    const checkResult = evaluateCocD100Check(val, roll);
                    const success = checkResult.isSuccess;
                    const msg = `理智 (SAN) 检定: 1d100 掷出 ${roll} / ${val}。结果: ${success ? '成功' : '失败 (扣除理智)'}！`;
                    setCombatLog(prev => [msg, ...prev].slice(0, 20));
                    toast(success ? '理智检定成功' : '理智检定失败', { description: msg });
                 }}>
                   理智检定 (Sanity Check)
                 </Button>
               </div>
            </div>
          </div>
        </div>

        <div className="border border-[#059669]/30 bg-[#111] p-4 flex flex-col min-h-[300px]">
          <h3 className="text-[#059669] font-bold uppercase mb-2 border-b border-[#059669]/30 pb-1">日志 & 自由掷骰 (Dice Tray)</h3>
          
          <div className="flex-1 font-mono text-xs overflow-hidden custom-scrollbar max-h-[200px] overflow-y-auto mb-4 bg-black/40 p-2 border border-[#059669]/10">
             {combatLog.map((log, i) => (
               <div key={i} className={`border-b border-[#059669]/10 py-1 last:border-0 ${cocLogColor(log)}`}>{log}</div>
             ))}
          </div>
          
          {/* Last Roll Result — prominent display */}
          {lastRoll && (
            <div className={`mb-3 border-2 p-3 text-center
              ${lastRoll.type === 'fumble' ? 'border-red-500 bg-red-900/20' :
                lastRoll.type === 'extreme' ? 'border-yellow-400 bg-yellow-900/20' :
                'border-[#059669]/60 bg-[#059669]/10'}`}>
              <div className="text-[10px] uppercase font-bold text-[#059669] tracking-widest mb-1">
                {lastRoll.type === 'fumble' ? '💀 大失败 (100)！' : '🎲 掷骰结果'}
              </div>
              <div className={`text-5xl font-black font-mono leading-none mb-1
                ${lastRoll.type === 'fumble' ? 'text-red-500' :
                  lastRoll.type === 'extreme' ? 'text-yellow-400' : 'text-[#059669]'}`}>
                {lastRoll.total}
              </div>
              <div className="text-[10px] text-[#059669]/50 font-mono">{lastRoll.formula}</div>
            </div>
          )}

          <div className="mt-auto pt-2 border-t border-[#059669]/30">
             <div className="flex justify-between items-center mb-2">
               <div className="text-[10px] uppercase font-bold text-[#059669]">选取投掷骰: {(Object.entries(diceTray) as [string, number][]).filter(([_, c]) => c > 0).map(([d, c]) => `${c}${d}`).join(' + ') || '—'}</div>
               <div className="flex gap-1">
                 <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-[#059669]/50 text-[#059669]" onClick={handleClearDice}>清空</Button>
                 <Button size="sm" className="h-6 px-3 text-[10px] rounded-none bg-[#059669] text-[#111] hover:bg-[#059669]/80 font-bold" onClick={handleRollDice} disabled={Object.values(diceTray).every(c => c === 0)}>R O L L</Button>
               </div>
             </div>
             <div className="flex flex-wrap gap-2">
               {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(die => (
                 <button key={die}
                   className="w-10 h-10 border-2 border-[#059669] bg-[#1a1a1a] text-[#059669] font-bold text-xs hover:bg-[#059669] hover:text-[#111] transition-colors relative"
                   onClick={() => handleAddDie(die)}>
                   {die}
                   {diceTray[die] > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-800 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] leading-none shadow-md">{diceTray[die]}</span>}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
