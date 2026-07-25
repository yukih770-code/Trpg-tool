import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import type { Locale } from '../../i18n';
import { ApiClientError } from '../../lib/api/apiTypes';
import {
  privateCompendiumPackApiClient,
  type PrivateCompendiumPack,
} from '../../lib/api/privateCompendiumPackApiClient';

type Props = {
  locale: Locale;
  worldServerId: string;
  canManage: boolean;
  dndEnabled: boolean;
};

type Fields = {
  packName: string;
  speciesName: string;
  size: string;
  speed: string;
  summary: string;
  traits: string;
  heritageOptions: string;
};

const initialFields: Fields = {
  packName: '', speciesName: '', size: '中型', speed: '30', summary: '', traits: '', heritageOptions: '',
};

function copy(locale: Locale, zh: string, en: string): string {
  return locale === 'en' ? en : zh;
}

function listFromLines(value: string): string[] {
  return value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 12);
}

export function DndPrivateSpeciesPackEditorPanel({ locale, worldServerId, canManage, dndEnabled }: Props) {
  const [packs, setPacks] = useState<PrivateCompendiumPack[]>([]);
  const [fields, setFields] = useState<Fields>(initialFields);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPacks(await privateCompendiumPackApiClient.list(worldServerId));
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason : new ApiClientError('invalid_response', 'Private compendium packs are unavailable.'));
    } finally {
      setLoading(false);
    }
  }, [worldServerId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const traitList = useMemo(() => listFromLines(fields.traits), [fields.traits]);
  const heritageList = useMemo(() => listFromLines(fields.heritageOptions), [fields.heritageOptions]);
  const update = (key: keyof Fields, value: string) => setFields((previous) => ({ ...previous, [key]: value }));

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage || !dndEnabled || !fields.packName.trim() || !fields.speciesName.trim()) return;
    setBusy(true);
    setNotice('');
    try {
      await privateCompendiumPackApiClient.publish(worldServerId, {
        displayName: fields.packName.trim(),
        versionLabel: '1.0.0',
        metadata: { gameSystemId: 'dnd5e-2024', authoringKind: 'dnd-private-species-v0' },
        entries: [{
          entryKind: 'species',
          displayName: fields.speciesName.trim(),
          content: {
            schema: 'dnd-private-species-v0',
            name: fields.speciesName.trim(),
            size: fields.size.trim() || undefined,
            speedFeet: Number(fields.speed) || undefined,
            summary: fields.summary.trim() || undefined,
            traits: traitList,
            heritageOptions: heritageList,
          },
          metadata: { gameSystemId: 'dnd5e-2024', entryRole: 'customSpecies' },
        }],
      });
      setFields(initialFields);
      setNotice(copy(locale, '已发布到此服务器的私有资料包。角色构建器接入将在后续版本完成。', 'Published to this server private pack. Creator integration comes in a later slice.'));
      await refresh();
    } catch (reason) {
      setNotice(reason instanceof ApiClientError
        ? reason.message
        : copy(locale, '发布失败，请稍后重试。', 'Publishing failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#2f7f68]/20 bg-[#f1fbf7] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#2f7f68]">D&D private content</div>
          <h3 className="mt-1 text-lg font-black">{copy(locale, '自定义种族资料包', 'Custom species packs')}</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#51483d]">
            {copy(locale, '创建的内容只属于当前服务器，不会改写系统资料库或公开给其他服务器。', 'Content belongs only to this server and never modifies the system library or other servers.')}
          </p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading || busy} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">
          {copy(locale, '刷新', 'Refresh')}
        </button>
      </div>

      {!dndEnabled && <p className="mt-3 rounded-lg border border-[#b8801b]/25 bg-[#fff8e6] px-3 py-2 text-xs leading-5 text-[#51483d]">{copy(locale, '请先在“游戏系统”中启用 DND 5e 2024，才能发布 D&D 种族资料。', 'Enable DND 5e 2024 in Game Systems before publishing D&D species content.')}</p>}
      {!canManage && <p className="mt-3 rounded-lg border border-[#2f2a22]/12 bg-white px-3 py-2 text-xs text-[#51483d]">{copy(locale, '仅服主或管理员可以发布服务器私有资料包。', 'Only the owner or an administrator can publish server-private packs.')}</p>}

      <div className="mt-4 rounded-lg border border-[#2f2a22]/10 bg-white p-3">
        <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold">{copy(locale, '已发布的私有资料包', 'Published private packs')}</h4><span className="text-xs text-[#51483d]">{packs.length}</span></div>
        {loading && <p className="mt-2 text-xs text-[#51483d]">{copy(locale, '正在加载…', 'Loading…')}</p>}
        {error && <p className="mt-2 text-xs text-[#8b3a2f]">{copy(locale, '资料包暂时无法加载。', 'Private packs are unavailable right now.')}</p>}
        {!loading && !error && packs.length === 0 && <p className="mt-2 text-xs text-[#51483d]">{copy(locale, '尚未发布私有资料包。', 'No private pack has been published yet.')}</p>}
        {!loading && !error && packs.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{packs.map((pack) => <span key={pack.packId} className="rounded-full bg-[#f1fbf7] px-2.5 py-1 text-xs font-semibold text-[#2f7f68]">{pack.displayName}</span>)}</div>}
      </div>

      <form onSubmit={(event) => void publish(event)} className="mt-4 grid gap-3 rounded-lg border border-dashed border-[#2f7f68]/30 bg-white/70 p-3">
        <div><h4 className="text-sm font-bold">{copy(locale, '创建自定义种族', 'Create a custom species')}</h4><p className="mt-1 text-xs leading-5 text-[#51483d]">{copy(locale, '这是资料条目编辑，不会自动生成规则效果，也不会立即改动已有角色。', 'This edits a content entry; it does not generate executable rules or alter existing characters.')}</p></div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={fields.packName} onChange={(event) => update('packName', event.target.value)} placeholder={copy(locale, '资料包名称，例如：港湾自定义选项', 'Pack name, e.g. Harbor options')} disabled={!canManage || !dndEnabled || busy} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50" />
          <input value={fields.speciesName} onChange={(event) => update('speciesName', event.target.value)} placeholder={copy(locale, '种族名称', 'Species name')} disabled={!canManage || !dndEnabled || busy} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50" />
          <input value={fields.size} onChange={(event) => update('size', event.target.value)} placeholder={copy(locale, '体型，例如：中型', 'Size, e.g. Medium')} disabled={!canManage || !dndEnabled || busy} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50" />
          <input value={fields.speed} onChange={(event) => update('speed', event.target.value)} inputMode="numeric" placeholder={copy(locale, '速度（尺）', 'Speed (ft)')} disabled={!canManage || !dndEnabled || busy} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50" />
        </div>
        <textarea value={fields.summary} onChange={(event) => update('summary', event.target.value)} placeholder={copy(locale, '简短背景或设计说明（可选）', 'Short background or design note (optional)')} disabled={!canManage || !dndEnabled || busy} className="min-h-20 rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50" />
        <div className="grid gap-2 sm:grid-cols-2">
          <textarea value={fields.traits} onChange={(event) => update('traits', event.target.value)} placeholder={copy(locale, '特性，每行一项（可选）', 'Traits, one per line (optional)')} disabled={!canManage || !dndEnabled || busy} className="min-h-24 rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50" />
          <textarea value={fields.heritageOptions} onChange={(event) => update('heritageOptions', event.target.value)} placeholder={copy(locale, '传承或血统选项，每行一项（可选）', 'Heritage options, one per line (optional)')} disabled={!canManage || !dndEnabled || busy} className="min-h-24 rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm disabled:opacity-50" />
        </div>
        <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={!canManage || !dndEnabled || busy || !fields.packName.trim() || !fields.speciesName.trim()} className="rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{busy ? copy(locale, '正在发布…', 'Publishing…') : copy(locale, '发布私有资料包', 'Publish private pack')}</button>{notice && <p className="text-xs text-[#51483d]">{notice}</p>}</div>
      </form>
    </section>
  );
}
