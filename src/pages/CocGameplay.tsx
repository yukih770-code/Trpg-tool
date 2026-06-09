import { useState } from 'react';
import { useCocStore } from '../store/cocStore';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { evaluateCocD100Check } from '../lib/coc-utils';
import type { CocSkill } from '../lib/coc-types';
import type { RuntimeLogEntry, RuntimeLogKind } from '../lib/runtime-log-types';

type CocLogInput = {
  kind: RuntimeLogKind;
  title: string;
  summary: string;
  detail?: string;
  displayValue?: number | string;
  calculation?: string;
  outcome?: string;
  tags?: string[];
  payload?: unknown;
};

const COC_KIND_LABELS: Record<RuntimeLogKind, string> = {
  check: '检定 / CHECK',
  roll: '掷骰 / ROLL',
  action: '动作 / ACTION',
  damage: '伤害 / DAMAGE',
  resource: '资源 / RESOURCE',
  system: '系统 / SYSTEM',
  narration: '叙述 / NARRATION',
};

const COC_SUCCESS_LEVEL_LABELS: Record<string, string> = {
  critical: '大成功 / Critical',
  extreme: '极难成功 / Extreme',
  hard: '困难成功 / Hard',
  regular: '普通成功 / Regular',
  failure: '失败 / Failure',
  fumble: '大失败 / Fumble',
};

function createCocLogEntry(input: CocLogInput): RuntimeLogEntry {
  return {
    id: `coc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    system: 'coc',
    visibility: 'public',
    ...input,
    tags: ['coc', ...(input.tags ?? [])],
  };
}

function createCocSystemLogEntry(summary: string): RuntimeLogEntry {
  return createCocLogEntry({
    kind: 'system',
    title: '系统提示',
    summary,
    displayValue: 'READY',
    calculation: summary,
    outcome: '待命',
    tags: ['system'],
    payload: { system: 'coc', message: summary },
  });
}

function cocLogColor(entry: RuntimeLogEntry): string {
  const tags = entry.tags ?? [];
  const outcome = entry.outcome ?? '';

  if (tags.includes('fumble') || outcome.includes('大失败')) return 'text-red-400 font-bold';
  if (tags.includes('critical') || tags.includes('extreme')) return 'text-yellow-300 font-bold';
  if (outcome.includes('失败')) return 'text-red-300';
  if (outcome.includes('成功')) return 'text-green-300';
  if (entry.kind === 'resource') return 'text-[#9bd8b9]';
  if (entry.kind === 'system') return 'text-[#9bd8b9] italic';
  return 'text-[#d4d4d8]';
}

type CocSkillCheckPanelProps = {
  skills: CocSkill[];
  onRollSkill: (skill: CocSkill) => void;
};

function CocSkillCheckPanel({ skills, onRollSkill }: CocSkillCheckPanelProps) {
  const sortedSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="border border-[#059669]/30 bg-[#111] p-4">
      <div className="border-b border-[#059669]/30 pb-2 mb-3">
        <h3 className="text-[#059669] font-bold uppercase">技能检定 / Skill Checks</h3>
        <p className="mt-1 text-xs text-[#9bd8b9]">
          本轮仅执行公开技能检定；Luck spending / Pushed Roll / 成长结算后续实现。
        </p>
      </div>

      <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1 space-y-2">
        {sortedSkills.map(skill => {
          const half = Math.floor(skill.value / 2);
          const fifth = Math.floor(skill.value / 5);

          return (
            <div key={skill.name} className="border border-[#059669]/20 bg-black/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-bold text-[#d4d4d8] truncate" title={skill.name}>
                    {skill.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[#9bd8b9]">
                    <span>当前值 {skill.value}</span>
                    <span>困难 {half}</span>
                    <span>极难 {fifth}</span>
                    <span>基础 {skill.baseValue}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                    {skill.isOccupational && (
                      <span className="border border-[#34d399]/40 px-1.5 py-0.5 text-[#34d399]">本职</span>
                    )}
                    {skill.isPersonal && (
                      <span className="border border-[#a7f3d0]/40 px-1.5 py-0.5 text-[#a7f3d0]">兴趣</span>
                    )}
                    {!skill.isOccupational && !skill.isPersonal && (
                      <span className="border border-[#059669]/20 px-1.5 py-0.5 text-[#9bd8b9]">公开</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 rounded-none border-[#059669]/50 text-[#059669] hover:bg-[#059669] hover:text-[#111]"
                  onClick={() => onRollSkill(skill)}
                >
                  检定
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CocRollConsolePanelProps = {
  combatLog: RuntimeLogEntry[];
  diceTray: Record<string, number>;
  onAddDie: (die: string) => void;
  onClearDice: () => void;
  onRollDice: () => void;
};

function CocRollConsolePanel({
  combatLog,
  diceTray,
  onAddDie,
  onClearDice,
  onRollDice,
}: CocRollConsolePanelProps) {
  const latest = combatLog[0];
  const selectedDice = (Object.entries(diceTray) as [string, number][])
    .filter(([, count]) => count > 0)
    .map(([die, count]) => `${count}${die}`)
    .join(' + ');

  return (
    <div className="border border-[#059669]/30 bg-[#111] p-4 flex flex-col min-h-[420px]">
      <h3 className="text-[#059669] font-bold uppercase mb-3 border-b border-[#059669]/30 pb-1">
        掷骰日志 / Roll Console
      </h3>

      <div className="mb-3 border border-[#059669]/50 bg-[#059669]/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#9bd8b9] mb-1">
              最新结果 / Latest Result
            </div>
            <div className="text-sm font-bold text-[#d4d4d8]">{latest?.title ?? '暂无结果'}</div>
            <div className="text-[11px] text-[#9bd8b9]">{latest ? COC_KIND_LABELS[latest.kind] : '等待检定或掷骰'}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black font-mono leading-none text-[#059669]">
              {latest?.displayValue ?? '--'}
            </div>
            {latest?.outcome && (
              <div className="mt-1 text-[11px] font-bold text-[#d4d4d8]">{latest.outcome}</div>
            )}
          </div>
        </div>
        {(latest?.calculation || latest?.detail || latest?.summary) && (
          <div className="mt-2 text-xs text-[#d4d4d8] leading-relaxed">
            {latest.calculation ?? latest.detail ?? latest.summary}
          </div>
        )}
        {latest?.tags && latest.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {latest.tags.slice(0, 5).map(tag => (
              <span key={tag} className="border border-[#059669]/30 bg-black/30 px-1.5 py-0.5 text-[10px] text-[#9bd8b9]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 font-mono text-xs overflow-y-auto custom-scrollbar mb-4 bg-black/40 p-2 border border-[#059669]/10">
        {combatLog.map(entry => (
          <div key={entry.id} className={`border-b border-[#059669]/10 py-2 last:border-0 ${cocLogColor(entry)}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{entry.title}</span>
              <span className="text-[10px] text-[#9bd8b9]">{COC_KIND_LABELS[entry.kind]}</span>
            </div>
            <div className="mt-1 text-[#d4d4d8]">{entry.summary}</div>
            {(entry.calculation || entry.detail) && (
              <div className="mt-1 text-[11px] text-[#9bd8b9]">{entry.calculation ?? entry.detail}</div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-2 border-t border-[#059669]/30">
        <div className="flex justify-between items-center mb-2 gap-2">
          <div className="text-[10px] uppercase font-bold text-[#9bd8b9]">
            选取投掷骰: {selectedDice || '—'}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-[#059669]/50 text-[#059669]" onClick={onClearDice}>清空</Button>
            <Button size="sm" className="h-6 px-3 text-[10px] rounded-none bg-[#059669] text-[#111] hover:bg-[#059669]/80 font-bold" onClick={onRollDice} disabled={Object.values(diceTray).every(count => count === 0)}>R O L L</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(die => (
            <button
              key={die}
              className="w-10 h-10 border-2 border-[#059669] bg-[#1a1a1a] text-[#059669] font-bold text-xs hover:bg-[#059669] hover:text-[#111] transition-colors relative"
              onClick={() => onAddDie(die)}
            >
              {die}
              {diceTray[die] > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-800 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] leading-none shadow-md">{diceTray[die]}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
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
  const [combatLog, setCombatLog] = useState<RuntimeLogEntry[]>([
    createCocSystemLogEntry('克苏鲁的呼唤游玩面板已就绪。'),
  ]);

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
    const signedDelta = `${delta > 0 ? '+' : ''}${delta}`;
    setCombatLog(prev => [
      createCocLogEntry({
        kind: 'resource',
        title: `${label} 手动调整`,
        summary: `${label} ${signedDelta}`,
        displayValue: signedDelta,
        calculation: `${label} ${signedDelta}`,
        outcome: '已手动调整',
        tags: ['resource', label.toLowerCase()],
        payload: { system: 'coc', resource: label.toLowerCase(), delta },
      }),
      ...prev,
    ].slice(0, 20));
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

    const hasD100 = 'd100' in diceTray && diceTray['d100'] > 0;
    const formula = details.join(' + ');
    const msg = `掷出 ${formula}，总和: ${total}`;
    setCombatLog(prev => [
      createCocLogEntry({
        kind: 'roll',
        title: '自由掷骰',
        summary: `总计 ${total}`,
        detail: msg,
        displayValue: total,
        calculation: `${formula} = ${total}`,
        outcome: hasD100 && total === 100 ? '大失败 / Fumble' : '已掷骰',
        tags: ['roll', hasD100 ? 'd100' : 'freeRoll', ...(hasD100 && total === 100 ? ['fumble'] : [])],
        payload: {
          system: 'coc',
          rollType: hasD100 ? 'd100' : 'free',
          total,
          formula,
          diceTray: { ...diceTray },
        },
      }),
      ...prev,
    ].slice(0, 20));
    toast.success(`掷出骰子`, { description: msg });
    setDiceTray({});
  };

  const handleSkillCheck = (skill: CocSkill) => {
    const roll = Math.floor(Math.random() * 100) + 1;
    const result = evaluateCocD100Check(skill.value, roll);
    const half = Math.floor(skill.value / 2);
    const fifth = Math.floor(skill.value / 5);
    const outcome = COC_SUCCESS_LEVEL_LABELS[result.successLevel] ?? result.successLevel;
    const tags = [
      'skill',
      result.successLevel,
      ...(skill.isOccupational ? ['occupation'] : []),
      ...(skill.isPersonal ? ['interest'] : []),
      ...(result.isCritical ? ['critical'] : []),
      ...(result.isFumble ? ['fumble'] : []),
    ];

    const msg = `${skill.name}: 1d100=${roll} / 目标=${skill.value}，${outcome}`;
    setCombatLog(prev => [
      createCocLogEntry({
        kind: 'check',
        title: `技能检定：${skill.name}`,
        summary: `${roll} / ${skill.value}，${outcome}`,
        detail: `普通成功阈值 ${skill.value}，困难 ${half}，极难 ${fifth}`,
        displayValue: roll,
        calculation: `1d100=${roll}；目标值 ${skill.value}；困难 ${half}；极难 ${fifth}`,
        outcome,
        tags,
        payload: {
          system: 'coc',
          rollType: 'd100',
          checkType: 'skill',
          skillName: skill.name,
          d100: roll,
          target: skill.value,
          half,
          fifth,
          success: result.isSuccess,
          successLevel: result.successLevel,
          isCritical: result.isCritical,
          isFumble: result.isFumble,
        },
      }),
      ...prev,
    ].slice(0, 20));
    toast(result.isSuccess ? '技能检定成功' : '技能检定失败', { description: msg });
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
                  onClick={() => {
                    initializeRuntime();
                    setCombatLog(prev => [
                      createCocLogEntry({
                        kind: 'system',
                        title: '初始化运行时状态',
                        summary: '已初始化运行时状态',
                        displayValue: 'OK',
                        calculation: '初始化 HP / MP / SAN / Luck runtime state',
                        outcome: '已初始化',
                        tags: ['system', 'runtime'],
                        payload: { system: 'coc', action: 'initializeRuntime' },
                      }),
                      ...prev,
                    ].slice(0, 20));
                  }}
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
                      onClick={() => {
                        const nextValue = !active;
                        setCocFlag(flag.key, nextValue);
                        setCombatLog(prev => [
                          createCocLogEntry({
                            kind: 'resource',
                            title: `状态标记：${flag.label}`,
                            summary: nextValue ? '已标记' : '已取消',
                            displayValue: nextValue ? 'ON' : 'OFF',
                            calculation: `${flag.label} / ${flag.english}: ${nextValue ? 'ON' : 'OFF'}`,
                            outcome: nextValue ? '已标记' : '已取消',
                            tags: ['flag', flag.key, nextValue ? 'on' : 'off'],
                            payload: { system: 'coc', flag: flag.key, value: nextValue },
                          }),
                          ...prev,
                        ].slice(0, 20));
                      }}
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
                    const val = runtimePools.san.current;
                    // Use evaluateCocD100Check so fumble/critical rules are consistent with CocSheet
                    const checkResult = evaluateCocD100Check(val, roll);
                    const success = checkResult.isSuccess;
                    const outcome = success ? '成功' : '失败（请手动扣除理智）';
                    const msg = `理智 (SAN) 检定: 1d100 掷出 ${roll} / ${val}。结果: ${outcome}！`;
                    setCombatLog(prev => [
                      createCocLogEntry({
                        kind: 'check',
                        title: '理智检定 / SAN Check',
                        summary: `1d100=${roll} / 目标=${val}，${outcome}`,
                        detail: msg,
                        displayValue: roll,
                        calculation: `1d100=${roll}，目标=${val}，等级=${COC_SUCCESS_LEVEL_LABELS[checkResult.successLevel] ?? checkResult.successLevel}`,
                        outcome,
                        tags: [
                          'check',
                          'san',
                          checkResult.successLevel,
                          ...(checkResult.isCritical ? ['critical'] : []),
                          ...(checkResult.isFumble ? ['fumble'] : []),
                        ],
                        payload: {
                          system: 'coc',
                          rollType: 'd100',
                          d100: roll,
                          target: val,
                          success,
                          successLevel: checkResult.successLevel,
                          label: 'SAN',
                        },
                      }),
                      ...prev,
                    ].slice(0, 20));
                    toast(success ? '理智检定成功' : '理智检定失败', { description: msg });
                 }}>
                   理智检定 (Sanity Check)
                 </Button>
               </div>
            </div>
          </div>

          <CocSkillCheckPanel
            skills={character.skills}
            onRollSkill={handleSkillCheck}
          />
        </div>

        <CocRollConsolePanel
          combatLog={combatLog}
          diceTray={diceTray}
          onAddDie={handleAddDie}
          onClearDice={handleClearDice}
          onRollDice={handleRollDice}
        />
      </div>
    </div>
  );
}
