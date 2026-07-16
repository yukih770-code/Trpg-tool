import { useEffect, useMemo, useState } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import type { CampaignActorInstance } from '../../lib/api/campaignRoomApiClient';
import { createDefaultDndLiteActorSheet, getDndLiteCombatantPrefill, summarizeDndLiteActorSheet, validateDndLiteActorSheet } from '../../lib/dnd/dndLiteActorSheet';
import { DND_ABILITY_KEYS, DND_SKILL_KEYS, type DndAbilityKey, type DndLiteActorAction, type DndLiteActorActionKind, type DndLiteActorKind, type DndLiteActorSheet, type DndSkillKey } from '../../lib/dnd/dndLiteActorTypes';

type Props = {
  locale: Locale;
  canManage: boolean;
  campaignActors: CampaignActorInstance[];
  sheets: Record<string, DndLiteActorSheet>;
  onSave: (actorInstanceId: string, sheet: DndLiteActorSheet) => void;
  onClear: (actorInstanceId: string) => void;
  onUseAction: (actorInstanceId: string, actionId: string) => void;
  onAddToCombat: (prefill: ReturnType<typeof getDndLiteCombatantPrefill>) => void;
};

const abilityNames: Record<DndAbilityKey, [string, string]> = {
  strength: ['力量', 'Strength'], dexterity: ['敏捷', 'Dexterity'], constitution: ['体质', 'Constitution'],
  intelligence: ['智力', 'Intelligence'], wisdom: ['感知', 'Wisdom'], charisma: ['魅力', 'Charisma'],
};

const skillNames: Record<DndSkillKey, [string, string]> = {
  acrobatics: ['体操', 'Acrobatics'], animalHandling: ['驯兽', 'Animal Handling'], arcana: ['奥秘', 'Arcana'], athletics: ['运动', 'Athletics'], deception: ['欺瞒', 'Deception'], history: ['历史', 'History'], insight: ['洞悉', 'Insight'], intimidation: ['威吓', 'Intimidation'], investigation: ['调查', 'Investigation'], medicine: ['医药', 'Medicine'], nature: ['自然', 'Nature'], perception: ['察觉', 'Perception'], performance: ['表演', 'Performance'], persuasion: ['游说', 'Persuasion'], religion: ['宗教', 'Religion'], sleightOfHand: ['巧手', 'Sleight of Hand'], stealth: ['隐匿', 'Stealth'], survival: ['求生', 'Survival'],
};

function actorKindFromCampaign(actor: CampaignActorInstance): DndLiteActorKind {
  return actor.actorKind === 'pc' ? 'pc' : actor.actorKind === 'npc' ? 'npc' : actor.actorKind === 'monster' ? 'monster' : 'unknown';
}

function asNumber(value: string, fallback?: number): number | undefined {
  if (!value.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function DndLiteActorSheetPanel({ locale, canManage, campaignActors, sheets, onSave, onClear, onUseAction, onAddToCombat }: Props) {
  const { t } = createTranslator(locale);
  const [actorInstanceId, setActorInstanceId] = useState('');
  const [draft, setDraft] = useState<DndLiteActorSheet>(() => createDefaultDndLiteActorSheet());
  const [saveKey, setSaveKey] = useState<DndAbilityKey>('strength');
  const [saveValue, setSaveValue] = useState('');
  const [skillKey, setSkillKey] = useState<DndSkillKey>('athletics');
  const [skillValue, setSkillValue] = useState('');
  const [notice, setNotice] = useState('');
  const selectedActor = useMemo(() => campaignActors.find((actor) => actor.campaignActorInstanceId === actorInstanceId), [actorInstanceId, campaignActors]);

  useEffect(() => {
    if (!selectedActor) return;
    setDraft(sheets[selectedActor.campaignActorInstanceId] ?? createDefaultDndLiteActorSheet({ displayName: selectedActor.displayName, actorKind: actorKindFromCampaign(selectedActor) }));
    setNotice('');
  }, [selectedActor, sheets]);

  const update = (next: Partial<DndLiteActorSheet>) => setDraft((previous) => ({ ...previous, ...next }));
  const updateDefense = (key: keyof DndLiteActorSheet['defenses'], value: string) => setDraft((previous) => ({ ...previous, defenses: { ...previous.defenses, [key]: asNumber(value) } }));
  const updateAbility = (key: DndAbilityKey, value: string) => setDraft((previous) => ({ ...previous, abilities: { ...previous.abilities, [key]: asNumber(value, previous.abilities[key]) ?? previous.abilities[key] } }));
  const updateAction = (actionId: string, next: Partial<DndLiteActorAction>) => setDraft((previous) => ({ ...previous, actions: previous.actions.map((action) => action.id === actionId ? { ...action, ...next } : action) }));
  const summary = summarizeDndLiteActorSheet(draft);

  const addAction = () => setDraft((previous) => ({ ...previous, actions: [...previous.actions, { id: `action-${Date.now()}-${previous.actions.length}`, name: t('dndActorSheet.newAction'), kind: 'weapon_attack' }] }));
  const addSaveOverride = () => {
    const value = asNumber(saveValue);
    if (value === undefined) return;
    setDraft((previous) => ({ ...previous, savingThrows: { ...previous.savingThrows, [saveKey]: value } }));
    setSaveValue('');
  };
  const addSkillOverride = () => {
    const value = asNumber(skillValue);
    if (value === undefined) return;
    setDraft((previous) => ({ ...previous, skills: { ...previous.skills, [skillKey]: value } }));
    setSkillValue('');
  };
  const saveSheet = () => {
    if (!selectedActor) return;
    const validation = validateDndLiteActorSheet(draft);
    if (!validation.valid) { setNotice(t('dndActorSheet.invalid')); return; }
    onSave(selectedActor.campaignActorInstanceId, draft);
    setNotice(t('dndActorSheet.savedLocal'));
  };

  return (
    <section className="mt-5 rounded-2xl border border-[#58180d]/15 bg-[#fffaf0] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('dndActorSheet.eyebrow')}</div><h4 className="mt-1 text-xl font-black">{t('dndActorSheet.title')}</h4><p className="mt-1 max-w-2xl text-xs leading-5 text-[#51483d]">{t('dndActorSheet.note')}</p></div><span className="rounded-full bg-[#58180d]/10 px-2.5 py-1 text-xs font-bold text-[#58180d]">DND 5e</span></div>
      {!canManage && <p className="mt-3 rounded-lg bg-[#fff8e6] px-3 py-2 text-xs text-[#51483d]">{t('dndActorSheet.hostOnly')}</p>}
      {campaignActors.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-[#2f2a22]/15 bg-white p-4 text-sm text-[#51483d]">{t('dndActorSheet.noActors')}</p> : <>
        <div className="mt-4 rounded-xl border border-[#2f2a22]/10 bg-white p-3"><label className="text-xs font-bold">{t('dndActorSheet.selectActor')}</label><select value={actorInstanceId} onChange={(event) => setActorInstanceId(event.target.value)} disabled={!canManage} className="mt-2 w-full rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="">{t('dndActorSheet.chooseActor')}</option>{campaignActors.map((actor) => <option key={actor.campaignActorInstanceId} value={actor.campaignActorInstanceId}>{actor.displayName}{sheets[actor.campaignActorInstanceId] ? ` · ${t('dndActorSheet.sheetReady')}` : ''}</option>)}</select></div>
        {selectedActor && <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><div className="grid gap-2 sm:grid-cols-3"><input value={draft.displayName} onChange={(event) => update({ displayName: event.target.value })} disabled={!canManage} placeholder={t('dndActorSheet.displayName')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><select value={draft.actorKind} onChange={(event) => update({ actorKind: event.target.value as DndLiteActorKind })} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="pc">{t('dndActorSheet.pc')}</option><option value="npc">{t('dndActorSheet.npc')}</option><option value="monster">{t('dndActorSheet.monster')}</option><option value="unknown">{t('dndActorSheet.unknown')}</option></select><input value={draft.proficiencyBonus} onChange={(event) => update({ proficiencyBonus: asNumber(event.target.value, draft.proficiencyBonus) ?? draft.proficiencyBonus })} disabled={!canManage} type="number" placeholder={t('dndActorSheet.proficiency')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><input value={draft.defenses.armorClass ?? ''} onChange={(event) => updateDefense('armorClass', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.ac')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={draft.defenses.currentHp ?? ''} onChange={(event) => updateDefense('currentHp', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.currentHp')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={draft.defenses.maxHp ?? ''} onChange={(event) => updateDefense('maxHp', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.maxHp')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={draft.defenses.temporaryHp ?? ''} onChange={(event) => updateDefense('temporaryHp', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.tempHp')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={draft.defenses.speedFt ?? ''} onChange={(event) => updateDefense('speedFt', event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.speed')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /></div></div>
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><h5 className="font-bold text-sm">{t('dndActorSheet.abilities')}</h5><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{DND_ABILITY_KEYS.map((key) => <label key={key} className="rounded-lg bg-[#f7f3ea] px-3 py-2 text-xs"><span className="font-bold">{abilityNames[key][locale === 'en' ? 1 : 0]}</span><span className="ml-2 text-[#51483d]">{t('dndActorSheet.modifier')} {draft.abilities[key] >= 10 ? '+' : ''}{Math.floor((draft.abilities[key] - 10) / 2)}</span><input value={draft.abilities[key]} onChange={(event) => updateAbility(key, event.target.value)} disabled={!canManage} type="number" className="mt-2 w-full rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-sm disabled:opacity-50" /></label>)}</div></div>
          <div className="grid gap-3 lg:grid-cols-2"><div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><h5 className="font-bold text-sm">{t('dndActorSheet.saves')}</h5><div className="mt-3 flex gap-2"><select value={saveKey} onChange={(event) => setSaveKey(event.target.value as DndAbilityKey)} disabled={!canManage} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 bg-white px-2 py-2 text-xs disabled:opacity-50">{DND_ABILITY_KEYS.map((key) => <option key={key} value={key}>{abilityNames[key][locale === 'en' ? 1 : 0]}</option>)}</select><input value={saveValue} onChange={(event) => setSaveValue(event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.override')} className="w-24 rounded-md border border-[#2f2a22]/15 px-2 py-2 text-xs disabled:opacity-50" /><button type="button" onClick={addSaveOverride} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 px-2 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.set')}</button></div><div className="mt-2 flex flex-wrap gap-2">{Object.entries(draft.savingThrows ?? {}).map(([key, value]) => <button key={key} type="button" onClick={() => setDraft((previous) => { const next = { ...previous.savingThrows }; delete next[key as DndAbilityKey]; return { ...previous, savingThrows: next }; })} disabled={!canManage} className="rounded-full bg-[#f7f3ea] px-2 py-1 text-xs">{abilityNames[key as DndAbilityKey][locale === 'en' ? 1 : 0]} {value} ×</button>)}</div></div><div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><h5 className="font-bold text-sm">{t('dndActorSheet.skills')}</h5><div className="mt-3 flex gap-2"><select value={skillKey} onChange={(event) => setSkillKey(event.target.value as DndSkillKey)} disabled={!canManage} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 bg-white px-2 py-2 text-xs disabled:opacity-50">{DND_SKILL_KEYS.map((key) => <option key={key} value={key}>{skillNames[key][locale === 'en' ? 1 : 0]}</option>)}</select><input value={skillValue} onChange={(event) => setSkillValue(event.target.value)} disabled={!canManage} type="number" placeholder={t('dndActorSheet.override')} className="w-24 rounded-md border border-[#2f2a22]/15 px-2 py-2 text-xs disabled:opacity-50" /><button type="button" onClick={addSkillOverride} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 px-2 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.set')}</button></div><div className="mt-2 flex flex-wrap gap-2">{Object.entries(draft.skills ?? {}).map(([key, value]) => <button key={key} type="button" onClick={() => setDraft((previous) => { const next = { ...previous.skills }; delete next[key as DndSkillKey]; return { ...previous, skills: next }; })} disabled={!canManage} className="rounded-full bg-[#f7f3ea] px-2 py-1 text-xs">{skillNames[key as DndSkillKey][locale === 'en' ? 1 : 0]} {value} ×</button>)}</div></div></div>
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><div className="flex items-center justify-between gap-2"><h5 className="font-bold text-sm">{t('dndActorSheet.actions')}</h5><button type="button" onClick={addAction} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.addAction')}</button></div><div className="mt-3 grid gap-3">{draft.actions.map((action) => <div key={action.id} className="rounded-lg bg-[#f7f3ea] p-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input value={action.name} onChange={(event) => updateAction(action.id, { name: event.target.value })} disabled={!canManage} placeholder={t('dndActorSheet.actionName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><select value={action.kind} onChange={(event) => updateAction(action.id, { kind: event.target.value as DndLiteActorActionKind })} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50"><option value="weapon_attack">{t('dndActorSheet.weaponAttack')}</option><option value="spell_attack">{t('dndActorSheet.spellAttack')}</option><option value="save_dc">{t('dndActorSheet.saveAction')}</option><option value="damage_only">{t('dndActorSheet.damageOnly')}</option><option value="utility">{t('dndActorSheet.utility')}</option></select><input value={action.attackBonus ?? ''} onChange={(event) => updateAction(action.id, { attackBonus: asNumber(event.target.value) })} disabled={!canManage} type="number" placeholder={t('dndActorSheet.attackBonus')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><input value={action.damageFormula ?? ''} onChange={(event) => updateAction(action.id, { damageFormula: event.target.value || undefined })} disabled={!canManage} placeholder={t('dndActorSheet.damageFormula')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><input value={action.damageType ?? ''} onChange={(event) => updateAction(action.id, { damageType: event.target.value || undefined })} disabled={!canManage} placeholder={t('dndActorSheet.damageType')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><select value={action.saveAbility ?? ''} onChange={(event) => updateAction(action.id, { saveAbility: event.target.value ? event.target.value as DndAbilityKey : undefined })} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50"><option value="">{t('dndActorSheet.saveAbility')}</option>{DND_ABILITY_KEYS.map((key) => <option key={key} value={key}>{abilityNames[key][locale === 'en' ? 1 : 0]}</option>)}</select><input value={action.saveDc ?? ''} onChange={(event) => updateAction(action.id, { saveDc: asNumber(event.target.value) })} disabled={!canManage} type="number" placeholder={t('dndActorSheet.saveDc')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /><input value={action.notes ?? ''} onChange={(event) => updateAction(action.id, { notes: event.target.value || undefined })} disabled={!canManage} placeholder={t('dndActorSheet.notes')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs disabled:opacity-50" /></div><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => onUseAction(selectedActor.campaignActorInstanceId, action.id)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-2.5 py-1.5 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.useInDice')}</button><button type="button" onClick={() => setDraft((previous) => ({ ...previous, actions: previous.actions.filter((item) => item.id !== action.id) }))} disabled={!canManage} className="rounded-md border border-[#8b3a2f]/20 bg-white px-2.5 py-1.5 text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('dndActorSheet.remove')}</button></div></div>)}</div></div>
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3"><textarea value={draft.notes ?? ''} onChange={(event) => update({ notes: event.target.value || undefined })} disabled={!canManage} placeholder={t('dndActorSheet.notes')} className="min-h-20 w-full rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><input value={(draft.tags ?? []).join(', ')} onChange={(event) => update({ tags: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} disabled={!canManage} placeholder={t('dndActorSheet.tags')} className="mt-2 w-full rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={saveSheet} disabled={!canManage} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('dndActorSheet.save')}</button><button type="button" onClick={() => onAddToCombat(getDndLiteCombatantPrefill(draft, selectedActor.campaignActorInstanceId))} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.addToCombat')}</button><button type="button" onClick={() => { onClear(selectedActor.campaignActorInstanceId); setDraft(createDefaultDndLiteActorSheet({ displayName: selectedActor.displayName, actorKind: actorKindFromCampaign(selectedActor) })); setNotice(t('dndActorSheet.cleared')); }} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('dndActorSheet.clear')}</button></div>{notice && <p className="mt-2 text-xs text-[#51483d]">{notice}</p>}<p className="mt-3 text-[11px] text-[#51483d]">{summary.displayName} · AC {summary.armorClass ?? '—'} · HP {summary.hpText ?? '—'} · {summary.actionCount} {t('dndActorSheet.actionCount')}</p></div>
        </div>}
      </>}
      <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('dndActorSheet.boundary')}</p>
    </section>
  );
}
