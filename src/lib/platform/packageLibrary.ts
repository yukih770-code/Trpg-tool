/**
 * Package Library / Joined Package Management Contract.
 *
 * AI-LANDMARK: PACKAGE_LIBRARY_CONTRACT_V1
 *
 * A PackageLibraryEntry describes how one user has joined, imported, created,
 * cloned, bundled, or drafted a package in their own content library.
 *
 * It is distinct from WorkshopPackageManifest:
 * - WorkshopPackageManifest = what the package is.
 * - PackageLibraryEntry = how this user owns/enables/manages that package.
 *
 * Scope:
 * - Contract/types/pure helpers only.
 * - No real subscription, unsubscribe, update, rollback, dependency resolution,
 *   backend, Workshop Builder, campaign UI, store migration, or write behavior.
 */
import type { WorkshopPackageId } from '../architecture/workshopPackage';
import type { ObjectAction } from './objectActions';

export type PackageLibraryEntryId = string;
export type CampaignInstanceId = string;

export type PackageLibrarySourceType =
  | 'subscribed'
  | 'imported'
  | 'created'
  | 'cloned'
  | 'bundled'
  | 'localDraft';

export type PackageLibraryStatus =
  | 'active'
  | 'disabled'
  | 'removed'
  | 'archived'
  | 'needsAttention';

export type PackageUpdateState =
  | 'upToDate'
  | 'updateAvailable'
  | 'localOnly'
  | 'unknown'
  | 'conflict'
  | 'missingDependency';

export interface PackageLibraryEntry {
  id: PackageLibraryEntryId;
  packageId: WorkshopPackageId;
  ownerUserId: string;
  sourceType: PackageLibrarySourceType;
  status: PackageLibraryStatus;
  installedVersion?: string;
  availableVersion?: string;
  updateState: PackageUpdateState;
  addedAt: string;
  updatedAt?: string;
  lastCheckedAt?: string;
  campaignIds?: CampaignInstanceId[];
  notes?: string;
}

export type PackageLibraryListFilter =
  | 'all'
  | 'active'
  | 'disabled'
  | 'hasUpdate'
  | 'needsAttention'
  | 'imported'
  | 'created'
  | 'archived';

export type PackageLibraryDetailSection =
  | 'summary'
  | 'version'
  | 'campaignUsage'
  | 'dependencies'
  | 'actions'
  | 'notes';

export type PackageCampaignUsageState =
  | 'enabled'
  | 'disabled'
  | 'requiresAttention'
  | 'unknown';

export interface PackageCampaignUsageRef {
  entryId: PackageLibraryEntryId;
  campaignId: CampaignInstanceId;
  state: PackageCampaignUsageState;
  enabledAt?: string;
  disabledAt?: string;
  note?: string;
}

export type PackageLibraryDangerousAction =
  | 'remove'
  | 'unsubscribe'
  | 'disable'
  | 'rollback'
  | 'update';

export interface PackageLibraryRiskCheck {
  action: PackageLibraryDangerousAction;
  check:
    | 'usedByCurrentCampaign'
    | 'hasDependentPackages'
    | 'affectsActorsOrNpcs'
    | 'affectsMapsOrHandouts'
    | 'affectsSessionLogReplay'
    | 'backupRecommended';
  required: boolean;
  note: string;
}

export const PACKAGE_LIBRARY_ACTIONS: ObjectAction[] = [
  'viewDetail',
  'enable',
  'disable',
  'remove',
  'unsubscribe',
  'update',
  'rollback',
  'addToCampaign',
  'removeFromCampaign',
];

export const PACKAGE_LIBRARY_DANGEROUS_ACTIONS: PackageLibraryDangerousAction[] = [
  'remove',
  'unsubscribe',
  'disable',
  'rollback',
  'update',
];

export const PACKAGE_LIBRARY_VIEW_FILTERS: PackageLibraryListFilter[] = [
  'all',
  'active',
  'disabled',
  'hasUpdate',
  'needsAttention',
  'imported',
  'created',
  'archived',
];

export const PACKAGE_LIBRARY_RISK_CHECKS: PackageLibraryRiskCheck[] = [
  {
    action: 'remove',
    check: 'usedByCurrentCampaign',
    required: true,
    note: 'Removing a package should first check whether any campaign currently uses it.',
  },
  {
    action: 'unsubscribe',
    check: 'hasDependentPackages',
    required: true,
    note: 'Unsubscribe must check dependency chains before the remote subscription is removed.',
  },
  {
    action: 'disable',
    check: 'affectsActorsOrNpcs',
    required: true,
    note: 'Disabling a package may affect actors, NPCs, maps, handouts, or rules used in a campaign.',
  },
  {
    action: 'rollback',
    check: 'affectsSessionLogReplay',
    required: true,
    note: 'Rollback can affect historical replay or package-version assumptions.',
  },
  {
    action: 'update',
    check: 'backupRecommended',
    required: true,
    note: 'Update should offer a backup or restore point before changing installed content.',
  },
];

export function isPackageLibraryEntryActive(entry: PackageLibraryEntry): boolean {
  return entry.status === 'active';
}

export function isPackageLibraryEntryEnabledInCampaign(
  entry: PackageLibraryEntry,
  campaignId: CampaignInstanceId,
): boolean {
  return entry.status === 'active' && Boolean(entry.campaignIds?.includes(campaignId));
}

export function packageLibraryEntryNeedsAttention(entry: PackageLibraryEntry): boolean {
  return (
    entry.status === 'needsAttention' ||
    entry.updateState === 'conflict' ||
    entry.updateState === 'missingDependency'
  );
}

export function packageLibraryEntryHasUpdate(entry: PackageLibraryEntry): boolean {
  return entry.updateState === 'updateAvailable';
}

export function packageLibraryEntryMatchesFilter(
  entry: PackageLibraryEntry,
  filter: PackageLibraryListFilter,
): boolean {
  switch (filter) {
    case 'active':
      return entry.status === 'active';
    case 'disabled':
      return entry.status === 'disabled';
    case 'hasUpdate':
      return packageLibraryEntryHasUpdate(entry);
    case 'needsAttention':
      return packageLibraryEntryNeedsAttention(entry);
    case 'imported':
      return entry.sourceType === 'imported';
    case 'created':
      return entry.sourceType === 'created' || entry.sourceType === 'localDraft';
    case 'archived':
      return entry.status === 'archived';
    case 'all':
    default:
      return true;
  }
}
