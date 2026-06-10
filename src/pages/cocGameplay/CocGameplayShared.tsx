import type { RuntimeLogEntry, RuntimeLogKind } from '../../lib/runtime-log-types';

export type CocLogInput = {
  kind: RuntimeLogKind;
  title: string;
  summary: string;
  detail?: string;
  displayValue?: number | string;
  calculation?: string;
  outcome?: string;
  tags?: string[];
  payload?: unknown;
};

export const COC_KIND_LABELS: Record<RuntimeLogKind, string> = {
  check: '检定 / CHECK',
  roll: '掷骰 / ROLL',
  action: '动作 / ACTION',
  damage: '伤害 / DAMAGE',
  resource: '资源 / RESOURCE',
  system: '系统 / SYSTEM',
  narration: '叙述 / NARRATION',
};

export const COC_SUCCESS_LEVEL_LABELS: Record<string, string> = {
  critical: '大成功 / Critical',
  extreme: '极难成功 / Extreme',
  hard: '困难成功 / Hard',
  regular: '普通成功 / Regular',
  failure: '失败 / Failure',
  fumble: '大失败 / Fumble',
};

export function createCocLogEntry(input: CocLogInput): RuntimeLogEntry {
  return {
    id: `coc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    system: 'coc',
    visibility: 'public',
    ...input,
    tags: ['coc', ...(input.tags ?? [])],
  };
}

export function createCocSystemLogEntry(summary: string): RuntimeLogEntry {
  return createCocLogEntry({
    kind: 'system',
    title: '系统提示',
    summary,
    displayValue: 'READY',
    calculation: summary,
    outcome: '待命',
    tags: ['system'],
    payload: { system: 'coc', message: summary },
  });
}

export function cocLogColor(entry: RuntimeLogEntry): string {
  const tags = entry.tags ?? [];
  const outcome = entry.outcome ?? '';

  if (tags.includes('fumble') || outcome.includes('大失败')) return 'text-red-400 font-bold';
  if (tags.includes('critical') || tags.includes('extreme')) return 'text-yellow-300 font-bold';
  if (outcome.includes('失败')) return 'text-red-300';
  if (outcome.includes('成功')) return 'text-green-300';
  if (entry.kind === 'resource') return 'text-[#8fb7aa]';
  if (entry.kind === 'system') return 'text-[#8fb7aa] italic';
  return 'text-[#d4d4d8]';
}
