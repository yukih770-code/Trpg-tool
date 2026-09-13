import { useRef, useState } from 'react';
import { DND_ABILITY_KEYS, type DndAbilityKey } from '../../lib/dnd/dndLiteActorTypes';
import type { DndSavingThrowIntent, DndSavingThrowFacts } from '../../lib/dnd/dndSavingThrows';
import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';
import { resolveRoomDndSavingThrow } from '../../lib/platform/roomServerHttpClient';
import { mintIntentId } from '../../lib/dnd/dndAttackPendingIntent';

const labels = { strength: '力量', dexterity: '敏捷', constitution: '体质', intelligence: '智力', wisdom: '感知', charisma: '魅力' };
export function DndSavingThrowResult({ event }: { event?: RoomRuntimeLogEvent }) {
  if (!event || (event.kind !== 'runtime.saving_throw_requested' && event.kind !== 'runtime.saving_throw_resolved')) return null;
  const facts = (event.payload as { resolution?: DndSavingThrowFacts })?.resolution;
  if (!facts?.ability) return null;
  return <p className="mt-1 text-xs" role="status">{labels[facts.ability] ?? facts.ability}豁免{facts.total !== undefined ? ` · ${facts.rawRolls?.join(', ')} + (${facts.modifier}) = ${facts.total}` : '请求'}{facts.dc !== undefined ? ` · DC ${facts.dc}` : ''}{facts.outcome ? facts.outcome === 'success' ? ' · 成功' : ' · 失败' : ''}</p>;
}

export function DndSavingThrowControls({ actorId, baseUrl, roomId, memberId, sessionId, host, events, onEvent }: {
  actorId: string; baseUrl: string; roomId: string; memberId: string; sessionId?: string; host: boolean;
  events: RoomRuntimeLogEvent[]; onEvent: (event: RoomRuntimeLogEvent) => void;
}) {
  const [ability, setAbility] = useState<DndAbilityKey>('dexterity'), [dc, setDc] = useState('');
  const [mode, setMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const key = `dnd-save:${baseUrl}:${roomId}:${sessionId}:${memberId}:${actorId}`;
  const [pending, setPending] = useState<DndSavingThrowIntent | undefined>(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null'); return saved?.actorInstanceId === actorId && typeof saved.intentId === 'string' ? saved : undefined; } catch { return undefined; }
  });
  const busyRef = useRef(false);
  const resolved = new Set(events.filter(e => e.kind === 'runtime.saving_throw_resolved').map(e => (e.payload as any)?.resolution?.challengeEventId));
  const requests = events.filter(e => e.kind === 'runtime.saving_throw_requested' && (e.payload as any)?.resolution?.actorInstanceId === actorId && !resolved.has(e.eventId));
  const latest = events.filter(e => e.kind === 'runtime.saving_throw_resolved' && (e.payload as any)?.resolution?.actorInstanceId === actorId).at(-1);
  const submit = async (intent: DndSavingThrowIntent) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setPending(intent);
    try { sessionStorage.setItem(key, JSON.stringify(intent)); } catch { /* Mounted retry remains. */ }
    try {
      const result = await resolveRoomDndSavingThrow({ baseUrl }, roomId, memberId, intent);
      onEvent(result.event); setPending(undefined);
      try { sessionStorage.removeItem(key); } catch { /* optional storage */ }
    } catch (e) { setError(e instanceof Error ? e.message : '豁免保存失败。'); }
    finally { setBusy(false); busyRef.current = false; }
  };
  const begin = (operation: 'request' | 'roll', challengeEventId?: string) => {
    if (pending) return;
    void submit({ intentId: mintIntentId(), actorInstanceId: actorId, operation,
      ...(challengeEventId ? { challengeEventId } : { ability, mode, ...(host && dc.trim() ? { dc: Number(dc) } : {}) }) });
  };
  return <div className="mt-3 space-y-2 border-t pt-2">
    <h4 className="text-sm font-bold">豁免</h4>
    <p className="text-xs text-slate-500">使用已确认角色的豁免加值。状态影响与其他临时修正由主持人裁定；主持人设定的 DC 是公开挑战。</p>
    {pending && <div className="rounded bg-amber-50 p-2 text-xs">有一项待确认豁免。<button type="button" disabled={busy} onClick={() => void submit(pending)} className="ml-2 underline">重试同一豁免</button><button type="button" disabled={busy} onClick={() => { setPending(undefined); try { sessionStorage.removeItem(key); } catch { /* optional */ } }} className="ml-2 underline">已核对历史，取消重试</button></div>}
    {requests.map(request => <div key={request.eventId} className="rounded border border-amber-300 bg-amber-50 p-2"><DndSavingThrowResult event={request} /><button type="button" disabled={busy || !!pending} onClick={() => begin('roll', request.eventId)} className="mt-1 rounded bg-slate-900 px-3 py-1 text-xs text-white">回应豁免请求</button></div>)}
    <div className="flex flex-wrap gap-2"><select aria-label="豁免属性" value={ability} onChange={e => setAbility(e.target.value as DndAbilityKey)} disabled={busy || !!pending} className="rounded border p-1 text-xs">{DND_ABILITY_KEYS.map(a => <option key={a} value={a}>{labels[a]}</option>)}</select>
      <select aria-label="豁免掷骰模式" value={mode} onChange={e => setMode(e.target.value as typeof mode)} disabled={busy || !!pending} className="rounded border p-1 text-xs"><option value="normal">普通</option><option value="advantage">优势</option><option value="disadvantage">劣势</option></select>
      {host && <input aria-label="主持人豁免 DC" type="number" min="0" max="100" placeholder="DC（可选）" value={dc} onChange={e => setDc(e.target.value)} disabled={busy || !!pending} className="w-24 rounded border p-1 text-xs" />}
      <button type="button" disabled={busy || !!pending} onClick={() => begin('roll')} className="rounded border px-2 py-1 text-xs">掷豁免</button>
      {host && <button type="button" disabled={busy || !!pending || !dc.trim()} onClick={() => begin('request')} className="rounded bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-40">请求此角色豁免</button>}
    </div>
    <DndSavingThrowResult event={latest} />
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
