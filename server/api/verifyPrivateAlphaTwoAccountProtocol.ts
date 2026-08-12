import { randomUUID } from 'node:crypto';

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
    },
    notes: [
      'Host and Player use separate in-memory cookie jars and distinct verified user ids.',
      'The smoke prints no response body, cookie, invite code, session token, database URL, or stack trace.',
      'Temporary campaign and World Server fixtures are archived; the live room is closed non-destructively.',
      'Browser rendering, WebSocket convergence, map interaction, and reconnect remain manual acceptance boundaries.',
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

  await player.request('ready_before_actor_approval_rejected', pathFor('rooms', liveRoomId, 'members', playerMemberId, 'ready'), {
    method: 'POST',
    body: JSON.stringify({ ready: true }),
  }, [400]);

  await host.request('approve_actor_binding', pathFor('rooms', liveRoomId, 'actor-bindings', bindingId, 'approve'), {
    method: 'POST',
    body: JSON.stringify({ reviewerMemberId: hostMemberId }),
  });
  await player.request('set_player_ready', pathFor('rooms', liveRoomId, 'members', playerMemberId, 'ready'), {
    method: 'POST',
    body: JSON.stringify({ ready: true }),
  });

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
}

const failed = steps.some((step) => step.status === 'failed');
report(failed ? 'failed' : 'passed');
if (strict && failed) process.exitCode = 1;
