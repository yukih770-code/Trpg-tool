/**
 * FanWorkDetail
 * AI-LANDMARK: WORKSHOP_FAN_PLAZA_VISUAL_PREVIEW_REFINEMENT_V2
 * (supersedes LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1 detail layout)
 *
 * Detail panel for one fan work: big cover / main preview (from coverMode),
 * content-block summary, multimodal media placeholders (image / gallery / audio /
 * external link), related objects (emphasis), related Workshop content, share
 * code / public path / visibility, permission-boundary note, and reserved
 * like/favorite/comment + author-other-works interfaces. No real backend.
 */
import { useState } from 'react';
import type { Locale } from '../../i18n';
import type { FanWork } from '../../lib/platform/communityTypes';
import { fanWorkCoverKind, getRelatedWorkshopItems } from '../../lib/platform/communityMockData';
import { getEntityById } from '../../lib/platform/linkableEntityMockData';
import { localized } from '../../lib/platform/workshopTypes';
import { EntityRelationList } from './EntityRelationList';
import { LinkableEntityCard } from './LinkableEntityCard';
import { PreviewArt } from './PreviewArt';

export type FanWorkDetailProps = {
  work: FanWork;
  t: (key: string) => string;
  locale: Locale;
  onClose: () => void;
};

export function FanWorkDetail({ work, t, locale, onClose }: FanWorkDetailProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const selectedEntity = selectedEntityId ? getEntityById(selectedEntityId) : undefined;

  const hasImage = work.contentBlocks.includes('image');
  const hasGallery = work.contentBlocks.includes('imageGallery');
  const hasAudio = work.contentBlocks.includes('audio');
  const hasExternalLink = work.contentBlocks.includes('externalLink');
  const relatedWorkshopItems = getRelatedWorkshopItems(work);

  return (
    <div className="rounded-lg border border-[#2f2a22]/20 bg-[#faf8f2] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#17130f]">{work.title}</h2>
          <div className="mt-0.5 text-[11px] text-[#51483d]">
            {t('fanPlaza.card.author')}：{work.authorName}
            <span className="mx-2 opacity-40">·</span>
            {t('fanPlaza.detail.created')}：{work.createdAtLabel}
            <span className="mx-2 opacity-40">·</span>
            {t('fanPlaza.detail.updated')}：{work.updatedAtLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 border border-[#2f2a22]/20 px-2.5 py-1 text-[11px] font-bold text-[#51483d] hover:border-[#17130f]"
        >
          {t('fanPlaza.detail.close')}
        </button>
      </div>

      {/* Big cover / main preview */}
      <section className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#51483d]/55">{t('fanPlaza.detail.coverPreview')}</p>
          <PreviewArt
            t={t}
            fanKind={fanWorkCoverKind(work)}
            coverMode={work.coverMode}
            ratio="16:9"
            galleryCount={hasGallery ? 3 : undefined}
            hasAudio={hasAudio}
          />
          {work.coverLabel && (
            <p className="mt-1 text-[10px] text-[#51483d]/60">
              {t('fanPlaza.card.coverSource')}：{t(`fanPlaza.coverMode.${work.coverMode}`)} · {work.coverLabel}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#51483d]/80">
            <span className="border border-[#2f2a22]/20 px-1.5 py-0.5 font-bold uppercase tracking-wider">{t(`fanPlaza.workType.${work.type}`)}</span>
            <span className="border border-[#2f2a22]/15 px-1.5 py-0.5">{t(`fanPlaza.format.${work.format}`)}</span>
            {work.systemId && <span className="border border-[#2f2a22]/15 px-1.5 py-0.5">{t(`fanPlaza.system.${work.systemId}`)}</span>}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#51483d]/55">{t('fanPlaza.detail.contentBlocks')}</p>
            <div className="flex flex-wrap gap-1">
              {work.contentBlocks.map((block) => (
                <span key={block} className="rounded bg-[#2f2a22]/6 px-1.5 py-0.5 text-[10px] font-bold text-[#51483d]/80">
                  {t(`fanPlaza.contentBlock.${block}`)}
                </span>
              ))}
            </div>
          </div>
          {work.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {work.tags.map((tag) => (
                <span key={tag} className="border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/70">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Body preview */}
      <section className="mt-3 rounded-md border border-[#2f2a22]/12 bg-white p-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#51483d]">{t('fanPlaza.detail.bodyPreview')}</h3>
        <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-[#51483d]">{work.bodyPreview}</p>
      </section>

      {/* Multimodal media placeholders */}
      {(hasImage || hasGallery || hasAudio || hasExternalLink) && (
        <section className="mt-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#51483d]">{t('fanPlaza.detail.mainMedia')}</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(hasImage || hasGallery) && (
              <div>
                <PreviewArt t={t} fanKind="illustration" coverMode="firstImage" ratio="4:3" galleryCount={hasGallery ? 3 : undefined} showCaption={false} />
                <p className="mt-1 text-[10px] text-[#51483d]/60">{t(hasGallery ? 'fanPlaza.detail.galleryPreview' : 'fanPlaza.detail.imagePreview')}</p>
              </div>
            )}
            {hasAudio && (
              <div>
                <PreviewArt t={t} fanKind="music" coverMode="audioVisual" ratio="4:3" hasAudio showCaption={false} />
                <p className="mt-1 text-[10px] text-[#51483d]/60">{t('fanPlaza.detail.audioPreview')}</p>
              </div>
            )}
            {hasExternalLink && (
              <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-[#2f2a22]/25 bg-white p-2 text-center text-[10px] font-bold text-[#51483d]/60">
                {t('fanPlaza.detail.externalLinkPreview')}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Related objects (emphasis) */}
      <section className="mt-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#51483d]">{t('fanPlaza.detail.relatedObjects')}</h3>
        <div className="mt-2">
          <EntityRelationList relationIds={work.relationIds} t={t} onSelectEntity={setSelectedEntityId} />
        </div>
        {selectedEntity && (
          <div className="mt-2 rounded-md border border-dashed border-[#2f2a22]/25 bg-white p-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8a5a4a]">{t('fanPlaza.detail.entityPreview')}</div>
            <LinkableEntityCard entity={selectedEntity} t={t} />
          </div>
        )}
      </section>

      {/* Related Workshop content (association only) */}
      {relatedWorkshopItems.length > 0 && (
        <section className="mt-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#51483d]">{t('fanPlaza.detail.relatedWorkshop')}</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {relatedWorkshopItems.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-md border border-[#2f2a22]/12 bg-white">
                <PreviewArt t={t} workshopKind={item.previewImageKind} ratio="16:9" showCaption={false} />
                <div className="p-2">
                  <p className="truncate text-[11px] font-bold text-[#17130f]">{localized(item.title, locale)}</p>
                  <p className="text-[10px] text-[#51483d]/60">{t(`fanPlaza.system.${item.system}`)}</p>
                  <button type="button" className="mt-1 border border-dashed border-[#2f2a22]/30 px-2 py-0.5 text-[10px] font-bold text-[#51483d]/60">
                    {t('fanPlaza.detail.openWorkshopReserved')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#51483d]/55">{t('fanPlaza.workshop.note')}</p>
        </section>
      )}

      {/* Share code / public path */}
      <section className="mt-3 rounded-md border border-[#2f2a22]/12 bg-white p-3">
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-[#51483d]/80">
          <span><span className="font-bold">{t('fanPlaza.shareCode')}：</span>{work.shareCode}</span>
          <span><span className="font-bold">{t('fanPlaza.publicPath')}：</span>{work.publicPathLabel}</span>
          <span><span className="font-bold">{t('fanPlaza.visibilityLabel')}：</span>{t(`fanPlaza.workVisibility.${work.visibility}`)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">{t('fanPlaza.actions.copyLinkReserved')}</button>
          <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">{t('fanPlaza.actions.openPublicReserved')}</button>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[#51483d]/70">{t('fanPlaza.permissionBoundary')}</p>
      </section>

      {/* Reserved engagement + author other works */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">{t('fanPlaza.detail.likeReserved')}（{work.likeCount}）</button>
        <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">{t('fanPlaza.detail.favoriteReserved')}（{work.favoriteCount}）</button>
        <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">{t('fanPlaza.detail.commentReserved')}（{work.commentCount}）</button>
        <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">{t('fanPlaza.detail.authorWorksReserved')}</button>
      </div>
    </div>
  );
}
