/**
 * characterMigration.ts
 *
 * Safe schema migration for DND CharacterData persisted in localStorage.
 *
 * Contract
 * ─────────
 * • migrateCharacter(data: unknown): CharacterData
 *   – Accepts anything that came out of JSON.parse / Zustand rehydration.
 *   – Returns a fully-typed CharacterData with every field present.
 *   – Never deletes existing user data.
 *   – Fills only truly missing or wrong-typed fields with safe defaults.
 *   – Version-gates each migration step so future changes are additive.
 *
 * Adding a new version
 * ────────────────────
 *   1. Bump CURRENT_DND_CHARACTER_SCHEMA_VERSION in dnd-types.ts.
 *   2. Add a `case N:` block inside the `while` loop below.
 *   3. Document the change in the changelog comment.
 *
 * Changelog
 * ─────────
 *   v0 → v1  Initial versioning; no field changes — this migration only adds
 *             `schemaVersion: 1` to pre-existing saves.
 *   v1 → v2  Added classResources: ResourceState[] (default []) and
 *             pactMagicState?: PactMagicState (default undefined).
 *             Existing classResources arrays are preserved if valid.
 *             Existing pactMagicState objects are preserved if structurally
 *             sound (has numeric current / max / slotLevel fields).
 *   v2 → v3  Added personalContentReferences: DndPersonalContentReference[]
 *             (default []). Only compact pack/version provenance is kept.
 *   v3 → v4  Added classLevels: DndClassLevel[]. Existing single-class saves
 *             become one allocation using jobClass/subclass/current level.
 */

import {
  CharacterData,
  CharacterAttributes,
  AttributeName,
  SkillName,
  SpellInfo,
  CustomMod,
  ResourceState,
  PactMagicState,
  DndPersonalContentReference,
  CURRENT_DND_CHARACTER_SCHEMA_VERSION,
} from './dnd-types';
import { normalizeDndClassLevels } from './dnd2024/multiclass';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return v if it is a non-null object, otherwise {}. */
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

/** Return v if it is a boolean, otherwise fallback. */
function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** Return v if it is a non-null array, otherwise []. */
function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ─── v2 resource helpers ──────────────────────────────────────────────────────

/**
 * Coerce an unknown value into ResourceState[].
 *
 * Rules:
 * - If it is already a non-null array, keep it as-is (each element is trusted
 *   to be a ResourceState — the shape is structurally compatible; we do not
 *   deep-validate every element to avoid over-engineering this migration step).
 * - Otherwise return [].
 */
function migrateClassResources(v: unknown): ResourceState[] {
  return Array.isArray(v) ? (v as ResourceState[]) : [];
}

/**
 * Coerce an unknown value into PactMagicState | undefined.
 *
 * "Structurally sound" means the value is a non-null object that has
 * finite-number `current`, `max`, and `slotLevel` fields.  We do not require
 * `recoveryType` to be present — it will be defaulted to "shortRest" if
 * absent so that very old hand-crafted saves are handled gracefully.
 *
 * Any value that does not meet this bar is returned as undefined.
 */
function migratePactMagicState(v: unknown): PactMagicState | undefined {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const p = v as Record<string, unknown>;
  if (
    typeof p.current !== 'number' || !isFinite(p.current) ||
    typeof p.max     !== 'number' || !isFinite(p.max)     ||
    typeof p.slotLevel !== 'number' || !isFinite(p.slotLevel)
  ) {
    return undefined;
  }
  return {
    current:      p.current,
    max:          p.max,
    slotLevel:    p.slotLevel,
    recoveryType: typeof p.recoveryType === 'string' ? p.recoveryType : 'shortRest',
    notes:        typeof p.notes === 'string' ? p.notes : undefined,
  };
}

function migratePersonalContentReferences(v: unknown): DndPersonalContentReference[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((value) => {
    const reference = obj(value);
    const packId = str(reference.packId, '').trim();
    const packVersionId = str(reference.packVersionId, '').trim();
    const displayName = str(reference.displayName, '').trim();
    const versionLabel = str(reference.versionLabel, '').trim();
    if (!packId || !packVersionId || !displayName || !versionLabel) return [];
    return [{ packId, packVersionId, displayName, versionLabel }];
  });
}

// ─── Attribute defaults ───────────────────────────────────────────────────────

const DEFAULT_ATTR = { base: 8, pointbuy: 0, racebonus: 0, extrabonus: 0 };

function migrateAttr(raw: unknown) {
  const a = obj(raw);
  return {
    base:       num(a.base,       DEFAULT_ATTR.base),
    pointbuy:   num(a.pointbuy,   DEFAULT_ATTR.pointbuy),
    racebonus:  num(a.racebonus,  DEFAULT_ATTR.racebonus),
    extrabonus: num(a.extrabonus, DEFAULT_ATTR.extrabonus),
  };
}

function migrateAttrs(raw: unknown): CharacterAttributes {
  const a = obj(raw);
  return {
    Str: migrateAttr(a.Str),
    Dex: migrateAttr(a.Dex),
    Con: migrateAttr(a.Con),
    Int: migrateAttr(a.Int),
    Wis: migrateAttr(a.Wis),
    Cha: migrateAttr(a.Cha),
  };
}

// ─── Spellbook defaults ───────────────────────────────────────────────────────

function migrateSpellbook(raw: unknown) {
  const sb = obj(raw);
  const slots = obj(sb.slots);

  // Preserve existing slot data; coerce each slot entry to { max, current }
  const migratedSlots: { [level: number]: { max: number; current: number } } = {};
  for (const key of Object.keys(slots)) {
    const lvl = parseInt(key, 10);
    if (!isNaN(lvl)) {
      const s = obj(slots[key]);
      migratedSlots[lvl] = {
        max:     num(s.max,     0),
        current: num(s.current, 0),
      };
    }
  }
  if (Object.keys(migratedSlots).length === 0) {
    migratedSlots[1] = { max: 2, current: 2 };
  }

  return {
    known:    arr<SpellInfo>(sb.known),
    prepared: arr<string>(sb.prepared),
    slots:    migratedSlots,
  };
}

// ─── Main migration entry point ───────────────────────────────────────────────

export function migrateCharacter(data: unknown): CharacterData {
  const d = obj(data);

  // Detect schema version; absent = 0 (pre-versioning save)
  let version = num(d.schemaVersion, 0);

  // Reconstruct every field with safe defaults NOW, before version steps.
  // Version steps below only need to handle additive changes.
  const migrated: CharacterData = {
    schemaVersion: version,

    // ── Identity ──────────────────────────────────────────────────────────
    id:          str(d.id, crypto.randomUUID?.() || Date.now().toString()),
    name:        str(d.name, ''),
    age:         str(d.age, ''),
    gender:      str(d.gender, ''),
    race:        str(d.race, ''),
    subrace:     str(d.subrace, ''),
    jobClass:    str(d.jobClass, ''),
    subclass:    str(d.subclass, ''),
    classLevels: normalizeDndClassLevels(d.classLevels, {
      className: str(d.jobClass, ''),
      level: num(d.level, 1),
      subclass: str(d.subclass, ''),
    }),
    background:  str(d.background, ''),
    description: str(d.description, ''),

    // ── Vitals ────────────────────────────────────────────────────────────
    level:          num(d.level, 1),
    hpMax:          num(d.hpMax, 10),
    hpCurrent:      num(d.hpCurrent, 10),
    tempHp:         num(d.tempHp, 0),
    deathSaves: {
      successes: num(obj(d.deathSaves).successes, 0),
      failures:  num(obj(d.deathSaves).failures,  0),
    },
    hitDiceCurrent: num(d.hitDiceCurrent, 1),
    acMod:          num(d.acMod, 10),
    speed:          str(d.speed, '30'),
    size:           str(d.size, '中型'),

    // ── Attributes ────────────────────────────────────────────────────────
    attrs: migrateAttrs(d.attrs),

    // ── Proficiencies ─────────────────────────────────────────────────────
    skillProficiencies:       arr<SkillName>(d.skillProficiencies),
    savingThrowProficiencies: arr<AttributeName>(d.savingThrowProficiencies),
    weaponProficiencies:      arr<string>(d.weaponProficiencies),
    armorTraining:            arr<string>(d.armorTraining),

    // ── Optional class flavour ────────────────────────────────────────────
    bardPerformance: typeof d.bardPerformance === 'string' ? d.bardPerformance : undefined,

    // ── Spellbook ─────────────────────────────────────────────────────────
    spellbook: migrateSpellbook(d.spellbook),

    // ── Misc ──────────────────────────────────────────────────────────────
    customLanguages: str(d.customLanguages, '通用语'),
    inventory:       arr<string>(d.inventory),
    activeMods:      arr<string>(d.activeMods),
    customModsData:  arr<CustomMod>(d.customModsData),
    personalContentReferences: migratePersonalContentReferences(d.personalContentReferences),
    feats:           arr<string>(d.feats),
    coin:            num(d.coin, 0),

    // ── Creation state ────────────────────────────────────────────────────
    remainingPoints: num(d.remainingPoints, 27),
    isCompleted:     bool(d.isCompleted, false),

    // ── v2: Class resource runtime state ─────────────────────────────────
    // Base reconstruction provides safe defaults; the v1→v2 migration step
    // below will overwrite these with preserved data when available.
    classResources: migrateClassResources(d.classResources),
    pactMagicState: migratePactMagicState(d.pactMagicState),

    // ── Future fields (reserved — not yet implemented) ────────────────────
    // equipment?: EquipmentItem[];
    //   Structured item array replacing the current plain-string inventory[].
    //
    // actionRegistry?: ActionEntry[];
    //   Registered actions / reactions / bonus actions for the combat tracker.
    //
    // spellcastingProgression?: SpellcastingProgression;
    //   Per-class spell slot table to replace the hardcoded levelUp logic.
    //
    // concentrationState?: { spellName: string; endCondition: string } | null;
    //   Tracks currently concentrated spell.
    //
    // campaignId?: string;
    //   Link character to a campaign document.
    //
    // system?: 'D&D' | 'CoC' | 'CP';
    //   Embed the owning rule system so cross-system migration can be detected.
  };

  // ─── Version-gated migration steps ────────────────────────────────────────
  // Each case upgrades the object from version N to N+1.
  while (version < CURRENT_DND_CHARACTER_SCHEMA_VERSION) {
    switch (version) {
      case 0:
        // v0 → v1: No field changes. We just stamp the version.
        // Pre-versioning saves are fully covered by the safe-default
        // reconstruction above.
        version = 1;
        migrated.schemaVersion = 1;
        break;

      case 1:
        // v1 → v2: Added classResources and pactMagicState.
        //
        // The base reconstruction above already called migrateClassResources()
        // and migratePactMagicState(), so valid existing data is already
        // preserved in `migrated`. This step only needs to stamp the version.
        //
        // Explicit guarantee:
        //   • classResources is kept if it was a valid array, else [].
        //   • pactMagicState is kept if it had numeric current/max/slotLevel,
        //     else undefined.
        //   • No class-specific initialisation is performed here — that is
        //     intentionally deferred to the resource initialisation helper
        //     (to be implemented in a future store action).
        version = 2;
        migrated.schemaVersion = 2;
        break;

      case 2:
        // v2 → v3: personalContentReferences is already reconstructed above.
        version = 3;
        migrated.schemaVersion = 3;
        break;

      case 3:
        // v3 → v4: classLevels was already reconstructed from legacy primary
        // class fields above. This only stamps the additive migration.
        version = 4;
        migrated.schemaVersion = 4;
        break;

      default:
        // Unknown version — skip to current to avoid infinite loop
        version = CURRENT_DND_CHARACTER_SCHEMA_VERSION;
        migrated.schemaVersion = CURRENT_DND_CHARACTER_SCHEMA_VERSION;
        break;
    }
  }

  return migrated;
}
