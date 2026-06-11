import { useState } from 'react';
import { toast } from 'sonner';
import { useCocStore } from '../store/cocStore';
import { evaluateCocD100Check } from '../lib/coc-utils';
import type { CocRuntimeState, CocSkill } from '../lib/coc-types';
import type { RuntimeLogEntry } from '../lib/runtime-log-types';
import { CocChecksPanel } from './cocGameplay/CocChecksPanel';
import { CocRollConsolePanel } from './cocGameplay/CocRollConsolePanel';
import { CocRuntimeStatePanel } from './cocGameplay/CocRuntimeStatePanel';
import { CocSanCheckPanel } from './cocGameplay/CocSanCheckPanel';
import {
  COC_SUCCESS_LEVEL_LABELS,
  createCocLogEntry,
  createCocSystemLogEntry,
} from './cocGameplay/CocGameplayShared';
import { rollCocGameplaySanLoss } from './cocGameplay/cocSanUtils';

type PendingLuckSpend = {
  sourceEntryId: string;
  skillName: string;
  roll: number;
  skillValue: number;
  neededLuck: number;
};

type PendingPushedRoll = {
  sourceEntryId: string;
  skillName: string;
  skillValue: number;
  originalRoll: number;
};

type PendingGrowthMark = {
  sourceEntryId: string;
  skillName: string;
  skillValue: number;
};

export function CocGameplay() {
  const {
    character,
    updateSkill,
    initializeRuntime,
    changeHp,
    changeMp,
    changeSan,
    changeLuck,
    setCocFlag,
    toggleSkillGrowthMark,
  } = useCocStore();
  const [diceTray, setDiceTray] = useState<Record<string, number>>({});
  const [combatLog, setCombatLog] = useState<RuntimeLogEntry[]>([
    createCocSystemLogEntry('克苏鲁的呼唤游玩面板已就绪。'),
  ]);
  const [pendingLuckSpend, setPendingLuckSpend] = useState<PendingLuckSpend | null>(null);
  const [pendingPushedRoll, setPendingPushedRoll] = useState<PendingPushedRoll | null>(null);
  const [pendingGrowthMark, setPendingGrowthMark] = useState<PendingGrowthMark | null>(null);

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
  const skillGrowthMarks = runtime?.skillGrowthMarks ?? {};

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
    const entry = createCocLogEntry({
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
    });
    pushLog(entry);
    if (!result.isSuccess && !result.isFumble && roll > skill.value) {
      setPendingLuckSpend({
        sourceEntryId: entry.id,
        skillName: skill.name,
        roll,
        skillValue: skill.value,
        neededLuck: roll - skill.value,
      });
      setPendingPushedRoll({
        sourceEntryId: entry.id,
        skillName: skill.name,
        skillValue: skill.value,
        originalRoll: roll,
      });
      setPendingGrowthMark(null);
    } else {
      setPendingLuckSpend(null);
      setPendingPushedRoll(null);
      setPendingGrowthMark(result.isSuccess ? {
        sourceEntryId: entry.id,
        skillName: skill.name,
        skillValue: skill.value,
      } : null);
    }
    toast(result.isSuccess ? '技能检定成功' : '技能检定失败', { description: msg });
  };

  const handleMarkSkillGrowth = () => {
    if (!pendingGrowthMark) return;

    const alreadyMarked = Boolean(skillGrowthMarks[pendingGrowthMark.skillName]);
    if (!alreadyMarked) {
      toggleSkillGrowthMark(pendingGrowthMark.skillName);
    }

    pushLog(createCocLogEntry({
      kind: 'system',
      title: `成长标记：${pendingGrowthMark.skillName}`,
      summary: alreadyMarked ? '该技能已经标记成长' : '已标记成长检查',
      displayValue: alreadyMarked ? 'MARKED' : 'MARK',
      calculation: `${pendingGrowthMark.skillName} successful check -> growth mark`,
      outcome: alreadyMarked ? '已存在' : '已标记',
      tags: ['growth', 'growth-mark', alreadyMarked ? 'already-marked' : 'marked'],
      payload: {
        system: 'coc',
        sourceEntryId: pendingGrowthMark.sourceEntryId,
        skillName: pendingGrowthMark.skillName,
        skillValue: pendingGrowthMark.skillValue,
        marked: true,
        alreadyMarked,
      },
    }));
    toast(alreadyMarked ? '成长标记已存在' : '已标记成长检查', {
      description: pendingGrowthMark.skillName,
    });
    setPendingGrowthMark(null);
  };

  const handleClearGrowthMark = (skillName: string) => {
    if (!skillGrowthMarks[skillName]) return;

    toggleSkillGrowthMark(skillName);
    pushLog(createCocLogEntry({
      kind: 'system',
      title: `清除成长标记：${skillName}`,
      summary: '已清除成长标记',
      displayValue: 'CLEAR',
      calculation: `${skillName} growth mark cleared manually`,
      outcome: '已清除',
      tags: ['growth', 'growth-mark', 'cleared'],
      payload: {
        system: 'coc',
        skillName,
        marked: false,
      },
    }));
    toast('已清除成长标记', { description: skillName });
  };

  // AI-LANDMARK: COC_GROWTH_CHECK_RESOLUTION
  const handleGrowthCheck = (skill: CocSkill) => {
    const roll = Math.floor(Math.random() * 100) + 1;
    const shouldImprove = roll > skill.value;
    const increaseRoll = shouldImprove ? Math.floor(Math.random() * 10) + 1 : 0;
    const previousValue = skill.value;
    const rawNewValue = previousValue + increaseRoll;
    const cap = 99;
    const capped = rawNewValue > cap;
    const newValue = shouldImprove ? Math.min(cap, rawNewValue) : previousValue;

    if (shouldImprove) {
      updateSkill(skill.name, newValue);
    }
    if (skillGrowthMarks[skill.name]) {
      toggleSkillGrowthMark(skill.name);
    }
    if (pendingGrowthMark?.skillName === skill.name) {
      setPendingGrowthMark(null);
    }

    pushLog(createCocLogEntry({
      kind: 'check',
      title: `成长检定：${skill.name}`,
      summary: shouldImprove
        ? `技能成长 +${increaseRoll}：${previousValue} → ${newValue}${capped ? `（已达上限，原始结果 ${rawNewValue}）` : ''}`
        : `${roll} <= ${previousValue}，未成长`,
      detail: shouldImprove
        ? `成长检定成功，${skill.name} 从 ${previousValue} 提升到 ${newValue}${capped ? `；99 上限已生效，原始结果 ${rawNewValue}。` : '。'}`
        : `成长检定未通过，${skill.name} 保持 ${previousValue}。`,
      displayValue: roll,
      calculation: shouldImprove
        ? `1d100=${roll} > ${previousValue}; 1d10=${increaseRoll}; raw ${previousValue}+${increaseRoll}=${rawNewValue}; cap 99 -> ${newValue}`
        : `1d100=${roll} <= ${previousValue}; no improvement`,
      outcome: shouldImprove ? '成长成功' : '未成长',
      tags: ['growth', 'growth-check', shouldImprove ? 'improved' : 'no-improvement', ...(capped ? ['capped'] : [])],
      payload: {
        system: 'coc',
        rollType: 'd100',
        checkType: 'growth',
        skillName: skill.name,
        previousValue,
        roll,
        improved: shouldImprove,
        increase: increaseRoll,
        rawNewValue,
        newValue,
        cap,
        capped,
      },
    }));
    toast(shouldImprove ? '成长检定成功' : '成长检定未通过', {
      description: shouldImprove
        ? `${skill.name} +${increaseRoll}，当前 ${newValue}${capped ? `（99 上限，原始 ${rawNewValue}）` : ''}`
        : `${skill.name} 保持 ${previousValue}`,
    });
  };

  const handleSpendLuck = () => {
    if (!pendingLuckSpend) return;

    const luckBefore = runtimePools.luck.current;
    if (pendingLuckSpend.neededLuck > luckBefore) {
      toast.error('Luck 不足，无法改为普通成功。');
      return;
    }

    changeLuck(-pendingLuckSpend.neededLuck);
    const luckAfter = Math.max(0, luckBefore - pendingLuckSpend.neededLuck);

    pushLog(createCocLogEntry({
      kind: 'check',
      title: 'Luck Spending',
      summary: `消耗 ${pendingLuckSpend.neededLuck} Luck 将 ${pendingLuckSpend.skillName} 检定改为普通成功`,
      displayValue: `-${pendingLuckSpend.neededLuck} Luck`,
      calculation: `roll ${pendingLuckSpend.roll} - skill ${pendingLuckSpend.skillValue} = ${pendingLuckSpend.neededLuck} Luck`,
      outcome: '普通成功 / Regular Success',
      tags: ['luck', 'luck-spending', 'regular'],
      payload: {
        system: 'coc',
        sourceEntryId: pendingLuckSpend.sourceEntryId,
        skillName: pendingLuckSpend.skillName,
        roll: pendingLuckSpend.roll,
        skillValue: pendingLuckSpend.skillValue,
        luckSpent: pendingLuckSpend.neededLuck,
        luckBefore,
        luckAfter,
      },
    }));
    toast.success('Luck Spending 已应用', {
      description: `消耗 ${pendingLuckSpend.neededLuck} Luck，剩余 ${luckAfter}`,
    });
    setPendingLuckSpend(null);
    setPendingPushedRoll(null);
  };

  // AI-LANDMARK: COC_PUSHED_ROLL_RUNTIME_LOG
  const handlePushedRoll = () => {
    if (!pendingPushedRoll) return;

    const roll = Math.floor(Math.random() * 100) + 1;
    const result = evaluateCocD100Check(pendingPushedRoll.skillValue, roll);
    const half = Math.floor(pendingPushedRoll.skillValue / 2);
    const fifth = Math.floor(pendingPushedRoll.skillValue / 5);
    const outcome = COC_SUCCESS_LEVEL_LABELS[result.successLevel] ?? result.successLevel;
    const consequence = result.isSuccess
      ? 'Pushed Roll 成功。'
      : 'Pushed Roll 失败，后果升级 / Keeper 裁定。';

    pushLog(createCocLogEntry({
      kind: 'check',
      title: `Pushed Roll：${pendingPushedRoll.skillName}`,
      summary: `${roll} / ${pendingPushedRoll.skillValue}，${outcome}`,
      detail: `${consequence} 原始失败 ${pendingPushedRoll.originalRoll} / ${pendingPushedRoll.skillValue} 保留。`,
      displayValue: roll,
      calculation: `Pushed 1d100=${roll}；目标值 ${pendingPushedRoll.skillValue}；困难 ${half}；极难 ${fifth}`,
      outcome: result.isSuccess ? outcome : `${outcome}；后果升级 / Keeper 裁定`,
      tags: [
        'skill',
        'pushed-roll',
        result.successLevel,
        result.isSuccess ? 'success' : 'failure',
        ...(result.isCritical ? ['critical'] : []),
        ...(result.isFumble ? ['fumble'] : []),
        ...(!result.isSuccess ? ['keeper-adjudication'] : []),
      ],
      payload: {
        system: 'coc',
        rollType: 'd100',
        checkType: 'skill',
        pushed: true,
        sourceEntryId: pendingPushedRoll.sourceEntryId,
        skillName: pendingPushedRoll.skillName,
        originalRoll: pendingPushedRoll.originalRoll,
        d100: roll,
        target: pendingPushedRoll.skillValue,
        half,
        fifth,
        success: result.isSuccess,
        successLevel: result.successLevel,
        isCritical: result.isCritical,
        isFumble: result.isFumble,
        consequence: result.isSuccess ? 'none' : 'keeper-adjudication',
      },
    }));
    toast(result.isSuccess ? 'Pushed Roll 成功' : 'Pushed Roll 失败', {
      description: result.isSuccess ? `${pendingPushedRoll.skillName}：${outcome}` : '后果升级 / Keeper 裁定。',
    });
    setPendingLuckSpend(null);
    setPendingPushedRoll(null);
  };

  const handleSanCheck = (lossExpression: string) => {
    const sanBefore = runtimePools.san.current;
    const roll = Math.floor(Math.random() * 100) + 1;
    const checkResult = evaluateCocD100Check(sanBefore, roll);
    const succeeded = checkResult.isSuccess;
    const lossRoll = rollCocGameplaySanLoss(lossExpression, succeeded);

    if (!lossRoll) {
      toast.error('SAN 损失表达式无效', {
        description: '请使用 0/1d4、1/1d6、1d3/1d10 等简单格式。',
      });
      return;
    }

    changeSan(-lossRoll.total);
    const sanAfter = Math.max(0, sanBefore - lossRoll.total);
    const outcome = succeeded ? '成功' : '失败';
    const successLevel = COC_SUCCESS_LEVEL_LABELS[checkResult.successLevel] ?? checkResult.successLevel;
    const riskNote = lossRoll.total >= 5
      ? '单次损失 >= 5，可能触发临时疯狂风险，需要 Keeper 判定。'
      : '未自动执行疯狂流程。';

    pushLog(createCocLogEntry({
      kind: 'check',
      title: 'SAN Check',
      summary: `${outcome}，损失 SAN ${lossRoll.total}`,
      detail: `${successLevel}。${riskNote}`,
      displayValue: roll,
      calculation: `SAN ${sanBefore}, roll ${roll}, loss ${lossRoll.detail}; SAN ${sanBefore} -> ${sanAfter}`,
      outcome,
      tags: [
        'san',
        'san-check',
        checkResult.successLevel,
        succeeded ? 'success' : 'failure',
        ...(checkResult.isCritical ? ['critical'] : []),
        ...(checkResult.isFumble ? ['fumble'] : []),
        ...(lossRoll.total >= 5 ? ['insanity-risk'] : []),
      ],
      payload: {
        system: 'coc',
        rollType: 'd100',
        checkType: 'san',
        roll,
        sanBefore,
        sanAfter,
        target: sanBefore,
        success: succeeded,
        successLevel: checkResult.successLevel,
        lossExpression,
        lossSideExpression: lossRoll.expression,
        lossRolls: lossRoll.rolls,
        lossApplied: lossRoll.total,
      },
    }));
    toast(succeeded ? 'SAN Check 成功' : 'SAN Check 失败', {
      description: `损失 SAN ${lossRoll.total}，当前 ${sanAfter}`,
    });
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

          <CocSanCheckPanel
            currentSan={runtimePools.san.current}
            onRunSanCheck={handleSanCheck}
          />

          <CocChecksPanel
            skills={character.skills}
            onRollSkill={handleSkillCheck}
            growthMarks={skillGrowthMarks}
            pendingGrowthMark={pendingGrowthMark}
            onMarkGrowth={handleMarkSkillGrowth}
            onClearPendingGrowth={() => setPendingGrowthMark(null)}
            onGrowthCheck={handleGrowthCheck}
            onClearGrowthMark={handleClearGrowthMark}
            pendingLuckSpend={pendingLuckSpend ? {
              ...pendingLuckSpend,
              canSpend: pendingLuckSpend.neededLuck <= runtimePools.luck.current,
              reason: `需要 ${pendingLuckSpend.neededLuck} Luck，当前 ${runtimePools.luck.current}。`,
            } : null}
            onSpendLuck={handleSpendLuck}
            onClearLuckSpend={() => setPendingLuckSpend(null)}
            pendingPushedRoll={pendingPushedRoll}
            onPushedRoll={handlePushedRoll}
            onClearPushedRoll={() => setPendingPushedRoll(null)}
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
