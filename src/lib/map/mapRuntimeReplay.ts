import type { RuntimeEvent } from '../api/campaignRoomApiClient';
import {
  createMapBoardState,
  createMapToken,
  type MapBoardState,
  type MapToken,
  type MapTokenInput,
} from './mapRuntimeTypes';

export type MapRuntimeReplayEvent = Pick<RuntimeEvent, 'eventKind' | 'payload' | 'seq' | 'createdAt'>;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function tokenInput(value: unknown, fallback?: MapToken): MapToken | null {
  const input = record(value);
  const id = stringValue(input?.id) ?? fallback?.id;
  if (!id) return null;
  const next: MapTokenInput = {
    id,
    name: stringValue(input?.name) ?? fallback?.name ?? 'Token',
    x: numberValue(input?.x) ?? fallback?.x ?? 50,
    y: numberValue(input?.y) ?? fallback?.y ?? 50,
    size: input?.size === undefined ? fallback?.size ?? 'medium' : input.size as MapToken['size'],
    width: numberValue(input?.width) ?? fallback?.width,
    height: numberValue(input?.height) ?? fallback?.height,
    sourceType: input?.sourceType === undefined ? fallback?.sourceType ?? 'unknown' : input.sourceType as MapToken['sourceType'],
    sourceCombatantId: stringValue(input?.sourceCombatantId) ?? fallback?.sourceCombatantId,
    sourceActorInstanceId: stringValue(input?.sourceActorInstanceId) ?? fallback?.sourceActorInstanceId,
    colorLabel: stringValue(input?.colorLabel) ?? fallback?.colorLabel,
    notes: stringValue(input?.notes) ?? fallback?.notes,
    isHidden: typeof input?.isHidden === 'boolean' ? input.isHidden : fallback?.isHidden,
  };
  return createMapToken(next);
}

export function replayMapRuntimeEvents(events: ReadonlyArray<MapRuntimeReplayEvent>, mapId: string): MapBoardState {
  const ordered = events
    .map((event, index) => ({ event, index }))
    .sort((left, right) => (left.event.seq ?? left.index) - (right.event.seq ?? right.index) || left.index - right.index)
    .map(({ event }) => event);
  let state = createMapBoardState(mapId);

  for (const event of ordered) {
    const payload = event.payload ?? {};
    if (event.eventKind === 'map.background_set') {
      const url = stringValue(payload.backgroundUrl);
      if (url) state = { ...state, backgroundUrl: url, backgroundName: stringValue(payload.backgroundName) ?? url, updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.background_cleared') {
      state = { ...state, backgroundUrl: undefined, backgroundName: undefined, updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.viewport_changed') {
      const zoom = numberValue(payload.zoom);
      const panX = numberValue(payload.panX);
      const panY = numberValue(payload.panY);
      state = { ...state, zoom: zoom === undefined ? state.zoom : Math.min(2.5, Math.max(0.5, zoom)), panX: panX ?? state.panX, panY: panY ?? state.panY, updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.token_added') {
      const token = tokenInput(payload.token);
      if (token && !state.tokens.some((item) => item.id === token.id)) state = { ...state, tokens: [...state.tokens, token], updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.token_moved') {
      const id = stringValue(payload.tokenId);
      const x = numberValue(payload.x);
      const y = numberValue(payload.y);
      if (id && x !== undefined && y !== undefined && state.tokens.some((item) => item.id === id)) state = { ...state, tokens: state.tokens.map((item) => item.id === id ? createMapToken({ ...item, x, y, id }) : item), updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.token_updated') {
      const candidate = record(payload.token);
      const id = stringValue(candidate?.id);
      const existing = id ? state.tokens.find((item) => item.id === id) : undefined;
      const token = tokenInput(candidate, existing);
      if (token && existing) state = { ...state, tokens: state.tokens.map((item) => item.id === token.id ? token : item), updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.token_removed') {
      const id = stringValue(payload.tokenId);
      if (id) state = { ...state, tokens: state.tokens.filter((item) => item.id !== id), selectedTokenId: state.selectedTokenId === id ? undefined : state.selectedTokenId, updatedAt: event.createdAt };
    }
  }

  return state;
}

export function hasMapRuntimeEvents(events: ReadonlyArray<Pick<RuntimeEvent, 'eventKind'>>): boolean {
  return events.some((event) => event.eventKind.startsWith('map.'));
}
