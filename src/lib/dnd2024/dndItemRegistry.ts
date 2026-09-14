/**
 * DND 2024 Item Registry / Resolver (v1).
 *
 * AI-LANDMARK: DND_ITEM_REGISTRY
 *
 * Resolves a string (Chinese name, English name, alias, or definition id) to a
 * `DndItemDefinition`. Identity is the `id`, never the display name. Resolution
 * NEVER fabricates: a miss returns `undefined`. The sourced catalog and the
 * pending-source stubs are both registered, so starter items like 细剑 / 乐器
 * resolve to a (pending) definition with a stable id instead of a bare string.
 */

import { DND_ITEM_DEFINITIONS } from './dndItemDefinitions.js';
import type { DndItemDefinition } from './equipment-types.js';

const byId = new Map<string, DndItemDefinition>();
const byName = new Map<string, DndItemDefinition>();

function register(key: string | undefined, def: DndItemDefinition): void {
  if (!key) return;
  const norm = key.trim().toLowerCase();
  if (!norm) return;
  if (!byName.has(norm)) byName.set(norm, def);
}

for (const def of DND_ITEM_DEFINITIONS) {
  byId.set(def.id, def);
  register(def.nameCn, def);
  register(def.nameEn, def);
  (def.aliases ?? []).forEach((a) => register(a, def));
}

/** Look up a definition by its stable id. */
export function getDndItemDefinition(definitionId: string | undefined): DndItemDefinition | undefined {
  if (!definitionId) return undefined;
  return byId.get(definitionId.trim());
}

/** Resolve a free string (cn / en / alias / id) to a definition, or undefined. */
export function resolveDndItemDefinition(input: string | undefined): DndItemDefinition | undefined {
  if (!input) return undefined;
  const raw = input.trim();
  if (!raw) return undefined;
  return byId.get(raw) ?? byName.get(raw.toLowerCase());
}

/** Resolve a free string to a definition id, or undefined. */
export function resolveDndItemDefinitionId(input: string | undefined): string | undefined {
  return resolveDndItemDefinition(input)?.id;
}

/** All registered definitions (read-only). */
export function listDndItemDefinitions(): DndItemDefinition[] {
  return DND_ITEM_DEFINITIONS;
}
