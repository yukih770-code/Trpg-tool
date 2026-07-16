export type MapTokenSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan' | 'custom';

export type MapTokenSourceType = 'combatant' | 'campaign_actor' | 'manual' | 'unknown';

export type MapToken = {
  id: string;
  name: string;
  x: number;
  y: number;
  size: MapTokenSize;
  width?: number;
  height?: number;
  sourceType: MapTokenSourceType;
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
  zoom: number;
  panX: number;
  panY: number;
  tokens: MapToken[];
  selectedTokenId?: string;
  updatedAt?: string;
};

export type MapTokenInput = Omit<MapToken, 'id' | 'name' | 'x' | 'y'> & {
  id?: string;
  name?: string;
  x?: number;
  y?: number;
};

export type MapRuntimeEventDraft = {
  eventKind:
    | 'map.background_set'
    | 'map.background_cleared'
    | 'map.viewport_changed'
    | 'map.token_added'
    | 'map.token_moved'
    | 'map.token_updated'
    | 'map.token_removed';
  payload: Record<string, unknown>;
};

export type MapViewportPatch = {
  zoom?: number;
  panX?: number;
  panY?: number;
};

export function createMapBoardState(mapId: string): MapBoardState {
  return { mapId, zoom: 1, panX: 0, panY: 0, tokens: [] };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
