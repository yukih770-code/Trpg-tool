import { useState } from 'react';

/**
 * RuntimeStaticMapPanel (M44) — static scene image v0-lite.
 *
 * AI-LANDMARK: RUNTIME_STATIC_MAP_PANEL_V0
 *
 * The lightest possible "map": it shows ONE static reference image from a URL the
 * host typed into the Scene Focus form. This is a 场景图 / 参考图, NOT a map system
 * — no upload, no MediaAsset, no token, no fog, no coordinates, no zoom/drag, no
 * permissions. Read-only for everyone; the host provides the URL elsewhere (Scene
 * Focus). When the URL is empty or fails to load it renders a calm placeholder.
 */

export interface RuntimeStaticMapPanelProps {
  mapUrl?: string | null;
  /** Tailor the empty placeholder copy when the current user is the host. */
  isHost?: boolean;
  /** Compact height for board embedding (default false = taller). */
  compact?: boolean;
}

function isLikelyHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function RuntimeStaticMapPanel({ mapUrl, isHost, compact }: RuntimeStaticMapPanelProps) {
  const [failed, setFailed] = useState(false);
  const url = (mapUrl ?? '').trim();
  const heightCls = compact ? 'max-h-48' : 'max-h-72';

  if (url === '' || !isLikelyHttpUrl(url) || failed) {
    return (
      <div className={`flex items-center justify-center rounded border border-dashed border-slate-400/40 bg-white/40 p-4 text-center ${compact ? 'min-h-[80px]' : 'min-h-[120px]'}`}>
        <div className="text-[11px] leading-relaxed text-slate-500">
          {url !== '' && (!isLikelyHttpUrl(url) || failed) ? (
            <>场景图链接无法显示。请确认这是一个以 http(s) 开头、可公开访问的图片地址。</>
          ) : isHost ? (
            <>还没有场景图。在「当前场景」里填入一张图片链接，作为本场的参考图。</>
          ) : (
            <>主持人还没有提供场景图。</>
          )}
        </div>
      </div>
    );
  }

  return (
    <figure className="overflow-hidden rounded border border-slate-300/60 bg-slate-900/5">
      {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
      <img
        src={url}
        alt="当前场景的参考图"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`mx-auto block w-full object-contain ${heightCls}`}
      />
      <figcaption className="border-t border-slate-300/50 bg-white/60 px-2 py-1 text-[9px] text-slate-500">
        场景图 / 参考图 · 静态图片，非完整地图系统
      </figcaption>
    </figure>
  );
}
