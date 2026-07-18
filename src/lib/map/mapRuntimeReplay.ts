import {
  createMapBoardState,
  createMapAreaTemplate,
  createMapBackgroundPreset,
  createMapGridConfig,
  createMapToken,
  type MapAreaTemplate,
  type MapAreaTemplateInput,
  type MapBoardState,
  type MapToken,
  type MapTokenInput,
} from './mapRuntimeTypes';

/**
 * Minimum append-only shape needed to rebuild a map board. Both the campaign
 * Runtime event service and the Room Map stream satisfy this shape; neither is
 * treated as the other.
 */
export type MapRuntimeReplayEvent = {
  eventKind: string;
  payload: Record<string, unknown>;
  seq?: number;
  createdAt?: string;
};

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
    sourceId: stringValue(input?.sourceId) ?? fallback?.sourceId,
    campaignActorId: stringValue(input?.campaignActorId) ?? fallback?.campaignActorId,
    combatantId: stringValue(input?.combatantId) ?? fallback?.combatantId,
    ownerUserId: stringValue(input?.ownerUserId) ?? fallback?.ownerUserId,
    controlledByUserId: stringValue(input?.controlledByUserId) ?? fallback?.controlledByUserId,
    displayName: stringValue(input?.displayName) ?? fallback?.displayName,
    imageUrl: stringValue(input?.imageUrl) ?? fallback?.imageUrl,
    initials: stringValue(input?.initials) ?? fallback?.initials,
    kind: input?.kind === 'playerCharacter' || input?.kind === 'npc' || input?.kind === 'monster' || input?.kind === 'companion' || input?.kind === 'object' || input?.kind === 'unknown' ? input.kind : fallback?.kind,
    hpSummary: record(input?.hpSummary) ? { current: numberValue(record(input?.hpSummary)?.current), max: numberValue(record(input?.hpSummary)?.max), temporary: numberValue(record(input?.hpSummary)?.temporary) } : fallback?.hpSummary,
    conditionSummary: Array.isArray(input?.conditionSummary) ? input.conditionSummary.flatMap((item) => stringValue(item) ? [stringValue(item) as string] : []) : fallback?.conditionSummary,
    sourceCombatantId: stringValue(input?.sourceCombatantId) ?? fallback?.sourceCombatantId,
    sourceActorInstanceId: stringValue(input?.sourceActorInstanceId) ?? fallback?.sourceActorInstanceId,
    colorLabel: stringValue(input?.colorLabel) ?? fallback?.colorLabel,
    notes: stringValue(input?.notes) ?? fallback?.notes,
    isHidden: typeof input?.isHidden === 'boolean' ? input.isHidden : fallback?.isHidden,
  };
  return createMapToken(next);
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function templateInput(value: unknown, fallback?: MapAreaTemplate): MapAreaTemplate | null {
  const input = record(value);
  const id = stringValue(input?.id) ?? fallback?.id;
  if (!id) return null;
  const shape = input?.shape === 'circle' || input?.shape === 'cone' || input?.shape === 'line' || input?.shape === 'square' || input?.shape === 'rectangle' ? input.shape : fallback?.shape ?? 'circle';
  const next: MapAreaTemplateInput = {
    id,
    shape,
    x: numberValue(input?.x) ?? fallback?.x ?? 50,
    y: numberValue(input?.y) ?? fallback?.y ?? 50,
    sizeFeet: numberValue(input?.sizeFeet) ?? fallback?.sizeFeet ?? 5,
    widthFeet: numberValue(input?.widthFeet) ?? fallback?.widthFeet,
    rotation: numberValue(input?.rotation) ?? fallback?.rotation ?? 0,
    label: stringValue(input?.label) ?? fallback?.label,
    isHidden: booleanValue(input?.isHidden) ?? fallback?.isHidden,
  };
  return createMapAreaTemplate(next);
}

function gridConfig(value: unknown, fallback?: MapBoardState['grid']) {
  const input = record(value);
  if (!input) return createMapGridConfig(fallback);
  return createMapGridConfig({
    enabled: booleanValue(input.enabled) ?? fallback?.enabled,
    sizePx: numberValue(input.sizePx) ?? fallback?.sizePx,
    feetPerSquare: numberValue(input.feetPerSquare) ?? fallback?.feetPerSquare,
    originX: numberValue(input.originX) ?? fallback?.originX,
    originY: numberValue(input.originY) ?? fallback?.originY,
    snap: booleanValue(input.snap) ?? fallback?.snap,
    showCoordinates: booleanValue(input.showCoordinates) ?? fallback?.showCoordinates,
  });
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
      const backgroundPreset = typeof payload.backgroundPreset === 'string' ? createMapBackgroundPreset(payload.backgroundPreset) : undefined;
      const clearCustomBackground = payload.clearCustomBackground === true;
      if (url || backgroundPreset) state = {
        ...state,
        backgroundUrl: url ?? (clearCustomBackground ? undefined : state.backgroundUrl),
        backgroundName: url ? stringValue(payload.backgroundName) ?? url : clearCustomBackground ? undefined : state.backgroundName,
        backgroundPreset: backgroundPreset ?? state.backgroundPreset,
        updatedAt: event.createdAt,
      };
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
    if (event.eventKind === 'map.grid_updated') {
      state = { ...state, grid: gridConfig(payload.grid, state.grid), updatedAt: event.createdAt };
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
      continue;
    }
    if (event.eventKind === 'map.template_added') {
      const template = templateInput(payload.template);
      if (template && !(state.templates ?? []).some((item) => item.id === template.id)) state = { ...state, templates: [...(state.templates ?? []), template], updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.template_updated') {
      const candidate = record(payload.template);
      const id = stringValue(candidate?.id);
      const existing = id ? (state.templates ?? []).find((item) => item.id === id) : undefined;
      const template = templateInput(candidate, existing);
      if (template && existing) state = { ...state, templates: (state.templates ?? []).map((item) => item.id === template.id ? template : item), updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.template_removed') {
      const id = stringValue(payload.templateId);
      if (id) state = { ...state, templates: (state.templates ?? []).filter((item) => item.id !== id), selectedTemplateId: state.selectedTemplateId === id ? undefined : state.selectedTemplateId, updatedAt: event.createdAt };
      continue;
    }
    if (event.eventKind === 'map.templates_cleared') {
      state = { ...state, templates: [], selectedTemplateId: undefined, updatedAt: event.createdAt };
    }
  }

  return state;
}

export function hasMapRuntimeEvents(events: ReadonlyArray<Pick<MapRuntimeReplayEvent, 'eventKind'>>): boolean {
  return events.some((event) => event.eventKind.startsWith('map.'));
}
