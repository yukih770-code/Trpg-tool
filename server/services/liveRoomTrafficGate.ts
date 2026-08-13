export interface LiveRoomTrafficGate {
  enter(): Promise<() => void>;
  isIdle(): boolean;
}

/**
 * A small FIFO gate around live-room HTTP traffic. It keeps aggregate snapshot
 * mutations from overlapping and prevents reads from observing an unconfirmed
 * snapshot while its required durable write is in flight.
 */
export function createLiveRoomTrafficGate(): LiveRoomTrafficGate {
  let tail = Promise.resolve();
  let activeOrWaiting = 0;

  return {
    async enter() {
      activeOrWaiting += 1;
      let releaseCurrent!: () => void;
      const current = new Promise<void>((resolve) => {
        releaseCurrent = resolve;
      });
      const previous = tail.catch(() => undefined);
      tail = previous.then(() => current);
      await previous;

      let released = false;
      return () => {
        if (released) return;
        released = true;
        activeOrWaiting -= 1;
        releaseCurrent();
      };
    },
    isIdle: () => activeOrWaiting === 0,
  };
}
