/**
 * cocMigration.ts
 *
 * Safe schema migration for COC CocCharacter persisted in localStorage.
 *
 * Contract
 * ─────────
 * • migrateCocCharacter(data: unknown): CocCharacter
 *   – Accepts anything that came out of JSON.parse / Zustand rehydration.
 *   – Returns a fully-typed CocCharacter with every field present.
 *   – Never deletes existing user data.
 *   – Fills only truly missing or wrong-typed fields with safe defaults.
 *   – Version-gates each migration step so future changes are additive.
 *
 * Adding a new version
 * ────────────────────
 *   1. Bump CURRENT_COC_CHARACTER_SCHEMA_VERSION in coc-types.ts.
 *   2. Add a `case N:` block inside the `while` loop below.
 *   3. Document the change in the changelog comment.
 *
 * Changelog
 * ─────────
 *   v0 → v1  Initial versioning; no field changes — this migration only adds
 *             `schemaVersion: 1` to pre-existing saves.
 *   v1 → v2  Adds optional runtime state for HP/MP/SAN/Luck pools, status flags,
 *             skill growth marks, and pushed roll context.
 *
 * Reserved future versions (do NOT implement yet — placeholders only)
 * ─────────────────────────────────────────────────────────────────────
 *   v3  sanityState?: SanityState           — runtime insanity tracking
 *   v4  woundState?: WoundState             — major wound / unconscious
 *   v4  temporaryInsanityState?: ...        — temporary insanity
 *   v5  indefiniteInsanityState?: ...       — indefinite insanity
 *   v6  skillGrowthMarks: string[]          — skills checked this session
 *   v7  pushedRollState?: PushedRollState   — pending push state
 *   v8  bonusPenaltyDice: number            — current bonus/penalty count
 *   v9  caseLog: string[]                   — investigator case notes
 *   v10 clueLog: string[]                   — collected clues
 */

import {
  CocCharacter,
  CocRuntimeState,
  CocSkill,
  CocWeapon,
  CocCharacteristic,
  COC_BASE_SKILLS,
  CURRENT_COC_CHARACTER_SCHEMA_VERSION,
} from './coc-types';

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

function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

// ─── Field-level coercions ────────────────────────────────────────────────────

const CHARACTERISTIC_KEYS: CocCharacteristic[] = [
  'STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU', 'LUK',
];

/**
 * Coerce raw characteristics object.
 * Every key must be a finite number; missing keys default to 0.
 */
function migrateCharacteristics(
  raw: unknown,
): Record<CocCharacteristic, number> {
  const r = obj(raw);
  const result = {} as Record<CocCharacteristic, number>;
  for (const key of CHARACTERISTIC_KEYS) {
    result[key] = num(r[key], 0);
  }
  return result;
}

/**
 * Coerce a { current, max } pool object.
 * Both fields must be finite numbers; missing fields default to 0.
 */
function migratePool(
  raw: unknown,
): { current: number; max: number } {
  const r = obj(raw);
  return {
    current: num(r.current, 0),
    max:     num(r.max,     0),
  };
}

/**
 * Coerce sanity — { current, start, max }.
 * max defaults to 99 (standard COC 7E cap).
 */
function migrateSanity(
  raw: unknown,
): { current: number; start: number; max: number } {
  const r = obj(raw);
  return {
    current: num(r.current, 0),
    start:   num(r.start,   0),
    max:     num(r.max,     99),
  };
}

/**
 * Coerce luck — { current, start }.
 */
function migrateLuck(
  raw: unknown,
): { current: number; start: number } {
  const r = obj(raw);
  return {
    current: num(r.current, 0),
    start:   num(r.start,   0),
  };
}

/**
 * Coerce a single CocSkill.
 * Unknown or malformed entries are replaced with a safe default skill object.
 */
function migrateSkill(raw: unknown): CocSkill | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.name !== 'string' || s.name.trim() === '') return null;
  return {
    name:           s.name.trim(),
    baseValue:      num(s.baseValue,  0),
    value:          num(s.value,      0),
    isOccupational: typeof s.isOccupational === 'boolean' ? s.isOccupational : false,
    isPersonal:     typeof s.isPersonal     === 'boolean' ? s.isPersonal     : false,
    canImprove:     typeof s.canImprove     === 'boolean' ? s.canImprove     : false,
  };
}

/**
 * Coerce skills array.
 *
 * Rules:
 * - If raw is a valid array, migrate each element and drop nulls.
 * - If after filtering the array is empty (or raw was not an array),
 *   substitute the full default skills list from COC_BASE_SKILLS.
 */
function migrateSkills(raw: unknown): CocSkill[] {
  if (!Array.isArray(raw)) {
    return defaultSkills();
  }
  const migrated = raw
    .map(migrateSkill)
    .filter((s): s is CocSkill => s !== null);
  return migrated.length > 0 ? migrated : defaultSkills();
}

function defaultSkills(): CocSkill[] {
  return COC_BASE_SKILLS.map(s => ({
    name:           s.name,
    baseValue:      s.base,
    value:          s.base,
    isOccupational: false,
    isPersonal:     false,
    canImprove:     false,
  }));
}

/**
 * Coerce a single CocWeapon.
 * Returns null for fundamentally malformed entries.
 */
function migrateWeapon(raw: unknown): CocWeapon | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const w = raw as Record<string, unknown>;
  return {
    name:        str(w.name,        ''),
    skill:       str(w.skill,       ''),
    damage:      str(w.damage,      ''),
    range:       str(w.range,       ''),
    attacks:     num(w.attacks,     1),
    ammo:        num(w.ammo,        0),
    malfunction: num(w.malfunction, 100),
  };
}

function migrateWeapons(raw: unknown): CocWeapon[] {
  return arr<unknown>(raw)
    .map(migrateWeapon)
    .filter((w): w is CocWeapon => w !== null);
}

/**
 * Coerce backstory — ten free-text string fields.
 * Missing or non-string fields default to ''.
 */
function migrateBackstory(raw: unknown): CocCharacter['backstory'] {
  const r = obj(raw);
  return {
    personalDescription:  str(r.personalDescription,  ''),
    ideologyBeliefs:      str(r.ideologyBeliefs,      ''),
    significantPeople:    str(r.significantPeople,    ''),
    meaningfulLocations:  str(r.meaningfulLocations,  ''),
    treasuredPossessions: str(r.treasuredPossessions, ''),
    traits:               str(r.traits,               ''),
    injuriesScars:        str(r.injuriesScars,        ''),
    phobiasManias:        str(r.phobiasManias,        ''),
    arcaneTomesSpells:    str(r.arcaneTomesSpells,    ''),
    encounters:           str(r.encounters,           ''),
  };
}

/**
 * Coerce finances — three free-text string fields.
 */
function migrateFinances(raw: unknown): CocCharacter['finances'] {
  const r = obj(raw);
  return {
    spendingLevel: str(r.spendingLevel, ''),
    cash:          str(r.cash,          ''),
    assets:        str(r.assets,        ''),
  };
}

function findSkillValue(skills: CocSkill[], includes: string): number {
  const found = skills.find(skill => skill.name.includes(includes));
  return found ? found.value : 0;
}

function getRuntimeFallback(character: Pick<CocCharacter, 'characteristics' | 'hp' | 'mp' | 'sanity' | 'luck' | 'skills'>): CocRuntimeState {
  const derivedHp = Math.floor((character.characteristics.CON + character.characteristics.SIZ) / 10);
  const derivedMp = Math.floor(character.characteristics.POW / 5);
  const initialSan = character.sanity.start || character.characteristics.POW;
  const mythos = findSkillValue(character.skills, '克苏鲁神话');

  return {
    hp: {
      current: character.hp.current || character.hp.max || derivedHp,
      max: character.hp.max || derivedHp,
    },
    mp: {
      current: character.mp.current || character.mp.max || derivedMp,
      max: character.mp.max || derivedMp,
    },
    san: {
      current: character.sanity.current || initialSan,
      max: character.sanity.max || Math.max(0, 99 - mythos),
      initial: initialSan,
    },
    luck: {
      current: character.luck.current || character.luck.start || character.characteristics.LUK,
    },
    flags: {
      isMajorWound: false,
      isDying: false,
      isUnconscious: false,
      isTemporarilyInsane: false,
      isIndefinitelyInsane: false,
    },
    skillGrowthMarks: {},
    pushedRollContext: undefined,
  };
}

function migrateRuntime(raw: unknown, fallback: CocRuntimeState): CocRuntimeState {
  const r = obj(raw);
  const hp = obj(r.hp);
  const mp = obj(r.mp);
  const san = obj(r.san);
  const luck = obj(r.luck);
  const flags = obj(r.flags);
  const marks = obj(r.skillGrowthMarks);
  const pushed = obj(r.pushedRollContext);
  const pushedSkillKey = pushed.skillKey;
  const pushedSkillName = pushed.skillName;
  const pushedPreviousRoll = pushed.previousRoll;
  const hasPushedContext =
    typeof pushedSkillKey === 'string' &&
    typeof pushedSkillName === 'string' &&
    typeof pushedPreviousRoll === 'number';

  return {
    hp: {
      current: num(hp.current, fallback.hp.current),
      max: num(hp.max, fallback.hp.max),
    },
    mp: {
      current: num(mp.current, fallback.mp.current),
      max: num(mp.max, fallback.mp.max),
    },
    san: {
      current: num(san.current, fallback.san.current),
      max: num(san.max, fallback.san.max),
      initial: num(san.initial, fallback.san.initial),
    },
    luck: {
      current: num(luck.current, fallback.luck.current),
    },
    flags: {
      isMajorWound: bool(flags.isMajorWound, fallback.flags.isMajorWound),
      isDying: bool(flags.isDying, fallback.flags.isDying),
      isUnconscious: bool(flags.isUnconscious, fallback.flags.isUnconscious),
      isTemporarilyInsane: bool(flags.isTemporarilyInsane, fallback.flags.isTemporarilyInsane),
      isIndefinitelyInsane: bool(flags.isIndefinitelyInsane, fallback.flags.isIndefinitelyInsane),
    },
    skillGrowthMarks: Object.fromEntries(
      Object.entries(marks).map(([key, value]) => [key, Boolean(value)]),
    ),
    pushedRollContext: hasPushedContext
      ? {
          skillKey: pushedSkillKey,
          skillName: pushedSkillName,
          previousRoll: pushedPreviousRoll,
        }
      : undefined,
  };
}

// ─── Main migration entry point ───────────────────────────────────────────────

export function migrateCocCharacter(data: unknown): CocCharacter {
  const d = obj(data);

  // Detect schema version; absent = 0 (pre-versioning save)
  let version = num(d.schemaVersion, 0);

  // Reconstruct every field with safe defaults NOW, before version steps.
  // Version steps below only need to handle additive changes.
  const migrated: CocCharacter = {
    schemaVersion: version,

    // ── Identity ──────────────────────────────────────────────────────────
    id:          str(d.id, crypto.randomUUID?.() || Date.now().toString()),
    name:        str(d.name,        ''),
    player:      str(d.player,      ''),
    occupation:  str(d.occupation,  ''),
    age:         num(d.age,         20),
    sex:         str(d.sex,         ''),
    residence:   str(d.residence,   ''),
    birthplace:  str(d.birthplace,  ''),

    // ── Core stats ────────────────────────────────────────────────────────
    characteristics: migrateCharacteristics(d.characteristics),
    hp:     migratePool(d.hp),
    mp:     migratePool(d.mp),
    sanity: migrateSanity(d.sanity),
    luck:   migrateLuck(d.luck),

    // ── Skills & weapons ──────────────────────────────────────────────────
    skills:  migrateSkills(d.skills),
    weapons: migrateWeapons(d.weapons),

    // ── Miscellaneous ─────────────────────────────────────────────────────
    inventory: arr<string>(d.inventory),
    backstory: migrateBackstory(d.backstory),
    finances:  migrateFinances(d.finances),
  };

  migrated.runtime = migrateRuntime(d.runtime, getRuntimeFallback(migrated));

  // ─── Version-gated migration steps ────────────────────────────────────────
  // Each case upgrades the object from version N to N+1.
  while (version < CURRENT_COC_CHARACTER_SCHEMA_VERSION) {
    switch (version) {
      case 0:
        // v0 → v1: No field changes. We just stamp the version.
        // Pre-versioning saves are fully covered by the safe-default
        // reconstruction above.
        version = 1;
        migrated.schemaVersion = 1;
        break;

      case 1:
        // v1 → v2: Runtime was reconstructed above. Existing runtime current
        // values are preserved by migrateRuntime().
        version = 2;
        migrated.schemaVersion = 2;
        break;

      // ── Future migration steps ──────────────────────────────────────────
      // case 2:
      //   // v2 → v3: Add sanityState with default undefined.
      //   // (migrated as sanityState is already undefined from base construction)
      //   version = 3;
      //   migrated.schemaVersion = 3;
      //   break;

      default:
        // Unknown version — skip to current to avoid infinite loop
        version = CURRENT_COC_CHARACTER_SCHEMA_VERSION;
        migrated.schemaVersion = CURRENT_COC_CHARACTER_SCHEMA_VERSION;
        break;
    }
  }

  return migrated;
}
