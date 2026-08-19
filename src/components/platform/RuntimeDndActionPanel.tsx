import { useState } from 'react';

import type { RoomRuntimeDndActionShortcut } from '../../lib/platform/roomRuntimeActorProjectionTypes';
import type { SharedDiceRollMode, SharedDiceRollResult } from '../../lib/platform/sharedDiceTypes';

export interface RuntimeDndActionPanelProps {
  characterName?: string;
  actions: RoomRuntimeDndActionShortcut[];
  targets?: Array<{ id: string; label: string }>;
  selectedTargetId?: string;
  onSelectTarget?: (targetId: string | undefined) => void;
  /**
   * Submits the roll to the authoritative room dice path. When it resolves, the
   * panel shows THAT result; it never recomputes a roll of its own.
   */
  onRoll?: (input: { expression: string; label: string; mode?: SharedDiceRollMode; dc?: number }) => Promise<SharedDiceRollResult> | void;
}

const ROLL_MODE_OPTIONS: Array<{ id: SharedDiceRollMode; label: string }> = [
  { id: 'normal', label: '普通' },
  { id: 'advantage', label: '优势' },
  { id: 'disadvantage', label: '劣势' },
];

/**
 * Player-facing DND action palette for the Room Runtime.
 *
 * It is deliberately a roll launcher, not an authority surface: target choice
 * only enriches the append-only dice label, while hit resolution and HP changes
 * remain under the existing host-confirmed combat controls.
 *
 * T1: d20 rolls may carry 普通 / 优势 / 劣势 as semantic intent, and the latest
 * AUTHORITATIVE server result is shown inline so a player no longer has to open
 * the log drawer to see their own roll. The RuntimeLog remains the shared,
 * durable history; this strip is only the initiating player's echo.
 */
export function RuntimeDndActionPanel({
  characterName,
  actions,
  targets = [],
  selectedTargetId,
  onSelectTarget,
  onRoll,
}: RuntimeDndActionPanelProps) {
  const [rollMode, setRollMode] = useState<SharedDiceRollMode>('normal');
  const [lastRoll, setLastRoll] = useState<SharedDiceRollResult | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);

  const selectedTarget = targets.find((target) => target.id === selectedTargetId);
  const labelPrefix = characterName?.trim() || '我的角色';
  const targetSuffix = selectedTarget ? ` → ${selectedTarget.label}` : '';

  /**
   * Fire the authoritative roll and display whatever the server returns. No
   * local dice are rolled here and no result is recomputed.
   */
  const submitRoll = (input: { expression: string; label: string; mode?: SharedDiceRollMode }) => {
    if (!onRoll) return;
    setRollError(null);
    const pending = onRoll(input) as Promise<SharedDiceRollResult> | undefined;
    if (!pending || typeof pending.then !== 'function') return;
    void pending
      .then((result) => { if (result) setLastRoll(result); })
      .catch((error) => setRollError(error instanceof Error ? error.message : String(error)));
  };

  const actionPresentation = (action: RoomRuntimeDndActionShortcut) => {
    switch (action.kind) {
      case 'weapon_attack': return { badge: '武器', tone: 'bg-[#8b3a2f]/10 text-[#8b3a2f]', summary: '武器攻击' };
      case 'spell_attack': return { badge: '法术', tone: 'bg-violet-100 text-violet-800', summary: '法术攻击' };
      case 'spell_cast': return { badge: action.availability === 'prepared' ? '已准备' : '已知法术', tone: 'bg-indigo-100 text-indigo-800', summary: `${action.spellLevel === 0 ? '戏法' : action.spellLevel === undefined ? '法术' : `${action.spellLevel} 环法术`}${action.activation ? ` · ${action.activation}` : ''}${action.range ? ` · ${action.range}` : ''}` };
      case 'save_dc': return { badge: '豁免', tone: 'bg-sky-100 text-sky-800', summary: action.saveDc === undefined ? '豁免检定' : `${action.saveAbility ? `${saveAbilityLabel(action.saveAbility)}豁免 ` : ''}DC ${action.saveDc}` };
      case 'damage_only': return { badge: '伤害', tone: 'bg-amber-100 text-amber-900', summary: '效果伤害' };
      default: return { badge: '动作', tone: 'bg-slate-200 text-slate-700', summary: '自定义动作' };
    }
  };

  return (
    <div className="space-y-3 text-left">
      <header className="rounded-md border border-[#8b3a2f]/25 bg-[#fff5ed] p-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b3a2f]/75">DND 动作</div>
        <div className="mt-0.5 text-sm font-black text-[#4a1e17]">{labelPrefix}的回合操作</div>
        <p className="mt-1 text-[10px] leading-relaxed text-[#6e4237]">先选择目标，再掷攻击或伤害。骰子会公开记录；命中和伤害结算仍由主持人确认。</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#6e4237]">d20 检定</span>
          <div className="inline-flex overflow-hidden rounded border border-[#8b3a2f]/35">
            {ROLL_MODE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={rollMode === option.id}
                onClick={() => setRollMode(option.id)}
                className={`px-2 py-1 text-[10px] font-bold ${rollMode === option.id ? 'bg-[#8b3a2f] text-white' : 'bg-white/80 text-[#6b281d]'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="text-[9px] text-[#6e4237]/75">只作用于攻击与检定，伤害骰不受影响。</span>
        </div>
      </header>

      {(lastRoll || rollError) && (
        <div className="rounded-md border border-emerald-600/25 bg-emerald-50/70 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/75">本次结果（服务器判定）</div>
          {rollError ? (
            <p className="mt-1 text-[11px] font-bold text-red-700">{rollError}</p>
          ) : lastRoll ? (
            <>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-black leading-none text-emerald-700">{lastRoll.total}</span>
                <span className="text-[10px] text-slate-500">{lastRoll.normalizedExpression}</span>
                {lastRoll.mode && lastRoll.mode !== 'normal' && (
                  <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    {lastRoll.mode === 'advantage' ? '优势' : '劣势'}
                  </span>
                )}
                {lastRoll.dc !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${lastRoll.outcome === 'success' ? 'bg-emerald-600/15 text-emerald-800' : 'bg-red-600/10 text-red-700'}`}>
                    DC {lastRoll.dc} {lastRoll.outcome === 'success' ? '成功' : '失败'}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[10px] text-slate-600">
                {lastRoll.rawRolls && lastRoll.keptRoll !== undefined ? (
                  <span>
                    骰面 [{lastRoll.rawRolls.join(', ')}]
                    {lastRoll.rawRolls.length > 1 && <span className="font-bold text-slate-800"> → 采用 {lastRoll.keptRoll}</span>}
                  </span>
                ) : (
                  <span>骰面 {lastRoll.terms.map((term) => `[${term.rolls.join(', ')}]`).join(' + ')}</span>
                )}
                {lastRoll.modifier !== 0 && <span>{lastRoll.modifier > 0 ? ` + ${lastRoll.modifier}` : ` - ${Math.abs(lastRoll.modifier)}`}</span>}
                {lastRoll.isNatural20 && <span className="ml-1 font-bold text-amber-700">天然 20</span>}
                {lastRoll.isNatural1 && <span className="ml-1 font-bold text-slate-500">天然 1</span>}
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-500">完整记录已写入会话日志；命中与伤害结算仍由主持人确认。</p>
            </>
          ) : null}
        </div>
      )}

      <div className="rounded-md border border-slate-300/60 bg-white/75 p-2">
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
          当前目标
          <select
            value={selectedTargetId ?? ''}
            onChange={(event) => onSelectTarget?.(event.target.value || undefined)}
            className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700"
          >
            <option value="">未选择目标</option>
            {targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
          </select>
        </label>
        {targets.length === 0 && <p className="mt-1 text-[9px] leading-relaxed text-slate-500">战斗开始后，可从地图或先攻栏选中目标。</p>}
      </div>

      {actions.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-400/45 bg-white/55 p-3 text-[11px] leading-relaxed text-slate-600">
          这个角色还没有可用动作。可先使用下方通用 d20；主持人可在战役角色资料中补充武器、法术或其他动作的攻击与伤害骰。
        </div>
      ) : (
        <div className="grid gap-2">
          {actions.map((action) => {
            const attack = action.attackBonus === undefined ? undefined : `d20${action.attackBonus >= 0 ? '+' : ''}${action.attackBonus}`;
            const presentation = actionPresentation(action);
            return (
              <article key={action.id} className="rounded-md border border-slate-300/65 bg-white/85 p-2.5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-[12px] font-black text-slate-800">{action.name}</h4>
                    <p className="mt-0.5 text-[9px] text-slate-500">
                      {presentation.summary}{attack ? ` · 攻击 ${attack}` : ''}{action.damageFormula ? ` · 伤害 ${action.damageFormula}${action.damageType ? ` ${action.damageType}` : ''}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${presentation.tone}`}>{presentation.badge}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {attack && <button type="button" disabled={!onRoll} onClick={() => submitRoll({ expression: attack, label: `${labelPrefix} · ${action.name} 攻击${targetSuffix}`, mode: rollMode })} className="rounded border border-[#8b3a2f]/45 bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#6b281d] disabled:opacity-45">{action.kind === 'spell_attack' ? '法术攻击' : '攻击掷骰'}</button>}
                  {action.damageFormula && <button type="button" disabled={!onRoll} onClick={() => submitRoll({ expression: action.damageFormula!, label: `${labelPrefix} · ${action.name} 伤害${targetSuffix}` })} className="rounded border border-amber-500/45 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-900 disabled:opacity-45">掷伤害 {action.damageFormula}</button>}
                  {action.kind === 'spell_cast' && <span className="rounded border border-indigo-300/60 bg-indigo-50 px-2.5 py-1.5 text-[10px] font-bold text-indigo-800">施放效果由主持人确认</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 rounded-md border border-slate-300/60 bg-slate-50/80 p-2">
        <div>
          <div className="text-[10px] font-bold text-slate-700">通用检定</div>
          <div className="text-[9px] text-slate-500">没有专用动作时使用。</div>
        </div>
        <button type="button" disabled={!onRoll} onClick={() => submitRoll({ expression: '1d20', label: `${labelPrefix} 检定${targetSuffix}`, mode: rollMode })} className="rounded border border-slate-400/50 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 disabled:opacity-45">掷 d20</button>
      </div>
    </div>
  );
}

function saveAbilityLabel(ability: NonNullable<RoomRuntimeDndActionShortcut['saveAbility']>): string {
  const labels: Record<NonNullable<RoomRuntimeDndActionShortcut['saveAbility']>, string> = {
    strength: '力量', dexterity: '敏捷', constitution: '体质', intelligence: '智力', wisdom: '感知', charisma: '魅力',
  };
  return labels[ability];
}
