import { cpSync } from 'node:fs';

// tsc does not copy SQL. Compiled migration tooling resolves this directory
// beside its own module, so release artifacts must retain these existing files.
cpSync(new URL('../server/db/migrations/', import.meta.url), new URL('../dist-server/server/db/migrations/', import.meta.url), { recursive: true });
