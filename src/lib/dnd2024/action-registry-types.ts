export type DndActionType =
  | 'Action'
  | 'Bonus Action'
  | 'Reaction'
  | 'No Action'
  | 'Passive'
  | 'Special';

export type DndResourceCostType = 'classResource' | 'pactMagic';

export interface ResourceCost {
  resourceType: DndResourceCostType;
  resourceId?: string;
  amount: number;
  notes?: string;
}

export interface DndActionDefinition {
  id: string;
  name: string;
  sourceFeature?: string;
  actionType?: DndActionType;
  description?: string;
  resourceCost?: ResourceCost[];
  tags?: string[];
  notes?: string;
}
