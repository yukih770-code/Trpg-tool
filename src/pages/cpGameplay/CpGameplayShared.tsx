import type { ReactNode } from 'react';
import type { RuntimeLogEntry } from '../../lib/runtime-log-types';
import { evaluateCpExplodingD10 } from '../../lib/cp2024/cp-utils';

export const CP_GAMEPLAY_THEME = {
  border:        'border-[#00e5ff]/20',
  borderGold:    'border-[#d8b954]/20',
  borderFull:    'border-[#00e5ff]',
  borderGoldFull:'border-[#d8b954]/80',
  text:          'text-[#d8b954]',
  textCyan:      'text-[#00e5ff]',
  bgCard:        'bg-[#0b0b14]',
  btn:           'bg-[#00e5ff] text-[#080810] hover:bg-[#00b8cc] rounded-none font-bold uppercase font-mono text-xs px-3 py-1',
  btnGold:       'bg-[#f5c518] text-[#080810] hover:bg-[#f5c518]/80 rounded-none font-bold uppercase font-mono text-xs px-3 py-1',
  btnOutline:    'border border-[#00e5ff]/50 text-[#00e5ff] hover:bg-[#00e5ff]/10 rounded-none uppercase font-mono text-xs',
  btnGoldOutline:'border border-[#8a6f25]/60 text-[#d8b954]/85 hover:bg-[#f5c518]/10 hover:text-[#f5c518] rounded-none uppercase font-mono text-xs',
  btnDanger:     'border border-red-500/60 text-red-400 hover:bg-red-900/20 rounded-none uppercase font-mono text-xs',
};

export function SysHeader({ children, color = 'cyan' }: { children: ReactNode; color?: 'cyan' | 'gold' | 'red' }) {
  const clr = color === 'gold' ? 'text-[#d8b954] border-[#d8b954]/18'
    : color === 'red' ? 'text-red-400 border-red-400/20'
    : 'text-[#00e5ff] border-[#00e5ff]/20';
  return (
    <div className={`font-cp-title text-[9px] uppercase tracking-widest mb-3 border-b pb-1 flex items-center gap-1.5 ${clr}`}>
      <span className="opacity-40">//</span>
      {children}
    </div>
  );
}

// AI-LANDMARK: CPRED_RUNTIME_LOG_ENVELOPE
export function makeCpRuntimeLogEntry(entry: Omit<RuntimeLogEntry, 'id' | 'timestamp' | 'system' | 'visibility'>): RuntimeLogEntry {
  return {
    id: `cpred-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    system: 'cpred',
    visibility: 'public',
    ...entry,
  };
}

export function makeCpSystemEntry(summary: string, detail?: string, tags: string[] = ['system']): RuntimeLogEntry {
  return makeCpRuntimeLogEntry({
    kind: 'system',
    title: '系统提示',
    summary,
    detail,
    displayValue: 'LOG',
    tags,
    payload: { system: 'cpred' },
  });
}

export function cpEntryTone(entry: RuntimeLogEntry): string {
  const tags = entry.tags ?? [];
  const outcome = entry.outcome ?? '';
  if (tags.includes('critical-success')) return 'hud-panel-gold border-2 border-[#f5c518] shadow-[0_0_28px_rgba(245,197,24,0.22)]';
  if (tags.includes('critical-failure')) return 'hud-panel-red border-2 border-red-500 shadow-[0_0_24px_rgba(255,51,51,0.22)]';
  if (tags.includes('resource-humanity')) return 'border-2 border-purple-500/50 bg-purple-950/15';
  if (entry.kind === 'damage' || tags.includes('injury')) return 'border-2 border-orange-500/50 bg-orange-950/15';
  if (outcome.includes('成功') || tags.includes('success')) return 'border-2 border-[#39ff14]/70 bg-[#39ff14]/5';
  if (outcome.includes('失败') || tags.includes('failure')) return 'border-2 border-red-500/60 bg-red-950/20';
  return 'hud-panel-cyan border-[#00e5ff]/40';
}

export function cpDisplayColor(entry: RuntimeLogEntry): string {
  const tags = entry.tags ?? [];
  if (tags.includes('critical-success')) return 'neon-gold';
  if (tags.includes('critical-failure')) return 'text-red-500 neon-red';
  if (tags.includes('success')) return 'text-[#39ff14] neon-green';
  if (tags.includes('failure')) return 'text-red-400';
  if (tags.includes('resource-humanity')) return 'text-purple-400';
  if (entry.kind === 'damage') return 'text-orange-300';
  return 'text-[#00e5ff]';
}

export function cpKindLabel(kind: RuntimeLogEntry['kind']): string {
  const labels: Record<RuntimeLogEntry['kind'], string> = {
    check: 'CHECK',
    roll: 'ROLL',
    action: 'ACTION',
    damage: 'DAMAGE',
    resource: 'RESOURCE',
    system: 'SYSTEM',
    narration: 'NARRATION',
  };
  return labels[kind];
}

export interface RollResult {
  initial: number;
  bonus?: number;
  penalty?: number;
  total: number;
  isCrit: boolean;
  isFumble: boolean;
  label: string;
}

export function rollD10(): number { return Math.floor(Math.random() * 10) + 1; }
export function rollD6(): number { return Math.floor(Math.random() * 6) + 1; }

export function rollExploding(): RollResult {
  const natural = rollD10();
  const extra = (natural === 10 || natural === 1) ? rollD10() : undefined;
  const r = evaluateCpExplodingD10(natural, extra);
  const total = r.natural + r.totalModifierFromCritical;
  const label = r.isCriticalSuccess
    ? `🎯 大成功! [10]+[${r.extra}] = ${total}`
    : r.isCriticalFailure
    ? `💀 大失败! [1]-[${r.extra}] = ${total}`
    : `[${natural}]`;
  return {
    initial: natural,
    bonus: r.isCriticalSuccess ? r.extra : undefined,
    penalty: r.isCriticalFailure ? r.extra : undefined,
    total,
    isCrit: r.isCriticalSuccess,
    isFumble: r.isCriticalFailure,
    label,
  };
}

export function rollDamage(diceStr: string): { rolls: number[]; total: number; critInjury: boolean } {
  const m = diceStr.match(/(\d+)d(\d+)/i);
  if (!m) return { rolls: [], total: 0, critInjury: false };
  const count = parseInt(m[1]), sides = parseInt(m[2]);
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((a, b) => a + b, 0);
  return { rolls, total, critInjury: rolls.filter(r => r === sides).length >= 2 };
}
