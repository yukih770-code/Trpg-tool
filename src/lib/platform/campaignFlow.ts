/**
 * Platform campaign entry flow contract.
 *
 * AI-LANDMARK: SYSTEM_ENTRY_CAMPAIGN_FLOW_CONTRACT_V1
 *
 * This module defines type-only platform contracts for the relationship between
 * System Entry, Actor Vault, Campaign Vault, Campaign Instance entry, and
 * return-context handoff.
 *
 * Scope:
 * - No real campaign room creation.
 * - No multiplayer, backend, auth, permission enforcement, import, map, handout,
 *   NPC, or Workshop builder implementation.
 * - No store schema, migration, save format, or rule-runtime changes.
 */

export type SystemWorkspaceBranch = 'characters' | 'campaigns';

export type CampaignEntrySource =
  | 'characterLibrary'
  | 'characterDetail'
  | 'campaignLibrary'
  | 'campaignDetail'
  | 'inviteCode'
  | 'recent'
  | 'homeShortcut'
  | 'workshopPackage';

export type CampaignEntryRole = 'playerCharacter' | 'host';

export type CampaignEntryReturnView =
  | 'campaignDetail'
  | 'characterDetail'
  | 'campaignLibrary'
  | 'characterLibrary';

export interface CampaignEntryReturnTo {
  view: CampaignEntryReturnView;
  systemId?: string;
  campaignId?: string;
  actorId?: string;
}

export interface CampaignEntryContext {
  systemId: string;
  campaignId?: string;
  source: CampaignEntrySource;
  /**
   * Suggested by the previous flow, such as a character-detail page.
   * This is not the final entry identity.
   */
  suggestedActorId?: string;
  /**
   * Chosen by the user on the campaign detail / entry-prep surface.
   * This becomes meaningful only when the user confirms entry.
   */
  selectedActorId?: string;
  /**
   * Chosen by the user on the campaign detail / entry-prep surface.
   * The final role is locked only when the user clicks "enter campaign".
   */
  selectedEntryRole?: CampaignEntryRole;
  returnTo?: CampaignEntryReturnTo;
}

export interface CampaignWorkspaceEntry {
  systemId: string;
  branch: SystemWorkspaceBranch;
  label: string;
  description: string;
}

export interface CampaignActorAddReturnContext {
  campaignId: string;
  campaignTitle: string;
  campaignRoomCode?: string;
  source: 'campaignEntry';
  returnLabel: string;
  returnTo: CampaignEntryReturnTo;
}

export interface CampaignActorSelectReturnContext {
  campaignId: string;
  campaignTitle: string;
  campaignRoomCode?: string;
  source: 'campaignEntry';
  returnLabel: string;
  returnTo: CampaignEntryReturnTo;
}

export interface CampaignSuggestedActor {
  actorId: string;
  actorName: string;
}

export interface CampaignRuntimeContext {
  campaignId: string;
  campaignTitle: string;
  campaignRoomCode?: string;
  systemId: string;
  selectedEntryRole: CampaignEntryRole;
  selectedActorId?: string;
  selectedActorName?: string;
  source: 'campaignEntry';
}

export interface CampaignInstanceSummary {
  campaignId: string;
  systemId: string;
  title: string;
  roomCode?: string;
  hostUserId?: string;
  /**
   * Optional source package. A WorkshopPackage can seed or supply content to
   * many CampaignInstances; it is not itself the campaign room.
   */
  sourcePackageId?: string;
  playerActorIds?: string[];
  npcActorIds?: string[];
  lastPlayedAt?: string;
}

export type CampaignFlowWorkspaceKind =
  | 'actorVault'
  | 'campaignVault'
  | 'sourceSettings'
  | 'builder'
  | 'sessionRuntime'
  | 'workshop';

export type WorkshopPackageCampaignUsage =
  | 'createdFrom'
  | 'uses'
  | 'referenceOnly';

export interface CampaignWorkshopPackageRef {
  campaignId: string;
  packageId: string;
  usage: WorkshopPackageCampaignUsage;
}

export type CampaignRoleCapability =
  | 'viewPublicCampaignInfo'
  | 'selectOwnActor'
  | 'switchOwnActor'
  | 'enterPlayerView'
  | 'viewVisibleMap'
  | 'viewVisibleHandouts'
  | 'viewVisibleLogs'
  | 'importActorOrNpc'
  | 'importMap'
  | 'importHandoutOrDocument'
  | 'enableContentPackage'
  | 'managePlayerActors'
  | 'manageDiceVisibility'
  | 'manageLogs'
  | 'enterHostView';

export const CAMPAIGN_ROLE_CAPABILITIES: Record<CampaignEntryRole, CampaignRoleCapability[]> = {
  playerCharacter: [
    'viewPublicCampaignInfo',
    'selectOwnActor',
    'switchOwnActor',
    'enterPlayerView',
    'viewVisibleMap',
    'viewVisibleHandouts',
    'viewVisibleLogs',
  ],
  host: [
    'viewPublicCampaignInfo',
    'importActorOrNpc',
    'importMap',
    'importHandoutOrDocument',
    'enableContentPackage',
    'managePlayerActors',
    'manageDiceVisibility',
    'manageLogs',
    'enterHostView',
  ],
};

export function withSuggestedActor(
  context: CampaignEntryContext,
  suggestedActorId: string,
): CampaignEntryContext {
  return {
    ...context,
    suggestedActorId,
  };
}

export function withSelectedEntryRole(
  context: CampaignEntryContext,
  selectedEntryRole: CampaignEntryRole,
  selectedActorId?: string,
): CampaignEntryContext {
  return {
    ...context,
    selectedEntryRole,
    selectedActorId,
  };
}

export function makeCampaignReturnTo(
  returnTo: CampaignEntryReturnTo,
): Pick<CampaignEntryContext, 'returnTo'> {
  return { returnTo };
}

export function makeCampaignActorAddReturnContextFromSelect(
  context: CampaignActorSelectReturnContext,
): CampaignActorAddReturnContext {
  return {
    campaignId: context.campaignId,
    campaignTitle: context.campaignTitle,
    campaignRoomCode: context.campaignRoomCode,
    source: context.source,
    returnLabel: context.returnLabel,
    returnTo: context.returnTo,
  };
}
