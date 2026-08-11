import { useCallback, useEffect, useState } from 'react';

import { fetchRoomServerHealth } from '../../lib/platform/roomServerHttpClient';
import { isLocalRoomServerEndpoint, resolveRoomServerHttpUrl } from '../../lib/platform/roomServerEndpoint';

/**
 * RoomServerStatusBanner (M26) — lightweight Room Server reachability chip.
 *
 * AI-LANDMARK: ROOM_SERVER_STATUS_BANNER_V0
 *
 * Pings `GET <baseUrl>/health` and shows whether the Room Server is reachable,
 * the address it is checking, and a "重新检测" button. Meant for the Join / Host /
 * Room Lobby ENTRY area — it is compact and MUST NOT occupy the Runtime main
 * stage. It owns no room state and performs no writes; it only reads /health.
 * baseUrl defaults to the env-driven Room Server endpoint resolver but a
 * caller may pass the address the user is actually editing.
 */

export interface RoomServerStatusBannerProps {
  baseUrl?: string;
  className?: string;
}

type ProbeState = 'checking' | 'online' | 'offline';

export function RoomServerStatusBanner({ baseUrl, className }: RoomServerStatusBannerProps) {
  const effectiveBaseUrl = (baseUrl && baseUrl.trim() !== '' ? baseUrl.trim() : resolveRoomServerHttpUrl());
  const [state, setState] = useState<ProbeState>('checking');
  const [detail, setDetail] = useState<string | null>(null);

  // request() (inside fetchRoomServerHealth) throws on any non-2xx / network
  // error, so a resolved call already means the Room Server is reachable.
  const probe = useCallback(async () => {
    setState('checking');
    setDetail(null);
    try {
      await fetchRoomServerHealth({ baseUrl: effectiveBaseUrl });
      setState('online');
    } catch (err) {
      setState('offline');
      setDetail(err instanceof Error ? err.message : String(err));
    }
  }, [effectiveBaseUrl]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState('checking');
      setDetail(null);
      try {
        await fetchRoomServerHealth({ baseUrl: effectiveBaseUrl });
        if (!cancelled) setState('online');
      } catch (err) {
        if (cancelled) return;
        setState('offline');
        setDetail(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveBaseUrl]);

  const tone =
    state === 'online'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800'
      : state === 'offline'
        ? 'border-amber-500/40 bg-amber-50/70 text-amber-800'
        : 'border-slate-400/40 bg-white/60 text-slate-600';

  const dot =
    state === 'online' ? 'bg-emerald-500' : state === 'offline' ? 'bg-amber-500' : 'bg-slate-400 animate-pulse';

  const isLocal = isLocalRoomServerEndpoint(effectiveBaseUrl);
  const locationLabel = isLocal ? '本机' : '云端';
  const headline =
    state === 'online'
      ? `${locationLabel}联机房间可用`
      : state === 'offline'
        ? '暂时无法创建联机房间'
        : '正在准备联机房间…';

  return (
    <div className={`rounded border px-2.5 py-1.5 text-[11px] ${tone} ${className ?? ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} aria-hidden />
        <span className="font-bold">{headline}</span>
        <button
          type="button"
          onClick={() => void probe()}
          disabled={state === 'checking'}
          className="ml-auto rounded border border-slate-400/50 bg-white/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide disabled:opacity-40"
        >
          重试
        </button>
      </div>
      {state === 'offline' && (
        <div className="mt-1 text-[10px] leading-relaxed opacity-90">
          请稍后重试，或检查当前服务器的联机服务设置。
          <details className="mt-1 opacity-75">
            <summary className="cursor-pointer font-bold">技术详情</summary>
            <div className="mt-1 break-all font-mono">{effectiveBaseUrl}{detail ? ` · ${detail}` : ''}</div>
          </details>
        </div>
      )}
    </div>
  );
}
