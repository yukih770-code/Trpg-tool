import { useState } from 'react';
import {
  useCharacterStore,
  type DndClassResourceConsumption,
  type DndSpellcastingResourceConsumption,
} from '../store/characterStore';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { getAvailableSpells, getAvailableClasses } from '../lib/mod-utils';
import { AttributeName, SkillName, SpellInfo, type CharacterData } from '../lib/dnd-types';
import type { RuntimeLogEntry, RuntimeLogKind } from '../lib/runtime-log-types';
import { DND_ACTION_REGISTRY } from '../lib/dnd2024/actionRegistry';
import type { DndActionDefinition, ResourceCost } from '../lib/dnd2024/action-registry-types';
import { getDndSpellManagement } from '../lib/dnd2024/spellManagement';
import { DndSpellManager } from '../components/dnd/DndSpellManager';
import { ActionsPanel } from './gameplay/ActionsPanel';
import { ChecksPanel } from './gameplay/ChecksPanel';
import { ClassResourcePanel } from './gameplay/ClassResourcePanel';
import { RollConsolePanel } from './gameplay/RollConsolePanel';
import { SpellbookPanel } from './gameplay/SpellbookPanel';
import { VitalsPanel } from './gameplay/VitalsPanel';
import { toast } from 'sonner';

type DndLogInput = {
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

type RestKind = 'short' | 'long';

function createDndLogEntry(input: DndLogInput): RuntimeLogEntry {
  return {
    id: `dnd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    system: 'dnd',
    visibility: 'public',
    ...input,
    tags: ['dnd', ...(input.tags || [])],
  };
}

function createDndSystemLogEntry(summary: string): RuntimeLogEntry {
  return createDndLogEntry({
    kind: 'system',
    title: '系统提示',
    summary,
    displayValue: '待命',
    calculation: summary,
    outcome: '等待 DM 判定',
    tags: ['system'],
  });
}

function describeRestResourceChanges(
  before: CharacterData,
  after: CharacterData,
  restKind: RestKind,
): { summary: string; detail: string; tags: string[]; payload: unknown } {
  const beforeById = new Map(before.classResources.map(resource => [resource.id, resource]));
  const changes = after.classResources
    .map(resource => {
      const previous = beforeById.get(resource.id);
      if (!previous || previous.current === resource.current) return null;
      return {
        id: resource.id,
        label: resource.sourceFeature || resource.id,
        before: previous.current,
        after: resource.current,
        max: resource.max,
        recoveryType: resource.recoveryType,
      };
    })
    .filter((change): change is NonNullable<typeof change> => Boolean(change));
  const pactBefore = before.pactMagicState;
  const pactAfter = after.pactMagicState;
  const pactChanged = Boolean(pactBefore && pactAfter && pactBefore.current !== pactAfter.current);
  const resourceSummary = changes.length > 0
    ? changes.map(change => `${change.label} ${change.before}->${change.after}/${change.max}`).join('；')
    : '没有职业资源变化';
  const pactSummary = pactChanged && pactBefore && pactAfter
    ? `契约魔法位 ${pactBefore.current}->${pactAfter.current}/${pactAfter.max}`
    : pactAfter
      ? `契约魔法位保持 ${pactAfter.current}/${pactAfter.max}`
      : '无契约魔法位';
  const restLabel = restKind === 'short' ? '短休' : '长休';
  const detail = `${restLabel}恢复：${resourceSummary}；${pactSummary}。`;

  return {
    summary: detail,
    detail: restKind === 'long'
      ? `${detail} 长休在本工具 v1 模型中会刷新长休资源，并覆盖短休级别资源恢复。`
      : detail,
    tags: ['rest', restKind === 'short' ? 'short-rest' : 'long-rest'],
    payload: {
      restKind,
      classResourceChanges: changes,
      pactMagic: pactBefore || pactAfter
        ? {
            before: pactBefore?.current,
            after: pactAfter?.current,
            max: pactAfter?.max ?? pactBefore?.max,
            slotLevel: pactAfter?.slotLevel ?? pactBefore?.slotLevel,
          }
        : undefined,
    },
  };
}

export function Gameplay() {
  const {
    character,
    restShort,
    restLong,
    modifyHp,
    updateSpellbook,
    consumeSpellcastingResource,
    consumeClassResource,
    initializeRuntimeResources,
    updateClassResourceCurrent,
    resetClassResource,
    updatePactMagicCurrent,
    resetPactMagic,
  } = useCharacterStore();
  const [showSpellManager, setShowSpellManager] = useState(false);
  const [combatLog, setCombatLog] = useState<RuntimeLogEntry[]>([
    createDndSystemLogEntry('战斗模拟面板已就绪。'),
  ]);
  const [checkDc, setCheckDc] = useState('');

  const SPELL_DATA = getAvailableSpells(character);
  const CLASS_DATA = getAvailableClasses(character);

  if (!character.isCompleted) {
    return <div className="text-center py-20 text-neutral-400">请先在创建器中完成角色创建。</div>;
  }

  const hpPercent = Math.max(0, Math.min(100, (character.hpCurrent / character.hpMax) * 100));
  const attrLabels: Record<AttributeName, string> = { Str: "力量", Dex: "敏捷", Con: "体质", Int: "智力", Wis: "感知", Cha: "魅力" };
  const checkAttrs: AttributeName[] = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
  const allSkills: { name: SkillName; attr: AttributeName }[] = [
    { name: '运动', attr: 'Str' },
    { name: '特技', attr: 'Dex' },
    { name: '巧手', attr: 'Dex' },
    { name: '隐匿', attr: 'Dex' },
    { name: '奥秘', attr: 'Int' },
    { name: '历史', attr: 'Int' },
    { name: '调查', attr: 'Int' },
    { name: '自然', attr: 'Int' },
    { name: '宗教', attr: 'Int' },
    { name: '驯兽', attr: 'Wis' },
    { name: '洞察', attr: 'Wis' },
    { name: '医药', attr: 'Wis' },
    { name: '察觉', attr: 'Wis' },
    { name: '生存', attr: 'Wis' },
    { name: '欺瞒', attr: 'Cha' },
    { name: '威吓', attr: 'Cha' },
    { name: '表演', attr: 'Cha' },
    { name: '游说', attr: 'Cha' },
  ];

  const describeSpellcastingResource = (
    result: DndSpellcastingResourceConsumption,
    spellName: string,
    spellLevel: number,
  ) => {
    if (result.resourceType === 'cantrip') {
      return {
        summary: `作为戏法施展 ${spellName}`,
        detail: `${spellName} 是戏法，不消耗法术位。`,
        displayValue: '戏法',
        calculation: 'Cantrip: no spell slot consumed',
        outcome: '已施展',
      };
    }

    const resourceLabel = result.resourceType === 'pactMagic' ? '契约魔法位' : `${result.slotLevel ?? spellLevel}环法术位`;
    const slotText = `${result.previousSlots ?? 0}->${result.remainingSlots ?? 0}/${result.maxSlots ?? 0}`;
    return {
      summary: result.ok
        ? `消耗 1 个 ${resourceLabel} 施展 ${spellName}`
        : `${resourceLabel}不足，无法施展 ${spellName}`,
      detail: result.ok
        ? `${resourceLabel} ${slotText}。未处理目标、伤害、豁免或专注。`
        : result.reason ?? `${resourceLabel}不足。`,
      displayValue: result.ok ? `${result.remainingSlots ?? 0}/${result.maxSlots ?? 0}` : '不足',
      calculation: result.ok
        ? `${resourceLabel}: ${slotText}`
        : `${resourceLabel}: ${result.previousSlots ?? 0}/${result.maxSlots ?? 0}`,
      outcome: result.ok ? '已施展' : '资源不足',
    };
  };

  const castSpell = (spellName: string, level: number) => {
    const result = consumeSpellcastingResource(level);
    const resourceDescription = describeSpellcastingResource(result, spellName, level);
    const entry = createDndLogEntry({
      kind: 'action',
      title: `施法：${spellName}`,
      summary: resourceDescription.summary,
      detail: resourceDescription.detail,
      displayValue: resourceDescription.displayValue,
      calculation: resourceDescription.calculation,
      outcome: resourceDescription.outcome,
      tags: [
        'spellcasting',
        result.resourceType,
        result.ok ? 'cast' : 'insufficient-resource',
        ...(result.pactMagic ? ['pactMagic'] : []),
      ],
      payload: {
        spellName,
        spellLevel: level,
        resourceType: result.resourceType,
        slotLevel: result.slotLevel,
        previousSlots: result.previousSlots,
        remainingSlots: result.remainingSlots,
        maxSlots: result.maxSlots,
        pactMagic: result.pactMagic,
        source: 'spellcasting',
        success: result.ok,
        reason: result.reason,
      },
    });
    setCombatLog(prev => [entry, ...prev].slice(0, 20));

    if (result.ok) {
      toast(level === 0 ? `作为戏法施展了 ${spellName}!` : `内源法力涌动...`, {
        description: level === 0
          ? `${spellName} 不消耗法术位。`
          : resourceDescription.summary,
      });
    } else {
      toast.error(`法力不足！`, {
        description: result.reason ?? `没有可用的施法资源。`
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

  const handleShortRest = () => {
    const before = character;
    restShort();
    const after = useCharacterStore.getState().character;
    const restLog = describeRestResourceChanges(before, after, 'short');
    setCombatLog(prev => [createDndLogEntry({
      kind: 'system',
      title: '短休 / SHORT REST',
      displayValue: '短休',
      outcome: '已完成',
      calculation: restLog.detail,
      ...restLog,
    }), ...prev].slice(0, 20));
    toast("进行了短休 (1小时)");
  };

  const handleLongRest = () => {
    const before = character;
    restLong();
    const after = useCharacterStore.getState().character;
    const restLog = describeRestResourceChanges(before, after, 'long');
    setCombatLog(prev => [createDndLogEntry({
      kind: 'system',
      title: '长休 / LONG REST',
      displayValue: '长休',
      outcome: '已完成',
      calculation: restLog.detail,
      ...restLog,
    }), ...prev].slice(0, 20));
    toast("进行了长休 (8小时)", {description: "生命值与法术位已全满！"});
  };

  const handleBasicAttack = () => {
    toast("发起攻击！");
  };

  const personalSpells = character.spellbook.known.filter(spell => spell.id?.startsWith('personal.'));
  const spellManagement = getDndSpellManagement(character, SPELL_DATA, personalSpells);
  const spellPreparationModel = spellManagement.preparation;
  const isPreparedCaster = spellPreparationModel.isPreparedCaster;
  const maxPrepared = spellPreparationModel.preparedSpellLimit ?? 0;
  const isCaster = spellPreparationModel.isCaster;
  const preparedSpells = character.spellbook.prepared;
  const activeSpells = spellManagement.active;

  const classDef = CLASS_DATA.find(c => c.name === character.jobClass);

  const getAttrScore = (attr: AttributeName) => {
    const statBlock = character.attrs[attr];
    return statBlock.base + statBlock.pointbuy + statBlock.racebonus + (statBlock.extrabonus || 0);
  };

  const getAttrModifier = (attr: AttributeName) => Math.floor((getAttrScore(attr) - 10) / 2);
  const proficiencyBonus = Math.ceil(1 + character.level / 4);
  const formatModifier = (modifier: number) => modifier >= 0 ? `+${modifier}` : `${modifier}`;
  const isSaveProficient = (attr: AttributeName) => (
    character.savingThrowProficiencies.includes(attr) || Boolean(classDef?.savingThrows.includes(attr))
  );

  const rollGameplayCheck = (name: string, modifier: number) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + modifier;
    const parsedDc = checkDc.trim() === '' ? undefined : Number(checkDc);
    const hasDc = typeof parsedDc === 'number' && Number.isFinite(parsedDc);
    const natTag = d20 === 20 ? '天然 20 / NAT 20' : d20 === 1 ? '天然 1 / NAT 1' : undefined;
    const outcome = hasDc
      ? `${total >= parsedDc ? '成功' : '失败'}`
      : '等待 DM 判定';
    const dcPart = hasDc ? `DC=${parsedDc}，${outcome}` : '未设置 DC，等待 DM 判定';
    const calculation = `d20=${d20} + 修正=${formatModifier(modifier)} = ${total}`;
    const tags = ['check'];
    if (d20 === 20) tags.push('nat20');
    if (d20 === 1) tags.push('nat1');
    const entry = createDndLogEntry({
      kind: 'check',
      title: name,
      summary: `总计 ${total}，${dcPart}`,
      detail: natTag ? `${calculation}，${natTag}，${dcPart}` : `${calculation}，${dcPart}`,
      displayValue: total,
      calculation,
      outcome,
      tags,
      payload: {
        d20,
        modifier,
        total,
        dc: hasDc ? parsedDc : undefined,
        nat20: d20 === 20,
        nat1: d20 === 1,
        checkName: name,
      },
    });
    setCombatLog(prev => [entry, ...prev].slice(0, 20));
  };

  const getClassResource = (resourceId?: string) => (
    resourceId ? character.classResources.find(resource => resource.id === resourceId) : undefined
  );

  const hasMatchingActionResource = (cost: ResourceCost) => {
    if (cost.resourceType === 'classResource') return Boolean(getClassResource(cost.resourceId));
    return Boolean(character.pactMagicState);
  };

  const canPayActionCost = (cost: ResourceCost) => {
    if (cost.resourceType === 'classResource') {
      const resource = getClassResource(cost.resourceId);
      return Boolean(resource && resource.current >= cost.amount);
    }
    return Boolean(character.pactMagicState && character.pactMagicState.current >= cost.amount);
  };

  const getActionCostPreview = (cost: ResourceCost) => {
    if (cost.resourceType === 'classResource') {
      const resource = getClassResource(cost.resourceId);
      return {
        label: resource?.sourceFeature || cost.resourceId || 'classResource',
        amount: cost.amount,
        current: resource?.current || 0,
        max: resource?.max || 0,
        canPay: Boolean(resource && resource.current >= cost.amount),
      };
    }
    return {
      label: 'Pact Magic',
      amount: cost.amount,
      current: character.pactMagicState?.current || 0,
      max: character.pactMagicState?.max || 0,
      canPay: Boolean(character.pactMagicState && character.pactMagicState.current >= cost.amount),
    };
  };

  const getActionInsufficientLabel = (action: DndActionDefinition) => {
    const preview = action.resourceCost?.map(getActionCostPreview).find(cost => !cost.canPay);
    return preview ? `资源不足：需要 ${preview.amount}，当前 ${preview.current}` : undefined;
  };

  const visibleRegistryActions = DND_ACTION_REGISTRY.filter(action => (
    action.resourceCost?.length && action.resourceCost.every(hasMatchingActionResource)
  ));

  const canUseRegistryAction = (action: DndActionDefinition) => (
    Boolean(action.resourceCost?.length) && action.resourceCost!.every(canPayActionCost)
  );

  type RegistryCostConsumption = {
    ok: boolean;
    resourceType: ResourceCost['resourceType'];
    resourceId?: string;
    label: string;
    amount: number;
    previous?: number;
    remaining?: number;
    max?: number;
    reason?: string;
  };

  const describeClassResourceFailure = (result: DndClassResourceConsumption) => {
    if (result.reason === 'missing-resource') return '资源不存在';
    if (result.reason === 'insufficient-resource') return '资源不足';
    return '资源消耗失败';
  };

  const consumeRegistryCost = (
    cost: ResourceCost,
    preview: ReturnType<typeof getActionCostPreview>,
  ): RegistryCostConsumption => {
    if (cost.resourceType === 'classResource') {
      const result = consumeClassResource(cost.resourceId || '', cost.amount);
      return {
        ok: result.ok,
        resourceType: cost.resourceType,
        resourceId: cost.resourceId,
        label: preview.label,
        amount: result.amount,
        previous: result.previous,
        remaining: result.remaining,
        max: result.max,
        reason: result.ok ? undefined : describeClassResourceFailure(result),
      };
    }

    const pactMagic = useCharacterStore.getState().character.pactMagicState;
    if (!pactMagic) {
      return {
        ok: false,
        resourceType: cost.resourceType,
        label: preview.label,
        amount: cost.amount,
        reason: '资源不存在',
      };
    }

    const previous = pactMagic.current;
    let remaining = pactMagic.current;
    let max = pactMagic.max;
    let failureReason: string | undefined;

    for (let index = 0; index < cost.amount; index += 1) {
      const result = consumeSpellcastingResource(pactMagic.slotLevel);
      const latestPactMagic = useCharacterStore.getState().character.pactMagicState;
      remaining = latestPactMagic?.current ?? result.remainingSlots ?? remaining;
      max = latestPactMagic?.max ?? result.maxSlots ?? max;

      if (!result.ok) {
        failureReason = result.reason ?? '法术位不足';
        break;
      }
    }

    return {
      ok: !failureReason,
      resourceType: cost.resourceType,
      label: preview.label,
      amount: cost.amount,
      previous,
      remaining,
      max,
      reason: failureReason,
    };
  };

  const useRegistryAction = (action: DndActionDefinition) => {
    if (!action.resourceCost || !canUseRegistryAction(action)) return;

    const previews = action.resourceCost.map(getActionCostPreview);
    const consumptions = action.resourceCost.map((cost, index) => consumeRegistryCost(cost, previews[index]));
    const failedConsumption = consumptions.find(result => !result.ok);

    if (failedConsumption) {
      toast.error(`资源消耗失败：${action.name}`, {
        description: failedConsumption.reason ?? '资源不足',
      });
      return;
    }

    toast.success(`使用动作：${action.name}`, {
      description: consumptions
        .map(cost => `${cost.label} -${cost.amount}，剩余 ${cost.remaining ?? 0} / ${cost.max ?? 0}`)
        .join('；'),
    });
    const actionSummary = consumptions
      .map(cost => `消耗 ${cost.label} ${cost.amount}，剩余 ${cost.remaining ?? 0}/${cost.max ?? 0}`)
      .join('；');
    const firstCost = action.resourceCost[0];
    const firstConsumption = consumptions[0];
    const entry = createDndLogEntry({
      kind: 'action',
      title: `动作：${action.name}`,
      summary: actionSummary,
      displayValue: '使用',
      outcome: '已使用',
      tags: ['action', ...(action.category ? [action.category] : [])],
      payload: {
        actionId: action.id,
        actionName: action.name,
        resourceId: firstCost?.resourceId || firstCost?.resourceType,
        amount: firstConsumption?.amount,
        remaining: firstConsumption?.remaining,
        max: firstConsumption?.max,
        costs: action.resourceCost.map((cost, index) => {
          const consumption = consumptions[index];
          return {
            resourceType: cost.resourceType,
            resourceId: cost.resourceId,
            amount: consumption?.amount ?? cost.amount,
            previous: consumption?.previous,
            remaining: consumption?.remaining,
            max: consumption?.max,
          };
        }),
      },
    });
    setCombatLog(prev => [entry, ...prev].slice(0, 20));
  };

  return (
    <div className="space-y-3 lg:space-y-0 lg:h-[calc(100vh-96px)] lg:max-h-[calc(100vh-96px)] lg:min-h-0 lg:overflow-hidden lg:flex lg:flex-col lg:gap-3">
      {/* ... existing header ... */}
      <div className="flex justify-between items-center border-b-2 border-[#58180d] mb-2 pb-2">
        <h2 className="text-2xl font-bold uppercase tracking-tighter text-[#58180d]">战斗与游玩面板</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        {/* ... existing columns ... */}
        {/* Actions & Vitals Column */}
        <div className="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
          <VitalsPanel
            character={character}
            hpPercent={hpPercent}
            onDamage={handleDamage}
            onHeal={handleHeal}
            onShortRest={handleShortRest}
            onLongRest={handleLongRest}
          />

          <ActionsPanel
            visibleRegistryActions={visibleRegistryActions}
            canUseRegistryAction={canUseRegistryAction}
            getActionInsufficientLabel={getActionInsufficientLabel}
            getActionCostPreview={getActionCostPreview}
            useRegistryAction={useRegistryAction}
          />

          <ChecksPanel
            character={character}
            checkDc={checkDc}
            onCheckDcChange={setCheckDc}
            onClearCheckDc={() => setCheckDc('')}
            checkAttrs={checkAttrs}
            allSkills={allSkills}
            attrLabels={attrLabels}
            proficiencyBonus={proficiencyBonus}
            getAttrModifier={getAttrModifier}
            formatModifier={formatModifier}
            isSaveProficient={isSaveProficient}
            rollGameplayCheck={rollGameplayCheck}
          />

        </div>

        {/* Spells & Equipment Column */}
        <div className="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1 custom-scrollbar">
          <ClassResourcePanel
            character={character}
            initializeRuntimeResources={initializeRuntimeResources}
            consumeClassResource={consumeClassResource}
            updateClassResourceCurrent={updateClassResourceCurrent}
            resetClassResource={resetClassResource}
            consumePactMagicResource={() => {
              const pactMagic = useCharacterStore.getState().character.pactMagicState;
              if (pactMagic) consumeSpellcastingResource(pactMagic.slotLevel);
            }}
            updatePactMagicCurrent={updatePactMagicCurrent}
            resetPactMagic={resetPactMagic}
          />

          <SpellbookPanel
            character={character}
            isCaster={isCaster}
            isPreparedCaster={isPreparedCaster}
            preparedSpells={preparedSpells}
            activeSpells={activeSpells}
            maxPrepared={maxPrepared}
            onManageSpells={() => setShowSpellManager(true)}
            onCastSpell={castSpell}
            onBasicAttack={handleBasicAttack}
          />
        </div>
      </div>

      <RollConsolePanel
        combatLog={combatLog}
      />

      {/* Spell Manager Modal */}
      {showSpellManager && (
        <div className="fixed inset-0 bg-[#2c1810]/80 flex items-center justify-center z-50 p-4 font-serif">
          <div className="bg-[#fdf6e3] border-4 border-[#58180d] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b-2 border-[#58180d] pb-2">
              <h2 className="text-2xl font-black uppercase text-[#58180d]">管理法术与法术书</h2>
              <button className="text-[#58180d] font-bold text-xl hover:opacity-70" onClick={() => setShowSpellManager(false)}>✕</button>
            </div>
            
            <DndSpellManager character={character} baseSpells={SPELL_DATA} personalSpells={personalSpells} onChange={book => updateSpellbook(book.known, book.prepared)} />

            <div className="flex justify-end pt-4 border-t border-[#58180d]/30">
               <Button className="rounded-none bg-[#58180d] text-[#fdf6e3] hover:opacity-90 uppercase font-bold" onClick={() => setShowSpellManager(false)}>完成 / 返回</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
