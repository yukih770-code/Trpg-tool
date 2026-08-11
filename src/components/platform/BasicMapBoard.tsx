import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent, type PointerEvent } from 'react';
import { Circle, Grid3X3, Hand, Image, Minus, MousePointer2, Pin, Plus, RectangleHorizontal, RotateCcw, Ruler, Shapes, Square, Triangle, UsersRound } from 'lucide-react';
import { createTranslator, type Locale } from '../../i18n';
import { describeTokenControlHint } from '../../lib/platform/roomPlayerFlow';
import type { CampaignActorInstance } from '../../lib/api/campaignRoomApiClient';
import type { Combatant } from '../../lib/combat/combatRuntimeTypes';
import { hasMapRuntimeEvents, type MapRuntimeReplayEvent } from '../../lib/map/mapRuntimeReplay';
import { useMapRuntimeBoard } from '../../lib/map/useMapRuntimeBoard';
import { campaignActorPresenceCandidate, combatantPresenceCandidate, linkedTokenForCandidate, toMapTokenPrototype, tokenInitials, tokenWithCombatProjection, type MapTokenPresenceCandidate } from '../../lib/map/actorPresence';
import { resolveTokenVisualIdentity } from '../../lib/map/tokenVisualIdentity';
import { MAP_BACKGROUND_PRESETS, createMapAreaTemplate, measureMapDistance, snapMapPosition, type MapAreaTemplate, type MapAreaTemplateInput, type MapBackgroundPreset, type MapBoardState, type MapInteractionPreview, type MapRuntimeEventDraft, type MapTemplateShape, type MapToken, type MapTokenSize } from '../../lib/map/mapRuntimeTypes';

type Props = {
  locale: Locale;
  mapId: string;
  mapEvents: MapRuntimeReplayEvent[];
  /** Read-only scene image fallback until a room map event sets a map image. */
  fallbackBackgroundUrl?: string;
  /** Optional scene context shown over the board without becoming map state. */
  sceneTitle?: string;
  sceneDescription?: string;
  /** Source-specific boundary note; defaults to the legacy campaign map note. */
  statusNote?: string;
  campaignActors?: CampaignActorInstance[];
  combatants?: Combatant[];
  /** Presentation-only current-turn indicator from the shared combat table. */
  activeCombatantId?: string;
  /** One-shot request from the combat HUD to select a linked token. */
  locateCombatantId?: string;
  /** Lets the Runtime combat surface follow a token selection without changing map ownership. */
  onSelectCombatant?: (combatantId: string) => void;
  /** Opens a viewer-safe runtime inspect panel from a selected map token. */
  onInspectToken?: (token: MapToken) => void;
  /** Optional sources from system-specific actor/monster surfaces. */
  actorPresenceCandidates?: MapTokenPresenceCandidate[];
  canManage: boolean;
  /** Client-side affordance only; Room Runtime still verifies every live move on the server. */
  canMoveToken?: (token: MapToken) => boolean;
  tokenMoveDeniedMessage?: string;
  /** Approved binding used only to explain when a player's Token has not been placed yet. */
  controlledTokenBindingId?: string;
  /** Allows a non-host collaborator to create (but not edit) permanent range marks. */
  canPinRanges?: boolean;
  /** Allows an active participant to relay a temporary ruler or range preview. */
  canShareTemporaryRanges?: boolean;
  sharedPreviews?: Array<{ authorMemberId: string; authorDisplayName: string; preview: MapInteractionPreview }>;
  onSharePreview?: (preview?: MapInteractionPreview) => void;
  mapCollaborators?: Array<{ memberId: string; displayName: string; canPinRanges: boolean; canMoveOwnToken: boolean }>;
  onSetCanPinRanges?: (memberId: string, canPinRanges: boolean) => Promise<void>;
  onSetCanMoveOwnToken?: (memberId: string, canMoveOwnToken: boolean) => Promise<void>;
  onBoardChange?: (state: MapBoardState) => void;
  snapshotBoard?: MapBoardState;
  snapshotImportVersion?: number;
  onAppendEvent?: (event: MapRuntimeEventDraft) => Promise<void>;
  /** Workspace keeps the full editor; Runtime uses a compact tabletop overlay. */
  presentation?: 'workspace' | 'runtime';
};

type ToolMode = 'select' | 'move' | 'measure' | 'template';
type UtilityPanel = 'grid' | 'background' | 'template' | 'units' | undefined;
type TemplateCommitMode = 'preview' | 'pinned';
type Point = { x: number; y: number };
type DragState =
  | { kind: 'pan'; startX: number; startY: number; originX: number; originY: number }
  | { kind: 'token'; tokenId: string; startX: number; startY: number; originX: number; originY: number; last: Point }
  | { kind: 'template'; templateId: string; startX: number; startY: number; originX: number; originY: number; last: Point }
  | { kind: 'template-draw'; start: Point; end: Point }
  | { kind: 'measure'; start: Point; end: Point };

const sizes: MapTokenSize[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'custom'];
const templateShapes: MapTemplateShape[] = ['circle', 'cone', 'line', 'square', 'rectangle'];
const quickTemplateSizes = [5, 10, 15, 20, 30, 60];

function backgroundPresetStyle(preset: MapBackgroundPreset | undefined): CSSProperties {
  const selected = preset ?? 'tactical_gray';
  const styles: Record<MapBackgroundPreset, CSSProperties> = {
    blank: { background: '#f7f3ea' },
    parchment: { backgroundColor: '#ead7a4', backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,.36), transparent 36%), linear-gradient(135deg, rgba(102,60,15,.10), transparent 48%)' },
    light_grid: { backgroundColor: '#edf2ef', backgroundImage: 'linear-gradient(rgba(68,91,91,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(68,91,91,.13) 1px, transparent 1px)', backgroundSize: '24px 24px' },
    dark_dungeon: { backgroundColor: '#293036', backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.045) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,.045) 25%, transparent 25%)', backgroundSize: '26px 26px' },
    stone_floor: { backgroundColor: '#a9a59a', backgroundImage: 'linear-gradient(30deg, rgba(65,61,54,.13) 12%, transparent 12.5%, transparent 87%, rgba(65,61,54,.13) 87.5%)', backgroundSize: '36px 30px' },
    town_square: { backgroundColor: '#b7a487', backgroundImage: 'linear-gradient(45deg, rgba(91,74,55,.20) 25%, transparent 25%, transparent 75%, rgba(91,74,55,.20) 75%), linear-gradient(-45deg, rgba(255,255,255,.16) 25%, transparent 25%, transparent 75%, rgba(255,255,255,.16) 75%)', backgroundSize: '42px 42px' },
    grassland: { backgroundColor: '#718d5b', backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(216,231,157,.25), transparent 28%), radial-gradient(circle at 70% 65%, rgba(51,88,49,.25), transparent 34%)' },
    sand: { backgroundColor: '#d7b77a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.18) 1px, transparent 1.5px)', backgroundSize: '12px 12px' },
    water: { backgroundColor: '#5d9bb5', backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.16) 0 1px, transparent 1px 14px), repeating-linear-gradient(90deg, rgba(35,88,118,.12) 0 1px, transparent 1px 24px)' },
    tactical_gray: { backgroundColor: '#626b72', backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,.05) 25%, transparent 25%)', backgroundSize: '28px 28px' },
  };
  return styles[selected];
}

function nextPosition(index: number): Point {
  return { x: 20 + (index % 5) * 15, y: 25 + Math.floor(index / 5) * 15 };
}

function sourceLabel(sourceType: MapToken['sourceType'], locale: Locale): string {
  if (locale === 'en') return sourceType === 'campaign_actor' ? 'Campaign character' : sourceType === 'combatant' ? 'Combatant' : sourceType === 'dndLiteActor' ? 'DND Lite actor' : sourceType === 'monsterTemplate' ? 'Monster template' : sourceType === 'vaultActor' ? 'Character vault' : sourceType === 'roomActorBinding' ? 'Admitted room character' : sourceType === 'quickDraft' ? 'Character draft' : sourceType === 'manual' ? 'Manual' : 'Unknown';
  return sourceType === 'campaign_actor' ? '战役角色' : sourceType === 'combatant' ? '战斗单位' : sourceType === 'dndLiteActor' ? 'DND Lite 角色' : sourceType === 'monsterTemplate' ? '怪物模板' : sourceType === 'vaultActor' ? '角色库角色' : sourceType === 'roomActorBinding' ? '已准入角色' : sourceType === 'quickDraft' ? '角色草稿' : sourceType === 'manual' ? '手动' : '未知';
}

function sizeLabel(size: MapTokenSize, locale: Locale): string {
  if (locale === 'en') return size;
  const labels: Record<MapTokenSize, string> = { tiny: '微型', small: '小型', medium: '中型', large: '大型', huge: '巨型', gargantuan: '超巨型', custom: '自定义' };
  return labels[size];
}

function tokenKindLabel(kind: MapToken['kind'], locale: Locale): string {
  const normalized = kind ?? 'unknown';
  if (locale === 'en') {
    return normalized === 'playerCharacter' ? 'Character' : normalized === 'monster' ? 'Monster' : normalized === 'npc' ? 'NPC' : normalized === 'companion' ? 'Companion' : normalized === 'object' ? 'Object' : 'Unknown';
  }
  return normalized === 'playerCharacter' ? '角色' : normalized === 'monster' ? '怪物' : normalized === 'npc' ? 'NPC' : normalized === 'companion' ? '伙伴' : normalized === 'object' ? '物体' : '未知单位';
}

function templateLabel(shape: MapTemplateShape, locale: Locale): string {
  const zh: Record<MapTemplateShape, string> = { circle: '圆形', cone: '锥形', line: '直线', square: '正方形', rectangle: '矩形' };
  return locale === 'en' ? shape : zh[shape];
}

function templateDimensionLabel(template: Pick<MapAreaTemplate, 'shape' | 'sizeFeet' | 'widthFeet' | 'label'>, locale: Locale): string {
  if (template.label) return template.label;
  const size = Math.round(template.sizeFeet);
  const width = Math.round(template.widthFeet ?? template.sizeFeet);
  if (locale === 'en') {
    if (template.shape === 'circle') return `R ${size} ft`;
    if (template.shape === 'rectangle') return `${size} × ${width} ft`;
    if (template.shape === 'square') return `${size} × ${size} ft`;
    return `${size} ft`;
  }
  if (template.shape === 'circle') return `半径 ${size} 英尺`;
  if (template.shape === 'rectangle') return `${size} × ${width} 英尺`;
  if (template.shape === 'square') return `${size} × ${size} 英尺`;
  return `${size} 英尺`;
}

function presetLabel(preset: MapBackgroundPreset, locale: Locale): string {
  const zh: Record<MapBackgroundPreset, string> = { blank: '空白', parchment: '羊皮纸', light_grid: '浅色网格', dark_dungeon: '暗色地牢', stone_floor: '石板地面', town_square: '城镇广场', grassland: '草地', sand: '沙地', water: '水域', tactical_gray: '灰色战术板' };
  const en: Record<MapBackgroundPreset, string> = { blank: 'Blank', parchment: 'Parchment', light_grid: 'Light grid', dark_dungeon: 'Dark dungeon', stone_floor: 'Stone floor', town_square: 'Town square', grassland: 'Grassland', sand: 'Sand', water: 'Water', tactical_gray: 'Tactical gray' };
  return locale === 'en' ? en[preset] : zh[preset];
}

function templateStyle(template: MapAreaTemplate, board: MapBoardState): CSSProperties {
  const grid = board.grid;
  const pixelsPerFoot = (grid?.sizePx ?? 50) / (grid?.feetPerSquare ?? 5);
  const length = Math.max(5, template.sizeFeet * pixelsPerFoot);
  const width = Math.max(5, (template.widthFeet ?? template.sizeFeet) * pixelsPerFoot);
  const base: CSSProperties = { left: `${template.x}%`, top: `${template.y}%`, transform: `translate(-50%, -50%) rotate(${template.rotation}deg)`, transformOrigin: 'center', opacity: template.isHidden ? 0.3 : 1 };
  if (template.shape === 'circle') return { ...base, width: length * 2, height: length * 2, borderRadius: '999px' };
  // Lines and cones are origin-based. Centering them would move the start
  // point away from the first click, which feels wrong for measuring/casting.
  if (template.shape === 'cone') return { ...base, width: length, height: length, marginTop: -length / 2, transform: `rotate(${template.rotation}deg)`, transformOrigin: '0 50%', clipPath: 'polygon(0 50%, 100% 0, 100% 100%)' };
  if (template.shape === 'line') {
    const thickness = Math.max(6, width / 5);
    return { ...base, width: length, height: thickness, marginTop: -thickness / 2, transform: `rotate(${template.rotation}deg)`, transformOrigin: '0 50%' };
  }
  return { ...base, width: length, height: template.shape === 'square' ? length : width };
}

function templateDragHint(shape: MapTemplateShape, locale: Locale): string {
  if (locale === 'en') {
    if (shape === 'circle') return 'First click is the center; drag to set the radius.';
    if (shape === 'line' || shape === 'cone') return 'First click is the origin; drag to set direction and length.';
    if (shape === 'square') return 'First click is a corner; drag to lock the square side by the dominant direction.';
    return 'First click is a corner; drag to the opposite corner.';
  }
  if (shape === 'circle') return '起点是圆心，拖动决定半径。';
  if (shape === 'line' || shape === 'cone') return '起点是原点，拖动决定方向和长度。';
  if (shape === 'square') return '起点是角点，按主拖拽方向锁定正方形边长。';
  return '起点是角点，拖动到对角。';
}

export function BasicMapBoard({ locale, mapId, mapEvents, fallbackBackgroundUrl, sceneTitle, sceneDescription, statusNote, campaignActors = [], combatants = [], activeCombatantId, locateCombatantId, onSelectCombatant, onInspectToken, actorPresenceCandidates = [], canManage, canMoveToken, tokenMoveDeniedMessage, controlledTokenBindingId, canPinRanges = false, canShareTemporaryRanges = false, sharedPreviews = [], onSharePreview, mapCollaborators = [], onSetCanPinRanges, onSetCanMoveOwnToken, onBoardChange, snapshotBoard, snapshotImportVersion, onAppendEvent, presentation = 'workspace' }: Props) {
  const { t } = createTranslator(locale);
  const board = useMapRuntimeBoard(mapId);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const restoredScopeRef = useRef('');
  const importedSnapshotRef = useRef(0);
  const lastSharedPreviewAtRef = useRef(0);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [activePanel, setActivePanel] = useState<UtilityPanel>();
  const [measurement, setMeasurement] = useState<{ start: Point; end: Point }>();
  const [templateDraft, setTemplateDraft] = useState<MapAreaTemplate>();
  const [templateGesture, setTemplateGesture] = useState<{ start: Point; end: Point }>();
  const [templateCommitMode, setTemplateCommitMode] = useState<TemplateCommitMode>('preview');
  const [lastMovement, setLastMovement] = useState<{ name: string; feet: number; squares: number }>();
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [backgroundName, setBackgroundName] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSize, setTokenSize] = useState<MapTokenSize>('medium');
  const [tokenNotes, setTokenNotes] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [selectedSize, setSelectedSize] = useState<MapTokenSize>('medium');
  const [selectedNotes, setSelectedNotes] = useState('');
  const [gridSize, setGridSize] = useState('50');
  const [feetPerSquare, setFeetPerSquare] = useState('5');
  const [templateShape, setTemplateShape] = useState<MapTemplateShape>('circle');
  const [templateSize, setTemplateSize] = useState('15');
  const [templateWidth, setTemplateWidth] = useState('5');
  const [templateName, setTemplateName] = useState('');
  const [eventError, setEventError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [failedTokenImages, setFailedTokenImages] = useState<Record<string, true>>({});
  const [tokenMenu, setTokenMenu] = useState<{ token: MapToken; x: number; y: number }>();

  const mapEventKey = mapEvents.map((event, index) => `${event.seq ?? index}:${event.eventKind}:${event.createdAt ?? ''}`).join('|');
  const selectedToken = board.state.selectedTokenId ? board.state.tokens.find((token) => token.id === board.state.selectedTokenId) : undefined;
  const selectedTemplate = board.state.selectedTemplateId ? (board.state.templates ?? []).find((template) => template.id === board.state.selectedTemplateId) : undefined;
  const grid = board.state.grid;
  const mayPinRanges = canManage || canPinRanges;
  const mayMoveToken = (token: MapToken) => canManage || canMoveToken?.(token) === true;
  const moveDeniedMessage = tokenMoveDeniedMessage ?? (locale === 'en' ? 'You can only move your own admitted character.' : '你只能移动自己的已准入角色。');
  const hasControlledToken = !controlledTokenBindingId || board.state.tokens.some((token) => token.actorBindingId === controlledTokenBindingId);
  const tokenControlHint = describeTokenControlHint({
    locale: locale === 'en' ? 'en' : 'zh',
    isHost: canManage,
    hasSelectedToken: !!selectedToken,
    canMoveSelectedToken: !!selectedToken && mayMoveToken(selectedToken),
    hasControlledBinding: !!controlledTokenBindingId,
    hasControlledToken,
  });
  const presenceCandidates = [
    ...combatants.map(combatantPresenceCandidate),
    ...campaignActors.map(campaignActorPresenceCandidate),
    ...actorPresenceCandidates,
  ].filter((candidate, index, all) => all.findIndex((item) => `${item.sourceType}:${item.sourceId}` === `${candidate.sourceType}:${candidate.sourceId}`) === index);

  useEffect(() => {
    if (!locateCombatantId) return;
    const combatant = combatants.find((item) => item.id === locateCombatantId);
    const token = board.state.tokens.find((item) => item.combatantId === locateCombatantId
      || item.sourceCombatantId === locateCombatantId
      || item.id === combatant?.mapTokenId
      || (!!combatant?.sourceActorInstanceId && (item.campaignActorId === combatant.sourceActorInstanceId || item.sourceActorInstanceId === combatant.sourceActorInstanceId)));
    if (token && board.state.selectedTokenId !== token.id) board.selectToken(token.id);
  }, [board, combatants, locateCombatantId]);

  useEffect(() => {
    const restoreKey = `${mapId}:${mapEventKey}`;
    if (restoredScopeRef.current === restoreKey || !hasMapRuntimeEvents(mapEvents)) return;
    board.restore(mapEvents);
    restoredScopeRef.current = restoreKey;
  }, [board.restore, mapEventKey, mapEvents, mapId]);

  useEffect(() => { onBoardChange?.(board.state); }, [board.state, onBoardChange]);
  useEffect(() => {
    if (!snapshotBoard || !snapshotImportVersion || importedSnapshotRef.current === snapshotImportVersion) return;
    board.replaceState(snapshotBoard);
    importedSnapshotRef.current = snapshotImportVersion;
  }, [board.replaceState, snapshotBoard, snapshotImportVersion]);
  const displayedBackgroundUrl = board.state.backgroundUrl ?? fallbackBackgroundUrl;

  useEffect(() => {
    setBackgroundUrl(board.state.backgroundUrl ?? '');
    setBackgroundName(board.state.backgroundName ?? '');
    setImageError(false);
  }, [board.state.backgroundUrl, board.state.backgroundName, fallbackBackgroundUrl]);
  useEffect(() => {
    setSelectedName(selectedToken?.name ?? '');
    setSelectedSize(selectedToken?.size ?? 'medium');
    setSelectedNotes(selectedToken?.notes ?? '');
  }, [selectedToken?.id]);
  useEffect(() => {
    setGridSize(String(grid?.sizePx ?? 50));
    setFeetPerSquare(String(grid?.feetPerSquare ?? 5));
  }, [grid?.feetPerSquare, grid?.sizePx]);
  useEffect(() => {
    if (!tokenMenu) return;
    const close = (event?: globalThis.PointerEvent) => {
      if ((event.target as HTMLElement | null)?.closest('[data-token-context-menu]')) return;
      setTokenMenu(undefined);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [tokenMenu]);

  const emit = (event: MapRuntimeEventDraft | null) => {
    if (!event || !onAppendEvent) return;
    setEventError('');
    void onAppendEvent(event).catch(() => {
      board.restore(mapEvents);
      setEventError(event.eventKind === 'map.token_moved' ? moveDeniedMessage : t('mapRuntime.eventSaveFailed'));
    });
  };

  const changeViewport = (patch: { zoom?: number; panX?: number; panY?: number }) => {
    const event = board.changeViewport(patch);
    if (canManage) emit(event);
  };

  const pointFromEvent = (event: PointerEvent<HTMLDivElement>): Point | null => {
    const element = boardRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left - board.state.panX) / board.state.zoom / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top - board.state.panY) / board.state.zoom / rect.height) * 100)),
    };
  };

  const selectToken = (token: MapToken) => {
    board.selectToken(token.id);
    const combatant = combatants.find((item) => item.id === token.combatantId
      || item.id === token.sourceCombatantId
      || item.mapTokenId === token.id
      || (!!token.sourceActorInstanceId && item.sourceActorInstanceId === token.sourceActorInstanceId)
      || (!!token.campaignActorId && item.sourceActorInstanceId === token.campaignActorId));
    if (combatant) onSelectCombatant?.(combatant.id);
  };

  const openTokenMenu = (event: MouseEvent<HTMLButtonElement>, token: MapToken) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    selectToken(token);
    setTokenMenu({
      token,
      x: Math.min(88, Math.max(3, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(86, Math.max(3, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  };

  const addToken = (input: { name: string; sourceType: MapToken['sourceType']; sourceCombatantId?: string; sourceActorInstanceId?: string; notes?: string }) => {
    if (!canManage || !input.name.trim()) return;
    const result = board.addToken({ ...input, displayName: input.name.trim(), initials: tokenInitials(input.name), kind: 'unknown', ...nextPosition(board.state.tokens.length), size: tokenSize });
    emit(result.event);
  };

  const placeCandidate = (candidate: MapTokenPresenceCandidate) => {
    if (!canManage) return;
    const existing = linkedTokenForCandidate(board.state.tokens, candidate);
    if (existing) { board.selectToken(existing.id); return; }
    const offset = Math.min(board.state.tokens.length, 6) * 3;
    const result = board.addToken(toMapTokenPrototype(candidate, { x: 50 + offset, y: 50 + offset }));
    emit(result.event);
  };

  const locateCandidate = (candidate: MapTokenPresenceCandidate) => {
    const token = linkedTokenForCandidate(board.state.tokens, candidate);
    if (token) board.selectToken(token.id);
  };

  const addTemplate = (position: Point) => {
    if (!mayPinRanges) return;
    const result = board.addTemplate({ shape: templateShape, x: position.x, y: position.y, sizeFeet: Number(templateSize) || 5, widthFeet: templateShape === 'rectangle' || templateShape === 'line' ? Number(templateWidth) || 5 : undefined, label: templateName.trim() || undefined, rotation: 0 });
    emit(result.event);
  };

  const templateFromDrag = (start: Point, end: Point, shape = templateShape, label = templateName.trim() || undefined): MapAreaTemplate | null => {
    const element = boardRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const activeGrid = grid ?? { sizePx: 50, feetPerSquare: 5 };
    const feetPerPixel = activeGrid.feetPerSquare / activeGrid.sizePx;
    const deltaXPx = ((end.x - start.x) / 100) * rect.width / board.state.zoom;
    const deltaYPx = ((end.y - start.y) / 100) * rect.height / board.state.zoom;
    const dxPx = Math.abs(deltaXPx);
    const dyPx = Math.abs(deltaYPx);
    const distanceFeet = Math.max(1, Math.hypot(dxPx, dyPx) * feetPerPixel);
    const horizontalFeet = Math.max(1, dxPx * feetPerPixel);
    const verticalFeet = Math.max(1, dyPx * feetPerPixel);
    const rotation = Math.atan2(deltaYPx, deltaXPx) * 180 / Math.PI;
    const squareFeet = Math.max(horizontalFeet, verticalFeet);
    const squarePixels = squareFeet / feetPerPixel;
    const boardWidth = rect.width / board.state.zoom;
    const boardHeight = rect.height / board.state.zoom;
    const squareCenter = {
      x: start.x + (end.x === start.x ? (end.y >= start.y ? 1 : -1) : Math.sign(end.x - start.x)) * (squarePixels / boardWidth * 50),
      y: start.y + (end.y === start.y ? (end.x >= start.x ? 1 : -1) : Math.sign(end.y - start.y)) * (squarePixels / boardHeight * 50),
    };
    const input: MapAreaTemplateInput = shape === 'circle'
      ? { id: 'template-draft', shape, x: start.x, y: start.y, sizeFeet: distanceFeet, rotation: 0, label }
      : shape === 'line' || shape === 'cone'
        ? { id: 'template-draft', shape, x: start.x, y: start.y, sizeFeet: distanceFeet, widthFeet: shape === 'line' ? Math.max(5, Number(templateWidth) || 5) : undefined, rotation, label }
        : shape === 'square'
          ? { id: 'template-draft', shape, x: squareCenter.x, y: squareCenter.y, sizeFeet: squareFeet, rotation: 0, label }
          : { id: 'template-draft', shape, x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, sizeFeet: horizontalFeet, widthFeet: verticalFeet, rotation: 0, label };
    return createMapAreaTemplate(input);
  };

  const sharePreview = (preview?: MapInteractionPreview) => {
    if (!canShareTemporaryRanges || !onSharePreview) return;
    if (preview) {
      const now = Date.now();
      if (now - lastSharedPreviewAtRef.current < 60) return;
      lastSharedPreviewAtRef.current = now;
    }
    onSharePreview(preview);
  };

  const handleAddManualToken = (event: FormEvent) => {
    event.preventDefault();
    addToken({ name: tokenName, sourceType: 'manual', notes: tokenNotes.trim() || undefined });
    setTokenName('');
    setTokenNotes('');
  };
  const saveSelectedToken = () => {
    if (!selectedToken || !canManage) return;
    emit(board.updateToken(selectedToken.id, { name: selectedName, size: selectedSize, notes: selectedNotes.trim() || undefined }));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const point = pointFromEvent(event);
    if (!point) return;
    const target = event.target as HTMLElement;
    const templateId = target.closest('[data-map-template]')?.getAttribute('data-map-template');
    const tokenId = target.closest('[data-map-token]')?.getAttribute('data-map-token');
    if (toolMode === 'measure') {
      dragRef.current = { kind: 'measure', start: point, end: point };
      setMeasurement({ start: point, end: point });
      sharePreview({ kind: 'ruler', start: point, end: point });
    } else if (toolMode === 'template' && !templateId && !tokenId) {
      dragRef.current = { kind: 'template-draw', start: point, end: point };
      setTemplateDraft(templateFromDrag(point, point) ?? undefined);
      setTemplateGesture({ start: point, end: point });
      sharePreview({ kind: 'area', start: point, end: point, shape: templateShape });
    } else if (templateId && canManage) {
      const template = (board.state.templates ?? []).find((item) => item.id === templateId);
      if (template) { board.selectTemplate(templateId); dragRef.current = { kind: 'template', templateId, startX: event.clientX, startY: event.clientY, originX: template.x, originY: template.y, last: { x: template.x, y: template.y } }; }
    } else if (tokenId) {
      const token = board.state.tokens.find((item) => item.id === tokenId);
      if (token) {
        selectToken(token);
        if (mayMoveToken(token)) {
          dragRef.current = { kind: 'token', tokenId, startX: event.clientX, startY: event.clientY, originX: token.x, originY: token.y, last: { x: token.x, y: token.y } };
        } else {
          setEventError(moveDeniedMessage);
        }
      }
    } else {
      dragRef.current = { kind: 'pan', startX: event.clientX, startY: event.clientY, originX: board.state.panX, originY: board.state.panY };
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const element = boardRef.current;
    if (!drag || !element) return;
    const rect = element.getBoundingClientRect();
    if (drag.kind === 'measure') {
      const end = pointFromEvent(event);
      if (!end) return;
      dragRef.current = { ...drag, end };
      setMeasurement({ start: drag.start, end });
      sharePreview({ kind: 'ruler', start: drag.start, end });
      return;
    }
    if (drag.kind === 'template-draw') {
      const end = pointFromEvent(event);
      if (!end) return;
      dragRef.current = { ...drag, end };
      setTemplateDraft(templateFromDrag(drag.start, end) ?? undefined);
      setTemplateGesture({ start: drag.start, end });
      sharePreview({ kind: 'area', start: drag.start, end, shape: templateShape });
      return;
    }
    if (drag.kind === 'token' || drag.kind === 'template') {
      const raw = { x: drag.originX + ((event.clientX - drag.startX) / rect.width) * 100 / board.state.zoom, y: drag.originY + ((event.clientY - drag.startY) / rect.height) * 100 / board.state.zoom };
      const next = drag.kind === 'token' ? snapMapPosition(raw.x, raw.y, grid, rect.width / board.state.zoom, rect.height / board.state.zoom) : raw;
      dragRef.current = { ...drag, last: next };
      if (drag.kind === 'token') board.moveToken(drag.tokenId, next.x, next.y);
      else board.updateTemplate(drag.templateId, { x: next.x, y: next.y });
      return;
    }
    board.changeViewport({ panX: drag.originX + event.clientX - drag.startX, panY: drag.originY + event.clientY - drag.startY });
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    const element = boardRef.current;
    if (drag.kind === 'token') {
      const token = board.state.tokens.find((item) => item.id === drag.tokenId);
      if (token) {
        emit(board.moveToken(token.id, drag.last.x, drag.last.y));
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = measureMapDistance({ x: drag.originX, y: drag.originY }, drag.last, grid, rect.width / board.state.zoom, rect.height / board.state.zoom);
          setLastMovement({ name: token.name, ...distance });
        }
      }
    } else if (drag.kind === 'template') {
      emit(board.updateTemplate(drag.templateId, { x: drag.last.x, y: drag.last.y }));
    } else if (drag.kind === 'template-draw') {
      const end = pointFromEvent(event) ?? drag.end;
      const draft = templateFromDrag(drag.start, end);
      if (draft && templateCommitMode === 'pinned' && mayPinRanges) {
        const result = board.addTemplate({ ...draft, id: undefined });
        emit(result.event);
      }
      setTemplateDraft(undefined);
      setTemplateGesture(undefined);
    } else if (drag.kind === 'pan' && canManage) {
      emit(board.changeViewport({ panX: board.state.panX, panY: board.state.panY, zoom: board.state.zoom }));
    }
    if (drag.kind === 'measure') setMeasurement(undefined);
    if (drag.kind === 'measure' || drag.kind === 'template-draw') sharePreview();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const visibleTokens = (canManage ? board.state.tokens : board.state.tokens.filter((token) => !token.isHidden)).map((token) => tokenWithCombatProjection(token, combatants));
  const visibleTemplates = canManage ? board.state.templates ?? [] : (board.state.templates ?? []).filter((template) => !template.isHidden);
  const isCurrentTurnToken = (token: MapToken) => {
    if (!activeCombatantId) return false;
    const combatant = combatants.find((item) => item.id === activeCombatantId);
    return token.combatantId === activeCombatantId
      || token.sourceCombatantId === activeCombatantId
      || token.id === combatant?.mapTokenId
      || (!!combatant?.sourceActorInstanceId && (token.campaignActorId === combatant.sourceActorInstanceId || token.sourceActorInstanceId === combatant.sourceActorInstanceId));
  };
  const tokenContents = (token: MapToken) => {
    const identity = resolveTokenVisualIdentity(token, { imageFailed: failedTokenImages[token.id] });
    const hpLabel = token.hpDisplay?.kind === 'exact'
      ? `HP ${token.hpDisplay.current ?? '—'}${token.hpDisplay.max === undefined ? '' : `/${token.hpDisplay.max}`}`
      : token.hpDisplay?.kind === 'stage'
        ? ({ uninjured: '未受伤', wounded: '轻伤', bloodied: '重伤', nearDeath: '濒死', defeated: '已倒下' }[token.hpDisplay.stage])
        : token.hpDisplay?.kind === 'unknown' ? 'HP：未知' : identity.hpSummary;
    const acLabel = token.acDisplay?.kind === 'exact' ? `AC ${token.acDisplay.value}` : token.acDisplay?.kind === 'unknown' ? 'AC：未知' : undefined;
    const exactHp = token.hpDisplay?.kind === 'exact' ? token.hpDisplay : undefined;
    const hpRatio = exactHp?.current !== undefined && exactHp.max !== undefined && exactHp.max > 0
      ? Math.max(0, Math.min(1, exactHp.current / exactHp.max))
      : undefined;
    const tooltipStats = [hpLabel, acLabel, identity.conditionSummary ? `状态：${identity.conditionSummary}` : undefined].filter((value): value is string => Boolean(value));
    const hoverVerticalPlacement = token.y < 20 ? 'top-full mt-2' : 'bottom-full mb-2';
    const hoverHorizontalPlacement = token.x < 18
      ? 'left-0'
      : token.x > 82
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';
    return <>
      <span
        aria-label={hpRatio === undefined ? undefined : hpLabel}
        className={`relative grid h-12 w-12 place-items-center rounded-full border border-slate-950/65 bg-slate-700 p-[3px] shadow-md ${token.isHidden ? 'opacity-70' : ''}`}
        style={hpRatio === undefined ? undefined : { background: `conic-gradient(#dc2626 ${Math.round(hpRatio * 360)}deg, rgba(71, 85, 105, .92) 0deg)` }}
      >
        <span className="relative grid h-full w-full place-items-center overflow-hidden rounded-full border border-white/90 bg-[#294966] text-[12px] font-black text-white">
          {identity.imageUrl ? (
            <img
              src={identity.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setFailedTokenImages((current) => current[token.id] ? current : { ...current, [token.id]: true })}
            />
          ) : identity.initials}
        </span>
        {identity.hasCombatLink && (
          <span aria-label={locale === 'en' ? 'Linked combatant' : '已关联战斗'} className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border border-white bg-slate-900 text-[8px] text-white shadow">⚔</span>
        )}
      </span>
      <span className="max-w-28 truncate rounded bg-slate-950/80 px-1.5 py-0.5 text-center text-[10px] font-bold text-white shadow">{identity.label}</span>
      <span className={`pointer-events-none absolute z-30 hidden w-48 rounded-lg border border-slate-700/70 bg-slate-950/95 px-2.5 py-2 text-left text-[10px] leading-4 text-slate-100 shadow-xl group-hover:block group-focus-visible:block ${hoverVerticalPlacement} ${hoverHorizontalPlacement}`}>
        <span className="block truncate text-[11px] font-black text-white">{identity.label}</span>
        <span className="block text-slate-300">{tokenKindLabel(token.kind, locale)} · {sourceLabel(token.sourceType, locale)}</span>
        {tooltipStats.length > 0 && <span className="mt-1 block text-slate-100">{tooltipStats.join(' · ')}</span>}
        <span className="mt-1 block text-slate-400">双击或右键选择“查看信息”</span>
      </span>
    </>;
  };
  const measurementDistance = measurement && boardRef.current ? measureMapDistance(measurement.start, measurement.end, grid, boardRef.current.getBoundingClientRect().width / board.state.zoom, boardRef.current.getBoundingClientRect().height / board.state.zoom) : undefined;
  const pointerLabelStyle = (point: Point): CSSProperties => ({
    left: `${point.x}%`,
    top: `${point.y}%`,
    transform: `translate(${point.x > 74 ? 'calc(-100% - 14px)' : '14px'}, ${point.y > 24 ? 'calc(-100% - 14px)' : '14px'})`,
  });
  const dragLineStyle = (start: Point, end: Point): CSSProperties => {
    const rect = boardRef.current?.getBoundingClientRect();
    const width = rect?.width || 1;
    const height = rect?.height || 1;
    const deltaX = ((end.x - start.x) / 100) * width;
    const deltaY = ((end.y - start.y) / 100) * height;
    return {
      left: `${start.x}%`,
      top: `${start.y}%`,
      width: `${Math.hypot(deltaX, deltaY) / width * 100}%`,
      transform: `rotate(${Math.atan2(deltaY, deltaX) * 180 / Math.PI}deg)`,
    };
  };
  const anchorStyle = (point: Point): CSSProperties => ({ left: `${point.x}%`, top: `${point.y}%` });
  const gridStyle: CSSProperties | undefined = grid?.enabled ? {
    backgroundImage: 'linear-gradient(to right, rgba(88,24,13,.24) 1px, transparent 1px), linear-gradient(to bottom, rgba(88,24,13,.24) 1px, transparent 1px)',
    backgroundSize: `${grid.sizePx}px ${grid.sizePx}px`,
    backgroundPosition: `${grid.originX}px ${grid.originY}px`,
  } : undefined;
  const sharedAreaPreviews = sharedPreviews.flatMap(({ authorMemberId, authorDisplayName, preview }) => {
    if (preview.kind !== 'area' || !preview.shape) return [];
    const template = templateFromDrag(preview.start, preview.end, preview.shape, '');
    return template ? [{ authorMemberId, authorDisplayName, template, start: preview.start }] : [];
  });
  const sharedRulerPreviews = sharedPreviews.filter(({ preview }) => preview.kind === 'ruler');
  const previewDistance = (preview: MapInteractionPreview) => {
    if (!boardRef.current) return undefined;
    const rect = boardRef.current.getBoundingClientRect();
    return measureMapDistance(preview.start, preview.end, grid, rect.width / board.state.zoom, rect.height / board.state.zoom);
  };
  const sharedPreviewLayer = <>
    {sharedAreaPreviews.map(({ authorMemberId, authorDisplayName, template, start }) => <div key={`${authorMemberId}:${template.id}`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10"><div className="absolute border-2 border-dashed border-[#2563eb] bg-[#60a5fa]/20 shadow-sm" style={templateStyle(template, board.state)}><span className="absolute left-1 top-1 whitespace-nowrap rounded bg-[#1e3a5f]/85 px-1.5 py-0.5 text-[10px] font-bold text-white">{authorDisplayName} · {templateDimensionLabel(template, locale)}</span></div><span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#2563eb] shadow" style={anchorStyle(start)} /></div>)}
    {sharedRulerPreviews.map(({ authorMemberId, authorDisplayName, preview }) => {
      const distance = previewDistance(preview);
      return <div key={`${authorMemberId}:ruler`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute h-0 origin-left border-t-2 border-dashed border-[#2563eb]" style={dragLineStyle(preview.start, preview.end)} />
        <span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#2563eb] shadow" style={anchorStyle(preview.start)} />
        {distance && <span className="absolute rounded bg-[#1e3a5f]/85 px-1.5 py-0.5 text-[10px] font-bold text-white" style={pointerLabelStyle(preview.end)}>{authorDisplayName} · {distance.feet.toFixed(1)} ft</span>}
      </div>;
    })}
  </>;
  const templateDraftLayer = templateDraft && <>
    {templateGesture && templateDraft.shape === 'circle' && <div aria-hidden="true" className="pointer-events-none absolute h-0 origin-left border-t-2 border-dashed border-[#294966]/70" style={dragLineStyle(templateGesture.start, templateGesture.end)} />}
    <div aria-hidden="true" className="pointer-events-none absolute border-2 border-dashed border-[#294966] bg-[#8fd3ff]/20 shadow-sm" style={templateStyle(templateDraft, board.state)}><span className="absolute left-1 top-1 whitespace-nowrap rounded bg-[#17130f]/80 px-1.5 py-0.5 text-[10px] font-bold text-white">{templateDimensionLabel(templateDraft, locale)}</span></div>
    {templateGesture && <span aria-hidden="true" className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#294966] shadow" style={anchorStyle(templateGesture.start)} />}
  </>;
  const measurementLayer = measurement && <>
    <div aria-hidden="true" className="absolute h-0 origin-left border-t-2 border-dashed border-[#294966]" style={dragLineStyle(measurement.start, measurement.end)} />
    <span aria-hidden="true" className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#294966] shadow" style={anchorStyle(measurement.start)} />
    {measurementDistance && <span className="pointer-events-none absolute rounded bg-[#17130f]/85 px-1.5 py-0.5 text-[10px] font-bold text-white" style={pointerLabelStyle(measurement.end)}>{measurementDistance.feet.toFixed(1)} ft</span>}
  </>;
  const tokenMenuLayer = tokenMenu && <div
    data-token-context-menu
    className="absolute z-40 w-40 rounded-lg border border-slate-300 bg-white/95 p-1.5 text-[11px] text-slate-800 shadow-xl backdrop-blur-sm"
    style={{ left: `${tokenMenu.x}%`, top: `${tokenMenu.y}%` }}
    onPointerDown={(event) => event.stopPropagation()}
  >
    <div className="truncate px-1.5 py-1 text-[10px] font-black text-slate-500">{tokenMenu.token.displayName ?? tokenMenu.token.name}</div>
    <button type="button" onClick={() => { onInspectToken?.(tokenMenu.token); setTokenMenu(undefined); }} className="w-full rounded px-1.5 py-1.5 text-left font-bold hover:bg-slate-100">
      查看信息
    </button>
    <button type="button" onClick={() => { selectToken(tokenMenu.token); setTokenMenu(undefined); }} className="w-full rounded px-1.5 py-1.5 text-left font-bold hover:bg-slate-100">定位 Token</button>
    {canManage && <div className="mt-1 border-t border-slate-200 pt-1">
      <p className="px-1.5 py-1 text-[10px] leading-4 text-slate-500">地图上可见的 Token 默认公开基础信息；剧情保密请隐藏 Token。</p>
      {['加入战斗', '调整 HP', '调整 AC', '添加/移除状态', '揭示信息', '隐藏信息', '删除 Token'].map((label) => <button key={label} type="button" disabled className="w-full rounded px-1.5 py-1 text-left text-slate-400 disabled:cursor-not-allowed">{label} · 后续</button>)}
    </div>}
  </div>;

  if (presentation === 'runtime') {
    const toolButtonClass = (active: boolean) => `grid h-9 w-9 place-items-center rounded-lg border text-[#2f2a22] shadow-sm transition ${active ? 'border-[#58180d]/60 bg-[#fff0d6] text-[#58180d]' : 'border-white/70 bg-white/90 hover:bg-white'}`;
    const compactPanelClass = 'absolute left-14 right-2 top-2 z-30 max-h-[75vh] overflow-y-auto rounded-xl border border-slate-300/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm sm:left-16 sm:right-auto sm:top-3 sm:w-80';

    return <section className="relative h-full min-h-0 w-full overflow-hidden bg-[#e5ebf3]">
      <div
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute inset-0 touch-none select-none ${toolMode === 'measure' ? 'cursor-crosshair' : toolMode === 'move' ? 'cursor-grab' : 'cursor-default'}`}
      >
        <div className="absolute inset-0" style={{ transform: `translate(${board.state.panX}px, ${board.state.panY}px) scale(${board.state.zoom})`, transformOrigin: 'top left' }}>
          <div aria-hidden="true" className="absolute inset-0" style={backgroundPresetStyle(board.state.backgroundPreset)} />
          {displayedBackgroundUrl && !imageError && <img src={displayedBackgroundUrl} alt={board.state.backgroundName || t('mapRuntime.background')} onError={() => setImageError(true)} className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={gridStyle} />
          {imageError && <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-md bg-slate-900/80 px-3 py-2 text-center text-xs font-bold text-white">{t('mapRuntime.imageError')}</div>}
          {(sceneTitle?.trim() || sceneDescription?.trim()) && <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[min(20rem,70%)] rounded-lg border border-slate-300/60 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm"><div className="text-[13px] font-black text-slate-800">{sceneTitle?.trim() || '当前场景'}</div>{sceneDescription?.trim() && <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600">{sceneDescription.trim()}</p>}</div>}
          {visibleTemplates.map((template) => <button key={template.id} type="button" data-map-template={template.id} onClick={() => board.selectTemplate(template.id)} title={templateDimensionLabel(template, locale)} className={`absolute border-2 border-[#7b3f00]/70 bg-[#f5c518]/20 shadow-sm ${board.state.selectedTemplateId === template.id ? 'ring-2 ring-[#f5c518]' : ''}`} style={templateStyle(template, board.state)}><span className="absolute left-1 top-1 whitespace-nowrap rounded bg-[#17130f]/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{templateDimensionLabel(template, locale)}</span></button>)}
          {templateDraftLayer}
          {measurementLayer}
          {sharedPreviewLayer}
          {visibleTokens.map((token) => <button key={token.id} type="button" data-map-token={token.id} onClick={() => selectToken(token)} onDoubleClick={() => onInspectToken?.(token)} onContextMenu={(event) => openTokenMenu(event, token)} className={`group absolute z-20 flex max-w-36 flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 bg-transparent text-xs font-bold hover:z-30 focus-visible:z-30 ${mayMoveToken(token) ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${isCurrentTurnToken(token) ? 'drop-shadow-[0_0_10px_rgba(245,197,24,.95)]' : ''}`} style={{ left: `${token.x}%`, top: `${token.y}%` }} title={mayMoveToken(token) ? '你的角色，可移动；双击可查看信息。' : '右键或双击查看信息'}>{tokenContents(token)}{isCurrentTurnToken(token) && <span className="rounded bg-[#f5c518] px-1 text-[9px] font-black text-[#17130f]">当前回合</span>}{grid?.showCoordinates && <span className="rounded bg-white/90 px-1 text-[9px] text-slate-700 shadow">{Math.round(token.x)},{Math.round(token.y)}</span>}</button>)}
        </div>
        {tokenMenuLayer}
      </div>

      <div className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-slate-300/70 bg-slate-50/85 p-1 shadow-lg backdrop-blur-sm sm:left-3 sm:gap-1.5 sm:p-1.5">
        <button type="button" title={t('mapRuntime.toolSelect')} aria-label={t('mapRuntime.toolSelect')} onClick={() => { setToolMode('select'); setMeasurement(undefined); }} className={toolButtonClass(toolMode === 'select')}><MousePointer2 size={17} /></button>
        <button type="button" title={t('mapRuntime.toolMove')} aria-label={t('mapRuntime.toolMove')} onClick={() => { setToolMode('move'); setMeasurement(undefined); }} className={toolButtonClass(toolMode === 'move')}><Hand size={17} /></button>
        <button type="button" title={t('mapRuntime.toolMeasure')} aria-label={t('mapRuntime.toolMeasure')} onClick={() => { setToolMode('measure'); setMeasurement(undefined); }} className={toolButtonClass(toolMode === 'measure')}><Ruler size={17} /></button>
        {canManage && <>
          <span className="mx-1 h-px bg-slate-300/80" />
          <button type="button" title={t('mapRuntime.toolBackground')} aria-label={t('mapRuntime.toolBackground')} onClick={() => setActivePanel(activePanel === 'background' ? undefined : 'background')} className={toolButtonClass(activePanel === 'background')}><Image size={17} /></button>
          <button type="button" title={t('mapRuntime.toolGrid')} aria-label={t('mapRuntime.toolGrid')} onClick={() => setActivePanel(activePanel === 'grid' ? undefined : 'grid')} className={toolButtonClass(activePanel === 'grid')}><Grid3X3 size={17} /></button>
        </>}
        <button type="button" title={t('mapRuntime.toolTemplate')} aria-label={t('mapRuntime.toolTemplate')} onClick={() => { setToolMode('template'); setActivePanel(activePanel === 'template' ? undefined : 'template'); }} className={toolButtonClass(toolMode === 'template')}><Shapes size={17} /></button>
        {canManage && <button type="button" title="放置单位" aria-label="放置单位" onClick={() => setActivePanel(activePanel === 'units' ? undefined : 'units')} className={toolButtonClass(activePanel === 'units')}><UsersRound size={17} /></button>}
      </div>

      {canManage && activePanel === 'background' && <div className={compactPanelClass}><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black text-slate-800">基础地形</div><p className="mt-0.5 text-[11px] text-slate-500">选择一张底图；网格会叠加在上方。</p></div><button type="button" onClick={() => setActivePanel(undefined)} className="text-xs font-bold text-slate-500">收起</button></div><div className="mt-3 grid grid-cols-2 gap-2">{MAP_BACKGROUND_PRESETS.map((preset) => <button key={preset} type="button" onClick={() => emit(board.setBackgroundPreset(preset))} className={`h-16 rounded-lg border p-2 text-left text-[11px] font-bold shadow-sm ${board.state.backgroundPreset === preset ? 'border-[#58180d] ring-2 ring-[#f5c518]/60' : 'border-slate-300/80'}`} style={backgroundPresetStyle(preset)}><span className="rounded bg-white/80 px-1.5 py-0.5 text-[#17130f]">{presetLabel(preset, locale)}</span></button>)}</div><form onSubmit={(event) => { event.preventDefault(); emit(board.setBackground(backgroundUrl, backgroundName)); }} className="mt-3 grid gap-2"><input value={backgroundUrl} onChange={(event) => setBackgroundUrl(event.target.value)} placeholder={t('mapRuntime.backgroundUrl')} className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs" /><div className="flex gap-2"><input value={backgroundName} onChange={(event) => setBackgroundName(event.target.value)} placeholder={t('mapRuntime.backgroundName')} className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs" /><button type="submit" disabled={!backgroundUrl.trim()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">使用图片</button></div></form>{board.state.backgroundUrl && <button type="button" onClick={() => emit(board.clearBackground())} className="mt-2 text-xs font-bold text-[#8b3a2f]">{t('mapRuntime.resetToPreset')}</button>}</div>}

      {canManage && activePanel === 'grid' && <div className={compactPanelClass}><div className="flex items-center justify-between"><div className="text-sm font-black text-slate-800">网格与测距</div><button type="button" onClick={() => setActivePanel(undefined)} className="text-xs font-bold text-slate-500">收起</button></div><div className="mt-3 grid gap-2 text-xs"><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={grid?.enabled ?? false} onChange={(event) => emit(board.updateGrid({ enabled: event.target.checked }))} />显示网格</label><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={grid?.snap ?? false} onChange={(event) => emit(board.updateGrid({ snap: event.target.checked }))} />拖拽吸附</label><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={grid?.showCoordinates ?? false} onChange={(event) => emit(board.updateGrid({ showCoordinates: event.target.checked }))} />显示坐标</label><div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-[11px] text-slate-600">格子像素<input value={gridSize} onChange={(event) => setGridSize(event.target.value)} onBlur={() => emit(board.updateGrid({ sizePx: Number(gridSize) }))} type="number" min="12" className="rounded-md border border-slate-300 px-2 py-1.5 text-xs" /></label><label className="grid gap-1 text-[11px] text-slate-600">每格英尺<input value={feetPerSquare} onChange={(event) => setFeetPerSquare(event.target.value)} onBlur={() => emit(board.updateGrid({ feetPerSquare: Number(feetPerSquare) }))} type="number" min="1" className="rounded-md border border-slate-300 px-2 py-1.5 text-xs" /></label></div></div></div>}

      {activePanel === 'template' && <div className={compactPanelClass}><div className="flex items-center justify-between"><div className="text-sm font-black text-slate-800">范围工具</div><button type="button" onClick={() => setActivePanel(undefined)} className="text-xs font-bold text-slate-500">收起</button></div><div className={`mt-3 grid gap-1.5 ${mayPinRanges ? 'grid-cols-2' : 'grid-cols-1'}`}><button type="button" onClick={() => setTemplateCommitMode('preview')} className={`rounded-md border px-2.5 py-2 text-left text-xs font-bold ${templateCommitMode === 'preview' ? 'border-[#294966]/50 bg-[#edf4ff] text-[#294966]' : 'border-slate-300 bg-white'}`}><span className="block">临时范围</span><span className="mt-0.5 block text-[10px] font-normal opacity-80">{canShareTemporaryRanges ? '房间成员可见，松开即消失' : '仅在当前视图显示，松开即消失'}</span></button>{mayPinRanges && <button type="button" onClick={() => setTemplateCommitMode('pinned')} className={`rounded-md border px-2.5 py-2 text-left text-xs font-bold ${templateCommitMode === 'pinned' ? 'border-[#58180d]/50 bg-[#fff0d6] text-[#58180d]' : 'border-slate-300 bg-white'}`}><span className="flex items-center gap-1"><Pin size={12} />固定范围</span><span className="mt-0.5 block text-[10px] font-normal opacity-80">会保存到地图记录</span></button>}</div><p className="mt-3 text-[11px] text-slate-500">{templateDragHint(templateShape, locale)}</p><div className="mt-3 grid grid-cols-2 gap-1.5">{([{ shape: 'circle', icon: Circle }, { shape: 'cone', icon: Triangle }, { shape: 'line', icon: Minus }, { shape: 'square', icon: Square }, { shape: 'rectangle', icon: RectangleHorizontal }] as const).map(({ shape, icon: Icon }) => <button key={shape} type="button" onClick={() => setTemplateShape(shape)} className={`flex items-center gap-2 rounded-md border px-2 py-2 text-left text-xs font-bold ${templateShape === shape ? 'border-[#58180d]/50 bg-[#fff0d6] text-[#58180d]' : 'border-slate-300 bg-white'}`}><Icon size={15} />{templateLabel(shape, locale)}</button>)}</div>{canManage && (onSetCanPinRanges || onSetCanMoveOwnToken) && mapCollaborators.length > 0 && <div className="mt-3 border-t border-slate-200 pt-3"><div className="text-[11px] font-black text-slate-700">玩家权限</div><p className="mt-0.5 text-[10px] text-slate-500">移动授权只适用于该玩家已准入的角色 Token；怪物、NPC 和其他玩家 Token 始终由主持人控制。</p><div className="mt-2 grid gap-1">{mapCollaborators.map((member) => <div key={member.memberId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-bold text-slate-700"><span>{member.displayName}</span><span className="flex items-center gap-2 text-[10px]">{onSetCanMoveOwnToken && <label className="flex items-center gap-1.5"><span className="text-slate-500">移动角色</span><input type="checkbox" checked={member.canMoveOwnToken} onChange={(event) => { void onSetCanMoveOwnToken(member.memberId, event.target.checked).catch((error) => setEventError(error instanceof Error ? error.message : String(error))); }} /></label>}{onSetCanPinRanges && <label className="flex items-center gap-1.5"><span className="text-slate-500">固定范围</span><input type="checkbox" checked={member.canPinRanges} onChange={(event) => { void onSetCanPinRanges(member.memberId, event.target.checked).catch((error) => setEventError(error instanceof Error ? error.message : String(error))); }} /></label>}</span></div>)}</div></div>}</div>}

      {canManage && activePanel === 'units' && <div className={compactPanelClass}><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black text-slate-800">放置单位</div><p className="mt-0.5 text-[11px] text-slate-500">从已带入角色或战斗表放到地图；已有关联单位时可定位。</p></div><button type="button" onClick={() => setActivePanel(undefined)} className="text-xs font-bold text-slate-500">收起</button></div><div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">{presenceCandidates.map((candidate) => { const linked = linkedTokenForCandidate(board.state.tokens, candidate); return <div key={`${candidate.sourceType}:${candidate.sourceId}`} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"><div className="min-w-0"><div className="truncate text-xs font-bold text-slate-800">{candidate.displayName}</div><div className="text-[10px] text-slate-500">{sourceLabel(candidate.sourceType, locale)}{candidate.hpSummary ? ` · HP ${candidate.hpSummary.current ?? '—'}${candidate.hpSummary.max !== undefined ? `/${candidate.hpSummary.max}` : ''}` : ''}</div></div><button type="button" onClick={() => linked ? locateCandidate(candidate) : placeCandidate(candidate)} className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-700">{linked ? '定位' : '放到地图'}</button></div>; })}{presenceCandidates.length === 0 && <p className="rounded-md bg-slate-50 px-2 py-3 text-xs text-slate-500">当前房间尚无已准入或已带入的可放置角色；你仍可手动创建 Token。</p>}</div></div>}

      {selectedToken && canManage && <div className="absolute right-3 top-3 z-20 w-56 rounded-xl border border-slate-300/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm"><div className="flex items-center justify-between gap-2"><div className="text-sm font-black text-slate-800">{selectedToken.name}</div><button type="button" onClick={() => board.selectToken(undefined)} className="text-xs font-bold text-slate-500">关闭</button></div><p className="mt-1 text-[11px] text-slate-500">{sourceLabel(selectedToken.sourceType, locale)}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => emit(board.updateToken(selectedToken.id, { isHidden: !selectedToken.isHidden }))} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-bold">{selectedToken.isHidden ? t('mapRuntime.showToken') : t('mapRuntime.hideToken')}</button><button type="button" onClick={() => emit(board.removeToken(selectedToken.id))} className="rounded-md border border-[#8b3a2f]/30 px-2 py-1.5 text-xs font-bold text-[#8b3a2f]">{t('mapRuntime.removeToken')}</button></div></div>}

      {!canManage && tokenControlHint && <div className="pointer-events-none absolute right-3 top-3 z-20 max-w-60 rounded-lg border border-slate-300/80 bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-700 shadow-lg">{tokenControlHint}</div>}

      {lastMovement && <div className="pointer-events-none absolute bottom-20 right-2 z-20 rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow md:bottom-4 md:right-3">{lastMovement.name} · {lastMovement.feet.toFixed(1)} ft</div>}
      {eventError && <div className="absolute bottom-20 left-2 z-20 rounded-md bg-[#fff0eb]/95 px-2.5 py-1.5 text-xs font-bold text-[#8b3a2f] shadow md:bottom-3 md:left-3">{eventError}</div>}
      <div className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-slate-300/70 bg-white/90 p-1 shadow-lg backdrop-blur-sm md:bottom-3"><button type="button" title="缩小" aria-label="缩小" onClick={() => changeViewport({ zoom: board.state.zoom - 0.1 })} className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100"><Minus size={16} /></button><span className="min-w-12 text-center text-[11px] font-bold text-slate-600">{Math.round(board.state.zoom * 100)}%</span><button type="button" title="放大" aria-label="放大" onClick={() => changeViewport({ zoom: board.state.zoom + 0.1 })} className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100"><Plus size={16} /></button><button type="button" title={t('mapRuntime.resetView')} aria-label={t('mapRuntime.resetView')} onClick={() => changeViewport({ zoom: 1, panX: 0, panY: 0 })} className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100"><RotateCcw size={15} /></button>{hasMapRuntimeEvents(mapEvents) && <button type="button" title={t('mapRuntime.restore')} aria-label={t('mapRuntime.restore')} onClick={() => { board.restore(mapEvents); restoredScopeRef.current = `${mapId}:${mapEventKey}`; }} className="rounded-md px-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100">恢复</button>}</div>
      {statusNote && <div title={statusNote} className="pointer-events-none absolute bottom-20 right-2 z-10 hidden max-w-40 truncate rounded bg-slate-900/45 px-2 py-1 text-[9px] font-bold text-white/90 md:bottom-3 md:right-3 md:block">{canManage ? '主持人地图控制' : mayPinRanges ? '可固定范围' : canShareTemporaryRanges ? '可共享临时范围' : '本地测距'}</div>}
    </section>;
  }

  return <section className="mt-5 rounded-2xl border border-[#2f2a22]/12 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('mapRuntime.eyebrow')}</div><h4 className="mt-1 text-xl font-black">{t('mapRuntime.title')}</h4><p className="mt-1 text-xs leading-5 text-[#51483d]">{statusNote ?? t('mapRuntime.replayNote')}</p></div>{hasMapRuntimeEvents(mapEvents) && <button type="button" onClick={() => { board.restore(mapEvents); restoredScopeRef.current = `${mapId}:${mapEventKey}`; }} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold">{t('mapRuntime.restore')}</button>}</div>

    <div className="mt-4 rounded-xl border border-[#2f2a22]/12 bg-[#f7f3ea] p-2.5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {(canManage ? ['select', 'move', 'measure', 'template'] : mayPinRanges ? ['select', 'measure', 'template'] : ['select', 'measure']).map((mode) => <button key={mode} type="button" onClick={() => { setToolMode(mode as ToolMode); setMeasurement(undefined); if (mode === 'template' && (canManage || mayPinRanges)) setActivePanel('template'); }} className={`rounded-md border px-2.5 py-1.5 font-bold ${toolMode === mode ? 'border-[#58180d]/45 bg-[#fff0d6] text-[#58180d]' : 'border-[#2f2a22]/15 bg-white'}`}>{mode === 'select' && !canManage ? t('mapRuntime.toolView') : t(`mapRuntime.tool${mode[0].toUpperCase()}${mode.slice(1)}`)}</button>)}
        {canManage && <><button type="button" onClick={() => setActivePanel(activePanel === 'grid' ? undefined : 'grid')} className={`rounded-md border px-2.5 py-1.5 font-bold ${activePanel === 'grid' ? 'border-[#58180d]/45 bg-[#fff0d6] text-[#58180d]' : 'border-[#2f2a22]/15 bg-white'}`}>{t('mapRuntime.toolGrid')}</button><button type="button" onClick={() => setActivePanel(activePanel === 'background' ? undefined : 'background')} className={`rounded-md border px-2.5 py-1.5 font-bold ${activePanel === 'background' ? 'border-[#58180d]/45 bg-[#fff0d6] text-[#58180d]' : 'border-[#2f2a22]/15 bg-white'}`}>{t('mapRuntime.toolBackground')}</button></>}
        <span className="ml-auto font-bold">{t('mapRuntime.zoom')}: {Math.round(board.state.zoom * 100)}%</span><button type="button" onClick={() => changeViewport({ zoom: board.state.zoom + 0.1 })} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1 font-bold">+</button><button type="button" onClick={() => changeViewport({ zoom: board.state.zoom - 0.1 })} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1 font-bold">−</button><button type="button" onClick={() => changeViewport({ zoom: 1, panX: 0, panY: 0 })} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1 font-bold">{t('mapRuntime.resetView')}</button>
      </div>
      <p className="mt-2 text-xs text-[#51483d]">{toolMode === 'measure' ? t('mapRuntime.measureHint') : t('mapRuntime.dragHint')}</p>
    </div>

    {canManage && activePanel === 'background' && <div className="mt-3 rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="text-sm font-bold">{t('mapRuntime.backgroundPresets')}</div><p className="mt-1 text-xs text-[#51483d]">{t('mapRuntime.backgroundPresetHint')}</p><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">{MAP_BACKGROUND_PRESETS.map((preset) => <button key={preset} type="button" onClick={() => emit(board.setBackgroundPreset(preset))} className={`min-h-14 rounded-md border p-2 text-left text-[11px] font-bold ${board.state.backgroundPreset === preset ? 'border-[#58180d] ring-2 ring-[#f5c518]/60' : 'border-[#2f2a22]/15'}`} style={backgroundPresetStyle(preset)}><span className="rounded bg-white/75 px-1 py-0.5 text-[#17130f]">{presetLabel(preset, locale)}</span></button>)}</div><form onSubmit={(event) => { event.preventDefault(); emit(board.setBackground(backgroundUrl, backgroundName)); }} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"><input value={backgroundUrl} onChange={(event) => setBackgroundUrl(event.target.value)} placeholder={t('mapRuntime.backgroundUrl')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" /><input value={backgroundName} onChange={(event) => setBackgroundName(event.target.value)} placeholder={t('mapRuntime.backgroundName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" /><button type="submit" disabled={!backgroundUrl.trim()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('mapRuntime.setBackground')}</button><button type="button" onClick={() => emit(board.clearBackground())} disabled={!board.state.backgroundUrl} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('mapRuntime.resetToPreset')}</button></form></div>}

    {canManage && activePanel === 'grid' && <div className="mt-3 grid gap-2 rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3 sm:grid-cols-2 lg:grid-cols-4"><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={grid?.enabled ?? false} onChange={(event) => emit(board.updateGrid({ enabled: event.target.checked }))} />{t('mapRuntime.grid')}</label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={grid?.snap ?? false} onChange={(event) => emit(board.updateGrid({ snap: event.target.checked }))} />{t('mapRuntime.snap')}</label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={grid?.showCoordinates ?? false} onChange={(event) => emit(board.updateGrid({ showCoordinates: event.target.checked }))} />{t('mapRuntime.coordinates')}</label><div className="flex gap-2"><input value={gridSize} onChange={(event) => setGridSize(event.target.value)} onBlur={() => emit(board.updateGrid({ sizePx: Number(gridSize) }))} type="number" min="12" placeholder={t('mapRuntime.gridSize')} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" /><input value={feetPerSquare} onChange={(event) => setFeetPerSquare(event.target.value)} onBlur={() => emit(board.updateGrid({ feetPerSquare: Number(feetPerSquare) }))} type="number" min="1" placeholder={t('mapRuntime.feetPerSquare')} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" /></div></div>}

    {(canManage || mayPinRanges) && activePanel === 'template' && <div className="mt-3 rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="text-sm font-bold">{t('mapRuntime.templates')}</div><p className="mt-1 text-xs text-[#51483d]">拖拽用于范围预览；只有“固定范围”会写入地图记录。</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => setTemplateCommitMode('preview')} className={`rounded-md border px-2.5 py-1.5 text-xs font-bold ${templateCommitMode === 'preview' ? 'border-[#294966]/45 bg-[#edf4ff] text-[#294966]' : 'border-[#2f2a22]/15 bg-white'}`}>临时范围</button>{mayPinRanges && <button type="button" onClick={() => setTemplateCommitMode('pinned')} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-bold ${templateCommitMode === 'pinned' ? 'border-[#58180d]/45 bg-[#fff0d6] text-[#58180d]' : 'border-[#2f2a22]/15 bg-white'}`}><Pin size={12} />固定范围</button>}</div><div className="mt-2 flex flex-wrap gap-2">{templateShapes.map((shape) => <button key={shape} type="button" onClick={() => setTemplateShape(shape)} className={`rounded-md border px-2.5 py-1.5 text-xs font-bold ${templateShape === shape ? 'border-[#58180d]/45 bg-[#fff0d6] text-[#58180d]' : 'border-[#2f2a22]/15 bg-white'}`}>{templateLabel(shape, locale)}</button>)}</div><div className="mt-2 flex flex-wrap gap-1.5">{quickTemplateSizes.map((size) => <button key={size} type="button" onClick={() => setTemplateSize(String(size))} className={`rounded-full border px-2 py-1 text-[11px] font-bold ${templateSize === String(size) ? 'border-[#58180d]/45 bg-[#fff0d6] text-[#58180d]' : 'border-[#2f2a22]/15 bg-white'}`}>{size} ft</button>)}</div></div>}

    <div ref={boardRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="relative mt-3 h-[26rem] overflow-hidden rounded-xl border border-[#2f2a22]/12 bg-[#eee8db] touch-none select-none">
      <div className="absolute inset-0" style={{ transform: `translate(${board.state.panX}px, ${board.state.panY}px) scale(${board.state.zoom})`, transformOrigin: 'top left' }}>
        <div aria-hidden="true" className="absolute inset-0" style={backgroundPresetStyle(board.state.backgroundPreset)} />
        {displayedBackgroundUrl && !imageError && <img src={displayedBackgroundUrl} alt={board.state.backgroundName || t('mapRuntime.background')} onError={() => setImageError(true)} className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
        {imageError && <div className="absolute inset-x-4 top-4 rounded-md bg-[#17130f]/75 px-3 py-2 text-center text-xs font-bold text-white">{t('mapRuntime.imageError')}</div>}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={gridStyle} />
        {(sceneTitle?.trim() || sceneDescription?.trim()) && <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[min(20rem,70%)] rounded-lg border border-white/60 bg-white/80 px-3 py-2 shadow-lg backdrop-blur-sm"><div className="text-[13px] font-black text-[#2f2a22]">{sceneTitle?.trim() || '当前场景'}</div>{sceneDescription?.trim() && <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-[11px] leading-relaxed text-[#51483d]">{sceneDescription.trim()}</p>}</div>}
        {visibleTemplates.map((template) => <button key={template.id} type="button" data-map-template={template.id} onClick={() => board.selectTemplate(template.id)} title={templateDimensionLabel(template, locale)} className={`absolute border-2 border-[#7b3f00]/70 bg-[#f5c518]/20 shadow-sm ${board.state.selectedTemplateId === template.id ? 'ring-2 ring-[#f5c518]' : ''}`} style={templateStyle(template, board.state)}><span className="absolute left-1 top-1 whitespace-nowrap rounded bg-[#17130f]/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{templateDimensionLabel(template, locale)}</span></button>)}
        {templateDraftLayer}
        {measurementLayer}
        {sharedPreviewLayer}
          {visibleTokens.map((token) => <button key={token.id} type="button" data-map-token={token.id} onClick={() => selectToken(token)} onDoubleClick={() => onInspectToken?.(token)} onContextMenu={(event) => openTokenMenu(event, token)} className={`group absolute z-20 flex max-w-40 flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 bg-transparent text-xs font-bold hover:z-30 focus-visible:z-30 ${token.isHidden ? 'opacity-70' : ''} ${isCurrentTurnToken(token) ? 'drop-shadow-[0_0_10px_rgba(245,197,24,.95)]' : ''}`} style={{ left: `${token.x}%`, top: `${token.y}%` }} title="双击或右键查看信息">{tokenContents(token)}{isCurrentTurnToken(token) && <span className="rounded bg-[#f5c518] px-1 text-[9px] font-black text-[#17130f]">当前回合</span>}{grid?.showCoordinates && <span className="rounded bg-white/90 px-1 text-[9px] text-slate-700 shadow">{Math.round(token.x)},{Math.round(token.y)}</span>}</button>)}
      </div>
      {tokenMenuLayer}
      {measurementDistance && <div className="absolute bottom-3 left-3 rounded-md bg-[#17130f]/85 px-2 py-1 text-xs font-bold text-white">{measurementDistance.feet.toFixed(1)} ft · {measurementDistance.squares.toFixed(1)} {t('mapRuntime.squares')}</div>}
    </div>

    {lastMovement && <p className="mt-2 rounded-lg bg-[#edf4ff] px-3 py-2 text-xs text-[#294966]">{locale === 'en' ? `${lastMovement.name} moved ${lastMovement.feet.toFixed(1)} ft (${lastMovement.squares.toFixed(1)} squares, straight-line measure).` : `${lastMovement.name} 移动 ${lastMovement.feet.toFixed(1)} 英尺（${lastMovement.squares.toFixed(1)} 格，直线测量）。`}</p>}
    {eventError && <p className="mt-2 rounded-lg bg-[#fff0eb] px-3 py-2 text-xs text-[#8b3a2f]">{eventError}</p>}

    {canManage && <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <form onSubmit={handleAddManualToken} className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="font-bold text-sm">{t('mapRuntime.addToken')}</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder={t('mapRuntime.tokenName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" /><select value={tokenSize} onChange={(event) => setTokenSize(event.target.value as MapTokenSize)} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs">{sizes.map((size) => <option key={size} value={size}>{sizeLabel(size, locale)}</option>)}</select><input value={tokenNotes} onChange={(event) => setTokenNotes(event.target.value)} placeholder={t('mapRuntime.tokenNotes')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs sm:col-span-2" /></div><button type="submit" disabled={!tokenName.trim()} className="mt-2 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('mapRuntime.addToken')}</button></form>
      <form onSubmit={(event) => { event.preventDefault(); addTemplate({ x: 50, y: 50 }); }} className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="flex items-center justify-between gap-2"><div className="font-bold text-sm">{t('mapRuntime.templates')}</div><button type="button" onClick={() => emit(board.clearTemplates())} disabled={(board.state.templates ?? []).length === 0} className="text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('mapRuntime.clearTemplates')}</button></div><div className="mt-2 grid gap-2 sm:grid-cols-2"><select value={templateShape} onChange={(event) => setTemplateShape(event.target.value as MapTemplateShape)} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs">{templateShapes.map((shape) => <option key={shape} value={shape}>{templateLabel(shape, locale)}</option>)}</select><input value={templateSize} onChange={(event) => setTemplateSize(event.target.value)} type="number" min="1" placeholder={t('mapRuntime.templateSize')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" />{(templateShape === 'rectangle' || templateShape === 'line') && <input value={templateWidth} onChange={(event) => setTemplateWidth(event.target.value)} type="number" min="1" placeholder={t('mapRuntime.templateWidth')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" />}<input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder={t('mapRuntime.templateName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" /></div><div className="mt-2 flex flex-wrap gap-1.5">{quickTemplateSizes.map((size) => <button key={size} type="button" onClick={() => setTemplateSize(String(size))} className="rounded-full border border-[#2f2a22]/15 bg-white px-2 py-1 text-[11px] font-bold">{size} ft</button>)}</div><button type="submit" className="mt-2 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white">{t('mapRuntime.addTemplateAtCenter')}</button></form>
      <div className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="font-bold text-sm">放置单位</div><p className="mt-1 text-xs text-[#51483d]">角色和战斗单位会保留来源关联；已有 Token 时可直接定位。</p><div className="mt-2 grid gap-1.5">{presenceCandidates.map((candidate) => { const linked = linkedTokenForCandidate(board.state.tokens, candidate); return <div key={`${candidate.sourceType}:${candidate.sourceId}`} className="flex items-center justify-between gap-2 rounded-md border border-[#2f2a22]/10 bg-white px-2 py-1.5"><span className="min-w-0 truncate text-xs font-bold">{candidate.displayName} <span className="font-normal text-[#51483d]">· {sourceLabel(candidate.sourceType, locale)}</span></span><button type="button" onClick={() => linked ? locateCandidate(candidate) : placeCandidate(candidate)} className="shrink-0 rounded-md border border-[#2f2a22]/15 px-2 py-1 text-xs font-bold">{linked ? '定位' : '放到地图'}</button></div>; })}{presenceCandidates.length === 0 && <span className="text-xs text-[#51483d]">{t('mapRuntime.noSources')}</span>}</div></div>
      {selectedTemplate && <div className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="flex items-center justify-between gap-2"><div className="font-bold text-sm">{t('mapRuntime.selectedTemplate')} · {templateLabel(selectedTemplate.shape, locale)}</div><div className="flex gap-2"><button type="button" onClick={() => emit(board.updateTemplate(selectedTemplate.id, { rotation: selectedTemplate.rotation - 45 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 text-xs font-bold">−45°</button><button type="button" onClick={() => emit(board.updateTemplate(selectedTemplate.id, { rotation: selectedTemplate.rotation + 45 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 text-xs font-bold">+45°</button><button type="button" onClick={() => emit(board.removeTemplate(selectedTemplate.id))} className="rounded-md border border-[#8b3a2f]/20 px-2 py-1 text-xs font-bold text-[#8b3a2f]">{t('mapRuntime.removeTemplate')}</button></div></div><p className="mt-2 text-xs text-[#51483d]">{t('mapRuntime.templateMoveHint')}</p></div>}
    </div>}

    {selectedToken && canManage && <div className="mt-3 rounded-xl border border-[#2f2a22]/10 bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold text-sm">{t('mapRuntime.selectedToken')} · {sourceLabel(selectedToken.sourceType, locale)}</div><div className="flex gap-2"><button type="button" onClick={() => emit(board.updateToken(selectedToken.id, { isHidden: !selectedToken.isHidden }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs font-bold">{selectedToken.isHidden ? t('mapRuntime.showToken') : t('mapRuntime.hideToken')}</button><button type="button" onClick={() => emit(board.removeToken(selectedToken.id))} className="rounded-md border border-[#8b3a2f]/20 px-2 py-1.5 text-xs font-bold text-[#8b3a2f]">{t('mapRuntime.removeToken')}</button></div></div><div className="mt-2 grid gap-2 sm:grid-cols-3"><input value={selectedName} onChange={(event) => setSelectedName(event.target.value)} onBlur={saveSelectedToken} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value as MapTokenSize)} onBlur={saveSelectedToken} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs">{sizes.map((size) => <option key={size} value={size}>{sizeLabel(size, locale)}</option>)}</select><input value={selectedNotes} onChange={(event) => setSelectedNotes(event.target.value)} onBlur={saveSelectedToken} placeholder={t('mapRuntime.tokenNotes')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /></div><p className="mt-2 text-[11px] text-[#51483d]">地图上可见的 Token 默认公开基础信息；需要剧情保密时，请隐藏 Token。主持人备注不会公开。</p></div>}
    <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('mapRuntime.gridBoundary')}</p>
  </section>;
}
