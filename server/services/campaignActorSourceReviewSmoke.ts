/**
 * Host source review + acceptance smoke (T11b).
 *
 * AI-LANDMARK: CAMPAIGN_ACTOR_SOURCE_REVIEW_SMOKE_V1
 *
 * Covers the twelve contract points: review, privacy, permission surface,
 * unchanged, unknown, atomic acceptance, server authority, source re-read,
 * override preservation, runtime non-mutation, the T11a flag clearing, and the
 * T9 fill deriving from the newly accepted version.
 */

import {
  acceptCampaignActorSourceUpdate,
  reviewCampaignActorSourceUpdate,
} from './campaignActorSourceReview.js';
import {
  compareDndCharacterCombatRelevantHash,
  formatDndCharacterCombatRelevantHash,
  sourceChangedSinceApprovalFlag,
} from './dndCharacterCombatRelevantHash.js';
import { deriveDndLiteActorSheetFromSnapshot } from '../../src/lib/dnd/dndCharacterToLiteActorSheet.js';
import type { CampaignActorInstanceRecord } from '../adapters/postgresPlatformFoundationRepository.js';

const cases: string[] = [];
function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

const attr = (score: number) => ({ base: score, pointbuy: 0, racebonus: 0, extrabonus: 0 });

function character(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 4, id: 'char-1', name: 'Maris', age: '24', gender: '', race: '人类', subrace: '',
    jobClass: '战士', subclass: '', classLevels: [{ className: '战士', level: 5 }],
    background: '士兵', description: 'A private backstory nobody else should read.',
    level: 5, hpMax: 38, hpCurrent: 12, tempHp: 0,
    deathSaves: { successes: 0, failures: 0 }, hitDiceCurrent: 5,
    acMod: 15, speed: '30', size: '中型',
    attrs: { Str: attr(16), Dex: attr(14), Con: attr(15), Int: attr(10), Wis: attr(12), Cha: attr(8) },
    skillProficiencies: ['运动'], savingThrowProficiencies: ['Str', 'Con'],
    weaponProficiencies: ['长剑'], armorTraining: ['重甲'],
    spellbook: { known: [{ name_en: 'Fireball', desc: 'secret' }], prepared: ['Fireball'], slots: { 3: { max: 2, current: 2 } } },
    customLanguages: '通用语', inventory: ['绳索', '私人日记'],
    personalContentReferences: [], feats: ['警觉'], coin: 512,
    remainingPoints: 0, isCompleted: true, classResources: [],
    ...overrides,
  };
}

const V1 = character();
// v2: a level-up across a proficiency-bonus step (5 -> 9 moves +3 to +4).
// Level 6 would NOT move the proficiency bonus: it steps at 5/9/13/17.
const V2 = character({
  level: 9, classLevels: [{ className: '战士', level: 9 }], hitDiceCurrent: 9, hpMax: 45, acMod: 16,
  attrs: { Str: attr(18), Dex: attr(14), Con: attr(15), Int: attr(10), Wis: attr(12), Cha: attr(8) },
  skillProficiencies: ['运动', '察觉'],
});

const HOST_SHEET = {
  schemaVersion: 1, actorKind: 'pc', displayName: 'Maris (GM edit)',
  // DndLiteActorSheet abilities are scores, not modifiers.
  abilities: { strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8 },
  proficiencyBonus: 3,
  defenses: { armorClass: 17, maxHp: 40, currentHp: 9, temporaryHp: 4, speedFt: 30 },
  actions: [{ id: 'sword', name: '长剑', kind: 'weapon_attack', attackBonus: 6 }],
  tags: ['gm-edited'],
};

function actorRecord(overrides: Partial<CampaignActorInstanceRecord> = {}): CampaignActorInstanceRecord {
  return {
    campaignActorInstanceId: 'instance-1', campaignId: 'campaign-1',
    sourceActorId: 'actor-1', ownerId: 'player-user', actorKind: 'pc',
    displayName: 'Maris', instanceStatus: 'active',
    snapshotHash: formatDndCharacterCombatRelevantHash(V1),
    snapshotPayload: V1,
    overridePayload: { dndLiteActorSheetV1: HOST_SHEET },
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as CampaignActorInstanceRecord;
}

const vault = (payload: unknown, extra: Record<string, unknown> = {}) => ({
  getActorById: async () => ({
    ok: true as const,
    value: {
      actorId: 'actor-1', ownerId: 'player-user', systemId: 'dnd5e-2024',
      displayName: 'Maris', payload: payload as Record<string, unknown>, ...extra,
    },
  }),
});

function acceptanceRepo() {
  const store = { record: actorRecord(), writes: 0 };
  return {
    store,
    acceptCampaignActorSourceUpdate: async (input: {
      campaignActorInstanceId: string;
      snapshotPayload: Record<string, unknown>;
      snapshotHash: string;
      acceptance: { acceptedByUserId?: string; acceptedAt: string; previousSnapshotHash?: string };
    }) => {
      store.writes += 1;
      store.record = {
        ...store.record,
        snapshotPayload: input.snapshotPayload,
        snapshotHash: input.snapshotHash,
        overridePayload: { ...store.record.overridePayload, sourceAcceptanceV1: { schemaVersion: 1, ...input.acceptance } },
        updatedAt: '2026-01-03T00:00:00.000Z',
      };
      return { ok: true as const, value: store.record };
    },
  };
}

async function main(): Promise<void> {
  // ── 1. review: accepted v1 + current v2 => changed + compact diff ─────────
  const changed = await reviewCampaignActorSourceUpdate({ actor: actorRecord(), vaultRepository: vault(V2) });
  check('review decides', changed.decision === 'reviewed');
  check('review reports changed', changed.status === 'changed');
  check('review sets the T11a flag', changed.sourceChangedSinceApproval === true);
  const keys = (changed.review?.changedFields ?? []).map((f) => f.key);
  check('level-up moves max HP', keys.includes('defenses.maxHp'));
  check('level-up moves armor class', keys.includes('defenses.armorClass'));
  check('level-up moves strength', keys.includes('abilities.strength'));
  check('level-up moves proficiency bonus', keys.includes('proficiencyBonus'));
  check('a new skill proficiency is reported', keys.some((k) => k.startsWith('skills.')));
  const maxHp = changed.review?.changedFields.find((f) => f.key === 'defenses.maxHp');
  check('diff carries before and after', maxHp?.before === '38' && maxHp?.after === '45');
  const ac = changed.review?.changedFields.find((f) => f.key === 'defenses.armorClass');
  check('armor class reads 17 -> 18 after the dex/ac change', ac?.before === '17' && ac?.after === '18');
  const str = changed.review?.changedFields.find((f) => f.key === 'abilities.strength');
  check('ability scores are shown as scores, not as signed modifiers',
    str?.before === '16' && str?.after === '18');
  const conSave = changed.review?.changedFields.find((f) => f.key === 'savingThrows.constitution');
  check('derived save bonuses keep the signed form', conSave?.before === '+5' && conSave?.after === '+6');
  check('unchanged fields are not listed', !keys.includes('defenses.speedFt'));
  check('volatile current HP is never reviewed', !keys.some((k) => k.includes('currentHp') || k.includes('temporaryHp')));
  check('compared field count is reported', (changed.review?.comparedFieldCount ?? 0) > 10);

  // ── 2. privacy: no raw CharacterData anywhere in the response ─────────────
  // `approximations` / `omissions` are label lists naming what the derivation
  // did NOT cover (e.g. the literal string 'inventory'). They carry no player
  // data, so they are excluded from the substring scan and checked separately.
  const COVERAGE_LABEL_KEYS = new Set(['approximations', 'omissions']);
  const serialised = JSON.stringify(changed, (key, value) =>
    (COVERAGE_LABEL_KEYS.has(key) ? undefined : value));
  for (const leak of ['attrs', 'pointbuy', 'racebonus', 'spellbook', 'inventory', 'coin',
    'Fireball', '私人日记', 'A private backstory', 'weaponProficiencies', 'armorTraining',
    'deathSaves', 'hitDiceCurrent', 'personalContentReferences', 'classResources', 'hpCurrent']) {
    check(`review response does not leak "${leak}"`, !serialised.includes(leak));
  }
  check('review response carries no snapshotPayload', !serialised.includes('snapshotPayload'));
  check('review response carries no raw jobClass field', !serialised.includes('jobClass'));

  // The excluded coverage labels really are labels: short, and drawn from the
  // derivation's own fixed vocabulary rather than from the character payload.
  const KNOWN_COVERAGE_LABELS = new Set([
    'armorClass', 'savingThrows', 'skills', 'speedFt',
    'actions', 'spellSlots', 'classResources', 'inventory', 'conditions',
  ]);
  const coverageLabels = [
    ...(changed.review?.approximations ?? []),
    ...(changed.review?.omissions ?? []),
  ];
  check('coverage labels are reported at all', coverageLabels.length > 0);
  check('coverage labels come from a fixed vocabulary',
    coverageLabels.every((label) => KNOWN_COVERAGE_LABELS.has(label)));

  // ── 4. unchanged: identical accepted/current source ───────────────────────
  const same = await reviewCampaignActorSourceUpdate({ actor: actorRecord(), vaultRepository: vault(V1) });
  check('identical source reads unchanged', same.status === 'unchanged');
  check('identical source clears the flag', same.sourceChangedSinceApproval === false);
  check('identical source lists no changed fields', (same.review?.changedFields.length ?? 0) === 0);

  // ── 5. unknown: unreadable / missing source is honest ─────────────────────
  const unreadable = await reviewCampaignActorSourceUpdate({
    actor: actorRecord(), vaultRepository: vault({ hp: 12 }),
  });
  check('unreadable current source is never "unchanged"', unreadable.review?.status !== 'unchanged');
  check('unreadable current source reports unknown', unreadable.review?.status === 'unknown');
  check('unreadable side is named', unreadable.review?.unreadable === 'current');

  const noBaseline = await reviewCampaignActorSourceUpdate({
    actor: actorRecord({ snapshotPayload: { hp: 1 }, snapshotHash: undefined }),
    vaultRepository: vault(V2),
  });
  check('missing baseline is never "unchanged"', noBaseline.review?.status === 'unknown');
  check('missing baseline names the accepted side', noBaseline.review?.unreadable === 'accepted');
  check('missing baseline does not claim a confirmed change', noBaseline.sourceChangedSinceApproval === false);

  const missingActor = await reviewCampaignActorSourceUpdate({
    actor: actorRecord(),
    vaultRepository: { getActorById: async () => ({ ok: true as const, value: null }) },
  });
  check('a deleted source is reported, not guessed', missingActor.decision === 'sourceUnavailable');
  const foreign = await reviewCampaignActorSourceUpdate({
    actor: actorRecord(), vaultRepository: vault(V2, { ownerId: 'someone-else' }),
  });
  check('a source owned by a different user is refused, not derived', foreign.decision === 'sourceUnavailable');
  check('a refused link leaks no review', foreign.review === undefined);
  const foreignAccept = acceptanceRepo();
  const foreignAccepted = await acceptCampaignActorSourceUpdate({
    actor: actorRecord(), vaultRepository: vault(V2, { ownerId: 'someone-else' }),
    acceptanceRepository: foreignAccept, expectedSourceHash: formatDndCharacterCombatRelevantHash(V2)!,
  });
  check('a source owned by a different user is never accepted', foreignAccepted.decision === 'sourceUnavailable');
  check('a refused link writes nothing', foreignAccept.store.writes === 0);
  const unlinked = await reviewCampaignActorSourceUpdate({
    actor: actorRecord({ sourceActorId: undefined }), vaultRepository: vault(V2),
  });
  check('an unlinked actor is reported', unlinked.decision === 'notLinkedToSource');

  // ── 6/7/8. acceptance: atomic, server-derived, re-read ───────────────────
  const currentHash = formatDndCharacterCombatRelevantHash(V2)!;
  const repo = acceptanceRepo();
  const accepted = await acceptCampaignActorSourceUpdate({
    actor: actorRecord(), vaultRepository: vault(V2), acceptanceRepository: repo,
    expectedSourceHash: currentHash, acceptedByUserId: 'host-user', now: '2026-01-03T00:00:00.000Z',
  });
  check('acceptance succeeds', accepted.decision === 'accepted');
  check('acceptance wrote exactly once', repo.store.writes === 1);
  check('snapshot payload advanced to v2', (repo.store.record.snapshotPayload as Record<string, unknown>).level === 9);
  check('snapshot hash advanced to v2', repo.store.record.snapshotHash === currentHash);
  check('payload and hash describe the SAME version',
    formatDndCharacterCombatRelevantHash(repo.store.record.snapshotPayload) === repo.store.record.snapshotHash);
  check('previous hash is recorded as a breadcrumb', accepted.previousSourceHash === formatDndCharacterCombatRelevantHash(V1));

  // 7. server authority: a client-supplied payload/hash is never stored.
  const forged = acceptanceRepo();
  const forgedHash = formatDndCharacterCombatRelevantHash(character({ level: 20, hpMax: 999 }))!;
  const rejected = await acceptCampaignActorSourceUpdate({
    actor: actorRecord(), vaultRepository: vault(V2), acceptanceRepository: forged,
    expectedSourceHash: forgedHash,
  });
  check('a hash the server did not derive is refused', rejected.decision === 'reviewVersionMismatch');
  check('a refused acceptance writes nothing', forged.store.writes === 0);
  check('the forged level never reached storage', (forged.store.record.snapshotPayload as Record<string, unknown>).level === 5);

  // 8. source re-read: the source moved between review and accept.
  const raced = acceptanceRepo();
  const staleReviewHash = formatDndCharacterCombatRelevantHash(V2)!;
  const V3 = character({ level: 7, hpMax: 52 });
  const racedResult = await acceptCampaignActorSourceUpdate({
    actor: actorRecord(), vaultRepository: vault(V3), acceptanceRepository: raced,
    expectedSourceHash: staleReviewHash,
  });
  check('a source that moved since review is refused (TOCTOU)', racedResult.decision === 'reviewVersionMismatch');
  check('the raced acceptance stored nothing', raced.store.writes === 0);
  check('the unreviewed v3 never became the baseline', (raced.store.record.snapshotPayload as Record<string, unknown>).level === 5);

  // ── 9. override preservation ──────────────────────────────────────────────
  const sheetBefore = JSON.stringify(HOST_SHEET);
  const sheetAfter = JSON.stringify((repo.store.record.overridePayload as Record<string, unknown>).dndLiteActorSheetV1);
  check('the GM-edited combat sheet is byte-equivalent after acceptance', sheetBefore === sheetAfter);
  check('the acceptance breadcrumb is stored beside it, not over it',
    Boolean((repo.store.record.overridePayload as Record<string, unknown>).sourceAcceptanceV1));
  check('acceptance did not adopt the derived AC into the override',
    ((repo.store.record.overridePayload as Record<string, unknown>).dndLiteActorSheetV1 as { defenses: { armorClass: number } }).defenses.armorClass === 17);

  // ── 10. runtime preservation: nothing combat-facing was touched ───────────
  const overrideSheet = (repo.store.record.overridePayload as Record<string, unknown>).dndLiteActorSheetV1 as {
    defenses: { currentHp: number; temporaryHp: number };
  };
  check('current HP untouched by acceptance', overrideSheet.defenses.currentHp === 9);
  check('temporary HP untouched by acceptance', overrideSheet.defenses.temporaryHp === 4);
  // Static guard: the acceptance service must not so much as name the runtime.
  // Comments are stripped first — the file's own header documents what it does
  // NOT touch, and that prose must not be mistaken for a reference.
  const acceptSourceRaw = (await import('node:fs')).readFileSync(new URL('./campaignActorSourceReview.ts', import.meta.url), 'utf8');
  const acceptSource = acceptSourceRaw
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  check('comment stripping left real code behind', acceptSource.includes('acceptCampaignActorSourceUpdate'));
  for (const forbidden of ['appendRuntimeLogEvent', 'RuntimeLog', 'combatRuntime', 'Combatant', 'initiative', 'ActorAdmission']) {
    check(`the acceptance service never references ${forbidden}`, !acceptSource.includes(forbidden));
  }

  // ── 11. T11a: the flag clears after acceptance ────────────────────────────
  const afterFlag = sourceChangedSinceApprovalFlag(compareDndCharacterCombatRelevantHash({
    storedHash: repo.store.record.snapshotHash, currentPayload: V2,
  }));
  check('sourceChangedSinceApproval clears after acceptance', afterFlag === false);
  const afterReview = await reviewCampaignActorSourceUpdate({ actor: repo.store.record, vaultRepository: vault(V2) });
  check('a re-review after acceptance reads unchanged', afterReview.status === 'unchanged');

  // ── 12. T9: "Fill from character" now derives from the accepted v2 ────────
  const filled = deriveDndLiteActorSheetFromSnapshot(repo.store.record.snapshotPayload);
  check('T9 derives from the newly accepted source', filled?.sheet.defenses.maxHp === 45);
  check('T9 sees the accepted level-up abilities', filled?.sheet.abilities.strength === 18);
  const filledFromOld = deriveDndLiteActorSheetFromSnapshot(V1);
  check('the v1 derivation really differed', filledFromOld?.sheet.defenses.maxHp === 38);

  console.log(JSON.stringify({ status: 'passed', suite: 'campaignActorSourceReview', assertions: cases.length }, null, 2));
}

void main();
