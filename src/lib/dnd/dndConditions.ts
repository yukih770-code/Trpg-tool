/** Identity-only extraction from dnd-local-chm-primary,
 * 玩家手册2024/术语汇编/状态.htm. No automatic condition mechanics in this release. */
export const DND_CONDITIONS = [
  { id: 'blinded', name: '目盲', nameEn: 'Blinded' },
  { id: 'charmed', name: '魅惑', nameEn: 'Charmed' },
  { id: 'deafened', name: '耳聋', nameEn: 'Deafened' },
  { id: 'exhaustion', name: '力竭', nameEn: 'Exhaustion' },
  { id: 'frightened', name: '恐慌', nameEn: 'Frightened' },
  { id: 'grappled', name: '受擒', nameEn: 'Grappled' },
  { id: 'incapacitated', name: '失能', nameEn: 'Incapacitated' },
  { id: 'invisible', name: '隐形', nameEn: 'Invisible' },
  { id: 'paralyzed', name: '麻痹', nameEn: 'Paralyzed' },
  { id: 'petrified', name: '石化', nameEn: 'Petrified' },
  { id: 'poisoned', name: '中毒', nameEn: 'Poisoned' },
  { id: 'prone', name: '倒地', nameEn: 'Prone' },
  { id: 'restrained', name: '束缚', nameEn: 'Restrained' },
  { id: 'stunned', name: '震慑', nameEn: 'Stunned' },
  { id: 'unconscious', name: '昏迷', nameEn: 'Unconscious' },
] as const;
export type DndConditionId = typeof DND_CONDITIONS[number]['id'];
export type DndConditionState = { systemId: 'dnd5e-2024'; conditionId: DndConditionId; level?: number };
export function isDndConditionId(id: unknown): id is DndConditionId { return DND_CONDITIONS.some(c => c.id === id); }
export function dndConditionLabel(state: { conditionId: string; level?: number }, english = false): string {
  const definition = DND_CONDITIONS.find(c => c.id === state.conditionId);
  return (definition ? english ? definition.nameEn : definition.name : state.conditionId) + (state.level ? ` ${state.level}` : '');
}
