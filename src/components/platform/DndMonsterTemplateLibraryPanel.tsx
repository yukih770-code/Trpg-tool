import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import { ApiClientError } from '../../lib/api/apiTypes';
import { dndMonsterTemplateApiClient } from '../../lib/api/dndMonsterTemplateApiClient';
import { type DndMonsterAction, type DndPrivateMonsterTemplate } from '../../lib/dnd/dndMonsterTemplateTypes';

type Props = {
  locale: Locale;
  worldServerId: string;
  canManage: boolean;
  monsters: DndPrivateMonsterTemplate[];
  loading: boolean;
  error: ApiClientError | null;
  onRefresh: () => Promise<void>;
  onAddToCombat: (monster: DndPrivateMonsterTemplate) => void;
  onCreateActorDraft: (monster: DndPrivateMonsterTemplate) => Promise<void>;
  onUseAction: (monster: DndPrivateMonsterTemplate, action: DndMonsterAction) => void;
};

type BasicFields = {
  name: string;
  creatureType: string;
  challengeRating: string;
  armorClass: string;
  hitPoints: string;
};

const emptyBasics: BasicFields = { name: '', creatureType: '', challengeRating: '', armorClass: '', hitPoints: '' };
function message(locale: Locale, zh: string, en: string) { return locale === 'en' ? en : zh; }
function actionCount(monster: DndPrivateMonsterTemplate) { return monster.actions.length + monster.reactions.length + monster.legendaryActions.length; }
function basics(monster?: DndPrivateMonsterTemplate): BasicFields {
  if (!monster) return emptyBasics;
  return {
    name: monster.name,
    creatureType: monster.creatureType ?? '',
    challengeRating: monster.challengeRating ?? '',
    armorClass: monster.armorClass?.toString() ?? '',
    hitPoints: monster.hitPointsAverage?.toString() ?? '',
  };
}

export function DndMonsterTemplateLibraryPanel({
  locale, worldServerId, canManage, monsters, loading, error, onRefresh, onAddToCombat, onCreateActorDraft, onUseAction,
}: Props) {
  const { t } = createTranslator(locale);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [createFields, setCreateFields] = useState<BasicFields>(emptyBasics);
  const [editFields, setEditFields] = useState<BasicFields>(emptyBasics);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const types = useMemo(
    () => [...new Set(monsters.map((monster) => monster.creatureType).filter(Boolean) as string[])].sort(),
    [monsters],
  );
  const visible = useMemo(() => monsters.filter((monster) => (
    (!search.trim() || `${monster.name} ${monster.creatureType ?? ''} ${monster.challengeRating ?? ''} ${monster.tags.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))
    && (!typeFilter || monster.creatureType === typeFilter)
  )), [monsters, search, typeFilter]);
  const selected = monsters.find((monster) => monster.monsterTemplateId === selectedId);

  useEffect(() => setEditFields(basics(selected)), [selected]);

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage || !createFields.name.trim()) return;
    setBusy(true); setNotice('');
    try {
      await dndMonsterTemplateApiClient.create(worldServerId, {
        name: createFields.name.trim(),
        creatureType: createFields.creatureType.trim() || undefined,
        challengeRating: createFields.challengeRating.trim() || undefined,
        armorClass: createFields.armorClass.trim() ? Number(createFields.armorClass) : undefined,
        hitPointsAverage: createFields.hitPoints.trim() ? Number(createFields.hitPoints) : undefined,
        speed: {}, abilities: {}, savingThrows: {}, skills: {}, senses: {}, traits: [], actions: [], reactions: [], legendaryActions: [], tags: [],
      });
      setCreateFields(emptyBasics); setNotice(t('dndMonsters.created')); await onRefresh();
    } catch { setNotice(t('dndMonsters.actionFailed')); } finally { setBusy(false); }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !canManage || !editFields.name.trim()) return;
    setBusy(true); setNotice('');
    try {
      await dndMonsterTemplateApiClient.update(worldServerId, selected.monsterTemplateId, {
        name: editFields.name.trim(),
        creatureType: editFields.creatureType.trim() || undefined,
        challengeRating: editFields.challengeRating.trim() || undefined,
        armorClass: editFields.armorClass.trim() ? Number(editFields.armorClass) : undefined,
        hitPointsAverage: editFields.hitPoints.trim() ? Number(editFields.hitPoints) : undefined,
      });
      setNotice(t('dndMonsters.updated')); await onRefresh();
    } catch { setNotice(t('dndMonsters.actionFailed')); } finally { setBusy(false); }
  };

  const archive = async () => {
    if (!selected || !canManage) return;
    setBusy(true); setNotice('');
    try {
      await dndMonsterTemplateApiClient.archive(worldServerId, selected.monsterTemplateId);
      setSelectedId(''); await onRefresh();
    } catch { setNotice(t('dndMonsters.actionFailed')); } finally { setBusy(false); }
  };

  const fieldInputs = (fields: BasicFields, setFields: (fields: BasicFields) => void, disabled: boolean) => (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <input value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} disabled={disabled} placeholder={t('dndMonsters.name')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
      <input value={fields.creatureType} onChange={(event) => setFields({ ...fields, creatureType: event.target.value })} disabled={disabled} placeholder={t('dndMonsters.creatureType')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
      <input value={fields.challengeRating} onChange={(event) => setFields({ ...fields, challengeRating: event.target.value })} disabled={disabled} placeholder={t('dndMonsters.challengeRating')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
      <input value={fields.armorClass} onChange={(event) => setFields({ ...fields, armorClass: event.target.value })} disabled={disabled} type="number" placeholder={t('dndMonsters.ac')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
      <input value={fields.hitPoints} onChange={(event) => setFields({ ...fields, hitPoints: event.target.value })} disabled={disabled} type="number" placeholder={t('dndMonsters.hp')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm disabled:opacity-50" />
    </div>
  );

  return <section className="mt-5 rounded-2xl border border-[#3d5232]/20 bg-[#f7fbf2] p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('dndMonsters.eyebrow')}</div><h4 className="mt-1 text-xl font-black">{t('dndMonsters.title')}</h4><p className="mt-1 max-w-2xl text-xs leading-5 text-[#51483d]">{t('dndMonsters.note')}</p></div>
      <button type="button" onClick={() => void onRefresh()} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold">{t('dndMonsters.refresh')}</button>
    </div>
    {!canManage && <p className="mt-3 rounded-lg bg-[#fff8e6] px-3 py-2 text-xs text-[#51483d]">{t('dndMonsters.hostOnly')}</p>}
    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(15rem,.8fr)_minmax(0,1.2fr)]">
      <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
        <div className="flex gap-2"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('dndMonsters.search')} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-2 text-xs"><option value="">{t('dndMonsters.allTypes')}</option>{types.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
        {loading && <p className="mt-3 text-sm text-[#51483d]">{t('dndMonsters.loading')}</p>}
        {error && <p className="mt-3 text-sm text-[#8b3a2f]">{t('dndMonsters.unavailable')}</p>}
        {!loading && !error && visible.length === 0 && <p className="mt-3 rounded-lg border border-dashed border-[#2f2a22]/15 p-3 text-sm text-[#51483d]">{t('dndMonsters.empty')}</p>}
        <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-auto">{visible.map((monster) => <button key={monster.monsterTemplateId} type="button" onClick={() => setSelectedId(monster.monsterTemplateId)} className={`rounded-lg border p-3 text-left ${monster.monsterTemplateId === selectedId ? 'border-[#3d5232]/50 bg-[#eef8e7]' : 'border-[#2f2a22]/10 bg-[#f7f3ea]'}`}><div className="font-bold">{monster.name}</div><div className="mt-1 text-xs text-[#51483d]">{monster.creatureType || t('dndMonsters.unknownType')} · CR {monster.challengeRating ?? '—'} · AC {monster.armorClass ?? '—'} · HP {monster.hitPointsAverage ?? '—'}</div></button>)}</div>
      </div>
      <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
        {!selected ? <p className="text-sm leading-6 text-[#51483d]">{t('dndMonsters.select')}</p> : <>
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h5 className="text-lg font-bold">{selected.name}</h5><p className="mt-1 text-xs text-[#51483d]">{selected.size || '—'} {selected.creatureType || t('dndMonsters.unknownType')} · {selected.alignment || '—'} · CR {selected.challengeRating ?? '—'}</p></div><span className="rounded-full bg-[#3d5232]/10 px-2 py-1 text-[11px] font-bold text-[#3d5232]">{t('dndMonsters.privateBadge')}</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3"><div className="rounded-lg bg-[#f7f3ea] p-2 text-xs"><b>{t('dndMonsters.ac')}</b><br />{selected.armorClass ?? '—'}</div><div className="rounded-lg bg-[#f7f3ea] p-2 text-xs"><b>{t('dndMonsters.hp')}</b><br />{selected.hitPointsAverage ?? '—'}{selected.hitPointsFormula ? ` (${selected.hitPointsFormula})` : ''}</div><div className="rounded-lg bg-[#f7f3ea] p-2 text-xs"><b>{t('dndMonsters.speed')}</b><br />{Object.values(selected.speed).join(', ') || '—'}</div></div>
          <p className="mt-3 text-xs text-[#51483d]">{t('dndMonsters.actions')}: {actionCount(selected)} · {t('dndMonsters.senses')}: {Object.values(selected.senses).join(', ') || '—'} · {t('dndMonsters.languages')}: {selected.languages || '—'}</p>
          {canManage && <form onSubmit={(event) => void submitEdit(event)} className="mt-3 border-t border-[#2f2a22]/10 pt-3"><h6 className="text-xs font-bold">{t('dndMonsters.editBasics')}</h6>{fieldInputs(editFields, setEditFields, busy)}<button type="submit" disabled={busy || !editFields.name.trim()} className="mt-2 rounded-md border border-[#2f2a22]/15 px-2.5 py-1.5 text-xs font-bold disabled:opacity-40">{t('dndMonsters.saveBasics')}</button></form>}
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => onAddToCombat(selected)} disabled={!canManage} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('dndMonsters.addToCombat')}</button><button type="button" onClick={() => void onCreateActorDraft(selected)} disabled={!canManage || busy} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold disabled:opacity-40">{t('dndMonsters.createActor')}</button><button type="button" onClick={() => void archive()} disabled={!canManage || busy} className="rounded-md border border-[#8b3a2f]/25 px-3 py-2 text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('dndMonsters.archive')}</button></div>
          {selected.actions.length > 0 && <div className="mt-3 border-t border-[#2f2a22]/10 pt-3"><h6 className="text-xs font-bold">{t('dndMonsters.actions')}</h6><div className="mt-2 flex flex-wrap gap-2">{selected.actions.map((action) => <button key={action.id} type="button" onClick={() => onUseAction(selected, action)} disabled={!canManage} className="rounded-md border border-[#2f2a22]/15 bg-[#f7f3ea] px-2.5 py-1.5 text-xs disabled:opacity-40">{action.name}{action.attackBonus === undefined ? '' : ` +${action.attackBonus}`}</button>)}</div></div>}
        </>}
      </div>
    </div>
    <form onSubmit={(event) => void submitCreate(event)} className="mt-4 rounded-xl border border-dashed border-[#2f2a22]/18 bg-white/70 p-3"><h5 className="font-bold">{t('dndMonsters.createManual')}</h5><p className="mt-1 text-xs text-[#51483d]">{t('dndMonsters.manualNote')}</p>{fieldInputs(createFields, setCreateFields, !canManage)}<button type="submit" disabled={!canManage || busy} className="mt-3 rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('dndMonsters.create')}</button>{notice && <p className="mt-2 text-xs text-[#51483d]">{notice}</p>}</form>
    <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{message(locale, '这是你的私有内容，不会作为平台公开资料。', 'This is private content and is not public platform material.')}</p>
  </section>;
}
