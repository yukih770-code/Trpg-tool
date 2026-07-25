import { useEffect, useMemo, useRef, useState } from 'react';

import type { Locale } from '../../i18n';
import { hasCombatRuntimeEvents, type CombatRuntimeReplayEvent } from '../../lib/combat/combatRuntimeReplay';
import { sortCombatants, type CombatRuntimeEventDraft, type CombatRuntimeTableState, type Combatant, type CombatantKind } from '../../lib/combat/combatRuntimeTypes';
import { useCombatRuntimeTable } from '../../lib/combat/useCombatRuntimeTable';
import type { MapToken } from '../../lib/map/mapRuntimeTypes';
import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';
import { runtimeAcDisplayLabel, runtimeHpDisplayLabel } from '../../lib/platform/roomRuntimeVisibility';
import { CombatModeHud } from './CombatModeHud';

type RuntimeRole = 'host' | 'player' | 'spectator';

export interface RoomRuntimeCombatPanelProps {
  locale: Locale;
  scopeKey: string;
  role: RuntimeRole;
  roomEvents: RoomRuntimeLogEvent[];
  placedTokens: MapToken[];
  myActorBindingId?: string;
  selectedCombatantId?: string;
  onSelectCombatant: (combatantId: string) => void;
  onLocateCombatant: (combatantId: string) => void;
  onStateChange: (state: CombatRuntimeTableState) => void;
  onAppendEvent: (event: CombatRuntimeEventDraft) => Promise<void>;
  onQuickRoll?: (input: { expression: string; label: string }) => Promise<unknown>;
}

function numberValue(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function tokenKind(token: MapToken): CombatantKind {
  if (token.kind === 'playerCharacter') return 'character';
  if (token.kind === 'npc' || token.kind === 'monster') return 'npc';
  return 'other';
}

function linkedCombatant(token: MapToken, combatants: readonly Combatant[]): Combatant | undefined {
  return combatants.find((combatant) =>
    combatant.mapTokenId === token.id
    || (!!token.combatantId && combatant.id === token.combatantId)
    || (!!token.sourceCombatantId && combatant.id === token.sourceCombatantId)
    || (!!token.sourceActorInstanceId && combatant.sourceActorInstanceId === token.sourceActorInstanceId),
  );
}

function statusLabel(status: CombatRuntimeTableState['turn']['status'], zh: boolean): string {
  if (status === 'active') return zh ? '进行中' : 'Active';
  if (status === 'paused') return zh ? '已暂停' : 'Paused';
  if (status === 'ended') return zh ? '已结束' : 'Ended';
  return zh ? '准备中' : 'Setup';
}

function initials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.slice(0, 1)).join('').toUpperCase() || '?';
}

function combatHpLabel(combatant: Combatant, zh: boolean): string {
  if (combatant.hpDisplay) return runtimeHpDisplayLabel(combatant.hpDisplay, zh ? 'zh' : 'en');
  return `HP ${combatant.hpCurrent ?? '—'}${combatant.hpMax === undefined ? '' : `/${combatant.hpMax}`}`;
}

function combatAcLabel(combatant: Combatant, zh: boolean): string {
  if (combatant.acDisplay) return runtimeAcDisplayLabel(combatant.acDisplay, zh ? 'zh' : 'en');
  return `AC ${combatant.armorClass ?? '—'}`;
}

/**
 * The Room Runtime combat surface owns no authority of its own. Every host
 * mutation is persisted through the Room RuntimeLog before other clients replay
 * it; player and spectator branches intentionally have no mutation handlers.
 */
export function RoomRuntimeCombatPanel({ locale, scopeKey, role, roomEvents, placedTokens, myActorBindingId, selectedCombatantId, onSelectCombatant, onLocateCombatant, onStateChange, onAppendEvent, onQuickRoll }: RoomRuntimeCombatPanelProps) {
  const table = useCombatRuntimeTable(scopeKey);
  const restoredKeyRef = useRef('');
  const [error, setError] = useState<string | null>(null);
  const [hpAdjustment, setHpAdjustment] = useState('');
  const zh = locale !== 'en';
  const canManage = role === 'host';
  const combatEvents = useMemo<CombatRuntimeReplayEvent[]>(() => roomEvents
    .filter((event) => event.kind.startsWith('combat.'))
    .map((event) => ({
      eventKind: event.kind,
      payload: event.payload && typeof event.payload === 'object' && !Array.isArray(event.payload) ? event.payload as Record<string, unknown> : {},
      seq: event.seq,
      createdAt: event.createdAt,
    })), [roomEvents]);
  const combatKey = combatEvents.map((event) => `${event.seq}:${event.eventKind}`).join('|');

  useEffect(() => {
    onStateChange(table.state);
  }, [onStateChange, table.state]);

  useEffect(() => {
    const restoreKey = `${scopeKey}:${combatKey}`;
    if (!hasCombatRuntimeEvents(combatEvents) || restoredKeyRef.current === restoreKey) return;
    table.restore(combatEvents);
    restoredKeyRef.current = restoreKey;
  }, [combatEvents, combatKey, scopeKey, table.restore]);

  const ordered = sortCombatants(table.state.combatants);
  const active = table.state.turn.activeCombatantId ? table.state.combatants.find((combatant) => combatant.id === table.state.turn.activeCombatantId) : undefined;
  const selected = table.state.combatants.find((combatant) => combatant.id === selectedCombatantId) ?? active;
  const myToken = myActorBindingId ? placedTokens.find((token) => token.actorBindingId === myActorBindingId) : undefined;
  const myCombatant = myToken ? linkedCombatant(myToken, table.state.combatants) : undefined;

  const persist = (event: CombatRuntimeEventDraft | null) => {
    if (!event) return;
    setError(null);
    void onAppendEvent(event).catch(() => setError(zh ? '战斗记录保存失败，请检查同步后重试。' : 'Unable to save the combat update.'));
  };

  const addToken = (token: MapToken) => {
    if (!canManage || linkedCombatant(token, table.state.combatants)) return;
    const result = table.addCombatant({
      displayName: token.displayName ?? token.name,
      kind: tokenKind(token),
      sourceType: token.sourceActorInstanceId ? 'campaign_actor' : token.kind === 'playerCharacter' ? 'manual_pc' : token.kind === 'npc' || token.kind === 'monster' ? 'manual_npc' : 'unknown',
      sourceActorInstanceId: token.sourceActorInstanceId ?? token.campaignActorId,
      mapTokenId: token.id,
      controllerUserId: token.controlledByUserId ?? token.ownerUserId,
      initiativeModifier: 0,
      initiativeFormula: '1d20 + modifier',
      armorClass: undefined,
      hpCurrent: token.hpSummary?.current,
      hpMax: token.hpSummary?.max,
      temporaryHp: token.hpSummary?.temporary,
      conditions: token.conditionSummary ?? [],
    });
    onSelectCombatant(result.combatant.id);
    persist(result.event);
  };

  const update = (combatant: Combatant, patch: Partial<Omit<Combatant, 'id'>>) => persist(table.updateCombatant(combatant.id, patch));
  const applyHpAdjustment = (combatant: Combatant, kind: 'damage' | 'healing') => {
    const adjustment = numberValue(hpAdjustment);
    if (adjustment === undefined || adjustment <= 0 || combatant.hpCurrent === undefined) return;
    const sourceName = zh ? '主持人确认' : 'Host confirmed';
    persist(kind === 'damage'
      ? table.damage(combatant.id, adjustment, { sourceName })
      : table.heal(combatant.id, adjustment, { sourceName }));
    setHpAdjustment('');
  };
  const linkedToken = active ? placedTokens.find((token) => linkedCombatant(token, table.state.combatants)?.id === active.id) : undefined;

  return (
    <section className="rounded border border-slate-400/30 bg-white/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{zh ? '战斗控制' : 'Combat controls'}</div>
          <div className="mt-0.5 text-sm font-black text-slate-800">{statusLabel(table.state.turn.status, zh)}{table.state.turn.status !== 'setup' ? ` · ${zh ? `第 ${table.state.turn.roundNumber} 轮` : `Round ${table.state.turn.roundNumber}`}` : ''}</div>
        </div>
        <span className="rounded-full bg-slate-900/8 px-2 py-1 text-[10px] font-bold text-slate-600">{ordered.length} {zh ? '个战斗单位' : 'combatants'}</span>
      </div>

      <div className="mt-3">
        <CombatModeHud
          locale={locale}
          state={table.state}
          canManage={canManage}
          onSelectCombatant={onSelectCombatant}
          onLocateCombatant={onLocateCombatant}
          onRequestDice={onQuickRoll ? (combatant) => void onQuickRoll({ expression: '1d20', label: `${combatant.displayName} ${zh ? '检定' : 'check'}` }) : undefined}
          onAdvanceTurn={() => persist(table.moveTurn('next'))}
          onPause={() => persist(table.pause())}
          onResume={() => persist(table.resume())}
          onEndCombat={() => persist(table.end())}
        />
      </div>

      {active ? (
        <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-50/80 p-2.5">
          <div className="flex items-center gap-2">
            {linkedToken?.imageUrl ? <img src={linkedToken.imageUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-xs font-black text-white">{initials(active.displayName)}</span>}
            <div className="min-w-0"><div className="truncate text-sm font-black text-slate-800">{active.displayName}</div><div className="text-[10px] text-slate-600">{zh ? '当前回合' : 'Current turn'} · {zh ? '先攻' : 'Init'} {active.initiative ?? '—'}</div></div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-700">
            <span className="rounded bg-white px-1.5 py-1">{combatHpLabel(active, zh)}</span>
            {active.hpDisplay?.kind !== 'stage' && <span className="rounded bg-white px-1.5 py-1">{zh ? '临时' : 'Temp'} {active.temporaryHp ?? 0}</span>}
            <span className="rounded bg-white px-1.5 py-1">{combatAcLabel(active, zh)}</span>
            <span className="rounded bg-white px-1.5 py-1">{active.conditions.length ? active.conditions.join('、') : (zh ? '无状态' : 'No conditions')}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => { onSelectCombatant(active.id); onLocateCombatant(active.id); }} className="rounded border border-slate-400/40 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">{zh ? '定位 Token' : 'Locate token'}</button>
            {role === 'player' && myCombatant?.id === active.id && onQuickRoll && <button type="button" onClick={() => void onQuickRoll({ expression: '1d20', label: `${active.displayName} ${zh ? '检定' : 'check'}` })} className="rounded border border-slate-400/40 bg-white px-2 py-1 text-[10px] font-bold text-slate-700">{zh ? '掷 d20' : 'Roll d20'}</button>}
          </div>
        </div>
      ) : <p className="mt-3 text-[11px] leading-5 text-slate-500">{zh ? '将地图上的单位加入战斗，然后开始战斗。已有先攻会被保留，缺失先攻会自动掷骰。' : 'Add placed tokens, then start combat. Existing initiative is preserved.'}</p>}

      {canManage && (
        <>
          <div className="mt-3 border-t border-slate-300/40 pt-3">
            <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold text-slate-700">{zh ? '已放置单位' : 'Placed tokens'}</span><span className="text-[10px] text-slate-500">{zh ? '从地图加入战斗' : 'Add from map'}</span></div>
            {placedTokens.length === 0 ? <p className="mt-1 text-[11px] text-slate-500">{zh ? '地图上还没有可加入的 Token。' : 'No placed tokens yet.'}</p> : <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{placedTokens.map((token) => { const joined = linkedCombatant(token, table.state.combatants); return <button key={token.id} type="button" disabled={!!joined} onClick={() => addToken(token)} className="rounded border border-slate-400/35 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 disabled:opacity-45">{joined ? `${token.displayName ?? token.name} · ${zh ? '已加入' : 'Added'}` : `＋ ${token.displayName ?? token.name}`}</button>; })}</div>}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => persist(table.start())} disabled={ordered.length === 0 || table.state.turn.status === 'active'} className="rounded bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-40">{zh ? '开始战斗' : 'Start combat'}</button>
            <button type="button" onClick={() => persist(table.rollInitiativeGroup('missing'))} disabled={ordered.length === 0} className="rounded border border-slate-400/40 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 disabled:opacity-40">{zh ? '掷缺失先攻' : 'Roll missing'}</button>
            <button type="button" onClick={() => persist(table.rollInitiativeGroup('all'))} disabled={ordered.length === 0} className="rounded border border-slate-400/40 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 disabled:opacity-40">{zh ? '重新掷先攻' : 'Reroll initiative'}</button>
            <button type="button" onClick={() => persist(table.moveTurn('next'))} disabled={table.state.turn.status !== 'active'} className="rounded border border-slate-400/40 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 disabled:opacity-40">{zh ? '下一回合' : 'Next turn'}</button>
            {table.state.turn.status === 'active' && <button type="button" onClick={() => persist(table.pause())} className="rounded border border-slate-400/40 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700">{zh ? '暂停' : 'Pause'}</button>}
            {table.state.turn.status === 'paused' && <button type="button" onClick={() => persist(table.resume())} className="rounded border border-slate-400/40 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700">{zh ? '继续' : 'Resume'}</button>}
            {(table.state.turn.status === 'active' || table.state.turn.status === 'paused') && <button type="button" onClick={() => persist(table.end())} className="rounded border border-red-400/40 bg-white px-2.5 py-1.5 text-[10px] font-bold text-red-700">{zh ? '结束战斗' : 'End combat'}</button>}
          </div>
        </>
      )}

      {role === 'player' && <div className="mt-3 rounded bg-slate-900/5 px-2.5 py-2 text-[11px] text-slate-600">{myCombatant ? `${zh ? '我的角色' : 'My character'}：${myCombatant.displayName} · ${combatHpLabel(myCombatant, zh)} · ${combatAcLabel(myCombatant, zh)}` : (zh ? '你的已准入角色尚未加入战斗。' : 'Your admitted character is not in combat.')}</div>}
      {role === 'spectator' && <p className="mt-3 rounded bg-slate-900/5 px-2.5 py-2 text-[11px] text-slate-600">{zh ? '旁观者可以查看回合顺序与战斗状态，不能修改战斗。' : 'Spectators can view combat but cannot change it.'}</p>}

      {ordered.length > 0 && <div className="mt-3 space-y-1.5 border-t border-slate-300/40 pt-3">{ordered.map((combatant) => {
        const current = combatant.id === table.state.turn.activeCombatantId;
        const selectedNow = combatant.id === selected?.id;
        return <div key={combatant.id} className={`rounded border px-2 py-2 ${current ? 'border-amber-400/55 bg-amber-50/70' : 'border-slate-300/45 bg-white/70'}`}>
          <button type="button" onClick={() => { onSelectCombatant(combatant.id); onLocateCombatant(combatant.id); }} className="flex w-full items-center justify-between gap-2 text-left"><span className="min-w-0 truncate text-[11px] font-bold text-slate-800">{current ? '● ' : ''}{combatant.displayName}</span><span className="text-[10px] font-black text-slate-600">{zh ? '先攻' : 'Init'} {combatant.initiative ?? '—'}</span></button>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-600"><span>{combatHpLabel(combatant, zh)}</span>{combatant.hpDisplay?.kind !== 'stage' && <><span>·</span><span>{zh ? '临时' : 'Temp'} {combatant.temporaryHp ?? 0}</span></>}<span>·</span><span>{combatAcLabel(combatant, zh)}</span>{combatant.conditions.length > 0 && <><span>·</span><span>{combatant.conditions.join('、')}</span></>}</div>
          {canManage && selectedNow && <div className="mt-2 rounded border border-slate-300/70 bg-slate-50 p-2"><div className="text-[10px] font-bold text-slate-700">{zh ? '主持人确认结算' : 'Host-confirmed adjustment'}</div><div className="mt-1 flex flex-wrap items-center gap-1.5"><input value={hpAdjustment} onChange={(event) => setHpAdjustment(event.target.value)} type="number" min="0" placeholder={zh ? '数值' : 'Amount'} className="w-20 rounded border border-slate-300 bg-white px-2 py-1 text-[10px]" /><button type="button" disabled={combatant.hpCurrent === undefined || !numberValue(hpAdjustment) || numberValue(hpAdjustment)! <= 0} onClick={() => applyHpAdjustment(combatant, 'damage')} className="rounded border border-red-300 bg-white px-2 py-1 text-[10px] font-bold text-red-700 disabled:opacity-40">{zh ? '应用伤害' : 'Apply damage'}</button><button type="button" disabled={combatant.hpCurrent === undefined || !numberValue(hpAdjustment) || numberValue(hpAdjustment)! <= 0} onClick={() => applyHpAdjustment(combatant, 'healing')} className="rounded border border-emerald-300 bg-white px-2 py-1 text-[10px] font-bold text-emerald-700 disabled:opacity-40">{zh ? '应用治疗' : 'Apply healing'}</button></div><p className="mt-1 text-[10px] text-slate-500">{combatant.hpCurrent === undefined ? (zh ? '先填写当前 HP，才能使用快捷结算。' : 'Set current HP before using quick adjustments.') : (zh ? '伤害会先抵扣临时 HP，并以现有战斗记录同步。' : 'Damage consumes temporary HP first and uses the existing combat log.')}</p></div>}
          {canManage && selectedNow && <div className="mt-2 grid grid-cols-2 gap-1.5"><input defaultValue={combatant.initiative ?? ''} onBlur={(event) => update(combatant, { initiative: numberValue(event.target.value) })} type="number" placeholder={zh ? '先攻' : 'Initiative'} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px]" /><input defaultValue={combatant.hpCurrent ?? ''} onBlur={(event) => update(combatant, { hpCurrent: numberValue(event.target.value), hitPoints: numberValue(event.target.value) })} type="number" placeholder="HP" className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px]" /><input defaultValue={combatant.hpMax ?? ''} onBlur={(event) => update(combatant, { hpMax: numberValue(event.target.value), maxHitPoints: numberValue(event.target.value) })} type="number" placeholder={zh ? '最大 HP' : 'Max HP'} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px]" /><input defaultValue={combatant.temporaryHp ?? ''} onBlur={(event) => update(combatant, { temporaryHp: numberValue(event.target.value) })} type="number" placeholder={zh ? '临时 HP' : 'Temp HP'} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px]" /><input defaultValue={combatant.armorClass ?? ''} onBlur={(event) => update(combatant, { armorClass: numberValue(event.target.value) })} type="number" placeholder="AC" className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px]" /><input defaultValue={combatant.conditions.join(', ')} onBlur={(event) => update(combatant, { conditions: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder={zh ? '状态，逗号分隔' : 'Conditions'} className="rounded border border-slate-300 bg-white px-2 py-1 text-[10px]" /></div>}
        </div>;
      })}</div>}
      {error && <p className="mt-2 rounded bg-red-50 px-2.5 py-2 text-[10px] text-red-700">{error}</p>}
    </section>
  );
}
