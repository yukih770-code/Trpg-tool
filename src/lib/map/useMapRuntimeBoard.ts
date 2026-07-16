import { useCallback, useEffect, useState } from 'react';
import {
  createMapBoardState,
  createMapToken,
  type MapBoardState,
  type MapRuntimeEventDraft,
  type MapToken,
  type MapTokenInput,
  type MapViewportPatch,
} from './mapRuntimeTypes';
import { replayMapRuntimeEvents, type MapRuntimeReplayEvent } from './mapRuntimeReplay';

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `map-token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useMapRuntimeBoard(mapId: string) {
  const [state, setState] = useState<MapBoardState>(() => createMapBoardState(mapId));

  useEffect(() => {
    setState(createMapBoardState(mapId));
  }, [mapId]);

  const setBackground = useCallback((backgroundUrl: string, backgroundName?: string): MapRuntimeEventDraft | null => {
    const url = backgroundUrl.trim();
    if (!url) return null;
    setState((previous) => ({ ...previous, backgroundUrl: url, backgroundName: backgroundName?.trim() || url, updatedAt: new Date().toISOString() }));
    return { eventKind: 'map.background_set', payload: { backgroundUrl: url, backgroundName: backgroundName?.trim() || url } };
  }, []);

  const clearBackground = useCallback((): MapRuntimeEventDraft => {
    setState((previous) => ({ ...previous, backgroundUrl: undefined, backgroundName: undefined, updatedAt: new Date().toISOString() }));
    return { eventKind: 'map.background_cleared', payload: {} };
  }, []);

  const changeViewport = useCallback((patch: MapViewportPatch): MapRuntimeEventDraft => {
    const zoom = patch.zoom === undefined ? state.zoom : Math.min(2.5, Math.max(0.5, patch.zoom));
    const panX = patch.panX === undefined ? state.panX : patch.panX;
    const panY = patch.panY === undefined ? state.panY : patch.panY;
    setState((previous) => ({ ...previous, zoom, panX, panY, updatedAt: new Date().toISOString() }));
    return { eventKind: 'map.viewport_changed', payload: { zoom, panX, panY } };
  }, [state.panX, state.panY, state.zoom]);

  const addToken = useCallback((input: MapTokenInput): { token: MapToken; event: MapRuntimeEventDraft } => {
    const token = createMapToken({ ...input, id: input.id ?? newId() });
    setState((previous) => ({ ...previous, tokens: [...previous.tokens, token], selectedTokenId: token.id, updatedAt: new Date().toISOString() }));
    return { token, event: { eventKind: 'map.token_added', payload: { token } } };
  }, []);

  const moveToken = useCallback((id: string, x: number, y: number): MapRuntimeEventDraft | null => {
    const token = state.tokens.find((item) => item.id === id);
    if (!token) return null;
    const nextX = Math.min(100, Math.max(0, x));
    const nextY = Math.min(100, Math.max(0, y));
    setState((previous) => ({ ...previous, tokens: previous.tokens.map((item) => item.id === id ? { ...item, x: nextX, y: nextY } : item), updatedAt: new Date().toISOString() }));
    return { eventKind: 'map.token_moved', payload: { tokenId: id, x: nextX, y: nextY } };
  }, [state.tokens]);

  const updateToken = useCallback((id: string, patch: Partial<Omit<MapToken, 'id'>>): MapRuntimeEventDraft | null => {
    const token = state.tokens.find((item) => item.id === id);
    if (!token) return null;
    const updated = createMapToken({ ...token, ...patch, id });
    setState((previous) => ({ ...previous, tokens: previous.tokens.map((item) => item.id === id ? updated : item), selectedTokenId: id, updatedAt: new Date().toISOString() }));
    return { eventKind: 'map.token_updated', payload: { token: updated } };
  }, [state.tokens]);

  const removeToken = useCallback((id: string): MapRuntimeEventDraft | null => {
    const token = state.tokens.find((item) => item.id === id);
    if (!token) return null;
    setState((previous) => ({ ...previous, tokens: previous.tokens.filter((item) => item.id !== id), selectedTokenId: previous.selectedTokenId === id ? undefined : previous.selectedTokenId, updatedAt: new Date().toISOString() }));
    return { eventKind: 'map.token_removed', payload: { tokenId: id, name: token.name } };
  }, [state.selectedTokenId, state.tokens]);

  const selectToken = useCallback((id?: string) => {
    setState((previous) => ({ ...previous, selectedTokenId: id }));
  }, []);

  const restore = useCallback((events: ReadonlyArray<MapRuntimeReplayEvent>) => {
    const nextState = replayMapRuntimeEvents(events, mapId);
    setState(nextState);
    return nextState;
  }, [mapId]);

  return { state, setBackground, clearBackground, changeViewport, addToken, moveToken, updateToken, removeToken, selectToken, restore };
}
