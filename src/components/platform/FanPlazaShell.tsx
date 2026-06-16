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
import { FAN_WORKS } from '../../lib/platform/communityMockData';
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
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  const allLabel = t('workshop.filter.all');
  const works = filterAndSortFanWorks(FAN_WORKS, filter);
  const selectedWork = selectedWorkId ? FAN_WORKS.find((w) => w.id === selectedWorkId) : undefined;

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

      {/* Detail panel (page-internal) */}
      {selectedWork && (
        <div className="mt-4">
          <FanWorkDetail work={selectedWork} t={t} locale={locale} onClose={() => setSelectedWorkId(null)} />
        </div>
      )}

      {/* Multimodal work flow — image-forward grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <FanWorkCard key={work.id} work={work} t={t} onViewDetail={setSelectedWorkId} />
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
