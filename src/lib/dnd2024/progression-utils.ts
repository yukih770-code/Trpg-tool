/**
 * DND 2024 Progression Utilities
 *
 * 纯函数工具库——查询 DND 2024 规则数据。
 *
 * 设计约束：
 * - 所有函数为纯函数（输出仅由输入决定，无副作用）
 * - 不依赖 React、Zustand、localStorage
 * - 不依赖 CharacterData 或现有 characterStore
 * - 找不到数据时返回 null 或空数组，不抛出异常
 *
 * 本轮不接入 Creator / Gameplay / Sheet。
 */

import { DND2024_CLASS_PROGRESSIONS } from '../../data/dnd2024/classProgression';
import type {
  DndClassKey,
  Dnd2024ClassProgression,
  Dnd2024LevelProgression,
  SpellPreparationMode,
  SpellcastingAbility,
  PactMagicProgression,
  ClassResourceDefinition,
  ActionDefinition,
  PassiveFeatureDefinition,
  SpellSlotProgression,
} from './progression-types';

// ─────────────────────────────────────────────────────────────────────────────
// 等级校验工具（内部使用）
// ─────────────────────────────────────────────────────────────────────────────

function clampLevel(level: number): number | null {
  const l = Math.floor(level);
  if (l < 1 || l > 20) return null;
  return l;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getClassProgression
//    获取整个职业的进阶数据
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取指定职业的完整进阶数据。
 * @param classKey - 职业标识键
 * @returns Dnd2024ClassProgression | null（职业不存在时返回 null）
 */
export function getClassProgression(classKey: DndClassKey): Dnd2024ClassProgression | null {
  return DND2024_CLASS_PROGRESSIONS[classKey] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. getLevelProgression
//    获取职业在某等级的进阶快照
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取职业在指定等级的进阶数据。
 * @param classKey - 职业标识键
 * @param level - 角色等级（1-20）
 * @returns Dnd2024LevelProgression | null
 */
export function getLevelProgression(
  classKey: DndClassKey,
  level: number,
): Dnd2024LevelProgression | null {
  const l = clampLevel(level);
  if (l === null) return null;
  const progression = getClassProgression(classKey);
  if (!progression) return null;
  return progression.levels[l - 1] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. getSpellPreparationMode
//    获取职业的法术准备模式
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取职业的法术准备模式。
 * @param classKey - 职业标识键
 * @returns SpellPreparationMode（非施法职业返回 'none'，未知职业返回 null）
 */
export function getSpellPreparationMode(classKey: DndClassKey): SpellPreparationMode | null {
  const progression = getClassProgression(classKey);
  if (!progression) return null;
  if (!progression.spellcasting) return 'none';
  return progression.spellcasting.mode;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. getSpellcastingAbility
//    获取职业的施法属性
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取职业的施法属性。
 * @param classKey - 职业标识键
 * @returns SpellcastingAbility | null（非施法职业返回 null）
 */
export function getSpellcastingAbility(classKey: DndClassKey): SpellcastingAbility | null {
  const progression = getClassProgression(classKey);
  if (!progression || !progression.spellcasting) return null;
  return progression.spellcasting.ability;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. getPactMagicAtLevel
//    获取邪术师在某等级的契约魔法数据
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取职业在指定等级的契约魔法状态。
 * 仅邪术师（warlock）会返回有效数据，其他职业返回 null。
 *
 * @param classKey - 职业标识键
 * @param level - 角色等级（1-20）
 * @returns { slots: number; slotLevel: number; recoveryType: string } | null
 */
export function getPactMagicAtLevel(
  classKey: DndClassKey,
  level: number,
): { slots: number; slotLevel: number; recoveryType: PactMagicProgression['recoveryType'] } | null {
  const l = clampLevel(level);
  if (l === null) return null;
  const progression = getClassProgression(classKey);
  if (!progression || !progression.spellcasting) return null;
  const pm = progression.spellcasting.pactMagic;
  if (!pm) return null;
  const slots = pm.pactSlots[l - 1];
  const slotLevel = pm.pactSlotLevel[l - 1];
  if (slots === undefined || slotLevel === undefined) return null;
  return {
    slots,
    slotLevel,
    recoveryType: pm.recoveryType,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. getClassResourcesAtLevel
//    获取职业在某等级已解锁的所有资源
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取职业在指定等级已解锁的所有职业资源定义。
 *
 * 遍历 1 到 level 的所有等级，收集各等级 resources 列表中 unlockLevel <= level 的资源。
 * 以 resource.id 去重（同一资源多级出现时，取最高等级的版本）。
 *
 * @param classKey - 职业标识键
 * @param level - 角色等级（1-20）
 * @returns ClassResourceDefinition[]（未找到职业或等级超出范围时返回 []）
 */
export function getClassResourcesAtLevel(
  classKey: DndClassKey,
  level: number,
): ClassResourceDefinition[] {
  const l = clampLevel(level);
  if (l === null) return [];
  const progression = getClassProgression(classKey);
  if (!progression) return [];

  const seen = new Map<string, ClassResourceDefinition>();

  for (let lv = 1; lv <= l; lv++) {
    const lvData = progression.levels[lv - 1];
    if (!lvData) continue;
    for (const resource of lvData.resources) {
      if (resource.unlockLevel <= l) {
        // 同一资源以最后出现的为准（通常后续等级会覆盖更新版本）
        seen.set(resource.id, resource);
      }
    }
  }

  return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. getActionsAtLevel
//    获取职业在某等级已解锁的所有动作
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取职业在指定等级已解锁的所有动作定义。
 *
 * 遍历 1 到 level 的所有等级，收集 unlockLevel <= level 的动作。
 * 以 action.id 去重。
 *
 * @param classKey - 职业标识键
 * @param level - 角色等级（1-20）
 * @returns ActionDefinition[]
 */
export function getActionsAtLevel(
  classKey: DndClassKey,
  level: number,
): ActionDefinition[] {
  const l = clampLevel(level);
  if (l === null) return [];
  const progression = getClassProgression(classKey);
  if (!progression) return [];

  const seen = new Map<string, ActionDefinition>();

  for (let lv = 1; lv <= l; lv++) {
    const lvData = progression.levels[lv - 1];
    if (!lvData) continue;
    for (const action of lvData.actions) {
      if (action.unlockLevel <= l) {
        seen.set(action.id, action);
      }
    }
  }

  return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. getPassiveFeaturesAtLevel
//    获取职业在某等级已解锁的所有被动特性
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取职业在指定等级已解锁的所有被动特性定义。
 *
 * @param classKey - 职业标识键
 * @param level - 角色等级（1-20）
 * @returns PassiveFeatureDefinition[]
 */
export function getPassiveFeaturesAtLevel(
  classKey: DndClassKey,
  level: number,
): PassiveFeatureDefinition[] {
  const l = clampLevel(level);
  if (l === null) return [];
  const progression = getClassProgression(classKey);
  if (!progression) return [];

  const seen = new Map<string, PassiveFeatureDefinition>();

  for (let lv = 1; lv <= l; lv++) {
    const lvData = progression.levels[lv - 1];
    if (!lvData) continue;
    for (const passive of lvData.passiveFeatures) {
      if (passive.unlockLevel <= l) {
        seen.set(passive.id, passive);
      }
    }
  }

  return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// 补充工具函数（便于后续接入）
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 获取职业在指定等级的标准法术位快照。
 * 对邪术师（pact caster）返回 null，应使用 getPactMagicAtLevel 替代。
 *
 * @param classKey - 职业标识键
 * @param level - 角色等级（1-20）
 * @returns SpellSlotProgression | null
 */
export function getSpellSlotsAtLevel(
  classKey: DndClassKey,
  level: number,
): SpellSlotProgression | null {
  const l = clampLevel(level);
  if (l === null) return null;
  const progression = getClassProgression(classKey);
  if (!progression || !progression.spellcasting) return null;
  // pact caster 不使用 spellSlotTable
  if (progression.spellcasting.casterType === 'pact') return null;
  return progression.spellcasting.spellSlotTable[l - 1] ?? null;
}

/**
 * 获取职业在指定等级的熟练加值。
 * 此函数不依赖任何职业数据，可独立使用。
 *
 * @param level - 角色等级（1-20）
 * @returns number（2-6）；超出范围时返回 2
 */
export function getProficiencyBonus(level: number): number {
  const l = clampLevel(level);
  if (l === null) return 2;
  if (l <= 4) return 2;
  if (l <= 8) return 3;
  if (l <= 12) return 4;
  if (l <= 16) return 5;
  return 6;
}

/**
 * 获取职业命中骰面数。
 * @param classKey - 职业标识键
 * @returns 6 | 8 | 10 | 12 | null（未知职业返回 null）
 */
export function getHitDie(classKey: DndClassKey): 6 | 8 | 10 | 12 | null {
  const progression = getClassProgression(classKey);
  return progression ? progression.hitDie : null;
}

/**
 * 获取职业在指定等级已知戏法数量。
 * @param classKey - 职业标识键
 * @param level - 角色等级（1-20）
 * @returns number | null（非施法职业或无戏法表时返回 null）
 */
export function getCantripsKnownAtLevel(
  classKey: DndClassKey,
  level: number,
): number | null {
  const l = clampLevel(level);
  if (l === null) return null;
  const progression = getClassProgression(classKey);
  if (!progression || !progression.spellcasting) return null;
  return progression.spellcasting.cantripsKnown[l - 1] ?? null;
}

/**
 * 检查职业是否为施法职业（包括半施法者和契约魔法施法者）。
 * @param classKey - 职业标识键
 * @returns boolean | null（未知职业返回 null）
 */
export function isCastingClass(classKey: DndClassKey): boolean | null {
  const progression = getClassProgression(classKey);
  if (!progression) return null;
  return progression.spellcasting !== null &&
    progression.spellcasting.casterType !== 'none' &&
    progression.spellcasting.casterType !== 'featureOnly';
}

/**
 * 获取职业在指定等级解锁的特性名称列表。
 * @param classKey - 职业标识键
 * @param level - 角色等级（1-20）
 * @returns string[]
 */
export function getFeaturesAtLevel(
  classKey: DndClassKey,
  level: number,
): string[] {
  const lvData = getLevelProgression(classKey, level);
  return lvData ? lvData.features : [];
}

/**
 * 获取职业在指定等级的诗人激励骰面（仅吟游诗人）。
 * 通用版本：查找资源定义中的 dice 表。
 *
 * @param classKey - 职业标识键
 * @param resourceId - 资源 ID（如 "bard_bardic_inspiration"）
 * @param level - 角色等级（1-20）
 * @returns string | null（如 "d6", "d8"；找不到时返回 null）
 */
export function getResourceDieAtLevel(
  classKey: DndClassKey,
  resourceId: string,
  level: number,
): string | null {
  const l = clampLevel(level);
  if (l === null) return null;
  const resources = getClassResourcesAtLevel(classKey, level);
  const resource = resources.find(r => r.id === resourceId);
  if (!resource || !resource.dice) return null;
  return resource.dice[l - 1] ?? null;
}

/**
 * 获取某资源在指定等级的最大使用次数（仅处理 'table' 类型）。
 * 若 maxUses 为固定数值，直接返回该值。
 * 若为 'table'，从 maxUsesByLevel 读取。
 * 若为描述型值（'proficiencyBonus', 'level', 'manual', 'unlimited'），返回字符串说明。
 *
 * @param resource - 资源定义
 * @param level - 角色等级（1-20）
 * @returns number | string | null
 */
export function resolveResourceMax(
  resource: ClassResourceDefinition,
  level: number,
): number | string | null {
  const l = clampLevel(level);
  if (l === null) return null;
  if (l < resource.unlockLevel) return 0;

  if (typeof resource.maxUses === 'number') {
    return resource.maxUses;
  }
  if (resource.maxUses === 'table') {
    const val = resource.maxUsesByLevel?.[l - 1];
    return val ?? null;
  }
  // 描述型（运行时由 store 计算）
  return resource.maxUses;
}
