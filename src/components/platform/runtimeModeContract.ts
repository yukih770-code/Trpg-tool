/**
 * Runtime mode contract (M69, types + copy only).
 *
 * AI-LANDMARK: RUNTIME_MODE_CONTRACT_V0
 *
 * Names the Runtime's operating modes so local vs multiplayer is an explicit
 * contract, not an implicit component-name difference. This file has NO behavior:
 * it only defines the mode enums, their labels, and the "promote local → room"
 * readiness checklist that the settings panel renders. No networking, no room
 * creation, no store, no server. It is intentionally additive — existing role
 * checks (`isHost`, `RuntimeShellMode`) are NOT replaced this round.
 */

export type RuntimeSessionMode =
  | 'localHost'
  | 'localPlayer'
  | 'solo'
  | 'multiplayerHost'
  | 'multiplayerPlayer'
  | 'spectator';

/** Where authoritative state lives. */
export type RuntimeAuthorityMode = 'local' | 'server';

/** Whether/how the runtime is synced to other clients. */
export type RuntimeSyncMode = 'offline' | 'lanRoom' | 'remoteRoom';

export interface RuntimeModeDescriptor {
  sessionMode: RuntimeSessionMode;
  authority: RuntimeAuthorityMode;
  sync: RuntimeSyncMode;
}

export const RUNTIME_SESSION_MODE_LABEL: Record<RuntimeSessionMode, string> = {
  localHost: '本地主持',
  localPlayer: '本地玩家',
  solo: '单人团（Solo）',
  multiplayerHost: '联机主持人',
  multiplayerPlayer: '联机玩家',
  spectator: '旁观者',
};

export const RUNTIME_AUTHORITY_LABEL: Record<RuntimeAuthorityMode, string> = {
  local: '本地浏览器',
  server: 'Room Server',
};

export const RUNTIME_SYNC_LABEL: Record<RuntimeSyncMode, string> = {
  offline: '未开启多人同步',
  lanRoom: '局域网房间',
  remoteRoom: '云端房间',
};

export function isLocalSessionMode(mode: RuntimeSessionMode): boolean {
  return mode === 'localHost' || mode === 'localPlayer' || mode === 'solo';
}

/**
 * Derive a mode descriptor from the lightweight signals the shells already have.
 * `hasServer` is false for the local shell today; it exists so the room bridge can
 * reuse this contract later without a rewrite.
 */
export function describeRuntimeMode(input: {
  isHost: boolean;
  hasActor: boolean;
  hasServer?: boolean;
  isSpectator?: boolean;
}): RuntimeModeDescriptor {
  if (input.isSpectator) {
    return { sessionMode: 'spectator', authority: input.hasServer ? 'server' : 'local', sync: input.hasServer ? 'lanRoom' : 'offline' };
  }
  if (input.hasServer) {
    return {
      sessionMode: input.isHost ? 'multiplayerHost' : 'multiplayerPlayer',
      authority: 'server',
      sync: 'lanRoom',
    };
  }
  // Local: a host who is also holding their own actor is "solo".
  const sessionMode: RuntimeSessionMode = input.isHost ? (input.hasActor ? 'solo' : 'localHost') : 'localPlayer';
  return { sessionMode, authority: 'local', sync: 'offline' };
}

// ── Promotion readiness checklist (M71) — UI/contract only, no real replay ────

export type PromotionCarryKind = 'carried' | 'reconfirm' | 'dropped';

export interface PromotionChecklistItem {
  kind: PromotionCarryKind;
  label: string;
}

export const PROMOTION_CARRY_LABEL: Record<PromotionCarryKind, string> = {
  carried: '可带入联机房间',
  reconfirm: '需要重新确认',
  dropped: '不会自动带入',
};

/** What a future "local → room" promotion would/would not carry. */
export const RUNTIME_PROMOTION_CHECKLIST: PromotionChecklistItem[] = [
  { kind: 'carried', label: '当前场景（标题 / 描述 / 场景图 URL）' },
  { kind: 'carried', label: '公开信息' },
  { kind: 'carried', label: '状态记录摘要' },
  { kind: 'carried', label: '角色绑定信息' },
  { kind: 'carried', label: '地图 / 场景图 URL' },
  { kind: 'carried', label: 'RuntimeLog 摘要或 replay 候选' },
  { kind: 'reconfirm', label: '本地骰子历史是否作为权威日志带入' },
  { kind: 'reconfirm', label: '未确认的状态变化' },
  { kind: 'reconfirm', label: '玩家角色准入' },
  { kind: 'reconfirm', label: '当前战役限制' },
  { kind: 'dropped', label: '本地临时 UI 状态' },
  { kind: 'dropped', label: '未保存草稿' },
  { kind: 'dropped', label: '未授权的角色库私有字段' },
];
