import { tokenInitials } from './actorPresence';
import type { MapToken, MapTokenKind } from './mapRuntimeTypes';

/**
 * Display-only identity for one rendered map token.
 *
 * One token is one circular visual body. HP, conditions, and combat linkage are
 * deliberately separate labels so they cannot be mistaken for another unit.
 */
export interface ResolvedTokenVisualIdentity {
  imageUrl?: string;
  initials: string;
  label: string;
  kind: MapTokenKind;
  hpSummary?: string;
  conditionSummary?: string;
  hasCombatLink: boolean;
}

export function resolveTokenVisualIdentity(
  token: Pick<MapToken, 'name' | 'displayName' | 'imageUrl' | 'initials' | 'kind' | 'hpSummary' | 'conditionSummary' | 'combatantId' | 'sourceCombatantId'>,
  options: { imageFailed?: boolean } = {},
): ResolvedTokenVisualIdentity {
  const label = token.displayName?.trim() || token.name?.trim() || '?';
  const imageUrl = token.imageUrl?.trim();
  const hp = token.hpSummary;
  const hpSummary = hp && (hp.current !== undefined || hp.max !== undefined || hp.temporary !== undefined)
    ? `HP ${hp.current ?? '—'}${hp.max !== undefined ? `/${hp.max}` : ''}${hp.temporary ? ` +${hp.temporary}` : ''}`
    : undefined;

  return {
    imageUrl: imageUrl && !options.imageFailed ? imageUrl : undefined,
    initials: token.initials?.trim() || tokenInitials(label),
    label,
    kind: token.kind ?? 'unknown',
    hpSummary,
    conditionSummary: token.conditionSummary?.find((condition) => condition.trim())?.trim(),
    hasCombatLink: Boolean(token.combatantId ?? token.sourceCombatantId),
  };
}
