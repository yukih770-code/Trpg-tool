/**
 * runtimeInventoryAdapter (M55) — safe, read-only inventory / equipment summary.
 *
 * AI-LANDMARK: RUNTIME_INVENTORY_ADAPTER_V0
 *
 * Reads whatever inventory data an (optional) actor snapshot happens to expose
 * into a read-only `RuntimeInventorySummary` for the character sheet. Like the
 * actor snapshot adapter it is DEFENSIVE: never throws, never fabricates items,
 * never writes a store, never mutates inputs, and degrades to empty sections +
 * a sourceWarning when no data exists. System-aware for DND 5e / CoC 7e / CP RED
 * via key aliases, so a real snapshot later fills the view with no UI change.
 * It does NO rules math (no weight, no auto-equip, no quantity settlement).
 */

export interface RuntimeInventoryItem {
  label: string;
  /** Optional secondary line, e.g. "x3 · 来源：战利品". */
  detail?: string;
}

export interface RuntimeInventorySummary {
  equipped: RuntimeInventoryItem[];
  inventory: RuntimeInventoryItem[];
  consumables: RuntimeInventoryItem[];
  currency: RuntimeInventoryItem[];
  hasAny: boolean;
  sourceWarnings: string[];
}

export interface RuntimeInventoryInput {
  snapshot?: unknown;
  systemId?: string;
}

type SystemFamily = 'dnd5e' | 'coc7e' | 'cpred' | 'other';

// ── Safe readers ─────────────────────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function firstDefined(rec: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const v = rec[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function toText(v: unknown): string | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  return undefined;
}

/** Build a "x2 · 来源：战利品 · 已损坏" style detail line from an item record. */
function itemDetail(rec: Record<string, unknown>): string | undefined {
  const parts: string[] = [];
  const qty = toText(firstDefined(rec, ['quantity', 'qty', 'count', 'amount']));
  if (qty && qty !== '1') parts.push(`x${qty}`);
  const source = toText(firstDefined(rec, ['source', 'origin']));
  if (source) parts.push(`来源：${source}`);
  const condition = toText(firstDefined(rec, ['condition', 'state', 'status']));
  if (condition) parts.push(condition);
  const note = toText(firstDefined(rec, ['note', 'notes']));
  if (note) parts.push(note);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/** Read an array (of strings / item objects) or a record map into items. Bounded. */
function readItemList(rec: Record<string, unknown> | null, keys: string[], max = 12): RuntimeInventoryItem[] {
  if (!rec) return [];
  const v = firstDefined(rec, keys);
  const out: RuntimeInventoryItem[] = [];
  if (Array.isArray(v)) {
    for (const item of v) {
      if (out.length >= max) break;
      if (typeof item === 'string' && item.trim() !== '') {
        out.push({ label: item.trim() });
        continue;
      }
      const r = asRecord(item);
      if (!r) continue;
      const label = toText(firstDefined(r, ['name', 'label', 'title', 'item']));
      if (label) out.push({ label, detail: itemDetail(r) });
    }
    return out;
  }
  const asRec = asRecord(v);
  if (asRec) {
    for (const [label, raw] of Object.entries(asRec)) {
      if (out.length >= max) break;
      const r = asRecord(raw);
      if (r) {
        out.push({ label, detail: itemDetail(r) });
      } else {
        const amount = toText(raw);
        out.push({ label, detail: amount && amount !== '1' ? `x${amount}` : undefined });
      }
    }
  }
  return out;
}

/** Read scalar labelled values (e.g. currency: gold=10) into items. */
function readScalarItems(rec: Record<string, unknown> | null, specs: { keys: string[]; label: string }[]): RuntimeInventoryItem[] {
  if (!rec) return [];
  const out: RuntimeInventoryItem[] = [];
  for (const spec of specs) {
    const value = toText(firstDefined(rec, spec.keys));
    if (value !== undefined) out.push({ label: spec.label, detail: value });
  }
  return out;
}

function dedupeConcat(...lists: RuntimeInventoryItem[][]): RuntimeInventoryItem[] {
  const seen = new Set<string>();
  const out: RuntimeInventoryItem[] = [];
  for (const list of lists) {
    for (const item of list) {
      const key = `${item.label}|${item.detail ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function systemFamily(systemId?: string): SystemFamily {
  const s = (systemId ?? '').toLowerCase();
  if (s.includes('dnd') || s.includes('5e')) return 'dnd5e';
  if (s.includes('coc') || s.includes('cthulhu')) return 'coc7e';
  if (s.includes('cp') || s.includes('cyber') || s.includes('red')) return 'cpred';
  return 'other';
}

interface InventorySections {
  equipped: RuntimeInventoryItem[];
  inventory: RuntimeInventoryItem[];
  consumables: RuntimeInventoryItem[];
  currency: RuntimeInventoryItem[];
}

function extractDnd(rec: Record<string, unknown> | null): InventorySections {
  const equipped = dedupeConcat(
    readItemList(rec, ['equipped', 'equippedItems', 'equipment']),
    readItemList(rec, ['weapons']),
    readItemList(rec, ['armor', 'shield']),
  );
  const inventory = dedupeConcat(
    readItemList(rec, ['inventory', 'gear', 'items', 'pack', 'backpack']),
    readItemList(rec, ['magicItems']),
  );
  const consumables = readItemList(rec, ['consumables', 'potions', 'scrolls']);
  const currency = dedupeConcat(
    readItemList(rec, ['currency', 'coins', 'money']),
    readScalarItems(rec, [
      { keys: ['gp', 'gold'], label: '金币 (GP)' },
      { keys: ['sp', 'silver'], label: '银币 (SP)' },
      { keys: ['cp', 'copper'], label: '铜币 (CP)' },
    ]),
  );
  return { equipped, inventory, consumables, currency };
}

function extractCoc(rec: Record<string, unknown> | null): InventorySections {
  const equipped = readItemList(rec, ['weapons', 'equipped']);
  const inventory = dedupeConcat(
    readItemList(rec, ['belongings', 'gear', 'items', 'inventory', 'possessions']),
    readItemList(rec, ['tools', 'investigationTools']),
  );
  const consumables = readItemList(rec, ['medical', 'consumables', 'firstAid']);
  const currency = dedupeConcat(
    readItemList(rec, ['currency', 'cash', 'money']),
    readScalarItems(rec, [
      { keys: ['cash', 'spendingLevel'], label: '现金' },
      { keys: ['creditRating', 'credit'], label: '信用评级' },
    ]),
  );
  return { equipped, inventory, consumables, currency };
}

function extractCpred(rec: Record<string, unknown> | null): InventorySections {
  const equipped = dedupeConcat(
    readItemList(rec, ['weapons']),
    readItemList(rec, ['armor']),
    readItemList(rec, ['cyberware', 'implants']),
  );
  const inventory = readItemList(rec, ['gear', 'equipment', 'inventory', 'items']);
  const consumables = readItemList(rec, ['ammo', 'ammunition', 'consumables']);
  const currency = dedupeConcat(
    readItemList(rec, ['currency', 'money']),
    readScalarItems(rec, [{ keys: ['eddies', 'eb', 'eurodollars'], label: 'Eddies (€$)' }]),
  );
  return { equipped, inventory, consumables, currency };
}

function extractByFamily(family: SystemFamily, rec: Record<string, unknown> | null): InventorySections {
  switch (family) {
    case 'dnd5e': return extractDnd(rec);
    case 'coc7e': return extractCoc(rec);
    case 'cpred': return extractCpred(rec);
    default:
      return {
        equipped: readItemList(rec, ['equipped', 'weapons', 'armor']),
        inventory: readItemList(rec, ['inventory', 'gear', 'items', 'equipment']),
        consumables: readItemList(rec, ['consumables', 'ammo']),
        currency: readItemList(rec, ['currency', 'money']),
      };
  }
}

/** Build a read-only inventory summary from the best available snapshot data. */
export function buildRuntimeInventorySummary(input: RuntimeInventoryInput): RuntimeInventorySummary {
  const rec = asRecord(input.snapshot);
  const sections = extractByFamily(systemFamily(input.systemId), rec);

  const hasAny =
    sections.equipped.length > 0 ||
    sections.inventory.length > 0 ||
    sections.consumables.length > 0 ||
    sections.currency.length > 0;

  const sourceWarnings: string[] = [];
  if (!hasAny) {
    sourceWarnings.push(
      '当前角色快照还没有提供可展示的装备 / 背包数据。战役内物品变化会先进入日志和回顾，不会自动改写角色库原件。',
    );
  }

  return { ...sections, hasAny, sourceWarnings };
}
