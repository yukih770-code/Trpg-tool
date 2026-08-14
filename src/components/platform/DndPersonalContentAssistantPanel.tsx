import { useEffect, useRef, useState } from 'react';
import type { Locale } from '../../i18n';
import { ApiClientError } from '../../lib/api/apiTypes';
import { aiModelGatewayApiClient } from '../../lib/api/aiModelGatewayApiClient';
import type { AiModelGatewayStatus } from '../../lib/ai/dndCharacterAssistantTypes';
import {
  applyDndPersonalContentAssistantPlan,
  buildDndPersonalContentAssistantPlan,
  buildDndPersonalContentAssistantRequest,
  DND_PERSONAL_CONTENT_ASSISTANT_FIELD_LABELS,
  dndPersonalContentAuthoringFingerprint,
  type DndPersonalContentAssistantPlan,
  type DndPersonalContentAuthoringSnapshot,
} from '../../lib/ai/dndPersonalContentAssistant';
import type {
  DndPersonalContentAssistantFieldKey,
  DndPersonalContentAssistantFieldValues,
} from '../../lib/ai/dndPersonalContentAssistantTypes';
import type { DndPersonalEditorEntryKind } from '../../lib/dnd/dndPersonalContentDefinitions';

type Props = {
  locale: Locale;
  entryKind: DndPersonalEditorEntryKind;
  values: DndPersonalContentAssistantFieldValues;
  disabled?: boolean;
  onApply: (values: DndPersonalContentAssistantFieldValues, changedFields: DndPersonalContentAssistantFieldKey[]) => void;
};

const KIND_LABELS: Record<DndPersonalEditorEntryKind, { zh: string; en: string }> = {
  species: { zh: '种族', en: 'species' }, class: { zh: '职业', en: 'class' }, subclass: { zh: '子职业', en: 'subclass' },
  background: { zh: '背景', en: 'background' }, feat: { zh: '专长', en: 'feat' }, spell: { zh: '法术', en: 'spell' },
  item: { zh: '物品', en: 'item' }, monster: { zh: '怪物', en: 'monster' }, rule: { zh: '规则模块', en: 'rule module' }, other: { zh: '原创资料', en: 'original reference' },
};

function copy(locale: Locale, zh: string, en: string): string {
  return locale === 'en' ? en : zh;
}

function defaultIntent(locale: Locale, entryKind: DndPersonalEditorEntryKind): string {
  const kind = KIND_LABELS[entryKind][locale === 'en' ? 'en' : 'zh'];
  return copy(
    locale,
    `根据我当前填写的内容，起草一份原创${kind}资料；保持结构清晰、数值克制，并标出需要主持人复核的部分。`,
    `Draft original ${kind} material from my current fields. Keep it structured and conservative, and flag anything that needs host review.`,
  );
}

function statusMessage(locale: Locale, status: AiModelGatewayStatus | null): string {
  if (!status) return copy(locale, '正在检查智能路由…', 'Checking the intelligent route…');
  if (status.reason === 'user-disabled') return copy(locale, '此设备已关闭 AI，可在“设置 → AI 与自动化”中重新开启。', 'AI is disabled on this device. Re-enable it under Settings → AI & Automation.');
  if (status.reason === 'route-unavailable') return copy(locale, '所选 AI 路由尚未接入，请选择自动或本地模型。', 'The selected AI route is unavailable. Choose Auto or a local model.');
  if (!status.configured) return copy(locale, '后端尚未配置可用 AI 提供商。', 'No AI provider is configured on the backend.');
  if (status.reason === 'provider-unreachable') return copy(locale, '无法连接本地模型服务。', 'The local model service is unreachable.');
  if (status.reason === 'model-unavailable') return copy(locale, `模型 ${status.model ?? ''} 尚未安装或名称不匹配。`, `Model ${status.model ?? ''} is not installed or allowed.`);
  return copy(locale, `${status.model ?? '本地模型'} 已就绪；建议只会填入未保存表单。`, `${status.model ?? 'Local model'} is ready. Suggestions only fill the unsaved form.`);
}

function previewValue(value: string): string {
  return value.length > 600 ? `${value.slice(0, 600)}…` : value;
}

/** AI-LANDMARK: DND_PERSONAL_CONTENT_AI_DRAFTING_V1 */
export function DndPersonalContentAssistantPanel({ locale, entryKind, values, disabled = false, onApply }: Props) {
  const [status, setStatus] = useState<AiModelGatewayStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [intent, setIntent] = useState(() => defaultIntent(locale, entryKind));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<DndPersonalContentAssistantPlan | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const snapshot: DndPersonalContentAuthoringSnapshot = { entryKind, values };

  useEffect(() => {
    requestController.current?.abort();
    requestController.current = null;
    setLoading(false);
    setError('');
    setPlan(null);
    setIntent(defaultIntent(locale, entryKind));
  }, [entryKind, locale]);

  useEffect(() => () => requestController.current?.abort(), []);

  const checkStatus = async () => {
    setStatus(null);
    setStatusError('');
    try {
      setStatus(await aiModelGatewayApiClient.status());
    } catch (reason) {
      setStatusError(reason instanceof ApiClientError ? reason.message : copy(locale, '无法读取 AI 路由状态。', 'Unable to read AI route status.'));
    }
  };

  const cancelGeneration = () => {
    requestController.current?.abort();
    requestController.current = null;
    setLoading(false);
  };

  const generate = async () => {
    if (!intent.trim() || loading || disabled) return;
    const requestSnapshot: DndPersonalContentAuthoringSnapshot = { entryKind, values: { ...values } };
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setError('');
    setPlan(null);
    try {
      const result = await aiModelGatewayApiClient.suggestDndPersonalContent(buildDndPersonalContentAssistantRequest({
        intent,
        locale: locale === 'en' ? 'en' : 'zh-CN',
        snapshot: requestSnapshot,
      }), controller.signal);
      if (!controller.signal.aborted) setPlan(buildDndPersonalContentAssistantPlan({ snapshot: requestSnapshot, result }));
    } catch (reason) {
      if (!controller.signal.aborted) setError(reason instanceof ApiClientError ? reason.message : copy(locale, '本地模型暂时无法起草内容。', 'The local model cannot draft content right now.'));
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  };

  const apply = () => {
    if (!plan) return;
    const nextValues = applyDndPersonalContentAssistantPlan(snapshot, plan);
    if (!nextValues) {
      setError(copy(locale, '表单已在建议生成后发生变化。为避免覆盖，请重新生成。', 'The form changed after generation. Generate again to avoid overwriting it.'));
      return;
    }
    onApply(nextValues, plan.changedFields);
    setPlan(null);
    setError('');
  };

  const ready = Boolean(status?.configured && status.reachable && !status.reason);
  const stale = Boolean(plan && plan.baseFingerprint !== dndPersonalContentAuthoringFingerprint(snapshot));
  const kindLabel = KIND_LABELS[entryKind][locale === 'en' ? 'en' : 'zh'];

  return (
    <details
      className="group overflow-hidden rounded-md border border-[#644a9b]/22 bg-[#f7f3ff]"
      onToggle={(event) => {
        if (event.currentTarget.open) void checkStatus();
        else cancelGeneration();
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-[#4d3278] hover:bg-[#644a9b]/5">
        <span>
          <span className="block text-sm font-bold">{copy(locale, '智能起草', 'Intelligent drafting')} · {kindLabel}</span>
          <span className="mt-0.5 block text-[11px] font-normal text-[#4d3278]/70">{copy(locale, '生成结构化预览，确认后只填入当前未保存表单', 'Generate a structured preview; confirmation only fills this unsaved form')}</span>
        </span>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4d3278]/55"><span className="group-open:hidden">{copy(locale, '展开', 'Open')}</span><span className="hidden group-open:inline">{copy(locale, '收起', 'Close')}</span></span>
      </summary>

      <div className="border-t border-[#644a9b]/15 p-3">
        <p className="text-xs leading-5 text-[#2c1810]/65">{copy(locale, '只发送当前资料类型、你的起草目标和已填写字段。AI 不会加入待保存内容、保存版本、发布到工坊或获得房间权限。', 'Only the current type, drafting goal, and filled fields are sent. AI cannot add pending content, save a version, publish to Workshop, or gain Room authority.')}</p>
        <div className={`mt-3 rounded-md border p-2.5 text-xs ${ready ? 'border-[#2f7f68]/30 bg-[#f1fbf7] text-[#184f42]' : 'border-[#a35b11]/25 bg-[#fff1c7]/45 text-[#7a4610]'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{statusError || statusMessage(locale, status)}</span>
            {(statusError || status?.reason) && <button type="button" onClick={() => void checkStatus()} className="font-bold underline">{copy(locale, '重新检查', 'Retry')}</button>}
          </div>
        </div>

        <label className="mt-3 grid gap-1.5 text-xs font-bold text-[#4d3278]">
          <span>{copy(locale, '这次希望起草什么？', 'What should be drafted?')}</span>
          <textarea value={intent} onChange={(event) => setIntent(event.target.value.slice(0, 1_000))} disabled={loading || disabled} className="min-h-24 rounded-md border border-[#644a9b]/25 bg-white px-3 py-2 text-sm font-normal text-[#2c1810] outline-none focus:border-[#644a9b] disabled:opacity-50" />
        </label>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-[#4d3278]/65">{copy(locale, '模型输出还会经过字段、数值与逐行格式校验。', 'Model output is checked again for fields, numbers, and line formats.')}</span>
          {loading
            ? <button type="button" onClick={cancelGeneration} className="rounded-md border border-[#644a9b] px-3 py-2 text-xs font-bold text-[#4d3278]">{copy(locale, '取消起草', 'Cancel')}</button>
            : <button type="button" onClick={() => void generate()} disabled={!ready || !intent.trim() || disabled} className="rounded-md bg-[#4d3278] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{copy(locale, '整理待确认草稿', 'Draft for review')}</button>}
        </div>
        {loading && <p className="mt-3 text-center text-xs text-[#4d3278]/65" aria-live="polite">{copy(locale, '模型正在整理结构化字段…', 'The model is structuring the fields…')}</p>}
        {error && <p className="mt-3 rounded-md border border-red-700/20 bg-red-50 p-2.5 text-xs font-bold text-red-700" role="alert">{error}</p>}

        {plan && <section className="mt-4 space-y-3 rounded-md border border-[#644a9b]/20 bg-white/75 p-3">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#4d3278]/55">{copy(locale, '草稿预览', 'Draft preview')} · {plan.model}</span><h4 className="mt-1 text-sm font-bold text-[#4d3278]">{plan.proposalSummary}</h4></div>
          {plan.changedFields.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{plan.changedFields.map((field) => <div key={field} className="rounded border border-[#644a9b]/12 bg-[#f7f3ff]/70 p-2 text-xs"><strong className="text-[#4d3278]">{DND_PERSONAL_CONTENT_ASSISTANT_FIELD_LABELS[field][locale === 'en' ? 'en' : 'zh']}</strong><p className="mt-1 max-h-36 overflow-y-auto whitespace-pre-wrap leading-5 text-[#2c1810]/75">{previewValue(plan.patch[field] ?? '')}</p></div>)}</div>}
          {plan.rationale.length > 0 && <ul className="space-y-1 text-xs text-[#2c1810]/70">{plan.rationale.map((item, index) => <li key={`${index}-${item}`}>· {item}</li>)}</ul>}
          {plan.modelWarnings.map((warning, index) => <p key={`${index}-${warning}`} className="text-xs text-amber-800">{copy(locale, '模型提示', 'Model note')}：{warning}</p>)}
          {plan.issues.map((issue) => <p key={issue.code} className={`text-xs ${issue.severity === 'blocker' ? 'font-bold text-red-700' : 'text-amber-800'}`}>{issue.message}</p>)}
          {stale && <p className="text-xs font-bold text-red-700">{copy(locale, '表单已在预览后变化，请重新生成。', 'The form changed after preview. Generate again.')}</p>}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[#644a9b]/12 pt-3">
            <button type="button" onClick={() => setPlan(null)} className="rounded-md border border-[#644a9b] px-3 py-2 text-xs font-bold text-[#4d3278]">{copy(locale, '放弃草稿', 'Discard')}</button>
            <button type="button" onClick={apply} disabled={!plan.ready || stale || disabled} className="rounded-md bg-[#4d3278] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{copy(locale, '应用到未保存表单', 'Apply to unsaved form')}</button>
          </div>
        </section>}
      </div>
    </details>
  );
}
