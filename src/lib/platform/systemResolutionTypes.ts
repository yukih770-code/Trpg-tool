/** T12's data boundary. The kernel validates mutations, never system rules. */
export type RuntimeMutation = {
  type: 'combatantHp';
  combatantId: string;
  beforeHp: number;
  afterHp: number;
  beforeTemporaryHp: number;
  afterTemporaryHp: number;
};

export interface SystemResolutionProposal {
  systemId: string;
  resolutionId: string;
  publicSummaryText: string;
  publicFacts: Record<string, unknown>;
  privilegedFacts: Record<string, unknown>;
  mutations: RuntimeMutation[];
}
