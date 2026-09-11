import { useState, type CSSProperties } from 'react';

import type { RuntimeSceneFocus } from './RuntimeSceneFocusPanel';

/**
 * RuntimeMapStage (M45) — map-first tabletop background.
 *
 * AI-LANDMARK: RUNTIME_MAP_STAGE_V0
 *
 * The Runtime main stage as a TABLETOP, not a dashboard: the scene image fills
 * the whole stage (object-contain, centered, on a soft neutral backdrop), and a
 * small translucent Scene HUD floats over the top-left with the current scene
 * title + description. When there is no scene image it shows a calm empty
 * tabletop (never a broken/blank admin page). This is a static reference image —
 * NO zoom, drag, token, fog, coordinates, or map system. Read-only for everyone;
 * the host sets the image via the Scene Focus dock. Presentation only.
 */

export interface RuntimeMapStageProps {
  scene: RuntimeSceneFocus | null;
  role: 'host' | 'player' | 'spectator';
  loading?: boolean;
}

function isLikelyHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

// Faint grid so an empty (or letterboxed) stage still reads as a tabletop.
const GRID_STYLE: CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(100,116,139,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.10) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
};

export function RuntimeMapStage({ scene, role, loading }: RuntimeMapStageProps) {
  // Track the URL that failed (not a boolean) so a new/updated URL auto-recovers.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const mapUrl = (scene?.mapUrl ?? '').trim();
  const imgFailed = failedUrl === mapUrl && mapUrl !== '';
  const hasValidMap = mapUrl !== '' && isLikelyHttpUrl(mapUrl) && !imgFailed;

  const title = (scene?.title ?? '').trim();
  const body = (scene?.body ?? '').trim();
  const hasSceneText = title !== '' || body !== '';

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-slate-300/60 bg-slate-200/70">
      {/* Base tabletop texture (always present, sits under the image). */}
      <div className="absolute inset-0" style={GRID_STYLE} aria-hidden />

      {hasValidMap ? (
        <img
          key={mapUrl}
          src={mapUrl}
          alt="当前场景的参考图"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(mapUrl)}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
        />
      ) : (
        // Empty tabletop: calm centered hint, not a blank page.
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-md rounded-lg border border-slate-300/60 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm">
            <div className="text-[13px] font-bold text-slate-600">
              {mapUrl !== '' && (!isLikelyHttpUrl(mapUrl) || imgFailed) ? '场景图无法显示' : '等待场景'}
            </div>
            <p className="mx-auto mt-1.5 max-w-sm text-[11px] leading-relaxed text-slate-500">
              {mapUrl !== '' && (!isLikelyHttpUrl(mapUrl) || imgFailed)
                ? '当前场景图链接无法显示。请确认这是一个以 http(s) 开头、可公开访问的图片地址。'
                : loading
                  ? '正在载入当前场景…'
                  : role === 'host'
                    ? '点击「当前场景」设置场景图。'
                    : '等待主持人设置场景图。'}
            </p>
          </div>
        </div>
      )}

      {/* Scene HUD — floats over the map, top-left, translucent. */}
      {hasSceneText && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[min(20rem,70%)]">
          <div className="rounded-lg border border-slate-300/60 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm">
            <div className="flex items-baseline gap-1.5">
              <span aria-hidden>📍</span>
              <span className="text-[13px] font-black text-slate-800">{title || '当前场景'}</span>
            </div>
            {body && (
              <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600">{body}</p>
            )}
          </div>
        </div>
      )}

      {/* Caption so it always reads as reference art, not a full map system. */}
      {hasValidMap && (
        <div className="pointer-events-none absolute bottom-2 right-3 z-10 rounded bg-slate-900/45 px-2 py-0.5 text-[9px] font-bold text-white/90">
          场景图 / 参考图
        </div>
      )}
    </div>
  );
}
