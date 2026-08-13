import { EventEmitter } from 'node:events';

import type { Request, Response } from 'express';

import { createLiveRoomTrafficGate } from './liveRoomTrafficGate.js';
import { createLiveRoomTrafficMiddleware } from './liveRoomTrafficMiddleware.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitUntil(predicate: () => boolean, message: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await Promise.resolve();
  }
  throw new Error(message);
}

class FakeResponse extends EventEmitter {
  ended = false;

  end(): this {
    this.ended = true;
    this.emit('finish');
    return this;
  }
}

const gate = createLiveRoomTrafficGate();
const middleware = createLiveRoomTrafficMiddleware(gate);
const first = new FakeResponse();
const second = new FakeResponse();
const abandoned = new FakeResponse();
const final = new FakeResponse();
const order: string[] = [];

middleware({} as Request, first as unknown as Response, () => order.push('first'));
middleware({} as Request, second as unknown as Response, () => order.push('second'));
await waitUntil(() => order.length > 0, 'The first request was not admitted.');
assert(order.join(',') === 'first', 'Only the first request may be admitted initially.');

first.emit('close');
await Promise.resolve();
assert(order.join(',') === 'first', 'Disconnecting an admitted request must not release its still-running handler.');

first.end();
await waitUntil(() => order.length === 2, 'The second request was not admitted after the first response ended.');
assert(order.join(',') === 'first,second', 'The next request must wait until the active handler ends its response.');

middleware({} as Request, abandoned as unknown as Response, () => order.push('abandoned'));
middleware({} as Request, final as unknown as Response, () => order.push('final'));
abandoned.emit('close');
second.end();
await waitUntil(() => order.includes('final'), 'Later traffic did not pass the abandoned queued request.');
assert(!order.includes('abandoned'), 'A request disconnected while queued must never enter its handler.');
assert(order.at(-1) === 'final', 'A disconnected queued request must release its eventual lease for later traffic.');

final.end();
await waitUntil(() => gate.isIdle(), 'The gate did not return to idle.');
assert(gate.isIdle(), 'Every admitted or abandoned request must eventually release the gate.');

console.log('liveRoomTrafficMiddlewareSmoke: active and queued disconnect boundaries passed');
