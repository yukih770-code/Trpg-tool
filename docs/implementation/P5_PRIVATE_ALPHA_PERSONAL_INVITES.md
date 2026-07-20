# Private Alpha Personal Invites

## Purpose

Private-alpha access is now split into two intentionally different paths:

1. The server-only bootstrap code can still get the initial host into an empty
   deployment.
2. A server owner or administrator creates a personal invite from **Settings →
   Invitations and join requests** for each friend.

The browser submits the friend's display name and personal invite code only to
the server. On first successful use, the code is bound to that user and an
active membership for the target World Server is created. The code is never
stored in browser storage or returned by the sign-in endpoint.

## Boundaries

- A personal invite is server-scoped, one-person by default, and may be revoked.
- Revoking blocks future sign-ins with that code. It does not remove an existing
  member or revoke an already-issued browser session.
- The owner/admin list endpoint is deliberately protected by `inviteMember`;
  ordinary server members cannot read raw invite codes.
- This is not a password/account-recovery system, email invitation service, or
  platform-wide RBAC solution.
- Room, Runtime, token, combat, and character authority remain unchanged.

## Operations

1. Sign in as the host with the bootstrap code only when necessary.
2. Open the target server, then **Settings → Invitations and join requests**.
3. Create one code per friend and send it privately.
4. The friend signs in with their own display name and that code.
5. Revoke a code when it should no longer permit future sign-in.

Existing deployments need no schema migration for this slice: it reuses the
persisted `world_server_invites` and `world_server_memberships` tables already
installed by migration `0007_world_servers_membership.sql`.
