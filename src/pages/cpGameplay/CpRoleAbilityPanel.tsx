import { useState } from 'react';
import type { RuntimeLogEntry } from '../../lib/runtime-log-types';
import { CP_ROLE_ABILITIES, type CpRole, type CpStat } from '../../lib/cp-types';
import { makeCpRuntimeLogEntry, rollD10, rollD6 } from './CpGameplayShared';

interface RoleAbilityPanelProps {
  role: CpRole;
  roleLevel: number;
  stats: Record<CpStat, number>;
  skills: Record<string, number>;
  addLog: (entry: RuntimeLogEntry | string) => void;
}

export function CpRoleAbilityPanel({ role, roleLevel, stats, skills, addLog }: RoleAbilityPanelProps) {
  const ability = CP_ROLE_ABILITIES[role];
  const [showLevelTable, setShowLevelTable] = useState(false);
  const [rbGroup, setRbGroup] = useState<'solo'|'small'|'large'|'crowd'>('solo');
  const poolInit = { 先攻: 0, 闪避: 0, 伤害: 0, 感知: 0, 反击: 0 };
  const [soloPool, setSoloPool] = useState<Record<string, number>>(poolInit);
  const soloUsed = (Object.values(soloPool) as number[]).reduce((a, b) => a + b, 0);
  const netMax = roleLevel <= 3 ? 2 : roleLevel <= 6 ? 3 : roleLevel <= 9 ? 4 : 5;
  const [netUsed, setNetUsed] = useState(0);
  const [execTeam, setExecTeam] = useState<{name:string;loyalty:number}[]>([]);
  const [execName, setExecName] = useState('');
  const [backupMsg, setBackupMsg] = useState('');
  const [nomadV, setNomadV] = useState(roleLevel);
  const tiers = ['街头黑市','地下供应商','独立军火商','企业经销商','军事级别'];
  const tierIdx = Math.min(Math.floor((roleLevel - 1) / 2), tiers.length - 1);

  const doRoll = (label: string, base: number, lvBonus: number, dv?: number) => {
    const d10 = rollD10();
    const total = d10 + base + lvBonus;
    const success = dv !== undefined ? total >= dv : undefined;
    const outcome = success === undefined ? '等待 GM 判定' : success ? '成功' : '失败';
    addLog(makeCpRuntimeLogEntry({
      kind: 'check',
      title: label,
      summary: `${label} 职业能力检定`,
      detail: dv !== undefined ? `对抗 DV${dv}` : '未设置 DV，由 GM 判定结果。',
      displayValue: total,
      calculation: `d10[${d10}] + 基础${base} + 职业${lvBonus} = ${total}`,
      outcome,
      tags: [
        'role-ability',
        d10 === 10 ? 'critical-success' : '',
        d10 === 1 ? 'critical-failure' : '',
        success === true ? 'success' : '',
        success === false ? 'failure' : '',
        success === undefined ? 'waiting-gm' : '',
        success === undefined ? 'no-dv' : '',
        success === undefined ? 'gm-adjudication' : '',
      ].filter(Boolean),
      payload: {
        system: 'cpred',
        rollType: 'roleAbility',
        d10,
        total,
        base,
        roleLevel: lvBonus,
        dv,
        success,
      },
    }));
  };

  const addRoleAction = (title: string, summary: string, detail?: string, tags: string[] = []) => {
    addLog(makeCpRuntimeLogEntry({
      kind: 'action',
      title,
      summary,
      detail,
      displayValue: 'ACTION',
      outcome: '已记录',
      tags: ['role-ability', ...tags],
      payload: {
        system: 'cpred',
        action: title,
        role,
        roleLevel,
      },
    }));
  };

  const addRoleDamage = (title: string, total: number, calculation: string, detail?: string, tags: string[] = []) => {
    addLog(makeCpRuntimeLogEntry({
      kind: 'damage',
      title,
      summary: `${title} 伤害提示`,
      detail,
      displayValue: total,
      calculation,
      outcome: '伤害已掷出',
      tags: ['role-ability', 'damage-roll', ...tags],
      payload: {
        system: 'cpred',
        rollType: 'roleDamage',
        role,
        roleLevel,
        total,
      },
    }));
  };

  const b = 'px-2 py-1 text-[10px] uppercase font-mono border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 cursor-pointer transition-colors';
  const bg = 'border-[#f5c518]/20 p-2 text-[10px]';
  const rbDV = { solo: 8, small: 10, large: 12, crowd: 15 };
  const rbLbl = { solo: '个人 DV8', small: '小群 DV10', large: '大群 DV12', crowd: '人群 DV15' };

  return (
    <div className="cp-panel hud-panel-gold hud-panel">
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
              onClick={() => {
                setSoloPool(poolInit);
                addRoleAction('佣兵战斗意识重置', '战斗意识点数已重置。', `可重新分配 ${roleLevel} 点战斗意识。`, ['solo', 'pool-reset']);
              }}>
              重置
            </button>
          </div>
        )}

        {role === 'Netrunner' && (() => {
          const actionsLeft = netMax - netUsed;
          const hasActions = actionsLeft > 0;
          const iBase = stats.INT + (skills['接口'] ?? skills['赛博技术'] ?? 0) + roleLevel;
          interface NetProgram {
            name: string; en: string; cost: number; cat: 'control' | 'attack' | 'defense' | 'utility';
            desc: string; roll?: () => void;
          }
          const programs: NetProgram[] = [
            { name: '寻路', en: 'Pathfinder', cost: 1, cat: 'control', desc: `探索 NET 架构节点。INT+接口+Lv vs DV6`, roll: () => doRoll('寻路 Pathfinder', stats.INT + (skills['接口'] ?? 0), roleLevel, 6) },
            { name: '秘门', en: 'Backdoor', cost: 1, cat: 'control', desc: `绕过 ICE 不触发警报。INT+接口+Lv vs ICE ATT`, roll: () => doRoll('秘门 Backdoor', stats.INT + (skills['接口'] ?? 0), roleLevel) },
            { name: '控制设备', en: 'Control', cost: 1, cat: 'control', desc: `夺取电子设备控制权。INT+接口+Lv vs DV${8 + Math.floor(roleLevel / 3) * 2}`, roll: () => doRoll('控制 Control', stats.INT + (skills['接口'] ?? 0), roleLevel, 8 + Math.floor(roleLevel/3)*2) },
            { name: '病毒上传', en: 'Virus', cost: 1, cat: 'control', desc: `植入瘫痪程序。INT+接口+Lv vs 目标防御`, roll: () => doRoll('病毒 Virus', stats.INT + (skills['接口'] ?? 0), roleLevel) },
            { name: '扫描识别', en: 'Eye-Dee', cost: 1, cat: 'utility', desc: `识别节点内程序/文件。INT+接口+Lv vs DV6`, roll: () => doRoll('识别 Eye-Dee', stats.INT + (skills['接口'] ?? 0), roleLevel, 6) },
            { name: '探针', en: 'Ping', cost: 1, cat: 'utility', desc: `扫描当前节点，揭示所有 ICE。不需要检定`, roll: () => { addRoleAction('探针 Ping', '扫描当前节点，揭示所有 ICE。', `Interface Lv${roleLevel}；无需检定。`, ['netrunner', 'utility', 'no-roll']); } },
            { name: '滑行', en: 'Slide', cost: 1, cat: 'utility', desc: `在 NET 架构中移动一层，自动成功`, roll: () => { addRoleAction('滑行 Slide', '向深处推进一层 NET 架构。', '现有 UI 仅记录动作，不实现 Netrunning 状态机。', ['netrunner', 'utility', 'no-roll']); } },
            { name: '蠕虫', en: 'Worm', cost: 1, cat: 'utility', desc: `缓慢穿透 ICE（需3轮）。INT+接口+Lv`, roll: () => doRoll('蠕虫 Worm', stats.INT + (skills['接口'] ?? 0), roleLevel) },
            { name: '冰锥', en: 'Zap', cost: 1, cat: 'attack', desc: `对 ICE 或网行者造成 1d6 伤害`, roll: () => { const dmg = rollD6(); doRoll('冰锥 Zap', stats.INT + (skills['接口'] ?? 0), roleLevel); addRoleDamage('冰锥 Zap', dmg, `1d6[${dmg}] = ${dmg}`, 'NET 伤害提示；未实现 Netrunning 状态机。', ['netrunner', 'net-damage']); }},
            { name: '重锤', en: 'Banhammer', cost: 1, cat: 'attack', desc: `摧毁 ICE，造成 3d6 伤害。INT+接口+Lv vs ICE DEF`, roll: () => { const dmg = rollD6() + rollD6() + rollD6(); doRoll('重锤 Banhammer', stats.INT + (skills['接口'] ?? 0), roleLevel); addRoleDamage('重锤 Banhammer', dmg, `3d6 = ${dmg}`, 'NET 伤害提示；未实现 Netrunning 状态机。', ['netrunner', 'net-damage']); }},
            { name: '长剑', en: 'Sword', cost: 1, cat: 'attack', desc: `近战攻击 ICE，3d6+${roleLevel} NET 伤害`, roll: () => { const dmg = rollD6() + rollD6() + rollD6() + roleLevel; doRoll('长剑 Sword', stats.INT + (skills['接口'] ?? 0), roleLevel); addRoleDamage('长剑 Sword', dmg, `3d6 + ${roleLevel} = ${dmg}`, 'NET 伤害提示；未实现 Netrunning 状态机。', ['netrunner', 'net-damage']); }},
            { name: '神经撕裂', en: 'Nervesplice', cost: 1, cat: 'attack', desc: `攻击敌方网行者大脑，BRAIN伤害。INT+接口+Lv vs DEF`, roll: () => { const dmg = rollD6() + rollD6(); doRoll('神经撕裂 Nervesplice', stats.INT + (skills['接口'] ?? 0), roleLevel); addRoleDamage('神经撕裂 Nervesplice', dmg, `2d6 = ${dmg}`, 'BRAIN 伤害提示；未实现 Netrunning 状态机。', ['netrunner', 'brain-damage']); }},
            { name: '盾牌', en: 'Shield', cost: 1, cat: 'defense', desc: `本轮 NET 护甲 +4，直到下次激活`, roll: () => { addRoleAction('盾牌 Shield', 'NET 护甲 +4（本轮有效）。', '仅记录动作，不修改角色护甲或运行时状态。', ['netrunner', 'defense', 'no-roll']); } },
            { name: '硬壳', en: 'Armor', cost: 1, cat: 'defense', desc: `被动 NET 护甲 +6，与盾牌叠加`, roll: () => { addRoleAction('硬壳 Armor', 'NET 护甲 +6（持续）。', '仅记录动作，不修改角色护甲或运行时状态。', ['netrunner', 'defense', 'no-roll']); } },
            { name: '散弹', en: 'Flak', cost: 1, cat: 'defense', desc: `AoE 干扰，当前节点所有 ICE 各受 1d6 伤害`, roll: () => { const dmg = rollD6(); addRoleDamage('散弹 Flak', dmg, `1d6[${dmg}] = ${dmg}`, 'AoE 干扰提示：当前节点所有 ICE 各受伤害；未实现 Netrunning 状态机。', ['netrunner', 'aoe', 'net-damage']); }},
          ];
          const catLabels = { control: '控制 CONTROL', attack: '攻击 ATTACK', defense: '防御 DEFENSE', utility: '工具 UTILITY' };
          const catColors = {
            control: 'text-[#00e5ff] border-[#00e5ff]/30',
            attack: 'text-red-400 border-red-400/30',
            defense: 'text-green-400 border-green-400/30',
            utility: 'text-purple-400 border-purple-400/30',
          };
          return (
            <div className="space-y-3">
              <div className="border border-[#00e5ff]/20 bg-[#00e5ff]/3 p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-cp-title text-[9px] text-[#00e5ff]/50 tracking-widest">// NET ACTIONS / ROUND</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-cp-title text-lg tracking-widest ${actionsLeft > 0 ? 'text-[#00e5ff]' : 'text-red-400'}`}>{actionsLeft}</span>
                    <span className="font-cp-body text-[10px] text-[#9ab0c8]/30">/ {netMax}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 mb-2">
                  {Array.from({ length: netMax }).map((_, i) => (
                    <div key={i} className={`flex-1 h-2 transition-all ${i < netUsed ? 'bg-[#00e5ff]/15 border border-[#00e5ff]/10' : 'bg-[#00e5ff]/40 border border-[#00e5ff]/60 shadow-[0_0_4px_#00e5ff88]'}`} />
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-cp-body text-[9px] text-[#9ab0c8]/30">Lv{roleLevel} · INT{stats.INT} · 基础池 {iBase}</span>
                  <button className="font-cp-body text-[10px] px-3 py-1 border border-[#00e5ff]/40 text-[#00e5ff] hover:bg-[#00e5ff]/10 tracking-wider"
                    onClick={() => { setNetUsed(0); addRoleAction('NET 行动重置', '新回合：NET 行动已重置。', `本轮可用 NET actions: ${netMax}`, ['netrunner', 'round-reset']); }}>
                    ▶ 新回合
                  </button>
                </div>
              </div>
              {(['control','attack','defense','utility'] as const).map(cat => (
                <div key={cat}>
                  <div className={`font-cp-title text-[9px] tracking-widest mb-1.5 pb-1 border-b ${catColors[cat]}`}>// {catLabels[cat]}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {programs.filter(p => p.cat === cat).map(prog => (
                      <button key={prog.name} disabled={!hasActions}
                        onClick={() => { prog.roll?.(); setNetUsed(n => Math.min(netMax, n+1)); }}
                        className={`text-left p-2 border transition-all group ${hasActions ? `border-[#00e5ff]/20 bg-[#00e5ff]/3 hover:border-[#00e5ff]/50 hover:bg-[#00e5ff]/8` : 'border-[#00e5ff]/8 opacity-40 cursor-not-allowed'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-cp-body text-xs text-[#d4d4d8] font-bold">{prog.name}</span>
                            <span className="font-cp-body text-[9px] text-[#9ab0c8]/35 ml-1.5">{prog.en}</span>
                          </div>
                          <span className="font-cp-title text-[8px] text-[#00e5ff]/50 border border-[#00e5ff]/25 px-1 shrink-0 ml-1">{prog.cost} ACT</span>
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
            <button className={`${b} w-full`} onClick={() => doRoll('制造/修理', stats.TECH + (skills['基础技术'] ?? 0), roleLevel, 15)}>🔧 制造/修理检定 (TECH + 基础技术 + Lv vs DV15)</button>
          </div>
        )}

        {role === 'Medtech' && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1 mb-2">
              {[{ name: '外科手术', dv: 17, unlock: 4 }, { name: '医学制药', dv: 15, unlock: 1 }, { name: '低温系统', dv: 17, unlock: 6 }].map(s => (
                <button key={s.name} disabled={roleLevel < s.unlock} onClick={() => doRoll(s.name, stats.TECH + (skills['医疗'] ?? 0), roleLevel, s.dv)}
                  className={`${b} py-2 flex flex-col items-center ${roleLevel < s.unlock ? 'opacity-30 cursor-not-allowed' : ''}`}>
                  {s.name}<span className="text-[9px] opacity-50 mt-0.5">DV{s.dv}{roleLevel < s.unlock ? ` ▸Lv${s.unlock}` : ''}</span>
                </button>
              ))}
            </div>
            <button className={`${b} w-full`} onClick={() => doRoll('战场急救', stats.TECH + (skills['急救'] ?? 0), roleLevel, 13)}>🩺 战场急救 (TECH + 急救 + Lv vs DV13)</button>
            <div className="text-[10px] text-[#9ab0c8]/30">基础 {stats.TECH + (skills['急救'] ?? 0) + roleLevel}</div>
          </div>
        )}

        {role === 'Media' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 border border-[#f5c518]/15 px-3 py-2 mb-2">
              <span className="text-[10px] text-[#9ab0c8]/50">公信力等级</span>
              <span className="text-2xl font-bold text-[#f5c518] font-mono">{roleLevel}</span>
              <span className="text-[10px] text-[#9ab0c8]/40">{roleLevel <= 3 ? '地方独立媒体' : roleLevel <= 6 ? '城市主流媒体' : roleLevel <= 9 ? '跨区域影响力' : '传奇记者'}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: '📰 发布报道', base: stats.COOL + (skills['说服'] ?? 0), dv: 15 },
                { label: '🕵 获取情报', base: stats.INT + (skills['街头俚语'] ?? 0), dv: 13 },
                { label: '📡 舆论施压', base: stats.COOL + roleLevel, dv: 17 },
                { label: '🔒 保护信源', base: roleLevel, dv: undefined },
              ].map(a => (
                <button key={a.label} className={`${b} py-2 text-left`} onClick={() => doRoll(a.label, a.base, 0, a.dv)}>
                  {a.label}{a.dv ? <span className="text-[9px] opacity-50 ml-1">DV{a.dv}</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}

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
                  <button className="text-[9px] text-red-400 border border-red-500/25 px-1 hover:bg-red-900/20" onClick={() => setExecTeam(t => t.filter((_,j) => j!==i))}>×</button>
                </div>
              ))}
            </div>
            {execTeam.length < Math.min(3, Math.ceil(roleLevel/3)) && (
              <div className="flex gap-1">
                <input value={execName} onChange={e => setExecName(e.target.value)} placeholder="成员姓名..." className="flex-1 bg-[#080810] border border-[#00e5ff]/20 text-[10px] text-[#d4d4d8] p-1.5 outline-none focus:border-[#00e5ff] font-mono" />
                <button className={`${b} px-3`} onClick={() => { if (!execName.trim()) return; setExecTeam(t => [...t, { name: execName.trim(), loyalty: 5 }]); setExecName(''); }}>+ 添加</button>
              </div>
            )}
            <button className={`${b} w-full`} onClick={() => doRoll('调用企业支援', stats.COOL + (skills['交谈'] ?? 0), roleLevel, 15)}>🏢 调用企业支援 (COOL + 交谈 + Lv vs DV15)</button>
          </div>
        )}

        {role === 'Lawman' && (
          <div className="space-y-2">
            <div className="text-[10px] text-[#9ab0c8]/50 mb-1">1d10 ≤ Lv{roleLevel} = 呼叫成功，1d6回合后抵达</div>
            <button className={`${b} w-full py-2`} onClick={() => {
              const roll = rollD10(), arr = Math.floor(Math.random()*6)+1;
              const ok = roll <= roleLevel;
              setBackupMsg(ok ? `✅ ${arr}回合后支援到达` : '❌ 呼叫失败');
              addLog(makeCpRuntimeLogEntry({
                kind: 'action',
                title: '呼叫后备支援',
                summary: `执法者后备支援呼叫${ok ? '成功' : '失败'}`,
                detail: ok ? `${arr} 回合后支援抵达。` : '本次呼叫未成功。',
                displayValue: roll,
                calculation: `1d10[${roll}] ${ok ? '<=' : '>'} Lv${roleLevel}`,
                outcome: ok ? '成功' : '失败',
                tags: ['role-ability', 'lawman', ok ? 'success' : 'failure'],
                payload: { system: 'cpred', action: 'backupRequest', role: 'Lawman', roleLevel, d10: roll, arrivalRounds: ok ? arr : undefined, success: ok },
              }));
            }}>📻 呼叫后备支援 (1d10 ≤ Lv{roleLevel})</button>
            {backupMsg && <div className={`text-[10px] px-2 py-1 border ${backupMsg.startsWith('✅') ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>{backupMsg}</div>}
            <div className="grid grid-cols-2 gap-1">
              {[{ label: '查询档案', s: '街头俚语', dv: 13 }, { label: '封锁区域', s: '战术', dv: 15 }].map(a => (
                <button key={a.label} className={`${b} py-2`} onClick={() => doRoll(a.label, stats.COOL + (skills[a.s] ?? 0), roleLevel, a.dv)}>
                  {a.label}<br/><span className="text-[9px] opacity-50">DV{a.dv}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {role === 'Fixer' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[#9ab0c8]/50">市场层级</span>
              <span className="font-bold text-[#f5c518] text-sm">{tiers[tierIdx]}</span>
            </div>
            <div className="flex gap-1 flex-wrap mb-2">
              {tiers.map((tier, i) => (
                <span key={tier} className={`text-[9px] px-1.5 py-0.5 border ${i <= tierIdx ? 'border-[#f5c518] text-[#f5c518]' : 'border-[#f5c518]/15 text-[#9ab0c8]/20'}`}>{tier}</span>
              ))}
            </div>
            <button className={`${b} w-full`} onClick={() => doRoll('砍价谈判', stats.COOL + (skills['交易'] ?? 0), roleLevel, 13)}>💰 砍价谈判 (COOL + 交易 + Lv vs DV13)</button>
            <button className={`${b} w-full`} onClick={() => doRoll('寻找货源', stats.INT + (skills['街头俚语'] ?? 0), roleLevel, 13)}>🔍 寻找货源 (INT + 街头俚语 + Lv vs DV13)</button>
            <div className="text-[10px] text-[#9ab0c8]/30">基础 {stats.COOL + (skills['交易'] ?? 0) + roleLevel}</div>
          </div>
        )}

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
            <button className={`${b} w-full`} onClick={() => doRoll('驾驶检定', stats.REF + (skills['驾驶地面载具'] ?? 0), roleLevel, 15)}>🏍 驾驶检定 (REF + 驾驶地面载具 + Lv vs DV15)</button>
            <button className={`${b} w-full`} onClick={() => doRoll('呼叫部落', stats.INT + (skills['街头俚语'] ?? 0), roleLevel, 13)}>📡 呼叫部落支援 (INT + 街头俚语 + Lv vs DV13)</button>
          </div>
        )}
      </div>
    </div>
  );
}
