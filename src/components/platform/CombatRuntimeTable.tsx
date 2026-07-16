import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import { useCombatRuntimeTable } from '../../lib/combat/useCombatRuntimeTable';
import type { CampaignActorInstance, RuntimeEvent } from '../../lib/api/campaignRoomApiClient';
import { sortCombatants, type CombatRuntimeEventDraft, type CombatantKind } from '../../lib/combat/combatRuntimeTypes';
import { hasCombatRuntimeEvents } from '../../lib/combat/combatRuntimeReplay';

type Props = {
  locale: Locale;
  scopeKey: string;
  campaignActors: CampaignActorInstance[];
  canManage: boolean;
  runtimeSessionId: string;
  runtimeEvents: RuntimeEvent[];
  onAppendEvent?: (event: CombatRuntimeEventDraft) => Promise<void>;
};

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function kindLabel(kind: CombatantKind, locale: Locale): string {
  if (locale === 'en') return kind === 'character' ? 'Character' : kind === 'npc' ? 'NPC' : 'Other';
  return kind === 'character' ? '角色' : kind === 'npc' ? 'NPC' : '其他';
}

export function CombatRuntimeTable({ locale, scopeKey, campaignActors, canManage, runtimeSessionId, runtimeEvents, onAppendEvent }: Props) {
  const { t } = createTranslator(locale);
  const table = useCombatRuntimeTable(scopeKey);
  const restoredScopeRef = useRef('');
  const [displayName, setDisplayName] = useState('');
  const [kind, setKind] = useState<CombatantKind>('character');
  const [initiativeModifier, setInitiativeModifier] = useState('0');
  const [armorClass, setArmorClass] = useState('');
  const [hitPoints, setHitPoints] = useState('');
  const [maxHitPoints, setMaxHitPoints] = useState('');
  const [conditions, setConditions] = useState('');
  const [sourceActorInstanceId, setSourceActorInstanceId] = useState('');
  const [notes, setNotes] = useState('');
  const [eventError, setEventError] = useState('');
  const [restoreNotice, setRestoreNotice] = useState('');

  const combatEvents = runtimeEvents.filter((event) => event.runtimeSessionId === runtimeSessionId && event.eventKind.startsWith('combat.'));
  const combatEventKey = combatEvents.map((event) => event.runtimeEventId).join('|');

  useEffect(() => {
    if (restoredScopeRef.current === scopeKey || !hasCombatRuntimeEvents(combatEvents)) return;
    table.restore(combatEvents);
    restoredScopeRef.current = scopeKey;
    setRestoreNotice(t('campaignCombat.restoreAutoNotice'));
  }, [combatEventKey, scopeKey, t, table.restore]);

  const emit = (event: CombatRuntimeEventDraft | null) => {
    if (!event || !onAppendEvent) return;
    setEventError('');
    void onAppendEvent(event).catch(() => setEventError(t('campaignCombat.eventSaveFailed')));
  };

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    const name = displayName.trim();
    if (!name || !canManage) return;
    const result = table.addCombatant({
      displayName: name,
      kind,
      sourceType: sourceActorInstanceId ? 'campaign_actor' : kind === 'npc' ? 'manual_npc' : kind === 'character' ? 'manual_pc' : 'unknown',
      initiativeModifier: Number(initiativeModifier) || 0,
      initiativeFormula: '1d20 + modifier',
      armorClass: optionalNumber(armorClass),
      hpCurrent: optionalNumber(hitPoints),
      hpMax: optionalNumber(maxHitPoints),
      conditions: conditions.split(',').map((item) => item.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
      sourceActorInstanceId: sourceActorInstanceId || undefined,
    });
    emit(result.event);
    setDisplayName('');
    setArmorClass('');
    setHitPoints('');
    setMaxHitPoints('');
    setConditions('');
    setNotes('');
    setSourceActorInstanceId('');
  };

  const active = table.state.turn.activeCombatantId ? table.state.combatants.find((combatant) => combatant.id === table.state.turn.activeCombatantId) : undefined;
  const orderedCombatants = sortCombatants(table.state.combatants);
  const statusLabel = table.state.turn.status === 'active' ? t('campaignCombat.active') : table.state.turn.status === 'paused' ? t('campaignCombat.paused') : table.state.turn.status === 'ended' ? t('campaignCombat.ended') : t('campaignCombat.setup');

  return (
    <section className="mt-5 rounded-2xl border border-[#58180d]/15 bg-[#fffaf0] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('campaignCombat.eyebrow')}</div>
          <h4 className="mt-1 text-xl font-black">{t('campaignCombat.title')}</h4>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#51483d]">{t('campaignCombat.note')}</p>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 text-right text-xs">
          <div className="font-bold">{statusLabel}</div>
          <div className="mt-1 text-[#51483d]">{t('campaignCombat.round')} {table.state.turn.roundNumber}{active ? ` · ${active.displayName}` : ''}</div>
        </div>
      </div>

      {canManage && <form onSubmit={handleAdd} className="mt-4 rounded-xl border border-[#2f2a22]/10 bg-white p-3">
        <div className="font-bold text-sm">{t('campaignCombat.addCombatant')}</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t('campaignCombat.name')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
          <select value={kind} onChange={(event) => setKind(event.target.value as CombatantKind)} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm"><option value="character">{kindLabel('character', locale)}</option><option value="npc">{kindLabel('npc', locale)}</option><option value="other">{kindLabel('other', locale)}</option></select>
          <input value={initiativeModifier} onChange={(event) => setInitiativeModifier(event.target.value)} type="number" placeholder={t('campaignCombat.initiativeModifier')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
          <input value={armorClass} onChange={(event) => setArmorClass(event.target.value)} type="number" placeholder={t('campaignCombat.armorClass')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
          <input value={hitPoints} onChange={(event) => setHitPoints(event.target.value)} type="number" placeholder={t('campaignCombat.hitPoints')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
          <input value={maxHitPoints} onChange={(event) => setMaxHitPoints(event.target.value)} type="number" placeholder={t('campaignCombat.maxHitPoints')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
          <input value={conditions} onChange={(event) => setConditions(event.target.value)} placeholder={t('campaignCombat.conditions')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm lg:col-span-2" />
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t('campaignCombat.notes')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm lg:col-span-2" />
          {campaignActors.length > 0 && <select value={sourceActorInstanceId} onChange={(event) => { const value = event.target.value; setSourceActorInstanceId(value); const actor = campaignActors.find((item) => item.campaignActorInstanceId === value); if (actor) setDisplayName(actor.displayName); }} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm lg:col-span-2"><option value="">{t('campaignCombat.sourceActor')}</option>{campaignActors.map((actor) => <option key={actor.campaignActorInstanceId} value={actor.campaignActorInstanceId}>{actor.displayName}</option>)}</select>}
        </div>
        <button type="submit" disabled={!displayName.trim()} className="mt-3 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('campaignCombat.add')}</button>
      </form>}

      <div className="mt-4 flex flex-wrap gap-2">
        {canManage && <button type="button" onClick={() => emit(table.start())} disabled={table.state.combatants.length === 0 || table.state.turn.status === 'active'} className="rounded-md bg-[#58180d] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('campaignCombat.start')}</button>}
        {canManage && <button type="button" onClick={() => emit(table.moveTurn('previous'))} disabled={table.state.turn.status !== 'active'} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('campaignCombat.previous')}</button>}
        {canManage && <button type="button" onClick={() => emit(table.moveTurn('next'))} disabled={table.state.turn.status !== 'active'} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('campaignCombat.next')}</button>}
        {canManage && table.state.turn.status === 'active' && <button type="button" onClick={() => emit(table.pause())} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold">{t('campaignCombat.pause')}</button>}
        {canManage && table.state.turn.status === 'paused' && <button type="button" onClick={() => emit(table.resume())} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold">{t('campaignCombat.resume')}</button>}
        {canManage && <button type="button" onClick={() => emit(table.end())} disabled={table.state.turn.status !== 'active' && table.state.turn.status !== 'paused'} className="rounded-md border border-[#8b3a2f]/25 bg-white px-3 py-2 text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('campaignCombat.end')}</button>}
      </div>

      {hasCombatRuntimeEvents(combatEvents) && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#2f2a22]/10 bg-white px-3 py-2 text-xs">
        <span className="text-[#51483d]">{t('campaignCombat.restoreDetected')} · {combatEvents.length}</span>
        <button type="button" onClick={() => { table.restore(combatEvents); restoredScopeRef.current = scopeKey; setRestoreNotice(t('campaignCombat.restoreNotice')); }} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 font-bold">{t('campaignCombat.restore')}</button>
      </div>}
      {restoreNotice && <p className="mt-2 rounded-lg bg-[#f7f3ea] px-3 py-2 text-xs text-[#51483d]">{restoreNotice}</p>}

      {eventError && <p className="mt-3 rounded-lg bg-[#fff0eb] px-3 py-2 text-xs text-[#8b3a2f]">{eventError}</p>}
      <div className="mt-4 grid gap-2">
        {table.state.combatants.length === 0 && <p className="rounded-xl border border-dashed border-[#2f2a22]/15 bg-white p-4 text-sm text-[#51483d]">{t('campaignCombat.empty')}</p>}
        {orderedCombatants.map((combatant) => {
          const isActive = table.state.turn.activeCombatantId === combatant.id;
          return <div key={combatant.id} className={`rounded-xl border p-3 ${isActive ? 'border-[#58180d]/45 bg-[#fff0d6]' : 'border-[#2f2a22]/10 bg-white'} ${combatant.status !== 'active' ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="font-bold">{combatant.displayName}</div><div className="mt-1 text-xs text-[#51483d]">{kindLabel(combatant.kind, locale)} · {combatant.status === 'defeated' ? t('campaignCombat.defeated') : t('campaignCombat.inTable')}</div></div>
              <div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-[#2f2a22]/8 px-2 py-1">{t('campaignCombat.initiative')}: {combatant.initiative ?? '—'}</span>{combatant.armorClass !== undefined && <span className="rounded-full bg-[#2f2a22]/8 px-2 py-1">AC {combatant.armorClass}</span>}{combatant.hpCurrent !== undefined && <span className="rounded-full bg-[#2f2a22]/8 px-2 py-1">HP {combatant.hpCurrent}{combatant.hpMax !== undefined ? `/${combatant.hpMax}` : ''}</span>}</div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#51483d]">{combatant.conditions.length > 0 ? <span>{t('campaignCombat.conditions')}: {combatant.conditions.join(', ')}</span> : <span>{t('campaignCombat.noConditions')}</span>}{combatant.notes && <span>{t('campaignCombat.notes')}: {combatant.notes}</span>}{isActive && <span className="rounded-full bg-[#58180d] px-2 py-1 font-bold text-white">{t('campaignCombat.currentTurn')}</span>}</div>
            {canManage && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input value={combatant.initiative ?? ''} onChange={(event) => emit(table.updateCombatant(combatant.id, { initiative: optionalNumber(event.target.value) }))} type="number" placeholder={t('campaignCombat.initiative')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><input value={combatant.hpCurrent ?? ''} onChange={(event) => emit(table.updateCombatant(combatant.id, { hpCurrent: optionalNumber(event.target.value) }))} type="number" placeholder={t('campaignCombat.hitPoints')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><input value={combatant.armorClass ?? ''} onChange={(event) => emit(table.updateCombatant(combatant.id, { armorClass: optionalNumber(event.target.value) }))} type="number" placeholder={t('campaignCombat.armorClass')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><input value={combatant.conditions.join(', ')} onChange={(event) => emit(table.updateCombatant(combatant.id, { conditions: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} placeholder={t('campaignCombat.conditions')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><input value={combatant.notes ?? ''} onChange={(event) => emit(table.updateCombatant(combatant.id, { notes: event.target.value }))} placeholder={t('campaignCombat.notes')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs sm:col-span-2 lg:col-span-4" /></div>}
            {canManage && <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => emit(table.rollInitiative(combatant.id))} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold">{t('campaignCombat.rollInitiative')}</button><button type="button" onClick={() => emit(table.markDefeated(combatant.id))} disabled={combatant.status !== 'active'} className="rounded-md border border-[#8b3a2f]/20 px-2.5 py-1.5 text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('campaignCombat.markDefeated')}</button><button type="button" onClick={() => emit(table.removeCombatant(combatant.id))} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold text-[#51483d]">{t('campaignCombat.remove')}</button></div>}
          </div>;
        })}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('campaignCombat.boundary')}</p>
    </section>
  );
}
