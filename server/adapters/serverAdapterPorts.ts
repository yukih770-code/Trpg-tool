/**
 * Server adapter port skeletons (v0, interfaces only).
 *
 * AI-LANDMARK: SERVER_ADAPTER_PORTS_V0
 *
 * These ports reserve future backend adapter seams. They do not implement
 * Supabase, Neon, Postgres, S3/R2, Redis, NATS, Auth providers, migrations, or
 * runtime persistence.
 */

export interface ServerAuthIdentity {
  userId: string;
  displayName?: string;
  email?: string;
}

export interface ServerAuthPort {
  resolveIdentity(input: { accessToken?: string }): Promise<ServerAuthIdentity | null>;
}

export interface PersistencePort {
  readonly database: 'postgres';
}

export interface ObjectStoragePort {
  readonly storage: 's3-compatible';
}

export interface PubSubPort {
  readonly transport: 'redis' | 'nats' | 'in-memory';
}

export type AuthoritativeRuntimeWrite =
  | 'room.member.approve'
  | 'room.member.reject'
  | 'room.actorBinding.approve'
  | 'room.actorBinding.reject'
  | 'room.ready.update'
  | 'runtime.event.append';

export interface AuthoritativeRuntimeWritePort {
  readonly authority: 'room-server';
  canWrite(kind: AuthoritativeRuntimeWrite): boolean;
}
