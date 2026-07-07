import { randomUUID } from 'node:crypto';
import type { PoolClient, QueryResultRow } from 'pg';

import type { AuthIdentity } from '../../src/lib/platform/cloudBackendAdapters.js';
import {
  PostgresDatabaseError,
  queryPostgres,
  withPostgresClient,
} from '../db/postgresClient.js';

export type PostgresUserProfileVisibility = 'private' | 'campaignOnly' | 'unlisted' | 'public';

export type PostgresUserProfileSection =
  | 'overview'
  | 'characters'
  | 'campaigns'
  | 'documents'
  | 'fanWorks'
  | 'workshopPackages'
  | 'media'
  | 'collections';

export type PostgresProfileSectionVisibility = 'public' | 'unlisted' | 'private';

export interface PostgresProfileShowcaseSlot {
  entityId: string;
  entityType: string;
  label?: string;
}

export interface PostgresUserProfile {
  userId: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarMediaAssetId?: string;
  bannerMediaAssetId?: string;
  tags: string[];
  visibility: PostgresUserProfileVisibility;
  pinned: PostgresProfileShowcaseSlot[];
  sectionVisibility: Partial<Record<PostgresUserProfileSection, PostgresProfileSectionVisibility>>;
}

export interface PostgresUserRecord {
  identity: AuthIdentity;
  profile?: PostgresUserProfile;
  createdAt?: string;
  updatedAt?: string;
}

export type PostgresUserRepositoryErrorKind =
  | 'not_configured'
  | 'schema_missing'
  | 'conflict'
  | 'not_found'
  | 'database_error'
  | 'unknown';

export type PostgresUserRepositoryResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        kind: PostgresUserRepositoryErrorKind;
        message: string;
        retryable?: boolean;
      };
    };

export interface CreateUserWithIdentityInput {
  identity: AuthIdentity;
  providerSubject?: string;
  profile?: Partial<PostgresUserProfile>;
}

interface UserRecordRow extends QueryResultRow {
  user_id: string;
  user_display_name: string;
  user_created_at: Date | string;
  user_updated_at: Date | string;
  provider_kind: string | null;
  provider_subject: string | null;
  identity_display_name: string | null;
  email: string | null;
  profile_handle: string | null;
  profile_display_name: string | null;
  bio: string | null;
  avatar_media_asset_id: string | null;
  banner_media_asset_id: string | null;
  tags: unknown;
  visibility: string | null;
  pinned: unknown;
  section_visibility: unknown;
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function toShowcaseSlots(value: unknown): PostgresProfileShowcaseSlot[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PostgresProfileShowcaseSlot => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<PostgresProfileShowcaseSlot>;
    return typeof candidate.entityId === 'string' && typeof candidate.entityType === 'string';
  });
}

function toSectionVisibility(value: unknown): PostgresUserProfile['sectionVisibility'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as PostgresUserProfile['sectionVisibility'];
}

function toProviderKind(value: string | null | undefined): AuthIdentity['providerKind'] {
  if (value === 'localAnonymous' || value === 'custom' || value === 'external' || value === 'unknown') {
    return value;
  }
  return 'unknown';
}

function mapRepositoryError(error: unknown): PostgresUserRepositoryResult<never> {
  if (error instanceof PostgresDatabaseError && error.kind === 'not_configured') {
    return {
      ok: false,
      error: {
        kind: 'not_configured',
        message: 'DATABASE_URL is not configured.',
      },
    };
  }
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === '23505') {
    return { ok: false, error: { kind: 'conflict', message: 'User identity already exists.' } };
  }
  if (code === '42P01') {
    return {
      ok: false,
      error: {
        kind: 'schema_missing',
        message: 'Postgres user repository tables are missing.',
      },
    };
  }
  const retryable = code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND';
  return {
    ok: false,
    error: {
      kind: 'database_error',
      message: 'Postgres user repository query failed.',
      retryable,
    },
  };
}

function rowToProfile(row: UserRecordRow): PostgresUserProfile | undefined {
  if (!row.profile_handle || !row.profile_display_name) return undefined;
  return {
    userId: row.user_id,
    handle: row.profile_handle,
    displayName: row.profile_display_name,
    bio: row.bio ?? undefined,
    avatarMediaAssetId: row.avatar_media_asset_id ?? undefined,
    bannerMediaAssetId: row.banner_media_asset_id ?? undefined,
    tags: toStringArray(row.tags),
    visibility: (row.visibility ?? 'private') as PostgresUserProfileVisibility,
    pinned: toShowcaseSlots(row.pinned),
    sectionVisibility: toSectionVisibility(row.section_visibility),
  };
}

function rowToUserRecord(row: UserRecordRow): PostgresUserRecord {
  const providerKind = toProviderKind(row.provider_kind);
  const providerSubject = row.provider_subject ?? row.user_id;
  return {
    identity: {
      userId: row.user_id,
      providerKind,
      providerUserId: providerSubject,
      displayName: row.identity_display_name ?? row.user_display_name,
      email: row.email ?? undefined,
    },
    profile: rowToProfile(row),
    createdAt: toIso(row.user_created_at),
    updatedAt: toIso(row.user_updated_at),
  };
}

const USER_RECORD_SELECT = `
  SELECT
    u.user_id,
    u.display_name AS user_display_name,
    u.created_at AS user_created_at,
    u.updated_at AS user_updated_at,
    i.provider_kind,
    i.provider_subject,
    i.display_name AS identity_display_name,
    i.email,
    p.handle AS profile_handle,
    p.display_name AS profile_display_name,
    p.bio,
    p.avatar_media_asset_id,
    p.banner_media_asset_id,
    p.tags,
    p.visibility,
    p.pinned,
    p.section_visibility
  FROM users u
  LEFT JOIN LATERAL (
    SELECT *
    FROM user_identities ui
    WHERE ui.user_id = u.user_id
    ORDER BY ui.created_at ASC
    LIMIT 1
  ) i ON true
  LEFT JOIN user_profiles p ON p.user_id = u.user_id
`;

export async function getUserById(
  userId: string,
): Promise<PostgresUserRepositoryResult<PostgresUserRecord | null>> {
  try {
    const result = await queryPostgres<UserRecordRow>(
      `${USER_RECORD_SELECT} WHERE u.user_id = $1 LIMIT 1`,
      [userId],
    );
    return { ok: true, value: result.rows[0] ? rowToUserRecord(result.rows[0]) : null };
  } catch (error) {
    return mapRepositoryError(error);
  }
}

export async function getUserByIdentity(
  providerKind: string,
  providerSubject: string,
): Promise<PostgresUserRepositoryResult<PostgresUserRecord | null>> {
  try {
    const result = await queryPostgres<UserRecordRow>(
      `
        ${USER_RECORD_SELECT}
        WHERE i.provider_kind = $1 AND i.provider_subject = $2
        LIMIT 1
      `,
      [providerKind, providerSubject],
    );
    return { ok: true, value: result.rows[0] ? rowToUserRecord(result.rows[0]) : null };
  } catch (error) {
    return mapRepositoryError(error);
  }
}

function makeDefaultHandle(userId: string): string {
  return `local-${userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toLowerCase()}`;
}

async function insertUserProfile(
  client: PoolClient,
  profile: PostgresUserProfile,
  now: string,
): Promise<void> {
  await client.query(
    `
      INSERT INTO user_profiles (
        user_id,
        handle,
        display_name,
        bio,
        avatar_media_asset_id,
        banner_media_asset_id,
        tags,
        visibility,
        pinned,
        section_visibility,
        schema_version,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10::jsonb, 1, $11, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        handle = EXCLUDED.handle,
        display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        avatar_media_asset_id = EXCLUDED.avatar_media_asset_id,
        banner_media_asset_id = EXCLUDED.banner_media_asset_id,
        tags = EXCLUDED.tags,
        visibility = EXCLUDED.visibility,
        pinned = EXCLUDED.pinned,
        section_visibility = EXCLUDED.section_visibility,
        updated_at = EXCLUDED.updated_at
    `,
    [
      profile.userId,
      profile.handle,
      profile.displayName,
      profile.bio ?? null,
      profile.avatarMediaAssetId ?? null,
      profile.bannerMediaAssetId ?? null,
      JSON.stringify(profile.tags ?? []),
      profile.visibility,
      JSON.stringify(profile.pinned ?? []),
      JSON.stringify(profile.sectionVisibility ?? {}),
      now,
    ],
  );
}

export async function createUserWithIdentity(
  input: CreateUserWithIdentityInput,
): Promise<PostgresUserRepositoryResult<PostgresUserRecord>> {
  const now = new Date().toISOString();
  const userId = input.identity.userId || `user_${randomUUID()}`;
  const displayName = input.identity.displayName || input.profile?.displayName || 'Local User';
  const providerKind = input.identity.providerKind || 'localAnonymous';
  const providerSubject = input.providerSubject ?? input.identity.providerUserId ?? userId;
  const profile: PostgresUserProfile = {
    userId,
    handle: input.profile?.handle ?? makeDefaultHandle(userId),
    displayName: input.profile?.displayName ?? displayName,
    bio: input.profile?.bio,
    avatarMediaAssetId: input.profile?.avatarMediaAssetId,
    bannerMediaAssetId: input.profile?.bannerMediaAssetId,
    tags: input.profile?.tags ?? [],
    visibility: input.profile?.visibility ?? 'private',
    pinned: input.profile?.pinned ?? [],
    sectionVisibility: input.profile?.sectionVisibility ?? {},
  };
  try {
    await withPostgresClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query(
          `
            INSERT INTO users (user_id, display_name, status, schema_version, created_at, updated_at)
            VALUES ($1, $2, 'active', 1, $3, $3)
          `,
          [userId, displayName, now],
        );
        await client.query(
          `
            INSERT INTO user_identities (
              identity_id,
              user_id,
              provider_kind,
              provider_subject,
              display_name,
              email,
              claimed_at,
              schema_version,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $8)
          `,
          [
            `identity_${randomUUID()}`,
            userId,
            providerKind,
            providerSubject,
            input.identity.displayName ?? displayName,
            input.identity.email ?? null,
            now,
            now,
          ],
        );
        await insertUserProfile(client, profile, now);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
    return {
      ok: true,
      value: {
        identity: {
          ...input.identity,
          userId,
          providerKind,
          providerUserId: providerSubject,
          displayName,
        },
        profile,
        createdAt: now,
        updatedAt: now,
      },
    };
  } catch (error) {
    return mapRepositoryError(error);
  }
}

export async function saveUserProfile(
  profile: PostgresUserProfile,
): Promise<PostgresUserRepositoryResult<PostgresUserProfile>> {
  try {
    const now = new Date().toISOString();
    await withPostgresClient(async (client) => {
      await insertUserProfile(client, profile, now);
    });
    return { ok: true, value: profile };
  } catch (error) {
    return mapRepositoryError(error);
  }
}

export async function getUserProfile(
  userId: string,
): Promise<PostgresUserRepositoryResult<PostgresUserProfile | null>> {
  const userResult = await getUserById(userId);
  if (userResult.ok === false) return { ok: false, error: userResult.error };
  return { ok: true, value: userResult.value?.profile ?? null };
}

export async function checkPostgresUserRepositoryReadiness(): Promise<
  PostgresUserRepositoryResult<{
    usersTable: boolean;
    identitiesTable: boolean;
    profilesTable: boolean;
  }>
> {
  try {
    const result = await queryPostgres<{ table_name: string }>(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
      `,
      [['users', 'user_identities', 'user_profiles']],
    );
    const names = new Set(result.rows.map((row) => row.table_name));
    return {
      ok: true,
      value: {
        usersTable: names.has('users'),
        identitiesTable: names.has('user_identities'),
        profilesTable: names.has('user_profiles'),
      },
    };
  } catch (error) {
    return mapRepositoryError(error);
  }
}
