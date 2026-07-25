import {
  DND_BASIC_ARMOR,
  DND_BASIC_GEAR,
  DND_BASIC_WEAPONS,
} from '../../data/dnd2024/equipment';
import type {
  DndArmorItem,
  DndGearItem,
  DndWeaponItem,
} from '../../lib/dnd2024/equipment-types';

/**
 * DndEquipmentCatalogPanel
 *
 * Read-only equipment catalog for the DND Sheet (data layer v1).
 * Displays the owner-source weapon / armor catalog plus the small gear sample.
 * It does NOT write to the character store, does not equip items,
 * does not change AC, attacks, damage, resources, or RuntimeLogEntry.
 */

const WEAPON_CATEGORY_LABELS: Record<DndWeaponItem['weaponCategory'], string> = {
  simpleMelee: '简易近战',
  simpleRanged: '简易远程',
  martialMelee: '军用近战',
  martialRanged: '军用远程',
};

const ARMOR_CATEGORY_LABELS: Record<DndArmorItem['armorCategory'], string> = {
  light: '轻甲',
  medium: '中甲',
  heavy: '重甲',
  shield: '盾牌',
};

const DEX_MODIFIER_LABELS: Record<NonNullable<DndArmorItem['dexModifier']>, string> = {
  none: '不加敏捷',
  max2: '敏捷上限 +2',
  full: '敏捷全加',
};

function itemTitle(item: { name: string; nameCn?: string }): string {
  return item.nameCn ? `${item.nameCn} ${item.name}` : item.name;
}

function MetaRow({ parts }: { parts: (string | false | undefined)[] }) {
  const visible = parts.filter(Boolean) as string[];
  if (visible.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#2c1810]/75">
      {visible.map(part => <span key={part}>{part}</span>)}
    </div>
  );
}

function WeaponRow({ item }: { item: DndWeaponItem }) {
  return (
    <div className="rounded border border-[#58180d]/10 bg-white/50 p-2">
      <div className="flex justify-between gap-2">
        <p className="font-bold text-[#58180d]">{itemTitle(item)}</p>
        <span className="shrink-0 rounded-full bg-[#58180d]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#58180d]/80">{WEAPON_CATEGORY_LABELS[item.weaponCategory]}</span>
      </div>
      <MetaRow
        parts={[
          item.damageDice && `伤害 ${item.damageDice} ${item.damageType ?? ''}`.trim(),
          item.range && `射程 ${item.range}`,
          item.properties.length > 0 && `属性 ${item.properties.join('、')}`,
          item.mastery && `精通 ${item.mastery}`,
          item.weight !== undefined && `${item.weight} lb`,
          item.cost,
        ]}
      />
    </div>
  );
}

function ArmorRow({ item }: { item: DndArmorItem }) {
  return (
    <div className="rounded border border-[#58180d]/10 bg-white/50 p-2">
      <div className="flex justify-between gap-2">
        <p className="font-bold text-[#58180d]">{itemTitle(item)}</p>
        <span className="shrink-0 rounded-full bg-[#58180d]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#58180d]/80">{ARMOR_CATEGORY_LABELS[item.armorCategory]}</span>
      </div>
      <MetaRow
        parts={[
          item.baseAc !== undefined && (item.category === 'shield' ? `AC +${item.baseAc}` : `AC ${item.baseAc}`),
          item.dexModifier && DEX_MODIFIER_LABELS[item.dexModifier],
          item.strengthRequirement !== undefined && `需要力量 ${item.strengthRequirement}`,
          item.stealthDisadvantage && '隐匿劣势',
          item.weight !== undefined && `${item.weight} lb`,
          item.cost,
        ]}
      />
    </div>
  );
}

function GearRow({ item }: { item: DndGearItem }) {
  return (
    <div className="rounded border border-[#58180d]/10 bg-white/50 p-2">
      <div className="flex justify-between gap-2">
        <p className="font-bold text-[#58180d]">{itemTitle(item)}</p>
        <span className="shrink-0 rounded-full bg-[#58180d]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#58180d]/80">{item.category === 'tool' ? '工具' : '冒险装备'}</span>
      </div>
      <MetaRow
        parts={[
          item.description,
          item.weight !== undefined && `${item.weight} lb`,
          item.cost,
        ]}
      />
    </div>
  );
}

export function DndEquipmentCatalogPanel() {
  return (
    <div className="rounded-lg border border-[#58180d]/20 bg-white/45 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-[#58180d]/12 pb-2">
        <h3 className="text-sm font-black uppercase tracking-wide text-[#58180d]">装备资料 Equipment Catalog</h3>
        <span className="rounded-full bg-[#58180d]/8 px-2 py-0.5 text-[10px] text-[#2c1810]/55">武器/护甲来自本地资料 · 不自动结算 AC / 攻击</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
        <div>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#58180d]">
            武器 Weapons
            <span className="rounded-full bg-[#58180d]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#58180d]/70">{DND_BASIC_WEAPONS.length}</span>
          </h4>
          <div className="space-y-1.5">
            {DND_BASIC_WEAPONS.map(item => (
              <div key={item.id}>
                <WeaponRow item={item} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#58180d]">
            护甲与盾牌 Armor &amp; Shield
            <span className="rounded-full bg-[#58180d]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#58180d]/70">{DND_BASIC_ARMOR.length}</span>
          </h4>
          <div className="space-y-1.5">
            {DND_BASIC_ARMOR.map(item => (
              <div key={item.id}>
                <ArmorRow item={item} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#58180d]">
            工具与冒险装备 Gear &amp; Tools
            <span className="rounded-full bg-[#58180d]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#58180d]/70">{DND_BASIC_GEAR.length}</span>
          </h4>
          <div className="space-y-1.5">
            {DND_BASIC_GEAR.map(item => (
              <div key={item.id}>
                <GearRow item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
