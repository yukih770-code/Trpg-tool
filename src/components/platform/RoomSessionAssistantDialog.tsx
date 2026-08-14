import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ApiClientError } from '../../lib/api/apiTypes';
import type { AiModelGatewayStatus } from '../../lib/ai/dndCharacterAssistantTypes';
import type {
  RoomSessionAssistantSuggestionResult,
  RoomSessionAssistantTask,
  RoomSessionAssistantVisibility,
} from '../../lib/ai/sessionAssistantTypes';
import {
  roomSessionAssistantTaskRequiresFocus,
  selectRoomSessionAssistantDraft,
} from '../../lib/ai/sessionAssistantTypes';
import { createRoomSessionAssistantHttpClient } from '../../lib/platform/roomSessionAssistantHttpClient';
import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';

type Props = {
  roomId: string;
  baseUrl: string;
  memberId: string;
  onConfirmed(event: RoomRuntimeLogEvent): void;
};

const TASKS: Array<{ id: RoomSessionAssistantTask; label: string; hint: string }> = [
  { id: 'preparation', label: '备团提纲', hint: '整理开场、张力、遗漏准备和下一步。' },
  { id: 'in_session', label: '会中建议', hint: '根据当前投影日志给出接下来几分钟的主持建议。' },
  { id: 'recap', label: '会后纪要', hint: '区分主持人复盘和可公开回顾。' },
  { id: 'character_biography', label: '人物传记草稿', hint: '围绕明确指定的人物整理本场经历，不改角色卡。' },
  { id: 'quest_log', label: '任务日志草稿', hint: '整理已完成、进行中和待核线索，不改任务状态。' },
];

function statusText(status: AiModelGatewayStatus | null): string {
  if (!status) return '正在检查 AI 路由…';
  if (status.reason === 'user-disabled') return '此设备已关闭 AI，可在平台设置中重新开启。';
  if (status.reason === 'route-unavailable') return '所选 AI 路由尚未接入，请改用自动或本地模型。';
  if (!status.configured) return '后端尚未配置可用 AI 提供商。';
  if (status.reason === 'provider-unreachable') return '无法连接本地模型服务。';
  if (status.reason === 'model-unavailable') return `模型 ${status.model ?? ''} 尚未安装或名称不匹配。`;
  return `${status.model ?? 'AI 模型'} 已就绪。`;
}

function errorText(error: unknown): string {
  return error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : 'Session AI 暂时不可用。';
}

export function RoomSessionAssistantPanel({ roomId, baseUrl, memberId, onConfirmed }: Props) {
  const client = useMemo(() => createRoomSessionAssistantHttpClient({ baseUrl }), [baseUrl]);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<AiModelGatewayStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [task, setTask] = useState<RoomSessionAssistantTask>('in_session');
  const [focus, setFocus] = useState('');
  const [suggestion, setSuggestion] = useState<RoomSessionAssistantSuggestionResult | null>(null);
  const [visibility, setVisibility] = useState<RoomSessionAssistantVisibility>('hostOnly');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [savingArtifact, setSavingArtifact] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const checkStatus = async () => {
    const request = new AbortController();
    controller.current?.abort();
    controller.current = request;
    setStatus(null);
    setStatusError('');
    try {
      const value = await client.status(roomId, memberId, request.signal);
      if (!request.signal.aborted) setStatus(value);
    } catch (reason) {
      if (!request.signal.aborted) setStatusError(errorText(reason));
    } finally {
      if (controller.current === request) controller.current = null;
    }
  };

  const toggleExpanded = () => {
    if (expanded) {
      controller.current?.abort();
      controller.current = null;
      setLoading(false);
      setSuggestion(null);
      setError('');
      setExpanded(false);
      return;
    }
    setExpanded(true);
    setSuggestion(null);
    setVisibility('hostOnly');
    setError('');
    void checkStatus();
  };

  const generate = async () => {
    if (loading || (roomSessionAssistantTaskRequiresFocus(task) && !focus.trim())) return;
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError('');
    setSuggestion(null);
    setVisibility('hostOnly');
    try {
      const value = await client.generate(roomId, { memberId, task, focus: focus.trim() || undefined }, request.signal);
      if (!request.signal.aborted) setSuggestion(value);
    } catch (reason) {
      if (!request.signal.aborted) setError(errorText(reason));
    } finally {
      if (controller.current === request) controller.current = null;
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!suggestion || confirming || savingArtifact) return;
    setConfirming(true);
    setError('');
    try {
      const result = await client.confirm(roomId, suggestion.suggestionId, memberId, visibility);
      onConfirmed(result.event);
      toast(visibility === 'public' ? '草稿已发布到公开 RuntimeLog。' : '草稿已写入主持人 RuntimeLog。');
      setSuggestion(null);
      setExpanded(false);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setConfirming(false);
    }
  };

  const saveArtifact = async () => {
    if (!suggestion?.artifactDestination || savingArtifact || confirming) return;
    setSavingArtifact(true);
    setError('');
    try {
      const result = await client.saveArtifact(roomId, suggestion.suggestionId, memberId);
      toast(`已保存到「${suggestion.artifactDestination.campaignDisplayName}」的私有 AI 成果。`);
      setSuggestion(null);
      setExpanded(false);
      void result;
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setSavingArtifact(false);
    }
  };

  const ready = Boolean(status?.configured && status.reachable && !status.reason);
  const selectedTask = TASKS.find((item) => item.id === task) ?? TASKS[1];
  const focusRequired = roomSessionAssistantTaskRequiresFocus(task);
  const draft = suggestion ? selectRoomSessionAssistantDraft(suggestion.suggestion, visibility) : undefined;

  return (
    <section className="mt-3 rounded-lg border border-violet-300/70 bg-violet-50/65 p-3" aria-label="Runtime 智能整理">
      <button
        type="button"
        onClick={toggleExpanded}
        disabled={confirming || savingArtifact}
        className="flex w-full items-center justify-between gap-3 text-left disabled:opacity-50"
        aria-expanded={expanded}
      >
        <span>
          <strong className="block text-xs text-violet-950">智能整理</strong>
          <span className="mt-0.5 block text-[10px] leading-relaxed text-violet-800/75">基于你有权看到的当前日志，在原工作区内生成待确认草稿。</span>
        </span>
        <span className="text-[11px] font-bold text-violet-800">{expanded ? '收起' : '展开'}</span>
      </button>

      {expanded && (
        <div className="mt-3 border-t border-violet-200 pt-3">
          <div className={`rounded border p-2.5 text-[11px] ${ready ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{statusError || statusText(status)}</span>
              {(statusError || status?.reason) && <button type="button" onClick={() => void checkStatus()} className="font-bold underline">重新检查</button>}
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {TASKS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={loading || confirming || savingArtifact}
                onClick={() => { setTask(item.id); setSuggestion(null); setError(''); }}
                className={`rounded border p-2.5 text-left ${task === item.id ? 'border-violet-600 bg-white shadow-sm' : 'border-violet-200 bg-violet-50/40'}`}
              >
                <strong className="block text-[11px]">{item.label}</strong>
                <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{item.hint}</span>
              </button>
            ))}
          </div>

          <label className="mt-3 block">
            <span className="text-[11px] font-bold">{focusRequired ? '指定人物与关注点（必填）' : '本次关注点（可选）'}</span>
            <textarea
              value={focus}
              onChange={(event) => setFocus(event.target.value.slice(0, 2000))}
              disabled={loading || confirming || savingArtifact}
              placeholder={focusRequired ? '例如：人物“洛恩”；只整理本场可见经历与性格变化。' : `补充${selectedTask.label}需要特别关注的人物、节奏或问题。`}
              className="mt-1.5 min-h-20 w-full rounded border border-slate-300 bg-white p-2.5 text-xs outline-none focus:border-violet-500"
            />
          </label>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] leading-relaxed text-slate-500">人物传记与任务日志都是可审阅文字，不会更新角色卡、任务状态或战役事实。</p>
            {loading ? (
              <button type="button" onClick={() => controller.current?.abort()} className="shrink-0 rounded border border-slate-400 px-3 py-1.5 text-[11px] font-bold">取消生成</button>
            ) : (
              <button type="button" onClick={() => void generate()} disabled={!ready || confirming || savingArtifact || (focusRequired && !focus.trim())} className="shrink-0 rounded bg-violet-700 px-3 py-1.5 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">生成待确认草稿</button>
            )}
          </div>
          {loading && <p className="mt-2 text-center text-[11px] text-slate-500" aria-live="polite">正在根据服务端投影日志生成草稿…</p>}
          {error && <p className="mt-3 rounded border border-red-300 bg-red-50 p-2.5 text-[11px] font-bold text-red-700" role="alert">{error}</p>}

          {suggestion && (
            <section className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-white p-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-500">读取至 RuntimeLog seq {suggestion.contextThroughSeq} · {suggestion.model}</div>
                <h3 className="mt-1 text-base font-black">{suggestion.suggestion.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">{suggestion.suggestion.summary}</p>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <List title="关键点" items={suggestion.suggestion.highlights} />
                <List title="风险 / 待核" items={suggestion.suggestion.risks} tone="amber" />
                <List title="建议下一步" items={suggestion.suggestion.suggestedNextSteps} />
              </div>

              <fieldset className="rounded border border-slate-200 p-2.5">
                <legend className="px-1 text-[11px] font-bold">确认写入范围</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-start gap-2 text-[11px]"><input type="radio" checked={visibility === 'hostOnly'} onChange={() => setVisibility('hostOnly')} /> <span><strong>仅主持人</strong><br /><span className="text-slate-500">追加到 hostOnly RuntimeLog。</span></span></label>
                  <label className="flex items-start gap-2 text-[11px]"><input type="radio" checked={visibility === 'public'} onChange={() => setVisibility('public')} /> <span><strong>公开给房间参与者</strong><br /><span className="text-amber-700">请逐字检查剧透和模型误判。</span></span></label>
                </div>
              </fieldset>

              <div className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">最终写入预览</div>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">{draft}</p>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500">若日志在生成后发生变化，服务端会拒绝过期草稿。确认只追加一条新日志，不改写历史记录。</p>
              {suggestion.artifactDestination && (suggestion.task === 'character_biography' || suggestion.task === 'quest_log') && (
                <p className="rounded border border-violet-200 bg-violet-50 px-2.5 py-2 text-[10px] leading-relaxed text-violet-900">也可以保存为「{suggestion.artifactDestination.campaignDisplayName}」的仅本人可见会后成果；保存后可在战役详情归档或恢复，但不会写入角色卡、任务状态或战役正文。</p>
              )}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button type="button" onClick={() => setSuggestion(null)} disabled={confirming || savingArtifact} className="rounded border border-slate-400 px-3 py-1.5 text-[11px] font-bold">放弃草稿</button>
                {suggestion.artifactDestination && (suggestion.task === 'character_biography' || suggestion.task === 'quest_log') && <button type="button" onClick={() => void saveArtifact()} disabled={confirming || savingArtifact} className="rounded border border-violet-600 bg-white px-3 py-1.5 text-[11px] font-bold text-violet-800 disabled:opacity-50">{savingArtifact ? '保存中…' : '保存到战役成果'}</button>}
                <button type="button" onClick={() => void confirm()} disabled={confirming || savingArtifact} className="rounded bg-violet-700 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">{confirming ? '确认中…' : visibility === 'public' ? '确认公开写入' : '确认私密写入'}</button>
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}

function List({ title, items, tone = 'slate' }: { title: string; items: string[]; tone?: 'slate' | 'amber' }) {
  return (
    <div className={`rounded border p-2.5 ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</div>
      {items.length ? <ul className="mt-2 space-y-1 text-[11px]">{items.map((item, index) => <li key={`${index}-${item}`}>· {item}</li>)}</ul> : <p className="mt-2 text-[11px] text-slate-400">无</p>}
    </div>
  );
}
