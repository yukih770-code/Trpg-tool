import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

type JsonRecord = Record<string, unknown>;
type Step = { name: string; status: 'passed' | 'failed'; httpStatus?: number; reason?: string };
type RecoveryState = {
  hostCookie: string;
  playerCookie: string;
  worldId: string;
  campaignId: string;
  roomId: string;
  hostMemberId: string;
  playerMemberId: string;
  bindingId: string;
  combatStartedId: string;
  combatTurnId: string;
  mapEventId: string;
  mapId: string;
  characterTokenId: string;
};

const phase = process.argv.includes('--prepare') ? 'prepare' : process.argv.includes('--verify') ? 'verify' : undefined;
const strict = process.argv.includes('--strict');
const baseUrl = (process.env.E2E_API_BASE_URL?.trim() || 'http://localhost:8792').replace(/\/+$/, '');
const bootstrapCode = process.env.E2E_PRIVATE_ALPHA_ACCESS_CODE?.trim();
const statePath = process.env.PRIVATE_ALPHA_RESTART_STATE_FILE?.trim();
const steps: Step[] = [];

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function envelopeValue(body: unknown): unknown {
  return isRecord(body) && body.ok === true ? body.value : undefined;
}

function objectValue(body: unknown): JsonRecord | undefined {
  const value = envelopeValue(body);
  return isRecord(value) ? value : undefined;
}

function recordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function pathFor(...parts: string[]): string {
  return `/${parts.map((part) => encodeURIComponent(part)).join('/')}`;
}

function cookiePair(value: string | null): string | undefined {
  const first = value?.split(';', 1)[0]?.trim();
  return first && first.includes('=') ? first : undefined;
}

class Client {
  constructor(private cookie?: string) {}

  async request(name: string, path: string, init: RequestInit = {}, expectedStatuses?: readonly number[]) {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    if (this.cookie) headers.set('Cookie', this.cookie);
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    } catch {
      steps.push({ name, status: 'failed', reason: 'server_unavailable' });
      return { ok: false, status: 0, body: undefined as unknown, setCookie: undefined as string | undefined };
    }
    let body: unknown;
    try {
      const text = await response.text();
      body = text.trim() ? JSON.parse(text) : undefined;
    } catch {
      steps.push({ name, status: 'failed', httpStatus: response.status, reason: 'non_json_response' });
      return { ok: false, status: response.status, body, setCookie: undefined as string | undefined };
    }
    const ok = expectedStatuses === undefined
      ? response.ok && (!isRecord(body) || body.ok !== false)
      : expectedStatuses.includes(response.status);
    steps.push({ name, status: ok ? 'passed' : 'failed', httpStatus: response.status, reason: ok ? undefined : `http_${response.status}` });
    return { ok, status: response.status, body, setCookie: response.headers.get('set-cookie') ?? undefined };
  }

  async login(displayName: string, accessCode: string): Promise<string> {
    const result = await this.request('prepare_private_alpha_login', '/api/auth/private-alpha/login', {
      method: 'POST',
      body: JSON.stringify({ displayName, accessCode }),
    });
    const cookie = cookiePair(result.setCookie ?? null);
    if (!result.ok || !cookie) throw new Error('private_alpha_login_failed');
    this.cookie = cookie;
    return cookie;
  }
}

function assertion(name: string, condition: boolean, reason: string): void {
  steps.push({ name, status: condition ? 'passed' : 'failed', reason: condition ? undefined : reason });
  if (!condition) throw new Error(reason);
}

function report(status: 'prepared' | 'passed' | 'failed'): void {
  const failed = steps.some((step) => step.status === 'failed');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    phase,
    status: failed ? 'failed' : status,
    strict,
    steps,
    evidence: {
      sessionRecovered: steps.some((step) => step.name === 'verify_existing_session' && step.status === 'passed'),
      roomRecovered: steps.some((step) => step.name === 'verify_live_room_recovered' && step.status === 'passed'),
      playerAdmissionRecovered: steps.some((step) => step.name === 'verify_player_admission_recovered' && step.status === 'passed'),
      playerTokenAuthorityRecovered: steps.some((step) => step.name === 'verify_player_token_authority_recovered' && step.status === 'passed'),
      combatRecovered: steps.some((step) => step.name === 'verify_combat_runtime_log_recovered' && step.status === 'passed'),
      mapRecovered: steps.some((step) => step.name === 'verify_map_restart_recovered' && step.status === 'passed'),
    },
    notes: [
      'The phase state file is operator-local and contains both session cookies; this report never prints them or any identifier.',
      'Server, campaign, and room fixtures are archived/closed during verify cleanup.',
      'Room Map recovery is verified by the original event identifier and grid payload after a real process restart.',
    ],
  }, null, 2));
}

async function prepare(): Promise<void> {
  if (!bootstrapCode || !statePath) throw new Error('missing_prepare_configuration');
  const suffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const client = new Client();
  const hostCookie = await client.login(`Restart Host ${suffix}`, bootstrapCode);

  const worldResponse = await client.request('prepare_world_server', '/api/world-servers', {
    method: 'POST',
    body: JSON.stringify({
      displayName: `Restart World ${suffix}`,
      serverHandle: `restart-${suffix}`,
      serverVisibility: 'private',
      joinPolicy: 'inviteOnly',
      defaultGameSystemId: 'dnd5e-2024',
    }),
  });
  const world = objectValue(worldResponse.body);
  const worldId = typeof world?.worldServerId === 'string' ? world.worldServerId : undefined;
  if (!worldResponse.ok || !worldId) throw new Error('world_create_failed');
  const worldRoot = pathFor('api', 'world-servers', worldId);

  const inviteResponse = await client.request('prepare_player_invite', `${worldRoot}/invites`, {
    method: 'POST',
    body: JSON.stringify({ maxUses: 1, defaultRoleKey: 'member' }),
  });
  const invite = objectValue(inviteResponse.body);
  const inviteCode = typeof invite?.inviteCode === 'string' ? invite.inviteCode : undefined;
  if (!inviteResponse.ok || !inviteCode) throw new Error('player_invite_failed');
  const player = new Client();
  const playerCookie = await player.login(`Restart Player ${suffix}`, inviteCode);

  const campaignResponse = await client.request('prepare_campaign', `${worldRoot}/campaigns`, {
    method: 'POST',
    body: JSON.stringify({ title: `Restart Campaign ${suffix}`, systemId: 'dnd5e-2024', status: 'active' }),
  });
  const campaignEnvelope = objectValue(campaignResponse.body);
  const campaign = isRecord(campaignEnvelope?.campaign) ? campaignEnvelope.campaign : campaignEnvelope;
  const campaignId = typeof campaign?.campaignId === 'string' ? campaign.campaignId : undefined;
  if (!campaignResponse.ok || !campaignId) throw new Error('campaign_create_failed');

  const roomResponse = await client.request('prepare_live_room', '/rooms/create', {
    method: 'POST',
    body: JSON.stringify({
      hostDisplayName: `Restart Host ${suffix}`,
      displayName: `Restart Room ${suffix}`,
      systemId: 'dnd5e-2024',
      campaignRef: { source: 'localCampaignLibrary', worldServerId: worldId, campaignId, displayName: `Restart Campaign ${suffix}`, systemId: 'dnd5e-2024' },
    }),
  });
  const room = isRecord(roomResponse.body) && isRecord(roomResponse.body.room) ? roomResponse.body.room : undefined;
  const identity = isRecord(room?.identity) ? room.identity : undefined;
  const hostMember = recordArray(room?.members).find((member) => member.role === 'host');
  const roomId = typeof identity?.roomId === 'string' ? identity.roomId : undefined;
  const roomCode = typeof identity?.roomCode === 'string' ? identity.roomCode : undefined;
  const hostMemberId = typeof hostMember?.memberId === 'string' ? hostMember.memberId : undefined;
  if (!roomResponse.ok || !roomId || !roomCode || !hostMemberId) throw new Error('live_room_create_failed');

  const joinResponse = await player.request('prepare_player_join', '/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCodeOrRoomCode: roomCode, requestedDisplayName: `Restart Player ${suffix}`, requestedRole: 'player' }),
  });
  const join = isRecord(joinResponse.body) ? joinResponse.body : undefined;
  const playerMemberId = typeof join?.memberId === 'string' ? join.memberId : undefined;
  if (!joinResponse.ok || !playerMemberId) throw new Error('player_join_failed');
  const approveMemberResponse = await client.request('prepare_player_member_approval', pathFor('rooms', roomId, 'members', playerMemberId, 'approve'), {
    method: 'POST',
    body: JSON.stringify({ decidedByMemberId: hostMemberId }),
  });
  if (!approveMemberResponse.ok) throw new Error('player_member_approval_failed');
  const bindingResponse = await player.request('prepare_player_actor_binding', pathFor('rooms', roomId, 'actor-bindings', 'submit'), {
    method: 'POST',
    body: JSON.stringify({
      memberId: playerMemberId,
      actorRef: { systemId: 'dnd5e-2024', displayName: `Restart Hero ${suffix}`, source: 'quickDraft', summary: 'Restart admission proof.' },
    }),
  });
  const bindingBody = isRecord(bindingResponse.body) ? bindingResponse.body : undefined;
  const bindingId = typeof bindingBody?.bindingId === 'string' ? bindingBody.bindingId : undefined;
  if (!bindingResponse.ok || !bindingId) throw new Error('player_binding_failed');
  const approveBindingResponse = await client.request('prepare_player_actor_approval', pathFor('rooms', roomId, 'actor-bindings', bindingId, 'approve'), {
    method: 'POST',
    body: JSON.stringify({ reviewerMemberId: hostMemberId }),
  });
  if (!approveBindingResponse.ok) throw new Error('player_actor_approval_failed');
  const readyResponse = await player.request('prepare_player_ready', pathFor('rooms', roomId, 'members', playerMemberId, 'ready'), {
    method: 'POST',
    body: JSON.stringify({ ready: true }),
  });
  if (!readyResponse.ok) throw new Error('player_ready_failed');

  const combatStarted = await client.request('prepare_combat_started', pathFor('rooms', roomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      kind: 'combat.started',
      visibility: 'public',
      text: 'Restart recovery combat.',
      payload: {
        roundNumber: 1,
        turnIndex: 0,
        activeCombatantId: 'restart-combatant',
        combatants: [{ id: 'restart-combatant', name: 'Restart NPC', displayName: 'Restart NPC', kind: 'npc', sourceType: 'manual_npc', initiative: 15, initiativeModifier: 0, hpCurrent: 12, hpMax: 12, armorClass: 12, conditions: [], isDefeated: false, status: 'active' }],
      },
    }),
  });
  const combatStartedEvent = isRecord(combatStarted.body) && isRecord(combatStarted.body.event) ? combatStarted.body.event : undefined;
  const combatStartedId = typeof combatStartedEvent?.eventId === 'string' ? combatStartedEvent.eventId : undefined;
  if (!combatStarted.ok || !combatStartedId) throw new Error('combat_start_failed');

  const combatTurn = await client.request('prepare_combat_turn', pathFor('rooms', roomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({ authorMemberId: hostMemberId, kind: 'combat.round_advanced', visibility: 'public', text: 'Restart round two.', payload: { roundNumber: 2, turnIndex: 0, activeCombatantId: 'restart-combatant' } }),
  });
  const combatTurnEvent = isRecord(combatTurn.body) && isRecord(combatTurn.body.event) ? combatTurn.body.event : undefined;
  const combatTurnId = typeof combatTurnEvent?.eventId === 'string' ? combatTurnEvent.eventId : undefined;
  if (!combatTurn.ok || !combatTurnId) throw new Error('combat_turn_failed');

  const mapId = `restart-map-${suffix}`;
  const mapResponse = await client.request('prepare_map_event', pathFor('rooms', roomId, 'map-events'), {
    method: 'POST',
    body: JSON.stringify({ authorMemberId: hostMemberId, mapId, eventKind: 'map.grid_updated', payload: { grid: { enabled: true, sizePx: 72, feetPerSquare: 5, originX: 0, originY: 0, snap: true, showCoordinates: true } } }),
  });
  const mapEvent = isRecord(mapResponse.body) && isRecord(mapResponse.body.event) ? mapResponse.body.event : undefined;
  const mapEventId = typeof mapEvent?.mapEventId === 'string' ? mapEvent.mapEventId : undefined;
  if (!mapResponse.ok || !mapEventId) throw new Error('map_event_failed');

  const characterTokenId = `restart-character-${suffix}`;
  const tokenResponse = await client.request('prepare_player_character_token', pathFor('rooms', roomId, 'map-events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      mapId,
      eventKind: 'map.token_added',
      payload: { token: { id: characterTokenId, name: `Restart Hero ${suffix}`, x: 35, y: 40, size: 'medium', sourceType: 'quickDraft', sourceId: bindingId, actorBindingId: bindingId, roomMemberId: playerMemberId, kind: 'playerCharacter' } },
    }),
  });
  if (!tokenResponse.ok) throw new Error('player_character_token_failed');
  const permissionResponse = await client.request('prepare_player_token_permission', pathFor('rooms', roomId, 'map-permissions', playerMemberId), {
    method: 'POST',
    body: JSON.stringify({ authorizedByMemberId: hostMemberId, canManageTokens: true }),
  });
  if (!permissionResponse.ok) throw new Error('player_token_permission_failed');

  await new Promise((resolve) => setTimeout(resolve, 300));
  await writeFile(statePath, JSON.stringify({ hostCookie, playerCookie, worldId, campaignId, roomId, hostMemberId, playerMemberId, bindingId, combatStartedId, combatTurnId, mapEventId, mapId, characterTokenId } satisfies RecoveryState), { encoding: 'utf8', flag: 'wx' });
  assertion('prepare_restart_fixture', true, 'restart_fixture_not_prepared');
}

async function verify(): Promise<void> {
  if (!statePath) throw new Error('missing_state_file');
  const state = JSON.parse(await readFile(statePath, 'utf8')) as RecoveryState;
  const client = new Client(state.hostCookie);
  const player = new Client(state.playerCookie);
  const worldRoot = pathFor('api', 'world-servers', state.worldId);
  const campaignRoot = `${worldRoot}/campaigns/${encodeURIComponent(state.campaignId)}`;

  try {
    const me = await client.request('verify_existing_session', '/api/auth/me');
    assertion('verify_session_identity', me.ok && objectValue(me.body)?.authenticated === true && objectValue(me.body)?.authMode === 'privateAlpha', 'session_not_recovered');
    const world = await client.request('verify_world_server_recovered', worldRoot);
    const campaign = await client.request('verify_campaign_recovered', campaignRoot);
    assertion('verify_durable_platform_records', world.ok && campaign.ok, 'platform_records_not_recovered');

    let entry: Awaited<ReturnType<Client['request']>> | undefined;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      entry = await client.request(`verify_room_entry_attempt_${attempt + 1}`, pathFor('rooms', state.roomId, 'entry'), {}, [200, 404]);
      if (entry.status === 200) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assertion('verify_live_room_recovered', entry?.status === 200 && isRecord(entry.body) && entry.body.memberId === state.hostMemberId, 'live_room_not_recovered');

    const playerMe = await player.request('verify_player_existing_session', '/api/auth/me');
    assertion('verify_player_session_identity', playerMe.ok && objectValue(playerMe.body)?.authenticated === true && objectValue(playerMe.body)?.authMode === 'privateAlpha', 'player_session_not_recovered');
    const playerEntry = await player.request('verify_player_room_entry', pathFor('rooms', state.roomId, 'entry'));
    const playerRoom = isRecord(playerEntry.body) && isRecord(playerEntry.body.room) ? playerEntry.body.room : undefined;
    const playerLobby = isRecord(playerRoom?.lobby) ? playerRoom.lobby : undefined;
    const recoveredBinding = recordArray(playerLobby?.actorBindings).find((binding) => binding.bindingId === state.bindingId);
    const recoveredReady = recordArray(playerLobby?.readyStates).find((ready) => ready.memberId === state.playerMemberId);
    assertion(
      'verify_player_lobby_recovered',
      playerEntry.ok && isRecord(playerEntry.body) && playerEntry.body.memberId === state.playerMemberId && recoveredBinding?.status === 'approved' && recoveredReady?.status === 'ready',
      'player_lobby_not_recovered',
    );

    const unready = await player.request('verify_player_unready_after_restart', pathFor('rooms', state.roomId, 'members', state.playerMemberId, 'ready'), {
      method: 'POST',
      body: JSON.stringify({ ready: false }),
    });
    const reready = await player.request('verify_player_reready_after_restart', pathFor('rooms', state.roomId, 'members', state.playerMemberId, 'ready'), {
      method: 'POST',
      body: JSON.stringify({ ready: true }),
    });
    assertion('verify_player_admission_recovered', unready.ok && reready.ok, 'player_admission_not_recovered');

    const log = await client.request('verify_runtime_log_after_restart', `${pathFor('rooms', state.roomId, 'runtime-log')}?memberId=${encodeURIComponent(state.hostMemberId)}`);
    const logEvents = isRecord(log.body) ? recordArray(log.body.events) : [];
    const started = logEvents.find((event) => event.eventId === state.combatStartedId);
    const turn = logEvents.find((event) => event.eventId === state.combatTurnId);
    assertion(
      'verify_combat_runtime_log_recovered',
      log.ok && started?.kind === 'combat.started' && turn?.kind === 'combat.round_advanced' && isRecord(turn.payload) && turn.payload.roundNumber === 2,
      'combat_runtime_log_not_recovered',
    );

    let map: Awaited<ReturnType<Client['request']>> | undefined;
    let recoveredMapEvent: JsonRecord | undefined;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      map = await client.request(`verify_map_after_restart_attempt_${attempt + 1}`, `${pathFor('rooms', state.roomId, 'map-events')}?memberId=${encodeURIComponent(state.hostMemberId)}&mapId=${encodeURIComponent(state.mapId)}`);
      const mapEvents = isRecord(map.body) ? recordArray(map.body.events) : [];
      recoveredMapEvent = mapEvents.find((event) => event.mapEventId === state.mapEventId);
      if (recoveredMapEvent) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    const mapPayload = isRecord(recoveredMapEvent?.payload) ? recoveredMapEvent.payload : undefined;
    const recoveredGrid = isRecord(mapPayload?.grid) ? mapPayload.grid : undefined;
    assertion(
      'verify_map_restart_recovered',
      map?.ok === true && recoveredMapEvent?.eventKind === 'map.grid_updated' && recoveredGrid?.sizePx === 72,
      'room_map_not_recovered',
    );

    const movedToken = await player.request('verify_player_token_move_after_restart', pathFor('rooms', state.roomId, 'map-events'), {
      method: 'POST',
      body: JSON.stringify({ authorMemberId: state.playerMemberId, mapId: state.mapId, eventKind: 'map.token_moved', payload: { tokenId: state.characterTokenId, x: 61, y: 63 } }),
    });
    const movedEvent = isRecord(movedToken.body) && isRecord(movedToken.body.event) ? movedToken.body.event : undefined;
    assertion(
      'verify_player_token_authority_recovered',
      movedToken.ok && movedEvent?.eventKind === 'map.token_moved' && isRecord(movedEvent.payload) && movedEvent.payload.tokenId === state.characterTokenId && movedEvent.payload.x === 61 && movedEvent.payload.y === 63,
      'player_token_authority_not_recovered',
    );
  } finally {
    await client.request('cleanup_disband_room', pathFor('rooms', state.roomId, 'disband'), { method: 'POST', body: JSON.stringify({ decidedByMemberId: state.hostMemberId }) });
    await client.request('cleanup_archive_campaign', `${campaignRoot}/archive`, { method: 'POST' });
    await client.request('cleanup_archive_world_server', `${worldRoot}/archive`, { method: 'POST' });
    // Room lifecycle persistence is intentionally queued behind live updates.
    // Give the non-destructive close snapshot a bounded flush window before the
    // runner stops this test-owned backend process.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

let finalStatus: 'prepared' | 'passed' | 'failed' = phase === 'prepare' ? 'prepared' : 'passed';
try {
  if (phase === 'prepare') await prepare();
  else if (phase === 'verify') await verify();
  else throw new Error('phase_required');
} catch {
  steps.push({ name: `${phase ?? 'unknown'}_phase_completed`, status: 'failed', reason: 'restart_recovery_phase_failed' });
  finalStatus = 'failed';
}
report(finalStatus);
if (strict && steps.some((step) => step.status === 'failed')) process.exitCode = 1;
