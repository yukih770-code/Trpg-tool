/**
 * PersonalContentHub  ·  我的内容 / Personal Content Hub
 * AI-LANDMARK: PERSONAL_CONTENT_HUB_V1
 *
 * Minimal read-only management surface for the user's own content assets:
 * 我的文档 / 我的作品 / 草稿 / 收藏 / 我的内容包 / 导入包. NOT a public plaza.
 * All data comes from PlatformDataService (owner-scoped). No publish, no real
 * collection write, no dependency/version/manifest exposure, no backend.
 */
import { useState } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import { type ViewerContext } from '../../lib/architecture/projection';
import { platformDataService } from '../../lib/architecture/repositoryServices';
import type {
  ImportedPackageItem,
  OwnedPackageItem,
  PackageHealthStatus,
  PersonalContentSummary,
} from '../../lib/platform/personalContent';

export type PersonalContentHubProps = {
  locale: Locale;
};

/** Mock owner identity matching the seed `ownerId / authorId: 'author-sample'`. */
const OWNER_VIEWER: ViewerContext = { role: 'owner', userId: 'author-sample' };

type HubTab = 'documents' | 'fanWorks' | 'drafts' | 'collections' | 'packages' | 'imports';

const TABS: { key: HubTab; label: string }[] = [
  { key: 'documents', label: '我的文档' },
  { key: 'fanWorks', label: '我的作品' },
  { key: 'drafts', label: '草稿' },
  { key: 'collections', label: '收藏' },
  { key: 'packages', label: '我的内容包' },
  { key: 'imports', label: '导入包' },
];

const KIND_LABEL: Record<PersonalContentSummary['kind'], string> = {
  document: '文档',
  fanWork: '作品',
  package: '内容包',
  entity: '对象',
};

const HEALTH_BADGE: Record<PackageHealthStatus, string> = {
  available: '✅ 可用',
  needsAttention: '⚠️ 需要处理',
  hasPrivateContent: '🔒 含私有内容',
  hasUnpublishedChanges: '⬆️ 有未发布修改',
};

export function PersonalContentHub({ locale }: PersonalContentHubProps) {
  const { t } = createTranslator(locale);
  const [tab, setTab] = useState<HubTab>('documents');

  const viewer = OWNER_VIEWER;

  const visibilityChip = (visibility?: string) =>
    visibility ? (
      <span className="border border-[#2f2a22]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]">
        {t(`fanPlaza.visibility.${visibility}`)}
      </span>
    ) : null;

  const summaryCard = (item: PersonalContentSummary) => (
    <div key={`${item.kind}-${item.id}`} className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold leading-snug text-[#17130f]">{item.title}</h3>
        <span className="shrink-0 border border-[#2f2a22]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/70">
          {KIND_LABEL[item.kind]}
        </span>
      </div>
      {item.subtitle && <p className="mt-0.5 text-[11px] text-[#51483d]/70">{item.subtitle}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {visibilityChip(item.visibility)}
        {item.status && (
          <span className="border border-[#2f2a22]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#51483d]/70">{item.status}</span>
        )}
        {item.updatedAt && <span className="text-[10px] text-[#51483d]/50">{item.updatedAt}</span>}
      </div>
    </div>
  );

  const packageCard = (item: OwnedPackageItem) => (
    <div key={item.id} className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold leading-snug text-[#17130f]">{item.title}</h3>
        <span className="shrink-0 text-[11px] font-bold text-[#51483d]">{HEALTH_BADGE[item.health]}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {visibilityChip(item.visibility)}
        {item.updatedAt && <span className="text-[10px] text-[#51483d]/50">{item.updatedAt}</span>}
      </div>
    </div>
  );

  const importCard = (item: ImportedPackageItem) => (
    <div key={item.id} className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold leading-snug text-[#17130f]">{item.title}</h3>
        <span className="shrink-0 text-[11px] font-bold text-[#51483d]">{HEALTH_BADGE[item.health]}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-[#51483d]/60">
        <span className="border border-[#2f2a22]/15 px-1.5 py-0.5 font-bold">来源信任：{item.sourceTrust}</span>
        <span>导入于 {item.importedAtLabel}</span>
      </div>
    </div>
  );

  const emptyState = (label: string) => (
    <div className="rounded-lg border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-6 text-center text-sm text-[#51483d]/60">
      {label}
    </div>
  );

  const renderTab = () => {
    switch (tab) {
      case 'documents': {
        const items = platformDataService.listMyDocuments(viewer);
        return items.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(summaryCard)}</div> : emptyState('还没有文档。');
      }
      case 'fanWorks': {
        const items = platformDataService.listMyFanWorks(viewer);
        return items.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(summaryCard)}</div> : emptyState('还没有作品。');
      }
      case 'drafts': {
        const items = platformDataService.listMyDrafts(viewer);
        return items.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(summaryCard)}</div> : emptyState('没有草稿。');
      }
      case 'collections': {
        const items = platformDataService.listMyCollections(viewer);
        return items.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(summaryCard)}</div> : emptyState('还没有收藏。');
      }
      case 'packages': {
        const items = platformDataService.listMyPackages(viewer);
        return items.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(packageCard)}</div> : emptyState('还没有内容包。');
      }
      case 'imports': {
        const items = platformDataService.listImportedPackages(viewer);
        return items.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map(importCard)}</div> : emptyState('还没有导入包。');
      }
      default:
        return null;
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <header>
        <h1 className="text-2xl font-bold">{locale === 'en' ? 'My Content' : '我的内容'}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#51483d]">
          个人内容资产管理入口（非公开广场）。所有数据经 Repository / PlatformDataService 按归属与可见性解析；本轮只读，不做真实发布 / 收藏写入。
        </p>
      </header>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-[#2f2a22]/12 pb-2">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            onClick={() => setTab(tabDef.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${
              tab === tabDef.key ? 'bg-[#17130f] text-white' : 'text-[#51483d] hover:bg-[#2f2a22]/8'
            }`}
          >
            {tabDef.label}
          </button>
        ))}
      </div>

      <div className="mt-5">{renderTab()}</div>
    </main>
  );
}
