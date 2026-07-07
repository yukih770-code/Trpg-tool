/**
 * DocumentLibraryShell
 * AI-LANDMARK: MINIMAL_LIVE_OBJECT_DOCUMENT_SLICE_V1
 *
 * Minimal read-only "Live Object Document" entry point: a BlockDocument list +
 * reader that exercises the full A1–A8 stack (EntityGraph, BlockDocument,
 * Repository/PlatformDataService, Projection, MediaAsset, Summary/Detail loading).
 *
 * Includes a mock viewer toggle (anonymous vs owner) to demonstrate that
 * projection is enforced in the Service layer, not in the UI. No editor, no
 * publish, no upload, no backend.
 */
import { useState } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import { ANONYMOUS_VIEWER } from '../../lib/architecture/projection';
// P5.4: the owner viewer is the REAL local anonymous user (P5.1), no longer the
// hardcoded 'author-sample'. Seed docs stay visible via read-time owner aliasing.
import { getCurrentLocalViewerContext } from '../../lib/platform/localViewerIdentity';
import { BlockDocumentList } from './BlockDocumentList';
import { BlockDocumentReader } from './BlockDocumentReader';

export type DocumentLibraryShellProps = {
  locale: Locale;
  /** Back to source (Navigation & Exit Contract — full page uses a single ← 返回). */
  onBack: () => void;
};

export function DocumentLibraryShell({ locale, onBack }: DocumentLibraryShellProps) {
  const { t } = createTranslator(locale);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [asOwner, setAsOwner] = useState<boolean>(false);

  const viewer = asOwner ? getCurrentLocalViewerContext() : ANONYMOUS_VIEWER;

  if (selectedDocId) {
    return (
      <div className="min-h-screen">
        <BlockDocumentReader documentId={selectedDocId} viewer={viewer} t={t} onBack={() => setSelectedDocId(null)} />
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 rounded-md border border-[#2f2a22]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#17130f] transition hover:bg-[#2f2a22]/8"
      >
        ← {locale === 'en' ? 'Back' : '返回'}
      </button>
      <header>
        <h1 className="text-2xl font-bold">文档资料 · Live Object Document</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#51483d]">
          最小只读切片：BlockDocument 通过 Repository / PlatformDataService 加载并渲染，
          对象 / 媒体引用经投影解析，原图不在列表 / 详情默认加载。
        </p>
      </header>

      {/* Mock viewer toggle — demonstrates Service-layer projection */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-[#51483d]">查看身份：</span>
        <button
          type="button"
          onClick={() => setAsOwner(false)}
          className={`rounded border px-2.5 py-1 text-[11px] font-bold transition ${
            !asOwner ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d]'
          }`}
        >
          匿名访客
        </button>
        <button
          type="button"
          onClick={() => setAsOwner(true)}
          className={`rounded border px-2.5 py-1 text-[11px] font-bold transition ${
            asOwner ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d]'
          }`}
        >
          本地用户（本人）
        </button>
        <span className="text-[10px] text-[#51483d]/55">
          （切换身份会改变可见文档与对象——投影在 Service 层执行）
        </span>
      </div>

      <div className="mt-5">
        <BlockDocumentList viewer={viewer} t={t} onOpen={setSelectedDocId} />
      </div>
    </main>
  );
}
