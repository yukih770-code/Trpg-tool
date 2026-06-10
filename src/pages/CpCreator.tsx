import { useState } from 'react';
import { useCpStore } from '../store/cpStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import {
  CP_STAT_ORDER, CP_STAT_LABELS, CpStat,
  CP_ROLES, CP_ROLE_LABELS, CP_EXEC_ROLES,
  CP_SKILLS, CP_ARMOR_LIST, CP_CYBERWARE_LIST, CP_WEAPON_LIST, CP_CLOTHING_LIST,
  CpLifePath,
} from '../lib/cp-types';
import { computeCpDerived } from '../store/cpStore';

// ── Circular stat ring gauge ──────────────────────────────
function StatRing({ value, min = 2, max = 8 }: { value: number; min?: number; max?: number }) {
  const r = 30, cx = 40, cy = 40;
  const circ    = 2 * Math.PI * r;
  const pct     = Math.max(0, (value - min) / (max - min));
  const filled  = pct * circ;
  const isHigh  = value >= 7;
  const color   = isHigh ? '#00e5ff' : '#f5c518';
  const glow    = isHigh ? '0 0 6px #00e5ffaa' : '0 0 6px #f5c518aa';
  return (
    <svg viewBox="0 0 80 80" className="w-14 h-14" aria-hidden="true">
      {/* Track ring */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#f5c518" strokeWidth="4.5" opacity="0.13"/>
      {/* Filled arc — rotated so start is at 12 o'clock */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth="4.5" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(-90, ${cx}, ${cy})`}
        style={{ filter: `drop-shadow(${glow})` }}/>
      {/* Tick marks at min (2) and max (8) */}
      <circle cx={cx} cy={cy - r - 1} r="1.8" fill={color} opacity="0.4"
        transform={`rotate(0, ${cx}, ${cy})`}/>
      {/* Value */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="19" fontWeight="bold"
        fontFamily="'Share Tech Mono', monospace"
        style={{ filter: `drop-shadow(${glow})` }}>
        {value}
      </text>
    </svg>
  );
}

// ── Theme helpers ─────────────────────────────────────────
const T = {
  border:      'border-[#d8b954]/20',
  borderFull:  'border-[#d8b954]/80',
  text:        'text-[#d8b954]',
  bg:          'bg-[#0d0d0d]',
  bgCard:      'bg-[#111]',
  btn:         'bg-[#f5c518] text-[#0d0d0d] hover:bg-[#f5c518]/80 rounded-none font-bold uppercase font-mono',
  btnOutline:  'border-[#8a6f25]/60 text-[#d8b954]/85 hover:bg-[#f5c518]/10 hover:text-[#f5c518] rounded-none uppercase font-mono',
};

const TOTAL_STAT_POINTS  = 62;
const TOTAL_SKILL_POINTS = 86;

type CreatorTab = 'info' | 'stats' | 'skills' | 'gear' | 'lifepath';

const TABS: { id: CreatorTab; label: string }[] = [
  { id: 'info',     label: '基本信息' },
  { id: 'stats',    label: '属性分配' },
  { id: 'skills',   label: '技能分配' },
  { id: 'gear',     label: '装备 & 义体' },
  { id: 'lifepath', label: '生命路径' },
];

export function CpCreator({ onComplete }: { onComplete: () => void }) {
  const {
    character, updateField, setAllStats, setSkill,
    installCyberware, addWeapon, spendEb, equipArmor, updateLifePath,
  } = useCpStore();

  const [activeTab, setActiveTab] = useState<CreatorTab>('info');

  // ── Stat allocation (live from store) ─────────────────
  const usedStatPts      = Object.values(character.stats).reduce((a, b) => a + b, 0);
  const remainingStatPts = TOTAL_STAT_POINTS - usedStatPts;
  const derived          = computeCpDerived(character.stats);

  const setStatDirect = (stat: CpStat, val: number) => {
    const clamped = Math.max(2, Math.min(8, val));
    setAllStats({ ...character.stats, [stat]: clamped });
  };

  // ── Skill allocation (live from store) ────────────────
  const skillPointsUsed = () => {
    let used = 0;
    for (const s of CP_SKILLS) {
      const extra = Math.max(0, (character.skills[s.name] ?? s.baseLevel) - s.baseLevel);
      used += s.isDoubled ? extra * 2 : extra;
    }
    return used;
  };
  const remainingSkillPts = TOTAL_SKILL_POINTS - skillPointsUsed();

  const setSkillDirect = (name: string, delta: number) => {
    const skillDef = CP_SKILLS.find(s => s.name === name)!;
    const current  = character.skills[name] ?? skillDef.baseLevel;
    const next     = Math.max(skillDef.baseLevel, Math.min(6, current + delta));
    const cost     = skillDef.isDoubled ? Math.abs(delta) * 2 : Math.abs(delta);
    if (delta > 0 && remainingSkillPts < cost) { toast.error('技能点不足！'); return; }
    setSkill(name, next);
  };

  // ── Final completion ──────────────────────────────────
  const handleComplete = () => {
    if (!character.name.trim())  { toast.error('请填写角色姓名'); setActiveTab('info');  return; }
    if (!character.role)          { toast.error('请选择职业');     setActiveTab('info');  return; }
    if (remainingStatPts !== 0)   {
      toast.error(`属性点${remainingStatPts > 0 ? `剩余 ${remainingStatPts} 点未分配` : `超出 ${Math.abs(remainingStatPts)} 点`}`);
      setActiveTab('stats');
      return;
    }
    updateField('housing', CP_EXEC_ROLES.includes(character.role)
      ? '企业公寓（免费，月花销 600 eb）'
      : '货运集装箱（第一个月免费，后续月租 1100 eb）'
    );
    onComplete();
    toast.success('角色已创建！切换到角色卡查看。');
  };

  // ── Tab status indicators ─────────────────────────────
  const infoOk   = character.name.trim() !== '' && !!character.role;
  const statsOk  = remainingStatPts === 0;
  const skillsOk = remainingSkillPts === 0;

  // 'done' = green ✓, 'partial' = yellow ●, undefined = no indicator
  const tabStatus: Record<CreatorTab, 'done' | 'partial' | undefined> = {
    info:     infoOk   ? 'done' : undefined,
    stats:    statsOk  ? 'done' : usedStatPts > 10   ? 'partial' : undefined,
    skills:   skillsOk ? 'done' : skillPointsUsed() > 0 ? 'partial' : undefined,
    gear:     undefined,
    lifepath: undefined,
  };

  return (
    <div className="space-y-4 text-[#d4d4d8]">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="hud-panel flex justify-between items-center border-b border-[#d8b954]/25 pb-3 px-1 pt-1">
        <div>
          <h2 className="font-cp-title text-lg md:text-xl neon-gold tracking-widest">
            // CHARACTER CREATION
          </h2>
          <div className="font-cp-body text-[10px] text-[#00e5ff]/60 tracking-widest mt-0.5">
            赛博朋克红 &gt;&gt; 角色创建协议
          </div>
        </div>
        <Button onClick={handleComplete} className={`${T.btn} px-5 py-2 font-cp-body`}>
          完成创建 ✓
        </Button>
      </div>

      {/* ── Tab bar ──────────────────────────────────────── */}
      <div className="flex gap-1 flex-wrap border-b border-[#d8b954]/15 pb-3">
        {TABS.map(t => {
          const status = tabStatus[t.id];
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-cp-body text-[10px] uppercase tracking-widest border transition-all
                ${activeTab === t.id
                  ? 'bg-[#f5c518] text-[#0d0d0d] border-[#f5c518] shadow-[0_0_10px_rgba(245,197,24,0.35)]'
                  : 'border-[#8a6f25]/35 text-[#d8b954]/60 hover:border-[#d8b954]/65 hover:text-[#f5c518] hover:bg-[#f5c518]/5'}`}>
              {t.label}
              {status === 'done'    && <span className="text-[9px] text-green-400">✓</span>}
              {status === 'partial' && <span className="text-[9px] text-yellow-400">●</span>}
            </button>
          );
        })}
        <div className="ml-auto font-cp-body text-[9px] text-[#d8b954]/35 self-center pr-1 hidden md:block tracking-wider">
          &gt;&gt; 可任意顺序填写
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────── */}
      <div className="min-h-[420px]">

        {/* ── 基本信息 ──────────────────────────────────── */}
        {activeTab === 'info' && (
          <div className="space-y-5">
            <h3 className={`font-cp-title text-sm neon-gold tracking-widest border-b ${T.border} pb-2`}>
              基础信息 <span className="text-[10px] tracking-widest text-[#d8b954]/55 ml-2">BASIC INFO</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                ['姓名 Handle', 'name',   'text',   '例如: V、强尼·银手'],
                ['玩家 Player', 'player', 'text',   ''],
                ['年龄 Age',    'age',    'number', ''],
                ['性别 Gender', 'gender', 'text',   ''],
              ] as const).map(([label, field, type, placeholder]) => (
                <div key={field} className="space-y-1">
                  <label className="uppercase text-xs font-bold font-mono text-[#d8b954]/75">{label}</label>
                  <Input
                    type={type}
                    value={(character as any)[field]}
                    onChange={e => updateField(field as any, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                    placeholder={placeholder}
                    className={`${T.bgCard} border-[#d8b954]/20 focus:border-[#f5c518] text-[#d4d4d8] font-mono rounded-none`}
                  />
                </div>
              ))}
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="uppercase text-xs font-bold font-mono text-[#d8b954]/75">职业 Role</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {CP_ROLES.map(role => (
                  <button key={role} onClick={() => updateField('role', role)}
                    className={`p-2 border text-xs font-bold font-mono uppercase transition-colors rounded-none
                      ${character.role === role
                        ? `${T.borderFull} ${T.text} bg-[#f5c518]/10`
                        : `border-[#8a6f25]/30 text-[#d4d4d8]/60 hover:border-[#d8b954]/55`}`}>
                    <div>{CP_ROLE_LABELS[role]}</div>
                    <div className="text-[10px] opacity-60">{role}</div>
                  </button>
                ))}
              </div>
              <div className="text-xs text-[#d8b954]/60 mt-1">
                职业能力等级强制为 <strong className="text-[#f5c518]">4</strong>。
                {CP_EXEC_ROLES.includes(character.role)
                  ? ' 主管职业：企业公寓（月花销 600 eb）'
                  : ' 非主管职业：货运集装箱（第一个月免费，月租 1100 eb）'}
              </div>
            </div>
          </div>
        )}

        {/* ── 属性分配 ──────────────────────────────────── */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-[#f5c518]/50 pb-2">
              <h3 className="font-cp-title text-sm neon-gold tracking-widest">// STAT ALLOCATION</h3>
              <div className={`font-cp-body text-sm font-bold tracking-wider ${
                remainingStatPts < 0 ? 'text-red-400' :
                remainingStatPts === 0 ? 'text-green-400' : T.text}`}>
                {remainingStatPts < 0 ? '⚠ OVERFLOW' : remainingStatPts === 0 ? '✓ LOCKED IN' : `POOL: ${remainingStatPts}`}
                <span className="text-[#f5c518]/30 ml-1 text-[10px]">/ {TOTAL_STAT_POINTS}</span>
              </div>
            </div>
            <p className="font-cp-body text-[10px] text-[#d4d4d8]/40 tracking-wider">每个属性范围 2–8 &nbsp;·&nbsp; 共分配 {TOTAL_STAT_POINTS} 点</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {CP_STAT_ORDER.map(stat => {
                const val    = character.stats[stat];
                const canInc = val < 8 && remainingStatPts > 0;
                const canDec = val > 2;
                return (
                  <div key={stat} className={`hud-panel border ${T.border} ${T.bgCard} py-3 px-2 flex flex-col items-center gap-1`}>
                    <div className="font-cp-body text-[9px] text-[#f5c518]/55 text-center leading-tight uppercase tracking-wider">
                      {CP_STAT_LABELS[stat]}
                    </div>
                    <StatRing value={val} />
                    <div className="flex gap-1 mt-0.5">
                      <button disabled={!canDec}
                        className={`w-7 h-7 border font-bold text-sm transition-colors font-cp-body
                          ${canDec ? `${T.border} ${T.text} hover:bg-[#f5c518]/10 hover:shadow-[0_0_6px_#f5c51844]` : 'border-[#f5c518]/10 text-[#f5c518]/20 cursor-not-allowed'}`}
                        onClick={() => setStatDirect(stat, val - 1)}>−</button>
                      <button disabled={!canInc}
                        className={`w-7 h-7 border font-bold text-sm transition-colors font-cp-body
                          ${canInc ? `${T.border} ${T.text} hover:bg-[#f5c518]/10 hover:shadow-[0_0_6px_#f5c51844]` : 'border-[#f5c518]/10 text-[#f5c518]/20 cursor-not-allowed'}`}
                        onClick={() => setStatDirect(stat, val + 1)}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {remainingStatPts === 0 && (
              <div className="text-center text-green-400 text-xs font-mono font-bold py-1">✓ 属性点已全部分配</div>
            )}
            {remainingStatPts < 0 && (
              <div className="text-center text-red-400 text-xs font-mono font-bold py-1 animate-pulse">⚠ 超出上限 {Math.abs(remainingStatPts)} 点</div>
            )}

            {/* Derived stats preview */}
            <div className={`hud-panel-gold hud-panel border ${T.border} ${T.bgCard} p-4`}>
              <div className="font-cp-title text-[9px] text-[#f5c518]/60 mb-3 tracking-widest">// DERIVED STATS</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  ['MAX HP',           derived.maxHp],
                  ['SERIOUS WOUND',    derived.seriouslyWounded],
                  ['DEATH SAVE',       derived.deathSave],
                  ['MAX HUMANITY',     derived.maxHumanity],
                ] as [string, number][]).map(([label, val]) => (
                  <div key={label} className="text-center">
                    <div className="font-cp-body text-[9px] text-[#f5c518]/45 uppercase tracking-widest">{label}</div>
                    <div className={`font-cp-title text-2xl neon-gold mt-0.5`}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 技能分配 ──────────────────────────────────── */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-[#f5c518]/50 pb-2">
              <h3 className="font-cp-title text-sm neon-gold tracking-widest">// SKILL ALLOCATION</h3>
              <div className={`font-cp-body text-sm font-bold tracking-wider ${
                remainingSkillPts < 0 ? 'text-red-400' :
                remainingSkillPts === 0 ? 'text-green-400' : T.text}`}>
                {remainingSkillPts === 0 ? '✓ LOCKED IN' : `POOL: ${remainingSkillPts}`}
                <span className="text-[#f5c518]/30 ml-1 text-[10px]">/ {TOTAL_SKILL_POINTS}</span>
              </div>
            </div>
            <p className="font-cp-body text-[10px] text-[#d4d4d8]/40 tracking-wider">
              最高等级 6 &nbsp;·&nbsp; <span className="text-[#f5c518]">(x2)</span> 技能每升1级花费 2 点 &nbsp;·&nbsp; base 技能不可低于初始值
            </p>

            {Array.from(new Set(CP_SKILLS.map(s => s.category))).map(cat => (
              <div key={cat} className="space-y-0.5">
                <div className={`font-cp-title text-[9px] uppercase tracking-widest ${T.text} opacity-60 border-b ${T.border} pb-1 mb-1`}>// {cat}</div>
                {CP_SKILLS.filter(s => s.category === cat).map(skill => {
                  const level  = character.skills[skill.name] ?? skill.baseLevel;
                  const isBase = skill.baseLevel >= 2;
                  const canDec = level > skill.baseLevel;
                  const canInc = level < 6 && remainingSkillPts >= (skill.isDoubled ? 2 : 1);
                  return (
                    <div key={skill.name} className={`flex items-center justify-between py-1 px-2 border-b border-[#f5c518]/5 ${isBase ? 'bg-[#f5c518]/4' : ''}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-mono truncate">{skill.name}</span>
                        {skill.isDoubled && <span className="text-[10px] text-[#f5c518] font-bold shrink-0">(x2)</span>}
                        {isBase && <span className="text-[10px] text-[#f5c518]/35 font-mono shrink-0">base</span>}
                      </div>
                      <span className="text-xs font-mono text-[#d4d4d8]/35 mx-2 shrink-0">{skill.linkedStat}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button disabled={!canDec}
                          className={`w-6 h-6 border font-bold text-xs transition-colors
                            ${canDec ? `${T.border} ${T.text} hover:bg-[#f5c518]/10` : 'border-[#f5c518]/10 text-[#f5c518]/20 cursor-not-allowed'}`}
                          onClick={() => setSkillDirect(skill.name, -1)}>−</button>
                        <span className={`w-6 text-center font-bold font-mono text-sm ${T.text}`}>{level}</span>
                        <button disabled={!canInc}
                          className={`w-6 h-6 border font-bold text-xs transition-colors
                            ${canInc ? `${T.border} ${T.text} hover:bg-[#f5c518]/10` : 'border-[#f5c518]/10 text-[#f5c518]/20 cursor-not-allowed'}`}
                          onClick={() => setSkillDirect(skill.name, 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ── 装备 & 义体 ───────────────────────────────── */}
        {activeTab === 'gear' && <GearShop />}

        {/* ── 生命路径 ──────────────────────────────────── */}
        {activeTab === 'lifepath' && (
          <LifePathStep lp={character.lifePath} onChange={updateLifePath} T={T} />
        )}

      </div>
    </div>
  );
}

// ── Gear Shop ─────────────────────────────────────────────
function GearShop() {
  const {
    character, equipArmor, unequipArmor, installCyberware,
    removeCyberware, addWeapon, removeWeapon, spendEb,
    addClothing, removeClothing, spendFashionEb,
  } = useCpStore();

  const G = {
    border: 'border-[#f5c518]/30', text: 'text-[#f5c518]',
    bgCard: 'bg-[#111]', borderFull: 'border-[#f5c518]',
  };

  const buy = (cost: number, action: () => void, label: string) => {
    if (character.eb < cost) { toast.error(`eb 不足！需要 ${cost} eb，当前 ${character.eb} eb`); return; }
    action();
    spendEb(cost);
    toast.success(`购买成功: ${label}（-${cost} eb）`);
  };

  return (
    <div className="space-y-6">
      {/* EB display */}
      <div className={`hud-panel-gold hud-panel border ${G.borderFull} ${G.bgCard} p-3 flex justify-between items-center`}>
        <span className="font-cp-title text-[10px] tracking-widest text-[#f5c518]/60">// EUROBUCKS</span>
        <span className="font-cp-title text-2xl neon-gold">{character.eb} <span className="text-sm opacity-60">eb</span></span>
      </div>

      {/* Cyberware */}
      <div>
        <div className={`font-cp-title text-[10px] tracking-widest ${G.text} border-b ${G.border} pb-1 mb-2 flex justify-between items-center`}>
          <span>// 义体 CYBERWARE</span>
          <span className="font-cp-body text-[9px] text-[#f5c518]/50 tracking-wider">人性 {character.humanity.current}/{character.humanity.max} · EMP {character.stats.EMP}</span>
        </div>
        {character.humanity.current <= 0 && (
          <div className="text-red-400 text-xs font-bold border border-red-500 p-2 mb-2 animate-pulse">⚠ 人性归零 — 赛博精神病发作！</div>
        )}
        <div className="space-y-1">
          {CP_CYBERWARE_LIST.map(cw => {
            const installed = character.cyberware.some(c => c.name === cw.name);
            return (
              <div key={cw.name} className={`flex items-center justify-between p-2 border ${installed ? 'border-[#f5c518]/50 bg-[#f5c518]/5' : 'border-[#f5c518]/10'} text-xs`}>
                <div className="flex-1">
                  <span className="font-mono font-bold">{cw.name}</span>
                  <span className="text-[#d4d4d8]/50 ml-2">{cw.description}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-red-400 font-mono">-{cw.humanityCost} 人性</span>
                  <span className={`${G.text} font-mono`}>{cw.cost} eb</span>
                  {installed ? (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-red-500 text-red-400 hover:bg-red-900/20"
                      onClick={() => removeCyberware(cw.name)}>卸除</Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10"
                      disabled={character.humanity.current <= 0}
                      onClick={() => buy(cw.cost, () => installCyberware(cw), cw.name)}>安装</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Armor */}
      <div>
        <div className={`font-cp-title text-[10px] tracking-widest ${G.text} border-b ${G.border} pb-1 mb-2`}>// 护甲 ARMOR</div>
        <div className="space-y-1">
          {CP_ARMOR_LIST.map(armor => {
            const equipped =
              (armor.location === 'body' && character.armorBody?.name === armor.name) ||
              (armor.location === 'head' && character.armorHead?.name === armor.name);
            return (
              <div key={armor.name} className={`flex items-center justify-between p-2 border ${equipped ? 'border-[#f5c518]/50 bg-[#f5c518]/5' : 'border-[#f5c518]/10'} text-xs`}>
                <div className="flex-1 flex items-center gap-2 font-mono">
                  <span className="font-bold">{armor.name}</span>
                  <span className="text-[#d4d4d8]/50">SP {armor.sp}</span>
                  {armor.refPenalty > 0 && <span className="text-orange-400">REF −{armor.refPenalty}</span>}
                  <span className="text-[#d4d4d8]/40">[{armor.location === 'body' ? '身体' : '头部'}]</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className={`${G.text} font-mono`}>{armor.cost} eb</span>
                  {equipped ? (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-red-500 text-red-400 hover:bg-red-900/20"
                      onClick={() => unequipArmor(armor.location)}>卸下</Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10"
                      onClick={() => buy(armor.cost, () => equipArmor(armor, armor.location), armor.name)}>装备</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weapons */}
      <div>
        <div className={`font-cp-title text-[10px] tracking-widest ${G.text} border-b ${G.border} pb-1 mb-2`}>// 武器 WEAPONS</div>
        <div className="space-y-1">
          {CP_WEAPON_LIST.map(weapon => {
            const owned = character.weapons.some(w => w.name === weapon.name);
            return (
              <div key={weapon.name} className={`flex items-center justify-between p-2 border ${owned ? 'border-[#f5c518]/50 bg-[#f5c518]/5' : 'border-[#f5c518]/10'} text-xs`}>
                <div className="flex-1 flex items-center gap-2 font-mono">
                  <span className="font-bold">{weapon.name}</span>
                  <span className="text-[#d4d4d8]/50">{weapon.damage}</span>
                  <span className="text-[#d4d4d8]/40">[{weapon.skill}]</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className={`${G.text} font-mono`}>{weapon.cost} eb</span>
                  {owned ? (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-red-500 text-red-400 hover:bg-red-900/20"
                      onClick={() => removeWeapon(weapon.name)}>移除</Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10"
                      onClick={() => buy(weapon.cost, () => addWeapon(weapon), weapon.name)}>购买</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clothing */}
      <div>
        <div className={`font-cp-title text-[10px] tracking-widest ${G.text} border-b ${G.border} pb-1 mb-2 flex justify-between items-center`}>
          <span>// 时装 FASHION</span>
          <span className="font-cp-body text-[9px] text-[#f5c518]/50 tracking-wider">时装津贴 {character.fashionEb} eb</span>
        </div>
        <div className="space-y-1">
          {CP_CLOTHING_LIST.map(cloth => {
            const wearing = (character.clothing ?? []).some(c => c.name === cloth.name);
            return (
              <div key={cloth.name} className={`flex items-center justify-between p-2 border ${wearing ? 'border-[#f5c518]/50 bg-[#f5c518]/5' : 'border-[#f5c518]/10'} text-xs`}>
                <div className="flex-1 flex items-center gap-2 font-mono">
                  <span className="font-bold">{cloth.name}</span>
                  <span className={`text-[9px] border ${G.border} px-1 ${G.text}`}>{cloth.style}</span>
                  <span className="text-[#d4d4d8]/40">{cloth.description}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className={`${G.text} font-mono`}>{cloth.cost} eb</span>
                  {wearing ? (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-red-500 text-red-400 hover:bg-red-900/20"
                      onClick={() => removeClothing(cloth.name)}>脱下</Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10"
                      onClick={() => {
                        if (character.fashionEb >= cloth.cost) {
                          addClothing(cloth); spendFashionEb(cloth.cost);
                          toast.success(`穿上: ${cloth.name}（时装津贴 −${cloth.cost} eb）`);
                        } else {
                          buy(cloth.cost, () => addClothing(cloth), cloth.name);
                        }
                      }}>穿上</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Life Path ─────────────────────────────────────────────
function LifePathStep({
  lp, onChange, T,
}: {
  lp: CpLifePath | undefined;
  onChange: (f: Partial<CpLifePath>) => void;
  T: { border: string; borderFull: string; text: string; bg: string; bgCard: string; btn: string; btnOutline: string };
}) {
  const lpp = lp ?? {} as CpLifePath;

  const field = (label: string, key: keyof CpLifePath, placeholder = '', isNumber = false) => (
    <div key={key} className="space-y-0.5">
      <label className="uppercase text-[9px] font-bold font-mono text-[#f5c518]/60">{label}</label>
      <input
        type={isNumber ? 'number' : 'text'}
        value={(lpp as any)[key] ?? (isNumber ? 0 : '')}
        placeholder={placeholder}
        onChange={e => onChange({ [key]: isNumber ? parseInt(e.target.value) || 0 : e.target.value } as any)}
        className={`w-full bg-[#111] border ${T.border} text-xs text-[#d4d4d8] outline-none p-1.5 focus:border-[#f5c518] font-mono rounded-none`}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <h3 className={`font-cp-title text-sm neon-gold tracking-widest border-b ${T.border} pb-2`}>// LIFE PATH</h3>
      <p className="font-cp-body text-[10px] text-[#d4d4d8]/40 tracking-wider">可选填 &nbsp;·&nbsp; 这些信息显示在角色卡中，帮助记录角色故事。</p>

      <div className={`border ${T.border} bg-[#111] p-4 space-y-3`}>
        <div className="font-cp-title text-[9px] text-[#f5c518]/60 tracking-widest uppercase">// 身份 Identity</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {field('外号 Handle', 'handle', '江湖名/代号')}
          {field('故乡 Hometown', 'hometown', '出生地')}
          {field('居住水平', 'livingStandard', '货运集装箱')}
          {field('月花销 (eb)', 'monthlySpending', '1100', true)}
        </div>
      </div>

      <div className={`border ${T.border} bg-[#111] p-4 space-y-3`}>
        <div className="font-cp-title text-[9px] text-[#f5c518]/60 tracking-widest uppercase">// 外貌风格 Appearance</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {field('穿着风格', 'clothingStyle', '街头 / 企业 / 赛博')}
          {field('发型', 'hairstyle', '莫西干 / 丸子头')}
          {field('特有装饰', 'affectation', '文身 / 义眼 / 闪光外套')}
        </div>
      </div>

      <div className={`border ${T.border} bg-[#111] p-4 space-y-3`}>
        <div className="font-cp-title text-[9px] text-[#f5c518]/60 tracking-widest uppercase">// 背景故事 Background</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {field('生存动机', 'motivation', '金钱 / 复仇 / 自由')}
          {field('个性来源', 'personality', '冷静 / 暴躁 / 乐观')}
          {field('家庭出身', 'originsFamily', '企业家庭 / 街头混混')}
          {field('童年环境', 'childhoodEnv', '贫民窟 / 企业区 / 荒野')}
          {field('少年英雄', 'childhoodHero', '摇滚明星 / 传奇佣兵')}
          {field('生命事件1', 'lifeEvent1', '第一次任务，或重大转折')}
          {field('生命事件2', 'lifeEvent2', '改变你人生的另一件事')}
        </div>
      </div>

      <div className={`border ${T.border} bg-[#111] p-4 space-y-3`}>
        <div className="font-cp-title text-[9px] text-[#f5c518]/60 tracking-widest uppercase">// 近年经历 Recent Career</div>
        <textarea
          value={lpp.careerPath ?? ''}
          placeholder="自由描述你近年来的经历、遇到的人和做过的事..."
          onChange={e => onChange({ careerPath: e.target.value })}
          rows={4}
          className={`w-full bg-[#111] border ${T.border} text-xs text-[#d4d4d8] outline-none p-2 focus:border-[#f5c518] font-mono rounded-none resize-y`}
        />
      </div>
    </div>
  );
}
