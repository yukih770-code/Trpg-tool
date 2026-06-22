/**
 * DND 2024 Spell Index repository (read-only display facade).
 *
 * AI-LANDMARK: DND_SPELL_INDEX_SEARCHABLE_DISPLAY_V1
 *
 * Read-only search/filter/stats over the DISPLAY-ONLY spell index in
 * src/data/dnd2024/spellIndex.ts. This is NOT runtime spell data:
 * - It only exposes the fields the index already has: id, nameEn, level, scope.
 * - nameCn / school in the index are 'needs-human-check' placeholders and are
 *   intentionally NOT surfaced as verified content here.
 * - It does NOT modify the index, does NOT touch SPELL_DATA / SpellInfo, does
 *   NOT write to any character store, and does NOT participate in spell
 *   selection, preparation, slots, class lists, or runtime casting.
 */

import {
  DND_2024_SPELL_INDEX_DATA,
  type DndSpellIndexEntry,
  type DndSpellIndexScope,
} from '../../data/dnd2024/spellIndex';

export type DndSpellIndexLevelFilter = number | 'all';
export type DndSpellIndexScopeFilter = DndSpellIndexScope | 'all';

export interface DndSpellIndexSearchFilters {
  /** Filter by spell level (0 = cantrip). 'all' (default) keeps every level. */
  level?: DndSpellIndexLevelFilter;
  /** Filter by source scope. 'all' (default) keeps every scope. */
  scope?: DndSpellIndexScopeFilter;
}

export interface DndSpellIndexStats {
  total: number;
  byScope: Record<DndSpellIndexScope, number>;
  byLevel: Record<number, number>;
  /** Distinct levels present, ascending. */
  levels: number[];
  /** Scopes present in fixed display order. */
  scopes: DndSpellIndexScope[];
}

const ALL_SCOPES: DndSpellIndexScope[] = ['dnd2024', 'tcoe', 'xgte'];

/** Full read-only index (no copy; callers must not mutate). */
export function listDndSpellIndexEntries(): readonly DndSpellIndexEntry[] {
  return DND_2024_SPELL_INDEX_DATA;
}

/**
 * Search by English name (substring, case-insensitive) plus optional level and
 * scope filters. Only uses the index's existing fields.
 */
export function searchDndSpellIndexEntries(
  query: string,
  filters: DndSpellIndexSearchFilters = {},
): DndSpellIndexEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  const level = filters.level ?? 'all';
  const scope = filters.scope ?? 'all';

  return DND_2024_SPELL_INDEX_DATA.filter((entry) => {
    if (scope !== 'all' && entry.scope !== scope) return false;
    if (level !== 'all' && entry.level !== level) return false;
    if (normalizedQuery && !entry.nameEn.toLowerCase().includes(normalizedQuery)) return false;
    return true;
  });
}

/** Totals and grouping for filter controls and headers. */
export function getDndSpellIndexStats(): DndSpellIndexStats {
  const byScope: Record<DndSpellIndexScope, number> = { dnd2024: 0, tcoe: 0, xgte: 0 };
  const byLevel: Record<number, number> = {};

  for (const entry of DND_2024_SPELL_INDEX_DATA) {
    byScope[entry.scope] += 1;
    byLevel[entry.level] = (byLevel[entry.level] ?? 0) + 1;
  }

  const levels = Object.keys(byLevel)
    .map((value) => Number(value))
    .sort((a, b) => a - b);

  return {
    total: DND_2024_SPELL_INDEX_DATA.length,
    byScope,
    byLevel,
    levels,
    scopes: ALL_SCOPES,
  };
}
