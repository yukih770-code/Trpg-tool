import { useEffect, useMemo, useRef, useState } from 'react';
import { Cpu, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Locale } from '../../i18n';
import type { AiModelCatalog, AiRouteMode, AiRoutingPreference } from '../../lib/ai/modelRoutingTypes';
import { readAiRoutingPreference, writeAiRoutingPreference } from '../../lib/ai/modelRoutingPreference';
import { resolveAiSettingsAvailability } from '../../lib/ai/aiSettingsPresentation';
import { aiModelGatewayApiClient } from '../../lib/api/aiModelGatewayApiClient';
import { ApiClientError } from '../../lib/api/apiTypes';

type Props = { locale: Locale };

function formatSize(sizeBytes: number | undefined): string {
  if (sizeBytes === undefined) return '';
  return `${(sizeBytes / 1024 / 1024 / 1024).toFixed(sizeBytes >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
}

export function AiSettingsPanel({ locale }: Props) {
  const isEn = locale === 'en';
  const [preference, setPreference] = useState<AiRoutingPreference>(() => readAiRoutingPreference());
  const [catalog, setCatalog] = useState<AiModelCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);

  const loadCatalog = async (refresh = false) => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError('');
    try {
      const value = await aiModelGatewayApiClient.catalog(refresh, request.signal);
      if (!request.signal.aborted) setCatalog(value);
    } catch (reason) {
      if (!request.signal.aborted) setError(reason instanceof ApiClientError ? reason.message : (isEn ? 'Could not read AI model availability.' : '无法读取 AI 模型可用状态。'));
    } finally {
      if (!request.signal.aborted) setLoading(false);
      if (controller.current === request) controller.current = null;
    }
  };

  useEffect(() => {
    void loadCatalog();
    return () => controller.current?.abort();
  }, []);

  const availability = resolveAiSettingsAvailability({ loading, error, catalog });
  const fallbackModel = catalog?.local.recommendedModel ?? catalog?.local.defaultModel ?? catalog?.models[0]?.id;
  const selectedModel = preference.localModel && catalog?.models.some((model) => model.id === preference.localModel)
    ? preference.localModel
    : fallbackModel;

  const availabilityText = useMemo(() => {
    if (availability === 'loading') return isEn ? 'Checking the local model service…' : '正在检查本地模型服务…';
    if (availability === 'error') return error;
    if (availability === 'not-configured') return isEn ? 'Local AI is not configured on this server.' : '此服务器尚未配置本地 AI。';
    if (availability === 'unreachable') return isEn ? 'The local model service cannot be reached.' : '无法连接本地模型服务，请确认 Ollama 已启动。';
    if (availability === 'empty') return isEn ? 'No allowed local model is installed.' : '没有检测到已安装且允许使用的本地模型。';
    return isEn ? `${catalog?.models.length ?? 0} local model(s) available.` : `已检测到 ${catalog?.models.length ?? 0} 个可用本地模型。`;
  }, [availability, catalog?.models.length, error, isEn]);

  const choose = (mode: AiRouteMode) => {
    if (mode === 'cloud') return;
    const next = writeAiRoutingPreference({
      mode,
      ...(mode === 'local' && selectedModel ? { localModel: selectedModel } : preference.localModel ? { localModel: preference.localModel } : {}),
    });
    setPreference(next);
  };

  const chooseModel = (localModel: string) => {
    const next = writeAiRoutingPreference({ mode: 'local', localModel });
    setPreference(next);
  };

  const routes: Array<{ mode: AiRouteMode; title: string; description: string; disabled?: boolean; badge?: string }> = [
    { mode: 'auto', title: isEn ? 'Automatic' : '自动选择', description: isEn ? 'Prefer an installed Qwen 3.6 model, then use another available local model.' : '优先选择已安装的千问 Qwen 3.6，随后回退到其他可用本地模型。', badge: isEn ? 'Recommended' : '推荐' },
    { mode: 'local', title: isEn ? 'Choose local model' : '指定本地模型', description: isEn ? 'Use one installed model for the next AI task.' : '为下一次 AI 任务固定使用一个已安装模型。', disabled: availability !== 'ready' },
    { mode: 'off', title: isEn ? 'Off' : '关闭 AI', description: isEn ? 'Do not generate AI suggestions on this device.' : '此设备不再生成 AI 建议。' },
    { mode: 'cloud', title: isEn ? 'Cloud API' : '云端 API', description: isEn ? 'Not connected yet. Provider, privacy, usage and billing are not implemented.' : '尚未接入；提供商、隐私、用量与计费契约仍未实现。', disabled: true, badge: isEn ? 'Unavailable' : '暂未开放' },
  ];

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="rounded-lg border border-[#2f2a22]/12 bg-[#f7f3ea] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#17130f] text-white"><Cpu size={16} /></span>
            <div>
              <div className="text-sm font-bold text-[#17130f]">{isEn ? 'Model availability' : '模型可用状态'}</div>
              <div className={`mt-1 text-xs leading-5 ${availability === 'ready' ? 'text-emerald-700' : 'text-[#51483d]/75'}`}>{availabilityText}</div>
            </div>
          </div>
          <button type="button" onClick={() => void loadCatalog(true)} disabled={loading} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#2f2a22]/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#17130f] transition hover:bg-[#2f2a22]/6 disabled:cursor-wait disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />{isEn ? 'Refresh' : '刷新'}
          </button>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#51483d]/55">{isEn ? 'Default route on this device' : '此设备的默认 AI 路由'}</legend>
        {routes.map((route) => {
          const active = preference.mode === route.mode;
          return (
            <button key={route.mode} type="button" role="radio" aria-checked={active} disabled={route.disabled} onClick={() => choose(route.mode)} className={`flex items-start justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition ${active ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/18 bg-white text-[#17130f] hover:border-[#2f2a22]/40'} disabled:cursor-not-allowed disabled:border-dashed disabled:bg-[#f7f3ea]/65 disabled:text-[#51483d]/50`}>
              <span>
                <span className="block text-sm font-bold">{route.title}</span>
                <span className={`mt-0.5 block text-xs leading-5 ${active ? 'text-white/72' : 'text-[#51483d]/65'}`}>{route.description}</span>
              </span>
              {route.badge && <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${active ? 'border-white/35 text-white/75' : 'border-[#2f2a22]/25 text-[#51483d]/55'}`}>{route.badge}</span>}
            </button>
          );
        })}
      </fieldset>

      {preference.mode === 'local' && catalog && catalog.models.length > 0 && (
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#51483d]">
          {isEn ? 'Installed local model' : '已安装本地模型'}
          <select value={selectedModel} onChange={(event) => chooseModel(event.target.value)} className="h-10 rounded-md border border-[#2f2a22]/20 bg-white px-3 text-sm font-semibold text-[#17130f] outline-none focus:border-[#17130f]">
            {catalog.models.map((model) => <option key={model.id} value={model.id}>{model.id}{model.recommended ? (isEn ? ' — Recommended' : ' — 推荐') : ''}{model.sizeBytes ? ` · ${formatSize(model.sizeBytes)}` : ''}</option>)}
          </select>
        </label>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-emerald-900/15 bg-emerald-50/60 px-3 py-2.5 text-xs leading-5 text-emerald-950/75">
        <ShieldCheck size={15} className="mt-0.5 shrink-0" />
        <span>{isEn ? 'This preference is stored only on this device. Model choice never grants data access or bypasses task-specific review and confirmation.' : '此偏好只保存在当前设备。切换模型不会扩大资料访问权限，也不会绕过各功能原有的预览、审核与确认。'}</span>
      </div>
    </div>
  );
}
