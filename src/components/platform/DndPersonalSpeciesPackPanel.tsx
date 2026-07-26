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

type Props = {
  locale: Locale;
  presentation?: 'card' | 'workbench';
  onCloseWorkbench?: () => void;
};
type Fields = {
  packName: string;
  versionLabel: string;
  entryKind: 'species' | 'background' | 'feat' | 'spell';
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
};

const initialFields: Fields = {
  packName: '', versionLabel: '1.0.0', entryKind: 'species', entryName: '', size: '中型', speed: '30', summary: '', traits: '', heritageOptions: '',
  backgroundSkills: '', backgroundTools: '', featureName: '', featureDescription: '', featCategory: 'Origin', prerequisite: '',
  spellLevel: '0', spellSchool: '自定义', spellCastTime: '1 动作', spellRange: '自身', spellDuration: '立即', spellComponents: 'V',
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
  if (entryKind === 'feat') return {
    title: copy(locale, '专长：选择资料与前置说明', 'Feat: selection data and prerequisite note'),
    body: copy(locale, '起源专长可在车卡中选择；通用专长当前只保存说明，所有效果仍须由房间协商与审核。', 'Origin feats can be selected in the builder. General feats are informational for now; all effects remain subject to Room review.'),
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
          name,
          summary: fields.summary.trim() || undefined,
          skillProficiencies: listFromLines(fields.backgroundSkills),
          toolProficiencies: listFromLines(fields.backgroundTools),
          feature: {
            name: fields.featureName.trim() || '自定义背景特性',
            desc: fields.featureDescription.trim() || '具体可用性以房间审核结果为准。',
          },
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customBackground' },
      };
    }
    if (fields.entryKind === 'feat') {
      return {
        entryKind: 'feat' as const,
        displayName: name,
        content: {
          schema: 'dnd-personal-feat-v0',
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
          schema: 'dnd-personal-spell-v0',
          name,
          level: Math.max(0, Math.min(9, Number(fields.spellLevel) || 0)),
          school: fields.spellSchool.trim() || '自定义',
          castTime: fields.spellCastTime.trim() || '1 动作',
          range: fields.spellRange.trim() || '自身',
          duration: fields.spellDuration.trim() || '立即',
          components: fields.spellComponents.trim().toUpperCase() || 'V',
          summary: fields.summary.trim() || undefined,
        },
        metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customSpell' },
      };
    }
    return {
      entryKind: 'species' as const,
      displayName: name,
      content: {
        schema: 'dnd-personal-species-v0',
        name,
        size: fields.size.trim() || undefined,
        speedFeet: Number(fields.speed) || undefined,
        summary: fields.summary.trim() || undefined,
        traits: traitList,
        heritageOptions: heritageList,
      },
      metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customSpecies' },
    };
  };

  const addCurrentEntryToDraft = () => {
    if (!fields.packName.trim() || !fields.entryName.trim() || busy) return;
    const entry = entryFromFields();
    setDraftEntries((previous) => {
      const existingIndex = previous.findIndex((candidate) => candidate.entryKind === entry.entryKind && candidate.displayName === entry.displayName);
      if (existingIndex < 0) return [...previous, entry].slice(0, 50);
      return previous.map((candidate, index) => index === existingIndex ? entry : candidate);
    });
    setFields((previous) => blankEntryFields(previous));
    setNotice(copy(locale, `已将“${entry.displayName}”加入资料包草稿；同名同类型条目会被当前内容替换。`, `Added ${entry.displayName} to the pack draft; an entry with the same name and type is replaced by the current content.`));
  };

  const removeDraftEntry = (index: number) => {
    setDraftEntries((previous) => previous.filter((_, entryIndex) => entryIndex !== index));
  };

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!fields.packName.trim() || draftEntries.length === 0 || busy) return;
    setBusy(true);
    setNotice('');
    try {
      const draft: Omit<PublishPersonalCompendiumPackInput, 'displayName'> = {
        versionLabel: fields.versionLabel.trim() || '1.0.0',
        metadata: { gameSystemId: 'dnd5e-2024', authoringKind: 'dnd-personal-pack-draft-v0' },
        entries: draftEntries,
      };
      if (versioningPackId) await personalCompendiumPackApiClient.publishVersion(versioningPackId, draft);
      else await personalCompendiumPackApiClient.publish({ ...draft, displayName: fields.packName.trim() });
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
        <h2 className="mt-1 text-lg font-bold text-[#58180d]">{copy(locale, '我的自定义资料', 'My custom content')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#2c1810]/65">
          {copy(locale, '创建自己的种族、背景、专长与法术。资料默认只属于你；加入房间时再由主持人审核。', 'Create your own species, backgrounds, feats, and spells. Content is private to you until a Room host reviews it.')}
        </p>
      </button>}

      {open && (
        <div className={presentation === 'card' ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#17130f]/45 p-4' : ''} role={presentation === 'card' ? 'presentation' : undefined}>
          <section role={presentation === 'card' ? 'dialog' : undefined} aria-modal={presentation === 'card' ? true : undefined} aria-label={copy(locale, '我的自定义资料', 'My custom content')} className={presentation === 'card' ? 'max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl border border-[#58180d]/30 bg-[#fffaf0] p-5 shadow-2xl' : 'w-full rounded-xl border border-[#58180d]/25 bg-[#fffaf0] p-5 shadow-sm'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#a35b11]">Personal D&D content</div>
                <h2 className="mt-1 text-xl font-black text-[#58180d]">{copy(locale, '我的自定义资料', 'My custom content')}</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-[#2c1810]/70">
                  {copy(locale, '个人资料不会改写官方资料库，也不会自动加入服务器或房间。房间准入与可用内容由主持人后续审核。', 'Personal content never changes the official library and is not automatically added to a Server or Room. Room admission and allowed content remain host-reviewed.')}
                </p>
              </div>
              {presentation === 'card' && <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-xs font-bold text-[#58180d]">{copy(locale, '关闭', 'Close')}</button>}
              {presentation === 'workbench' && onCloseWorkbench && <button type="button" onClick={onCloseWorkbench} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-xs font-bold text-[#58180d]">{copy(locale, '返回车卡', 'Return to builder')}</button>}
            </div>

            <div className="mt-4 rounded-lg border border-[#58180d]/15 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#58180d]">{copy(locale, '已保存的资料包', 'Saved packs')}</h3>
                <button type="button" onClick={() => void refresh()} disabled={loading || busy} className="rounded-md border border-[#58180d]/20 bg-white px-2.5 py-1.5 text-xs font-bold text-[#58180d] disabled:opacity-40">{copy(locale, '刷新', 'Refresh')}</button>
              </div>
              {loading && <p className="mt-2 text-xs text-[#2c1810]/65">{copy(locale, '正在加载…', 'Loading…')}</p>}
              {!loading && packs.length === 0 && !notice && <p className="mt-2 text-xs text-[#2c1810]/65">{copy(locale, '尚未创建个人资料包。', 'No personal packs yet.')}</p>}
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
                <h3 className="text-sm font-bold text-[#58180d]">{versioningPackId ? copy(locale, '编辑新的资料版本草稿', 'Edit a new content-version draft') : copy(locale, '编辑个人资料包草稿', 'Edit a personal content-pack draft')}</h3>
                <p className="mt-1 text-xs leading-5 text-[#2c1810]/65">{versioningPackId ? copy(locale, '草稿已从当前版本复制而来。增删条目后发布，新版本会完整替代此资料包在车卡中的可选内容；旧版本不会被改写。', 'The draft starts as a copy of the current version. Add or remove entries, then publish; the new version becomes the pack content available to the builder, while older versions stay unchanged.') : copy(locale, '先把多个条目加入草稿，再一次保存为个人资料包。它不会生成可执行规则效果，也不会修改已有角色。', 'Add several entries to a draft, then save it once as a personal pack. It creates no executable rules and does not alter existing characters.')}</p>
              </div>
              <div className="rounded-md border border-[#a35b11]/22 bg-[#fff1c7]/40 p-3 text-xs leading-5 text-[#58180d]/80">
                <p className="font-bold text-[#58180d]">{entryKindGuidance(locale, fields.entryKind).title}</p>
                <p className="mt-1">{entryKindGuidance(locale, fields.entryKind).body}</p>
              </div>
              <div className="rounded-md border border-[#2f7f68]/25 bg-[#f1fbf7] p-3 text-xs text-[#184f42]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{copy(locale, `资料包草稿 · ${draftEntries.length} 个条目`, `Pack draft · ${draftEntries.length} entries`)}</p>
                  {draftEntries.length > 0 && <button type="button" onClick={() => setDraftEntries([])} disabled={busy} className="rounded border border-[#2f7f68]/25 bg-white px-2 py-1 text-[11px] font-bold text-[#184f42] disabled:opacity-40">{copy(locale, '清空草稿', 'Clear draft')}</button>}
                </div>
                {draftEntries.length === 0
                  ? <p className="mt-1 leading-5">{copy(locale, '填写下方条目后，选择“加入草稿”。发布资料包前可以继续添加不同类型的内容。', 'Fill in an entry below and choose “Add to draft.” You can keep adding different content types before publishing the pack.')}</p>
                  : <ul className="mt-2 space-y-1.5">
                    {draftEntries.map((entry, index) => <li key={`${entry.entryKind}-${entry.displayName}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#2f7f68]/15 bg-white/70 px-2 py-1.5">
                      <span><span className="font-semibold">{entry.displayName}</span> <span className="ml-1 rounded-full bg-[#2f7f68]/10 px-1.5 py-0.5 text-[10px] font-bold">{entry.entryKind}</span></span>
                      <button type="button" onClick={() => removeDraftEntry(index)} disabled={busy} className="text-[11px] font-bold text-[#a52a2a] disabled:opacity-40">{copy(locale, '移除', 'Remove')}</button>
                    </li>)}
                  </ul>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <FormField label={copy(locale, '资料包名称', 'Pack name')} required hint={versioningPackId ? copy(locale, '当前正在为这个资料包新增版本，名称不能修改。', 'You are adding a version to this pack; its name cannot change.') : copy(locale, '用于把相关的自定义资料归在一起，例如“港湾自定义选项”。', 'Groups related personal content, for example “Harbor options”.')}>
                  <input value={fields.packName} onChange={(event) => update('packName', event.target.value)} placeholder={copy(locale, '例如：港湾自定义选项', 'e.g. Harbor options')} disabled={busy || !!versioningPackId} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '资料类型', 'Content type')} required hint={copy(locale, '决定车卡会在哪个选择区显示这份资料。', 'Controls which builder selector can display this content.')}>
                  <select value={fields.entryKind} onChange={(event) => update('entryKind', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50">
                    <option value="species">{copy(locale, '种族', 'Species')}</option>
                    <option value="background">{copy(locale, '背景', 'Background')}</option>
                    <option value="feat">{copy(locale, '专长', 'Feat')}</option>
                    <option value="spell">{copy(locale, '法术', 'Spell')}</option>
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
              </div>
              <FormField label={copy(locale, '简短说明', 'Short summary')} hint={copy(locale, '给车卡与主持人快速阅读的简介。不要填写自动结算、伤害公式或隐藏权限。', 'A quick description for the builder and host. Do not put automation, damage formulas, or hidden permissions here.')}>
                <textarea value={fields.summary} onChange={(event) => update('summary', event.target.value)} placeholder={copy(locale, '可选：用一两句话说明主题与玩法感受', 'Optional: summarize the theme in one or two sentences')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
              </FormField>
              {fields.entryKind === 'species' && <div className="grid gap-2 sm:grid-cols-2">
                <FormField label={copy(locale, '种族特性说明', 'Species trait notes')} hint={copy(locale, '每行一项。会在车卡详情中显示为文字，不会自动产生效果。', 'One per line. Appears as text in the builder and never executes automatically.')}>
                  <textarea value={fields.traits} onChange={(event) => update('traits', event.target.value)} placeholder={copy(locale, '例如：潮汐呼吸\n夜视', 'e.g. Tidal breathing\nDarkvision')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
                </FormField>
                <FormField label={copy(locale, '传承或血统选项', 'Heritage options')} hint={copy(locale, '每行一项。会在选择此种族后作为子种族选项出现。', 'One per line. Appears as a subrace option after this species is selected.')}>
                  <textarea value={fields.heritageOptions} onChange={(event) => update('heritageOptions', event.target.value)} placeholder={copy(locale, '例如：礁石血统\n深海血统', 'e.g. Reef heritage\nDeepwater heritage')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-normal disabled:opacity-50" />
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
              </>}
              <div className="flex flex-wrap items-center gap-3">
                {versioningPackId && <button type="button" disabled={busy} onClick={() => { setVersioningPackId(null); setDraftEntries([]); setFields(initialFields); setNotice(''); }} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-bold text-[#58180d]">{copy(locale, '改为新建资料包', 'Create a new pack instead')}</button>}
                <button type="button" onClick={addCurrentEntryToDraft} disabled={busy || !fields.packName.trim() || !fields.entryName.trim()} className="rounded-md border border-[#58180d]/30 bg-white px-3 py-2 text-sm font-bold text-[#58180d] disabled:opacity-40">{copy(locale, '加入资料包草稿', 'Add to pack draft')}</button>
                <button type="submit" disabled={busy || !fields.packName.trim() || draftEntries.length === 0} className="rounded-md bg-[#58180d] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? copy(locale, '正在保存…', 'Saving…') : versioningPackId ? copy(locale, `发布新版本（${draftEntries.length}）`, `Publish new version (${draftEntries.length})`) : copy(locale, `保存资料包（${draftEntries.length}）`, `Save pack (${draftEntries.length})`)}</button>
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
