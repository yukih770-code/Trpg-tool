import type { DndAttackIntent } from './dndAttackIntent.js';

function mintIntentId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Ordinary HTTP LAN origins may lack randomUUID but support getRandomValues.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** One deliberate action survives network errors, panel remounts and tab reloads.
 * The record is intent only; it carries no locally computed outcome or HP. */
export class DndAttackPendingIntent {
  private pending: DndAttackIntent | undefined;
  constructor(private readonly key: string, private readonly storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
    try {
      const p = JSON.parse(storage?.getItem(key) ?? 'null');
      if (p && ['intentId', 'actorCombatantId', 'targetCombatantId', 'actionId'].every((k) => typeof p[k] === 'string')
        && ['normal', 'advantage', 'disadvantage'].includes(p.mode)) this.pending = p;
    } catch { /* Storage may be unavailable; mounted retries still retain intent. */ }
  }
  read(): DndAttackIntent | undefined { return this.pending ? { ...this.pending } : undefined; }
  begin(input: Omit<DndAttackIntent, 'intentId'>, mint: () => string = mintIntentId): DndAttackIntent {
    if (this.pending) throw new Error('Resolve the pending attack before starting another.');
    this.pending = { ...input, intentId: mint() };
    try { this.storage?.setItem(this.key, JSON.stringify(this.pending)); } catch { /* In-memory retry remains available. */ }
    return this.read()!;
  }
  complete(intentId: string) {
    if (this.pending?.intentId !== intentId) return;
    this.pending = undefined;
    try { this.storage?.removeItem(this.key); } catch { /* Best effort storage. */ }
  }
}
