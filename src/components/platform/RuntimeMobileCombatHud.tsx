import { useState } from 'react';

import type { Locale } from '../../i18n';
import { getCombatModeHudModel } from '../../lib/combat/combatModeHud';
import type { Combatant, CombatRuntimeTableState } from '../../lib/combat/combatRuntimeTypes';
import { runtimeAcDisplayLabel, runtimeHpDisplayLabel } from '../../lib/platform/roomRuntimeVisibility';
import type { RuntimeShellMode } from './RuntimeFullscreenShell';

type Props = {
  locale: Locale;
  role: RuntimeShellMode;
  state: CombatRuntimeTableState;
  onLocateCombatant: (combatantId: string) => void;
  isMyTurn?: boolean;
  turnActionKind?: 'actions' | 'dice';
  onOpenTurnAction?: () => void;
  onMoveTurn?: (direction: 'next' | 'previous') => Promise<void>;
  onEndCombat?: () => Promise<void>;
};

/** AI-LANDMARK: RUNTIME_PLAYER_TURN_CALLOUT_V1
 * Compact presentation only: ownership comes from projected Token linkage and
 * the CTA opens an existing role-safe dock panel without performing an action. */

function hpLabel(combatant: Combatant, locale: 'zh' | 'en'): string | undefined {
  if (combatant.hpDisplay) return runtimeHpDisplayLabel(combatant.hpDisplay, locale);
  if (combatant.hpCurrent === undefined && combatant.hpMax === undefined) return undefined;
  return `HP ${combatant.hpCurrent ?? '—'}${combatant.hpMax === undefined ? '' : `/${combatant.hpMax}`}`;
}

function acLabel(combatant: Combatant, locale: 'zh' | 'en'): string | undefined {
  if (combatant.acDisplay) return runtimeAcDisplayLabel(combatant.acDisplay, locale);
  return combatant.armorClass === undefined ? undefined : `AC ${combatant.armorClass}`;
}

export function RuntimeMobileCombatHud({ locale, role, state, onLocateCombatant, isMyTurn = false, turnActionKind = 'dice', onOpenTurnAction, onMoveTurn, onEndCombat }: Props) {
  const model = getCombatModeHudModel(state);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const zh = locale !== 'en';
  const active = model.activeCombatant;
  const paused = model.mode === 'paused';
  const canManage = role === 'host' && !!onMoveTurn && !!onEndCombat;

  if ((model.mode !== 'in_combat' && model.mode !== 'paused') || !active) return null;

  const run = async (operation: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await operation();
    } catch {
      setError(zh ? '战斗状态同步失败，请重试。' : 'Unable to sync combat. Try again.');
    } finally {
      setPending(false);
    }
  };

  const visibleStats = [hpLabel(active, zh ? 'zh' : 'en'), acLabel(active, zh ? 'zh' : 'en')].filter((value): value is string => !!value);
  const conditions = active.conditions.slice(0, 2);

  return (
    <section aria-label={zh ? '当前战斗状态' : 'Current combat status'} className="pointer-events-auto overflow-hidden rounded-xl border border-amber-300/35 bg-[#17130f]/95 text-[#fff8e6] shadow-xl backdrop-blur-md">
      <div className="flex min-h-16 items-stretch">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center bg-[#f5c518] px-1 text-[#17130f]">
          <span className="text-[9px] font-black uppercase tracking-wide">{paused ? (zh ? '暂停' : 'Paused') : isMyTurn ? (zh ? '你的回合' : 'Your turn') : (zh ? '轮次' : 'Round')}</span>
          <span className="text-xl font-black leading-none">{model.roundNumber}</span>
        </div>
        <button type="button" onClick={() => onLocateCombatant(active.id)} className="min-w-0 flex-1 px-2.5 py-2 text-left active:bg-white/10">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-black">{active.displayName}</span>
            <span className="shrink-0 rounded bg-white/10 px-1 py-0.5 text-[9px] font-black text-[#f5c518]">{zh ? '先攻' : 'Init'} {active.initiative ?? '—'}</span>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-1 text-[9px] text-[#fff8e6]/75">
            {visibleStats.map((stat) => <span key={stat} className="shrink-0">{stat}</span>)}
            {conditions.map((condition) => <span key={condition} className="truncate rounded bg-white/10 px-1">{condition}</span>)}
            {visibleStats.length === 0 && conditions.length === 0 && <span>{zh ? '点击定位 Token' : 'Tap to locate token'}</span>}
          </div>
        </button>
        <div className="flex w-20 shrink-0 flex-col justify-center border-l border-white/10 px-2">
          <span className="text-[9px] font-bold text-[#fff8e6]/50">{zh ? '下一位' : 'Next'}</span>
          <span className="truncate text-[10px] font-bold">{model.nextCombatant?.displayName ?? '—'}</span>
        </div>
      </div>

      {canManage && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-1 border-t border-white/10 bg-black/20 p-1.5">
          <button type="button" disabled={pending || paused} onClick={() => void run(() => onMoveTurn('previous'))} className="min-h-9 rounded-lg border border-white/15 px-2 text-[10px] font-bold disabled:opacity-40">← {zh ? '上一位' : 'Previous'}</button>
          <button type="button" disabled={pending || paused} onClick={() => void run(() => onMoveTurn('next'))} className="min-h-9 rounded-lg bg-[#f5c518] px-2 text-[10px] font-black text-[#17130f] disabled:opacity-40">{zh ? '下一位' : 'Next'} →</button>
          <button type="button" disabled={pending} onClick={() => void run(onEndCombat)} className="min-h-9 rounded-lg border border-red-300/35 px-2 text-[10px] font-bold text-red-100 disabled:opacity-40">{zh ? '结束' : 'End'}</button>
        </div>
      )}
      {role === 'player' && isMyTurn && (
        <div className="flex items-center justify-between gap-2 border-t border-amber-200/20 bg-[#f5c518]/10 px-2.5 py-2">
          <div className="min-w-0">
            <div className="text-[11px] font-black text-[#f5c518]">{zh ? '轮到你行动' : 'It is your turn'}</div>
            <div className="truncate text-[9px] text-[#fff8e6]/60">{paused ? (zh ? '战斗已暂停' : 'Combat is paused') : turnActionKind === 'actions' ? (zh ? '选择目标并使用角色动作' : 'Choose a target and use an action') : (zh ? '打开投骰面板' : 'Open the dice panel')}</div>
          </div>
          {onOpenTurnAction && <button type="button" disabled={paused} onClick={onOpenTurnAction} className="min-h-9 shrink-0 rounded-lg bg-[#f5c518] px-3 text-[10px] font-black text-[#17130f] disabled:opacity-40">{turnActionKind === 'actions' ? (zh ? '打开动作' : 'Open actions') : (zh ? '打开投骰' : 'Open dice')}</button>}
        </div>
      )}
      {error && <div role="alert" className="border-t border-red-300/20 bg-red-950/60 px-2.5 py-1.5 text-[9px] text-red-100">{error}</div>}
    </section>
  );
}
