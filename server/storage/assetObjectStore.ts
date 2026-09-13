import { mkdir, open, readFile, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';

/** Bytes only. Metadata and ownership remain in the existing Asset repository. */
export interface AssetObjectStore {
  put(key: string, bytes: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

export function createFileAssetObjectStore(directory: string): AssetObjectStore {
  const root = resolve(directory);
  const location = (key: string) => {
    if (!/^[0-9a-f-]{36}\.webp$/.test(key)) throw new Error('invalid_object_key');
    return join(root, key);
  };
  return {
    async put(key, bytes) {
      const target = location(key);
      await mkdir(root, { recursive: true });
      const file = await open(target, 'wx', 0o600);
      try { await file.writeFile(bytes); await file.sync(); }
      finally { await file.close(); }
    },
    read: key => readFile(location(key)),
    async remove(key) { await unlink(location(key)).catch(error => { if (error.code !== 'ENOENT') throw error; }); },
  };
}
