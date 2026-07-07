/**
 * Local persistence adapter for P5 identity / ownership registries (P5.5).
 *
 * AI-LANDMARK: LOCAL_PERSISTENCE_ADAPTER_V1
 *
 * ONE shared, vendor-neutral implementation of the localStorage-JSON pattern
 * that P5.1/P5.2/P5.3 each duplicated (window guard + try/catch parse +
 * validator + in-memory mirror). Consumers: `localUserIdentity`,
 * `actorVaultOwnership`, `campaignOwnership`.
 *
 * Boundary note:
 * - This is the LOCAL/OFFLINE persistence boundary for P5 identity and
 *   ownership metadata. It is NOT the final cloud persistence layer: future
 *   Postgres / cloud adapters sit behind the repository boundaries (P4 /
 *   `cloudBackendAdapters`), never behind this module.
 * - It is also distinct from `storageAdapterBoundaryTypes` (v0), which is the
 *   Room Server storage-domain contract; this module is client-side only.
 * - It preserves existing localStorage keys exactly — callers keep their own
 *   key constants; nothing is renamed and no data migration happens here.
 *
 * Guarantees:
 * - Browser-safe and SSR-safe (`typeof window` guarded).
 * - NEVER throws to app startup: parse/quota/access failures degrade to the
 *   in-memory fallback and offline play continues.
 * - No React, no vendor SDK, no app-store imports.
 */

// ── Storage availability ─────────────────────────────────────────────────────

function storageOrNull(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Some privacy modes throw on the accessor itself.
    return null;
  }
}

/** True when localStorage is usable in this environment. */
export function isLocalStorageAvailable(): boolean {
  return storageOrNull() !== null;
}

// ── Diagnostics (module-local counters; no UI) ───────────────────────────────

const activeKeys = new Set<string>();
let parseFailureCount = 0;
let writeFailureCount = 0;

export interface LocalPersistenceDiagnostics {
  storageAvailable: boolean;
  /** True when reads/writes are being served from memory only. */
  fallbackMode: boolean;
  /** Keys this adapter has been asked to manage in this session. */
  activeKeys: string[];
  parseFailureCount: number;
  writeFailureCount: number;
}

/** Read-only adapter health snapshot (diagnostic use only; never in normal UI). */
export function getLocalPersistenceDiagnostics(): LocalPersistenceDiagnostics {
  const storageAvailable = isLocalStorageAvailable();
  return {
    storageAvailable,
    fallbackMode: !storageAvailable,
    activeKeys: [...activeKeys],
    parseFailureCount,
    writeFailureCount,
  };
}

// ── Low-level JSON primitives ────────────────────────────────────────────────

/**
 * Read + parse + validate a JSON record. Returns `fallback` when the key is
 * missing, storage is unavailable, parsing fails, or validation fails. Never
 * throws. Corrupt data self-heals on the caller's next write.
 */
export function readJson<T>(
  key: string,
  validate: (value: unknown) => value is T,
  fallback: () => T,
): T {
  activeKeys.add(key);
  const storage = storageOrNull();
  if (!storage) return fallback();
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback();
    const parsed: unknown = JSON.parse(raw);
    if (validate(parsed)) return parsed;
    parseFailureCount += 1;
    return fallback();
  } catch {
    parseFailureCount += 1;
    return fallback();
  }
}

/**
 * Serialize + persist a JSON record. Returns false on quota/access/serialize
 * failure (callers keep working from their in-memory value). Never throws.
 */
export function writeJson<T>(key: string, value: T): boolean {
  activeKeys.add(key);
  const storage = storageOrNull();
  if (!storage) {
    writeFailureCount += 1;
    return false;
  }
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    writeFailureCount += 1;
    return false;
  }
}

/** Remove a key. Never throws. */
export function removeJson(key: string): void {
  const storage = storageOrNull();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore — removal failure must never break offline play.
  }
}

// ── Typed store factory (JSON record + in-memory mirror) ────────────────────

export interface LocalJsonStoreOptions<T> {
  /** Existing localStorage key — NEVER renamed by this adapter. */
  key: string;
  /** Value used when nothing valid is stored. */
  fallback: () => T;
  /** Schema guard (schemaVersion checks live inside the caller's validator). */
  validate: (value: unknown) => value is T;
  /**
   * Whether the fallback value is cached in the memory mirror on a miss.
   * - true (registries): a missing map becomes THE working map immediately.
   * - false (nullable records): keep re-checking storage until a real value
   *   exists, matching the P5.1 local-user semantics.
   * Default: true.
   */
  cacheFallback?: boolean;
}

export interface LocalJsonStore<T> {
  readonly key: string;
  /**
   * Memory-mirrored read: returns the mirrored value (BY REFERENCE — callers
   * that mutate it must call write() to persist) or reads+validates storage.
   */
  read(): T;
  /** Persist a value and update the mirror. Returns the value for chaining. */
  write(value: T): T;
  /** Clear both the mirror and the stored key. */
  clear(): void;
}

/**
 * Create a typed local JSON store with the shared mirror semantics used by the
 * P5 modules: reads are stable within a session even when localStorage is
 * unavailable (private mode, quota, SSR), and writes never throw.
 */
export function createLocalJsonStore<T>(options: LocalJsonStoreOptions<T>): LocalJsonStore<T> {
  const { key, fallback, validate, cacheFallback = true } = options;
  let mirror: { value: T } | null = null;

  return {
    key,
    read(): T {
      if (mirror) return mirror.value;
      let missed = false;
      const value = readJson(key, validate, () => {
        missed = true;
        return fallback();
      });
      if (!missed || cacheFallback) mirror = { value };
      return value;
    },
    write(value: T): T {
      mirror = { value };
      writeJson(key, value);
      return value;
    },
    clear(): void {
      mirror = null;
      removeJson(key);
    },
  };
}
