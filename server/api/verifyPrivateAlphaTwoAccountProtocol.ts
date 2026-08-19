import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';

type JsonRecord = Record<string, unknown>;
type StepStatus = 'passed' | 'failed' | 'skipped';

type Step = {
  name: string;
  status: StepStatus;
  httpStatus?: number;
  reason?: string;
};

type ResponseResult = {
  body?: unknown;
  ok: boolean;
  setCookie?: string;
  status: number;
};

const baseUrl = (process.env.E2E_API_BASE_URL?.trim() || 'http://localhost:8787').replace(/\/+$/, '');
const bootstrapCode = process.env.E2E_PRIVATE_ALPHA_ACCESS_CODE?.trim();
const strict = process.argv.includes('--strict');
const steps: Step[] = [];

let worldRoot: string | undefined;
let campaignRoot: string | undefined;
let liveRoomId: string | undefined;
let hostMemberId: string | undefined;
let authenticatedHost: SessionClient | undefined;
const openSocketProbes: RoomSocketProbe[] = [];

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

function errorReason(body: unknown, status: number): string {
  if (isRecord(body) && body.ok === false && isRecord(body.error) && typeof body.error.kind === 'string') {
    return body.error.kind;
  }
  if (isRecord(body) && typeof body.error === 'string') return body.error;
  return `http_${status}`;
}

function pathFor(...parts: string[]): string {
  return `/${parts.map((part) => encodeURIComponent(part)).join('/')}`;
}

function cookiePair(value: string | null): string | undefined {
  const first = value?.split(';', 1)[0]?.trim();
  return first && first.includes('=') ? first : undefined;
}

function failLatest(reason: string): void {
  const latest = steps[steps.length - 1];
  if (!latest) return;
  latest.status = 'failed';
  latest.reason = reason;
}

function addAssertion(name: string, passed: boolean, reason: string): boolean {
  steps.push({ name, status: passed ? 'passed' : 'failed', reason: passed ? undefined : reason });
  return passed;
}

function recordArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function socketStreamContains(message: JsonRecord, type: 'runtimeLogAppended' | 'mapEventAppended', id: string): boolean {
  if (message.type !== type) return false;
  const idKey = type === 'runtimeLogAppended' ? 'eventId' : 'mapEventId';
  return recordArray(message.events).some((event) => event[idKey] === id);
}

function socketUrl(): string {
  return `${baseUrl.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:')}/ws`;
}

class RoomSocketProbe {
  private readonly messages: JsonRecord[] = [];
  private readonly waiters = new Set<{
    predicate: (message: JsonRecord) => boolean;
    resolve: (message: JsonRecord) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();

  private constructor(
    private readonly label: 'host' | 'player',
    private readonly socket: WebSocket,
  ) {
    socket.on('message', (data) => {
      let message: unknown;
      try {
        message = JSON.parse(String(data));
      } catch {
        return;
      }
      if (!isRecord(message)) return;
      this.messages.push(message);
      for (const waiter of [...this.waiters]) {
        if (!waiter.predicate(message)) continue;
        clearTimeout(waiter.timeout);
        this.waiters.delete(waiter);
        waiter.resolve(message);
      }
    });
  }

  static async open(label: 'host' | 'player', cookie: string): Promise<RoomSocketProbe> {
    const socket = new WebSocket(socketUrl(), { headers: { Cookie: cookie } });
    socket.on('error', () => undefined);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`${label}_socket_open_timeout`)), 5_000);
      socket.once('open', () => {
        clearTimeout(timeout);
        resolve();
      });
      socket.once('error', () => {
        clearTimeout(timeout);
        reject(new Error(`${label}_socket_open_failed`));
      });
    });
    const probe = new RoomSocketProbe(label, socket);
    openSocketProbes.push(probe);
    return probe;
  }

  subscribe(roomId: string, memberId: string, cursors?: { runtimeLog?: number; mapEvent?: number }): void {
    this.socket.send(JSON.stringify({
      protocolVersion: 'room-ws-v0',
      messageId: `alpha-smoke-${randomUUID()}`,
      sentAt: new Date().toISOString(),
      type: 'subscribeRoom',
      roomId,
      memberId,
      ...(cursors?.runtimeLog !== undefined ? { afterRuntimeLogSeq: cursors.runtimeLog } : {}),
      ...(cursors?.mapEvent !== undefined ? { afterMapEventSeq: cursors.mapEvent } : {}),
    }));
  }

  async waitFor(name: string, predicate: (message: JsonRecord) => boolean): Promise<JsonRecord> {
    const existing = this.messages.find(predicate);
    if (existing) return existing;
    return new Promise<JsonRecord>((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.waiters.delete(waiter);
          reject(new Error(`${this.label}_${name}_timeout`));
        }, 5_000),
      };
      this.waiters.add(waiter);
    });
  }

  async expectAbsent(name: string, predicate: (message: JsonRecord) => boolean, durationMs = 500): Promise<void> {
    if (this.messages.some(predicate)) throw new Error(`${this.label}_${name}_unexpected_message`);
    await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
    if (this.messages.some(predicate)) throw new Error(`${this.label}_${name}_unexpected_message`);
  }

  async disconnect(): Promise<void> {
    if (this.socket.readyState === WebSocket.CLOSED) return;
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2_000);
      this.socket.once('close', () => {
        clearTimeout(timeout);
        resolve();
      });
      try {
        this.socket.close();
      } catch {
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  close(): void {
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error(`${this.label}_socket_closed`));
    }
    this.waiters.clear();
    try {
      this.socket.close();
    } catch {
      // Best-effort test transport cleanup.
    }
  }
}

class SessionClient {
  private cookie?: string;

  constructor(private readonly label: 'host' | 'player' | 'anonymous') {}

  async request(
    name: string,
    path: string,
    init: RequestInit = {},
    expectedStatuses?: readonly number[],
  ): Promise<ResponseResult> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    if (this.cookie) headers.set('Cookie', this.cookie);

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    } catch {
      steps.push({ name: `${this.label}_${name}`, status: 'failed', reason: 'server_unavailable' });
      return { ok: false, status: 0 };
    }

    let body: unknown;
    try {
      const text = await response.text();
      body = text.trim() ? JSON.parse(text) : undefined;
    } catch {
      steps.push({ name: `${this.label}_${name}`, status: 'failed', httpStatus: response.status, reason: 'non_json_response' });
      return { ok: false, status: response.status };
    }

    const expected = expectedStatuses
      ? expectedStatuses.includes(response.status)
      : response.ok && (!isRecord(body) || body.ok !== false);
    steps.push({
      name: `${this.label}_${name}`,
      status: expected ? 'passed' : 'failed',
      httpStatus: response.status,
      reason: expected ? undefined : errorReason(body, response.status),
    });
    return { body, ok: expected, setCookie: response.headers.get('set-cookie') ?? undefined, status: response.status };
  }

  async login(displayName: string, accessCode: string): Promise<string | undefined> {
    const result = await this.request('private_alpha_login', '/api/auth/private-alpha/login', {
      method: 'POST',
      body: JSON.stringify({ displayName, accessCode }),
    });
    if (!result.ok) return undefined;

    this.cookie = cookiePair(result.setCookie ?? null);
    if (!this.cookie) {
      failLatest('private_alpha_session_cookie_missing');
      return undefined;
    }

    const me = await this.request('auth_me', '/api/auth/me');
    const value = objectValue(me.body);
    const user = isRecord(value?.user) ? value.user : undefined;
    const userId = typeof user?.userId === 'string' ? user.userId : undefined;
    if (!me.ok || value?.authenticated !== true || value?.authMode !== 'privateAlpha' || !userId) {
      failLatest('verified_private_alpha_identity_expected');
      return undefined;
    }
    return userId;
  }

  async openRoomSocket(label: 'host' | 'player'): Promise<RoomSocketProbe> {
    if (!this.cookie) throw new Error(`${label}_session_cookie_missing`);
    return RoomSocketProbe.open(label, this.cookie);
  }
}

function report(status: string): void {
  const failed = steps.filter((step) => step.status === 'failed');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    status: failed.length === 0 ? status : 'failed',
    target: /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(baseUrl) ? 'local' : 'configured',
    authMode: 'private_alpha_two_session',
    strict,
    steps,
    evidence: {
      isolatedUsers: steps.some((step) => step.name === 'two_distinct_user_ids' && step.status === 'passed'),
      personalInviteRedeemed: steps.some((step) => step.name === 'player_world_membership_visible' && step.status === 'passed'),
      roomAdmissionCompleted: steps.some((step) => step.name === 'player_ready_state_visible' && step.status === 'passed'),
      hostAuthorityEnforced: steps.some((step) => step.name === 'host_authority_boundary_confirmed' && step.status === 'passed'),
      webSocketConverged: steps.some((step) => step.name === 'two_account_websocket_ready_converged' && step.status === 'passed'),
      runtimeLogProjected: steps.some((step) => step.name === 'two_account_runtime_log_projection_confirmed' && step.status === 'passed'),
      mapAuthorityProjected: steps.some((step) => step.name === 'two_account_map_authority_projection_confirmed' && step.status === 'passed'),
      combatTurnConverged: steps.some((step) => step.name === 'two_account_combat_turn_converged' && step.status === 'passed'),
      reconnectCatchUpVerified: steps.some((step) => step.name === 'player_socket_missing_suffix_recovered' && step.status === 'passed'),
    },
    notes: [
      'Host and Player use separate in-memory cookie jars and distinct verified user ids.',
      'The smoke prints no response body, cookie, invite code, session token, database URL, or stack trace.',
      'Temporary campaign and World Server fixtures are archived; the live room is closed non-destructively.',
      'Browser rendering, pointer interaction, browser refresh, combat UX, and process restart remain manual acceptance boundaries.',
    ],
  }, null, 2));
}

async function main(): Promise<void> {
  if (!bootstrapCode) {
    steps.push({ name: 'private_alpha_bootstrap_code', status: 'failed', reason: 'missing_e2e_private_alpha_access_code' });
    if (strict) process.exitCode = 1;
    return;
  }

  const suffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const anonymous = new SessionClient('anonymous');
  const host = new SessionClient('host');
  const player = new SessionClient('player');

  const health = await anonymous.request('health', '/health');
  if (!health.ok || !isRecord(health.body) || health.body.authMode !== 'privateAlpha') {
    failLatest('private_alpha_backend_expected');
    if (strict) process.exitCode = 1;
    return;
  }

  const anonymousMe = await anonymous.request('auth_me', '/api/auth/me');
  if (!anonymousMe.ok || objectValue(anonymousMe.body)?.authenticated !== false) {
    failLatest('unauthenticated_login_gate_expected');
    if (strict) process.exitCode = 1;
    return;
  }

  const hostUserId = await host.login(`Alpha Host ${suffix}`, bootstrapCode);
  if (!hostUserId) throw new Error('host_login_failed');
  authenticatedHost = host;

  const createdWorld = await host.request('create_world_server', '/api/world-servers', {
    method: 'POST',
    body: JSON.stringify({
      displayName: `Alpha Protocol World ${suffix}`,
      serverHandle: `alpha-protocol-${suffix}`,
      description: 'Temporary two-account protocol verification fixture.',
      serverVisibility: 'private',
      joinPolicy: 'inviteOnly',
      defaultGameSystemId: 'dnd5e-2024',
    }),
  });
  const world = objectValue(createdWorld.body);
  const worldId = typeof world?.worldServerId === 'string' ? world.worldServerId : undefined;
  if (!createdWorld.ok || !worldId) throw new Error('world_create_failed');
  worldRoot = pathFor('api', 'world-servers', worldId);

  const createdInvite = await host.request('create_personal_invite', `${worldRoot}/invites`, {
    method: 'POST',
    body: JSON.stringify({ maxUses: 1, defaultRoleKey: 'member' }),
  });
  const invite = objectValue(createdInvite.body);
  const personalInviteCode = typeof invite?.inviteCode === 'string' ? invite.inviteCode : undefined;
  if (!createdInvite.ok || !personalInviteCode) throw new Error('personal_invite_create_failed');

  const playerUserId = await player.login(`Alpha Player ${suffix}`, personalInviteCode);
  if (!playerUserId) throw new Error('player_login_failed');
  if (!addAssertion('two_distinct_user_ids', hostUserId !== playerUserId, 'host_and_player_identity_collapsed')) {
    throw new Error('identity_isolation_failed');
  }

  const playerWorlds = await player.request('list_joined_world_servers', '/api/world-servers?limit=50');
  const joinedWorlds = envelopeValue(playerWorlds.body);
  if (!addAssertion(
    'player_world_membership_visible',
    playerWorlds.ok && Array.isArray(joinedWorlds) && joinedWorlds.some((item) => isRecord(item) && item.worldServerId === worldId),
    'redeemed_invite_membership_missing',
  )) throw new Error('world_membership_missing');

  const createdCampaign = await host.request('create_campaign', `${worldRoot}/campaigns`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Alpha Protocol Campaign ${suffix}`,
      description: 'Temporary two-account protocol verification fixture.',
      systemId: 'dnd5e-2024',
      status: 'active',
    }),
  });
  const campaignEnvelope = objectValue(createdCampaign.body);
  const campaign = isRecord(campaignEnvelope?.campaign) ? campaignEnvelope.campaign : campaignEnvelope;
  const campaignId = typeof campaign?.campaignId === 'string' ? campaign.campaignId : undefined;
  if (!createdCampaign.ok || !campaignId) throw new Error('campaign_create_failed');
  campaignRoot = `${worldRoot}/campaigns/${encodeURIComponent(campaignId)}`;

  const createdRoom = await host.request('create_live_room', '/rooms/create', {
    method: 'POST',
    body: JSON.stringify({
      hostDisplayName: `Alpha Host ${suffix}`,
      displayName: `Alpha Protocol Room ${suffix}`,
      systemId: 'dnd5e-2024',
      campaignRef: {
        source: 'localCampaignLibrary',
        worldServerId: worldId,
        campaignId,
        displayName: `Alpha Protocol Campaign ${suffix}`,
        systemId: 'dnd5e-2024',
      },
    }),
  });
  const roomEnvelope = isRecord(createdRoom.body) ? createdRoom.body : undefined;
  const room = isRecord(roomEnvelope?.room) ? roomEnvelope.room : undefined;
  const identity = isRecord(room?.identity) ? room.identity : undefined;
  const members = Array.isArray(room?.members) ? room.members : [];
  const hostMember = members.find((item) => isRecord(item) && item.role === 'host');
  liveRoomId = typeof identity?.roomId === 'string' ? identity.roomId : undefined;
  const roomCode = typeof identity?.roomCode === 'string' ? identity.roomCode : undefined;
  hostMemberId = isRecord(hostMember) && typeof hostMember.memberId === 'string' ? hostMember.memberId : undefined;
  if (!createdRoom.ok || !liveRoomId || !roomCode || !hostMemberId) throw new Error('live_room_create_failed');

  const joined = await player.request('join_live_room', '/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCodeOrRoomCode: roomCode, requestedDisplayName: `Alpha Player ${suffix}`, requestedRole: 'player' }),
  });
  const joinResult = isRecord(joined.body) ? joined.body : undefined;
  const playerMemberId = typeof joinResult?.memberId === 'string' ? joinResult.memberId : undefined;
  if (!joined.ok || joinResult?.decision !== 'pendingHostApproval' || !playerMemberId) {
    failLatest('pending_player_membership_expected');
    throw new Error('room_join_failed');
  }

  await player.request('pending_room_snapshot_rejected', `${pathFor('rooms', liveRoomId)}?memberId=${encodeURIComponent(playerMemberId)}`, {}, [403]);
  const pendingStatus = await player.request('pending_join_status', `${pathFor('rooms', liveRoomId, 'join-status')}?memberId=${encodeURIComponent(playerMemberId)}`);
  if (!pendingStatus.ok || !isRecord(pendingStatus.body) || pendingStatus.body.memberStatus !== 'pendingApproval') {
    failLatest('pending_join_status_expected');
    throw new Error('pending_status_failed');
  }

  const pendingSocket = await player.openRoomSocket('player');
  pendingSocket.subscribe(liveRoomId, playerMemberId);
  const pendingSocketError = await pendingSocket.waitFor(
    'pending_subscription_rejection',
    (message) => message.type === 'error' && message.code === 'notAuthorized' && message.roomId === liveRoomId,
  );
  if (!addAssertion(
    'pending_player_websocket_rejected',
    pendingSocketError.code === 'notAuthorized',
    'pending_player_received_room_socket_subscription',
  )) throw new Error('pending_socket_authority_failed');
  pendingSocket.close();

  const forbiddenHostAction = await player.request('host_action_rejected', pathFor('rooms', liveRoomId, 'disband'), {
    method: 'POST',
    body: JSON.stringify({ decidedByMemberId: hostMemberId }),
  }, [403]);
  if (!addAssertion('host_authority_boundary_confirmed', forbiddenHostAction.ok, 'player_was_able_to_use_host_authority')) {
    throw new Error('host_authority_failed');
  }

  await host.request('approve_player_member', pathFor('rooms', liveRoomId, 'members', playerMemberId, 'approve'), {
    method: 'POST',
    body: JSON.stringify({ decidedByMemberId: hostMemberId }),
  });

  const activeStatus = await player.request('active_join_status', `${pathFor('rooms', liveRoomId, 'join-status')}?memberId=${encodeURIComponent(playerMemberId)}`);
  if (!activeStatus.ok || !isRecord(activeStatus.body) || activeStatus.body.memberStatus !== 'active') {
    failLatest('active_join_status_expected');
    throw new Error('member_approval_failed');
  }

  const hostSocket = await host.openRoomSocket('host');
  const playerSocket = await player.openRoomSocket('player');
  hostSocket.subscribe(liveRoomId, hostMemberId);
  playerSocket.subscribe(liveRoomId, playerMemberId);
  await Promise.all([
    hostSocket.waitFor('initial_subscription', (message) => message.type === 'roomSnapshot' && message.roomId === liveRoomId && message.reason === 'initialSubscribe'),
    playerSocket.waitFor('initial_subscription', (message) => message.type === 'roomSnapshot' && message.roomId === liveRoomId && message.reason === 'initialSubscribe'),
  ]);
  addAssertion('two_account_websocket_subscribed', true, 'two_account_websocket_subscription_failed');

  const playerEntry = await player.request('room_entry_by_verified_identity', pathFor('rooms', liveRoomId, 'entry'));
  if (!playerEntry.ok || !isRecord(playerEntry.body) || playerEntry.body.memberId !== playerMemberId || playerEntry.body.role !== 'player') {
    failLatest('player_room_entry_expected');
    throw new Error('room_entry_failed');
  }
  await player.request('cross_member_snapshot_rejected', `${pathFor('rooms', liveRoomId)}?memberId=${encodeURIComponent(hostMemberId)}`, {}, [403]);

  const submitted = await player.request('submit_quick_draft_actor', pathFor('rooms', liveRoomId, 'actor-bindings', 'submit'), {
    method: 'POST',
    body: JSON.stringify({
      memberId: playerMemberId,
      actorRef: {
        systemId: 'dnd5e-2024',
        displayName: `Alpha Hero ${suffix}`,
        source: 'quickDraft',
        summary: 'Protocol smoke quick draft.',
      },
    }),
  });
  const submitResult = isRecord(submitted.body) ? submitted.body : undefined;
  const bindingId = typeof submitResult?.bindingId === 'string' ? submitResult.bindingId : undefined;
  if (!submitted.ok || submitResult?.decision !== 'submitted' || !bindingId) throw new Error('actor_submit_failed');
  await Promise.all([
    hostSocket.waitFor('actor_submission_broadcast', (message) => message.type === 'roomSnapshot' && message.reason === 'actorBindingSubmitted'),
    playerSocket.waitFor('actor_submission_broadcast', (message) => message.type === 'roomSnapshot' && message.reason === 'actorBindingSubmitted'),
  ]);

  await player.request('ready_before_actor_approval_rejected', pathFor('rooms', liveRoomId, 'members', playerMemberId, 'ready'), {
    method: 'POST',
    body: JSON.stringify({ ready: true }),
  }, [400]);

  await host.request('approve_actor_binding', pathFor('rooms', liveRoomId, 'actor-bindings', bindingId, 'approve'), {
    method: 'POST',
    body: JSON.stringify({ reviewerMemberId: hostMemberId }),
  });
  await Promise.all([
    hostSocket.waitFor('actor_approval_broadcast', (message) => message.type === 'roomSnapshot' && message.reason === 'actorBindingApproved'),
    playerSocket.waitFor('actor_approval_broadcast', (message) => message.type === 'roomSnapshot' && message.reason === 'actorBindingApproved'),
  ]);
  await player.request('set_player_ready', pathFor('rooms', liveRoomId, 'members', playerMemberId, 'ready'), {
    method: 'POST',
    body: JSON.stringify({ ready: true }),
  });
  const [hostReadyMessage, playerReadyMessage] = await Promise.all([
    hostSocket.waitFor('ready_broadcast', (message) => message.type === 'roomSnapshot' && message.reason === 'memberReadyChanged'),
    playerSocket.waitFor('ready_broadcast', (message) => message.type === 'roomSnapshot' && message.reason === 'memberReadyChanged'),
  ]);
  const hostReadyPayload = isRecord(hostReadyMessage.payload) && isRecord(hostReadyMessage.payload.room)
    ? hostReadyMessage.payload.room
    : undefined;
  const playerReadyPayload = isRecord(playerReadyMessage.payload) && isRecord(playerReadyMessage.payload.room)
    ? playerReadyMessage.payload.room
    : undefined;
  const socketHasReady = (roomSnapshot: JsonRecord | undefined): boolean => {
    const socketLobby = isRecord(roomSnapshot?.lobby) ? roomSnapshot.lobby : undefined;
    return Array.isArray(socketLobby?.readyStates)
      && socketLobby.readyStates.some((item) => isRecord(item) && item.memberId === playerMemberId && item.status === 'ready');
  };
  if (!addAssertion(
    'two_account_websocket_ready_converged',
    socketHasReady(hostReadyPayload) && socketHasReady(playerReadyPayload),
    'host_and_player_socket_state_did_not_converge',
  )) throw new Error('websocket_convergence_failed');

  await player.request('host_only_runtime_log_rejected', pathFor('rooms', liveRoomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: playerMemberId,
      kind: 'host.note',
      visibility: 'hostOnly',
      text: 'Player must not create this private note.',
    }),
  }, [400]);

  const publicChat = await player.request('append_public_runtime_log', pathFor('rooms', liveRoomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: playerMemberId,
      actorBindingId: bindingId,
      kind: 'chat.message',
      visibility: 'public',
      text: `Alpha public message ${suffix}`,
    }),
  });
  const publicChatBody = isRecord(publicChat.body) && isRecord(publicChat.body.event) ? publicChat.body.event : undefined;
  const publicChatId = typeof publicChatBody?.eventId === 'string' ? publicChatBody.eventId : undefined;
  if (!publicChat.ok || !publicChatId) throw new Error('public_runtime_log_append_failed');
  await Promise.all([
    hostSocket.waitFor('public_runtime_log_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', publicChatId)),
    playerSocket.waitFor('public_runtime_log_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', publicChatId)),
  ]);

  const hostPrivateNote = await host.request('append_host_only_runtime_log', pathFor('rooms', liveRoomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      kind: 'host.note',
      visibility: 'hostOnly',
      text: `Alpha private host note ${suffix}`,
      payload: { noteKind: 'alphaProtocolPrivate' },
    }),
  });
  const hostPrivateBody = isRecord(hostPrivateNote.body) && isRecord(hostPrivateNote.body.event) ? hostPrivateNote.body.event : undefined;
  const hostPrivateId = typeof hostPrivateBody?.eventId === 'string' ? hostPrivateBody.eventId : undefined;
  if (!hostPrivateNote.ok || !hostPrivateId) throw new Error('host_private_runtime_log_append_failed');
  await hostSocket.waitFor('host_private_runtime_log_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', hostPrivateId));
  await playerSocket.expectAbsent('host_private_runtime_log', (message) => socketStreamContains(message, 'runtimeLogAppended', hostPrivateId));

  const playerLogList = await player.request('list_projected_runtime_log', `${pathFor('rooms', liveRoomId, 'runtime-log')}?memberId=${encodeURIComponent(playerMemberId)}`);
  const hostLogList = await host.request('list_host_runtime_log', `${pathFor('rooms', liveRoomId, 'runtime-log')}?memberId=${encodeURIComponent(hostMemberId)}`);
  const playerLogEvents = isRecord(playerLogList.body) ? recordArray(playerLogList.body.events) : [];
  const hostLogEvents = isRecord(hostLogList.body) ? recordArray(hostLogList.body.events) : [];
  if (!addAssertion(
    'two_account_runtime_log_projection_confirmed',
    playerLogList.ok
      && hostLogList.ok
      && playerLogEvents.some((event) => event.eventId === publicChatId)
      && !playerLogEvents.some((event) => event.eventId === hostPrivateId)
      && hostLogEvents.some((event) => event.eventId === publicChatId)
      && hostLogEvents.some((event) => event.eventId === hostPrivateId),
    'runtime_log_visibility_projection_failed',
  )) throw new Error('runtime_log_projection_failed');

  const mapId = `alpha-map-${suffix}`;
  const manualTokenId = `alpha-npc-${suffix}`;
  const hiddenTokenId = `alpha-hidden-${suffix}`;
  const characterTokenId = `alpha-character-${suffix}`;
  await player.request('host_map_write_rejected', pathFor('rooms', liveRoomId, 'map-events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: playerMemberId,
      mapId,
      eventKind: 'map.background_set',
      payload: { backgroundPreset: 'stone_floor', clearCustomBackground: true },
    }),
  }, [403]);

  const manualToken = await host.request('place_standalone_npc_token', pathFor('rooms', liveRoomId, 'map-events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      mapId,
      eventKind: 'map.token_added',
      payload: {
        token: {
          id: manualTokenId,
          name: `Standalone NPC ${suffix}`,
          x: 24,
          y: 36,
          size: 'medium',
          sourceType: 'manual',
          kind: 'npc',
          notes: 'Host-only NPC tactics.',
          hpSummary: { current: 18, max: 18 },
        },
      },
    }),
  });
  const manualTokenEvent = isRecord(manualToken.body) && isRecord(manualToken.body.event) ? manualToken.body.event : undefined;
  const manualTokenEventId = typeof manualTokenEvent?.mapEventId === 'string' ? manualTokenEvent.mapEventId : undefined;
  if (!manualToken.ok || !manualTokenEventId) throw new Error('standalone_npc_token_failed');
  const [hostManualMessage, playerManualMessage] = await Promise.all([
    hostSocket.waitFor('standalone_npc_broadcast', (message) => socketStreamContains(message, 'mapEventAppended', manualTokenEventId)),
    playerSocket.waitFor('standalone_npc_broadcast', (message) => socketStreamContains(message, 'mapEventAppended', manualTokenEventId)),
  ]);
  const tokenFromMapMessage = (message: JsonRecord, eventId: string): JsonRecord | undefined => {
    const event = recordArray(message.events).find((candidate) => candidate.mapEventId === eventId);
    return isRecord(event?.payload) && isRecord(event.payload.token) ? event.payload.token : undefined;
  };
  const hostManualProjection = tokenFromMapMessage(hostManualMessage, manualTokenEventId);
  const playerManualProjection = tokenFromMapMessage(playerManualMessage, manualTokenEventId);
  if (!addAssertion(
    'standalone_npc_token_projected',
    hostManualProjection?.notes === 'Host-only NPC tactics.'
      && playerManualProjection?.id === manualTokenId
      && playerManualProjection.notes === undefined
      && playerManualProjection.hpSummary === undefined,
    'standalone_npc_projection_failed',
  )) throw new Error('standalone_npc_projection_failed');

  const hiddenToken = await host.request('place_hidden_host_token', pathFor('rooms', liveRoomId, 'map-events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      mapId,
      eventKind: 'map.token_added',
      payload: {
        token: {
          id: hiddenTokenId,
          name: `Hidden Threat ${suffix}`,
          x: 70,
          y: 70,
          size: 'medium',
          sourceType: 'manual',
          kind: 'monster',
          isHidden: true,
          notes: 'Never disclose.',
        },
      },
    }),
  });
  const hiddenTokenEvent = isRecord(hiddenToken.body) && isRecord(hiddenToken.body.event) ? hiddenToken.body.event : undefined;
  const hiddenTokenEventId = typeof hiddenTokenEvent?.mapEventId === 'string' ? hiddenTokenEvent.mapEventId : undefined;
  if (!hiddenToken.ok || !hiddenTokenEventId) throw new Error('hidden_token_append_failed');
  await hostSocket.waitFor('hidden_token_host_broadcast', (message) => socketStreamContains(message, 'mapEventAppended', hiddenTokenEventId));
  await playerSocket.expectAbsent('hidden_token_map_event', (message) => socketStreamContains(message, 'mapEventAppended', hiddenTokenEventId));

  const characterToken = await host.request('place_approved_character_token', pathFor('rooms', liveRoomId, 'map-events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      mapId,
      eventKind: 'map.token_added',
      payload: {
        token: {
          id: characterTokenId,
          name: `Alpha Hero ${suffix}`,
          x: 40,
          y: 45,
          size: 'medium',
          sourceType: 'quickDraft',
          sourceId: bindingId,
          actorBindingId: bindingId,
          roomMemberId: playerMemberId,
          kind: 'playerCharacter',
        },
      },
    }),
  });
  const characterTokenEvent = isRecord(characterToken.body) && isRecord(characterToken.body.event) ? characterToken.body.event : undefined;
  const characterTokenEventId = typeof characterTokenEvent?.mapEventId === 'string' ? characterTokenEvent.mapEventId : undefined;
  if (!characterToken.ok || !characterTokenEventId) throw new Error('character_token_append_failed');
  await Promise.all([
    hostSocket.waitFor('character_token_broadcast', (message) => socketStreamContains(message, 'mapEventAppended', characterTokenEventId)),
    playerSocket.waitFor('character_token_broadcast', (message) => socketStreamContains(message, 'mapEventAppended', characterTokenEventId)),
  ]);

  const movePath = pathFor('rooms', liveRoomId, 'map-events');
  await player.request('own_token_move_before_grant_rejected', movePath, {
    method: 'POST',
    body: JSON.stringify({ authorMemberId: playerMemberId, mapId, eventKind: 'map.token_moved', payload: { tokenId: characterTokenId, x: 52, y: 54 } }),
  }, [403]);
  await host.request('grant_own_token_movement', pathFor('rooms', liveRoomId, 'map-permissions', playerMemberId), {
    method: 'POST',
    body: JSON.stringify({ authorizedByMemberId: hostMemberId, canManageTokens: true }),
  });
  const movedToken = await player.request('move_own_approved_token', movePath, {
    method: 'POST',
    body: JSON.stringify({ authorMemberId: playerMemberId, mapId, eventKind: 'map.token_moved', payload: { tokenId: characterTokenId, x: 52, y: 54 } }),
  });
  const movedTokenEvent = isRecord(movedToken.body) && isRecord(movedToken.body.event) ? movedToken.body.event : undefined;
  const movedTokenEventId = typeof movedTokenEvent?.mapEventId === 'string' ? movedTokenEvent.mapEventId : undefined;
  if (!movedToken.ok || !movedTokenEventId) throw new Error('own_token_move_failed');
  await Promise.all([
    hostSocket.waitFor('own_token_move_broadcast', (message) => socketStreamContains(message, 'mapEventAppended', movedTokenEventId)),
    playerSocket.waitFor('own_token_move_broadcast', (message) => socketStreamContains(message, 'mapEventAppended', movedTokenEventId)),
  ]);
  await player.request('manual_token_move_rejected', movePath, {
    method: 'POST',
    body: JSON.stringify({ authorMemberId: playerMemberId, mapId, eventKind: 'map.token_moved', payload: { tokenId: manualTokenId, x: 60, y: 60 } }),
  }, [403]);

  const playerMapList = await player.request('list_projected_map_events', `${pathFor('rooms', liveRoomId, 'map-events')}?memberId=${encodeURIComponent(playerMemberId)}&mapId=${encodeURIComponent(mapId)}`);
  const hostMapList = await host.request('list_host_map_events', `${pathFor('rooms', liveRoomId, 'map-events')}?memberId=${encodeURIComponent(hostMemberId)}&mapId=${encodeURIComponent(mapId)}`);
  const playerMapEvents = isRecord(playerMapList.body) ? recordArray(playerMapList.body.events) : [];
  const hostMapEvents = isRecord(hostMapList.body) ? recordArray(hostMapList.body.events) : [];
  const movedProjection = playerMapEvents.find((event) => event.mapEventId === movedTokenEventId);
  if (!addAssertion(
    'two_account_map_authority_projection_confirmed',
    playerMapList.ok
      && hostMapList.ok
      && playerMapEvents.some((event) => event.mapEventId === manualTokenEventId)
      && !playerMapEvents.some((event) => event.mapEventId === hiddenTokenEventId)
      && playerMapEvents.some((event) => event.mapEventId === characterTokenEventId)
      && isRecord(movedProjection?.payload)
      && movedProjection.payload.x === 52
      && movedProjection.payload.y === 54
      && hostMapEvents.some((event) => event.mapEventId === hiddenTokenEventId),
    'map_authority_or_visibility_projection_failed',
  )) throw new Error('map_projection_failed');

  const heroCombatantId = `combat-hero-${suffix}`;
  const npcCombatantId = `combat-npc-${suffix}`;
  await player.request('combat_start_rejected', pathFor('rooms', liveRoomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: playerMemberId,
      kind: 'combat.started',
      visibility: 'public',
      text: 'Player must not start combat.',
      payload: { combatants: [], roundNumber: 1, turnIndex: 0 },
    }),
  }, [400]);

  const combatStarted = await host.request('start_combat', pathFor('rooms', liveRoomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      kind: 'combat.started',
      visibility: 'public',
      text: 'Combat started.',
      payload: {
        roundNumber: 1,
        turnIndex: 0,
        activeCombatantId: npcCombatantId,
        combatants: [
          {
            id: npcCombatantId,
            displayName: `Standalone NPC ${suffix}`,
            name: `Standalone NPC ${suffix}`,
            kind: 'npc',
            sourceType: 'manual_npc',
            mapTokenId: manualTokenId,
            initiative: 18,
            initiativeModifier: 2,
            hpCurrent: 18,
            hpMax: 18,
            armorClass: 13,
            conditions: [],
            isDefeated: false,
            status: 'active',
          },
          {
            id: heroCombatantId,
            displayName: `Alpha Hero ${suffix}`,
            name: `Alpha Hero ${suffix}`,
            kind: 'character',
            sourceType: 'manual_pc',
            mapTokenId: characterTokenId,
            initiative: 14,
            initiativeModifier: 3,
            hpCurrent: 20,
            hpMax: 20,
            armorClass: 16,
            conditions: [],
            isDefeated: false,
            status: 'active',
          },
        ],
      },
    }),
  });
  const combatStartedEvent = isRecord(combatStarted.body) && isRecord(combatStarted.body.event) ? combatStarted.body.event : undefined;
  const combatStartedId = typeof combatStartedEvent?.eventId === 'string' ? combatStartedEvent.eventId : undefined;
  if (!combatStarted.ok || !combatStartedId) throw new Error('combat_start_failed');
  await Promise.all([
    hostSocket.waitFor('combat_started_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', combatStartedId)),
    playerSocket.waitFor('combat_started_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', combatStartedId)),
  ]);

  const turnAdvanced = await host.request('advance_combat_to_player', pathFor('rooms', liveRoomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      kind: 'combat.turn_advanced',
      visibility: 'public',
      text: 'Player turn.',
      payload: { direction: 'next', roundNumber: 1, turnIndex: 1, activeCombatantId: heroCombatantId },
    }),
  });
  const turnAdvancedEvent = isRecord(turnAdvanced.body) && isRecord(turnAdvanced.body.event) ? turnAdvanced.body.event : undefined;
  const turnAdvancedId = typeof turnAdvancedEvent?.eventId === 'string' ? turnAdvancedEvent.eventId : undefined;
  if (!turnAdvanced.ok || !turnAdvancedId) throw new Error('combat_turn_advance_failed');
  const [hostTurnMessage, playerTurnMessage] = await Promise.all([
    hostSocket.waitFor('combat_turn_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', turnAdvancedId)),
    playerSocket.waitFor('combat_turn_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', turnAdvancedId)),
  ]);
  const runtimeEventFromMessage = (message: JsonRecord, eventId: string): JsonRecord | undefined =>
    recordArray(message.events).find((event) => event.eventId === eventId);
  const hostTurnEvent = runtimeEventFromMessage(hostTurnMessage, turnAdvancedId);
  const playerTurnEvent = runtimeEventFromMessage(playerTurnMessage, turnAdvancedId);
  if (!addAssertion(
    'two_account_combat_turn_converged',
    isRecord(hostTurnEvent?.payload)
      && isRecord(playerTurnEvent?.payload)
      && hostTurnEvent.payload.activeCombatantId === heroCombatantId
      && playerTurnEvent.payload.activeCombatantId === heroCombatantId
      && playerTurnEvent.payload.roundNumber === 1
      && playerTurnEvent.payload.turnIndex === 1,
    'combat_turn_projection_did_not_converge',
  )) throw new Error('combat_turn_projection_failed');

  const playerDice = await player.request('roll_on_player_turn', pathFor('rooms', liveRoomId, 'runtime', 'dice-roll'), {
    method: 'POST',
    body: JSON.stringify({ memberId: playerMemberId, expression: '1d20+5', label: 'Alpha turn check' }),
  });
  const playerDiceEvent = isRecord(playerDice.body) && isRecord(playerDice.body.event) ? playerDice.body.event : undefined;
  const playerDiceId = typeof playerDiceEvent?.eventId === 'string' ? playerDiceEvent.eventId : undefined;
  if (!playerDice.ok || !playerDiceId || playerDiceEvent?.kind !== 'dice.roll') throw new Error('player_turn_dice_failed');
  await Promise.all([
    hostSocket.waitFor('player_dice_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', playerDiceId)),
    playerSocket.waitFor('player_dice_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', playerDiceId)),
  ]);

  // ── T1: semantic d20 check (advantage + DC), and request-fabrication guard ──
  // The body deliberately carries resolved-looking fields. The request is INTENT
  // only: the server must ignore them and compute the faces, kept die, total and
  // DC outcome itself from its crypto RNG.
  const advantageDice = await player.request('roll_advantage_with_dc', pathFor('rooms', liveRoomId, 'runtime', 'dice-roll'), {
    method: 'POST',
    body: JSON.stringify({
      memberId: playerMemberId,
      expression: '1d20+3',
      label: 'Alpha advantage check',
      mode: 'advantage',
      dc: 12,
      // Fabricated resolved fields — must all be ignored.
      rawRolls: [20, 20],
      keptRoll: 20,
      total: 999,
      outcome: 'success',
      isNatural20: true,
      isNatural1: true,
      terms: [{ count: 1, sides: 20, rolls: [20], subtotal: 20 }],
      modifier: 900,
    }),
  });
  const advantageRoll = isRecord(advantageDice.body) && isRecord(advantageDice.body.roll) ? advantageDice.body.roll : undefined;
  const advantageEvent = isRecord(advantageDice.body) && isRecord(advantageDice.body.event) ? advantageDice.body.event : undefined;
  const advantageEventId = typeof advantageEvent?.eventId === 'string' ? advantageEvent.eventId : undefined;
  if (!advantageDice.ok || !advantageRoll || !advantageEventId) throw new Error('advantage_dice_failed');

  const advantageFaces = Array.isArray(advantageRoll.rawRolls)
    ? (advantageRoll.rawRolls as unknown[]).filter((face): face is number => typeof face === 'number')
    : [];
  const advantageKept = typeof advantageRoll.keptRoll === 'number' ? advantageRoll.keptRoll : undefined;
  const advantageTotal = typeof advantageRoll.total === 'number' ? advantageRoll.total : undefined;
  const advantageTerms = recordArray(advantageRoll.terms);

  if (!addAssertion(
    'two_account_advantage_roll_is_server_resolved',
    advantageRoll.mode === 'advantage'
      && advantageFaces.length === 2
      && advantageKept === Math.max(...advantageFaces)
      && advantageRoll.modifier === 3
      && advantageTotal === (advantageKept as number) + 3
      && advantageRoll.normalizedExpression === '1d20+3'
      && advantageRoll.dc === 12
      && advantageRoll.outcome === ((advantageTotal as number) >= 12 ? 'success' : 'failure')
      && advantageRoll.isNatural20 === (advantageKept === 20)
      && advantageRoll.isNatural1 === (advantageKept === 1),
    'advantage_roll_not_server_resolved',
  )) throw new Error('advantage_dice_semantics_failed');

  if (!addAssertion(
    'two_account_dice_request_fabrication_ignored',
    advantageTotal !== 999
      && advantageRoll.modifier !== 900
      && advantageTerms.length === 1
      && Array.isArray(advantageTerms[0]?.rolls)
      && (advantageTerms[0].rolls as unknown[]).length === 1
      && (advantageTerms[0].rolls as unknown[])[0] === advantageKept
      && advantageTotal === advantageTerms.reduce(
        (sum, term) => sum + (typeof term.subtotal === 'number' ? term.subtotal : 0),
        typeof advantageRoll.modifier === 'number' ? advantageRoll.modifier : 0,
      ),
    'fabricated_roll_fields_were_trusted',
  )) throw new Error('dice_fabrication_guard_failed');

  const [hostAdvantageMessage, playerAdvantageMessage] = await Promise.all([
    hostSocket.waitFor('advantage_dice_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', advantageEventId)),
    playerSocket.waitFor('advantage_dice_broadcast', (message) => socketStreamContains(message, 'runtimeLogAppended', advantageEventId)),
  ]);
  const hostAdvantagePayload = runtimeEventFromMessage(hostAdvantageMessage, advantageEventId)?.payload;
  const playerAdvantagePayload = runtimeEventFromMessage(playerAdvantageMessage, advantageEventId)?.payload;
  if (!addAssertion(
    'two_account_advantage_projection_converged',
    isRecord(hostAdvantagePayload)
      && isRecord(playerAdvantagePayload)
      && hostAdvantagePayload.mode === 'advantage'
      && playerAdvantagePayload.mode === 'advantage'
      && hostAdvantagePayload.keptRoll === advantageKept
      && playerAdvantagePayload.keptRoll === advantageKept
      && hostAdvantagePayload.total === advantageTotal
      && playerAdvantagePayload.total === advantageTotal
      && hostAdvantagePayload.outcome === advantageRoll.outcome
      && playerAdvantagePayload.outcome === advantageRoll.outcome,
    'advantage_projection_did_not_converge',
  )) throw new Error('advantage_dice_projection_failed');

  // A non-d20 pool must never be reinterpreted as a D&D check.
  await player.request('advantage_on_pool_rejected', pathFor('rooms', liveRoomId, 'runtime', 'dice-roll'), {
    method: 'POST',
    body: JSON.stringify({ memberId: playerMemberId, expression: '2d6+3', mode: 'advantage' }),
  }, [400]);
  await player.request('dc_on_pool_rejected', pathFor('rooms', liveRoomId, 'runtime', 'dice-roll'), {
    method: 'POST',
    body: JSON.stringify({ memberId: playerMemberId, expression: '2d6+3', dc: 12 }),
  }, [400]);
  await player.request('invalid_roll_mode_rejected', pathFor('rooms', liveRoomId, 'runtime', 'dice-roll'), {
    method: 'POST',
    body: JSON.stringify({ memberId: playerMemberId, expression: '1d20', mode: 'superAdvantage' }),
  }, [400]);

  const beforeDisconnectLog = await player.request('read_reconnect_runtime_cursor', `${pathFor('rooms', liveRoomId, 'runtime-log')}?memberId=${encodeURIComponent(playerMemberId)}`);
  const beforeDisconnectMap = await player.request('read_reconnect_map_cursor', `${pathFor('rooms', liveRoomId, 'map-events')}?memberId=${encodeURIComponent(playerMemberId)}&mapId=${encodeURIComponent(mapId)}`);
  const runtimeCursor = isRecord(beforeDisconnectLog.body) && typeof beforeDisconnectLog.body.latestSeq === 'number' ? beforeDisconnectLog.body.latestSeq : undefined;
  const mapCursor = isRecord(beforeDisconnectMap.body) && typeof beforeDisconnectMap.body.latestSeq === 'number' ? beforeDisconnectMap.body.latestSeq : undefined;
  if (!beforeDisconnectLog.ok || !beforeDisconnectMap.ok || runtimeCursor === undefined || mapCursor === undefined) {
    throw new Error('reconnect_cursor_read_failed');
  }
  await playerSocket.disconnect();

  const offlinePrivate = await host.request('append_offline_host_only_event', pathFor('rooms', liveRoomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      kind: 'host.note',
      visibility: 'hostOnly',
      text: `Offline private note ${suffix}`,
    }),
  });
  const offlinePrivateEvent = isRecord(offlinePrivate.body) && isRecord(offlinePrivate.body.event) ? offlinePrivate.body.event : undefined;
  const offlinePrivateId = typeof offlinePrivateEvent?.eventId === 'string' ? offlinePrivateEvent.eventId : undefined;
  if (!offlinePrivate.ok || !offlinePrivateId) throw new Error('offline_private_event_failed');

  const offlineTurn = await host.request('append_offline_combat_turn', pathFor('rooms', liveRoomId, 'runtime-log', 'events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      kind: 'combat.round_advanced',
      visibility: 'public',
      text: 'Next round while Player reconnects.',
      payload: { direction: 'next', roundNumber: 2, turnIndex: 0, activeCombatantId: npcCombatantId },
    }),
  });
  const offlineTurnEvent = isRecord(offlineTurn.body) && isRecord(offlineTurn.body.event) ? offlineTurn.body.event : undefined;
  const offlineTurnId = typeof offlineTurnEvent?.eventId === 'string' ? offlineTurnEvent.eventId : undefined;
  if (!offlineTurn.ok || !offlineTurnId) throw new Error('offline_combat_event_failed');

  const offlineMap = await host.request('append_offline_map_event', pathFor('rooms', liveRoomId, 'map-events'), {
    method: 'POST',
    body: JSON.stringify({
      authorMemberId: hostMemberId,
      mapId,
      eventKind: 'map.grid_updated',
      payload: { grid: { enabled: true, sizePx: 64, feetPerSquare: 5, originX: 0, originY: 0, snap: true, showCoordinates: true } },
    }),
  });
  const offlineMapEvent = isRecord(offlineMap.body) && isRecord(offlineMap.body.event) ? offlineMap.body.event : undefined;
  const offlineMapId = typeof offlineMapEvent?.mapEventId === 'string' ? offlineMapEvent.mapEventId : undefined;
  if (!offlineMap.ok || !offlineMapId) throw new Error('offline_map_event_failed');

  const afterDisconnectLog = await player.request('read_post_disconnect_runtime_cursor', `${pathFor('rooms', liveRoomId, 'runtime-log')}?memberId=${encodeURIComponent(playerMemberId)}`);
  const afterDisconnectMap = await player.request('read_post_disconnect_map_cursor', `${pathFor('rooms', liveRoomId, 'map-events')}?memberId=${encodeURIComponent(playerMemberId)}&mapId=${encodeURIComponent(mapId)}`);
  const expectedRuntimeLatest = isRecord(afterDisconnectLog.body) && typeof afterDisconnectLog.body.latestSeq === 'number' ? afterDisconnectLog.body.latestSeq : undefined;
  const expectedMapLatest = isRecord(afterDisconnectMap.body) && typeof afterDisconnectMap.body.latestSeq === 'number' ? afterDisconnectMap.body.latestSeq : undefined;
  if (expectedRuntimeLatest === undefined || expectedMapLatest === undefined) throw new Error('post_disconnect_cursor_read_failed');

  const reconnectedPlayerSocket = await player.openRoomSocket('player');
  reconnectedPlayerSocket.subscribe(liveRoomId, playerMemberId, { runtimeLog: runtimeCursor, mapEvent: mapCursor });
  const [runtimeCatchUp, mapCatchUp, reconnectAck] = await Promise.all([
    reconnectedPlayerSocket.waitFor('runtime_missing_suffix', (message) => socketStreamContains(message, 'runtimeLogAppended', offlineTurnId)),
    reconnectedPlayerSocket.waitFor('map_missing_suffix', (message) => socketStreamContains(message, 'mapEventAppended', offlineMapId)),
    reconnectedPlayerSocket.waitFor('reconnect_ack', (message) => message.type === 'subscribedRoom' && message.roomId === liveRoomId),
  ]);
  await reconnectedPlayerSocket.expectAbsent('offline_host_only_event', (message) => socketStreamContains(message, 'runtimeLogAppended', offlinePrivateId));
  if (!addAssertion(
    'player_socket_missing_suffix_recovered',
    socketStreamContains(runtimeCatchUp, 'runtimeLogAppended', offlineTurnId)
      && socketStreamContains(mapCatchUp, 'mapEventAppended', offlineMapId)
      && reconnectAck.runtimeLogLatestSeq === expectedRuntimeLatest
      && reconnectAck.mapEventLatestSeq === expectedMapLatest,
    'reconnect_missing_suffix_or_cursor_failed',
  )) throw new Error('reconnect_catch_up_failed');

  const finalRoom = await player.request('read_final_room_state', `${pathFor('rooms', liveRoomId)}?memberId=${encodeURIComponent(playerMemberId)}`);
  const finalRoomBody = isRecord(finalRoom.body) ? finalRoom.body : undefined;
  const lobby = isRecord(finalRoomBody?.lobby) ? finalRoomBody.lobby : undefined;
  const bindings = Array.isArray(lobby?.actorBindings) ? lobby.actorBindings : [];
  const readyStates = Array.isArray(lobby?.readyStates) ? lobby.readyStates : [];
  const bindingApproved = bindings.some((item) => isRecord(item) && item.memberId === playerMemberId && item.status === 'approved');
  const playerReady = readyStates.some((item) => isRecord(item) && item.memberId === playerMemberId && item.status === 'ready');
  if (!addAssertion('player_ready_state_visible', finalRoom.ok && bindingApproved && playerReady, 'approved_ready_state_missing')) {
    throw new Error('ready_state_failed');
  }
}

async function cleanup(host: SessionClient): Promise<void> {
  if (liveRoomId && hostMemberId) {
    await host.request('cleanup_disband_live_room', pathFor('rooms', liveRoomId, 'disband'), {
      method: 'POST',
      body: JSON.stringify({ decidedByMemberId: hostMemberId }),
    });
  }
  if (campaignRoot) await host.request('cleanup_archive_campaign', `${campaignRoot}/archive`, { method: 'POST' });
  if (worldRoot) await host.request('cleanup_archive_world_server', `${worldRoot}/archive`, { method: 'POST' });
}

try {
  await main();
} catch {
  steps.push({ name: 'protocol_flow_completed', status: 'failed', reason: 'protocol_step_failed' });
} finally {
  if (authenticatedHost) {
    try {
      await cleanup(authenticatedHost);
    } catch {
      steps.push({ name: 'fixture_cleanup', status: 'failed', reason: 'cleanup_request_failed' });
    }
  }
  for (const probe of openSocketProbes) probe.close();
}

const failed = steps.some((step) => step.status === 'failed');
report(failed ? 'failed' : 'passed');
if (strict && failed) process.exitCode = 1;
