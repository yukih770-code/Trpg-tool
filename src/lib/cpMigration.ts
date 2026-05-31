/**
 * cpMigration.ts
 *
 * Safe schema migration for Cyberpunk RED CpCharacter persisted in localStorage.
 *
 * Contract
 * ─────────
 * • migrateCpCharacter(data: unknown): CpCharacter
 *   – Accepts anything that came out of JSON.parse / Zustand rehydration.
 *   – Returns a fully-typed CpCharacter with every field present.
 *   – Never deletes existing user data.
 *   – Fills only truly missing or wrong-typed fields with safe defaults.
 *   – Version-gates each migration step so future changes are additive.
 *
 * Adding a new version
 * ────────────────────
 *   1. Bump CURRENT_CP_CHARACTER_SCHEMA_VERSION in cp-types.ts.
 *   2. Add a `case N:` block inside the `while` loop below.
 *   3. Document the change in the changelog comment.
 *
 * Changelog
 * ─────────
 *   v0 → v1  Initial versioning; no field changes — this migration only adds
 *             `schemaVersion: 1` to pre-existing saves.
 *   v1 → v2  Adds `runtime` state for HP, Humanity, EMP, armor SP shell,
 *             wound flags, and critical injuries.
 *
 * Reserved future versions (do NOT implement yet — placeholders only)
 * ─────────────────────────────────────────────────────────────────────
 *   v3  weaponState?: WeaponRuntimeState[]
 *         Per-weapon ammo tracking (currentAmmo, magazineCapacity).
 *
 *   v4  humanityState?: HumanityRuntimeState
 *         Cyberpsychosis staging beyond the binary cyberPsycho flag.
 *
 *   v5  roleAbilityState?: RoleAbilityState
 *         Per-role runtime resource pool (Solo bonusPool, Netrunner netActions,
 *         Exec teamMembers, Nomad vehicleCount, Lawman backupStatus, etc.).
 *         Replaces the current useState-only approach in CpGameplay.tsx.
 *
 *   v6  netrunningState?: NetrunningState
 *         Active NET session: currentNode, loadedPrograms[], RAM used/total,
 *         cyberDeckSlots, active ICE encounters.
 *
 *   v7  vehicleState?: VehicleState[]
 *         Structured vehicle records (HP, SP, speed, passengers).
 *         Replaces the current inventory.gear string approach.
 *
 *   v8  deathSaveState?: DeathSaveState
 *         Consecutive death save counter, accumulated failure penalty.
 *
 *   v9  seriouslyWoundedState?: SeriouslyWoundedState
 *         Active wound modifiers, bleed-out ticks, active critical injuries.
 */

import {
  CpCharacter,
  CpStat,
  CpRole,
  CpArmor,
  CpCyberware,
  CpWeapon,
  CpClothing,
  CpInventory,
  CpLifePath,
  CpRelation,
  CpEnemy,
  CpRuntimeState,
  CP_ROLES,
  CP_STAT_ORDER,
  CP_SKILLS,
  makeEmptyInventory,
  CURRENT_CP_CHARACTER_SCHEMA_VERSION,
} from './cp-types';
import {
  buildInitialCpRuntime,
  refreshCpRuntimeDerived,
} from './cp2024/cp-utils';

// ─── Primitive helpers ────────────────────────────────────────────────────────

/** Return v if it is a non-null plain object, otherwise {}. */
function obj(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/** Return v if it is a finite number, otherwise fallback. */
function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback;
}

/** Return v if it is a string, otherwise fallback. */
function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

/** Return v if it is a non-null array, otherwise []. */
function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ─── Default stat block ───────────────────────────────────────────────────────

const DEFAULT_STATS: Record<CpStat, number> = {
  INT: 5, REF: 5, DEX: 5, TECH: 5, COOL: 5,
  WILL: 5, MOVE: 5, BODY: 5, EMP: 5, LUCK: 5,
};

// ─── Inline derived-value formula ────────────────────────────────────────────
// Mirrors computeCpDerived() in cpStore.ts without importing from that file
// (to avoid a circular dependency: cpStore → cpMigration → cpStore).

function computeDerivedFromStats(stats: Record<CpStat, number>) {
  const maxHp = 10 + Math.ceil((stats.BODY + stats.WILL) / 2) * 5;
  return {
    maxHp,
    seriouslyWounded: Math.ceil(maxHp / 2),
    deathSave:        stats.BODY,
    maxHumanity:      stats.EMP * 10,
  };
}

// ─── Field-level coercions ────────────────────────────────────────────────────

/**
 * Coerce stats block — every key must be a clamped finite integer [1, 10].
 * Missing keys are filled from DEFAULT_STATS.
 */
function migrateStats(raw: unknown): Record<CpStat, number> {
  const r = obj(raw);
  const result = { ...DEFAULT_STATS };
  for (const stat of CP_STAT_ORDER) {
    const v = num(r[stat], DEFAULT_STATS[stat]);
    result[stat] = Math.max(1, Math.min(10, Math.round(v)));
  }
  return result;
}

/**
 * Coerce role — returns 'Solo' for any unrecognised or missing value.
 */
function migrateRole(raw: unknown): CpRole {
  if (typeof raw === 'string' && CP_ROLES.includes(raw as CpRole)) {
    return raw as CpRole;
  }
  return 'Solo';
}

/**
 * Coerce skills map.
 *
 * Rules:
 * - If raw is a plain object, preserve all entries whose values are finite
 *   numbers; fill in any missing base skills from CP_SKILLS defaults.
 * - If raw is absent / wrong type, return the full CP_SKILLS default map.
 * - Custom skills (keys not in CP_SKILLS) are preserved as-is.
 */
function migrateSkills(raw: unknown): Record<string, number> {
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    const result: Record<string, number> = {};

    // Preserve all existing valid entries (including custom skills)
    for (const [key, value] of Object.entries(r)) {
      if (typeof value === 'number' && isFinite(value)) {
        result[key] = Math.max(0, value);
      }
    }

    // Back-fill any missing CP_SKILLS entries with their base level
    for (const s of CP_SKILLS) {
      if (!(s.name in result)) {
        result[s.name] = s.baseLevel;
      }
    }

    return result;
  }

  // Fallback: full default skill map
  const defaults: Record<string, number> = {};
  for (const s of CP_SKILLS) {
    defaults[s.name] = s.baseLevel;
  }
  return defaults;
}

/**
 * Coerce a { current, max } pool.  Both fields default to 0.
 */
function migratePool(
  raw: unknown,
  defaultCurrent: number,
  defaultMax: number,
): { current: number; max: number } {
  const r = obj(raw);
  const max     = num(r.max,     defaultMax);
  const current = num(r.current, defaultCurrent);
  return { current, max };
}

/**
 * Coerce a CpArmor or null.
 * Returns null for absent, null, or structurally invalid values.
 */
function migrateArmorSlot(raw: unknown): CpArmor | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const a = raw as Record<string, unknown>;
  if (typeof a.name !== 'string' || a.name.trim() === '') return null;
  const location: 'body' | 'head' =
    (a.location === 'body' || a.location === 'head') ? a.location : 'body';
  return {
    name:       a.name.trim(),
    sp:         num(a.sp,         0),
    location,
    refPenalty: num(a.refPenalty, 0),
    cost:       num(a.cost,       0),
  };
}

/**
 * Coerce a single CpCyberware entry.  Returns null for invalid entries.
 */
function migrateCyberwareItem(raw: unknown): CpCyberware | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.name !== 'string' || c.name.trim() === '') return null;
  return {
    name:          c.name.trim(),
    humanityCost:  num(c.humanityCost,  0),
    cost:          num(c.cost,          0),
    description:   str(c.description,  ''),
  };
}

/**
 * Coerce a single CpWeapon entry.  Returns null for invalid entries.
 */
function migrateWeaponItem(raw: unknown): CpWeapon | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const w = raw as Record<string, unknown>;
  if (typeof w.name !== 'string' || w.name.trim() === '') return null;
  return {
    name:   w.name.trim(),
    damage: str(w.damage, '1d6'),
    skill:  str(w.skill,  ''),
    rof:    num(w.rof,    1),
    cost:   num(w.cost,   0),
  };
}

/**
 * Coerce a single CpClothing entry.  Returns null for invalid entries.
 */
function migrateClothingItem(raw: unknown): CpClothing | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.name !== 'string' || c.name.trim() === '') return null;
  return {
    name:        c.name.trim(),
    style:       str(c.style,       ''),
    cost:        num(c.cost,        0),
    description: str(c.description, ''),
  };
}

/**
 * Coerce a CpInventory.
 * Every sub-array is individually validated; unknown structures fall back to
 * makeEmptyInventory().
 */
function migrateInventory(raw: unknown): CpInventory {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return makeEmptyInventory();
  }
  const inv = raw as Record<string, unknown>;
  return {
    cyberware: arr<unknown>(inv.cyberware)
      .map(migrateCyberwareItem)
      .filter((c): c is CpCyberware => c !== null),
    weapons:   arr<unknown>(inv.weapons)
      .map(migrateWeaponItem)
      .filter((w): w is CpWeapon => w !== null),
    armor:     arr<unknown>(inv.armor)
      .map(migrateArmorSlot)
      .filter((a): a is CpArmor => a !== null),
    fashion:   arr<unknown>(inv.fashion)
      .map(migrateClothingItem)
      .filter((c): c is CpClothing => c !== null),
    gear:      arr<unknown>(inv.gear)
      .filter((g): g is string => typeof g === 'string'),
  };
}

/**
 * Default life-path object (mirrors makeDefaultChar in cpStore.ts).
 */
function defaultLifePath(): CpLifePath {
  return {
    handle: '', hometown: '', livingStandard: '货运集装箱', monthlySpending: 1100,
    clothingStyle: '', hairstyle: '', affectation: '',
    motivation: '', personality: '', originsFamily: '',
    childhoodEnv: '', childhoodHero: '',
    lifeEvent1: '', lifeEvent2: '', careerPath: '',
  };
}

/**
 * Coerce a CpLifePath.
 * An absent or structurally invalid value returns a fully-populated default.
 */
function migrateLifePath(raw: unknown): CpLifePath {
  if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) {
    return defaultLifePath();
  }
  const lp = raw as Record<string, unknown>;
  return {
    handle:          str(lp.handle,          ''),
    hometown:        str(lp.hometown,        ''),
    livingStandard:  str(lp.livingStandard,  '货运集装箱'),
    monthlySpending: num(lp.monthlySpending, 1100),
    clothingStyle:   str(lp.clothingStyle,   ''),
    hairstyle:       str(lp.hairstyle,       ''),
    affectation:     str(lp.affectation,     ''),
    motivation:      str(lp.motivation,      ''),
    personality:     str(lp.personality,     ''),
    originsFamily:   str(lp.originsFamily,   ''),
    childhoodEnv:    str(lp.childhoodEnv,    ''),
    childhoodHero:   str(lp.childhoodHero,   ''),
    lifeEvent1:      str(lp.lifeEvent1,      ''),
    lifeEvent2:      str(lp.lifeEvent2,      ''),
    careerPath:      str(lp.careerPath,      ''),
  };
}

/**
 * Coerce a single CpRelation.  Returns null for invalid entries.
 */
function migrateRelationItem(raw: unknown): CpRelation | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  return {
    name:         str(r.name,         ''),
    description:  str(r.description,  ''),
    myFeeling:    str(r.myFeeling,    ''),
    theirFeeling: str(r.theirFeeling, ''),
  };
}

/**
 * Coerce a single CpEnemy.  Returns null for invalid entries.
 */
function migrateEnemyItem(raw: unknown): CpEnemy | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const e = raw as Record<string, unknown>;
  return {
    name:          str(e.name,          ''),
    cause:         str(e.cause,         ''),
    myFeelings:    str(e.myFeelings,    ''),
    theirFeelings: str(e.theirFeelings, ''),
    resource:      str(e.resource,      ''),
    plan:          str(e.plan,          ''),
  };
}

function migrateRuntime(raw: unknown, character: CpCharacter): CpRuntimeState {
  const fallback = buildInitialCpRuntime(character);
  const r = obj(raw);
  if (Object.keys(r).length === 0) return fallback;

  const hp = obj(r.hp);
  const humanity = obj(r.humanity);
  const emp = obj(r.emp);
  const flags = obj(r.flags);
  const armor = obj(r.armor);
  const head = obj(armor.head);
  const body = obj(armor.body);

  const runtime: CpRuntimeState = {
    hp: {
      current: num(hp.current, fallback.hp.current),
      max: num(hp.max, fallback.hp.max),
    },
    humanity: {
      current: num(humanity.current, fallback.humanity.current),
      max: num(humanity.max, fallback.humanity.max),
    },
    emp: {
      current: num(emp.current, fallback.emp.current),
      max: num(emp.max, fallback.emp.max),
    },
    armor: {
      head: Object.keys(head).length > 0
        ? {
            currentSp: num(head.currentSp, fallback.armor?.head?.currentSp ?? 0),
            maxSp: num(head.maxSp, fallback.armor?.head?.maxSp ?? 0),
          }
        : fallback.armor?.head,
      body: Object.keys(body).length > 0
        ? {
            currentSp: num(body.currentSp, fallback.armor?.body?.currentSp ?? 0),
            maxSp: num(body.maxSp, fallback.armor?.body?.maxSp ?? 0),
          }
        : fallback.armor?.body,
    },
    flags: {
      isSeriouslyWounded: typeof flags.isSeriouslyWounded === 'boolean'
        ? flags.isSeriouslyWounded
        : fallback.flags.isSeriouslyWounded,
      isMortallyWounded: typeof flags.isMortallyWounded === 'boolean'
        ? flags.isMortallyWounded
        : fallback.flags.isMortallyWounded,
    },
    criticalInjuries: arr<unknown>(r.criticalInjuries).filter((i): i is string => typeof i === 'string'),
  };

  if (!runtime.armor?.head && !runtime.armor?.body) {
    runtime.armor = undefined;
  }
  if (runtime.criticalInjuries.length === 0) {
    runtime.criticalInjuries = fallback.criticalInjuries;
  }

  return refreshCpRuntimeDerived(runtime, character);
}

// ─── Main migration entry point ───────────────────────────────────────────────

export function migrateCpCharacter(data: unknown): CpCharacter {
  const d = obj(data);

  // Detect schema version; absent = 0 (pre-versioning save)
  let version = num(d.schemaVersion, 0);

  // ── Derive base values first so dependent fields can reference them ─────────
  const stats   = migrateStats(d.stats);
  const derived = computeDerivedFromStats(stats);

  // maxHp / seriouslyWounded / deathSave / maxHumanity:
  // Prefer stored values if valid (they may reflect manual overrides); fall
  // back to formula-derived values if absent.
  const maxHp           = num(d.maxHp,           derived.maxHp);
  const seriouslyWounded= num(d.seriouslyWounded, derived.seriouslyWounded);
  const deathSave       = num(d.deathSave,        derived.deathSave);
  const maxHumanity     = num(d.maxHumanity,      derived.maxHumanity);

  // hp pool: use stored max/current if valid, otherwise fall back to derived
  const hp       = migratePool(d.hp,       maxHp,      maxHp);
  // humanity pool
  const humanity = migratePool(d.humanity, maxHumanity, maxHumanity);

  // ── Reconstruct every field with safe defaults ───────────────────────────
  const migrated: CpCharacter = {
    schemaVersion: version,

    // ── Identity ──────────────────────────────────────────────────────────
    id:     str(d.id,     crypto.randomUUID?.() || Date.now().toString()),
    name:   str(d.name,   ''),
    player: str(d.player, ''),
    role:   migrateRole(d.role),
    age:    num(d.age,    20),
    gender: str(d.gender, ''),

    // ── Stats (10 attributes) ─────────────────────────────────────────────
    stats,

    // ── Derived values (stored for display, re-computed on stat changes) ──
    maxHp,
    seriouslyWounded,
    deathSave,
    maxHumanity,

    // ── Current tracked pools ─────────────────────────────────────────────
    hp,
    humanity,

    // ── Skills ────────────────────────────────────────────────────────────
    skills: migrateSkills(d.skills),

    // ── Equipped armor (null = bare) ──────────────────────────────────────
    armorBody: migrateArmorSlot(d.armorBody),
    armorHead: migrateArmorSlot(d.armorHead),

    // ── Installed cyberware ───────────────────────────────────────────────
    cyberware: arr<unknown>(d.cyberware)
      .map(migrateCyberwareItem)
      .filter((c): c is CpCyberware => c !== null),

    // ── Carried weapons ───────────────────────────────────────────────────
    weapons: arr<unknown>(d.weapons)
      .map(migrateWeaponItem)
      .filter((w): w is CpWeapon => w !== null),

    // ── Economy ───────────────────────────────────────────────────────────
    eb:        num(d.eb,        2550),
    fashionEb: num(d.fashionEb, 800),

    // ── Role ability ──────────────────────────────────────────────────────
    roleLevel: num(d.roleLevel, 4),

    // ── Living situation ──────────────────────────────────────────────────
    housing: str(d.housing, '货运集装箱（第一个月免费，后续月租 1100 eb）'),
    notes:   str(d.notes,   ''),

    // ── Worn clothing ─────────────────────────────────────────────────────
    clothing: arr<unknown>(d.clothing)
      .map(migrateClothingItem)
      .filter((c): c is CpClothing => c !== null),

    // ── Status flags / injury log ─────────────────────────────────────────
    injuries: arr<unknown>(d.injuries)
      .filter((i): i is string => typeof i === 'string'),

    // cyberPsycho: preserve stored flag if boolean; re-derive from humanity
    // as a safe fallback so it stays consistent with the pool value.
    cyberPsycho: typeof d.cyberPsycho === 'boolean'
      ? d.cyberPsycho
      : humanity.current <= 0,

    // ── Inventory (owned but not equipped/installed) ───────────────────────
    inventory: migrateInventory(d.inventory),

    // ── Life path ─────────────────────────────────────────────────────────
    // lifePath is typed as optional in CpCharacter but always populated here
    // so consumers never receive undefined for a field they expect to exist.
    lifePath: migrateLifePath(d.lifePath),

    // ── Relationships ─────────────────────────────────────────────────────
    friends: arr<unknown>(d.friends)
      .map(migrateRelationItem)
      .filter((r): r is CpRelation => r !== null),
    romances: arr<unknown>(d.romances)
      .map(migrateRelationItem)
      .filter((r): r is CpRelation => r !== null),
    enemies: arr<unknown>(d.enemies)
      .map(migrateEnemyItem)
      .filter((e): e is CpEnemy => e !== null),

    runtime: undefined,

    // ── Future runtime-state fields (reserved — not yet implemented) ───────
    // weaponState?: WeaponRuntimeState[];
    //   Per-weapon ammo / durability. Future step.
    //
    // humanityState?: HumanityRuntimeState;
    //   Cyberpsychosis staging beyond the binary flag. Future step.
    //
    // roleAbilityState?: RoleAbilityState;
    //   Solo combat pool, Netrunner NET actions, Exec team, etc. Future step.
    //
    // netrunningState?: NetrunningState;
    //   Active NET session data (nodes, RAM, programs, ICE). Future step.
    //
    // vehicleState?: VehicleState[];
    //   Structured vehicle records replacing inventory.gear strings. Future step.
    //
    // deathSaveState?: DeathSaveState;
    //   Consecutive failure counter and accumulated penalty. Future step.
    //
    // seriouslyWoundedState?: SeriouslyWoundedState;
    //   Active wound modifier slots, bleed-out ticks. Future step.
  };

  // ─── Version-gated migration steps ────────────────────────────────────────
  // Each case upgrades the object from version N to N+1.
  while (version < CURRENT_CP_CHARACTER_SCHEMA_VERSION) {
    switch (version) {
      case 0:
        // v0 → v1: No field changes. We just stamp the version.
        // Pre-versioning saves are fully covered by the safe-default
        // reconstruction above.
        version = 1;
        migrated.schemaVersion = 1;
        break;

      case 1:
        // v1 → v2: Add runtime state. Existing runtime current values are
        // preserved by migrateRuntime(); missing runtime is derived from the
        // legacy HP/Humanity/armor/injuries fields.
        migrated.runtime = migrateRuntime(d.runtime, migrated);
        version = 2;
        migrated.schemaVersion = 2;
        break;

      default:
        // Unknown version — skip to current to avoid infinite loop
        version = CURRENT_CP_CHARACTER_SCHEMA_VERSION;
        migrated.schemaVersion = CURRENT_CP_CHARACTER_SCHEMA_VERSION;
        break;
    }
  }

  migrated.runtime = migrateRuntime(d.runtime ?? migrated.runtime, migrated);

  return migrated;
}
