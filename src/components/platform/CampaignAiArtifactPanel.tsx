import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../../i18n';
import { ApiClientError } from '../../lib/api/apiTypes';
import { campaignArtifactAssistantApiClient } from '../../lib/api/campaignArtifactAssistantApiClient';
import type { AiModelGatewayStatus } from '../../lib/ai/dndCharacterAssistantTypes';
import type { CampaignArtifactSourceFamily, CampaignArtifactSuggestionResult, CampaignArtifactTask, SavedCampaignArtifact } from '../../lib/ai/campaignArtifactAssistantTypes';

type Props = { locale: Locale; worldServerId: string; campaignId: string; canManage: boolean };

const SOURCE_FAMILIES: CampaignArtifactSourceFamily[] = ['campaign_summary', 'actor_summaries', 'room_summaries', 'prior_artifacts'];

function copy(locale: Locale) {
  const zh = locale.startsWith('zh');
  return zh ? {
    title: 'AI 备团与回顾', note: '按你本次选择的战役摘要生成带来源草稿。AI 不会读取角色卡全文、房间口令、地图或跑团日志，也不会自动修改战役。',
    private: '成果仅你可见', model: '本地模型', unavailable: '当前 AI 路由不可用，请前往设置检查本地模型。',
    preparation_brief: '备团简报', campaign_recap: '战役回顾', focus: '关注点（可选）', focusPlaceholder: '例如：下次开场、尚未收束的线索、需要准备的 NPC…',
    campaign_summary: '战役标题与简介', actor_summaries: '角色名称与状态', room_summaries: '房间状态摘要', prior_artifacts: '我此前保存的 AI 成果',
    generate: '生成带来源草稿', generating: '正在整理…', confirm: '确认并保存', confirming: '正在保存…', discard: '放弃此草稿', sources: '本次来源', uncertainties: '不确定项', next: '建议下一步',
    history: '已保存成果', empty: '还没有保存的成果。', archived: '已归档', archive: '归档', restore: '恢复', refresh: '刷新', showArchived: '显示已归档',
    stale: '来源可能已变化，请重新生成后再保存。', retry: '请求失败，请稍后重试。', expires: '草稿有时效；保存前会再次核对来源。',
  } : {
    title: 'AI prep & recap', note: 'Create a cited draft from the campaign summaries you select. AI never reads full sheets, room codes, maps, or runtime logs and never changes the campaign automatically.',
    private: 'Artifacts are visible only to you', model: 'Local model', unavailable: 'The selected AI route is unavailable. Check your local model in Settings.',
    preparation_brief: 'Prep brief', campaign_recap: 'Campaign recap', focus: 'Focus (optional)', focusPlaceholder: 'Opening beat, unresolved threads, NPCs to prepare…',
    campaign_summary: 'Campaign title and description', actor_summaries: 'Actor names and statuses', room_summaries: 'Room status summaries', prior_artifacts: 'My previously saved AI artifacts',
    generate: 'Generate cited draft', generating: 'Preparing…', confirm: 'Confirm and save', confirming: 'Saving…', discard: 'Discard draft', sources: 'Sources', uncertainties: 'Uncertainties', next: 'Suggested next steps',
    history: 'Saved artifacts', empty: 'No saved artifacts yet.', archived: 'Archived', archive: 'Archive', restore: 'Restore', refresh: 'Refresh', showArchived: 'Show archived',
    stale: 'Sources may have changed. Generate a fresh draft before saving.', retry: 'Request failed. Try again.', expires: 'Drafts expire; sources are checked again before saving.',
  };
}

function errorText(error: unknown, labels: ReturnType<typeof copy>): string {
  if (error instanceof ApiClientError && error.statusCode === 409) return labels.stale;
  return error instanceof ApiClientError ? error.message : labels.retry;
}

function ArtifactBody({ artifact, labels }: { artifact: SavedCampaignArtifact; labels: ReturnType<typeof copy> }) {
  const byId = useMemo(() => new Map(artifact.sources.map((source) => [source.sourceId, source])), [artifact.sources]);
  return <div className="mt-3 space-y-3 text-sm">
    <p className="leading-6 text-[#51483d]">{artifact.suggestion.summary}</p>
    {artifact.suggestion.sections.map((section, index) => <section key={`${section.heading}-${index}`} className="rounded-lg bg-white/65 p-3">
      <h5 className="font-bold text-[#211c17]">{section.heading}</h5><p className="mt-1 whitespace-pre-wrap leading-6 text-[#40382f]">{section.body}</p>
      <div className="mt-2 flex flex-wrap gap-1">{section.sourceIds.map((id) => <span key={id} title={byId.get(id)?.excerpt} className="rounded-full bg-[#e8dfcf] px-2 py-1 text-[10px] text-[#51483d]">{byId.get(id)?.title ?? id}</span>)}</div>
    </section>)}
    {artifact.suggestion.uncertainties.length > 0 && <div><h5 className="text-xs font-bold uppercase tracking-wide text-[#6c604f]">{labels.uncertainties}</h5><ul className="mt-1 list-disc space-y-1 pl-5">{artifact.suggestion.uncertainties.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    {artifact.suggestion.suggestedNextSteps.length > 0 && <div><h5 className="text-xs font-bold uppercase tracking-wide text-[#6c604f]">{labels.next}</h5><ul className="mt-1 list-disc space-y-1 pl-5">{artifact.suggestion.suggestedNextSteps.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    <details className="rounded-lg border border-[#2f2a22]/10 bg-white/50 p-3"><summary className="cursor-pointer text-xs font-bold">{labels.sources} · {artifact.sources.length}</summary><div className="mt-2 space-y-2">{artifact.sources.map((source) => <div key={source.sourceId}><p className="text-xs font-bold">{source.title}</p><p className="mt-0.5 whitespace-pre-wrap text-xs leading-5 text-[#6c604f]">{source.excerpt}</p></div>)}</div></details>
  </div>;
}

export function CampaignAiArtifactPanel({ locale, worldServerId, campaignId, canManage }: Props) {
  const labels = useMemo(() => copy(locale), [locale]);
  const [status, setStatus] = useState<AiModelGatewayStatus | null>(null);
  const [artifacts, setArtifacts] = useState<SavedCampaignArtifact[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [task, setTask] = useState<CampaignArtifactTask>('preparation_brief');
  const [focus, setFocus] = useState('');
  const [families, setFamilies] = useState<CampaignArtifactSourceFamily[]>(['campaign_summary', 'actor_summaries', 'room_summaries']);
  const [draft, setDraft] = useState<CampaignArtifactSuggestionResult | null>(null);
  const [busy, setBusy] = useState<'load' | 'generate' | 'confirm' | 'mutate' | null>('load');
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!canManage) return;
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller; setBusy('load'); setError(null);
    try {
      const [nextStatus, nextArtifacts] = await Promise.all([
        campaignArtifactAssistantApiClient.status(worldServerId, campaignId, controller.signal),
        campaignArtifactAssistantApiClient.list(worldServerId, campaignId, includeArchived, controller.signal),
      ]);
      setStatus(nextStatus); setArtifacts(nextArtifacts);
    } catch (reason) { if (!controller.signal.aborted) setError(errorText(reason, labels)); }
    finally { if (!controller.signal.aborted) setBusy(null); }
  }, [campaignId, canManage, includeArchived, labels, worldServerId]);

  useEffect(() => { void load(); return () => requestRef.current?.abort(); }, [load]);
  useEffect(() => { setDraft(null); }, [campaignId]);
  if (!canManage) return null;
  const available = Boolean(status?.configured && status.reachable && !status.reason);

  async function generate() {
    requestRef.current?.abort(); const controller = new AbortController(); requestRef.current = controller; setBusy('generate'); setError(null); setDraft(null);
    try { setDraft(await campaignArtifactAssistantApiClient.generate(worldServerId, campaignId, { task, sourceFamilies: families, ...(focus.trim() ? { focus: focus.trim() } : {}) }, controller.signal)); }
    catch (reason) { if (!controller.signal.aborted) setError(errorText(reason, labels)); }
    finally { if (!controller.signal.aborted) setBusy(null); }
  }
  async function confirm() {
    if (!draft) return; setBusy('confirm'); setError(null);
    try { const saved = await campaignArtifactAssistantApiClient.confirm(worldServerId, campaignId, draft.suggestionId); setArtifacts((items) => [saved, ...items.filter((item) => item.artifactId !== saved.artifactId)]); setDraft(null); }
    catch (reason) { setError(errorText(reason, labels)); }
    finally { setBusy(null); }
  }
  async function mutate(artifact: SavedCampaignArtifact) {
    setBusy('mutate'); setError(null);
    try { const next = artifact.archivedAt ? await campaignArtifactAssistantApiClient.restore(worldServerId, campaignId, artifact.artifactId) : await campaignArtifactAssistantApiClient.archive(worldServerId, campaignId, artifact.artifactId); setArtifacts((items) => includeArchived ? items.map((item) => item.artifactId === next.artifactId ? next : item) : items.filter((item) => item.artifactId !== next.artifactId)); }
    catch (reason) { setError(errorText(reason, labels)); }
    finally { setBusy(null); }
  }

  const preview = draft ? { artifactId: draft.suggestionId, task: draft.task, title: draft.suggestion.title, summary: draft.suggestion.summary, visibility: 'user_private' as const, suggestion: draft.suggestion, sources: draft.sources, model: draft.model } : null;
  return <details className="mt-4 rounded-2xl border border-[#2f2a22]/12 bg-[#eee7da] p-4">
    <summary className="cursor-pointer list-none"><div className="flex items-start justify-between gap-3"><div><h4 className="font-bold text-[#211c17]">{labels.title}</h4><p className="mt-1 max-w-3xl text-xs leading-5 text-[#6c604f]">{labels.note}</p></div><span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-[#655948]">{labels.private}</span></div></summary>
    <div className="mt-4 border-t border-[#2f2a22]/10 pt-4">
      {error && <p role="alert" className="mb-3 rounded-lg bg-[#8b3a2f]/10 px-3 py-2 text-sm text-[#8b3a2f]">{error}</p>}
      {busy === 'load' ? <p className="text-sm text-[#51483d]">…</p> : !available ? <div className="rounded-xl bg-white/65 p-3 text-sm text-[#6c3c32]"><p>{labels.unavailable}</p><button type="button" onClick={() => void load()} className="mt-2 text-xs font-bold underline">{labels.refresh}</button></div> : <>
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="font-bold">{labels.model}</span><span className="rounded-full bg-white/75 px-2 py-1">{status?.model}</span></div>
        {!draft && <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,.8fr)]">
          <div><div className="flex gap-2">{(['preparation_brief', 'campaign_recap'] as CampaignArtifactTask[]).map((value) => <button key={value} type="button" onClick={() => setTask(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${task === value ? 'bg-[#2b241d] text-white' : 'bg-white/75 text-[#40382f]'}`}>{labels[value]}</button>)}</div>
          <label className="mt-3 block text-xs font-bold">{labels.focus}<textarea value={focus} maxLength={1200} onChange={(event) => setFocus(event.target.value)} placeholder={labels.focusPlaceholder} className="mt-1 min-h-20 w-full resize-y rounded-lg border border-[#2f2a22]/15 bg-white/80 px-3 py-2 text-sm font-normal" /></label></div>
          <fieldset><legend className="text-xs font-bold">{labels.sources}</legend><div className="mt-2 space-y-2">{SOURCE_FAMILIES.map((family) => <label key={family} className="flex items-start gap-2 text-sm"><input type="checkbox" checked={families.includes(family)} onChange={(event) => setFamilies((current) => event.target.checked ? [...current, family] : current.filter((item) => item !== family))} className="mt-1" /><span>{labels[family]}</span></label>)}</div></fieldset>
          <div className="lg:col-span-2"><button type="button" disabled={busy !== null || families.length === 0} onClick={() => void generate()} className="rounded-lg bg-[#2b241d] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{busy === 'generate' ? labels.generating : labels.generate}</button></div>
        </div>}
        {preview && <div className="mt-4 rounded-xl border border-[#8a7049]/30 bg-[#faf7f0] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#7d6c55]">{labels[preview.task]}</p><h4 className="mt-1 text-lg font-bold">{preview.title}</h4></div><span className="text-xs text-[#6c604f]">{draft.model}</span></div><ArtifactBody artifact={preview} labels={labels} /><p className="mt-3 text-xs text-[#6c604f]">{labels.expires}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy !== null} onClick={() => void confirm()} className="rounded-lg bg-[#2b241d] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{busy === 'confirm' ? labels.confirming : labels.confirm}</button><button type="button" disabled={busy !== null} onClick={() => setDraft(null)} className="rounded-lg border border-[#2f2a22]/15 bg-white px-4 py-2 text-sm font-bold">{labels.discard}</button></div></div>}
      </>}
      <div className="mt-5 border-t border-[#2f2a22]/10 pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold">{labels.history}</h4><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />{labels.showArchived}</label></div>{artifacts.length === 0 ? <p className="mt-2 text-sm text-[#6c604f]">{labels.empty}</p> : <div className="mt-2 space-y-2">{artifacts.map((artifact) => <details key={artifact.artifactId} className="rounded-xl bg-white/65 p-3"><summary className="cursor-pointer list-none"><div className="flex items-start justify-between gap-3"><div><h5 className="font-bold">{artifact.title}</h5><p className="mt-1 text-xs text-[#6c604f]">{labels[artifact.task]}{artifact.archivedAt ? ` · ${labels.archived}` : ''}{artifact.model ? ` · ${artifact.model}` : ''}</p></div><button type="button" disabled={busy !== null} onClick={(event) => { event.preventDefault(); void mutate(artifact); }} className="text-xs font-bold underline disabled:opacity-40">{artifact.archivedAt ? labels.restore : labels.archive}</button></div></summary><ArtifactBody artifact={artifact} labels={labels} /></details>)}</div>}</div>
    </div>
  </details>;
}
