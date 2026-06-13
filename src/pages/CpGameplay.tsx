import { useState } from 'react';
import { toast } from 'sonner';
import { useCpStore } from '../store/cpStore';
import {
  CP_CRIT_INJURIES_BODY,
  CP_CRIT_INJURIES_HEAD,
  CP_SKILLS,
  CP_STAT_LABELS,
  type CpStat,
} from '../lib/cp-types';
import { evaluateCpSkillCheck } from '../lib/cp2024/cp-utils';
import {
  findCpCriticalInjuryDefinitionByName,
  type CpCriticalInjuryDefinition,
} from '../lib/cp2024/critical-injuries';
import type { RuntimeLogEntry } from '../lib/runtime-log-types';
import { CpChecksPanel } from './cpGameplay/CpChecksPanel';
import { CpCriticalInjuryPanel } from './cpGameplay/CpCriticalInjuryPanel';
import { CpDamagePanel } from './cpGameplay/CpDamagePanel';
import { CpDiceTrayPanel } from './cpGameplay/CpDiceTrayPanel';
import { CpRoleAbilityPanel } from './cpGameplay/CpRoleAbilityPanel';
import { CpRollConsolePanel } from './cpGameplay/CpRollConsolePanel';
import { CpRuntimeStatePanel } from './cpGameplay/CpRuntimeStatePanel';
import {
  makeCpRuntimeLogEntry,
  makeCpSystemEntry,
  rollD10,
  rollD6,
  rollDamage,
  rollExploding,
} from './cpGameplay/CpGameplayShared';

type CpGameplayProps = {
  embedded?: boolean;
};

// AI-LANDMARK: LEGACY_RUNTIME_EMBEDDED_MODE
// embedded hides legacy CP RED runtime hero chrome when rendered inside the workspace shell.
export function CpGameplay({ embedded = false }: CpGameplayProps = {}) {
  const {
    character,
    changeHp,
    changeHumanity,
    addInjury,
    removeInjury,
    addCriticalInjury,
    removeCriticalInjury,
  } = useCpStore();

  const [selectedSkill, setSelectedSkill] = useState(CP_SKILLS[0]?.name ?? '');
  const [selectedDV, setSelectedDV] = useState(15);
  const [modifier, setModifier] = useState(0);
  const [selectedWeapon, setSelectedWeapon] = useState(
    character.weapons[0]?.instanceId ?? character.weapons[0]?.name ?? '',
  );
  const [aimAtHead, setAimAtHead] = useState(false);
  const [diceTray, setDiceTray] = useState<Record<string, number>>({});

  const [log, setLog] = useState<RuntimeLogEntry[]>([
    makeCpSystemEntry('系统上线', 'CP RED 运行面板已就绪', ['system', 'ready']),
  ]);

  const addLog = (entry: RuntimeLogEntry) => {
    setLog((prev) => [entry, ...prev].slice(0, 20));
  };

  const woundPenalty =
    character.hp.current <= character.seriouslyWounded && character.hp.current > 0 ? -2 : 0;

  const handleSkillCheck = () => {
    const skill = CP_SKILLS.find((item) => item.name === selectedSkill);
    if (!skill) return;

    const stat = character.stats[skill.linkedStat] ?? 0;
    const skillLevel = character.skills[selectedSkill] ?? 0;
    const roll = rollExploding();
    const hasDv = selectedDV > 0;
    const result = evaluateCpSkillCheck({
      stat,
      skill: skillLevel,
      natural: roll.initial,
      extra: roll.bonus ?? roll.penalty,
      luckSpent: 0,
      modifiers: modifier + woundPenalty,
      dv: hasDv ? selectedDV : undefined,
    });
    const total = result.total;
    const margin = hasDv ? total - selectedDV : 0;
    const outcome = hasDv
      ? (result.success ? `成功 +${margin}` : `失败 ${margin}`)
      : '等待 GM 判定';

    addLog(makeCpRuntimeLogEntry({
      kind: 'check',
      title: `${skill.name} 检定`,
      summary: hasDv
        ? `${total} vs DV${selectedDV} -> ${outcome}`
        : `${total}，未设置 DV，等待 GM 判定`,
      detail: `技能 ${skillLevel} + ${skill.linkedStat} ${stat} + 修正 ${modifier} + 伤势 ${woundPenalty}`,
      displayValue: total,
      calculation: `${roll.label} + ${skill.linkedStat} ${stat} + ${skill.name} ${skillLevel} + 修正 ${modifier} + 伤势 ${woundPenalty} = ${total}`,
      outcome,
      tags: [
        'check',
        'skill',
        skill.name,
        hasDv ? 'dv' : 'no-dv',
        hasDv ? (result.success ? 'success' : 'failure') : 'gm-adjudication',
      ],
      payload: {
        system: 'cpred',
        rollType: 'exploding-d10',
        naturalRoll: roll.initial,
        explodedRolls: [roll.initial, roll.bonus ?? roll.penalty].filter((value): value is number => value !== undefined),
        baseRollTotal: roll.total,
        stat: skill.linkedStat,
        statValue: stat,
        skill: skill.name,
        skillName: skill.name,
        skillValue: skillLevel,
        modifier,
        woundPenalty,
        total,
        dv: hasDv ? selectedDV : undefined,
        outcome,
        success: hasDv ? result.success : undefined,
      },
    }));

    toast[hasDv && result.success ? 'success' : 'info'](
      hasDv ? `${skill.name}: ${total} vs DV${selectedDV}` : `${skill.name}: ${total}，等待 GM 判定`,
    );
  };

  const handleDamageRoll = () => {
    const weapon =
      character.weapons.find((item) => item.instanceId === selectedWeapon)
      ?? character.weapons.find((item) => item.name === selectedWeapon)
      ?? character.weapons[0];
    if (!weapon) return;

    const damage = rollDamage(weapon.damage);
    const crit = damage.critInjury;
    const finalDamage = damage.total;
    const critPool = aimAtHead ? CP_CRIT_INJURIES_HEAD : CP_CRIT_INJURIES_BODY;
    const d6a = crit ? rollD6() : 0;
    const d6b = crit ? rollD6() : 0;
    const critRoll = d6a + d6b;
    const critInjury = crit
      ? (critPool.find((entry) => entry.roll === critRoll) ?? critPool[critPool.length - 1])
      : null;

    if (critInjury) {
      addInjury(critInjury.name);
      changeHp(-5);
    }

    addLog(makeCpRuntimeLogEntry({
      kind: 'damage',
      title: `${weapon.name} 伤害`,
      summary: `${weapon.damage} = ${damage.total}`,
      detail: critInjury ? `触发重伤: ${critInjury.name} - ${critInjury.effect}` : undefined,
      displayValue: finalDamage,
      calculation: `${weapon.damage} [${damage.rolls.join(', ')}] = ${damage.total}`,
      outcome: critInjury ? `重伤: ${critInjury.name}` : '伤害已掷出',
      tags: ['damage', 'weapon', weapon.name, aimAtHead ? 'headshot' : 'body', crit ? 'critical-injury' : 'normal'],
      payload: {
        system: 'cpred',
        weaponName: weapon.name,
        damageFormula: weapon.damage,
        damageRolls: damage.rolls,
        damageTotal: finalDamage,
        baseDamageTotal: damage.total,
        aimedAtHead: aimAtHead,
        criticalInjuryRoll: crit ? [d6a, d6b] : undefined,
        criticalInjury: critInjury?.name,
      },
    }));

    toast[crit ? 'warning' : 'success'](
      crit
        ? `${weapon.name}: ${finalDamage} 伤害，重伤 ${critInjury?.name}`
        : `${weapon.name}: ${finalDamage} 伤害`,
    );
  };

  const handleStatCheck = (statKey: CpStat) => {
    const roll = rollExploding();
    const stat = character.stats[statKey] ?? 0;
    const total = roll.total + stat + woundPenalty;

    addLog(makeCpRuntimeLogEntry({
      kind: 'check',
      title: `${CP_STAT_LABELS[statKey]} 属性检定`,
      summary: `${total}，未设置 DV，等待 GM 判定`,
      detail: `${statKey} ${stat} + 伤势 ${woundPenalty}`,
      displayValue: total,
      calculation: `${roll.label} + ${statKey} ${stat} + 伤势 ${woundPenalty} = ${total}`,
      outcome: '等待 GM 判定',
      tags: ['check', 'stat', statKey, 'no-dv', 'gm-adjudication'],
      payload: {
        system: 'cpred',
        rollType: 'exploding-d10',
        naturalRoll: roll.initial,
        explodedRolls: [roll.initial, roll.bonus ?? roll.penalty].filter((value): value is number => value !== undefined),
        stat: statKey,
        statValue: stat,
        woundPenalty,
        total,
      },
    }));
  };

  const handleDeathSave = () => {
    const roll = rollD10();
    const target = character.deathSave;
    const success = roll <= target;

    addLog(makeCpRuntimeLogEntry({
      kind: 'check',
      title: 'Death Save',
      summary: `d10=${roll} vs Death Save ${target}`,
      displayValue: roll,
      calculation: `d10=${roll}，目标 <= ${target}`,
      outcome: success ? '稳定' : '失败',
      tags: ['check', 'death-save', success ? 'success' : 'failure'],
      payload: {
        system: 'cpred',
        rollType: 'd10',
        naturalRoll: roll,
        deathSave: target,
        target,
        success,
      },
    }));

    toast[success ? 'success' : 'error'](success ? 'Death Save 成功' : 'Death Save 失败');
  };

  const handleFreeDice = () => {
    const rolls: string[] = [];
    let total = 0;

    Object.entries(diceTray).forEach(([die, count]) => {
      const sides = Number(die.slice(1));
      const dieCount = Number(count);
      for (let i = 0; i < dieCount; i += 1) {
        const value = Math.floor(Math.random() * sides) + 1;
        rolls.push(`${die}:${value}`);
        total += value;
      }
    });

    if (rolls.length === 0) return;

    addLog(makeCpRuntimeLogEntry({
      kind: 'roll',
      title: '自由掷骰',
      summary: `${rolls.join(', ')} = ${total}`,
      displayValue: total,
      calculation: rolls.join(' + '),
      outcome: '已掷出',
      tags: ['roll', 'free-dice', 'utility'],
      payload: {
        system: 'cpred',
        diceTray,
        rolls,
        total,
      },
    }));
  };

  const handleHpDelta = (amount: number) => {
    changeHp(amount);
    const nextHp = Math.max(0, Math.min(character.hp.max, character.hp.current + amount));
    addLog(makeCpRuntimeLogEntry({
      kind: 'resource',
      title: 'HP 调整',
      summary: `${amount > 0 ? '+' : ''}${amount} -> ${nextHp}/${character.hp.max}`,
      displayValue: nextHp,
      outcome: nextHp <= Math.floor(character.hp.max / 2) ? '重伤阈值内' : '状态更新',
      tags: ['resource', 'hp'],
      payload: {
        system: 'cpred',
        resource: 'hp',
        delta: amount,
        remaining: nextHp,
        max: character.hp.max,
      },
    }));
  };

  const handleHumanityDelta = (amount: number) => {
    const before = character.humanity.current;
    changeHumanity(amount);
    const nextHumanity = Math.max(0, Math.min(character.humanity.max, before + amount));
    addLog(makeCpRuntimeLogEntry({
      kind: 'resource',
      title: 'Humanity 调整',
      summary: `${amount > 0 ? '+' : ''}${amount} -> ${nextHumanity}/${character.humanity.max}`,
      displayValue: nextHumanity,
      outcome: nextHumanity <= 0 ? '赛博精神病风险' : '状态更新',
      tags: ['resource', 'humanity'],
      payload: {
        system: 'cpred',
        resource: 'humanity',
        delta: amount,
        remaining: nextHumanity,
        max: character.humanity.max,
      },
    }));

    if (nextHumanity <= 0) {
      toast.error('人性归零！赛博精神病！');
    }
  };

  const handleRemoveInjury = (injury: string) => {
    removeInjury(injury);
    addLog(makeCpRuntimeLogEntry({
      kind: 'action',
      title: '伤势处理',
      summary: `已处理伤势: ${injury}`,
      displayValue: 'DONE',
      outcome: '已处理',
      tags: ['injury', 'resource'],
      payload: {
        system: 'cpred',
        action: 'removeInjury',
        injury,
      },
    }));
  };

  const trackedCriticalInjuries =
    character.runtime?.criticalInjuries ?? character.injuries ?? [];

  // AI-LANDMARK: CPRED_CRITICAL_INJURY_MANUAL_TRACKING
  const handleAddCriticalInjury = (definition: CpCriticalInjuryDefinition) => {
    addCriticalInjury(definition.name);
    addLog(makeCpRuntimeLogEntry({
      kind: 'action',
      title: '重伤记录（手动）',
      summary: `已记录重伤: ${definition.name}`,
      detail: `${definition.location === 'head' ? '头部' : '躯体'}重伤 · ${definition.effectSummary} · 手动追踪，不自动判定伤害`,
      displayValue: definition.name,
      outcome: '已记录',
      tags: ['injury', 'critical-injury', 'manual', definition.location],
      payload: {
        system: 'cpred',
        source: 'cpred-critical-injury',
        action: 'add-critical-injury',
        injuryId: definition.id,
        injuryName: definition.name,
        location: definition.location,
      },
    }));
    toast.warning(`已记录重伤: ${definition.name}`);
  };

  const handleRemoveCriticalInjury = (injuryName: string, index: number) => {
    removeCriticalInjury(index);
    const definition = findCpCriticalInjuryDefinitionByName(injuryName);
    addLog(makeCpRuntimeLogEntry({
      kind: 'action',
      title: '重伤移除（手动）',
      summary: `已移除重伤: ${injuryName}`,
      displayValue: 'DONE',
      outcome: '已移除',
      tags: ['injury', 'critical-injury', 'manual', ...(definition ? [definition.location] : [])],
      payload: {
        system: 'cpred',
        source: 'cpred-critical-injury',
        action: 'remove-critical-injury',
        injuryId: definition?.id,
        injuryName,
        location: definition?.location,
      },
    }));
    toast.info(`已移除重伤: ${injuryName}`);
  };

  return (
    <div className="space-y-5 text-slate-100">
      {!embedded && (
        <div className="rounded border border-[#b08d2a]/60 bg-black/80 p-5 shadow-[0_0_30px_rgba(176,141,42,0.16)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-200/70">Combat Runtime</p>
              <h2 className="text-2xl font-black uppercase tracking-[0.12em] text-[#f5c518]">
                {character.lifePath?.handle || character.name}
              </h2>
              <p className="text-sm text-slate-300">
                {character.role} Rank {character.roleLevel} · EB {character.eb} · Humanity {character.humanity.current}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
              <div className="rounded border border-red-500/50 bg-red-950/40 px-3 py-2">
                <p className="text-red-200/80">HP</p>
                <p className="text-lg font-black text-red-100">{character.hp.current}/{character.hp.max}</p>
              </div>
              <div className="rounded border border-[#b08d2a]/45 bg-[#f5c518]/8 px-3 py-2">
                <p className="text-[#f3d77a]">BODY</p>
                <p className="text-lg font-black text-[#f7e08a]">{character.stats.BODY}</p>
              </div>
              <div className="rounded border border-cyan-500/40 bg-cyan-950/30 px-3 py-2">
                <p className="text-cyan-200/80">REF</p>
                <p className="text-lg font-black text-cyan-100">{character.stats.REF}</p>
              </div>
              <div className="rounded border border-emerald-500/40 bg-emerald-950/30 px-3 py-2">
                <p className="text-emerald-200/80">MOVE</p>
                <p className="text-lg font-black text-emerald-100">{character.stats.MOVE}</p>
              </div>
              <div className="rounded border border-violet-500/40 bg-violet-950/30 px-3 py-2">
                <p className="text-violet-200/80">EMP</p>
                <p className="text-lg font-black text-violet-100">{character.stats.EMP}</p>
              </div>
              <div className="rounded border border-orange-500/40 bg-orange-950/30 px-3 py-2">
                <p className="text-orange-200/80">Wound</p>
                <p className="text-lg font-black text-orange-100">{woundPenalty}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <CpRollConsolePanel entries={log} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          <CpRuntimeStatePanel
            character={character}
            onHpDelta={handleHpDelta}
            onHumanityDelta={handleHumanityDelta}
          />
        </div>

        <div className="space-y-4">
          <CpChecksPanel
            character={character}
            selectedSkill={selectedSkill}
            setSelectedSkill={setSelectedSkill}
            selectedDV={selectedDV}
            setSelectedDV={setSelectedDV}
            modifier={modifier}
            setModifier={setModifier}
            onSkillCheck={handleSkillCheck}
            onStatCheck={handleStatCheck}
          />

          <CpDamagePanel
            character={character}
            selectedWeapon={selectedWeapon}
            setSelectedWeapon={setSelectedWeapon}
            aimAtHead={aimAtHead}
            setAimAtHead={setAimAtHead}
            onDamageRoll={handleDamageRoll}
            onDeathSave={handleDeathSave}
            onRemoveInjury={handleRemoveInjury}
          />

          <CpCriticalInjuryPanel
            injuries={trackedCriticalInjuries}
            onAddInjury={handleAddCriticalInjury}
            onRemoveInjury={handleRemoveCriticalInjury}
          />

          <CpDiceTrayPanel
            diceTray={diceTray}
            setDiceTray={setDiceTray}
            onRoll={handleFreeDice}
          />
        </div>
      </div>

      <CpRoleAbilityPanel
        role={character.role}
        roleLevel={character.roleLevel}
        stats={character.stats}
        skills={character.skills}
        addLog={addLog}
      />
    </div>
  );
}
