import type { CharacterClearanceDetails } from '../../lib/platform/characterClearanceDetails';

export interface CharacterClearanceDetailsPanelProps {
  details?: CharacterClearanceDetails;
  title?: string;
  defaultOpen?: boolean;
}

function List({ label, values }: { label: string; values?: string[] }) {
  if (!values?.length) return null;
  return <p><span className="font-bold text-slate-600">{label}：</span>{values.join('、')}</p>;
}

/** Compact disclosure for player submission preview and host review. */
export function CharacterClearanceDetailsPanel({ details, title = '角色审核信息', defaultOpen = false }: CharacterClearanceDetailsPanelProps) {
  const identity = details?.identity;
  const combat = details?.combat;
  const review = details?.review;
  if (!details || !identity) return <p className="text-[10px] text-slate-500">未提供扩展角色信息；仍可按基础摘要审核。</p>;

  const headline = [identity.speciesOrRace, identity.classSummary, identity.level !== undefined ? `${identity.level} 级` : undefined]
    .filter(Boolean).join(' · ') || '基础信息待补充';
  return (
    <details open={defaultOpen} className="mt-2 rounded border border-slate-300/50 bg-white/60 px-2 py-1.5 text-[10px] text-slate-600">
      <summary className="cursor-pointer font-bold text-slate-700">
        {title} · {identity.name} <span className="font-normal text-slate-500">{headline}{combat?.hpMax !== undefined ? ` · HP ${combat.hpCurrent ?? combat.hpMax}/${combat.hpMax}` : ''}{combat?.ac !== undefined ? ` · AC ${combat.ac}` : ''}</span>
      </summary>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <section><b className="text-slate-700">基础信息</b><p>{identity.sourceType}{identity.background ? ` · ${identity.background}` : ''}{identity.alignment ? ` · ${identity.alignment}` : ''}</p><p>{identity.subclassSummary ?? ''}</p></section>
        <section><b className="text-slate-700">战斗数据</b><p>{combat?.hpMax !== undefined ? `HP ${combat.hpCurrent ?? combat.hpMax}/${combat.hpMax}` : 'HP 未提供'}{combat?.tempHp ? ` · 临时 HP ${combat.tempHp}` : ''}{combat?.ac !== undefined ? ` · AC ${combat.ac}` : ''}{combat?.speed !== undefined ? ` · 速度 ${combat.speed}` : ''}</p><List label="豁免" values={combat?.saves} /><List label="技能" values={combat?.skills} /></section>
        <section><b className="text-slate-700">装备</b><List label="武器" values={details.equipment.equippedWeapons} /><List label="护甲" values={details.equipment.equippedArmor} /><List label="物品" values={details.equipment.notableItems} /><p>{details.equipment.shield ? `盾牌：${details.equipment.shield}` : ''}{details.equipment.currencySummary ? ` ${details.equipment.currencySummary}` : ''}</p></section>
        <section><b className="text-slate-700">特性 / 专长</b><List label="种族" values={details.traits.racialTraits} /><List label="职业" values={details.traits.classFeatures} /><List label="专长" values={details.traits.feats} /><List label="熟练" values={details.traits.proficiencies} /></section>
        <section><b className="text-slate-700">永久 Buff / 长期效果</b><List label="Buff" values={details.effects.permanentBuffs} /><List label="状态" values={details.effects.longTermConditions} /><List label="诅咒" values={details.effects.curses} /><List label="自定义" values={details.effects.customEffects} /></section>
        <section><b className="text-slate-700">人设 / 背景</b><p>{identity.roleplayProfile ?? identity.playerNotes ?? '未提供'}</p></section>
      </div>
      <div className="mt-2 border-t border-slate-200 pt-1.5"><b className="text-slate-700">缺失信息 / 审核提示</b><p>{review?.summary ?? '仅作主持人审核摘要，不执行规则合法性校验。'}</p><List label="待补充" values={review?.missingFields} /><List label="提示" values={review?.warnings} /></div>
    </details>
  );
}
