import { useState } from 'react';
import { sortCombatants, type CombatRuntimeTableState } from '../../lib/combat/combatRuntimeTypes';

export function LiveCombatStrip({ state, ownCombatantId, onSelect, onNext }: {
  state: CombatRuntimeTableState; ownCombatantId?: string;
  onSelect: (id: string) => void; onNext?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (state.turn.status !== 'active' && state.turn.status !== 'paused') return null;
  const ownTurn = !!ownCombatantId && ownCombatantId === state.turn.activeCombatantId;
  return <section className="live-turn-strip" aria-label="先攻与当前回合">
    <strong>{state.turn.status === 'paused' ? '已暂停' : ownTurn ? '你的回合' : '战斗'} · 第 {state.turn.roundNumber} 轮</strong>
    <div className="live-initiative">{sortCombatants(state.combatants).filter((c) => c.status !== 'removed').map((c) => <button type="button" key={c.id} aria-current={c.id === state.turn.activeCombatantId ? 'true' : undefined} onClick={() => onSelect(c.id)} title={`定位 ${c.displayName}`}><span className="mr-2 opacity-70">{c.initiative ?? '—'}</span>{c.displayName}{c.isDefeated ? ' · 已倒下' : ''}</button>)}</div>
    {onNext && <button type="button" className="live-turn-next" disabled={busy || state.turn.status !== 'active'} onClick={async () => { setBusy(true); setError(''); try { await onNext(); } catch { setError('推进失败，请重试。'); } finally { setBusy(false); } }}>下一回合 →</button>}
    {error && <span role="alert">{error}</span>}
  </section>;
}
