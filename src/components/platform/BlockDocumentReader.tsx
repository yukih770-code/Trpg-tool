/**
 * BlockDocumentReader
 * AI-LANDMARK: MINIMAL_LIVE_OBJECT_DOCUMENT_SLICE_V1
 *
 * Read-only Live Object Document reader. All data comes from PlatformDataService
 * (projection-enforced): document detail (gated by visibility), referenced
 * entities/media/packages. No seed import, no hand-written relation scanning,
 * no UI-side projection filtering.
 */
import { useState } from 'react';
import type { ViewerContext } from '../../lib/architecture/projection';
import { platformDataService } from '../../lib/architecture/repositoryServices';
import { BlockRenderer } from './BlockRenderer';
import { LinkableEntityCard } from './LinkableEntityCard';

export type BlockDocumentReaderProps = {
  documentId: string;
  viewer: ViewerContext;
  t: (key: string) => string;
  onBack: () => void;
};

export function BlockDocumentReader({ documentId, viewer, t, onBack }: BlockDocumentReaderProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const detail = platformDataService.getDocumentDetail(documentId, viewer);

  const backBtn = (
    <button
      type="button"
      onClick={onBack}
      className="mb-4 inline-flex items-center gap-1 rounded-md border border-[#2f2a22]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#17130f] transition hover:bg-[#2f2a22]/8"
    >
      ← 返回文档列表
    </button>
  );

  if (!detail) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
        {backBtn}
        <div className="rounded-lg border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-6 text-center text-sm text-[#51483d]/70">
          你没有权限查看此文档，或文档不存在（当前身份的可见性投影为「拒绝」）。
        </div>
      </main>
    );
  }

  const referencedEntities = platformDataService.getDocumentReferencedEntities(documentId, viewer);
  const referencedMedia = platformDataService.getDocumentReferencedMedia(documentId, viewer);
  const relatedPackages = platformDataService.getPackagesByDocument(documentId, viewer);
  const selectedEntity = selectedEntityId
    ? platformDataService.getEntitySummary(selectedEntityId, viewer).summary
    : undefined;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8">
      {backBtn}

      <header className="border-b border-[#2f2a22]/12 pb-3">
        <h1 className="text-2xl font-bold text-[#17130f]">{detail.title}</h1>
        <p className="mt-1 text-[11px] text-[#51483d]/70">{detail.summary}</p>
        <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
          <span className="border border-[#2f2a22]/20 px-1.5 py-0.5 font-bold text-[#51483d]">
            可见性：{t(`fanPlaza.visibility.${detail.visibility}`)}
          </span>
          <span className="border border-[#2f2a22]/15 px-1.5 py-0.5 text-[#51483d]/70">{detail.updatedAt}</span>
        </div>
      </header>

      {/* Body blocks */}
      <article className="mt-4 flex flex-col gap-3">
        {detail.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} viewer={viewer} t={t} onSelectEntity={setSelectedEntityId} />
        ))}
      </article>

      {/* Selected entity preview (from an entityMention / entityCard click) */}
      {selectedEntity && (
        <section className="mt-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8a5a4a]">对象预览</h2>
          <LinkableEntityCard entity={selectedEntity} t={t} />
        </section>
      )}

      {/* Related objects */}
      {referencedEntities.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#51483d]">相关对象</h2>
          <div className="flex flex-col gap-2">
            {referencedEntities.map((projected, i) =>
              projected.summary ? (
                <LinkableEntityCard key={projected.summary.id} entity={projected.summary} t={t} onView={setSelectedEntityId} />
              ) : (
                <div key={`denied-${i}`} className="rounded-md border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-2 text-[11px] text-[#51483d]/60">
                  无权限查看的关联对象（投影：{projected.projection}）
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {/* Related media */}
      {referencedMedia.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#51483d]">相关媒体</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {referencedMedia.map((media) => (
              <div key={media.id} className="overflow-hidden rounded-md border border-[#2f2a22]/15 bg-white">
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#2f2a22]/10 to-[#2f2a22]/25 text-[10px] font-bold uppercase tracking-wider text-[#51483d]/70">
                  {media.placeholderKind ?? media.kind}
                </div>
                <p className="truncate p-1.5 text-[10px] text-[#51483d]/70">{media.title ?? media.altText ?? media.id}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Workshop packages */}
      {relatedPackages.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#51483d]">相关创意工坊内容</h2>
          <div className="flex flex-col gap-1.5">
            {relatedPackages.map((pkg) => (
              <div key={pkg.packageId} className="rounded-md border border-[#2f2a22]/12 bg-white p-2.5">
                <p className="text-[12px] font-bold text-[#17130f]">{pkg.title}</p>
                <p className="text-[10px] text-[#51483d]/60">
                  {pkg.author.handle} · {pkg.version} · {pkg.entityCount} 对象 / {pkg.documentCount} 文档
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-6 text-[10px] leading-relaxed text-[#51483d]/45">
        本页为最小只读切片：所有对象 / 媒体 / 关联均经 Repository / PlatformDataService 解析并按可见性投影，原图不在此默认加载。
      </p>
    </main>
  );
}
