import { useState } from 'react';

import {
  ALLOWED_DICE_SIDES,
  parseSharedDiceExpression,
  type AllowedDiceSides,
} from '../../lib/platform/sharedDiceExpression';
import type { SharedDiceRollResult } from '../../lib/platform/sharedDiceTypes';

/**
 * SharedDiceDock (M25 / M25.1) — manual shared dice tray (execution-agnostic).
 *
 * AI-LANDMARK: SHARED_DICE_DOCK_V0
 *
 * A MANUAL fallback dice tray for the Runtime bottom Action Dock. It ONLY handles
 * the UI (expression, dice tray, per-die decrement, clear, loading/error, total)
 * and delegates the actual roll to an injected `onRoll`. It does NOT decide
 * randomness authority and does NOT write RuntimeLog — the caller does:
 *   - room mode: onRoll → server (crypto) → room RuntimeLog + broadcast.
 *   - local mode: onRoll → browser RNG → local RuntimeLog.
 * NOT a rules engine (no advantage/disadvantage/system bonuses). For +/- the user
 * types it into the expression (e.g. d20+5). Client parse mirrors the server
 * grammar for tray sync + gating; the actual roll authority is `onRoll`.
 */

export interface SharedDiceDockProps {
  onRoll: (input: { expression: string; label?: string }) => Promise<SharedDiceRollResult>;
  canRoll?: boolean;
}

/** Rebuild a canonical expression from a dice pool + net modifier. */
function buildExpression(dice: Record<number, number>, modifier: number): string {
  const terms = ALLOWED_DICE_SIDES.filter((s) => (dice[s] ?? 0) > 0).map((s) => `${dice[s]}d${s}`);
  let expr = terms.join('+');
  if (modifier > 0) expr += `+${modifier}`;
  else if (modifier < 0) expr += `${modifier}`;
  return expr;
}

/** Sum dice counts per sides from a parsed expression (for tray badges). */
function poolFromExpression(expression: string): { ok: boolean; dice: Record<number, number>; modifier: number } {
  const parsed = parseSharedDiceExpression(expression);
  if (!parsed.ok) return { ok: false, dice: {}, modifier: 0 };
  const dice: Record<number, number> = {};
  for (const t of parsed.parsed.terms) dice[t.sides] = (dice[t.sides] ?? 0) + t.count;
  return { ok: true, dice, modifier: parsed.parsed.modifier };
}

export function SharedDiceDock({ onRoll, canRoll }: SharedDiceDockProps) {
  const [expression, setExpression] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<SharedDiceRollResult | null>(null);

  const pool = poolFromExpression(expression);
  const canSubmit = canRoll !== false && expression.trim() !== '' && pool.ok && !busy;

  const addDie = (sides: AllowedDiceSides) => {
    const p = poolFromExpression(expression);
    const dice = p.ok ? { ...p.dice } : {};
    const modifier = p.ok ? p.modifier : 0;
    dice[sides] = (dice[sides] ?? 0) + 1;
    setExpression(buildExpression(dice, modifier));
    setError(null);
  };

  const removeDie = (sides: AllowedDiceSides) => {
    const p = poolFromExpression(expression);
    if (!p.ok) return;
    const dice = { ...p.dice };
    const next = (dice[sides] ?? 0) - 1;
    if (next <= 0) delete dice[sides];
    else dice[sides] = next;
    setExpression(buildExpression(dice, p.modifier));
  };

  const clearAll = () => {
    setExpression('');
    setError(null);
    setLastRoll(null);
  };

  const roll = () => {
    if (!pool.ok || expression.trim() === '') return;
    setBusy(true);
    setError(null);
    onRoll({ expression: expression.trim() })
      .then((result) => setLastRoll(result))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setBusy(false));
  };

  const dieBtn = 'relative rounded border border-slate-400/50 bg-white/80 px-2 py-1 text-[11px] font-bold text-slate-700 disabled:opacity-40';
  const input = 'rounded border border-slate-400/40 bg-white/80 px-2 py-1 text-[12px] outline-none';
  const btn = 'rounded border border-slate-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide disabled:opacity-40';

  return (
    <div className="flex flex-col gap-1.5">
      {/* Prominent total */}
      <div className="flex items-center gap-3">
        {lastRoll ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black leading-none text-emerald-700">{lastRoll.total}</span>
            <span className="text-[10px] text-slate-500">{lastRoll.normalizedExpression}</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">共享骰子</span>
        )}
        {error && <span className="text-[10px] font-bold text-red-700">{error}</span>}
      </div>

      {/* Dice tray */}
      <div className="flex flex-wrap items-center gap-1">
        {ALLOWED_DICE_SIDES.map((sides) => {
          const count = pool.ok ? pool.dice[sides] ?? 0 : 0;
          return (
            <span key={sides} className="inline-flex items-center">
              <button type="button" className={dieBtn} onClick={() => addDie(sides)} title={`加一颗 d${sides}`}>
                d{sides}
                {count > 0 && <span className="ml-1 text-emerald-700">×{count}</span>}
              </button>
              {count > 0 && (
                <button
                  type="button"
                  className="ml-0.5 rounded border border-slate-400/50 bg-white/70 px-1 text-[10px] font-bold text-slate-500"
                  onClick={() => removeDie(sides)}
                  title={`减一颗 d${sides}`}
                >
                  −
                </button>
              )}
            </span>
          );
        })}
        <button type="button" className="ml-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-600" onClick={clearAll} title="清空骰池与结果">
          清空
        </button>
      </div>

      {/* Free expression + roll */}
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          className={`${input} min-w-[120px] flex-1`}
          value={expression}
          onChange={(e) => { setExpression(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) roll(); }}
          placeholder="表达式，例如 d20+5"
          aria-invalid={expression.trim() !== '' && !pool.ok}
        />
        <button type="button" className={btn} disabled={!canSubmit} onClick={roll}>
          {busy ? '掷骰中…' : '掷骰'}
        </button>
      </div>
      {expression.trim() !== '' && !pool.ok && <div className="text-[10px] text-amber-700">表达式无法解析（仅支持 d4/d6/d8/d10/d12/d20/d100 与 +/- 整数）。</div>}
      {canRoll === false && <div className="text-[10px] italic text-slate-400">当前无法掷骰。</div>}
      {lastRoll && (
        <div className="text-[10px] text-slate-500">
          {lastRoll.terms.map((t, i) => (
            <span key={i}>{i > 0 ? ' + ' : ''}[{t.rolls.join(', ')}]</span>
          ))}
          {lastRoll.modifier !== 0 && <span>{lastRoll.modifier > 0 ? ` + ${lastRoll.modifier}` : ` - ${Math.abs(lastRoll.modifier)}`}</span>}
          <span className="ml-1 font-bold text-slate-700">= {lastRoll.total}</span>
        </div>
      )}
    </div>
  );
}
