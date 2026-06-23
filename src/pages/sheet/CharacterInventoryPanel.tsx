import { useState, type ReactNode, type FocusEvent, type MouseEvent as ReactMouseEvent } from 'react';
import {
  CASUAL_SLOT_ORDER,
  DND_CURRENCY_LABELS,
  DND_CURRENCY_ORDER,
  EQUIPMENT_SLOT_LABELS,
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_LOCATION_LABELS,
  INVENTORY_LOCATION_ORDER,
  itemTotalWeight,
  loadoutForSlot,
  isLegacyStarterSummaryItem,
  type CharacterInventoryGroup,
  type CharacterInventoryItem,
  type EquipmentSlot,
  type InventoryItemCategory,
  type InventoryItemLocation,
  type InventorySystemId,
  type ParsedStarterEquipment,
} from '../../lib/platform/characterInventory';
import { useCharacterInventoryStore } from '../../lib/platform/characterInventoryStore';
import {
  CASUAL_OUTFIT_SLOT_LABELS,
  CASUAL_OUTFIT_SLOT_ORDER,
  type DndCasualOutfit,
} from '../../lib/dnd2024/dndCasualOutfits';
import { getDndItemDefinition } from '../../lib/dnd2024/dndItemRegistry';
import { autoSlotForDefinition, type StarterEquipmentPlan } from '../../lib/dnd2024/dndStarterEquipmentPlan';
import { deriveStarterEquipmentLifecycle } from '../../lib/dnd2024/dndStarterEquipmentLifecycle';

/**
 * CharacterInventoryPanel — character-library equipment view (v9: two-zone).
 *
 * Layout: LEFT = equipment slots (double-column short slot cards) + the
 * background casual-outfit template; RIGHT = backpack (merged text list).
 * There is NO persistent detail column — item detail is a FLOATING popover
 * (hover / click / focus) that does not occupy layout and is not clipped by
 * overflow. The detail is performance-first (core use → key stats → properties
 * → equip preview → state → in-world description → notes).
 *
 * This is a READ-ONLY local view. The ONLY mutation is equip / unequip (changes
 * `equipSlot` only). No add / delete / quantity edit / pickup / drop / trade /
 * consume / buy / sell / split / merge in the character-library stage. No
 * attacks, damage rolls, AC/MOVE writes, money settlement, or RuntimeLog. Full
 * equipment impact (AC/attack/skills) lives on the Overview page; here only a
 * lightweight preview is offered. Casual outfits are world-flavor only (no rule
 * bonuses); never expose a hidden identity, never use the term "RP".
 */
const EMPTY_ITEMS: never[] = [];
const EMPTY_WALLET: Record<string, number> = {};

type CategoryFilter = 'all' | InventoryItemCategory;
type LocationFilter = 'all' | InventoryItemLocation;
type SortBy = 'name' | 'weight' | 'quantity';

const QUICK_CATEGORIES: CategoryFilter[] = ['all', 'weapon', 'armor', 'gear', 'tool', 'consumable'];
const STORED_LOC: InventoryItemLocation[] = ['stored', 'base-storage'];
const r1 = (n: number) => Math.round(n * 10) / 10;

// Combat slots, laid out as two short columns + a Main/Off hand bottom row.
const COMBAT_COL_LEFT: EquipmentSlot[] = ['helmet', 'cloak', 'armor', 'boots', 'utility'];
const COMBAT_COL_RIGHT: EquipmentSlot[] = ['amulet', 'ring1', 'ring2', 'instrument', 'other'];

const CORE_USE: Partial<Record<InventoryItemCategory, string>> = {
  weapon: '用于战斗。可装备到主手或副手。',
  armor: '提供护甲保护。装备到盔甲槽。',
  shield: '提供格挡防护。可装备到副手。',
  gear: '通用装备 / 工具。可放入工具槽或留在背包。',
  tool: '工具，用于特定技艺（按规则资料）。',
  consumable: '消耗品。战役中使用，本地不消耗。',
  container: '容器，可容纳其他物品。',
  cyberware: '义体（跨系统字段）。',
  fashion: '服饰 / 常服，用于外观与世界内表现。',
  currency: '货币。',
  misc: '杂物。',
};

function sysStr(item: CharacterInventoryItem, key: string): string | undefined {
  const v = item.systemData?.[key];
  return typeof v === 'string' || typeof v === 'number' ? String(v) : undefined;
}

type PopState = { item: CharacterInventoryItem; x: number; y: number; pinned: boolean };

// Resolve an anchor point from an event. NEVER calls getBoundingClientRect on a
// null / disconnected node. Returns null when no safe anchor is available (e.g.
// React has already nulled currentTarget, or the node was unmounted by a
// re-render). Callers must treat null as "do not open / do not render".
function anchorFrom(e: ReactMouseEvent | FocusEvent | null | undefined): { x: number; y: number } | null {
  if (!e) return null;
  const me = e as ReactMouseEvent;
  if (typeof me.clientX === 'number' && me.clientX) return { x: me.clientX, y: me.clientY };
  const el = e.currentTarget as HTMLElement | null;
  if (!el || typeof el.getBoundingClientRect !== 'function') return null;
  if (typeof el.isConnected === 'boolean' && !el.isConnected) return null;
  const rect = el.getBoundingClientRect();
  return { x: rect.right, y: rect.top };
}

export interface CharacterInventoryPanelProps {
  title?: string;
  groups: CharacterInventoryGroup[];
  emptyText?: string;
  actorKey?: string;
  systemId?: InventorySystemId;
  encumbranceMode?: 'dnd' | 'none';
  currencyMode?: 'dnd' | 'none';
  legacyGoldGp?: number;
  legacyGroupsMode?: 'show' | 'import';
  /** DND: render the double-column equipment slots column. */
  showEquipmentSlots?: boolean;
  /** Parsed starter-equipment summary; shown as a selection UI when inventory is empty. */
  starter?: ParsedStarterEquipment;
  /** Definition-enriched starter plan (preferred over `starter` when provided). */
  starterPlan?: StarterEquipmentPlan;
  /** True when a legacy starter-summary string still lives in character.inventory (drives the breakdown prompt). */
  legacyStarterSummaryPresent?: boolean;
  /** Resolves a chosen starter name + quantity (+ optional definitionId) into a real item instance. */
  resolveStarterItem?: (name: string, quantity: number, sourceText?: string, definitionId?: string) => CharacterInventoryItem;
  /** DND: the background's starter casual-outfit template (world-flavor only). */
  casualOutfit?: DndCasualOutfit;
  /** Optional lightweight "本地预览" of equipment impact (de-emphasized; full derivation lives on Overview). */
  statPreview?: ReactNode;
  className?: string;
  headerClassName?: string;
  groupHeaderClassName?: string;
  itemClassName?: string;
  chipClassName?: string;
  /** Accepted for cross-system compatibility; not used in the read-only view. */
  controlClassName?: string;
}

export function CharacterInventoryPanel({
  title = '装备与背包 Equipment & Backpack',
  groups,
  actorKey,
  encumbranceMode = 'none',
  currencyMode = 'none',
  legacyGoldGp,
  legacyGroupsMode = 'show',
  showEquipmentSlots = false,
  starter,
  starterPlan,
  legacyStarterSummaryPresent,
  resolveStarterItem,
  casualOutfit,
  statPreview,
  className,
  headerClassName,
  groupHeaderClassName,
  itemClassName,
  chipClassName,
}: CharacterInventoryPanelProps) {
  const allOwnedItems = useCharacterInventoryStore((s) => (actorKey ? s.itemsByActor[actorKey] ?? EMPTY_ITEMS : EMPTY_ITEMS));
  const wallet = useCharacterInventoryStore((s) => (actorKey ? s.walletByActor[actorKey] ?? EMPTY_WALLET : EMPTY_WALLET));
  const equipInventoryItem = useCharacterInventoryStore((s) => s.equipInventoryItem);
  const unequipInventoryItem = useCharacterInventoryStore((s) => s.unequipInventoryItem);
  const addInventoryItem = useCharacterInventoryStore((s) => s.addInventoryItem);

  const [query, setQuery] = useState('');
  const [starterChoices, setStarterChoices] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [pop, setPop] = useState<PopState | null>(null);
  const [equipError, setEquipError] = useState<string | null>(null);

  const chip = chipClassName ?? 'bg-current/10';
  const showWallet = currencyMode === 'dnd';
  const canEquip = Boolean(actorKey);
  const activeId = pop?.item.instanceId ?? null;

  // Quarantine legacy fake "summary" items: they never render as backpack rows,
  // never occupy equipment slots, and never count toward weight. User data is
  // NOT deleted — these are simply excluded from the live view-model.
  const quarantinedItems = allOwnedItems.filter(isLegacyStarterSummaryItem);
  const ownedItems = allOwnedItems.filter((i) => !isLegacyStarterSummaryItem(i));
  const hasQuarantine = quarantinedItems.length > 0;

  const equippedItems = ownedItems.filter((i) => i.equipSlot);
  const bySlot = new Map<EquipmentSlot, CharacterInventoryItem>();
  equippedItems.forEach((i) => { if (i.equipSlot && !bySlot.has(i.equipSlot)) bySlot.set(i.equipSlot, i); });

  const allTags = Array.from(new Set(ownedItems.flatMap((i) => i.tags ?? []))).sort();

  // Weight preview (generic): equipped + non-stored backpack count toward carried.
  let carried = 0;
  let stored = 0;
  let total = 0;
  for (const i of ownedItems) {
    const w = itemTotalWeight(i);
    total += w;
    if (!i.equipSlot && STORED_LOC.includes(i.location)) stored += w;
    else if (i.location === 'installed') { /* not carried */ }
    else carried += w;
  }
  const weight = { carried: r1(carried), stored: r1(stored), total: r1(total) };

  const matchesFilters = (item: CharacterInventoryItem): boolean => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (locationFilter !== 'all' && item.location !== locationFilter) return false;
    if (tagFilter !== 'all' && !(item.tags ?? []).includes(tagFilter)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [item.name, item.notes ?? '', INVENTORY_CATEGORY_LABELS[item.category], (item.tags ?? []).join(' '), sysStr(item, 'description') ?? '']
      .some((v) => v.toLowerCase().includes(q));
  };

  // Backpack = items NOT equipped to a slot. Merge identical items into one row.
  const backpackRaw = ownedItems.filter((i) => !i.equipSlot && (i.quantity ?? 1) > 0 && matchesFilters(i));
  const signature = (i: CharacterInventoryItem) =>
    [i.sourceItemId ?? i.name, i.category, i.weight ?? '', (i.tags ?? []).slice().sort().join(','), i.notes ?? ''].join('|');
  const mergedMap = new Map<string, { rep: CharacterInventoryItem; qty: number }>();
  for (const i of backpackRaw) {
    const key = signature(i);
    const existing = mergedMap.get(key);
    if (existing) existing.qty += i.quantity ?? 1;
    else mergedMap.set(key, { rep: i, qty: i.quantity ?? 1 });
  }
  const backpackRows = Array.from(mergedMap.values()).sort((a, b) => {
    if (sortBy === 'weight') return itemTotalWeight(b.rep) - itemTotalWeight(a.rep);
    if (sortBy === 'quantity') return b.qty - a.qty;
    return a.rep.name.localeCompare(b.rep.name);
  });

  const legacyItems = groups.flatMap((g) => g.items);

  // Unified picker model: prefer the definition-enriched StarterEquipmentPlan;
  // fall back to the raw parsed summary (which lacks definitionIds).
  type PickOption = { name: string; vague: boolean; definitionId?: string };
  const pickerGroups: { id: string; options: PickOption[] }[] = starterPlan
    ? starterPlan.choices.map((c) => ({
        id: c.id,
        options: c.options.map((o) => ({ name: o.label, vague: Boolean(o.vague), definitionId: o.definitionId })),
      }))
    : starter?.groups.map((g) => ({ id: g.id, options: g.options.map((o) => ({ name: o.name, vague: o.vague })) })) ?? [];
  const pickerFixed: { name: string; quantity: number; definitionId?: string }[] = starterPlan
    ? starterPlan.fixed.map((f) => ({ name: f.label, quantity: f.quantity, definitionId: f.definitionId }))
    : starter?.fixed.map((f) => ({ name: f.name, quantity: f.quantity })) ?? [];
  const starterSourceText = starterPlan?.sourceText ?? starter?.raw ?? '';

  // Starter-equipment lifecycle (derived; no CharacterData change). Decides
  // whether to offer "生成初始装备" (pending-selection), "拆解旧版装备摘要"
  // (legacy-quarantined), or nothing (materialized / not-needed).
  const lifecycle = deriveStarterEquipmentLifecycle({
    ownedItems,
    quarantinedItems,
    starterPlan: starterPlan ?? null,
    hasLegacySummaryText: legacyStarterSummaryPresent,
  });
  const hasPickerContent = pickerGroups.length > 0 || pickerFixed.length > 0;
  const showStarterPicker =
    legacyGroupsMode === 'import' &&
    Boolean(resolveStarterItem) &&
    hasPickerContent &&
    (lifecycle.shouldShowGenerate || lifecycle.shouldShowLegacyBreakdown);
  const isLegacyBreakdown = lifecycle.shouldShowLegacyBreakdown;

  const defaultSlotForCategory = (category: InventoryItemCategory): EquipmentSlot => {
    switch (category) {
      case 'weapon': return 'mainHand';
      case 'shield': return 'offHand';
      case 'armor': return 'armor';
      case 'fashion': return 'casualClothing';
      case 'tool':
      case 'consumable':
      case 'gear': return 'utility';
      default: return 'other';
    }
  };

  // Default equip slot for the one-click "装备" button: prefer the definition's
  // equipProfile.defaultSlot / allowedSlots, fall back to a category guess only
  // when no definition is available.
  const defaultSlotForItem = (it: CharacterInventoryItem): EquipmentSlot => {
    const def = it.definitionId ? getDndItemDefinition(it.definitionId) : undefined;
    return (
      def?.equipProfile?.defaultSlot ??
      def?.equipProfile?.allowedSlots?.[0] ??
      def?.equipSlots?.[0] ??
      defaultSlotForCategory(it.category)
    );
  };

  // Materialize the plan into real instances. Auto-equip is driven by the
  // resolved definition's equipSlots (autoSlotForDefinition), never the name;
  // fixed spare weapons (e.g. daggers) stay in the backpack.
  const generateStarter = () => {
    if (!actorKey || !resolveStarterItem) return;
    // Re-generation guard: once starter items exist, never generate a second batch.
    if (lifecycle.state === 'materialized') return;
    const used = new Set<EquipmentSlot>(equippedItems.map((i) => i.equipSlot).filter(Boolean) as EquipmentSlot[]);
    const place = (item: CharacterInventoryItem, isChoice: boolean) => {
      addInventoryItem(actorKey, item);
      const def = item.definitionId ? getDndItemDefinition(item.definitionId) : undefined;
      const slot = autoSlotForDefinition(def, isChoice);
      if (slot && !used.has(slot)) {
        used.add(slot);
        equipInventoryItem(actorKey, item.instanceId, slot);
      }
    };
    pickerGroups.forEach((g) => {
      const idx = starterChoices[g.id];
      const opt = idx !== undefined ? g.options[idx] : undefined;
      if (opt && !opt.vague) place(resolveStarterItem(opt.name, 1, starterSourceText, opt.definitionId), true);
    });
    pickerFixed.forEach((f) => place(resolveStarterItem(f.name, f.quantity, starterSourceText, f.definitionId), false));
  };

  // ---- Floating popover handlers (hover / click / focus) ----
  // IMPORTANT: resolve the anchor SYNCHRONOUSLY here, while the event's
  // currentTarget is still valid. Doing it inside the setPop updater would run
  // after React has nulled currentTarget, crashing on getBoundingClientRect.
  const open = (item: CharacterInventoryItem, e: ReactMouseEvent | FocusEvent, pinned: boolean) => {
    const a = anchorFrom(e);
    if (!a) return;
    setPop((p) => (!pinned && p?.pinned ? p : { item, x: a.x, y: a.y, pinned }));
  };
  const leave = () => setPop((p) => (p && !p.pinned ? null : p));
  const closeItemPopover = () => setPop(null);

  // All equip / unequip goes through the Loadout Equip Service (via the store).
  // The UI never writes equipSlot directly. Failures surface as a light notice.
  const REASON_LABEL: Record<string, string> = {
    'item-not-found': '物品不存在',
    'missing-definition': '缺少装备定义，无法判断槽位',
    'invalid-slot': '该物品不能装备到此槽位',
    'slot-occupied': '槽位已被占用',
    'two-hand-conflict': '与双手武器冲突',
    'legacy-summary-item': '这是未拆解的初始装备摘要，不能装备',
  };
  const doEquip = (instanceId: string, slot: EquipmentSlot) => {
    if (!actorKey) return;
    const res = equipInventoryItem(actorKey, instanceId, slot);
    if (!res.ok) {
      console.warn('[loadout] equip failed:', res.reason, instanceId, slot);
      setEquipError(REASON_LABEL[res.reason] ?? res.reason);
    } else {
      setEquipError(null);
    }
  };
  const doUnequip = (instanceId: string) => {
    if (!actorKey) return;
    const res = unequipInventoryItem(actorKey, instanceId);
    if (!res.ok) {
      console.warn('[loadout] unequip failed:', res.reason, instanceId);
      setEquipError(REASON_LABEL[res.reason] ?? res.reason);
    } else {
      setEquipError(null);
    }
  };
  const popHandlers = (item: CharacterInventoryItem) => ({
    onMouseEnter: (e: ReactMouseEvent) => open(item, e, false),
    onMouseLeave: leave,
    onClick: (e: ReactMouseEvent) => open(item, e, true),
    onFocus: (e: FocusEvent) => open(item, e, false),
    tabIndex: 0,
  });

  const slotChipClass = 'rounded border px-2 py-1 text-[11px]';

  const renderSlot = (slot: EquipmentSlot) => {
    const item = bySlot.get(slot);
    const isSel = Boolean(item) && item!.instanceId === activeId;
    return (
      <div
        key={slot}
        {...(item ? popHandlers(item) : {})}
        className={`${slotChipClass} flex items-center justify-between gap-2 ${
          isSel ? `border-current/50 ${chip}` : item ? 'border-current/25 cursor-pointer' : 'border-dashed border-current/15 opacity-60'
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{EQUIPMENT_SLOT_LABELS[slot]}</span>
          <span className="min-w-0 truncate text-right">{item ? item.name : '空 Empty'}</span>
        </span>
        {item && canEquip && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeItemPopover(); doUnequip(item.instanceId); }}
            className="shrink-0 text-[9px] opacity-50 hover:opacity-100"
            title="卸下 Unequip"
          >卸下</button>
        )}
      </div>
    );
  };

  const renderDetail = (item: CharacterInventoryItem, pinned: boolean) => (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-black">{item.name}</div>
          <div className="mt-0.5 text-[10px] opacity-60">
            {INVENTORY_CATEGORY_LABELS[item.category]}
            {item.equipSlot ? ` · 已装备：${EQUIPMENT_SLOT_LABELS[item.equipSlot]}` : ' · 未装备'}
          </div>
        </div>
        {pinned && (
          <button type="button" onClick={() => setPop(null)} className="shrink-0 text-[11px] opacity-50 hover:opacity-100" title="关闭">✕</button>
        )}
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">核心作用 Core Use</div>
        <p className="mt-0.5 opacity-80">{CORE_USE[item.category] ?? '装备 / 物品。'}</p>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">关键数值 Key Stats</div>
        <div className="mt-0.5 space-y-0.5 opacity-85">
          {sysStr(item, 'damage') && <div>伤害 Damage: {sysStr(item, 'damage')} {sysStr(item, 'damageType') ?? ''} <span className="opacity-50">(预览 Preview)</span></div>}
          {sysStr(item, 'ac') && <div>AC: {sysStr(item, 'ac')} <span className="opacity-50">(预览 Preview)</span></div>}
          {sysStr(item, 'range') && <div>射程 Range: {sysStr(item, 'range')}</div>}
          <div>重量 Weight: {item.weight !== undefined ? `${item.weight} lb` : '—'} · 合计 {itemTotalWeight(item)} lb</div>
          {item.cost && <div>价格 / 价值: {item.cost}</div>}
          <div>数量 Qty: {item.quantity}</div>
        </div>
      </div>

      {item.tags && item.tags.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">特性 / 标签 Properties</div>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {item.tags.map((t) => <span key={t} className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chip}`}>{t}</span>)}
          </div>
        </div>
      )}

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">装备预览 Equip Preview</div>
        <p className="mt-0.5 opacity-75">
          {item.equipSlot
            ? `已装备到 ${EQUIPMENT_SLOT_LABELS[item.equipSlot]}（${loadoutForSlot(item.equipSlot) === 'casual' ? '常服' : '战斗'}）。`
            : '当前未装备。'} 详细 AC / 攻击影响见总览 Overview。
        </p>
        {canEquip ? (
          <select
            value={item.equipSlot ?? ''}
            onChange={(e) => { const v = e.target.value; closeItemPopover(); if (v) doEquip(item.instanceId, v as EquipmentSlot); else doUnequip(item.instanceId); }}
            className="mt-1 w-full rounded border border-current/25 bg-white/60 px-1.5 py-1 text-[11px] outline-none"
            aria-label="装备槽位 Equip slot"
          >
            <option value="">未装备 / 卸下 Unequipped</option>
            <optgroup label="战斗装备 Combat">
              {[...COMBAT_COL_LEFT, ...COMBAT_COL_RIGHT, 'mainHand', 'offHand'].map((slot) => (
                <option key={slot} value={slot}>{EQUIPMENT_SLOT_LABELS[slot as EquipmentSlot]}</option>
              ))}
            </optgroup>
            <optgroup label="常服 Casual">
              {CASUAL_SLOT_ORDER.map((slot) => (
                <option key={slot} value={slot}>{EQUIPMENT_SLOT_LABELS[slot]}</option>
              ))}
            </optgroup>
          </select>
        ) : (
          <p className="mt-1 text-[10px] italic opacity-45">装备 / 卸下需在角色上下文中操作。</p>
        )}
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">当前状态 Status</div>
        <div className="mt-0.5 opacity-80">
          位置: {INVENTORY_LOCATION_LABELS[item.location]} · 装备状态: {item.equipSlot ? EQUIPMENT_SLOT_LABELS[item.equipSlot] : '未装备'}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">背景描述 Description</div>
        <p className="mt-0.5 whitespace-pre-wrap opacity-70">{sysStr(item, 'description') ?? '暂无详细说明。'}</p>
      </div>

      {item.notes && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide opacity-70">玩家备注 Notes</div>
          <p className="mt-0.5 whitespace-pre-wrap opacity-70">{item.notes}</p>
        </div>
      )}
    </div>
  );

  // Popover position (fixed; offset 18px; flip / clamp so it is never clipped).
  let popStyle: { left: number; top: number } | null = null;
  if (pop && typeof window !== 'undefined') {
    const PW = 360, PH = 420, OFF = 18, M = 8;
    let left = pop.x + OFF;
    if (left + PW > window.innerWidth - M) left = pop.x - PW - OFF;
    if (left < M) left = M;
    let top = pop.y + OFF;
    if (top + PH > window.innerHeight - M) top = Math.max(M, window.innerHeight - PH - M);
    popStyle = { left, top };
  }
  // The popover stores an item SNAPSHOT; resolve the live instance so the detail
  // reflects current state and the popover safely disappears if the item was
  // removed / quarantined / no longer owned.
  const popItemLive = pop ? ownedItems.find((i) => i.instanceId === pop.item.instanceId) : undefined;

  const outfitChip = (label: string, value: string) => (
    <span className={`rounded-full border border-current/15 px-1.5 py-0.5 text-[9px] ${chip}`}>
      <span className="opacity-55">{label}:</span> {value}
    </span>
  );

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${className ?? ''}`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-current/10 pb-2">
        <span className={`text-sm font-black uppercase tracking-wide ${headerClassName ?? ''}`}>{title}</span>
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${chip}`}>本地预演 Local · 只读 + 装备</span>
      </div>

      {/* Wallet (read-only) + weight preview */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        {showWallet && (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold opacity-70">钱包:</span>
            {DND_CURRENCY_ORDER.map((coin) => (
              <span key={coin} className={`rounded-full border border-current/20 px-1.5 py-0.5 ${chip}`} title={DND_CURRENCY_LABELS[coin]}>
                {coin.toUpperCase()} {wallet[coin] ?? 0}
              </span>
            ))}
            {legacyGoldGp !== undefined && legacyGoldGp > 0 && <span className="text-[10px] opacity-45">（角色卡 gp: {legacyGoldGp}）</span>}
          </span>
        )}
        <span><strong className="opacity-70">随身 Carried:</strong> {weight.carried} lb</span>
        <span className="opacity-60">存放 Stored: {weight.stored} lb</span>
        <span className="opacity-60">总计 Total: {weight.total} lb</span>
        {encumbranceMode === 'dnd' && <span className="opacity-60">负重上限: 规则待接入 unknown</span>}
      </div>

      {equipError && (
        <div className="mb-2 rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-[10px] text-red-700">
          装备操作未完成：{equipError}
          <button type="button" onClick={() => setEquipError(null)} className="ml-2 underline opacity-70 hover:opacity-100">关闭</button>
        </div>
      )}

      {/* Two zones: LEFT equipment (~45%) · RIGHT backpack (~55%) */}
      <div className={`grid grid-cols-1 gap-4 ${showEquipmentSlots ? 'lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)]' : ''}`}>
        {/* ===== LEFT: Equipment slots + casual outfit ===== */}
        {showEquipmentSlots && (
          <div className="space-y-3">
            <div>
              <div className={`mb-1.5 text-[10px] font-bold uppercase tracking-wide ${groupHeaderClassName ?? ''}`}>战斗装备 Combat Gear</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                <div className="space-y-1.5">{COMBAT_COL_LEFT.map(renderSlot)}</div>
                <div className="space-y-1.5">{COMBAT_COL_RIGHT.map(renderSlot)}</div>
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {renderSlot('mainHand')}
                {renderSlot('offHand')}
              </div>
            </div>

            {/* Casual outfit (world-flavor template; no rule bonus) */}
            <div>
              <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${groupHeaderClassName ?? ''}`}>
                常服 Casual Outfit
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chip}`}>世界内 · 无规则加成</span>
              </div>
              {casualOutfit ? (
                <div className="rounded border border-current/15 p-2.5 text-[11px]">
                  <div className="text-xs font-bold">{casualOutfit.name}</div>
                  <div className="mt-0.5 text-[10px] opacity-60">身份印象：{casualOutfit.identity}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {outfitChip('场合', casualOutfit.occasions)}
                    {outfitChip('显眼', casualOutfit.visibility)}
                    {outfitChip('可信', casualOutfit.credibility)}
                    {outfitChip('隐蔽', casualOutfit.concealment)}
                    {outfitChip('环境', casualOutfit.environment)}
                    {outfitChip('规则影响', casualOutfit.ruleImpact)}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                    {CASUAL_OUTFIT_SLOT_ORDER.filter((s) => casualOutfit.slots[s]).map((s) => (
                      <div key={s} className="text-[10px]">
                        <span className="font-bold opacity-55">{CASUAL_OUTFIT_SLOT_LABELS[s]}：</span>
                        <span className="opacity-80">{casualOutfit.slots[s]}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[10px] opacity-70">{casualOutfit.description}</p>
                  <p className="mt-1.5 text-[9px] italic opacity-45">由背景生成的初始套装模板。仅为世界内描述，不提供任何规则加成。</p>
                </div>
              ) : (
                <p className="text-[11px] italic opacity-55">未匹配到背景常服模板。</p>
              )}
            </div>
          </div>
        )}

        {/* ===== RIGHT: Backpack ===== */}
        <div>
          {/* Toolbar (view only — no add) */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索 Search" className="min-w-0 flex-1 rounded border border-current/25 bg-white/60 px-1.5 py-1 outline-none" />
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value as LocationFilter)} className="rounded border border-current/25 bg-white/60 px-1.5 py-1 outline-none" aria-label="位置筛选">
              <option value="all">位置: 全部</option>
              {INVENTORY_LOCATION_ORDER.map((l) => <option key={l} value={l}>{INVENTORY_LOCATION_LABELS[l]}</option>)}
            </select>
            {allTags.length > 0 && (
              <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded border border-current/25 bg-white/60 px-1.5 py-1 outline-none" aria-label="标签筛选">
                <option value="all">标签: 全部</option>
                {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="rounded border border-current/25 bg-white/60 px-1.5 py-1 outline-none" aria-label="排序">
              <option value="name">排序: 名称</option>
              <option value="weight">排序: 重量</option>
              <option value="quantity">排序: 数量</option>
            </select>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {QUICK_CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategoryFilter(cat)}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition ${categoryFilter === cat ? `border-current/50 ${chip}` : 'border-current/15 opacity-60 hover:opacity-90'}`}>
                {cat === 'all' ? '全部 All' : INVENTORY_CATEGORY_LABELS[cat].split(' ')[0]}
              </button>
            ))}
          </div>

          <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${groupHeaderClassName ?? ''}`}>
            背包 Backpack
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chip}`}>{backpackRows.length}</span>
          </div>

          {/* Starter equipment picker (DND, when inventory is empty) */}
          {showStarterPicker && starter && (
            <div className="mb-3 space-y-2 rounded border border-current/20 p-2 text-[11px]">
              <p className="opacity-75">
                {isLegacyBreakdown
                  ? '检测到旧版初始装备摘要。它不是一个真实物品，需要拆解为单独物品后才能装备、计重和管理。请选择实际装备后拆解。'
                  : '根据职业初始装备选项生成真实物品实例。请选择实际装备后生成（武器自动装到主手、护甲到盔甲槽，匕首等留在背包）。'}
              </p>
              {starter.groups.map((g) => (
                <div key={g.id}>
                  <div className="mb-1 text-[10px] font-bold uppercase opacity-60">选择 Choose</div>
                  <div className="flex flex-wrap gap-1">
                    {g.options.map((opt, i) => (
                      <button key={i} type="button" disabled={opt.vague}
                        onClick={() => setStarterChoices((s) => ({ ...s, [g.id]: i }))}
                        title={opt.vague ? '需在 Builder 选择具体物品' : undefined}
                        className={`rounded-full border px-2 py-0.5 text-[10px] transition ${
                          starterChoices[g.id] === i ? `border-current/50 ${chip}` : 'border-current/20 opacity-70 hover:opacity-100'
                        } ${opt.vague ? 'cursor-default opacity-40' : ''}`}>
                        {opt.name}{opt.vague ? '（待 Builder）' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {starter.fixed.length > 0 && (
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase opacity-60">固定获得 Fixed</div>
                  <div className="text-[10px] opacity-75">{starter.fixed.map((f) => `${f.name}${f.quantity > 1 ? ` ×${f.quantity}` : ''}`).join(' · ')}</div>
                </div>
              )}
              <button type="button" onClick={generateStarter} className="rounded border border-current/40 px-2.5 py-1 text-[11px] font-bold uppercase opacity-90 hover:opacity-100">{isLegacyBreakdown ? '拆解旧版装备摘要 Break down' : '确认生成初始装备 Generate'}</button>
            </div>
          )}
          {!showStarterPicker && legacyGroupsMode === 'import' && ownedItems.length === 0 && legacyItems.length > 0 && (
            <p className="mb-2 text-[10px] italic opacity-50">检测到角色卡装备摘要（{legacyItems.length} 项）。导入属于 Builder / 战役结算流程。</p>
          )}

          {backpackRows.length === 0 ? (
            <p className="text-[11px] italic opacity-55">
              {ownedItems.length === 0 ? (showStarterPicker ? '请先在上方生成初始装备。' : '背包为空。物品由 Builder / 战役结算导入。') : '无匹配物品。'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {backpackRows.map(({ rep, qty }) => {
                const sel = rep.instanceId === activeId;
                return (
                  <div key={rep.instanceId} className={`flex items-center gap-2 rounded border px-2 py-1.5 text-[11px] transition ${sel ? `border-current/50 ${chip}` : 'border-current/10 hover:border-current/30'}`}>
                    <span {...popHandlers(rep)} className="min-w-0 flex-1 cursor-pointer text-left">
                      <div className="font-bold">{rep.name}{qty !== 1 ? ` ×${qty}` : ''}</div>
                      <div className="mt-0.5 text-[10px] opacity-60">
                        {INVENTORY_CATEGORY_LABELS[rep.category].split(' ')[0]} · {INVENTORY_LOCATION_LABELS[rep.location].split(' ')[0]}
                        {rep.weight !== undefined ? ` · ${rep.weight} lb each` : ''}
                        {rep.tags && rep.tags.length > 0 ? ` · 标签: ${rep.tags.join(' / ')}` : ''}
                      </div>
                    </span>
                    {canEquip && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); closeItemPopover(); doEquip(rep.instanceId, defaultSlotForItem(rep)); }} className="shrink-0 rounded border border-current/30 px-1.5 py-0.5 text-[9px] font-bold opacity-70 hover:opacity-100" title="装备到默认槽位 Equip">装备</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {legacyGroupsMode === 'show' && legacyItems.length > 0 && (
            <div className="mt-3 border-t border-current/10 pt-2">
              <div className={`mb-1.5 text-[10px] font-bold uppercase tracking-wide ${groupHeaderClassName ?? ''}`}>装备 Gear（只读）</div>
              <div className="space-y-1">
                {groups.filter((g) => g.items.length > 0).map((g) => g.items.map((item) => (
                  <div key={item.instanceId} className={`flex items-center justify-between gap-2 rounded border border-current/10 px-2 py-1.5 text-xs ${itemClassName ?? ''}`}>
                    <span className="min-w-0 truncate font-bold">{item.name}{item.quantity > 1 && <span className="ml-1 opacity-60">×{item.quantity}</span>}</span>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chip}`}>{INVENTORY_LOCATION_LABELS[item.location].split(' ')[0]}</span>
                  </div>
                )))}
              </div>
            </div>
          )}

          {/* Lightweight equipment-impact preview (full derivation lives on Overview). */}
          {statPreview && (
            <details className="mt-3 rounded border border-current/15 p-2 text-[11px]">
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wide opacity-70">装备影响（本地预览 · 详见总览 Overview）</summary>
              <div className="mt-2">{statPreview}</div>
            </details>
          )}
        </div>
      </div>

      {/* ===== Floating item-detail popover ===== */}
      {pop && popStyle && popItemLive && (
        <>
          {pop.pinned && <div className="fixed inset-0 z-40" onClick={() => setPop(null)} aria-hidden />}
          <div
            role="dialog"
            className="fixed z-50 max-w-[360px] rounded-lg border border-current/25 bg-white p-3 text-[11px] text-slate-800 shadow-xl"
            style={{ left: popStyle.left, top: popStyle.top, width: 360 }}
          >
            {renderDetail(popItemLive, pop.pinned)}
          </div>
        </>
      )}
    </div>
  );
}
