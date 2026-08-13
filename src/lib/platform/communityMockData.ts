/**
 * Legacy community seed boundary.
 *
 * Public Fan Plaza and Workshop data must come from repositories backed by
 * real published records. These exports remain only for older architecture
 * imports and intentionally contain no fictional community content.
 */
import type { FanWork } from './communityTypes';
import type { WorkshopBrowseItem } from './workshopTypes';

export const FAN_WORKS: FanWork[] = [];
export const RELATED_FAN_WORKS_BY_WORKSHOP: Record<string, string[]> = {};

export function getFanWorkById(_id: string): FanWork | undefined {
  return undefined;
}

export function getRelatedFanWorkIdsForWorkshopItem(_workshopItemId: string): string[] {
  return [];
}

export function getRelatedWorkshopItems(_work: FanWork): WorkshopBrowseItem[] {
  return [];
}
