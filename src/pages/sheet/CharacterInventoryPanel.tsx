import {
  INVENTORY_CATEGORY_LABELS,
  type CharacterInventoryGroup,
} from '../../lib/platform/characterInventory';

/**
 * CharacterInventoryPanel
 *
 * Shared read-only backpack / equipped view for character sheets. Renders
 * owned-item instances grouped by location (Equipped / Worn / Installed /
 * Carried / Backpack). Display only — no buy, equip, install, attack, damage,
 * or money settlement. Catalog browsing stays in the system catalog panels.
 *
 * It takes a prebuilt view-model (`groups`); each sheet builds these from its
 * existing character fields via an adapter. No store writes, no RuntimeLog.
 */
export interface CharacterInventoryPanelProps {
  title?: string;
  groups: CharacterInventoryGroup[];
  emptyText?: string;
  className?: string;
  headerClassName?: string;
  groupHeaderClassName?: string;
  itemClassName?: string;
  chipClassName?: string;
}

export function CharacterInventoryPanel({
  title = '背包与装备 Inventory',
  groups,
  emptyText = '暂无背包物品。Empty backpack.',
  className,
  headerClassName,
  groupHeaderClassName,
  itemClassName,
  chipClassName,
}: CharacterInventoryPanelProps) {
  const nonEmpty = groups.filter((group) => group.items.length > 0);
  const isEmpty = nonEmpty.length === 0;

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${className ?? ''}`}>
      <div className={`mb-3 border-b border-current/10 pb-2 text-sm font-black uppercase tracking-wide ${headerClassName ?? ''}`}>
        {title}
      </div>

      {isEmpty ? (
        <p className="text-[11px] italic opacity-55">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {nonEmpty.map((group) => (
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
    </div>
  );
}
