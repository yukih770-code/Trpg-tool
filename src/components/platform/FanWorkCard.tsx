/**
 * FanWorkCard
 * AI-LANDMARK: WORKSHOP_FAN_PLAZA_DEDICATED_DETAIL_PAGES_V1
 * (supersedes WORKSHOP_FAN_PLAZA_VISUAL_PREVIEW_REFINEMENT_V2 card layout)
 *
 * Image-forward, multimodal fan-work card. Clicking the main area enters the
 * dedicated Fan Work detail view; a separate lightweight "quick preview" button
 * opens a low-weight preview. Cover comes from coverMode; content-block summary
 * chips show the multimodal makeup. Counts are display-only. No real like/share.
 */
import type { FanWork } from '../../lib/platform/communityTypes';
import { fanWorkRelatedTypes } from '../../lib/platform/communityFilters';
import { PreviewArt } from './PreviewArt';

export type FanWorkCardProps = {
  work: FanWork;
  t: (key: string) => string;
  onOpenDetail: (id: string) => void;
  onQuickPreview: (id: string) => void;
};

export function FanWorkCard({ work, t, onOpenDetail, onQuickPreview }: FanWorkCardProps) {
  const relatedTypes = Array.from(new Set(fanWorkRelatedTypes(work)));
  const hasGallery = work.contentBlocks.includes('imageGallery');
  const hasAudio = work.contentBlocks.includes('audio');

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-[#2f2a22]/15 bg-white shadow-sm transition hover:border-[#17130f]/40 hover:shadow-md">
      {/* Clickable main area → dedicated detail view */}
      <button type="button" onClick={() => onOpenDetail(work.id)} className="flex flex-1 flex-col text-left">
        {/* Cover / main preview (source = coverMode) */}
        <PreviewArt
          t={t}
          fanKind={work.coverKind ?? work.type}
          coverMode={work.coverMode}
          ratio="4:3"
          galleryCount={hasGallery ? 3 : undefined}
          hasAudio={hasAudio}
        />

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold leading-snug text-[#17130f] group-hover:text-[#17130f]">{work.title}</h3>
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
        </div>
      </button>

      {/* Counts + actions (outside the clickable main area) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#51483d]/70">
          <span>{t('fanPlaza.card.likes')}：{work.likeCount}</span>
          <span>{t('fanPlaza.card.favorites')}：{work.favoriteCount}</span>
          <span>{t('fanPlaza.card.comments')}：{work.commentCount}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail(work.id)}
            className="border border-[#17130f] bg-[#17130f] px-2.5 py-1 text-[11px] font-bold text-white"
          >
            {t('fanPlaza.card.enterDetail')}
          </button>
          <button
            type="button"
            onClick={() => onQuickPreview(work.id)}
            className="border border-[#2f2a22]/20 px-2.5 py-1 text-[11px] font-bold text-[#51483d] hover:border-[#17130f]"
          >
            {t('fanPlaza.card.quickPreview')}
          </button>
          <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">
            {t('fanPlaza.card.shareReserved')}
          </button>
        </div>
      </div>
    </div>
  );
}
