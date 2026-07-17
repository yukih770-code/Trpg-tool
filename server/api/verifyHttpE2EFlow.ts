import { randomUUID } from 'node:crypto';

type JsonRecord = Record<string, unknown>;
type StepStatus = 'passed' | 'failed' | 'skipped';

type Step = {
  name: string;
  status: StepStatus;
  httpStatus?: number;
  reason?: string;
};

const baseUrl = (process.env.E2E_API_BASE_URL?.trim() || process.env.API_BASE_URL?.trim() || 'http://localhost:8787').replace(/\/+$/, '');
const viewerUserId = process.env.E2E_DEV_VIEWER_USER_ID?.trim();
const privateAlphaAccessCode = process.env.E2E_PRIVATE_ALPHA_ACCESS_CODE?.trim();
const configuredPrivateAlphaDisplayName = process.env.E2E_PRIVATE_ALPHA_DISPLAY_NAME?.trim();
const strict = process.argv.includes('--strict');
const authOnly = process.argv.includes('--auth-only');
const steps: Step[] = [];
let sessionCookie: string | undefined;

function targetLabel(): 'local' | 'configured' {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(baseUrl) ? 'local' : 'configured';
}

function authMode(): 'local_dev_header' | 'private_alpha_session' | 'none' {
  return privateAlphaAccessCode ? 'private_alpha_session' : viewerUserId ? 'local_dev_header' : 'none';
}

function safeMessage(value: unknown): string {
  const message = typeof value === 'string' ? value : 'HTTP E2E request failed.';
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[redacted database url]')
    .replace(/DATABASE_URL/gi, '[redacted database setting]')
    .replace(/\b(?:stack|trace)\b[^\n]*/gi, 'internal error details redacted');
}

function pathFor(...parts: string[]): string {
  return `/${parts.map((part) => encodeURIComponent(part)).join('/')}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function valueOf(body: unknown): unknown {
  return isRecord(body) && body.ok === true ? body.value : undefined;
}

function errorOf(body: unknown): string | undefined {
  if (!isRecord(body) || body.ok !== false || !isRecord(body.error)) return undefined;
  return safeMessage(body.error.message);
}

type RequestOptions = {
  authenticated?: boolean;
  expectedStatus?: number;
};

async function request(
  name: string,
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<{ status: number; body?: unknown; ok: boolean; setCookie?: string }> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.authenticated !== false) {
    if (sessionCookie) headers.set('Cookie', sessionCookie);
    else if (viewerUserId) headers.set('x-dev-user-id', viewerUserId);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  } catch {
    steps.push({ name, status: 'failed', reason: 'server_unavailable' });
    return { status: 0, ok: false };
  }

  let body: unknown;
  try {
    const text = await response.text();
    body = text.trim() ? JSON.parse(text) : undefined;
  } catch {
    steps.push({ name, status: 'failed', httpStatus: response.status, reason: 'non_json_response' });
    return { status: response.status, ok: false };
  }

  const ok = options.expectedStatus !== undefined
    ? response.status === options.expectedStatus
    : response.ok && (isRecord(body) ? body.ok !== false : true);
  steps.push({
    name,
    status: ok ? 'passed' : 'failed',
    httpStatus: response.status,
    reason: ok ? undefined : errorOf(body) ?? `http_${response.status}`,
  });
  return { status: response.status, body, ok, setCookie: response.headers.get('set-cookie') ?? undefined };
}

function skip(name: string, reason: string): void {
  steps.push({ name, status: 'skipped', reason });
}

function objectValue(body: unknown): JsonRecord | undefined {
  const value = valueOf(body);
  return isRecord(value) ? value : undefined;
}

function failLatestStep(reason: string): void {
  const latest = steps[steps.length - 1];
  if (!latest) return;
  latest.status = 'failed';
  latest.reason = reason;
}

function cookiePair(value: string | undefined): string | undefined {
  const first = value?.split(';', 1)[0]?.trim();
  return first && first.includes('=') ? first : undefined;
}

function report(status: string, createdFixture?: Record<string, boolean>): void {
  const failed = steps.filter((step) => step.status === 'failed');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    strict,
    status: failed.length === 0 ? status : 'failed',
    target: targetLabel(),
    authMode: authMode(),
    createdFixture,
    steps,
    notes: [
      'Targets an already-running backend and uses unique temporary fixture names.',
      'Cleanup prefers archive endpoints; no permanent delete is attempted.',
      'No response body, secret, database URL, or stack trace is printed.',
    ],
  }, null, 2));
}

async function authenticatePrivateAlpha(suffix: string): Promise<boolean> {
  const unauthenticated = await request('auth_me_unauthenticated', '/api/auth/me', {}, { authenticated: false });
  const unauthenticatedValue = objectValue(unauthenticated.body);
  if (!unauthenticated.ok || unauthenticatedValue?.authenticated !== false) {
    failLatestStep('unauthenticated_me_expected');
    return false;
  }

  await request('private_alpha_invalid_invite_rejected', '/api/auth/private-alpha/login', {
    method: 'POST',
    body: JSON.stringify({ displayName: 'E2E Invalid', accessCode: `invalid-${suffix}` }),
  }, { authenticated: false, expectedStatus: 401 });

  const validLogin = await request('private_alpha_login', '/api/auth/private-alpha/login', {
    method: 'POST',
    body: JSON.stringify({
      displayName: configuredPrivateAlphaDisplayName || `E2E Private Alpha ${suffix}`,
      accessCode: privateAlphaAccessCode,
    }),
  }, { authenticated: false });
  sessionCookie = cookiePair(validLogin.setCookie);
  if (!validLogin.ok || !sessionCookie) {
    failLatestStep('private_alpha_session_cookie_missing');
    return false;
  }

  const authenticated = await request('auth_me_private_alpha', '/api/auth/me');
  const authenticatedValue = objectValue(authenticated.body);
  if (!authenticated.ok || authenticatedValue?.authenticated !== true || authenticatedValue?.authMode !== 'privateAlpha') {
    failLatestStep('private_alpha_me_expected');
    return false;
  }
  return true;
}

async function main(): Promise<void> {
  const suffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const worldPath = '/api/world-servers';

  const health = await request('health', '/health');
  if (!health.ok) {
    const status = steps.some((step) => step.reason === 'server_unavailable') ? 'server_unavailable' : 'blocked';
    report(status);
    if (strict) process.exitCode = 1;
    return;
  }

  if (privateAlphaAccessCode && !await authenticatePrivateAlpha(suffix)) {
    report('auth_blocked');
    if (strict) process.exitCode = 1;
    return;
  }
  if (authOnly) {
    if (!privateAlphaAccessCode) {
      steps.push({ name: 'private_alpha_access_code', status: 'failed', reason: 'missing_e2e_private_alpha_access_code' });
    }
    report(privateAlphaAccessCode ? 'passed' : 'auth_blocked');
    if (strict && !privateAlphaAccessCode) process.exitCode = 1;
    return;
  }

  const createdWorld = await request('create_world_server', worldPath, {
    method: 'POST',
    body: JSON.stringify({
      displayName: `E2E Verification World ${suffix}`,
      serverHandle: `e2e-local-${suffix}`,
      description: 'Temporary HTTP E2E verification fixture.',
      serverVisibility: 'private',
      joinPolicy: 'inviteOnly',
      defaultGameSystemId: 'dnd5e-2024',
    }),
  });
  const world = objectValue(createdWorld.body);
  const worldId = typeof world?.worldServerId === 'string' ? world.worldServerId : undefined;
  if (!createdWorld.ok || !worldId) {
    skip('world_server_list', 'create_world_server_failed');
    skip('world_server_detail', 'create_world_server_failed');
    skip('create_campaign', 'create_world_server_failed');
    // eslint-disable-next-line no-console
    report(privateAlphaAccessCode ? 'api_blocked' : viewerUserId ? 'api_blocked' : 'dev_auth_required');
    if (strict) process.exitCode = 1;
    return;
  }

  const worldRoot = pathFor('api', 'world-servers', worldId);
  const listWorld = await request('world_server_list', `${worldPath}?limit=20`);
  const listedWorlds = valueOf(listWorld.body);
  if (listWorld.ok && Array.isArray(listedWorlds) && !listedWorlds.some((item) => isRecord(item) && item.worldServerId === worldId)) {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].reason = 'created_world_missing_from_list';
  }
  await request('world_server_detail', worldRoot);

  const createdCampaign = await request('create_campaign', `${worldRoot}/campaigns`, {
    method: 'POST',
    body: JSON.stringify({ title: `E2E Campaign ${suffix}`, description: 'Temporary HTTP E2E fixture.', systemId: 'dnd5e-2024', status: 'draft' }),
  });
  const campaign = objectValue(createdCampaign.body);
  const campaignValue = campaign && isRecord(campaign.campaign) ? campaign.campaign : campaign;
  const campaignId = isRecord(campaignValue) && typeof campaignValue.campaignId === 'string' ? campaignValue.campaignId : undefined;
  if (!createdCampaign.ok || !campaignId) {
    skip('campaign_list', 'create_campaign_failed');
    skip('create_room', 'create_campaign_failed');
    skip('room_list', 'create_campaign_failed');
    skip('create_runtime_session', 'create_campaign_failed');
    skip('append_runtime_event', 'create_campaign_failed');
    skip('runtime_event_list', 'create_campaign_failed');
    skip('archive_campaign', 'create_campaign_failed');
    await request('archive_world_server', `${worldRoot}/archive`, { method: 'POST' });
    // eslint-disable-next-line no-console
    report('api_blocked');
    if (strict) process.exitCode = 1;
    return;
  }

  const campaignRoot = `${worldRoot}/campaigns/${encodeURIComponent(campaignId)}`;
  await request('campaign_list', `${worldPath}/${encodeURIComponent(worldId)}/campaigns?limit=20`);
  const roomId = `e2e-room-${suffix}`;
  const createdRoom = await request('create_room', `${campaignRoot}/rooms`, {
    method: 'POST',
    body: JSON.stringify({ roomId, roomCode: `E2E-${suffix.slice(-8).toUpperCase()}`, roomStatus: 'lobby', multiplayerMode: 'lan', metadata: { verification: true } }),
  });
  const room = objectValue(createdRoom.body);
  const actualRoomId = typeof room?.roomId === 'string' ? room.roomId : roomId;
  if (createdRoom.ok) await request('room_list', `${campaignRoot}/rooms?limit=20`);
  else skip('room_list', 'create_room_failed');

  const sessionId = `e2e-session-${suffix}`;
  const createdSession = await request('create_runtime_session', `${campaignRoot}/rooms/${encodeURIComponent(actualRoomId)}/runtime-session`, {
    method: 'POST',
    body: JSON.stringify({ runtimeSessionId: sessionId, title: 'E2E Verification Session', status: 'active', payload: { verification: true } }),
  });
  const session = objectValue(createdSession.body);
  const sessionValue = session && isRecord(session.session) ? session.session : session;
  const actualSessionId = isRecord(sessionValue) && typeof sessionValue.runtimeSessionId === 'string' ? sessionValue.runtimeSessionId : sessionId;
  if (!createdSession.ok) {
    skip('append_runtime_event', 'create_runtime_session_failed');
    skip('runtime_event_list', 'create_runtime_session_failed');
    skip('create_scene_state', 'create_runtime_session_failed');
    skip('scene_state_list', 'create_runtime_session_failed');
    skip('update_scene_state', 'create_runtime_session_failed');
    skip('duplicate_scene_state', 'create_runtime_session_failed');
    skip('archive_scene_state', 'create_runtime_session_failed');
  } else {
    const eventIdempotencyKey = `e2e-event-${suffix}`;
    const appended = await request('append_runtime_event', `${campaignRoot}/rooms/${encodeURIComponent(actualRoomId)}/runtime-events`, {
      method: 'POST',
      body: JSON.stringify({ runtimeSessionId: actualSessionId, eventKind: 'e2e.verification', visibility: 'private', idempotencyKey: eventIdempotencyKey, payload: { verification: true } }),
    });
    if (appended.ok) {
      const events = await request('runtime_event_list', `${campaignRoot}/rooms/${encodeURIComponent(actualRoomId)}/runtime-events?runtimeSessionId=${encodeURIComponent(actualSessionId)}&afterSeq=0&limit=50`);
      const eventValues = valueOf(events.body);
      if (events.ok && (!Array.isArray(eventValues) || !eventValues.some((item) => isRecord(item) && item.idempotencyKey === eventIdempotencyKey))) {
        steps[steps.length - 1].status = 'failed';
        steps[steps.length - 1].reason = 'appended_event_missing_from_list';
      }
    } else skip('runtime_event_list', 'append_runtime_event_failed');

    const sceneRoot = `${campaignRoot}/rooms/${encodeURIComponent(actualRoomId)}/scene-states`;
    const createdSceneState = await request('create_scene_state', sceneRoot, {
      method: 'POST',
      body: JSON.stringify({
        title: `E2E Scene ${suffix}`,
        description: 'Temporary HTTP E2E scene fixture.',
        runtimeSessionId: actualSessionId,
        stateJson: {
          schemaVersion: 1,
          appFeature: 'scene-runtime-snapshot',
          exportedAt: '2026-01-01T00:00:00.000Z',
          campaignId,
          roomId: actualRoomId,
          runtimeSessionId: actualSessionId,
          combat: { combatants: [], turn: { status: 'setup', roundNumber: 1, turnIndex: -1 } },
          map: { board: { mapId: 'e2e-scene-map', zoom: 1, panX: 0, panY: 0, tokens: [] } },
        },
      }),
    });
    const scene = objectValue(createdSceneState.body);
    const sceneStateId = typeof scene?.sceneStateId === 'string' ? scene.sceneStateId : undefined;
    if (!createdSceneState.ok || !sceneStateId) {
      skip('scene_state_list', 'create_scene_state_failed');
      skip('update_scene_state', 'create_scene_state_failed');
      skip('duplicate_scene_state', 'create_scene_state_failed');
      skip('archive_scene_state', 'create_scene_state_failed');
    } else {
      const listed = await request('scene_state_list', sceneRoot);
      const listedStates = valueOf(listed.body);
      if (listed.ok && (!Array.isArray(listedStates) || !listedStates.some((item) => isRecord(item) && item.sceneStateId === sceneStateId))) {
        steps[steps.length - 1].status = 'failed';
        steps[steps.length - 1].reason = 'created_scene_missing_from_list';
      }
      await request('update_scene_state', `${sceneRoot}/${encodeURIComponent(sceneStateId)}`, { method: 'PATCH', body: JSON.stringify({ title: `E2E Scene Updated ${suffix}` }) });
      await request('duplicate_scene_state', `${sceneRoot}/${encodeURIComponent(sceneStateId)}/duplicate`, { method: 'POST' });
      await request('archive_scene_state', `${sceneRoot}/${encodeURIComponent(sceneStateId)}/archive`, { method: 'POST' });
    }
  }

  await request('archive_campaign', `${campaignRoot}/archive`, { method: 'POST' });
  await request('archive_world_server', `${worldRoot}/archive`, { method: 'POST' });

  const failed = steps.filter((step) => step.status === 'failed');
  report('passed', { worldServer: true, campaign: true, room: createdRoom.ok, runtimeSession: createdSession.ok, runtimeEvent: steps.some((step) => step.name === 'append_runtime_event' && step.status === 'passed'), sceneState: steps.some((step) => step.name === 'create_scene_state' && step.status === 'passed') });
  if (strict && failed.length > 0) process.exitCode = 1;
}

try {
  await main();
} catch {
  // eslint-disable-next-line no-console
  report('failed');
  if (strict) process.exitCode = 1;
}
