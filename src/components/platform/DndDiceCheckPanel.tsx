import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
import { getDndActionRollInput, getDndLiteCheckInput } from '../../lib/dnd/dndLiteActorSheet';
import type { DndAbilityKey, DndLiteActorSheet, DndSkillKey } from '../../lib/dnd/dndLiteActorTypes';
import type { DndMonsterAction } from '../../lib/dnd/dndMonsterTemplateTypes';
import type { CombatDamagePreset } from '../../lib/combat/combatComfort';

type LocalResult = { id: number; title: string; summary: string };

type Props = {
  locale: Locale;
  canManage: boolean;
  campaignActors: CampaignActorInstance[];
  combatants: Combatant[];
  actorSheets?: Record<string, DndLiteActorSheet>;
  preset?: { actorInstanceId: string; actionId?: string; nonce: number };
  monsterActionPreset?: { monsterName: string; action: DndMonsterAction; nonce: number };
  onDamageReady?: (preset: CombatDamagePreset) => void;
  onAppendEvent?: (event: DndRuntimeEventDraft) => Promise<void>;
};

function optionalInteger(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

const abilityNames: Record<DndAbilityKey, [string, string]> = {
  strength: ['力量', 'Strength'], dexterity: ['敏捷', 'Dexterity'], constitution: ['体质', 'Constitution'],
  intelligence: ['智力', 'Intelligence'], wisdom: ['感知', 'Wisdom'], charisma: ['魅力', 'Charisma'],
};

const skillNames: Record<DndSkillKey, [string, string]> = {
  acrobatics: ['体操', 'Acrobatics'], animalHandling: ['驯兽', 'Animal Handling'], arcana: ['奥秘', 'Arcana'], athletics: ['运动', 'Athletics'], deception: ['欺瞒', 'Deception'], history: ['历史', 'History'], insight: ['洞悉', 'Insight'], intimidation: ['威吓', 'Intimidation'], investigation: ['调查', 'Investigation'], medicine: ['医药', 'Medicine'], nature: ['自然', 'Nature'], perception: ['察觉', 'Perception'], performance: ['表演', 'Performance'], persuasion: ['游说', 'Persuasion'], religion: ['宗教', 'Religion'], sleightOfHand: ['巧手', 'Sleight of Hand'], stealth: ['隐匿', 'Stealth'], survival: ['求生', 'Survival'],
};

export function DndDiceCheckPanel({ locale, canManage, campaignActors, combatants, actorSheets = {}, preset, monsterActionPreset, onDamageReady, onAppendEvent }: Props) {
  const { t } = createTranslator(locale);
  const [quickFormula, setQuickFormula] = useState('1d20');
  const [checkActor, setCheckActor] = useState('');
  const [checkKind, setCheckKind] = useState<DndCheckKind>('ability');
  const [checkAbility, setCheckAbility] = useState<DndAbilityKey>('strength');
  const [checkSkill, setCheckSkill] = useState<DndSkillKey>('athletics');
  const [checkLabel, setCheckLabel] = useState('');
  const [checkModifier, setCheckModifier] = useState('0');
  const [checkDc, setCheckDc] = useState('');
  const [checkMode, setCheckMode] = useState<DndRollMode>('normal');
  const [attacker, setAttacker] = useState('');
  const [target, setTarget] = useState('');
  const [attackBonus, setAttackBonus] = useState('0');
  const [targetAc, setTargetAc] = useState('');
  const [attackMode, setAttackMode] = useState<DndRollMode>('normal');
  const [actionId, setActionId] = useState('');
  const [externalAttackerName, setExternalAttackerName] = useState('');
  const [damageFormula, setDamageFormula] = useState('1d8+3');
  const [criticalDamage, setCriticalDamage] = useState(false);
  const [error, setError] = useState('');
  const [eventWarning, setEventWarning] = useState('');
  const [results, setResults] = useState<LocalResult[]>([]);

  const actorChoices = useMemo(() => [
    ...campaignActors.map((actor) => ({ value: actor.campaignActorInstanceId, name: actor.displayName })),
    ...combatants.map((combatant) => ({ value: `combat:${combatant.id}`, name: combatant.displayName })),
  ].filter((choice) => choice.name.trim()), [campaignActors, combatants]);
  const actorNameFor = (value: string) => actorChoices.find((choice) => choice.value === value)?.name ?? '';
  const checkSheet = actorSheets[checkActor];
  const attackerSheet = actorSheets[attacker];
  const selectedAction = attackerSheet?.actions.find((action) => action.id === actionId);

  useEffect(() => {
    if (!checkSheet) return;
    if (checkKind === 'ability') {
      const input = getDndLiteCheckInput(checkSheet, { type: 'ability', ability: checkAbility });
      setCheckModifier(String(input.modifier));
      setCheckLabel(abilityNames[checkAbility][locale === 'en' ? 1 : 0]);
    } else if (checkKind === 'skill') {
      const input = getDndLiteCheckInput(checkSheet, { type: 'skill', skill: checkSkill });
      setCheckModifier(String(input.modifier));
      setCheckLabel(skillNames[checkSkill][locale === 'en' ? 1 : 0]);
    } else if (checkKind === 'save') {
      const input = getDndLiteCheckInput(checkSheet, { type: 'save', ability: checkAbility });
      setCheckModifier(String(input.modifier));
      setCheckLabel(abilityNames[checkAbility][locale === 'en' ? 1 : 0]);
    }
  }, [checkAbility, checkKind, checkSheet, checkSkill, locale]);

  useEffect(() => {
    if (!selectedAction) return;
    const input = getDndActionRollInput(selectedAction);
    if (input.attackBonus !== undefined) setAttackBonus(String(input.attackBonus));
    if (input.damageFormula) setDamageFormula(input.damageFormula);
  }, [selectedAction]);

  useEffect(() => {
    if (!preset) return;
    setExternalAttackerName('');
    setAttacker(preset.actorInstanceId);
    setActionId(preset.actionId ?? '');
  }, [preset]);
  useEffect(() => {
    if (!monsterActionPreset) return;
    setAttacker('');
    setActionId('');
    setExternalAttackerName(monsterActionPreset.monsterName);
    if (monsterActionPreset.action.attackBonus !== undefined) setAttackBonus(String(monsterActionPreset.action.attackBonus));
    if (monsterActionPreset.action.damageFormula) setDamageFormula(monsterActionPreset.action.damageFormula);
  }, [monsterActionPreset]);

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
      const result = rollDndCheck({ kind: checkKind, actorName: actorNameFor(checkActor), label: checkLabel, modifier: optionalInteger(checkModifier) ?? 0, dc: optionalInteger(checkDc), mode: checkMode });
      const draft = dndCheckToRuntimeEvent(result, locale === 'en' ? 'en' : 'zh-CN');
      saveResult(t('dndDice.check'), String(draft.payload.summary), draft);
    });
  };

  const handleAttack = (event: FormEvent) => {
    event.preventDefault();
    run(() => {
      const result = rollDndAttack({ attackerName: externalAttackerName || actorNameFor(attacker), targetName: target, attackBonus: optionalInteger(attackBonus) ?? 0, targetAc: optionalInteger(targetAc), mode: attackMode });
      const draft = dndAttackToRuntimeEvent(result, locale === 'en' ? 'en' : 'zh-CN');
      saveResult(t('dndDice.attack'), String(draft.payload.summary), draft);
    });
  };

  const handleDamage = (event: FormEvent) => {
    event.preventDefault();
    run(() => {
      const result = rollDndDamage(damageFormula, { critical: criticalDamage });
      const draft = dndDamageToRuntimeEvent(result, externalAttackerName || actorNameFor(attacker), locale === 'en' ? 'en' : 'zh-CN');
      saveResult(t('dndDice.damage'), String(draft.payload.summary), draft);
      onDamageReady?.({ amount: result.total, sourceName: externalAttackerName || actorNameFor(attacker) || undefined, targetName: target.trim() || undefined, rollRef: result.formula, nonce: Date.now() });
    });
  };

  const modeControl = (value: DndRollMode, onChange: (next: DndRollMode) => void) => (
    <select value={value} onChange={(event) => onChange(event.target.value as DndRollMode)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50">
      <option value="normal">{t('dndDice.normal')}</option>
      <option value="advantage">{t('dndDice.advantage')}</option>
      <option value="disadvantage">{t('dndDice.disadvantage')}</option>
    </select>
  );

  const actorOptions = <>{actorChoices.map((choice) => <option key={choice.value} value={choice.value}>{choice.name}{actorSheets[choice.value] ? ` · ${t('dndDice.actorSheetReady')}` : ''}</option>)}</>;

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
            {(checkKind === 'ability' || checkKind === 'save') && <select value={checkAbility} onChange={(event) => setCheckAbility(event.target.value as DndAbilityKey)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50">{Object.entries(abilityNames).map(([key, label]) => <option key={key} value={key}>{label[locale === 'en' ? 1 : 0]}</option>)}</select>}
            {checkKind === 'skill' && <select value={checkSkill} onChange={(event) => setCheckSkill(event.target.value as DndSkillKey)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50">{Object.entries(skillNames).map(([key, label]) => <option key={key} value={key}>{label[locale === 'en' ? 1 : 0]}</option>)}</select>}
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
            <select value={attacker} onChange={(event) => { setAttacker(event.target.value); setActionId(''); setExternalAttackerName(''); }} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="">{t('dndDice.attacker')}</option>{actorOptions}</select>
            <input value={target} onChange={(event) => setTarget(event.target.value)} disabled={!canManage} placeholder={t('dndDice.targetOptional')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
            {attackerSheet && attackerSheet.actions.length > 0 && <select value={actionId} onChange={(event) => setActionId(event.target.value)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="">{t('dndDice.actionOptional')}</option>{attackerSheet.actions.map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}</select>}
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
