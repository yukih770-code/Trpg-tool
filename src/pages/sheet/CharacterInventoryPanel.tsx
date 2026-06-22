import { useState } from 'react';
import {
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_CATEGORY_ORDER,
  INVENTORY_LOCATION_LABELS,
  INVENTORY_LOCATION_ORDER,
  groupInventoryByLocation,
  makeInventoryItem,
  type CharacterInventoryGroup,
  type InventoryItemCategory,
  type InventoryItemLocation,
  type InventorySystemId,
} from '../../lib/platform/characterInventory';
import { useCharacterInventoryStore } from '../../lib/platform/characterInventoryStore';

/**
 * CharacterInventoryPanel
 *
 * Two layers:
 *  1. Read-only system equipment (`groups`) built by each sheet from existing
 *     character fields (weapons / armor / cyberware …). Display only.
 *  2. Editable, PERSISTED owned items ("背包维护") backed by
 *     characterInventoryStore, keyed by `actorKey`. Supports add / edit
 *     quantity-notes / move location / delete. This is character-profile
 *     maintenance, NOT a runtime action: no attacks, purchases, equip stat
 *     effects, AC math, money settlement, or RuntimeLog.
 */
const EMPTY_ITEMS: never[] = [];

export interface CharacterInventoryPanelProps {
  title?: string;
  groups: CharacterInventoryGroup[];
  emptyText?: string;
  /** When provided (with systemId), enables the persisted editable section. */
  actorKey?: string;
  systemId?: InventorySystemId;
  className?: string;
  headerClassName?: string;
  groupHeaderClassName?: string;
  itemClassName?: string;
  chipClassName?: string;
  controlClassName?: string;
}

export function CharacterInventoryPanel({
  title = '背包与装备 Inventory',
  groups,
  emptyText = '暂无背包物品。Empty backpack.',
  actorKey,
  systemId,
  className,
  headerClassName,
  groupHeaderClassName,
  itemClassName,
  chipClassName,
  controlClassName,
}: CharacterInventoryPanelProps) {
  const editable = Boolean(actorKey && systemId);

  const ownedItems = useCharacterInventoryStore((state) =>
    actorKey ? state.itemsByActor[actorKey] ?? EMPTY_ITEMS : EMPTY_ITEMS,
  );
  const addInventoryItem = useCharacterInventoryStore((state) => state.addInventoryItem);
  const updateInventoryItem = useCharacterInventoryStore((state) => state.updateInventoryItem);
  const removeInventoryItem = useCharacterInventoryStore((state) => state.removeInventoryItem);
  const setInventoryItemLocation = useCharacterInventoryStore((state) => state.setInventoryItemLocation);

  const [draftName, setDraftName] = useState('');
  const [draftCategory, setDraftCategory] = useState<InventoryItemCategory>('gear');
  const [draftLocation, setDraftLocation] = useState<InventoryItemLocation>('backpack');
  const [draftQty, setDraftQty] = useState(1);

  const readOnlyGroups = groups.filter((group) => group.items.length > 0);
  const ownedGroups = groupInventoryByLocation(ownedItems);

  const ctrl =
    controlClassName ?? 'rounded border border-current/25 bg-white/60 px-1.5 py-0.5 text-[11px] outline-none';

  const handleAdd = () => {
    const name = draftName.trim();
    if (!name || !actorKey || !systemId) return;
    addInventoryItem(
      actorKey,
      makeInventoryItem({
        systemId,
        name,
        category: draftCategory,
        location: draftLocation,
        quantity: draftQty,
      }),
    );
    setDraftName('');
    setDraftQty(1);
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${className ?? ''}`}>
      <div className={`mb-3 border-b border-current/10 pb-2 text-sm font-black uppercase tracking-wide ${headerClassName ?? ''}`}>
        {title}
      </div>

      {/* Read-only system equipment */}
      {readOnlyGroups.length === 0 ? (
        <p className="text-[11px] italic opacity-55">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {readOnlyGroups.map((group) => (
            <div key={group.id}>
              <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${groupHeaderClassName ?? ''}`}>
                {group.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chipClassName ?? 'bg-current/10'}`}>
                  {group.items.length}
                </span>
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div
                    key={item.instanceId}
                    className={`flex items-center justify-between gap-2 rounded border border-current/10 px-2 py-1.5 text-xs ${itemClassName ?? ''}`}
                  >
                    <span className="min-w-0 truncate font-bold">
                      {item.name}
                      {item.quantity > 1 && <span className="ml-1 opacity-60">×{item.quantity}</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[10px] opacity-70">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chipClassName ?? 'bg-current/10'}`}>
                        {INVENTORY_CATEGORY_LABELS[item.category]}
                      </span>
                      {item.cost && <span>{item.cost}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editable, persisted owned items */}
      {editable && (
        <div className="mt-4 border-t border-current/10 pt-3">
          <div className={`mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${groupHeaderClassName ?? ''}`}>
            背包维护 Owned Items
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chipClassName ?? 'bg-current/10'}`}>
              {ownedItems.length}
            </span>
          </div>

          {/* Add item */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="物品名称 Item name"
              className={`min-w-0 flex-1 ${ctrl}`}
            />
            <select value={draftCategory} onChange={(event) => setDraftCategory(event.target.value as InventoryItemCategory)} className={ctrl} aria-label="类别 Category">
              {INVENTORY_CATEGORY_ORDER.map((category) => (
                <option key={category} value={category}>{INVENTORY_CATEGORY_LABELS[category]}</option>
              ))}
            </select>
            <select value={draftLocation} onChange={(event) => setDraftLocation(event.target.value as InventoryItemLocation)} className={ctrl} aria-label="位置 Location">
              {INVENTORY_LOCATION_ORDER.map((location) => (
                <option key={location} value={location}>{INVENTORY_LOCATION_LABELS[location]}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={draftQty}
              onChange={(event) => setDraftQty(Math.max(1, Number(event.target.value) || 1))}
              className={`w-14 ${ctrl}`}
              aria-label="数量 Quantity"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draftName.trim()}
              className="rounded border border-current/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider opacity-90 transition hover:opacity-100 disabled:cursor-default disabled:opacity-40"
            >
              添加 Add
            </button>
          </div>

          {ownedItems.length === 0 ? (
            <p className="text-[11px] italic opacity-55">暂无自定义物品。可在上方添加。</p>
          ) : (
            <div className="space-y-3">
              {ownedGroups.map((group) => (
                <div key={group.id}>
                  <div className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${groupHeaderClassName ?? ''}`}>
                    {group.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${chipClassName ?? 'bg-current/10'}`}>
                      {group.items.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <div
                        key={item.instanceId}
                        className={`flex flex-wrap items-center gap-1.5 rounded border border-current/10 px-2 py-1.5 text-[11px] ${itemClassName ?? ''}`}
                      >
                        <input
                          value={item.name}
                          onChange={(event) => actorKey && updateInventoryItem(actorKey, item.instanceId, { name: event.target.value })}
                          className={`min-w-0 flex-1 font-bold ${ctrl}`}
                          aria-label="名称 Name"
                        />
                        <select
                          value={item.location}
                          onChange={(event) => actorKey && setInventoryItemLocation(actorKey, item.instanceId, event.target.value as InventoryItemLocation)}
                          className={ctrl}
                          aria-label="位置 Location"
                        >
                          {INVENTORY_LOCATION_ORDER.map((location) => (
                            <option key={location} value={location}>{INVENTORY_LOCATION_LABELS[location]}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) => actorKey && updateInventoryItem(actorKey, item.instanceId, { quantity: Number(event.target.value) || 1 })}
                          className={`w-12 ${ctrl}`}
                          aria-label="数量 Quantity"
                        />
                        <input
                          value={item.notes ?? ''}
                          onChange={(event) => actorKey && updateInventoryItem(actorKey, item.instanceId, { notes: event.target.value })}
                          placeholder="备注 Notes"
                          className={`min-w-0 flex-1 ${ctrl}`}
                          aria-label="备注 Notes"
                        />
                        <button
                          type="button"
                          onClick={() => actorKey && removeInventoryItem(actorKey, item.instanceId)}
                          aria-label="删除 Delete"
                          title="删除 Delete"
                          className="shrink-0 rounded border border-current/20 px-1.5 py-0.5 text-[12px] leading-none opacity-60 transition hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
