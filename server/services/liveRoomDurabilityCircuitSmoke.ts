import { createRoom } from './createRoom.js';
import {
  confirmLiveRoomLifecyclePersistence,
  createLiveRoomDurabilityCircuit,
} from './liveRoomDurabilityCircuit.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const local = createRoom({ hostDisplayName: 'Local Host' }).room;
assert(confirmLiveRoomLifecyclePersistence(local, undefined) === 'notRequired', 'Portable rooms must not require lifecycle persistence.');

const durable = createRoom({
  hostDisplayName: 'Cloud Host',
  campaignRef: {
    source: 'unknown',
    worldServerId: 'world-1',
    campaignId: 'campaign-1',
    displayName: 'Campaign',
    systemId: 'dnd5e-2024',
  },
}).room;
assert(confirmLiveRoomLifecyclePersistence(durable, 'persisted') === 'confirmed', 'Persisted cloud snapshots must be confirmed.');
assert(confirmLiveRoomLifecyclePersistence(durable, 'unavailable') === 'unavailable', 'Rejected cloud snapshots must fail closed.');
assert(confirmLiveRoomLifecyclePersistence(durable, undefined) === 'unavailable', 'Missing cloud persistence evidence must fail closed.');

const circuit = createLiveRoomDurabilityCircuit(() => new Date('2026-08-13T00:00:00.000Z'));
assert(circuit.isReady(), 'Durability circuit must begin ready.');
circuit.trip('room_lifecycle');
assert(!circuit.isReady(), 'A durable write failure must trip the circuit.');
assert(circuit.snapshot().failureKind === 'room_lifecycle', 'Circuit diagnostics must retain the first safe failure kind.');
circuit.trip('runtime_event');
assert(circuit.snapshot().failureKind === 'room_lifecycle', 'Later failures must not overwrite the original failure evidence.');

console.log('liveRoomDurabilityCircuitSmoke: lifecycle confirmation and fail-closed circuit passed');
