import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import type { CampaignActorInstance, RuntimeEvent } from '../../lib/api/campaignRoomApiClient';
import type { Combatant } from '../../lib/combat/combatRuntimeTypes';
import { hasMapRuntimeEvents } from '../../lib/map/mapRuntimeReplay';
import { useMapRuntimeBoard } from '../../lib/map/useMapRuntimeBoard';
import type { MapBoardState, MapRuntimeEventDraft, MapToken, MapTokenSize } from '../../lib/map/mapRuntimeTypes';

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

type DragState =
  | { kind: 'pan'; startX: number; startY: number; originX: number; originY: number }
  | { kind: 'token'; tokenId: string; startX: number; startY: number; originX: number; originY: number };

const sizes: MapTokenSize[] = ['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'custom'];

function nextPosition(index: number): { x: number; y: number } {
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

export function BasicMapBoard({ locale, mapId, runtimeSessionId, runtimeEvents, campaignActors, combatants, canManage, onBoardChange, snapshotBoard, snapshotImportVersion, onAppendEvent }: Props) {
  const { t } = createTranslator(locale);
  const board = useMapRuntimeBoard(mapId);
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const restoredScopeRef = useRef('');
  const importedSnapshotRef = useRef(0);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [backgroundName, setBackgroundName] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSize, setTokenSize] = useState<MapTokenSize>('medium');
  const [tokenNotes, setTokenNotes] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [selectedSize, setSelectedSize] = useState<MapTokenSize>('medium');
  const [selectedNotes, setSelectedNotes] = useState('');
  const [eventError, setEventError] = useState('');
  const [imageError, setImageError] = useState(false);

  const mapEvents = runtimeEvents.filter((event) => event.runtimeSessionId === runtimeSessionId && event.eventKind.startsWith('map.'));
  const mapEventKey = mapEvents.map((event) => event.runtimeEventId).join('|');
  const selectedToken = board.state.selectedTokenId ? board.state.tokens.find((token) => token.id === board.state.selectedTokenId) : undefined;

  useEffect(() => {
    if (restoredScopeRef.current === mapId || !hasMapRuntimeEvents(mapEvents)) return;
    board.restore(mapEvents);
    restoredScopeRef.current = mapId;
  }, [board.restore, mapEventKey, mapId]);

  useEffect(() => {
    onBoardChange?.(board.state);
  }, [board.state, onBoardChange]);

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

  const emit = (event: MapRuntimeEventDraft | null) => {
    if (!event || !onAppendEvent) return;
    setEventError('');
    void onAppendEvent(event).catch(() => setEventError(t('mapRuntime.eventSaveFailed')));
  };

  const addToken = (input: { name: string; sourceType: MapToken['sourceType']; sourceCombatantId?: string; sourceActorInstanceId?: string; notes?: string }) => {
    if (!canManage || !input.name.trim()) return;
    const result = board.addToken({ ...input, ...nextPosition(board.state.tokens.length), size: tokenSize });
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
    const target = event.target as HTMLElement;
    const tokenId = target.closest('[data-map-token]')?.getAttribute('data-map-token');
    if (tokenId && canManage) {
      const token = board.state.tokens.find((item) => item.id === tokenId);
      if (token) {
        board.selectToken(tokenId);
        dragRef.current = { kind: 'token', tokenId, startX: event.clientX, startY: event.clientY, originX: token.x, originY: token.y };
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
    if (drag.kind === 'token') {
      board.moveToken(drag.tokenId, drag.originX + ((event.clientX - drag.startX) / rect.width) * 100 / board.state.zoom, drag.originY + ((event.clientY - drag.startY) / rect.height) * 100 / board.state.zoom);
    } else {
      board.changeViewport({ panX: drag.originX + event.clientX - drag.startX, panY: drag.originY + event.clientY - drag.startY });
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;
    if (drag.kind === 'token') {
      const token = board.state.tokens.find((item) => item.id === drag.tokenId);
      if (token) emit(board.moveToken(token.id, token.x, token.y));
    } else {
      emit(board.changeViewport({ panX: board.state.panX, panY: board.state.panY, zoom: board.state.zoom }));
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const visibleTokens = canManage ? board.state.tokens : board.state.tokens.filter((token) => !token.isHidden);

  return (
    <section className="mt-5 rounded-2xl border border-[#2f2a22]/12 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('mapRuntime.eyebrow')}</div>
          <h4 className="mt-1 text-xl font-black">{t('mapRuntime.title')}</h4>
          <p className="mt-1 text-xs leading-5 text-[#51483d]">{t('mapRuntime.replayNote')}</p>
        </div>
        {hasMapRuntimeEvents(mapEvents) && <button type="button" onClick={() => { board.restore(mapEvents); restoredScopeRef.current = mapId; }} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold">{t('mapRuntime.restore')}</button>}
      </div>

      {canManage && <form onSubmit={(event) => { event.preventDefault(); emit(board.setBackground(backgroundUrl, backgroundName)); }} className="mt-4 grid gap-2 rounded-xl bg-[#f7f3ea] p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input value={backgroundUrl} onChange={(event) => setBackgroundUrl(event.target.value)} placeholder={t('mapRuntime.backgroundUrl')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
        <input value={backgroundName} onChange={(event) => setBackgroundName(event.target.value)} placeholder={t('mapRuntime.backgroundName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
        <button type="submit" disabled={!backgroundUrl.trim()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('mapRuntime.setBackground')}</button>
        <button type="button" onClick={() => emit(board.clearBackground())} disabled={!board.state.backgroundUrl} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold disabled:opacity-40">{t('mapRuntime.clearBackground')}</button>
      </form>}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold">{t('mapRuntime.zoom')}: {Math.round(board.state.zoom * 100)}%</span>
        <button type="button" onClick={() => emit(board.changeViewport({ zoom: board.state.zoom + 0.1 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 font-bold">+</button>
        <button type="button" onClick={() => emit(board.changeViewport({ zoom: board.state.zoom - 0.1 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 font-bold">−</button>
        <button type="button" onClick={() => emit(board.changeViewport({ zoom: 1, panX: 0, panY: 0 }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1 font-bold">{t('mapRuntime.resetView')}</button>
        <span className="text-[#51483d]">{t('mapRuntime.dragHint')}</span>
      </div>

      <div ref={boardRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} className="relative mt-3 h-[26rem] overflow-hidden rounded-xl border border-[#2f2a22]/12 bg-[#eee8db] touch-none select-none">
        <div className="absolute inset-0" style={{ transform: `translate(${board.state.panX}px, ${board.state.panY}px) scale(${board.state.zoom})`, transformOrigin: 'center' }}>
          {board.state.backgroundUrl && !imageError && <img src={board.state.backgroundUrl} alt={board.state.backgroundName || t('mapRuntime.background')} onError={() => setImageError(true)} className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
          {(!board.state.backgroundUrl || imageError) && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-[#51483d]">{imageError ? t('mapRuntime.imageError') : t('mapRuntime.empty')}</div>}
          {visibleTokens.map((token) => <button key={token.id} type="button" data-map-token={token.id} onClick={() => board.selectToken(token.id)} className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-xs font-bold shadow ${token.isHidden ? 'bg-[#51483d]/70 text-white' : 'bg-[#58180d] text-white'} ${board.state.selectedTokenId === token.id ? 'ring-4 ring-[#f5c518]/70' : ''}`} style={{ left: `${token.x}%`, top: `${token.y}%` }} title={token.notes || token.name}>{token.name}</button>)}
        </div>
      </div>

      {eventError && <p className="mt-2 rounded-lg bg-[#fff0eb] px-3 py-2 text-xs text-[#8b3a2f]">{eventError}</p>}

      {canManage && <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleAddManualToken} className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3">
          <div className="font-bold text-sm">{t('mapRuntime.addToken')}</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input value={tokenName} onChange={(event) => setTokenName(event.target.value)} placeholder={t('mapRuntime.tokenName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs" />
            <select value={tokenSize} onChange={(event) => setTokenSize(event.target.value as MapTokenSize)} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs">{sizes.map((size) => <option key={size} value={size}>{sizeLabel(size, locale)}</option>)}</select>
            <input value={tokenNotes} onChange={(event) => setTokenNotes(event.target.value)} placeholder={t('mapRuntime.tokenNotes')} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs sm:col-span-2" />
          </div>
          <button type="submit" disabled={!tokenName.trim()} className="mt-2 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('mapRuntime.addToken')}</button>
        </form>
        <div className="rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3">
          <div className="font-bold text-sm">{t('mapRuntime.addFromSource')}</div>
          <div className="mt-2 flex flex-wrap gap-2">{campaignActors.map((actor) => <button key={actor.campaignActorInstanceId} type="button" onClick={() => addToken({ name: actor.displayName, sourceType: 'campaign_actor', sourceActorInstanceId: actor.campaignActorInstanceId })} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs font-bold">{t('mapRuntime.fromCampaignActor')}: {actor.displayName}</button>)}{combatants.map((combatant) => <button key={combatant.id} type="button" onClick={() => addToken({ name: combatant.displayName, sourceType: 'combatant', sourceCombatantId: combatant.id })} className="rounded-md border border-[#2f2a22]/15 bg-white px-2 py-1.5 text-xs font-bold">{t('mapRuntime.fromCombatant')}: {combatant.displayName}</button>)}{campaignActors.length === 0 && combatants.length === 0 && <span className="text-xs text-[#51483d]">{t('mapRuntime.noSources')}</span>}</div>
        </div>
      </div>}

      {selectedToken && canManage && <div className="mt-3 rounded-xl border border-[#2f2a22]/10 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold text-sm">{t('mapRuntime.selectedToken')} · {sourceLabel(selectedToken.sourceType, locale)}</div><div className="flex gap-2"><button type="button" onClick={() => emit(board.updateToken(selectedToken.id, { isHidden: !selectedToken.isHidden }))} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs font-bold">{selectedToken.isHidden ? t('mapRuntime.showToken') : t('mapRuntime.hideToken')}</button><button type="button" onClick={() => emit(board.removeToken(selectedToken.id))} className="rounded-md border border-[#8b3a2f]/20 px-2 py-1.5 text-xs font-bold text-[#8b3a2f]">{t('mapRuntime.removeToken')}</button></div></div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3"><input value={selectedName} onChange={(event) => setSelectedName(event.target.value)} onBlur={saveSelectedToken} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /><select value={selectedSize} onChange={(event) => { setSelectedSize(event.target.value as MapTokenSize); }} onBlur={saveSelectedToken} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs">{sizes.map((size) => <option key={size} value={size}>{sizeLabel(size, locale)}</option>)}</select><input value={selectedNotes} onChange={(event) => setSelectedNotes(event.target.value)} onBlur={saveSelectedToken} placeholder={t('mapRuntime.tokenNotes')} className="rounded-md border border-[#2f2a22]/15 px-2 py-1.5 text-xs" /></div>
      </div>}
    </section>
  );
}
