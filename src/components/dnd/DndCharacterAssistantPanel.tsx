import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { BackgroundDef, CharacterData, ClassDef, FeatDef } from '../../lib/dnd-types';
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
  if (!status) return '正在检查智能路由…';
  if (status.reason === 'user-disabled') return '此设备已关闭 AI，可在“设置 → AI 与自动化”中重新开启。';
  if (status.reason === 'route-unavailable') return '所选 AI 路由尚未接入，请在设置中选择自动或本地模型。';
  if (!status.configured) return '后端尚未配置可用 AI 提供商。';
  if (status.reason === 'provider-unreachable') return '无法连接本地模型服务，请确认它已在本机启动。';
  if (status.reason === 'model-unavailable') return `模型 ${status.model ?? ''} 尚未安装或名称不匹配。`;
  return `${status.model ?? 'AI 模型'} 已就绪；所有角色改动仍需你的确认。`;
}

function buildInitialDirection(character: CharacterData): string {
  if (character.isCompleted) {
    return `在不改变${character.name || '这名角色'}的职业、背景、专长和属性的前提下，帮助完善姓名与人物叙事，使角色更容易投入游玩。`;
  }

  const missing: string[] = [];
  if (!character.name.trim()) missing.push('姓名');
  if (!character.race.trim()) missing.push('物种');
  if (!character.jobClass.trim()) missing.push('职业');
  if (!character.background.trim()) missing.push('背景');
  if (character.remainingPoints !== 0) missing.push('属性购点');
  if (!character.description.trim()) missing.push('人物设定');

  const focus = missing.length > 0 ? missing.join('、') : '角色主题与现有选择的一致性';
  return `围绕一个 ${character.level || 1} 级 DND 角色，优先完善${focus}；结构化选择必须来自当前车卡允许的资料。`;
}

/** AI-LANDMARK: EMBEDDED_DND_BUILDER_AI_GUIDANCE_V1 */
export function DndCharacterAssistantPanel({ classes, backgrounds, feats }: Props) {
  const {
    character,
    dndCharacterAssistantAudit,
    lastDndCharacterAssistantCommit,
    commitDndCharacterAssistantPlan,
    undoLastDndCharacterAssistantCommit,
  } = useCharacterStore();
  const [status, setStatus] = useState<AiModelGatewayStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [intent, setIntent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<DndCharacterAssistantPlan | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => {
    requestController.current?.abort();
    requestController.current = null;
    setLoading(false);
    setError('');
    setPlan(null);
    setIntent('');
  }, [character.id]);

  useEffect(() => () => requestController.current?.abort(), []);

  const checkStatus = async () => {
    setStatus(null);
    setStatusError('');
    try {
      setStatus(await aiModelGatewayApiClient.status());
    } catch (reason) {
      setStatusError(reason instanceof ApiClientError ? reason.message : '无法读取 AI 路由状态。');
    }
  };

  const cancelGeneration = () => {
    requestController.current?.abort();
    requestController.current = null;
    setLoading(false);
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
      if (!controller.signal.aborted) {
        setPlan(buildDndCharacterAssistantPlan({ character, result, classes, backgrounds, feats }));
      }
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof ApiClientError ? reason.message : '本地模型暂时无法生成建议。');
      }
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
    toast('智能辅助建议已确认写入。', { description: `已更新：${plan.changedFields.join('、')}` });
    setPlan(null);
    setError('');
  };

  const actorAudit = dndCharacterAssistantAudit.filter((item) => item.actorId === character.id);
  const canUndo = canUndoDndCharacterAssistantCommit(character, lastDndCharacterAssistantCommit);
  const ready = Boolean(status?.configured && status.reachable && !status.reason);
  const stale = Boolean(plan && plan.baseFingerprint !== JSON.stringify(character));

  return (
    <details
      className="group mb-3 overflow-hidden rounded-lg border border-[#58180d]/20 bg-[#fff8e6]/72"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          if (!intent.trim()) setIntent(buildInitialDirection(character));
          void checkStatus();
        } else {
          cancelGeneration();
        }
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[#58180d] hover:bg-[#58180d]/5">
        <span>
          <span className="block text-sm font-black">车卡智能辅助</span>
          <span className="mt-0.5 block text-xs font-medium text-[#58180d]/65">根据当前车卡整理可预览、可撤销的建议</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#58180d]/55">
          {canUndo && <span className="rounded-full border border-[#2f7f68]/30 bg-[#e8f5ee] px-2 py-1 text-[#245f4f]">可撤销</span>}
          <span className="group-open:hidden">展开</span>
          <span className="hidden group-open:inline">收起</span>
        </span>
      </summary>

      <div className="border-t border-[#58180d]/15 px-4 py-4 md:px-5">
        <p className="text-xs leading-5 text-[#58180d]/70">
          系统只发送当前角色摘要和允许选项，先返回结构化预览；确认前不会修改角色，也不会读取战役或 Runtime。
        </p>

        <div className={`mt-3 rounded-md border p-3 text-xs ${ready ? 'border-[#2f7f68]/35 bg-[#e8f5ee] text-[#245f4f]' : 'border-[#a35b11]/30 bg-[#fff1c7]/55 text-[#7c4a13]'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{statusError || statusMessage(status)}</span>
            {(statusError || status?.reason) && (
              <button type="button" onClick={() => void checkStatus()} className="font-bold underline">重新检查</button>
            )}
          </div>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-xs font-black text-[#58180d]">本次希望重点整理什么？</span>
          <textarea
            value={intent}
            onChange={(event) => setIntent(event.target.value.slice(0, 1000))}
            disabled={loading}
            className="min-h-24 w-full rounded-md border border-[#58180d]/35 bg-white px-3 py-2 text-sm outline-none focus:border-[#58180d] disabled:opacity-60"
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-[#58180d]/55">建议会再次经过本地车卡规则校验。</span>
          {loading ? (
            <button type="button" onClick={cancelGeneration} className="rounded-md border border-[#58180d] px-4 py-2 text-xs font-bold text-[#58180d]">取消生成</button>
          ) : (
            <button type="button" onClick={() => void generate()} disabled={!ready || !intent.trim()} className="rounded-md border border-[#58180d] bg-[#58180d] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">整理待确认建议</button>
          )}
        </div>
        {loading && <p className="mt-3 text-center text-xs text-[#58180d]/65" aria-live="polite">模型正在整理结构化建议…</p>}
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
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#58180d]/15 pt-3">
              <button type="button" onClick={() => setPlan(null)} className="rounded-md border border-[#58180d] px-4 py-2 text-xs font-bold text-[#58180d]">放弃建议</button>
              <button type="button" onClick={confirm} disabled={!plan.ready || stale} className="rounded-md bg-[#58180d] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">确认应用到角色</button>
            </div>
          </section>
        )}

        {(canUndo || actorAudit.length > 0) && (
          <div className="mt-4 rounded-md border border-[#58180d]/15 bg-white/45 p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-[#58180d]">最近应用记录</strong>
              {canUndo && (
                <button type="button" onClick={() => {
                  if (undoLastDndCharacterAssistantCommit()) toast('已撤销上一次智能辅助写入。');
                }} className="rounded-md border border-[#58180d]/30 bg-white/60 px-3 py-1.5 font-bold text-[#58180d] hover:border-[#58180d]">
                  撤销上次应用
                </button>
              )}
            </div>
            {actorAudit.length > 0 && (
              <div className="mt-2 space-y-2">{actorAudit.slice(-5).reverse().map((item) => (
                <div key={item.auditId} className="border-t border-[#58180d]/10 pt-2">
                  <strong>{item.action === 'applied' ? '已确认' : '已撤销'}</strong> · {item.changedFields.join('、')} · {new Date(item.occurredAt).toLocaleString()}
                </div>
              ))}</div>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
