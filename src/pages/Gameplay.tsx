import { useState } from 'react';
import { useCharacterStore, type DndSpellcastingResourceConsumption } from '../store/characterStore';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { getAvailableSpells, getAvailableClasses, getAvailableFeats } from '../lib/mod-utils';
import { AttributeName, SkillName, SpellInfo, type CharacterData } from '../lib/dnd-types';
import type { RuntimeLogEntry, RuntimeLogKind } from '../lib/runtime-log-types';
import { DND_ACTION_REGISTRY } from '../lib/dnd2024/actionRegistry';
import type { DndActionDefinition, ResourceCost } from '../lib/dnd2024/action-registry-types';
import { getDndSpellPreparationModel } from '../lib/dnd2024/spell-preparation-model';
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
    levelUp,
    restShort,
    restLong,
    modifyHp,
    updateSpellbook,
    consumeSpellcastingResource,
    initializeRuntimeResources,
    updateClassResourceCurrent,
    resetClassResource,
    updatePactMagicCurrent,
    resetPactMagic,
  } = useCharacterStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showSpellManager, setShowSpellManager] = useState(false);
  const [selectedSubclass, setSelectedSubclass] = useState<string>('');
  const [asiChoices, setAsiChoices] = useState<AttributeName[]>([]);
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  const [combatLog, setCombatLog] = useState<RuntimeLogEntry[]>([
    createDndSystemLogEntry('战斗模拟面板已就绪。'),
  ]);
  const [checkDc, setCheckDc] = useState('');

  const SPELL_DATA = getAvailableSpells(character);
  const CLASS_DATA = getAvailableClasses(character);
  const FEATS_DATA = getAvailableFeats(character);

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

  const spellPreparationModel = getDndSpellPreparationModel(character);
  const isPreparedCaster = spellPreparationModel.isPreparedCaster;
  const maxPrepared = spellPreparationModel.preparedSpellLimit ?? 0;
  const isCaster = spellPreparationModel.isCaster;

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

  const useRegistryAction = (action: DndActionDefinition) => {
    if (!action.resourceCost || !canUseRegistryAction(action)) return;

    const previews = action.resourceCost.map(getActionCostPreview);

    action.resourceCost.forEach(cost => {
      if (cost.resourceType === 'classResource') {
        const resource = getClassResource(cost.resourceId);
        if (resource && cost.resourceId) {
          updateClassResourceCurrent(cost.resourceId, resource.current - cost.amount);
        }
      }

      if (cost.resourceType === 'pactMagic' && character.pactMagicState) {
        updatePactMagicCurrent(character.pactMagicState.current - cost.amount);
      }
    });

    toast.success(`使用动作：${action.name}`, {
      description: previews
        .map(cost => `${cost.label} -${cost.amount}，剩余 ${Math.max(0, cost.current - cost.amount)} / ${cost.max}`)
        .join('；'),
    });
    const actionSummary = previews
      .map(cost => `消耗 ${cost.label} ${cost.amount}，剩余 ${Math.max(0, cost.current - cost.amount)}/${cost.max}`)
      .join('；');
    const firstCost = action.resourceCost[0];
    const firstPreview = previews[0];
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
        amount: firstCost?.amount,
        remaining: firstPreview ? Math.max(0, firstPreview.current - firstPreview.amount) : undefined,
        max: firstPreview?.max,
        costs: action.resourceCost.map((cost, index) => {
          const preview = previews[index];
          return {
            resourceType: cost.resourceType,
            resourceId: cost.resourceId,
            amount: cost.amount,
            remaining: preview ? Math.max(0, preview.current - preview.amount) : undefined,
            max: preview?.max,
          };
        }),
      },
    });
    setCombatLog(prev => [entry, ...prev].slice(0, 20));
  };

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

  return (
    <div className="space-y-3 lg:space-y-0 lg:h-[calc(100vh-96px)] lg:max-h-[calc(100vh-96px)] lg:min-h-0 lg:overflow-hidden lg:flex lg:flex-col lg:gap-3">
      {/* ... existing header ... */}
      <div className="flex justify-between items-center border-b-2 border-[#58180d] mb-2 pb-2">
        <h2 className="text-2xl font-bold uppercase tracking-tighter text-[#58180d]">战斗与游玩面板</h2>
        <Button onClick={() => setShowLevelUp(true)} className="bg-[#58180d] text-[#fdf6e3] hover:opacity-90 uppercase text-sm font-bold rounded-none">
          ✨ 升级 (当前 Lv.{character.level})
        </Button>
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
            updateClassResourceCurrent={updateClassResourceCurrent}
            resetClassResource={resetClassResource}
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
                  <p className="mt-1 text-xs italic">{spellPreparationModel.ruleHint}</p>
                  {spellPreparationModel.usesSpellbook && <p className="mt-1 text-xs italic">法师需要首先将法术抄录（学习）到法术书中，然后只能从法术书中准备法术。完整法术书工作流仍 deferred。</p>}
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
