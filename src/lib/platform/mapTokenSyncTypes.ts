/**
 * Shared map / token synchronization contracts (v0, types only).
 *
 * AI-LANDMARK: MAP_TOKEN_SYNC_CONTRACTS_V0
 *
 * These are platform-level shared map and token synchronization contracts for
 * the portable Room Server model. They describe map state, token state,
 * visibility, controller ownership, and map patches. They do not implement
 * rendering, drag/drop, networking, fog of war, dynamic lighting, rules
 * automation, storage, or UI.
 *
 * v0 deliberately omits fog of war, dynamic lighting, walls, terrain automation,
 * AOE automation, and advanced measurement (placeholders reserved). Platform-
 * neutral (no DND/COC/CP RED rules); imports nothing.
 */

export type SharedMapVisibility = 'hostOnly' | 'playerVisible' | 'public' | 'hidden';

export type SharedMapGridKind = 'none' | 'square' | 'hex' | 'custom';

export interface SharedMapGridConfig {
  kind: SharedMapGridKind;
  cellSize?: number;
  unitLabel?: string;
  pixelsPerUnit?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface SharedMapBackgroundRef {
  mediaId?: string;
  uri?: string;
  width?: number;
  height?: number;
  note?: string;
}

export type SharedTokenKind =
  | 'playerCharacter'
  | 'npc'
  | 'monster'
  | 'summon'
  | 'object'
  | 'hazard'
  | 'custom';

export interface SharedTokenState {
  tokenId: string;
  mapId: string;
  linkedActorId?: string;
  kind: SharedTokenKind;
  displayName: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  visibility: SharedMapVisibility;
  ownerMemberId?: string;
  controllerMemberIds?: string[];
  portraitMediaId?: string;
  isLocked?: boolean;
  note?: string;
}

export interface SharedMapState {
  mapId: string;
  roomId: string;
  sessionId?: string;
  title: string;
  background?: SharedMapBackgroundRef;
  width?: number;
  height?: number;
  grid?: SharedMapGridConfig;
  tokens: SharedTokenState[];
  visibility: SharedMapVisibility;
  serverSeq: number;
  createdAt?: string;
  updatedAt?: string;
}

export type SharedMapPatchKind =
  | 'mapCreated'
  | 'mapUpdated'
  | 'mapRemoved'
  | 'backgroundChanged'
  | 'gridChanged'
  | 'tokenAdded'
  | 'tokenRemoved'
  | 'tokenMoved'
  | 'tokenUpdated'
  | 'tokenVisibilityChanged'
  | 'tokenControllerChanged'
  | 'ping'
  | 'marker'
  | 'custom';

export interface SharedMapPatch {
  patchId: string;
  kind: SharedMapPatchKind;
  roomId: string;
  sessionId?: string;
  mapId?: string;
  tokenId?: string;
  sourceIntentId?: string;
  serverSeq: number;
  visibility: SharedMapVisibility;
  payload?: unknown;
  createdAt?: string;
}

export interface SharedMapProjectionPacket {
  packetId: string;
  roomId: string;
  sessionId?: string;
  recipientMemberId?: string;
  projectionRole: 'host' | 'player' | 'spectator';
  serverSeq: number;
  mapState?: SharedMapState;
  patches?: SharedMapPatch[];
  /** Debug/audit only — hidden tokens withheld from this projection. */
  omittedHiddenTokenIds?: string[];
  warnings?: string[];
  createdAt?: string;
}

/** Reserved future-feature flags (not implemented in v0). */
export interface SharedMapFutureFeatureFlags {
  fogOfWarPlaceholder?: boolean;
  dynamicLightingPlaceholder?: boolean;
  wallsPlaceholder?: boolean;
  measurementPlaceholder?: boolean;
  aoeTemplatePlaceholder?: boolean;
}
