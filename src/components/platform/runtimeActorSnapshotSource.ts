import { useCharacterStore } from '../../store/characterStore';
import { useCocStore } from '../../store/cocStore';
import { useCpStore } from '../../store/cpStore';
// P5.6: actor ownership metadata flows through the read-adapter boundary.
import { defaultActorOwnershipReader } from '../../lib/platform/localRepositoryAdapters';

/**
 * runtimeActorSnapshotSource (M57) — read-only actor snapshot resolver.
 *
 * AI-LANDMARK: RUNTIME_ACTOR_SNAPSHOT_SOURCE_V0
 *
 * Bridges the lightweight room actor reference (actorId / displayName / systemId)
 * to whatever REAL character data exists in the local character stores (DND
 * characterStore / COC cocStore / CP-RED cpStore). It only READS store snapshots
 * (`getState()`), never subscribes, never writes, never edits a character. When
 * it can match the current player's character it returns that object as an opaque
 * `snapshot` for the safe adapters to read; when it cannot, it returns
 * sourceKind:'roomBinding'/'none' with a clear, user-facing warning instead of
 * throwing. It matches by character id first, then by name (case-insensitive).
 *
 * Note: these stores are the CURRENT user's local characters, so this reliably
 * resolves a player's own "我的角色"; it cannot resolve other players' snapshots
 * (those live on their machines) — the host roster reflects that honestly.
 */

export type RuntimeActorSnapshotSourceKind =
  | 'characterVault'
  | 'entryContext'
  | 'roomBinding'
  | 'mock'
  | 'none';

export interface RuntimeActorSnapshotQuery {
  systemId?: string;
  actorId?: string;
  displayName?: string;
}

export type RuntimeActorSnapshotMatchKind = 'actorId' | 'displayName' | 'name' | 'none';
export type RuntimeActorSnapshotMatchConfidence = 'high' | 'medium' | 'low' | 'none';

export interface RuntimeActorSnapshotSourceResult {
  snapshot?: unknown;
  sourceLabel: string;
  sourceKind: RuntimeActorSnapshotSourceKind;
  /** Optional ownership metadata from Actor Vault ownership registry. Never used as permission. */
  ownerId?: string;
  /** Product-facing ownership label; never expose raw ownerId in normal UI. */
  ownershipLabel?: string;
  /** How the local character was matched (M61). 'name' == fuzzy display-name match. */
  matchKind: RuntimeActorSnapshotMatchKind;
  /** Confidence in the match (M61): actorId=high, name=medium, binding-only=low. */
  matchConfidence: RuntimeActorSnapshotMatchConfidence;
  warnings: string[];
}

type SystemFamily = 'dnd5e' | 'coc7e' | 'cpred' | 'other';

function systemFamily(systemId?: string): SystemFamily {
  const s = (systemId ?? '').toLowerCase();
  if (s.includes('dnd') || s.includes('5e')) return 'dnd5e';
  if (s.includes('coc') || s.includes('cthulhu')) return 'coc7e';
  if (s.includes('cp') || s.includes('cyber') || s.includes('red')) return 'cpred';
  return 'other';
}

interface StoreLike {
  characters?: unknown;
}

/** Safely read a store's `characters` array via getState(); never throws. */
function readCharacters(getState: () => StoreLike): unknown[] {
  try {
    const state = getState();
    return Array.isArray(state.characters) ? state.characters : [];
  } catch {
    return [];
  }
}

function matchCharacter(
  list: unknown[],
  actorId?: string,
  displayName?: string,
): { character: unknown; matchKind: 'actorId' | 'displayName' } | undefined {
  const wantId = actorId?.trim();
  const wantName = displayName?.trim().toLowerCase();
  if (wantId) {
    const byId = list.find((c) => {
      const rec = c as { id?: unknown } | null;
      return rec && typeof rec.id === 'string' && rec.id === wantId;
    });
    if (byId) return { character: byId, matchKind: 'actorId' };
  }
  if (wantName) {
    const byName = list.find((c) => {
      const rec = c as { name?: unknown } | null;
      return rec && typeof rec.name === 'string' && rec.name.trim().toLowerCase() === wantName;
    });
    if (byName) return { character: byName, matchKind: 'displayName' };
  }
  return undefined;
}

function actorIdFromSnapshot(snapshot: unknown): string | undefined {
  const rec = snapshot && typeof snapshot === 'object' ? (snapshot as { id?: unknown }) : null;
  return rec && typeof rec.id === 'string' && rec.id.trim() !== '' ? rec.id.trim() : undefined;
}

function readOwnership(systemId?: string, actorId?: string): { ownerId?: string; ownershipLabel?: string } {
  const normalizedSystemId = systemId?.trim();
  const normalizedActorId = actorId?.trim();
  if (!normalizedSystemId || !normalizedActorId) return {};
  const ownership = defaultActorOwnershipReader.getActorOwnershipRecord(normalizedSystemId, normalizedActorId);
  if (!ownership?.ownerId) return {};
  return {
    ownerId: ownership.ownerId,
    ownershipLabel: '当前角色归属：本地用户',
  };
}

export function resolveRuntimeActorSnapshot(query: RuntimeActorSnapshotQuery): RuntimeActorSnapshotSourceResult {
  const family = systemFamily(query.systemId);
  const bindingOwnership = readOwnership(query.systemId, query.actorId);

  let list: unknown[] = [];
  let systemName = '';
  let conservative = false;
  switch (family) {
    case 'dnd5e':
      list = readCharacters(() => useCharacterStore.getState());
      systemName = 'DND 5E';
      break;
    case 'coc7e':
      list = readCharacters(() => useCocStore.getState());
      systemName = 'COC 7E';
      conservative = true;
      break;
    case 'cpred':
      list = readCharacters(() => useCpStore.getState());
      systemName = 'CP RED';
      conservative = true;
      break;
    default:
      return {
        sourceLabel: '未接入的系统',
        sourceKind: 'none',
        ...bindingOwnership,
        matchKind: 'none',
        matchConfidence: 'none',
        warnings: ['当前系统暂未接入完整角色快照，仅显示房间绑定信息。'],
      };
  }

  const matched = matchCharacter(list, query.actorId, query.displayName);
  if (matched) {
    const byName = matched.matchKind === 'displayName';
    const matchedActorId = actorIdFromSnapshot(matched.character) ?? query.actorId;
    const ownership = readOwnership(query.systemId, matchedActorId);
    // Match / provenance phrasing lives in the status banner (matchConfidence);
    // `warnings` only carries genuinely extra notes (e.g. conservative read).
    const warnings = conservative ? ['当前系统的角色快照为保守读取，部分字段可能暂不显示。'] : [];
    return {
      snapshot: matched.character,
      sourceLabel: `本地角色库 · ${systemName}`,
      sourceKind: 'characterVault',
      ...ownership,
      matchKind: matched.matchKind,
      matchConfidence: byName ? 'medium' : 'high',
      warnings,
    };
  }

  return {
    sourceLabel: '仅房间绑定',
    sourceKind: 'roomBinding',
    ...bindingOwnership,
    matchKind: 'none',
    matchConfidence: 'low',
    warnings: [],
  };
}
