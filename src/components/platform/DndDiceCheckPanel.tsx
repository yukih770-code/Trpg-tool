import { useMemo, useState, type FormEvent } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import type { CampaignActorInstance } from '../../lib/api/campaignRoomApiClient';
import type { Combatant } from '../../lib/combat/combatRuntimeTypes';
import {
  DndDiceFormulaError,
  dndAttackToRuntimeEvent,
  dndCheckToRuntimeEvent,
  dndDamageToRuntimeEvent,
  dndFormulaToRuntimeEvent,
  rollDndAttack,
  rollDndCheck,
  rollDndDamage,
  rollDndDiceFormula,
} from '../../lib/dnd/dndDiceRoller';
import type { DndCheckKind, DndRollMode, DndRuntimeEventDraft } from '../../lib/dnd/dndDiceTypes';

type LocalResult = { id: number; title: string; summary: string };

type Props = {
  locale: Locale;
  canManage: boolean;
  campaignActors: CampaignActorInstance[];
  combatants: Combatant[];
  onAppendEvent?: (event: DndRuntimeEventDraft) => Promise<void>;
};

function optionalInteger(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export function DndDiceCheckPanel({ locale, canManage, campaignActors, combatants, onAppendEvent }: Props) {
  const { t } = createTranslator(locale);
  const [quickFormula, setQuickFormula] = useState('1d20');
  const [checkActor, setCheckActor] = useState('');
  const [checkKind, setCheckKind] = useState<DndCheckKind>('ability');
  const [checkLabel, setCheckLabel] = useState('');
  const [checkModifier, setCheckModifier] = useState('0');
  const [checkDc, setCheckDc] = useState('');
  const [checkMode, setCheckMode] = useState<DndRollMode>('normal');
  const [attacker, setAttacker] = useState('');
  const [target, setTarget] = useState('');
  const [attackBonus, setAttackBonus] = useState('0');
  const [targetAc, setTargetAc] = useState('');
  const [attackMode, setAttackMode] = useState<DndRollMode>('normal');
  const [damageFormula, setDamageFormula] = useState('1d8+3');
  const [criticalDamage, setCriticalDamage] = useState(false);
  const [error, setError] = useState('');
  const [eventWarning, setEventWarning] = useState('');
  const [results, setResults] = useState<LocalResult[]>([]);

  const actorNames = useMemo(() => Array.from(new Set([
    ...campaignActors.map((actor) => actor.displayName),
    ...combatants.map((combatant) => combatant.displayName),
  ].map((name) => name.trim()).filter(Boolean))), [campaignActors, combatants]);

  const saveResult = (title: string, summary: string, event: DndRuntimeEventDraft) => {
    setError('');
    setEventWarning('');
    setResults((previous) => [{ id: Date.now(), title, summary }, ...previous].slice(0, 5));
    if (!onAppendEvent) return;
    void onAppendEvent(event).catch(() => setEventWarning(t('dndDice.eventSaveFailed')));
  };

  const run = (action: () => void) => {
    try { action(); } catch (reason) {
      setError(reason instanceof DndDiceFormulaError ? t('dndDice.invalidFormula') : t('dndDice.rollFailed'));
    }
  };

  const handleQuickRoll = (event: FormEvent) => {
    event.preventDefault();
    run(() => {
      const result = rollDndDiceFormula(quickFormula);
      const draft = dndFormulaToRuntimeEvent(result, locale === 'en' ? 'en' : 'zh-CN');
      saveResult(t('dndDice.quickRoll'), String(draft.payload.summary), draft);
    });
  };

  const handleCheck = (event: FormEvent) => {
    event.preventDefault();
    run(() => {
      const result = rollDndCheck({ kind: checkKind, actorName: checkActor, label: checkLabel, modifier: optionalInteger(checkModifier) ?? 0, dc: optionalInteger(checkDc), mode: checkMode });
      const draft = dndCheckToRuntimeEvent(result, locale === 'en' ? 'en' : 'zh-CN');
      saveResult(t('dndDice.check'), String(draft.payload.summary), draft);
    });
  };

  const handleAttack = (event: FormEvent) => {
    event.preventDefault();
    run(() => {
      const result = rollDndAttack({ attackerName: attacker, targetName: target, attackBonus: optionalInteger(attackBonus) ?? 0, targetAc: optionalInteger(targetAc), mode: attackMode });
      const draft = dndAttackToRuntimeEvent(result, locale === 'en' ? 'en' : 'zh-CN');
      saveResult(t('dndDice.attack'), String(draft.payload.summary), draft);
    });
  };

  const handleDamage = (event: FormEvent) => {
    event.preventDefault();
    run(() => {
      const result = rollDndDamage(damageFormula, { critical: criticalDamage });
      const draft = dndDamageToRuntimeEvent(result, attacker, locale === 'en' ? 'en' : 'zh-CN');
      saveResult(t('dndDice.damage'), String(draft.payload.summary), draft);
    });
  };

  const modeControl = (value: DndRollMode, onChange: (next: DndRollMode) => void) => (
    <select value={value} onChange={(event) => onChange(event.target.value as DndRollMode)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50">
      <option value="normal">{t('dndDice.normal')}</option>
      <option value="advantage">{t('dndDice.advantage')}</option>
      <option value="disadvantage">{t('dndDice.disadvantage')}</option>
    </select>
  );

  const actorOptions = <>{actorNames.map((name) => <option key={name} value={name}>{name}</option>)}</>;

  return (
    <section className="mt-5 rounded-2xl border border-[#58180d]/15 bg-[#fffaf0] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('dndDice.eyebrow')}</div>
          <h4 className="mt-1 text-xl font-black">{t('dndDice.title')}</h4>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#51483d]">{t('dndDice.note')}</p>
        </div>
        <span className="rounded-full bg-[#58180d]/10 px-2.5 py-1 text-xs font-bold text-[#58180d]">DND 5e</span>
      </div>

      {!canManage && <p className="mt-3 rounded-lg bg-[#fff8e6] px-3 py-2 text-xs text-[#51483d]">{t('dndDice.hostOnly')}</p>}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <form onSubmit={handleQuickRoll} className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
          <h5 className="font-bold text-sm">{t('dndDice.quickRoll')}</h5>
          <div className="mt-3 flex gap-2"><input value={quickFormula} onChange={(event) => setQuickFormula(event.target.value)} disabled={!canManage} placeholder="1d20+5" className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><button type="submit" disabled={!canManage} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('dndDice.roll')}</button></div>
          <p className="mt-2 text-[11px] text-[#51483d]">d20 · 1d20+5 · 2d6+3</p>
        </form>

        <form onSubmit={handleCheck} className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
          <h5 className="font-bold text-sm">{t('dndDice.check')}</h5>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select value={checkActor} onChange={(event) => setCheckActor(event.target.value)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="">{t('dndDice.actorOptional')}</option>{actorOptions}</select>
            <select value={checkKind} onChange={(event) => setCheckKind(event.target.value as DndCheckKind)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="ability">{t('dndDice.abilityCheck')}</option><option value="skill">{t('dndDice.skillCheck')}</option><option value="save">{t('dndDice.save')}</option><option value="generic">{t('dndDice.genericCheck')}</option></select>
            <input value={checkLabel} onChange={(event) => setCheckLabel(event.target.value)} disabled={!canManage} placeholder={t('dndDice.checkLabel')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
            {modeControl(checkMode, setCheckMode)}
            <input value={checkModifier} onChange={(event) => setCheckModifier(event.target.value)} disabled={!canManage} type="number" placeholder={t('dndDice.modifier')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
            <input value={checkDc} onChange={(event) => setCheckDc(event.target.value)} disabled={!canManage} type="number" placeholder={t('dndDice.dc')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
          </div>
          <button type="submit" disabled={!canManage} className="mt-3 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('dndDice.rollCheck')}</button>
        </form>

        <form onSubmit={handleAttack} className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
          <h5 className="font-bold text-sm">{t('dndDice.attack')}</h5>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select value={attacker} onChange={(event) => setAttacker(event.target.value)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="">{t('dndDice.attacker')}</option>{actorOptions}</select>
            <input value={target} onChange={(event) => setTarget(event.target.value)} disabled={!canManage} placeholder={t('dndDice.targetOptional')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
            <input value={attackBonus} onChange={(event) => setAttackBonus(event.target.value)} disabled={!canManage} type="number" placeholder={t('dndDice.attackBonus')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
            <input value={targetAc} onChange={(event) => setTargetAc(event.target.value)} disabled={!canManage} type="number" placeholder={t('dndDice.ac')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
            {modeControl(attackMode, setAttackMode)}
          </div>
          <button type="submit" disabled={!canManage} className="mt-3 rounded-md bg-[#58180d] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('dndDice.rollAttack')}</button>
        </form>

        <form onSubmit={handleDamage} className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
          <h5 className="font-bold text-sm">{t('dndDice.damage')}</h5>
          <div className="mt-3 flex flex-wrap gap-2"><input value={damageFormula} onChange={(event) => setDamageFormula(event.target.value)} disabled={!canManage} placeholder="1d8+3" className="min-w-36 flex-1 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><label className="flex items-center gap-2 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold"><input type="checkbox" checked={criticalDamage} onChange={(event) => setCriticalDamage(event.target.checked)} disabled={!canManage} />{t('dndDice.critical')}</label><button type="submit" disabled={!canManage} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('dndDice.rollDamage')}</button></div>
          <p className="mt-2 text-[11px] text-[#51483d]">{t('dndDice.criticalNote')}</p>
        </form>
      </div>

      {error && <p className="mt-3 rounded-lg bg-[#fff0eb] px-3 py-2 text-xs text-[#8b3a2f]">{error}</p>}
      {eventWarning && <p className="mt-3 rounded-lg bg-[#fff8e6] px-3 py-2 text-xs text-[#51483d]">{eventWarning}</p>}
      <div className="mt-4 rounded-xl border border-[#2f2a22]/10 bg-white p-3"><h5 className="font-bold text-sm">{t('dndDice.recent')}</h5>{results.length === 0 ? <p className="mt-2 text-xs text-[#51483d]">{t('dndDice.noResults')}</p> : <div className="mt-2 grid gap-2">{results.map((result) => <div key={result.id} className="rounded-lg bg-[#f7f3ea] px-3 py-2 text-xs"><span className="font-bold">{result.title}</span><span className="ml-2 text-[#51483d]">{result.summary}</span></div>)}</div>}</div>
      <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('dndDice.boundary')}</p>
    </section>
  );
}
