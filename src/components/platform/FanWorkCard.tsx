/**
 * FanWorkCard
 * AI-LANDMARK: WORKSHOP_FAN_PLAZA_VISUAL_PREVIEW_REFINEMENT_V2
 * (supersedes LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1 card layout)
 *
 * Image-forward, multimodal fan-work card. Cover comes from coverMode
 * (author cover / first image / audio visual / type fallback), with content-block
 * summary chips (text / image / gallery / audio / link / linked objects / workshop
 * ref). Like/favorite/comment counts are display-only. No real like/favorite/share.
 */
import type { FanWork } from '../../lib/platform/communityTypes';
import { fanWorkRelatedTypes } from '../../lib/platform/communityFilters';
import { fanWorkCoverKind } from '../../lib/platform/communityMockData';
import { PreviewArt } from './PreviewArt';

export type FanWorkCardProps = {
  work: FanWork;
  t: (key: string) => string;
  onViewDetail: (id: string) => void;
};

export function FanWorkCard({ work, t, onViewDetail }: FanWorkCardProps) {
  const relatedTypes = Array.from(new Set(fanWorkRelatedTypes(work)));
  const hasGallery = work.contentBlocks.includes('imageGallery');
  const hasAudio = work.contentBlocks.includes('audio');

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#2f2a22]/15 bg-white shadow-sm">
      {/* Cover / main preview (source = coverMode) */}
      <PreviewArt
        t={t}
        fanKind={fanWorkCoverKind(work)}
        coverMode={work.coverMode}
        ratio="4:3"
        galleryCount={hasGallery ? 3 : undefined}
        hasAudio={hasAudio}
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold leading-snug text-[#17130f]">{work.title}</h3>
            <div className="mt-0.5 text-[11px] text-[#51483d]">{t('fanPlaza.card.author')}：{work.authorName}</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="border border-[#2f2a22]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#51483d]">
              {t(`fanPlaza.workType.${work.type}`)}
            </span>
            {work.systemId && (
              <span className="text-[10px] text-[#51483d]/70">{t(`fanPlaza.system.${work.systemId}`)}</span>
            )}
          </div>
        </div>

        {/* Content-block summary (multimodal) */}
        <div className="mt-2 flex flex-wrap gap-1">
          {work.contentBlocks.map((block) => (
            <span key={block} className="rounded bg-[#2f2a22]/6 px-1.5 py-0.5 text-[10px] font-bold text-[#51483d]/80">
              {t(`fanPlaza.contentBlock.${block}`)}
            </span>
          ))}
        </div>

        <p className="mt-2 text-xs leading-relaxed text-[#51483d]">{work.summary}</p>

        {relatedTypes.length > 0 && (
          <p className="mt-1.5 text-[10px] text-[#51483d]/75">
            <span className="font-bold">{t('fanPlaza.card.relatedObjects')}：</span>
            {relatedTypes.map((ty) => t(`fanPlaza.entityType.${ty}`)).join('、')}
          </p>
        )}

        {work.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {work.tags.map((tag) => (
              <span key={tag} className="border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/70">#{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#51483d]/70">
            <span>{t('fanPlaza.card.likes')}：{work.likeCount}</span>
            <span>{t('fanPlaza.card.favorites')}：{work.favoriteCount}</span>
            <span>{t('fanPlaza.card.comments')}：{work.commentCount}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onViewDetail(work.id)}
              className="border border-[#17130f] bg-[#17130f] px-2.5 py-1 text-[11px] font-bold text-white"
            >
              {t('fanPlaza.card.viewDetail')}
            </button>
            <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">
              {t('fanPlaza.card.shareReserved')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
