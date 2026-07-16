import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ApiClientError } from '../../lib/api/apiTypes';
import {
  campaignRoomApiClient,
  type CampaignListItem,
  type CampaignActorInstance,
  type RuntimeEvent,
} from '../../lib/api/campaignRoomApiClient';
import type { WorldServerGameSystemBinding } from '../../lib/api/worldServerApiClient';
import { createTranslator, type Locale } from '../../i18n';
import { useCampaigns } from '../../lib/campaignRoom/useCampaigns';
import { useCampaignDetail } from '../../lib/campaignRoom/useCampaignDetail';
import { useRoomDetail } from '../../lib/campaignRoom/useRoomDetail';
import { useRuntimeEvents } from '../../lib/campaignRoom/useRuntimeEvents';
import { CombatRuntimeTable } from './CombatRuntimeTable';
import { BasicMapBoard } from './BasicMapBoard';
import type { CombatRuntimeEventDraft, Combatant } from '../../lib/combat/combatRuntimeTypes';
import type { MapRuntimeEventDraft } from '../../lib/map/mapRuntimeTypes';

type Props = {
  worldServerId: string;
  locale: Locale;
  gameSystems: WorldServerGameSystemBinding[];
  defaultGameSystemId?: string;
  canManageServer: boolean;
};

function errorText(error: ApiClientError | null, locale: Locale): string {
  if (!error) return '';
  if (error.statusCode === 401) return locale === 'en' ? 'Please sign in to view this data.' : '请先登录后查看这部分内容。';
  if (error.statusCode === 403) return locale === 'en' ? 'You do not have access to this data.' : '你没有权限查看这部分内容。';
  if (error.statusCode === 404) return locale === 'en' ? 'This item is no longer available.' : '这项内容已经不可用。';
  return locale === 'en' ? 'The server is temporarily unavailable.' : '服务器暂时不可用。';
}

function roomLabel(room: { roomCode?: string; metadata: Record<string, unknown> }): string {
  const name = room.metadata.name;
  if (typeof name === 'string' && name.trim()) return name;
  if (room.roomCode) return room.roomCode;
  return 'Room';
}

function participantKey(participant: { participantId?: string; roomParticipantId?: string }): string {
  return participant.participantId ?? participant.roomParticipantId ?? 'participant';
}

function participantName(participant: { displayName?: string; metadata: Record<string, unknown> }, fallback: string): string {
  if (participant.displayName?.trim()) return participant.displayName;
  const metadataName = participant.metadata.displayName;
  return typeof metadataName === 'string' && metadataName.trim() ? metadataName : fallback;
}

function actorLabel(actor: CampaignActorInstance, fallback: string): string {
  return actor.displayName || fallback;
}

function runtimeEventLabel(eventKind: string, locale: Locale): string {
  const labels: Record<string, [string, string]> = {
    'system.note': ['公开记录', 'Public note'],
    'combat.started': ['战斗开始', 'Combat started'],
    'combat.turn_advanced': ['回合推进', 'Turn advanced'],
    'combat.round_advanced': ['进入新回合', 'New round'],
    'combat.combatant_added': ['加入战斗单位', 'Combatant added'],
    'combat.combatant_updated': ['战斗单位更新', 'Combatant updated'],
    'combat.combatant_removed': ['移出战斗桌', 'Combatant removed'],
    'combat.ended': ['战斗结束', 'Combat ended'],
    'map.background_set': ['设置地图背景', 'Map background set'],
    'map.background_cleared': ['清除地图背景', 'Map background cleared'],
    'map.viewport_changed': ['调整地图视图', 'Map view changed'],
    'map.token_added': ['添加地图 Token', 'Map token added'],
    'map.token_moved': ['移动地图 Token', 'Map token moved'],
    'map.token_updated': ['更新地图 Token', 'Map token updated'],
    'map.token_removed': ['删除地图 Token', 'Map token removed'],
  };
  return labels[eventKind]?.[locale === 'en' ? 1 : 0] ?? eventKind;
}

function runtimeEventSummary(item: RuntimeEvent, locale: Locale): string {
  if (typeof item.payload.text === 'string') return item.payload.text;
  const combatant = item.payload.combatant;
  const combatantName = combatant && typeof combatant === 'object' && 'displayName' in combatant && typeof combatant.displayName === 'string' ? combatant.displayName : '';
  if (item.eventKind === 'combat.started') return locale === 'en' ? 'The local combat table started.' : '本地战斗桌已开始。';
  if (item.eventKind === 'combat.round_advanced') return locale === 'en' ? `Round ${String(item.payload.round ?? '?')} started.` : `第 ${String(item.payload.round ?? '?')} 回合开始。`;
  if (item.eventKind === 'combat.turn_advanced') return locale === 'en' ? 'The active turn advanced.' : '当前回合已推进。';
  if (item.eventKind === 'combat.ended') return locale === 'en' ? 'The local combat table ended.' : '本地战斗桌已结束。';
  if (item.eventKind === 'combat.combatant_added') return locale === 'en' ? `${combatantName || 'A combatant'} joined the table.` : `${combatantName || '战斗单位'}加入了战斗桌。`;
  if (item.eventKind === 'combat.combatant_updated') return locale === 'en' ? `${combatantName || 'A combatant'} was updated.` : `${combatantName || '战斗单位'}已更新。`;
  if (item.eventKind === 'combat.combatant_removed') return locale === 'en' ? `${String(item.payload.displayName ?? 'A combatant')} left the table.` : `${String(item.payload.displayName ?? '战斗单位')}已移出战斗桌。`;
  if (item.eventKind === 'map.background_set') return locale === 'en' ? 'A map background was set.' : '已设置地图背景。';
  if (item.eventKind === 'map.background_cleared') return locale === 'en' ? 'The map background was cleared.' : '已清除地图背景。';
  if (item.eventKind === 'map.viewport_changed') return locale === 'en' ? 'The map view changed.' : '地图视图已调整。';
  if (item.eventKind === 'map.token_added') return locale === 'en' ? `${String((item.payload.token as Record<string, unknown> | undefined)?.name ?? 'A token')} was added to the map.` : `${String((item.payload.token as Record<string, unknown> | undefined)?.name ?? 'Token')}已添加到地图。`;
  if (item.eventKind === 'map.token_moved') return locale === 'en' ? 'A map token moved.' : '地图 Token 已移动。';
  if (item.eventKind === 'map.token_updated') return locale === 'en' ? 'A map token was updated.' : '地图 Token 已更新。';
  if (item.eventKind === 'map.token_removed') return locale === 'en' ? `${String(item.payload.name ?? 'A token')} was removed from the map.` : `${String(item.payload.name ?? 'Token')}已从地图删除。`;
  return locale === 'en' ? 'Event data' : '事件数据';
}

export function ServerCampaignWorkspace({ worldServerId, locale, gameSystems, defaultGameSystemId, canManageServer }: Props) {
  const { t } = createTranslator(locale);
  const { campaigns, loading, error, refresh, createCampaign } = useCampaigns(worldServerId);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignSystemId, setCampaignSystemId] = useState(defaultGameSystemId ?? gameSystems[0]?.gameSystemId ?? '');
  const [roomName, setRoomName] = useState('');
  const [eventText, setEventText] = useState('');
  const [runtimeCombatants, setRuntimeCombatants] = useState<Combatant[]>([]);
  const [actorName, setActorName] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<ApiClientError | null>(null);

  useEffect(() => {
    if (!selectedCampaignId && campaigns[0]) setSelectedCampaignId(campaigns[0].campaign.campaignId);
    if (selectedCampaignId && !campaigns.some((item) => item.campaign.campaignId === selectedCampaignId)) {
      setSelectedCampaignId(campaigns[0]?.campaign.campaignId ?? '');
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign: CampaignListItem | undefined = useMemo(
    () => campaigns.find((item) => item.campaign.campaignId === selectedCampaignId),
    [campaigns, selectedCampaignId],
  );
  const campaignDetail = useCampaignDetail(worldServerId, selectedCampaignId, { enabled: selectedCampaignId !== '' });
  const selectedRoom = campaignDetail.rooms.find((room) => room.roomId === selectedRoomId);

  useEffect(() => {
    if (!selectedRoomId && campaignDetail.rooms[0]) setSelectedRoomId(campaignDetail.rooms[0].roomId);
    if (selectedRoomId && !campaignDetail.rooms.some((room) => room.roomId === selectedRoomId)) {
      setSelectedRoomId(campaignDetail.rooms[0]?.roomId ?? '');
    }
  }, [campaignDetail.rooms, selectedRoomId]);

  const roomDetail = useRoomDetail(worldServerId, selectedCampaignId, selectedRoomId, { enabled: selectedRoomId !== '' });
  const runtimeSessionId = roomDetail.runtimeSession?.session.runtimeSessionId ?? '';
  const runtimeEvents = useRuntimeEvents(worldServerId, selectedCampaignId, selectedRoomId, runtimeSessionId);

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try { await action(); } catch (reason) {
      setActionError(reason instanceof ApiClientError ? reason : new ApiClientError('invalid_response', t('campaignRoom.actionFailed')));
    } finally { setBusy(false); }
  };

  const handleCreateCampaign = async (event: FormEvent) => {
    event.preventDefault();
    const title = campaignTitle.trim();
    if (!title || !campaignSystemId.trim()) return;
    await runAction(async () => {
      const created = await createCampaign({ title, description: campaignDescription.trim(), systemId: campaignSystemId.trim() });
      setCampaignTitle('');
      setCampaignDescription('');
      setSelectedCampaignId(created.campaign.campaignId);
    });
  };

  const handleCreateRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCampaignId) return;
    await runAction(async () => {
      const room = await campaignDetail.createRoom({ metadata: roomName.trim() ? { name: roomName.trim() } : {} });
      setRoomName('');
      setSelectedRoomId(room.roomId);
    });
  };

  const handleCreateRuntimeSession = async () => {
    if (!selectedRoomId || !selectedCampaignId) return;
    await runAction(async () => {
      await campaignRoomApiClient.createRuntimeSession(worldServerId, selectedCampaignId, selectedRoomId, { title: t('campaignRoom.newSessionTitle') });
      await roomDetail.refresh();
    });
  };

  const handleAppendEvent = async (event: FormEvent) => {
    event.preventDefault();
    const text = eventText.trim();
    if (!text) return;
    await runAction(async () => {
      await runtimeEvents.appendEvent({ eventKind: 'system.note', visibility: 'public', payload: { text } });
      setEventText('');
    });
  };

  const handleAppendCombatEvent = async (event: CombatRuntimeEventDraft) => {
    await runtimeEvents.appendEvent({ eventKind: event.eventKind, visibility: 'public', payload: event.payload });
  };

  const handleAppendMapEvent = async (event: MapRuntimeEventDraft) => {
    await runtimeEvents.appendEvent({ eventKind: event.eventKind, visibility: 'public', payload: event.payload });
  };

  const handleCreateCampaignActor = async (event: FormEvent) => {
    event.preventDefault();
    const displayName = actorName.trim();
    if (!displayName || !selectedCampaignId || !canManageServer) return;
    await runAction(async () => {
      await campaignRoomApiClient.createCampaignActor(worldServerId, selectedCampaignId, { displayName, actorKind: 'pc' });
      setActorName('');
      await campaignDetail.refresh();
    });
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('campaignRoom.eyebrow')}</div>
          <h2 className="mt-1 text-2xl font-black">{t('campaignRoom.title')}</h2>
          <p className="mt-1 text-sm leading-6 text-[#51483d]">{t('campaignRoom.subtitle')}</p>
        </div>
        <button type="button" onClick={() => void refresh()} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d] hover:bg-[#2f2a22]/5">
          {t('campaignRoom.refresh')}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1.25fr)]">
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold">{t('campaignRoom.campaigns')}</h3>
              <span className="text-xs font-bold text-[#51483d]">{campaigns.length}</span>
            </div>
            {loading && <p className="mt-3 text-sm text-[#51483d]">{t('campaignRoom.loading')}</p>}
            {!loading && error && (
              <div className="mt-3 rounded-xl bg-[#fff8e6] p-3 text-sm text-[#51483d]">
                <p>{errorText(error, locale)}</p>
                <button type="button" onClick={() => void refresh()} className="mt-2 font-bold underline">{t('campaignRoom.retry')}</button>
              </div>
            )}
            {!loading && !error && campaigns.length === 0 && <p className="mt-3 text-sm leading-6 text-[#51483d]">{t('campaignRoom.noCampaigns')}</p>}
            <div className="mt-3 flex flex-col gap-2">
              {campaigns.map(({ campaign }) => (
                <button key={campaign.campaignId} type="button" onClick={() => { setSelectedCampaignId(campaign.campaignId); setSelectedRoomId(''); }} className={`rounded-xl border p-3 text-left transition ${campaign.campaignId === selectedCampaignId ? 'border-[#58180d]/45 bg-[#fff8e6]' : 'border-[#2f2a22]/10 bg-[#f7f3ea] hover:border-[#58180d]/30'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold">{campaign.title}</span>
                    <span className="text-[11px] text-[#51483d]">{campaign.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#51483d]">{campaign.systemId} · {campaign.lifecycleStatus}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={(event) => void handleCreateCampaign(event)} className="rounded-2xl border border-dashed border-[#2f2a22]/18 bg-white/70 p-4">
            <h3 className="font-bold">{t('campaignRoom.createCampaign')}</h3>
            <div className="mt-3 flex flex-col gap-2">
              <input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} placeholder={t('campaignRoom.campaignTitle')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
              <textarea value={campaignDescription} onChange={(event) => setCampaignDescription(event.target.value)} placeholder={t('campaignRoom.campaignDescription')} className="min-h-20 rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
              {gameSystems.length > 0 ? (
                <select value={campaignSystemId} onChange={(event) => setCampaignSystemId(event.target.value)} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm">
                  <option value="">{t('campaignRoom.chooseSystem')}</option>
                  {gameSystems.map((system) => <option key={system.gameSystemId} value={system.gameSystemId}>{system.displayName}</option>)}
                </select>
              ) : (
                <input value={campaignSystemId} onChange={(event) => setCampaignSystemId(event.target.value)} placeholder={t('campaignRoom.systemId')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
              )}
              <button type="submit" disabled={busy || !campaignTitle.trim() || !campaignSystemId.trim()} className="w-fit rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{t('campaignRoom.create')}</button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-4">
          {actionError && <p className="rounded-xl bg-[#fff8e6] p-3 text-sm text-[#8b3a2f]">{errorText(actionError, locale) || actionError.message}</p>}
          {!selectedCampaignId && <div className="rounded-2xl border border-dashed border-[#2f2a22]/18 bg-white/70 p-6 text-sm text-[#51483d]">{t('campaignRoom.chooseCampaign')}</div>}
          {selectedCampaignId && campaignDetail.loading && <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-6 text-sm text-[#51483d]">{t('campaignRoom.loadingDetail')}</div>}
          {selectedCampaignId && campaignDetail.error && <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-6 text-sm text-[#51483d]">{errorText(campaignDetail.error, locale)} <button type="button" onClick={() => void campaignDetail.refresh()} className="ml-2 font-bold underline">{t('campaignRoom.retry')}</button></div>}
          {campaignDetail.detail && (
            <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('campaignRoom.campaignDetail')}</div>
                  <h3 className="mt-1 text-2xl font-black">{campaignDetail.detail.campaign.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#51483d]">{campaignDetail.detail.campaign.description || t('campaignRoom.noDescription')}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold text-[#51483d]">
                  <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{campaignDetail.detail.campaign.status}</span>
                  <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{campaignDetail.detail.campaign.lifecycleStatus}</span>
                  <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{campaignDetail.detail.campaign.systemId}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f7f3ea] p-3 text-sm"><strong>{t('campaignRoom.actorCount')}</strong><div className="mt-1 text-[#51483d]">{campaignDetail.actors.length}</div></div>
                <div className="rounded-xl bg-[#f7f3ea] p-3 text-sm"><strong>{t('campaignRoom.roomCount')}</strong><div className="mt-1 text-[#51483d]">{campaignDetail.rooms.length}</div></div>
              </div>
              <div className="mt-4 rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold">{t('campaignRoom.actorBindings')}</h4>
                    <p className="mt-1 text-xs text-[#51483d]">{t('campaignRoom.actorBindingsNote')}</p>
                  </div>
                  {canManageServer && (
                    <form onSubmit={(event) => void handleCreateCampaignActor(event)} className="flex flex-wrap gap-2">
                      <input value={actorName} onChange={(event) => setActorName(event.target.value)} placeholder={t('campaignRoom.actorName')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
                      <button type="submit" disabled={busy || !actorName.trim()} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold text-[#51483d] disabled:opacity-40">{t('campaignRoom.bindActor')}</button>
                    </form>
                  )}
                </div>
                {campaignDetail.actors.length === 0 && <p className="mt-3 text-xs text-[#51483d]">{t('campaignRoom.noActors')}</p>}
                {campaignDetail.actors.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {campaignDetail.actors.map((actor) => (
                      <div key={actor.campaignActorInstanceId} className="rounded-lg border border-[#2f2a22]/10 bg-white px-3 py-2 text-xs">
                        <div className="font-bold">{actorLabel(actor, t('campaignRoom.actorRecord'))}</div>
                        <div className="mt-1 text-[#51483d]">{actor.instanceStatus} · {actor.sourceActorId ? t('campaignRoom.sourceActorConnected') : t('campaignRoom.sourceActorLocal')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {campaignDetail.partialErrors.length > 0 && <p className="mt-3 text-xs text-[#51483d]">{t('campaignRoom.partialSync')}</p>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold">{t('campaignRoom.rooms')}</h4>
                <form onSubmit={(event) => void handleCreateRoom(event)} className="flex flex-wrap gap-2">
                  <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder={t('campaignRoom.roomName')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
                  <button type="submit" disabled={busy} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm font-bold text-[#51483d] disabled:opacity-40">{t('campaignRoom.createRoom')}</button>
                </form>
              </div>
              {campaignDetail.rooms.length === 0 && <p className="mt-2 text-sm text-[#51483d]">{t('campaignRoom.noRooms')}</p>}
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {campaignDetail.rooms.map((room) => <button key={room.roomId} type="button" onClick={() => setSelectedRoomId(room.roomId)} className={`rounded-xl border p-3 text-left ${room.roomId === selectedRoomId ? 'border-[#58180d]/45 bg-[#fff8e6]' : 'border-[#2f2a22]/10 bg-[#f7f3ea]'}`}><div className="font-bold">{roomLabel(room)}</div><div className="mt-1 text-xs text-[#51483d]">{room.roomStatus} · {room.multiplayerMode}</div></button>)}
              </div>
            </div>
          )}

          {selectedRoom && roomDetail.error && !roomDetail.room && (
            <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 text-sm text-[#51483d]">
              <p>{errorText(roomDetail.error, locale)}</p>
              <button type="button" onClick={() => void roomDetail.refresh()} className="mt-2 font-bold underline">{t('campaignRoom.retry')}</button>
            </div>
          )}

          {selectedRoom && roomDetail.room && (
            <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('campaignRoom.roomDetail')}</div><h3 className="mt-1 text-xl font-bold">{roomLabel(roomDetail.room)}</h3></div>
                <button type="button" onClick={() => void roomDetail.refresh()} className="text-xs font-bold underline">{t('campaignRoom.refresh')}</button>
                <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1 text-xs font-bold text-[#51483d]">{roomDetail.room.roomStatus}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#51483d]">{t('campaignRoom.metadataNote')}</p>
              {roomDetail.loading && <p className="mt-3 text-sm text-[#51483d]">{t('campaignRoom.loadingDetail')}</p>}
              {roomDetail.partialErrors.length > 0 && <p className="mt-3 rounded-lg bg-[#fff8e6] p-3 text-xs text-[#51483d]">{t('campaignRoom.roomPartialSync')} <button type="button" onClick={() => void roomDetail.refresh()} className="ml-1 font-bold underline">{t('campaignRoom.retry')}</button></p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f7f3ea] p-3 text-sm"><strong>{t('campaignRoom.participants')}</strong><div className="mt-1 text-[#51483d]">{roomDetail.participants.length}</div></div>
                <div className="rounded-xl bg-[#f7f3ea] p-3 text-sm"><strong>{t('campaignRoom.lobbySlots')}</strong><div className="mt-1 text-[#51483d]">{roomDetail.slots.length}</div></div>
              </div>
              {roomDetail.participants.length === 0 && roomDetail.slots.length === 0 && <p className="mt-4 text-sm text-[#51483d]">{t('campaignRoom.noParticipants')}</p>}
              {(roomDetail.participants.length > 0 || roomDetail.slots.length > 0) && <div className="mt-4 grid gap-2 sm:grid-cols-2"><div>{roomDetail.participants.map((participant) => <div key={participantKey(participant)} className="rounded-lg border border-[#2f2a22]/10 bg-[#f7f3ea] p-3 text-xs"><div className="font-bold">{participantName(participant, t('campaignRoom.member'))}</div><div className="mt-1 text-[#51483d]">{participant.participantRole ?? participant.roleKey ?? t('campaignRoom.member')} · {participant.participantStatus ?? participant.membershipStatus ?? t('campaignRoom.member')} · {participant.readyStatus ?? t('campaignRoom.readyUnknown')}</div></div>)}</div><div>{roomDetail.slots.map((slot) => <div key={slot.lobbySlotId} className="rounded-lg border border-[#2f2a22]/10 bg-[#f7f3ea] p-3 text-xs"><div className="font-bold">{slot.slotLabel ?? `${t('campaignRoom.slot')} ${slot.slotIndex !== undefined ? slot.slotIndex + 1 : ''}`}</div><div className="mt-1 text-[#51483d]">{slot.slotStatus} · {slot.campaignActorInstanceId ? t('campaignRoom.actorAttached') : t('campaignRoom.actorUnbound')}</div></div>)}</div></div>}

              <div className="mt-5 border-t border-[#2f2a22]/10 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold">{t('campaignRoom.runtimeSession')}</h4>{!roomDetail.runtimeSession && canManageServer && <button type="button" disabled={busy} onClick={() => void handleCreateRuntimeSession()} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold text-[#51483d] disabled:opacity-40">{t('campaignRoom.createSession')}</button>}</div>
                {!roomDetail.runtimeSession && <p className="mt-2 text-sm text-[#51483d]">{t('campaignRoom.noSession')}</p>}
                {roomDetail.runtimeSession && <><p className="mt-2 text-sm text-[#51483d]">{roomDetail.runtimeSession.session.title || t('campaignRoom.untitledSession')} · {roomDetail.runtimeSession.session.status}</p><BasicMapBoard locale={locale} mapId={`${worldServerId}:${selectedCampaignId}:${selectedRoomId}:${runtimeSessionId}`} runtimeSessionId={runtimeSessionId} runtimeEvents={runtimeEvents.events} campaignActors={campaignDetail.actors} combatants={runtimeCombatants} canManage={canManageServer} onAppendEvent={handleAppendMapEvent} /><CombatRuntimeTable locale={locale} scopeKey={`${worldServerId}:${selectedCampaignId}:${selectedRoomId}:${runtimeSessionId}`} campaignActors={campaignDetail.actors} canManage={canManageServer} runtimeSessionId={runtimeSessionId} runtimeEvents={runtimeEvents.events} onCombatantsChange={setRuntimeCombatants} onAppendEvent={handleAppendCombatEvent} /><div className="mt-4"><div className="flex items-center justify-between gap-2"><div><h4 className="font-bold">{t('campaignRoom.runtimeEvents')}</h4><p className="mt-1 text-xs text-[#51483d]">{t('campaignRoom.runtimeEventsNote')}</p></div><button type="button" onClick={() => void runtimeEvents.refresh()} className="text-xs font-bold underline">{t('campaignRoom.refresh')}</button></div>{runtimeEvents.error && <p className="mt-2 text-sm text-[#8b3a2f]">{errorText(runtimeEvents.error, locale)}</p>}{runtimeEvents.loading && <p className="mt-2 text-sm text-[#51483d]">{t('campaignRoom.loading')}</p>}{!runtimeEvents.loading && runtimeEvents.events.length === 0 && <p className="mt-2 text-sm text-[#51483d]">{t('campaignRoom.noEvents')}</p>}<div className="mt-2 max-h-44 overflow-auto rounded-xl bg-[#f7f3ea] p-3">{runtimeEvents.events.map((item) => <div key={item.runtimeEventId} className="border-b border-[#2f2a22]/8 py-2 text-xs last:border-0"><span className="font-bold">#{item.seq} {runtimeEventLabel(item.eventKind, locale)}</span><span className="ml-2 text-[#51483d]">{runtimeEventSummary(item, locale)}</span></div>)}</div><form onSubmit={(event) => void handleAppendEvent(event)} className="mt-3 flex gap-2"><input value={eventText} onChange={(event) => setEventText(event.target.value)} placeholder={t('campaignRoom.eventPlaceholder')} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" /><button type="submit" disabled={busy || !eventText.trim()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('campaignRoom.appendEvent')}</button></form><p className="mt-2 text-[11px] text-[#51483d]">{t('campaignRoom.appendOnlyNote')}</p></div></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
