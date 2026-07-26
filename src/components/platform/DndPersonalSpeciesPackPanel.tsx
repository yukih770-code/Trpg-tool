import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import type { Locale } from '../../i18n';
import { ApiClientError } from '../../lib/api/apiTypes';
import {
  personalCompendiumPackApiClient,
  type PersonalCompendiumPack,
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

function copy(locale: Locale, zh: string, en: string): string {
  return locale === 'en' ? en : zh;
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

  const beginNewVersion = (pack: PersonalCompendiumPack) => {
    setVersioningPackId(pack.packId);
    setFields((previous) => ({ ...previous, packName: pack.displayName, versionLabel: '1.1.0' }));
    setNotice(copy(locale, `正在为“${pack.displayName}”创建新版本；已有版本不会被改写。`, `Creating a new version of ${pack.displayName}; existing versions will not change.`));
  };

  const entryFromFields = () => {
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

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!fields.packName.trim() || !fields.entryName.trim() || busy) return;
    setBusy(true);
    setNotice('');
    try {
      const draft: Omit<PublishPersonalCompendiumPackInput, 'displayName'> = {
        versionLabel: fields.versionLabel.trim() || '1.0.0',
        metadata: { gameSystemId: 'dnd5e-2024', authoringKind: `dnd-personal-${fields.entryKind}-v0` },
        entries: [entryFromFields()],
      };
      if (versioningPackId) await personalCompendiumPackApiClient.publishVersion(versioningPackId, draft);
      else await personalCompendiumPackApiClient.publish({ ...draft, displayName: fields.packName.trim() });
      setFields(initialFields);
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
                    <button type="button" disabled={busy} onClick={() => beginNewVersion(pack)} className="rounded-md border border-[#a35b11]/25 bg-[#fff1c7]/55 px-2.5 py-1.5 text-xs font-bold text-[#7a4610] disabled:opacity-40">
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
                <h3 className="text-sm font-bold text-[#58180d]">{versioningPackId ? copy(locale, '创建新的资料版本', 'Create a new content version') : copy(locale, '创建个人资料条目', 'Create a personal content entry')}</h3>
                <p className="mt-1 text-xs leading-5 text-[#2c1810]/65">{versioningPackId ? copy(locale, '正在保存为新版本，已被房间引用的旧版本不会被改写。', 'This saves a new version; an older version already referenced by a Room will not change.') : copy(locale, '这是个人资料条目编辑，不生成可执行规则效果，也不会修改已有角色。', 'This is personal content authoring. It creates no executable rules and does not alter existing characters.')}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={fields.packName} onChange={(event) => update('packName', event.target.value)} placeholder={copy(locale, '资料包名称，例如：港湾自定义选项', 'Pack name, e.g. Harbor options')} disabled={busy || !!versioningPackId} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                <select value={fields.entryKind} onChange={(event) => update('entryKind', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50">
                  <option value="species">{copy(locale, '种族', 'Species')}</option>
                  <option value="background">{copy(locale, '背景', 'Background')}</option>
                  <option value="feat">{copy(locale, '专长', 'Feat')}</option>
                  <option value="spell">{copy(locale, '法术', 'Spell')}</option>
                </select>
                <input value={fields.entryName} onChange={(event) => update('entryName', event.target.value)} placeholder={copy(locale, '条目名称', 'Entry name')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                <input value={fields.versionLabel} onChange={(event) => update('versionLabel', event.target.value)} placeholder={copy(locale, '版本，例如：1.1.0', 'Version, e.g. 1.1.0')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                {fields.entryKind === 'species' && <>
                  <input value={fields.size} onChange={(event) => update('size', event.target.value)} placeholder={copy(locale, '体型，例如：中型', 'Size, e.g. Medium')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                  <input value={fields.speed} onChange={(event) => update('speed', event.target.value)} inputMode="numeric" placeholder={copy(locale, '速度（尺）', 'Speed (ft)')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                </>}
                {fields.entryKind === 'feat' && <>
                  <select value={fields.featCategory} onChange={(event) => update('featCategory', event.target.value)} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50">
                    <option value="Origin">{copy(locale, '起源专长（可在车卡选择）', 'Origin feat (selectable in builder)')}</option>
                    <option value="General">{copy(locale, '通用专长（仅保留资料）', 'General feat (content only)')}</option>
                  </select>
                  <input value={fields.prerequisite} onChange={(event) => update('prerequisite', event.target.value)} placeholder={copy(locale, '前置条件说明（可选）', 'Prerequisite note (optional)')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                </>}
                {fields.entryKind === 'spell' && <>
                  <input value={fields.spellLevel} onChange={(event) => update('spellLevel', event.target.value)} inputMode="numeric" placeholder={copy(locale, '法术环阶（0-9）', 'Spell level (0-9)')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                  <input value={fields.spellSchool} onChange={(event) => update('spellSchool', event.target.value)} placeholder={copy(locale, '学派或类型', 'School or type')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                  <input value={fields.spellCastTime} onChange={(event) => update('spellCastTime', event.target.value)} placeholder={copy(locale, '施法时间', 'Casting time')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                  <input value={fields.spellRange} onChange={(event) => update('spellRange', event.target.value)} placeholder={copy(locale, '距离', 'Range')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                  <input value={fields.spellDuration} onChange={(event) => update('spellDuration', event.target.value)} placeholder={copy(locale, '持续时间', 'Duration')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                  <input value={fields.spellComponents} onChange={(event) => update('spellComponents', event.target.value)} placeholder={copy(locale, '构材，例如：V, S, M', 'Components, e.g. V, S, M')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                </>}
              </div>
              <textarea value={fields.summary} onChange={(event) => update('summary', event.target.value)} placeholder={copy(locale, '简短说明（可选）', 'Short description (optional)')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
              {fields.entryKind === 'species' && <div className="grid gap-2 sm:grid-cols-2">
                <textarea value={fields.traits} onChange={(event) => update('traits', event.target.value)} placeholder={copy(locale, '特性，每行一项（可选）', 'Traits, one per line (optional)')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                <textarea value={fields.heritageOptions} onChange={(event) => update('heritageOptions', event.target.value)} placeholder={copy(locale, '传承或血统选项，每行一项（可选）', 'Heritage options, one per line (optional)')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
              </div>}
              {fields.entryKind === 'background' && <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea value={fields.backgroundSkills} onChange={(event) => update('backgroundSkills', event.target.value)} placeholder={copy(locale, '技能熟练项，每行一项（只接受现有技能名称）', 'Skill proficiencies, one per line (known skill names only)')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                  <textarea value={fields.backgroundTools} onChange={(event) => update('backgroundTools', event.target.value)} placeholder={copy(locale, '工具熟练项，每行一项（可选）', 'Tool proficiencies, one per line (optional)')} disabled={busy} className="min-h-24 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={fields.featureName} onChange={(event) => update('featureName', event.target.value)} placeholder={copy(locale, '背景特性名称（可选）', 'Background feature name (optional)')} disabled={busy} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                  <textarea value={fields.featureDescription} onChange={(event) => update('featureDescription', event.target.value)} placeholder={copy(locale, '背景特性说明（文字说明，不自动执行）', 'Feature description (text only, not automated)')} disabled={busy} className="min-h-20 rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm disabled:opacity-50" />
                </div>
              </>}
              <div className="flex flex-wrap items-center gap-3">
                {versioningPackId && <button type="button" disabled={busy} onClick={() => { setVersioningPackId(null); setFields(initialFields); setNotice(''); }} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-bold text-[#58180d]">{copy(locale, '改为新建资料包', 'Create a new pack instead')}</button>}
                <button type="submit" disabled={busy || !fields.packName.trim() || !fields.entryName.trim()} className="rounded-md bg-[#58180d] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? copy(locale, '正在保存…', 'Saving…') : versioningPackId ? copy(locale, '保存为新版本', 'Save as new version') : copy(locale, '保存到我的资料库', 'Save to my library')}</button>
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
