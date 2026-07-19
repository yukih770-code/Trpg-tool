import type { Locale } from '../../i18n';
import { getCombatModeHudModel } from '../../lib/combat/combatModeHud';
import type { Combatant, CombatRuntimeTableState } from '../../lib/combat/combatRuntimeTypes';
import { runtimeAcDisplayLabel, runtimeHpDisplayLabel } from '../../lib/platform/roomRuntimeVisibility';

type Props = {
  locale: Locale;
  state: CombatRuntimeTableState;
  canManage: boolean;
  onSelectCombatant: (combatantId: string) => void;
  onLocateCombatant?: (combatantId: string) => void;
  onRequestDice?: (combatant: Combatant) => void;
  onAdvanceTurn: () => void;
  onPause: () => void;
  onResume: () => void;
  onEndCombat: () => void;
};

function hpLabel(combatant: Combatant): string | null {
  if (combatant.hpDisplay) return runtimeHpDisplayLabel(combatant.hpDisplay);
  if (combatant.hpCurrent === undefined && combatant.hpMax === undefined) return null;
  return `HP ${combatant.hpCurrent ?? '-'}${combatant.hpMax === undefined ? '' : `/${combatant.hpMax}`}`;
}

function acLabel(combatant: Combatant): string | null {
  if (combatant.acDisplay) return runtimeAcDisplayLabel(combatant.acDisplay);
  return combatant.armorClass === undefined ? null : `AC ${combatant.armorClass}`;
}

export function CombatModeHud({ locale, state, canManage, onSelectCombatant, onLocateCombatant, onRequestDice, onAdvanceTurn, onPause, onResume, onEndCombat }: Props) {
  const model = getCombatModeHudModel(state);
  if (model.mode === 'combat_setup' || model.mode === 'not_in_combat' || model.mode === 'ended') return null;
  const active = model.activeCombatant;
  const ordered = model.combatants;
  const paused = state.turn.status === 'paused';
  const zh = locale !== 'en';

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-[#58180d]/30 bg-[#17130f] text-[#fff8e6] shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-bold"><span className="rounded bg-[#f5c518] px-2 py-1 text-[#17130f]">{paused ? (zh ? '战斗暂停' : 'Paused') : (zh ? '回合制战斗' : 'Turn combat')}</span><span>{zh ? `第 ${state.turn.roundNumber} 轮` : `Round ${state.turn.roundNumber}`}</span></div>
        <span className="text-xs text-[#fff8e6]/80">{active ? `${zh ? '当前：' : 'Current: '}${active.displayName}` : (zh ? '等待当前单位' : 'Awaiting combatant')}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 py-2">
        {ordered.map((combatant) => {
          const current = combatant.isCurrent;
          return <button key={combatant.id} type="button" onClick={() => { onSelectCombatant(combatant.id); onLocateCombatant?.(combatant.id); }} className={`min-w-28 rounded-lg border px-2 py-1.5 text-left text-xs transition ${current ? 'border-[#f5c518] bg-[#58180d] shadow-[0_0_0_2px_rgba(245,197,24,.26)]' : 'border-white/15 bg-white/5 hover:bg-white/10'} ${combatant.status !== 'active' ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[10px] font-black">{combatant.displayName.slice(0, 2).toUpperCase()}</span><span className="font-black text-[#f5c518]">{combatant.initiative ?? '-'}</span></div>
            <div className="mt-1 truncate font-bold">{combatant.displayName}</div>
            <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-[#fff8e6]/75">{hpLabel(combatant) && <span>{hpLabel(combatant)}</span>}{combatant.conditions.slice(0, 2).map((condition) => <span key={condition} className="rounded bg-white/10 px-1">{condition}</span>)}</div>
          </button>;
        })}
      </div>

      {active && <div className="grid gap-3 border-t border-white/10 bg-black/15 px-3 py-3 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="text-base font-black">{active.displayName}</span>{active.sourceActorInstanceId && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">{zh ? '已关联单位' : 'Linked unit'}</span>}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#fff8e6]/80">{hpLabel(active) && <span>{hpLabel(active)}</span>}{active.temporaryHp && active.hpDisplay?.kind !== 'stage' ? <span>{zh ? '临时 HP' : 'Temp HP'} {active.temporaryHp}</span> : null}{acLabel(active) && <span>{acLabel(active)}</span>}{active.conditions.length > 0 ? <span>{zh ? '状态：' : 'Conditions: '}{active.conditions.join('、')}</span> : <span>{zh ? '无状态' : 'No conditions'}</span>}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">{onLocateCombatant && <button type="button" onClick={() => onLocateCombatant(active.id)} className="rounded border border-white/20 px-2 py-1 text-[11px] font-bold hover:bg-white/10">{zh ? '移动 / 定位' : 'Move / locate'}</button>}{onRequestDice && <><button type="button" onClick={() => onRequestDice(active)} className="rounded border border-white/20 px-2 py-1 text-[11px] font-bold hover:bg-white/10">{zh ? '动作' : 'Action'}</button><button type="button" onClick={() => onRequestDice(active)} className="rounded border border-white/20 px-2 py-1 text-[11px] font-bold hover:bg-white/10">{zh ? '附赠动作' : 'Bonus action'}</button><button type="button" onClick={() => onRequestDice(active)} className="rounded border border-white/20 px-2 py-1 text-[11px] font-bold hover:bg-white/10">{zh ? '反应' : 'Reaction'}</button><button type="button" onClick={() => onRequestDice(active)} className="rounded border border-white/20 px-2 py-1 text-[11px] font-bold hover:bg-white/10">{zh ? '检定 / 骰子' : 'Check / dice'}</button></>}</div>
        </div>
        {canManage && <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={onAdvanceTurn} disabled={paused} className="rounded bg-[#f5c518] px-3 py-2 text-xs font-black text-[#17130f] disabled:opacity-40">{zh ? '结束回合' : 'End turn'}</button>{paused ? <button type="button" onClick={onResume} className="rounded border border-white/25 px-3 py-2 text-xs font-bold">{zh ? '继续战斗' : 'Resume'}</button> : <button type="button" onClick={onPause} className="rounded border border-white/25 px-3 py-2 text-xs font-bold">{zh ? '暂停' : 'Pause'}</button>}<button type="button" onClick={onEndCombat} className="rounded border border-red-300/40 px-3 py-2 text-xs font-bold text-red-100">{zh ? '结束战斗' : 'End combat'}</button></div>}
      </div>}
    </section>
  );
}
