import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import type { CampaignActorInstance, RuntimeEvent } from '../../lib/api/campaignRoomApiClient';
import type { Combatant } from '../../lib/combat/combatRuntimeTypes';
import { hasMapRuntimeEvents } from '../../lib/map/mapRuntimeReplay';
import { useMapRuntimeBoard } from '../../lib/map/useMapRuntimeBoard';
import { measureMapDistance, snapMapPosition, type MapAreaTemplate, type MapBoardState, type MapRuntimeEventDraft, type MapTemplateShape, type MapToken, type MapTokenSize } from '../../lib/map/mapRuntimeTypes';

type Props = {
  locale: Locale;
  mapId: string;
  runtimeSessionId: string;
  runtimeEvents: RuntimeEvent[];
  campaignActors: CampaignActorInstance[];
  combatants: Combatant[];
  canManage: boolean;
  onBoardChange?: (state: MapBoardState) => void;
  snapshotBoard?: MapBoardState;
  snapshotImportVersion?: number;
  onAppendEvent?: (event: MapRuntimeEventDraft) => Promise<void>;
};

type ToolMode = 'select' | 'move' | 'measure' | 'template';
type Point = { x: number; y: number };
type DragState =
  | { kind: 'pan'; startX: number; startY: number; originX: number; originY: number }
  | { kind: 'token'; tokenId: string; startX: number; startY: number; originX: number; originY: number; last: Point }
  | { kind: 'template'; templateId: string; startX: number; startY: number; originX: number; originY: number; last: Point }
  | { kind: 'measure'; start: Point; end: Point };

const sizes: MapTokenSize[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'custom'];
const templateShapes: MapTemplateShape[] = ['circle', 'cone', 'line', 'square', 'rectangle'];
const quickTemplateSizes = [5, 10, 15, 20, 30, 60];

function nextPosition(index: number): Point {
  return { x: 20 + (index % 5) * 15, y: 25 + Math.floor(index / 5) * 15 };
}

function sourceLabel(sourceType: MapToken['sourceType'], locale: Locale): string {
  if (locale === 'en') return sourceType === 'campaign_actor' ? 'Campaign character' : sourceType === 'combatant' ? 'Combatant' : sourceType === 'manual' ? 'Manual' : 'Unknown';
  return sourceType === 'campaign_actor' ? '战役角色' : sourceType === 'combatant' ? '战斗单位' : sourceType === 'manual' ? '手动' : '未知';
}

function sizeLabel(size: MapTokenSize, locale: Locale): string {
  if (locale === 'en') return size;
  const labels: Record<MapTokenSize, string> = { tiny: '微型', small: '小型', medium: '中型', large: '大型', huge: '巨型', gargantuan: '超巨型', custom: '自定义' };
  return labels[size];
}

function templateLabel(shape: MapTemplateShape, locale: Locale): string {
  const zh: Record<MapTemplateShape, string> = { circle: '圆形', cone: '锥形', line: '直线', square: '正方形', rectangle: '矩形' };
  return locale === 'en' ? shape : zh[shape];
}

function templateStyle(template: MapAreaTemplate, board: MapBoardState): CSSProperties {
  const grid = board.grid;
  const pixelsPerFoot = (grid?.sizePx ?? 50) / (grid?.feetPerSquare ?? 5);
  const length = Math.max(5, template.sizeFeet * pixelsPerFoot);
  const width = Math.max(5, (template.widthFeet ?? template.sizeFeet) * pixelsPerFoot);
  const base: CSSProperties = { left: `${template.x}%`, top: `${template.y}%`, transform: `translate(-50%, -50%) rotate(${template.rotation}deg)`, transformOrigin: 'center', opacity: template.isHidden ? 0.3 : 1 };
  if (template.shape === 'circle') return { ...base, width: length * 2, height: length * 2, borderRadius: '999px' };
  if (template.shape === 'cone') return { ...base, width: length, height: length, transformOrigin: '0 50%', clipPath: 'polygon(0 50%, 100% 0, 100% 100%)' };
  if (template.shape === 'line') return { ...base, width: length, height: Math.max(6, width / 5), transformOrigin: '0 50%' };
  return { ...base, width: length, height: template.shape === 'square' ? length : width };
}

export function BasicMapBoard({ locale, mapId, runtimeSessionId, runtimeEvents, campaignActors, combatants, canManage, onBoardChange, snapshotBoard, snapshotImportVersion, onAppendEvent }: Props) {
  const { t } = createTranslator(locale);
  const board = useMapRuntimeBoard(mapId);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const restoredScopeRef = useRef('');
  const importedSnapshotRef = useRef(0);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [measurement, setMeasurement] = useState<{ start: Point; end: Point }>();
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

  const mapEvents = runtimeEvents.filter((event) => event.runtimeSessionId === runtimeSessionId && event.eventKind.startsWith('map.'));
  const mapEventKey = mapEvents.map((event) => event.runtimeEventId).join('|');
  const selectedToken = board.state.selectedTokenId ? board.state.tokens.find((token) => token.id === board.state.selectedTokenId) : undefined;
  const selectedTemplate = board.state.selectedTemplateId ? (board.state.templates ?? []).find((template) => template.id === board.state.selectedTemplateId) : undefined;
  const grid = board.state.grid;

  useEffect(() => {
    if (restoredScopeRef.current === mapId || !hasMapRuntimeEvents(mapEvents)) return;
    board.restore(mapEvents);
    restoredScopeRef.current = mapId;
  }, [board.restore, mapEventKey, mapId]);

  useEffect(() => { onBoardChange?.(board.state); }, [board.state, onBoardChange]);
  useEffect(() => {
    if (!snapshotBoard || !snapshotImportVersion || importedSnapshotRef.current === snapshotImportVersion) return;
    board.replaceState(snapshotBoard);
    importedSnapshotRef.current = snapshotImportVersion;
  }, [board.replaceState, snapshotBoard, snapshotImportVersion]);
  useEffect(() => {
    setBackgroundUrl(board.state.backgroundUrl ?? '');
    setBackgroundName(board.state.backgroundName ?? '');
    setImageError(false);
  }, [board.state.backgroundUrl, board.state.backgroundName]);
  useEffect(() => {
    setSelectedName(selectedToken?.name ?? '');
    setSelectedSize(selectedToken?.size ?? 'medium');
    setSelectedNotes(selectedToken?.notes ?? '');
  }, [selectedToken?.id]);
  useEffect(() => {
    setGridSize(String(grid?.sizePx ?? 50));
    setFeetPerSquare(String(grid?.feetPerSquare ?? 5));
  }, [grid?.feetPerSquare, grid?.sizePx]);

  const emit = (event: MapRuntimeEventDraft | null) => {
    if (!event || !onAppendEvent) return;
    setEventError('');
    void onAppendEvent(event).catch(() => setEventError(t('mapRuntime.eventSaveFailed')));
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

  const addToken = (input: { name: string; sourceType: MapToken['sourceType']; sourceCombatantId?: string; sourceActorInstanceId?: string; notes?: string }) => {
    if (!canManage || !input.name.trim()) return;
    const result = board.addToken({ ...input, ...nextPosition(board.state.tokens.length), size: tokenSize });
    emit(result.event);
  };

  const addTemplate = (position: Point) => {
    if (!canManage) return;
    const result = board.addTemplate({ shape: templateShape, x: position.x, y: position.y, sizeFeet: Number(templateSize) || 5, widthFeet: templateShape === 'rectangle' || templateShape === 'line' ? Number(templateWidth) || 5 : undefined, label: templateName.trim() || undefined, rotation: 0 });
    emit(result.event);
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
    const point = pointFromEvent(event);
    if (!point) return;
    const target = event.target as HTMLElement;
    const templateId = target.closest('[data-map-template]')?.getAttribute('data-map-template');
    const tokenId = target.closest('[data-map-token]')?.getAttribute('data-map-token');
    if (toolMode === 'measure') {
      dragRef.current = { kind: 'measure', start: point, end: point };
      setMeasurement({ start: point, end: point });
    } else if (toolMode === 'template' && canManage && !templateId) {
      addTemplate(point);
    } else if (templateId && canManage) {
      const template = (board.state.templates ?? []).find((item) => item.id === templateId);
      if (template) { board.selectTemplate(templateId); dragRef.current = { kind: 'template', templateId, startX: event.clientX, startY: event.clientY, originX: template.x, originY: template.y, last: { x: template.x, y: template.y } }; }
    } else if (tokenId && canManage) {
      const token = board.state.tokens.find((item) => item.id === tokenId);
      if (token) { board.selectToken(tokenId); dragRef.current = { kind: 'token', tokenId, startX: event.clientX, startY: event.clientY, originX: token.x, originY: token.y, last: { x: token.x, y: token.y } }; }
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
    } else if (drag.kind === 'pan') {
      emit(board.changeViewport({ panX: board.state.panX, panY: board.state.panY, zoom: board.state.zoom }));
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const visibleTokens = canManage ? board.state.tokens : board.state.tokens.filter((token) => !token.isHidden);
  const visibleTemplates = canManage ? board.state.templates ?? [] : (board.state.templates ?? []).filter((template) => !template.isHidden);
  const measurementDistance = measurement && boardRef.current ? measureMapDistance(measurement.start, measurement.end, grid, boardRef.current.getBoundingClientRect().width / board.state.zoom, boardRef.current.getBoundingClientRect().height / board.state.zoom) : undefined;
  const gridStyle: CSSProperties | undefined = grid?.enabled ? {
    backgroundImage: 'linear-gradient(to right, rgba(88,24,13,.24) 1px, transparent 1px), linear-gradient(to bottom, rgba(88,24,13,.24) 1px, transparent 1px)',
    backgroundSize: `${grid.sizePx}px ${grid.sizePx}px`,
    backgroundPosition: `${grid.originX}px ${grid.originY}px`,
  } : undefined;

  return <section className="mt-5 rounded-2xl border border-[#2f2a22]/12 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('mapRuntime.eyebrow')}</div><h4 className="mt-1 text-xl font-black">{t('mapRuntime.title')}</h4><p className="mt-1 text-xs leading-5 text-[#51483d]">{t('mapRuntime.replayNote')}</p></div>{hasMapRuntimeEvents(mapEvents) && <button type="button" onClick={() => { board.restore(mapEvents); restoredScopeRef.current = mapId; }} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold">{t('mapRuntime.restore')}</button>}</div>

    {canManage && <form onSubmit={(event) => { event.preventDefault(); emit(board.setBackground(backgroundUrl, backgroundName)); }} className="mt-4 grid gap-2 rounded-xl bg-[#f7f3ea] p-3 sm:grid-cols-[1fr_1fr_auto_auto]"><input value={backgroundUrl} onChange={(event) => setBackgroundUrl(event.target.value)} placeholder={t('mapRuntime.backgroundUrl')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" /><input value={backgroundName} onChange={(event) => setBackgroundName(event.target.value)} placeholder={t('mapRuntime.backgroundName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" /><button type="submit" disabled={!backgroundUrl.trim()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('mapRuntime.setBackground')}</button><button type="button" onClick={() => emit(board.clearBackground())} disabled={!board.state.backgroundUrl} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold disabled:opacity-40">{t('mapRuntime.clearBackground')}</button></form>}

    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="font-bold">{t('mapRuntime.zoom')}: {Math.round(board.state.zoom * 100)}%</span><button type="button" onClick={() => emit(board.changeViewport({ zoom: board.state.zoom + 0.1 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 font-bold">+</button><button type="button" onClick={() => emit(board.changeViewport({ zoom: board.state.zoom - 0.1 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 font-bold">−</button><button type="button" onClick={() => emit(board.changeViewport({ zoom: 1, panX: 0, panY: 0 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 font-bold">{t('mapRuntime.resetView')}</button>{(['select', 'move', 'measure', 'template'] as ToolMode[]).map((mode) => <button key={mode} type="button" disabled={!canManage && mode !== 'select'} onClick={() => setToolMode(mode)} className={`rounded-md border px-2 py-1 font-bold disabled:opacity-40 ${toolMode === mode ? 'border-[#58180d]/45 bg-[#fff0d6] text-[#58180d]' : 'border-[#2f2a22]/15'}`}>{t(`mapRuntime.tool${mode[0].toUpperCase()}${mode.slice(1)}`)}</button>)}<span className="text-[#51483d]">{toolMode === 'measure' ? t('mapRuntime.measureHint') : t('mapRuntime.dragHint')}</span></div>

    {canManage && <div className="mt-3 grid gap-2 rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3 sm:grid-cols-2 lg:grid-cols-4"><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={grid?.enabled ?? false} onChange={(event) => emit(board.updateGrid({ enabled: event.target.checked }))} />{t('mapRuntime.grid')}</label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={grid?.snap ?? false} onChange={(event) => emit(board.updateGrid({ snap: event.target.checked }))} />{t('mapRuntime.snap')}</label><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={grid?.showCoordinates ?? false} onChange={(event) => emit(board.updateGrid({ showCoordinates: event.target.checked }))} />{t('mapRuntime.coordinates')}</label><div className="flex gap-2"><input value={gridSize} onChange={(event) => setGridSize(event.target.value)} onBlur={() => emit(board.updateGrid({ sizePx: Number(gridSize) }))} type="number" min="12" placeholder={t('mapRuntime.gridSize')} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" /><input value={feetPerSquare} onChange={(event) => setFeetPerSquare(event.target.value)} onBlur={() => emit(board.updateGrid({ feetPerSquare: Number(feetPerSquare) }))} type="number" min="1" placeholder={t('mapRuntime.feetPerSquare')} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" /></div></div>}

    <div ref={boardRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="relative mt-3 h-[26rem] overflow-hidden rounded-xl border border-[#2f2a22]/12 bg-[#eee8db] touch-none select-none">
      <div className="absolute inset-0" style={{ transform: `translate(${board.state.panX}px, ${board.state.panY}px) scale(${board.state.zoom})`, transformOrigin: 'top left' }}>
        {board.state.backgroundUrl && !imageError && <img src={board.state.backgroundUrl} alt={board.state.backgroundName || t('mapRuntime.background')} onError={() => setImageError(true)} className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
        {(!board.state.backgroundUrl || imageError) && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-[#51483d]">{imageError ? t('mapRuntime.imageError') : t('mapRuntime.empty')}</div>}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={gridStyle} />
        {visibleTemplates.map((template) => <button key={template.id} type="button" data-map-template={template.id} onClick={() => board.selectTemplate(template.id)} title={template.label || templateLabel(template.shape, locale)} className={`absolute border-2 border-[#7b3f00]/70 bg-[#f5c518]/20 shadow-sm ${board.state.selectedTemplateId === template.id ? 'ring-2 ring-[#f5c518]' : ''}`} style={templateStyle(template, board.state)}><span className="absolute left-1 top-1 whitespace-nowrap rounded bg-[#17130f]/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{template.label || `${template.sizeFeet} ft`}</span></button>)}
        {measurement && <div aria-hidden="true" className="absolute h-0 origin-left border-t-2 border-dashed border-[#294966]" style={{ left: `${measurement.start.x}%`, top: `${measurement.start.y}%`, width: `${Math.hypot(measurement.end.x - measurement.start.x, measurement.end.y - measurement.start.y)}%`, transform: `rotate(${Math.atan2(measurement.end.y - measurement.start.y, measurement.end.x - measurement.start.x) * 180 / Math.PI}deg)` }} />}
        {visibleTokens.map((token) => <button key={token.id} type="button" data-map-token={token.id} onClick={() => board.selectToken(token.id)} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-xs font-bold shadow ${token.isHidden ? 'bg-[#51483d]/70 text-white' : 'bg-[#58180d] text-white'} ${board.state.selectedTokenId === token.id ? 'ring-4 ring-[#f5c518]/70' : ''}`} style={{ left: `${token.x}%`, top: `${token.y}%` }} title={token.notes || token.name}>{token.name}{grid?.showCoordinates && <span className="ml-1 opacity-80">{Math.round(token.x)},{Math.round(token.y)}</span>}</button>)}
      </div>
      {measurementDistance && <div className="absolute bottom-3 left-3 rounded-md bg-[#17130f]/85 px-2 py-1 text-xs font-bold text-white">{measurementDistance.feet.toFixed(1)} ft · {measurementDistance.squares.toFixed(1)} {t('mapRuntime.squares')}</div>}
    </div>

    {lastMovement && <p className="mt-2 rounded-lg bg-[#edf4ff] px-3 py-2 text-xs text-[#294966]">{locale === 'en' ? `${lastMovement.name} moved ${lastMovement.feet.toFixed(1)} ft (${lastMovement.squares.toFixed(1)} squares, straight-line measure).` : `${lastMovement.name} 移动 ${lastMovement.feet.toFixed(1)} 英尺（${lastMovement.squares.toFixed(1)} 格，直线测量）。`}</p>}
    {eventError && <p className="mt-2 rounded-lg bg-[#fff0eb] px-3 py-2 text-xs text-[#8b3a2f]">{eventError}</p>}

    {canManage && <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <form onSubmit={handleAddManualToken} className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="font-bold text-sm">{t('mapRuntime.addToken')}</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder={t('mapRuntime.tokenName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" /><select value={tokenSize} onChange={(event) => setTokenSize(event.target.value as MapTokenSize)} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs">{sizes.map((size) => <option key={size} value={size}>{sizeLabel(size, locale)}</option>)}</select><input value={tokenNotes} onChange={(event) => setTokenNotes(event.target.value)} placeholder={t('mapRuntime.tokenNotes')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs sm:col-span-2" /></div><button type="submit" disabled={!tokenName.trim()} className="mt-2 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('mapRuntime.addToken')}</button></form>
      <form onSubmit={(event) => { event.preventDefault(); addTemplate({ x: 50, y: 50 }); }} className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="flex items-center justify-between gap-2"><div className="font-bold text-sm">{t('mapRuntime.templates')}</div><button type="button" onClick={() => emit(board.clearTemplates())} disabled={(board.state.templates ?? []).length === 0} className="text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('mapRuntime.clearTemplates')}</button></div><div className="mt-2 grid gap-2 sm:grid-cols-2"><select value={templateShape} onChange={(event) => setTemplateShape(event.target.value as MapTemplateShape)} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs">{templateShapes.map((shape) => <option key={shape} value={shape}>{templateLabel(shape, locale)}</option>)}</select><input value={templateSize} onChange={(event) => setTemplateSize(event.target.value)} type="number" min="1" placeholder={t('mapRuntime.templateSize')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" />{(templateShape === 'rectangle' || templateShape === 'line') && <input value={templateWidth} onChange={(event) => setTemplateWidth(event.target.value)} type="number" min="1" placeholder={t('mapRuntime.templateWidth')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" />}<input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder={t('mapRuntime.templateName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" /></div><div className="mt-2 flex flex-wrap gap-1.5">{quickTemplateSizes.map((size) => <button key={size} type="button" onClick={() => setTemplateSize(String(size))} className="rounded-full border border-[#2f2a22]/15 bg-white px-2 py-1 text-[11px] font-bold">{size} ft</button>)}</div><button type="submit" className="mt-2 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white">{t('mapRuntime.addTemplateAtCenter')}</button></form>
      <div className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="font-bold text-sm">{t('mapRuntime.addFromSource')}</div><div className="mt-2 flex flex-wrap gap-2">{campaignActors.map((actor) => <button key={actor.campaignActorInstanceId} type="button" onClick={() => addToken({ name: actor.displayName, sourceType: 'campaign_actor', sourceActorInstanceId: actor.campaignActorInstanceId })} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs font-bold">{t('mapRuntime.fromCampaignActor')}: {actor.displayName}</button>)}{combatants.map((combatant) => <button key={combatant.id} type="button" onClick={() => addToken({ name: combatant.displayName, sourceType: 'combatant', sourceCombatantId: combatant.id })} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs font-bold">{t('mapRuntime.fromCombatant')}: {combatant.displayName}</button>)}{campaignActors.length === 0 && combatants.length === 0 && <span className="text-xs text-[#51483d]">{t('mapRuntime.noSources')}</span>}</div></div>
      {selectedTemplate && <div className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3"><div className="flex items-center justify-between gap-2"><div className="font-bold text-sm">{t('mapRuntime.selectedTemplate')} · {templateLabel(selectedTemplate.shape, locale)}</div><div className="flex gap-2"><button type="button" onClick={() => emit(board.updateTemplate(selectedTemplate.id, { rotation: selectedTemplate.rotation - 45 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 text-xs font-bold">−45°</button><button type="button" onClick={() => emit(board.updateTemplate(selectedTemplate.id, { rotation: selectedTemplate.rotation + 45 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 text-xs font-bold">+45°</button><button type="button" onClick={() => emit(board.removeTemplate(selectedTemplate.id))} className="rounded-md border border-[#8b3a2f]/20 px-2 py-1 text-xs font-bold text-[#8b3a2f]">{t('mapRuntime.removeTemplate')}</button></div></div><p className="mt-2 text-xs text-[#51483d]">{t('mapRuntime.templateMoveHint')}</p></div>}
    </div>}

    {selectedToken && canManage && <div className="mt-3 rounded-xl border border-[#2f2a22]/10 bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold text-sm">{t('mapRuntime.selectedToken')} · {sourceLabel(selectedToken.sourceType, locale)}</div><div className="flex gap-2"><button type="button" onClick={() => emit(board.updateToken(selectedToken.id, { isHidden: !selectedToken.isHidden }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs font-bold">{selectedToken.isHidden ? t('mapRuntime.showToken') : t('mapRuntime.hideToken')}</button><button type="button" onClick={() => emit(board.removeToken(selectedToken.id))} className="rounded-md border border-[#8b3a2f]/20 px-2 py-1.5 text-xs font-bold text-[#8b3a2f]">{t('mapRuntime.removeToken')}</button></div></div><div className="mt-2 grid gap-2 sm:grid-cols-3"><input value={selectedName} onChange={(event) => setSelectedName(event.target.value)} onBlur={saveSelectedToken} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value as MapTokenSize)} onBlur={saveSelectedToken} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs">{sizes.map((size) => <option key={size} value={size}>{sizeLabel(size, locale)}</option>)}</select><input value={selectedNotes} onChange={(event) => setSelectedNotes(event.target.value)} onBlur={saveSelectedToken} placeholder={t('mapRuntime.tokenNotes')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /></div></div>}
    <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('mapRuntime.gridBoundary')}</p>
  </section>;
}
