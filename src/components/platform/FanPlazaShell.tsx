/**
 * FanPlazaShell
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 *
 * Platform-level Fan Plaza community page (separate from Workshop). Discovery +
 * static detail preview of expressive fan works (stories, recaps, illustrations,
 * comics, music, settings, character profiles, essays) that link to actors,
 * campaigns, maps, session logs, workshop items, and worlds.
 *
 * Scaffold only: local filter/sort/detail; no real upload / like / favorite /
 * comment / share / permission / backend / routing.
 */
import { useState } from 'react';
import type { Locale } from '../../i18n';
import { platformRepo } from '../../lib/architecture/repositoryComposition';
import { fanWorkRelatedTypes } from '../../lib/platform/communityFilters';
import {
  FAN_WORK_RELATION_KEYS,
  FAN_WORK_SORT_KEYS,
  FAN_WORK_SYSTEM_KEYS,
  FAN_WORK_TYPE_KEYS,
  filterAndSortFanWorks,
  type FanPlazaFilterState,
} from '../../lib/platform/communityFilters';
import { FanWorkCard } from './FanWorkCard';
import { FanWorkDetail } from './FanWorkDetail';
import { PreviewArt } from './PreviewArt';

export type FanPlazaShellProps = {
  t: (key: string) => string;
  locale: Locale;
  onBackHome: () => void;
};

function ChipRow({
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
      <span className="w-[88px] shrink-0 pt-1 text-[11px] font-bold text-[#51483d]">{label}：</span>
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

export function FanPlazaShell({ t, locale, onBackHome }: FanPlazaShellProps) {
  const [filter, setFilter] = useState<FanPlazaFilterState>({
    search: '',
    type: 'all',
    system: 'all',
    relatedObject: 'all',
    sort: 'featured',
  });
  const [detailWorkId, setDetailWorkId] = useState<string | null>(null);
  const [previewWorkId, setPreviewWorkId] = useState<string | null>(null);

  const allLabel = t('workshop.filter.all');
  const allWorks = platformRepo.fanWorks.list();
  const works = filterAndSortFanWorks(allWorks, filter);
  const detailWork = detailWorkId ? platformRepo.fanWorks.getById(detailWorkId) : undefined;
  const previewWork = previewWorkId ? platformRepo.fanWorks.getById(previewWorkId) : undefined;

  const openDetail = (id: string) => {
    setDetailWorkId(id);
    setPreviewWorkId(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };

  // Dedicated detail view replaces the browse surface entirely.
  if (detailWork) {
    return <FanWorkDetail work={detailWork} t={t} locale={locale} onBack={() => setDetailWorkId(null)} />;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      <header>
        <h1 className="text-2xl font-bold">{t('fanPlaza.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#51483d]">{t('fanPlaza.subtitle')}</p>
      </header>

      {/* Search */}
      <div className="mt-5">
        <input
          type="search"
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          placeholder={t('fanPlaza.searchPlaceholder')}
          className="w-full max-w-xl rounded-md border border-[#2f2a22]/20 bg-white px-3 py-1.5 text-sm placeholder:text-[#51483d]/40 focus:border-[#17130f] focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-[#2f2a22]/15 bg-white p-4">
        <ChipRow
          label={t('fanPlaza.filter.workType')}
          options={['all', ...FAN_WORK_TYPE_KEYS]}
          value={filter.type}
          onChange={(v) => setFilter((f) => ({ ...f, type: v as FanPlazaFilterState['type'] }))}
          labelFn={(v) => (v === 'all' ? allLabel : t(`fanPlaza.workType.${v}`))}
        />
        <ChipRow
          label={t('fanPlaza.filter.adaptedSystem')}
          options={['all', ...FAN_WORK_SYSTEM_KEYS]}
          value={filter.system}
          onChange={(v) => setFilter((f) => ({ ...f, system: v as FanPlazaFilterState['system'] }))}
          labelFn={(v) => (v === 'all' ? allLabel : t(`fanPlaza.system.${v}`))}
        />
        <ChipRow
          label={t('fanPlaza.filter.relatedObject')}
          options={['all', ...FAN_WORK_RELATION_KEYS]}
          value={filter.relatedObject}
          onChange={(v) => setFilter((f) => ({ ...f, relatedObject: v as FanPlazaFilterState['relatedObject'] }))}
          labelFn={(v) => (v === 'all' ? allLabel : t(`fanPlaza.entityType.${v}`))}
        />
        <ChipRow
          label={t('fanPlaza.filter.sort')}
          options={[...FAN_WORK_SORT_KEYS]}
          value={filter.sort}
          onChange={(v) => setFilter((f) => ({ ...f, sort: v as FanPlazaFilterState['sort'] }))}
          labelFn={(v) => t(`fanPlaza.sort.${v}`)}
        />
      </div>

      {/* Lightweight quick preview (full reading lives in the dedicated detail view) */}
      {previewWork && (
        <div className="mt-4 rounded-lg border-2 border-[#17130f]/20 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="w-28 shrink-0 sm:w-36">
              <PreviewArt
                t={t}
                fanKind={previewWork.coverKind ?? previewWork.type}
                coverMode={previewWork.coverMode}
                ratio="4:3"
                showCaption={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold leading-snug text-[#17130f]">{previewWork.title}</h3>
                <button
                  type="button"
                  onClick={() => setPreviewWorkId(null)}
                  className="shrink-0 border border-[#2f2a22]/20 px-2 py-0.5 text-[11px] font-bold text-[#51483d] hover:border-[#17130f]"
                >
                  {t('fanPlaza.detail.close')}
                </button>
              </div>
              <p className="mt-0.5 text-[11px] text-[#51483d]/60">
                {t('fanPlaza.card.author')}：{previewWork.authorName}
              </p>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                <span className="border border-[#2f2a22]/20 px-1.5 py-0.5 font-bold text-[#51483d]">{t(`fanPlaza.workType.${previewWork.type}`)}</span>
                <span className="border border-[#2f2a22]/15 px-1.5 py-0.5 text-[#51483d]/75">{t(`fanPlaza.format.${previewWork.format}`)}</span>
                {previewWork.systemId && <span className="border border-[#2f2a22]/15 px-1.5 py-0.5 text-[#51483d]/75">{t(`fanPlaza.system.${previewWork.systemId}`)}</span>}
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#51483d]/80">{previewWork.summary}</p>
              {(() => {
                const relatedTypes = Array.from(new Set(fanWorkRelatedTypes(previewWork)));
                return relatedTypes.length > 0 ? (
                  <p className="mt-1 text-[10px] text-[#51483d]/70">
                    <span className="font-bold">{t('fanPlaza.card.relatedObjects')}：</span>
                    {relatedTypes.map((ty) => t(`fanPlaza.entityType.${ty}`)).join('、')}
                  </p>
                ) : null;
              })()}
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => openDetail(previewWork.id)}
                  className="border border-[#17130f] bg-[#17130f] px-3 py-1 text-xs font-bold text-white"
                >
                  {t('fanPlaza.card.enterDetail')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multimodal work flow — image-forward grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <FanWorkCard key={work.id} work={work} t={t} onOpenDetail={openDetail} onQuickPreview={setPreviewWorkId} />
        ))}
        {works.length === 0 && (
          <div className="rounded-lg border border-[#2f2a22]/15 bg-white p-6 text-center text-sm text-[#51483d]/60">
            {t('fanPlaza.noResults')}
          </div>
        )}
      </div>

      {/* Low-weight note */}
      <p className="mt-4 text-[11px] leading-relaxed text-[#51483d]/70">{t('fanPlaza.associationNote')}</p>

      <div className="mt-6">
        <button
          type="button"
          onClick={onBackHome}
          className="rounded-md border border-[#2f2a22]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#17130f] transition hover:bg-[#2f2a22]/8"
        >
          {t('shell.backHome')}
        </button>
      </div>
    </main>
  );
}
