import { useMemo, useState } from 'react';
import {
  listDndSpellIndexEntries,
  type DndSpellIndexScopeFilter,
  type DndSpellIndexStats,
} from '../../lib/dnd2024/dndSpellIndexRepository';
import type { DndSpellIndexScope } from '../../data/dnd2024/spellIndex';
import type { DndSpellIndexEntry } from '../../data/dnd2024/spellIndex';

/**
 * DndSpellIndexSearchPanel
 *
 * Read-only, collapsible search/browse panel over the DISPLAY-ONLY DND spell
 * index. It uses only the index's existing fields (English name, level, scope).
 *
 * It does NOT make these entries selectable or castable, does NOT write to the
 * character store, does NOT feed getAvailableSpells(), and does NOT change spell
 * preparation, slots, class spell lists, or runtime casting. Chinese names and
 * schools remain pending verification and are intentionally not shown.
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
    if (normalizedQuery && !entry.nameEn.toLowerCase().includes(normalizedQuery)) return false;
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

  const sourceEntries = useMemo(() => entries ?? [...listDndSpellIndexEntries()], [entries]);
  const stats = useMemo(() => buildStats(sourceEntries), [sourceEntries]);
  const results = useMemo(
    () => filterEntries(sourceEntries, query, levelFilter, scopeFilter),
    [sourceEntries, query, levelFilter, scopeFilter],
  );
  const visible = results.slice(0, MAX_RESULTS);

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
            只读法术索引（仅英文名 / 环阶 / 来源），不代表完整可施放法术数据。中文名与学派仍待人工核对（pending verification），此处不展示。可施放法术仍以角色卡的运行时法术数据为准。
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
              placeholder="搜索英文名 Search by English name"
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

          <div className="mt-2 space-y-1">
            {visible.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded border border-[#58180d]/10 bg-white/55 px-2 py-1.5"
              >
                <span className="min-w-0 truncate font-bold text-[#58180d]">{entry.nameEn}</span>
                <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-[#2c1810]/70">
                  <span className="rounded-full bg-[#58180d]/10 px-1.5 py-0.5 font-bold text-[#58180d]/80">{levelShort(entry.level)}</span>
                  <span className="opacity-70">{SCOPE_LABELS[entry.scope]}</span>
                </span>
              </div>
            ))}
            {visible.length === 0 && (
              <div className="text-[10px] text-[#2c1810]/60">无匹配结果 No matching spells</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
