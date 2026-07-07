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
// P5.4: detect "my own profile" via the real local anonymous user (P5.1).
import { getCurrentLocalProfileUserId } from '../../lib/platform/localViewerIdentity';
import { platformDataService } from '../../lib/architecture/repositoryServices';
import { USER_PROFILE_SECTIONS, type UserProfileSection } from '../../lib/platform/userProfile';
import type { PersonalContentSummary } from '../../lib/platform/personalContent';

export type UserProfileSpaceProps = {
  profileUserId: string;
  locale: Locale;
  /** Back to source (Navigation & Exit Contract — full page uses a single ← 返回). */
  onBack: () => void;
  /** Open the owner's private repository-management surface. */
  onOpenPersonalHub?: () => void;
};

const SECTION_LABEL: Record<Locale, Record<UserProfileSection, string>> = {
  'zh-CN': {
    overview: '概览',
    characters: '角色',
    campaigns: '战役 / 世界观',
    documents: '文档',
    fanWorks: '同人作品',
    workshopPackages: '创意工坊',
    media: '媒体',
    collections: '合集',
  },
  en: {
    overview: 'Overview',
    characters: 'Characters',
    campaigns: 'Campaigns / Worlds',
    documents: 'Documents',
    fanWorks: 'Fan Works',
    workshopPackages: 'Workshop',
    media: 'Media',
    collections: 'Collections',
  },
};

const KIND_LABEL: Record<Locale, Record<PersonalContentSummary['kind'], string>> = {
  'zh-CN': {
    document: '文档',
    fanWork: '作品',
    package: '内容包',
    entity: '对象',
  },
  en: {
    document: 'Document',
    fanWork: 'Work',
    package: 'Package',
    entity: 'Object',
  },
};

const PROFILE_COPY = {
  'zh-CN': {
    publicProfile: '公开主页',
    visitor: '访客',
    ownerPreview: '本人预览',
    editProfile: '编辑资料',
    manageLibrary: '管理我的资料库',
    follow: '关注',
    reserved: '接口预留',
    publicCharacters: '公开角色',
    publicCampaigns: '公开战役 / 世界观',
    fanWorks: '同人作品',
    workshop: '创意工坊内容',
    collections: '合集',
    pinned: '置顶内容',
    representative: '最近公开 / 代表作',
    noPinned: '暂无公开置顶内容。',
    noSection: '该栏目暂无公开内容（角色 / 战役 / 媒体 / 合集栏目将在后续接入）。',
    projectionNote: '用户主页是聚合视图，不是真相源；对象数据仍由各 Repository 拥有，按 Projection 决定访客可见内容。',
    missing: '该用户主页不存在或不公开（当前身份的可见性投影为「拒绝」）。',
    detailState: '对象详情状态',
    detailStateDescription: '该对象将作为用户主页中的正式详情状态打开（后续按 detailMode 渲染完整详情）。',
    close: '关闭',
  },
  en: {
    publicProfile: 'Public Profile',
    visitor: 'Visitor',
    ownerPreview: 'Owner Preview',
    editProfile: 'Edit Profile',
    manageLibrary: 'Manage My Library',
    follow: 'Follow',
    reserved: 'Reserved',
    publicCharacters: 'Public Characters',
    publicCampaigns: 'Public Campaigns / Worlds',
    fanWorks: 'Fan Works',
    workshop: 'Workshop Items',
    collections: 'Collections',
    pinned: 'Pinned',
    representative: 'Recently Public / Featured',
    noPinned: 'No public pinned items yet.',
    noSection: 'No public items in this section yet. Characters, campaigns, media, and collections will connect in later phases.',
    projectionNote: 'User profiles are aggregate showcase projections, not truth sources. Objects remain owned by their repositories and visitor visibility is decided by Projection.',
    missing: 'This profile does not exist or is not public for the current viewer projection.',
    detailState: 'Object Detail State',
    detailStateDescription: 'This object will open as a real profile detail state later, rendered by detailMode.',
    close: 'Close',
  },
} as const;

type ProfileStat = {
  key: string;
  label: string;
  value: number;
};

export function UserProfileSpace({ profileUserId, locale, onBack, onOpenPersonalHub }: UserProfileSpaceProps) {
  const { t } = createTranslator(locale);
  const [section, setSection] = useState<UserProfileSection>('overview');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [asOwnerPreview, setAsOwnerPreview] = useState<boolean>(false);
  const copy = PROFILE_COPY[locale];
  const sectionLabel = SECTION_LABEL[locale];
  const kindLabel = KIND_LABEL[locale];

  // P5.4: when viewing your OWN profile (the local anonymous user), you are the
  // owner by default — otherwise a private local profile would render as missing.
  // Other profiles keep the anonymous-visitor default + the owner-preview toggle.
  const isSelfProfile = profileUserId === getCurrentLocalProfileUserId();
  const viewer: ViewerContext =
    asOwnerPreview || isSelfProfile ? { role: 'owner', userId: profileUserId } : ANONYMOUS_VIEWER;

  const profile = platformDataService.getProfile(profileUserId, viewer);

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      aria-label={locale === 'en' ? 'Back' : '返回'}
      title={locale === 'en' ? 'Back' : '返回'}
      className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2f2a22]/20 bg-white text-sm font-bold text-[#17130f] transition hover:bg-[#2f2a22]/8"
    >
      ←
    </button>
  );

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
        {backButton}
        <div className="rounded-lg border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-6 text-center text-sm text-[#51483d]/70">
          {copy.missing}
        </div>
      </main>
    );
  }

  const sectionCounts = USER_PROFILE_SECTIONS.reduce<Record<UserProfileSection, number>>((acc, s) => {
    acc[s] = s === 'overview' ? profile.pinned.length : platformDataService.listProfileSectionItems(profileUserId, s, viewer).length;
    return acc;
  }, {} as Record<UserProfileSection, number>);
  const sectionItems = platformDataService.listProfileSectionItems(profileUserId, section, viewer);
  const pinned = profile.pinned
    .map((slot) => platformDataService.getEntitySummary(slot.entityId, viewer).summary)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const routeTarget = selectedEntityId ? platformDataService.resolveEntityProfileTarget(selectedEntityId, viewer) : null;
  const representativeItems = [
    ...platformDataService.listProfileSectionItems(profileUserId, 'fanWorks', viewer),
    ...platformDataService.listProfileSectionItems(profileUserId, 'workshopPackages', viewer),
    ...platformDataService.listProfileSectionItems(profileUserId, 'documents', viewer),
  ].slice(0, 3);
  const stats: ProfileStat[] = [
    { key: 'characters', label: copy.publicCharacters, value: sectionCounts.characters },
    { key: 'campaigns', label: copy.publicCampaigns, value: sectionCounts.campaigns },
    { key: 'fanWorks', label: copy.fanWorks, value: sectionCounts.fanWorks },
    { key: 'workshopPackages', label: copy.workshop, value: sectionCounts.workshopPackages },
    { key: 'collections', label: copy.collections, value: sectionCounts.collections },
  ];
  const profileInitial = profile.displayName.trim().slice(0, 1) || '@';

  const itemCard = (item: PersonalContentSummary) => (
    <button
      key={`${item.kind}-${item.id}`}
      type="button"
      onClick={() => setSelectedEntityId(item.id)}
      className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 text-left shadow-sm transition hover:border-[#17130f]/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14px] font-bold leading-snug text-[#17130f]">{item.title}</h3>
        <span className="shrink-0 border border-[#2f2a22]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/70">{kindLabel[item.kind]}</span>
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
      <header className="overflow-hidden rounded-xl border border-[#2f2a22]/15 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-[#2f2a22] via-[#6a5f52] to-[#f5c518]/70" />
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:p-6">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <div className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#17130f] text-4xl font-bold text-white shadow-sm">
              {profileInitial}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[#17130f] md:text-3xl">{profile.displayName}</h1>
                <span className="rounded-full border border-[#2f2a22]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#51483d]">
                  {copy.publicProfile}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-[#51483d]/70">@{profile.handle}</p>
              {profile.bio && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#51483d]">{profile.bio}</p>}
              {profile.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[#2f2a22]/15 bg-[#faf8f2] px-2 py-0.5 text-[10px] font-semibold text-[#51483d]/80">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <span className="w-fit rounded-full border border-[#2f2a22]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]">
              {t(`fanPlaza.visibility.${profile.visibility}`)}
            </span>
            <div className="flex w-full rounded-lg border border-[#2f2a22]/15 bg-[#faf8f2] p-1 md:w-auto">
              <button
                type="button"
                onClick={() => setAsOwnerPreview(false)}
                className={`flex-1 rounded-md px-3 py-1 text-[11px] font-bold transition md:flex-none ${!asOwnerPreview ? 'bg-[#17130f] text-white' : 'text-[#51483d] hover:bg-white'}`}
              >
                {copy.visitor}
              </button>
              <button
                type="button"
                onClick={() => setAsOwnerPreview(true)}
                className={`flex-1 rounded-md px-3 py-1 text-[11px] font-bold transition md:flex-none ${asOwnerPreview ? 'bg-[#17130f] text-white' : 'text-[#51483d] hover:bg-white'}`}
              >
                {copy.ownerPreview}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {asOwnerPreview ? (
                <>
                  <button type="button" disabled className="rounded-md border border-dashed border-[#2f2a22]/25 px-3 py-1.5 text-xs font-bold text-[#51483d]/60">
                    {copy.editProfile} · {copy.reserved}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenPersonalHub}
                    disabled={!onOpenPersonalHub}
                    className="rounded-md border border-[#2f2a22]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#17130f] transition hover:bg-[#2f2a22]/8 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copy.manageLibrary}
                  </button>
                </>
              ) : (
                <button type="button" disabled className="rounded-md border border-dashed border-[#2f2a22]/25 px-3 py-1.5 text-xs font-bold text-[#51483d]/60">
                  {copy.follow} · {copy.reserved}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="grid border-t border-[#2f2a22]/10 bg-[#faf8f2] sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.key} className="border-b border-[#2f2a22]/10 px-4 py-3 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0">
              <div className="text-lg font-bold text-[#17130f]">{stat.value}</div>
              <div className="text-[11px] font-semibold text-[#51483d]/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Section tabs */}
      <div className="mt-5 flex gap-2 overflow-x-auto border-b border-[#2f2a22]/12 pb-2">
        {USER_PROFILE_SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setSection(s); setSelectedEntityId(null); }}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-bold transition ${section === s ? 'bg-[#17130f] text-white' : 'text-[#51483d] hover:bg-[#2f2a22]/8'}`}
          >
            {sectionLabel[s]}
          </button>
        ))}
      </div>

      {/* Selected entity detail state (routable contract placeholder) */}
      {routeTarget && (
        <section className="mt-5 rounded-lg border-2 border-[#17130f]/20 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-bold text-[#17130f]">{copy.detailState}</h2>
            <button type="button" onClick={() => setSelectedEntityId(null)} className="border border-[#2f2a22]/20 px-2 py-0.5 text-[11px] font-bold text-[#51483d] hover:border-[#17130f]">{copy.close}</button>
          </div>
          <p className="mt-2 text-sm text-[#51483d]">{copy.detailStateDescription}</p>
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
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section>
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#51483d]">{copy.pinned}</h2>
              {pinned.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinned.map((p) => (
                  <button key={p.id} type="button" onClick={() => setSelectedEntityId(p.id)} className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 text-left shadow-sm transition hover:border-[#17130f]/40 hover:shadow-md">
                    <h3 className="text-[14px] font-bold leading-snug text-[#17130f]">{p.title}</h3>
                    <span className="mt-1 w-fit border border-[#2f2a22]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#51483d]/70">{t(`fanPlaza.entityType.${entityTypeKey(p.type)}`)}</span>
                  </button>
                ))}
              </div>
              ) : (
                <p className="rounded-lg border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-6 text-sm text-[#51483d]/60">{copy.noPinned}</p>
              )}
            </section>
            <aside className="rounded-lg border border-[#2f2a22]/12 bg-white p-4">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#51483d]">{copy.representative}</h2>
              <div className="mt-3 flex flex-col gap-2">
                {representativeItems.length > 0
                  ? representativeItems.map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={() => setSelectedEntityId(item.id)}
                      className="rounded-md border border-[#2f2a22]/12 bg-[#faf8f2] px-3 py-2 text-left transition hover:border-[#17130f]/35"
                    >
                      <div className="text-sm font-bold text-[#17130f]">{item.title}</div>
                      {item.subtitle && <div className="mt-0.5 text-[11px] text-[#51483d]/65">{item.subtitle}</div>}
                    </button>
                  ))
                  : <p className="text-sm text-[#51483d]/60">{copy.noPinned}</p>}
              </div>
            </aside>
          </div>
        ) : sectionItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{sectionItems.map(itemCard)}</div>
        ) : (
          <p className="rounded-lg border border-dashed border-[#2f2a22]/30 bg-[#faf8f2] p-6 text-center text-sm text-[#51483d]/60">
            {copy.noSection}
          </p>
        )}
      </div>

      <p className="mt-6 text-[10px] leading-relaxed text-[#51483d]/45">
        {copy.projectionNote}
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
