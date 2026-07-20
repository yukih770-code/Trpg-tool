import type { ActorVaultApiClient, ActorVaultRecord as CloudActorVaultRecord } from '../api/actorApiClient';
import type { ActorVaultRecord } from './actorVaultRepositoryBridge';
import { getActorVaultLocalSnapshot } from './actorVaultRepositoryBridge';

export type ActorVaultCloudSyncResult =
  | { ok: true; actor: CloudActorVaultRecord; action: 'created' | 'updated' | 'unchanged' }
  | { ok: false; message: string };

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Creates or updates the current user's cloud Vault record immediately before
 * a local character is submitted to a room. Room state receives only the
 * returned cloud actor id, never a browser-store id or complete payload.
 */
export async function ensureLocalActorInCloud(input: {
  actor: ActorVaultRecord;
  client: ActorVaultApiClient;
  snapshot?: Record<string, unknown>;
}): Promise<ActorVaultCloudSyncResult> {
  const snapshot = input.snapshot ?? getActorVaultLocalSnapshot(input.actor.systemId, input.actor.id);
  if (!snapshot) {
    return { ok: false, message: '无法读取所选角色的本地数据，请重新选择角色后再提交。' };
  }

  try {
    const actors = await input.client.listActors({ systemId: input.actor.systemId, limit: 200 });
    const existing = actors.find((actor) => actor.localActorId === input.actor.id);
    if (!existing) {
      const actor = await input.client.createActor({
        systemId: input.actor.systemId,
        localActorId: input.actor.id,
        displayName: input.actor.displayName,
        payload: snapshot,
      });
      return { ok: true, actor, action: 'created' };
    }

    if (existing.displayName === input.actor.displayName && stableJson(existing.payload) === stableJson(snapshot)) {
      return { ok: true, actor: existing, action: 'unchanged' };
    }

    const actor = await input.client.updateActor(existing.actorId, {
      displayName: input.actor.displayName,
      payload: snapshot,
    });
    return { ok: true, actor, action: 'updated' };
  } catch {
    return { ok: false, message: '无法同步角色库。请确认已登录并且服务器连接正常后重试。' };
  }
}
