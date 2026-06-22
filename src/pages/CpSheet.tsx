import { useState, type ReactNode } from 'react';
import { useCpStore } from '../store/cpStore';
import { CP_STAT_ORDER, CP_STAT_LABELS, CP_ROLE_LABELS, CP_SKILLS, CP_ROLE_ABILITIES, CpRelation, CpEnemy, CpLifePath, makeEmptyInventory, type CpInventory, type CpArmor, type CpCyberware, type CpWeapon, type CpClothing } from '../lib/cp-types';
import {
  CharacterSheetSectionTabs,
  type CharacterSheetSectionDefinition,
} from './sheet/CharacterSheetSectionTabs';
import { toast } from 'sonner';

// Static edgerunner-sheet sections (display / downtime only; no runtime actions).
const CP_SHEET_SECTIONS: CharacterSheetSectionDefinition[] = [
  { id: 'overview', label: '概览 Overview' },
  { id: 'skills', label: '技能 Skills' },
  { id: 'gear', label: '装备与义体 Gear & Cyberware' },
  { id: 'role', label: '职业与人生 Role & Lifepath' },
  { id: 'notes', label: '记录 Notes' },
];

const T = {
  border: 'border-[#d8b954]/20',
  borderFull: 'border-[#d8b954]/80',
  text: 'text-[#d8b954]',
  bgCard: 'bg-[#111]',
};

const CP_SHEET_STAT_CN_OVERRIDES: Partial<Record<(typeof CP_STAT_ORDER)[number], string>> = {
  COOL: '时尚',
  LUCK: '幸运',
};

function getCpSheetStatChineseLabel(stat: (typeof CP_STAT_ORDER)[number]): string {
  const label = CP_STAT_LABELS[stat] ?? stat;
  return CP_SHEET_STAT_CN_OVERRIDES[stat] ?? label.replace(stat, '').trim();
}

function itemInstanceKey(item: { instanceId?: string; name: string }): string {
  return item.instanceId ?? item.name;
}

export function CpSheet() {
  const { character, updateField,
          addFriend, removeFriend, addRomance, removeRomance,
          addEnemy, removeEnemy, updateLifePath,
          carryWeapon, removeWeapon, equipArmor, unequipArmor,
          wearFashion, removeClothing, installCyberware, removeCyberware,
        } = useCpStore();
  const { stats, skills, armorBody, armorHead, cyberware, weapons, humanity, clothing, injuries } = character;

  const armorPenalty = Math.max(armorBody?.refPenalty ?? 0, armorHead?.refPenalty ?? 0);

  const woundState = () => {
    if (character.hp.current <= 0) return { label: '濒死 (Dying)', color: 'text-red-500' };
    if (character.hp.current <= character.seriouslyWounded) return { label: '重伤 (Seriously Wounded)', color: 'text-orange-400' };
    return { label: '正常 (OK)', color: 'text-green-400' };
  };
  const wound = woundState();

  const roleAbility = CP_ROLE_ABILITIES[character.role];
  const [sheetSection, setSheetSection] = useState<string>('overview');

  return (
    <div className="space-y-5 text-[#d4d4d8] font-mono">

      {/* ── Header ─────────────────────────────────────── */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 border-b ${T.border} pb-4`}>
        <div className="cp-panel hud-panel-gold hud-panel p-4">
          <h2 className="font-cp-title text-2xl neon-gold uppercase leading-tight mb-1">
            {character.name || '— UNKNOWN —'}
          </h2>
          <div className="text-xs space-y-0.5 opacity-80">
            <div><span className={T.text}>职业:</span> {CP_ROLE_LABELS[character.role]} Lv.{character.roleLevel}</div>
            <div><span className={T.text}>玩家:</span> {character.player}</div>
            <div><span className={T.text}>年龄:</span> {character.age}　{character.gender}</div>
            <div><span className={T.text}>住所:</span> {character.housing}</div>
            <div><span className={T.text}>资金:</span> {character.eb} eb</div>
          </div>
        </div>

        {/* Vital stats */}
        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: 'HP', value: `${character.hp.current}/${character.hp.max}`, sub: `重伤 ≤${character.seriouslyWounded}` },
            { label: '伤势', value: wound.label, sub: '', color: wound.color },
            { label: '人性', value: `${humanity.current}/${humanity.max}`, sub: `EMP:${stats.EMP}`, color: 'text-purple-400' },
            { label: '死亡豁免', value: String(character.deathSave), sub: '= BODY' },
          ].map(item => (
            <div key={item.label} className="cp-panel p-2 flex flex-col items-center">
              <div className="font-cp-title text-[8px] uppercase text-[#f5c518]/45 tracking-widest mb-0.5">{item.label}</div>
              <div className={`font-cp-title text-lg leading-tight text-center ${item.color ?? 'neon-gold'}`}>{item.value}</div>
              {item.sub && <div className="font-cp-body text-[9px] text-[#9ab0c8]/30 mt-0.5">{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      <CharacterSheetSectionTabs
        sections={CP_SHEET_SECTIONS}
        activeId={sheetSection}
        onChange={setSheetSection}
        ariaLabel="CP RED character sheet sections"
        className={`border-b ${T.border} pb-2`}
        activeTabClassName="border-[#f5c518] bg-[#f5c518] text-[#0d0d0d]"
        inactiveTabClassName="border-[#d8b954]/30 text-[#d8b954]/70 hover:text-[#f5c518]"
      />

      {/* ── Stats ──────────────────────────────────────── */}
      {sheetSection === 'overview' && (
      <div>
        <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#d8b954]/60 mb-1.5">// CORE STATS</div>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
          {CP_STAT_ORDER.map(stat => {
            const base = stats[stat];
            const eff = ['REF', 'DEX', 'MOVE'].includes(stat) ? Math.max(0, base - armorPenalty) : base;
            const cnLabel = getCpSheetStatChineseLabel(stat);
            return (
              <div key={stat} className="cp-panel p-1.5 flex flex-col items-center">
                <div className="font-cp-title text-[7px] uppercase text-[#d8b954]/70 tracking-widest mb-0.5 text-center leading-tight">
                  <div>{stat}</div>
                  <div className="text-[8px] tracking-normal text-[#d8b954]/80 font-cp-body">{cnLabel}</div>
                </div>
                <div className={`font-cp-title text-xl ${eff < base ? 'text-orange-400' : 'neon-gold'}`}>{eff}</div>
                {eff < base && <div className="text-[8px] text-orange-400/50">({base})</div>}
              </div>
            );
          })}
        </div>
        {armorPenalty > 0 && <div className="text-[10px] text-orange-400/70 mt-1">⚠ 护甲惩罚: REF/DEX/MOVE −{armorPenalty}</div>}
      </div>
      )}

      {/* ── Role Ability Panel ──────────────────────────── */}
      {sheetSection === 'role' && (
      <div className="cp-panel hud-panel-gold hud-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="font-cp-title text-[9px] tracking-widest text-[#f5c518]/55 uppercase">// ROLE ABILITY</div>
          <div className={`text-[10px] border ${T.border} px-2 py-0.5 font-mono ${T.text}`}>{roleAbility.name}</div>
          <div className="text-[10px] text-[#d4d4d8]/40">关联属性: {roleAbility.stat}</div>
          <div className="ml-auto text-[10px] text-[#f5c518]/60">Lv.{character.roleLevel}</div>
        </div>
        <p className="text-xs text-[#d4d4d8]/70 mb-3 leading-relaxed">{roleAbility.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
          {([1,2,3,4,5,6,7,8,9,10] as const).map(lv => (
            <div key={lv}
              className={`p-2 border text-[9px] leading-tight transition-colors
                ${lv <= character.roleLevel
                  ? `border-[#f5c518] bg-[#f5c518]/10 text-white`
                  : `border-[#f5c518]/10 text-[#d4d4d8]/30`}`}>
              <div className={`font-bold mb-0.5 ${lv === character.roleLevel ? T.text : ''}`}>Lv.{lv}</div>
              <div>{roleAbility.levelEffects[lv]}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ── Skills (non-zero only) ──────────────────────── */}
      {sheetSection === 'skills' && (
      <div>
        <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55 mb-1.5">// SKILLS · 只读展示</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px">
          {CP_SKILLS.filter(s => (skills[s.name] ?? s.baseLevel) > 0).map(skillDef => {
            const level = skills[skillDef.name] ?? skillDef.baseLevel;
            const statVal = stats[skillDef.linkedStat];
            const total = level + statVal;
            return (
              <div key={skillDef.name}
                className={`flex items-center justify-between px-2 py-1.5 border-b ${T.border} text-xs text-left w-full`}>
                <span className="truncate flex-1">{skillDef.name}</span>
                <span className="text-[#d4d4d8]/30 mx-1.5 text-[10px]">{skillDef.linkedStat}</span>
                <span className="text-[#d4d4d8]/50 w-4 text-center">{level}</span>
                <span className="text-[#d4d4d8]/20 mx-0.5">+</span>
                <span className="text-[#d4d4d8]/50 w-4 text-center">{statVal}</span>
                <span className="text-[#d4d4d8]/20 mx-0.5">=</span>
                <span className={`font-bold w-5 text-center ${T.text}`}>{total}</span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ── Equipment row ───────────────────────────────── */}
      {sheetSection === 'gear' && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Weapons */}
        <div className="cp-panel p-3">
          <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55 mb-2">// WEAPONS · 只读展示</div>
          {weapons.length === 0 && <div className="text-xs opacity-40">无武器</div>}
          {weapons.map(w => (
            <div key={itemInstanceKey(w)}
              className={`flex items-center justify-between w-full text-xs mb-1.5 p-1.5 border ${T.border} text-left`}>
              <div>
                <div className="font-bold">{w.name}</div>
                <div className="text-[#d4d4d8]/40 text-[10px]">{w.skill}</div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${T.text}`}>{w.damage}</div>
                <div className="text-[#d4d4d8]/30 text-[10px]">ROF {w.rof}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Armor + Cyberware */}
        <div className="cp-panel p-3 space-y-3">
          <div>
            <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55 mb-1.5">// ARMOR</div>
            {armorBody ? <div className="text-xs"><span className={T.text}>身体:</span> {armorBody.name} SP{armorBody.sp}{armorBody.refPenalty > 0 ? ` (−${armorBody.refPenalty})` : ''}</div>
              : <div className="text-xs opacity-40">无身体护甲</div>}
            {armorHead ? <div className="text-xs mt-0.5"><span className={T.text}>头部:</span> {armorHead.name} SP{armorHead.sp}</div>
              : <div className="text-xs opacity-40">无头部护甲</div>}
          </div>
          <div>
            <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55 mb-1.5">// CYBERWARE ({cyberware.length})</div>
            {cyberware.length === 0 && <div className="text-xs opacity-40">无义体</div>}
            {cyberware.map(cw => (
              <div key={itemInstanceKey(cw)} className="text-xs flex justify-between">
                <span>{cw.name}</span>
                <span className="text-red-400/60 text-[10px]">人性成本 {cw.humanityCost}</span>
              </div>
            ))}
            {character.cyberPsycho && <div className="text-red-400 text-xs font-bold mt-1 animate-pulse">⚠ 赛博精神病</div>}
          </div>
        </div>

        {/* Clothing */}
        <div className="cp-panel p-3">
          <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55 mb-1.5">// FASHION</div>
          {(!clothing || clothing.length === 0) && <div className="text-xs opacity-40">无时装</div>}
          {(clothing ?? []).map(c => (
            <div key={itemInstanceKey(c)} className="text-xs mb-1 flex justify-between">
              <span>{c.name}</span>
              <span className={`text-[10px] border ${T.border} px-1 ${T.text}`}>{c.style}</span>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ── Inventory (owned but not equipped) ─────────── */}
      {sheetSection === 'gear' && (
      <InventoryPanel
        inv={character.inventory ?? makeEmptyInventory()}
        cyberwareInstalled={character.cyberware}
        armorBody={character.armorBody}
        armorHead={character.armorHead}
        weaponsCarried={character.weapons}
        clothingWorn={character.clothing ?? []}
        onCarryWeapon={carryWeapon}
        onDropWeapon={removeWeapon}
        onEquipArmor={(armor) => { equipArmor(armor, armor.location); toast.success(`// 已装备: ${armor.name}`); }}
        onUnequipArmor={(location) => { unequipArmor(location); toast.success(`// 已卸下护甲 → 存入背包`); }}
        onWearFashion={wearFashion}
        onTakeOffFashion={removeClothing}
        onInstallCyberware={(cw) => { installCyberware(cw); toast.success(`// 安装完成: ${cw.name}（未自动扣除人性）`); }}
        onRemoveCyberware={(idOrName) => { removeCyberware(idOrName); toast.success(`// 已卸除义体 → 存入背包`); }}
        T={T}
      />
      )}

      {/* ── Injuries ───────────────────────────────────── */}
      {sheetSection === 'notes' && (injuries ?? []).length > 0 && (
        <div className={`border border-orange-500/50 bg-orange-900/10 p-3`}>
          <div className="text-[10px] uppercase font-bold text-orange-400 mb-2">⚠ 当前伤势记录</div>
          {(injuries ?? []).map((inj, i) => (
            <div key={i} className="text-xs text-orange-300 border-b border-orange-500/20 py-1 last:border-0">{inj}</div>
          ))}
        </div>
      )}

      {/* ── Life Path ──────────────────────────────────── */}
      {sheetSection === 'role' && (
      <LifePathSection lp={character.lifePath} onChange={updateLifePath} T={T} />
      )}

      {/* ── Relationships ───────────────────────────────── */}
      {sheetSection === 'role' && (
      <RelationshipsSection
        friends={character.friends ?? []}
        romances={character.romances ?? []}
        enemies={character.enemies ?? []}
        addFriend={addFriend} removeFriend={removeFriend}
        addRomance={addRomance} removeRomance={removeRomance}
        addEnemy={addEnemy} removeEnemy={removeEnemy}
        T={T}
      />
      )}

      {/* Notes */}
      {sheetSection === 'notes' && (
      <div className="cp-panel p-3">
        <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55 mb-2">// NOTES</div>
        <textarea
          value={character.notes}
          onChange={e => updateField('notes', e.target.value)}
          rows={3}
          className={`w-full bg-transparent text-xs text-[#d4d4d8] resize-none outline-none border ${T.border} p-2 focus:border-[#f5c518]`}
          placeholder="自由记录..."
        />
      </div>
      )}
    </div>
  );
}

// ── Inventory Panel ───────────────────────────────────────
function InventoryPanel({
  inv, cyberwareInstalled, armorBody, armorHead, weaponsCarried, clothingWorn,
  onCarryWeapon, onDropWeapon, onEquipArmor, onUnequipArmor,
  onWearFashion, onTakeOffFashion, onInstallCyberware, onRemoveCyberware,
  T,
}: {
  inv: CpInventory;
  cyberwareInstalled: CpCyberware[];
  armorBody: CpArmor | null;
  armorHead: CpArmor | null;
  weaponsCarried: CpWeapon[];
  clothingWorn: CpClothing[];
  onCarryWeapon: (idOrName: string) => void;
  onDropWeapon: (idOrName: string) => void;
  onEquipArmor: (a: CpArmor) => void;
  onUnequipArmor: (loc: 'body' | 'head') => void;
  onWearFashion: (idOrName: string) => void;
  onTakeOffFashion: (idOrName: string) => void;
  onInstallCyberware: (cw: CpCyberware) => void;
  onRemoveCyberware: (idOrName: string) => void;
  T: TTheme;
}) {
  const [open, setOpen] = useState(false);

  const totalItems = inv.cyberware.length + inv.weapons.length + inv.armor.length + inv.fashion.length + inv.gear.length
    + cyberwareInstalled.length + weaponsCarried.length + (armorBody ? 1 : 0) + (armorHead ? 1 : 0) + clothingWorn.length;

  if (totalItems === 0) return null;

  const btnBase = 'font-cp-body text-[9px] px-2 py-0.5 border tracking-wider transition-all';

  return (
    <div className="cp-panel">
      <button
        className="w-full flex items-center justify-between p-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55">// INVENTORY 背包 & 装备</div>
          <div className="font-cp-body text-[9px] text-[#00e5ff]/50">
            {inv.weapons.length + inv.armor.length + inv.cyberware.length + inv.fashion.length + inv.gear.length > 0 &&
              <span className="text-yellow-400">背包: {inv.weapons.length + inv.armor.length + inv.cyberware.length + inv.fashion.length + inv.gear.length}</span>}
          </div>
        </div>
        <div className="text-[#f5c518]/40 text-xs">{open ? '▲ 收起' : '▼ 展开'}</div>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-[#f5c518]/10 space-y-4 pt-3">

          {/* ── Weapons ──────────────────────── */}
          {(weaponsCarried.length > 0 || inv.weapons.length > 0) && (
            <div>
              <div className="font-cp-title text-[9px] text-[#f5c518]/40 tracking-widest mb-1.5">// 武器</div>
              <div className="space-y-1">
                {weaponsCarried.map(w => (
                  <div key={itemInstanceKey(w)} className="flex items-center justify-between text-xs border border-green-500/20 bg-green-950/10 px-2 py-1">
                    <div>
                      <span className="text-green-400 font-bold">{w.name}</span>
                      <span className="text-[#d4d4d8]/40 ml-2">{w.damage}</span>
                      <span className="font-cp-title text-[8px] text-green-400 border border-green-400/30 px-1 ml-2">CARRYING</span>
                    </div>
                    <button onClick={() => onDropWeapon(itemInstanceKey(w))}
                      className={`${btnBase} border-orange-500/40 text-orange-400/80 hover:bg-orange-900/15`}>
                      收起
                    </button>
                  </div>
                ))}
                {inv.weapons.map(w => (
                  <div key={itemInstanceKey(w)} className="flex items-center justify-between text-xs border border-yellow-400/20 bg-yellow-950/10 px-2 py-1">
                    <div>
                      <span className="text-[#d4d4d8]">{w.name}</span>
                      <span className="text-[#d4d4d8]/40 ml-2">{w.damage}</span>
                      <span className="font-cp-title text-[8px] text-yellow-400 border border-yellow-400/30 px-1 ml-2">背包</span>
                    </div>
                    <button onClick={() => onCarryWeapon(itemInstanceKey(w))}
                      className={`${btnBase} border-red-400/50 text-red-400 hover:bg-red-900/15`}>
                      携带
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Armor ────────────────────────── */}
          {(armorBody || armorHead || inv.armor.length > 0) && (
            <div>
              <div className="font-cp-title text-[9px] text-[#f5c518]/40 tracking-widest mb-1.5">// 护甲</div>
              <div className="space-y-1">
                {armorBody && (
                  <div className="flex items-center justify-between text-xs border border-green-500/20 bg-green-950/10 px-2 py-1">
                    <div>
                      <span className="text-green-400 font-bold">{armorBody.name}</span>
                      <span className="text-[#00e5ff]/60 ml-2">SP{armorBody.sp}</span>
                      <span className="font-cp-title text-[8px] text-green-400 border border-green-400/30 px-1 ml-2">身体</span>
                    </div>
                    <button onClick={() => onUnequipArmor('body')}
                      className={`${btnBase} border-orange-500/40 text-orange-400/80 hover:bg-orange-900/15`}>
                      卸下
                    </button>
                  </div>
                )}
                {armorHead && (
                  <div className="flex items-center justify-between text-xs border border-green-500/20 bg-green-950/10 px-2 py-1">
                    <div>
                      <span className="text-green-400 font-bold">{armorHead.name}</span>
                      <span className="text-[#00e5ff]/60 ml-2">SP{armorHead.sp}</span>
                      <span className="font-cp-title text-[8px] text-green-400 border border-green-400/30 px-1 ml-2">头部</span>
                    </div>
                    <button onClick={() => onUnequipArmor('head')}
                      className={`${btnBase} border-orange-500/40 text-orange-400/80 hover:bg-orange-900/15`}>
                      卸下
                    </button>
                  </div>
                )}
                {inv.armor.map(a => (
                  <div key={itemInstanceKey(a)} className="flex items-center justify-between text-xs border border-yellow-400/20 bg-yellow-950/10 px-2 py-1">
                    <div>
                      <span className="text-[#d4d4d8]">{a.name}</span>
                      <span className="text-[#00e5ff]/60 ml-2">SP{a.sp}</span>
                      <span className="font-cp-title text-[8px] text-yellow-400 border border-yellow-400/30 px-1 ml-2">背包</span>
                    </div>
                    <button onClick={() => onEquipArmor(a)}
                      className={`${btnBase} border-[#00e5ff]/40 text-[#00e5ff] hover:bg-[#00e5ff]/10`}>
                      装备
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Cyberware ────────────────────── */}
          {(cyberwareInstalled.length > 0 || inv.cyberware.length > 0) && (
            <div>
              <div className="font-cp-title text-[9px] text-[#f5c518]/40 tracking-widest mb-1.5">// 义体</div>
              <div className="space-y-1">
                {cyberwareInstalled.map(cw => (
                  <div key={itemInstanceKey(cw)} className="flex items-center justify-between text-xs border border-green-500/20 bg-green-950/10 px-2 py-1">
                    <div>
                      <span className="text-green-400 font-bold">{cw.name}</span>
                      <span className="text-red-400/60 ml-2 text-[10px]">人性成本 {cw.humanityCost}</span>
                      <span className="font-cp-title text-[8px] text-green-400 border border-green-400/30 px-1 ml-2">已安装</span>
                    </div>
                    <button onClick={() => onRemoveCyberware(itemInstanceKey(cw))}
                      className={`${btnBase} border-orange-500/40 text-orange-400/80 hover:bg-orange-900/15`}>
                      卸除
                    </button>
                  </div>
                ))}
                {inv.cyberware.map(cw => (
                  <div key={itemInstanceKey(cw)} className="flex items-center justify-between text-xs border border-yellow-400/20 bg-yellow-950/10 px-2 py-1">
                    <div>
                      <span className="text-[#d4d4d8]">{cw.name}</span>
                      <span className="text-red-400/60 ml-2 text-[10px]">人性成本 {cw.humanityCost}</span>
                      <span className="font-cp-title text-[8px] text-yellow-400 border border-yellow-400/30 px-1 ml-2">背包</span>
                    </div>
                    <button
                      onClick={() => onInstallCyberware(cw)}
                      className={`${btnBase} border-purple-400/50 text-purple-400 hover:bg-purple-900/15`}>
                      安装
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Fashion ──────────────────────── */}
          {(clothingWorn.length > 0 || inv.fashion.length > 0) && (
            <div>
              <div className="font-cp-title text-[9px] text-[#f5c518]/40 tracking-widest mb-1.5">// 时装</div>
              <div className="space-y-1">
                {clothingWorn.map(c => (
                  <div key={itemInstanceKey(c)} className="flex items-center justify-between text-xs border border-green-500/20 bg-green-950/10 px-2 py-1">
                    <div>
                      <span className="text-green-400 font-bold">{c.name}</span>
                      <span className="text-pink-400/60 ml-2 text-[10px]">{c.style}</span>
                      <span className="font-cp-title text-[8px] text-green-400 border border-green-400/30 px-1 ml-2">穿着中</span>
                    </div>
                    <button onClick={() => onTakeOffFashion(itemInstanceKey(c))}
                      className={`${btnBase} border-orange-500/40 text-orange-400/80 hover:bg-orange-900/15`}>
                      脱下
                    </button>
                  </div>
                ))}
                {inv.fashion.map(c => (
                  <div key={itemInstanceKey(c)} className="flex items-center justify-between text-xs border border-yellow-400/20 bg-yellow-950/10 px-2 py-1">
                    <div>
                      <span className="text-[#d4d4d8]">{c.name}</span>
                      <span className="text-pink-400/60 ml-2 text-[10px]">{c.style}</span>
                      <span className="font-cp-title text-[8px] text-yellow-400 border border-yellow-400/30 px-1 ml-2">背包</span>
                    </div>
                    <button onClick={() => onWearFashion(itemInstanceKey(c))}
                      className={`${btnBase} border-pink-400/50 text-pink-400 hover:bg-pink-900/15`}>
                      穿上
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Misc gear ────────────────────── */}
          {inv.gear.length > 0 && (
            <div>
              <div className="font-cp-title text-[9px] text-[#f5c518]/40 tracking-widest mb-1.5">// 装备</div>
              <div className="flex flex-wrap gap-1.5">
                {inv.gear.map(gear => (
                  <span key={itemInstanceKey(gear)} className="font-cp-body text-[10px] border border-[#f5c518]/25 bg-[#f5c518]/5 text-[#d4d4d8] px-2 py-0.5">
                    {gear.name}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── Life Path Section ─────────────────────────────────────
type TTheme = { border: string; borderFull: string; text: string; bgCard: string };

function LifePathSection({
  lp, onChange, T
}: {
  lp: CpLifePath | undefined;
  onChange: (f: Partial<CpLifePath>) => void;
  T: TTheme;
}) {
  const [open, setOpen] = useState(false);
  const lpp = lp ?? {} as CpLifePath;

  const field = (label: string, key: keyof CpLifePath, isNumber = false) => (
    <div key={key} className="space-y-0.5">
      <div className="text-[9px] uppercase text-[#f5c518]/50">{label}</div>
      <input
        type={isNumber ? 'number' : 'text'}
        value={(lpp as any)[key] ?? (isNumber ? 0 : '')}
        onChange={e => onChange({ [key]: isNumber ? parseInt(e.target.value) || 0 : e.target.value } as any)}
        className={`w-full bg-transparent border-b ${T.border} text-xs text-[#d4d4d8] outline-none py-0.5 focus:border-[#f5c518] font-mono`}
      />
    </div>
  );

  return (
    <div className="cp-panel">
      <button
        className={`w-full flex items-center justify-between p-3 text-left`}
        onClick={() => setOpen(o => !o)}
      >
        <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55">// LIFE PATH</div>
        <div className="text-[#f5c518]/40 text-xs">{open ? '▲ 收起' : '▼ 展开'}</div>
      </button>
      {open && (
        <div className="p-3 border-t border-[#f5c518]/20 space-y-4">
          {/* Identity */}
          <div>
            <div className="text-[9px] uppercase text-[#f5c518]/40 mb-2 font-bold">身份 Identity</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {field('外号 Handle', 'handle')}
              {field('故乡 Hometown', 'hometown')}
              {field('居住水平 Living Std', 'livingStandard')}
              {field('月花销 Monthly eb', 'monthlySpending', true)}
            </div>
          </div>
          {/* Appearance */}
          <div>
            <div className="text-[9px] uppercase text-[#f5c518]/40 mb-2 font-bold">外貌风格 Appearance</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {field('穿着风格 Style', 'clothingStyle')}
              {field('发型 Hairstyle', 'hairstyle')}
              {field('特有装饰 Affectation', 'affectation')}
            </div>
          </div>
          {/* Background */}
          <div>
            <div className="text-[9px] uppercase text-[#f5c518]/40 mb-2 font-bold">背景 Background</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field('家庭出身 Family Origins', 'originsFamily')}
              {field('童年环境 Childhood Env', 'childhoodEnv')}
              {field('少年时的英雄 Childhood Hero', 'childhoodHero')}
              {field('个性来源 Personality', 'personality')}
              {field('生存动机 Motivation', 'motivation')}
            </div>
          </div>
          {/* Events */}
          <div>
            <div className="text-[9px] uppercase text-[#f5c518]/40 mb-2 font-bold">生命事件 Life Events</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field('生命事件 1', 'lifeEvent1')}
              {field('生命事件 2', 'lifeEvent2')}
            </div>
          </div>
          {/* Career */}
          <div>
            <div className="text-[9px] uppercase text-[#f5c518]/40 mb-2 font-bold">事业经历 Career Path</div>
            <textarea
              value={lpp.careerPath ?? ''}
              onChange={e => onChange({ careerPath: e.target.value })}
              rows={2}
              className={`w-full bg-transparent text-xs text-[#d4d4d8] resize-none outline-none border ${T.border} p-2 focus:border-[#f5c518] font-mono`}
              placeholder="近年事业经历或自述..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Relationships Section ─────────────────────────────────
function RelationshipsSection({
  friends, romances, enemies,
  addFriend, removeFriend, addRomance, removeRomance, addEnemy, removeEnemy,
  T,
}: {
  friends: CpRelation[]; romances: CpRelation[]; enemies: CpEnemy[];
  addFriend: (r: CpRelation) => void; removeFriend: (name: string) => void;
  addRomance: (r: CpRelation) => void; removeRomance: (name: string) => void;
  addEnemy: (e: CpEnemy) => void; removeEnemy: (name: string) => void;
  T: TTheme;
}) {
  const [open, setOpen] = useState(false);
  // New relation form state
  const emptyRel = (): CpRelation => ({ name: '', description: '', myFeeling: '', theirFeeling: '' });
  const emptyEnemy = (): CpEnemy => ({ name: '', cause: '', myFeelings: '', theirFeelings: '', resource: '', plan: '' });
  const [newFriend, setNewFriend] = useState<CpRelation>(emptyRel());
  const [newRomance, setNewRomance] = useState<CpRelation>(emptyRel());
  const [newEnemy, setNewEnemy] = useState<CpEnemy>(emptyEnemy());

  const relInput = (label: string, val: string, onChange: (v: string) => void) => (
    <input
      key={label}
      placeholder={label}
      value={val}
      onChange={e => onChange(e.target.value)}
      className={`flex-1 min-w-0 bg-transparent border-b ${T.border} text-xs text-[#d4d4d8] outline-none py-0.5 px-1 focus:border-[#f5c518] font-mono`}
    />
  );

  const RelTable = ({
    title, color, items, onRemove, addForm
  }: {
    title: string; color: string; items: { name: string }[];
    onRemove: (name: string) => void;
    addForm: ReactNode;
  }) => (
    <div>
      <div className={`text-[9px] uppercase font-bold mb-1.5 ${color}`}>{title}</div>
      {items.length === 0 && <div className="text-[10px] text-[#d4d4d8]/30 mb-2">暂无记录</div>}
      {items.map(item => (
        <div key={item.name} className="flex items-start justify-between gap-2 text-xs border-b border-[#f5c518]/10 py-1.5">
          <div className="flex-1">
            {'description' in item && (
              <div className="font-bold text-[#d4d4d8]">{item.name}
                {'myFeeling' in item && <span className="text-[#f5c518]/50 font-normal ml-2 text-[10px]">
                  我对TA: {(item as CpRelation).myFeeling}　TA对我: {(item as CpRelation).theirFeeling}
                </span>}
              </div>
            )}
            {'cause' in item && (
              <div className="font-bold text-red-300">{item.name}
                <span className="text-red-300/50 font-normal ml-2 text-[10px]">原因: {(item as CpEnemy).cause}</span>
              </div>
            )}
            {'description' in item && (item as CpRelation).description && (
              <div className="text-[10px] text-[#d4d4d8]/50 mt-0.5">{(item as CpRelation).description}</div>
            )}
            {'plan' in item && (
              <div className="text-[10px] text-red-300/50 mt-0.5">
                资源: {(item as CpEnemy).resource}　计划: {(item as CpEnemy).plan}
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(item.name)}
            className="text-[10px] text-red-400/60 hover:text-red-400 shrink-0">✕</button>
        </div>
      ))}
      <div className="mt-2">{addForm}</div>
    </div>
  );

  return (
    <div className="cp-panel">
      <button
        className="w-full flex items-center justify-between p-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="font-cp-title text-[9px] uppercase tracking-widest text-[#f5c518]/55 flex items-center gap-2">
          // RELATIONSHIPS
          <span className="font-cp-body text-[9px] text-[#d4d4d8]/25 tracking-normal">
            {friends.length}友 · {romances.length}爱 · {enemies.length}敌
          </span>
        </div>
        <div className="text-[#f5c518]/40 text-xs">{open ? '▲ 收起' : '▼ 展开'}</div>
      </button>
      {open && (
        <div className="p-3 border-t border-[#f5c518]/20 grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Friends */}
          <RelTable
            title="🤝 朋友 Friends" color="text-blue-300"
            items={friends} onRemove={removeFriend}
            addForm={(
              <div className="space-y-1">
                <div className="flex gap-1 flex-wrap">
                  {relInput('姓名', newFriend.name, v => setNewFriend(p => ({ ...p, name: v })))}
                  {relInput('关系描述', newFriend.description, v => setNewFriend(p => ({ ...p, description: v })))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {relInput('你对TA的感情', newFriend.myFeeling, v => setNewFriend(p => ({ ...p, myFeeling: v })))}
                  {relInput('TA对你的感情', newFriend.theirFeeling, v => setNewFriend(p => ({ ...p, theirFeeling: v })))}
                </div>
                <button
                  disabled={!newFriend.name.trim()}
                  onClick={() => { addFriend(newFriend); setNewFriend(emptyRel()); }}
                  className={`text-[10px] border ${T.border} ${T.text} px-3 py-0.5 hover:bg-[#f5c518]/10 disabled:opacity-30 font-mono`}
                >+ 添加朋友</button>
              </div>
            )}
          />

          {/* Romances */}
          <RelTable
            title="❤ 爱情 Romance" color="text-pink-300"
            items={romances} onRemove={removeRomance}
            addForm={(
              <div className="space-y-1">
                <div className="flex gap-1 flex-wrap">
                  {relInput('姓名', newRomance.name, v => setNewRomance(p => ({ ...p, name: v })))}
                  {relInput('关系描述', newRomance.description, v => setNewRomance(p => ({ ...p, description: v })))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {relInput('你对TA', newRomance.myFeeling, v => setNewRomance(p => ({ ...p, myFeeling: v })))}
                  {relInput('TA对你', newRomance.theirFeeling, v => setNewRomance(p => ({ ...p, theirFeeling: v })))}
                </div>
                <button
                  disabled={!newRomance.name.trim()}
                  onClick={() => { addRomance(newRomance); setNewRomance(emptyRel()); }}
                  className={`text-[10px] border ${T.border} ${T.text} px-3 py-0.5 hover:bg-[#f5c518]/10 disabled:opacity-30 font-mono`}
                >+ 添加爱情</button>
              </div>
            )}
          />

          {/* Enemies */}
          <RelTable
            title="⚔ 敌人 Enemies" color="text-red-300"
            items={enemies} onRemove={removeEnemy}
            addForm={(
              <div className="space-y-1">
                <div className="flex gap-1 flex-wrap">
                  {relInput('姓名', newEnemy.name, v => setNewEnemy(p => ({ ...p, name: v })))}
                  {relInput('结仇原因', newEnemy.cause, v => setNewEnemy(p => ({ ...p, cause: v })))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {relInput('你的感情', newEnemy.myFeelings, v => setNewEnemy(p => ({ ...p, myFeelings: v })))}
                  {relInput('对方感情', newEnemy.theirFeelings, v => setNewEnemy(p => ({ ...p, theirFeelings: v })))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {relInput('对方资源', newEnemy.resource, v => setNewEnemy(p => ({ ...p, resource: v })))}
                  {relInput('对你的计划', newEnemy.plan, v => setNewEnemy(p => ({ ...p, plan: v })))}
                </div>
                <button
                  disabled={!newEnemy.name.trim()}
                  onClick={() => { addEnemy(newEnemy); setNewEnemy(emptyEnemy()); }}
                  className={`text-[10px] border border-red-500/40 text-red-400 px-3 py-0.5 hover:bg-red-900/20 disabled:opacity-30 font-mono`}
                >+ 添加敌人</button>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
