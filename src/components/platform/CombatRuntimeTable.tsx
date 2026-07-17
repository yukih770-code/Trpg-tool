import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import { useCombatRuntimeTable } from '../../lib/combat/useCombatRuntimeTable';
import type { CampaignActorInstance, RuntimeEvent } from '../../lib/api/campaignRoomApiClient';
import { sortCombatants, type CombatRuntimeEventDraft, type CombatantKind, type CombatRuntimeTableState } from '../../lib/combat/combatRuntimeTypes';
import { hasCombatRuntimeEvents } from '../../lib/combat/combatRuntimeReplay';
import type { DndLiteActorSheet, DndLiteCombatantPrefill } from '../../lib/dnd/dndLiteActorTypes';
import type { CombatDamagePreset } from '../../lib/combat/combatComfort';

type Props = {
  locale: Locale;
  scopeKey: string;
  campaignActors: CampaignActorInstance[];
  canManage: boolean;
  runtimeSessionId: string;
  runtimeEvents: RuntimeEvent[];
  onCombatantsChange?: (combatants: import('../../lib/combat/combatRuntimeTypes').Combatant[]) => void;
  onStateChange?: (state: CombatRuntimeTableState) => void;
  snapshotState?: CombatRuntimeTableState;
  snapshotImportVersion?: number;
  dndActorSheets?: Record<string, DndLiteActorSheet>;
  dndActorPrefill?: DndLiteCombatantPrefill & { nonce: number };
  damagePreset?: CombatDamagePreset;
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

const commonConditions = ['中毒', '倒地', '震慑', '麻痹', '束缚', '目盲', '耳聋', '隐形', '恐慌', '魅惑', '失能', '昏迷'];
const commonConditionsEn = ['Poisoned', 'Prone', 'Stunned', 'Paralyzed', 'Restrained', 'Blinded', 'Deafened', 'Invisible', 'Frightened', 'Charmed', 'Incapacitated', 'Unconscious'];

export function CombatRuntimeTable({ locale, scopeKey, campaignActors, canManage, runtimeSessionId, runtimeEvents, onCombatantsChange, onStateChange, snapshotState, snapshotImportVersion, dndActorSheets = {}, dndActorPrefill, damagePreset, onAppendEvent }: Props) {
  const { t } = createTranslator(locale);
  const table = useCombatRuntimeTable(scopeKey);
  const restoredScopeRef = useRef('');
  const importedSnapshotRef = useRef(0);
  const dndPrefillRef = useRef(0);
  const [displayName, setDisplayName] = useState('');
  const [kind, setKind] = useState<CombatantKind>('character');
  const [initiativeModifier, setInitiativeModifier] = useState('0');
  const [armorClass, setArmorClass] = useState('');
  const [hitPoints, setHitPoints] = useState('');
  const [maxHitPoints, setMaxHitPoints] = useState('');
  const [conditions, setConditions] = useState('');
  const [sourceActorInstanceId, setSourceActorInstanceId] = useState('');
  const [notes, setNotes] = useState('');
  const [temporaryHp, setTemporaryHp] = useState('');
  const [selectedCombatantId, setSelectedCombatantId] = useState('');
  const [comfortAmount, setComfortAmount] = useState('');
  const [comfortNote, setComfortNote] = useState('');
  const [replaceTemporaryHp, setReplaceTemporaryHp] = useState(false);
  const [eventError, setEventError] = useState('');
  const [restoreNotice, setRestoreNotice] = useState('');

  useEffect(() => {
    onCombatantsChange?.(table.state.combatants);
    onStateChange?.(table.state);
  }, [onCombatantsChange, onStateChange, table.state]);

  useEffect(() => {
    if (!snapshotState || !snapshotImportVersion || importedSnapshotRef.current === snapshotImportVersion) return;
    table.replaceState(snapshotState);
    importedSnapshotRef.current = snapshotImportVersion;
    setRestoreNotice(locale === 'en' ? 'Combat state restored from a local scene snapshot.' : '已从本地场景快照恢复战斗状态。');
  }, [locale, snapshotImportVersion, snapshotState, table.replaceState]);

  useEffect(() => {
    if (!dndActorPrefill || dndPrefillRef.current === dndActorPrefill.nonce) return;
    setDisplayName(dndActorPrefill.displayName);
    setKind(dndActorPrefill.kind);
    setArmorClass(dndActorPrefill.armorClass === undefined ? '' : String(dndActorPrefill.armorClass));
    setHitPoints(dndActorPrefill.hpCurrent === undefined ? '' : String(dndActorPrefill.hpCurrent));
    setMaxHitPoints(dndActorPrefill.hpMax === undefined ? '' : String(dndActorPrefill.hpMax));
    setTemporaryHp(dndActorPrefill.temporaryHp === undefined ? '' : String(dndActorPrefill.temporaryHp));
    setNotes(dndActorPrefill.notes ?? '');
    setSourceActorInstanceId(dndActorPrefill.sourceActorInstanceId ?? '');
    dndPrefillRef.current = dndActorPrefill.nonce;
  }, [dndActorPrefill]);

  useEffect(() => {
    if (!damagePreset) return;
    setComfortAmount(String(damagePreset.amount));
    setComfortNote(damagePreset.sourceName ? (locale === 'en' ? `Rolled by ${damagePreset.sourceName}` : `来自 ${damagePreset.sourceName} 的掷骰`) : '');
    const match = table.state.combatants.find((combatant) => combatant.displayName === damagePreset.targetName);
    if (match) setSelectedCombatantId(match.id);
  }, [damagePreset, locale, table.state.combatants]);

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
      temporaryHp: optionalNumber(temporaryHp),
      conditions: conditions.split(',').map((item) => item.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
      sourceActorInstanceId: sourceActorInstanceId || undefined,
    });
    emit(result.event);
    setDisplayName('');
    setArmorClass('');
    setHitPoints('');
    setMaxHitPoints('');
    setTemporaryHp('');
    setConditions('');
    setNotes('');
    setSourceActorInstanceId('');
  };

  const active = table.state.turn.activeCombatantId ? table.state.combatants.find((combatant) => combatant.id === table.state.turn.activeCombatantId) : undefined;
  const orderedCombatants = sortCombatants(table.state.combatants);
  const statusLabel = table.state.turn.status === 'active' ? t('campaignCombat.active') : table.state.turn.status === 'paused' ? t('campaignCombat.paused') : table.state.turn.status === 'ended' ? t('campaignCombat.ended') : t('campaignCombat.setup');
  const selectedCombatant = table.state.combatants.find((combatant) => combatant.id === selectedCombatantId);
  const selectedAmount = optionalNumber(comfortAmount);
  const conditionLabels = locale === 'en' ? commonConditionsEn : commonConditions;
  const useComfort = (action: 'damage' | 'healing' | 'temporary' | 'override') => {
    if (!selectedCombatant || selectedAmount === undefined) return;
    const context = { note: comfortNote.trim() || undefined, sourceName: damagePreset?.sourceName, rollRef: damagePreset?.rollRef };
    if (action === 'damage') emit(table.damage(selectedCombatant.id, selectedAmount, context));
    if (action === 'healing') emit(table.heal(selectedCombatant.id, selectedAmount, context));
    if (action === 'temporary') emit(table.temporaryHp(selectedCombatant.id, selectedAmount, replaceTemporaryHp, context));
    if (action === 'override') emit(table.overrideHp(selectedCombatant.id, selectedAmount, context));
  };

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
          <input value={temporaryHp} onChange={(event) => setTemporaryHp(event.target.value)} type="number" placeholder={locale === 'en' ? 'Temporary HP' : '临时生命'} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
          <input value={conditions} onChange={(event) => setConditions(event.target.value)} placeholder={t('campaignCombat.conditions')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm lg:col-span-2" />
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t('campaignCombat.notes')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm lg:col-span-2" />
          {campaignActors.length > 0 && <select value={sourceActorInstanceId} onChange={(event) => { const value = event.target.value; setSourceActorInstanceId(value); const actor = campaignActors.find((item) => item.campaignActorInstanceId === value); const sheet = dndActorSheets[value]; if (actor) setDisplayName(sheet?.displayName || actor.displayName); if (sheet) { setKind(sheet.actorKind === 'pc' ? 'character' : sheet.actorKind === 'npc' || sheet.actorKind === 'monster' ? 'npc' : 'other'); setArmorClass(sheet.defenses.armorClass === undefined ? '' : String(sheet.defenses.armorClass)); setHitPoints(sheet.defenses.currentHp === undefined ? '' : String(sheet.defenses.currentHp)); setMaxHitPoints(sheet.defenses.maxHp === undefined ? '' : String(sheet.defenses.maxHp)); setTemporaryHp(sheet.defenses.temporaryHp === undefined ? '' : String(sheet.defenses.temporaryHp)); setNotes(sheet.notes ?? ''); } }} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm lg:col-span-2"><option value="">{t('campaignCombat.sourceActor')}</option>{campaignActors.map((actor) => <option key={actor.campaignActorInstanceId} value={actor.campaignActorInstanceId}>{actor.displayName}{dndActorSheets[actor.campaignActorInstanceId] ? ` · DND ${dndActorSheets[actor.campaignActorInstanceId]?.actions.length ?? 0}` : ''}</option>)}</select>}
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
        {canManage && <button type="button" onClick={() => emit(table.clear())} disabled={table.state.combatants.length === 0} className="rounded-md border border-[#8b3a2f]/25 bg-white px-3 py-2 text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{locale === 'en' ? 'Clear local table' : '清除本地战斗表'}</button>}
      </div>

      {canManage && table.state.combatants.length > 0 && <div className="mt-4 rounded-xl border border-[#58180d]/15 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="font-bold text-sm">{locale === 'en' ? 'Quick combat actions' : '快速战斗操作'}</div><p className="mt-1 text-xs text-[#51483d]">{locale === 'en' ? 'Choose a target, then apply the host-confirmed result.' : '选择目标后，由主持人确认应用结果。'}</p></div>{damagePreset && <span className="rounded-full bg-[#fff0d6] px-2 py-1 text-xs font-bold text-[#58180d]">{locale === 'en' ? 'Damage roll ready' : '伤害掷骰已就绪'}</span>}</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><select value={selectedCombatantId} onChange={(event) => setSelectedCombatantId(event.target.value)} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm"><option value="">{locale === 'en' ? 'Choose target' : '选择目标'}</option>{orderedCombatants.map((combatant) => <option key={combatant.id} value={combatant.id}>{combatant.displayName}</option>)}</select><input value={comfortAmount} onChange={(event) => setComfortAmount(event.target.value)} type="number" min="0" placeholder={locale === 'en' ? 'Amount / HP value' : '数值 / HP 值'} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" /><input value={comfortNote} onChange={(event) => setComfortNote(event.target.value)} placeholder={locale === 'en' ? 'Note (optional)' : '备注（可选）'} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm sm:col-span-2" /></div>
        <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => useComfort('damage')} disabled={!selectedCombatant || selectedAmount === undefined} className="rounded-md bg-[#8b3a2f] px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-40">{locale === 'en' ? 'Apply damage' : '应用伤害'}</button><button type="button" onClick={() => useComfort('healing')} disabled={!selectedCombatant || selectedAmount === undefined} className="rounded-md border border-[#3d5232]/30 px-2.5 py-1.5 text-xs font-bold text-[#3d5232] disabled:opacity-40">{locale === 'en' ? 'Apply healing' : '应用治疗'}</button><button type="button" onClick={() => useComfort('temporary')} disabled={!selectedCombatant || selectedAmount === undefined} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold disabled:opacity-40">{locale === 'en' ? 'Temporary HP' : '临时生命'}</button><button type="button" onClick={() => useComfort('override')} disabled={!selectedCombatant || selectedAmount === undefined} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold disabled:opacity-40">{locale === 'en' ? 'Set HP' : '设置 HP'}</button><label className="flex items-center gap-1.5 px-1 text-xs text-[#51483d]"><input type="checkbox" checked={replaceTemporaryHp} onChange={(event) => setReplaceTemporaryHp(event.target.checked)} />{locale === 'en' ? 'Replace temporary HP' : '替换临时生命'}</label></div>
        {selectedCombatant && <div className="mt-3 border-t border-[#2f2a22]/10 pt-3"><div className="text-xs font-bold">{locale === 'en' ? 'Conditions' : '状态'}</div><div className="mt-2 flex flex-wrap gap-1.5">{conditionLabels.map((condition) => <button key={condition} type="button" onClick={() => emit(table.setCondition(selectedCombatant.id, condition))} className={`rounded-full border px-2 py-1 text-xs ${selectedCombatant.conditions.includes(condition) ? 'border-[#58180d]/40 bg-[#fff0d6] text-[#58180d]' : 'border-[#2f2a22]/15 bg-[#f7f3ea]'}`}>{condition}</button>)}</div></div>}
      </div>}

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
          return <div key={combatant.id} onClick={() => setSelectedCombatantId(combatant.id)} className={`cursor-pointer rounded-xl border p-3 ${selectedCombatantId === combatant.id ? 'ring-1 ring-[#58180d]/35' : ''} ${isActive ? 'border-[#58180d]/45 bg-[#fff0d6]' : 'border-[#2f2a22]/10 bg-white'} ${combatant.status !== 'active' ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="font-bold">{combatant.displayName}</div><div className="mt-1 text-xs text-[#51483d]">{kindLabel(combatant.kind, locale)} · {combatant.status === 'defeated' ? t('campaignCombat.defeated') : t('campaignCombat.inTable')}</div></div>
              <div className="flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-[#2f2a22]/8 px-2 py-1">{t('campaignCombat.initiative')}: {combatant.initiative ?? '—'}</span>{combatant.armorClass !== undefined && <span className="rounded-full bg-[#2f2a22]/8 px-2 py-1">AC {combatant.armorClass}</span>}{combatant.hpCurrent !== undefined && <span className="rounded-full bg-[#2f2a22]/8 px-2 py-1">HP {combatant.hpCurrent}{combatant.hpMax !== undefined ? `/${combatant.hpMax}` : ''}</span>}{combatant.temporaryHp !== undefined && <span className="rounded-full bg-[#d7e8ff] px-2 py-1 text-[#294966]">{locale === 'en' ? 'Temp' : '临时'} {combatant.temporaryHp}</span>}</div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#51483d]">{combatant.conditions.length > 0 ? <span>{t('campaignCombat.conditions')}: {combatant.conditions.join(', ')}</span> : <span>{t('campaignCombat.noConditions')}</span>}{combatant.sourceActorInstanceId && dndActorSheets[combatant.sourceActorInstanceId] && <span>DND · {dndActorSheets[combatant.sourceActorInstanceId]?.actions.length ?? 0} {locale === 'en' ? 'actions' : '个动作'}</span>}{combatant.notes && <span>{t('campaignCombat.notes')}: {combatant.notes}</span>}{isActive && <span className="rounded-full bg-[#58180d] px-2 py-1 font-bold text-white">{t('campaignCombat.currentTurn')}</span>}</div>
            {canManage && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input value={combatant.initiative ?? ''} onChange={(event) => emit(table.updateCombatant(combatant.id, { initiative: optionalNumber(event.target.value) }))} type="number" placeholder={t('campaignCombat.initiative')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><input value={combatant.hpCurrent ?? ''} onChange={(event) => emit(table.updateCombatant(combatant.id, { hpCurrent: optionalNumber(event.target.value) }))} type="number" placeholder={t('campaignCombat.hitPoints')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><input value={combatant.armorClass ?? ''} onChange={(event) => emit(table.updateCombatant(combatant.id, { armorClass: optionalNumber(event.target.value) }))} type="number" placeholder={t('campaignCombat.armorClass')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><input value={combatant.conditions.join(', ')} onChange={(event) => emit(table.updateCombatant(combatant.id, { conditions: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} placeholder={t('campaignCombat.conditions')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><input value={combatant.notes ?? ''} onChange={(event) => emit(table.updateCombatant(combatant.id, { notes: event.target.value }))} placeholder={t('campaignCombat.notes')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs sm:col-span-2 lg:col-span-4" /></div>}
            {canManage && <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => emit(table.rollInitiative(combatant.id))} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold">{t('campaignCombat.rollInitiative')}</button><button type="button" onClick={() => emit(table.markDefeated(combatant.id))} disabled={combatant.status !== 'active'} className="rounded-md border border-[#8b3a2f]/20 px-2.5 py-1.5 text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('campaignCombat.markDefeated')}</button><button type="button" onClick={() => emit(table.removeCombatant(combatant.id))} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold text-[#51483d]">{t('campaignCombat.remove')}</button></div>}
          </div>;
        })}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('campaignCombat.boundary')}</p>
    </section>
  );
}
