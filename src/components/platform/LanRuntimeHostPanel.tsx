import { useCallback, useEffect, useState } from 'react';
import { Copy, RefreshCw, Wifi } from 'lucide-react';
import { createTranslator, type Locale } from '../../i18n';
import { ApiClientError } from '../../lib/api/apiTypes';
import { lanRuntimeApiClient, type LanRuntimeStatus } from '../../lib/api/lanRuntimeApiClient';
import { createLanJoinUrl } from '../../lib/platform/lanRuntimeEndpointOverride';

type Props = {
  locale: Locale;
  canManageServer: boolean;
  contextLabel?: string;
};

function errorText(error: ApiClientError, locale: Locale): string {
  if (error.kind === 'network') return locale === 'en' ? 'LAN status is unavailable. Check that the host backend is running.' : '暂时无法读取 LAN 状态，请确认主持人后端已经启动。';
  return locale === 'en' ? 'LAN status could not be loaded.' : '暂时无法读取 LAN 状态。';
}

export function LanRuntimeHostPanel({ locale, canManageServer, contextLabel }: Props) {
  const { t } = createTranslator(locale);
  const [status, setStatus] = useState<LanRuntimeStatus | null>(null);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    if (!canManageServer) return;
    setLoading(true);
    setError(null);
    try {
      setStatus(await lanRuntimeApiClient.getStatus());
    } catch (reason) {
      setError(reason instanceof ApiClientError ? reason : new ApiClientError('network', 'LAN status unavailable.'));
    } finally {
      setLoading(false);
    }
  }, [canManageServer]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (!canManageServer) return null;

  const primary = status?.endpoints[0];
  const joinUrl = primary ? createLanJoinUrl(primary.frontendUrl, primary.backendUrl) : undefined;
  const copyJoinUrl = async () => {
    if (!joinUrl || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="rounded-2xl border border-[#2f2a22]/12 bg-[#fff8e6] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="rounded-xl bg-[#f5c518]/18 p-2 text-[#6d4f00]"><Wifi className="h-5 w-5" /></span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#6d4f00]">{t('lanRuntime.eyebrow')}</div>
            <h3 className="mt-1 text-lg font-black">{t('lanRuntime.title')}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#51483d]">{t('lanRuntime.subtitle')}</p>
          </div>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold text-[#51483d] disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />{t('lanRuntime.refresh')}
        </button>
      </div>

      {loading && !status && <p className="mt-4 text-sm text-[#51483d]">{t('lanRuntime.loading')}</p>}
      {error && <p className="mt-4 text-sm text-[#8b3a2f]">{errorText(error, locale)}</p>}
      {status && !status.enabled && <p className="mt-4 text-sm leading-6 text-[#51483d]">{t('lanRuntime.disabled')}</p>}
      {status?.enabled && primary && (
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
            <div className="text-xs font-bold text-[#51483d]">{t('lanRuntime.joinUrl')}</div>
            <div className="mt-1 break-all font-mono text-xs leading-5 text-[#17130f]">{joinUrl}</div>
            <p className="mt-2 text-xs leading-5 text-[#51483d]">{t('lanRuntime.joinHint')}</p>
          </div>
          <button type="button" onClick={() => void copyJoinUrl()} className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white">
            <Copy className="h-3.5 w-3.5" />{copied ? t('lanRuntime.copied') : t('lanRuntime.copy')}
          </button>
        </div>
      )}
      {status?.enabled && !primary && <p className="mt-4 text-sm leading-6 text-[#8b3a2f]">{t('lanRuntime.noAddress')}</p>}
      {status?.enabled && primary && (
        <div className="mt-3 grid gap-2 text-xs text-[#51483d] md:grid-cols-3">
          <div><strong>{t('lanRuntime.frontend')}</strong><div className="mt-1 break-all">{primary.frontendUrl}</div></div>
          <div><strong>{t('lanRuntime.backend')}</strong><div className="mt-1 break-all">{primary.backendUrl}</div></div>
          <div><strong>{t('lanRuntime.websocket')}</strong><div className="mt-1 break-all">{primary.wsUrl}</div></div>
        </div>
      )}
      {contextLabel && status?.enabled && <p className="mt-3 text-xs text-[#51483d]">{t('lanRuntime.context')}: {contextLabel}</p>}
      {status?.warnings.map((warning) => <p key={warning} className="mt-2 text-xs leading-5 text-[#8b3a2f]">{warning}</p>)}
      <p className="mt-4 text-[11px] leading-5 text-[#51483d]">{t('lanRuntime.boundary')}</p>
    </section>
  );
}
