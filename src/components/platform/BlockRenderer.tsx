/**
 * BlockRenderer
 * AI-LANDMARK: MINIMAL_LIVE_OBJECT_DOCUMENT_SLICE_V1
 *
 * Read-only renderer for a single BlockDocument ContentBlock. V1 blocks render;
 * contract-only / unknown blocks degrade to a placeholder card (never crash).
 * Entity refs resolve via PlatformDataService.getEntitySummary; media refs via
 * PlatformDataService.getMediaSummary — the component never reads a seed or
 * inlines a title/cover/binary, and never decides projection itself.
 */
import type { ContentBlock } from '../../lib/architecture/blockDocument';
import { ENTITY_TYPE_I18N_KEY } from '../../lib/architecture/entityGraph';
import type { ViewerContext } from '../../lib/architecture/projection';
import { platformDataService } from '../../lib/architecture/repositoryServices';
import { LinkableEntityCard } from './LinkableEntityCard';

export type BlockRendererProps = {
  block: ContentBlock;
  viewer: ViewerContext;
  t: (key: string) => string;
  onSelectEntity: (entityId: string) => void;
};

const UNSUPPORTED_NOTE = '该内容块已被识别，但当前版本暂未支持完整渲染。';

function Placeholder({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-3 text-[11px] text-[#51483d]/70">
      {label}
    </div>
  );
}

function MediaPlaceholder({ mediaAssetId, viewer }: { mediaAssetId: string; viewer: ViewerContext }) {
  const summary = platformDataService.getMediaSummary(mediaAssetId, viewer);
  if (!summary) {
    return <Placeholder label="无权限查看此媒体，或媒体不存在。" />;
  }
  return (
    <div className="overflow-hidden rounded-md border border-[#2f2a22]/15 bg-white">
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#2f2a22]/10 to-[#2f2a22]/25 text-[10px] font-bold uppercase tracking-wider text-[#51483d]/70">
        {summary.placeholderKind ?? summary.kind}
      </div>
      <div className="p-1.5">
        <p className="truncate text-[11px] font-bold text-[#17130f]">{summary.title ?? summary.altText ?? mediaAssetId}</p>
        <p className="text-[10px] text-[#51483d]/55">缩略图（未加载原图）</p>
      </div>
    </div>
  );
}

export function BlockRenderer({ block, viewer, t, onSelectEntity }: BlockRendererProps) {
  switch (block.type) {
    case 'heading': {
      const size = block.level === 1 ? 'text-xl' : block.level === 2 ? 'text-base' : 'text-sm';
      return <h3 className={`font-bold leading-snug text-[#17130f] ${size}`}>{block.text}</h3>;
    }
    case 'text':
      return <p className="whitespace-pre-line text-sm leading-relaxed text-[#51483d]">{block.text.text}</p>;
    case 'callout': {
      const tone =
        block.tone === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-800'
        : block.tone === 'tip' ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
        : 'border-[#2f2a22]/20 bg-[#faf8f2] text-[#51483d]';
      return <div className={`rounded-md border-l-4 p-3 text-[13px] leading-relaxed ${tone}`}>{block.text.text}</div>;
    }
    case 'image':
      return <div className="max-w-xs"><MediaPlaceholder mediaAssetId={block.mediaAssetId} viewer={viewer} /></div>;
    case 'imageGallery':
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {block.mediaAssetIds.map((id, i) => (
            <MediaPlaceholder key={`${id}-${i}`} mediaAssetId={id} viewer={viewer} />
          ))}
        </div>
      );
    case 'entityMention': {
      const projected = platformDataService.getEntitySummary(block.ref.entityId, viewer);
      if (!projected.summary) {
        return <span className="text-[12px] text-[#51483d]/45">（无权限或不存在的对象）</span>;
      }
      return (
        <button
          type="button"
          onClick={() => onSelectEntity(block.ref.entityId)}
          className="inline-flex items-center gap-1 rounded border border-[#2f2a22]/20 bg-white px-1.5 py-0.5 text-[12px] font-bold text-[#17130f] hover:border-[#17130f]"
        >
          @{block.label ?? projected.summary.title}
          <span className="text-[10px] font-normal text-[#51483d]/55">
            {t(`fanPlaza.entityType.${ENTITY_TYPE_I18N_KEY[projected.summary.type]}`)}
          </span>
        </button>
      );
    }
    case 'entityCard': {
      const projected = platformDataService.getEntitySummary(block.ref.entityId, viewer);
      if (!projected.summary) {
        return <Placeholder label="无权限查看此关联对象，或对象不存在。" />;
      }
      return <LinkableEntityCard entity={projected.summary} t={t} onView={onSelectEntity} />;
    }
    default:
      return <Placeholder label={`${UNSUPPORTED_NOTE}（类型：${block.type}）`} />;
  }
}
