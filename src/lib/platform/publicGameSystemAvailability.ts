/**
 * Which game systems the public frontend currently supports.
 *
 * AI-LANDMARK: PUBLIC_GAME_SYSTEM_AVAILABILITY_V1
 *
 * The product is D&D-first for now. Call of Cthulhu and Cyberpunk Red were
 * built against an older information architecture and no longer match the
 * current one, so their FRONTEND is paused while their domain code, stores,
 * rule data and persisted records are all kept intact.
 *
 * This module is a policy CONSTANT plus two predicates. It is deliberately not
 * a registry, a plugin point or a capability framework: adding a system back is
 * an edit to one array here plus restoring its own surfaces.
 *
 * What this does NOT do, on purpose:
 *   - It never touches saved data. A paused system's campaigns, characters and
 *     actor-vault records stay exactly where they are.
 *   - It never converts a record to another system.
 *   - It is a FRONTEND presentation policy only. Server-side system ids,
 *     validation and persistence are unchanged, so a paused system's data keeps
 *     round-tripping and can be re-exposed by reverting this file.
 */

/** Backend/campaign system ids, as stored. */
export const ACTIVE_PUBLIC_SYSTEM_IDS = ['dnd5e-2024'] as const;

/** Known but frontend-paused. Listed explicitly so the UI can say so honestly. */
export const PAUSED_PUBLIC_SYSTEM_IDS = ['coc7e', 'cp-red'] as const;

/** The frontend's own short system union, used by Home / PlayWorkspace. */
export type PublicWorkspaceSystem = 'D&D' | 'CoC' | 'CP';

export const ACTIVE_PUBLIC_WORKSPACE_SYSTEMS: readonly PublicWorkspaceSystem[] = ['D&D'];

function normalize(systemId: string | undefined): string {
  return (systemId ?? '').trim().toLowerCase();
}

/** True for a system the current frontend fully supports. */
export function isPubliclyAvailableSystemId(systemId: string | undefined): boolean {
  const value = normalize(systemId);
  return (ACTIVE_PUBLIC_SYSTEM_IDS as readonly string[]).some(
    (active) => value === active || value.startsWith('dnd'),
  );
}

/**
 * True for a system we know about but have paused.
 *
 * Distinguished from "unknown" so an unrecognised id is not mislabelled as a
 * paused first-party system.
 */
export function isPausedPublicSystemId(systemId: string | undefined): boolean {
  const value = normalize(systemId);
  if (isPubliclyAvailableSystemId(value)) return false;
  return value.startsWith('coc') || value === 'cp-red' || value.includes('cyberpunk');
}

export function isPubliclyAvailableWorkspaceSystem(system: PublicWorkspaceSystem): boolean {
  return ACTIVE_PUBLIC_WORKSPACE_SYSTEMS.includes(system);
}

/** Display name for a paused system, for the unavailable notice. */
export function pausedSystemDisplayName(systemId: string | undefined, locale: 'zh-CN' | 'en'): string {
  const value = normalize(systemId);
  if (value.startsWith('coc')) return locale === 'en' ? 'Call of Cthulhu 7e' : '克苏鲁的呼唤 7 版';
  if (value === 'cp-red' || value.includes('cyberpunk')) return locale === 'en' ? 'Cyberpunk RED' : '赛博朋克 RED';
  return locale === 'en' ? 'This game system' : '该规则系统';
}

/** One honest sentence, shared by every surface that has to explain the pause. */
export function pausedSystemNotice(systemId: string | undefined, locale: 'zh-CN' | 'en'): string {
  const name = pausedSystemDisplayName(systemId, locale);
  return locale === 'en'
    ? `${name} is temporarily unavailable in the current frontend. Your saved records are kept and nothing has been deleted or converted.`
    : `${name} 的前端暂时不可用。你已保存的记录仍然保留，没有被删除，也没有被转换成其他系统。`;
}
