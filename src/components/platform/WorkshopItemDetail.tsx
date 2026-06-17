/**
 * WorkshopItemDetail
 * AI-LANDMARK: WORKSHOP_FAN_PLAZA_DEDICATED_DETAIL_PAGES_V1
 *
 * Dedicated, immersive detail view for one Workshop item (entered from a card,
 * NOT an inline list expansion). Hero cover + image gallery + long description +
 * metadata + version / dependency / impact / landing / includes + related fan
 * works / actors / campaigns / logs + reserved load-order / changelog / comments
 * / author-works / share interfaces. Static read only — no real subscription,
 * download, routing, or backend.
 */
import type { Locale } from '../../i18n';
import {
  WORKSHOP_LANDING_MAP,
  localized,
  workshopPreviewKind,
  type WorkshopBrowseItem,
} from '../../lib/platform/workshopTypes';
import type { FanWork } from '../../lib/platform/communityTypes';
import { platformRepo } from '../../lib/architecture/repositoryComposition';
import { LINKABLE_OBJECT_TYPES, type EntityNode, type EntityType } from '../../lib/architecture/entityGraph';
import { PreviewArt } from './PreviewArt';

export type WorkshopItemDetailProps = {
  item: WorkshopBrowseItem;
  t: (key: string) => string;
  locale: Locale;
  onBack: () => void;
};

export function WorkshopItemDetail({ item, t, locale, onBack }: WorkshopItemDetailProps) {
  const allLabel = t('workshop.filter.all');
  const categoryLabel = (cat: string) => (cat === 'all' ? allLabel : t(`workshop.category.${cat}`));
  const systemLabel = (sys: string) => (sys === 'all' ? allLabel : t(`workshop.filter.adaptedSystem.${sys}`));
  const subtypeLabel = (sub: string) => (sub === 'all' ? allLabel : t(`workshop.filter.subtype.${sub}`));
  const shapeLabel = (shape: string) => (shape === 'all' ? allLabel : t(`workshop.filter.contentShape.${shape}`));
  const attrTagLabel = (tag: string) => (tag === 'all' ? allLabel : t(`workshop.filter.attributeTag.${tag}`));
  const impactScopeLabel = (scope: string) => t(`workshop.impactScope.${scope}`);
  const depStatusLabel = (dep: string) => t(`workshop.dependencyStatus.${dep}`);

  const landingTarget = WORKSHOP_LANDING_MAP[item.category];
  const landingText =
    landingTarget === 'systemRuleSources'
      ? `${systemLabel(item.system)} → ${t('workshop.landing.systemRuleSources')}`
      : t(`workshop.landing.${landingTarget}`);

  const slug = item.id.replace(/^sample\./, '');
  const shareCode = `WS-${slug.toUpperCase()}`;
  const publicPath = `/share/workshop/${slug}`;

  // Related content (association display only) — resolved via the EntityGraph.
  const relatedFanWorkNodes = platformRepo.entityGraph.getRelatedFanWorks(item.id);
  const relatedFanWorks: FanWork[] = relatedFanWorkNodes
    .map((node) => platformRepo.fanWorks.getById(node.id))
    .filter((w): w is FanWork => Boolean(w));

  const objectRelations = relatedFanWorkNodes.flatMap((node) =>
    platformRepo.entityGraph.getRelatedEntities(node.id, {
      direction: 'outgoing',
      types: LINKABLE_OBJECT_TYPES,
    }),
  );
  const collect = (type: EntityType): EntityNode[] => {
    const seen = new Set<string>();
    const out: EntityNode[] = [];
    for (const rel of objectRelations) {
      if (rel.entity.type === type && !seen.has(rel.entity.id)) {
        seen.add(rel.entity.id);
        out.push(rel.entity);
      }
    }
    return out;
  };
  const relatedActors = collect('actor');
  const relatedCampaigns = collect('campaign');
  const relatedLogs = collect('sessionLog');

  const metaRow = (labelKey: string, value: string) => (
    <div className="flex justify-between gap-3 border-b border-[#2f2a22]/8 py-1.5 last:border-b-0">
      <span className="text-[11px] font-bold text-[#51483d]">{t(labelKey)}</span>
      <span className="text-right text-[11px] text-[#51483d]/80">{value}</span>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 rounded-md border border-[#2f2a22]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#17130f] transition hover:bg-[#2f2a22]/8"
      >
        ← {t('workshop.detail.back')}
      </button>

      {/* Hero */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div>
          <PreviewArt
            t={t}
            workshopKind={workshopPreviewKind(item)}
            accent={item.previewAccent}
            ratio="16:9"
            galleryCount={item.galleryPreviewKinds?.length}
            hasAudio={workshopPreviewKind(item) === 'music'}
          />
          {/* Gallery */}
          {item.galleryPreviewKinds && item.galleryPreviewKinds.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#51483d]/50">{t('workshop.detail.gallery')}</p>
              <div className="grid grid-cols-4 gap-2">
                {item.galleryPreviewKinds.slice(0, 4).map((kind, i) => (
                  <PreviewArt key={`${kind}-${i}`} t={t} workshopKind={kind} ratio="4:3" showCaption={false} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Title + meta + subscribe */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded border border-[#2f2a22]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#51483d]">
              {categoryLabel(item.category)}
            </span>
            <span className="rounded border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/70">{systemLabel(item.system)}</span>
            <span className="rounded border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/70">{shapeLabel(item.contentShape)}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-[#17130f]">{localized(item.title, locale)}</h1>
          <p className="mt-1 text-[12px] text-[#51483d]">
            <span className="font-bold">{t('workshop.card.author')}：</span>{item.author}
          </p>

          {item.attributeTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.attributeTags.map((tag) => (
                <span key={tag} className="rounded border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/70">{attrTagLabel(tag)}</span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="border border-dashed border-[#2f2a22]/30 px-3 py-1.5 text-xs font-bold text-[#51483d]/70">
              {t('workshop.card.subscribeReserved')}
            </button>
          </div>

          {/* Tool info card */}
          <div className="mt-3 rounded-lg border border-[#2f2a22]/12 bg-[#faf8f2] p-3">
            {metaRow('workshop.detail.versionInfo', item.version)}
            {metaRow('workshop.card.lastUpdated', item.lastUpdatedLabel)}
            {metaRow('workshop.detail.dependencies', depStatusLabel(item.dependencyStatus))}
            {metaRow('workshop.detail.impactScope', impactScopeLabel(item.impactScope))}
            {metaRow('workshop.detail.landing', landingText)}
            {item.subtype && metaRow('workshop.card.subtype', subtypeLabel(item.subtype))}
            <div className="mt-1.5 flex flex-wrap gap-2 pt-1.5">
              <span className="text-[10px] text-[#51483d]/50">{t('workshop.detail.loadOrderReserved')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Long description */}
      <section className="mt-5">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#51483d]">{t('workshop.detail.longDescription')}</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#51483d]">{localized(item.description, locale)}</p>
        <p className="mt-2 text-[10px] leading-relaxed text-[#51483d]/45">{t('workshop.card.detailStructureNote')}</p>
      </section>

      {/* Includes */}
      {item.contains && item.contains.length > 0 && (
        <section className="mt-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#51483d]">{t('workshop.detail.includes')}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.contains.map((cat) => (
              <span key={cat} className="rounded border border-[#2f2a22]/15 px-2 py-0.5 text-[11px] text-[#51483d]/75">{categoryLabel(cat)}</span>
            ))}
          </div>
        </section>
      )}

      {/* Related fan works */}
      <section className="mt-5 border-t border-[#2f2a22]/10 pt-4">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-[#51483d]">{t('workshop.card.relatedFanWorks')}</h2>
        {relatedFanWorks.length === 0 ? (
          <p className="mt-1 text-[11px] text-[#51483d]/50">{t('workshop.card.noRelatedFanWorks')}</p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {relatedFanWorks.map((fw) => (
              <div key={fw.id} className="overflow-hidden rounded-md border border-[#2f2a22]/12 bg-white">
                <PreviewArt t={t} fanKind={fw.coverKind ?? fw.type} ratio="4:3" showCaption={false} />
                <div className="p-1.5">
                  <p className="truncate text-[11px] font-bold text-[#17130f]">{fw.title}</p>
                  <p className="text-[10px] text-[#51483d]/60">{t(`fanPlaza.workType.${fw.type}`)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {(relatedActors.length > 0 || relatedCampaigns.length > 0 || relatedLogs.length > 0) && (
          <div className="mt-3 flex flex-col gap-1.5">
            {([
              ['workshop.card.relatedActors', relatedActors],
              ['workshop.card.relatedCampaigns', relatedCampaigns],
              ['workshop.card.relatedLogs', relatedLogs],
            ] as const).map(([labelKey, entities]) =>
              entities.length > 0 ? (
                <div key={labelKey} className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] font-bold text-[#51483d]">{t(labelKey)}：</span>
                  {entities.map((e) => (
                    <span key={e.id} className="rounded border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/75">{e.title}</span>
                  ))}
                </div>
              ) : null,
            )}
          </div>
        )}
        <p className="mt-2 text-[10px] leading-relaxed text-[#51483d]/45">{t('fanPlaza.workshop.note')}</p>
      </section>

      {/* Share code / public path */}
      <section className="mt-4 rounded-md border border-[#2f2a22]/12 bg-white p-3">
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-[#51483d]/80">
          <span><span className="font-bold">{t('fanPlaza.shareCode')}：</span>{shareCode}</span>
          <span><span className="font-bold">{t('fanPlaza.publicPath')}：</span>{publicPath}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">{t('fanPlaza.actions.copyLinkReserved')}</button>
          <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">{t('fanPlaza.actions.openPublicReserved')}</button>
        </div>
      </section>

      {/* Changelog / comments / author works / related recommend — reserved */}
      <section className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-dashed border-[#2f2a22]/25 bg-white p-3 text-[11px] font-bold text-[#51483d]/60">{t('workshop.detail.changelogReserved')}</div>
        <div className="rounded-md border border-dashed border-[#2f2a22]/25 bg-white p-3 text-[11px] font-bold text-[#51483d]/60">{t('workshop.detail.commentsReserved')}</div>
        <div className="rounded-md border border-dashed border-[#2f2a22]/25 bg-white p-3 text-[11px] font-bold text-[#51483d]/60">{t('workshop.detail.authorWorksReserved')}</div>
        <div className="rounded-md border border-dashed border-[#2f2a22]/25 bg-white p-3 text-[11px] font-bold text-[#51483d]/60">{t('workshop.detail.relatedRecommendReserved')}</div>
      </section>
    </div>
  );
}
