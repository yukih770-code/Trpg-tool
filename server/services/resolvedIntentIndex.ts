import type { RoomRuntimeLogEvent } from '../../src/lib/platform/roomRuntimeLogTypes.js';
import { RuntimeResolutionError } from './applyRuntimeResolution.js';

/** Single-process T7 authority. Cache accelerates reads; history owns correctness. */
export class ResolvedIntentIndex {
  private readonly completed = new Map<string, RoomRuntimeLogEvent>();
  private readonly pending = new Map<string, { fingerprint: string; result: Promise<RoomRuntimeLogEvent> }>();
  private readonly roomTails = new Map<string, Promise<unknown>>();
  constructor(private readonly capacity = 512) {}

  async run(input: {
    roomId: string; sessionId: string; memberId: string; intentId: string; fingerprint: string;
    history: () => readonly RoomRuntimeLogEvent[]; execute: () => Promise<RoomRuntimeLogEvent>;
  }): Promise<{ event: RoomRuntimeLogEvent; replayed: boolean }> {
    const key = JSON.stringify([input.roomId, input.sessionId, input.memberId, input.intentId]);
    const assertFingerprint = (fingerprint: unknown) => {
      if (fingerprint !== input.fingerprint) throw new RuntimeResolutionError('intent_reuse_mismatch', 409);
    };
    const pending = this.pending.get(key);
    if (pending) {
      assertFingerprint(pending.fingerprint);
      return { event: await pending.result, replayed: true };
    }
    const cached = this.completed.get(key);
    const prior = cached ?? input.history().find((event) => {
      const p = event.payload as Record<string, unknown> | undefined;
      return event.kind === 'combat.attack_resolved' && event.authorMemberId === input.memberId
        && p?.sessionId === input.sessionId && p.intentId === input.intentId;
    });
    if (prior) {
      assertFingerprint((prior.payload as Record<string, unknown>).fingerprint);
      this.remember(key, prior);
      return { event: prior, replayed: true };
    }
    // Reserve synchronously before any async work; separate intents also queue
    // by room so neither resolves against another attack's unconfirmed state.
    const previous = this.roomTails.get(input.roomId) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(input.execute);
    this.pending.set(key, { fingerprint: input.fingerprint, result });
    this.roomTails.set(input.roomId, result);
    try {
      const event = await result;
      this.remember(key, event);
      return { event, replayed: false };
    } finally {
      this.pending.delete(key);
      if (this.roomTails.get(input.roomId) === result) this.roomTails.delete(input.roomId);
    }
  }

  private remember(key: string, event: RoomRuntimeLogEvent) {
    this.completed.delete(key);
    if (this.capacity <= 0) return;
    this.completed.set(key, event);
    while (this.completed.size > this.capacity) this.completed.delete(this.completed.keys().next().value!);
  }
}
