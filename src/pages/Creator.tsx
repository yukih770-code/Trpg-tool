import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { getAvailableRaces, getAvailableClasses, getAvailableFeats, getAvailableSpells } from '../lib/mod-utils';
import { BACKGROUND_DATA } from '../data/backgrounds';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ScrollArea } from '../../components/ui/scroll-area';
import { AttributeName } from '../lib/dnd-types';
import { personalCompendiumPackApiClient, type PersonalCompendiumPack, type PersonalCompendiumPackVersionContent } from '../lib/api/personalCompendiumPackApiClient';
import { ApiClientError } from '../lib/api/apiTypes';
import {
  personalBackgroundEntriesToBackgroundDefs,
  personalFeatEntriesToFeatDefs,
  personalSpeciesEntriesToRaceDefs,
} from '../lib/platform/dndPersonalContentAdapter';
import { createTranslator, readStoredLocale } from '../i18n';
import { toast } from 'sonner';

type BuilderSection =
  | 'identity'
  | 'sources'
  | 'species'
  | 'background'
  | 'class'
  | 'abilities'
  | 'feats'
  | 'spells'
  | 'equipment'
  | 'review';

const ATTR_LIST: AttributeName[] = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'];
const ATTR_LABELS: Record<AttributeName, string> = {
  Str: '力量',
  Dex: '敏捷',
  Con: '体质',
  Int: '智力',
  Wis: '感知',
  Cha: '魅力',
};

/**
 * AI-LANDMARK: DND_CHARACTER_BUILDER_RESPONSIVE_WORKBENCH_PHASE_1
 *
 * Phase 1 keeps the original creator state writes and completion logic intact,
 * but presents them through a responsive Builder Workbench: section navigation,
 * current editor, and live summary. Placeholder sections are display-only.
 */
export function Creator({ onComplete }: { onComplete: () => void }) {
  const { t } = createTranslator(readStoredLocale());
  const [section, setSection] = useState<BuilderSection>('identity');
  const [personalPacks, setPersonalPacks] = useState<PersonalCompendiumPack[]>([]);
  const [personalPacksLoading, setPersonalPacksLoading] = useState(true);
  const [personalPacksError, setPersonalPacksError] = useState('');
  const [selectedPersonalPackContent, setSelectedPersonalPackContent] = useState<PersonalCompendiumPackVersionContent | null>(null);
  const [selectedPersonalPackContentLoading, setSelectedPersonalPackContentLoading] = useState(false);
  const [selectedPersonalPackContentError, setSelectedPersonalPackContentError] = useState('');
  const { character, updateField, updateAttrPointBuy, resetCreator } = useCharacterStore();

  const selectedPersonalReference = character.personalContentReferences[0];
  const baseRaceData = getAvailableRaces(character);
  const personalRaceData = personalSpeciesEntriesToRaceDefs(selectedPersonalPackContent?.entries ?? [])
    .filter((race) => !baseRaceData.some((baseRace) => baseRace.name === race.name));
  const RACE_DATA = [...baseRaceData, ...personalRaceData];
  const CLASS_DATA = getAvailableClasses(character);
  const personalBackgroundData = personalBackgroundEntriesToBackgroundDefs(selectedPersonalPackContent?.entries ?? [])
    .filter((background) => !BACKGROUND_DATA.some((baseBackground) => baseBackground.name === background.name));
  const AVAILABLE_BACKGROUND_DATA = [...BACKGROUND_DATA, ...personalBackgroundData];
  const baseFeatData = getAvailableFeats(character);
  const personalFeatData = personalFeatEntriesToFeatDefs(selectedPersonalPackContent?.entries ?? [])
    .filter((feat) => !baseFeatData.some((baseFeat) => baseFeat.name === feat.name));
  const FEAT_DATA = [...baseFeatData, ...personalFeatData];
  const SPELL_DATA = getAvailableSpells(character);

  useEffect(() => {
    let disposed = false;
    personalCompendiumPackApiClient.list()
      .then((packs) => {
        if (!disposed) setPersonalPacks(packs.filter((pack) => pack.latestVersion));
      })
      .catch((reason) => {
        if (disposed) return;
        setPersonalPacksError(reason instanceof ApiClientError && reason.statusCode === 401
          ? '登录后可读取你的自定义资料包。'
          : '暂时无法读取你的自定义资料包；你仍可继续使用基础资料创建角色。');
      })
      .finally(() => {
        if (!disposed) setPersonalPacksLoading(false);
      });
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    let disposed = false;
    if (!selectedPersonalReference) {
      setSelectedPersonalPackContent(null);
      setSelectedPersonalPackContentError('');
      setSelectedPersonalPackContentLoading(false);
      return () => { disposed = true; };
    }
    setSelectedPersonalPackContentLoading(true);
    setSelectedPersonalPackContentError('');
    personalCompendiumPackApiClient.getVersion(selectedPersonalReference.packId, selectedPersonalReference.packVersionId)
      .then((content) => { if (!disposed) setSelectedPersonalPackContent(content); })
      .catch((reason) => {
        if (disposed) return;
        setSelectedPersonalPackContent(null);
        setSelectedPersonalPackContentError(reason instanceof ApiClientError && reason.statusCode === 404
          ? '找不到这个个人资料版本。可在资料来源中重新选择。'
          : '暂时无法读取此个人资料版本；基础种族仍可使用。');
      })
      .finally(() => { if (!disposed) setSelectedPersonalPackContentLoading(false); });
    return () => { disposed = true; };
  }, [selectedPersonalReference?.packId, selectedPersonalReference?.packVersionId]);

  const goToValidationSection = (target: BuilderSection) => setSection(target);

  const handleComplete = () => {
    if (!character.name) {
      goToValidationSection('identity'); return toast('请填写角色名字');
    }
    if (!character.race) {
      goToValidationSection('species'); return toast('请选择种族');
    }
    const race = RACE_DATA.find(r => r.name === character.race);
    if (race?.subraces.length && !character.subrace) {
      goToValidationSection('species'); return toast('请选择子种族');
    }
    if (!character.jobClass) {
      goToValidationSection('class'); return toast('请选择职业');
    }
    const cls = CLASS_DATA.find(c => c.name === character.jobClass);
    if (cls?.subclasses.some(s => s.unlockLevel === 1) && !character.subclass) {
      goToValidationSection('class'); return toast('请选择子职业');
    }
    if (!character.background) {
      goToValidationSection('background'); return toast('请选择背景');
    }
    if (!character.feats || character.feats.length === 0) {
      goToValidationSection('feats'); return toast('请选择一个玩家/出身专长');
    }
    if (character.remainingPoints > 0) {
      goToValidationSection('abilities'); return toast('属性未分配完毕', { description: '请分配剩余的属性点。' });
    }

    const conVal = character.attrs.Con.base + character.attrs.Con.pointbuy + character.attrs.Con.racebonus;
    const conMod = Math.floor((conVal - 10) / 2);
    const hitDiceSizes: Record<string, number> = { '野蛮人': 12, '战士': 10, '圣武士': 10, '游侠': 10, '法师': 6, '术士': 6, '护法': 10, '武僧': 8, '吟游诗人': 8, '牧师': 8, '德鲁伊': 8, '邪术师': 8, '游荡者': 8 };
    const hd = hitDiceSizes[character.jobClass] || 8;
    const initialHp = hd + conMod;
    const isCaster = ['法师', '吟游诗人', '牧师', '术士', '邪术师', '德鲁伊'].includes(character.jobClass);

    const spellbook = { ...character.spellbook };
    if (isCaster) {
      spellbook.slots = { 1: { max: 2, current: 2 } };
    } else {
      spellbook.slots = {};
    }

    if (cls) {
      updateField('weaponProficiencies', cls.weaponProficiencies);
      updateField('armorTraining', cls.armorProficiencies);
      updateField('savingThrowProficiencies', cls.savingThrows as AttributeName[]);
      // Do NOT write the class starting-equipment summary into character.inventory:
      // that summary is a selection PLAN (e.g. "细剑 或 长剑 …，皮甲，匕首"), not an
      // item. The Equipment page derives a StarterEquipmentPlan from the class
      // definition's startingEquipment and materializes real items on Generate.
      // (Legacy characters that already stored the summary are quarantined by the
      // isLegacyStarterSummary detectors in the inventory view-model.)
    }

    const bg = AVAILABLE_BACKGROUND_DATA.find(b => b.name === character.background);
    if (bg) {
      updateField('skillProficiencies', bg.skillProficiencies);
    }

    updateField('hpMax', Math.max(1, initialHp));
    updateField('hpCurrent', Math.max(1, initialHp));
    updateField('spellbook', spellbook);
    updateField('isCompleted', true);
    onComplete();
  };

  const selectedRace = RACE_DATA.find(r => r.name === character.race);
  const selectedClass = CLASS_DATA.find(c => c.name === character.jobClass);
  const selectedBackground = AVAILABLE_BACKGROUND_DATA.find(b => b.name === character.background);
  const selectedFeatNames = character.feats ?? [];
  const unselected = t('dndBuilder.common.unselected');

  const finalAttrValue = (attr: AttributeName) => {
    const stat = character.attrs[attr];
    return stat.base + stat.pointbuy + stat.racebonus;
  };

  const todoItems = [
    { key: 'name', done: !!character.name, label: t('dndBuilder.todos.name') },
    { key: 'species', done: !!character.race, label: t('dndBuilder.todos.species') },
    { key: 'background', done: !!character.background, label: t('dndBuilder.todos.background') },
    { key: 'class', done: !!character.jobClass, label: t('dndBuilder.todos.class') },
    { key: 'feat', done: selectedFeatNames.length > 0, label: t('dndBuilder.todos.feat') },
    { key: 'abilities', done: character.remainingPoints === 0, label: t('dndBuilder.todos.abilities') },
  ];

  const builderSections: {
    id: BuilderSection;
    label: string;
    hint: string;
    done?: boolean;
  }[] = [
    { id: 'identity', label: t('dndBuilder.sections.identity'), hint: t('dndBuilder.sectionHints.identity'), done: !!character.name },
    { id: 'sources', label: t('dndBuilder.sections.sources'), hint: t('dndBuilder.sectionHints.sources'), done: true },
    { id: 'species', label: t('dndBuilder.sections.species'), hint: t('dndBuilder.sectionHints.species'), done: !!character.race },
    { id: 'background', label: t('dndBuilder.sections.background'), hint: t('dndBuilder.sectionHints.background'), done: !!character.background },
    { id: 'class', label: t('dndBuilder.sections.class'), hint: t('dndBuilder.sectionHints.class'), done: !!character.jobClass },
    { id: 'abilities', label: t('dndBuilder.sections.abilities'), hint: t('dndBuilder.sectionHints.abilities'), done: character.remainingPoints === 0 },
    { id: 'feats', label: t('dndBuilder.sections.feats'), hint: t('dndBuilder.sectionHints.feats'), done: selectedFeatNames.length > 0 },
    { id: 'spells', label: t('dndBuilder.sections.spells'), hint: t('dndBuilder.sectionHints.spells') },
    { id: 'equipment', label: t('dndBuilder.sections.equipment'), hint: t('dndBuilder.sectionHints.equipment') },
    { id: 'review', label: t('dndBuilder.sections.review'), hint: t('dndBuilder.sectionHints.review') },
  ];

  const panelClass = 'rounded-lg border border-[#58180d]/25 bg-[#fff8e6]/82 p-4 md:p-5 shadow-sm';
  const subPanelClass = 'rounded-md border border-[#58180d]/18 bg-white/55 p-3';
  const selectedClassName = 'border-[#58180d] bg-[#58180d] text-white';
  const optionClassName = 'border-[#58180d]/25 bg-white/70 text-[#2c1810] hover:border-[#58180d] hover:bg-[#f7ebcf]';

  const renderSectionHeader = (title: string, description: string) => (
    <div className="mb-4 border-b border-[#58180d]/15 pb-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#58180d]/60">
        {t('dndBuilder.common.currentSection')}
      </div>
      <h2 className="mt-1 text-xl font-bold text-[#58180d] md:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-[#58180d]/70">{description}</p>
    </div>
  );

  const renderIdentity = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.identity'), t('dndBuilder.descriptions.identity'))}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-bold uppercase text-[#58180d]">{t('dndBuilder.fields.characterName')} *</span>
          <Input className="w-full rounded-md border-[#58180d]/45 bg-white" value={character.name} onChange={e => updateField('name', e.target.value)} />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-bold uppercase text-[#58180d]">{t('dndBuilder.fields.age')}</span>
          <Input className="w-full rounded-md border-[#58180d]/45 bg-white" value={character.age} onChange={e => updateField('age', e.target.value)} />
        </label>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-[#58180d]">{t('dndBuilder.fields.gender')}</span>
          <div className="flex flex-wrap gap-2">
            {['男性', '女性', '非二元', '其他/隐藏'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => updateField('gender', gender)}
                className={`min-w-0 flex-1 rounded-md border px-3 py-2 text-xs font-bold transition ${
                  character.gender === gender ? selectedClassName : optionClassName
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-bold uppercase text-[#58180d]">{t('dndBuilder.fields.languages')}</span>
          <Input className="w-full rounded-md border-[#58180d]/45 bg-white" value={character.customLanguages} onChange={e => updateField('customLanguages', e.target.value)} />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-bold uppercase text-[#58180d]">{t('dndBuilder.fields.details')}</span>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-[#58180d]/45 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58180d]/45"
            value={character.description}
            onChange={e => updateField('description', e.target.value)}
          />
        </label>
      </div>
    </section>
  );

  const renderSources = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.sources'), t('dndBuilder.descriptions.sources'))}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { title: 'Local CHM', sourceId: 'dnd-local-chm-primary', status: t('dndBuilder.sources.primary') },
          { title: 'DND5eChm / SRD5.2', sourceId: 'dnd5echm-srd52-primary', status: t('dndBuilder.sources.secondary') },
          { title: 'XGtE / TCoE', sourceId: 'dnd5echm-xgte / dnd5echm-tcoe', status: t('dndBuilder.sources.indexed') },
        ].map((source) => (
          <div key={source.sourceId} className={subPanelClass}>
            <div className="text-sm font-bold text-[#58180d]">{source.title}</div>
            <div className="mt-1 font-mono text-[11px] text-[#2c1810]/70">{source.sourceId}</div>
            <div className="mt-2 inline-flex rounded-full border border-[#58180d]/20 bg-[#58180d]/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#58180d]">
              {source.status}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-[#a35b11]/30 bg-[#fff1c7]/45 p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#58180d]">我的自定义资料包（可选）</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#58180d]/70">
              已支持的种族、背景与起源专长会显示在对应选择中；复杂规则不会自动执行，也不会自动通过房间审核。
            </p>
          </div>
          {character.personalContentReferences.length > 0 && (
            <span className="rounded-full border border-[#a35b11]/30 bg-white/70 px-2 py-0.5 text-[10px] font-bold text-[#7a4610]">
              已选择 1 个版本
            </span>
          )}
        </div>
        <label className="mt-3 block max-w-xl space-y-1.5">
          <span className="text-xs font-bold text-[#58180d]">资料包版本</span>
          <select
            className="w-full rounded-md border border-[#58180d]/35 bg-white px-3 py-2 text-sm text-[#2c1810] disabled:cursor-not-allowed disabled:opacity-60"
            value={character.personalContentReferences[0]?.packVersionId ?? ''}
            disabled={personalPacksLoading}
            onChange={(event) => {
              const selected = personalPacks.find((pack) => pack.latestVersion?.packVersionId === event.target.value);
              updateField('personalContentReferences', selected?.latestVersion
                ? [{
                    packId: selected.packId,
                    packVersionId: selected.latestVersion.packVersionId,
                    displayName: selected.displayName,
                    versionLabel: selected.latestVersion.versionLabel,
                  }]
                : []);
            }}
          >
            <option value="">只使用基础资料</option>
            {personalPacks.map((pack) => pack.latestVersion && (
              <option key={pack.latestVersion.packVersionId} value={pack.latestVersion.packVersionId}>
                {pack.displayName} · {pack.latestVersion.versionLabel}
              </option>
            ))}
          </select>
        </label>
        {personalPacksLoading && <p className="mt-2 text-xs text-[#58180d]/65">正在读取你的资料包…</p>}
        {personalPacksError && <p className="mt-2 text-xs text-[#a52a2a]">{personalPacksError}</p>}
        {!personalPacksLoading && !personalPacksError && personalPacks.length === 0 && (
          <p className="mt-2 text-xs text-[#58180d]/65">你还没有个人资料包。可在角色库的“我的自定义资料”中创建或导入。</p>
        )}
        {character.personalContentReferences[0] && (
          <p className="mt-3 rounded-md border border-dashed border-[#58180d]/20 bg-white/55 p-2 text-xs leading-relaxed text-[#58180d]/75">
            当前引用：{character.personalContentReferences[0].displayName} · {character.personalContentReferences[0].versionLabel}。加入房间时，请在大厅随角色提交相同版本，由主持人审核。
          </p>
        )}
      </div>
      <p className="mt-4 rounded-md border border-dashed border-[#58180d]/25 bg-white/45 p-3 text-xs text-[#58180d]/70">
        {t('dndBuilder.sources.note')}
      </p>
    </section>
  );

  const renderSpecies = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.species'), t('dndBuilder.descriptions.species'))}
      {selectedPersonalReference && (
        <div className="mb-4 rounded-md border border-[#a35b11]/25 bg-[#fff1c7]/45 px-3 py-2 text-xs leading-relaxed text-[#58180d]/75">
          正在使用个人资料版本：<span className="font-bold">{selectedPersonalReference.displayName} · {selectedPersonalReference.versionLabel}</span>。
          {selectedPersonalPackContentLoading && ' 正在载入其中支持的种族选项…'}
          {selectedPersonalPackContentError && <span className="block mt-1 text-[#a52a2a]">{selectedPersonalPackContentError}</span>}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <ScrollArea className="max-h-[420px] rounded-md border border-[#58180d]/20 bg-white/45 p-3 md:max-h-[560px]">
          {RACE_DATA.map(race => (
            <button
              key={race.name}
              type="button"
              className={`mb-3 block w-full rounded-md border p-3 text-left transition ${character.race === race.name ? selectedClassName : optionClassName}`}
              onClick={() => {
                updateField('race', race.name);
                updateField('subrace', '');
                if (race.size) updateField('size', race.size);
                if (race.speed > 0) updateField('speed', `${race.speed} 尺`);
                if (race.baseLanguages.length > 0) updateField('customLanguages', race.baseLanguages.join(', '));
                const newAttrs = { ...character.attrs };
                ATTR_LIST.forEach(attr => {
                  newAttrs[attr] = { ...newAttrs[attr], racebonus: race[`${attr.toLowerCase() as Lowercase<AttributeName>}Bonus`] as number };
                });
                updateField('attrs', newAttrs);
              }}
            >
              <div className="font-bold">{race.name}</div>
              <p className={`mt-1 text-xs leading-relaxed ${character.race === race.name ? 'text-white/78' : 'text-[#58180d]/70'}`}>{race.desc}</p>
            </button>
          ))}
        </ScrollArea>
        <div className={subPanelClass}>
          <h3 className="text-sm font-bold text-[#58180d]">{character.race || unselected}</h3>
          {!selectedRace && <p className="mt-2 text-xs text-[#58180d]/65">{t('dndBuilder.empty.species')}</p>}
          {selectedRace && (
            <div className="mt-3 space-y-3 text-sm">
              {selectedRace.features.length > 0 ? selectedRace.features.map((feature, index) => (
                <p key={index} className="text-[#2c1810]/82">{feature}</p>
              )) : (
                <p className="rounded-md border border-[#58180d]/20 bg-[#f7ebcf]/60 p-2 text-xs text-[#58180d]/70">
                  {t('dndBuilder.pending.speciesTraits')}
                </p>
              )}
              {(selectedRace.subraces?.length || 0) > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase text-[#58180d]">{t('dndBuilder.fields.subspecies')}</h4>
                  <div className="space-y-2">
                    {selectedRace.subraces.map(subrace => (
                      <button
                        key={subrace.name}
                        type="button"
                        className={`w-full rounded-md border p-2 text-left text-xs transition ${character.subrace === subrace.name ? selectedClassName : optionClassName}`}
                        onClick={() => {
                          updateField('subrace', subrace.name);
                          if (subrace.size) updateField('size', subrace.size);
                          if (subrace.speed) updateField('speed', `${subrace.speed} 尺`);
                          if (subrace.baseLanguages) updateField('customLanguages', subrace.baseLanguages.join(', '));
                          const newAttrs = { ...character.attrs };
                          ATTR_LIST.forEach(attr => {
                            newAttrs[attr] = {
                              ...newAttrs[attr],
                              racebonus: (selectedRace[`${attr.toLowerCase() as Lowercase<AttributeName>}Bonus`] as number) + (subrace[`${attr.toLowerCase() as Lowercase<AttributeName>}Bonus`] as number),
                            };
                          });
                          updateField('attrs', newAttrs);
                        }}
                      >
                        <div className="font-bold">{subrace.name}</div>
                        <p className="mt-1 opacity-80">{subrace.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderBackground = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.background'), t('dndBuilder.descriptions.background'))}
      {selectedPersonalReference && (
        <p className="mb-3 rounded-md border border-[#a35b11]/25 bg-[#fff1c7]/45 px-3 py-2 text-xs leading-relaxed text-[#58180d]/75">
          {selectedPersonalPackContentLoading ? '正在载入个人背景选项…' : '个人资料版本中的背景会在此与基础背景一起显示；只会填入已声明的技能与文字说明。'}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <ScrollArea className="max-h-[420px] rounded-md border border-[#58180d]/20 bg-white/45 p-3 md:max-h-[560px]">
          {AVAILABLE_BACKGROUND_DATA.map(bg => (
            <button
              key={bg.name}
              type="button"
              className={`mb-3 block w-full rounded-md border p-3 text-left transition ${character.background === bg.name ? selectedClassName : optionClassName}`}
              onClick={() => {
                updateField('background', bg.name);
                if (bg.originFeat) {
                  updateField('feats', [bg.originFeat]);
                }
              }}
            >
              <div className="font-bold">{bg.name}</div>
              <p className={`mt-1 text-xs leading-relaxed ${character.background === bg.name ? 'text-white/78' : 'text-[#58180d]/70'}`}>{bg.desc}</p>
            </button>
          ))}
        </ScrollArea>
        <div className={subPanelClass}>
          <h3 className="text-sm font-bold text-[#58180d]">{character.background || unselected}</h3>
          {!selectedBackground && <p className="mt-2 text-xs text-[#58180d]/65">{t('dndBuilder.empty.background')}</p>}
          {selectedBackground && (
            <div className="mt-3 space-y-3 text-sm">
              <InfoRow label={t('dndBuilder.fields.skills')} value={selectedBackground.skillProficiencies.length ? selectedBackground.skillProficiencies.join(', ') : t('dndBuilder.pending.needsCheck')} />
              <InfoRow label={t('dndBuilder.fields.originFeat')} value={selectedBackground.originFeat || t('dndBuilder.pending.needsCheck')} />
              <div className="rounded-md border border-[#58180d]/20 bg-[#f7ebcf]/60 p-3">
                <div className="text-xs font-bold uppercase text-[#58180d]">{selectedBackground.feature.name}</div>
                <p className="mt-1 text-xs text-[#2c1810]/78">{selectedBackground.feature.desc}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderClass = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.class'), t('dndBuilder.descriptions.class'))}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <ScrollArea className="max-h-[420px] rounded-md border border-[#58180d]/20 bg-white/45 p-3 md:max-h-[560px]">
          {CLASS_DATA.map(cls => (
            <button
              key={cls.name}
              type="button"
              className={`mb-3 block w-full rounded-md border p-3 text-left transition ${character.jobClass === cls.name ? selectedClassName : optionClassName}`}
              onClick={() => {
                updateField('jobClass', cls.name);
                updateField('hitDiceCurrent', 1);
                updateField('subclass', '');
              }}
            >
              <div className="font-bold">{cls.name}</div>
              <p className={`mt-1 text-xs leading-relaxed ${character.jobClass === cls.name ? 'text-white/78' : 'text-[#58180d]/70'}`}>{cls.desc}</p>
            </button>
          ))}
        </ScrollArea>
        <div className={subPanelClass}>
          <h3 className="text-sm font-bold text-[#58180d]">{character.jobClass || unselected}</h3>
          {!selectedClass && <p className="mt-2 text-xs text-[#58180d]/65">{t('dndBuilder.empty.class')}</p>}
          {selectedClass && (
            <div className="mt-3 space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <InfoRow label={t('dndBuilder.fields.hitDice')} value={selectedClass.hitDice} />
                <InfoRow label={t('dndBuilder.fields.primaryAbility')} value={ATTR_LABELS[selectedClass.primaryAbility]} />
                <InfoRow label={t('dndBuilder.fields.saves')} value={selectedClass.savingThrows.map(s => ATTR_LABELS[s as AttributeName] || s).join(', ')} />
                <InfoRow label={t('dndBuilder.fields.proficiencies')} value={[...selectedClass.armorProficiencies, ...selectedClass.weaponProficiencies].join(', ')} />
              </div>
              {selectedClass.subclasses.filter(sc => sc.unlockLevel === 1).length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase text-[#58180d]">{t('dndBuilder.fields.subclass')}</h4>
                  <div className="space-y-2">
                    {selectedClass.subclasses.filter(sc => sc.unlockLevel === 1).map(subclass => (
                      <button
                        key={subclass.name}
                        type="button"
                        className={`w-full rounded-md border p-2 text-left text-xs transition ${character.subclass === subclass.name ? selectedClassName : optionClassName}`}
                        onClick={() => updateField('subclass', subclass.name)}
                      >
                        <div className="font-bold">{subclass.name}</div>
                        <p className="mt-1 opacity-80">{subclass.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase text-[#58180d]">{t('dndBuilder.fields.levelOneFeatures')}</h4>
                <ul className="space-y-2">
                  {selectedClass.features.filter(feature => feature.unlockLevel === 1).map((feature) => (
                    <li key={feature.name} className="rounded-md border border-[#58180d]/16 bg-white/45 p-2 text-xs">
                      <span className="font-bold text-[#58180d]">{feature.name}: </span>{feature.desc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderAbilities = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.abilities'), t('dndBuilder.descriptions.abilities'))}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#58180d]/20 bg-white/45 p-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#58180d]">{t('dndBuilder.fields.remainingPoints')}</span>
        <span className="text-3xl font-black text-[#58180d]">{character.remainingPoints}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ATTR_LIST.map(attr => {
          const stat = character.attrs[attr];
          const finalVal = finalAttrValue(attr);
          return (
            <div key={attr} className="rounded-lg border border-[#58180d]/24 bg-white/68 p-3">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#58180d]/15 pb-2">
                <div className="font-bold text-[#58180d]">{ATTR_LABELS[attr]} <span className="text-xs opacity-60">({attr})</span></div>
                <div className="rounded-full bg-[#58180d]/8 px-2 py-0.5 text-[10px] font-bold text-[#58180d]">
                  {t('dndBuilder.fields.speciesBonus')}: +{stat.racebonus}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => updateAttrPointBuy(attr, stat.pointbuy - 1)} disabled={stat.pointbuy <= 0} className="h-10 w-10 rounded-md border-[#58180d]/50 text-[#58180d]">-</Button>
                <div className="min-w-16 text-center text-4xl font-black">{finalVal}</div>
                <Button variant="outline" size="sm" onClick={() => updateAttrPointBuy(attr, stat.pointbuy + 1)} disabled={stat.pointbuy >= 7 || character.remainingPoints <= 0} className="h-10 w-10 rounded-md border-[#58180d]/50 text-[#58180d]">+</Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderFeats = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.feats'), t('dndBuilder.descriptions.feats'))}
      {selectedPersonalReference && (
        <p className="mb-3 rounded-md border border-[#a35b11]/25 bg-[#fff1c7]/45 px-3 py-2 text-xs leading-relaxed text-[#58180d]/75">
          个人资料版本中的起源专长会在此显示。说明与前置条件仅供审核与协商，不会自动执行效果。
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {FEAT_DATA.filter(feat => feat.category === 'Origin').map(feat => (
          <button
            key={feat.name}
            type="button"
            onClick={() => updateField('feats', [feat.name])}
            className={`rounded-md border p-3 text-left transition ${selectedFeatNames.includes(feat.name) ? selectedClassName : optionClassName}`}
          >
            <div className="font-bold">{feat.name}</div>
            <p className={`mt-1 text-xs leading-relaxed ${selectedFeatNames.includes(feat.name) ? 'text-white/78' : 'text-[#58180d]/70'}`}>{feat.desc}</p>
          </button>
        ))}
      </div>
    </section>
  );

  const renderSpells = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.spells'), t('dndBuilder.descriptions.spells'))}
      <div className="rounded-md border border-dashed border-[#58180d]/28 bg-white/45 p-4 text-sm text-[#58180d]/75">
        <p>{t('dndBuilder.placeholders.spells')}</p>
        <p className="mt-2 font-mono text-xs">{SPELL_DATA.length} runtime spell entries available; spell preparation stays in Gameplay.</p>
      </div>
    </section>
  );

  const renderEquipment = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.equipment'), t('dndBuilder.descriptions.equipment'))}
      <div className="rounded-md border border-dashed border-[#58180d]/28 bg-white/45 p-4 text-sm text-[#58180d]/75">
        <p>{t('dndBuilder.placeholders.equipment')}</p>
        <p className="mt-2 text-xs">{t('dndBuilder.placeholders.equipmentBoundary')}</p>
      </div>
    </section>
  );

  const renderReview = () => (
    <section className={panelClass}>
      {renderSectionHeader(t('dndBuilder.sections.review'), t('dndBuilder.descriptions.review'))}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={subPanelClass}>
          <h3 className="mb-3 text-sm font-bold text-[#58180d]">{t('dndBuilder.summary.title')}</h3>
          <SummaryRows
            rows={[
              [t('dndBuilder.summary.name'), character.name || unselected],
              [t('dndBuilder.summary.level'), `${character.level || 1}`],
              [t('dndBuilder.summary.species'), character.race || unselected],
              [t('dndBuilder.summary.background'), character.background || unselected],
              [t('dndBuilder.summary.class'), character.jobClass || unselected],
              [t('dndBuilder.summary.subclass'), character.subclass || unselected],
              [t('dndBuilder.summary.hpAc'), `${character.hpMax || '-'} / ${10 + character.acMod}`],
              ['个人资料', character.personalContentReferences.length > 0
                ? character.personalContentReferences.map((reference) => `${reference.displayName} · ${reference.versionLabel}`).join('、')
                : '仅基础资料'],
            ]}
          />
        </div>
        <div className={subPanelClass}>
          <h3 className="mb-3 text-sm font-bold text-[#58180d]">{t('dndBuilder.todos.title')}</h3>
          <TodoList items={todoItems} />
          <Button className="mt-4 w-full rounded-md bg-[#58180d] py-5 font-bold text-[#fdf6e3] hover:bg-[#2c1810]" onClick={handleComplete}>
            {t('dndBuilder.actions.complete')}
          </Button>
        </div>
      </div>
    </section>
  );

  const sectionRenderer: Record<BuilderSection, () => ReactNode> = {
    identity: renderIdentity,
    sources: renderSources,
    species: renderSpecies,
    background: renderBackground,
    class: renderClass,
    abilities: renderAbilities,
    feats: renderFeats,
    spells: renderSpells,
    equipment: renderEquipment,
    review: renderReview,
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] overflow-x-hidden">
      <div className="mb-3 rounded-lg border border-[#58180d]/20 bg-[#fff8e6]/72 p-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#58180d]/60">
            {t('dndBuilder.header.eyebrow')}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[#58180d] md:text-3xl">{t('dndBuilder.header.title')}</h1>
          <p className="mt-1 text-sm text-[#58180d]/70">{t('dndBuilder.header.subtitle')}</p>
        </div>
      </div>

      <details className="mb-3 rounded-lg border border-[#58180d]/20 bg-[#fff8e6]/82 p-3 lg:hidden">
        <summary className="cursor-pointer list-none text-sm font-bold text-[#58180d]">
          {t('dndBuilder.summary.title')} · {character.name || unselected}
        </summary>
        <div className="mt-3">
          <BuilderSummaryContent
            t={t}
            rows={[
              [t('dndBuilder.summary.name'), character.name || unselected],
              [t('dndBuilder.summary.level'), `${character.level || 1}`],
              [t('dndBuilder.summary.species'), character.race || unselected],
              [t('dndBuilder.summary.background'), character.background || unselected],
              [t('dndBuilder.summary.class'), character.jobClass || unselected],
              [t('dndBuilder.summary.subclass'), character.subclass || unselected],
              [t('dndBuilder.summary.attrs'), ATTR_LIST.map(attr => `${attr} ${finalAttrValue(attr)}`).join(' / ')],
              [t('dndBuilder.summary.dataStatus'), t('dndBuilder.summary.needsCheck')],
            ]}
            todoItems={todoItems}
          />
        </div>
      </details>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border border-[#58180d]/20 bg-[#fff8e6]/72 p-3">
            <div className="mb-2 hidden text-[10px] font-bold uppercase tracking-[0.22em] text-[#58180d]/55 md:block">
              {t('dndBuilder.nav.title')}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
              {builderSections.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`min-w-[112px] rounded-md border px-3 py-2 text-left transition md:min-w-0 ${
                    section === item.id
                      ? 'border-[#58180d] bg-[#58180d] text-[#fdf6e3]'
                      : 'border-[#58180d]/18 bg-white/55 text-[#58180d] hover:border-[#58180d]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{item.label}</span>
                    {item.done && <span className="text-[10px]">●</span>}
                  </div>
                  <div className={`mt-1 hidden text-[10px] leading-tight md:block ${section === item.id ? 'text-white/72' : 'text-[#58180d]/55'}`}>
                    {item.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          {sectionRenderer[section]()}
        </main>

        <aside className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
          <div className="rounded-lg border border-[#58180d]/20 bg-[#fff8e6]/82 p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#58180d]">{t('dndBuilder.summary.title')}</h2>
            <BuilderSummaryContent
              t={t}
              rows={[
                [t('dndBuilder.summary.name'), character.name || unselected],
                [t('dndBuilder.summary.level'), `${character.level || 1}`],
                [t('dndBuilder.summary.species'), character.race || unselected],
                [t('dndBuilder.summary.background'), character.background || unselected],
                [t('dndBuilder.summary.class'), character.jobClass || unselected],
                [t('dndBuilder.summary.subclass'), character.subclass || unselected],
                [t('dndBuilder.summary.attrs'), ATTR_LIST.map(attr => `${attr} ${finalAttrValue(attr)}`).join(' / ')],
                [t('dndBuilder.summary.dataStatus'), t('dndBuilder.summary.needsCheck')],
              ]}
              todoItems={todoItems}
            />
            <Button className="mt-4 w-full rounded-md bg-[#58180d] py-5 font-bold text-[#fdf6e3] hover:bg-[#2c1810]" onClick={handleComplete}>
              {t('dndBuilder.actions.complete')}
            </Button>
            <Button variant="ghost" onClick={() => { resetCreator(); setSection('identity'); }} className="mt-2 w-full justify-center rounded-md text-xs font-bold text-[#58180d] hover:bg-[#58180d]/10">
              {t('dndBuilder.actions.reset')}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#58180d]/16 bg-white/45 p-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[#58180d]/65">{label}</div>
      <div className="mt-1 text-xs text-[#2c1810]/82">{value}</div>
    </div>
  );
}

function SummaryRows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-3 space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-3 text-sm">
          <dt className="shrink-0 text-xs font-bold uppercase tracking-wider text-[#58180d]/60">{label}</dt>
          <dd className="min-w-0 text-right font-semibold text-[#2c1810]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TodoList({ items }: { items: { key: string; done: boolean; label: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map(item => (
        <li key={item.key} className="flex items-center gap-2 text-xs text-[#2c1810]/82">
          <span className={`h-2 w-2 rounded-full ${item.done ? 'bg-[#2f7f68]' : 'bg-[#c89b3c]'}`} />
          <span className={item.done ? 'line-through opacity-70' : ''}>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function BuilderSummaryContent({
  rows,
  todoItems,
  t,
}: {
  rows: [string, string][];
  todoItems: { key: string; done: boolean; label: string }[];
  t: (key: string) => string;
}) {
  return (
    <>
      <SummaryRows rows={rows} />
      <div className="mt-4 border-t border-[#58180d]/15 pt-4">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#58180d]">{t('dndBuilder.todos.title')}</h3>
        <TodoList items={todoItems} />
      </div>
    </>
  );
}
