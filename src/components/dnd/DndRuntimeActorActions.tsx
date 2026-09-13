import { useEffect, useRef, useState } from 'react';
import { listRoomDndResources, changeRoomDndResource } from '../../lib/platform/roomServerHttpClient';
import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';
import type { DndResourceIntent } from '../../lib/dnd/dndRuntimeResources';
import { mintIntentId } from '../../lib/dnd/dndAttackPendingIntent';
import { DndSavingThrowControls } from './DndSavingThrowControls';

type Props = {
  baseUrl: string; roomId: string; memberId: string; sessionId?: string;
  actors: Array<{ id: string; name: string }>; revision: string;
  events: RoomRuntimeLogEvent[];
  onEvent: (event: RoomRuntimeLogEvent) => void;
};
export function DndRuntimeActorActions(props: Props) {
  const [open, setOpen] = useState(false), [selectedActor, setSelectedActor] = useState('');
  const actorId = props.actors.some(a => a.id === selectedActor) ? selectedActor : props.actors[0]?.id;
  return <details className="mt-2 rounded border border-slate-300 bg-white/95 p-2" onToggle={e => setOpen(e.currentTarget.open)}>
    <summary className="cursor-pointer text-sm font-bold">施法、资源与豁免</summary>
    {props.actors.length > 1 && <label className="my-2 flex gap-2 text-xs">角色<select aria-label="施法与资源角色" value={actorId ?? ''} onChange={e => setSelectedActor(e.target.value)} className="rounded border p-1">{props.actors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
    {open && actorId ? <ActorActions key={`${props.roomId}:${props.sessionId}:${actorId}`} {...props} actorId={actorId} /> : open && <p className="p-2 text-xs">请先选择并准入角色；主持人也可创建战役角色。</p>}
  </details>;
}

function ActorActions({ actorId, ...props }: Props & { actorId: string; key?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof listRoomDndResources>>>();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
  const [spellId, setSpellId] = useState(''), [resourceId, setResourceId] = useState('');
  const [adjustments, setAdjustments] = useState<Record<string, string>>({});
  const key = `dnd-resource:${props.baseUrl}:${props.roomId}:${props.sessionId}:${props.memberId}:${actorId}`;
  const [pending, setPending] = useState<DndResourceIntent | undefined>(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null'); return saved?.actorInstanceId === actorId && typeof saved.intentId === 'string' ? saved : undefined; } catch { return undefined; }
  });
  const busyRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    listRoomDndResources({ baseUrl: props.baseUrl }, props.roomId, props.memberId, actorId)
      .then(next => { if (!cancelled) { setData(next); setError(''); } }).catch(() => { if (!cancelled) setError('无法读取角色资源。请检查连接和角色准入。'); });
    return () => { cancelled = true; };
  }, [actorId, props.baseUrl, props.roomId, props.memberId, props.revision, revision]);
  const submit = async (intent: DndResourceIntent) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError(''); setPending(intent);
    try { sessionStorage.setItem(key, JSON.stringify(intent)); } catch { /* Mounted retry remains available. */ }
    try {
      const result = await changeRoomDndResource({ baseUrl: props.baseUrl }, props.roomId, props.memberId, intent);
      props.onEvent(result.event); setPending(undefined); setRevision(v => v + 1);
      try { sessionStorage.removeItem(key); } catch { /* Best effort. */ }
    } catch (e) { setError(e instanceof Error ? e.message : '保存失败，请重试。'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const begin = (input: Omit<DndResourceIntent, 'intentId' | 'actorInstanceId'>) => { if (!pending) void submit({ ...input, intentId: mintIntentId(), actorInstanceId: actorId }); };
  const spell = data?.spells.find(s => s.id === spellId) ?? data?.spells[0];
  const slots = data?.resources.filter(r => r.resource.kind === 'spellSlot' && (r.resource.level ?? 0) >= (spell?.level ?? 0)) ?? [];
  const slot = slots.find(r => r.id === resourceId) ?? slots.find(r => r.current > 0) ?? slots[0];
  return <div className="space-y-2 pt-2">
    {pending && <div role="status" className="rounded bg-amber-50 p-2 text-xs">有一项待确认操作。<button type="button" disabled={busy} onClick={() => void submit(pending)} className="ml-2 underline">重试同一操作</button><button type="button" disabled={busy} onClick={() => { setPending(undefined); try { sessionStorage.removeItem(key); } catch { /* optional storage */ } }} className="ml-2 underline">已核对历史，取消重试</button></div>}
    {data?.spells.length ? <div className="flex flex-wrap gap-2">
      <select aria-label="施展法术" value={spell?.id} disabled={busy || !!pending} onChange={e => setSpellId(e.target.value)} className="rounded border p-1 text-xs">{data.spells.map(s => <option key={s.id} value={s.id}>{s.name} · {s.level ? `${s.level}环` : '戏法'}</option>)}</select>
      {!!spell?.level && <select aria-label="消耗法术位" value={slot?.id ?? ''} disabled={busy || !!pending} onChange={e => setResourceId(e.target.value)} className="rounded border p-1 text-xs">{slots.length ? slots.map(r => <option key={r.id} value={r.id}>{r.label} · {r.current}/{r.max}</option>) : <option value="">没有可用法术位</option>}</select>}
      <button type="button" disabled={busy || !!pending || !spell || (!!spell.level && !slot?.current)} onClick={() => begin({ operation: 'cast', spellId: spell!.id, resourceId: spell!.level ? slot?.id : undefined })} className="rounded bg-slate-900 px-3 py-1 text-xs text-white disabled:opacity-40">施展并记录</button>
      <p className="w-full text-xs text-slate-500">按已准入角色的法术配置记录施法和消耗；法术效果、目标与持续时间由主持人裁定。</p>
    </div> : null}
    {data?.resources.map(r => <div key={r.id} className="flex flex-wrap items-center gap-2 border-t pt-2 text-xs"><strong>{r.label}</strong><span>{r.current} / {r.max}</span>
      <button type="button" disabled={busy || !!pending || r.current < 1} onClick={() => begin({ operation: 'spend', resourceId: r.id, amount: 1 })} className="rounded border px-2 py-1 disabled:opacity-40">消耗 1</button>
      {data.canAdjust && <><input aria-label={`${r.label} 调整后数值`} type="number" min="0" max={r.max} value={adjustments[r.id] ?? ''} onChange={e => setAdjustments(a => ({ ...a, [r.id]: e.target.value }))} className="w-16 rounded border p-1" /><button type="button" disabled={busy || !!pending || !adjustments[r.id]?.trim()} onClick={() => begin({ operation: 'set', resourceId: r.id, amount: Number(adjustments[r.id]) })} className="rounded border px-2 py-1">主持人调整</button></>}
    </div>)}
    {data && !data.resources.length && !data.spells.length && <p className="text-xs">角色尚未定义资源或可施展法术。请在角色卡配置后由主持人确认。</p>}
    <button type="button" disabled={busy} onClick={() => setRevision(v => v + 1)} className="text-xs underline">刷新角色资源</button>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {data && <DndSavingThrowControls actorId={actorId} baseUrl={props.baseUrl} roomId={props.roomId} memberId={props.memberId} sessionId={props.sessionId} host={data.canAdjust} events={props.events} onEvent={props.onEvent} />}
  </div>;
}
