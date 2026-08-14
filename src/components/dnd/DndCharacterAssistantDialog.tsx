import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { BackgroundDef, ClassDef, FeatDef } from '../../lib/dnd-types';
import { ApiClientError } from '../../lib/api/apiTypes';
import { aiModelGatewayApiClient } from '../../lib/api/aiModelGatewayApiClient';
import type { AiModelGatewayStatus } from '../../lib/ai/dndCharacterAssistantTypes';
import {
  buildDndCharacterAssistantPlan,
  buildDndCharacterAssistantRequest,
  canUndoDndCharacterAssistantCommit,
  type DndCharacterAssistantPlan,
} from '../../lib/ai/dndCharacterAssistant';
import { useCharacterStore } from '../../store/characterStore';

type Props = { classes: ClassDef[]; backgrounds: BackgroundDef[]; feats: FeatDef[] };

function statusMessage(status: AiModelGatewayStatus | null): string {
  if (!status) return '正在检查本地模型…';
  if (!status.configured) return '尚未配置本地模型。请先在后端设置 LOCAL_AI_MODEL。';
  if (status.reason === 'provider-unreachable') return '无法连接本地模型服务，请确认它已在本机启动。';
  if (status.reason === 'model-unavailable') return `模型 ${status.model ?? ''} 尚未安装或名称不匹配。`;
  return `${status.model ?? '本地模型'} 已就绪；建议仍需你的确认。`;
}

export function DndCharacterAssistantDialog({ classes, backgrounds, feats }: Props) {
  const {
    character,
    dndCharacterAssistantAudit,
    lastDndCharacterAssistantCommit,
    commitDndCharacterAssistantPlan,
    undoLastDndCharacterAssistantCommit,
  } = useCharacterStore();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AiModelGatewayStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<DndCharacterAssistantPlan | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => () => requestController.current?.abort(), []);

  const checkStatus = async () => {
    setStatus(null);
    setStatusError('');
    try {
      setStatus(await aiModelGatewayApiClient.status());
    } catch (reason) {
      setStatusError(reason instanceof ApiClientError ? reason.message : '无法读取本地模型状态。');
    }
  };

  const openDialog = () => {
    setOpen(true);
    setError('');
    setPlan(null);
    void checkStatus();
  };

  const close = () => {
    requestController.current?.abort();
    requestController.current = null;
    setLoading(false);
    setOpen(false);
    setPlan(null);
    setError('');
  };

  const generate = async () => {
    if (!intent.trim() || loading) return;
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setError('');
    setPlan(null);
    try {
      const result = await aiModelGatewayApiClient.suggestDndCharacter(buildDndCharacterAssistantRequest({
        intent,
        character,
        classes,
        backgrounds,
        feats,
      }), controller.signal);
      if (!controller.signal.aborted) setPlan(buildDndCharacterAssistantPlan({ character, result, classes, backgrounds, feats }));
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof ApiClientError ? reason.message : '本地模型暂时无法生成建议。');
    } finally {
      if (requestController.current === controller) requestController.current = null;
      setLoading(false);
    }
  };

  const confirm = () => {
    if (!plan?.ready) return;
    if (!commitDndCharacterAssistantPlan(plan)) {
      setError('角色已在建议生成后发生变化。为避免覆盖，请重新生成建议。');
      return;
    }
    toast('AI 车卡建议已确认写入。', { description: `已更新：${plan.changedFields.join('、')}` });
    close();
  };

  const canUndo = canUndoDndCharacterAssistantCommit(character, lastDndCharacterAssistantCommit);
  const ready = Boolean(status?.configured && status.reachable && !status.reason);
  const stale = Boolean(plan && plan.baseFingerprint !== JSON.stringify(character));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canUndo && (
        <button type="button" onClick={() => {
          if (undoLastDndCharacterAssistantCommit()) toast('已撤销上一次 AI 车卡写入。');
        }} className="rounded-md border border-[#58180d]/30 bg-white/60 px-3 py-2 text-xs font-bold text-[#58180d] hover:border-[#58180d]">
          撤销 AI 写入
        </button>
      )}
      <button type="button" onClick={openDialog} className="rounded-md border border-[#58180d] bg-[#58180d] px-4 py-2 text-xs font-black text-[#fff8e6] hover:bg-[#2c1810]">
        AI 车卡助手
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c1810]/80 p-4" role="dialog" aria-modal="true" aria-labelledby="dnd-ai-assistant-title">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border-2 border-[#58180d] bg-[#fff8e6] p-5 text-[#2c1810] shadow-2xl md:p-6">
            <button type="button" onClick={close} aria-label="关闭 AI 车卡助手" className="absolute right-3 top-2 text-2xl font-black text-[#58180d]">×</button>
            <div className="border-b border-[#58180d]/20 pb-3 pr-8">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#58180d]/55">Builder 内部工具</div>
              <h2 id="dnd-ai-assistant-title" className="mt-1 text-2xl font-black text-[#58180d]">AI 车卡助手</h2>
              <p className="mt-1 text-sm text-[#58180d]/70">它只生成结构化建议。预览确认前不会修改角色，也不会读取战役或 Runtime。</p>
            </div>

            <div className={`mt-4 rounded-md border p-3 text-xs ${ready ? 'border-[#2f7f68]/35 bg-[#e8f5ee] text-[#245f4f]' : 'border-[#a35b11]/30 bg-[#fff1c7]/55 text-[#7c4a13]'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{statusError || statusMessage(status)}</span>
                {(statusError || status?.reason) && <button type="button" onClick={() => void checkStatus()} className="font-bold underline">重新检查</button>}
              </div>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-xs font-black text-[#58180d]">你希望助手怎样帮助这张角色卡？</span>
              <textarea
                value={intent}
                onChange={(event) => setIntent(event.target.value.slice(0, 1000))}
                disabled={loading}
                placeholder="例如：为一个谨慎、擅长调查的一级角色补全姓名、职业、背景、购点和简短人物设定。"
                className="min-h-28 w-full rounded-md border border-[#58180d]/35 bg-white px-3 py-2 text-sm outline-none focus:border-[#58180d] disabled:opacity-60"
              />
            </label>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {loading ? (
                <button type="button" onClick={() => requestController.current?.abort()} className="rounded-md border border-[#58180d] px-4 py-2 text-xs font-bold text-[#58180d]">取消生成</button>
              ) : (
                <button type="button" onClick={() => void generate()} disabled={!ready || !intent.trim()} className="rounded-md bg-[#58180d] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">生成待确认建议</button>
              )}
            </div>
            {loading && <p className="mt-3 text-center text-xs text-[#58180d]/65" aria-live="polite">本地模型正在整理结构化建议…</p>}
            {error && <p className="mt-3 rounded-md border border-red-700/25 bg-red-50 p-3 text-xs font-bold text-red-700" role="alert">{error}</p>}

            {plan && (
              <section className="mt-5 space-y-3 rounded-md border border-[#58180d]/25 bg-white/55 p-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#58180d]/55">建议预览 · {plan.model}</div>
                  <h3 className="mt-1 font-black text-[#58180d]">{plan.summary}</h3>
                </div>
                <div className="rounded border border-[#58180d]/15 bg-[#f7ebcf]/55 p-3 text-xs">
                  <strong className="text-[#58180d]">将更新：</strong> {plan.changedFields.join('、') || '无'}
                </div>
                {plan.rationale.length > 0 && <ul className="space-y-1 text-xs text-[#2c1810]/80">{plan.rationale.map((item, index) => <li key={`${index}-${item}`}>· {item}</li>)}</ul>}
                {plan.modelWarnings.map((warning, index) => <p key={`${index}-${warning}`} className="text-xs text-amber-800">模型提示：{warning}</p>)}
                {plan.issues.map((issue) => <p key={issue.code} className={`text-xs ${issue.severity === 'blocker' ? 'font-bold text-red-700' : 'text-amber-800'}`}>{issue.message}</p>)}
                {stale && <p className="text-xs font-bold text-red-700">角色已在预览后发生变化，请重新生成。</p>}
                <div className="flex justify-end gap-2 border-t border-[#58180d]/15 pt-3">
                  <button type="button" onClick={() => setPlan(null)} className="rounded-md border border-[#58180d] px-4 py-2 text-xs font-bold text-[#58180d]">放弃建议</button>
                  <button type="button" onClick={confirm} disabled={!plan.ready || stale} className="rounded-md bg-[#58180d] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">确认写入角色</button>
                </div>
              </section>
            )}

            {dndCharacterAssistantAudit.filter((item) => item.actorId === character.id).length > 0 && (
              <details className="mt-4 rounded-md border border-[#58180d]/15 bg-white/45 p-3 text-xs">
                <summary className="cursor-pointer font-bold text-[#58180d]">最近 AI 写入记录</summary>
                <div className="mt-2 space-y-2">{dndCharacterAssistantAudit.filter((item) => item.actorId === character.id).slice(-5).reverse().map((item) => (
                  <div key={item.auditId} className="border-t border-[#58180d]/10 pt-2">
                    <strong>{item.action === 'applied' ? '已确认' : '已撤销'}</strong> · {item.changedFields.join('、')} · {new Date(item.occurredAt).toLocaleString()}
                  </div>
                ))}</div>
              </details>
            )}

            <div className="mt-5 flex justify-end border-t border-[#58180d]/20 pt-4">
              <button type="button" onClick={close} className="rounded-md border border-[#58180d] px-4 py-2 text-xs font-bold text-[#58180d]">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
