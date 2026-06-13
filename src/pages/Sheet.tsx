import { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { AttributeName, SkillName } from '../lib/dnd-types';
import { BACKGROUND_DATA, LEGACY_BACKGROUND_DATA } from '../data/backgrounds';
import { LEGACY_RACE_DATA } from '../data/races';
import { getAvailableClasses, getAvailableRaces, getAvailableFeats } from '../lib/mod-utils';
import { DndEquipmentCatalogPanel } from './sheet/DndEquipmentCatalogPanel';
import { createTranslator, readStoredLocale } from '../i18n';

type SheetProps = {
  onStartPlaying?: () => void;
};

export function Sheet({ onStartPlaying }: SheetProps = {}) {
  const { t } = createTranslator(readStoredLocale());
  const {
    character,
    updateField,
    initializeRuntimeResources,
    consumeClassResource,
    updateClassResourceCurrent,
    resetClassResource,
    consumeSpellcastingResource,
    updatePactMagicCurrent,
    resetPactMagic,
  } = useCharacterStore();
  const [isFeatDialogOpen, setIsFeatDialogOpen] = useState(false);

  const CLASS_DATA = getAvailableClasses(character);
  const RACE_DATA = getAvailableRaces(character);
  const FEATS_DATA = getAvailableFeats(character);

  const handleAddFeat = (featName: string) => {
    if (!character.feats?.includes(featName)) {
      updateField('feats', [...(character.feats || []), featName]);
      setIsFeatDialogOpen(false);
    }
  };

  const handleRemoveFeat = (index: number) => {
    const updatedFeats = [...(character.feats || [])];
    updatedFeats.splice(index, 1);
    updateField('feats', updatedFeats);
  };

  const attrList: { key: AttributeName; label: string }[] = [
    { key: 'Str', label: '力量' },
    { key: 'Dex', label: '敏捷' },
    { key: 'Con', label: '体质' },
    { key: 'Int', label: '智力' },
    { key: 'Wis', label: '感知' },
    { key: 'Cha', label: '魅力' },
  ];

  const getAttrData = (attr: AttributeName) => {
    const data = character.attrs[attr];
    const score = data.base + data.pointbuy + data.racebonus + data.extrabonus;
    const mod = Math.floor((score - 10) / 2);
    return { score, mod };
  };

  const getProfBonus = () => Math.ceil(1 + (character.level / 4));

  const allSkills: { name: SkillName; attr: AttributeName }[] = [
    { name: '运动', attr: 'Str' },
    { name: '特技', attr: 'Dex' }, { name: '巧手', attr: 'Dex' }, { name: '隐匿', attr: 'Dex' },
    { name: '奥秘', attr: 'Int' }, { name: '历史', attr: 'Int' }, { name: '调查', attr: 'Int' }, { name: '自然', attr: 'Int' }, { name: '宗教', attr: 'Int' },
    { name: '驯兽', attr: 'Wis' }, { name: '洞察', attr: 'Wis' }, { name: '医药', attr: 'Wis' }, { name: '察觉', attr: 'Wis' }, { name: '生存', attr: 'Wis' },
    { name: '欺瞒', attr: 'Cha' }, { name: '威吓', attr: 'Cha' }, { name: '表演', attr: 'Cha' }, { name: '游说', attr: 'Cha' }
  ];

  if (!character.isCompleted) {
    return <div className="text-center py-20 text-[#58180d]/60 font-bold uppercase tracking-widest text-sm">请先在创建器中完成角色创建。</div>;
  }

  // AI-LANDMARK: DND_SPECIES_BACKGROUND_DISPLAY_CLEANUP
  // Base and species/background display data.
  const classDef = CLASS_DATA.find(c => c.name === character.jobClass);
  const currentRaceDef = RACE_DATA.find(r => r.name === character.race);
  const legacyRaceDef = currentRaceDef ? undefined : LEGACY_RACE_DATA.find(r => r.name === character.race);
  const raceDef = currentRaceDef ?? legacyRaceDef;
  const isLegacyRaceDisplay = !currentRaceDef && !!legacyRaceDef;
  const currentBgDef = BACKGROUND_DATA.find(b => b.name === character.background);
  const legacyBgDef = currentBgDef ? undefined : LEGACY_BACKGROUND_DATA.find(b => b.name === character.background);
  const bgDef = currentBgDef ?? legacyBgDef;
  const isLegacyBackgroundDisplay = !currentBgDef && !!legacyBgDef;
  const legacySubraceDef = isLegacyRaceDisplay
    ? legacyRaceDef?.subraces?.find(s => s.name === character.subrace)
    : undefined;
  const hasRetainedLegacySubrace = !!character.subrace && !legacySubraceDef;

  if (!classDef) {
    return <div className="text-center py-20 text-[#58180d]/40">角色数据读取中或未完成创建...</div>;
  }
  
  const activeSkills = [
    ...(bgDef?.skillProficiencies || [])
    // We would add race/class skills here if we collected them in Creator
  ];

  const profBonus = getProfBonus();
  
  // Calculate dynamic AC based on class (e.g. Barbarian Unarmored Defense)
  const dexMod = getAttrData('Dex').mod;
  const conMod = getAttrData('Con').mod;
  let acTotal = character.acMod + dexMod;
  if (character.jobClass === '野蛮人' && character.acMod === 10) { // Assuming no armor
     acTotal += conMod;
  }
  
  const initiative = dexMod;
  const savingThrows = classDef?.savingThrows || [];

  const armorProf = [...(classDef?.armorProficiencies || [])];
  const weaponProf = [...(classDef?.weaponProficiencies || [])];

  // Deduplicate
  const finalArmorProf = [...new Set(armorProf)];
  const finalWeaponProf = [...new Set(weaponProf)];
  const formatMod = (value: number) => `${value >= 0 ? '+' : ''}${value}`;
  const passivePerception = 10 + getAttrData('Wis').mod + (activeSkills.includes('察觉') ? profBonus : 0);
  const preparedSpells = character.spellbook.prepared || [];
  const spellSlotEntries = Object.entries(character.spellbook.slots || {})
    .sort(([a], [b]) => Number(a) - Number(b));
  const inventoryItems = character.inventory || [];
  const hasClassResources = character.classResources.length > 0 || Boolean(character.pactMagicState);
  const compactPanelClass = 'border border-[#58180d]/35 bg-white/45 p-3';
  const compactTitleClass = 'mb-2 border-b border-[#58180d]/25 pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#58180d]';

  return (
    <div className="space-y-4 text-[#2c1810]">
      {/* AI-LANDMARK: DND_SHEET_LAYOUT_COMPACT_V1 */}
      <header className="border-b-2 border-[#58180d]/70 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#58180d]/70">
              DND 5e 2024 · {t('dndSheet.compact.characterSheet')}
            </div>
            <h2 className="mt-1 break-words text-3xl font-black uppercase tracking-tight text-[#2c1810] md:text-4xl">
              {character.name || 'Unnamed'}
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-sans text-[#2c1810]/75">
              <span><strong className="text-[#58180d]">{t('dndWorkspace.characters.class')}:</strong> {character.jobClass} {character.subclass || ''} · L{character.level}</span>
              <span><strong className="text-[#58180d]">{t('dndWorkspace.characters.species')}:</strong> {character.race || '-'} {character.subrace || ''}</span>
              <span><strong className="text-[#58180d]">{t('dndWorkspace.characters.background')}:</strong> {character.background || '-'}</span>
              <span><strong className="text-[#58180d]">{t('dndSheet.compact.genderAge')}:</strong> {character.gender || '-'} / {character.age || '-'}</span>
            </div>
          </div>
          {onStartPlaying && (
            <button
              type="button"
              onClick={onStartPlaying}
              className="w-full border-2 border-[#58180d] bg-[#58180d] px-4 py-2 text-center text-[#fdf6e3] transition hover:bg-[#2c1810] lg:w-56"
            >
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">{t('dndSheet.compact.startPlaying')}</span>
              <span className="block text-sm font-black uppercase tracking-wider">{t('dndSheet.compact.enterCombatPanel')}</span>
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {[
          { label: 'HP', sub: t('dndSheet.compact.hitPoints'), value: `${character.hpCurrent} / ${character.hpMax}` },
          { label: 'AC', sub: t('dndSheet.compact.armorClass'), value: acTotal },
          { label: 'INIT', sub: t('dndSheet.compact.initiative'), value: formatMod(initiative) },
          { label: 'SPD', sub: t('dndSheet.compact.speed'), value: `${character.speed}ft` },
          { label: 'PB', sub: t('dndSheet.compact.profBonus'), value: `+${profBonus}` },
        ].map((stat) => (
          <div key={stat.label} className="border-2 border-[#58180d]/60 bg-white/70 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#58180d]">{stat.label}</span>
              <span className="text-[10px] text-[#58180d]/55">{stat.sub}</span>
            </div>
            <div className="mt-1 text-2xl font-black leading-none">{stat.value}</div>
          </div>
        ))}
      </section>

      <main className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(16rem,0.85fr)_minmax(22rem,1.1fr)_minmax(20rem,1fr)]">
        <section className="space-y-3">
          <div className={compactPanelClass}>
            <h3 className={compactTitleClass}>{t('dndSheet.compact.abilities')}</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
              {attrList.map(a => {
                const { score, mod } = getAttrData(a.key);
                return (
                  <div key={a.key} className="border border-[#58180d]/35 bg-[#ede1c5]/70 px-2 py-2 text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#58180d]">{a.key}</div>
                    <div className="text-xs font-bold text-[#58180d]/70">{a.label}</div>
                    <div className="mt-1 flex items-end justify-center gap-2">
                      <span className="text-2xl font-black leading-none">{score}</span>
                      <span className="rounded-full bg-[#58180d] px-2 py-0.5 text-[11px] font-bold text-white">{formatMod(mod)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={compactPanelClass}>
            <h3 className={compactTitleClass}>{t('dndSheet.compact.saves')}</h3>
            <div className="grid grid-cols-1 gap-x-3 gap-y-1 text-xs font-sans sm:grid-cols-2 xl:grid-cols-1">
              {attrList.map(a => {
                const { mod } = getAttrData(a.key);
                const isProf = savingThrows.includes(a.key);
                const totalMod = mod + (isProf ? profBonus : 0);
                return (
                  <div key={`save-${a.key}`} className={`flex items-center justify-between gap-2 border-b border-[#58180d]/10 py-1 ${!isProf ? 'opacity-70' : ''}`}>
                    <span className="min-w-0 truncate">
                      <span className="mr-1 text-[#58180d]">{isProf ? '●' : '○'}</span>
                      {a.label} <span className="text-[10px] uppercase opacity-65">{a.key}</span>
                    </span>
                    <span className="font-black">{formatMod(totalMod)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={compactPanelClass}>
            <h3 className={compactTitleClass}>{t('dndSheet.compact.proficiencies')}</h3>
            <div className="space-y-2 text-xs font-sans">
              <p><strong className="text-[#58180d]">{t('dndSheet.compact.armorTraining')}:</strong> {finalArmorProf.length > 0 ? finalArmorProf.join(', ') : '无'}</p>
              <p><strong className="text-[#58180d]">{t('dndSheet.compact.weaponTraining')}:</strong> {finalWeaponProf.length > 0 ? finalWeaponProf.join(', ') : '无'}</p>
              <p><strong className="text-[#58180d]">{t('dndSheet.compact.languages')}:</strong> {character.customLanguages || '-'}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className={compactPanelClass}>
            <div className="mb-2 flex items-center justify-between border-b border-[#58180d]/25 pb-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#58180d]">{t('dndSheet.compact.skills')}</h3>
              <span className="text-[11px] font-bold text-[#58180d]/70">{t('dndSheet.compact.passivePerception')}: {passivePerception}</span>
            </div>
            <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs font-sans md:grid-cols-2">
              {allSkills.map(skill => {
                const isProf = activeSkills.includes(skill.name);
                const mod = getAttrData(skill.attr).mod + (isProf ? profBonus : 0);
                return (
                  <div key={skill.name} className={`flex items-center justify-between gap-2 border-b border-[#58180d]/10 py-1 ${!isProf ? 'opacity-70' : ''}`}>
                    <span className="min-w-0 truncate">
                      <span className="mr-1 text-[#58180d]">{isProf ? '●' : '○'}</span>
                      {skill.name} <span className="text-[10px] uppercase opacity-55">{skill.attr}</span>
                    </span>
                    <span className={isProf ? 'font-black' : 'font-bold'}>{formatMod(mod)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={compactPanelClass}>
            <h3 className={compactTitleClass}>{t('dndSheet.compact.features')}</h3>
            <div className="space-y-3 text-sm font-sans leading-relaxed">
            <p className="italic opacity-80 border-b border-[#58180d]/10 pb-2">{character.description || '无详细描述。'}</p>
            
            {/* Background Feature */}
            {bgDef?.feature && (
              <div>
                <p className="font-bold text-[#58180d] text-xs uppercase">
                  <span className="opacity-60">{isLegacyBackgroundDisplay ? '[旧版背景/需核对]' : '[背景/待核对]'}</span> {bgDef.feature.name}
                </p>
                <p className="text-xs mt-0.5">{bgDef.feature.desc}</p>
                {bgDef.ruleMeta?.usagePolicy && (
                  <p className="mt-1 text-[10px] text-[#58180d]/60">
                    数据状态：{bgDef.ruleMeta.trustLevel} / {bgDef.ruleMeta.usagePolicy}
                  </p>
                )}
              </div>
            )}
            {!bgDef && character.background && (
              <div className="text-xs text-[#58180d]/70 border border-[#58180d]/20 bg-[#ede1c5]/40 p-2">
                背景资料未在当前 2024 数据中找到，旧存档值已保留：{character.background}。
              </div>
            )}

            {/* Species Features */}
            {raceDef && (
              <div className="text-[10px] text-[#58180d]/60 border border-[#58180d]/20 bg-[#ede1c5]/40 p-2">
                {isLegacyRaceDisplay
                  ? '旧版种族资料仅为旧角色兼容显示，仍需人工核对；不会作为已验证 2024 物种规则。'
                  : '2024 物种资料来自当前数据定义；具体特性仍以 metadata 标记的核对状态为准。'}
                {raceDef.ruleMeta?.usagePolicy && (
                  <span> 数据状态：{raceDef.ruleMeta.trustLevel} / {raceDef.ruleMeta.usagePolicy}。</span>
                )}
              </div>
            )}
            {raceDef?.features.length ? raceDef.features.map((f, i) => {
              const matches = f.match(/-\s*(.+?)（(.+?)）：(.+)/);
              if (matches) {
                 return (
                   <div key={`race-f-${i}`}>
                     <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">{isLegacyRaceDisplay ? '[旧版种族/需核对]' : '[物种]'}</span> {matches[2]}</p>
                     <p className="text-xs mt-0.5">{matches[3]}</p>
                   </div>
                 )
              }
              return (
                <div key={`race-f-${i}`}>
                  <p className="text-xs mt-0.5"><span className="opacity-60">{isLegacyRaceDisplay ? '[旧版种族/需核对]' : '[物种]'}</span> {f}</p>
                </div>
              )
            }) : (
              <div className="text-xs text-[#58180d]/70 border border-[#58180d]/20 bg-[#ede1c5]/40 p-2">
                物种特性待核对。Sheet 不再根据种族名称自动追加旧版特性。
              </div>
            )}
            {!raceDef && character.race && (
              <div className="text-xs text-[#58180d]/70 border border-[#58180d]/20 bg-[#ede1c5]/40 p-2">
                物种资料未在当前 2024 数据或 legacy 兼容数据中找到，旧存档值已保留：{character.race}。
              </div>
            )}
            
            {/* Legacy Subrace Compatibility */}
            {legacySubraceDef?.features.map((f, i) => {
              const matches = f.match(/-\s*(.+?)（(.+?)）：(.+)/);
              if (matches) {
                 return (
                   <div key={`subrace-f-${i}`}>
                     <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">[旧版亚种/需核对]</span> {matches[2]}</p>
                     <p className="text-xs mt-0.5">{matches[3]}</p>
                   </div>
                 )
              }
              return (
                <div key={`subrace-f-${i}`}>
                  <p className="text-xs mt-0.5"><span className="opacity-60">[旧版亚种/需核对]</span> {f}</p>
                </div>
              )
            })}
            {hasRetainedLegacySubrace && (
              <div className="text-xs text-[#58180d]/70 border border-[#58180d]/20 bg-[#ede1c5]/40 p-2">
                旧版亚种信息已保留在角色数据中：{character.subrace}。当前 2024 species 数据不再根据该名称自动展示或追加 2014 亚种特性。
              </div>
            )}

            {/* Class Features */}
            {classDef?.features.filter(f => f.unlockLevel <= character.level).map((f, i) => (
               <div key={`class-f-${i}`}>
                 <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">[职业 L{f.unlockLevel}]</span> {f.name}</p>
                 <p className="text-xs mt-0.5">{f.desc}</p>
               </div>
            ))}

            {/* Subclass Features */}
            {character.subclass && classDef?.subclasses?.find(s => s.name === character.subclass)?.features.filter(f => f.unlockLevel <= character.level).map((f, i) => (
               <div key={`subclass-f-${i}`}>
                 <p className="font-bold text-[#58180d] text-xs uppercase"><span className="opacity-60">[{character.subclass} L{f.unlockLevel}]</span> {f.name}</p>
                 <p className="text-xs mt-0.5">{f.desc}</p>
               </div>
            ))}
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <div className={compactPanelClass}>
            <h3 className={compactTitleClass}>{t('dndSheet.compact.attacksEquipment')}</h3>
            <div className="space-y-2 text-xs font-sans">
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[#58180d]/20 bg-[#ede1c5]/40 p-2">
                  <div className="text-[10px] font-bold uppercase text-[#58180d]/70">{t('dndSheet.compact.hitDice')}</div>
                  <div className="font-black">{character.hitDiceCurrent}d{character.jobClass === '野蛮人' ? '12' : character.jobClass === '护法' ? '10' : character.jobClass === '吟游诗人' ? '8' : '8'}</div>
                </div>
                <div className="border border-[#58180d]/20 bg-[#ede1c5]/40 p-2">
                  <div className="text-[10px] font-bold uppercase text-[#58180d]/70">{t('dndSheet.compact.coin')}</div>
                  <div className="font-black">{character.coin || 0} gp</div>
                </div>
              </div>
              <p><strong className="text-[#58180d]">{t('dndSheet.compact.inventorySummary')}:</strong> {inventoryItems.length > 0 ? inventoryItems.slice(0, 3).join(' / ') : t('dndSheet.compact.none')}</p>
              {inventoryItems.length > 3 && <p className="text-[11px] text-[#58180d]/65">+{inventoryItems.length - 3} more</p>}
              <p className="border border-dashed border-[#58180d]/25 bg-[#ede1c5]/30 p-2 text-[11px] text-[#58180d]/70">{t('dndSheet.compact.equipmentDeferred')}</p>
            </div>
          </div>

          <div className={compactPanelClass}>
            <h3 className={compactTitleClass}>{t('dndSheet.compact.spellSummary')}</h3>
            <div className="space-y-2 text-xs font-sans">
              {preparedSpells.length > 0 ? (
                <p><strong className="text-[#58180d]">{t('dndSheet.compact.preparedSpells')}:</strong> {preparedSpells.slice(0, 5).join(', ')}{preparedSpells.length > 5 ? ` +${preparedSpells.length - 5}` : ''}</p>
              ) : (
                <p className="italic text-[#58180d]/65">{t('dndSheet.compact.noPreparedSpells')}</p>
              )}
              {spellSlotEntries.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {spellSlotEntries.map(([level, slot]) => (
                    <span key={level} className="border border-[#58180d]/30 bg-white/50 px-2 py-1 text-[11px] font-bold">
                      L{level}: {slot.current}/{slot.max}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#58180d]/65">{t('dndSheet.compact.noSpellSlots')}</p>
              )}
            </div>
          </div>

          <div className={compactPanelClass}>
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#58180d]/25 pb-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#58180d]">{t('dndSheet.compact.classResources')}</h3>
            <Button
              size="sm"
              className="h-6 rounded-none bg-[#58180d] hover:bg-[#2c1810] text-[10px] px-2"
              onClick={initializeRuntimeResources}
            >
              {t('dndSheet.compact.initializeClassResources')}
            </Button>
          </div>
          <div className="text-xs font-sans space-y-2">
            {character.classResources.length > 0 ? (
              character.classResources.map((resource) => (
                <div key={resource.id} className="border border-[#58180d]/20 bg-white/40 p-2">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#58180d]">{resource.sourceFeature || resource.id}</p>
                      <p className="text-[10px] text-[#58180d]/60">{resource.id}</p>
                    </div>
                    <span className="font-bold text-[#2c1810] shrink-0">{resource.current} / {resource.max}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#2c1810]/80">
                    {resource.recoveryType && <span>恢复: {resource.recoveryType}</span>}
                    {resource.dice && <span>骰面: {resource.dice}</span>}
                  </div>
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 rounded-none border-[#58180d] text-[#58180d] text-[10px]"
                      disabled={resource.current <= 0}
                      onClick={() => consumeClassResource(resource.id, 1)}
                    >
                      -
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 rounded-none border-[#58180d] text-[#58180d] text-[10px]"
                      disabled={resource.current >= resource.max}
                      onClick={() => updateClassResourceCurrent(resource.id, resource.current + 1)}
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 rounded-none border-[#58180d] text-[#58180d] text-[10px]"
                      onClick={() => resetClassResource(resource.id)}
                    >
                      {t('dndSheet.compact.reset')}
                    </Button>
                  </div>
                  {resource.notes && <p className="mt-1 text-[10px] leading-relaxed text-[#2c1810]/70">{resource.notes}</p>}
                </div>
              ))
            ) : (
              <div className="text-xs italic text-[#58180d]/65">{t('dndSheet.compact.classResourcesDeferred')}</div>
            )}

            {character.pactMagicState && (
              <div className="border border-[#58180d]/30 bg-[#ede1c5]/60 p-2">
                <div className="flex justify-between gap-2">
                  <p className="font-bold text-[#58180d]">契约魔法位 Pact Magic</p>
                  <span className="font-bold text-[#2c1810] shrink-0">{character.pactMagicState.current} / {character.pactMagicState.max}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#2c1810]/80">
                  <span>环级: {character.pactMagicState.slotLevel}</span>
                  <span>恢复: {character.pactMagicState.recoveryType}</span>
                </div>
                <div className="mt-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 rounded-none border-[#58180d] text-[#58180d] text-[10px]"
                    disabled={character.pactMagicState.current <= 0}
                    onClick={() => consumeSpellcastingResource(character.pactMagicState!.slotLevel)}
                  >
                    -
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 rounded-none border-[#58180d] text-[#58180d] text-[10px]"
                    disabled={character.pactMagicState.current >= character.pactMagicState.max}
                    onClick={() => updatePactMagicCurrent(character.pactMagicState!.current + 1)}
                  >
                    +
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 rounded-none border-[#58180d] text-[#58180d] text-[10px]"
                    onClick={resetPactMagic}
                  >
                    {t('dndSheet.compact.reset')}
                  </Button>
                </div>
                {character.pactMagicState.notes && <p className="mt-1 text-[10px] leading-relaxed text-[#2c1810]/70">{character.pactMagicState.notes}</p>}
              </div>
            )}
          </div>
        </div>

        <div className={compactPanelClass}>
          <h3 className={compactTitleClass}>{t('dndSheet.compact.feats')}</h3>
          <div>
            <ul className="space-y-1 mb-2 text-sm font-sans">
              {(character.feats || []).length > 0 ? (
                character.feats.map((feat, i) => (
                  <li key={i} className="flex justify-between items-center group bg-[#58180d]/5 pl-2">
                    <span className="font-bold text-[#58180d]">{feat}</span>
                    <button 
                      onClick={() => handleRemoveFeat(i)}
                      className="text-red-600 opacity-0 group-hover:opacity-100 px-2 py-0.5 hover:bg-red-100 transition-opacity"
                    >
                      ×
                    </button>
                  </li>
                ))
              ) : (
                <li className="text-xs italic text-[#58180d]/65">{t('dndSheet.compact.noFeats')}</li>
              )}
            </ul>
          </div>
          <div className="flex gap-2 mt-2 pt-2 border-t border-[#58180d]/10">
            <Dialog open={isFeatDialogOpen} onOpenChange={setIsFeatDialogOpen}>
              <DialogTrigger asChild>
                 <Button size="sm" className="w-full h-7 rounded-none bg-[#58180d] hover:bg-[#2c1810]">
                   + 自由添加专长 (DM特批/剧情奖励)
                 </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[600px] bg-[#fdf6e3] border-2 border-[#58180d] text-[#2c1810] font-serif rounded-none shadow-[4px_4px_0px_#58180d]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold uppercase text-[#58180d]">选取追加专长</DialogTitle>
                  <p className="text-xs text-[#58180d]/70 italic mt-1 font-sans">注意：正常规则下，角色应该由于类升阶（Level Up - ASI）而在「游玩面板」获得专长。此面板用于手动添加背景扩展或DM给予的额外专长。</p>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3 mt-2">
                    {FEATS_DATA.map((feat) => {
                      const isMeetPrereq = feat.checkPrereq(character);
                      const isAlreadyLearned = character.feats?.includes(feat.name);
                      return (
                        <div key={feat.name} className={`p-3 border ${isMeetPrereq ? 'border-[#58180d] bg-white' : 'border-gray-300 bg-gray-100 opacity-70'} flex flex-col gap-2 relative`}>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-bold text-[#58180d]">{feat.name}</h4>
                              <p className="text-xs text-black/70 mt-1 leading-relaxed">{feat.desc}</p>
                              <div className="text-[10px] mt-2 font-sans">
                                <strong>先决条件:</strong> <span className={isMeetPrereq ? 'text-green-700' : 'text-red-600'}>{feat.prerequisiteDesc}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!isMeetPrereq || isAlreadyLearned}
                              onClick={() => handleAddFeat(feat.name)}
                              className="shrink-0 h-8 rounded-none border-[#58180d] text-[#58180d] hover:bg-[#58180d] hover:text-white"
                            >
                              {isAlreadyLearned ? '已习得' : (isMeetPrereq ? '学习' : '未满足条件')}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        </aside>
      </main>

      {/* Equipment Catalog — read-only data layer v1 */}
      <section>
        <DndEquipmentCatalogPanel />
      </section>

      {/* Detail Text Column */}
      <section className="border-t-2 border-[#58180d]/60 pt-4">
        <h3 className="text-sm font-bold uppercase text-[#58180d] mb-3">{t('dndSheet.compact.characterDetails')}</h3>
        <div className="bg-[#1a0f0a] border border-[#58180d] p-4 text-[#d5c4a1] font-serif flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <h4 className="text-xs uppercase tracking-widest text-[#a68a56] border-b border-[#58180d]/50 pb-1 mb-2">生平与描述</h4>
            <div className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">
              {character.description || '一位尚未留下传说的冒险者...'}
            </div>
            {character.activeMods && character.activeMods.length > 0 && (
              <div className="mt-4 text-xs italic text-[#a68a56]">
                * 织网者低语：命运之线已纠缠——此人承载了 <strong>[{character.activeMods.join(', ')}]</strong> 的异世法则。
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-[#58180d]/50 text-sm leading-relaxed text-[#a68a56] italic">
               "在这片充满未知的费伦大陆上，众神掷下的不仅是命运的骰子。你的故事，可能成为吟游诗人口中传唱千年的史诗，也可能只是酒馆角落里的一声叹息... 愿知识指引你，冒险者。"
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
