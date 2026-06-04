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
  const {
    character,
    initializeRuntime,
    changeHp,
    changeMp,
    changeSan,
    changeLuck,
    setCocFlag,
  } = useCocStore();
  const [diceTray, setDiceTray] = useState<Record<string, number>>({});
  const [combatLog, setCombatLog] = useState<string[]>(['[系统] 克苏鲁的呼唤游玩面板已就绪。']);
  const [lastRoll, setLastRoll] = useState<{ total: number; formula: string; type: 'extreme'|'hard'|'success'|'fail'|'fumble'|'neutral' } | null>(null);

  const runtime = character.runtime;
  const runtimePools = {
    hp: runtime?.hp ?? character.hp,
    mp: runtime?.mp ?? character.mp,
    san: runtime?.san ?? {
      current: character.sanity.current,
      max: character.sanity.max,
      initial: character.sanity.start,
    },
    luck: runtime?.luck ?? {
      current: character.luck.current,
    },
  };
  const luckMax = 99;
  const runtimeFlags = runtime?.flags ?? {
    isMajorWound: false,
    isDying: false,
    isUnconscious: false,
    isTemporarilyInsane: false,
    isIndefinitelyInsane: false,
  };

  const flagItems = [
    { key: 'isMajorWound', label: '重伤', english: 'Major Wound' },
    { key: 'isDying', label: '濒死', english: 'Dying' },
    { key: 'isUnconscious', label: '昏迷', english: 'Unconscious' },
    { key: 'isTemporarilyInsane', label: '临时疯狂', english: 'Temporary Insanity' },
    { key: 'isIndefinitelyInsane', label: '不定疯狂', english: 'Indefinite Insanity' },
  ] as const;

  const handleRuntimeDelta = (
    label: string,
    delta: number,
    action: (delta: number) => void,
  ) => {
    action(delta);
    setCombatLog(prev => [`[状态] ${label} ${delta > 0 ? '+' : ''}${delta}`, ...prev].slice(0, 20));
  };

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
            <div className="flex items-center justify-between gap-3 border-b border-[#059669]/30 pb-1 mb-3">
              <h3 className="text-[#059669] font-bold uppercase">运行时状态 / Runtime State</h3>
              {!runtime && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 border-[#059669]/50 rounded-none text-[#059669] hover:bg-[#059669] hover:text-[#111]"
                  onClick={initializeRuntime}
                >
                  初始化运行时状态
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: '体数 / HP', value: `${runtimePools.hp.current}/${runtimePools.hp.max}`, onMinus: () => handleRuntimeDelta('HP', -1, changeHp), onPlus: () => handleRuntimeDelta('HP', 1, changeHp) },
                { label: '魔法 / MP', value: `${runtimePools.mp.current}/${runtimePools.mp.max}`, onMinus: () => handleRuntimeDelta('MP', -1, changeMp), onPlus: () => handleRuntimeDelta('MP', 1, changeMp) },
                { label: '理智 / SAN', value: `${runtimePools.san.current}/${runtimePools.san.max}`, onMinus: () => handleRuntimeDelta('SAN', -1, changeSan), onPlus: () => handleRuntimeDelta('SAN', 1, changeSan) },
                { label: '幸运 / Luck', value: `${runtimePools.luck.current}/${luckMax}`, onMinus: () => handleRuntimeDelta('Luck', -1, changeLuck), onPlus: () => handleRuntimeDelta('Luck', 1, changeLuck) },
              ].map(item => (
                <div key={item.label} className="border border-[#059669]/20 bg-black/30 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-[#9bd8b9] mb-1">{item.label}</div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-bold text-[#d4d4d8] font-mono">{item.value}</div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-red-900" onClick={item.onMinus}>-1</Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 border-[#059669]/50 rounded-none text-[#d4d4d8] hover:bg-[#059669] hover:text-[#111]" onClick={item.onPlus}>+1</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border border-[#059669]/20 bg-black/20 p-3">
              <div className="text-[10px] uppercase tracking-widest text-[#9bd8b9] mb-2">状态标记 / Runtime Flags</div>
              <div className="flex flex-wrap gap-2">
                {flagItems.map(flag => {
                  const active = runtimeFlags[flag.key];
                  return (
                    <button
                      key={flag.key}
                      type="button"
                      className={`border px-2 py-1 text-[11px] transition-colors ${
                        active
                          ? 'border-red-500/70 bg-red-950/50 text-red-200'
                          : 'border-[#059669]/30 bg-[#111] text-[#9bd8b9]'
                      }`}
                      onClick={() => setCocFlag(flag.key, !active)}
                    >
                      {flag.label} / {flag.english}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-[10px] text-[#9bd8b9]">
                标记仅供手动维护；本轮不执行疯狂表、INT 检定或 Keeper 流程。
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
                    const msg = `理智 (SAN) 检定: 1d100 掷出 ${roll} / ${val}。结果: ${success ? '成功' : '失败（请手动扣除理智）'}！`;
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
