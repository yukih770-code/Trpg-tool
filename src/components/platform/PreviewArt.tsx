/**
 * PreviewArt
 * AI-LANDMARK: WORKSHOP_FAN_PLAZA_VISUAL_PREVIEW_REFINEMENT_V2
 *
 * Unified static preview / cover placeholder for both the Workshop and the
 * Fan Plaza. Renders a CSS-gradient + glyph (or audio waveform) block keyed by
 * content kind and cover mode. No external images, no image generation, no
 * uploads — purely a deterministic visual skeleton.
 *
 * Two input modes (mutually exclusive):
 *   workshopKind — rulebook | map | music | character | npc | tool | adventure
 *   fanKind      — story | campaignRecap | illustration | comic | music |
 *                  setting | characterProfile | essay  (fan-work fallback type)
 *
 * coverMode (fan works) communicates the COVER SOURCE, not a fixed template:
 *   authorSelected → author-chosen cover
 *   firstImage     → first image / primary media of the work
 *   audioVisual    → audio / waveform visual
 *   typeFallback   → type default placeholder (only when no cover/media)
 */

type WorkshopPreviewKind =
  | 'rulebook' | 'map' | 'music' | 'character' | 'npc' | 'tool' | 'adventure';

type FanPreviewKind =
  | 'story' | 'campaignRecap' | 'illustration' | 'comic' | 'music'
  | 'setting' | 'characterProfile' | 'essay';

type CoverMode = 'authorSelected' | 'firstImage' | 'audioVisual' | 'typeFallback';

type Ratio = '16:9' | '4:3' | 'square';

export type PreviewArtProps = {
  t: (key: string) => string;
  workshopKind?: WorkshopPreviewKind;
  fanKind?: FanPreviewKind;
  coverMode?: CoverMode;
  /** Optional gradient start override (hex). */
  accent?: string;
  ratio?: Ratio;
  /** Show the kind caption strip at the bottom. */
  showCaption?: boolean;
  /** >1 renders a multi-image "gallery" corner badge. */
  galleryCount?: number;
  /** Renders an audio corner badge. */
  hasAudio?: boolean;
  className?: string;
};

const WORKSHOP_VISUAL: Record<WorkshopPreviewKind, { from: string; to: string; glyph: string }> = {
  rulebook:  { from: '#b9892f', to: '#6b4a1c', glyph: '📖' },
  map:       { from: '#3f8f6f', to: '#1f5a48', glyph: '🗺️' },
  music:     { from: '#6d5ad6', to: '#3a2f8f', glyph: '🎵' },
  character: { from: '#d8794f', to: '#8a3f2f', glyph: '🧝' },
  npc:       { from: '#5b76a8', to: '#2f3f6b', glyph: '👤' },
  tool:      { from: '#4aa6c9', to: '#1f5a78', glyph: '🧰' },
  adventure: { from: '#c25b4a', to: '#7a2f2f', glyph: '🏰' },
};

const FAN_VISUAL: Record<FanPreviewKind, { from: string; to: string; glyph: string }> = {
  story:            { from: '#8a6cc0', to: '#4a3f8f', glyph: '📜' },
  campaignRecap:    { from: '#b06a3f', to: '#6b3a2f', glyph: '⚔️' },
  illustration:     { from: '#d85f8f', to: '#8a2f5f', glyph: '🎨' },
  comic:            { from: '#4aa6a0', to: '#1f5a58', glyph: '💬' },
  music:            { from: '#6d5ad6', to: '#3a2f8f', glyph: '🎵' },
  setting:          { from: '#5b8f6f', to: '#2f5a48', glyph: '🌐' },
  characterProfile: { from: '#c2934a', to: '#7a5a2f', glyph: '🪪' },
  essay:            { from: '#6b8fa8', to: '#3a4f6b', glyph: '✍️' },
};

const RATIO_CLS: Record<Ratio, string> = {
  '16:9': 'aspect-[16/9]',
  '4:3': 'aspect-[4/3]',
  square: 'aspect-square',
};

export function PreviewArt({
  t,
  workshopKind,
  fanKind,
  coverMode,
  accent,
  ratio = '16:9',
  showCaption = true,
  galleryCount,
  hasAudio,
  className = '',
}: PreviewArtProps) {
  const visual = workshopKind
    ? WORKSHOP_VISUAL[workshopKind]
    : fanKind
      ? FAN_VISUAL[fanKind]
      : { from: '#7a6f60', to: '#3a332b', glyph: '🗂️' };

  const from = accent ?? visual.from;
  const caption = workshopKind
    ? t(`previewArt.workshopKind.${workshopKind}`)
    : fanKind
      ? t(`fanPlaza.workType.${fanKind}`)
      : t('previewArt.staticPlaceholder');

  const isAudioVisual = coverMode === 'audioVisual';

  return (
    <div
      className={`relative overflow-hidden rounded-md ${RATIO_CLS[ratio]} ${className}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${visual.to} 100%)` }}
      aria-hidden="true"
    >
      {/* Texture overlay (diagonal hatch) */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" preserveAspectRatio="none">
        <defs>
          <pattern id={`pa-${workshopKind ?? fanKind ?? 'x'}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#ffffff" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#pa-${workshopKind ?? fanKind ?? 'x'})`} />
      </svg>

      {/* Center glyph or waveform */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isAudioVisual ? (
          <div className="flex items-end gap-[3px]" aria-hidden="true">
            {[10, 22, 14, 30, 18, 26, 12, 24, 16, 28, 12].map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-white/75"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        ) : (
          <span className="text-4xl drop-shadow-sm" aria-hidden="true">{visual.glyph}</span>
        )}
      </div>

      {/* Cover-mode badge (source) */}
      {coverMode && (
        <span className="absolute left-1.5 top-1.5 rounded bg-black/35 px-1.5 py-0.5 text-[9px] font-bold text-white/95 backdrop-blur-sm">
          {t(`previewArt.coverMode.${coverMode}`)}
        </span>
      )}

      {/* Gallery / audio corner badges */}
      <div className="absolute right-1.5 top-1.5 flex gap-1">
        {galleryCount && galleryCount > 1 && (
          <span className="rounded bg-black/35 px-1.5 py-0.5 text-[9px] font-bold text-white/95 backdrop-blur-sm">
            {t('previewArt.galleryBadge')} · {galleryCount}
          </span>
        )}
        {hasAudio && (
          <span className="rounded bg-black/35 px-1.5 py-0.5 text-[9px] font-bold text-white/95 backdrop-blur-sm">
            {t('previewArt.audioBadge')}
          </span>
        )}
      </div>

      {/* Caption strip */}
      {showCaption && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/30 px-2 py-1 backdrop-blur-sm">
          <span className="truncate text-[10px] font-bold text-white/95">{caption}</span>
          <span className="shrink-0 text-[8px] uppercase tracking-wider text-white/65">
            {t('previewArt.staticPlaceholder')}
          </span>
        </div>
      )}
    </div>
  );
}
