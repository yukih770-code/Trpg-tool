import type { Request } from 'express';

import { createPrivateAlphaAuthService, readPrivateAlphaAuthConfigFromEnv } from './privateAlphaAuth.js';
import type { WorldServerInviteRecord } from '../adapters/postgresWorldServerRepository.js';

type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function ok<T>(value: T) { return { ok: true as const, value }; }

async function run(): Promise<SmokeCase[]> {
  const cases: SmokeCase[] = [];
  const check = async (name: string, verify: () => Promise<void> | void) => {
    try { await verify(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  };

  const users = new Map<string, any>();
  const identities = new Map<string, any>();
  const sessions = new Map<string, any>();
  const invites = new Map<string, WorldServerInviteRecord>([
    ['friend-only-code', {
      inviteId: 'invite_friend', worldServerId: 'ws_friend', inviteCode: 'friend-only-code',
      createdByUserId: 'user_owner', defaultRoleKey: 'member', inviteStatus: 'active',
      maxUses: 1, useCount: 0, payload: {}, schemaVersion: 1,
    }],
  ]);
  const service = createPrivateAlphaAuthService(readPrivateAlphaAuthConfigFromEnv({
    PRIVATE_ALPHA_AUTH_ENABLED: 'true',
    PRIVATE_ALPHA_INVITE_CODE: 'alpha-only-code',
    PRIVATE_ALPHA_SESSION_SECRET: 'test-only-session-secret',
  }, 'cloudPrivateAlpha'), {
    userRepository: {
      async getUserById(userId: string) { return ok(users.get(userId) ?? null); },
      async getUserByIdentity(_kind: string, subject: string) { return ok(identities.get(subject) ?? null); },
      async createUserWithIdentity(input: any) {
        const user = { identity: input.identity, profile: { userId: input.identity.userId, displayName: input.profile.displayName } };
        users.set(input.identity.userId, user);
        identities.set(input.providerSubject, user);
        return ok(user);
      },
    } as never,
    sessionRepository: {
      async createAuthSession(input: any) {
        const session = { ...input, sessionStatus: input.sessionStatus ?? 'active', metadata: input.metadata ?? {} };
        sessions.set(input.sessionId, session);
        return ok(session);
      },
      async getAuthSessionById(sessionId: string) { return ok(sessions.get(sessionId) ?? null); },
      async updateAuthSessionStatus(sessionId: string, status: string, revokedAt?: string) {
        const session = sessions.get(sessionId);
        if (!session) return ok(null);
        const next = { ...session, sessionStatus: status, revokedAt };
        sessions.set(sessionId, next);
        return ok(next);
      },
    } as never,
    worldInviteRepository: {
      async getWorldServerInviteByCode(code: string) { return ok(invites.get(code) ?? null); },
      async redeemWorldServerInvite(input: { inviteCode: string; userId: string; membershipId: string }) {
        const invite = invites.get(input.inviteCode);
        if (!invite || (invite.targetUserId && invite.targetUserId !== input.userId) || (invite.inviteStatus !== 'active' && invite.inviteStatus !== 'used')) return ok(null);
        if (!invite.targetUserId) {
          invite.targetUserId = input.userId;
          invite.useCount += 1;
          invite.inviteStatus = 'used';
        }
        return ok({ inviteId: invite.inviteId, worldServerId: invite.worldServerId, membershipId: input.membershipId, membershipStatus: 'active', roleKey: invite.defaultRoleKey });
      },
    } as never,
  });

  let sessionToken = '';
  await check('rejects_invalid_invite_code', async () => {
    const result = await service.login({ displayName: 'Alpha User', accessCode: 'wrong' });
    assert(result.ok === false && result.kind === 'invalid_credentials', 'invalid invite code was accepted');
  });
  await check('creates_private_alpha_user_and_session', async () => {
    const result = await service.login({ displayName: 'Alpha User', accessCode: 'alpha-only-code' });
    assert(result.ok === true && result.user.userId.startsWith('user_'), 'login did not create a safe user');
    if (result.ok) sessionToken = result.sessionToken;
  });
  await check('personal_server_invite_creates_a_member_session', async () => {
    const result = await service.login({ displayName: 'Friend One', accessCode: 'friend-only-code' });
    assert(result.ok === true && invites.get('friend-only-code')?.targetUserId === result.user.userId, 'personal invite was not bound to its first user');
  });
  await check('personal_server_invite_cannot_be_claimed_by_a_second_name', async () => {
    const result = await service.login({ displayName: 'Friend Two', accessCode: 'friend-only-code' });
    assert(result.ok === false && result.kind === 'invalid_credentials', 'personal invite was reused by another user');
  });
  await check('resolves_signed_cookie_to_verified_viewer', async () => {
    const viewer = await service.resolveRequestViewer({ headers: { cookie: `trpg_private_alpha_session=${encodeURIComponent(sessionToken)}` } } as Request);
    assert(viewer?.viewer.authTrustLevel === 'verified_session' && viewer.viewer.viewerUserId, 'signed cookie did not resolve');
  });
  await check('logout_revokes_session', async () => {
    const viewer = await service.resolveRequestViewer({ headers: { cookie: `trpg_private_alpha_session=${encodeURIComponent(sessionToken)}` } } as Request);
    await service.logout(viewer?.sessionId);
    const afterLogout = await service.resolveRequestViewer({ headers: { cookie: `trpg_private_alpha_session=${encodeURIComponent(sessionToken)}` } } as Request);
    assert(afterLogout === null, 'revoked session remained valid');
  });
  return cases;
}

void run().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
