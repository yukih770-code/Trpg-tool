import { useState } from 'react';
import { toast } from 'sonner';
import { useCocStore } from '../store/cocStore';
import { evaluateCocD100Check } from '../lib/coc-utils';
import type { CocRuntimeState, CocSkill } from '../lib/coc-types';
import type { RuntimeLogEntry } from '../lib/runtime-log-types';
import { CocChecksPanel } from './cocGameplay/CocChecksPanel';
import { CocRollConsolePanel } from './cocGameplay/CocRollConsolePanel';
import { CocRuntimeStatePanel } from './cocGameplay/CocRuntimeStatePanel';
import {
  COC_SUCCESS_LEVEL_LABELS,
  createCocLogEntry,
  createCocSystemLogEntry,
} from './cocGameplay/CocGameplayShared';

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
  const runtimeFlags: CocRuntimeState['flags'] = runtime?.flags ?? {
    isMajorWound: false,
    isDying: false,
    isUnconscious: false,
    isTemporarilyInsane: false,
    isIndefinitelyInsane: false,
  };

  const pushLog = (entry: RuntimeLogEntry) => {
    setCombatLog(prev => [entry, ...prev].slice(0, 20));
  };

  const handleRuntimeDelta = (
    label: string,
    delta: number,
    action: (delta: number) => void,
  ) => {
    action(delta);
    const signedDelta = `${delta > 0 ? '+' : ''}${delta}`;
    pushLog(createCocLogEntry({
      kind: 'resource',
      title: `${label} 手动调整`,
      summary: `${label} ${signedDelta}`,
      displayValue: signedDelta,
      calculation: `${label} ${signedDelta}`,
      outcome: '已手动调整',
      tags: ['resource', label.toLowerCase()],
      payload: { system: 'coc', resource: label.toLowerCase(), delta },
    }));
  };

  const handleInitializeRuntime = () => {
    initializeRuntime();
    pushLog(createCocLogEntry({
      kind: 'system',
      title: '初始化运行时状态',
      summary: '已初始化运行时状态',
      displayValue: 'OK',
      calculation: '初始化 HP / MP / SAN / Luck runtime state',
      outcome: '已初始化',
      tags: ['system', 'runtime'],
      payload: { system: 'coc', action: 'initializeRuntime' },
    }));
  };

  const handleToggleFlag = (
    flag: { key: keyof CocRuntimeState['flags']; label: string; english: string },
    active: boolean,
  ) => {
    const nextValue = !active;
    setCocFlag(flag.key, nextValue);
    pushLog(createCocLogEntry({
      kind: 'resource',
      title: `状态标记：${flag.label}`,
      summary: nextValue ? '已标记' : '已取消',
      displayValue: nextValue ? 'ON' : 'OFF',
      calculation: `${flag.label} / ${flag.english}: ${nextValue ? 'ON' : 'OFF'}`,
      outcome: nextValue ? '已标记' : '已取消',
      tags: ['flag', flag.key, nextValue ? 'on' : 'off'],
      payload: { system: 'coc', flag: flag.key, value: nextValue },
    }));
  };

  const handleAddDie = (die: string) => {
    setDiceTray(prev => ({ ...prev, [die]: (prev[die] || 0) + 1 }));
  };

  const handleClearDice = () => {
    setDiceTray({});
  };

  const handleRollDice = () => {
    let total = 0;
    const details: string[] = [];
    for (const [die, count] of (Object.entries(diceTray) as [string, number][])) {
      if (count > 0) {
        const sides = parseInt(die.substring(1), 10);
        const individualRolls: number[] = [];
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
    pushLog(createCocLogEntry({
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
    }));
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
    pushLog(createCocLogEntry({
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
    }));
    toast(result.isSuccess ? '技能检定成功' : '技能检定失败', { description: msg });
  };

  const handleSanQuickRoll = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    const val = runtimePools.san.current;
    // Use evaluateCocD100Check so fumble/critical rules are consistent with CocSheet.
    const checkResult = evaluateCocD100Check(val, roll);
    const success = checkResult.isSuccess;
    const outcome = success ? '成功' : '失败（请手动扣除理智）';
    const msg = `理智 (SAN) 检定: 1d100 掷出 ${roll} / ${val}。结果: ${outcome}！`;
    pushLog(createCocLogEntry({
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
    }));
    toast(success ? '理智检定成功' : '理智检定失败', { description: msg });
  };

  return (
    <div className="space-y-6 text-[#d4d4d8] font-serif">
      <div className="flex justify-between items-center border-b border-[#2f7f68]/45 pb-2">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-[#8fb7aa]">游玩面板 <span className="text-sm tracking-widest text-[#8fb7aa]/65 ml-2">GAMEPLAY</span></h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <CocRuntimeStatePanel
            hasRuntime={Boolean(runtime)}
            runtimePools={runtimePools}
            runtimeFlags={runtimeFlags}
            luckMax={luckMax}
            onInitializeRuntime={handleInitializeRuntime}
            onRuntimeDelta={handleRuntimeDelta}
            changeHp={changeHp}
            changeMp={changeMp}
            changeSan={changeSan}
            changeLuck={changeLuck}
            onToggleFlag={handleToggleFlag}
            onSanQuickRoll={handleSanQuickRoll}
          />

          <CocChecksPanel
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
