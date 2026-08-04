import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import type { Locale } from '../../i18n';
import { ApiClientError } from '../../lib/api/apiTypes';
import {
  personalCompendiumPackApiClient,
  type PersonalCompendiumPack,
  type PersonalCompendiumEntryInput,
  type PersonalCompendiumPackVersionContent,
  type PublishPersonalCompendiumPackInput,
} from '../../lib/api/personalCompendiumPackApiClient';
import {
  parsePersonalCompendiumImport,
  type PersonalCompendiumImportDraft,
} from '../../lib/platform/personalCompendiumImport';
import {
  deriveDndPersonalLibraryName,
  parseDndPersonalFeatureLines,
  parseDndPersonalNamedRuleLines,
  parseDndPersonalRuleComponents,
  type DndPersonalEditorEntryKind,
} from '../../lib/dnd/dndPersonalContentDefinitions';

type Props = {
  locale: Locale;
  presentation?: 'card' | 'workbench';
  onCloseWorkbench?: () => void;
};
type Fields = {
  packName: string;
  versionLabel: string;
  entryKind: DndPersonalEditorEntryKind;
  entryName: string;
  size: string;
  speed: string;
  summary: string;
  traits: string;
  heritageOptions: string;
  backgroundSkills: string;
  backgroundTools: string;
  featureName: string;
  featureDescription: string;
  featCategory: 'Origin' | 'General';
  prerequisite: string;
  spellLevel: string;
  spellSchool: string;
  spellCastTime: string;
  spellRange: string;
  spellDuration: string;
  spellComponents: string;
  classPrimaryAbility: 'Str' | 'Dex' | 'Con' | 'Int' | 'Wis' | 'Cha';
  classHitDice: 'D4' | 'D6' | 'D8' | 'D10' | 'D12';
  classSavingThrows: string;
  classWeaponProficiencies: string;
  classArmorProficiencies: string;
  classStartingEquipment: string;
  classFeatureLines: string;
  subclassParentClass: string;
  subclassUnlockLevel: string;
  subclassFeatureLines: string;
  itemCategory: 'weapon' | 'armor' | 'gear' | 'consumable' | 'magicItem';
  itemRarity: string;
  itemWeight: string;
  itemCost: string;
  itemDamage: string;
  itemDamageType: string;
  itemProperties: string;
  itemArmorClass: string;
  itemUsage: string;
  monsterSize: string;
  monsterType: string;
  monsterAlignment: string;
  monsterArmorClass: string;
  monsterHp: string;
  monsterSpeed: string;
  monsterChallenge: string;
  monsterTraits: string;
  monsterActions: string;
  monsterReactions: string;
  monsterLegendaryActions: string;
  ruleResources: string;
  ruleActions: string;
  ruleChoices: string;
  ruleTriggers: string;
  speciesLanguages: string;
  speciesSenses: string;
  speciesAbilityOptions: string;
  backgroundEquipment: string;
  backgroundLanguages: string;
  classSkillChoices: string;
  classSkillChoiceCount: string;
  classToolChoices: string;
  classSpellcastingProgression: string;
  classMulticlassNote: string;
  spellTarget: string;
  spellSave: string;
  spellArea: string;
  spellEffect: string;
  spellScaling: string;
  itemAttunement: string;
  itemCharges: string;
  itemRequirements: string;
  itemEffects: string;
  monsterAbilityScores: string;
  monsterSavingThrows: string;
  monsterSkills: string;
  monsterDamageVulnerabilities: string;
  monsterDamageResistances: string;
  monsterDamageImmunities: string;
  monsterConditionImmunities: string;
  monsterSenses: string;
  monsterLanguages: string;
  monsterProficiencyBonus: string;
};

const initialFields: Fields = {
  packName: '', versionLabel: '1.0.0', entryKind: 'species', entryName: '', size: '中型', speed: '30', summary: '', traits: '', heritageOptions: '',
  backgroundSkills: '', backgroundTools: '', featureName: '', featureDescription: '', featCategory: 'Origin', prerequisite: '',
  spellLevel: '0', spellSchool: '自定义', spellCastTime: '1 动作', spellRange: '自身', spellDuration: '立即', spellComponents: 'V',
  classPrimaryAbility: 'Str', classHitDice: 'D8', classSavingThrows: '', classWeaponProficiencies: '', classArmorProficiencies: '', classStartingEquipment: '', classFeatureLines: '',
  subclassParentClass: '', subclassUnlockLevel: '1', subclassFeatureLines: '',
  itemCategory: 'weapon', itemRarity: '', itemWeight: '', itemCost: '', itemDamage: '', itemDamageType: '', itemProperties: '', itemArmorClass: '', itemUsage: '',
  monsterSize: '中型', monsterType: '类人生物', monsterAlignment: '', monsterArmorClass: '', monsterHp: '', monsterSpeed: '30 尺', monsterChallenge: '', monsterTraits: '', monsterActions: '', monsterReactions: '', monsterLegendaryActions: '',
  ruleResources: '', ruleActions: '', ruleChoices: '', ruleTriggers: '',
  speciesLanguages: '', speciesSenses: '', speciesAbilityOptions: '',
  backgroundEquipment: '', backgroundLanguages: '',
  classSkillChoices: '', classSkillChoiceCount: '2', classToolChoices: '', classSpellcastingProgression: '', classMulticlassNote: '',
  spellTarget: '', spellSave: '', spellArea: '', spellEffect: '', spellScaling: '',
  itemAttunement: '', itemCharges: '', itemRequirements: '', itemEffects: '',
  monsterAbilityScores: '', monsterSavingThrows: '', monsterSkills: '', monsterDamageVulnerabilities: '', monsterDamageResistances: '', monsterDamageImmunities: '', monsterConditionImmunities: '', monsterSenses: '', monsterLanguages: '', monsterProficiencyBonus: '',
};

function blankEntryFields(previous: Fields): Fields {
  return { ...initialFields, packName: previous.packName, versionLabel: previous.versionLabel };
}

function copy(locale: Locale, zh: string, en: string): string {
  return locale === 'en' ? en : zh;
}

function FormField({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-[#58180d]">
      <span>
        {label}{required && <span className="ml-1 text-[#a52a2a]">*</span>}
      </span>
      <span className="text-[11px] font-normal leading-4 text-[#2c1810]/65">{hint}</span>
      {children}
    </label>
  );
}

function entryKindGuidance(locale: Locale, entryKind: Fields['entryKind']): { title: string; body: string } {
  if (entryKind === 'species') return {
    title: copy(locale, '种族：基础资料与血统选项', 'Species: identity and heritage options'),
    body: copy(locale, '会在车卡的种族选择中显示。特性与血统是说明性资料，不会自动施加规则效果。', 'Shown in the builder species selector. Traits and heritages are descriptive data and do not execute rules automatically.'),
  };
  if (entryKind === 'background') return {
    title: copy(locale, '背景：熟练项与背景特性', 'Background: proficiencies and feature'),
    body: copy(locale, '技能、工具与背景特性会作为车卡资料显示；背景特性不会自动授予资源或权限。', 'Skills, tools, and background feature text appear in the builder; the feature never grants resources or permissions automatically.'),
  };
  if (entryKind === 'class') return {
    title: copy(locale, '职业：车卡基础与说明特性', 'Class: builder basics and reference features'),
    body: copy(locale, '会提供生命骰、主属性、豁免和熟练项。这里只保存资料，不自动判断施法、装备选择或职业资源。', 'Provides hit die, primary ability, saves, and proficiencies. This saves reference data only; it does not automate casting, equipment choices, or class resources.'),
  };
  if (entryKind === 'subclass') return {
    title: copy(locale, '子职业：挂接到个人职业', 'Subclass: attached to a personal class'),
    body: copy(locale, '必须填写所属职业的准确名称。解锁等级和特性只供车卡与主持人阅读，不自动施加规则效果。', 'Enter the exact parent class name. Unlock level and feature text are for the builder and host to read; they do not execute rules automatically.'),
  };
  if (entryKind === 'feat') return {
    title: copy(locale, '专长：选择资料与前置说明', 'Feat: selection data and prerequisite note'),
    body: copy(locale, '起源专长可在车卡中选择；通用专长当前只保存说明，所有效果仍须由房间协商与审核。', 'Origin feats can be selected in the builder. General feats are informational for now; all effects remain subject to Room review.'),
  };
  if (entryKind === 'item') return {
    title: copy(locale, '物品：装备资料与使用说明', 'Item: equipment facts and use notes'),
    body: copy(locale, '会保存物品的类别、重量、价格、武器或护甲资料。当前不会自动装备、改变 AC 或结算伤害。', 'Stores category, weight, cost, and weapon or armor facts. It does not yet auto-equip, alter AC, or resolve damage.'),
  };
  if (entryKind === 'monster') return {
    title: copy(locale, '怪物：战斗资料卡', 'Monster: combat reference card'),
    body: copy(locale, '可保存基础防御、生命、特性和动作说明，供主持人准备遭遇。不会自动创建 Token 或执行怪物动作。', 'Stores defenses, HP, traits, and action text for host encounter preparation. It does not auto-create Tokens or execute monster actions.'),
  };
  if (entryKind === 'rule') return {
    title: copy(locale, '规则模块：可复用的桌面规则说明', 'Rule module: reusable table-rule notes'),
    body: copy(locale, '适合保存休息、灵感、制作、声望或其他非实体规则。使用下方通用组件表达资源、动作、选择与限制；不会直接改变房间权限。', 'Use this for rest, inspiration, crafting, reputation, or another non-entity rule. The shared components describe resources, actions, choices, and limits; they never change Room permissions directly.'),
  };
  if (entryKind === 'other') return {
    title: copy(locale, '其他资料：尚无专用编辑器的原创内容', 'Other reference: original content without a dedicated editor yet'),
    body: copy(locale, '先用说明和通用规则组件保存。后续可在不丢失版本历史的前提下迁移到专用编辑器。', 'Save it with a summary and shared rule components first. A later dedicated editor can migrate it without losing version history.'),
  };
  return {
    title: copy(locale, '法术：施法资料卡', 'Spell: casting reference card'),
    body: copy(locale, '会加入车卡的已知/准备法术列表；不保存伤害公式、豁免或自动施法效果。', 'Appears in the builder known/prepared list. Damage formulas, saves, and automated casting are not stored here.'),
  };
}

function listFromLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

/**
 * Personal authoring lives next to the Actor Vault, not Server Settings.
 * This slice only persists private metadata; it never activates a pack in a Room.
 */
export function DndPersonalSpeciesPackPanel({ locale, presentation = 'card', onCloseWorkbench }: Props) {
  const [open, setOpen] = useState(presentation === 'workbench');
  const [packs, setPacks] = useState<PersonalCompendiumPack[]>([]);
  const [fields, setFields] = useState<Fields>(initialFields);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [versioningPackId, setVersioningPackId] = useState<string | null>(null);
  const [inspectedPackId, setInspectedPackId] = useState<string | null>(null);
  const [inspectedVersion, setInspectedVersion] = useState<PersonalCompendiumPackVersionContent | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState('');
  const [importText, setImportText] = useState('');
  const [importDraft, setImportDraft] = useState<PersonalCompendiumImportDraft | null>(null);
  const [importError, setImportError] = useState('');
  const [draftEntries, setDraftEntries] = useState<PersonalCompendiumEntryInput[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      setPacks(await personalCompendiumPackApiClient.list());
    } catch (reason) {
      const message = reason instanceof ApiClientError && reason.statusCode === 401
        ? copy(locale, '需要先登录，才能读取你的自定义资料。', 'Sign in to load your custom content.')
        : copy(locale, '我的自定义资料暂时无法加载。', 'Your custom content is unavailable right now.');
      setNotice(message);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const traitList = useMemo(() => listFromLines(fields.traits), [fields.traits]);
  const heritageList = useMemo(() => listFromLines(fields.heritageOptions), [fields.heritageOptions]);
  const update = (key: keyof Fields, value: string) => setFields((previous) => ({ ...previous, [key]: value }));
  const ruleComponents = () => parseDndPersonalRuleComponents({
    resources: fields.ruleResources,
    actions: fields.ruleActions,
    choices: fields.ruleChoices,
    triggers: fields.ruleTriggers,
  });

  const inspectPack = async (pack: PersonalCompendiumPack) => {
    if (!pack.latestVersion || busy) return;
    if (inspectedPackId === pack.packId) {
      setInspectedPackId(null);
      setInspectedVersion(null);
      setInspectError('');
      return;
    }
    setInspectedPackId(pack.packId);
    setInspectedVersion(null);
    setInspectError('');
    setInspectLoading(true);
    try {
      setInspectedVersion(await personalCompendiumPackApiClient.getVersion(pack.packId, pack.latestVersion.packVersionId));
    } catch (reason) {
      setInspectError(reason instanceof ApiClientError && reason.statusCode === 401
        ? copy(locale, '需要先登录，才能查看个人资料版本。', 'Sign in to view this personal content version.')
        : copy(locale, '该资料版本暂时无法读取。', 'This content version is unavailable right now.'));
    } finally {
      setInspectLoading(false);
    }
  };

  const beginNewVersion = async (pack: PersonalCompendiumPack) => {
    if (!pack.latestVersion || busy) return;
    setBusy(true);
    setNotice('');
    try {
      const source = await personalCompendiumPackApiClient.getVersion(pack.packId, pack.latestVersion.packVersionId);
      setVersioningPackId(pack.packId);
      setDraftEntries(source.entries.map((entry) => ({
        entryKind: entry.entryKind as PersonalCompendiumEntryInput['entryKind'],
        displayName: entry.displayName,
        content: entry.content,
        metadata: entry.metadata,
      })));
      setFields((previous) => ({ ...previous, packName: pack.displayName, versionLabel: '1.1.0' }));
      setNotice(copy(locale, `已将“${pack.displayName}”的当前版本复制到草稿。你可以增删条目后发布新版本；旧版本不会被改写。`, `Copied the current ${pack.displayName} version into a draft. Add or remove entries, then publish a new version; the old version will not change.`));
    } catch (reason) {
      setNotice(reason instanceof ApiClientError && reason.statusCode === 401
        ? copy(locale, '需要先登录，才能基于已有资料包创建新版本。', 'Sign in to create a new version from an existing pack.')
        : copy(locale, '无法读取当前资料版本，尚未创建新版本草稿。', 'The current content version could not be loaded, so no new-version draft was created.'));
    } finally {
      setBusy(false);
    }
  };

  const entryFromFields = (): PersonalCompendiumEntryInput => {
    const name = fields.entryName.trim();
    if (fields.entryKind === 'background') {
      return {
        entryKind: 'background' as const,
        displayName: name,
        content: {
          schema: 'dnd-personal-background-v0',
          ruleComponents: ruleComponents(),
          name,
          summary: fields.summary.trim() || undefined,
          skillProficiencies: listFromLines(fields.backgroundSkills),
          toolProficiencies: listFromLines(fields.backgroundTools),
          equipmentNote: fields.backgroundEquipment.trim() || undefined,
          languages: listFromLines(fields.backgroundLanguages),
          feature: {
            name: fields.featureName.trim() || '自定义背景特性',
            desc: fields.featureDescription.trim() || '具体可用性以房间审核结果为准。',
          },
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customBackground' },
      };
    }
    if (fields.entryKind === 'class') {
      return {
        entryKind: 'class' as const,
        displayName: name,
        content: {
          schema: 'dnd-personal-class-v1',
          ruleComponents: ruleComponents(),
          name,
          summary: fields.summary.trim() || undefined,
          primaryAbility: fields.classPrimaryAbility,
          hitDice: fields.classHitDice,
          savingThrows: listFromLines(fields.classSavingThrows),
          weaponProficiencies: listFromLines(fields.classWeaponProficiencies),
          armorProficiencies: listFromLines(fields.classArmorProficiencies),
          startingEquipment: fields.classStartingEquipment.trim() || undefined,
          skillChoices: listFromLines(fields.classSkillChoices),
          skillChoiceCount: Math.max(0, Math.min(6, Number(fields.classSkillChoiceCount) || 0)) || undefined,
          toolChoices: listFromLines(fields.classToolChoices),
          spellcastingProgression: fields.classSpellcastingProgression.trim() || undefined,
          multiclassNote: fields.classMulticlassNote.trim() || undefined,
          features: parseDndPersonalFeatureLines(fields.classFeatureLines),
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customClass' },
      };
    }
    if (fields.entryKind === 'subclass') {
      return {
        entryKind: 'subclass' as const,
        displayName: name,
        content: {
          schema: 'dnd-personal-subclass-v1',
          ruleComponents: ruleComponents(),
          name,
          className: fields.subclassParentClass.trim(),
          summary: fields.summary.trim() || undefined,
          unlockLevel: Math.max(1, Math.min(20, Number(fields.subclassUnlockLevel) || 1)),
          features: parseDndPersonalFeatureLines(
            fields.subclassFeatureLines,
            Math.max(1, Math.min(20, Number(fields.subclassUnlockLevel) || 1)),
          ),
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customSubclass' },
      };
    }
    if (fields.entryKind === 'feat') {
      return {
        entryKind: 'feat' as const,
        displayName: name,
        content: {
          schema: 'dnd-personal-feat-v0',
          ruleComponents: ruleComponents(),
          name,
          summary: fields.summary.trim() || undefined,
          category: fields.featCategory,
          prerequisiteDesc: fields.prerequisite.trim() || undefined,
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customFeat' },
      };
    }
    if (fields.entryKind === 'spell') {
      return {
        entryKind: 'spell' as const,
        displayName: name,
        content: {
          schema: 'dnd-personal-spell-v1',
          ruleComponents: ruleComponents(),
          name,
          level: Math.max(0, Math.min(9, Number(fields.spellLevel) || 0)),
          school: fields.spellSchool.trim() || '自定义',
          castTime: fields.spellCastTime.trim() || '1 动作',
          range: fields.spellRange.trim() || '自身',
          duration: fields.spellDuration.trim() || '立即',
          components: fields.spellComponents.trim().toUpperCase() || 'V',
          summary: fields.summary.trim() || undefined,
          target: fields.spellTarget.trim() || undefined,
          savingThrow: fields.spellSave.trim() || undefined,
          area: fields.spellArea.trim() || undefined,
          effect: fields.spellEffect.trim() || undefined,
          scaling: fields.spellScaling.trim() || undefined,
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customSpell' },
      };
    }
    if (fields.entryKind === 'item') {
      return {
        entryKind: 'item' as const,
        displayName: name,
        content: {
          schema: 'dnd-personal-item-v2',
          ruleComponents: ruleComponents(),
          name,
          summary: fields.summary.trim() || undefined,
          category: fields.itemCategory,
          rarity: fields.itemRarity.trim() || undefined,
          weight: Number(fields.itemWeight) || undefined,
          cost: fields.itemCost.trim() || undefined,
          weapon: fields.itemCategory === 'weapon' ? {
            damage: fields.itemDamage.trim() || undefined,
            damageType: fields.itemDamageType.trim() || undefined,
            properties: listFromLines(fields.itemProperties),
          } : undefined,
          armor: fields.itemCategory === 'armor' ? {
            baseAc: Number(fields.itemArmorClass) || undefined,
          } : undefined,
          usage: fields.itemUsage.trim() || undefined,
          attunement: fields.itemAttunement.trim() || undefined,
          charges: fields.itemCharges.trim() || undefined,
          requirements: fields.itemRequirements.trim() || undefined,
          effects: parseDndPersonalNamedRuleLines(fields.itemEffects),
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customItem' },
      };
    }
    if (fields.entryKind === 'monster') {
      return {
        entryKind: 'monster' as const,
        displayName: name,
        content: {
          schema: 'dnd-personal-monster-v2',
          ruleComponents: ruleComponents(),
          name,
          summary: fields.summary.trim() || undefined,
          size: fields.monsterSize.trim() || undefined,
          creatureType: fields.monsterType.trim() || undefined,
          alignment: fields.monsterAlignment.trim() || undefined,
          armorClass: Number(fields.monsterArmorClass) || undefined,
          hitPoints: Number(fields.monsterHp) || undefined,
          speed: fields.monsterSpeed.trim() || undefined,
          challengeRating: fields.monsterChallenge.trim() || undefined,
          abilityScores: fields.monsterAbilityScores.trim() || undefined,
          savingThrows: fields.monsterSavingThrows.trim() || undefined,
          skills: fields.monsterSkills.trim() || undefined,
          damageVulnerabilities: listFromLines(fields.monsterDamageVulnerabilities),
          damageResistances: listFromLines(fields.monsterDamageResistances),
          damageImmunities: listFromLines(fields.monsterDamageImmunities),
          conditionImmunities: listFromLines(fields.monsterConditionImmunities),
          senses: fields.monsterSenses.trim() || undefined,
          languages: fields.monsterLanguages.trim() || undefined,
          proficiencyBonus: fields.monsterProficiencyBonus.trim() || undefined,
          traits: parseDndPersonalNamedRuleLines(fields.monsterTraits),
          actions: parseDndPersonalNamedRuleLines(fields.monsterActions),
          reactions: parseDndPersonalNamedRuleLines(fields.monsterReactions),
          legendaryActions: parseDndPersonalNamedRuleLines(fields.monsterLegendaryActions),
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customMonster' },
      };
    }
    if (fields.entryKind === 'rule' || fields.entryKind === 'other') {
      return {
        entryKind: fields.entryKind,
        displayName: name,
        content: {
          schema: fields.entryKind === 'rule' ? 'dnd-personal-rule-module-v1' : 'dnd-personal-other-reference-v1',
          name,
          summary: fields.summary.trim() || undefined,
          ruleComponents: ruleComponents(),
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: fields.entryKind === 'rule' ? 'customRuleModule' : 'customReference' },
      };
    }
    return {
      entryKind: 'species' as const,
      displayName: name,
      content: {
        schema: 'dnd-personal-species-v1',
        ruleComponents: ruleComponents(),
        name,
        size: fields.size.trim() || undefined,
        speedFeet: Number(fields.speed) || undefined,
        summary: fields.summary.trim() || undefined,
        traits: traitList,
        heritageOptions: heritageList,
        languages: listFromLines(fields.speciesLanguages),
        senses: fields.speciesSenses.trim() || undefined,
        abilityOptions: fields.speciesAbilityOptions.trim() || undefined,
      },
      metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customSpecies' },
    };
  };

  const addCurrentEntryToDraft = () => {
    if (!fields.entryName.trim() || busy) return;
    if (fields.entryKind === 'subclass' && !fields.subclassParentClass.trim()) {
      setNotice(copy(locale, '请先填写子职业所属的职业名称。', 'Enter the parent class name before adding a subclass.'));
      return;
    }
    const entry = entryFromFields();
    setDraftEntries((previous) => {
      const existingIndex = previous.findIndex((candidate) => candidate.entryKind === entry.entryKind && candidate.displayName === entry.displayName);
      if (existingIndex < 0) return [...previous, entry].slice(0, 50);
      return previous.map((candidate, index) => index === existingIndex ? entry : candidate);
    });
    setFields((previous) => blankEntryFields({ ...previous, packName: previous.packName || entry.displayName }));
    setNotice(copy(locale, `已将“${entry.displayName}”加入待保存内容；同名同类型条目会被当前内容替换。`, `Added ${entry.displayName} to the pending content; an entry with the same name and type is replaced by the current content.`));
  };

  const removeDraftEntry = (index: number) => {
    setDraftEntries((previous) => previous.filter((_, entryIndex) => entryIndex !== index));
  };

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (draftEntries.length === 0 || busy) return;
    setBusy(true);
    setNotice('');
    try {
      const draft: Omit<PublishPersonalCompendiumPackInput, 'displayName'> = {
        versionLabel: fields.versionLabel.trim() || '1.0.0',
        metadata: { gameSystemId: 'dnd5e-2024', authoringKind: 'dnd-personal-pack-draft-v0' },
        entries: draftEntries,
      };
      if (versioningPackId) await personalCompendiumPackApiClient.publishVersion(versioningPackId, draft);
      else await personalCompendiumPackApiClient.publish({ ...draft, displayName: deriveDndPersonalLibraryName(draftEntries) });
      setFields(initialFields);
      setDraftEntries([]);
      setVersioningPackId(null);
      setNotice(copy(locale, '已保存为不可变资料版本。将角色提交给房间时，主持人仍会审核所选版本。', 'Saved as an immutable content version. When you submit a character to a Room, the host will still review the selected version.'));
      await refresh();
    } catch (reason) {
      setNotice(reason instanceof ApiClientError
        ? reason.message
        : copy(locale, '保存失败，请稍后重试。', 'Saving failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const previewImport = () => {
    const result = parsePersonalCompendiumImport(importText);
    if (result.ok === false) {
      setImportDraft(null);
      setImportError(result.message);
      return;
    }
    setImportDraft(result.draft);
    setImportError('');
    setFields((previous) => ({
      ...previous,
      packName: versioningPackId ? previous.packName : result.draft.displayName,
      versionLabel: result.draft.versionLabel || previous.versionLabel,
    }));
  };

  const publishImport = async () => {
    if (!importDraft || busy) return;
    setBusy(true);
    setNotice('');
    try {
      const draft: Omit<PublishPersonalCompendiumPackInput, 'displayName'> = {
        versionLabel: fields.versionLabel.trim() || importDraft.versionLabel || '1.0.0',
        metadata: { gameSystemId: 'dnd5e-2024', authoringKind: 'personal-content-import-v0', ...importDraft.metadata },
        entries: importDraft.entries,
      };
      if (versioningPackId) await personalCompendiumPackApiClient.publishVersion(versioningPackId, draft);
      else await personalCompendiumPackApiClient.publish({ ...draft, displayName: importDraft.displayName });
      setImportText('');
      setImportDraft(null);
      setDraftEntries([]);
      setVersioningPackId(null);
      setFields(initialFields);
      setNotice(copy(locale, '导入内容已保存为不可变资料版本。房间仍会审核你提交的具体版本。', 'Imported content was saved as an immutable version. Rooms will still review the exact version you submit.'));
      await refresh();
    } catch (reason) {
      setNotice(reason instanceof ApiClientError
        ? reason.message
        : copy(locale, '导入保存失败，请稍后重试。', 'Import saving failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {presentation === 'card' && <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-48 border border-[#58180d]/30 bg-[#fff8e6]/80 p-6 text-left transition hover:-translate-y-0.5 hover:border-[#58180d]/60 hover:shadow-md"
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#a35b11]">Personal content</div>
        <h2 className="mt-1 text-lg font-bold text-[#58180d]">{copy(locale, '我的 D&D 规则内容', 'My D&D rules content')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#2c1810]/65">
          {copy(locale, '创建种族、职业、专长、物品或怪物。每项默认归入你的私人资料库，提交角色时再由房间主持人审核。', 'Create species, classes, feats, items, or monsters. Each stays in your private library until a Room host reviews a character submission.')}
        </p>
      </button>}

      {open && (
        <div className={presentation === 'card' ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#17130f]/45 p-4' : ''} role={presentation === 'card' ? 'presentation' : undefined}>
          <section role={presentation === 'card' ? 'dialog' : undefined} aria-modal={presentation === 'card' ? true : undefined} aria-label={copy(locale, '我的 D&D 规则内容', 'My D&D rules content')} className={presentation === 'card' ? 'max-h-[calc(100vh-2rem)] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#58180d]/30 bg-[#fffaf0] p-5 shadow-2xl' : 'w-full rounded-xl border border-[#58180d]/25 bg-[#fffaf0] p-5 shadow-sm'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#a35b11]">Personal D&D content</div>
                <h2 className="mt-1 text-xl font-black text-[#58180d]">{copy(locale, '我的 D&D 规则内容', 'My D&D rules content')}</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#2c1810]/70">
                  {copy(locale, '个人资料不会改写官方资料库，也不会自动加入服务器或房间。房间准入与可用内容由主持人后续审核。', 'Personal content never changes the official library and is not automatically added to a Server or Room. Room admission and allowed content remain host-reviewed.')}
                </p>
              </div>
              {presentation === 'card' && <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-xs font-bold text-[#58180d]">{copy(locale, '关闭', 'Close')}</button>}
              {presentation === 'workbench' && onCloseWorkbench && <button type="button" onClick={onCloseWorkbench} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-xs font-bold text-[#58180d]">{copy(locale, '返回车卡', 'Return to builder')}</button>}
            </div>

            <div className="mt-4 rounded-lg border border-[#58180d]/15 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#58180d]">{copy(locale, '已保存的自定义内容', 'Saved custom content')}</h3>
                <button type="button" onClick={() => void refresh()} disabled={loading || busy} className="rounded-md border border-[#58180d]/20 bg-white px-2.5 py-1.5 text-xs font-bold text-[#58180d] disabled:opacity-40">{copy(locale, '刷新', 'Refresh')}</button>
              </div>
              {loading && <p className="mt-2 text-xs text-[#2c1810]/65">{copy(locale, '正在加载…', 'Loading…')}</p>}
              {!loading && packs.length === 0 && !notice && <p className="mt-2 text-xs text-[#2c1810]/65">{copy(locale, '尚未创建自定义内容。创建一项后会自动保存到你的私人资料库。', 'No custom content yet. Your first entry will be saved to a private library automatically.')}</p>}
              {!loading && packs.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{packs.map((pack) => (
                <article key={pack.packId} className={`rounded-md border p-3 ${versioningPackId === pack.packId ? 'border-[#a35b11]/60 bg-[#fff1c7]/55' : 'border-[#58180d]/16 bg-white/65'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#58180d]">{pack.displayName}</h4>
                      <p className="mt-1 text-[11px] text-[#2c1810]/60">{pack.latestVersion ? `${copy(locale, '当前版本', 'Current version')} · ${pack.latestVersion.versionLabel}` : copy(locale, '尚无可读取版本', 'No readable version yet')}</p>
                    </div>
                    <span className="rounded-full border border-[#58180d]/15 bg-[#fff8e6] px-2 py-0.5 text-[10px] font-bold text-[#7a4610]">{copy(locale, '仅自己可见', 'Private')}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" disabled={busy || !pack.latestVersion} onClick={() => void inspectPack(pack)} className="rounded-md border border-[#58180d]/20 bg-white px-2.5 py-1.5 text-xs font-bold text-[#58180d] disabled:opacity-40">
                      {inspectedPackId === pack.packId ? copy(locale, '收起内容', 'Hide contents') : copy(locale, '查看内容', 'View contents')}
                    </button>
                    <button type="button" disabled={busy || !pack.latestVersion} onClick={() => void beginNewVersion(pack)} className="rounded-md border border-[#a35b11]/25 bg-[#fff1c7]/55 px-2.5 py-1.5 text-xs font-bold text-[#7a4610] disabled:opacity-40">
                      {copy(locale, '基于此包创建新版本', 'Create a new version')}
                    </button>
                  </div>
                </article>
              ))}</div>}
              {inspectedPackId && <div className="mt-3 rounded-md border border-[#2f7f68]/25 bg-[#f1fbf7] p-3 text-xs text-[#184f42]">
                {inspectLoading && <p>{copy(locale, '正在读取资料版本…', 'Loading content version…')}</p>}
                {inspectError && <p className="font-semibold text-[#a52a2a]">{inspectError}</p>}
                {inspectedVersion && <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{inspectedVersion.pack.displayName} · {inspectedVersion.version.versionLabel}</p>
                    <span>{copy(locale, '已发布版本不可直接修改', 'Published versions are immutable')}</span>
                  </div>
                  {inspectedVersion.entries.length === 0 ? <p className="mt-2">{copy(locale, '此版本没有可显示的条目。', 'This version has no displayable entries.')}</p> : <ul className="mt-2 space-y-1.5">
                    {inspectedVersion.entries.map((entry) => <li key={entry.compendiumEntryId} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#2f7f68]/15 bg-white/65 px-2 py-1.5"><span className="font-semibold">{entry.displayName}</span><span className="rounded-full bg-[#2f7f68]/10 px-2 py-0.5 text-[10px] font-bold">{entry.entryKind}</span></li>)}
                  </ul>}
                </>}
              </div>}
            </div>

            <form onSubmit={(event) => void publish(event)} className="mt-4 grid gap-3 rounded-lg border border-dashed border-[#a35b11]/35 bg-white/70 p-3">
              <div>
                <h3 className="text-sm font-bold text-[#58180d]">{versioningPackId ? copy(locale, '编辑新的内容版本', 'Edit a new content version') : copy(locale, '新建 D&D 规则内容', 'Create D&D rules content')}</h3>
                <p className="mt-1 text-xs leading-5 text-[#2c1810]/65">{versioningPackId ? copy(locale, '当前版本会先复制为草稿。发布后旧版本保持不变，车卡与房间可继续引用原版本。', 'The current version is copied into a draft. Publishing keeps the old version immutable so existing characters and Rooms can keep referencing it.') : copy(locale, '先添加一项或多项规则内容，再保存到你的私人资料库。普通创建不需要填写整合包名称。', 'Add one or more rules entries, then save to your private library. Ordinary creation never asks you to name a content pack.')}</p>
              </div>
              <div className="rounded-md border border-[#a35b11]/22 bg-[#fff1c7]/40 p-3 text-xs leading-5 text-[#58180d]/80">
                <p className="font-bold text-[#58180d]">{entryKindGuidance(locale, fields.entryKind).title}</p>
                <p className="mt-1">{entryKindGuidance(locale, fields.entryKind).body}</p>
              </div>
              <div className="rounded-md border border-[#2f7f68]/25 bg-[#f1fbf7] p-3 text-xs text-[#184f42]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{copy(locale, `待保存内容 · ${draftEntries.length} 项`, `Pending content · ${draftEntries.length} entries`)}</p>
                  {draftEntries.length > 0 && <button type="button" onClick={() => setDraftEntries([])} disabled={busy} className="rounded border border-[#2f7f68]/25 bg-white px-2 py-1 text-[11px] font-bold text-[#184f42] disabled:opacity-40">{copy(locale, '清空草稿', 'Clear draft')}</button>}
                </div>
                {draftEntries.length === 0
                  ? <p className="mt-1 leading-5">{copy(locale, '填写下方条目后，选择“加入待保存内容”。你可以继续添加不同类型，再统一保存。', 'Fill in an entry below and choose “Add to pending content.” You can continue adding types, then save them together.')}</p>
                  : <ul className="mt-2 space-y-1.5">
                    {draftEntries.map((entry, index) => <li key={`${entry.entryKind}-${entry.displayName}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#2f7f68]/15 bg-white/70 px-2 py-1.5">
                      <span><span className="font-semibold">{entry.displayName}</span> <span className="ml-1 rounded-full bg-[#2f7f68]/10 px-1.5 py-0.5 text-[10px] font-bold">{entry.entryKind}</span></span>
                      <button type="button" onClick={() => removeDraftEntry(index)} disabled={busy} className="text-[11px] font-bold text-[#a52a2a] disabled:opacity-40">{copy(locale, '移除', 'Remove')}</button>
                    </li>)}
                  </ul>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {versioningPackId && <FormField label={copy(locale, '正在更新的资料库', 'Library being updated')} hint={copy(locale, '版本容器只用于保存不可变历史，普通编辑不需要管理它。', 'The version container only preserves immutable history; ordinary editing does not require managing it.')}>
                  <input value={fields.packName} disabled className="rounded-md border border-[#58180d]/20 bg-[#fff8e6] px-3 py-2 text-sm font-normal disabled:opacity-70" />
                </FormField>}
                <FormField label={copy(locale, '资料类型', 'Content type')} required hint={copy(locale, '决定车卡会在哪个选择区显示这份资料。', 'Controls which builder selector can display this content.')}>
                  <select value={fields.entryKind} onChange={(event) => update('entryKind', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50">
                    <option value="species">{copy(locale, '种族', 'Species')}</option>
                    <option value="class">{copy(locale, '职业', 'Class')}</option>
                    <option value="subclass">{copy(locale, '子职业', 'Subclass')}</option>
                    <option value="background">{copy(locale, '背景', 'Background')}</option>
                    <option value="feat">{copy(locale, '专长', 'Feat')}</option>
                    <option value="spell">{copy(locale, '法术', 'Spell')}</option>
                    <option value="item">{copy(locale, '物品与装备', 'Item & equipment')}</option>
                    <option value="monster">{copy(locale, '怪物', 'Monster')}</option>
                    <option value="rule">{copy(locale, '规则模块', 'Rule module')}</option>
                    <option value="other">{copy(locale, '其他原创资料', 'Other original reference')}</option>
                  </select>
                </FormField>
                <FormField label={copy(locale, '条目名称', 'Entry name')} required hint={copy(locale, '玩家在车卡中看到和选择的名称。', 'The name players see and select in Character Builder.')}>
                  <input value={fields.entryName} onChange={(event) => update('entryName', event.target.value)} placeholder={copy(locale, '例如：潮汐精灵', 'e.g. Tide Elf')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '版本标签', 'Version label')} hint={copy(locale, '发布后不可改写。首次可用 1.0.0，后续使用 1.1.0 等新标签。', 'Immutable after publishing. Use 1.0.0 first, then a new label such as 1.1.0.')}>
                  <input value={fields.versionLabel} onChange={(event) => update('versionLabel', event.target.value)} placeholder={copy(locale, '例如：1.0.0', 'e.g. 1.0.0')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                {fields.entryKind === 'species' && <>
                  <FormField label={copy(locale, '体型', 'Size')} hint={copy(locale, '角色卡上显示的体型文字，例如“中型”。', 'Display size on the character sheet, for example “Medium”.')}>
                    <input value={fields.size} onChange={(event) => update('size', event.target.value)} placeholder={copy(locale, '例如：中型', 'e.g. Medium')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '基础速度（尺）', 'Base speed (ft)')} hint={copy(locale, '车卡显示的基础步行速度，只填数字，例如 30。', 'Base walking speed displayed in the builder. Enter a number only, such as 30.')}>
                    <input value={fields.speed} onChange={(event) => update('speed', event.target.value)} inputMode="numeric" placeholder="30" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </>}
                {fields.entryKind === 'feat' && <>
                  <FormField label={copy(locale, '专长分类', 'Feat category')} hint={copy(locale, '起源专长会进入车卡选择；通用专长目前仅作为资料保留。', 'Origin feats enter the builder selector; general feats are stored as reference only for now.')}>
                    <select value={fields.featCategory} onChange={(event) => update('featCategory', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50">
                      <option value="Origin">{copy(locale, '起源专长（可在车卡选择）', 'Origin feat (selectable in builder)')}</option>
                      <option value="General">{copy(locale, '通用专长（仅保留资料）', 'General feat (content only)')}</option>
                    </select>
                  </FormField>
                  <FormField label={copy(locale, '前置条件说明', 'Prerequisite note')} hint={copy(locale, '给玩家与主持人阅读的条件文字，不会自动判断是否满足。', 'A note for players and the host; eligibility is not automatically evaluated.')}>
                    <input value={fields.prerequisite} onChange={(event) => update('prerequisite', event.target.value)} placeholder={copy(locale, '可选，例如：4 级以上', 'Optional, e.g. level 4 or higher')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </>}
                {fields.entryKind === 'class' && <>
                  <FormField label={copy(locale, '主属性', 'Primary ability')} hint={copy(locale, '车卡用于提示该职业的核心属性；不会自动限制属性分配。', 'Shown as the class core ability in the builder; it does not restrict attribute allocation.')}>
                    <select value={fields.classPrimaryAbility} onChange={(event) => update('classPrimaryAbility', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50">
                      <option value="Str">{copy(locale, '力量（Str）', 'Strength (Str)')}</option><option value="Dex">{copy(locale, '敏捷（Dex）', 'Dexterity (Dex)')}</option><option value="Con">{copy(locale, '体质（Con）', 'Constitution (Con)')}</option><option value="Int">{copy(locale, '智力（Int）', 'Intelligence (Int)')}</option><option value="Wis">{copy(locale, '感知（Wis）', 'Wisdom (Wis)')}</option><option value="Cha">{copy(locale, '魅力（Cha）', 'Charisma (Cha)')}</option>
                    </select>
                  </FormField>
                  <FormField label={copy(locale, '生命骰', 'Hit die')} hint={copy(locale, '用于完成车卡时计算 1 级生命值。', 'Used to calculate level-one hit points when completing the builder.')}>
                    <select value={fields.classHitDice} onChange={(event) => update('classHitDice', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50"><option value="D4">D4</option><option value="D6">D6</option><option value="D8">D8</option><option value="D10">D10</option><option value="D12">D12</option></select>
                  </FormField>
                </>}
                {fields.entryKind === 'subclass' && <>
                  <FormField label={copy(locale, '所属职业名称', 'Parent class name')} required hint={copy(locale, '必须与同一次保存的个人职业名称完全一致，才能出现在该职业下。', 'Must exactly match a personal class saved in the same library version to appear under that class.')}>
                    <input value={fields.subclassParentClass} onChange={(event) => update('subclassParentClass', event.target.value)} placeholder={copy(locale, '例如：港湾守卫', 'e.g. Harbor Warden')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '解锁等级', 'Unlock level')} hint={copy(locale, '填 1 至 20。只有 1 级解锁的子职业会在新角色车卡中要求选择。', 'Enter 1 through 20. Only subclasses unlocked at level 1 are required during new-character creation.')}>
                    <input value={fields.subclassUnlockLevel} onChange={(event) => update('subclassUnlockLevel', event.target.value)} inputMode="numeric" placeholder="1" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </>}
                {fields.entryKind === 'spell' && <>
                  <FormField label={copy(locale, '法术环阶', 'Spell level')} hint={copy(locale, '填 0 至 9；0 代表戏法。', 'Enter 0 through 9; 0 means a cantrip.')}>
                    <input value={fields.spellLevel} onChange={(event) => update('spellLevel', event.target.value)} inputMode="numeric" placeholder="0" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '学派或类型', 'School or type')} hint={copy(locale, '用于资料卡的分类显示，例如“塑能”或“仪式”。', 'A display category for the reference card, such as “Evocation” or “Ritual”.')}>
                    <input value={fields.spellSchool} onChange={(event) => update('spellSchool', event.target.value)} placeholder={copy(locale, '例如：塑能', 'e.g. Evocation')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '施法时间', 'Casting time')} hint={copy(locale, '资料卡显示，例如“1 动作”或“反应”。', 'Shown on the reference card, for example “1 action” or “reaction”.')}>
                    <input value={fields.spellCastTime} onChange={(event) => update('spellCastTime', event.target.value)} placeholder={copy(locale, '例如：1 动作', 'e.g. 1 action')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '施法距离', 'Range')} hint={copy(locale, '资料卡显示，例如“60 尺”或“自身”。不连接地图测距。', 'Shown on the reference card, e.g. “60 ft” or “Self”. It does not control map measurement.')}>
                    <input value={fields.spellRange} onChange={(event) => update('spellRange', event.target.value)} placeholder={copy(locale, '例如：60 尺', 'e.g. 60 ft')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '持续时间', 'Duration')} hint={copy(locale, '资料卡显示，例如“1 分钟”或“立即”。', 'Shown on the reference card, e.g. “1 minute” or “Instantaneous”.')}>
                    <input value={fields.spellDuration} onChange={(event) => update('spellDuration', event.target.value)} placeholder={copy(locale, '例如：1 分钟', 'e.g. 1 minute')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '施法成分', 'Components')} hint={copy(locale, '资料卡显示，使用 V、S、M 等简写；不校验材料消耗。', 'Displayed as V, S, M, etc. Material consumption is not validated.')}>
                    <input value={fields.spellComponents} onChange={(event) => update('spellComponents', event.target.value)} placeholder="V, S, M" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </>}
                {fields.entryKind === 'item' && <>
                  <FormField label={copy(locale, '物品分类', 'Item category')} hint={copy(locale, '分类决定需要填写哪些可读资料。它不会自动装备或产生规则效果。', 'The category controls which readable facts you enter. It does not auto-equip or create rule effects.')}>
                    <select value={fields.itemCategory} onChange={(event) => update('itemCategory', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50">
                      <option value="weapon">{copy(locale, '武器', 'Weapon')}</option><option value="armor">{copy(locale, '护甲或盾牌', 'Armor or shield')}</option><option value="gear">{copy(locale, '冒险装备', 'Adventuring gear')}</option><option value="consumable">{copy(locale, '消耗品', 'Consumable')}</option><option value="magicItem">{copy(locale, '魔法物品', 'Magic item')}</option>
                    </select>
                  </FormField>
                  <FormField label={copy(locale, '稀有度', 'Rarity')} hint={copy(locale, '可选的资料分类，例如“普通”或“珍稀”。', 'Optional reference classification, such as Common or Rare.')}>
                    <input value={fields.itemRarity} onChange={(event) => update('itemRarity', event.target.value)} placeholder={copy(locale, '可选，例如：珍稀', 'Optional, e.g. Rare')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '重量（磅）', 'Weight (lb)')} hint={copy(locale, '可选数字；当前不会自动计算负重。', 'Optional number; encumbrance is not calculated automatically yet.')}>
                    <input value={fields.itemWeight} onChange={(event) => update('itemWeight', event.target.value)} inputMode="decimal" placeholder="3" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '价值', 'Cost')} hint={copy(locale, '可选显示文字，例如“15 GP”。', 'Optional display text, e.g. 15 GP.')}>
                    <input value={fields.itemCost} onChange={(event) => update('itemCost', event.target.value)} placeholder="15 GP" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  {fields.itemCategory === 'weapon' && <>
                    <FormField label={copy(locale, '伤害骰', 'Damage dice')} hint={copy(locale, '例如“1d8”。当前只保存资料，不会自动攻击。', 'For example 1d8. Stored as reference only; it does not attack automatically.')}>
                      <input value={fields.itemDamage} onChange={(event) => update('itemDamage', event.target.value)} placeholder="1d8" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                    </FormField>
                    <FormField label={copy(locale, '伤害类型', 'Damage type')} hint={copy(locale, '例如“挥砍”或“穿刺”。', 'For example slashing or piercing.')}>
                      <input value={fields.itemDamageType} onChange={(event) => update('itemDamageType', event.target.value)} placeholder={copy(locale, '例如：挥砍', 'e.g. Slashing')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                    </FormField>
                    <FormField label={copy(locale, '武器属性', 'Weapon properties')} hint={copy(locale, '每行一项，例如“灵巧”“双手”。目前只做资料展示。', 'One per line, such as Finesse or Two-Handed. Reference display only for now.')}>
                      <textarea value={fields.itemProperties} onChange={(event) => update('itemProperties', event.target.value)} placeholder={copy(locale, '灵巧\n轻型', 'Finesse\nLight')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                    </FormField>
                  </>}
                  {fields.itemCategory === 'armor' && <FormField label={copy(locale, '基础 AC', 'Base AC')} hint={copy(locale, '可选数字；当前不会自动重算角色 AC。', 'Optional number; character AC is not automatically recalculated yet.')}>
                    <input value={fields.itemArmorClass} onChange={(event) => update('itemArmorClass', event.target.value)} inputMode="numeric" placeholder="14" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>}
                  <FormField label={copy(locale, '使用与限制说明', 'Use and limits')} hint={copy(locale, '可选。描述消耗、充能、协调或主持人裁定事项，不执行自动效果。', 'Optional. Describe uses, charges, attunement, or host rulings without automatic effects.')}>
                    <textarea value={fields.itemUsage} onChange={(event) => update('itemUsage', event.target.value)} placeholder={copy(locale, '可选：使用方式、次数或主持人裁定', 'Optional: use, charges, or host ruling')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </>}
                {fields.entryKind === 'monster' && <>
                  <FormField label={copy(locale, '体型', 'Size')} hint={copy(locale, '例如“小型”“大型”。', 'For example Small or Large.')}>
                    <input value={fields.monsterSize} onChange={(event) => update('monsterSize', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '生物类型', 'Creature type')} hint={copy(locale, '例如“野兽”“亡灵”或“类人生物”。', 'For example Beast, Undead, or Humanoid.')}>
                    <input value={fields.monsterType} onChange={(event) => update('monsterType', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '阵营', 'Alignment')} hint={copy(locale, '可选资料文字。', 'Optional reference text.')}>
                    <input value={fields.monsterAlignment} onChange={(event) => update('monsterAlignment', event.target.value)} placeholder={copy(locale, '可选，例如：混乱中立', 'Optional, e.g. Chaotic Neutral')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '挑战等级', 'Challenge rating')} hint={copy(locale, '可选资料文字，不自动计算遭遇难度。', 'Optional reference text; encounter difficulty is not calculated automatically.')}>
                    <input value={fields.monsterChallenge} onChange={(event) => update('monsterChallenge', event.target.value)} placeholder="1/4" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '护甲等级', 'Armor class')} hint={copy(locale, '可选数字，主持人放入战斗时可参考。', 'Optional number for host combat preparation.')}>
                    <input value={fields.monsterArmorClass} onChange={(event) => update('monsterArmorClass', event.target.value)} inputMode="numeric" placeholder="13" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '生命值', 'Hit points')} hint={copy(locale, '可选数字，主持人可据此预填战斗单位。', 'Optional number that a host may use to prefill a combatant.')}>
                    <input value={fields.monsterHp} onChange={(event) => update('monsterHp', event.target.value)} inputMode="numeric" placeholder="22" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '速度', 'Speed')} hint={copy(locale, '例如“30 尺，游泳 30 尺”。', 'For example 30 ft., swim 30 ft.')}>
                    <input value={fields.monsterSpeed} onChange={(event) => update('monsterSpeed', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </>}
              </div>
              <FormField label={copy(locale, '简短说明', 'Short summary')} hint={copy(locale, '给车卡与主持人快速阅读的简介。不要填写自动结算、伤害公式或隐藏权限。', 'A quick description for the builder and host. Do not put automation, damage formulas, or hidden permissions here.')}>
                <textarea value={fields.summary} onChange={(event) => update('summary', event.target.value)} placeholder={copy(locale, '可选：用一两句话说明主题与玩法感受', 'Optional: summarize the theme in one or two sentences')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
              </FormField>
              <details className="rounded-md border border-[#a35b11]/25 bg-[#fff8e6] p-3">
                <summary className="cursor-pointer text-sm font-bold text-[#58180d]">{copy(locale, '通用规则组件（可选）', 'Shared rule components (optional)')}</summary>
                <p className="mt-1 text-xs leading-5 text-[#2c1810]/65">{copy(locale, '资源、动作、选择与触发可以被任意原创内容复用。它们会作为结构化、可审核的资料保存；当前不会自动施法、扣除资源或执行效果。', 'Resources, actions, choices, and triggers can be reused by any original content. They are stored as structured, reviewable facts and do not currently cast, spend resources, or execute effects automatically.')}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <FormField label={copy(locale, '资源', 'Resources')} hint={copy(locale, '每行：名称 | 上限或公式 | 恢复 | 说明。例如“魂丝 | 职业等级 + 魅力调整值 | 长休；短休一次 | 强化魂艺”。', 'One per line: name | maximum or formula | recovery | description.')}>
                    <textarea value={fields.ruleResources} onChange={(event) => update('ruleResources', event.target.value)} placeholder={copy(locale, '魂丝 | 职业等级 + 魅力调整值 + 熟练加值 | 长休；短休一次 | 用于魂艺与牵魂', 'Soul Thread | class level + Charisma modifier + proficiency bonus | long rest; once per short rest | used for soul arts')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '动作与能力', 'Actions and abilities')} hint={copy(locale, '每行：名称 | 动作类型 | 射程 | 消耗 | 说明。例如“魂击 | 附赠动作命令 | 5 尺 | 无 | 魂器攻击”。', 'One per line: name | activation | range | cost | description.')}>
                    <textarea value={fields.ruleActions} onChange={(event) => update('ruleActions', event.target.value)} placeholder={copy(locale, '魂击 | 附赠动作命令 | 5 尺 | 无 | 魂器进行攻击', 'Soul strike | bonus-action command | 5 ft. | none | the vessel attacks')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '选择组', 'Choice groups')} hint={copy(locale, '每行：名称 | 前置条件 | 选择数量 | 选项 1；选项 2。例如“魂艺 | 2级 | 选择两项 | 空壳之眼；灵魂换位”。', 'One per line: name | prerequisite | selection | option 1; option 2.')}>
                    <textarea value={fields.ruleChoices} onChange={(event) => update('ruleChoices', event.target.value)} placeholder={copy(locale, '魂艺 | 2级 | 选择两项 | 空壳之眼；灵魂换位', 'Soul arts | level 2 | choose two | Empty Vessel Eye; Soul Swap')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '触发与限制', 'Triggers and limits')} hint={copy(locale, '每行：名称 | 说明。适合记录“每回合一次”“命中后”等限制。', 'One per line: name | description. Use this for facts such as once per turn or on hit.')}>
                    <textarea value={fields.ruleTriggers} onChange={(event) => update('ruleTriggers', event.target.value)} placeholder={copy(locale, '每回合一次 | 同一命中只能消耗一项魂艺', 'Once per turn | One soul art may be spent for the same hit')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </div>
              </details>
              {fields.entryKind === 'spell' && <div className="grid gap-2 rounded-md border border-[#644a9b]/20 bg-[#f7f3ff] p-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><p className="text-sm font-bold text-[#4d3278]">{copy(locale, '法术细节', 'Spell details')}</p><p className="mt-1 text-xs leading-5 text-[#2c1810]/65">{copy(locale, '将法术的目标、豁免、范围和成长分开填写，方便主持人审核与日后接入范围工具。当前不自动结算命中或效果。', 'Record targets, saves, areas, and scaling separately for host review and future range tooling. It does not resolve hits or effects automatically yet.')}</p></div>
                <FormField label={copy(locale, '目标', 'Target')} hint={copy(locale, '例如“一个你能看见的生物”或“自己”。', 'For example one creature you can see, or Self.')}>
                  <input value={fields.spellTarget} onChange={(event) => update('spellTarget', event.target.value)} placeholder={copy(locale, '例如：一个你能看见的生物', 'e.g. one creature you can see')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '豁免或攻击检定', 'Save or attack')} hint={copy(locale, '例如“感知豁免”“远程法术攻击”，没有则留空。', 'For example Wisdom save or ranged spell attack. Leave blank when none.')}>
                  <input value={fields.spellSave} onChange={(event) => update('spellSave', event.target.value)} placeholder={copy(locale, '例如：感知豁免', 'e.g. Wisdom save')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '区域与模板', 'Area and template')} hint={copy(locale, '例如“15 尺锥形”“20 尺半径”。仅保存资料，不自动放置地图模板。', 'For example 15-foot cone or 20-foot radius. It does not place a map template automatically.')}>
                  <input value={fields.spellArea} onChange={(event) => update('spellArea', event.target.value)} placeholder={copy(locale, '可选，例如：20 尺半径', 'Optional, e.g. 20-foot radius')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '效果与伤害说明', 'Effect and damage note')} hint={copy(locale, '写清命中/失败效果、伤害类型或状态，但不自动执行。', 'Describe hit/failure effects, damage type, or conditions, without automatic execution.')}>
                  <textarea value={fields.spellEffect} onChange={(event) => update('spellEffect', event.target.value)} placeholder={copy(locale, '例如：失败受到 3d6 心灵伤害并恐惧至下回合开始', 'e.g. Failed save: 3d6 psychic damage and frightened until next turn')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '升环或等级成长', 'Upcast or level scaling')} hint={copy(locale, '例如“每高于 1 环一级，伤害增加 1d6”。', 'For example, damage increases by 1d6 for every slot level above 1st.')}>
                  <textarea value={fields.spellScaling} onChange={(event) => update('spellScaling', event.target.value)} placeholder={copy(locale, '可选：每高一环增加 1d6 伤害', 'Optional: add 1d6 damage per slot level')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
              </div>}
              {fields.entryKind === 'item' && <div className="grid gap-2 rounded-md border border-[#2f7f68]/20 bg-[#f1fbf7] p-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><p className="text-sm font-bold text-[#184f42]">{copy(locale, '魔法物品与使用细节', 'Magic-item and use details')}</p><p className="mt-1 text-xs leading-5 text-[#2c1810]/65">{copy(locale, '充能、协调和效果会作为可审核资料保存；背包、装备位和自动效果将由后续车卡切片处理。', 'Charges, attunement, and effects are saved for review. Inventory, equipment slots, and automated effects stay deferred to a later character-sheet slice.')}</p></div>
                <FormField label={copy(locale, '协调要求', 'Attunement')} hint={copy(locale, '例如“需要协调：施法者”或“不需要”。', 'For example requires attunement by a spellcaster, or no attunement.')}>
                  <input value={fields.itemAttunement} onChange={(event) => update('itemAttunement', event.target.value)} placeholder={copy(locale, '可选，例如：需要协调', 'Optional, e.g. requires attunement')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '充能与恢复', 'Charges and recovery')} hint={copy(locale, '例如“7 充能；黎明恢复 1d6+1”。', 'For example 7 charges; regains 1d6+1 at dawn.')}>
                  <input value={fields.itemCharges} onChange={(event) => update('itemCharges', event.target.value)} placeholder={copy(locale, '可选，例如：7 充能；黎明恢复 1d6+1', 'Optional, e.g. 7 charges; regains 1d6+1 at dawn')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '使用前置与限制', 'Requirements and limits')} hint={copy(locale, '记录职业、等级、种族、次数或其他限制。', 'Record class, level, ancestry, use limits, or other requirements.')}>
                  <textarea value={fields.itemRequirements} onChange={(event) => update('itemRequirements', event.target.value)} placeholder={copy(locale, '例如：仅限善良阵营角色；每长休一次', 'e.g. good-aligned character only; once per long rest')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '效果列表', 'Effect list')} hint={copy(locale, '每行“名称 | 说明”。例如“月辉 | 命中时额外造成光耀伤害”。', 'One per line: name | description. For example Moonlight | Deals extra radiant damage on a hit.')}>
                  <textarea value={fields.itemEffects} onChange={(event) => update('itemEffects', event.target.value)} placeholder={copy(locale, '月辉 | 命中时额外造成光耀伤害', 'Moonlight | Deals extra radiant damage on a hit')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
              </div>}
              {fields.entryKind === 'monster' && <div className="grid gap-2 sm:grid-cols-2">
                <FormField label={copy(locale, '特性', 'Traits')} hint={copy(locale, '每行“名称 | 说明”。例如“敏锐嗅觉 | 依赖嗅觉的察觉检定具有优势”。', 'One line per entry: name | description. For example Keen Smell | Has advantage on Perception checks that rely on smell.')}>
                  <textarea value={fields.monsterTraits} onChange={(event) => update('monsterTraits', event.target.value)} placeholder={copy(locale, '敏锐嗅觉 | 依赖嗅觉的察觉检定具有优势', 'Keen Smell | Has advantage on Perception checks that rely on smell')} disabled={busy} className="min-h-28 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '动作', 'Actions')} hint={copy(locale, '每行“名称 | 说明”。保存为怪物资料，不会自动掷骰或结算伤害。', 'One line per entry: name | description. Saved as monster reference; it does not roll or resolve damage automatically.')}>
                  <textarea value={fields.monsterActions} onChange={(event) => update('monsterActions', event.target.value)} placeholder={copy(locale, '短剑 | 近战武器攻击；命中后造成穿刺伤害', 'Shortsword | Melee weapon attack; deals piercing damage on a hit')} disabled={busy} className="min-h-28 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '反应', 'Reactions')} hint={copy(locale, '每行“名称 | 说明”。没有时可留空。', 'One line per entry: name | description. Leave blank when none.')}>
                  <textarea value={fields.monsterReactions} onChange={(event) => update('monsterReactions', event.target.value)} placeholder={copy(locale, '招架 | 受到近战攻击命中时提高 AC', 'Parry | Raises AC when hit by a melee attack')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '传奇动作', 'Legendary actions')} hint={copy(locale, '每行“名称 | 说明”。没有时可留空。', 'One line per entry: name | description. Leave blank when none.')}>
                  <textarea value={fields.monsterLegendaryActions} onChange={(event) => update('monsterLegendaryActions', event.target.value)} placeholder={copy(locale, '移动 | 移动至多一半速度', 'Move | Move up to half speed')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
              </div>}
              {fields.entryKind === 'monster' && <details className="rounded-md border border-[#7f3a3a]/20 bg-[#fff6f2] p-3">
                <summary className="cursor-pointer text-sm font-bold text-[#6c2727]">{copy(locale, '完整怪物属性块（可选）', 'Full monster stat block (optional)')}</summary>
                <p className="mt-1 text-xs leading-5 text-[#2c1810]/65">{copy(locale, '这些是完整怪物资料的常用区块。保存后可供主持人阅读、审核和未来遭遇工具使用；不会自动创建怪物或开启自动战斗。', 'These are the common sections of a complete monster record. They are saved for host review and future encounter tooling; they do not auto-create a monster or start automated combat.')}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <FormField label={copy(locale, '六项属性', 'Six ability scores')} hint={copy(locale, '例如“力量 14，敏捷 12，体质 16，智力 8，感知 10，魅力 6”。', 'For example Strength 14, Dexterity 12, Constitution 16, Intelligence 8, Wisdom 10, Charisma 6.')}>
                    <textarea value={fields.monsterAbilityScores} onChange={(event) => update('monsterAbilityScores', event.target.value)} placeholder={copy(locale, '力量 14，敏捷 12，体质 16，智力 8，感知 10，魅力 6', 'Str 14, Dex 12, Con 16, Int 8, Wis 10, Cha 6')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '熟练加值', 'Proficiency bonus')} hint={copy(locale, '例如“+2”。可留空。', 'For example +2. Optional.')}>
                    <input value={fields.monsterProficiencyBonus} onChange={(event) => update('monsterProficiencyBonus', event.target.value)} placeholder="+2" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '豁免熟练', 'Saving throws')} hint={copy(locale, '例如“敏捷 +5，感知 +3”。', 'For example Dex +5, Wis +3.')}>
                    <textarea value={fields.monsterSavingThrows} onChange={(event) => update('monsterSavingThrows', event.target.value)} placeholder={copy(locale, '敏捷 +5，感知 +3', 'Dex +5, Wis +3')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '技能', 'Skills')} hint={copy(locale, '例如“隐匿 +7，察觉 +4”。', 'For example Stealth +7, Perception +4.')}>
                    <textarea value={fields.monsterSkills} onChange={(event) => update('monsterSkills', event.target.value)} placeholder={copy(locale, '隐匿 +7，察觉 +4', 'Stealth +7, Perception +4')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '伤害易伤', 'Damage vulnerabilities')} hint={copy(locale, '每行一项。没有时留空。', 'One per line. Leave blank when none.')}>
                    <textarea value={fields.monsterDamageVulnerabilities} onChange={(event) => update('monsterDamageVulnerabilities', event.target.value)} placeholder={copy(locale, '例如：火焰', 'e.g. Fire')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '伤害抗性', 'Damage resistances')} hint={copy(locale, '每行一项，例如“非魔法钝击、穿刺、挥砍”。', 'One per line, e.g. nonmagical bludgeoning, piercing, and slashing.')}>
                    <textarea value={fields.monsterDamageResistances} onChange={(event) => update('monsterDamageResistances', event.target.value)} placeholder={copy(locale, '例如：寒冷\n闪电', 'e.g. Cold\nLightning')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '伤害免疫', 'Damage immunities')} hint={copy(locale, '每行一项。', 'One per line.')}>
                    <textarea value={fields.monsterDamageImmunities} onChange={(event) => update('monsterDamageImmunities', event.target.value)} placeholder={copy(locale, '例如：毒素', 'e.g. Poison')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '状态免疫', 'Condition immunities')} hint={copy(locale, '每行一项。', 'One per line.')}>
                    <textarea value={fields.monsterConditionImmunities} onChange={(event) => update('monsterConditionImmunities', event.target.value)} placeholder={copy(locale, '例如：中毒\n魅惑', 'e.g. Poisoned\nCharmed')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '感官', 'Senses')} hint={copy(locale, '例如“黑暗视觉 60 尺；被动察觉 14”。', 'For example darkvision 60 ft.; passive Perception 14.')}>
                    <textarea value={fields.monsterSenses} onChange={(event) => update('monsterSenses', event.target.value)} placeholder={copy(locale, '黑暗视觉 60 尺；被动察觉 14', 'Darkvision 60 ft.; passive Perception 14')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '语言', 'Languages')} hint={copy(locale, '例如“通用语、深渊语；心灵感应 60 尺”。', 'For example Common, Abyssal; telepathy 60 ft.')}>
                    <textarea value={fields.monsterLanguages} onChange={(event) => update('monsterLanguages', event.target.value)} placeholder={copy(locale, '通用语、深渊语', 'Common, Abyssal')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </div>
              </details>}
              {fields.entryKind === 'species' && <div className="grid gap-2 sm:grid-cols-2">
                <FormField label={copy(locale, '种族特性说明', 'Species trait notes')} hint={copy(locale, '每行一项。会在车卡详情中显示为文字，不会自动产生效果。', 'One per line. Appears as text in the builder and never executes automatically.')}>
                  <textarea value={fields.traits} onChange={(event) => update('traits', event.target.value)} placeholder={copy(locale, '例如：潮汐呼吸\n夜视', 'e.g. Tidal breathing\nDarkvision')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '传承或血统选项', 'Heritage options')} hint={copy(locale, '每行一项。会在选择此种族后作为子种族选项出现。', 'One per line. Appears as a subrace option after this species is selected.')}>
                  <textarea value={fields.heritageOptions} onChange={(event) => update('heritageOptions', event.target.value)} placeholder={copy(locale, '例如：礁石血统\n深海血统', 'e.g. Reef heritage\nDeepwater heritage')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '语言', 'Languages')} hint={copy(locale, '每行一项，例如“通用语”“深渊语”。会作为车卡资料显示。', 'One per line, such as Common or Abyssal. Shown as character-sheet reference.')}>
                  <textarea value={fields.speciesLanguages} onChange={(event) => update('speciesLanguages', event.target.value)} placeholder={copy(locale, '通用语\n深渊语', 'Common\nAbyssal')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '感官与特殊感知', 'Senses')} hint={copy(locale, '例如“黑暗视觉 60 尺；灵魂嗅觉 30 尺”。描述性保存，不自动揭示地图信息。', 'For example Darkvision 60 ft.; Soul Scent 30 ft. Stored descriptively and never reveals map data automatically.')}>
                  <textarea value={fields.speciesSenses} onChange={(event) => update('speciesSenses', event.target.value)} placeholder={copy(locale, '黑暗视觉 60 尺\n灵魂嗅觉 30 尺', 'Darkvision 60 ft.\nSoul scent 30 ft.')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '属性加值或选择说明', 'Ability bonus or choice note')} hint={copy(locale, '例如“魅力 +2、体质 +1；或按 2024 规则自由分配”。当前不自动修改属性。', 'For example Charisma +2, Constitution +1; or assign freely under 2024 rules. It does not modify ability scores automatically yet.')}>
                  <textarea value={fields.speciesAbilityOptions} onChange={(event) => update('speciesAbilityOptions', event.target.value)} placeholder={copy(locale, '魅力 +2，体质 +1', 'Charisma +2, Constitution +1')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
              </div>}
              {fields.entryKind === 'background' && <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField label={copy(locale, '技能熟练项', 'Skill proficiencies')} hint={copy(locale, '每行一项，必须使用现有技能名称；不认识的名称会被忽略。', 'One per line and use existing skill names; unknown names are ignored.')}>
                    <textarea value={fields.backgroundSkills} onChange={(event) => update('backgroundSkills', event.target.value)} placeholder={copy(locale, '例如：洞悉\n调查', 'e.g. Insight\nInvestigation')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '工具熟练项', 'Tool proficiencies')} hint={copy(locale, '每行一项，作为背景资料显示；具体规则由房间决定。', 'One per line. Displayed as background data; the Room decides the actual rules.')}>
                    <textarea value={fields.backgroundTools} onChange={(event) => update('backgroundTools', event.target.value)} placeholder={copy(locale, '例如：草药工具\n制图工具', 'e.g. Herbalism kit\nCartographer tools')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField label={copy(locale, '背景特性名称', 'Background feature name')} hint={copy(locale, '可选的标题，例如“港口人脉”。', 'Optional display title, such as “Harbor contacts”.')}>
                    <input value={fields.featureName} onChange={(event) => update('featureName', event.target.value)} placeholder={copy(locale, '例如：港口人脉', 'e.g. Harbor contacts')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '背景特性说明', 'Background feature description')} hint={copy(locale, '只写叙事或协商说明；不会自动修改资源、检定或权限。', 'Narrative and agreement text only; it cannot modify resources, checks, or permissions automatically.')}>
                    <textarea value={fields.featureDescription} onChange={(event) => update('featureDescription', event.target.value)} placeholder={copy(locale, '可选：说明这个背景特性适合如何在跑团中使用', 'Optional: explain how this feature may be used at the table')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField label={copy(locale, '背景装备与财富', 'Background equipment and wealth')} hint={copy(locale, '写明可选起始物品、工具、资金或替代方案；当前不会直接写入背包。', 'Describe starting items, tools, funds, or alternatives. It does not write directly to inventory.')}>
                    <textarea value={fields.backgroundEquipment} onChange={(event) => update('backgroundEquipment', event.target.value)} placeholder={copy(locale, '例如：制图工具、探险家套组、15 GP', 'e.g. cartographer tools, explorer pack, 15 GP')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '额外语言或沟通方式', 'Additional languages or communication')} hint={copy(locale, '每行一项。仅作为背景资料，不自动授予可执行能力。', 'One per line. Stored as background reference and grants no executable ability automatically.')}>
                    <textarea value={fields.backgroundLanguages} onChange={(event) => update('backgroundLanguages', event.target.value)} placeholder={copy(locale, '例如：矮人语\n盗贼黑话', 'e.g. Dwarvish\nThieves’ Cant')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </div>
              </>}
              {fields.entryKind === 'class' && <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField label={copy(locale, '豁免熟练', 'Saving throw proficiencies')} hint={copy(locale, '每行一项，使用 Str、Dex、Con、Int、Wis 或 Cha。无效名称不会进入车卡。', 'One per line: Str, Dex, Con, Int, Wis, or Cha. Unknown values do not enter the builder.')}>
                    <textarea value={fields.classSavingThrows} onChange={(event) => update('classSavingThrows', event.target.value)} placeholder={'Str\nCon'} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '起始装备说明', 'Starting equipment note')} hint={copy(locale, '给玩家与主持人阅读的起始装备计划；不会直接把物品加入背包。', 'A starting-equipment plan for players and the host; it does not add items directly to inventory.')}>
                    <textarea value={fields.classStartingEquipment} onChange={(event) => update('classStartingEquipment', event.target.value)} placeholder={copy(locale, '例如：长剑或短剑、皮甲、探索者套装', 'e.g. longsword or shortsword, leather armor, explorer pack')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField label={copy(locale, '武器熟练项', 'Weapon proficiencies')} hint={copy(locale, '每行一项，只作为车卡资料显示。', 'One per line; shown as character-sheet reference only.')}>
                    <textarea value={fields.classWeaponProficiencies} onChange={(event) => update('classWeaponProficiencies', event.target.value)} placeholder={copy(locale, '例如：简单武器\n军用近战武器', 'e.g. Simple weapons\nMartial melee weapons')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '护甲熟练项', 'Armor proficiencies')} hint={copy(locale, '每行一项，只作为车卡资料显示。', 'One per line; shown as character-sheet reference only.')}>
                    <textarea value={fields.classArmorProficiencies} onChange={(event) => update('classArmorProficiencies', event.target.value)} placeholder={copy(locale, '例如：轻甲\n盾牌', 'e.g. Light armor\nShields')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField label={copy(locale, '可选技能', 'Skill choices')} hint={copy(locale, '每行一项，列出该职业可以选择的技能。', 'One per line. List skills this class may choose from.')}>
                    <textarea value={fields.classSkillChoices} onChange={(event) => update('classSkillChoices', event.target.value)} placeholder={copy(locale, '奥秘\n洞悉\n调查\n察觉', 'Arcana\nInsight\nInvestigation\nPerception')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '选择技能数量', 'Number of skills chosen')} hint={copy(locale, '填 0 到 6。当前显示为创作资料，车卡选择器尚未自动限制数量。', 'Enter 0 through 6. This is authoring data; the builder does not yet enforce the number automatically.')}>
                    <input value={fields.classSkillChoiceCount} onChange={(event) => update('classSkillChoiceCount', event.target.value)} inputMode="numeric" placeholder="2" disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '工具选择', 'Tool choices')} hint={copy(locale, '每行一项，可记录“任选一种工匠工具”等选择池。', 'One per line; use this for pools such as choose one artisan tool.')}>
                    <textarea value={fields.classToolChoices} onChange={(event) => update('classToolChoices', event.target.value)} placeholder={copy(locale, '任选一种工匠工具\n任选一种乐器或游戏用具', 'Choose one artisan tool\nChoose one instrument or gaming set')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                  <FormField label={copy(locale, '多职业说明', 'Multiclass note')} hint={copy(locale, '前置属性、熟练变化和资源计算等资料说明；不会自动裁定多职业合法性。', 'Record prerequisites, proficiency changes, and resource notes. Multiclass legality is not automated.')}>
                    <textarea value={fields.classMulticlassNote} onChange={(event) => update('classMulticlassNote', event.target.value)} placeholder={copy(locale, '例如：多职业时魂丝只计算赋魂师等级', 'e.g. Soul Thread counts Soulwright levels only when multiclassing')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                  </FormField>
                </div>
                <FormField label={copy(locale, '职业特性进阶', 'Class feature progression')} hint={copy(locale, '每行一项：等级 | 特性名称 | 说明。例如“1 | 战斗风格 | 选择一种战斗风格”。这会保存可读进阶资料，不会自动执行效果。', 'One per line: level | feature name | description. For example: “1 | Fighting Style | Choose a fighting style.” This saves readable progression facts and never executes effects.')}>
                  <textarea value={fields.classFeatureLines} onChange={(event) => update('classFeatureLines', event.target.value)} placeholder={copy(locale, '1 | 港口巡防 | 熟悉码头上的危险\n3 | 潮汐守望 | 在雾中保持警觉', '1 | Harbor patrol | Know the dangers of a dock\n3 | Tidal watch | Stay alert in fog')} disabled={busy} className="min-h-28 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '施法或成长表说明', 'Spellcasting or progression table note')} hint={copy(locale, '可填写戏法、已知法术、法术位、资源或其他 1–20 级成长表。当前保留为结构化资料的补充说明，尚不自动计算。', 'Use this for cantrips, known spells, spell slots, resources, or another level 1-20 table. It is reference data and is not calculated automatically yet.')}>
                  <textarea value={fields.classSpellcastingProgression} onChange={(event) => update('classSpellcastingProgression', event.target.value)} placeholder={copy(locale, '1级：2 戏法、2 已知法术、2 个 1环位\n5级：5 已知法术、4 个 1环位、2 个 2环位', 'Level 1: 2 cantrips, 2 known spells, two level-1 slots\nLevel 5: 5 known spells, four level-1 slots, two level-2 slots')} disabled={busy} className="min-h-28 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
              </>}
              {fields.entryKind === 'subclass' && <FormField label={copy(locale, '子职业特性进阶', 'Subclass feature progression')} hint={copy(locale, '每行一项：等级 | 特性名称 | 说明。未填写等级时会使用上方的解锁等级。', 'One per line: level | feature name | description. A line without a level uses the unlock level above.')}>
                <textarea value={fields.subclassFeatureLines} onChange={(event) => update('subclassFeatureLines', event.target.value)} placeholder={copy(locale, '3 | 潮汐呼应 | 与港湾潮声保持同步\n7 | 深海壁垒 | 获得额外防护', '3 | Tidal resonance | Keep pace with harbor tides\n7 | Deepwater bulwark | Gain added protection')} disabled={busy} className="min-h-28 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
              </FormField>}
              <div className="flex flex-wrap items-center gap-3">
                {versioningPackId && <button type="button" disabled={busy} onClick={() => { setVersioningPackId(null); setDraftEntries([]); setFields(initialFields); setNotice(''); }} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-bold text-[#58180d]">{copy(locale, '改为新建内容', 'Create new content instead')}</button>}
                <button type="button" onClick={addCurrentEntryToDraft} disabled={busy || !fields.entryName.trim()} className="rounded-md border border-[#58180d]/30 bg-white px-3 py-2 text-sm font-bold text-[#58180d] disabled:opacity-40">{copy(locale, '加入待保存内容', 'Add to pending content')}</button>
                <button type="submit" disabled={busy || draftEntries.length === 0} className="rounded-md bg-[#58180d] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? copy(locale, '正在保存…', 'Saving…') : versioningPackId ? copy(locale, `发布新版本（${draftEntries.length}）`, `Publish new version (${draftEntries.length})`) : copy(locale, `保存到我的规则内容（${draftEntries.length}）`, `Save to my rules content (${draftEntries.length})`)}</button>
                {notice && <p className="text-xs leading-5 text-[#2c1810]/75">{notice}</p>}
              </div>
            </form>

            <details className="mt-4 rounded-lg border border-[#58180d]/15 bg-white/70 p-3">
              <summary className="cursor-pointer text-sm font-bold text-[#58180d]">{copy(locale, '导入个人资料包（JSON）', 'Import a personal pack (JSON)')}</summary>
              <p className="mt-2 text-xs leading-5 text-[#2c1810]/65">
                {copy(locale, '先在本地校验并预览条目，再保存为新的个人资料包或新的不可变版本。导入不会覆盖官方资料，也不会自动加入房间。', 'Validate and preview entries locally before saving a new personal pack or immutable version. Imports never overwrite official content or join a Room automatically.')}
              </p>
              <textarea
                value={importText}
                onChange={(event) => { setImportText(event.target.value); setImportDraft(null); setImportError(''); }}
                placeholder={'{\n  "displayName": "我的资料包",\n  "versionLabel": "1.0.0",\n  "entries": [{ "entryKind": "species", "displayName": "自定义种族", "content": {} }]\n}'}
                disabled={busy}
                spellCheck={false}
                className="mt-3 min-h-44 w-full rounded-md border border-[#58180d]/20 bg-[#17130f] px-3 py-2 font-mono text-xs leading-5 text-[#fff8e6] disabled:opacity-50"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" onClick={previewImport} disabled={busy || !importText.trim()} className="rounded-md border border-[#58180d]/25 bg-white px-3 py-2 text-sm font-bold text-[#58180d] disabled:opacity-40">{copy(locale, '校验并预览', 'Validate and preview')}</button>
                {importDraft && <button type="button" onClick={() => void publishImport()} disabled={busy} className="rounded-md bg-[#58180d] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? copy(locale, '正在保存…', 'Saving…') : versioningPackId ? copy(locale, '导入为新版本', 'Import as new version') : copy(locale, '导入到我的资料库', 'Import to my library')}</button>}
                {importError && <p className="text-xs font-semibold text-[#a52a2a]">{importError}</p>}
              </div>
              {importDraft && <div className="mt-3 rounded-md border border-[#2f7f68]/25 bg-[#f1fbf7] p-3 text-xs text-[#184f42]">
                <p className="font-bold">{copy(locale, '导入预览', 'Import preview')} · {versioningPackId ? fields.packName : importDraft.displayName} · {fields.versionLabel.trim() || importDraft.versionLabel || '1.0.0'}</p>
                <p className="mt-1">{copy(locale, `共 ${importDraft.entries.length} 个条目：`, `${importDraft.entries.length} entries:`)} {importDraft.entries.slice(0, 5).map((entry) => `${entry.displayName} (${entry.entryKind})`).join('、')}{importDraft.entries.length > 5 ? '…' : ''}</p>
              </div>}
            </details>
          </section>
        </div>
      )}
    </>
  );
}
