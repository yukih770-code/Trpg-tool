import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { DND_CREATURE_SIZES, DND_CREATURE_SIZE_SOURCE, readDndCreatureSize, materializeDndCreatureSizeFootprint, initializeDndTokenFootprint } from '../../src/lib/dnd2024/gameplay/dndCreatureSize.js';
import { DND_FIXED_SPECIES_SIZES } from '../../src/lib/dnd2024/gameplay/dndSpeciesSizeSource.js';
import { DND_2024_SPECIES_DATA } from '../../src/data/races.js';
import { migrateCharacter } from '../../src/lib/characterMigration.js';
import { dndCharacterToLiteActorSheet } from '../../src/lib/dnd/dndCharacterToLiteActorSheet.js';
import { createDefaultDndLiteActorSheet, validateDndLiteActorSheet } from '../../src/lib/dnd/dndLiteActorSheet.js';
import { dndMonsterToLiteActorSheet, type DndPrivateMonsterTemplate } from '../../src/lib/dnd/dndMonsterTemplateTypes.js';
import { createSceneSpatialV1 } from '../../src/lib/map/sceneSpatial.js';
import { createMapToken, createMapBoardState } from '../../src/lib/map/mapRuntimeTypes.js';
import { replayMapRuntimeEvents } from '../../src/lib/map/mapRuntimeReplay.js';
import { evaluateDndSpatialAttackLegality } from '../../src/lib/dnd2024/gameplay/dndSpatialAttackLegality.js';
import { getDndWeaponAttackModeByActionId } from '../../src/lib/dnd2024/gameplay/dndWeaponAttackModes.js';
import { materializeDndActorToken } from './materializeDndActorToken.js';
import { t12Fixture } from './t12TestFixture.js';
import { formatDndCharacterCombatRelevantHash, compareDndCharacterCombatRelevantHash, sourceChangedSinceApprovalFlag } from './dndCharacterCombatRelevantHash.js';
import { buildDndCharacterSourceReview } from '../../src/lib/dnd/dndCharacterSourceReview.js';
import { appendRoomMapEvent } from './appendRoomMapEvent.js';
import { readDndAttackIntent } from './declareDndAttack.js';
import { reviewCampaignActorSourceUpdate, acceptCampaignActorSourceUpdate } from './campaignActorSourceReview.js';

let checks = 0;
const check = (name: string, value: unknown) => { assert.ok(value, name); checks++; };
const scene = createSceneSpatialV1({ width: 20, height: 12, grid: { cellSize: 1 }, scale: { unitsPerGridCell: 5, unitLabel: 'display only' } });
for (const [i, size] of DND_CREATURE_SIZES.entries()) {
  check(`canonical ${size}`, readDndCreatureSize(JSON.parse(JSON.stringify(size))) === size);
  const footprint = materializeDndCreatureSizeFootprint(size, scene);
  check(`source table ${size}`, footprint?.width === [0.5, 1, 1, 2, 3, 4][i] && footprint.height === footprint.width);
  check(`valid sheet ${size}`, validateDndLiteActorSheet({ ...createDefaultDndLiteActorSheet(), creatureSize: size }).valid);
}
for (const size of ['中型', 'Medium', '', 'smallish', null, {}, 2]) check('untyped rejected', !materializeDndCreatureSizeFootprint(size, scene));
check('invalid sheet rejected', !validateDndLiteActorSheet({ ...createDefaultDndLiteActorSheet(), creatureSize: '中型' as never }).valid);
check('old sheet valid', validateDndLiteActorSheet(createDefaultDndLiteActorSheet()).valid);
check('no Scene', !materializeDndCreatureSizeFootprint('medium', undefined));
check('no grid', !materializeDndCreatureSizeFootprint('medium', createSceneSpatialV1({ width: 20, height: 12 })));
check('wrong scale', !materializeDndCreatureSizeFootprint('medium', { ...scene, scale: { unitsPerGridCell: 10 } }));
check('world units independent of feet', materializeDndCreatureSizeFootprint('large', { ...scene, grid: { ...scene.grid!, cellSize: 7 } })?.width === 14);

for (const source of [DND_CREATURE_SIZE_SOURCE, ...Object.values(DND_FIXED_SPECIES_SIZES)]) {
  const path = 'C:/TRPG_CHM_WORK/extracted/' + source.sourceRef.split(':')[1];
  if (existsSync(path)) check('approved source digest', createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase() === source.sha256);
}
check('fixed species metadata', DND_2024_SPECIES_DATA.find(race => race.id === 'species.dwarf')?.creatureSize === 'medium');
check('variable species not guessed', DND_2024_SPECIES_DATA.find(race => race.id === 'species.human')?.creatureSize === undefined);
const pc = migrateCharacter({ name: 'Size PC', dndCreatureSize: 'medium' });
check('migration preserves typed size', pc.dndCreatureSize === 'medium');
check('migration never parses legacy display', migrateCharacter({ size: '大型' }).dndCreatureSize === undefined);
check('Character derives typed Actor', dndCharacterToLiteActorSheet(pc).sheet.creatureSize === 'medium');
const hash = formatDndCharacterCombatRelevantHash(pc)!;
const changed = { ...pc, dndCreatureSize: 'small' };
check('T11 size change flags', sourceChangedSinceApprovalFlag(compareDndCharacterCombatRelevantHash({ storedHash: hash, currentPayload: changed })) === true);
check('T11 old version unknown', sourceChangedSinceApprovalFlag(compareDndCharacterCombatRelevantHash({ storedHash: hash.replace('RelevantV3:', 'RelevantV2:'), currentPayload: pc })) === undefined);
check('host review shows typed size change', buildDndCharacterSourceReview({ acceptedPayload: pc, currentPayload: changed }).changedFields.some(field => field.key === 'creatureSize' && field.before === 'Medium' && field.after === 'Small'));

const f = t12Fixture();
const pcActor = f.actors.get('pc-actor')!;
pcActor.snapshotPayload = pc as unknown as Record<string, unknown>;
pcActor.overridePayload = {};
const npcActor = f.actors.get('npc-actor')!;
npcActor.overridePayload = { dndLiteActorSheetV1: { ...createDefaultDndLiteActorSheet({ displayName: 'Size NPC', actorKind: 'npc' }), creatureSize: 'large' } };
const board = { ...createMapBoardState('map'), spatial: scene };
const token = { id: 'pc-token', name: 'PC', x: 50, y: 50, campaignActorId: 'pc-actor', sourceActorInstanceId: 'pc-actor' };
const materialize = (payload: Record<string, unknown>, state = board, campaignId = 'campaign') => materializeDndActorToken({ systemId: 'dnd5e-2024', campaignId, payload, board: state, repository: f.repository });
const first = await materialize({ token: { ...token, dndCreatureSize: 'gargantuan', size: 'gargantuan' } });
const placed = createMapToken(first.token as never);
check('server ignores forged size and visual identity', placed.footprint?.width === 1);
pcActor.sourceActorId = 'size-source';
pcActor.snapshotHash = hash;
const vaultRepository = { getActorById: async () => ({ ok: true as const, value: {
  actorId: 'size-source', ownerId: pcActor.ownerId!, systemId: 'dnd5e-2024', displayName: 'Size PC', payload: changed,
} }) };
const review = await reviewCampaignActorSourceUpdate({ actor: pcActor, vaultRepository });
check('T11 reviews actual source change', review.sourceChangedSinceApproval === true);
const beforeAcceptance = createMapToken((await materialize({ token })).token as never);
check('unaccepted source does not change Campaign', beforeAcceptance.footprint?.width === 1 && pcActor.snapshotPayload.dndCreatureSize === 'medium');
const acceptance = await acceptCampaignActorSourceUpdate({ actor: pcActor, vaultRepository,
  expectedSourceHash: formatDndCharacterCombatRelevantHash(changed)!, acceptedByUserId: 'host-user',
  acceptanceRepository: { acceptCampaignActorSourceUpdate: async input => {
    pcActor.snapshotPayload = input.snapshotPayload; pcActor.snapshotHash = input.snapshotHash;
    return { ok: true as const, value: pcActor };
  } },
});
check('T11 acceptance updates typed Campaign source', acceptance.decision === 'accepted' && pcActor.snapshotPayload.dndCreatureSize === 'small');
check('T11 acceptance does not resize existing Token', placed.footprint?.width === 1);
const npc = createMapToken((await materialize({ token: { ...token, id: 'npc-token', campaignActorId: 'npc-actor', sourceActorInstanceId: 'npc-actor' } })).token as never);
check('canonical NPC materializes', npc.footprint?.width === 2);
check('cross-campaign Actor denied', !(await materialize({ token }, board, 'other')).token || !(createMapToken((await materialize({ token }, board, 'other')).token as never).footprint));
check('explicit null wins', ((await materialize({ token: { ...token, footprint: null } })).token as { footprint: unknown }).footprint === null);
const explicit = { ...placed.footprint!, width: 3, height: 3 };
check('explicit GM bounds win', ((await materialize({ token: { ...token, footprint: explicit } })).token as { footprint: { width: number } }).footprint.width === 3);
check('existing linked Token never initialized', !((await materialize({ token }, { ...board, tokens: [{ ...placed, footprint: undefined }] })).token as { footprint?: unknown }).footprint);
const local = initializeDndTokenFootprint({ x: 50, y: 50 }, 'large', scene);
check('local adapter initializes', local.footprint?.width === 2);
check('local explicit clear wins', initializeDndTokenFootprint({ x: 50, y: 50, footprint: null }, 'large', scene).footprint === null);

const events = [
  { eventKind: 'map.spatial_updated', payload: { spatial: scene } },
  { eventKind: 'map.token_added', payload: { token: placed } },
  { eventKind: 'map.token_updated', payload: { token: { id: placed.id, footprint: explicit } } },
  { eventKind: 'map.token_moved', payload: { tokenId: placed.id, x: 52.5, y: 45.83333333333333 } },
];
pcActor.snapshotPayload = changed;
check('override survives source changes and replay', replayMapRuntimeEvents(events, 'map').tokens[0].footprint?.width === 3);
const clear = [...events, { eventKind: 'map.token_updated', payload: { token: { id: placed.id, footprint: null } } }];
check('clear stays point-only on replay', replayMapRuntimeEvents(clear, 'map').tokens[0].footprint === undefined);
const mode = getDndWeaponAttackModeByActionId('action.item.dagger.melee-weapon-attack');
check('canonical melee mode exists', mode);
const adjacent = createMapToken({ ...placed, id: 'target', x: placed.x + 5 });
check('materialized PC immediately enables legality', evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: placed, targetToken: adjacent }).status === 'legal');
check('beyond reach rejected', evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: placed, targetToken: { ...adjacent, x: placed.x + 10 } }).status === 'illegal');
check('clear disables exact legality', evaluateDndSpatialAttackLegality({ mode, spatial: scene, attackerToken: { ...placed, footprint: undefined }, targetToken: adjacent }).status === 'unavailable');
for (const member of ['player', 'spectator']) check('non-host cannot forge Token creation', appendRoomMapEvent(f.rooms, f.maps, { roomId: f.room.identity.roomId, authorMemberId: member, mapId: 'map', eventKind: 'map.token_added', payload: { token: placed } }).decision === 'memberNotAuthorized');
const intent = readDndAttackIntent({ ...f.intent, creatureSize: 'gargantuan', footprint: explicit });
check('attack intent allowlist', !('creatureSize' in intent) && !('footprint' in intent));
const monster = { name: 'Approved typed fixture', abilities: {}, speed: {}, savingThrows: {}, skills: {}, actions: [], tags: [], size: 'Huge display', creatureSize: 'large' } as unknown as DndPrivateMonsterTemplate;
check('typed Monster adapter preserved', dndMonsterToLiteActorSheet(monster).creatureSize === 'large');
check('legacy Monster size never inferred', dndMonsterToLiteActorSheet({ ...monster, creatureSize: undefined }).creatureSize === undefined);
console.log(JSON.stringify({ status: 'passed', suite: 'dndActorSizeMaterialization', assertions: checks }));
