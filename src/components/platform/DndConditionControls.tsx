import { useRef, useState } from 'react';
import { DND_CONDITIONS, dndConditionLabel, type DndConditionId } from '../../lib/dnd/dndConditions';
import type { CombatantConditionState } from '../../lib/combat/combatRuntimeTypes';
import { mintIntentId } from '../../lib/dnd/dndAttackPendingIntent';

export type DndConditionChange = { intentId: string; targetCombatantId: string; conditionId: DndConditionId; level: number };
export function DndConditionControls({ combatantId, states = [], english = false, onChange }: {
  combatantId: string; states?: CombatantConditionState[]; english?: boolean;
  onChange: (intent: DndConditionChange) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef<DndConditionChange>();
  const submit = async (conditionId: DndConditionId, level: number) => {
    if (busy) return;
    const prior = pending.current;
    const intent = prior?.targetCombatantId === combatantId && prior.conditionId === conditionId && prior.level === level ? prior : { intentId: mintIntentId(), targetCombatantId: combatantId, conditionId, level };
    pending.current = intent; setBusy(true); setError('');
    try { await onChange(intent); pending.current = undefined; }
    catch { setError(english ? 'Could not save. Retry the same change after reconnecting.' : '保存失败，恢复连接后请重试同一操作。'); }
    finally { setBusy(false); }
  };
  return <div className="mt-2 border-t pt-2">
    <p className="text-xs font-bold">{english ? 'Conditions' : '状态'}</p>
    <p className="my-1 text-[11px] text-slate-500">{english ? 'Tracked here; effects, duration and recovery are adjudicated by the GM.' : '此处记录状态；效果、持续时间和恢复由主持人裁定。'}</p>
    <div className="flex flex-wrap gap-1">{DND_CONDITIONS.filter(c => c.id !== 'exhaustion').map(c => {
      const active = states.some(s => s.systemId === 'dnd5e-2024' && s.conditionId === c.id);
      return <button key={c.id} type="button" disabled={busy} aria-pressed={active} onClick={() => void submit(c.id, active ? 0 : 1)} className={`rounded border px-2 py-1 text-xs ${active ? 'bg-amber-100 text-amber-900' : 'bg-white text-slate-700'}`}>{dndConditionLabel({ conditionId: c.id }, english)}</button>;
    })}</div>
    <label className="mt-2 flex items-center gap-2 text-xs">{english ? 'Exhaustion level' : '力竭等级'}<select disabled={busy} value={states.find(s => s.systemId === 'dnd5e-2024' && s.conditionId === 'exhaustion')?.level ?? 0} onChange={e => void submit('exhaustion', Number(e.target.value))} className="rounded border bg-white p-1">{[0, 1, 2, 3, 4, 5, 6].map(level => <option key={level} value={level}>{level}</option>)}</select></label>
    {error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}
  </div>;
}
