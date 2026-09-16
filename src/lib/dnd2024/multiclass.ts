import type { DndClassLevel } from '../dnd-types.js';

type LegacyClassFallback = {
  className: string;
  classId?: string;
  level: number;
  subclass?: string;
};

export type DndClassLevelTarget = {
  className: string;
  classId?: string;
  subclass?: string;
};

export type DndClassLevelAllocationCheck = {
  allowed: boolean;
  reason?: 'character-level-cap' | 'class-level-cap' | 'missing-class';
};

function positiveLevel(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const level = Math.floor(value);
  return level >= 1 && level <= 20 ? level : null;
}

/**
 * Normalizes persisted class allocations without interpreting DND rules.
 * Duplicate entries are coalesced by class id/name so a save has one row per class.
 */
export function normalizeDndClassLevels(
  value: unknown,
  fallback: LegacyClassFallback,
): DndClassLevel[] {
  const entries = Array.isArray(value) ? value : [];
  const normalized = new Map<string, DndClassLevel>();

  for (const value of entries) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const item = value as Record<string, unknown>;
    const className = typeof item.className === 'string' ? item.className.trim() : '';
    const classId = typeof item.classId === 'string' && item.classId.trim()
      ? item.classId.trim()
      : undefined;
    const level = positiveLevel(item.level);
    if (!className || level === null) continue;
    const key = classId ?? className;
    const existing = normalized.get(key);
    normalized.set(key, {
      className,
      classId,
      level: Math.min(20, (existing?.level ?? 0) + level),
      subclass: typeof item.subclass === 'string' && item.subclass.trim()
        ? item.subclass.trim()
        : existing?.subclass,
    });
  }

  if (normalized.size > 0) return Array.from(normalized.values());

  const className = fallback.className.trim();
  const level = positiveLevel(fallback.level);
  if (!className || level === null) return [];
  return [{
    className,
    classId: fallback.classId,
    level,
    subclass: fallback.subclass?.trim() || undefined,
  }];
}

export function getDndCharacterTotalLevel(classLevels: DndClassLevel[]): number {
  return classLevels.reduce((total, classLevel) => total + classLevel.level, 0);
}

export function getDndClassLevelAllocation(
  classLevels: DndClassLevel[],
  target: Pick<DndClassLevelTarget, 'className' | 'classId'>,
): DndClassLevel | undefined {
  return classLevels.find((classLevel) =>
    (target.classId && classLevel.classId === target.classId) ||
    classLevel.className === target.className,
  );
}

/**
 * Structural guard only. Multiclass prerequisites and combined spell slots are
 * deliberately outside this persistence helper and remain a table/DM check.
 */
export function canAllocateDndClassLevel(
  classLevels: DndClassLevel[],
  target: DndClassLevelTarget,
): DndClassLevelAllocationCheck {
  if (!target.className.trim()) return { allowed: false, reason: 'missing-class' };
  if (getDndCharacterTotalLevel(classLevels) >= 20) {
    return { allowed: false, reason: 'character-level-cap' };
  }
  if ((getDndClassLevelAllocation(classLevels, target)?.level ?? 0) >= 20) {
    return { allowed: false, reason: 'class-level-cap' };
  }
  return { allowed: true };
}

export function incrementDndClassLevel(
  classLevels: DndClassLevel[],
  target: DndClassLevelTarget,
  fallback: LegacyClassFallback,
): DndClassLevel[] {
  const normalized = normalizeDndClassLevels(classLevels, fallback);
  const check = canAllocateDndClassLevel(normalized, target);
  if (!check.allowed) return normalized;

  const targetIndex = normalized.findIndex((classLevel) =>
    (target.classId && classLevel.classId === target.classId) ||
    classLevel.className === target.className,
  );
  if (targetIndex < 0) {
    return [...normalized, {
      className: target.className.trim(),
      classId: target.classId,
      level: 1,
      subclass: target.subclass?.trim() || undefined,
    }];
  }
  return normalized.map((classLevel, index) => index === targetIndex
    ? {
      ...classLevel,
      level: Math.min(20, classLevel.level + 1),
      subclass: target.subclass?.trim() || classLevel.subclass,
    }
    : classLevel);
}

/** Increments only the legacy primary class, preserving any future secondary rows. */
export function incrementPrimaryDndClassLevel(
  classLevels: DndClassLevel[],
  primary: LegacyClassFallback,
): DndClassLevel[] {
  return incrementDndClassLevel(classLevels, primary, primary);
}
