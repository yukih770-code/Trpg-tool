/**
 * Soft Update Policy — shared type contract (P5.S1). Frontend-only.
 *
 * AI-LANDMARK: SOFT_UPDATE_POLICY_CONTRACT_V1
 *
 * A dependency-free contract for how a client reacts when the World Server
 * publishes a new ruleset version WHILE the user is on some route. The product
 * rule is: updates are SOFT by default — a small top banner — and the client
 * NEVER hard-refreshes back to home while the user is editing. Auto-refresh only
 * happens when the current route is safe, has no dirty draft, and declares itself
 * refreshable. Running/preparing rooms keep their snapshot.
 *
 * Types + pure, deterministic helpers ONLY. No React, no server, no Postgres, no
 * browser API, no server database env vars. See
 * docs/architecture/SERVER_RULESET_VERSIONING_SOFT_UPDATE_UX_V1.md.
 */

import type { RulesetChangeImpact } from './serverRulesetVersioning';

// ── Route + guard state ──────────────────────────────────────────────────────

/**
 * How a given route wants to handle a server update.
 *  - safeAutoRefresh: static/read-only route with no mutable state; may reload when clean.
 *  - deferUntilIdle: route may reload later, but only once the user is idle / not editing.
 *  - snapshotLocked: route is bound to a snapshot (runtime room / locked prep) and must
 *    never auto-refresh to a newer server version.
 */
export type RouteUpdatePolicy =
  | 'safeAutoRefresh'
  | 'deferUntilIdle'
  | 'snapshotLocked';

export type SoftUpdateBannerSeverity =
  | 'info'
  | 'warning'
  | 'blocking';

/**
 * What a mismatch/soft-update notice may offer. These are intents, not UI:
 *  - loadSnapshotAndEnter: enter a room/campaign under its locked snapshot.
 *  - refreshToLatest: reload the current route at the latest server version.
 *  - saveDraftThenRefresh: persist the in-progress draft, then refresh.
 *  - returnToServerHome: go back to the server home (NOT the global homepage).
 *  - hostMigrationRequired: a breaking change needs the host to review/migrate.
 */
export type VersionMismatchAction =
  | 'loadSnapshotAndEnter'
  | 'refreshToLatest'
  | 'saveDraftThenRefresh'
  | 'returnToServerHome'
  | 'hostMigrationRequired';

/**
 * Snapshot of the current route's mutable state, used to decide update behavior.
 * `activeDraftIds` covers character creation, campaign creation, personal settings,
 * log editing, map/asset editing, compendium editing, and AI import drafts.
 */
export interface PageUpdateGuardState {
  routeId: string;
  policy: RouteUpdatePolicy;
  hasDirtyDraft: boolean;
  activeDraftIds: string[];
  loadedServerRulesetVersionId?: string;
  lockedRuntimeRulesetVersionId?: string;
}

export interface SoftUpdateNotice {
  severity: SoftUpdateBannerSeverity;
  title: string;
  message: string;
  actions: VersionMismatchAction[];
}

// ── Pure helpers ─────────────────────────────────────────────────────────────

/** True only when the route explicitly opts in AND carries no mutable/snapshot state. */
export function isRouteDirty(state: PageUpdateGuardState): boolean {
  return state.hasDirtyDraft || state.activeDraftIds.length > 0;
}

/**
 * Auto-refresh is allowed ONLY when the route declares itself safe, has no dirty
 * draft, and is not bound to a runtime snapshot. deferUntilIdle and snapshotLocked
 * never auto-refresh. This is the core "don't yank the page out from under an
 * editing user" guarantee.
 */
export function shouldAutoRefreshRoute(state: PageUpdateGuardState): boolean {
  if (state.policy !== 'safeAutoRefresh') return false;
  if (isRouteDirty(state)) return false;
  if (state.lockedRuntimeRulesetVersionId) return false;
  return true;
}

/**
 * Build the soft-update notice for the CURRENT user's page given the impact of the
 * server change and the page's guard state. Never returns an action that would
 * discard a dirty draft: dirty routes get `saveDraftThenRefresh`, never a bare
 * refresh. Snapshot-locked routes (running/preparing tables) stay on their snapshot
 * with an informational notice.
 */
export function createSoftUpdateNotice(
  impact: RulesetChangeImpact,
  guard: PageUpdateGuardState,
): SoftUpdateNotice {
  const dirty = isRouteDirty(guard);

  // Snapshot-locked (in a running/preparing table): keep the snapshot, inform only.
  if (guard.policy === 'snapshotLocked' || guard.lockedRuntimeRulesetVersionId) {
    return {
      severity: 'info',
      title: 'Server updated',
      message:
        'This table keeps its current ruleset snapshot. The update applies to new tables; nothing here changes.',
      actions: [],
    };
  }

  if (impact === 'breaking') {
    return {
      severity: 'blocking',
      title: 'Breaking server update',
      message: dirty
        ? 'A breaking ruleset change was published. Save your draft, then a host review is required before continuing on the new version.'
        : 'A breaking ruleset change was published and requires host review before you continue on the new version.',
      actions: dirty
        ? ['saveDraftThenRefresh', 'hostMigrationRequired', 'returnToServerHome']
        : ['hostMigrationRequired', 'refreshToLatest', 'returnToServerHome'],
    };
  }

  if (impact === 'refreshRequired') {
    return {
      severity: 'warning',
      title: 'Server updated',
      message: dirty
        ? 'The server ruleset changed. Save your draft to load the new version when you are ready.'
        : 'The server ruleset changed. Refresh to load the latest version.',
      actions: dirty ? ['saveDraftThenRefresh'] : ['refreshToLatest'],
    };
  }

  // safe / additive
  return {
    severity: 'info',
    title: 'Server updated',
    message: dirty
      ? 'A minor server update is available. Your work is safe; it will apply next time you reload.'
      : 'A minor server update is available.',
    actions: dirty ? [] : ['refreshToLatest'],
  };
}

/**
 * Decide what a player ENTERING a room/campaign should do given the target's
 * snapshot vs the server's latest version. Running/prepared tables enter under
 * their snapshot; a divergent-but-non-breaking target offers a refresh; a dirty
 * caller never loses its draft.
 */
export function resolveRoomEntryMismatch(input: {
  runtimeSnapshotVersionId?: string;
  campaignSnapshotVersionId?: string;
  latestServerRulesetVersionId: string;
  impact?: RulesetChangeImpact;
  hasDirtyDraft?: boolean;
}): VersionMismatchAction {
  // A live room is authoritative on its locked snapshot: always enter under it.
  if (input.runtimeSnapshotVersionId) return 'loadSnapshotAndEnter';

  const target = input.campaignSnapshotVersionId;
  const diverged = !!target && target !== input.latestServerRulesetVersionId;

  if (diverged && input.impact === 'breaking') return 'hostMigrationRequired';
  if (input.hasDirtyDraft) return 'saveDraftThenRefresh';
  if (diverged) return 'loadSnapshotAndEnter';
  return 'refreshToLatest';
}
