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
import { DndDiceCheckPanel } from './DndDiceCheckPanel';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { DndLiteActorSheetPanel } from './DndLiteActorSheetPanel';
import { DndMonsterTemplateLibraryPanel } from './DndMonsterTemplateLibraryPanel';
import { SavedSceneLibraryPanel } from './SavedSceneLibraryPanel';
import { SceneRuntimeSnapshotPanel } from './SceneRuntimeSnapshotPanel';
import { LanRuntimeHostPanel } from './LanRuntimeHostPanel';
import { HostedRoomLaunchPanel } from './HostedRoomLaunchPanel';
import { JoinCampaignPanel } from './JoinCampaignPanel';
import { CampaignAiArtifactPanel } from './CampaignAiArtifactPanel';
import type { CombatRuntimeEventDraft, CombatRuntimeTableState } from '../../lib/combat/combatRuntimeTypes';
import type { CombatDamagePreset } from '../../lib/combat/combatComfort';
import type { MapBoardState, MapRuntimeEventDraft } from '../../lib/map/mapRuntimeTypes';
import type { MapTokenPresenceCandidate } from '../../lib/map/actorPresence';
import {
  entryCharacterFromCampaignActor,
  entryCharacterFromDndLiteActor,
  entryCharacterToPresenceCandidate,
} from '../../lib/platform/entryCharacterRef';
import {
  projectDndLiteActorSheets,
  withDndActorPresetProvenance,
  withDndLiteActorSheetOverride,
  withoutDndLiteActorSheetOverride,
} from '../../lib/platform/campaignActorOverride';
import type { SceneRuntimeSnapshot } from '../../lib/scene/sceneRuntimeSnapshotTypes';
import type { DndRuntimeEventDraft } from '../../lib/dnd/dndDiceTypes';
import type { DndLiteActorSheet, DndLiteCombatantPrefill } from '../../lib/dnd/dndLiteActorTypes';
import { getDndLiteCombatantPrefill } from '../../lib/dnd/dndLiteActorSheet';
import { dndMonsterToLiteActorSheet, type DndMonsterAction, type DndPrivateMonsterTemplate } from '../../lib/dnd/dndMonsterTemplateTypes';
import { useDndMonsterTemplates } from '../../lib/dnd/useDndMonsterTemplates';
import {
  materializeDndActorPreset,
  type DndActorPresetId,
} from '../../lib/dnd/dndActorPresets';
import {
  isPausedPublicSystemId,
  isPubliclyAvailableSystemId,
  pausedSystemDisplayName,
  pausedSystemNotice,
} from '../../lib/platform/publicGameSystemAvailability';
import {
  launchHostedRoomFromCampaign,
  resumeHostedRoomFromCampaign,
  type HostedRoomLaunchSession,
  type RoomLaunchActionState,
} from '../../lib/platform/hostedRoomLaunch';
import type { RoomSystemId } from '../../lib/platform/roomTypes';

type Props = {
  worldServerId: string;
  locale: Locale;
  gameSystems: WorldServerGameSystemBinding[];
  defaultGameSystemId?: string;
  canManageServer: boolean;
  viewerUserId?: string;
  hostDisplayName?: string;
};

function errorText(error: ApiClientError | null, locale: Locale): string {
  if (!error) return '';
  if (error.kind === 'configuration') return locale === 'en' ? 'The frontend server address is not configured. Set VITE_API_BASE_URL and rebuild the frontend.' : '前端尚未配置服务器地址。请设置 VITE_API_BASE_URL 后重新构建前端。';
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

function isRecoverableLiveLobby(room: { multiplayerMode: string; metadata: Record<string, unknown> }): boolean {
  const lifecycle = room.metadata.liveRoomLifecycleV1;
  return room.multiplayerMode === 'cloud'
    && !!lifecycle
    && typeof lifecycle === 'object'
    && (lifecycle as { recoverable?: unknown }).recoverable === true;
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

/**
 * Sentinel id for the unsaved creation draft.
 *
 * Deliberately not a UUID: it must be impossible to confuse with a real
 * `campaign_actor_instance_id`, and `onSave` keys off it to choose create
 * rather than update.
 */
const DRAFT_CAMPAIGN_ACTOR_ID = '__draft-campaign-actor__';

function isDndCampaign(systemId: string | undefined): boolean {
  return systemId?.toLowerCase().startsWith('dnd') ?? false;
}

function toRoomSystemId(systemId: string): RoomSystemId {
  const normalized = systemId.trim().toLowerCase();
  if (normalized === 'dnd5e-2024' || normalized.startsWith('dnd')) return 'dnd5e-2024';
  if (normalized === 'coc7e' || normalized.startsWith('coc')) return 'coc7e';
  if (normalized === 'cp-red' || normalized.includes('cyberpunk')) return 'cp-red';
  return 'custom';
}

function gameSystemLabel(systemId: string, gameSystems: WorldServerGameSystemBinding[], locale: Locale): string {
  return gameSystems.find((system) => system.gameSystemId === systemId)?.displayName
    ?? (isDndCampaign(systemId) ? 'D&D 2024' : undefined)
    ?? (locale === 'en' ? 'Custom system' : '自定义系统');
}

function roomAvailabilityLabel(room: { multiplayerMode: string; metadata: Record<string, unknown> }, locale: Locale): string {
  if (isRecoverableLiveLobby(room)) return locale === 'en' ? 'Live lobby available' : '联机大厅可恢复';
  return locale === 'en' ? 'Room ready' : '房间已准备';
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
    'combat.damage_applied': ['应用伤害', 'Damage applied'],
    'combat.healing_applied': ['应用治疗', 'Healing applied'],
    'combat.temporary_hp_applied': ['应用临时生命', 'Temporary HP applied'],
    'combat.condition_added': ['获得状态', 'Condition added'],
    'combat.condition_removed': ['移除状态', 'Condition removed'],
    'combat.condition_toggled': ['切换状态', 'Condition toggled'],
    'combat.hp_overridden': ['调整生命值', 'HP adjusted'],
    'combat.table_cleared': ['清除本地战斗表', 'Local combat table cleared'],
    'combat.ended': ['战斗结束', 'Combat ended'],
    'map.background_set': ['设置地图背景', 'Map background set'],
    'map.background_cleared': ['清除地图背景', 'Map background cleared'],
    'map.viewport_changed': ['调整地图视图', 'Map view changed'],
    'map.token_added': ['添加地图 Token', 'Map token added'],
    'map.token_moved': ['移动地图 Token', 'Map token moved'],
    'map.token_updated': ['更新地图 Token', 'Map token updated'],
    'map.token_removed': ['删除地图 Token', 'Map token removed'],
    'map.grid_updated': ['更新地图网格', 'Map grid updated'],
    'map.template_added': ['添加区域模板', 'Area template added'],
    'map.template_updated': ['更新区域模板', 'Area template updated'],
    'map.template_removed': ['删除区域模板', 'Area template removed'],
    'map.templates_cleared': ['清除区域模板', 'Area templates cleared'],
    'scene.snapshot_exported': ['导出场景快照', 'Scene snapshot exported'],
    'scene.snapshot_imported': ['导入场景快照', 'Scene snapshot imported'],
    'scene.state_saved': ['保存场景', 'Scene saved'],
    'scene.state_loaded': ['加载场景', 'Scene loaded'],
    'scene.state_archived': ['归档场景', 'Scene archived'],
    'scene.state_duplicated': ['复制场景', 'Scene duplicated'],
    'dnd.check_rolled': ['DND 检定', 'DND check'],
    'dnd.skill_rolled': ['DND 技能检定', 'DND skill check'],
    'dnd.save_rolled': ['DND 豁免', 'DND saving throw'],
    'dnd.attack_rolled': ['DND 攻击', 'DND attack'],
    'dnd.damage_rolled': ['DND 伤害', 'DND damage'],
    'dnd.roll_note': ['DND 掷骰', 'DND dice roll'],
  };
  return labels[eventKind]?.[locale === 'en' ? 1 : 0] ?? eventKind;
}

function runtimeEventSummary(item: RuntimeEvent, locale: Locale): string {
  if (typeof item.payload.text === 'string') return item.payload.text;
  if (typeof item.payload.summary === 'string') return item.payload.summary;
  const combatant = item.payload.combatant;
  const combatantName = combatant && typeof combatant === 'object' && 'displayName' in combatant && typeof combatant.displayName === 'string' ? combatant.displayName : '';
  if (item.eventKind === 'combat.started') return locale === 'en' ? 'The local combat table started.' : '本地战斗桌已开始。';
  if (item.eventKind === 'combat.round_advanced') return locale === 'en' ? `Round ${String(item.payload.round ?? '?')} started.` : `第 ${String(item.payload.round ?? '?')} 回合开始。`;
  if (item.eventKind === 'combat.turn_advanced') return locale === 'en' ? 'The active turn advanced.' : '当前回合已推进。';
  if (item.eventKind === 'combat.ended') return locale === 'en' ? 'The local combat table ended.' : '本地战斗桌已结束。';
  if (item.eventKind === 'combat.combatant_added') return locale === 'en' ? `${combatantName || 'A combatant'} joined the table.` : `${combatantName || '战斗单位'}加入了战斗桌。`;
  if (item.eventKind === 'combat.combatant_updated') return locale === 'en' ? `${combatantName || 'A combatant'} was updated.` : `${combatantName || '战斗单位'}已更新。`;
  if (item.eventKind === 'combat.combatant_removed') return locale === 'en' ? `${String(item.payload.displayName ?? 'A combatant')} left the table.` : `${String(item.payload.displayName ?? '战斗单位')}已移出战斗桌。`;
  const targetName = String(item.payload.targetName ?? (locale === 'en' ? 'The combatant' : '战斗单位'));
  const sourceName = typeof item.payload.sourceName === 'string' && item.payload.sourceName.trim() ? item.payload.sourceName : locale === 'en' ? 'The host' : '主持人';
  const amount = typeof item.payload.amount === 'number' ? item.payload.amount : '?';
  if (item.eventKind === 'combat.damage_applied') return locale === 'en' ? `${sourceName} dealt ${amount} damage to ${targetName}.` : `${sourceName}对${targetName}造成 ${amount} 点伤害。`;
  if (item.eventKind === 'combat.healing_applied') return locale === 'en' ? `${sourceName} restored ${amount} HP to ${targetName}.` : `${sourceName}为${targetName}恢复 ${amount} 点生命值。`;
  if (item.eventKind === 'combat.temporary_hp_applied') return locale === 'en' ? `${targetName} gained ${amount} temporary HP.` : `${targetName}获得 ${amount} 点临时生命值。`;
  if (item.eventKind === 'combat.condition_added') return locale === 'en' ? `${targetName} gained ${String(item.payload.condition ?? 'a condition')}.` : `${targetName}获得状态：${String(item.payload.condition ?? '未知')}。`;
  if (item.eventKind === 'combat.condition_removed') return locale === 'en' ? `${targetName} removed ${String(item.payload.condition ?? 'a condition')}.` : `${targetName}移除状态：${String(item.payload.condition ?? '未知')}。`;
  if (item.eventKind === 'combat.condition_toggled') return locale === 'en' ? `${targetName} ${item.payload.added === true ? 'gained' : 'removed'} ${String(item.payload.condition ?? 'a condition')}.` : `${targetName}${item.payload.added === true ? '获得' : '移除'}状态：${String(item.payload.condition ?? '未知')}。`;
  if (item.eventKind === 'combat.hp_overridden') return locale === 'en' ? `The host set ${targetName} HP to ${String(item.payload.afterHp ?? amount)}.` : `主持人将 ${targetName} HP 调整为 ${String(item.payload.afterHp ?? amount)}。`;
  if (item.eventKind === 'combat.table_cleared') return locale === 'en' ? 'The local combat table was cleared.' : '本地战斗表已清除。';
  if (item.eventKind === 'map.background_set') return locale === 'en' ? 'A map background was set.' : '已设置地图背景。';
  if (item.eventKind === 'map.background_cleared') return locale === 'en' ? 'The map background was cleared.' : '已清除地图背景。';
  if (item.eventKind === 'map.viewport_changed') return locale === 'en' ? 'The map view changed.' : '地图视图已调整。';
  if (item.eventKind === 'map.token_added') return locale === 'en' ? `${String((item.payload.token as Record<string, unknown> | undefined)?.name ?? 'A token')} was added to the map.` : `${String((item.payload.token as Record<string, unknown> | undefined)?.name ?? 'Token')}已添加到地图。`;
  if (item.eventKind === 'map.token_moved') return locale === 'en' ? 'A map token moved.' : '地图 Token 已移动。';
  if (item.eventKind === 'map.token_updated') return locale === 'en' ? 'A map token was updated.' : '地图 Token 已更新。';
  if (item.eventKind === 'map.token_removed') return locale === 'en' ? `${String(item.payload.name ?? 'A token')} was removed from the map.` : `${String(item.payload.name ?? 'Token')}已从地图删除。`;
  if (item.eventKind === 'map.grid_updated') return locale === 'en' ? 'The tactical grid changed.' : '战术网格已更新。';
  if (item.eventKind === 'map.template_added') return locale === 'en' ? 'An area template was added.' : '已添加区域模板。';
  if (item.eventKind === 'map.template_updated') return locale === 'en' ? 'An area template changed.' : '区域模板已更新。';
  if (item.eventKind === 'map.template_removed') return locale === 'en' ? 'An area template was removed.' : '已删除区域模板。';
  if (item.eventKind === 'map.templates_cleared') return locale === 'en' ? 'Area templates were cleared.' : '区域模板已清除。';
  if (item.eventKind === 'scene.snapshot_exported') return locale === 'en' ? 'A local scene snapshot was exported.' : '已导出本地场景快照。';
  if (item.eventKind === 'scene.snapshot_imported') return locale === 'en' ? 'A local scene snapshot was applied.' : '已应用本地场景快照。';
  if (item.eventKind === 'scene.state_saved') return locale === 'en' ? 'A scene was saved to this room.' : '场景已保存到当前房间。';
  if (item.eventKind === 'scene.state_loaded') return locale === 'en' ? 'A saved scene was applied locally.' : '已在当前页面应用保存的场景。';
  if (item.eventKind === 'scene.state_archived') return locale === 'en' ? 'A saved scene was archived.' : '已归档保存的场景。';
  if (item.eventKind === 'scene.state_duplicated') return locale === 'en' ? 'A saved scene was duplicated.' : '已复制保存的场景。';
  return locale === 'en' ? 'Event data' : '事件数据';
}

export function ServerCampaignWorkspace({ worldServerId, locale, gameSystems, defaultGameSystemId, canManageServer, viewerUserId, hostDisplayName }: Props) {
  const { t } = createTranslator(locale);
  const { campaigns, loading, error, refresh, createCampaign } = useCampaigns(worldServerId);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignSystemId, setCampaignSystemId] = useState(() => {
    // Never open the create form pre-selected on a system that cannot be created.
    const preferred = [defaultGameSystemId, ...gameSystems.map((system) => system.gameSystemId)]
      .find((id) => id && isPubliclyAvailableSystemId(id));
    return preferred ?? defaultGameSystemId ?? gameSystems[0]?.gameSystemId ?? '';
  });
  const [roomName, setRoomName] = useState('');
  const [eventText, setEventText] = useState('');
  const [runtimeCombatState, setRuntimeCombatState] = useState<CombatRuntimeTableState>({ combatants: [], turn: { status: 'setup', roundNumber: 1, turnIndex: -1 } });
  const [combatantToLocate, setCombatantToLocate] = useState<string>();
  const [runtimeMapBoard, setRuntimeMapBoard] = useState<MapBoardState | undefined>();
  const [campaignActorRevision, setCampaignActorRevision] = useState(0);
  const [actorEntry, setActorEntry] = useState<{ actorId?: string; source: 'campaign' | 'token' | 'combat' | 'runtime' } | null>(null);
  const [dndDicePreset, setDndDicePreset] = useState<{ actorInstanceId: string; actionId?: string; nonce: number }>();
  const [dndActorPrefill, setDndActorPrefill] = useState<(DndLiteCombatantPrefill & { nonce: number }) | undefined>();
  const [dndMonsterActionPreset, setDndMonsterActionPreset] = useState<{ monsterName: string; action: DndMonsterAction; nonce: number }>();
  const [dndDamagePreset, setDndDamagePreset] = useState<CombatDamagePreset>();
  const [snapshotImportVersion, setSnapshotImportVersion] = useState(0);
  const [actorTask, setActorTask] = useState<'players' | 'npc' | 'monster' | 'customMonster' | null>(null);
  /**
   * Which kind of actor the host is creating right now, or undefined when they
   * are not creating one. It exists only to tell the canonical sheet which
   * archetype list to offer; the draft itself lives inside that sheet.
   */
  const [creatingActorKind, setCreatingActorKind] = useState<'npc' | 'monster'>();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<ApiClientError | null>(null);
  const [liveRoomSession, setLiveRoomSession] = useState<HostedRoomLaunchSession | null>(null);
  const [joiningLiveRoom, setJoiningLiveRoom] = useState(false);
  const [liveRoomLaunchState, setLiveRoomLaunchState] = useState<RoomLaunchActionState>('idle');
  const [liveRoomError, setLiveRoomError] = useState<string | null>(null);
  const lanConnectionTitle = locale === 'en' ? 'LAN connection' : '局域网连接';
  const lanConnectionNote = locale === 'en'
    ? 'Use this only when your group is connecting through a local network.'
    : '仅在同一局域网内联机时使用，不影响正常的战役房间。';
  const sessionToolsTitle = locale === 'en' ? 'Session tools' : '会话工具';
  const sessionToolsNote = locale === 'en'
    ? 'Use these tools to prepare a local session. Multiplayer play begins from the live lobby above.'
    : '用于准备本地会话；多人跑团请从上方的联机大厅进入。';

  useEffect(() => {
    if (!selectedCampaignId && campaigns[0]) setSelectedCampaignId(campaigns[0].campaign.campaignId);
    if (selectedCampaignId && !campaigns.some((item) => item.campaign.campaignId === selectedCampaignId)) {
      setSelectedCampaignId(campaigns[0]?.campaign.campaignId ?? '');
    }
  }, [campaigns, selectedCampaignId]);

  useEffect(() => { setActorEntry(null); setActorTask(null); }, [selectedCampaignId]);

  const selectedCampaign: CampaignListItem | undefined = useMemo(
    () => campaigns.find((item) => item.campaign.campaignId === selectedCampaignId),
    [campaigns, selectedCampaignId],
  );
  const dndMonsters = useDndMonsterTemplates(worldServerId);
  const campaignDetail = useCampaignDetail(worldServerId, selectedCampaignId, { enabled: selectedCampaignId !== '' });
  const dndActorSheets = useMemo(
    () => projectDndLiteActorSheets(campaignDetail.actors),
    [campaignDetail.actors],
  );
  const activeRooms = useMemo(
    () => campaignDetail.rooms.filter((room) => !room.closedAt && !['closed', 'archived', 'disbanded'].includes(room.roomStatus.toLowerCase())),
    [campaignDetail.rooms],
  );
  const selectedRoom = activeRooms.find((room) => room.roomId === selectedRoomId);

  useEffect(() => {
    if (!selectedRoomId && activeRooms[0]) setSelectedRoomId(activeRooms[0].roomId);
    if (selectedRoomId && !activeRooms.some((room) => room.roomId === selectedRoomId)) {
      setSelectedRoomId(activeRooms[0]?.roomId ?? '');
    }
  }, [activeRooms, selectedRoomId]);

  const roomDetail = useRoomDetail(worldServerId, selectedCampaignId, selectedRoomId, { enabled: selectedRoomId !== '' });
  const runtimeSessionId = roomDetail.runtimeSession?.session.runtimeSessionId ?? '';
  const runtimeEvents = useRuntimeEvents(worldServerId, selectedCampaignId, selectedRoomId, runtimeSessionId);
  const actorPresenceCandidates = useMemo<MapTokenPresenceCandidate[]>(() => [
    ...campaignDetail.actors.flatMap((actor) => {
      const sheet = dndActorSheets[actor.campaignActorInstanceId];
      const entryCharacter = sheet
        ? entryCharacterFromDndLiteActor(actor.campaignActorInstanceId, sheet, actor.ownerId)
        : entryCharacterFromCampaignActor(actor);
      const candidate = entryCharacterToPresenceCandidate(entryCharacter);
      return candidate ? [candidate] : [];
    }),
    ...dndMonsters.monsters.map((monster) => ({
      sourceType: 'monsterTemplate' as const,
      sourceId: monster.monsterTemplateId,
      displayName: monster.name,
      kind: 'monster' as const,
      hpSummary: monster.hitPointsAverage === undefined ? undefined : { current: monster.hitPointsAverage, max: monster.hitPointsAverage },
    })),
  ], [campaignDetail.actors, dndActorSheets, dndMonsters.monsters]);

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
    if (isPausedPublicSystemId(campaignSystemId)) return;
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

  const handleLaunchLiveRoom = async () => {
    if (!selectedCampaign || !canManageServer) return;
    setLiveRoomLaunchState('launching');
    setLiveRoomError(null);
    try {
      const session = await launchHostedRoomFromCampaign({
        campaign: {
          id: selectedCampaign.campaign.campaignId,
          title: selectedCampaign.campaign.title,
          systemId: toRoomSystemId(selectedCampaign.campaign.systemId),
          worldServerId,
          campaignRefSource: 'unknown',
        },
        source: 'campaignDetail',
        hostDisplayName: hostDisplayName?.trim() || 'GM',
        roomDisplayName: roomName.trim() || undefined,
      });
      setRoomName('');
      setLiveRoomSession(session);
      await campaignDetail.refresh();
      setLiveRoomLaunchState('idle');
    } catch {
      setLiveRoomLaunchState('failed');
      setLiveRoomError(t('campaignRoom.liveLobbyFailed'));
    }
  };

  const handleResumeLiveRoom = async (roomId: string) => {
    if (!selectedCampaign || !canManageServer) return;
    setLiveRoomLaunchState('launching');
    setLiveRoomError(null);
    try {
      const session = await resumeHostedRoomFromCampaign({ roomId, campaignId: selectedCampaign.campaign.campaignId });
      setLiveRoomSession(session);
      setLiveRoomLaunchState('idle');
    } catch {
      setLiveRoomLaunchState('failed');
      setLiveRoomError(t('campaignRoom.liveLobbyRecoveryFailed'));
    }
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

  const handleAppendDndEvent = async (event: DndRuntimeEventDraft) => {
    await runtimeEvents.appendEvent({ eventKind: event.eventKind, visibility: 'public', payload: event.payload });
  };

  const handleSaveDndActorSheet = async (actorInstanceId: string, sheet: DndLiteActorSheet) => {
    if (!selectedCampaignId || !canManageServer) throw new Error('Campaign actor editing is unavailable.');
    const actor = campaignDetail.actors.find((item) => item.campaignActorInstanceId === actorInstanceId);
    if (!actor) throw new Error('Campaign actor not found.');
    await campaignDetail.updateActor(actorInstanceId, {
      overridePayload: withDndLiteActorSheetOverride(actor.overridePayload, sheet),
    });
    setCampaignActorRevision(value => value + 1);
  };

  /**
   * T11b. Read-only host review of a linked character source. Returns the
   * server's derived summary; the client never receives the player's
   * character data and never caches one.
   */
  const handleReviewDndActorSource = async (actorInstanceId: string) => {
    if (!selectedCampaignId || !canManageServer) throw new Error('Campaign actor review is unavailable.');
    return campaignRoomApiClient.reviewCampaignActorSource(worldServerId, selectedCampaignId, actorInstanceId);
  };

  /**
   * T11b. Accepts the reviewed version as the campaign's frozen source.
   * Deliberately does NOT touch the combat sheet override or any runtime
   * state; it only refreshes the campaign detail so the panel and the T9
   * "Fill from character" action see the newly accepted snapshot.
   */
  const handleAcceptDndActorSource = async (actorInstanceId: string, expectedSourceHash: string) => {
    if (!selectedCampaignId || !canManageServer) throw new Error('Campaign actor review is unavailable.');
    await campaignRoomApiClient.acceptCampaignActorSource(worldServerId, selectedCampaignId, actorInstanceId, { expectedSourceHash });
    await campaignDetail.refresh();
  };

  const handleClearDndActorSheet = async (actorInstanceId: string) => {
    if (!selectedCampaignId || !canManageServer) throw new Error('Campaign actor editing is unavailable.');
    const actor = campaignDetail.actors.find((item) => item.campaignActorInstanceId === actorInstanceId);
    if (!actor) throw new Error('Campaign actor not found.');
    await campaignDetail.updateActor(actorInstanceId, {
      overridePayload: withoutDndLiteActorSheetOverride(actor.overridePayload),
    });
    setCampaignActorRevision(value => value + 1);
  };

  const handleCreateMonsterActorDraft = async (monster: DndPrivateMonsterTemplate) => {
    if (!selectedCampaignId || !canManageServer) return;
    await runAction(async () => {
      const actor = await campaignRoomApiClient.createCampaignActor(worldServerId, selectedCampaignId, {
        displayName: monster.name,
        actorKind: 'monster',
        // A catalog template is not an Actor/Vault identity (sourceActorId FK).
        snapshotPayload: { dndPrivateMonsterTemplateRefV1: { monsterTemplateId: monster.monsterTemplateId, worldServerId: monster.worldServerId } },
        overridePayload: withDndLiteActorSheetOverride({}, dndMonsterToLiteActorSheet(monster)),
      });
      await campaignDetail.refresh();
      setActorTask(null);
      setActorEntry({ actorId: actor.campaignActorInstanceId, source: actorEntry?.source ?? 'campaign' });
    });
  };

  const handleAppendSceneSnapshotEvent = async (eventKind: 'scene.snapshot_exported' | 'scene.snapshot_imported', payload: Record<string, unknown>) => {
    await runtimeEvents.appendEvent({ eventKind, visibility: 'public', payload });
  };

  const handleAppendSceneStateEvent = async (eventKind: 'scene.state_saved' | 'scene.state_loaded' | 'scene.state_archived' | 'scene.state_duplicated', payload: Record<string, unknown>) => {
    await runtimeEvents.appendEvent({ eventKind, visibility: 'public', payload });
  };

  const handleApplySceneSnapshot = (snapshot: SceneRuntimeSnapshot) => {
    if (snapshot.combat) setRuntimeCombatState(snapshot.combat);
    if (snapshot.map) setRuntimeMapBoard(snapshot.map.board);
    setSnapshotImportVersion((previous) => previous + 1);
  };

  /**
   * Creates one campaign actor from a completed draft.
   *
   * DRAFT-FIRST: nothing is persisted until the host has seen the canonical
   * sheet and pressed Create, so the campaign never accumulates half-empty
   * actors. The sheet is written through the SAME `overridePayload` path a host
   * edit uses, so there is one creation pipeline and one actor shape. The
   * preset id is recorded beside the sheet as a label only. There is no
   * intermediate creator or earlier persistence step.
   */
  const createActorFromDraft = async (sheet: DndLiteActorSheet, presetId: DndActorPresetId, presetVersion: number) => {
    if (!selectedCampaignId || !canManageServer || !creatingActorKind) return;
    const displayName = sheet.displayName.trim();
    if (!displayName) return;
    await runAction(async () => {
      const overridePayload = withDndActorPresetProvenance(
        withDndLiteActorSheetOverride({}, { ...sheet, displayName }),
        { presetId, presetVersion, materializedAt: new Date().toISOString() },
      );
      const actor = await campaignRoomApiClient.createCampaignActor(worldServerId, selectedCampaignId, {
        displayName, actorKind: creatingActorKind, overridePayload,
      });
      setCreatingActorKind(undefined);
      setActorTask(null);
      await campaignDetail.refresh();
      setActorEntry({ actorId: actor.campaignActorInstanceId, source: actorEntry?.source ?? 'campaign' });
    });
  };

  const openActorTask = (task: NonNullable<typeof actorTask>) => {
    setActorTask(task);
    // Create NPC and Create custom monster open the canonical sheet directly.
    // There is no lightweight creator in between: the archetype is an option
    // inside that sheet, so the fast path is good defaults, not a second editor.
    setCreatingActorKind(task === 'npc' ? 'npc' : task === 'customMonster' ? 'monster' : undefined);
    setActorEntry({ source: actorEntry?.source ?? 'campaign' });
  };
  const castKind = (actor: CampaignActorInstance) => ['pc', 'npc', 'monster'].includes(actor.actorKind ?? 'pc') ? actor.actorKind ?? 'pc' : 'other';
  const actorIntentControls = <div className="flex flex-wrap gap-2" data-campaign-cast-actions>
    <button type="button" className="rounded border bg-white px-3 py-2 text-sm font-bold" onClick={() => openActorTask('players')}>{locale === 'en' ? 'Add player characters' : '添加玩家角色'}</button>
    <button type="button" className="rounded border bg-white px-3 py-2 text-sm font-bold" onClick={() => openActorTask('npc')}>{locale === 'en' ? 'Create NPC' : '创建 NPC'}</button>
    <button type="button" className="rounded border bg-white px-3 py-2 text-sm font-bold" onClick={() => openActorTask('monster')}>{locale === 'en' ? 'Add monster' : '添加怪物'}</button>
  </div>;
  const liveOwnedRoom = Boolean(selectedRoom && isRecoverableLiveLobby(selectedRoom));
  const actorSurface = <Dialog open={actorEntry !== null} onOpenChange={open => { if (!open) { setActorEntry(null); setActorTask(null); setCreatingActorKind(undefined); } }}>
    <DialogContent className="z-[150] max-h-[90dvh] overflow-y-auto sm:max-w-5xl" data-entry-source={actorEntry?.source}>
      {!actorTask && <button type="button" className="w-fit text-xs font-bold underline" onClick={() => void campaignDetail.refresh()}>{locale === 'en' ? 'Refresh list' : '刷新列表'}</button>}
      <DialogTitle>{actorTask ? actorTask === 'monster' ? '添加怪物' : actorTask === 'npc' ? '创建 NPC' : actorTask === 'players' ? '添加玩家角色' : '创建自定义怪物' : locale === 'en' ? 'Character sheet' : '角色卡'}</DialogTitle>
      <DialogDescription>{actorTask ? '准备这场战役中的角色。玩家角色由玩家在大厅提交，NPC 和怪物保存在本战役。' : locale === 'en' ? 'Edit this character as the campaign stores it. Hit points during an encounter and the player’s own character are kept separately.' : '编辑本战役保存的这份角色卡。战斗中的生命值与玩家自己的角色分开保存。'}</DialogDescription>
      {canManageServer && !actorTask && actorIntentControls}
      {actorTask && <button type="button" className="w-fit text-xs underline" onClick={() => { setActorTask(null); setCreatingActorKind(undefined); }}>返回角色列表</button>}
      {actorTask === 'players' && <div className="rounded border p-4 text-sm" data-player-cast-guidance>
        <h3 className="font-bold">邀请玩家带入自己的角色</h3><p className="mt-2">在房间大厅复制房间码发给玩家。玩家从角色库选择角色，或创建角色后提交给主持人；审核通过后会出现在这里。</p>
        <p className="mt-2">主持人也扮演角色时，请在大厅展开“我也扮演角色”。</p>
        <button type="button" className="mt-3 rounded border px-3 py-2 font-bold" onClick={() => { setActorEntry(null); setActorTask(null); document.getElementById('campaign-room-entry')?.scrollIntoView({ behavior: 'smooth' }); }}>返回房间入口</button>
      </div>}
      {/* THE canonical D&D actor surface, in create mode. Same component, same
          fields and same layout as editing an existing actor — only the
          archetype picker, the CTA and the absence of persisted-only sections
          differ. Nothing is written until the host presses Create actor. */}
      {creatingActorKind && <DndLiteActorSheetPanel
        locale={locale} canManage={canManageServer}
        campaignActors={[{
          campaignActorInstanceId: DRAFT_CAMPAIGN_ACTOR_ID,
          campaignId: selectedCampaignId,
          actorKind: creatingActorKind,
          displayName: '',
          instanceStatus: 'active',
          snapshotPayload: {},
          overridePayload: withDndLiteActorSheetOverride({}, materializeDndActorPreset(
            creatingActorKind === 'monster' ? 'brute' : 'commoner',
            { displayName: '', actorKind: creatingActorKind, locale: locale === 'en' ? 'en' : 'zh-CN' },
          )),
        }]}
        sheets={{ [DRAFT_CAMPAIGN_ACTOR_ID]: materializeDndActorPreset(
          creatingActorKind === 'monster' ? 'brute' : 'commoner',
          { displayName: '', actorKind: creatingActorKind, locale: locale === 'en' ? 'en' : 'zh-CN' },
        ) }}
        initialActorInstanceId={DRAFT_CAMPAIGN_ACTOR_ID}
        draftActorInstanceId={DRAFT_CAMPAIGN_ACTOR_ID}
        presetAudience={creatingActorKind === 'monster' ? 'monster' : 'npc'}
        onCreate={createActorFromDraft}
        onSave={async () => undefined}
        onClear={async () => setCreatingActorKind(undefined)}
      />}
      {actorTask === 'monster' && <><DndMonsterTemplateLibraryPanel selectionOnly locale={locale} canManage={canManageServer} monsters={dndMonsters.monsters} loading={dndMonsters.loading} error={dndMonsters.error} onRefresh={dndMonsters.refresh} onCreateActorDraft={handleCreateMonsterActorDraft}
        onAddToCombat={!liveRoomSession && !liveOwnedRoom && runtimeSessionId ? monster => { setDndActorPrefill({ ...getDndLiteCombatantPrefill(dndMonsterToLiteActorSheet(monster)), nonce: Date.now() }); setActorEntry(null); setActorTask(null); } : undefined}
        onUseAction={!liveRoomSession && !liveOwnedRoom && runtimeSessionId ? (monster, action) => { setDndMonsterActionPreset({ monsterName: monster.name, action, nonce: Date.now() }); setActorEntry(null); setActorTask(null); } : undefined}
      /><details><summary className="cursor-pointer text-sm">没有合适的怪物？</summary><button type="button" className="mt-2 underline" onClick={() => openActorTask('customMonster')}>创建自定义怪物</button></details></>}
      {actionError && <p role="alert" className="text-sm text-[#8b3a2f]">{errorText(actionError, locale) || actionError.message}</p>}
      {actorEntry && !actorTask && (isDndCampaign(selectedCampaign?.campaign.systemId) || Boolean(actorEntry.actorId && dndActorSheets[actorEntry.actorId])) && <DndLiteActorSheetPanel
        locale={locale} canManage={canManageServer} campaignActors={campaignDetail.actors} sheets={dndActorSheets}
        initialActorInstanceId={actorEntry.actorId}
        onSave={handleSaveDndActorSheet} onClear={handleClearDndActorSheet}
        onReviewSource={handleReviewDndActorSource} onAcceptSource={handleAcceptDndActorSource}
        onUseAction={!liveRoomSession && !liveOwnedRoom && runtimeSessionId ? (actorInstanceId, actionId) => { setDndDicePreset({ actorInstanceId, actionId, nonce: Date.now() }); setActorEntry(null); } : undefined}
        onAddToCombat={!liveRoomSession && !liveOwnedRoom && runtimeSessionId ? prefill => { setDndActorPrefill({ ...prefill, nonce: Date.now() }); setActorEntry(null); } : undefined}
      />}
    </DialogContent>
  </Dialog>;

  if (joiningLiveRoom) return <section className="space-y-3"><button type="button" onClick={() => setJoiningLiveRoom(false)} className="rounded border bg-white px-3 py-2 text-sm">{t('campaignRoom.backToWorkspace')}</button><JoinCampaignPanel systemId={toRoomSystemId(selectedCampaign?.campaign.systemId ?? 'dnd5e-2024')} initialDisplayName={hostDisplayName} /></section>;

  if (liveRoomSession) {
    return (
      <>{actorSurface}<HostedRoomLaunchPanel
        campaignActorRevision={campaignActorRevision}
        campaignActorCandidates={canManageServer ? actorPresenceCandidates.filter(candidate => Boolean(candidate.campaignActorId)) : undefined}
        onOpenCampaignActor={canManageServer && isDndCampaign(selectedCampaign?.campaign.systemId) ? (actorId, source) => setActorEntry({ actorId, source }) : undefined}
        baseUrl={liveRoomSession.baseUrl}
        room={liveRoomSession.room}
        hostMemberId={liveRoomSession.hostMemberId}
        serverLabel={t('campaignRoom.liveLobbyServerLabel')}
        backLabel={t('campaignRoom.backToWorkspace')}
        exitLabel={t('campaignRoom.leaveLiveLobby')}
        originLabel={t('campaignRoom.liveLobbyOrigin')}
        originDetail={selectedCampaign?.campaign.title}
        onClose={() => {
          setLiveRoomSession(null);
          void campaignDetail.refresh();
        }}
        panelClassName="rounded-2xl border border-[#2f2a22]/12 bg-white p-4 shadow-sm"
      /></>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {actorSurface}
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

      <div className="grid gap-4 xl:grid-cols-[minmax(15rem,0.5fr)_minmax(0,1.5fr)]">
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
                    <span className="text-[11px] text-[#51483d]">{gameSystemLabel(campaign.systemId, gameSystems, locale)}{isPausedPublicSystemId(campaign.systemId) ? (locale === 'en' ? ' · unavailable' : ' · 暂不可用') : ''}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#51483d]">{campaign.description || t('campaignRoom.noDescription')}</div>
                </button>
              ))}
            </div>
          </div>

          <details open={campaigns.length === 0} className="rounded-xl border border-[#2f2a22]/15 bg-white/70 p-4"><summary className="cursor-pointer font-bold">{t('campaignRoom.createCampaign')}</summary>
          <form onSubmit={(event) => void handleCreateCampaign(event)}>
            <div className="mt-3 flex flex-col gap-2">
              <input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} placeholder={t('campaignRoom.campaignTitle')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
              <textarea value={campaignDescription} onChange={(event) => setCampaignDescription(event.target.value)} placeholder={t('campaignRoom.campaignDescription')} className="min-h-20 rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
              {/* AI-LANDMARK: PUBLIC_SYSTEM_SCOPE_DND_ONLY_V1 — a paused system is
                  shown disabled rather than silently dropped, so a host can see it
                  exists and is not selectable right now. */}
              {gameSystems.length > 0 ? (
                <select value={campaignSystemId} onChange={(event) => setCampaignSystemId(event.target.value)} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm">
                  <option value="">{t('campaignRoom.chooseSystem')}</option>
                  {gameSystems.map((system) => {
                    const paused = isPausedPublicSystemId(system.gameSystemId);
                    return <option key={system.gameSystemId} value={system.gameSystemId} disabled={paused}>
                      {system.displayName}{paused ? (locale === 'en' ? ' — temporarily unavailable' : ' — 暂时不可用') : ''}
                    </option>;
                  })}
                </select>
              ) : (
                <input value={campaignSystemId} onChange={(event) => setCampaignSystemId(event.target.value)} placeholder={t('campaignRoom.systemId')} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm" />
              )}
              <button type="submit" disabled={busy || !campaignTitle.trim() || !campaignSystemId.trim()} className="w-fit rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{t('campaignRoom.create')}</button>
            </div>
          </form></details>
        </div>

        <div className="flex flex-col gap-4">
          {actionError && <p className="rounded-xl bg-[#fff8e6] p-3 text-sm text-[#8b3a2f]">{errorText(actionError, locale) || actionError.message}</p>}
          {!selectedCampaignId && <div className="rounded-2xl border border-dashed border-[#2f2a22]/18 bg-white/70 p-6 text-sm text-[#51483d]">{t('campaignRoom.chooseCampaign')}</div>}
          {selectedCampaignId && campaignDetail.loading && <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-6 text-sm text-[#51483d]">{t('campaignRoom.loadingDetail')}</div>}
          {selectedCampaignId && campaignDetail.error && <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-6 text-sm text-[#51483d]">{errorText(campaignDetail.error, locale)} <button type="button" onClick={() => void campaignDetail.refresh()} className="ml-2 font-bold underline">{t('campaignRoom.retry')}</button></div>}
          {/* AI-LANDMARK: PUBLIC_SYSTEM_SCOPE_DND_ONLY_V1 — an existing CoC or
              Cyberpunk Red campaign is still listed and still readable, but its
              preparation surfaces are replaced by an honest notice rather than
              by a retired editor. The record itself is untouched. */}
          {campaignDetail.detail && isPausedPublicSystemId(campaignDetail.detail.campaign.systemId) && (
            <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm" data-paused-campaign={campaignDetail.detail.campaign.systemId}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{locale === 'en' ? 'Temporarily unavailable' : '暂时不可用'}</div>
              <h3 className="mt-1 text-2xl font-black">{campaignDetail.detail.campaign.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#51483d]">{pausedSystemNotice(campaignDetail.detail.campaign.systemId, locale === 'en' ? 'en' : 'zh-CN')}</p>
              <p className="mt-2 text-xs leading-5 text-[#51483d]">{locale === 'en'
                ? `${pausedSystemDisplayName(campaignDetail.detail.campaign.systemId, 'en')} preparation and live play will return once rebuilt on the current information architecture.`
                : `${pausedSystemDisplayName(campaignDetail.detail.campaign.systemId, 'zh-CN')} 的准备与开桌会在按当前信息架构重建后回归。`}</p>
              <button type="button" onClick={() => { setSelectedCampaignId(''); setSelectedRoomId(''); }} className="mt-4 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white">{locale === 'en' ? 'Back to campaigns' : '返回战役列表'}</button>
            </div>
          )}
          {campaignDetail.detail && !isPausedPublicSystemId(campaignDetail.detail.campaign.systemId) && (
            <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('campaignRoom.campaignDetail')}</div>
                  <h3 className="mt-1 text-2xl font-black">{campaignDetail.detail.campaign.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#51483d]">{campaignDetail.detail.campaign.description || t('campaignRoom.noDescription')}</p>
                </div>
                <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1 text-[11px] font-bold text-[#51483d]">
                  {gameSystemLabel(campaignDetail.detail.campaign.systemId, gameSystems, locale)}
                </span>
              </div>
              <p className="mt-3 text-xs text-[#51483d]">{campaignDetail.actors.length} {t('campaignRoom.actorCount')} · {activeRooms.length} {t('campaignRoom.roomCount')}</p>
              {campaignDetail.partialErrors.length > 0 && <p className="mt-3 text-xs text-[#51483d]">{t('campaignRoom.partialSync')}</p>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <h4 id="campaign-room-entry" className="font-bold">{t('campaignRoom.rooms')}</h4>
                <details><summary className="cursor-pointer text-xs">{locale === 'en' ? 'Advanced: room records' : '高级：房间记录'}</summary><form onSubmit={(event) => void handleCreateRoom(event)} className="flex flex-wrap gap-2">
                  <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder={t('campaignRoom.roomName')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
                  <button type="submit" disabled={busy} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm font-bold text-[#51483d] disabled:opacity-40">{t('campaignRoom.createRoom')}</button>
                </form></details>
              </div>
              {canManageServer && (
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#58180d]/18 bg-[#fff8e6] p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{t('campaignRoom.liveLobbyTitle')}</div>
                    <p className="mt-1 text-xs leading-5 text-[#51483d]">{t('campaignRoom.liveLobbyNote')}</p>
                  </div>
                  <button type="button" disabled={liveRoomLaunchState === 'launching'} onClick={() => void handleLaunchLiveRoom()} className="rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white disabled:opacity-40">
                    {liveRoomLaunchState === 'launching' ? t('campaignRoom.liveLobbyStarting') : t('campaignRoom.liveLobbyLaunch')}
                  </button>
                  {liveRoomError && <p className="w-full text-xs text-[#8b3a2f]">{liveRoomError}</p>}
                </div>
              )}
              {activeRooms.length === 0 && <p className="mt-2 text-sm text-[#51483d]">{t('campaignRoom.noRooms')}</p>}
              {!canManageServer && <button type="button" onClick={() => setJoiningLiveRoom(true)} className="mt-3 rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white">{locale === 'en' ? 'Join live room' : '加入联机房间'}</button>}
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {activeRooms.map((room) => (
                  <div key={room.roomId} className={`rounded-xl border p-3 ${room.roomId === selectedRoomId ? 'border-[#58180d]/45 bg-[#fff8e6]' : 'border-[#2f2a22]/10 bg-[#f7f3ea]'}`}>
                    <button type="button" onClick={() => setSelectedRoomId(room.roomId)} className="w-full text-left">
                      <div className="font-bold">{roomLabel(room)}</div>
                      <div className="mt-1 text-xs text-[#51483d]">{roomAvailabilityLabel(room, locale)}</div>
                    </button>
                    {canManageServer && viewerUserId === room.hostUserId && isRecoverableLiveLobby(room) && (
                      <button type="button" disabled={liveRoomLaunchState === 'launching'} onClick={() => void handleResumeLiveRoom(room.roomId)} className="mt-3 rounded-md border border-[#2f2a22]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#51483d] disabled:opacity-40">
                        {t('campaignRoom.resumeLiveLobby')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <details className="mt-5 border-t border-[#2f2a22]/15 pt-4"><summary className="cursor-pointer font-bold">{locale === 'en' ? 'Campaign preparation & characters' : '战役准备与角色管理'}</summary>

              <div className="mt-4 rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold">{t('campaignRoom.actorBindings')}</h4>
                    <p className="mt-1 text-xs text-[#51483d]">{t('campaignRoom.actorBindingsNote')}</p>
                  </div>
                  {canManageServer && actorIntentControls}
                </div>
                {isDndCampaign(selectedCampaign?.campaign.systemId) && <button type="button" onClick={() => setActorEntry({ source: 'campaign' })} className="mt-3 rounded border px-3 py-2 text-sm font-bold">{locale === 'en' ? 'Open campaign combat sheet' : '打开战役战斗卡'}</button>}
                {campaignDetail.actors.length === 0 && <p className="mt-3 text-xs text-[#51483d]">{t('campaignRoom.noActors')}</p>}
                {(['pc', 'npc', 'monster', 'other'] as const).filter(kind => kind !== 'other' || campaignDetail.actors.some(actor => castKind(actor) === kind)).map(kind => <section key={kind} className="mt-4" data-cast-group={kind}>
                  <h5 className="font-bold">{kind === 'pc' ? '玩家角色' : kind === 'npc' ? 'NPC' : kind === 'monster' ? '怪物' : '其他角色'} · {campaignDetail.actors.filter(actor => castKind(actor) === kind).length}</h5>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">{campaignDetail.actors.filter(actor => castKind(actor) === kind).map(actor => <div key={actor.campaignActorInstanceId} className="rounded-lg border bg-white p-3 text-sm">
                    <div className="font-bold">{actorLabel(actor, t('campaignRoom.actorRecord'))}</div>
                    <p className="mt-1 text-xs text-[#51483d]">{actor.instanceStatus === 'archived' ? '已归档' : kind === 'pc' ? actor.sourceActorId ? '玩家角色已关联' : '战役准备角色' : '本战役角色'}</p>
                    {(isDndCampaign(selectedCampaign?.campaign.systemId) || Boolean(dndActorSheets[actor.campaignActorInstanceId])) && <button type="button" className="mt-2 font-bold underline" onClick={() => { setActorTask(null); setActorEntry({ actorId: actor.campaignActorInstanceId, source: 'campaign' }); }}>{locale === 'en' ? 'Open campaign combat sheet' : '打开战役战斗卡'}</button>}
                  </div>)}</div>
                  {!campaignDetail.actors.some(actor => castKind(actor) === kind) && <p className="mt-1 text-xs text-[#51483d]">{kind === 'pc' ? '邀请玩家在大厅选择并提交自己的角色。' : kind === 'npc' ? '创建故事中的人物，保存在本战役。' : '从怪物资料中选择，或创建自定义怪物。'}</p>}
                </section>)}
              </div>
              <details className="mt-4"><summary className="cursor-pointer text-sm font-bold">AI 备团与回顾（可选）</summary><CampaignAiArtifactPanel locale={locale} worldServerId={worldServerId} campaignId={campaignDetail.detail.campaign.campaignId} canManage={canManageServer} /></details>
              </details>
              {canManageServer && (
                <details className="mt-5 rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3">
                  <summary className="cursor-pointer list-none font-bold text-[#2f2a22]">
                    {lanConnectionTitle}
                  </summary>
                  <p className="mt-2 text-xs leading-5 text-[#51483d]">{lanConnectionNote}</p>
                  <div className="mt-3">
                    <LanRuntimeHostPanel
                      locale={locale}
                      canManageServer={canManageServer}
                      contextLabel={selectedRoom ? `${selectedCampaign?.campaign.title ?? ''} / ${roomLabel(selectedRoom)}`.replace(/^\s*\/\s*|\s*\/\s*$/g, '') : selectedCampaign?.campaign.title}
                    />
                  </div>
                </details>
              )}
            </div>
          )}

          {selectedRoom && roomDetail.error && !roomDetail.room && (
            <div className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 text-sm text-[#51483d]">
              <p>{errorText(roomDetail.error, locale)}</p>
              <button type="button" onClick={() => void roomDetail.refresh()} className="mt-2 font-bold underline">{t('campaignRoom.retry')}</button>
            </div>
          )}

          {selectedRoom && roomDetail.room && (
            <details className="rounded-xl border border-[#2f2a22]/12 bg-white p-4"><summary className="cursor-pointer font-bold">{locale === 'en' ? 'Room details & session tools' : '房间资料与会话管理'}</summary><div className="mt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('campaignRoom.roomDetail')}</div><h3 className="mt-1 text-xl font-bold">{roomLabel(roomDetail.room)}</h3></div>
                <button type="button" onClick={() => void roomDetail.refresh()} className="text-xs font-bold underline">{t('campaignRoom.refresh')}</button>
                <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1 text-xs font-bold text-[#51483d]">{roomAvailabilityLabel(roomDetail.room, locale)}</span>
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
                {liveOwnedRoom && <p className="mt-3 text-sm">{locale === 'en' ? 'This session belongs to a live room. Resume the lobby above to adjust the map or combat.' : '本会话由联机房间管理。请从上方恢复大厅，调整地图或战斗。'}</p>}
                {roomDetail.runtimeSession && !liveOwnedRoom && (
                  <details className="mt-3 rounded-xl border border-[#2f2a22]/10 bg-[#f7f3ea] p-3">
                    <summary className="cursor-pointer list-none font-bold text-[#2f2a22]">
                      {sessionToolsTitle}
                    </summary>
                    <p className="mt-2 text-xs leading-5 text-[#51483d]">{sessionToolsNote}</p>
                    <div className="mt-3">
                  <BasicMapBoard
                    locale={locale}
                    mapId={`${worldServerId}:${selectedCampaignId}:${selectedRoomId}:${runtimeSessionId}`}
                    mapEvents={runtimeEvents.events.filter((event) => event.runtimeSessionId === runtimeSessionId && event.eventKind.startsWith('map.'))}
                    combatants={runtimeCombatState.combatants}
                    activeCombatantId={runtimeCombatState.turn.activeCombatantId}
                    locateCombatantId={combatantToLocate}
                    actorPresenceCandidates={actorPresenceCandidates}
                    canManage={canManageServer}
                    onBoardChange={setRuntimeMapBoard}
                    snapshotBoard={runtimeMapBoard}
                    snapshotImportVersion={snapshotImportVersion}
                    onAppendEvent={handleAppendMapEvent}
                  />
                  {isDndCampaign(selectedCampaign?.campaign.systemId) && <button type="button" onClick={() => setActorEntry({ source: 'campaign' })} className="my-3 rounded border px-3 py-2 text-sm font-bold">{locale === 'en' ? 'Open campaign combat sheet' : '打开战役战斗卡'}</button>}
                  {isDndCampaign(selectedCampaign?.campaign.systemId) && <button type="button" className="my-3 rounded border px-3 py-2 text-sm" onClick={() => openActorTask('monster')}>添加怪物</button>}
                  <CombatRuntimeTable
                    locale={locale}
                    scopeKey={`${worldServerId}:${selectedCampaignId}:${selectedRoomId}:${runtimeSessionId}`}
                    campaignActors={campaignDetail.actors}
                    canManage={canManageServer}
                    runtimeSessionId={runtimeSessionId}
                    runtimeEvents={runtimeEvents.events}
                    onStateChange={setRuntimeCombatState}
                    snapshotState={runtimeCombatState}
                    snapshotImportVersion={snapshotImportVersion}
                    dndActorSheets={dndActorSheets}
                    dndActorPrefill={dndActorPrefill}
                    damagePreset={dndDamagePreset}
                    onLocateCombatant={setCombatantToLocate}
                    onRequestDice={(combatant) => {
                      if (!combatant.sourceActorInstanceId) return;
                      setDndDicePreset({ actorInstanceId: combatant.sourceActorInstanceId, nonce: Date.now() });
                      document.getElementById('dnd-dice-check-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    onAppendEvent={handleAppendCombatEvent}
                  />
                  {isDndCampaign(selectedCampaign?.campaign.systemId) && <DndDiceCheckPanel
                    locale={locale}
                    canManage={canManageServer}
                    campaignActors={campaignDetail.actors}
                    combatants={runtimeCombatState.combatants}
                    actorSheets={dndActorSheets}
                    preset={dndDicePreset}
                    monsterActionPreset={dndMonsterActionPreset}
                    onDamageReady={setDndDamagePreset}
                    onAppendEvent={handleAppendDndEvent}
                  />}
                  <SceneRuntimeSnapshotPanel
                    locale={locale}
                    canManage={canManageServer}
                    context={{ roomId: selectedRoomId, campaignId: selectedCampaignId, runtimeSessionId }}
                    combatState={runtimeCombatState}
                    mapBoard={runtimeMapBoard}
                    onApply={handleApplySceneSnapshot}
                    onAppendEvent={handleAppendSceneSnapshotEvent}
                  />
                  <SavedSceneLibraryPanel
                    locale={locale}
                    worldServerId={worldServerId}
                    campaignId={selectedCampaignId}
                    roomId={selectedRoomId}
                    runtimeSessionId={runtimeSessionId}
                    canManage={canManageServer}
                    context={{ roomId: selectedRoomId, campaignId: selectedCampaignId, runtimeSessionId }}
                    combatState={runtimeCombatState}
                    mapBoard={runtimeMapBoard}
                    onApply={handleApplySceneSnapshot}
                    onAppendEvent={handleAppendSceneStateEvent}
                  />
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-2">
                      <div><h4 className="font-bold">{t('campaignRoom.runtimeEvents')}</h4><p className="mt-1 text-xs text-[#51483d]">{t('campaignRoom.runtimeEventsNote')}</p></div>
                      <button type="button" onClick={() => void runtimeEvents.refresh()} className="text-xs font-bold underline">{t('campaignRoom.refresh')}</button>
                    </div>
                    {runtimeEvents.error && <p className="mt-2 text-sm text-[#8b3a2f]">{errorText(runtimeEvents.error, locale)}</p>}
                    {runtimeEvents.loading && <p className="mt-2 text-sm text-[#51483d]">{t('campaignRoom.loading')}</p>}
                    {!runtimeEvents.loading && runtimeEvents.events.length === 0 && <p className="mt-2 text-sm text-[#51483d]">{t('campaignRoom.noEvents')}</p>}
                    <div className="mt-2 max-h-44 overflow-auto rounded-xl bg-[#f7f3ea] p-3">{runtimeEvents.events.map((item) => <div key={item.runtimeEventId} className="border-b border-[#2f2a22]/8 py-2 text-xs last:border-0"><span className="font-bold">#{item.seq} {runtimeEventLabel(item.eventKind, locale)}</span><span className="ml-2 text-[#51483d]">{runtimeEventSummary(item, locale)}</span></div>)}</div>
                    <form onSubmit={(event) => void handleAppendEvent(event)} className="mt-3 flex gap-2"><input value={eventText} onChange={(event) => setEventText(event.target.value)} placeholder={t('campaignRoom.eventPlaceholder')} className="min-w-0 flex-1 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" /><button type="submit" disabled={busy || !eventText.trim()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('campaignRoom.appendEvent')}</button></form>
                    <p className="mt-2 text-[11px] text-[#51483d]">{t('campaignRoom.appendOnlyNote')}</p>
                  </div>
                    </div>
                  </details>
                )}
              </div>
            </div></details>
          )}
        </div>
      </div>
    </section>
  );
}
