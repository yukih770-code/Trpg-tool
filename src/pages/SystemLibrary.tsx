// AI-LANDMARK: SYSTEM_LIBRARY_SCAFFOLD_V1
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { createTranslator, type Locale } from '../i18n';

type System = 'D&D' | 'CoC' | 'CP';
type AvailabilityKey = 'available' | 'unavailable';
type SourceKey = 'builtin' | 'local' | 'community';
type CategoryKey = 'trpg' | 'boardgame' | 'wargame' | 'cardgame' | 'custom';

type SystemEntry = {
  id: string;
  system?: System;
  nameKey: string;
  typeLabel: string;
  descKey: string;
  availability: AvailabilityKey;
  source: SourceKey;
  category: CategoryKey;
  tagKeys: string[];
};

const SYSTEM_ENTRIES: SystemEntry[] = [
  {
    id: 'dnd2024',
    system: 'D&D',
    nameKey: 'systemLibrary.systems.dnd2024.name',
    typeLabel: 'TRPG',
    descKey: 'systemLibrary.systems.dnd2024.desc',
    availability: 'available',
    source: 'builtin',
    category: 'trpg',
    tagKeys: ['systemLibrary.tags.trpg', 'systemLibrary.tags.fantasy', 'systemLibrary.tags.builtin'],
  },
  {
    id: 'coc7e',
    system: 'CoC',
    nameKey: 'systemLibrary.systems.coc7e.name',
    typeLabel: 'TRPG',
    descKey: 'systemLibrary.systems.coc7e.desc',
    availability: 'available',
    source: 'builtin',
    category: 'trpg',
    tagKeys: ['systemLibrary.tags.trpg', 'systemLibrary.tags.investigation', 'systemLibrary.tags.horror', 'systemLibrary.tags.builtin'],
  },
  {
    id: 'cyberpunkRed',
    system: 'CP',
    nameKey: 'systemLibrary.systems.cyberpunkRed.name',
    typeLabel: 'TRPG',
    descKey: 'systemLibrary.systems.cyberpunkRed.desc',
    availability: 'available',
    source: 'builtin',
    category: 'trpg',
    tagKeys: ['systemLibrary.tags.trpg', 'systemLibrary.tags.cyberpunk', 'systemLibrary.tags.scifi', 'systemLibrary.tags.builtin'],
  },
  {
    id: 'warhammer',
    nameKey: 'systemLibrary.systems.warhammer.name',
    typeLabel: 'TRPG',
    descKey: 'systemLibrary.systems.warhammer.desc',
    availability: 'unavailable',
    source: 'builtin',
    category: 'trpg',
    tagKeys: ['systemLibrary.tags.trpg', 'systemLibrary.tags.darkFantasy', 'systemLibrary.tags.war'],
  },
  {
    id: 'japaneseTrpg',
    nameKey: 'systemLibrary.systems.japaneseTrpg.name',
    typeLabel: 'TRPG',
    descKey: 'systemLibrary.systems.japaneseTrpg.desc',
    availability: 'unavailable',
    source: 'builtin',
    category: 'trpg',
    tagKeys: ['systemLibrary.tags.trpg', 'systemLibrary.tags.japaneseTrpg'],
  },
  {
    id: 'customSystem',
    nameKey: 'systemLibrary.systems.customSystem.name',
    typeLabel: 'Custom',
    descKey: 'systemLibrary.systems.customSystem.desc',
    availability: 'unavailable',
    source: 'local',
    category: 'custom',
    tagKeys: ['systemLibrary.tags.custom', 'systemLibrary.tags.local'],
  },
];

const CATEGORIES: { key: 'all' | CategoryKey; labelKey: string }[] = [
  { key: 'all',       labelKey: 'systemLibrary.category.all' },
  { key: 'trpg',      labelKey: 'systemLibrary.category.trpg' },
  { key: 'boardgame', labelKey: 'systemLibrary.category.boardgame' },
  { key: 'wargame',   labelKey: 'systemLibrary.category.wargame' },
  { key: 'cardgame',  labelKey: 'systemLibrary.category.cardgame' },
  { key: 'custom',    labelKey: 'systemLibrary.category.custom' },
];

const AVAILABILITY_FILTERS: { key: 'all' | AvailabilityKey; labelKey: string }[] = [
  { key: 'all',         labelKey: 'systemLibrary.availability.all' },
  { key: 'available',   labelKey: 'systemLibrary.availability.available' },
  { key: 'unavailable', labelKey: 'systemLibrary.availability.unavailable' },
];

const SOURCE_FILTERS: { key: 'all' | SourceKey; labelKey: string }[] = [
  { key: 'all',       labelKey: 'systemLibrary.source.all' },
  { key: 'builtin',   labelKey: 'systemLibrary.source.builtin' },
  { key: 'local',     labelKey: 'systemLibrary.source.local' },
  { key: 'community', labelKey: 'systemLibrary.source.community' },
];

const AVAILABILITY_BADGE_CLASS: Record<AvailabilityKey, string> = {
  available:   'border-[#2f7f68]/40 text-[#2f7f68] bg-[#f1fbf7]',
  unavailable: 'border-[#2f2a22]/20 text-[#51483d] bg-white',
};

type SystemLibraryProps = {
  locale: Locale;
  onEnterPlay: (system?: System) => void;
};

export function SystemLibrary({ locale, onEnterPlay }: SystemLibraryProps) {
  const { t } = createTranslator(locale);
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState<'all' | CategoryKey>('all');
  const [availability, setAvailability] = useState<'all' | AvailabilityKey>('all');
  const [source, setSource]           = useState<'all' | SourceKey>('all');

  const q = search.trim().toLowerCase();

  const filtered = SYSTEM_ENTRIES.filter((entry) => {
    const name = t(entry.nameKey).toLowerCase();
    const desc = t(entry.descKey).toLowerCase();
    const tags = entry.tagKeys.map((k) => t(k).toLowerCase()).join(' ');
    const matchesSearch =
      !q || name.includes(q) || desc.includes(q) || entry.typeLabel.toLowerCase().includes(q) || tags.includes(q);
    const matchesCategory     = category     === 'all' || entry.category     === category;
    const matchesAvailability = availability === 'all' || entry.availability === availability;
    const matchesSource       = source       === 'all' || entry.source       === source;
    return matchesSearch && matchesCategory && matchesAvailability && matchesSource;
  });

  const chipClass = (active: boolean) =>
    `rounded-md border px-3 py-1 text-xs font-medium transition ${
      active
        ? 'border-[#17130f]/40 bg-[#17130f] text-white'
        : 'border-[#2f2a22]/20 bg-white/60 text-[#51483d] hover:bg-white hover:text-[#17130f]'
    }`;

  const filterRow = (
    label: string,
    items: { key: string; labelKey: string }[],
    active: string,
    onSet: (k: string) => void,
  ) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-[#6a5f52]">
        {label}
      </span>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSet(item.key)}
          className={chipClass(active === item.key)}
        >
          {t(item.labelKey)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">

        {/* ── Title ──────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {t('systemLibrary.title')}
          </h1>
          <p className="mt-1.5 text-sm text-[#51483d]">{t('systemLibrary.subtitle')}</p>
        </div>

        {/* ── Search ─────────────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a5f52]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('systemLibrary.searchPlaceholder')}
            className="w-full rounded-xl border border-[#2f2a22]/15 bg-white/80 py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-[#6a5f52]/60 focus:border-[#2f2a22]/30 focus:bg-white"
          />
        </div>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2.5">
          {filterRow(
            t('systemLibrary.category.label'),
            CATEGORIES,
            category,
            (k) => setCategory(k as typeof category),
          )}
          {filterRow(
            t('systemLibrary.availability.label'),
            AVAILABILITY_FILTERS,
            availability,
            (k) => setAvailability(k as typeof availability),
          )}
          {filterRow(
            t('systemLibrary.source.label'),
            SOURCE_FILTERS,
            source,
            (k) => setSource(k as typeof source),
          )}
        </div>

        {/* ── System Cards ────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <p className="col-span-full text-sm text-[#51483d]">{t('systemLibrary.noResults')}</p>
          ) : (
            filtered.map((entry) => {
              const isAvailable = entry.availability === 'available';
              return (
                <div
                  key={entry.id}
                  className={`flex flex-col rounded-xl border p-5 transition ${
                    isAvailable
                      ? 'border-[#2f2a22]/15 bg-white'
                      : 'border-[#2f2a22]/10 bg-[#faf8f2] opacity-65'
                  }`}
                >
                  {/* Card header */}
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold">{t(entry.nameKey)}</div>
                      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[#6a5f52]">
                        {entry.typeLabel}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 rounded-md text-[9px] font-medium uppercase tracking-wide ${AVAILABILITY_BADGE_CLASS[entry.availability]}`}
                    >
                      {t(`systemLibrary.badge.${entry.availability}`)}
                    </Badge>
                  </div>

                  {/* Genre tags */}
                  <div className="mb-3 flex flex-wrap gap-1">
                    {entry.tagKeys.map((key) => (
                      <span
                        key={key}
                        className="rounded-sm border border-[#2f2a22]/12 bg-[#f7f3ea] px-1.5 py-0.5 text-[9px] text-[#6a5f52]"
                      >
                        {t(key)}
                      </span>
                    ))}
                  </div>

                  <p className="mb-4 flex-1 text-xs text-[#51483d]">{t(entry.descKey)}</p>

                  {isAvailable ? (
                    <Button
                      size="sm"
                      onClick={() => onEnterPlay(entry.system)}
                      className="w-full rounded-md"
                    >
                      {t('systemLibrary.enterSystem')}
                    </Button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-default rounded-md border border-[#2f2a22]/12 bg-transparent py-1.5 text-xs text-[#51483d]/55"
                    >
                      {t('systemLibrary.unavailableButton')}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
}
