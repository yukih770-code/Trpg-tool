import type { RuntimeCharacterStat, RuntimeCharacterSummary } from './RuntimeCharacterSheetPanel';

/**
 * runtimeActorSnapshotAdapter (M49/M50) — safe, read-only actor summary builder.
 *
 * AI-LANDMARK: RUNTIME_ACTOR_SNAPSHOT_ADAPTER_V0
 *
 * Turns whatever actor data the Runtime happens to have (an optional rich actor
 * snapshot, plus the always-present lightweight actorRef / binding / ready) into
 * the `RuntimeCharacterSummary` the sheet renders. It is DEFENSIVE by design:
 *   - never throws (bad/missing fields just produce empty sections),
 *   - never fabricates rule numbers (only surfaces values that actually exist),
 *   - never writes a store or mutates inputs.
 * System-aware extraction (DND 5e / CoC 7e / CP RED) reads a permissive snapshot
 * shape with key aliases, so when a real snapshot is wired in later the sheet
 * fills in automatically with NO UI change. Today no snapshot source is provided,
 * so the adapter returns identity + a sourceWarning explaining the gap.
 */

export interface RuntimeActorBindingLite {
  displayName?: string;
  systemId?: string;
  actorId?: string;
  source?: string;
  /** Lobby binding-draft status. */
  status?: string;
  /** Character-clearance status. */
  clearanceStatus?: string;
}

export interface RuntimeActorSnapshotInput {
  actorRef?: { displayName?: string; systemId?: string; actorId?: string; source?: string };
  binding?: RuntimeActorBindingLite;
  /** Optional rich actor snapshot (any shape). Read defensively; absent today. */
  snapshot?: unknown;
  playerLabel?: string;
  readyState?: string;
  fallbackSystemId?: string;
}

type SystemFamily = 'dnd5e' | 'coc7e' | 'cpred' | 'other';

// ── Safe readers ─────────────────────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function firstDefined(rec: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    const v = rec[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

function toText(v: unknown): string | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string' && v.trim() !== '') return v.trim();
  if (typeof v === 'boolean') return v ? '是' : '否';
  return undefined;
}

function pushStat(out: RuntimeCharacterStat[], label: string, rec: Record<string, unknown> | null, keys: string[]): void {
  if (!rec) return;
  const text = toText(firstDefined(rec, keys));
  if (text !== undefined) out.push({ label, value: text });
}

/** Combine "current / max" style pairs into one stat when present. */
function pushRatioStat(out: RuntimeCharacterStat[], label: string, rec: Record<string, unknown> | null, curKeys: string[], maxKeys: string[]): void {
  if (!rec) return;
  const cur = toText(firstDefined(rec, curKeys));
  const max = toText(firstDefined(rec, maxKeys));
  if (cur !== undefined && max !== undefined) out.push({ label, value: `${cur} / ${max}` });
  else if (cur !== undefined) out.push({ label, value: cur });
}

/** Read an array of strings or {name,label,title} objects into a bounded string list. */
function readStringList(rec: Record<string, unknown> | null, keys: string[], max = 8): string[] {
  if (!rec) return [];
  const v = firstDefined(rec, keys);
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (out.length >= max) break;
    if (typeof item === 'string' && item.trim() !== '') {
      out.push(item.trim());
      continue;
    }
    const r = asRecord(item);
    const name = r ? toText(firstDefined(r, ['name', 'label', 'title'])) : undefined;
    if (name) out.push(name);
  }
  return out;
}

/**
 * Read a skills/stat container into RuntimeCharacterStat[]. Accepts either a
 * record ({ 侦查: 12 }) or an array ([{ name, value|modifier|total }]). Bounded.
 */
function readStatList(rec: Record<string, unknown> | null, keys: string[], max = 8): RuntimeCharacterStat[] {
  if (!rec) return [];
  const v = firstDefined(rec, keys);
  const out: RuntimeCharacterStat[] = [];
  if (Array.isArray(v)) {
    for (const item of v) {
      if (out.length >= max) break;
      const r = asRecord(item);
      if (!r) continue;
      const label = toText(firstDefined(r, ['name', 'label', 'title', 'skill']));
      const value = toText(firstDefined(r, ['value', 'modifier', 'mod', 'total', 'bonus', 'rating', 'level']));
      if (label && value !== undefined) out.push({ label, value });
    }
    return out;
  }
  const asRec = asRecord(v);
  if (asRec) {
    for (const [label, raw] of Object.entries(asRec)) {
      if (out.length >= max) break;
      const value = toText(raw);
      if (value !== undefined) out.push({ label, value });
    }
  }
  return out;
}

function systemFamily(systemId?: string): SystemFamily {
  const s = (systemId ?? '').toLowerCase();
  if (s.includes('dnd') || s.includes('5e')) return 'dnd5e';
  if (s.includes('coc') || s.includes('cthulhu')) return 'coc7e';
  if (s.includes('cp') || s.includes('cyber') || s.includes('red')) return 'cpred';
  return 'other';
}

interface Sections {
  coreStats: RuntimeCharacterStat[];
  skillHighlights: RuntimeCharacterStat[];
  resourceHighlights: RuntimeCharacterStat[];
  equipmentHighlights: string[];
  featureHighlights: RuntimeCharacterStat[];
  notes: string[];
}

function emptySections(): Sections {
  return { coreStats: [], skillHighlights: [], resourceHighlights: [], equipmentHighlights: [], featureHighlights: [], notes: [] };
}

function extractDnd(rec: Record<string, unknown> | null): Sections {
  const s = emptySections();
  pushStat(s.coreStats, '护甲等级 (AC)', rec, ['ac', 'armorClass', 'armor_class']);
  pushRatioStat(s.coreStats, '生命值 (HP)', rec, ['hp', 'currentHp', 'hitPoints'], ['maxHp', 'hpMax', 'maxHitPoints']);
  pushStat(s.coreStats, '临时 HP', rec, ['tempHp', 'temporaryHp', 'temp_hp']);
  pushStat(s.coreStats, '熟练加值', rec, ['proficiencyBonus', 'profBonus', 'proficiency']);
  pushStat(s.coreStats, '被动感知', rec, ['passivePerception', 'passiveWisdom']);
  pushStat(s.coreStats, '职业 / 等级', rec, ['classLevel', 'classAndLevel']);
  pushStat(s.coreStats, '子职业', rec, ['subclass', 'archetype']);
  s.skillHighlights = readStatList(rec, ['savingThrows', 'saves', 'skills', 'skillHighlights']);
  s.resourceHighlights = readStatList(rec, ['spellSlots', 'pactMagic', 'resources', 'spellcasting']);
  s.equipmentHighlights = readStringList(rec, ['equipment', 'gear', 'items', 'inventory']);
  s.featureHighlights = readStatList(rec, ['features', 'traits', 'featureHighlights', 'preparedSpells']);
  return s;
}

function extractCoc(rec: Record<string, unknown> | null): Sections {
  const s = emptySections();
  pushRatioStat(s.coreStats, '生命值 (HP)', rec, ['hp', 'currentHp'], ['maxHp', 'hpMax']);
  pushRatioStat(s.coreStats, '魔法值 (MP)', rec, ['mp', 'currentMp'], ['maxMp', 'mpMax']);
  pushStat(s.coreStats, '理智 (SAN)', rec, ['san', 'sanity', 'currentSan']);
  pushStat(s.coreStats, '幸运 (Luck)', rec, ['luck', 'luckPoints']);
  pushStat(s.coreStats, '职业', rec, ['occupation', 'profession', 'job']);
  pushStat(s.coreStats, '年龄', rec, ['age']);
  pushStat(s.coreStats, '状态', rec, ['status', 'condition', 'injuries', 'temporaryInsanity']);
  s.skillHighlights = readStatList(rec, ['skills', 'mainSkills', 'skillHighlights']);
  s.equipmentHighlights = readStringList(rec, ['weapons', 'gear', 'belongings', 'items', 'inventory']);
  s.featureHighlights = readStatList(rec, ['weaponsDetail', 'features']);
  s.notes = readStringList(rec, ['backstory', 'notes', 'background']);
  return s;
}

function extractCpred(rec: Record<string, unknown> | null): Sections {
  const s = emptySections();
  pushRatioStat(s.coreStats, '生命值 (HP)', rec, ['hp', 'currentHp'], ['maxHp', 'hpMax']);
  pushStat(s.coreStats, '人性 (Humanity)', rec, ['humanity', 'currentHumanity']);
  pushStat(s.coreStats, '共情 (EMP)', rec, ['emp', 'empathy']);
  pushStat(s.coreStats, '护甲 (Armor)', rec, ['armor', 'armorSp', 'sp']);
  pushStat(s.coreStats, '角色能力', rec, ['roleAbility', 'role']);
  s.skillHighlights = readStatList(rec, ['skills', 'skillHighlights']);
  s.resourceHighlights = readStatList(rec, ['stats', 'attributes', 'resources']);
  s.equipmentHighlights = readStringList(rec, ['weapons', 'gear', 'equipment', 'inventory']);
  s.featureHighlights = readStatList(rec, ['cyberware', 'implants', 'features']);
  return s;
}

function extractByFamily(family: SystemFamily, rec: Record<string, unknown> | null): Sections {
  switch (family) {
    case 'dnd5e': return extractDnd(rec);
    case 'coc7e': return extractCoc(rec);
    case 'cpred': return extractCpred(rec);
    default: {
      // Unknown system: still surface any generic name/value stat blocks safely.
      const s = emptySections();
      s.coreStats = readStatList(rec, ['coreStats', 'stats', 'attributes']);
      s.skillHighlights = readStatList(rec, ['skills', 'skillHighlights']);
      s.equipmentHighlights = readStringList(rec, ['equipment', 'gear', 'items', 'inventory']);
      return s;
    }
  }
}

/**
 * Build a read-only RuntimeCharacterSummary from the best available actor data.
 * Returns null only when there is no actor at all (no ref and no binding).
 */
export function buildRuntimeCharacterSummary(input: RuntimeActorSnapshotInput): RuntimeCharacterSummary | null {
  const displayName = input.actorRef?.displayName ?? input.binding?.displayName;
  if (!displayName || displayName.trim() === '') return null;

  const system = input.actorRef?.systemId ?? input.binding?.systemId ?? input.fallbackSystemId;
  const source = input.actorRef?.source ?? input.binding?.source;
  const snapshotRec = asRecord(input.snapshot);
  const sections = extractByFamily(systemFamily(system), snapshotRec);

  const sourceWarnings: string[] = [];
  if (!snapshotRec) {
    sourceWarnings.push('未获取到完整角色快照，当前仅显示轻量信息（角色名 / 系统 / 准入状态）。角色卡数值将在接入角色快照后自动显示。');
  }

  return {
    displayName,
    system,
    source,
    playerLabel: input.playerLabel,
    admissionStatus: input.binding?.clearanceStatus,
    readyState: input.readyState,
    bindingStatus: input.binding?.status,
    coreStats: sections.coreStats,
    skillHighlights: sections.skillHighlights,
    resourceHighlights: sections.resourceHighlights,
    equipmentHighlights: sections.equipmentHighlights,
    featureHighlights: sections.featureHighlights,
    notes: sections.notes,
    sourceWarnings,
  };
}
