import { createLiveRoomTrafficGate } from './liveRoomTrafficGate.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gate = createLiveRoomTrafficGate();
const order: string[] = [];
let secondEntered = false;
let allowFirstRelease!: () => void;
let markFirstEntered!: () => void;
const firstMayRelease = new Promise<void>((resolve) => {
  allowFirstRelease = resolve;
});
const firstEntered = new Promise<void>((resolve) => {
  markFirstEntered = resolve;
});

const first = gate.enter().then(async (release) => {
  order.push('first-enter');
  markFirstEntered();
  await firstMayRelease;
  order.push('first-release');
  release();
  release();
});
const second = gate.enter().then((release) => {
  secondEntered = true;
  order.push('second-enter');
  release();
});

await firstEntered;
await Promise.resolve();
assert(!gate.isIdle(), 'Gate must report busy while traffic is active or waiting.');
assert(!secondEntered, 'A later request must not overtake an active request.');
allowFirstRelease();
await Promise.all([first, second]);
assert(order.join(',') === 'first-enter,first-release,second-enter', 'Room traffic must enter in FIFO order.');
assert(gate.isIdle(), 'Gate must return to idle after every request releases.');

console.log('liveRoomTrafficGateSmoke: FIFO entry, busy state, and idempotent release passed');
