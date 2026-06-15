/**
 * WorkshopShell
 *
 * AI-LANDMARK: WORKSHOP_FULL_INTERFACE_SCAFFOLD_V1
 * (supersedes WORKSHOP_BROWSE_SUBSCRIPTIONS_UX_REFINEMENT_V1)
 *
 * Top-level tabs: browse | subscriptions  (updates / dependency tab removed)
 *
 * Browse filter layout (one card, two sections):
 *   ┌ 基础筛选
 *   │  [适配系统:] chips
 *   │  [主分类:]   chips
 *   │    └─ sub-panel (when category ≠ all and has subtypes or attribute tags)
 *   │         当前分类：{label}
 *   │         细分类型：chips
 *   │         属性标签：chips
 *   └ ─────────────────────────
 *   ┌ 高级筛选
 *   │  [内容形态:] chips
 *   │  [排序:]     chips
 *   └
 *
 * Quick preview: page-internal state — shows detail panel between filter and grid.
 *
 * My Subscriptions:
 *   Subscription profile (lightweight line)
 *   Search + status filter + category filter
 *   Subscription list with item-level status badges + full metadata
 *   Low-weight footnotes only — no large mechanism panels
 *
 * Scaffold only: no real subscription, download, import, update,
 * dependency check, conflict detection, rule override, or preflight logic.
 */
import { useState } from 'react';
import type { Locale } from '../../i18n';
import {
  WORKSHOP_ATTRIBUTE_TAGS,
  WORKSHOP_BROWSE_SAMPLES,
  WORKSHOP_CATEGORY_KEYS,
  WORKSHOP_CONTENT_SHAPE_KEYS,
  WORKSHOP_LANDING_MAP,
  WORKSHOP_SORT_KEYS,
  WORKSHOP_SUBSCRIPTION_SAMPLES,
  WORKSHOP_SUBSCRIPTION_STATUS_KEYS,
  WORKSHOP_SUBTYPES,
  WORKSHOP_SYSTEM_KEYS,
  localized,
  type WorkshopBrowseItem,
  type WorkshopCategory,
  type WorkshopContentShape,
  type WorkshopSort,
  type WorkshopSubscriptionItem,
  type WorkshopSubscriptionStatusKey,
  type WorkshopSystem,
} from '../../lib/platform/workshopTypes';

type WorkshopTab = 'browse' | 'subscriptions';

export type WorkshopShellProps = {
  t: (key: string) => string;
  locale: Locale;
};

const cardCls = 'rounded-lg border border-[#2f2a22]/15 bg-white p-4 shadow-sm';

/** Fixed-width label + chip group row. Label column is w-[88px]. */
function FilterRow({
  label,
  options,
  value,
  onChange,
  labelFn,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labelFn: (v: string) => string;
}) {
  return (
    <div className="flex items-start">
      <span className="w-[88px] shrink-0 pt-0.5 text-[11px] font-bold leading-none text-[#51483d]">
        {label}：
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`border px-2 py-0.5 text-[11px] font-bold transition ${
              value === opt
                ? 'border-[#17130f] bg-[#17130f] text-white'
                : 'border-[#2f2a22]/20 text-[#51483d] hover:border-[#17130f]'
            }`}
          >
            {labelFn(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Inline chip row inside sub-panel (no fixed-width label). */
function SubPanelRow({
  label,
  options,
  value,
  onChange,
  labelFn,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  labelFn: (v: string) => string;
}) {
  return (
    <div className="flex items-start mt-1.5">
      <span className="shrink-0 pt-0.5 text-[11px] font-bold leading-none text-[#51483d] mr-2 whitespace-nowrap">
        {label}：
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`border px-2 py-0.5 text-[11px] font-bold transition ${
              value === opt
                ? 'border-[#17130f] bg-[#17130f] text-white'
                : 'border-[#2f2a22]/20 text-[#51483d] hover:border-[#17130f]'
            }`}
          >
            {labelFn(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

function statusBadgeCls(status: WorkshopSubscriptionStatusKey): string {
  switch (status) {
    case 'ok':                return 'border-emerald-300 bg-emerald-50 text-emerald-700';
    case 'hasUpdate':         return 'border-blue-300   bg-blue-50   text-blue-700';
    case 'missingDependency': return 'border-orange-300 bg-orange-50 text-orange-700';
    case 'possibleConflict':  return 'border-amber-300  bg-amber-50  text-amber-700';
    case 'needsAttention':    return 'border-red-300    bg-red-50    text-red-700';
    case 'affectsCampaign':   return 'border-purple-300 bg-purple-50 text-purple-700';
    case 'disabled':          return 'border-[#2f2a22]/20 bg-[#2f2a22]/5 text-[#51483d]/50';
    default:                  return 'border-[#2f2a22]/20 text-[#51483d]';
  }
}

export function WorkshopShell({ t, locale }: WorkshopShellProps) {
  // ── Tab ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<WorkshopTab>('browse');

  // ── Browse state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSystem, setActiveSystem] = useState<WorkshopSystem | 'all'>('all');
  const [primaryCategory, setPrimaryCategory] = useState<WorkshopCategory | 'all'>('all');
  const [activeSubtype, setActiveSubtype] = useState<string>('all');
  const [activeAttributeTag, setActiveAttributeTag] = useState<string>('all');
  const [activeShape, setActiveShape] = useState<WorkshopContentShape | 'all'>('all');
  const [activeSort, setActiveSort] = useState<WorkshopSort>('featured');

  // ── Quick preview state ───────────────────────────────────────────────────
  const [previewId, setPreviewId] = useState<string | null>(null);

  // ── Subscription state ───────────────────────────────────────────────────
  const [subSearch, setSubSearch] = useState('');
  const [subStatus, setSubStatus] = useState<WorkshopSubscriptionStatusKey | 'all'>('all');
  const [subCategory, setSubCategory] = useState<WorkshopCategory | 'all'>('all');

  // ── Helpers ──────────────────────────────────────────────────────────────
  const allLabel = t('workshop.filter.all');

  const categoryLabel = (cat: string) =>
    cat === 'all' ? allLabel : t(`workshop.category.${cat}`);
  const systemLabel = (sys: string) =>
    sys === 'all' ? allLabel : t(`workshop.filter.adaptedSystem.${sys}`);
  const subtypeLabel = (sub: string) =>
    sub === 'all' ? allLabel : t(`workshop.filter.subtype.${sub}`);
  const attrTagLabel = (tag: string) =>
    tag === 'all' ? allLabel : t(`workshop.filter.attributeTag.${tag}`);
  const shapeLabel = (shape: string) =>
    shape === 'all' ? allLabel : t(`workshop.filter.contentShape.${shape}`);
  const sortLabel = (sort: string) => t(`workshop.filter.sort.${sort}`);
  const statusFilterLabel = (s: string) =>
    s === 'all' ? allLabel : t(`workshop.subscriptions.statusFilter.${s}`);
  const statusBadgeLabel = (s: WorkshopSubscriptionStatusKey) =>
    t(`workshop.subscriptions.badge.${s}`);
  const impactScopeLabel = (scope: string) => t(`workshop.impactScope.${scope}`);
  const depStatusLabel = (dep: string) => t(`workshop.dependencyStatus.${dep}`);

  const handleCategoryChange = (cat: string) => {
    setPrimaryCategory(cat as WorkshopCategory | 'all');
    setActiveSubtype('all');
    setActiveAttributeTag('all');
    setPreviewId(null);
  };

  const subtypes =
    primaryCategory !== 'all' ? WORKSHOP_SUBTYPES[primaryCategory as WorkshopCategory] : [];
  const attrTags =
    primaryCategory !== 'all' ? WORKSHOP_ATTRIBUTE_TAGS[primaryCategory as WorkshopCategory] : [];

  const cardLanding = (item: WorkshopBrowseItem): string => {
    const target = WORKSHOP_LANDING_MAP[item.category];
    if (target === 'systemRuleSources') {
      return `${systemLabel(item.system)} → ${t('workshop.landing.systemRuleSources')}`;
    }
    return t(`workshop.landing.${target}`);
  };

  const subLanding = (item: WorkshopSubscriptionItem): string => {
    if (item.landing === 'systemRuleSources') {
      return `${systemLabel(item.system)} → ${t('workshop.landing.systemRuleSources')}`;
    }
    return t(`workshop.landing.${item.landing}`);
  };

  // ── Filtered browse items ─────────────────────────────────────────────────
  const filteredBrowse = WORKSHOP_BROWSE_SAMPLES.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const titleText = localized(item.title, locale).toLowerCase();
      const authorText = item.author.toLowerCase();
      const subtypeText = item.subtype ? item.subtype.toLowerCase() : '';
      const tagsText = item.attributeTags.join(' ').toLowerCase();
      const catText = item.category.toLowerCase();
      const sysText = item.system.toLowerCase();
      if (
        !titleText.includes(q) &&
        !authorText.includes(q) &&
        !subtypeText.includes(q) &&
        !tagsText.includes(q) &&
        !catText.includes(q) &&
        !sysText.includes(q)
      ) return false;
    }
    if (activeSystem !== 'all' && item.system !== activeSystem) return false;
    if (primaryCategory !== 'all' && item.category !== primaryCategory) return false;
    if (activeSubtype !== 'all' && item.subtype !== activeSubtype) return false;
    if (activeAttributeTag !== 'all' && !item.attributeTags.includes(activeAttributeTag)) return false;
    if (activeShape !== 'all' && item.contentShape !== activeShape) return false;
    return true;
  });

  // ── Filtered subscription items ───────────────────────────────────────────
  const filteredSubs = WORKSHOP_SUBSCRIPTION_SAMPLES.filter((item) => {
    if (subSearch.trim()) {
      const q = subSearch.trim().toLowerCase();
      if (!localized(item.title, locale).toLowerCase().includes(q)) return false;
    }
    if (subStatus !== 'all' && item.status !== subStatus) return false;
    if (subCategory !== 'all' && item.category !== subCategory) return false;
    return true;
  });

  // ── Preview item ──────────────────────────────────────────────────────────
  const previewItem = previewId
    ? WORKSHOP_BROWSE_SAMPLES.find((i) => i.id === previewId) ?? null
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold">{t('workshop.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#51483d]">{t('workshop.subtitle')}</p>
      </header>

      {/* Tabs — browse / subscriptions only */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-[#2f2a22]/12 pb-2">
        {(['browse', 'subscriptions'] as WorkshopTab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${
              tab === key ? 'bg-[#17130f] text-white' : 'text-[#51483d] hover:bg-[#2f2a22]/8'
            }`}
          >
            {t(`workshop.tabs.${key}`)}
          </button>
        ))}
      </div>

      {/* ════════════════════ BROWSE ════════════════════ */}
      {tab === 'browse' && (
        <div className="mt-5 flex flex-col gap-4">
          {/* Search */}
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPreviewId(null);
            }}
            placeholder={t('workshop.search.placeholder')}
            className="w-full rounded-md border border-[#2f2a22]/20 bg-white px-3 py-2 text-sm placeholder:text-[#51483d]/50 focus:border-[#17130f] focus:outline-none"
          />

          {/* Filter card */}
          <div className="overflow-hidden rounded-lg border border-[#2f2a22]/12 bg-[#faf8f2]">
            {/* ── Basic filters ── */}
            <div className="p-3">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#51483d]/35 select-none">
                {t('workshop.filter.basicSection')}
              </p>
              <div className="flex flex-col gap-2.5">
                <FilterRow
                  label={t('workshop.filter.adaptedSystem.label')}
                  options={['all', ...WORKSHOP_SYSTEM_KEYS]}
                  value={activeSystem}
                  onChange={(v) => setActiveSystem(v as WorkshopSystem | 'all')}
                  labelFn={systemLabel}
                />
                <FilterRow
                  label={t('workshop.filter.primaryCategory.label')}
                  options={['all', ...WORKSHOP_CATEGORY_KEYS]}
                  value={primaryCategory}
                  onChange={handleCategoryChange}
                  labelFn={categoryLabel}
                />
                {/* Sub-panel: subtype + attribute tags (shown when category ≠ all) */}
                {primaryCategory !== 'all' && (subtypes.length > 0 || attrTags.length > 0) && (
                  <div className="ml-[88px] mt-0.5 border-l-2 border-[#2f2a22]/20 pl-3 py-1.5">
                    <p className="mb-1.5 text-[10px] font-bold text-[#51483d]/55">
                      {t('workshop.filter.subtype.currentCategoryLabel')}：{categoryLabel(primaryCategory)}
                    </p>
                    {subtypes.length > 0 && (
                      <SubPanelRow
                        label={t('workshop.filter.subtype.subtypeRowLabel')}
                        options={['all', ...subtypes]}
                        value={activeSubtype}
                        onChange={setActiveSubtype}
                        labelFn={subtypeLabel}
                      />
                    )}
                    {attrTags.length > 0 && (
                      <SubPanelRow
                        label={t('workshop.filter.attributeTag.label')}
                        options={['all', ...attrTags]}
                        value={activeAttributeTag}
                        onChange={setActiveAttributeTag}
                        labelFn={attrTagLabel}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#2f2a22]/10" />

            {/* ── Advanced filters ── */}
            <div className="p-3">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#51483d]/35 select-none">
                {t('workshop.filter.advancedSection')}
              </p>
              <div className="flex flex-col gap-2.5">
                <FilterRow
                  label={t('workshop.filter.contentShape.label')}
                  options={['all', ...WORKSHOP_CONTENT_SHAPE_KEYS]}
                  value={activeShape}
                  onChange={(v) => setActiveShape(v as WorkshopContentShape | 'all')}
                  labelFn={shapeLabel}
                />
                <FilterRow
                  label={t('workshop.filter.sort.label')}
                  options={WORKSHOP_SORT_KEYS}
                  value={activeSort}
                  onChange={(v) => setActiveSort(v as WorkshopSort)}
                  labelFn={sortLabel}
                />
              </div>
            </div>
          </div>

          {/* Quick preview panel — page-internal, no modal library */}
          {previewItem && (
            <div className="rounded-lg border-2 border-[#17130f]/20 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold leading-snug">
                  {localized(previewItem.title, locale)}
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewId(null)}
                  className="shrink-0 border border-[#2f2a22]/20 px-2 py-0.5 text-[11px] font-bold text-[#51483d] hover:border-[#17130f]"
                >
                  {t('workshop.card.closePreview')}
                </button>
              </div>

              <p className="mt-1.5 text-[12px] leading-relaxed text-[#51483d]/70">
                {localized(previewItem.description, locale)}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-[#51483d]">
                <div>
                  <span className="font-bold">{t('workshop.card.author')}：</span>
                  {previewItem.author}
                </div>
                <div>
                  <span className="font-bold">{t('workshop.card.system')}：</span>
                  {systemLabel(previewItem.system)}
                </div>
                <div>
                  <span className="font-bold">{t('workshop.subscriptions.categoryLabel')}：</span>
                  {previewItem.subtype
                    ? `${categoryLabel(previewItem.category)} / ${subtypeLabel(previewItem.subtype)}`
                    : categoryLabel(previewItem.category)}
                </div>
                <div>
                  <span className="font-bold">{t('workshop.card.contentShape')}：</span>
                  {shapeLabel(previewItem.contentShape)}
                </div>
                <div>
                  <span className="font-bold">{t('workshop.card.version')}：</span>
                  {previewItem.version}
                </div>
                <div>
                  <span className="font-bold">{t('workshop.card.lastUpdated')}：</span>
                  {previewItem.lastUpdatedLabel}
                </div>
                <div>
                  <span className="font-bold">{t('workshop.card.dependencyStatus')}：</span>
                  {depStatusLabel(previewItem.dependencyStatus)}
                </div>
                <div>
                  <span className="font-bold">{t('workshop.card.impactScope')}：</span>
                  {impactScopeLabel(previewItem.impactScope)}
                </div>
                <div className="col-span-2">
                  <span className="font-bold">{t('workshop.card.landing')}：</span>
                  {cardLanding(previewItem)}
                </div>
              </div>

              {previewItem.attributeTags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1">
                  <span className="text-[11px] font-bold text-[#51483d] mr-1">
                    {t('workshop.card.attributeTags')}：
                  </span>
                  {previewItem.attributeTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/70"
                    >
                      {attrTagLabel(tag)}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 text-[10px] text-[#51483d]/40">
                {t('workshop.card.previewInterfaceNote')}
              </p>
              <div className="mt-2">
                <button
                  type="button"
                  className="border border-dashed border-[#2f2a22]/30 px-3 py-1 text-xs font-bold text-[#51483d]/70"
                >
                  {t('workshop.card.subscribeReserved')}
                </button>
              </div>
            </div>
          )}

          {/* Browse cards */}
          {filteredBrowse.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#51483d]/70">
              {t('workshop.filter.noResults')}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredBrowse.map((item) => (
                <div
                  key={item.id}
                  className={`${cardCls} ${previewId === item.id ? 'ring-2 ring-[#17130f]/20' : ''}`}
                >
                  {/* Title + category badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold leading-snug">
                      {localized(item.title, locale)}
                    </h3>
                    <span className="shrink-0 rounded border border-[#2f2a22]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#51483d]">
                      {categoryLabel(item.category)}
                    </span>
                  </div>

                  {/* Author */}
                  <p className="mt-1 text-[11px] text-[#51483d]/55">
                    <span className="font-bold">{t('workshop.card.author')}：</span>
                    {item.author}
                  </p>

                  {/* Primary metadata */}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#51483d]">
                    <span>
                      <span className="font-bold">{t('workshop.card.system')}：</span>
                      {systemLabel(item.system)}
                    </span>
                    {item.subtype && (
                      <span>
                        <span className="font-bold">{t('workshop.card.subtype')}：</span>
                        {subtypeLabel(item.subtype)}
                      </span>
                    )}
                    <span>
                      <span className="font-bold">{t('workshop.card.contentShape')}：</span>
                      {shapeLabel(item.contentShape)}
                    </span>
                    <span>
                      <span className="font-bold">{t('workshop.card.landing')}：</span>
                      {cardLanding(item)}
                    </span>
                  </div>

                  {/* Attribute tags */}
                  {item.attributeTags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {item.attributeTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] text-[#51483d]/65"
                        >
                          {attrTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Version + last updated + dependency + impact */}
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#51483d]/55">
                    <span>
                      {t('workshop.card.version')} {item.version}
                    </span>
                    <span>
                      {t('workshop.card.lastUpdated')} {item.lastUpdatedLabel}
                    </span>
                    {item.impactScope !== 'assetsOnly' && item.impactScope !== 'none' && (
                      <span>
                        {t('workshop.card.impactScope')}：{impactScopeLabel(item.impactScope)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewId(previewId === item.id ? null : item.id)
                      }
                      className="border border-[#2f2a22]/20 px-3 py-1 text-xs font-bold text-[#51483d] hover:border-[#17130f]"
                    >
                      {previewId === item.id
                        ? t('workshop.card.closePreview')
                        : t('workshop.card.quickPreview')}
                    </button>
                    <button
                      type="button"
                      className="border border-dashed border-[#2f2a22]/30 px-3 py-1 text-xs font-bold text-[#51483d]/70"
                    >
                      {t('workshop.card.subscribeReserved')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content landing — low-weight footnote */}
          <div className="border-t border-[#2f2a22]/8 pt-3">
            <p className="text-[11px] text-[#51483d]/60">{t('workshop.landingNote')}</p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-[#51483d]/50">
              {WORKSHOP_CATEGORY_KEYS.map((cat) => (
                <li key={cat}>
                  <span className="font-bold">{categoryLabel(cat)}</span>
                  {' → '}
                  {t(`workshop.landing.${WORKSHOP_LANDING_MAP[cat]}`)}
                </li>
              ))}
              <li>
                <span className="font-bold">{t('workshop.filter.contentShape.collection')}</span>
                {' → '}
                {t('workshop.landing.splitByShape')}
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ════════════════════ MY SUBSCRIPTIONS ════════════════════ */}
      {tab === 'subscriptions' && (
        <div className="mt-5 flex flex-col gap-4">
          {/* Subscription profile — lightweight line */}
          <div className="flex items-center justify-between rounded border border-[#2f2a22]/12 bg-[#faf8f2] px-3 py-2">
            <span className="text-[11px] text-[#51483d]">
              <span className="font-bold">{t('workshop.subscriptions.profile.label')}：</span>
              {t('workshop.subscriptions.profile.default')}
            </span>
            <button
              type="button"
              className="border border-dashed border-[#2f2a22]/25 px-2 py-0.5 text-[10px] font-bold text-[#51483d]/60"
            >
              {t('workshop.subscriptions.profile.configReserved')}
            </button>
          </div>

          {/* Search */}
          <input
            type="search"
            value={subSearch}
            onChange={(e) => setSubSearch(e.target.value)}
            placeholder={t('workshop.subscriptions.search.placeholder')}
            className="w-full rounded-md border border-[#2f2a22]/20 bg-white px-3 py-2 text-sm placeholder:text-[#51483d]/50 focus:border-[#17130f] focus:outline-none"
          />

          {/* Subscription filters */}
          <div className="flex flex-col gap-2.5 rounded-lg border border-[#2f2a22]/12 bg-[#faf8f2] p-3">
            <FilterRow
              label={t('workshop.subscriptions.filterStatus')}
              options={['all', ...WORKSHOP_SUBSCRIPTION_STATUS_KEYS]}
              value={subStatus}
              onChange={(v) => setSubStatus(v as WorkshopSubscriptionStatusKey | 'all')}
              labelFn={statusFilterLabel}
            />
            <FilterRow
              label={t('workshop.filter.primaryCategory.label')}
              options={['all', ...WORKSHOP_CATEGORY_KEYS]}
              value={subCategory}
              onChange={(v) => setSubCategory(v as WorkshopCategory | 'all')}
              labelFn={categoryLabel}
            />
          </div>

          {/* Status note — very low weight */}
          <p className="text-[11px] text-[#51483d]/45">{t('workshop.subscriptions.statusNote')}</p>

          {/* Subscription list */}
          {filteredSubs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#51483d]/70">
              {t('workshop.subscriptions.noResults')}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredSubs.map((item) => (
                <div key={item.id} className={cardCls}>
                  {/* Title + status badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold leading-snug">
                      {localized(item.title, locale)}
                    </h3>
                    <span
                      className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold tracking-wide ${statusBadgeCls(item.status)}`}
                    >
                      {statusBadgeLabel(item.status)}
                    </span>
                  </div>

                  {/* Primary meta */}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#51483d]">
                    <span>
                      <span className="font-bold">{t('workshop.subscriptions.systemLabel')}：</span>
                      {systemLabel(item.system)}
                    </span>
                    <span>
                      <span className="font-bold">{t('workshop.subscriptions.categoryLabel')}：</span>
                      {item.subtype
                        ? `${categoryLabel(item.category)} / ${subtypeLabel(item.subtype)}`
                        : categoryLabel(item.category)}
                    </span>
                    <span>
                      <span className="font-bold">{t('workshop.subscriptions.shapeLabel')}：</span>
                      {shapeLabel(item.contentShape)}
                    </span>
                    <span>
                      <span className="font-bold">{t('workshop.subscriptions.landingLabel')}：</span>
                      {subLanding(item)}
                    </span>
                  </div>

                  {/* Extended meta: version / last updated / dependency / impact */}
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#51483d]/65">
                    <span>
                      <span className="font-bold">{t('workshop.subscriptions.versionLabel')}：</span>
                      {item.version}
                    </span>
                    <span>
                      <span className="font-bold">{t('workshop.subscriptions.lastUpdatedLabel')}：</span>
                      {item.lastUpdatedLabel}
                    </span>
                    <span>
                      <span className="font-bold">{t('workshop.subscriptions.dependencyStatusLabel')}：</span>
                      {depStatusLabel(item.dependencyStatus)}
                    </span>
                    <span>
                      <span className="font-bold">{t('workshop.subscriptions.impactScopeLabel')}：</span>
                      {impactScopeLabel(item.impactScope)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="border border-[#2f2a22]/20 px-3 py-1 text-xs font-bold text-[#51483d] hover:border-[#17130f]"
                    >
                      {t('workshop.card.viewDetails')}
                    </button>
                    <button
                      type="button"
                      className="border border-dashed border-[#2f2a22]/30 px-3 py-1 text-xs font-bold text-[#51483d]/70"
                    >
                      {t('workshop.subscriptions.manageReserved')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Low-weight footnotes */}
          <div className="border-t border-[#2f2a22]/8 pt-3 flex flex-col gap-1">
            <p className="text-[11px] leading-relaxed text-[#51483d]/40">
              {t('workshop.subscriptions.preflightNote')}
            </p>
            <p className="text-[11px] text-[#51483d]/40">
              {t('workshop.subscriptions.landingFootnote')}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
