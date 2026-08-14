import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ApiClientError } from '../../lib/api/apiTypes';
import type { AiModelGatewayStatus } from '../../lib/ai/dndCharacterAssistantTypes';
import type {
  RoomSessionAssistantSuggestionResult,
  RoomSessionAssistantTask,
  RoomSessionAssistantVisibility,
} from '../../lib/ai/sessionAssistantTypes';
import { selectRoomSessionAssistantDraft } from '../../lib/ai/sessionAssistantTypes';
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
];

function statusText(status: AiModelGatewayStatus | null): string {
  if (!status) return '正在检查本地模型…';
  if (!status.configured) return '尚未配置本地模型。';
  if (status.reason === 'provider-unreachable') return '无法连接本地模型服务。';
  if (status.reason === 'model-unavailable') return `模型 ${status.model ?? ''} 尚未安装或名称不匹配。`;
  return `${status.model ?? '本地模型'} 已就绪。`;
}

function errorText(error: unknown): string {
  return error instanceof ApiClientError ? error.message : error instanceof Error ? error.message : 'Session AI 暂时不可用。';
}

export function RoomSessionAssistantDialog({ roomId, baseUrl, memberId, onConfirmed }: Props) {
  const client = useMemo(() => createRoomSessionAssistantHttpClient({ baseUrl }), [baseUrl]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AiModelGatewayStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [task, setTask] = useState<RoomSessionAssistantTask>('in_session');
  const [focus, setFocus] = useState('');
  const [suggestion, setSuggestion] = useState<RoomSessionAssistantSuggestionResult | null>(null);
  const [visibility, setVisibility] = useState<RoomSessionAssistantVisibility>('hostOnly');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
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

  const show = () => {
    setOpen(true);
    setSuggestion(null);
    setVisibility('hostOnly');
    setError('');
    void checkStatus();
  };

  const close = () => {
    controller.current?.abort();
    controller.current = null;
    setLoading(false);
    setConfirming(false);
    setSuggestion(null);
    setError('');
    setOpen(false);
  };

  const generate = async () => {
    if (loading) return;
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
    if (!suggestion || confirming) return;
    setConfirming(true);
    setError('');
    try {
      const result = await client.confirm(roomId, suggestion.suggestionId, memberId, visibility);
      onConfirmed(result.event);
      toast(visibility === 'public' ? 'AI 纪要已发布到公开 RuntimeLog。' : 'AI 草稿已写入主持人 RuntimeLog。');
      close();
    } catch (reason) {
      setError(errorText(reason));
      setConfirming(false);
    }
  };

  const ready = Boolean(status?.configured && status.reachable && !status.reason);
  const selectedTask = TASKS.find((item) => item.id === task) ?? TASKS[1];
  const draft = suggestion ? selectRoomSessionAssistantDraft(suggestion.suggestion, visibility) : undefined;

  return (
    <>
      <button type="button" onClick={show} className="rounded border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[11px] font-bold text-violet-800 hover:bg-violet-500/15">
        Session AI 助手
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-3" role="dialog" aria-modal="true" aria-labelledby="room-session-ai-title">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-300 bg-slate-50 p-5 text-slate-900 shadow-2xl md:p-6">
            <button type="button" onClick={close} disabled={confirming} className="absolute right-3 top-2 text-2xl font-bold text-slate-600 disabled:opacity-30" aria-label="关闭 Session AI 助手">×</button>
            <div className="border-b border-slate-200 pb-3 pr-8">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">主持人 · 当前房间上下文</div>
              <h2 id="room-session-ai-title" className="mt-1 text-xl font-black">Session AI 助手</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">服务端只提供你已经有权看到的投影日志。模型不会读取角色原表、地图原始数据或未接入的战役资料，也不会自动写入。</p>
            </div>

            <div className={`mt-4 rounded border p-3 text-xs ${ready ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{statusError || statusText(status)}</span>
                {(statusError || status?.reason) && <button type="button" onClick={() => void checkStatus()} className="font-bold underline">重新检查</button>}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {TASKS.map((item) => (
                <button key={item.id} type="button" disabled={loading || confirming} onClick={() => { setTask(item.id); setSuggestion(null); setError(''); }} className={`rounded-lg border p-3 text-left ${task === item.id ? 'border-violet-600 bg-violet-50' : 'border-slate-200 bg-white'}`}>
                  <strong className="block text-xs">{item.label}</strong>
                  <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{item.hint}</span>
                </button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-bold">本次关注点（可选）</span>
              <textarea value={focus} onChange={(event) => setFocus(event.target.value.slice(0, 2000))} disabled={loading || confirming} placeholder={`补充${selectedTask.label}需要特别关注的人物、节奏或问题；这段文字不会成为权限指令。`} className="mt-2 min-h-24 w-full rounded border border-slate-300 bg-white p-3 text-sm outline-none focus:border-violet-500" />
            </label>

            <div className="mt-3 flex justify-end gap-2">
              {loading ? (
                <button type="button" onClick={() => controller.current?.abort()} className="rounded border border-slate-400 px-4 py-2 text-xs font-bold">取消生成</button>
              ) : (
                <button type="button" onClick={() => void generate()} disabled={!ready || confirming} className="rounded bg-violet-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">生成待确认草稿</button>
              )}
            </div>
            {loading && <p className="mt-2 text-center text-xs text-slate-500" aria-live="polite">正在根据服务端投影日志生成草稿…</p>}
            {error && <p className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-700" role="alert">{error}</p>}

            {suggestion && (
              <section className="mt-5 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">读取至 RuntimeLog seq {suggestion.contextThroughSeq} · {suggestion.model}</div>
                  <h3 className="mt-1 text-lg font-black">{suggestion.suggestion.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{suggestion.suggestion.summary}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <List title="关键点" items={suggestion.suggestion.highlights} />
                  <List title="风险 / 待核" items={suggestion.suggestion.risks} tone="amber" />
                  <List title="建议下一步" items={suggestion.suggestion.suggestedNextSteps} />
                </div>

                <fieldset className="rounded border border-slate-200 p-3">
                  <legend className="px-1 text-xs font-bold">确认写入的可见范围</legend>
                  <label className="mt-1 flex items-start gap-2 text-xs"><input type="radio" checked={visibility === 'hostOnly'} onChange={() => setVisibility('hostOnly')} /> <span><strong>仅主持人</strong><br /><span className="text-slate-500">写入 hostOnly RuntimeLog，玩家和旁观者不可见。</span></span></label>
                  <label className="mt-3 flex items-start gap-2 text-xs"><input type="radio" checked={visibility === 'public'} onChange={() => setVisibility('public')} /> <span><strong>公开给房间参与者</strong><br /><span className="text-amber-700">会写入公开 RuntimeLog。请逐字检查剧透、私密信息和模型误判。</span></span></label>
                </fieldset>

                <div className="rounded border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">最终写入预览</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{draft}</p>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-500">确认前若 RuntimeLog 出现新事件，服务端会拒绝这份过期草稿。确认只追加一条新日志，不改写历史记录。</p>
                <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                  <button type="button" onClick={() => setSuggestion(null)} disabled={confirming} className="rounded border border-slate-400 px-4 py-2 text-xs font-bold">放弃草稿</button>
                  <button type="button" onClick={() => void confirm()} disabled={confirming} className="rounded bg-violet-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{confirming ? '确认中…' : visibility === 'public' ? '确认公开写入' : '确认私密写入'}</button>
                </div>
              </section>
            )}

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <button type="button" onClick={close} disabled={confirming} className="rounded border border-slate-400 px-4 py-2 text-xs font-bold disabled:opacity-40">关闭</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function List({ title, items, tone = 'slate' }: { title: string; items: string[]; tone?: 'slate' | 'amber' }) {
  return (
    <div className={`rounded border p-3 ${tone === 'amber' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</div>
      {items.length ? <ul className="mt-2 space-y-1 text-xs">{items.map((item, index) => <li key={`${index}-${item}`}>· {item}</li>)}</ul> : <p className="mt-2 text-xs text-slate-400">无</p>}
    </div>
  );
}
