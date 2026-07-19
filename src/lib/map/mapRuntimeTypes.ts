export type MapTokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan' | 'custom';

/** `campaign_actor` and `combatant` are existing persisted values. */
export type MapTokenSourceType = 'combatant' | 'campaign_actor' | 'dndLiteActor' | 'monsterTemplate' | 'vaultActor' | 'roomActorBinding' | 'quickDraft' | 'manual' | 'unknown';

export type MapTokenKind = 'playerCharacter' | 'npc' | 'monster' | 'companion' | 'object' | 'unknown';

/** Host-set visibility for a visible NPC, monster, or other manual Token.
 * Player-character Tokens use the party-default policy in the server projector. */
export type MapTokenInformationVisibility = 'default' | 'public';

import type { RuntimeAcDisplay, RuntimeHpDisplay, RuntimeTokenRelation, RuntimeVisibility } from '../platform/roomRuntimeVisibility.js';

export type MapTokenHpSummary = {
  current?: number;
  max?: number;
  temporary?: number;
};

export const MAP_BACKGROUND_PRESETS = ['blank', 'parchment', 'light_grid', 'dark_dungeon', 'stone_floor', 'town_square', 'grassland', 'sand', 'water', 'tactical_gray'] as const;

export type MapBackgroundPreset = typeof MAP_BACKGROUND_PRESETS[number];

export type MapGridConfig = {
  enabled: boolean;
  sizePx: number;
  feetPerSquare: number;
  originX: number;
  originY: number;
  snap: boolean;
  showCoordinates: boolean;
};

export type MapTemplateShape = 'circle' | 'cone' | 'line' | 'square' | 'rectangle';

/** A non-persistent pointer gesture used by rulers and action-range previews. */
export type MapInteractionPreviewKind = 'ruler' | 'area';

export interface MapInteractionPoint {
  x: number;
  y: number;
}

export interface MapInteractionPreview {
  kind: MapInteractionPreviewKind;
  start: MapInteractionPoint;
  end: MapInteractionPoint;
  shape?: MapTemplateShape;
}

export type MapAreaTemplate = {
  id: string;
  shape: MapTemplateShape;
  x: number;
  y: number;
  sizeFeet: number;
  widthFeet?: number;
  rotation: number;
  label?: string;
  isHidden?: boolean;
};

export type MapToken = {
  id: string;
  name: string;
  x: number;
  y: number;
  size: MapTokenSize;
  width?: number;
  height?: number;
  sourceType: MapTokenSourceType;
  /** Additive source metadata; old manual tokens intentionally omit it. */
  sourceId?: string;
  campaignActorId?: string;
  combatantId?: string;
  /** Informational hints only. Room permissions remain server-authoritative. */
  ownerUserId?: string;
  controlledByUserId?: string;
  /** Room-local linkage used to verify an approved player-character token. */
  roomMemberId?: string;
  /** The approved Room Lobby actor binding that placed this character token. */
  actorBindingId?: string;
  displayName?: string;
  imageUrl?: string;
  initials?: string;
  kind?: MapTokenKind;
  /** `public` shares only the safe combat display projection, never raw notes or ids. */
  informationVisibility?: MapTokenInformationVisibility;
  hpSummary?: MapTokenHpSummary;
  /** Server-projected display values. Missing means hidden, not zero. */
  hpDisplay?: RuntimeHpDisplay;
  acDisplay?: RuntimeAcDisplay;
  visibility?: RuntimeVisibility;
  relation?: RuntimeTokenRelation;
  conditionSummary?: string[];
  sourceCombatantId?: string;
  sourceActorInstanceId?: string;
  colorLabel?: string;
  notes?: string;
  isHidden?: boolean;
};

export type MapBoardState = {
  mapId: string;
  backgroundUrl?: string;
  backgroundName?: string;
  backgroundPreset?: MapBackgroundPreset;
  zoom: number;
  panX: number;
  panY: number;
  grid?: MapGridConfig;
  templates?: MapAreaTemplate[];
  tokens: MapToken[];
  selectedTokenId?: string;
  selectedTemplateId?: string;
  updatedAt?: string;
};

export type MapTokenInput = Omit<MapToken, 'id' | 'name' | 'x' | 'y'> & {
  id?: string;
  name?: string;
  x?: number;
  y?: number;
};

export const MAP_RUNTIME_EVENT_KINDS = [
  'map.background_set',
  'map.background_cleared',
  'map.viewport_changed',
  'map.token_added',
  'map.token_moved',
  'map.token_updated',
  'map.token_removed',
  'map.grid_updated',
  'map.template_added',
  'map.template_updated',
  'map.template_removed',
  'map.templates_cleared',
] as const;

export type MapRuntimeEventKind = typeof MAP_RUNTIME_EVENT_KINDS[number];

export type MapRuntimeEventDraft = {
  eventKind: MapRuntimeEventKind;
  payload: Record<string, unknown>;
};

export type MapViewportPatch = {
  zoom?: number;
  panX?: number;
  panY?: number;
};

export type MapGridPatch = Partial<MapGridConfig>;

export type MapAreaTemplateInput = Omit<MapAreaTemplate, 'id' | 'x' | 'y' | 'rotation'> & {
  id?: string;
  x?: number;
  y?: number;
  rotation?: number;
};

export type MapBoardToolPermissions = {
  canView: boolean;
  canMeasure: boolean;
  canManageTokens: boolean;
  canManageTemplates: boolean;
  canManageGrid: boolean;
  canManageBackground: boolean;
};

export function createMapBoardState(mapId: string): MapBoardState {
  return { mapId, backgroundPreset: createMapBackgroundPreset(), zoom: 1, panX: 0, panY: 0, grid: createMapGridConfig(), templates: [], tokens: [] };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createMapGridConfig(input: Partial<MapGridConfig> = {}): MapGridConfig {
  return {
    enabled: input.enabled ?? true,
    sizePx: clamp(Number.isFinite(input.sizePx) ? Math.round(input.sizePx as number) : 50, 12, 240),
    feetPerSquare: clamp(Number.isFinite(input.feetPerSquare) ? Math.round(input.feetPerSquare as number) : 5, 1, 1000),
    originX: Number.isFinite(input.originX) ? input.originX as number : 0,
    originY: Number.isFinite(input.originY) ? input.originY as number : 0,
    snap: input.snap ?? false,
    showCoordinates: input.showCoordinates ?? false,
  };
}

export function createMapBackgroundPreset(value?: unknown): MapBackgroundPreset {
  return typeof value === 'string' && (MAP_BACKGROUND_PRESETS as readonly string[]).includes(value)
    ? value as MapBackgroundPreset
    : 'tactical_gray';
}

export function getMapBoardToolPermissions(canManage: boolean): MapBoardToolPermissions {
  return {
    canView: true,
    canMeasure: true,
    canManageTokens: canManage,
    canManageTemplates: canManage,
    canManageGrid: canManage,
    canManageBackground: canManage,
  };
}

export function createMapAreaTemplate(input: MapAreaTemplateInput): MapAreaTemplate {
  const shape: MapTemplateShape = ['circle', 'cone', 'line', 'square', 'rectangle'].includes(input.shape) ? input.shape : 'circle';
  return {
    id: input.id ?? '',
    shape,
    x: clamp(Number.isFinite(input.x) ? input.x as number : 50, 0, 100),
    y: clamp(Number.isFinite(input.y) ? input.y as number : 50, 0, 100),
    sizeFeet: clamp(Number.isFinite(input.sizeFeet) ? Math.round(input.sizeFeet) : 5, 1, 1000),
    widthFeet: input.widthFeet === undefined ? undefined : clamp(Number.isFinite(input.widthFeet) ? Math.round(input.widthFeet) : 5, 1, 1000),
    rotation: Number.isFinite(input.rotation) ? input.rotation as number : 0,
    label: input.label?.trim() || undefined,
    isHidden: input.isHidden ?? false,
  };
}

export function snapMapPosition(x: number, y: number, grid: MapGridConfig | undefined, widthPx: number, heightPx: number): { x: number; y: number } {
  if (!grid?.enabled || !grid.snap || widthPx <= 0 || heightPx <= 0) return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
  const snap = (percent: number, extent: number, origin: number) => {
    const center = origin + grid.sizePx / 2;
    const pixels = (percent / 100) * extent;
    const snapped = center + Math.round((pixels - center) / grid.sizePx) * grid.sizePx;
    return clamp((snapped / extent) * 100, 0, 100);
  };
  return { x: snap(x, widthPx, grid.originX), y: snap(y, heightPx, grid.originY) };
}

export function measureMapDistance(start: { x: number; y: number }, end: { x: number; y: number }, grid: MapGridConfig | undefined, widthPx: number, heightPx: number): { feet: number; squares: number } {
  const activeGrid = createMapGridConfig(grid);
  const dx = ((end.x - start.x) / 100) * widthPx;
  const dy = ((end.y - start.y) / 100) * heightPx;
  const pixels = Math.hypot(dx, dy);
  const squares = pixels / activeGrid.sizePx;
  return { squares, feet: squares * activeGrid.feetPerSquare };
}

export function createMapToken(input: MapTokenInput): MapToken {
  const name = input.name?.trim() || 'Token';
  return {
    ...input,
    id: input.id ?? '',
    name,
    x: clamp(Number.isFinite(input.x) ? input.x as number : 50, 0, 100),
    y: clamp(Number.isFinite(input.y) ? input.y as number : 50, 0, 100),
    size: input.size ?? 'medium',
    sourceType: input.sourceType ?? 'unknown',
    isHidden: input.isHidden ?? false,
  };
}
