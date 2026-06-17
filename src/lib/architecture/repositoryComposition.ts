/**
 * Platform Repository composition root.
 *
 * AI-LANDMARK: PLATFORM_REPOSITORY_COMPOSITION_ROOT_V1
 *
 * THE single place that selects which repository implementation backs the
 * platform ecosystem layer. Pages/components import the `platformRepo` singleton
 * from here (never `new` a repository, never import a concrete mock map).
 *
 * Swap path (one edit, no UI change): replace `createMockRepositories()` with a
 * `createLocalRepositories()` / `createApiRepositories()` / `createHybrid...()`
 * builder. The interfaces (./repositories) stay identical, so call sites do not
 * change.
 *
 * Boundaries:
 *   MockRepository    — in-memory EntityGraph seed + mock payloads (current).
 *   LocalRepository   — localStorage / IndexedDB (private-first persistence).
 *   ApiRepository     — B0 backend over OpenAPI (future; async — see §sync below).
 *   GraphDbRepository — graph DB read-model projection (only past the A2 triggers).
 *   HybridRepository  — composes Api/Local for payload+business, GraphDb for
 *                       graph reads, behind this same interface.
 *
 * Sync/async: the mock/local phase is SYNCHRONOUS to keep the current render path
 * unchanged. The viewer-aware read funnel is `./repositoryServices`
 * (`platformDataService`); when ApiRepository lands (A11) the SERVICE becomes the
 * single place that turns async, a bounded change at its call sites — not a UI
 * rewrite.
 */
import type { PlatformRepositories } from './repositories';
import { createMockRepositories } from './mockRepositories';

/** Implementation selection. Mock now; Local/Api/GraphDb/Hybrid later. */
function selectPlatformRepositories(): PlatformRepositories {
  // A7: mock backing only. A11 swaps this for an Api/Local/Hybrid builder.
  return createMockRepositories();
}

/** The single default platform repositories instance. */
export const platformRepositories: PlatformRepositories = selectPlatformRepositories();

/**
 * Back-compat alias used across the platform components.
 * Prefer `platformRepositories` in new code.
 */
export const platformRepo: PlatformRepositories = platformRepositories;
