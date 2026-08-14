import { useMemo, useState } from 'react';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { toast } from 'sonner';
import type { AttributeName } from '../../lib/dnd-types';
import { getAvailableClasses, getAvailableFeats } from '../../lib/mod-utils';
import { normalizeDndClassLevels, getDndClassLevelAllocation } from '../../lib/dnd2024/multiclass';
import {
  buildDndLevelAdvancementPlan,
  canUndoDndLevelAdvancement,
} from '../../lib/dnd2024/dndLevelAdvancement';
import { useCharacterStore } from '../../store/characterStore';

const ATTR_LABELS: Record<AttributeName, string> = {
  Str: '力量', Dex: '敏捷', Con: '体质', Int: '智力', Wis: '感知', Cha: '魅力',
};

export function DndLevelAdvancementDialog() {
  const {
    character,
    lastLevelAdvancement,
    commitLevelAdvancement,
    undoLastLevelAdvancement,
  } = useCharacterStore();
  const [open, setOpen] = useState(false);
  const [targetClassName, setTargetClassName] = useState(character.jobClass);
  const [subclass, setSubclass] = useState('');
  const [asi, setAsi] = useState<AttributeName[]>([]);
  const [feat, setFeat] = useState('');
  const classes = getAvailableClasses(character);
  const feats = getAvailableFeats(character);
  const classLevels = normalizeDndClassLevels(character.classLevels, {
    className: character.jobClass,
    level: character.level,
    subclass: character.subclass,
  });
  const targetClass = classes.find((item) => item.name === targetClassName)
    ?? classes.find((item) => item.name === character.jobClass);
  const target = targetClass ? { className: targetClass.name, classId: targetClass.id } : undefined;
  const selectedFeat = feats.find((item) => item.name === feat);
  const plan = useMemo(() => buildDndLevelAdvancementPlan({
    character,
    classDef: targetClass,
    choice: {
      targetClass: target,
      selectedSubclass: subclass,
      abilityScoreIncreases: asi,
      feat: feat || undefined,
      featEligible: selectedFeat ? selectedFeat.checkPrereq(character) : undefined,
    },
  }), [character, targetClass, target?.classId, target?.className, subclass, asi, feat, selectedFeat]);

  const resetFlow = () => {
    setOpen(false);
    setTargetClassName(character.jobClass);
    setSubclass('');
    setAsi([]);
    setFeat('');
  };

  const selectClass = (name: string) => {
    setTargetClassName(name);
    setSubclass('');
    setAsi([]);
    setFeat('');
  };

  const adjustAsi = (attribute: AttributeName, increment: number) => {
    if (increment > 0) {
      if (asi.length >= 2) return;
      setFeat('');
      setAsi((current) => [...current, attribute]);
      return;
    }
    const index = asi.indexOf(attribute);
    if (index < 0) return;
    setAsi((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const confirm = () => {
    if (!plan.ready) {
      toast(plan.issues.find((issue) => issue.severity === 'blocker')?.message || '升级计划尚未完成。');
      return;
    }
    if (!commitLevelAdvancement(plan)) {
      toast('角色已发生变化，请重新检查升级计划。');
      return;
    }
    resetFlow();
    toast(`已升至总等级 ${plan.nextTotalLevel}`, {
      description: `${plan.targetClassName}职业等级 ${plan.nextClassLevel}；最大生命值 +${plan.hpIncrease}。`,
    });
  };

  const canUndo = canUndoDndLevelAdvancement(character, lastLevelAdvancement);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canUndo && (
        <button
          type="button"
          onClick={() => {
            if (undoLastLevelAdvancement()) toast('已安全撤销上一次等级提升。');
          }}
          className="border border-[#58180d]/35 bg-white/60 px-3 py-1.5 text-xs font-bold text-[#58180d] hover:border-[#58180d]"
        >
          撤销上次升级
        </button>
      )}
      <button
        type="button"
        disabled={character.level >= 20}
        onClick={() => {
          setTargetClassName(character.jobClass);
          setOpen(true);
        }}
        className="border-2 border-[#58180d] bg-[#58180d] px-4 py-1.5 text-sm font-black text-[#fdf6e3] transition hover:bg-[#2c1810] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {character.level < 20 ? '等级管理' : '已达最高等级'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c1810]/80 p-4 font-serif" role="dialog" aria-modal="true" aria-labelledby="dnd-level-dialog-title">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-5 overflow-y-auto border-4 border-[#58180d] bg-[#fdf6e3] p-6 shadow-2xl">
            <button type="button" onClick={resetFlow} aria-label="关闭等级管理" className="absolute right-3 top-2 text-2xl font-black text-[#58180d]">×</button>
            <div className="border-b-2 border-[#58180d] pb-2 pr-8">
              <h2 id="dnd-level-dialog-title" className="text-2xl font-black uppercase text-[#58180d]">等级管理</h2>
              <p className="mt-1 text-sm text-[#58180d]/75">先预览，再确认写入角色库；关闭或取消不会保存草稿。</p>
            </div>

            <section className="space-y-2 border border-[#58180d]/35 bg-white/55 p-4">
              <label htmlFor="level-target-class" className="block text-sm font-black text-[#58180d]">本次等级分配</label>
              <select id="level-target-class" value={targetClass?.name || ''} onChange={(event) => selectClass(event.target.value)} className="w-full border border-[#58180d]/50 bg-white px-3 py-2 font-bold">
                {classes.map((item) => {
                  const allocation = getDndClassLevelAllocation(classLevels, { className: item.name, classId: item.id });
                  return <option key={item.id || item.name} value={item.name}>{allocation ? `${item.name} ${allocation.level} → ${allocation.level + 1}` : `新增兼职：${item.name} 1`}</option>;
                })}
              </select>
              <p className="text-xs text-[#58180d]/70">当前：{classLevels.map((item) => `${item.className}${item.subclass ? `（${item.subclass}）` : ''} ${item.level}`).join(' / ')}</p>
            </section>

            <section className="space-y-2 border border-[#58180d]/35 bg-white/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-[#58180d]">确定性预览</h3>
                <span className="text-xs font-bold">总等级 {character.level} → {plan.nextTotalLevel} · HP +{plan.hpIncrease}</span>
              </div>
              {plan.summary.features.length > 0 ? (
                <ul className="space-y-1 text-sm">{plan.summary.features.map((feature) => <li key={feature.name}><strong>{feature.name}</strong>{feature.description ? `：${feature.description}` : ''}</li>)}</ul>
              ) : <p className="text-xs text-[#58180d]/65">本地声明式资料未列出本级新增特性。</p>}
              {(plan.summary.resources.length > 0 || plan.summary.actions.length > 0) && (
                <p className="text-xs text-[#58180d]/75">资源：{plan.summary.resources.join('、') || '无'} · 动作：{plan.summary.actions.join('、') || '无'}</p>
              )}
            </section>

            {plan.summary.subclassOptions.length > 0 && (
              <section className="space-y-2 border border-[#58180d]/35 bg-white/55 p-4">
                <h3 className="text-sm font-black text-[#58180d]">选择子职业</h3>
                {plan.summary.subclassOptions.map((option) => (
                  <button type="button" key={option.name} onClick={() => setSubclass(option.name)} className={`block w-full border p-2 text-left ${subclass === option.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/25 bg-white'}`}>
                    <strong>{option.name}</strong><span className="mt-1 block text-xs opacity-75">{option.desc}</span>
                  </button>
                ))}
              </section>
            )}

            {plan.requiresAdvancementChoice && (
              <section className="space-y-4 border border-[#58180d]/35 bg-white/55 p-4">
                <div>
                  <h3 className="text-sm font-black text-[#58180d]">属性提升（剩余 {2 - asi.length} 点）</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(Object.keys(ATTR_LABELS) as AttributeName[]).map((attribute) => {
                      const count = asi.filter((item) => item === attribute).length;
                      const value = character.attrs[attribute];
                      const score = value.base + value.pointbuy + value.racebonus + value.extrabonus;
                      return <div key={attribute} className="flex items-center justify-between border border-[#58180d]/25 bg-white p-2 text-xs"><span><strong>{ATTR_LABELS[attribute]}</strong> {score}</span><span className="flex items-center gap-1"><button type="button" disabled={!count} onClick={() => adjustAsi(attribute, -1)} className="h-6 w-6 border disabled:opacity-30">−</button><b>+{count}</b><button type="button" disabled={asi.length >= 2 || score + count >= 20} onClick={() => adjustAsi(attribute, 1)} className="h-6 w-6 bg-[#58180d] text-white disabled:opacity-30">+</button></span></div>;
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#58180d]">或选择通用专长</h3>
                  <ScrollArea className="mt-2 h-40 border border-[#58180d]/25 bg-white">
                    <div className="space-y-1 p-2">{feats.filter((item) => item.category === 'General' && item.checkPrereq(character) && !character.feats.includes(item.name)).map((item) => <button type="button" key={item.name} onClick={() => { setFeat(item.name); setAsi([]); }} className={`block w-full border p-2 text-left text-xs ${feat === item.name ? 'border-[#58180d] bg-[#58180d] text-white' : 'border-[#58180d]/20'}`}><strong>{item.name}</strong><span className="mt-1 block opacity-70">{item.desc}</span></button>)}</div>
                  </ScrollArea>
                </div>
              </section>
            )}

            {plan.issues.length > 0 && (
              <section className="space-y-1" aria-live="polite">
                {plan.issues.map((issue) => <p key={issue.code} className={`text-xs ${issue.severity === 'blocker' ? 'font-bold text-red-700' : 'text-amber-800'}`}>{issue.severity === 'blocker' ? '需要处理：' : '边界提示：'}{issue.message}</p>)}
              </section>
            )}

            <div className="flex justify-end gap-3 border-t-2 border-[#58180d] pt-4">
              <button type="button" onClick={resetFlow} className="border border-[#58180d] px-4 py-2 font-bold text-[#58180d]">取消</button>
              <button type="button" onClick={confirm} disabled={!plan.ready} className="bg-[#58180d] px-4 py-2 font-bold text-white disabled:opacity-40">确认升级</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
