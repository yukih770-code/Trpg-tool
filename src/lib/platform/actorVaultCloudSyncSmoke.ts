import { ensureLocalActorInCloud } from './actorVaultCloudSync';
import type { ActorVaultApiClient, ActorVaultRecord } from '../api/actorApiClient';
import { getActorVaultLocalSnapshot } from './actorVaultRepositoryBridge';
import { useCharacterStore } from '../../store/characterStore';
import { useCharacterInventoryStore } from './characterInventoryStore';
import { makeActorInventoryKey } from './characterInventory';

const localActor = {
  id: 'local_dnd_1',
  systemId: 'dnd5e-2024' as const,
  displayName: 'Smoke Ranger',
  status: 'active' as const,
  lifecycleStatus: 'active' as const,
  source: 'dnd-store' as const,
  originalRef: { store: 'characterStore', id: 'local_dnd_1' },
};

function cloudActor(payload: Record<string, unknown>): ActorVaultRecord {
  return {
    actorId: 'actor_cloud_1',
    ownerId: 'user_smoke',
    systemId: 'dnd5e-2024',
    localActorId: localActor.id,
    displayName: localActor.displayName,
    payload,
    schemaVersion: 1,
  };
}

export async function verifyActorVaultCloudSync(): Promise<void> {
  const original = useCharacterStore.getState().character;
  const localCharacter = { ...original, id: localActor.id, name: localActor.displayName, isCompleted: true };
  useCharacterStore.setState({ character: localCharacter, characters: [localCharacter], activeCharacterId: localCharacter.id });
  const actorKey = makeActorInventoryKey('dnd5e-2024', localCharacter.id);
  useCharacterInventoryStore.setState({
    itemsByActor: {
      [actorKey]: [
        { instanceId: 'owned-dagger', systemId: 'dnd5e-2024', definitionId: 'weapon.dagger', name: 'client label ignored', category: 'weapon', location: 'equipped', quantity: 1, equipSlot: 'mainHand' },
        { instanceId: 'free-text', systemId: 'dnd5e-2024', name: 'Long Sword +1 maybe', category: 'weapon', location: 'equipped', quantity: 1, equipSlot: 'offHand' },
      ],
    },
  });
  const localSnapshot = getActorVaultLocalSnapshot('dnd5e-2024', localCharacter.id) as { dndEquipmentSnapshotV1?: { items?: unknown[] } } | undefined;
  if (localSnapshot?.dndEquipmentSnapshotV1?.items?.length !== 1) throw new Error('cloud snapshot did not carry the narrow typed equipment reference');
  if (JSON.stringify(localSnapshot).includes('Long Sword +1 maybe')) throw new Error('free-text equipment leaked into the authoritative equipment block');

  let created = false;
  const createClient = {
    listActors: async () => [],
    createActor: async () => { created = true; return cloudActor({ name: 'Smoke Ranger' }); },
  } as unknown as ActorVaultApiClient;
  const createdResult = await ensureLocalActorInCloud({ actor: localActor, client: createClient, snapshot: { name: 'Smoke Ranger' } });
  if (!createdResult.ok || createdResult.action !== 'created' || !created) throw new Error('cloud actor creation did not occur');

  let updated = false;
  const updateClient = {
    listActors: async () => [cloudActor({ name: 'Old Ranger' })],
    updateActor: async () => { updated = true; return cloudActor({ name: 'Smoke Ranger' }); },
  } as unknown as ActorVaultApiClient;
  const updatedResult = await ensureLocalActorInCloud({ actor: localActor, client: updateClient, snapshot: { name: 'Smoke Ranger' } });
  if (!updatedResult.ok || updatedResult.action !== 'updated' || !updated) throw new Error('cloud actor update did not occur');

  let wrote = false;
  const unchangedClient = {
    listActors: async () => [cloudActor({ name: 'Smoke Ranger' })],
    updateActor: async () => { wrote = true; return cloudActor({ name: 'Smoke Ranger' }); },
  } as unknown as ActorVaultApiClient;
  const unchangedResult = await ensureLocalActorInCloud({ actor: localActor, client: unchangedClient, snapshot: { name: 'Smoke Ranger' } });
  if (!unchangedResult.ok || unchangedResult.action !== 'unchanged' || wrote) throw new Error('unchanged actor unexpectedly wrote to cloud');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  verifyActorVaultCloudSync().then(() => console.log('actor vault cloud sync smoke passed'));
}
