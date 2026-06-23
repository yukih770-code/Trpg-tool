import { useEffect, useMemo, useState } from 'react';
import { SPELL_DATA } from '../../data/spells';
import {
  listDndSpellIndexEntries,
  type DndSpellIndexScopeFilter,
  type DndSpellIndexStats,
} from '../../lib/dnd2024/dndSpellIndexRepository';
import type { DndSpellIndexScope } from '../../data/dnd2024/spellIndex';
import type { DndSpellIndexEntry } from '../../data/dnd2024/spellIndex';
import type { SpellInfo } from '../../lib/dnd-types';

/**
 * DndSpellIndexSearchPanel
 *
 * Read-only, collapsible master-detail panel over the DISPLAY-ONLY DND spell
 * index. The caller may pass a character-scoped subset; this component keeps
 * filtering inside that subset and only hydrates display metadata/details.
 *
 * It does NOT make these entries selectable or castable, does NOT write to the
 * character store, does NOT feed getAvailableSpells(), and does NOT change spell
 * preparation, slots, class spell lists, or runtime casting.
 */

const MAX_RESULTS = 100;

const SCOPE_LABELS: Record<DndSpellIndexScope, string> = {
  dnd2024: 'SRD 5.2',
  tcoe: 'TCoE',
  xgte: 'XGtE',
};

function levelShort(level: number): string {
  return level === 0 ? '戏法' : `${level} 环`;
}

function displayNameCn(entry: DndSpellIndexEntry): string {
  return entry.nameCn && entry.nameCn !== 'needs-human-check' ? entry.nameCn : entry.nameEn;
}

function displaySchool(entry: DndSpellIndexEntry, spell?: SpellInfo): string {
  if (entry.school && entry.school !== 'needs-human-check') return entry.school;
  return spell?.school ?? '待核对';
}

function displayClasses(entry: DndSpellIndexEntry, spell?: SpellInfo): string {
  const classes = entry.classes && entry.classes.length > 0 ? entry.classes : spell?.classes;
  return classes && classes.length > 0 ? classes.join(' / ') : '待核对';
}

function displaySource(entry: DndSpellIndexEntry): string {
  return entry.ruleMeta?.sourceRef ?? SCOPE_LABELS[entry.scope];
}

function displayTrust(entry: DndSpellIndexEntry, spell?: SpellInfo): string {
  return entry.ruleMeta?.trustLevel ?? spell?.ruleMeta?.trustLevel ?? 'needs-human-check';
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[\s'\-]+/g, '');
}

function spellIndexDetailKey(entry: DndSpellIndexEntry): string {
  return normalizeName(entry.nameEn);
}

function spellDataDetailKey(spell: SpellInfo): string {
  return normalizeName(spell.name_en);
}

function formatComponents(component: SpellInfo['component']): string {
  const parts = [
    component.v ? 'V' : undefined,
    component.s ? 'S' : undefined,
    component.m ? `M${component.comp_m ? `（${component.comp_m}）` : ''}` : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : '无';
}

function levelOptionLabel(level: number): string {
  return level === 0 ? '戏法 / Cantrip' : `${level} 环 / Lv ${level}`;
}

function buildStats(entries: readonly DndSpellIndexEntry[]): DndSpellIndexStats {
  const byScope: Record<DndSpellIndexScope, number> = { dnd2024: 0, tcoe: 0, xgte: 0 };
  const byLevel: Record<number, number> = {};
  const scopes: DndSpellIndexScope[] = [];

  for (const entry of entries) {
    byScope[entry.scope] += 1;
    byLevel[entry.level] = (byLevel[entry.level] ?? 0) + 1;
    if (!scopes.includes(entry.scope)) scopes.push(entry.scope);
  }

  return {
    total: entries.length,
    byScope,
    byLevel,
    levels: Object.keys(byLevel).map(Number).sort((a, b) => a - b),
    scopes,
  };
}

function filterEntries(
  entries: readonly DndSpellIndexEntry[],
  query: string,
  level: number | 'all',
  scope: DndSpellIndexScopeFilter,
): DndSpellIndexEntry[] {
  const normalizedQuery = query.trim().toLowerCase();

  return entries.filter((entry) => {
    if (scope !== 'all' && entry.scope !== scope) return false;
    if (level !== 'all' && entry.level !== level) return false;
    if (normalizedQuery) {
      const searchable = [
        entry.nameEn,
        entry.nameCn,
        entry.school,
        ...(entry.classes ?? []),
        SCOPE_LABELS[entry.scope],
        entry.ruleMeta?.source,
        entry.ruleMeta?.trustLevel,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchable.includes(normalizedQuery)) return false;
    }
    return true;
  });
}

export interface DndSpellIndexSearchPanelProps {
  entries?: DndSpellIndexEntry[];
  availabilityReason?: string;
  limitations?: string[];
}

export function DndSpellIndexSearchPanel({
  entries,
  availabilityReason,
  limitations = [],
}: DndSpellIndexSearchPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [scopeFilter, setScopeFilter] = useState<DndSpellIndexScopeFilter>('all');
  const [selectedSpellId, setSelectedSpellId] = useState<string | undefined>();

  const sourceEntries = useMemo(() => entries ?? [...listDndSpellIndexEntries()], [entries]);
  const spellDetailsByName = useMemo(() => {
    const map = new Map<string, SpellInfo>();
    for (const spell of SPELL_DATA) {
      map.set(spellDataDetailKey(spell), spell);
    }
    return map;
  }, []);
  const stats = useMemo(() => buildStats(sourceEntries), [sourceEntries]);
  const results = useMemo(
    () => filterEntries(sourceEntries, query, levelFilter, scopeFilter),
    [sourceEntries, query, levelFilter, scopeFilter],
  );
  const visible = results.slice(0, MAX_RESULTS);
  const selectedEntry = results.find((entry) => entry.id === selectedSpellId);
  const selectedDetail = selectedEntry ? spellDetailsByName.get(spellIndexDetailKey(selectedEntry)) : undefined;

  useEffect(() => {
    if (results.length === 0) {
      if (selectedSpellId) setSelectedSpellId(undefined);
      return;
    }

    if (!selectedSpellId || !results.some((entry) => entry.id === selectedSpellId)) {
      setSelectedSpellId(results[0].id);
    }
  }, [results, selectedSpellId]);

  return (
    <div className="rounded-lg border border-[#58180d]/20 bg-white/45 p-4 shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="w-full flex flex-wrap items-baseline justify-between gap-2 text-left"
      >
        <span className="text-sm font-black uppercase tracking-wide text-[#58180d]">
          法术索引 Spell Index {expanded ? '▴' : '▾'}
        </span>
        <span className="rounded-full bg-[#58180d]/8 px-2 py-0.5 text-[10px] text-[#2c1810]/55">
          角色上下文索引 · {stats.total} 条 · 不可选择 / 不可施放 / 不写入角色
        </span>
      </button>

      {expanded && (
        <div className="mt-3 text-xs font-sans">
          <p className="mb-2 rounded border border-[#58180d]/12 bg-[#ede1c5]/35 px-2 py-1.5 text-[10px] leading-relaxed text-[#2c1810]/65">
            只读角色上下文法术索引。列表使用 spellIndex 的中文名、学派、职业与来源 metadata；详情正文只在 SPELL_DATA 已有该法术时显示。此处不代表已知法术、已准备法术或可施放动作。
          </p>
          {availabilityReason && (
            <p className="mb-2 rounded border border-[#58180d]/12 bg-white/50 px-2 py-1.5 text-[10px] leading-relaxed text-[#2c1810]/70">
              {availabilityReason}
            </p>
          )}
          {limitations.length > 0 && (
            <div className="mb-2 rounded border border-amber-700/20 bg-amber-100/35 px-2 py-1.5 text-[10px] leading-relaxed text-[#2c1810]/65">
              <div className="mb-1 font-bold text-amber-900/80">限制说明 Limitations</div>
              <ul className="list-disc space-y-0.5 pl-4">
                {limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索中文名 / 英文名 / 学派 / 职业"
              className="min-w-0 flex-1 rounded border border-[#58180d]/20 bg-white/60 px-2 py-1 text-xs outline-none"
            />
            <select
              value={levelFilter === 'all' ? 'all' : String(levelFilter)}
              onChange={(event) =>
                setLevelFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))
              }
              className="rounded border border-[#58180d]/20 bg-white/60 px-2 py-1 text-xs"
              aria-label="按环阶筛选 Filter by level"
            >
              <option value="all">全部环阶 All levels</option>
              {stats.levels.map((level) => (
                <option key={level} value={String(level)}>
                  {levelOptionLabel(level)}
                </option>
              ))}
            </select>
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value as DndSpellIndexScopeFilter)}
              className="rounded border border-[#58180d]/20 bg-white/60 px-2 py-1 text-xs"
              aria-label="按来源筛选 Filter by scope"
            >
              <option value="all">全部来源 All sources</option>
              {stats.scopes.map((scope) => (
                <option key={scope} value={scope}>
                  {SCOPE_LABELS[scope]} ({stats.byScope[scope]})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2 text-[10px] text-[#2c1810]/60">
            匹配 {results.length} 条 Matches
            {results.length > MAX_RESULTS
              ? ` · 显示前 ${MAX_RESULTS} 条 Showing first ${MAX_RESULTS}`
              : ''}
          </div>

          <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="max-h-[28rem] space-y-1 overflow-y-auto pr-1">
            {visible.map((entry) => (
              <button
                type="button"
                key={entry.id}
                onClick={() => setSelectedSpellId(entry.id)}
                className={`w-full rounded border px-2 py-2 text-left transition ${
                  selectedSpellId === entry.id
                    ? 'border-[#58180d] bg-[#58180d] text-[#fdf6e3] shadow-sm'
                    : 'border-[#58180d]/10 bg-white/55 text-[#2c1810] hover:border-[#58180d]/40'
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{displayNameCn(entry)}</span>
                    <span className={selectedSpellId === entry.id ? 'block truncate text-[10px] text-[#fdf6e3]/75' : 'block truncate text-[10px] text-[#2c1810]/60'}>
                      {entry.nameEn}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-wrap justify-end gap-1 text-[10px]">
                    <span className={selectedSpellId === entry.id ? 'rounded-full bg-white/15 px-1.5 py-0.5 font-bold' : 'rounded-full bg-[#58180d]/10 px-1.5 py-0.5 font-bold text-[#58180d]/80'}>
                      {levelShort(entry.level)}
                    </span>
                    <span className={selectedSpellId === entry.id ? 'rounded-full bg-white/15 px-1.5 py-0.5' : 'rounded-full bg-[#58180d]/8 px-1.5 py-0.5 text-[#2c1810]/70'}>
                      {displaySchool(entry, spellDetailsByName.get(spellIndexDetailKey(entry)))}
                    </span>
                  </span>
                </span>
                <span className={selectedSpellId === entry.id ? 'mt-1 block truncate text-[10px] text-[#fdf6e3]/75' : 'mt-1 block truncate text-[10px] text-[#2c1810]/60'}>
                  {displayClasses(entry, spellDetailsByName.get(spellIndexDetailKey(entry)))} · {SCOPE_LABELS[entry.scope]}
                </span>
              </button>
            ))}
            {visible.length === 0 && (
              <div className="text-[10px] text-[#2c1810]/60">无匹配结果 No matching spells</div>
            )}
            </div>

            <div className="min-h-[18rem] rounded border border-[#58180d]/15 bg-white/60 p-3">
              {selectedEntry ? (
                <div className="space-y-3">
                  <div className="border-b border-[#58180d]/15 pb-2">
                    <h4 className="text-xl font-black leading-tight text-[#58180d]">{displayNameCn(selectedEntry)}</h4>
                    <p className="text-xs font-bold text-[#2c1810]/65">{selectedEntry.nameEn}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-[#2c1810]/70">
                      <span className="rounded-full bg-[#58180d]/10 px-2 py-0.5 font-bold text-[#58180d]">{levelShort(selectedEntry.level)}</span>
                      <span className="rounded-full bg-[#58180d]/8 px-2 py-0.5">{displaySchool(selectedEntry, selectedDetail)}</span>
                      <span className="rounded-full bg-[#58180d]/8 px-2 py-0.5">{SCOPE_LABELS[selectedEntry.scope]}</span>
                      <span className="rounded-full bg-[#58180d]/8 px-2 py-0.5">{displayTrust(selectedEntry, selectedDetail)}</span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                    <div>
                      <dt className="font-black uppercase tracking-wide text-[#58180d]/70">职业 Classes</dt>
                      <dd className="mt-0.5 text-[#2c1810]/80">{displayClasses(selectedEntry, selectedDetail)}</dd>
                    </div>
                    <div>
                      <dt className="font-black uppercase tracking-wide text-[#58180d]/70">来源 Source</dt>
                      <dd className="mt-0.5 break-words text-[#2c1810]/80">{displaySource(selectedEntry)}</dd>
                    </div>
                    {selectedDetail && (
                      <>
                        <div>
                          <dt className="font-black uppercase tracking-wide text-[#58180d]/70">施法时间</dt>
                          <dd className="mt-0.5 text-[#2c1810]/80">{selectedDetail.cast_time}</dd>
                        </div>
                        <div>
                          <dt className="font-black uppercase tracking-wide text-[#58180d]/70">距离</dt>
                          <dd className="mt-0.5 text-[#2c1810]/80">{selectedDetail.range}</dd>
                        </div>
                        <div>
                          <dt className="font-black uppercase tracking-wide text-[#58180d]/70">成分</dt>
                          <dd className="mt-0.5 text-[#2c1810]/80">{formatComponents(selectedDetail.component)}</dd>
                        </div>
                        <div>
                          <dt className="font-black uppercase tracking-wide text-[#58180d]/70">持续时间</dt>
                          <dd className="mt-0.5 text-[#2c1810]/80">{selectedDetail.duration}</dd>
                        </div>
                      </>
                    )}
                  </dl>

                  {selectedDetail ? (
                    <div className="space-y-3 border-t border-[#58180d]/12 pt-3">
                      <section>
                        <h5 className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#58180d]">法术说明</h5>
                        <p className="whitespace-pre-line text-xs leading-relaxed text-[#2c1810]/82">{selectedDetail.desc}</p>
                      </section>
                      {selectedDetail.upcast && (
                        <section>
                          <h5 className="mb-1 text-[11px] font-black uppercase tracking-wide text-[#58180d]">升环 / 戏法强化</h5>
                          <p className="whitespace-pre-line text-xs leading-relaxed text-[#2c1810]/82">{selectedDetail.upcast}</p>
                        </section>
                      )}
                    </div>
                  ) : (
                    <div className="rounded border border-dashed border-[#58180d]/25 bg-[#ede1c5]/35 p-3 text-xs leading-relaxed text-[#2c1810]/70">
                      <div className="font-black text-[#58180d]">仅有索引资料 / 详情待补</div>
                      <p className="mt-1">
                        该法术目前只在 spellIndex 中有中文名、学派、职业与来源 metadata；SPELL_DATA 尚无完整施法时间、距离、成分、持续时间与规则正文。这里不会凭记忆生成说明。
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[14rem] items-center justify-center rounded border border-dashed border-[#58180d]/20 bg-[#ede1c5]/25 p-4 text-center text-xs text-[#2c1810]/60">
                  请选择一个法术查看详情。
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
