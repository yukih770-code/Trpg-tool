import type { CampaignActorInstanceRecord } from '../adapters/postgresPlatformFoundationRepository.js';
import { readDndCharacterSnapshot } from '../../src/lib/dnd/dndCharacterToLiteActorSheet.js';
import { getDndSpellPreparationModel } from '../../src/lib/dnd2024/spell-preparation-model.js';
import type { DndRuntimeResource, DndRuntimeSpell } from '../../src/lib/dnd/dndRuntimeResources.js';

function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function integer(value: unknown, max = 100000): value is number { return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= max; }

/** Accepted campaign snapshot and authored sheet only. Never reads a live Vault. */
export function readDndActorPlayData(actor: CampaignActorInstanceRecord): { resources: DndRuntimeResource[]; spells: DndRuntimeSpell[] } {
  const resources: DndRuntimeResource[] = [], spells: DndRuntimeSpell[] = [];
  const character = readDndCharacterSnapshot(actor.snapshotPayload);
  if (character) {
    const book = record(character.spellbook);
    for (const [key, value] of Object.entries(record(book.slots))) {
      const level = Number(key), slot = record(value);
      if (!integer(level, 9) || level === 0 || !integer(slot.max) || !integer(slot.current) || slot.current > slot.max) continue;
      resources.push({ id: `slot:${level}`, label: `${level}环法术位`, resource: { kind: 'spellSlot', level }, current: slot.current, max: slot.max, refresh: 'manual' });
    }
    const pact = record(character.pactMagicState);
    if (integer(pact.max) && integer(pact.current) && pact.current <= pact.max && integer(pact.slotLevel, 9) && pact.slotLevel > 0) resources.push({ id: 'pact', label: '契约魔法', resource: { kind: 'spellSlot', resourceId: 'pact', level: pact.slotLevel }, current: pact.current, max: pact.max, refresh: 'manual' });
    for (const raw of Array.isArray(character.classResources) ? character.classResources : []) {
      const r = record(raw);
      if (typeof r.id !== 'string' || !r.id || !integer(r.current) || !integer(r.max) || r.current > r.max) continue;
      resources.push({ id: `class:${r.id}`, label: typeof r.sourceFeature === 'string' ? r.sourceFeature : r.id, resource: { kind: 'classResource', resourceId: r.id }, current: r.current, max: r.max, refresh: 'manual' });
    }
    const prepared = Array.isArray(book.prepared) ? book.prepared : [];
    const model = getDndSpellPreparationModel(character);
    for (const value of Array.isArray(book.known) ? book.known : []) {
      const s = record(value);
      if (typeof s.name_cn !== 'string' || !s.name_cn || !integer(s.level, 9)) continue;
      if (s.level > 0 && model.isPreparedCaster && !prepared.includes(s.name_cn)) continue;
      spells.push({ id: typeof s.id === 'string' ? s.id : s.name_cn, name: s.name_cn, level: s.level });
    }
  }
  // NPC/custom Monster resource capacities are explicit authored values, not class rules.
  const sheet = record(actor.overridePayload.dndLiteActorSheetV1);
  for (const value of Array.isArray(sheet.resources) ? sheet.resources : []) {
    const r = record(value);
    if (typeof r.id !== 'string' || !r.id || typeof r.name !== 'string' || !integer(r.max)) continue;
    if (r.kind === 'spellSlot' && (!integer(r.level, 9) || r.level === 0)) continue;
    if (r.kind !== 'spellSlot' && r.kind !== 'classResource' && r.kind !== 'custom') continue;
    const id = `authored:${r.id}`;
    if (!resources.some(item => item.id === id)) resources.push({ id, label: r.name, resource: { kind: r.kind, resourceId: r.id, ...(r.kind === 'spellSlot' ? { level: r.level as number } : {}) }, current: r.max, max: r.max, refresh: 'manual' });
  }
  return { resources, spells };
}
