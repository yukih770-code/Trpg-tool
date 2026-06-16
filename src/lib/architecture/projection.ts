/**
 * Visibility + Projection Contract.
 *
 * AI-LANDMARK: VISIBILITY_AND_PROJECTION_CONTRACT_V1
 *
 * Visibility (write-side) is the STORED state of an object: how exposed it is.
 * Projection (read-side) is the READ-OUT shape a given viewer is allowed to see.
 * They are NOT the same thing and must never be conflated.
 *
 * Hard rules:
 *   - Projection is enforced by the Repository / Service layer (server-side in
 *     B0), NEVER by frontend components filtering fields.
 *   - publicProjection must never leak internal fields.
 *   - campaignOnly must (in future) differentiate GM vs player.
 *
 * `EntityVisibility` and `EntityProjection` are reused from A1 (single source).
 * This module adds the viewer model, the decision logic, per-type field policy,
 * and projected DTO wrappers. Types + pure helpers only — no auth, no backend.
 */
import {
  toEntitySummary,
  type EntityNode,
  type EntityProjection,
  type EntitySummary,
  type EntityType,
  type EntityVisibility,
} from './entityGraph';

// ─── Viewer model ────────────────────────────────────────────────────────────

export type ViewerRole =
  | 'anonymous'
  | 'owner'
  | 'gm'
  | 'player'
  | 'campaignMember'
  | 'admin';

export type ViewerContext = {
  userId?: string;
  role: ViewerRole;
  /** Campaign memberships the viewer holds (future GM/player gating). */
  campaignIds?: string[];
  /** Share codes the viewer "knows" — gates unlisted access. */
  knownShareCodes?: string[];
};

export const ANONYMOUS_VIEWER: ViewerContext = { role: 'anonymous' };

// ─── Projection result model ─────────────────────────────────────────────────

/** The granted projection view, plus a `denied` sentinel. */
export type ProjectionType = EntityProjection | 'denied';

export type ProjectionReason =
  | 'public'
  | 'unlisted-link'
  | 'unlisted-no-link'
  | 'owner'
  | 'admin'
  | 'campaign-gm'
  | 'campaign-player'
  | 'private'
  | 'not-campaign-member'
  | 'not-found';

/** Capability ladder (what the viewer may DO), distinct from data depth. */
export type EntityAccessLevel = 'none' | 'view' | 'reference' | 'clone' | 'edit';

export type ProjectionDecision = {
  projection: ProjectionType;
  allowed: boolean;
  reason: ProjectionReason;
  accessLevel: EntityAccessLevel;
};

export type ProjectedEntitySummary = {
  projection: ProjectionType;
  accessLevel: EntityAccessLevel;
  /** Undefined when access is denied. */
  summary?: EntitySummary;
};

export type ProjectedEntityDetail = {
  projection: ProjectionType;
  accessLevel: EntityAccessLevel;
  /** Undefined when access is denied. */
  detail?: EntityNode;
};

/** Minimal node-ish input the decision needs (no full payload). */
export type ProjectionInput = {
  visibility: EntityVisibility;
  ownerId?: string;
  shareCode?: string;
};

// ─── Per-type field policy (contract-as-data) ────────────────────────────────

export type ProjectionPolicy = {
  /** Fields safe to expose in publicProjection. */
  publicFields: string[];
  /** Fields that must NEVER appear in publicProjection. */
  forbiddenInPublic: string[];
  /** campaignOnly differentiates GM vs player for this type. */
  campaignAware: boolean;
  /** Type has internal sections/blocks needing section-level projection (future). */
  hasInternalSections: boolean;
};

/**
 * Field-level projection boundaries per EntityType. This is the authoritative
 * contract that B0 server-side projection must honor. (Enforcement of every
 * field is future work; the boundary is fixed here.)
 */
export const ENTITY_PROJECTION_POLICY: Record<EntityType, ProjectionPolicy> = {
  actor: {
    publicFields: ['displayName', 'systemId', 'publicSummary', 'cover', 'publicTags'],
    forbiddenInPublic: ['fullStats', 'currentHp', 'resources', 'inventory', 'secrets', 'gmNotes', 'privateBackground', 'hiddenRelations'],
    campaignAware: true,
    hasInternalSections: true,
  },
  campaign: {
    publicFields: ['title', 'systemId', 'publicSummary', 'cover', 'publicTags'],
    forbiddenInPublic: ['gmSpoilers', 'hiddenNpcs', 'futurePlot', 'unpublishedMaps', 'privateMembers', 'hiddenLogs'],
    campaignAware: true,
    hasInternalSections: true,
  },
  sessionLog: {
    publicFields: ['title', 'publicRecapSummary', 'playerVisibleLog'],
    forbiddenInPublic: ['internalRawLog', 'gmNotes'],
    campaignAware: true,
    hasInternalSections: true,
  },
  fanWork: {
    publicFields: ['title', 'author', 'publishedBody', 'cover', 'publicTags', 'publicRelations'],
    forbiddenInPublic: ['draft', 'hiddenBlocks', 'authorPrivateNotes', 'unpublishedRelations'],
    campaignAware: false,
    hasInternalSections: true,
  },
  workshopPackage: {
    publicFields: ['publicMetadata', 'tags', 'sourceTrust', 'entryPointsSummary'],
    forbiddenInPublic: ['privateDependencies', 'unpublishedIncludedEntities', 'readOnlyPayload'],
    campaignAware: false,
    hasInternalSections: true,
  },
  blockDocument: {
    publicFields: ['title', 'publicBlocks'],
    forbiddenInPublic: ['internalBlocks', 'gmOnlyBlocks', 'draftBlocks', 'hiddenBlocks'],
    campaignAware: true,
    hasInternalSections: true,
  },
  map: {
    publicFields: ['title', 'cover', 'publicTags'],
    forbiddenInPublic: ['hiddenLayers', 'gmAnnotations'],
    campaignAware: true,
    hasInternalSections: false,
  },
  mediaAsset: {
    publicFields: ['title', 'preview', 'kind'],
    forbiddenInPublic: ['original', 'license'],
    campaignAware: false,
    hasInternalSections: false,
  },
  world: {
    publicFields: ['title', 'publicSummary', 'cover', 'publicTags'],
    forbiddenInPublic: ['gmLore', 'hiddenLocations'],
    campaignAware: false,
    hasInternalSections: true,
  },
  npc: {
    publicFields: ['displayName', 'publicSummary', 'cover'],
    forbiddenInPublic: ['statBlock', 'secrets', 'gmNotes', 'hiddenRelations'],
    campaignAware: true,
    hasInternalSections: true,
  },
  handout: {
    publicFields: ['title', 'publicBody'],
    forbiddenInPublic: ['gmNotes', 'hiddenClues'],
    campaignAware: true,
    hasInternalSections: true,
  },
};

// ─── Decision logic (pure) ───────────────────────────────────────────────────

function grant(projection: EntityProjection, reason: ProjectionReason, accessLevel: EntityAccessLevel): ProjectionDecision {
  return { projection, allowed: true, reason, accessLevel };
}

function deny(reason: ProjectionReason): ProjectionDecision {
  return { projection: 'denied', allowed: false, reason, accessLevel: 'none' };
}

/**
 * Core projection decision. Visibility + viewer → which projection (or denied).
 *   public      : owner→owner, else→public
 *   unlisted    : owner→owner, link-holder→unlisted, else→denied (not listed)
 *   private     : owner→owner, else→denied
 *   campaignOnly: owner→owner, gm→gm, player/member→player, else→denied
 *   admin       : owner projection (elevated)
 */
export function decideProjection(input: ProjectionInput, viewer: ViewerContext): ProjectionDecision {
  const isOwner = !!input.ownerId && !!viewer.userId && input.ownerId === viewer.userId;

  if (viewer.role === 'admin') return grant('owner', 'admin', 'edit');
  if (isOwner) return grant('owner', 'owner', 'edit');

  switch (input.visibility) {
    case 'public':
      return grant('public', 'public', 'view');
    case 'unlisted': {
      const hasLink = !!input.shareCode && (viewer.knownShareCodes ?? []).includes(input.shareCode);
      return hasLink ? grant('unlisted', 'unlisted-link', 'view') : deny('unlisted-no-link');
    }
    case 'private':
      return deny('private');
    case 'campaignOnly': {
      if (viewer.role === 'gm') return grant('gm', 'campaign-gm', 'view');
      if (viewer.role === 'player' || viewer.role === 'campaignMember') return grant('player', 'campaign-player', 'view');
      return deny('not-campaign-member');
    }
    default:
      return deny('not-found');
  }
}

/** Whether a projection exposes internal fields (owner/gm/admin) vs public ones. */
export function isInternalProjection(projection: ProjectionType): boolean {
  return projection === 'owner' || projection === 'gm';
}

/**
 * Redact a node for a given projection. Public/unlisted/player projections strip
 * owner-only metadata. (Node is light metadata; heavy payload is gated by
 * payloadRef loading, not returned here.)
 */
export function redactNodeForProjection(node: EntityNode, projection: ProjectionType): EntityNode {
  if (isInternalProjection(projection)) return node;
  // public / unlisted / player: drop internal-only fields.
  const redacted: EntityNode = { ...node };
  delete redacted.ownerId;
  return redacted;
}

function inputFromNode(node: EntityNode): ProjectionInput {
  return { visibility: node.visibility, ownerId: node.ownerId, shareCode: node.shareCode };
}

export function projectNodeSummary(node: EntityNode, viewer: ViewerContext): ProjectedEntitySummary {
  const decision = decideProjection(inputFromNode(node), viewer);
  if (!decision.allowed) return { projection: decision.projection, accessLevel: decision.accessLevel };
  return {
    projection: decision.projection,
    accessLevel: decision.accessLevel,
    summary: toEntitySummary(redactNodeForProjection(node, decision.projection)),
  };
}

export function projectNodeDetail(node: EntityNode, viewer: ViewerContext): ProjectedEntityDetail {
  const decision = decideProjection(inputFromNode(node), viewer);
  if (!decision.allowed) return { projection: decision.projection, accessLevel: decision.accessLevel };
  return {
    projection: decision.projection,
    accessLevel: decision.accessLevel,
    detail: redactNodeForProjection(node, decision.projection),
  };
}
