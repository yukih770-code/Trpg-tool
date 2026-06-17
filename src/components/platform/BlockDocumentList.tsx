/**
 * BlockDocumentList
 * AI-LANDMARK: MINIMAL_LIVE_OBJECT_DOCUMENT_SLICE_V1
 *
 * Lists BlockDocument summaries from PlatformDataService (projection-filtered).
 * No seed import. Summary-level only — no block bodies, no media originals.
 */
import type { ViewerContext } from '../../lib/architecture/projection';
import { platformDataService } from '../../lib/architecture/repositoryServices';

export type BlockDocumentListProps = {
  viewer: ViewerContext;
  t: (key: string) => string;
  onOpen: (documentId: string) => void;
};

export function BlockDocumentList({ viewer, t, onOpen }: BlockDocumentListProps) {
  const docs = platformDataService.listDocuments(viewer);

  if (docs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-6 text-center text-sm text-[#51483d]/60">
        当前身份下没有可见的文档。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc) => (
        <button
          key={doc.id}
          type="button"
          onClick={() => onOpen(doc.id)}
          className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 text-left shadow-sm transition hover:border-[#17130f]/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-bold leading-snug text-[#17130f]">{doc.title}</h3>
            <span className="shrink-0 border border-[#2f2a22]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]">
              {t(`fanPlaza.visibility.${doc.visibility}`)}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#51483d]">{doc.summary}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {doc.blockTypeSummary.map((kind) => (
              <span key={kind} className="rounded bg-[#2f2a22]/6 px-1.5 py-0.5 text-[10px] font-bold text-[#51483d]/80">
                {kind}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[#51483d]/55">{doc.updatedAt}</p>
        </button>
      ))}
    </div>
  );
}
