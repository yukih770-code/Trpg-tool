import { useState } from 'react';
import { useCpStore } from '../store/cpStore';
import { makeEmptyInventory, CP_CYBERWARE_LIST, CP_ARMOR_LIST, CP_WEAPON_LIST, CP_CLOTHING_LIST } from '../lib/cp-types';
import { toast } from 'sonner';

// ── CP Market Theme ───────────────────────────────────────
const T = {
  border:     'border-[#f5c518]/25',
  borderCyan: 'border-[#00e5ff]/25',
  text:       'text-[#f5c518]',
  textCyan:   'text-[#00e5ff]',
};

// ── Misc items ────────────────────────────────────────────
interface MiscItem {
  name: string; category: string; cost: number; description: string; tag: string;
}
const MISC_ITEMS: MiscItem[] = [
  { name: '赛博组合工具',       category: '科技装备', cost: 100,   description: '修理/改装义体必备工具箱',          tag: 'TECH' },
  { name: '医疗扫描仪',         category: '医疗',     cost: 500,   description: '读取人体生命体征，急救+2',        tag: 'MED'  },
  { name: '普通赛博甲板',       category: '网络',     cost: 500,   description: '基础网行者组件，RAM 4 / Slots 6', tag: 'NET'  },
  { name: '高端赛博甲板',       category: '网络',     cost: 2000,  description: 'RAM 8 / Slots 10，支持复杂程序',  tag: 'NET'  },
  { name: '微型摄像头',         category: '情报',     cost: 50,    description: '超小型隐蔽摄像头，可无线传输',    tag: 'SPY'  },
  { name: '加密通讯器',         category: '情报',     cost: 200,   description: '军用级加密无线电，避免监听',      tag: 'SPY'  },
  { name: '急救喷剂',           category: '医疗',     cost: 50,    description: '即时恢复2d6 HP，止血效果',        tag: 'MED'  },
  { name: '刺激素 Stim',        category: '药物',     cost: 100,   description: '提升COOL/WILL +1（持续1小时）',   tag: 'DRUG' },
  { name: '黑安非他命 Speed',   category: '药物',     cost: 200,   description: '提升REF +2（持续30分钟，成瘾性）', tag: 'DRUG' },
  { name: '碎片手榴弹',         category: '爆炸物',   cost: 100,   description: '6m 爆炸范围，4d6 基础伤害',       tag: 'EXPL' },
  { name: '闪光弹',             category: '爆炸物',   cost: 100,   description: '致盲+致聋3轮，不造成伤亡',        tag: 'EXPL' },
  { name: '烟雾弹',             category: '爆炸物',   cost: 50,    description: '持续4轮遮蔽视线，-4命中',         tag: 'EXPL' },
  { name: '摩托车（标准款）',   category: '交通',     cost: 1000,  description: '街道机动首选，移动速度×8',         tag: 'VHCL' },
  { name: 'AV 运输直升机',      category: '交通',     cost: 50000, description: '企业级空中运输，需驾驶证',        tag: 'VHCL' },
];

type MarketTab = 'cyberware' | 'weapons' | 'armor' | 'fashion' | 'misc';

const MARKET_TABS: { id: MarketTab; label: string; activeColor: string }[] = [
  { id: 'cyberware', label: '义体',   activeColor: 'bg-purple-400 text-black border-purple-400 shadow-[0_0_8px_#c084fc50]' },
  { id: 'weapons',   label: '武器',   activeColor: 'bg-red-400    text-black border-red-400    shadow-[0_0_8px_#f8717150]' },
  { id: 'armor',     label: '护甲',   activeColor: 'bg-[#00e5ff]  text-black border-[#00e5ff]  shadow-[0_0_8px_#00e5ff50]' },
  { id: 'fashion',   label: '服饰',   activeColor: 'bg-pink-400   text-black border-pink-400   shadow-[0_0_8px_#f472b650]' },
  { id: 'misc',      label: '其他',   activeColor: 'bg-[#f5c518]  text-black border-[#f5c518]  shadow-[0_0_8px_#f5c51850]' },
];

const TAG_COLORS: Record<string, string> = {
  NET:  'text-[#00e5ff] border-[#00e5ff]/50',
  MED:  'text-green-400 border-green-400/50',
  TECH: 'text-yellow-400 border-yellow-400/50',
  SPY:  'text-purple-400 border-purple-400/50',
  DRUG: 'text-orange-400 border-orange-400/50',
  EXPL: 'text-red-400 border-red-400/50',
  VHCL: 'text-sky-400 border-sky-400/50',
};

// ── Status badge helper ───────────────────────────────────
function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`font-cp-title text-[8px] border px-1.5 py-0.5 tracking-widest ${color}`}>
      {label}
    </span>
  );
}

// ── Action button helper ──────────────────────────────────
function ActionBtn({
  label, onClick, color, disabled = false,
}: {
  label: string; onClick: () => void; color: string; disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`font-cp-body text-[10px] px-3 py-1 border tracking-wider transition-all
        ${disabled
          ? 'border-[#f5c518]/10 text-[#f5c518]/20 cursor-not-allowed'
          : color}`}
    >
      {label}
    </button>
  );
}

export function CpMarket() {
  const {
    character,
    spendEb, gainEb, spendFashionEb,
    // Cyberware
    addCyberwareToInventory, installCyberware, removeCyberware, discardCyberware,
    // Armor
    addArmorToInventory, equipArmor, unequipArmor, discardArmor,
    // Weapons
    addWeaponToInventory, carryWeapon, removeWeapon, discardWeapon,
    // Fashion
    addFashionToInventory, wearFashion, removeClothing, discardFashion,
    // Gear
    addGearToInventory, discardGear,
  } = useCpStore();

  const [activeTab, setActiveTab] = useState<MarketTab>('cyberware');
  const [search, setSearch] = useState('');

  const inv = character.inventory ?? makeEmptyInventory();
  const canAfford = (cost: number) => character.eb >= cost;

  /** Spend EB and run action; shows toast */
  const buy = (cost: number, label: string, action: () => void) => {
    if (!canAfford(cost)) {
      toast.error(`eb 不足！需要 ${cost} eb，当前 ${character.eb} eb`);
      return;
    }
    spendEb(cost);
    action();
    toast.success(`// 交易完成: ${label}（−${cost} eb）`);
  };

  /** Sell item — refund half price */
  const sell = (cost: number, label: string, action: () => void) => {
    const refund = Math.floor(cost / 2);
    action();
    gainEb(refund);
    toast.success(`// 已出售: ${label}（+${refund} eb）`);
  };

  return (
    <div
      className="space-y-4 text-[#d4d4d8] font-mono"
      style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(245,197,24,0.008) 3px,rgba(245,197,24,0.008) 4px)' }}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="hud-panel-gold hud-panel border-b border-[#f5c518]/40 pb-3 pt-1 px-1 flex justify-between items-start">
        <div>
          <h2 className="font-cp-title text-lg neon-gold tracking-widest">// BLACK MARKET</h2>
          <div className="font-cp-body text-[10px] text-[#00e5ff]/50 tracking-widest mt-0.5">
            夜之城黑市 &gt;&gt; 非官方零售商联盟
          </div>
        </div>
        <div className="text-right">
          <div className="font-cp-title text-[9px] text-[#f5c518]/45 tracking-widest">// BALANCE</div>
          <div className={`font-cp-title text-2xl tracking-widest ${character.eb > 500 ? 'neon-gold' : 'text-red-400'}`}>
            {character.eb.toLocaleString()}
            <span className="text-sm opacity-40 ml-1">eb</span>
          </div>
          {character.fashionEb > 0 && (
            <div className="font-cp-body text-[9px] text-pink-400/60 mt-0.5">
              时装津贴: {character.fashionEb} eb
            </div>
          )}
        </div>
      </div>

      {/* ── Humanity warning ─────────────────────────────── */}
      {character.humanity.current <= 0 && (
        <div className="border border-red-500 bg-red-950/30 p-2 font-cp-body text-[10px] text-red-400 animate-pulse tracking-widest">
          ⚠ 人性归零 — 赛博精神病风险 // 义体安装不自动结算人性
        </div>
      )}

      {/* ── Legend ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap font-cp-body text-[9px] opacity-50">
        <span>图例:</span>
        <span className="text-green-400">■ 已装备/安装</span>
        <span className="text-yellow-400">■ 已购入(背包)</span>
        <span className="text-[#9ab0c8]">■ 未购入</span>
      </div>

      {/* ── Search ───────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="font-cp-body text-[10px] text-[#f5c518]/30">&gt;&gt;</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索商品..."
          className="flex-1 bg-[#0d0d18] border border-[#f5c518]/20 focus:border-[#f5c518]/60 outline-none
            px-3 py-1.5 text-xs text-[#d4d4d8] font-cp-body tracking-wider rounded-none
            placeholder:text-[#f5c518]/20"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="font-cp-body text-[10px] text-[#f5c518]/40 hover:text-[#f5c518] px-2">✕</button>
        )}
      </div>

      {/* ── Category tabs ────────────────────────────────── */}
      <div className="flex gap-1 flex-wrap border-b border-[#f5c518]/15 pb-2">
        {MARKET_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`font-cp-body text-[10px] uppercase tracking-widest px-3 py-1.5 border transition-all
              ${activeTab === t.id
                ? t.activeColor
                : 'border-[#f5c518]/20 text-[#f5c518]/50 hover:border-[#f5c518]/50 hover:text-[#f5c518]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          CYBERWARE
          States: NOT_OWNED → BUY (→ inventory)
                  OWNED (inventory) → INSTALL + SELL
                  INSTALLED → REMOVE (→ inventory; humanity automation deferred)
         ════════════════════════════════════════════════════ */}
      {activeTab === 'cyberware' && (
        <div className="space-y-2">
          <div className="font-cp-title text-[9px] text-purple-400/50 tracking-widest mb-2">
            // 义体 · 人性 {character.humanity.current}/{character.humanity.max} · EMP {character.stats.EMP}
            <span className="ml-4 text-yellow-400/50">背包: {inv.cyberware.length}</span>
            <span className="ml-3 text-green-400/50">已安装: {character.cyberware.length}</span>
          </div>
          {CP_CYBERWARE_LIST
            .filter(cw => !search || cw.name.toLowerCase().includes(search.toLowerCase()) || cw.description.includes(search))
            .map(cw => {
              const installedItems = character.cyberware.filter(c => c.name === cw.name);
              const ownedItems = inv.cyberware.filter(c => c.name === cw.name);
              const installedItem = installedItems[0];
              const ownedItem = ownedItems[0];
              const installed = installedItems.length > 0;
              const ownedInInventory = ownedItems.length > 0;

              return (
                <div key={cw.name}
                  className={`hud-panel border p-3 transition-all
                    ${installed
                      ? 'border-green-500/40 bg-green-950/10'
                      : ownedInInventory
                        ? 'border-yellow-400/40 bg-yellow-950/10'
                        : canAfford(cw.cost)
                          ? 'border-[#f5c518]/15 bg-[#0d0d18] hover:border-purple-400/30'
                          : 'border-[#f5c518]/8 bg-[#0a0a15] opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-cp-body text-xs text-[#d4d4d8] font-bold">{cw.name}</span>
                        {installed && <StatusBadge label={`INSTALLED x${installedItems.length}`} color="text-green-400 border-green-400/50" />}
                        {ownedInInventory && <StatusBadge label={`IN INVENTORY x${ownedItems.length}`} color="text-yellow-400 border-yellow-400/50" />}
                      </div>
                      <div className="font-cp-body text-[10px] text-[#9ab0c8]/55 leading-relaxed">{cw.description}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-cp-body text-[9px] text-red-400/70">人性成本 {cw.humanityCost}（未自动扣除）</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="font-cp-title text-sm neon-gold">{cw.cost.toLocaleString()} eb</span>

                      {installed ? (
                        // INSTALLED → can remove (returns to inventory)
                        <div className="flex flex-col gap-1 items-end">
                          <ActionBtn label="REMOVE" color="border-orange-500/50 text-orange-400 hover:bg-orange-900/20" onClick={() => {
                            removeCyberware(installedItem?.instanceId ?? cw.name);
                            toast.success(`// 已卸除: ${cw.name} → 已归还背包`);
                          }} />
                          <ActionBtn label="BUY" disabled={!canAfford(cw.cost)} color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]" onClick={() => buy(cw.cost, cw.name, () => addCyberwareToInventory(cw))} />
                        </div>
                      ) : ownedInInventory ? (
                        // OWNED IN INVENTORY → can install (free) or sell
                        <div className="flex flex-col gap-1 items-end">
                          <ActionBtn
                            label="INSTALL"
                            color="border-green-400/50 text-green-400 hover:bg-green-900/20"
                            onClick={() => {
                              installCyberware(ownedItem ?? cw);
                              toast.success(`// 安装完成: ${cw.name}（未自动扣除人性）`);
                            }}
                          />
                          <ActionBtn label="SELL" color="border-red-500/40 text-red-400/80 hover:bg-red-900/15" onClick={() => {
                            sell(cw.cost, cw.name, () => discardCyberware(ownedItem?.instanceId ?? cw.name));
                          }} />
                          <ActionBtn label="BUY" disabled={!canAfford(cw.cost)} color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]" onClick={() => buy(cw.cost, cw.name, () => addCyberwareToInventory(cw))} />
                        </div>
                      ) : (
                        // NOT OWNED → can buy to inventory
                        <ActionBtn
                          label="BUY"
                          disabled={!canAfford(cw.cost)}
                          color="border-purple-400/50 text-purple-400 hover:bg-purple-900/20 hover:border-purple-400"
                          onClick={() => buy(cw.cost, cw.name, () => addCyberwareToInventory(cw))}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          WEAPONS
          States: NOT_OWNED → BUY (→ inventory)
                  OWNED (inventory) → CARRY + SELL
                  CARRIED → DROP (→ inventory)
         ════════════════════════════════════════════════════ */}
      {activeTab === 'weapons' && (
        <div className="space-y-2">
          <div className="font-cp-title text-[9px] text-red-400/50 tracking-widest mb-2">
            // 武器库
            <span className="ml-4 text-yellow-400/50">背包: {inv.weapons.length}</span>
            <span className="ml-3 text-green-400/50">携带中: {character.weapons.length}</span>
          </div>
          {CP_WEAPON_LIST
            .filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()))
            .map(weapon => {
              const carriedItems = character.weapons.filter(w => w.name === weapon.name);
              const ownedItems = inv.weapons.filter(w => w.name === weapon.name);
              const carriedItem = carriedItems[0];
              const ownedItem = ownedItems[0];
              const carried = carriedItems.length > 0;
              const ownedInInventory = ownedItems.length > 0;

              return (
                <div key={weapon.name}
                  className={`hud-panel border p-3 transition-all
                    ${carried
                      ? 'border-green-500/40 bg-green-950/10'
                      : ownedInInventory
                        ? 'border-yellow-400/40 bg-yellow-950/10'
                        : canAfford(weapon.cost)
                          ? 'border-[#f5c518]/15 bg-[#0d0d18] hover:border-red-400/30'
                          : 'border-[#f5c518]/8 bg-[#0a0a15] opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-cp-body text-xs text-[#d4d4d8] font-bold">{weapon.name}</span>
                        {carried && <StatusBadge label={`CARRYING x${carriedItems.length}`} color="text-green-400 border-green-400/50" />}
                        {ownedInInventory && <StatusBadge label={`IN INVENTORY x${ownedItems.length}`} color="text-yellow-400 border-yellow-400/50" />}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-cp-body text-[10px] text-red-400">伤害 {weapon.damage}</span>
                        <span className="font-cp-body text-[10px] text-[#9ab0c8]/40">ROF {weapon.rof}</span>
                        <span className="font-cp-body text-[10px] text-[#9ab0c8]/40">{weapon.skill}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="font-cp-title text-sm neon-gold">{weapon.cost.toLocaleString()} eb</span>

                      {carried ? (
                        <div className="flex flex-col gap-1 items-end">
                          <ActionBtn label="DROP" color="border-orange-500/50 text-orange-400 hover:bg-orange-900/20" onClick={() => {
                            removeWeapon(carriedItem?.instanceId ?? weapon.name);
                            toast.success(`// 已收起: ${weapon.name} → 存入背包`);
                          }} />
                          <ActionBtn label="BUY" disabled={!canAfford(weapon.cost)} color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]" onClick={() => buy(weapon.cost, weapon.name, () => addWeaponToInventory(weapon))} />
                        </div>
                      ) : ownedInInventory ? (
                        <div className="flex flex-col gap-1 items-end">
                          <ActionBtn label="CARRY" color="border-green-400/50 text-green-400 hover:bg-green-900/20" onClick={() => {
                            carryWeapon(ownedItem?.instanceId ?? weapon.name);
                            toast.success(`// 已装备: ${weapon.name}`);
                          }} />
                          <ActionBtn label="SELL" color="border-red-500/40 text-red-400/80 hover:bg-red-900/15" onClick={() => {
                            sell(weapon.cost, weapon.name, () => discardWeapon(ownedItem?.instanceId ?? weapon.name));
                          }} />
                          <ActionBtn label="BUY" disabled={!canAfford(weapon.cost)} color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]" onClick={() => buy(weapon.cost, weapon.name, () => addWeaponToInventory(weapon))} />
                        </div>
                      ) : (
                        <ActionBtn
                          label="BUY"
                          disabled={!canAfford(weapon.cost)}
                          color="border-red-400/50 text-red-400 hover:bg-red-900/20 hover:border-red-400"
                          onClick={() => buy(weapon.cost, weapon.name, () => addWeaponToInventory(weapon))}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ARMOR
          States: NOT_OWNED → BUY (→ inventory)
                  OWNED (inventory) → EQUIP + SELL
                  EQUIPPED → UNEQUIP (→ inventory)
         ════════════════════════════════════════════════════ */}
      {activeTab === 'armor' && (
        <div className="space-y-2">
          <div className="font-cp-title text-[9px] text-[#00e5ff]/50 tracking-widest mb-2">
            // 护甲 · 身体: {character.armorBody?.name ?? '无'} · 头部: {character.armorHead?.name ?? '无'}
            <span className="ml-4 text-yellow-400/50">背包: {inv.armor.length}</span>
          </div>
          {CP_ARMOR_LIST
            .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))
            .map(armor => {
              const equippedItem =
                armor.location === 'body' && character.armorBody?.name === armor.name
                  ? character.armorBody
                  : armor.location === 'head' && character.armorHead?.name === armor.name
                    ? character.armorHead
                    : null;
              const ownedItems = inv.armor.filter(a => a.name === armor.name);
              const ownedItem = ownedItems[0];
              const equipped = Boolean(equippedItem);
              const ownedInInventory = ownedItems.length > 0;

              return (
                <div key={armor.name}
                  className={`hud-panel border p-3 transition-all
                    ${equipped
                      ? 'border-green-500/40 bg-green-950/10'
                      : ownedInInventory
                        ? 'border-yellow-400/40 bg-yellow-950/10'
                        : canAfford(armor.cost)
                          ? 'border-[#f5c518]/15 bg-[#0d0d18] hover:border-[#00e5ff]/30'
                          : 'border-[#f5c518]/8 bg-[#0a0a15] opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-cp-body text-xs text-[#d4d4d8] font-bold">{armor.name}</span>
                        {equipped && <StatusBadge label="EQUIPPED" color="text-green-400 border-green-400/50" />}
                        {ownedInInventory && <StatusBadge label={`IN INVENTORY x${ownedItems.length}`} color="text-yellow-400 border-yellow-400/50" />}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-cp-body text-[10px] text-[#00e5ff]">SP {armor.sp}</span>
                        <span className="font-cp-body text-[10px] text-[#9ab0c8]/40">{armor.location === 'body' ? '身体' : '头部'}</span>
                        {armor.refPenalty > 0 && <span className="font-cp-body text-[10px] text-orange-400">REF −{armor.refPenalty}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="font-cp-title text-sm neon-gold">{armor.cost.toLocaleString()} eb</span>

                      {equipped ? (
                        <div className="flex flex-col gap-1 items-end">
                          <ActionBtn label="UNEQUIP" color="border-orange-500/50 text-orange-400 hover:bg-orange-900/20" onClick={() => {
                            unequipArmor(armor.location);
                            toast.success(`// 已卸下: ${armor.name} → 存入背包`);
                          }} />
                          <ActionBtn label="BUY" disabled={!canAfford(armor.cost)} color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]" onClick={() => buy(armor.cost, armor.name, () => addArmorToInventory(armor))} />
                        </div>
                      ) : ownedInInventory ? (
                        <div className="flex flex-col gap-1 items-end">
                          <ActionBtn label="EQUIP" color="border-[#00e5ff]/50 text-[#00e5ff] hover:bg-[#00e5ff]/10" onClick={() => {
                            equipArmor(ownedItem ?? armor, armor.location);
                            toast.success(`// 已装备: ${armor.name}`);
                          }} />
                          <ActionBtn label="SELL" color="border-red-500/40 text-red-400/80 hover:bg-red-900/15" onClick={() => {
                            sell(armor.cost, armor.name, () => discardArmor(ownedItem?.instanceId ?? armor.name));
                          }} />
                          <ActionBtn label="BUY" disabled={!canAfford(armor.cost)} color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]" onClick={() => buy(armor.cost, armor.name, () => addArmorToInventory(armor))} />
                        </div>
                      ) : (
                        <ActionBtn
                          label="BUY"
                          disabled={!canAfford(armor.cost)}
                          color="border-[#00e5ff]/50 text-[#00e5ff] hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]"
                          onClick={() => buy(armor.cost, armor.name, () => addArmorToInventory(armor))}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          FASHION
          States: NOT_OWNED → BUY (→ inventory, use fashionEb if available)
                  OWNED (inventory) → WEAR + SELL
                  WEARING → TAKE OFF (→ inventory)
         ════════════════════════════════════════════════════ */}
      {activeTab === 'fashion' && (
        <div className="space-y-2">
          <div className="font-cp-title text-[9px] text-pink-400/50 tracking-widest mb-2">
            // 时装 · 津贴: {character.fashionEb} eb
            <span className="ml-4 text-yellow-400/50">背包: {inv.fashion.length}</span>
            <span className="ml-3 text-green-400/50">穿着: {(character.clothing ?? []).length}</span>
          </div>
          {CP_CLOTHING_LIST
            .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.style.includes(search))
            .map(cloth => {
              const wornItems = (character.clothing ?? []).filter(c => c.name === cloth.name);
              const ownedItems = inv.fashion.filter(c => c.name === cloth.name);
              const wornItem = wornItems[0];
              const ownedItem = ownedItems[0];
              const wearing = wornItems.length > 0;
              const ownedInInventory = ownedItems.length > 0;
              const canUseFashionEb = character.fashionEb >= cloth.cost;
              const affordable = canAfford(cloth.cost) || canUseFashionEb;

              return (
                <div key={cloth.name}
                  className={`hud-panel border p-3 transition-all
                    ${wearing
                      ? 'border-green-500/40 bg-green-950/10'
                      : ownedInInventory
                        ? 'border-yellow-400/40 bg-yellow-950/10'
                        : affordable
                          ? 'border-[#f5c518]/15 bg-[#0d0d18] hover:border-pink-400/30'
                          : 'border-[#f5c518]/8 bg-[#0a0a15] opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-cp-body text-xs text-[#d4d4d8] font-bold">{cloth.name}</span>
                        {wearing && <StatusBadge label={`WEARING x${wornItems.length}`} color="text-green-400 border-green-400/50" />}
                        {ownedInInventory && <StatusBadge label={`IN INVENTORY x${ownedItems.length}`} color="text-yellow-400 border-yellow-400/50" />}
                        <span className={`font-cp-title text-[8px] border px-1 ${
                          cloth.style === '企业' ? 'text-yellow-400 border-yellow-400/40' :
                          cloth.style === '赛博' ? 'text-[#00e5ff] border-[#00e5ff]/40' :
                          cloth.style === '荒野' ? 'text-orange-400 border-orange-400/40' :
                          'text-pink-400 border-pink-400/30'}`}>{cloth.style}</span>
                      </div>
                      <div className="font-cp-body text-[10px] text-[#9ab0c8]/55">{cloth.description}</div>
                      {canUseFashionEb && !wearing && !ownedInInventory && (
                        <div className="font-cp-body text-[9px] text-pink-400/70 mt-0.5">✦ 时装津贴可抵扣</div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <span className="font-cp-title text-sm neon-gold">{cloth.cost.toLocaleString()} eb</span>

                      {wearing ? (
                        <div className="flex flex-col gap-1 items-end">
                          <ActionBtn label="TAKE OFF" color="border-orange-500/50 text-orange-400 hover:bg-orange-900/20" onClick={() => {
                            removeClothing(wornItem?.instanceId ?? cloth.name);
                            toast.success(`// 已脱下: ${cloth.name} → 存入背包`);
                          }} />
                          <ActionBtn label="BUY" disabled={!affordable} color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]" onClick={() => {
                            const spend = canUseFashionEb ? spendFashionEb : spendEb;
                            if (spend(cloth.cost)) {
                              addFashionToInventory(cloth);
                              toast.success(`// 购入: ${cloth.name}（−${cloth.cost} eb）`);
                            } else {
                              toast.error(`eb 不足！需要 ${cloth.cost} eb`);
                            }
                          }} />
                        </div>
                      ) : ownedInInventory ? (
                        <div className="flex flex-col gap-1 items-end">
                          <ActionBtn label="WEAR" color="border-pink-400/50 text-pink-400 hover:bg-pink-900/20" onClick={() => {
                            wearFashion(ownedItem?.instanceId ?? cloth.name);
                            toast.success(`// 已穿上: ${cloth.name}`);
                          }} />
                          <ActionBtn label="SELL" color="border-red-500/40 text-red-400/80 hover:bg-red-900/15" onClick={() => {
                            sell(cloth.cost, cloth.name, () => discardFashion(ownedItem?.instanceId ?? cloth.name));
                          }} />
                          <ActionBtn label="BUY" disabled={!affordable} color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]" onClick={() => {
                            const spend = canUseFashionEb ? spendFashionEb : spendEb;
                            if (spend(cloth.cost)) {
                              addFashionToInventory(cloth);
                              toast.success(`// 购入: ${cloth.name}（−${cloth.cost} eb）`);
                            } else {
                              toast.error(`eb 不足！需要 ${cloth.cost} eb`);
                            }
                          }} />
                        </div>
                      ) : (
                        <ActionBtn
                          label="BUY"
                          disabled={!affordable}
                          color="border-pink-400/50 text-pink-400 hover:bg-pink-900/20 hover:border-pink-400"
                          onClick={() => {
                            if (canUseFashionEb) {
                              spendFashionEb(cloth.cost);
                              addFashionToInventory(cloth);
                              toast.success(`// 时装津贴购买: ${cloth.name}（−${cloth.cost} eb）`);
                            } else {
                              buy(cloth.cost, cloth.name, () => addFashionToInventory(cloth));
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MISC
          States: NOT_OWNED → BUY (→ inventory.gear in store)
                  OWNED → SELL (removes + refund half)
         ════════════════════════════════════════════════════ */}
      {activeTab === 'misc' && (
        <div className="space-y-2">
          <div className="font-cp-title text-[9px] text-[#f5c518]/40 tracking-widest mb-2">
            // 其他装备 · 持有: {inv.gear.length} 件
          </div>
          {Array.from(new Set(MISC_ITEMS.map(i => i.category))).map(cat => {
            const items = MISC_ITEMS.filter(i => i.category === cat &&
              (!search || i.name.includes(search) || i.description.includes(search)));
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="font-cp-title text-[9px] text-[#f5c518]/40 tracking-widest mt-3 mb-1.5">
                  // {cat.toUpperCase()}
                </div>
                {items.map(item => {
                  const ownedItems = inv.gear.filter(g => g.name === item.name);
                  const ownedItem = ownedItems[0];
                  const owned = ownedItems.length > 0;
                  const affordable = canAfford(item.cost);
                  const tagCls = TAG_COLORS[item.tag] ?? 'text-[#f5c518] border-[#f5c518]/40';

                  return (
                    <div key={item.name}
                      className={`hud-panel border p-3 transition-all mb-1.5
                        ${owned
                          ? 'border-yellow-400/40 bg-yellow-950/10'
                          : affordable
                            ? 'border-[#f5c518]/15 bg-[#0d0d18] hover:border-[#f5c518]/35'
                            : 'border-[#f5c518]/8 bg-[#0a0a15] opacity-60'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-cp-body text-xs text-[#d4d4d8] font-bold">{item.name}</span>
                            {owned && <StatusBadge label={`OWNED x${ownedItems.length}`} color="text-yellow-400 border-yellow-400/50" />}
                            <span className={`font-cp-title text-[8px] border px-1 ${tagCls}`}>{item.tag}</span>
                          </div>
                          <div className="font-cp-body text-[10px] text-[#9ab0c8]/55">{item.description}</div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <span className="font-cp-title text-sm neon-gold">{item.cost.toLocaleString()} eb</span>
                          {owned ? (
                            <div className="flex flex-col gap-1 items-end">
                              <ActionBtn label="SELL" color="border-red-500/40 text-red-400/80 hover:bg-red-900/15" onClick={() => {
                                sell(item.cost, item.name, () => discardGear(ownedItem?.instanceId ?? item.name));
                              }} />
                              <ActionBtn
                                label="BUY"
                                disabled={!affordable}
                                color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]"
                                onClick={() => buy(item.cost, item.name, () => addGearToInventory(item))}
                              />
                            </div>
                          ) : (
                            <ActionBtn
                              label="BUY"
                              disabled={!affordable}
                              color="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 hover:border-[#f5c518]"
                              onClick={() => buy(item.cost, item.name, () => addGearToInventory(item))}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
