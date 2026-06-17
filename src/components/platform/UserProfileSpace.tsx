/**
 * UserProfileSpace  ·  用户主页空间
 * AI-LANDMARK: USER_PROFILE_SPACE_V1
 *
 * Minimal VISITOR SHOWCASE view of a user's public content. Distinct from the
 * Personal Content Hub:
 *   PersonalContentHub = owner MANAGEMENT mode (ownerProjection)
 *   UserProfileSpace   = visitor SHOWCASE mode (public/unlisted/owner-preview)
 *
 * Object details open here as a profile DETAIL STATE (profileUserId + section +
 * selectedEntityId + viewerContext), not an isolated popup. All data comes from
 * PlatformDataService (projection-enforced). No seed import, no UI-side filtering.
 * This round renders a placeholder detail state (the routable contract); full
 * per-type detail rendering lands in later rounds.
 */
import { useState } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import { ANONYMOUS_VIEWER, type ViewerContext } from '../../lib/architecture/projection';
import { platformDataService } from '../../lib/architecture/repositoryServices';
import { USER_PROFILE_SECTIONS, type UserProfileSection } from '../../lib/platform/userProfile';
import type { PersonalContentSummary } from '../../lib/platform/personalContent';

export type UserProfileSpaceProps = {
  profileUserId: string;
  locale: Locale;
  /** Back to source (Navigation & Exit Contract — full page uses a single ← 返回). */
  onBack: () => void;
};

const SECTION_LABEL: Record<UserProfileSection, string> = {
  overview: '概览',
  characters: '角色',
  campaigns: '战役 / 世界观',
  documents: '文档',
  fanWorks: '同人作品',
  workshopPackages: '创意工坊',
  media: '媒体',
  collections: '合集',
};

const KIND_LABEL: Record<PersonalContentSummary['kind'], string> = {
  document: '文档',
  fanWork: '作品',
  package: '内容包',
  entity: '对象',
};

export function UserProfileSpace({ profileUserId, locale, onBack }: UserProfileSpaceProps) {
  const { t } = createTranslator(locale);
  const [section, setSection] = useState<UserProfileSection>('overview');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [asOwnerPreview, setAsOwnerPreview] = useState<boolean>(false);

  const viewer: ViewerContext = asOwnerPreview ? { role: 'owner', userId: profileUserId } : ANONYMOUS_VIEWER;

  const profile = platformDataService.getProfile(profileUserId, viewer);

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="mb-4 inline-flex items-center gap-1 rounded-md border border-[#2f2a22]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#17130f] transition hover:bg-[#2f2a22]/8"
    >
      ← {locale === 'en' ? 'Back' : '返回'}
    </button>
  );

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        {backButton}
        <div className="rounded-lg border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-6 text-center text-sm text-[#51483d]/70">
          该用户主页不存在或不公开（当前身份的可见性投影为「拒绝」）。
        </div>
      </main>
    );
  }

  const sectionItems = platformDataService.listProfileSectionItems(profileUserId, section, viewer);
  const pinned = profile.pinned
    .map((slot) => platformDataService.getEntitySummary(slot.entityId, viewer).summary)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const routeTarget = selectedEntityId ? platformDataService.resolveEntityProfileTarget(selectedEntityId, viewer) : null;

  const itemCard = (item: PersonalContentSummary) => (
    <button
      key={`${item.kind}-${item.id}`}
      type="button"
      onClick={() => setSelectedEntityId(item.id)}
      className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 text-left shadow-sm transition hover:border-[#17130f]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold leading-snug text-[#17130f]">{item.title}</h3>
        <span className="shrink-0 border border-[#2f2a22]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/70">{KIND_LABEL[item.kind]}</span>
      </div>
      {item.subtitle && <p className="mt-0.5 text-[11px] text-[#51483d]/70">{item.subtitle}</p>}
      {item.visibility && (
        <span className="mt-2 w-fit border border-[#2f2a22]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]">
          {t(`fanPlaza.visibility.${item.visibility}`)}
        </span>
      )}
    </button>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      {backButton}
      {/* Profile header */}
      <header className="rounded-lg border border-[#2f2a22]/15 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#17130f]">{profile.displayName}</h1>
            <p className="text-[12px] text-[#51483d]/70">@{profile.handle}</p>
            {profile.bio && <p className="mt-2 max-w-2xl text-sm text-[#51483d]">{profile.bio}</p>}
            {profile.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {profile.tags.map((tag) => (
                  <span key={tag} className="border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/70">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="border border-[#2f2a22]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]">
              {t(`fanPlaza.visibility.${profile.visibility}`)}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setAsOwnerPreview(false)}
                className={`rounded border px-2 py-0.5 text-[10px] font-bold ${!asOwnerPreview ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d]'}`}
              >
                访客
              </button>
              <button
                type="button"
                onClick={() => setAsOwnerPreview(true)}
                className={`rounded border px-2 py-0.5 text-[10px] font-bold ${asOwnerPreview ? 'border-[#17130f] bg-[#17130f] text-white' : 'border-[#2f2a22]/20 text-[#51483d]'}`}
              >
                本人预览
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Section tabs */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-[#2f2a22]/12 pb-2">
        {USER_PROFILE_SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setSection(s); setSelectedEntityId(null); }}
            className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${section === s ? 'bg-[#17130f] text-white' : 'text-[#51483d] hover:bg-[#2f2a22]/8'}`}
          >
            {SECTION_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Selected entity detail state (routable contract placeholder) */}
      {routeTarget && (
        <section className="mt-5 rounded-lg border-2 border-[#17130f]/20 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-[#17130f]">对象详情状态</h2>
            <button type="button" onClick={() => setSelectedEntityId(null)} className="border border-[#2f2a22]/20 px-2 py-0.5 text-[11px] font-bold text-[#51483d] hover:border-[#17130f]">关闭</button>
          </div>
          <p className="mt-2 text-sm text-[#51483d]">该对象将作为用户主页中的正式详情状态打开（后续按 detailMode 渲染完整详情）。</p>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-[#51483d]">
            <div><span className="font-bold">profileUserId：</span>{routeTarget.profileUserId}</div>
            <div><span className="font-bold">section：</span>{routeTarget.section}</div>
            <div><span className="font-bold">entityId：</span>{routeTarget.entityId}</div>
            <div><span className="font-bold">entityType：</span>{routeTarget.entityType}</div>
            <div><span className="font-bold">detailMode：</span>{routeTarget.detailMode}</div>
            <div><span className="font-bold">viewer：</span>{viewer.role}</div>
          </div>
        </section>
      )}

      {/* Section content */}
      <div className="mt-5">
        {section === 'overview' ? (
          pinned.length > 0 ? (
            <>
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#51483d]">置顶内容</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinned.map((p) => (
                  <button key={p.id} type="button" onClick={() => setSelectedEntityId(p.id)} className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 text-left shadow-sm transition hover:border-[#17130f]/40 hover:shadow-md">
                    <h3 className="text-[14px] font-bold leading-snug text-[#17130f]">{p.title}</h3>
                    <span className="mt-1 w-fit border border-[#2f2a22]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/70">{t(`fanPlaza.entityType.${entityTypeKey(p.type)}`)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#51483d]/60">暂无公开置顶内容。</p>
          )
        ) : sectionItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{sectionItems.map(itemCard)}</div>
        ) : (
          <p className="rounded-lg border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-6 text-center text-sm text-[#51483d]/60">
            该栏目暂无公开内容（角色 / 战役 / 媒体 / 合集栏目将在后续 A10.8+ 接入）。
          </p>
        )}
      </div>

      <p className="mt-6 text-[10px] leading-relaxed text-[#51483d]/45">
        用户主页是聚合视图（showcase 态），不是真相源；对象数据仍由各 Repository 拥有，按 Projection 决定访客可见内容。
      </p>
    </main>
  );
}

/** Map canonical EntityTypes back to existing fanPlaza.entityType i18n leaves. */
function entityTypeKey(type: string): string {
  if (type === 'workshopPackage') return 'workshopItem';
  if (type === 'mediaAsset') return 'music';
  if (type === 'blockDocument') return 'handout';
  return type;
}
