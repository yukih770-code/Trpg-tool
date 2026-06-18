/**
 * Object Management Action Contract.
 *
 * AI-LANDMARK: OBJECT_MANAGEMENT_ACTION_CONTRACT_V1
 *
 * A10.7 formalizes a platform-wide availability model for object management
 * actions. It does not execute actions. UI asks for availability; Repository /
 * Service layers remain responsible for projection and future write behavior.
 *
 * Scope:
 * - No real delete, duplicate, share, publish, unsubscribe, remove, enable,
 *   disable, update, rollback, addToCampaign, or changeVisibility behavior.
 * - No Campaign Entry execution; CampaignEntryAction is intentionally separate
 *   from ObjectAction and aligns with campaignFlow.ts.
 * - No store, schema, migration, backend, auth, runtime, rule-engine, or UI
 *   integration change.
 */
import type { EntityType } from '../architecture/entityGraph';
import type { ProjectionType, ViewerContext, ViewerRole } from '../architecture/projection';

// ─── Object management actions ───────────────────────────────────────────────

export type ObjectAction =
  | 'viewDetail'
  | 'openInProfile'
  | 'create'
  | 'edit'
  | 'duplicate'
  | 'delete'
  | 'archive'
  | 'restore'
  | 'import'
  | 'export'
  | 'share'
  | 'copyLink'
  | 'publish'
  | 'unpublish'
  | 'favorite'
  | 'unfavorite'
  | 'join'
  | 'unsubscribe'
  | 'remove'
  | 'enable'
  | 'disable'
  | 'update'
  | 'rollback'
  | 'addToCampaign'
  | 'removeFromCampaign'
  | 'changeVisibility'
  // Future runtime/context action. Contract-only; not an entry action and not
  // implemented in this round.
  | 'useInSession'
  // Object-specific convenience actions, still availability-only.
  | 'rename'
  | 'replace'
  | 'useAsPortrait'
  | 'useAsCover'
  | 'publishAsFanWork'
  | 'addToWorkshopPackage';

/**
 * Campaign Entry Actions are not ordinary object-management actions.
 * They belong to Campaign Detail / Entry Prep and align with campaignFlow.ts.
 */
export type CampaignEntryAction =
  | 'selectActorForCampaign'
  | 'createActorForCampaign'
  | 'selectEntryRole'
  | 'enterAsPlayerCharacter'
  | 'enterAsHost'
  | 'enterCampaign';

export type ObjectActionState =
  | 'enabled'
  | 'disabled'
  | 'hidden'
  | 'comingSoon'
  | 'requiresOwner'
  | 'requiresBackend'
  | 'dangerous';

export interface ObjectActionAvailability {
  action: ObjectAction;
  state: ObjectActionState;
  label: string;
  reason?: string;
  requiresConfirmation?: boolean;
  destructive?: boolean;
}

// ─── Surfaces / targets / context ────────────────────────────────────────────

export type ObjectActionSurface =
  | 'listCard'
  | 'detailPage'
  | 'personalHub'
  | 'userProfile'
  | 'systemWorkspace'
  | 'workshopBrowse'
  | 'packageLibrary'
  | 'fanPlaza'
  | 'campaignWorkspace'
  | 'accountMenu'
  | 'advancedMenu';

/**
 * EntityType covers current graph-backed objects. Extra strings are contract-only
 * platform targets not yet represented as EntityType.
 */
export type ObjectActionTargetType =
  | EntityType
  | 'campaignInstance'
  | 'packageLibraryEntry'
  | 'collection'
  | 'userProfile';

export interface ObjectActionContext {
  surface: ObjectActionSurface;
  viewerContext?: ViewerContext;
  projection?: ProjectionType;
  /** Explicit owner override for call sites that already know ownership. */
  isOwner?: boolean;
  /** Enables campaign-resource actions such as addToCampaign. */
  isCampaignContext?: boolean;
  /** Enables PackageLibraryEntry management actions. */
  isPackageLibraryContext?: boolean;
  locale?: 'zh-CN' | 'en';
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<ObjectAction, { zh: string; en: string }> = {
  viewDetail: { zh: '查看详情', en: 'View detail' },
  openInProfile: { zh: '在主页中打开', en: 'Open in profile' },
  create: { zh: '创建', en: 'Create' },
  edit: { zh: '编辑', en: 'Edit' },
  duplicate: { zh: '复制', en: 'Duplicate' },
  delete: { zh: '删除', en: 'Delete' },
  archive: { zh: '归档', en: 'Archive' },
  restore: { zh: '恢复', en: 'Restore' },
  import: { zh: '导入', en: 'Import' },
  export: { zh: '导出', en: 'Export' },
  share: { zh: '分享', en: 'Share' },
  copyLink: { zh: '复制链接', en: 'Copy link' },
  publish: { zh: '发布', en: 'Publish' },
  unpublish: { zh: '取消发布', en: 'Unpublish' },
  favorite: { zh: '收藏', en: 'Favorite' },
  unfavorite: { zh: '取消收藏', en: 'Unfavorite' },
  join: { zh: '加入', en: 'Join' },
  unsubscribe: { zh: '取消订阅', en: 'Unsubscribe' },
  remove: { zh: '移除', en: 'Remove' },
  enable: { zh: '启用', en: 'Enable' },
  disable: { zh: '禁用', en: 'Disable' },
  update: { zh: '更新', en: 'Update' },
  rollback: { zh: '回滚', en: 'Roll back' },
  addToCampaign: { zh: '加入战役', en: 'Add to campaign' },
  removeFromCampaign: { zh: '移出战役', en: 'Remove from campaign' },
  changeVisibility: { zh: '修改可见性', en: 'Change visibility' },
  useInSession: { zh: '在 Session 中使用', en: 'Use in session' },
  rename: { zh: '重命名', en: 'Rename' },
  replace: { zh: '替换', en: 'Replace' },
  useAsPortrait: { zh: '设为立绘', en: 'Use as portrait' },
  useAsCover: { zh: '设为封面', en: 'Use as cover' },
  publishAsFanWork: { zh: '发布为同人作品', en: 'Publish as fan work' },
  addToWorkshopPackage: { zh: '加入内容包', en: 'Add to package' },
};

// ─── Rule model ──────────────────────────────────────────────────────────────

type ActionRule = {
  action: ObjectAction;
  viewerRoles: ViewerRole[];
  surfaces?: ObjectActionSurface[];
  state: ObjectActionState;
  destructive?: boolean;
  requiresConfirmation?: boolean;
  reason?: string;
  requiresCampaignContext?: boolean;
  requiresPackageLibraryContext?: boolean;
};

const OWNER_ROLES: ViewerRole[] = ['owner', 'admin'];
const PUBLIC_ROLES: ViewerRole[] = ['anonymous', 'player', 'campaignMember', 'gm', 'owner', 'admin'];
const AUTHENTICATED_ROLES: ViewerRole[] = ['player', 'campaignMember', 'gm', 'owner', 'admin'];
const CAMPAIGN_MANAGER_ROLES: ViewerRole[] = ['owner', 'gm', 'admin'];

const available = (
  action: ObjectAction,
  viewerRoles: ViewerRole[],
  surfaces?: ObjectActionSurface[],
): ActionRule => ({ action, viewerRoles, surfaces, state: 'enabled' });

const soon = (
  action: ObjectAction,
  viewerRoles: ViewerRole[],
  surfaces?: ObjectActionSurface[],
  reason = 'Reserved for a later implementation.',
): ActionRule => ({ action, viewerRoles, surfaces, state: 'comingSoon', reason });

const ownerOnly = (
  action: ObjectAction,
  surfaces?: ObjectActionSurface[],
): ActionRule => ({
  action,
  viewerRoles: PUBLIC_ROLES,
  surfaces,
  state: 'requiresOwner',
  reason: 'Only the owner or admin may use this action.',
});

const backend = (
  action: ObjectAction,
  viewerRoles: ViewerRole[],
  surfaces?: ObjectActionSurface[],
): ActionRule => ({
  action,
  viewerRoles,
  surfaces,
  state: 'requiresBackend',
  reason: 'Requires backend or remote service support.',
});

const dangerous = (
  action: ObjectAction,
  viewerRoles: ViewerRole[],
  destructive: boolean,
  surfaces?: ObjectActionSurface[],
  reason = 'Requires explicit confirmation before execution.',
): ActionRule => ({
  action,
  viewerRoles,
  surfaces,
  state: 'dangerous',
  destructive,
  requiresConfirmation: true,
  reason,
});

const campaignResource = (
  action: ObjectAction,
  viewerRoles: ViewerRole[],
): ActionRule => ({
  action,
  viewerRoles,
  surfaces: ['campaignWorkspace'],
  state: 'comingSoon',
  requiresCampaignContext: true,
  reason: 'Campaign resource action only; does not replace Campaign Entry.',
});

const packageLibrary = (
  action: ObjectAction,
  state: ObjectActionState,
  destructive = false,
): ActionRule => ({
  action,
  viewerRoles: OWNER_ROLES,
  surfaces: ['packageLibrary'],
  state,
  destructive,
  requiresConfirmation: state === 'dangerous',
  requiresPackageLibraryContext: true,
  reason: 'PackageLibraryEntry management action; not a WorkshopPackageManifest action.',
});

const READ_ACTIONS: ActionRule[] = [
  available('viewDetail', PUBLIC_ROLES),
  available('openInProfile', PUBLIC_ROLES, ['listCard', 'detailPage', 'personalHub', 'userProfile']),
  soon('copyLink', PUBLIC_ROLES),
];

const OWNER_MANAGEMENT_ACTIONS: ActionRule[] = [
  soon('edit', OWNER_ROLES),
  soon('duplicate', OWNER_ROLES),
  soon('archive', OWNER_ROLES),
  soon('restore', OWNER_ROLES),
  soon('export', OWNER_ROLES),
  soon('share', OWNER_ROLES),
  dangerous('delete', OWNER_ROLES, true, undefined, 'Delete should prefer soft-delete or archive first.'),
  dangerous('changeVisibility', OWNER_ROLES, false, undefined, 'Visibility changes can affect public/profile/workshop visibility.'),
];

const ACTOR_RULES: ActionRule[] = [
  ...READ_ACTIONS,
  soon('favorite', AUTHENTICATED_ROLES),
  ...OWNER_MANAGEMENT_ACTIONS,
  soon('import', OWNER_ROLES),
  campaignResource('addToCampaign', CAMPAIGN_MANAGER_ROLES),
  campaignResource('removeFromCampaign', CAMPAIGN_MANAGER_ROLES),
  soon('useInSession', CAMPAIGN_MANAGER_ROLES, ['campaignWorkspace'], 'Future runtime/context action only.'),
];

const CAMPAIGN_RULES: ActionRule[] = [
  ...READ_ACTIONS,
  ...OWNER_MANAGEMENT_ACTIONS,
  backend('publish', OWNER_ROLES),
  dangerous('unpublish', OWNER_ROLES, false),
];

const DOCUMENT_RULES: ActionRule[] = [
  ...READ_ACTIONS,
  ...OWNER_MANAGEMENT_ACTIONS,
  soon('publishAsFanWork', OWNER_ROLES),
  soon('addToWorkshopPackage', OWNER_ROLES),
  campaignResource('addToCampaign', CAMPAIGN_MANAGER_ROLES),
  campaignResource('removeFromCampaign', CAMPAIGN_MANAGER_ROLES),
];

const FAN_WORK_RULES: ActionRule[] = [
  ...READ_ACTIONS,
  soon('favorite', AUTHENTICATED_ROLES),
  ...OWNER_MANAGEMENT_ACTIONS,
  backend('publish', OWNER_ROLES),
  dangerous('unpublish', OWNER_ROLES, false),
];

const WORKSHOP_PACKAGE_RULES: ActionRule[] = [
  ...READ_ACTIONS,
  soon('favorite', AUTHENTICATED_ROLES, ['workshopBrowse', 'detailPage', 'listCard']),
  soon('join', AUTHENTICATED_ROLES, ['workshopBrowse', 'detailPage', 'listCard'], 'Creates or references a future PackageLibraryEntry.'),
  ownerOnly('edit'),
  soon('export', OWNER_ROLES),
  backend('publish', OWNER_ROLES),
  dangerous('unpublish', OWNER_ROLES, false),
  dangerous('changeVisibility', OWNER_ROLES, false),
];

const PACKAGE_LIBRARY_ENTRY_RULES: ActionRule[] = [
  available('viewDetail', OWNER_ROLES, ['packageLibrary', 'detailPage']),
  packageLibrary('enable', 'comingSoon'),
  packageLibrary('disable', 'dangerous', false),
  packageLibrary('remove', 'dangerous', true),
  packageLibrary('unsubscribe', 'dangerous', true),
  packageLibrary('update', 'requiresBackend'),
  packageLibrary('rollback', 'dangerous', true),
  campaignResource('addToCampaign', CAMPAIGN_MANAGER_ROLES),
  campaignResource('removeFromCampaign', CAMPAIGN_MANAGER_ROLES),
];

const MEDIA_RULES: ActionRule[] = [
  ...READ_ACTIONS,
  soon('rename', OWNER_ROLES),
  soon('replace', OWNER_ROLES),
  soon('archive', OWNER_ROLES),
  dangerous('delete', OWNER_ROLES, true),
  dangerous('changeVisibility', OWNER_ROLES, false),
  soon('useAsPortrait', OWNER_ROLES),
  soon('useAsCover', OWNER_ROLES),
  soon('addToWorkshopPackage', OWNER_ROLES),
  campaignResource('addToCampaign', CAMPAIGN_MANAGER_ROLES),
  campaignResource('removeFromCampaign', CAMPAIGN_MANAGER_ROLES),
];

const COLLECTION_RULES: ActionRule[] = [
  ...READ_ACTIONS,
  soon('edit', OWNER_ROLES),
  soon('share', OWNER_ROLES),
  dangerous('delete', OWNER_ROLES, true),
  dangerous('changeVisibility', OWNER_ROLES, false),
];

const USER_PROFILE_RULES: ActionRule[] = [
  available('viewDetail', PUBLIC_ROLES),
  available('openInProfile', PUBLIC_ROLES),
  soon('copyLink', PUBLIC_ROLES),
  soon('edit', OWNER_ROLES),
  dangerous('changeVisibility', OWNER_ROLES, false),
];

export const OBJECT_ACTION_SPEC: Record<ObjectActionTargetType, ActionRule[]> = {
  actor: ACTOR_RULES,
  npc: ACTOR_RULES,
  campaign: CAMPAIGN_RULES,
  campaignInstance: CAMPAIGN_RULES,
  world: [...READ_ACTIONS, ...OWNER_MANAGEMENT_ACTIONS],
  sessionLog: [
    ...READ_ACTIONS,
    soon('edit', CAMPAIGN_MANAGER_ROLES),
    soon('archive', CAMPAIGN_MANAGER_ROLES),
    dangerous('delete', CAMPAIGN_MANAGER_ROLES, true),
    backend('publish', CAMPAIGN_MANAGER_ROLES),
    dangerous('changeVisibility', CAMPAIGN_MANAGER_ROLES, false),
  ],
  map: MEDIA_RULES,
  handout: DOCUMENT_RULES,
  blockDocument: DOCUMENT_RULES,
  fanWork: FAN_WORK_RULES,
  workshopPackage: WORKSHOP_PACKAGE_RULES,
  mediaAsset: MEDIA_RULES,
  packageLibraryEntry: PACKAGE_LIBRARY_ENTRY_RULES,
  collection: COLLECTION_RULES,
  userProfile: USER_PROFILE_RULES,
};

function viewerRoleFromContext(context: ObjectActionContext): ViewerRole {
  if (context.viewerContext?.role) return context.viewerContext.role;
  if (context.isOwner) return 'owner';
  return 'anonymous';
}

function isOwnerLike(context: ObjectActionContext): boolean {
  const role = viewerRoleFromContext(context);
  return context.isOwner === true || role === 'owner' || role === 'admin';
}

function ruleMatchesContext(rule: ActionRule, context: ObjectActionContext): boolean {
  const role = viewerRoleFromContext(context);
  if (!rule.viewerRoles.includes(role)) return false;
  if (rule.surfaces && !rule.surfaces.includes(context.surface)) return false;
  if (rule.requiresCampaignContext && !context.isCampaignContext && context.surface !== 'campaignWorkspace') return false;
  if (rule.requiresPackageLibraryContext && !context.isPackageLibraryContext && context.surface !== 'packageLibrary') return false;
  return true;
}

function stateForContext(rule: ActionRule, context: ObjectActionContext): ObjectActionState {
  if (rule.state === 'requiresOwner' && isOwnerLike(context)) return 'comingSoon';
  return rule.state;
}

/**
 * The single source of object-action availability.
 *
 * Denied projection returns no actions. This helper never executes actions and
 * never replaces Repository / Service projection enforcement.
 */
export function actionsForObjectType(
  objectType: ObjectActionTargetType,
  context: ObjectActionContext,
): ObjectActionAvailability[] {
  if (context.projection === 'denied') return [];
  const locale = context.locale ?? 'zh-CN';
  const rules = OBJECT_ACTION_SPEC[objectType] ?? [];

  return rules
    .filter((rule) => ruleMatchesContext(rule, context))
    .map((rule) => ({
      action: rule.action,
      state: stateForContext(rule, context),
      label: ACTION_LABELS[rule.action][locale === 'en' ? 'en' : 'zh'],
      reason: rule.reason,
      requiresConfirmation: rule.requiresConfirmation,
      destructive: rule.destructive,
    }));
}

/**
 * dangerous = requires explicit confirmation or may affect visibility/runtime.
 * destructive = may delete, remove, unsubscribe, rollback, or cause data loss.
 */
export const DANGEROUS_ACTIONS: ObjectAction[] = [
  'delete',
  'remove',
  'unsubscribe',
  'disable',
  'unpublish',
  'rollback',
  'changeVisibility',
];

export const DESTRUCTIVE_ACTIONS: ObjectAction[] = [
  'delete',
  'remove',
  'unsubscribe',
  'rollback',
];

export function isDangerousAction(action: ObjectAction): boolean {
  return DANGEROUS_ACTIONS.includes(action);
}

export function isDestructiveAction(action: ObjectAction): boolean {
  return DESTRUCTIVE_ACTIONS.includes(action);
}
