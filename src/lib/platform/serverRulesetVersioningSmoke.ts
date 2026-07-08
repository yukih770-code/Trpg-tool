/**
 * Server ruleset versioning + soft update contract smoke (P5.S1) — frontend-only,
 * no test dependency.
 *
 * AI-LANDMARK: SERVER_RULESET_VERSIONING_SMOKE_V1
 *
 * A tiny, dependency-free self-check for the P5.S1 contract helpers. It validates
 * the product-critical invariants: safe clean routes may auto-refresh; dirty
 * creation/edit routes and snapshot-locked runtime routes may NOT; breaking changes
 * produce a blocking/warning notice; and an old runtime snapshot is still
 * representable after the server publishes a newer version. Not wired into the app;
 * call `runServerRulesetVersioningSmoke()` from a scratch script or devtools.
 * No network, no Postgres, no server database env vars.
 */

import {
  classifyRulesetChange,
  summarizeRulesetCompatibility,
  isRuntimeSnapshotCurrent,
  type RuntimeRulesetSnapshot,
} from './serverRulesetVersioning';
import {
  shouldAutoRefreshRoute,
  createSoftUpdateNotice,
  resolveRoomEntryMismatch,
  type PageUpdateGuardState,
} from './softUpdatePolicy';

export interface ServerRulesetSmokeCase {
  name: string;
  pass: boolean;
}

export interface ServerRulesetSmokeReport {
  total: number;
  passed: number;
  failed: number;
  cases: ServerRulesetSmokeCase[];
}

function guard(partial: Partial<PageUpdateGuardState>): PageUpdateGuardState {
  return {
    routeId: 'route',
    policy: 'safeAutoRefresh',
    hasDirtyDraft: false,
    activeDraftIds: [],
    ...partial,
  };
}

export function runServerRulesetVersioningSmoke(): ServerRulesetSmokeReport {
  // A safe, clean, refreshable route.
  const safeCleanRoute = guard({ routeId: 'server-home', policy: 'safeAutoRefresh' });
  // A character-creation route with a dirty draft.
  const dirtyCreationRoute = guard({
    routeId: 'character-create',
    policy: 'deferUntilIdle',
    hasDirtyDraft: true,
    activeDraftIds: ['draft_char_1'],
  });
  // A runtime route bound to a snapshot.
  const runtimeRoute = guard({
    routeId: 'room-runtime',
    policy: 'snapshotLocked',
    lockedRuntimeRulesetVersionId: 'ver_1',
  });

  const oldRuntimeSnapshot: RuntimeRulesetSnapshot = {
    roomId: 'room_1',
    campaignId: 'campaign_1',
    serverId: 'server_1',
    serverRulesetVersionId: 'ver_1',
    enabledPackVersionIds: ['pack_core@1'],
    lockedAt: '2026-07-01T00:00:00.000Z',
  };

  const breakingNotice = createSoftUpdateNotice('breaking', guard({ routeId: 'compendium-edit', policy: 'deferUntilIdle', hasDirtyDraft: true, activeDraftIds: ['draft_pack'] }));
  const refreshNotice = createSoftUpdateNotice('refreshRequired', safeCleanRoute);
  const lockedNotice = createSoftUpdateNotice('breaking', runtimeRoute);

  const cases: ServerRulesetSmokeCase[] = [
    // Auto-refresh guard
    { name: 'safeCleanRoute.autoRefresh', pass: shouldAutoRefreshRoute(safeCleanRoute) === true },
    { name: 'dirtyCreationRoute.noAutoRefresh', pass: shouldAutoRefreshRoute(dirtyCreationRoute) === false },
    { name: 'runtimeSnapshotRoute.noAutoRefresh', pass: shouldAutoRefreshRoute(runtimeRoute) === false },

    // Change classification
    { name: 'additiveOnly.safe', pass: classifyRulesetChange({ packVersionsAdded: true }) === 'safe' },
    { name: 'compatibleKnob.refreshRequired', pass: classifyRulesetChange({ ruleKnobsChangedCompatible: true }) === 'refreshRequired' },
    { name: 'templateChange.breaking', pass: classifyRulesetChange({ templateChanged: true }) === 'breaking' },
    { name: 'packRemoval.breaking', pass: classifyRulesetChange({ packVersionsRemovedOrDowngraded: true }) === 'breaking' },
    { name: 'incompatibleKnob.breaking', pass: classifyRulesetChange({ ruleKnobsChangedIncompatible: true }) === 'breaking' },
    { name: 'compatibility.breaking.requiresHostReview', pass: summarizeRulesetCompatibility({ templateChanged: true }).requiresHostReview === true },
    { name: 'compatibility.safe.noRoomReload', pass: summarizeRulesetCompatibility({ packVersionsAdded: true }).requiresRoomReload === false },

    // Soft update notices
    { name: 'breaking.dirty.blockingAndSavesDraft', pass: breakingNotice.severity === 'blocking' && breakingNotice.actions.includes('saveDraftThenRefresh') && !breakingNotice.actions.includes('refreshToLatest') },
    { name: 'refreshRequired.clean.warningRefresh', pass: refreshNotice.severity === 'warning' && refreshNotice.actions.includes('refreshToLatest') },
    { name: 'snapshotLocked.staysOnSnapshot', pass: lockedNotice.severity === 'info' && lockedNotice.actions.length === 0 },

    // Old snapshot remains representable + detectable as stale after latest changes
    { name: 'oldSnapshot.stillCurrentVsSelf', pass: isRuntimeSnapshotCurrent(oldRuntimeSnapshot, 'ver_1') === true },
    { name: 'oldSnapshot.staleVsLatest', pass: isRuntimeSnapshotCurrent(oldRuntimeSnapshot, 'ver_2') === false },

    // Entry mismatch resolution
    { name: 'entry.liveRoom.loadsSnapshot', pass: resolveRoomEntryMismatch({ runtimeSnapshotVersionId: 'ver_1', latestServerRulesetVersionId: 'ver_2' }) === 'loadSnapshotAndEnter' },
    { name: 'entry.divergedBreaking.hostMigration', pass: resolveRoomEntryMismatch({ campaignSnapshotVersionId: 'ver_1', latestServerRulesetVersionId: 'ver_2', impact: 'breaking' }) === 'hostMigrationRequired' },
    { name: 'entry.dirtyCaller.savesDraft', pass: resolveRoomEntryMismatch({ latestServerRulesetVersionId: 'ver_2', hasDirtyDraft: true }) === 'saveDraftThenRefresh' },
  ];

  const passed = cases.filter((c) => c.pass).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}
