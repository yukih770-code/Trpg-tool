/**
 * Platform Fan Plaza — filter / sort helpers (scaffold, pure functions).
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 */
import type { FanWork, FanWorkSystem, FanWorkType } from './communityTypes';
import { getRelationsByIds } from './linkableEntityMockData';
import type { LinkableEntityType } from './linkableEntityTypes';

export const FAN_WORK_TYPE_KEYS: FanWorkType[] = [
  'story',
  'campaignRecap',
  'illustration',
  'comic',
  'music',
  'setting',
  'characterProfile',
  'essay',
];

export const FAN_WORK_SYSTEM_KEYS: FanWorkSystem[] = [
  'dnd5e2024',
  'coc7e',
  'cyberpunkRed',
  'generic',
  'original',
];

/** Related-object filter (a subset of LinkableEntityType relevant to fan works). */
export const FAN_WORK_RELATION_KEYS: LinkableEntityType[] = [
  'actor',
  'campaign',
  'map',
  'sessionLog',
  'workshopItem',
  'world',
];

export type FanWorkSort = 'featured' | 'newest' | 'popular' | 'highFavorite' | 'recentlyUpdated';

export const FAN_WORK_SORT_KEYS: FanWorkSort[] = [
  'featured',
  'newest',
  'popular',
  'highFavorite',
  'recentlyUpdated',
];

/** Target entity types this fan work links to (via its relations). */
export function fanWorkRelatedTypes(work: FanWork): LinkableEntityType[] {
  return getRelationsByIds(work.relationIds).map((r) => r.targetType);
}

export type FanPlazaFilterState = {
  search: string;
  type: FanWorkType | 'all';
  system: FanWorkSystem | 'all';
  relatedObject: LinkableEntityType | 'all';
  sort: FanWorkSort;
};

export function filterAndSortFanWorks(works: FanWork[], filter: FanPlazaFilterState): FanWork[] {
  const q = filter.search.trim().toLowerCase();

  const filtered = works.filter((w) => {
    if (filter.type !== 'all' && w.type !== filter.type) return false;
    if (filter.system !== 'all' && w.systemId !== filter.system) return false;
    if (filter.relatedObject !== 'all' && !fanWorkRelatedTypes(w).includes(filter.relatedObject)) return false;
    if (q) {
      const haystack = [w.title, w.authorName, w.summary, ...w.tags].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filter.sort) {
    case 'newest':
      sorted.sort((a, b) => b.createdAtLabel.localeCompare(a.createdAtLabel));
      break;
    case 'recentlyUpdated':
      sorted.sort((a, b) => b.updatedAtLabel.localeCompare(a.updatedAtLabel));
      break;
    case 'popular':
      sorted.sort((a, b) => b.likeCount - a.likeCount);
      break;
    case 'highFavorite':
      sorted.sort((a, b) => b.favoriteCount - a.favoriteCount);
      break;
    case 'featured':
    default:
      // keep insertion order (curated/featured)
      break;
  }
  return sorted;
}
