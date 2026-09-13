/** T12's data boundary. The kernel validates mutations, never system rules. */
export type RuntimeMutation = {
  type: 'combatantHp';
  combatantId: string;
  beforeHp: number;
  afterHp: number;
  beforeTemporaryHp: number;
  afterTemporaryHp: number;
} | {
  type: 'combatantConditions';
  combatantId: string;
  beforeConditions: import('../combat/combatRuntimeTypes.js').CombatantConditionState[];
  afterConditions: import('../combat/combatRuntimeTypes.js').CombatantConditionState[];
} | {
  type: 'systemResource';
  actorInstanceId: string;
  resourceId: string;
  before: number;
  after: number;
  max: number;
  /** System-owned display metadata, interpreted only by the system projector. */
  metadata: Record<string, unknown>;
};

export interface SystemResolutionProposal<M extends RuntimeMutation = Extract<RuntimeMutation, { type: 'combatantHp' }>> {
  systemId: string;
  resolutionId: string;
  publicSummaryText: string;
  publicFacts: Record<string, unknown>;
  privilegedFacts: Record<string, unknown>;
  mutations: M[];
}
