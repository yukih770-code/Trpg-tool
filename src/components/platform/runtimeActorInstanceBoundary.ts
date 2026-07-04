/**
 * Runtime actor instance boundary contract (M51, types + copy only).
 *
 * AI-LANDMARK: RUNTIME_ACTOR_INSTANCE_BOUNDARY_V0
 *
 * A MINIMAL boundary contract — NOT storage — that names the four layers an actor
 * passes through so the UI never pretends to persist more than it does. There is
 * no CampaignActorInstance storage, migration, write-back, or sync here: this file
 * only defines the tiers and the guardrail copy that panels render. The single
 * source of truth for the boundary wording (RuntimeActorBoundaryNote consumes it).
 */

export type RuntimeActorBoundaryTierId =
  | 'vaultCharacter'
  | 'roomActorBinding'
  | 'runtimeActorSnapshot'
  | 'campaignActorInstance';

export interface RuntimeActorBoundaryTier {
  id: RuntimeActorBoundaryTierId;
  label: string;
  description: string;
  /** 'available' = exists today; 'future' = named boundary, not implemented. */
  status: 'available' | 'future';
}

export const RUNTIME_ACTOR_BOUNDARY_TIERS: RuntimeActorBoundaryTier[] = [
  {
    id: 'vaultCharacter',
    label: '角色库角色',
    description: '玩家长期保存和编辑的角色原件，在角色库中维护。',
    status: 'available',
  },
  {
    id: 'roomActorBinding',
    label: '房间角色绑定',
    description: '本次进入房间时的角色绑定 / 准入记录。',
    status: 'available',
  },
  {
    id: 'runtimeActorSnapshot',
    label: 'Runtime 角色快照',
    description: '当前 Runtime 用于展示的只读角色摘要。',
    status: 'available',
  },
  {
    id: 'campaignActorInstance',
    label: '战役内角色实例',
    description: '未来战役内的权威角色实例，承载 HP、资源、装备变化、成长、战役经历与结算（后续版本接入）。',
    status: 'future',
  },
];

/** One-line caveat: the manual state log is a record, not a write-back. */
export const RUNTIME_STATE_LOG_CAVEAT =
  '本场的手动状态记录会进入日志与回顾，不会自动改写角色库原件。';

/** How the future Campaign Actor Instance is expected to be written to. */
export const RUNTIME_ACTOR_INSTANCE_FUTURE_NOTE =
  '未来写入战役内角色实例必须经过规则校验和主持人 / 玩家确认；Session Recap 可生成角色编年史（Chronicle）草稿，但不会自动覆盖原角色。';
