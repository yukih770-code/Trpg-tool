import { useState, type ReactNode } from 'react';
import { useCpStore } from '../store/cpStore';
import { toast } from 'sonner';
import {
  CP_SKILLS, CP_DV_TABLE,
  CP_CRIT_INJURIES_BODY, CP_CRIT_INJURIES_HEAD,
  CP_ROLE_ABILITIES,
  CP_STAT_ORDER, CP_STAT_LABELS, CpStat, CpRole
} from '../lib/cp-types';
import { evaluateCpExplodingD10, evaluateCpSkillCheck } from '../lib/cp2024/cp-utils';

// ── Cyberpunk Theme ────────────────────────────────────────
const T = {
  border:        'border-[#00e5ff]/20',
  borderGold:    'border-[#f5c518]/25',
  borderFull:    'border-[#00e5ff]',
  borderGoldFull:'border-[#f5c518]',
  text:          'text-[#f5c518]',
  textCyan:      'text-[#00e5ff]',
  bgCard:        'bg-[#0b0b14]',
  btn:           'bg-[#00e5ff] text-[#080810] hover:bg-[#00b8cc] rounded-none font-bold uppercase font-mono text-xs px-3 py-1',
  btnGold:       'bg-[#f5c518] text-[#080810] hover:bg-[#f5c518]/80 rounded-none font-bold uppercase font-mono text-xs px-3 py-1',
  btnOutline:    'border border-[#00e5ff]/50 text-[#00e5ff] hover:bg-[#00e5ff]/10 rounded-none uppercase font-mono text-xs',
  btnGoldOutline:'border border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10 rounded-none uppercase font-mono text-xs',
  btnDanger:     'border border-red-500/60 text-red-400 hover:bg-red-900/20 rounded-none uppercase font-mono text-xs',
};

// ── Section header ─────────────────────────────────────────
function SysHeader({ children, color = 'cyan' }: { children: ReactNode; color?: 'cyan' | 'gold' | 'red' }) {
  const clr = color === 'gold' ? 'text-[#f5c518] border-[#f5c518]/20'
    : color === 'red' ? 'text-red-400 border-red-400/20'
    : 'text-[#00e5ff] border-[#00e5ff]/20';
  return (
    <div className={`font-cp-title text-[9px] uppercase tracking-widest mb-3 border-b pb-1 flex items-center gap-1.5 ${clr}`}>
      <span className="opacity-40">//</span>
      {children}
    </div>
  );
}

// ── Last roll display ──────────────────────────────────────
interface RollDisplay {
  label: string;
  d10: number;
  bonus: string;
  total: number;
  dv?: number;
  success?: boolean;
  type: 'crit' | 'fumble' | 'success' | 'fail' | 'neutral';
}

// ── Log color ──────────────────────────────────────────────
function cpLogColor(line: string): string {
  if (line.includes('大成功') || line.includes('🎯')) return 'text-[#f5c518] font-bold';
  if (line.includes('大失败') || line.includes('💀')) return 'text-red-400 font-bold';
  if (line.includes('✅') || (line.includes('成功') && !line.includes('失败'))) return 'text-[#39ff14]';
  if (line.includes('❌') || line.includes('失败')) return 'text-red-400';
  if (line.includes('重伤') || line.includes('⚠')) return 'text-orange-400 font-bold';
  if (line.includes('EMP') || line.includes('人性')) return 'text-purple-400';
  if (line.includes('[系统]')) return 'text-[#00e5ff]/30 italic';
  return 'text-[#9ab0c8]';
}

// ── 1d10 exploding dice ────────────────────────────────────
interface RollResult {
  initial: number; bonus?: number; penalty?: number;
  total: number; isCrit: boolean; isFumble: boolean; label: string;
}
function rollD10(): number { return Math.floor(Math.random() * 10) + 1; }
function rollD6():  number { return Math.floor(Math.random() * 6)  + 1; }

function rollExploding(): RollResult {
  const natural = rollD10();
  const extra   = (natural === 10 || natural === 1) ? rollD10() : undefined;
  const r       = evaluateCpExplodingD10(natural, extra);
  const total   = r.natural + r.totalModifierFromCritical;
  const label   = r.isCriticalSuccess
    ? `🎯 大成功! [10]+[${r.extra}] = ${total}`
    : r.isCriticalFailure
    ? `💀 大失败! [1]-[${r.extra}] = ${total}`
    : `[${natural}]`;
  return {
    initial:  natural,
    bonus:    r.isCriticalSuccess ? r.extra : undefined,
    penalty:  r.isCriticalFailure ? r.extra : undefined,
    total,
    isCrit:   r.isCriticalSuccess,
    isFumble: r.isCriticalFailure,
    label,
  };
}

function rollDamage(diceStr: string): { rolls: number[]; total: number; critInjury: boolean } {
  const m = diceStr.match(/(\d+)d(\d+)/i);
  if (!m) return { rolls: [], total: 0, critInjury: false };
  const count = parseInt(m[1]), sides = parseInt(m[2]);
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0);
  return { rolls, total, critInjury: rolls.filter(r => r === sides).length >= 2 };
}

// ── Role Ability Panel ─────────────────────────────────────
interface RoleAbilityPanelProps {
  role: CpRole;
  roleLevel: number;
  stats: Record<CpStat, number>;
  skills: Record<string, number>;
  addLog: (msg: string) => void;
  onRoll: (r: RollDisplay) => void;
}

function RoleAbilityPanel({ role, roleLevel, stats, skills, addLog, onRoll }: RoleAbilityPanelProps) {
  const ability = CP_ROLE_ABILITIES[role];
  const [showLevelTable, setShowLevelTable] = useState(false);

  // Rockerboy
  const [rbGroup, setRbGroup] = useState<'solo'|'small'|'large'|'crowd'>('solo');
  // Solo pool
  const poolInit = { 先攻: 0, 闪避: 0, 伤害: 0, 感知: 0, 反击: 0 };
  const [soloPool, setSoloPool] = useState<Record<string, number>>(poolInit);
  const soloUsed = (Object.values(soloPool) as number[]).reduce((a, b) => a + b, 0);
  // Netrunner
  const netMax = roleLevel <= 3 ? 2 : roleLevel <= 6 ? 3 : roleLevel <= 9 ? 4 : 5;
  const [netUsed, setNetUsed] = useState(0);
  // Exec
  const [execTeam, setExecTeam] = useState<{name:string;loyalty:number}[]>([]);
  const [execName, setExecName] = useState('');
  // Lawman
  const [backupMsg, setBackupMsg] = useState('');
  // Nomad
  const [nomadV, setNomadV] = useState(roleLevel);
  // Fixer tiers
  const tiers = ['街头黑市','地下供应商','独立军火商','企业经销商','军事级别'];
  const tierIdx = Math.min(Math.floor((roleLevel - 1) / 2), tiers.length - 1);

  const doRoll = (label: string, base: number, lvBonus: number, dv?: number) => {
    const d10 = rollD10();
    const total = d10 + base + lvBonus;
    const success = dv !== undefined ? total >= dv : undefined;
    const type: RollDisplay['type'] = d10 === 10 ? 'crit' : d10 === 1 ? 'fumble'
      : success === true ? 'success' : success === false ? 'fail' : 'neutral';
    const r: RollDisplay = {
      label, d10, bonus: `+${base}+Lv${lvBonus}`, total, dv, success, type
    };
    onRoll(r);
    const line = `🎯 [${label}] d10[${d10}] +${base} +职业${lvBonus} = ${total}${dv ? ` vs DV${dv} → ${success ? '✅ 成功' : '❌ 失败'}` : ''}`;
    addLog(line);
  };

  const b = 'px-2 py-1 text-[10px] uppercase font-mono border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 cursor-pointer transition-colors';
  const bg = 'border-[#f5c518]/20 p-2 text-[10px]';
  const rbDV = { solo: 8, small: 10, large: 12, crowd: 15 };
  const rbLbl = { solo: '个人 DV8', small: '小群 DV10', large: '大群 DV12', crowd: '人群 DV15' };

  return (
    <div className="cp-panel hud-panel-gold hud-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#f5c518]/15 bg-[#f5c518]/5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#f5c518]/40 uppercase tracking-widest">■ ROLE ABILITY</span>
          <span className="text-sm font-bold text-[#f5c518] font-mono">{ability.name}</span>
          <span className="text-[10px] text-[#00e5ff]/50 border border-[#00e5ff]/30 px-1">Lv.{roleLevel}</span>
        </div>
        <button
          onClick={() => setShowLevelTable(v => !v)}
          className="text-[10px] border border-[#f5c518]/30 text-[#f5c518]/60 hover:text-[#f5c518] hover:border-[#f5c518] px-2 py-0.5 font-mono uppercase transition-colors">
          {showLevelTable ? '▲ 收起' : '▼ 等级表'}
        </button>
      </div>

      {/* BG3-style level table */}
      {showLevelTable && (
        <div className="px-4 py-3 border-b border-[#f5c518]/10 bg-[#f5c518]/3">
          <div className="text-[9px] text-[#00e5ff]/60 uppercase tracking-widest mb-2">── 等级效果一览 ──</div>
          <div className="space-y-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(lv => (
              <div key={lv} className={`flex gap-3 text-[10px] px-2 py-1 ${lv === roleLevel ? 'bg-[#f5c518]/10 border border-[#f5c518]/30' : ''}`}>
                <span className={`w-6 font-bold font-mono shrink-0 ${lv === roleLevel ? 'text-[#f5c518]' : 'text-[#00e5ff]/30'}`}>
                  {lv === roleLevel ? '▸' : ''}{lv}
                </span>
                <span className={lv === roleLevel ? 'text-[#d4d4d8]' : 'text-[#d4d4d8]/40'}>{ability.levelEffects[lv]}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[9px] text-[#00e5ff]/40 italic">{ability.description}</div>
        </div>
      )}

      <div className="p-4">
        {/* ── Rockerboy ── */}
        {role === 'Rockerboy' && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1 mb-2">
              {(['solo','small','large','crowd'] as const).map(sz => (
                <button key={sz} onClick={() => setRbGroup(sz)}
                  className={`${b} ${rbGroup === sz ? 'bg-[#00e5ff]/15 border-[#00e5ff]' : ''}`}>
                  {rbLbl[sz]}
                </button>
              ))}
            </div>
            <button className={`${b} w-full py-1.5`}
              onClick={() => doRoll('魅力冲击', stats.COOL + (skills['说服'] ?? 0), roleLevel, rbDV[rbGroup])}>
              🎸 发动魅力冲击 (COOL + 说服 + 职业等级)
            </button>
            <div className="text-[10px] text-[#9ab0c8]/40">基础 {stats.COOL} + 说服{skills['说服'] ?? 0} + Lv{roleLevel} = {stats.COOL + (skills['说服'] ?? 0) + roleLevel}</div>
          </div>
        )}

        {/* ── Solo ── */}
        {role === 'Solo' && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[#9ab0c8]/60">战斗意识点数（每轮可重分配）</span>
              <span className="text-[#f5c518] font-bold">{soloUsed} / {roleLevel}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {Object.keys(soloPool).map(key => (
                <div key={key} className="border border-[#00e5ff]/15 p-1.5 text-center bg-[#00e5ff]/3">
                  <div className="text-[9px] text-[#00e5ff]/50 mb-0.5">{key}</div>
                  <div className="text-lg font-bold text-[#f5c518] font-mono">+{soloPool[key]}</div>
                  <div className="flex gap-0.5 justify-center mt-1">
                    <button className="w-4 h-4 border border-[#00e5ff]/25 text-[#00e5ff] text-[10px] hover:bg-[#00e5ff]/10"
                      onClick={() => setSoloPool(p => p[key] > 0 ? { ...p, [key]: p[key]-1 } : p)}>−</button>
                    <button className="w-4 h-4 border border-[#00e5ff]/25 text-[#00e5ff] text-[10px] hover:bg-[#00e5ff]/10"
                      onClick={() => setSoloPool(p => soloUsed < roleLevel ? { ...p, [key]: p[key]+1 } : p)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <button className={`${b} text-[9px]`}
              onClick={() => { setSoloPool(poolInit); addLog('[佣兵] 战斗意识点数已重置'); }}>
              重置
            </button>
          </div>
        )}

        {/* ── Netrunner ── */}
        {role === 'Netrunner' && (() => {
          const actionsLeft = netMax - netUsed;
          const hasActions = actionsLeft > 0;
          const iBase = stats.INT + (skills['接口'] ?? skills['赛博技术'] ?? 0) + roleLevel;

          // Program definitions
          interface NetProgram {
            name: string; en: string; cost: number; cat: 'control' | 'attack' | 'defense' | 'utility';
            desc: string; roll?: () => void;
          }
          const programs: NetProgram[] = [
            // Control
            { name: '寻路',     en: 'Pathfinder', cost: 1, cat: 'control',
              desc: `探索 NET 架构节点。INT+接口+Lv vs DV6`,
              roll: () => doRoll('寻路 Pathfinder', stats.INT + (skills['接口'] ?? 0), roleLevel, 6) },
            { name: '秘门',     en: 'Backdoor',   cost: 1, cat: 'control',
              desc: `绕过 ICE 不触发警报。INT+接口+Lv vs ICE ATT`,
              roll: () => doRoll('秘门 Backdoor', stats.INT + (skills['接口'] ?? 0), roleLevel) },
            { name: '控制设备', en: 'Control',    cost: 1, cat: 'control',
              desc: `夺取电子设备控制权。INT+接口+Lv vs DV${8 + Math.floor(roleLevel / 3) * 2}`,
              roll: () => doRoll('控制 Control', stats.INT + (skills['接口'] ?? 0), roleLevel, 8 + Math.floor(roleLevel/3)*2) },
            { name: '病毒上传', en: 'Virus',      cost: 1, cat: 'control',
              desc: `植入瘫痪程序。INT+接口+Lv vs 目标防御`,
              roll: () => doRoll('病毒 Virus', stats.INT + (skills['接口'] ?? 0), roleLevel) },
            { name: '扫描识别', en: 'Eye-Dee',    cost: 1, cat: 'utility',
              desc: `识别节点内程序/文件。INT+接口+Lv vs DV6`,
              roll: () => doRoll('识别 Eye-Dee', stats.INT + (skills['接口'] ?? 0), roleLevel, 6) },
            { name: '探针',     en: 'Ping',       cost: 1, cat: 'utility',
              desc: `扫描当前节点，揭示所有 ICE。不需要检定`,
              roll: () => { addLog(`🔍 [探针 Ping] 扫描节点：揭示所有 ICE（Lv${roleLevel}）`); } },
            { name: '滑行',     en: 'Slide',      cost: 1, cat: 'utility',
              desc: `在 NET 架构中移动一层，自动成功`,
              roll: () => { addLog(`⚡ [滑行 Slide] 向深处推进一层 NET 架构`); } },
            { name: '蠕虫',     en: 'Worm',       cost: 1, cat: 'utility',
              desc: `缓慢穿透 ICE（需3轮）。INT+接口+Lv`,
              roll: () => doRoll('蠕虫 Worm', stats.INT + (skills['接口'] ?? 0), roleLevel) },
            // Attack
            { name: '冰锥',     en: 'Zap',        cost: 1, cat: 'attack',
              desc: `对 ICE 或网行者造成 1d6 伤害`,
              roll: () => {
                const dmg = rollD6();
                doRoll('冰锥 Zap', stats.INT + (skills['接口'] ?? 0), roleLevel);
                addLog(`  ↳ 伤害: [${dmg}] = ${dmg} NET 伤害`);
              }},
            { name: '重锤',     en: 'Banhammer',  cost: 1, cat: 'attack',
              desc: `摧毁 ICE，造成 3d6 伤害。INT+接口+Lv vs ICE DEF`,
              roll: () => {
                const dmg = rollD6() + rollD6() + rollD6();
                doRoll('重锤 Banhammer', stats.INT + (skills['接口'] ?? 0), roleLevel);
                addLog(`  ↳ 伤害: 3d6 = ${dmg} NET 伤害`);
              }},
            { name: '长剑',     en: 'Sword',      cost: 1, cat: 'attack',
              desc: `近战攻击 ICE，3d6+${roleLevel} NET 伤害`,
              roll: () => {
                const dmg = rollD6() + rollD6() + rollD6() + roleLevel;
                doRoll('长剑 Sword', stats.INT + (skills['接口'] ?? 0), roleLevel);
                addLog(`  ↳ 伤害: 3d6+${roleLevel} = ${dmg} NET 伤害`);
              }},
            { name: '神经撕裂', en: 'Nervesplice', cost: 1, cat: 'attack',
              desc: `攻击敌方网行者大脑，BRAIN伤害。INT+接口+Lv vs DEF`,
              roll: () => {
                const dmg = rollD6() + rollD6();
                doRoll('神经撕裂 Nervesplice', stats.INT + (skills['接口'] ?? 0), roleLevel);
                addLog(`  ↳ BRAIN 伤害: 2d6 = ${dmg}`);
              }},
            // Defense
            { name: '盾牌',     en: 'Shield',     cost: 1, cat: 'defense',
              desc: `本轮 NET 护甲 +4，直到下次激活`,
              roll: () => { addLog(`🛡 [盾牌 Shield] 激活：NET 护甲 +4（本轮有效）`); } },
            { name: '硬壳',     en: 'Armor',      cost: 1, cat: 'defense',
              desc: `被动 NET 护甲 +6，与盾牌叠加`,
              roll: () => { addLog(`🛡 [硬壳 Armor] 激活：NET 护甲 +6（持续）`); } },
            { name: '散弹',     en: 'Flak',       cost: 1, cat: 'defense',
              desc: `AoE 干扰，当前节点所有 ICE 各受 1d6 伤害`,
              roll: () => {
                const dmg = rollD6();
                addLog(`💥 [散弹 Flak] AoE 干扰：所有 ICE 受 ${dmg} 伤害`);
              }},
          ];

          const catLabels = { control: '控制 CONTROL', attack: '攻击 ATTACK', defense: '防御 DEFENSE', utility: '工具 UTILITY' };
          const catColors = {
            control: 'text-[#00e5ff] border-[#00e5ff]/30',
            attack:  'text-red-400 border-red-400/30',
            defense: 'text-green-400 border-green-400/30',
            utility: 'text-purple-400 border-purple-400/30',
          };

          return (
            <div className="space-y-3">
              {/* NET action tracker — read-only pips */}
              <div className="border border-[#00e5ff]/20 bg-[#00e5ff]/3 p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-cp-title text-[9px] text-[#00e5ff]/50 tracking-widest">// NET ACTIONS / ROUND</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-cp-title text-lg tracking-widest ${actionsLeft > 0 ? 'text-[#00e5ff]' : 'text-red-400'}`}>
                      {actionsLeft}
                    </span>
                    <span className="font-cp-body text-[10px] text-[#9ab0c8]/30">/ {netMax}</span>
                  </div>
                </div>
                {/* Read-only pip row */}
                <div className="flex gap-1.5 mb-2">
                  {Array.from({ length: netMax }).map((_, i) => (
                    <div key={i} className={`flex-1 h-2 transition-all ${i < netUsed
                      ? 'bg-[#00e5ff]/15 border border-[#00e5ff]/10'
                      : 'bg-[#00e5ff]/40 border border-[#00e5ff]/60 shadow-[0_0_4px_#00e5ff88]'}`} />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-cp-body text-[9px] text-[#9ab0c8]/30">
                    Lv{roleLevel} · INT{stats.INT} · 基础池 {iBase}
                  </span>
                  <button className="font-cp-body text-[10px] px-3 py-1 border border-[#00e5ff]/40 text-[#00e5ff] hover:bg-[#00e5ff]/10 tracking-wider"
                    onClick={() => { setNetUsed(0); addLog('[网行者] ▸ 新回合 — NET行动已重置'); }}>
                    ▶ 新回合
                  </button>
                </div>
              </div>

              {/* Program library */}
              {(['control','attack','defense','utility'] as const).map(cat => (
                <div key={cat}>
                  <div className={`font-cp-title text-[9px] tracking-widest mb-1.5 pb-1 border-b ${catColors[cat]}`}>
                    // {catLabels[cat]}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {programs.filter(p => p.cat === cat).map(prog => (
                      <button key={prog.name} disabled={!hasActions}
                        onClick={() => { prog.roll?.(); setNetUsed(n => Math.min(netMax, n+1)); }}
                        className={`text-left p-2 border transition-all group ${hasActions
                          ? `border-[#00e5ff]/20 bg-[#00e5ff]/3 hover:border-[#00e5ff]/50 hover:bg-[#00e5ff]/8`
                          : 'border-[#00e5ff]/8 opacity-40 cursor-not-allowed'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-cp-body text-xs text-[#d4d4d8] font-bold">{prog.name}</span>
                            <span className="font-cp-body text-[9px] text-[#9ab0c8]/35 ml-1.5">{prog.en}</span>
                          </div>
                          <span className="font-cp-title text-[8px] text-[#00e5ff]/50 border border-[#00e5ff]/25 px-1 shrink-0 ml-1">
                            {prog.cost} ACT
                          </span>
                        </div>
                        <div className="font-cp-body text-[9px] text-[#9ab0c8]/40 mt-0.5 leading-relaxed">{prog.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Tech ── */}
        {role === 'Tech' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1 mb-2">
              {[
                { name: '应急维修', note: `战场修理DV降低${roleLevel >= 5 ? 4 : 2}` },
                { name: '武器升级', note: `+${Math.floor(roleLevel/3)+1}伤害改装` },
                { name: '制造装备', note: `可制造Tier${Math.min(roleLevel,5)}装备` },
                { name: '发明原型', note: `研发检定+${roleLevel}` },
              ].map(t => (
                <div key={t.name} className={`border ${bg} border-[#f5c518]/15`}>
                  <div className="font-bold text-[#f5c518] mb-0.5">{t.name}</div>
                  <div className="text-[9px] text-[#9ab0c8]/40">{t.note}</div>
                </div>
              ))}
            </div>
            <button className={`${b} w-full`}
              onClick={() => doRoll('制造/修理', stats.TECH + (skills['基础技术'] ?? 0), roleLevel, 15)}>
              🔧 制造/修理检定 (TECH + 基础技术 + Lv vs DV15)
            </button>
          </div>
        )}

        {/* ── Medtech ── */}
        {role === 'Medtech' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1 mb-2">
              {[
                { name: '外科手术', dv: 17, unlock: 4 },
                { name: '医学制药', dv: 15, unlock: 1 },
                { name: '低温系统', dv: 17, unlock: 6 },
              ].map(s => (
                <button key={s.name} disabled={roleLevel < s.unlock}
                  onClick={() => doRoll(s.name, stats.TECH + (skills['医疗'] ?? 0), roleLevel, s.dv)}
                  className={`${b} py-2 flex flex-col items-center ${roleLevel < s.unlock ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  {s.name}<span className="text-[9px] opacity-50 mt-0.5">DV{s.dv}{roleLevel < s.unlock ? ` ▸Lv${s.unlock}` : ''}</span>
                </button>
              ))}
            </div>
            <button className={`${b} w-full`}
              onClick={() => doRoll('战场急救', stats.TECH + (skills['急救'] ?? 0), roleLevel, 13)}>
              🩺 战场急救 (TECH + 急救 + Lv vs DV13)
            </button>
            <div className="text-[10px] text-[#9ab0c8]/30">基础 {stats.TECH + (skills['急救'] ?? 0) + roleLevel}</div>
          </div>
        )}

        {/* ── Media ── */}
        {role === 'Media' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 border border-[#f5c518]/15 px-3 py-2 mb-2">
              <span className="text-[10px] text-[#9ab0c8]/50">公信力等级</span>
              <span className="text-2xl font-bold text-[#f5c518] font-mono">{roleLevel}</span>
              <span className="text-[10px] text-[#9ab0c8]/40">
                {roleLevel <= 3 ? '地方独立媒体' : roleLevel <= 6 ? '城市主流媒体' : roleLevel <= 9 ? '跨区域影响力' : '传奇记者'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: '📰 发布报道', base: stats.COOL + (skills['说服'] ?? 0), dv: 15 },
                { label: '🕵 获取情报', base: stats.INT + (skills['街头俚语'] ?? 0), dv: 13 },
                { label: '📡 舆论施压', base: stats.COOL + roleLevel, dv: 17 },
                { label: '🔒 保护信源', base: roleLevel, dv: undefined },
              ].map(a => (
                <button key={a.label} className={`${b} py-2 text-left`}
                  onClick={() => doRoll(a.label, a.base, 0, a.dv)}>
                  {a.label}
                  {a.dv ? <span className="text-[9px] opacity-50 ml-1">DV{a.dv}</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Exec ── */}
        {role === 'Exec' && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-[#9ab0c8]/50">团队成员（上限 {Math.min(3, Math.ceil(roleLevel/3))}）</span>
              <span className="text-[#00e5ff]">{execTeam.length}/{Math.min(3, Math.ceil(roleLevel/3))}</span>
            </div>
            <div className="space-y-1 mb-2">
              {execTeam.map((m, i) => (
                <div key={i} className="flex items-center gap-2 border border-[#00e5ff]/15 px-2 py-1">
                  <span className="flex-1 text-[10px]">{m.name}</span>
                  <span className="text-[9px] text-[#9ab0c8]/40">忠诚</span>
                  <div className="flex gap-0.5">
                    <button className={`${b} px-1 py-0`} onClick={() => setExecTeam(t => t.map((x,j) => j===i ? {...x,loyalty:Math.max(1,x.loyalty-1)} : x))}>−</button>
                    <span className="text-[#f5c518] w-5 text-center text-[10px] font-bold">{m.loyalty}</span>
                    <button className={`${b} px-1 py-0`} onClick={() => setExecTeam(t => t.map((x,j) => j===i ? {...x,loyalty:Math.min(10,x.loyalty+1)} : x))}>+</button>
                  </div>
                  <button className="text-[9px] text-red-400 border border-red-500/25 px-1 hover:bg-red-900/20"
                    onClick={() => setExecTeam(t => t.filter((_,j) => j!==i))}>×</button>
                </div>
              ))}
            </div>
            {execTeam.length < Math.min(3, Math.ceil(roleLevel/3)) && (
              <div className="flex gap-1">
                <input value={execName} onChange={e => setExecName(e.target.value)} placeholder="成员姓名..."
                  className="flex-1 bg-[#080810] border border-[#00e5ff]/20 text-[10px] text-[#d4d4d8] p-1.5 outline-none focus:border-[#00e5ff] font-mono" />
                <button className={`${b} px-3`} onClick={() => {
                  if (!execName.trim()) return;
                  setExecTeam(t => [...t, { name: execName.trim(), loyalty: 5 }]);
                  setExecName('');
                }}>+ 添加</button>
              </div>
            )}
            <button className={`${b} w-full`}
              onClick={() => doRoll('调用企业支援', stats.COOL + (skills['交谈'] ?? 0), roleLevel, 15)}>
              🏢 调用企业支援 (COOL + 交谈 + Lv vs DV15)
            </button>
          </div>
        )}

        {/* ── Lawman ── */}
        {role === 'Lawman' && (
          <div className="space-y-2">
            <div className="text-[10px] text-[#9ab0c8]/50 mb-1">1d10 ≤ Lv{roleLevel} = 呼叫成功，1d6回合后抵达</div>
            <button className={`${b} w-full py-2`} onClick={() => {
              const roll = rollD10(), arr = Math.floor(Math.random()*6)+1;
              const ok = roll <= roleLevel;
              const msg = ok
                ? `[执法者] 呼叫成功！1d10[${roll}] ≤ Lv${roleLevel}，${arr}回合后支援抵达`
                : `[执法者] 呼叫失败。1d10[${roll}] > Lv${roleLevel}`;
              setBackupMsg(ok ? `✅ ${arr}回合后支援到达` : '❌ 呼叫失败');
              addLog(msg);
            }}>
              📻 呼叫后备支援 (1d10 ≤ Lv{roleLevel})
            </button>
            {backupMsg && (
              <div className={`text-[10px] px-2 py-1 border ${backupMsg.startsWith('✅') ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
                {backupMsg}
              </div>
            )}
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: '查询档案', s: '街头俚语', dv: 13 },
                { label: '封锁区域', s: '战术',     dv: 15 },
              ].map(a => (
                <button key={a.label} className={`${b} py-2`}
                  onClick={() => doRoll(a.label, stats.COOL + (skills[a.s] ?? 0), roleLevel, a.dv)}>
                  {a.label}<br/><span className="text-[9px] opacity-50">DV{a.dv}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Fixer ── */}
        {role === 'Fixer' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[#9ab0c8]/50">市场层级</span>
              <span className="font-bold text-[#f5c518] text-sm">{tiers[tierIdx]}</span>
            </div>
            <div className="flex gap-1 flex-wrap mb-2">
              {tiers.map((tier, i) => (
                <span key={tier} className={`text-[9px] px-1.5 py-0.5 border ${i <= tierIdx ? 'border-[#f5c518] text-[#f5c518]' : 'border-[#f5c518]/15 text-[#9ab0c8]/20'}`}>
                  {tier}
                </span>
              ))}
            </div>
            <button className={`${b} w-full`}
              onClick={() => doRoll('砍价谈判', stats.COOL + (skills['交易'] ?? 0), roleLevel, 13)}>
              💰 砍价谈判 (COOL + 交易 + Lv vs DV13)
            </button>
            <button className={`${b} w-full`}
              onClick={() => doRoll('寻找货源', stats.INT + (skills['街头俚语'] ?? 0), roleLevel, 13)}>
              🔍 寻找货源 (INT + 街头俚语 + Lv vs DV13)
            </button>
            <div className="text-[10px] text-[#9ab0c8]/30">基础 {stats.COOL + (skills['交易'] ?? 0) + roleLevel}</div>
          </div>
        )}

        {/* ── Nomad ── */}
        {role === 'Nomad' && (
          <div className="space-y-2">
            <div className="flex items-center gap-6 mb-2">
              <div className="text-center">
                <div className="text-[10px] text-[#9ab0c8]/50">驾驶加值</div>
                <div className="text-2xl font-bold text-[#f5c518] font-mono">+{roleLevel}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[#9ab0c8]/50">部落载具</div>
                <div className="flex items-center gap-1">
                  <button className={`${b} px-1.5 py-0`} onClick={() => setNomadV(v => Math.max(0, v-1))}>−</button>
                  <span className="text-2xl font-bold text-[#f5c518] font-mono w-8 text-center">{nomadV}</span>
                  <button className={`${b} px-1.5 py-0`} onClick={() => setNomadV(v => v+1)}>+</button>
                </div>
              </div>
            </div>
            <button className={`${b} w-full`}
              onClick={() => doRoll('驾驶检定', stats.REF + (skills['驾驶地面载具'] ?? 0), roleLevel, 15)}>
              🏍 驾驶检定 (REF + 驾驶地面载具 + Lv vs DV15)
            </button>
            <button className={`${b} w-full`}
              onClick={() => doRoll('呼叫部落', stats.INT + (skills['街头俚语'] ?? 0), roleLevel, 13)}>
              📡 呼叫部落支援 (INT + 街头俚语 + Lv vs DV13)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export function CpGameplay() {
  const { character, changeHp, changeHumanity, updateField, addInjury, removeInjury } = useCpStore();
  const [log, setLog] = useState<string[]>(['[系统] // NIGHT CITY LINK ESTABLISHED. Ready.']);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [modifier, setModifier] = useState(0);
  const [selectedDV, setSelectedDV] = useState(13);
  const [selectedWeapon, setSelectedWeapon] = useState(character.weapons[0]?.name ?? '');
  const [aimAtHead, setAimAtHead] = useState(false);
  const [diceTray, setDiceTray] = useState<Record<string, number>>({});
  const [lastRoll, setLastRoll] = useState<RollDisplay | null>(null);

  const addLog = (msg: string) => setLog(prev => [msg, ...prev].slice(0, 40));

  const woundPenalty = character.hp.current <= character.seriouslyWounded && character.hp.current > 0 ? -2 : 0;

  // ── Skill Check — uses evaluateCpSkillCheck ──────────
  const handleSkillCheck = () => {
    if (!selectedSkill) { toast.error('请先选择技能'); return; }
    const skillDef = CP_SKILLS.find(s => s.name === selectedSkill);
    if (!skillDef) return;
    const skillLevel = character.skills[selectedSkill] ?? skillDef.baseLevel;
    const statVal    = character.stats[skillDef.linkedStat];
    const natural    = rollD10();
    const extra      = (natural === 10 || natural === 1) ? rollD10() : undefined;
    const result     = evaluateCpSkillCheck({
      stat: statVal, skill: skillLevel, natural, extra,
      luckSpent: 0, modifiers: modifier + woundPenalty, dv: selectedDV,
    });
    const finalScore = result.total;
    const success    = result.success!;
    const dvLabel    = CP_DV_TABLE.find(d => d.dv === selectedDV)?.label ?? `DV${selectedDV}`;
    const rollLabel  = result.isCriticalSuccess
      ? `🎯 大成功! [10]+[${result.extra}] = ${natural + (result.extra ?? 0)}`
      : result.isCriticalFailure
      ? `💀 大失败! [1]-[${result.extra}] = ${natural - (result.extra ?? 0)}`
      : `[${natural}]`;
    const type: RollDisplay['type'] = result.isCriticalSuccess ? 'crit' : result.isCriticalFailure ? 'fumble'
      : success ? 'success' : 'fail';

    setLastRoll({
      label: selectedSkill,
      d10: natural + (result.isCriticalSuccess ? (result.extra ?? 0) : result.isCriticalFailure ? -(result.extra ?? 0) : 0),
      bonus: `+技${skillLevel}+${skillDef.linkedStat}${statVal}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ''}`,
      total: finalScore, dv: selectedDV, success, type,
    });

    const msg = [
      `🎲 [${selectedSkill}]  ${rollLabel}  +技${skillLevel} +${skillDef.linkedStat}(${statVal})${modifier !== 0 ? ` +修正(${modifier})` : ''}${woundPenalty ? ` +伤势(${woundPenalty})` : ''}`,
      `   总分: ${finalScore}  对阵: ${dvLabel} (DV${selectedDV})  → ${success ? '✅ 成功' : '❌ 失败'}`,
    ].join('\n');

    addLog(msg);
    toast(success ? '检定成功' : '检定失败', { description: `${finalScore} vs DV${selectedDV}` });
  };

  // ── Damage Roll ───────────────────────────────────────
  const handleDamageRoll = () => {
    const weapon = character.weapons.find(w => w.name === selectedWeapon);
    if (!weapon) { toast.error('请先选择武器'); return; }
    const { rolls, total, critInjury } = rollDamage(weapon.damage);
    let msg = `🔫 [${weapon.name}] ${weapon.damage} → [${rolls.join(', ')}] = ${total}`;

    setLastRoll({
      label: `${weapon.name} 伤害`,
      d10: total,
      bonus: `[${rolls.join(',')}]`,
      total,
      type: critInjury ? 'crit' : 'neutral',
    });

    if (critInjury) {
      const d6a = rollD6(), d6b = rollD6(), sum = d6a + d6b;
      const table  = aimAtHead ? CP_CRIT_INJURIES_HEAD : CP_CRIT_INJURIES_BODY;
      const injury = table.find(e => e.roll === sum) ?? table[table.length - 1];
      const injuryStr = `${aimAtHead ? '[头部]' : '[身体]'} ${injury.name} — ${injury.effect}`;
      msg += `\n  ⚠ 重伤! 2d6=[${d6a}+${d6b}=${sum}] 额外 -5 HP`;
      msg += `\n  📍 ${injuryStr}`;
      if (injury.quickFix) msg += `\n  🩹 ${injury.quickFix}`;
      addInjury(injuryStr);
      changeHp(-5);
      toast.error('重伤触发！', { description: injury.name });
    } else {
      toast.success(`伤害: ${total}`, { description: `[${rolls.join(', ')}]` });
    }
    addLog(msg);
  };

  // ── Stat Check ────────────────────────────────────────
  const handleStatCheck = (stat: CpStat) => {
    const statVal = character.stats[stat];
    const roll    = rollExploding();
    const final   = roll.total + statVal + woundPenalty;
    const type: RollDisplay['type'] = roll.isCrit ? 'crit' : roll.isFumble ? 'fumble' : 'neutral';
    setLastRoll({ label: CP_STAT_LABELS[stat], d10: roll.total, bonus: `+${stat}(${statVal})`, total: final, type });
    addLog(`🎲 属性检定 [${CP_STAT_LABELS[stat]}]: ${roll.label} +${statVal} = ${final}`);
    toast('属性检定', { description: `总分: ${final}` });
  };

  // ── Death Save ────────────────────────────────────────
  const handleDeathSave = () => {
    const roll    = rollD10();
    const success = roll <= character.deathSave;
    setLastRoll({ label: '死亡豁免', d10: roll, bonus: `vs ${character.deathSave}`, total: roll,
      success, type: success ? 'success' : 'fail' });
    addLog(`💀 死亡豁免: d10[${roll}] vs ${character.deathSave} → ${success ? '✅ 存活' : '❌ 濒死'}`);
    toast(success ? '死亡豁免成功！' : '死亡豁免失败！', { description: `掷出 ${roll}` });
  };

  // ── Free Dice Tray ────────────────────────────────────
  const handleFreeDice = () => {
    const entries = (Object.entries(diceTray) as [string, number][]).filter(([, c]) => c > 0);
    if (!entries.length) return;
    let total = 0;
    const parts: string[] = [];
    for (const [die, count] of entries) {
      const sides = parseInt(die.substring(1));
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      total += rolls.reduce((a, b) => a + b, 0);
      parts.push(`${count}${die}[${rolls.join(',')}]`);
    }
    setLastRoll({ label: '自由掷骰', d10: total, bonus: parts.join('+'), total, type: 'neutral' });
    addLog(`🎲 自由掷骰: ${parts.join(' + ')} = ${total}`);
    toast.success(`掷出 ${total}`, { description: parts.join(' + ') });
    setDiceTray({});
  };

  // HP bar color
  const hpPct  = character.hp.max > 0 ? (character.hp.current / character.hp.max) * 100 : 0;
  const hpGlow = character.hp.current <= character.seriouslyWounded ? '#f97316' : '#00e5ff';

  return (
    <div className="space-y-5 text-[#9ab0c8] font-mono bg-[#08080f]">

      {/* ── Top HUD bar ──────────────────────────────────── */}
      <div className="hud-panel-cyan hud-panel cp-panel-cyan p-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-cp-title text-[9px] text-[#00e5ff]/40 tracking-widest">// NIGHT CITY · GAMEPLAY</div>
            <h2 className="font-cp-title text-xl neon-gold uppercase tracking-widest leading-tight mt-0.5">
              {character.name || '— UNKNOWN EDGE —'}
            </h2>
            <div className="font-cp-body text-[9px] text-[#9ab0c8]/30 tracking-wider mt-0.5">
              {character.role} Lv.{character.roleLevel}
              {woundPenalty < 0 && <span className="text-orange-400 ml-2 animate-pulse">⚠ 重伤 −2</span>}
            </div>
          </div>
          {/* Vital readouts */}
          <div className="flex items-stretch gap-px">
            <div className="cp-panel text-center px-4 py-2 min-w-[64px]">
              <div className="font-cp-title text-[8px] text-[#00e5ff]/40 tracking-widest">HP</div>
              <div className={`font-cp-title text-2xl leading-none mt-0.5
                ${character.hp.current <= character.seriouslyWounded ? 'text-orange-400 animate-pulse' : 'neon-cyan'}`}>
                {character.hp.current}
              </div>
              <div className="font-cp-body text-[9px] text-[#00e5ff]/25">/{character.hp.max}</div>
            </div>
            <div className="cp-panel text-center px-4 py-2 min-w-[64px]">
              <div className="font-cp-title text-[8px] text-purple-400/40 tracking-widest">HUM</div>
              <div className="font-cp-title text-2xl text-purple-400 leading-none mt-0.5 data-pulse">
                {character.humanity.current}
              </div>
              <div className="font-cp-body text-[9px] text-purple-400/25">/{character.humanity.max}</div>
            </div>
            <div className="cp-panel text-center px-4 py-2 min-w-[64px]">
              <div className="font-cp-title text-[8px] text-[#f5c518]/40 tracking-widest">EMP</div>
              <div className="font-cp-title text-2xl neon-gold leading-none mt-0.5">
                {character.stats.EMP}
              </div>
              <div className="font-cp-body text-[9px] text-[#f5c518]/25">stat</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Last Roll — PROMINENT DISPLAY ────────────────── */}
      {lastRoll && (
        <div className={`hud-panel p-4 flex gap-4 items-center transition-all
          ${lastRoll.type === 'crit'    ? 'hud-panel-gold border-2 border-[#f5c518] shadow-[0_0_28px_rgba(245,197,24,0.25)]' :
            lastRoll.type === 'fumble'  ? 'hud-panel-red  border-2 border-red-500 shadow-[0_0_24px_rgba(255,51,51,0.25)]' :
            lastRoll.type === 'success' ? 'border-2 border-[#39ff14] bg-[#39ff14]/5 shadow-[0_0_20px_rgba(57,255,20,0.18)]' :
            lastRoll.type === 'fail'    ? 'border-2 border-red-500/60 bg-red-950/20' :
            'hud-panel-cyan border-[#00e5ff]/40'}`}>
          {/* Big number */}
          <div className="text-center shrink-0">
            <div className="text-[9px] tracking-[0.2em] uppercase mb-0.5
              text-[#00e5ff]/50">
              {lastRoll.type === 'crit' ? '// CRITICAL //' : lastRoll.type === 'fumble' ? '// FUMBLE //'
                : lastRoll.type === 'success' ? '// SUCCESS //' : lastRoll.type === 'fail' ? '// FAIL //'
                : '// ROLL //'}
            </div>
            <div className={`font-cp-title text-6xl leading-none
              ${lastRoll.type === 'crit' ? 'neon-gold' :
                lastRoll.type === 'fumble' ? 'text-red-500 neon-red' :
                lastRoll.type === 'success' ? 'text-[#39ff14] neon-green' :
                lastRoll.type === 'fail' ? 'text-red-400' : 'text-[#00e5ff]'}`}>
              {lastRoll.total}
            </div>
            {lastRoll.dv !== undefined && (
              <div className="text-[10px] text-[#9ab0c8]/50 mt-0.5">vs DV{lastRoll.dv}</div>
            )}
          </div>
          {/* Detail */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[#f5c518] uppercase tracking-wide truncate">{lastRoll.label}</div>
            <div className="text-[10px] text-[#9ab0c8]/60 mt-0.5 font-mono">
              d10[{lastRoll.d10}] {lastRoll.bonus}
            </div>
            {lastRoll.success !== undefined && (
              <div className={`text-sm font-bold mt-1 ${lastRoll.success ? 'text-[#39ff14]' : 'text-red-400'}`}>
                {lastRoll.success ? '✓ 成功 SUCCESS' : '✕ 失败 FAILURE'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Left column ──────────────────────────────── */}
        <div className="space-y-4">
          {/* HP */}
          <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
            <SysHeader>VITALS // 生命值</SysHeader>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2.5 bg-[#080810] border border-[#00e5ff]/15 overflow-hidden">
                <div className="h-full transition-all duration-300"
                  style={{ width: `${hpPct}%`, backgroundColor: hpGlow, boxShadow: `0 0 8px ${hpGlow}` }} />
              </div>
              <span className="font-bold text-[#00e5ff] text-sm font-mono w-16 text-right">
                {character.hp.current} <span className="text-[#00e5ff]/40">/ {character.hp.max}</span>
              </span>
            </div>
            <div className="text-[10px] text-[#9ab0c8]/40 mb-2">
              重伤阈值 [ {character.seriouslyWounded} ] 　死亡豁免 [ {character.deathSave} ]
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[-5, -3, -1, 1, 3, 5].map(amt => (
                <button key={amt}
                  className={`h-7 px-2.5 border text-xs font-mono font-bold transition-colors ${amt < 0
                    ? 'border-red-500/40 text-red-400 hover:bg-red-900/20 hover:border-red-400'
                    : 'border-[#39ff14]/40 text-[#39ff14] hover:bg-[#39ff14]/10 hover:border-[#39ff14]'}`}
                  onClick={() => {
                    changeHp(amt);
                    addLog(`${amt > 0 ? '恢复' : '受到'} ${Math.abs(amt)} HP → ${Math.max(0, Math.min(character.hp.max, character.hp.current + amt))}/${character.hp.max}`);
                  }}>
                  {amt > 0 ? '+' : ''}{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Humanity */}
          <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
            <SysHeader>HUMANITY // 人性</SysHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-2.5 bg-[#080810] border border-purple-500/15 overflow-hidden">
                <div className="h-full transition-all duration-300 bg-purple-500"
                  style={{ width: `${character.humanity.max > 0 ? (character.humanity.current / character.humanity.max) * 100 : 0}%`,
                    boxShadow: '0 0 8px rgba(168,85,247,0.5)' }} />
              </div>
              <span className="font-bold text-purple-400 text-sm font-mono w-16 text-right">
                {character.humanity.current} <span className="text-purple-400/40">/ {character.humanity.max}</span>
              </span>
            </div>
            <div className="text-[10px] text-[#9ab0c8]/40 mb-2">
              EMP [ {character.stats.EMP} ] 　十位下降 → EMP −1
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[-7, -3, -1, 1].map(amt => (
                <button key={amt}
                  className={`h-7 px-2.5 border text-xs font-mono font-bold transition-colors ${amt < 0
                    ? 'border-purple-500/40 text-purple-400 hover:bg-purple-900/20'
                    : 'border-[#39ff14]/40 text-[#39ff14] hover:bg-[#39ff14]/10'}`}
                  onClick={() => {
                    const old = character.humanity.current;
                    changeHumanity(amt);
                    const nw = Math.max(0, Math.min(character.humanity.max, old + amt));
                    addLog(`人性 ${amt > 0 ? '+' : ''}${amt}: ${old} → ${nw}${Math.floor(old/10) > Math.floor(nw/10) ? '  ⚠ EMP↓' : ''}`);
                    if (nw <= 0) toast.error('人性归零！赛博精神病！');
                  }}>
                  {amt > 0 ? '+' : ''}{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Death Save */}
          <button onClick={handleDeathSave}
            className="w-full border-2 border-red-500/50 text-red-400 hover:bg-red-900/15 hover:border-red-400 py-2 uppercase text-xs font-bold font-mono tracking-widest transition-colors"
            style={{ boxShadow: '0 0 8px rgba(239,68,68,0.1)' }}>
            ■ 死亡豁免 DEATH SAVE — 基础值 [ {character.deathSave} ]
          </button>
        </div>

        {/* ── Right column ──────────────────────────────── */}
        <div className="space-y-4">
          {/* Skill Check */}
          <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
            <SysHeader>SKILL CHECK // 技能检定</SysHeader>
            <div className="space-y-2 mb-3">
              <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)}
                className="w-full bg-[#080810] border border-[#00e5ff]/20 text-[#9ab0c8] text-xs p-2 font-mono outline-none focus:border-[#00e5ff] focus:shadow-[0_0_8px_rgba(0,229,255,0.2)]">
                <option value="">— 选择技能 SELECT SKILL —</option>
                {CP_SKILLS.filter(s => (character.skills[s.name] ?? s.baseLevel) > 0).map(s => {
                  const lv    = character.skills[s.name] ?? s.baseLevel;
                  const total = lv + character.stats[s.linkedStat];
                  return <option key={s.name} value={s.name}>{s.name} {s.linkedStat}:{character.stats[s.linkedStat]}+技:{lv}={total}</option>;
                })}
              </select>

              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[9px] text-[#00e5ff]/40 mb-1 uppercase tracking-wide">难度 DV</div>
                  <select value={selectedDV} onChange={e => setSelectedDV(parseInt(e.target.value))}
                    className="w-full bg-[#080810] border border-[#00e5ff]/20 text-[#9ab0c8] text-xs p-2 font-mono outline-none focus:border-[#00e5ff]">
                    {CP_DV_TABLE.map(d => <option key={d.dv} value={d.dv}>{d.label} (DV{d.dv})</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <div className="text-[9px] text-[#00e5ff]/40 mb-1 uppercase tracking-wide">修正值</div>
                  <div className="flex">
                    <button className="w-7 h-8 border border-[#00e5ff]/20 text-[#00e5ff] font-bold text-xs hover:bg-[#00e5ff]/10"
                      onClick={() => setModifier(m => m - 1)}>−</button>
                    <div className="flex-1 h-8 border-t border-b border-[#00e5ff]/20 flex items-center justify-center text-sm font-bold text-[#f5c518] font-mono">
                      {modifier >= 0 ? `+${modifier}` : modifier}
                    </div>
                    <button className="w-7 h-8 border border-[#00e5ff]/20 text-[#00e5ff] font-bold text-xs hover:bg-[#00e5ff]/10"
                      onClick={() => setModifier(m => m + 1)}>+</button>
                  </div>
                </div>
              </div>

              <button onClick={handleSkillCheck}
                className="w-full py-2 bg-[#00e5ff] text-[#080810] font-bold uppercase font-mono text-xs tracking-widest hover:bg-[#00b8cc] transition-colors"
                style={{ boxShadow: '0 0 12px rgba(0,229,255,0.3)' }}>
                ▸ 掷骰检定 ROLL CHECK
              </button>
            </div>
          </div>

          {/* Damage Roll */}
          {character.weapons.length > 0 && (
            <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
              <SysHeader>DAMAGE // 伤害掷骰</SysHeader>
              <div className="flex gap-2 mb-2">
                <select value={selectedWeapon} onChange={e => setSelectedWeapon(e.target.value)}
                  className="flex-1 bg-[#080810] border border-[#00e5ff]/20 text-[#9ab0c8] text-xs p-2 font-mono outline-none focus:border-[#00e5ff]">
                  {character.weapons.map(w => <option key={w.name} value={w.name}>{w.name} ({w.damage})</option>)}
                </select>
                <button onClick={handleDamageRoll}
                  className="px-3 bg-[#f5c518] text-[#080810] font-bold uppercase font-mono text-xs hover:bg-[#f5c518]/80 transition-colors"
                  style={{ boxShadow: '0 0 10px rgba(245,197,24,0.25)' }}>
                  🔫 ROLL
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAimAtHead(h => !h)}
                  className={`text-[10px] px-2 py-1 border font-mono uppercase transition-colors ${aimAtHead
                    ? 'border-red-400 text-red-400 bg-red-900/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                    : 'border-[#00e5ff]/20 text-[#9ab0c8]/40 hover:border-[#00e5ff]/40'}`}>
                  {aimAtHead ? '🎯 瞄准头部 (−8命中)' : '○ 瞄准头部'}
                </button>
                <span className="text-[9px] text-[#9ab0c8]/25">两骰同最大 → 2d6重伤表</span>
              </div>
            </div>
          )}

          {/* Quick Stat Checks */}
          <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
            <SysHeader>STAT CHECKS // 属性检定</SysHeader>
            <div className="flex flex-wrap gap-1">
              {CP_STAT_ORDER.map(stat => (
                <button key={stat}
                  className="h-8 px-2 border border-[#00e5ff]/20 text-[#00e5ff] text-[10px] font-mono hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]/50 transition-colors"
                  onClick={() => handleStatCheck(stat)}>
                  {stat} <span className="text-[#f5c518] font-bold">[{character.stats[stat]}]</span>
                </button>
              ))}
            </div>
          </div>

          {/* Free Dice Tray */}
          <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
            <SysHeader>DICE TRAY // 自由掷骰</SysHeader>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {['d4','d6','d8','d10','d12','d20'].map(die => (
                <button key={die}
                  className="w-10 h-10 border-2 border-[#00e5ff]/30 bg-[#080810] text-[#00e5ff] font-bold text-[11px] hover:border-[#00e5ff] hover:bg-[#00e5ff]/10 hover:shadow-[0_0_8px_rgba(0,229,255,0.2)] transition-all relative"
                  onClick={() => setDiceTray(p => ({ ...p, [die]: (p[die] || 0) + 1 }))}>
                  {die}
                  {diceTray[die] > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#f5c518] text-[#080810] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black leading-none">
                      {diceTray[die]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-[#9ab0c8]/40 mb-2 font-mono">
              {(Object.entries(diceTray) as [string, number][]).filter(([,c]) => c > 0).map(([d,c]) => `${c}${d}`).join(' + ') || '—  选择骰子开始'}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDiceTray({})}
                className="px-3 py-1 border border-[#00e5ff]/20 text-[#9ab0c8]/50 text-xs font-mono hover:text-[#9ab0c8] hover:border-[#00e5ff]/40 transition-colors">
                清空
              </button>
              <button onClick={handleFreeDice}
                disabled={Object.values(diceTray).every(c => c === 0)}
                className="flex-1 py-1 bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff] text-xs font-bold font-mono uppercase hover:bg-[#00e5ff]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ boxShadow: '0 0 8px rgba(0,229,255,0.1)' }}>
                ▸ R O L L
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Injury Tracker ─────────────────────────────── */}
      {(character.injuries ?? []).length > 0 && (
        <div className="border-2 border-orange-500/40 bg-orange-950/20 p-4"
          style={{ boxShadow: '0 0 12px rgba(249,115,22,0.1)' }}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-2">
            <span className="animate-pulse">▸</span>
            INJURY TRACKER — {character.injuries.length} 处伤势
          </div>
          <div className="space-y-1.5">
            {(character.injuries ?? []).map((inj, i) => (
              <div key={i} className="flex items-start gap-2 border border-orange-500/20 px-3 py-1.5">
                <span className="text-orange-300 flex-1 text-[10px] leading-relaxed font-mono">{inj}</span>
                <button
                  onClick={() => { removeInjury(inj); addLog(`✅ 伤势处理: ${inj}`); }}
                  className="text-[9px] border border-orange-500/30 text-orange-400 px-1.5 py-0.5 hover:bg-orange-900/30 shrink-0 uppercase font-mono">
                  处理
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Role Ability ─────────────────────────────────── */}
      <RoleAbilityPanel
        role={character.role}
        roleLevel={character.roleLevel}
        stats={character.stats}
        skills={character.skills}
        addLog={addLog}
        onRoll={setLastRoll}
      />

      {/* ── Combat Log ─────────────────────────────────── */}
      <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
        <SysHeader>COMBAT LOG // 战斗日志</SysHeader>
        <div className="font-mono text-[10px] overflow-y-auto max-h-[220px] bg-[#050508] p-3 border border-[#00e5ff]/8 space-y-0.5"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 5px,rgba(0,229,255,0.008) 5px,rgba(0,229,255,0.008) 6px)' }}>
          {log.map((line, i) => (
            <div key={i} className={`border-b border-[#00e5ff]/5 pb-0.5 last:border-0 whitespace-pre-wrap leading-relaxed ${cpLogColor(line)}`}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
