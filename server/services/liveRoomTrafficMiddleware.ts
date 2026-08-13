import type { RequestHandler } from 'express';

import type { LiveRoomTrafficGate } from './liveRoomTrafficGate.js';

/**
 * Holds the FIFO lease until the admitted handler reaches its response end.
 * A connection that closes while still queued is skipped as soon as its lease
 * arrives, while an admitted async handler is never released by disconnect
 * alone because it may still be mutating and persisting room authority.
 */
export function createLiveRoomTrafficMiddleware(gate: LiveRoomTrafficGate): RequestHandler {
  return (_req, res, next) => {
    let admitted = false;
    let closedBeforeAdmission = false;
    let releaseGate: (() => void) | undefined;

    res.once('close', () => {
      if (admitted) return;
      closedBeforeAdmission = true;
      releaseGate?.();
    });

    void gate.enter().then((release) => {
      releaseGate = release;
      if (closedBeforeAdmission) {
        release();
        return;
      }

      admitted = true;
      const originalEnd = res.end;
      res.end = ((...args: unknown[]) => {
        try {
          return Reflect.apply(originalEnd, res, args) as typeof res;
        } finally {
          release();
        }
      }) as typeof res.end;
      res.once('finish', release);
      next();
    }).catch(next);
  };
}
